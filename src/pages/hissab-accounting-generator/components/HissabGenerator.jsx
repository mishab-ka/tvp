import React, { useState, useEffect, useMemo } from "react";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";
import Icon from "../../../components/AppIcon";
import WeekSelector, { calculatePreviousWeek } from "./WeekSelector";
import VehicleBillForm from "./VehicleBillForm";
import OtherChargesForm from "./OtherChargesForm";
import { getAllTVPOwners } from "../../../lib/tvpManagementAPI";
import { getAllVehicles } from "../../../lib/tvpManagementAPI";

const HissabGenerator = ({ onPreview, onSave }) => {
  const [currentStep, setCurrentStep] = useState("select_owner");
  const [owners, setOwners] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Step 1: Select Owner & Week
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [weekDate, setWeekDate] = useState(calculatePreviousWeek());

  // Step 2: Enter Vehicle Bills
  const [vehicleBills, setVehicleBills] = useState([]);
  const [otherCharges, setOtherCharges] = useState([]);

  // Load owners on mount
  useEffect(() => {
    const loadOwners = async () => {
      try {
        setLoading(true);
        const ownersData = await getAllTVPOwners();
        setOwners(ownersData);
      } catch (err) {
        console.error("Error loading owners:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadOwners();
  }, []);

  // Normalize vehicle number for matching
  const normalizeVehicleNumber = (vehicleNumber) => {
    if (!vehicleNumber) return "";
    return vehicleNumber
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/-/g, "")
      .trim();
  };

  // Load vehicles when owner is selected
  useEffect(() => {
    const loadVehicles = async () => {
      if (!selectedOwner) {
        setVehicles([]);
        return;
      }

      try {
        setLoading(true);
        
        // Get vehicle numbers from the owner (stored in tvp_drivers.vehicle_numbers)
        const ownerVehicleNumbers = selectedOwner.vehicleNumbers || [];
        
        if (ownerVehicleNumbers.length === 0) {
          setVehicles([]);
          return;
        }

        // Fetch all vehicles from the cars table
        const allVehicles = await getAllVehicles();
        
        // Match vehicles by car_number with the owner's vehicle_numbers
        const ownerVehicles = allVehicles.filter((vehicle) => {
          const normalizedCarNumber = normalizeVehicleNumber(vehicle.car_number);
          return ownerVehicleNumbers.some((ownerVNum) => {
            const normalizedOwnerVNum = normalizeVehicleNumber(ownerVNum);
            return normalizedCarNumber === normalizedOwnerVNum;
          });
        });
        
        setVehicles(ownerVehicles);
        
        // Initialize vehicle bills
        if (ownerVehicles.length > 0) {
          setVehicleBills([
            {
              vehicle: ownerVehicles[0],
              billData: {},
            },
          ]);
        }
      } catch (err) {
        console.error("Error loading vehicles:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadVehicles();
  }, [selectedOwner]);

  const ownerOptions = owners.map((owner) => ({
    value: owner.id,
    label: `${owner.tvpId} - ${owner.name}`,
    description: `${owner.vehicleNumbers?.length || 0} vehicles`,
  }));

  const handleOwnerSelect = (ownerId) => {
    const owner = owners.find((o) => o.id === ownerId);
    setSelectedOwner(owner);
    setVehicleBills([]);
    setOtherCharges([]);
  };

  const handleAddVehicle = () => {
    // Find next vehicle that's not already added
    const addedVehicleIds = vehicleBills.map((vb) => vb.vehicle?.id);
    const nextVehicle = vehicles.find((v) => !addedVehicleIds.includes(v.id));

    if (nextVehicle) {
      setVehicleBills([
        ...vehicleBills,
        {
          vehicle: nextVehicle,
          billData: {},
        },
      ]);
    }
  };

  const handleRemoveVehicle = (index) => {
    setVehicleBills(vehicleBills.filter((_, i) => i !== index));
  };

  const handleVehicleBillChange = (index, billData) => {
    setVehicleBills(
      vehicleBills.map((vb, i) =>
        i === index ? { ...vb, billData } : vb
      )
    );
  };

  // Calculate totals
  const totals = useMemo(() => {
    const totalNetRent = vehicleBills.reduce(
      (sum, vb) => sum + (vb.billData.netWeeklyRent || 0),
      0
    );

    const totalOtherCharges = otherCharges.reduce((sum, charge) => {
      const amount = parseFloat(charge.amount) || 0;
      return charge.type === "+" ? sum + amount : sum - amount;
    }, 0);

    // According to user: Toll and Vehicle Adjustment are deductions, everything else is additions
    const totalDeductions = vehicleBills.reduce(
      (sum, vb) =>
        sum +
        (vb.billData.toll || 0) +
        (vb.billData.vehicleAdjustment || 0),
      0
    );

    const totalAdditions = vehicleBills.reduce(
      (sum, vb) =>
        sum +
        (vb.billData.platformFee || 0) +
        (vb.billData.tds || 0) +
        (vb.billData.rtoFine || 0) +
        (vb.billData.accident || 0) +
        (vb.billData.deadKm || 0) +
        (vb.billData.difference || 0),
      0
    );

    // Final Amount = Total Net Rent - Total Deductions + Total Additions + Other Charges
    const finalAmount =
      totalNetRent - totalDeductions + totalAdditions + totalOtherCharges;

    return {
      totalNetRent,
      totalOtherCharges,
      totalDeductions,
      totalAdditions,
      finalAmount,
    };
  }, [vehicleBills, otherCharges]);

  const handleNext = () => {
    if (currentStep === "select_owner") {
      if (!selectedOwner || !weekDate) {
        alert("Please select an owner and week");
        return;
      }
      setCurrentStep("enter_details");
    } else if (currentStep === "enter_details") {
      // Validate vehicle bills
      const hasValidBills = vehicleBills.some(
        (vb) =>
          vb.billData.rentalDays &&
          vb.billData.trips !== undefined &&
          vb.billData.dailyRent &&
          vb.billData.totalEarnings &&
          vb.billData.totalCashCollect
      );

      if (!hasValidBills) {
        alert("Please enter bill details for at least one vehicle");
        return;
      }

      // Prepare preview data
      const previewData = {
        owner: selectedOwner,
        week: weekDate,
        vehicles: vehicleBills.map((vb) => ({
          vehicle: vb.vehicle,
          billData: vb.billData,
        })),
        otherCharges,
        totals,
      };

      if (onPreview) {
        onPreview(previewData);
      }
      setCurrentStep("preview");
    }
  };

  const handleBack = () => {
    if (currentStep === "enter_details") {
      setCurrentStep("select_owner");
    } else if (currentStep === "preview") {
      setCurrentStep("enter_details");
    }
  };

  const availableVehicles = vehicles.filter(
    (v) => !vehicleBills.some((vb) => vb.vehicle?.id === v.id)
  );

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center space-x-4 mb-6">
        <div
          className={`flex items-center ${
            currentStep === "select_owner" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep === "select_owner"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground"
            }`}
          >
            {currentStep === "select_owner" ? (
              <Icon name="Check" size={16} />
            ) : (
              "1"
            )}
          </div>
          <span className="ml-2 font-medium">Select Owner & Week</span>
        </div>

        <div className="w-12 h-0.5 bg-border" />

        <div
          className={`flex items-center ${
            currentStep === "enter_details" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep === "enter_details"
                ? "border-primary bg-primary text-primary-foreground"
                : currentStep === "preview"
                ? "border-primary text-primary"
                : "border-muted-foreground"
            }`}
          >
            {currentStep === "preview" ? (
              <Icon name="Check" size={16} />
            ) : (
              "2"
            )}
          </div>
          <span className="ml-2 font-medium">Enter Details</span>
        </div>

        <div className="w-12 h-0.5 bg-border" />

        <div
          className={`flex items-center ${
            currentStep === "preview" ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              currentStep === "preview"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted-foreground"
            }`}
          >
            3
          </div>
          <span className="ml-2 font-medium">Preview</span>
        </div>
      </div>

      {/* Step 1: Select Owner & Week */}
      {currentStep === "select_owner" && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Select TVP Owner
            </h3>
            <Select
              label="TVP Owner"
              options={ownerOptions}
              value={selectedOwner?.id}
              onChange={handleOwnerSelect}
              placeholder="Select a TVP owner..."
              searchable
              required
            />
            {selectedOwner && (
              <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                <p className="text-sm font-medium text-foreground">
                  {selectedOwner.tvpId} - {selectedOwner.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {vehicles.length} vehicle(s) available
                </p>
              </div>
            )}
          </div>

          <WeekSelector value={weekDate} onChange={setWeekDate} />
        </div>
      )}

      {/* Step 2: Enter Vehicle Bills */}
      {currentStep === "enter_details" && (
        <div className="space-y-6">
          {selectedOwner && (
            <div className="bg-card rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Owner: {selectedOwner.tvpId} - {selectedOwner.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Week: {weekDate.weekStart} to {weekDate.weekEnd}
                  </p>
                </div>
                {availableVehicles.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddVehicle}
                    iconName="Plus"
                    iconPosition="left"
                  >
                    Add Another Vehicle
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Bills */}
          <div className="space-y-6">
            {vehicleBills.map((vehicleBill, index) => (
              <VehicleBillForm
                key={vehicleBill.vehicle?.id || index}
                vehicle={vehicleBill.vehicle}
                billData={vehicleBill.billData}
                onChange={(billData) => handleVehicleBillChange(index, billData)}
                onRemove={
                  vehicleBills.length > 1
                    ? () => handleRemoveVehicle(index)
                    : null
                }
                index={index}
              />
            ))}

            {vehicleBills.length === 0 && (
              <div className="bg-card rounded-lg border border-border p-6 text-center">
                <p className="text-muted-foreground">
                  No vehicles available for this owner
                </p>
              </div>
            )}
          </div>

          {/* Other Charges */}
          <OtherChargesForm
            charges={otherCharges}
            onChange={setOtherCharges}
          />

          {/* Summary */}
          {vehicleBills.length > 0 && (
            <div className="bg-card rounded-lg border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Vehicles</p>
                  <p className="text-lg font-bold text-foreground">
                    {vehicleBills.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Net Rent</p>
                  <p className="text-lg font-bold text-foreground">
                    ₹{totals.totalNetRent.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Other Charges</p>
                  <p className="text-lg font-bold text-foreground">
                    ₹{totals.totalOtherCharges.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Deductions</p>
                  <p className="text-lg font-bold text-error">
                    -₹{totals.totalDeductions.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Final Amount</p>
                  <p className="text-xl font-bold text-primary">
                    ₹{totals.finalAmount.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === "select_owner"}
          iconName="ArrowLeft"
          iconPosition="left"
        >
          Back
        </Button>

        {currentStep !== "preview" && (
          <Button
            variant="default"
            onClick={handleNext}
            disabled={loading}
            iconName="ArrowRight"
            iconPosition="right"
          >
            {currentStep === "select_owner" ? "Next" : "Preview"}
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-error/10 border border-error rounded-lg p-4">
          <p className="text-error text-sm">{error}</p>
        </div>
      )}
    </div>
  );
};

export default HissabGenerator;

