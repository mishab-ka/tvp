import React from "react";
import Icon from "../../../components/AppIcon";
import { formatCurrency } from "../../../utils/formatters";
import Button from "../../../components/ui/Button";

const ReportPreview = ({
  reportData,
  isGenerating,
  onExport,
  onSave,
  previewMode = "summary",
}) => {
  const formatDate = (date) => {
    return new Date(date)?.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (isGenerating) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Generating report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Icon
              name="FileText"
              size={48}
              className="text-muted-foreground mx-auto mb-4"
            />
            <p className="text-muted-foreground">
              Configure parameters to generate report preview
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Report Preview
          </h3>
          <p className="text-sm text-muted-foreground">
            Generated on {formatDate(new Date())} • {reportData?.totalOwners}{" "}
            TVP Owners
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport("pdf")}
            iconName="Download"
            iconPosition="left"
            iconSize={16}
          >
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport("excel")}
            iconName="FileSpreadsheet"
            iconPosition="left"
            iconSize={16}
          >
            Export Excel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={onSave}
            iconName="Save"
            iconPosition="left"
            iconSize={16}
          >
            Save Report
          </Button>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="p-6 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(reportData?.summary?.totalRevenue)}
                </p>
              </div>
              <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                <Icon name="DollarSign" size={20} className="text-success" />
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trips</p>
                <p className="text-2xl font-bold text-foreground">
                  {reportData?.summary?.totalTrips?.toLocaleString()}
                </p>
              </div>
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon name="Car" size={20} className="text-primary" />
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net Outstanding</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(reportData?.summary?.netOutstanding)}
                </p>
              </div>
              <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
                <Icon name="AlertCircle" size={20} className="text-warning" />
              </div>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Vehicles</p>
                <p className="text-2xl font-bold text-foreground">
                  {reportData?.summary?.activeVehicles}
                </p>
              </div>
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Icon name="Truck" size={20} className="text-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Detailed Breakdown */}
      <div className="p-6">
        <div className="space-y-6">
          {/* TVP Owner Details */}
          <div>
            <h4 className="text-md font-semibold text-foreground mb-4">
              TVP Owner Breakdown
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Owner ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                      Name
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Vehicles
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Daily Rent
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Trips
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Earnings
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                      Outstanding
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.owners?.slice(0, 10)?.map((owner, index) => (
                    <tr key={owner?.id} className="border-b border-border/50">
                      <td className="py-3 px-4 text-sm font-mono text-foreground">
                        {owner?.id}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground">
                        {owner?.name}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-foreground">
                        {owner?.vehicleCount}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-foreground">
                        {formatCurrency(owner?.dailyRent)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-foreground">
                        {owner?.trips}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-success">
                        {formatCurrency(owner?.earnings)}
                      </td>
                      <td className="py-3 px-4 text-sm text-right text-warning">
                        {formatCurrency(owner?.outstanding)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reportData?.owners?.length > 10 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Showing 10 of {reportData?.owners?.length} TVP owners. Full
                  details available in exported report.
                </p>
              </div>
            )}
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-semibold text-foreground mb-4">
                Revenue Breakdown
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Daily Rent Collection
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(reportData?.breakdown?.dailyRent)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Trip Bonuses
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(reportData?.breakdown?.bonuses)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Performance Incentives
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(reportData?.breakdown?.incentives)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Document Charges
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {formatCurrency(reportData?.breakdown?.documentCharges)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold text-foreground mb-4">
                Deductions & Adjustments
              </h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Toll Charges
                  </span>
                  <span className="text-sm font-medium text-error">
                    -{formatCurrency(reportData?.deductions?.tolls)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Penalties
                  </span>
                  <span className="text-sm font-medium text-error">
                    -{formatCurrency(reportData?.deductions?.penalties)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Chalan Fines
                  </span>
                  <span className="text-sm font-medium text-error">
                    -{formatCurrency(reportData?.deductions?.fines)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">
                    Accident Costs
                  </span>
                  <span className="text-sm font-medium text-error">
                    -{formatCurrency(reportData?.deductions?.accidents)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPreview;
