import React, { useState, useEffect, useMemo } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Icon from "../../../components/AppIcon";

const BillEditModal = ({ bill, vehicles, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    vehicleNumber: "",
    rentalDays: "",
    trips: "",
    dailyRent: "",
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

  const isGeneratedBill = bill?.status === "generated";

  // Initialize form data from bill
  useEffect(() => {
    if (bill) {
      setFormData({
        vehicleNumber: bill.vehicle_number || "",
        rentalDays: bill.rental_days?.toString() || "",
        trips: bill.trips?.toString() || "",
        dailyRent: bill.daily_rent?.toString() || "",
        weeklyInsurance: bill.weekly_insurance?.toString() || "210",
        doubleDriverCharge: bill.double_driver_charge?.toString() || "",
        totalEarnings: bill.total_earnings?.toString() || "",
        totalCashCollect: bill.total_cash_collect?.toString() || "",
        platformFee: bill.platform_fee?.toString() || "",
        toll: bill.toll?.toString() || "",
        tds: bill.tds?.toString() || "",
        vehicleAdjustment: bill.vehicle_adjustment?.toString() || "0",
        rtoFine: bill.rto_fine?.toString() || "",
        accident: bill.accident?.toString() || "",
        deadKm: bill.dead_km?.toString() || "",
        roomRent: bill.room_rent?.toString() ?? "",
      });
    }
  }, [bill]);

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

  // Calculate difference
  const difference = useMemo(() => {
    const earnings = parseFloat(formData.totalEarnings) || 0;
    const cashCollect = parseFloat(formData.totalCashCollect) || 0;
    return earnings - cashCollect;
  }, [formData.totalEarnings, formData.totalCashCollect]);

  // Calculate Current OS (includes room rent if set)
  const currentOS = useMemo(() => {
    const netRent = netWeeklyRent;
    const tollAmount = parseFloat(formData.toll) || 0;
    const diff = difference;
    const vehicleAdjustment = parseFloat(formData.vehicleAdjustment) || 0;
    const platformFee = parseFloat(formData.platformFee) || 0;
    const tds = parseFloat(formData.tds) || 0;
    const rtoFine = parseFloat(formData.rtoFine) || 0;
    const accident = parseFloat(formData.accident) || 0;
    const deadKm = parseFloat(formData.deadKm) || 0;
    const roomRent = parseFloat(formData.roomRent) || 0;

    return (
      netRent -
      tollAmount -
      diff -
      vehicleAdjustment +
      platformFee +
      tds +
      rtoFine +
      accident +
      deadKm +
      roomRent
    );
  }, [
    netWeeklyRent,
    formData.toll,
    difference,
    formData.vehicleAdjustment,
    formData.platformFee,
    formData.tds,
    formData.rtoFine,
    formData.accident,
    formData.deadKm,
    formData.roomRent,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validation
    const newErrors = {};
    if (!formData.vehicleNumber) newErrors.vehicleNumber = "Vehicle number is required";
    if (!formData.rentalDays) newErrors.rentalDays = "Rental days is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare bill data
    const billData = {
      driverId: bill.driver_id,
      tvpId: bill.tvp_id,
      driverName: bill.driver_name,
      vehicleNumber: formData.vehicleNumber,
      rentalDays: parseInt(formData.rentalDays) || 0,
      trips: parseInt(formData.trips) || 0,
      dailyRent: parseFloat(formData.dailyRent) || 0,
      weeklyInsurance: parseFloat(formData.weeklyInsurance) || 210,
      doubleDriverCharge: parseFloat(formData.doubleDriverCharge) || 0,
      netWeeklyRent: netWeeklyRent,
      totalEarnings: parseFloat(formData.totalEarnings) || 0,
      totalCashCollect: parseFloat(formData.totalCashCollect) || 0,
      difference: difference,
      platformFee: parseFloat(formData.platformFee) || 0,
      toll: parseFloat(formData.toll) || 0,
      tds: parseFloat(formData.tds) || 0,
      vehicleAdjustment: parseFloat(formData.vehicleAdjustment) || 0,
      rtoFine: parseFloat(formData.rtoFine) || 0,
      accident: parseFloat(formData.accident) || 0,
      deadKm: parseFloat(formData.deadKm) || 0,
      roomRent: parseFloat(formData.roomRent) || 0,
      currentOS: currentOS,
    };

    try {
      await onSave(billData);
    } catch (error) {
      setErrors({ general: error.message || "Failed to update bill" });
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-lg border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {isGeneratedBill ? "Edit Bill" : "Edit Draft Bill"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isGeneratedBill
                ? "Update bill details. Changes will update outstanding balance."
                : "Review and edit bill details before finalizing"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={loading}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Vehicle Number"
              value={formData.vehicleNumber}
              onChange={(e) =>
                setFormData({ ...formData, vehicleNumber: e.target.value })
              }
              error={errors.vehicleNumber}
              required
            />

            <Input
              label="Rental Days"
              type="number"
              min="0"
              value={formData.rentalDays}
              onChange={(e) =>
                setFormData({ ...formData, rentalDays: e.target.value })
              }
              error={errors.rentalDays}
              required
            />

            <Input
              label="Trips"
              type="number"
              min="0"
              value={formData.trips}
              onChange={(e) =>
                setFormData({ ...formData, trips: e.target.value })
              }
            />

            <Input
              label="Daily Rent (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.dailyRent}
              onChange={(e) =>
                setFormData({ ...formData, dailyRent: e.target.value })
              }
            />

            <Input
              label="Weekly Insurance (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.weeklyInsurance}
              onChange={(e) =>
                setFormData({ ...formData, weeklyInsurance: e.target.value })
              }
            />

            <Input
              label="Double Driver Charge (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.doubleDriverCharge}
              onChange={(e) =>
                setFormData({ ...formData, doubleDriverCharge: e.target.value })
              }
            />

            <Input
              label="Total Earnings (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalEarnings}
              onChange={(e) =>
                setFormData({ ...formData, totalEarnings: e.target.value })
              }
            />

            <Input
              label="Total Cash Collect (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.totalCashCollect}
              onChange={(e) =>
                setFormData({ ...formData, totalCashCollect: e.target.value })
              }
            />

            <Input
              label="Driver Pass (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.platformFee}
              onChange={(e) =>
                setFormData({ ...formData, platformFee: e.target.value })
              }
            />

            <Input
              label="Toll (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.toll}
              onChange={(e) =>
                setFormData({ ...formData, toll: e.target.value })
              }
            />

            <Input
              label="TDS (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.tds}
              onChange={(e) =>
                setFormData({ ...formData, tds: e.target.value })
              }
            />

            <Input
              label="Vehicle Adjustment (INR)"
              type="number"
              step="0.01"
              value={formData.vehicleAdjustment}
              onChange={(e) =>
                setFormData({ ...formData, vehicleAdjustment: e.target.value })
              }
            />

            <Input
              label="RTO Fine (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.rtoFine}
              onChange={(e) =>
                setFormData({ ...formData, rtoFine: e.target.value })
              }
            />

            <Input
              label="Accident (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.accident}
              onChange={(e) =>
                setFormData({ ...formData, accident: e.target.value })
              }
            />

            <Input
              label="Dead KM (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.deadKm}
              onChange={(e) =>
                setFormData({ ...formData, deadKm: e.target.value })
              }
            />

            <Input
              label="Room Rent (INR)"
              type="number"
              min="0"
              step="0.01"
              value={formData.roomRent}
              onChange={(e) =>
                setFormData({ ...formData, roomRent: e.target.value })
              }
            />
          </div>

          {/* Calculated Fields */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-foreground">Net Weekly Rent:</span>
              <span className="text-sm font-semibold text-foreground">
                {netWeeklyRent.toFixed(2)} INR
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium text-foreground">Difference:</span>
              <span className="text-sm font-semibold text-foreground">
                {difference.toFixed(2)} INR
              </span>
            </div>
            <div className="flex justify-between border-t border-border pt-2">
              <span className="text-base font-semibold text-foreground">Current OS:</span>
              <span className="text-base font-bold text-primary">
                {currentOS.toFixed(2)} INR
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BillEditModal;



