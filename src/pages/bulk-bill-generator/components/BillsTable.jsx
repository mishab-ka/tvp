import React from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { formatCurrency } from "../../../utils/formatters";

const BillsTable = ({
  bills,
  selectedBills,
  onSelectBills,
  onEdit,
  onFinalize,
  onDelete,
  onExport,
  loading,
}) => {
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      onSelectBills(bills.map(b => b.id));
    } else {
      onSelectBills([]);
    }
  };

  const handleSelectBill = (billId, checked) => {
    if (checked) {
      onSelectBills([...selectedBills, billId]);
    } else {
      onSelectBills(selectedBills.filter(id => id !== billId));
    }
  };

  if (bills.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-12 text-center">
        <Icon name="FileText" size={48} className="mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium text-foreground mb-2">
          No draft bills found
        </p>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file to generate draft bills
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedBills.length === bills.length && bills.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-border"
                />
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Vehicle Number
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Driver Name
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Rental Days
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                Trips
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                Total Earnings
              </th>
              <th className="px-4 py-3 text-right text-sm font-semibold text-foreground">
                Current OS
              </th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {bills.map((bill) => (
              <tr
                key={bill.id}
                className="hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedBills.includes(bill.id)}
                    onChange={(e) => handleSelectBill(bill.id, e.target.checked)}
                    className="rounded border-border"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-foreground font-medium">
                  {bill.vehicle_number || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {bill.driver_name || "-"}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {bill.rental_days || 0}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {bill.trips || 0}
                </td>
                <td className="px-4 py-3 text-sm text-foreground text-right">
                  {formatCurrency(bill.total_earnings || 0)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground text-right">
                  {formatCurrency(bill.current_os || 0)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {bill.status === "generated" && onExport ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onExport(bill)}
                        iconName="Download"
                        iconSize={16}
                        title="Export PDF"
                        disabled={loading}
                      />
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(bill)}
                          iconName="Edit"
                          iconSize={16}
                          title="Edit"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onFinalize(bill.id)}
                          iconName="CheckCircle"
                          iconSize={16}
                          title="Finalize"
                          disabled={loading}
                        />
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(bill.id)}
                      iconName="Trash2"
                      iconSize={16}
                      title="Delete"
                      disabled={loading}
                      className="text-error hover:text-error"
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BillsTable;



