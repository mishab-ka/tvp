import React from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const UnmatchedVehiclesPanel = ({
  unmatchedVehicles,
  vehicles,
  onClose,
  onMatch,
}) => {
  if (!unmatchedVehicles || unmatchedVehicles.length === 0) {
    return null;
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Unmatched Vehicles
          </h3>
          <p className="text-sm text-muted-foreground">
            {unmatchedVehicles.length} vehicle(s) from the PDF could not be matched to active vehicles
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          iconName="X"
          iconSize={20}
        />
      </div>

      <div className="space-y-3">
        {unmatchedVehicles.map((vehicle, index) => (
          <div
            key={index}
            className="border border-border rounded-lg p-4 bg-background"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="AlertTriangle" size={16} className="text-warning" />
                  <span className="font-medium text-foreground">
                    Vehicle: {vehicle.vehicleNumber || "Unknown"}
                  </span>
                </div>
                {vehicle.driverName && (
                  <p className="text-sm text-muted-foreground mb-1">
                    Driver: {vehicle.driverName}
                  </p>
                )}
                {vehicle.matchError && (
                  <p className="text-sm text-error">{vehicle.matchError}</p>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  Rental Days: {vehicle.rentalDays || 0} | Trips: {vehicle.trips || 0} | 
                  Earnings: {vehicle.totalEarnings?.toFixed(2) || "0.00"} INR
                </div>
              </div>
              <div className="ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMatch(vehicle.vehicleNumber, vehicle)}
                  iconName="Search"
                  iconPosition="left"
                >
                  Manual Match
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <Icon name="Info" size={16} className="inline mr-2" />
          These vehicles were not found in the active vehicles list. You can manually match them or add them to the system first.
        </p>
      </div>
    </div>
  );
};

export default UnmatchedVehiclesPanel;



