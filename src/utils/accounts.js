export const ACCOUNT_OPTIONS = [
  { value: "letzryd", label: "LetzRyd A/c" },
  { value: "tawaaq_fleet", label: "Tawaaq Fleet A/c" },
  { value: "cash_in_hand", label: "Cash In hand" },
];

export const getAccountLabel = (value) =>
  ACCOUNT_OPTIONS.find((o) => o.value === value)?.label ?? value ?? "—";

// Deposit Transaction ledger: Due (reduces), Refund (adds), Paid (adds)
export const DEPOSIT_LEDGER_OPTIONS = [
  { value: "deposit_due", label: "Due", sublabel: "Reduces deposit", color: "warning" },
  { value: "deposit_refund", label: "Refund", sublabel: "Adds to deposit", color: "info" },
  { value: "deposit_paid", label: "Paid", sublabel: "Adds to deposit", color: "success" },
];

// Penalty and Refund Transaction ledger: Due (increases), Paid/Refund (reduces)
export const PENALTY_LEDGER_OPTIONS = [
  { value: "penalty_due", label: "Due", sublabel: "Increases outstanding", color: "warning" },
  { value: "penalty_refund", label: "Refund", sublabel: "Reduces outstanding", color: "info" },
  { value: "penalty_paid", label: "Paid", sublabel: "Reduces outstanding", color: "success" },
];

// Combined options for forms that use a single dropdown
export const LEDGER_PAYMENT_OPTIONS = [
  ...DEPOSIT_LEDGER_OPTIONS.map((o) => ({ ...o, ledger: "deposit" })),
  ...PENALTY_LEDGER_OPTIONS.map((o) => ({ ...o, ledger: "penalty" })),
];

// All payment types that require account (all ledger types)
export const PAYMENT_TYPES_REQUIRING_ACCOUNT = [
  "deposit_due",
  "deposit_refund",
  "deposit_paid",
  "penalty_due",
  "penalty_refund",
  "penalty_paid",
  "paid",
  "refund",
];

// Legacy payment type options (for backward compatibility)
export const PAYMENT_TYPE_OPTIONS = [
  { value: "penalty_paid", label: "Paid (Reduces Outstanding)", color: "success" },
  { value: "penalty_due", label: "Due (Increases Outstanding)", color: "warning" },
  { value: "penalty_refund", label: "Refund (Reduces Outstanding)", color: "info" },
  { value: "deposit_due", label: "Deposit Due (Reduces Deposit)", color: "primary" },
  { value: "deposit_refund", label: "Deposit Refund (Adds to Deposit)", color: "error" },
  { value: "deposit_paid", label: "Deposit Paid (Adds to Deposit)", color: "error" },
];

export const getPaymentTypeLabel = (value) => {
  if (value === "bill") return "Bill (Ledger Entry)";
  const opt =
    LEDGER_PAYMENT_OPTIONS.find((o) => o.value === value) ||
    PAYMENT_TYPE_OPTIONS.find((o) => o.value === value);
  return opt?.label ?? value ?? "—";
};

export const getPaymentTypeColor = (value) => {
  if (value === "bill") return "muted";
  const opt =
    LEDGER_PAYMENT_OPTIONS.find((o) => o.value === value) ||
    PAYMENT_TYPE_OPTIONS.find((o) => o.value === value);
  return opt?.color ?? "muted";
};

export const getLedgerForType = (paymentType) => {
  if (["deposit_due", "deposit_refund", "deposit_paid", "deposit"].includes(paymentType)) {
    return "deposit";
  }
  return "penalty";
};
