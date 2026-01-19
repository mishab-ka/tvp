import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { formatCurrency } from "../../../utils/formatters";
import Input from "../../../components/ui/Input";

const CalculationEngine = ({
  selectedOwners,
  dateRange,
  onCalculationUpdate,
  calculations = {},
}) => {
  const [adjustments, setAdjustments] = useState({
    tollCharges: 0,
    penalties: 0,
    bonuses: 0,
    miscellaneous: 0,
  });

  const [customRates, setCustomRates] = useState({
    dailyRentRate: 45,
    tripBonusRate: 2.5,
    performanceMultiplier: 1.2,
  });

  const [realTimeCalcs, setRealTimeCalcs] = useState({
    totalRevenue: 0,
    totalDeductions: 0,
    netEarnings: 0,
    totalTrips: 0,
  });

  // Mock calculation logic
  useEffect(() => {
    if (
      selectedOwners?.length > 0 &&
      dateRange?.startDate &&
      dateRange?.endDate
    ) {
      const days = Math.ceil(
        (new Date(dateRange.endDate) - new Date(dateRange.startDate)) /
          (1000 * 60 * 60 * 24)
      );

      const baseRevenue = selectedOwners?.reduce((total, owner) => {
        return total + owner?.vehicleCount * customRates?.dailyRentRate * days;
      }, 0);

      const tripRevenue = selectedOwners?.reduce((total, owner) => {
        const estimatedTrips = owner?.vehicleCount * days * 8; // 8 trips per day average
        return total + estimatedTrips * customRates?.tripBonusRate;
      }, 0);

      const totalDeductions = Object.values(adjustments)?.reduce(
        (sum, val) => sum + parseFloat(val || 0),
        0
      );

      const newCalcs = {
        totalRevenue: baseRevenue + tripRevenue,
        totalDeductions,
        netEarnings: baseRevenue + tripRevenue - totalDeductions,
        totalTrips: selectedOwners?.reduce(
          (total, owner) => total + owner?.vehicleCount * days * 8,
          0
        ),
      };

      setRealTimeCalcs(newCalcs);
      onCalculationUpdate(newCalcs);
    }
  }, [
    selectedOwners,
    dateRange,
    adjustments,
    customRates,
    onCalculationUpdate,
  ]);

  const handleAdjustmentChange = (field, value) => {
    setAdjustments((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleRateChange = (field, value) => {
    setCustomRates((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const resetCalculations = () => {
    setAdjustments({
      tollCharges: 0,
      penalties: 0,
      bonuses: 0,
      miscellaneous: 0,
    });
    setCustomRates({
      dailyRentRate: 45,
      tripBonusRate: 2.5,
      performanceMultiplier: 1.2,
    });
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Calculation Engine
          </h3>
          <p className="text-sm text-muted-foreground">
            Real-time financial calculations and adjustments
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={resetCalculations}
          iconName="RotateCcw"
          iconPosition="left"
          iconSize={16}
        >
          Reset
        </Button>
      </div>
      <div className="p-6 space-y-6">
        {/* Live Calculations Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-success/5 border border-success/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Icon name="TrendingUp" size={20} className="text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-success">
                  {formatCurrency(realTimeCalcs?.totalRevenue)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-error/5 border border-error/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
                <Icon name="TrendingDown" size={20} className="text-error" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deductions</p>
                <p className="text-xl font-bold text-error">
                  {formatCurrency(realTimeCalcs?.totalDeductions)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="DollarSign" size={20} className="text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Earnings</p>
                <p className="text-xl font-bold text-primary">
                  {formatCurrency(realTimeCalcs?.netEarnings)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Icon name="Car" size={20} className="text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Trips</p>
                <p className="text-xl font-bold text-accent">
                  {realTimeCalcs?.totalTrips?.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Configuration */}
        <div>
          <h4 className="text-md font-semibold text-foreground mb-4">
            Rate Configuration
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Daily Rent Rate ($)"
              type="number"
              value={customRates?.dailyRentRate}
              onChange={(e) =>
                handleRateChange("dailyRentRate", e?.target?.value)
              }
              placeholder="45.00"
              step="0.01"
            />
            <Input
              label="Trip Bonus Rate ($)"
              type="number"
              value={customRates?.tripBonusRate}
              onChange={(e) =>
                handleRateChange("tripBonusRate", e?.target?.value)
              }
              placeholder="2.50"
              step="0.01"
            />
            <Input
              label="Performance Multiplier"
              type="number"
              value={customRates?.performanceMultiplier}
              onChange={(e) =>
                handleRateChange("performanceMultiplier", e?.target?.value)
              }
              placeholder="1.20"
              step="0.01"
            />
          </div>
        </div>

        {/* Adjustments Panel */}
        <div>
          <h4 className="text-md font-semibold text-foreground mb-4">
            Manual Adjustments
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Toll Charges ($)"
              type="number"
              value={adjustments?.tollCharges}
              onChange={(e) =>
                handleAdjustmentChange("tollCharges", e?.target?.value)
              }
              placeholder="0.00"
              step="0.01"
              description="Total toll charges for the period"
            />
            <Input
              label="Penalties ($)"
              type="number"
              value={adjustments?.penalties}
              onChange={(e) =>
                handleAdjustmentChange("penalties", e?.target?.value)
              }
              placeholder="0.00"
              step="0.01"
              description="Traffic fines and violations"
            />
            <Input
              label="Performance Bonuses ($)"
              type="number"
              value={adjustments?.bonuses}
              onChange={(e) =>
                handleAdjustmentChange("bonuses", e?.target?.value)
              }
              placeholder="0.00"
              step="0.01"
              description="Additional performance incentives"
            />
            <Input
              label="Miscellaneous ($)"
              type="number"
              value={adjustments?.miscellaneous}
              onChange={(e) =>
                handleAdjustmentChange("miscellaneous", e?.target?.value)
              }
              placeholder="0.00"
              step="0.01"
              description="Other adjustments and corrections"
            />
          </div>
        </div>

        {/* Calculation Summary */}
        <div className="bg-muted/30 rounded-lg p-4">
          <h4 className="text-md font-semibold text-foreground mb-3">
            Calculation Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Base Daily Rent:</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(realTimeCalcs?.totalRevenue * 0.7)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trip Bonuses:</span>
                <span className="font-medium text-foreground">
                  {formatCurrency(realTimeCalcs?.totalRevenue * 0.3)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Performance Bonus:
                </span>
                <span className="font-medium text-success">
                  +{formatCurrency(adjustments?.bonuses)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Toll Deductions:</span>
                <span className="font-medium text-error">
                  -{formatCurrency(adjustments?.tollCharges)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Penalty Deductions:
                </span>
                <span className="font-medium text-error">
                  -{formatCurrency(adjustments?.penalties)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Other Adjustments:
                </span>
                <span className="font-medium text-warning">
                  {adjustments?.miscellaneous >= 0 ? "+" : ""}
                  {formatCurrency(adjustments?.miscellaneous)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationEngine;
