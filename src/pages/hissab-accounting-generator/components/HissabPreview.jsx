import React from "react";
import Button from "../../../components/ui/Button";
import Icon from "../../../components/AppIcon";

const HissabPreview = ({ previewData, onEdit, onExport, onSaveDraft, loading }) => {
  if (!previewData) {
    return (
      <div className="bg-card rounded-lg border border-border p-6 text-center">
        <p className="text-muted-foreground">No preview data available</p>
      </div>
    );
  }

  const { owner, week, vehicles, otherCharges, totals } = previewData;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">
              TVP Owner
            </p>
            <p className="text-lg font-semibold text-foreground mt-1">
              {owner.tvpId} - {owner.name}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Week Period
            </p>
            <p className="text-lg font-semibold text-foreground mt-1">
              {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">
              Total Vehicles
            </p>
            <p className="text-lg font-semibold text-foreground mt-1">
              {vehicles.length}
            </p>
          </div>
        </div>
      </div>

      {/* Vehicle Bills Breakdown */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">
            Vehicle Bills Breakdown
          </h3>
        </div>
        <div className="divide-y divide-border">
          {vehicles.map((vehicleData, index) => {
            const { vehicle, billData } = vehicleData;
            return (
              <div key={vehicle?.id || index} className="p-6">
                <div className="mb-4">
                  <h4 className="text-md font-semibold text-foreground">
                    Vehicle {index + 1}: {vehicle?.car_number || "N/A"}
                  </h4>
                  {vehicle?.fleet_name && (
                    <p className="text-sm text-muted-foreground">
                      {vehicle.fleet_name}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Rental Days</p>
                    <p className="font-medium text-foreground">
                      {billData.rentalDays || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Trips</p>
                    <p className="font-medium text-foreground">
                      {billData.trips || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Daily Rent</p>
                    <p className="font-medium text-foreground">
                      ₹{billData.dailyRent?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Net Weekly Rent</p>
                    <p className="font-medium text-primary">
                      ₹{billData.netWeeklyRent?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Earnings</p>
                    <p className="font-medium text-foreground">
                      ₹{billData.totalEarnings?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cash Collect</p>
                    <p className="font-medium text-foreground">
                      ₹{billData.totalCashCollect?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Difference</p>
                    <p
                      className={`font-medium ${
                        (billData.difference || 0) >= 0
                          ? "text-success"
                          : "text-error"
                      }`}
                    >
                      {(billData.difference || 0) >= 0 ? "+" : ""}
                      ₹{billData.difference?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current OS</p>
                    <p
                      className={`font-medium ${
                        (billData.currentOS || 0) >= 0
                          ? "text-success"
                          : "text-error"
                      }`}
                    >
                      {(billData.currentOS || 0) >= 0 ? "+" : ""}
                      ₹{billData.currentOS?.toFixed(2) || "0.00"}
                    </p>
                  </div>
                </div>

                {/* Additional Charges for this vehicle */}
                {(billData.toll ||
                  billData.platformFee ||
                  billData.tds ||
                  billData.vehicleAdjustment ||
                  billData.rtoFine ||
                  billData.accident ||
                  billData.deadKm) && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Additional Charges
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      {billData.toll > 0 && (
                        <div>
                          <span className="text-muted-foreground">Toll: </span>
                          <span className="font-medium">-₹{billData.toll.toFixed(2)}</span>
                        </div>
                      )}
                      {billData.platformFee > 0 && (
                        <div>
                          <span className="text-muted-foreground">Driver Pass: </span>
                          <span className="font-medium">+₹{billData.platformFee.toFixed(2)}</span>
                        </div>
                      )}
                      {billData.tds > 0 && (
                        <div>
                          <span className="text-muted-foreground">TDS: </span>
                          <span className="font-medium">+₹{billData.tds.toFixed(2)}</span>
                        </div>
                      )}
                      {billData.vehicleAdjustment !== 0 && (
                        <div>
                          <span className="text-muted-foreground">Vehicle Adj: </span>
                          <span className="font-medium">
                            {billData.vehicleAdjustment >= 0 ? "+" : ""}
                            ₹{billData.vehicleAdjustment.toFixed(2)}
                          </span>
                        </div>
                      )}
                      {billData.rtoFine > 0 && (
                        <div>
                          <span className="text-muted-foreground">RTO Fine: </span>
                          <span className="font-medium">-₹{billData.rtoFine.toFixed(2)}</span>
                        </div>
                      )}
                      {billData.accident > 0 && (
                        <div>
                          <span className="text-muted-foreground">Accident: </span>
                          <span className="font-medium">-₹{billData.accident.toFixed(2)}</span>
                        </div>
                      )}
                      {billData.deadKm > 0 && (
                        <div>
                          <span className="text-muted-foreground">Dead KM: </span>
                          <span className="font-medium">-₹{billData.deadKm.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Other Charges */}
      {otherCharges.length > 0 && (
        <div className="bg-card rounded-lg border border-border">
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">
              Other Charges
            </h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      Amount (INR)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {otherCharges.map((charge, index) => (
                    <tr key={charge.id || index}>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {charge.description}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            charge.type === "+"
                              ? "bg-success/10 text-success"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          {charge.type === "+" ? "+ Add" : "- Subtract"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                        ₹{parseFloat(charge.amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Final Totals */}
      <div className="bg-card rounded-lg border-2 border-primary p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Final Summary
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Net Rent (All Vehicles)
            </span>
            <span className="text-lg font-semibold text-foreground">
              ₹{totals.totalNetRent.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Other Charges
            </span>
            <span
              className={`text-lg font-semibold ${
                totals.totalOtherCharges >= 0 ? "text-success" : "text-error"
              }`}
            >
              {totals.totalOtherCharges >= 0 ? "+" : ""}
              ₹{totals.totalOtherCharges.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Deductions
            </span>
            <span className="text-lg font-semibold text-error">
              -₹{totals.totalDeductions.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total Additions
            </span>
            <span className="text-lg font-semibold text-success">
              +₹{totals.totalAdditions.toFixed(2)}
            </span>
          </div>
          <div className="pt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold text-foreground">
                Final Amount
              </span>
              <span
                className={`text-2xl font-bold ${
                  totals.finalAmount >= 0 ? "text-primary" : "text-error"
                }`}
              >
                {totals.finalAmount >= 0 ? "+" : ""}
                ₹{totals.finalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={onEdit}
          disabled={loading}
          iconName="Edit"
          iconPosition="left"
        >
          Edit
        </Button>
        <Button
          variant="outline"
          onClick={onSaveDraft}
          disabled={loading}
          iconName="Save"
          iconPosition="left"
        >
          Save as Draft
        </Button>
        <Button
          variant="default"
          onClick={() => onExport("pdf")}
          disabled={loading}
          iconName="FileText"
          iconPosition="left"
        >
          Export PDF
        </Button>
        <Button
          variant="default"
          onClick={() => onExport("excel")}
          disabled={loading}
          iconName="Download"
          iconPosition="left"
        >
          Export Excel
        </Button>
      </div>
    </div>
  );
};

export default HissabPreview;



