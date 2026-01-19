import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Icon from "../../../components/AppIcon";
import { useAdminSettings } from "../../../hooks/useAdminSettings";

const VehicleBillForm = ({ vehicle, billData, onChange, onRemove, index }) => {
  const { calculateFleetRent, fleetRentSlabs, loading: settingsLoading, loadSettings } = useAdminSettings();

  const [formData, setFormData] = useState({
    vehicleNumber: vehicle?.car_number || vehicle?.value || "",
    rentalDays: billData?.rentalDays || "",
    trips: billData?.trips || "",
    dailyRent: billData?.dailyRent || "",
    weeklyInsurance: billData?.weeklyInsurance || "210",
    doubleDriverCharge: billData?.doubleDriverCharge || "",
    totalEarnings: billData?.totalEarnings || "",
    totalCashCollect: billData?.totalCashCollect || "",
    platformFee: billData?.platformFee || "",
    toll: billData?.toll || "",
    tds: billData?.tds || "",
    vehicleAdjustment: billData?.vehicleAdjustment || "0",
    rtoFine: billData?.rtoFine || "",
    accident: billData?.accident || "",
    deadKm: billData?.deadKm || "",
  });

  const [errors, setErrors] = useState({});

  // Reload settings when component mounts
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Auto-calculate daily rent based on trips
  useEffect(() => {
    if (!settingsLoading && fleetRentSlabs.length > 0 && formData.trips !== "" && Number(formData.trips) >= 0) {
      const tripCount = Number(formData.trips);
      const dailyRent = calculateFleetRent(tripCount);
      if (dailyRent > 0) {
        setFormData((prev) => ({ ...prev, dailyRent: dailyRent.toString() }));
      }
    }
  }, [formData.trips, calculateFleetRent, fleetRentSlabs, settingsLoading]);

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

  // Calculate net weekly rent
  const netWeeklyRent = useMemo(() => {
    const daily = parseFloat(formData.dailyRent) || 0;
    const days = parseFloat(formData.rentalDays) || 0;
    const weeklyInsurance = parseFloat(formData.weeklyInsurance) || 0;
    const doubleDriverCharge = parseFloat(formData.doubleDriverCharge) || 0;
    return daily * days + weeklyInsurance + doubleDriverCharge;
  }, [
    formData.dailyRent,
    formData.rentalDays,
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

  // Calculate Current OS (Final Amount)
  // Formula: Net Weekly Rent - Toll + Driver Pass + TDS - Vehicle Adjustment + RTO + Accident + Dead KM + Difference
  const currentOS = useMemo(() => {
    const netRent = netWeeklyRent;
    const tollAmount = parseFloat(formData.toll) || 0;
    const vehicleAdjustment = parseFloat(formData.vehicleAdjustment) || 0;
    const platformFee = parseFloat(formData.platformFee) || 0;
    const tds = parseFloat(formData.tds) || 0;
    const rtoFine = parseFloat(formData.rtoFine) || 0;
    const accident = parseFloat(formData.accident) || 0;
    const deadKm = parseFloat(formData.deadKm) || 0;
    const diff = difference;

    // Correct formula: Net Rent - Toll + Driver Pass + TDS - Vehicle Adj + RTO + Accident + Dead KM + Difference
    return (
      netRent -
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
    formData.toll,
    formData.vehicleAdjustment,
    formData.platformFee,
    formData.tds,
    formData.rtoFine,
    formData.accident,
    formData.deadKm,
    difference,
  ]);

  // Notify parent of changes
  useEffect(() => {
    const vehicleBill = {
      vehicleNumber: formData.vehicleNumber,
      rentalDays: Number(formData.rentalDays) || 0,
      trips: Number(formData.trips) || 0,
      dailyRent: Number(formData.dailyRent) || 0,
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
      currentOS: currentOS,
    };
    onChange(vehicleBill);
  }, [formData, netWeeklyRent, difference, currentOS, onChange]);

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

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div>
          <h4 className="text-lg font-semibold text-foreground">
            Vehicle {index + 1}: {formData.vehicleNumber || "Select Vehicle"}
          </h4>
          <p className="text-sm text-muted-foreground">
            Enter bill details for this vehicle
          </p>
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            iconName="Trash"
            iconSize={16}
          >
            Remove
          </Button>
        )}
      </div>

      {/* Rental Details */}
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Rental Days"
          type="number"
          min="1"
          value={formData.rentalDays}
          onChange={(e) => handleFieldChange("rentalDays", e?.target?.value)}
          required
          error={errors.rentalDays}
        />
        <Input
          label="Trips"
          type="number"
          min="0"
          value={formData.trips}
          onChange={(e) => handleFieldChange("trips", e?.target?.value)}
          required
          error={errors.trips}
          description={
            settingsLoading
              ? "Loading trip slabs..."
              : fleetRentSlabs.length > 0
              ? "Auto-calculates daily rent from trip slab"
              : "Trip slabs not configured"
          }
        />
        <Input
          label="Daily Rent (INR)"
          type="number"
          min="0"
          step="0.01"
          value={formData.dailyRent}
          onChange={(e) => handleFieldChange("dailyRent", e?.target?.value)}
          required
          error={errors.dailyRent}
          description="Auto-calculated from trips using fleet rent slabs"
        />
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
          description="Default: 210 INR"
        />
        <Input
          label="Double Driver Charge (INR)"
          type="number"
          min="0"
          step="0.01"
          value={formData.doubleDriverCharge}
          onChange={(e) =>
            handleFieldChange("doubleDriverCharge", e?.target?.value)
          }
        />
      </div>

      {/* Net Weekly Rent Display */}
      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-foreground">
              Net Weekly Rent
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">
              (Daily Rent × Rental Days) + Weekly Insurance + Double Driver Charge
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
          type="number"
          min="0"
          step="0.01"
          value={formData.totalEarnings}
          onChange={(e) =>
            handleFieldChange("totalEarnings", e?.target?.value)
          }
          required
          error={errors.totalEarnings}
        />
        <Input
          label="Total Cash Collect (INR)"
          type="number"
          min="0"
          step="0.01"
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
      </div>

      {/* Additional Charges */}
      <div className="grid gap-4 md:grid-cols-3">
        <Input
          label="Driver Pass (INR)"
          type="number"
          min="0"
          step="0.01"
          value={formData.platformFee}
          onChange={(e) => handleFieldChange("platformFee", e?.target?.value)}
        />
        <Input
          label="Toll (INR)"
          type="number"
          min="0"
          step="0.01"
          value={formData.toll}
          onChange={(e) => handleFieldChange("toll", e?.target?.value)}
        />
            <Input
              label="TDS (INR)"
              type="number"
              min="0"
              step="0.01"
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
          type="number"
          step="0.01"
          value={formData.vehicleAdjustment}
          onChange={(e) =>
            handleFieldChange("vehicleAdjustment", e?.target?.value)
          }
          description="Default: 0"
        />
        <Input
          label="RTO Fine (INR)"
          type="number"
          min="0"
          step="0.01"
          value={formData.rtoFine}
          onChange={(e) => handleFieldChange("rtoFine", e?.target?.value)}
        />
        <Input
          label="Accident (INR)"
          type="number"
          min="0"
          step="0.01"
          value={formData.accident}
          onChange={(e) => handleFieldChange("accident", e?.target?.value)}
        />
        <Input
          label="Dead KM (INR)"
          type="number"
          min="0"
          step="0.01"
          value={formData.deadKm}
          onChange={(e) => handleFieldChange("deadKm", e?.target?.value)}
        />
      </div>

      {/* Current OS Display */}
      <div className="p-4 bg-success/5 rounded-lg border border-success/20">
        <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium text-foreground">
                  Final Amount for this vehicle
                </span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Net Rent - Toll + Driver Pass + TDS - Vehicle Adjustment + RTO + Accident + Dead KM + Difference
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
    </div>
  );
};

export default VehicleBillForm;

