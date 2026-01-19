import React, { useState, useEffect } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import Icon from "../../../components/AppIcon";
import { 
  matchVehicleAndDriver, 
  createDraftBill,
  getAllTVPOwners 
} from "../../../lib/tvpManagementAPI";

const ManualMatchModal = ({ 
  unmatchedVehicle, 
  availableVehicles, 
  onClose, 
  onSuccess,
  loading 
}) => {
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [matching, setMatching] = useState(false);
  const [error, setError] = useState("");

  // Load drivers/TVP owners
  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const driversData = await getAllTVPOwners();
        setDrivers(driversData);
      } catch (err) {
        console.error("Error loading drivers:", err);
      }
    };
    loadDrivers();
  }, []);

  // Filter vehicles by search term
  const filteredVehicles = availableVehicles.filter((vehicle) => {
    const search = searchTerm.toLowerCase();
    return (
      vehicle.car_number?.toLowerCase().includes(search) ||
      vehicle.fleet_name?.toLowerCase().includes(search) ||
      vehicle.users?.name?.toLowerCase().includes(search)
    );
  });

  // Handle vehicle selection
  const handleVehicleSelect = async (vehicle) => {
    setSelectedVehicle(vehicle);
    setError("");

    // Try to match the vehicle to get driver info
    try {
      setMatching(true);
      const matchResult = await matchVehicleAndDriver(vehicle.car_number);
      
      if (matchResult.matched && matchResult.driver) {
        setSelectedDriver(matchResult.driver);
      } else if (matchResult.tvpOwner) {
        // Use TVP owner as driver fallback
        setSelectedDriver({
          id: matchResult.tvpOwner.id,
          tvpId: matchResult.tvpOwner.id,
          name: matchResult.tvpOwner.name,
        });
      }
    } catch (err) {
      console.error("Error matching vehicle:", err);
      setError("Could not automatically find driver. Please select manually.");
    } finally {
      setMatching(false);
    }
  };

  // Handle manual driver selection
  const handleDriverSelect = (driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    if (driver) {
      setSelectedDriver(driver);
    }
  };

  // Create draft bill with matched vehicle
  const handleCreateBill = async () => {
    if (!selectedVehicle) {
      setError("Please select a vehicle");
      return;
    }

    if (!selectedDriver) {
      setError("Please select a driver");
      return;
    }

    try {
      setMatching(true);
      setError("");

      // Create draft bill data
      const draftBillData = {
        driverId: selectedDriver.id,
        tvpId: selectedDriver.tvpId || selectedDriver.id || "",
        driverName: selectedDriver.name || "Unknown",
        vehicleNumber: selectedVehicle.car_number,
        rentalDays: unmatchedVehicle.rentalDays || 7,
        trips: unmatchedVehicle.trips || 0,
        dailyRent: unmatchedVehicle.dailyRent || 0,
        weeklyInsurance: unmatchedVehicle.weeklyInsurance || 210,
        doubleDriverCharge: unmatchedVehicle.doubleDriverCharge || 0,
        netWeeklyRent: unmatchedVehicle.netWeeklyRent || 0,
        totalEarnings: unmatchedVehicle.totalEarnings || 0,
        totalCashCollect: unmatchedVehicle.totalCashCollect || 0,
        difference: unmatchedVehicle.difference || 0,
        platformFee: unmatchedVehicle.platformFee || 0,
        toll: unmatchedVehicle.toll || 0,
        tds: unmatchedVehicle.tds || 0,
        vehicleAdjustment: unmatchedVehicle.vehicleAdjustment || 0,
        rtoFine: unmatchedVehicle.rtoFine || 0,
        accident: unmatchedVehicle.accident || 0,
        deadKm: unmatchedVehicle.deadKm || 0,
        currentOS: unmatchedVehicle.currentOS || 0,
      };

      await createDraftBill(draftBillData);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (err) {
      console.error("Error creating draft bill:", err);
      setError(err.message || "Failed to create draft bill");
    } finally {
      setMatching(false);
    }
  };

  const driverOptions = drivers.map(driver => ({
    value: driver.id,
    label: `${driver.name} (${driver.tvpId || driver.id})`,
  }));

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 px-4">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-background rounded-lg border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Manual Vehicle Match
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select a vehicle from the system to match with: {unmatchedVehicle?.vehicleNumber}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={matching || loading}
            iconName="X"
            iconSize={20}
          />
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Unmatched Vehicle Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Bill Data from PDF
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Vehicle:</span>
                <span className="ml-2 font-medium">{unmatchedVehicle?.vehicleNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Driver:</span>
                <span className="ml-2 font-medium">{unmatchedVehicle?.driverName || "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Trips:</span>
                <span className="ml-2 font-medium">{unmatchedVehicle?.trips || 0}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Earnings:</span>
                <span className="ml-2 font-medium">{unmatchedVehicle?.totalEarnings?.toFixed(2) || "0.00"} INR</span>
              </div>
            </div>
          </div>

          {/* Vehicle Selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Search and Select Vehicle
            </label>
            <Input
              placeholder="Search by vehicle number, fleet name, or owner name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              iconName="Search"
            />

            <div className="mt-3 border border-border rounded-lg max-h-64 overflow-y-auto">
              {filteredVehicles.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No vehicles found
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredVehicles.map((vehicle) => (
                    <button
                      key={vehicle.id}
                      onClick={() => handleVehicleSelect(vehicle)}
                      className={`w-full text-left p-4 hover:bg-muted/50 transition-colors ${
                        selectedVehicle?.id === vehicle.id ? "bg-primary/10 border-l-4 border-primary" : ""
                      }`}
                      disabled={matching}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">
                            {vehicle.car_number}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vehicle.fleet_name} • {vehicle.users?.name || "Unassigned"}
                          </div>
                        </div>
                        {selectedVehicle?.id === vehicle.id && (
                          <Icon name="CheckCircle" size={20} className="text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Driver Selection */}
          {selectedVehicle && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Driver / TVP Owner
              </label>
              {matching ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  Finding driver...
                </div>
              ) : (
                <Select
                  options={driverOptions}
                  value={selectedDriver?.id || ""}
                  onChange={handleDriverSelect}
                  placeholder="Select driver or keep auto-selected"
                />
              )}
              {selectedDriver && (
                <div className="mt-2 text-sm text-muted-foreground">
                  Selected: {selectedDriver.name} ({selectedDriver.tvpId || selectedDriver.id})
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={matching || loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBill}
              disabled={!selectedVehicle || !selectedDriver || matching || loading}
            >
              {matching ? "Creating..." : "Create Draft Bill"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualMatchModal;

