import React from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import {
  ACCOUNT_OPTIONS,
  DEPOSIT_LEDGER_OPTIONS,
  PENALTY_LEDGER_OPTIONS,
  PAYMENT_TYPES_REQUIRING_ACCOUNT,
  getPaymentTypeLabel,
} from "../../../utils/accounts";
import {
  calculatePreviousWeek,
  calculateWeekFromDate,
} from "../../../pages/hissab-accounting-generator/components/WeekSelector";

const TransactionModal = ({
  isOpen,
  ledger,
  initialForm = {},
  isEdit = false,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  if (!isOpen) return null;

  const [form, setForm] = React.useState({
    paymentType: ledger === "deposit" ? "deposit_due" : "penalty_due",
    account: "",
    paymentAmount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    weekStart: "",
    weekEnd: "",
    paymentMethod: "",
    referenceNumber: "",
    notes: "",
    screenshot: null,
    ...initialForm,
  });
  const screenshotRef = React.useRef(null);

  const defaultWeek = React.useMemo(() => calculatePreviousWeek(), []);

  React.useEffect(() => {
    if (isOpen) {
      const week = initialForm.weekStart && initialForm.weekEnd
        ? { weekStart: initialForm.weekStart, weekEnd: initialForm.weekEnd }
        : defaultWeek;
      setForm({
        paymentType: initialForm.paymentType ?? (ledger === "deposit" ? "deposit_due" : "penalty_due"),
        account: initialForm.account ?? "",
        paymentAmount: initialForm.paymentAmount ?? "",
        paymentDate: initialForm.paymentDate ?? new Date().toISOString().split("T")[0],
        weekStart: initialForm.weekStart ?? week.weekStart ?? "",
        weekEnd: initialForm.weekEnd ?? week.weekEnd ?? "",
        paymentMethod: initialForm.paymentMethod ?? "",
        referenceNumber: initialForm.referenceNumber ?? "",
        notes: initialForm.notes ?? "",
        screenshot: null,
      });
    }
  }, [isOpen, ledger, defaultWeek, initialForm.paymentType, initialForm.account, initialForm.paymentAmount, initialForm.paymentDate, initialForm.weekStart, initialForm.weekEnd, initialForm.paymentMethod, initialForm.referenceNumber, initialForm.notes]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  const options = ledger === "deposit" ? DEPOSIT_LEDGER_OPTIONS : PENALTY_LEDGER_OPTIONS;
  const title = ledger === "deposit" ? "Deposit Transaction" : "Penalty and Refund Transaction";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ledger === "deposit" ? "bg-primary/20" : "bg-error/20"}`}>
              <Icon name="CreditCard" size={20} className={ledger === "deposit" ? "text-primary" : "text-error"} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">{isEdit ? "Edit" : "Add"} {title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {ledger === "deposit" ? "Due reduces deposit; Refund/Paid add to deposit" : "Due increases outstanding; Paid/Refund reduce outstanding. Other: add to bill for selected week."}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            iconSize={18}
            onClick={onClose}
          />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Transaction Type"
              value={form.paymentType}
              onChange={(v) => {
                const newType = v ?? form.paymentType;
                const updates = { ...form, paymentType: newType };
                if ((newType === "penalty_other" || newType === "accident_due") && (!form.weekStart || !form.weekEnd)) {
                  updates.weekStart = defaultWeek.weekStart;
                  updates.weekEnd = defaultWeek.weekEnd;
                }
                setForm(updates);
              }}
              options={options}
              required
            />
            {PAYMENT_TYPES_REQUIRING_ACCOUNT.includes(form.paymentType) && (
              <Select
                label="Account"
                required
                options={ACCOUNT_OPTIONS}
                value={form.account ?? ""}
                onChange={(v) => setForm({ ...form, account: v ?? "" })}
                placeholder="Select account"
              />
            )}
            {ledger === "penalty" && (form.paymentType === "penalty_other" || form.paymentType === "accident_due") && (
              <>
                <Input
                  label="Week start (Monday)"
                  type="date"
                  value={form.weekStart}
                  onChange={(e) => {
                    const v = e.target.value;
                    const week = calculateWeekFromDate(v);
                    setForm((f) => ({ ...f, weekStart: week.weekStart, weekEnd: week.weekEnd }));
                  }}
                  required
                />
                <Input
                  label="Week end (Sunday)"
                  type="date"
                  value={form.weekEnd}
                  onChange={(e) => setForm({ ...form, weekEnd: e.target.value })}
                  required
                />
              </>
            )}
            <Input
              label="Amount (₹)"
              type="number"
              min="0"
              step="0.01"
              value={form.paymentAmount}
              onChange={(e) => setForm({ ...form, paymentAmount: e.target.value })}
              required
            />
            <Input
              label="Date"
              type="date"
              value={form.paymentDate}
              onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              required
            />
            <Input
              label="Payment Method"
              placeholder="Cash, UPI, Bank Transfer, etc."
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            />
            <Input
              label="Reference Number"
              placeholder="Transaction ID, Receipt No, etc."
              value={form.referenceNumber}
              onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })}
            />
          </div>
          <Input
            label="Notes"
            placeholder="Additional notes"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Screenshot (Optional)</label>
            <input
              ref={screenshotRef}
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, screenshot: e.target.files?.[0] || null })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {form.screenshot && (
              <p className="text-xs text-muted-foreground mt-1">Selected: {form.screenshot.name}</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={
                !form.paymentAmount ||
                (PAYMENT_TYPES_REQUIRING_ACCOUNT.includes(form.paymentType) && !form.account) ||
                ((form.paymentType === "penalty_other" || form.paymentType === "accident_due") && (!form.weekStart || !form.weekEnd)) ||
                submitting
              }
              className={
                ["deposit_due", "deposit"].includes(form.paymentType)
                  ? "bg-primary hover:bg-primary/90"
                  : ["deposit_refund", "deposit_paid"].includes(form.paymentType)
                  ? "bg-amber-600 hover:bg-amber-700"
                  : ["penalty_refund"].includes(form.paymentType)
                  ? "bg-blue-600 hover:bg-blue-700"
                  : ["penalty_due", "due", "accident_due"].includes(form.paymentType)
                  ? "bg-amber-600 hover:bg-amber-700"
                  : form.paymentType === "penalty_other"
                  ? "bg-muted hover:bg-muted/90 text-foreground"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }
            >
              {submitting ? "Saving…" : (isEdit ? "Save changes" : `Add ${getPaymentTypeLabel(form.paymentType)?.split(" (")[0] || "Transaction"}`)}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
