import React, { useState, useEffect } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Icon from "../../../components/AppIcon";
import WeekSelector, { calculatePreviousWeek } from "../../hissab-accounting-generator/components/WeekSelector";
import { createDriverPayment } from "../../../lib/tvpManagementAPI";

const AddPenaltyModal = ({
  isOpen,
  driver,
  onClose,
  onSubmit,
  submitting: submittingProp = false,
}) => {
  const [weekRange, setWeekRange] = useState(calculatePreviousWeek());
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submittingLocal, setSubmittingLocal] = useState(false);
  const submitting = submittingProp || submittingLocal;

  useEffect(() => {
    if (isOpen) {
      setWeekRange(calculatePreviousWeek());
      setAmount("");
      setNotes("");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen || !driver) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const num = Number(amount);
    if (!amount.trim() || isNaN(num) || num <= 0) {
      setError("Please enter a valid amount (greater than 0).");
      return;
    }
    if (!weekRange?.weekStart || !weekRange?.weekEnd) {
      setError("Please select a week.");
      return;
    }
    setError("");
    setSubmittingLocal(true);
    try {
      await createDriverPayment({
        driverId: driver.id,
        paymentType: "accident_due",
        paymentAmount: num,
        weekStart: weekRange.weekStart,
        weekEnd: weekRange.weekEnd,
        notes: notes?.trim() || undefined,
      });
      onSubmit?.();
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to add penalty");
    } finally {
      setSubmittingLocal(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-card rounded-lg border border-border shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border p-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-warning/20">
              <Icon name="AlertTriangle" size={20} className="text-warning" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Add penalty (by week)</h2>
              <p className="text-xs text-muted-foreground">
                Select the week below; this penalty will show on the bill when you generate a bill for that week. Driver: {driver?.name || driver?.tvpId}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={submitting}
            iconName="X"
            iconSize={18}
          />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="rounded-lg border border-border p-4 bg-muted/10">
            <p className="text-xs font-medium text-muted-foreground mb-2">Week for this penalty (bill week)</p>
            <WeekSelector value={weekRange} onChange={setWeekRange} />
          </div>

          <Input
            label="Amount (INR)"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            error={error}
            placeholder="e.g. 500"
          />

          <Input
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Accident on DD/MM"
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={submitting || !amount.trim()}
              iconName="Plus"
              iconPosition="left"
            >
              {submitting ? "Adding…" : "Add penalty"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPenaltyModal;
