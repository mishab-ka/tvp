import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Icon from "../../../components/AppIcon";
import { useAdminSettings } from "../../../hooks/useAdminSettings";
import WeekSelector, { calculatePreviousWeek } from "../../hissab-accounting-generator/components/WeekSelector";
import { getActiveVehicles } from "../../../lib/tvpManagementAPI";

const BillFormModal = ({
  isOpen,
  driver,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const [vehicles, setVehicles] = useState([
    {
      id: 1,
      vehicleNumber: "",
      rentalDays: "",
      trips: "",
      dailyRent: "",
    }
  ]);
  const [formData, setFormData] = useState({
    weeklyInsurance: "210",
    doubleDriverCharge: "",
    totalEarnings: "",
    totalCashCollect: "",
    platformFee: "",
    toll: "",
    tds: "",
    vehicleAdjustment: "0",
    rtoFine: "",
    accident: "",
    deadKm: "",
    roomRent: "",
  });
  const [errors, setErrors] = useState({});
  const [weekRange, setWeekRange] = useState(calculatePreviousWeek());
  const [allActiveVehicles, setAllActiveVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const { calculateFleetRent, fleetRentSlabs, loading: settingsLoading, loadSettings } = useAdminSettings();

  // Reload settings when modal opens to ensure we have the latest data
  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadAllActiveVehicles();
    }
  }, [isOpen, loadSettings]);

  // Load all active vehicles from database
  const loadAllActiveVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const vehicles = await getActiveVehicles();
      const vehicleOptions = vehicles.map((v) => ({
        value: v.car_number,
        label: `${v.car_number}${v.fleet_name ? ` - ${v.fleet_name}` : ""}`,
      }));
      setAllActiveVehicles(vehicleOptions);
    } catch (err) {
      console.error("Error loading active vehicles:", err);
      setAllActiveVehicles([]);
    } finally {
      setLoadingVehicles(false);
    }
  };

  // Helper function to check if driver is double driver category
  const isDoubleDriverCategory = useMemo(() => {
    if (!driver) return false;
    const category = driver.category || driver.driverType || driver.driver_type || "";
    const categoryLower = category?.toLowerCase() || "";
    return (
      categoryLower === "double driver" ||
      categoryLower === "doubledriver" ||
      categoryLower === "double_driver"
    );
  }, [driver]);

  // Auto-calculate double driver charge: ₹350 divided by number of vehicles
  useEffect(() => {
    if (isDoubleDriverCategory && driver?.vehicleNumbers && driver.vehicleNumbers.length > 0) {
      const vehicleCount = driver.vehicleNumbers.length;
      const doubleDriverCharge = 350 / vehicleCount; // ₹350 divided by vehicle count
      setFormData((prev) => ({
        ...prev,
        doubleDriverCharge: doubleDriverCharge.toFixed(2),
      }));
    } else if (!isDoubleDriverCategory) {
      // Clear double driver charge if not double driver
      setFormData((prev) => ({
        ...prev,
        doubleDriverCharge: "",
      }));
    }
  }, [isDoubleDriverCategory, driver?.vehicleNumbers]);

  // Auto-calculate daily rent for each vehicle based on trips
  useEffect(() => {
    if (!settingsLoading && fleetRentSlabs.length > 0) {
      setVehicles((prevVehicles) =>
        prevVehicles.map((vehicle) => {
          if (vehicle.trips !== "" && Number(vehicle.trips) >= 0) {
            const tripCount = Number(vehicle.trips);
            const dailyRent = calculateFleetRent(tripCount);
            return { ...vehicle, dailyRent: dailyRent.toString() };
          }
          return vehicle;
        })
      );
    }
  }, [vehicles.map(v => v.trips).join(','), calculateFleetRent, fleetRentSlabs, settingsLoading]);

  // Auto-calculate TDS as 1% of Total Earnings
  useEffect(() => {
    if (formData.totalEarnings !== "" && Number(formData.totalEarnings) > 0) {
      const totalEarnings = Number(formData.totalEarnings);
      const tds = totalEarnings * 0.01; // 1% of Total Earnings
      setFormData((prev) => ({ ...prev, tds: tds.toFixed(2) }));
    } else if (formData.totalEarnings === "" || Number(formData.totalEarnings) === 0) {
      setFormData((prev) => ({ ...prev, tds: "" }));
    }
  }, [formData.totalEarnings]);

  // Calculate net weekly rent: sum of (daily rent * rental days) for all vehicles + weekly insurance + double driver charge
  const netWeeklyRent = useMemo(() => {
    const totalVehicleRent = vehicles.reduce((sum, vehicle) => {
      const daily = parseFloat(vehicle.dailyRent) || 0;
      const days = parseFloat(vehicle.rentalDays) || 0;
      return sum + (daily * days);
    }, 0);
    const weeklyInsurance = parseFloat(formData.weeklyInsurance) || 210;
    const doubleDriverCharge = parseFloat(formData.doubleDriverCharge) || 0;
    return totalVehicleRent + weeklyInsurance + doubleDriverCharge;
  }, [
    vehicles,
    formData.weeklyInsurance,
    formData.doubleDriverCharge,
  ]);

  // Calculate difference: Total Cash Collect - Total Earnings
  // If Cash Collect > Earnings, difference is positive (adds to net rent)
  // If Earnings > Cash Collect, difference is negative (subtracts from net rent)
  const difference = useMemo(() => {
    const earnings = parseFloat(formData.totalEarnings) || 0;
    const cashCollect = parseFloat(formData.totalCashCollect) || 0;
    return cashCollect - earnings;
  }, [formData.totalEarnings, formData.totalCashCollect]);

  // Calculate Current OS (Final OS): Net Rent + Room Rent - Toll + Driver Pass + TDS - Vehicle Adjustment + RTO + Accident + Dead KM + Difference
  const currentOS = useMemo(() => {
    const netRent = netWeeklyRent;
    const roomRent = parseFloat(formData.roomRent) || 0;
    const tollAmount = parseFloat(formData.toll) || 0;
    const vehicleAdjustment = parseFloat(formData.vehicleAdjustment) || 0;
    const platformFee = parseFloat(formData.platformFee) || 0;
    const tds = parseFloat(formData.tds) || 0;
    const rtoFine = parseFloat(formData.rtoFine) || 0;
    const accident = parseFloat(formData.accident) || 0;
    const deadKm = parseFloat(formData.deadKm) || 0;
    const diff = difference;

    // Formula: Net Rent + Room Rent - Toll + Driver Pass + TDS - Vehicle Adj + RTO + Accident + Dead KM + Difference
    return (
      netRent +
      roomRent -
      tollAmount +
      platformFee +
      tds -
      vehicleAdjustment +
      rtoFine +
      accident +
      deadKm +
      diff
    );
  }, [
    netWeeklyRent,
    formData.roomRent,
    formData.toll,
    formData.vehicleAdjustment,
    formData.platformFee,
    formData.tds,
    formData.rtoFine,
    formData.accident,
    formData.deadKm,
    difference,
  ]);

  // Get available vehicles (not already selected in other vehicle entries)
  const getAvailableVehicles = (currentVehicleId) => {
    const selectedVehicles = vehicles
      .filter(v => v.id !== currentVehicleId && v.vehicleNumber)
      .map(v => v.vehicleNumber);
    
    // If no active vehicles loaded yet, fall back to driver's vehicles
    if (allActiveVehicles.length === 0 && driver?.vehicleNumbers) {
      const driverVehicleOptions = driver.vehicleNumbers.map((plate) => ({
        value: plate,
        label: plate,
      }));
      return driverVehicleOptions.filter(opt => !selectedVehicles.includes(opt.value));
    }
    
    return allActiveVehicles.filter(opt => !selectedVehicles.includes(opt.value));
  };

  const addVehicle = () => {
    const newId = Math.max(...vehicles.map(v => v.id), 0) + 1;
    setVehicles([
      ...vehicles,
      {
        id: newId,
        vehicleNumber: "",
        rentalDays: "",
        trips: "",
        dailyRent: "",
      }
    ]);
  };

  const removeVehicle = (vehicleId) => {
    if (vehicles.length > 1) {
      setVehicles(vehicles.filter(v => v.id !== vehicleId));
    }
  };

  const updateVehicle = (vehicleId, field, value) => {
    setVehicles(vehicles.map(vehicle => 
      vehicle.id === vehicleId ? { ...vehicle, [field]: value } : vehicle
    ));
  };

  useEffect(() => {
    if (!isOpen || !driver) {
      return;
    }

    setVehicles([
      {
        id: 1,
        vehicleNumber: driver.vehicleNumbers?.[0] || "",
        rentalDays: "",
        trips: "",
        dailyRent: "",
      }
    ]);
    setFormData({
      weeklyInsurance: "210",
      doubleDriverCharge: "",
      totalEarnings: "",
      totalCashCollect: "",
      platformFee: "",
      toll: "",
      tds: "",
      vehicleAdjustment: "0",
      rtoFine: "",
      accident: "",
      deadKm: "",
      roomRent: "",
    });
    setErrors({});
  }, [isOpen, driver, isDoubleDriverCategory]);

  if (!isOpen || !driver) {
    return null;
  }

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors = {};
    
    // Validate each vehicle
    vehicles.forEach((vehicle, index) => {
      if (!vehicle.vehicleNumber?.trim()) {
        nextErrors[`vehicle_${vehicle.id}_vehicleNumber`] = `Vehicle ${index + 1}: Vehicle number is required`;
      }
      if (!vehicle.rentalDays || Number(vehicle.rentalDays) <= 0) {
        nextErrors[`vehicle_${vehicle.id}_rentalDays`] = `Vehicle ${index + 1}: Rental days must be greater than 0`;
      }
      if (vehicle.trips === "" || Number(vehicle.trips) < 0) {
        nextErrors[`vehicle_${vehicle.id}_trips`] = `Vehicle ${index + 1}: Trips must be a valid number`;
      }
      if (!vehicle.dailyRent || Number(vehicle.dailyRent) <= 0) {
        nextErrors[`vehicle_${vehicle.id}_dailyRent`] = `Vehicle ${index + 1}: Daily rent must be greater than 0`;
      }
    });

    if (!formData.totalEarnings || Number(formData.totalEarnings) < 0) {
      nextErrors.totalEarnings = "Total earnings must be a valid number";
    }
    if (!formData.totalCashCollect || Number(formData.totalCashCollect) < 0) {
      nextErrors.totalCashCollect = "Total cash collect must be a valid number";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    // Calculate total rental days and trips across all vehicles
    const totalRentalDays = vehicles.reduce((sum, v) => sum + (Number(v.rentalDays) || 0), 0);
    const totalTrips = vehicles.reduce((sum, v) => sum + (Number(v.trips) || 0), 0);
    
    // If single vehicle, use original format, otherwise pass vehicles array
    const billData = {
      driverId: driver.id,
      tvpId: driver.tvpId,
      driverName: driver.name,
      vehicles: vehicles.map(v => ({
        vehicleNumber: v.vehicleNumber,
        rentalDays: Number(v.rentalDays) || 0,
        trips: Number(v.trips) || 0,
        dailyRent: Number(v.dailyRent) || 0,
      })),
      vehicleNumber: vehicles.length === 1 ? vehicles[0].vehicleNumber : vehicles.map(v => v.vehicleNumber).join(", "),
      rentalDays: totalRentalDays,
      trips: totalTrips,
      dailyRent: vehicles.length === 1 ? Number(vehicles[0].dailyRent) || 0 : 0, // For single vehicle compatibility
      weeklyInsurance: Number(formData.weeklyInsurance) || 210,
      doubleDriverCharge: Number(formData.doubleDriverCharge) || 0,
      netWeeklyRent: netWeeklyRent,
      totalEarnings: Number(formData.totalEarnings) || 0,
      totalCashCollect: Number(formData.totalCashCollect) || 0,
      difference: difference,
      platformFee: Number(formData.platformFee) || 0,
      toll: Number(formData.toll) || 0,
      tds: Number(formData.tds) || 0,
      vehicleAdjustment: Number(formData.vehicleAdjustment) || 0,
      rtoFine: Number(formData.rtoFine) || 0,
      accident: Number(formData.accident) || 0,
      deadKm: Number(formData.deadKm) || 0,
      roomRent: Number(formData.roomRent) || 0,
      currentOS: currentOS,
      weekStart: weekRange.weekStart,
      weekEnd: weekRange.weekEnd,
    };

    onSubmit(billData);
  };

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 px-4">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-lg border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Generate Bill / Invoice
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create invoice for {driver?.name || "driver"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={submitting}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Auto-filled Info */}
          <div className="grid gap-4 md:grid-cols-3 p-4 bg-muted/20 rounded-lg border border-border">
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">
                TVP ID
              </label>
              <p className="text-sm font-semibold text-foreground mt-1">
                {driver.tvpId}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Driver Name
              </label>
              <p className="text-sm font-semibold text-foreground mt-1">
                {driver.name}
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase">
                Current OS
              </label>
              <p
                className={`text-sm font-semibold mt-1 ${
                  currentOS >= 0 ? "text-success" : "text-error"
                }`}
              >
                {currentOS >= 0 ? "+" : ""}
                {currentOS.toFixed(2)} INR
              </p>
            </div>
          </div>

          {/* Week Selection */}
          <div className="bg-muted/20 rounded-lg p-4 border border-border">
            <WeekSelector value={weekRange} onChange={setWeekRange} />
          </div>

          {/* Vehicles Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">Vehicle Details</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                iconName="Plus"
                iconSize={14}
                onClick={addVehicle}
              >
                Add Vehicle
              </Button>
            </div>

            {vehicles.map((vehicle, index) => (
              <div key={vehicle.id} className="border border-border rounded-lg p-4 space-y-4 bg-muted/20">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-foreground">Vehicle {index + 1}</h4>
                  {vehicles.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      iconSize={14}
                      className="text-error"
                      onClick={() => removeVehicle(vehicle.id)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <Select
                  label="Vehicle Number"
                  options={
                    loadingVehicles 
                      ? [{ value: "", label: "Loading vehicles..." }] 
                      : getAvailableVehicles(vehicle.id).length > 0
                        ? getAvailableVehicles(vehicle.id)
                        : [{ value: "", label: "No vehicles available" }]
                  }
                  value={vehicle.vehicleNumber}
                  onChange={(value) => updateVehicle(vehicle.id, "vehicleNumber", value)}
                  placeholder={loadingVehicles ? "Loading vehicles..." : "Select vehicle"}
                  required
                  error={errors[`vehicle_${vehicle.id}_vehicleNumber`]}
                  disabled={loadingVehicles}
                />

                <div className="grid gap-4 md:grid-cols-3">
                  <Input
                    label="Rental Days*"
                    type="number"
                    min="1"
                    value={vehicle.rentalDays}
                    onChange={(e) => updateVehicle(vehicle.id, "rentalDays", e.target.value)}
                    required
                    error={errors[`vehicle_${vehicle.id}_rentalDays`]}
                    description="Days this vehicle was used"
                  />
                  <Input
                    label="Trips"
                    type="number"
                    min="0"
                    value={vehicle.trips}
                    onChange={(e) => updateVehicle(vehicle.id, "trips", e.target.value)}
                    required
                    error={errors[`vehicle_${vehicle.id}_trips`]}
                    description={
                      settingsLoading
                        ? "Loading trip slabs..."
                        : fleetRentSlabs.length > 0
                        ? "Auto-calculates daily rent"
                        : "Trip slabs not configured"
                    }
                  />
                  <Input
                    label="Daily Rent (INR)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={vehicle.dailyRent}
                    onChange={(e) => updateVehicle(vehicle.id, "dailyRent", e.target.value)}
                    required
                    error={errors[`vehicle_${vehicle.id}_dailyRent`]}
                    description={
                      settingsLoading
                        ? "Calculating..."
                        : fleetRentSlabs.length > 0
                        ? "Auto-calculated from trips"
                        : "Enter manually"
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Net Weekly Rent Summary */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Net Weekly Rent Calculation</h4>
            <div className="space-y-2 text-sm">
              {vehicles.map((vehicle, index) => {
                const vehicleRent = (parseFloat(vehicle.dailyRent) || 0) * (parseFloat(vehicle.rentalDays) || 0);
                return (
                  <div key={vehicle.id} className="flex justify-between items-center">
                    <span className="text-muted-foreground">
                      Vehicle {index + 1} ({vehicle.vehicleNumber || 'Not selected'}): ₹{parseFloat(vehicle.dailyRent) || 0} × {parseFloat(vehicle.rentalDays) || 0} days
                    </span>
                    <span className="font-medium text-foreground">₹{vehicleRent.toFixed(2)}</span>
                  </div>
                );
              })}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-muted-foreground">Subtotal (All Vehicles):</span>
                <span className="font-medium text-foreground">
                  ₹{vehicles.reduce((sum, v) => sum + ((parseFloat(v.dailyRent) || 0) * (parseFloat(v.rentalDays) || 0)), 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">+ Weekly Insurance:</span>
                <span className="font-medium text-foreground">₹{parseFloat(formData.weeklyInsurance) || 210}</span>
              </div>
              {parseFloat(formData.doubleDriverCharge) > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">+ Double Driver Charge:</span>
                  <span className="font-medium text-foreground">₹{parseFloat(formData.doubleDriverCharge).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t-2 border-primary font-semibold">
                <span className="text-foreground">Net Weekly Rent:</span>
                <span className="text-primary text-lg">₹{netWeeklyRent.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Weekly Insurance & Double Driver */}
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Weekly Insurance (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.weeklyInsurance}
              onChange={(e) =>
                handleFieldChange("weeklyInsurance", e?.target?.value)
              }
              description="Common for all vehicles. Default: 210 INR"
            />
            <Input
              label="Double Driver Charge (INR)"
              
              value={formData.doubleDriverCharge}
              onChange={(e) =>
                handleFieldChange("doubleDriverCharge", e?.target?.value)
              }
              description={
                isDoubleDriverCategory
                  ? `Auto-calculated: ₹350 ÷ ${driver?.vehicleNumbers?.length || 1} vehicles = ₹${formData.doubleDriverCharge || "0"}`
                  : ""
              }
              disabled={isDoubleDriverCategory}
            />
          </div>

          {/* Net Weekly Rent (Auto-calculated) */}
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-foreground">
                  Net Weekly Rent
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  (Daily Rent × Rental Days) + Weekly Insurance + Double Driver
                  Charge
                </p>
              </div>
              <span className="text-lg font-bold text-primary">
                {netWeeklyRent.toFixed(2)} INR
              </span>
            </div>
          </div>

          {/* Earnings & Cash Collect */}
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Total Earnings (INR)"
              
              value={formData.totalEarnings}
              onChange={(e) =>
                handleFieldChange("totalEarnings", e?.target?.value)
              }
              required
              error={errors.totalEarnings}
            />
            <Input
              label="Total Cash Collect (INR)"
              
              value={formData.totalCashCollect}
              onChange={(e) =>
                handleFieldChange("totalCashCollect", e?.target?.value)
              }
              required
              error={errors.totalCashCollect}
            />
          </div>

          {/* Difference Display */}
          <div className="p-4 bg-muted/20 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Difference (Cash Collect - Earnings)
              </span>
              <span
                className={`text-lg font-bold ${
                  difference >= 0 ? "text-success" : "text-error"
                }`}
              >
                {difference >= 0 ? "+" : ""}
                {difference.toFixed(2)} INR
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {difference >= 0 
                ? "Positive: Adds to final amount (collected more than earned)" 
                : "Negative: Subtracts from final amount (earned more than collected)"}
            </p>
          </div>

          {/* Additional Charges */}
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Driver Pass (INR)"
              
              value={formData.platformFee}
              onChange={(e) =>
                handleFieldChange("platformFee", e?.target?.value)
              }
            />
            <Input
              label="Toll (INR)"
              
              value={formData.toll}
              onChange={(e) => handleFieldChange("toll", e?.target?.value)}
            />
            <Input
              label="TDS (INR)"
              
              value={formData.tds}
              onChange={(e) => handleFieldChange("tds", e?.target?.value)}
              description="Auto-calculated as 1% of Total Earnings"
              disabled
            />
          </div>

          {/* Adjustments & Charges */}
          <div className="grid gap-4 md:grid-cols-4">
            <Input
              label="Vehicle Adjustment (INR)"
              
              value={formData.vehicleAdjustment}
              onChange={(e) =>
                handleFieldChange("vehicleAdjustment", e?.target?.value)
              }
              description="Default: 0"
            />
            <Input
              label="RTO Fine (INR)"
              
              value={formData.rtoFine}
              onChange={(e) => handleFieldChange("rtoFine", e?.target?.value)}
            />
            <Input
              label="Accident (INR)"
              
              value={formData.accident}
              onChange={(e) => handleFieldChange("accident", e?.target?.value)}
            />
            <Input
              label="Dead KM (INR)"
             
              value={formData.deadKm}
              onChange={(e) => handleFieldChange("deadKm", e?.target?.value)}
            />
            <Input
              label="Room Rent (INR)"
              
              value={formData.roomRent}
              onChange={(e) => handleFieldChange("roomRent", e?.target?.value)}
            />
          </div>

          {/* Current OS Display */}
          <div className="p-4 bg-success/5 rounded-lg border border-success/20">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-foreground">
                  Final Amount
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Net Rent + Room Rent - Toll + Driver Pass + TDS - Vehicle Adjustment + RTO + Accident + Dead KM + Difference
                </p>
              </div>
              <span
                className={`text-xl font-bold ${
                  currentOS >= 0 ? "text-success" : "text-error"
                }`}
              >
                {currentOS >= 0 ? "+" : ""}
                {currentOS.toFixed(2)} INR
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={submitting}
              iconName="FileText"
              iconPosition="left"
              iconSize={16}
            >
              {submitting ? "Generating..." : "Generate Invoice"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillFormModal;
