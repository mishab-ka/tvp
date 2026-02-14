import { supabase } from "./supabase";
import { getSettingValue } from "./adminSettingsAPI";

const PERF_TABLE = "tvp_vehicle_performance";

/**
 * Lookup amount from fleet rent slabs by trip count
 */
const lookupFleetSlab = (slabs, tripCount) => {
  if (!Array.isArray(slabs) || tripCount == null) return 0;
  const slab = slabs.find(
    (s) =>
      tripCount >= (s.min_trips ?? 0) &&
      (s.max_trips == null || tripCount <= s.max_trips)
  );
  return slab?.amount ?? 0;
};

/**
 * Get Vehicle Performance Sheet data for a week
 * Returns one row per vehicle per week, with data from bills + tvp_vehicle_performance
 */
export const getVehiclePerformanceSheet = async (weekStart, weekEnd) => {
  try {
    if (!weekStart || !weekEnd) {
      return { rows: [], fleetRentSlabs: [] };
    }

    // Fetch fleet rent slabs for rental income and fleet rent calculations
    const fleetRentSlabs =
      (await getSettingValue("fleet_expense", "rent_slabs", [])) || [];
    if (!Array.isArray(fleetRentSlabs)) {
      throw new Error("Fleet rent slabs must be an array");
    }

    // Fetch bills for the week (overlap)
    const { data: bills, error: billsError } = await supabase
      .from("tvp_driver_bills")
      .select(
        "id, vehicle_number, vehicles_breakdown, trips, rental_days, double_driver_charge, weekly_insurance, tds, accident, dead_km, week_start, week_end"
      )
      .not("week_start", "is", null)
      .not("week_end", "is", null)
      .lte("week_start", weekEnd)
      .gte("week_end", weekStart)
      .in("status", ["generated", "paid"]);

    if (billsError) throw billsError;

    // Fetch performance overrides for the week
    const { data: perfRows, error: perfError } = await supabase
      .from(PERF_TABLE)
      .select("vehicle_number, week_start, vehicle_level_adjustment, fleet_trips")
      .eq("week_start", weekStart);

    if (perfError) {
      // Table might not exist yet
      console.warn("Vehicle performance table error:", perfError);
    }

    const perfMap = {};
    (perfRows || []).forEach((p) => {
      const key = `${(p.vehicle_number || "").trim()}`;
      perfMap[key] = {
        vehicleLevelAdjustment: Number(p.vehicle_level_adjustment) || 0,
        fleetTrips: p.fleet_trips != null ? Number(p.fleet_trips) : null,
      };
    });

    // Expand bills to one row per vehicle
    const rows = [];
    let rowIndex = 0;

    (bills || []).forEach((bill) => {
      const breakdown = bill.vehicles_breakdown;
      const hasBreakdown =
        Array.isArray(breakdown) && breakdown.length > 0;

      if (hasBreakdown) {
        breakdown.forEach((v, idx) => {
          const vehicleNumber =
            (v.vehicleNumber || v.vehicle_number || "").trim() || bill.vehicle_number || "";
          const trips = Number(v.trips ?? 0) || 0;
          const rentalDays = Number(v.rentalDays ?? v.rental_days ?? 0) || 0;
          const isFirst = idx === 0;

          const perf = perfMap[vehicleNumber] || {
            vehicleLevelAdjustment: 0,
            fleetTrips: null,
          };

          const rentalIncome = lookupFleetSlab(fleetRentSlabs, trips);
          const fleetRent = lookupFleetSlab(
            fleetRentSlabs,
            perf.fleetTrips != null ? perf.fleetTrips : 0
          );

          const doubleDriver = isFirst
            ? Number(bill.double_driver_charge) || 0
            : 0;
          const insurance = isFirst
            ? Number(bill.weekly_insurance) || 0
            : 0;
          const tds = isFirst ? Number(bill.tds) || 0 : 0;
          const deadKm = isFirst ? Number(bill.dead_km) || 0 : 0;
          const accident = isFirst ? Number(bill.accident) || 0 : 0;

          const totalIncome =
            rentalIncome +
            doubleDriver +
            insurance +
            tds +
            deadKm +
            accident +
            (perf.vehicleLevelAdjustment || 0);
          const grossProfit = totalIncome - fleetRent;

          rowIndex += 1;
          rows.push({
            id: rowIndex,
            vehicleNumber,
            trips,
            rentalIncome,
            doubleDriverCharge: doubleDriver,
            insuranceIncome: insurance,
            tdsIncome: tds,
            deadKmIncome: deadKm,
            accidentPenaltyIncome: accident,
            vehicleLevelAdjustment: perf.vehicleLevelAdjustment,
            fleetTrips: perf.fleetTrips,
            workingDays: rentalDays,
            fleetRent,
            grossProfit,
            billId: bill.id,
          });
        });
      } else {
        const vehicleNumber = (bill.vehicle_number || "").trim();
        const trips = Number(bill.trips) || 0;
        const rentalDays = Number(bill.rental_days) || 0;

        const perf = perfMap[vehicleNumber] || {
          vehicleLevelAdjustment: 0,
          fleetTrips: null,
        };

        const rentalIncome = lookupFleetSlab(fleetRentSlabs, trips);
        const fleetRent = lookupFleetSlab(
          fleetRentSlabs,
          perf.fleetTrips != null ? perf.fleetTrips : 0
        );

        const doubleDriver = Number(bill.double_driver_charge) || 0;
        const insurance = Number(bill.weekly_insurance) || 0;
        const tds = Number(bill.tds) || 0;
        const deadKm = Number(bill.dead_km) || 0;
        const accident = Number(bill.accident) || 0;

        const totalIncome =
          rentalIncome +
          doubleDriver +
          insurance +
          tds +
          deadKm +
          accident +
          (perf.vehicleLevelAdjustment || 0);
        const grossProfit = totalIncome - fleetRent;

        rowIndex += 1;
        rows.push({
          id: rowIndex,
          vehicleNumber,
          trips,
          rentalIncome,
          doubleDriverCharge: doubleDriver,
          insuranceIncome: insurance,
          tdsIncome: tds,
          deadKmIncome: deadKm,
          accidentPenaltyIncome: accident,
          vehicleLevelAdjustment: perf.vehicleLevelAdjustment,
          fleetTrips: perf.fleetTrips,
          workingDays: rentalDays,
          fleetRent,
          grossProfit,
          billId: bill.id,
        });
      }
    });

    return { rows, fleetRentSlabs };
  } catch (error) {
    console.error("Error getting vehicle performance sheet:", error);
    throw error;
  }
};

/**
 * Upsert vehicle performance editable fields (vehicle_level_adjustment, fleet_trips)
 */
export const upsertVehiclePerformance = async (
  vehicleNumber,
  weekStart,
  weekEnd,
  { vehicleLevelAdjustment, fleetTrips }
) => {
  try {
    if (!vehicleNumber || !weekStart) {
      throw new Error("vehicleNumber and weekStart are required");
    }

    const payload = {
      vehicle_number: String(vehicleNumber).trim(),
      week_start: weekStart,
      week_end: weekEnd,
      vehicle_level_adjustment: Number(vehicleLevelAdjustment) || 0,
      fleet_trips:
        fleetTrips != null && fleetTrips !== ""
          ? Number(fleetTrips)
          : null,
    };

    const { data, error } = await supabase
      .from(PERF_TABLE)
      .upsert(payload, {
        onConflict: "vehicle_number,week_start",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error upserting vehicle performance:", error);
    throw error;
  }
};
