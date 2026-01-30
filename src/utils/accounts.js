export const ACCOUNT_OPTIONS = [
  { value: "letzryd", label: "LetzRyd A/c" },
  { value: "tawaaq_fleet", label: "Tawaaq Fleet A/c" },
  { value: "cash_in_hand", label: "Cash In hand" },
];

export const getAccountLabel = (value) =>
  ACCOUNT_OPTIONS.find((o) => o.value === value)?.label ?? value ?? "—";
