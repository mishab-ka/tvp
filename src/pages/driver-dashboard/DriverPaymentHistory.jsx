import React, { useEffect, useState } from "react";
import Icon from "../../components/AppIcon";
import MobileHeader from "./components/MobileHeader";
import { formatCurrency } from "../../utils/formatters";
import { getDriverPayments } from "../../lib/tvpManagementAPI";

export default function DriverPaymentHistory({ driver }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driver?.id) return;
    getDriverPayments(driver.id)
      .then(setPayments)
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, [driver?.id]);

  const isPaidType = (t) =>
    ["paid", "penalty_paid", "deposit_paid", "deposit_refund", "penalty_refund", "accident_paid"].includes(t);
  const formatPaymentType = (t) => {
    const labels = {
      paid: "Payment",
      due: "Due",
      refund: "Refund",
      deposit: "Deposit",
      deposit_due: "Deposit due",
      deposit_refund: "Deposit refund",
      deposit_paid: "Deposit paid",
      penalty_due: "Penalty due",
      penalty_refund: "Penalty refund",
      penalty_paid: "Penalty paid",
      penalty_other: "Penalty (other)",
      accident_due: "Accident due",
      accident_paid: "Accident paid",
      bill: "Bill",
    };
    return labels[t] || (t || "").replace(/_/g, " ");
  };

  const DEPOSIT_TYPES = ["deposit", "deposit_due", "deposit_paid", "deposit_refund"];
  const PENALTY_REFUND_TYPES = ["penalty_due", "penalty_paid", "penalty_refund", "penalty_other", "accident_due", "accident_paid", "refund"];

  const [activeTab, setActiveTab] = useState("all"); // 'deposit' | 'penalty_refund' | 'all'

  const filteredPayments = (() => {
    if (activeTab === "deposit") return payments.filter((p) => DEPOSIT_TYPES.includes(p.payment_type));
    if (activeTab === "penalty_refund") return payments.filter((p) => PENALTY_REFUND_TYPES.includes(p.payment_type));
    return payments;
  })();

  return (
    <div className="min-h-full bg-muted/30">
      <MobileHeader title="Payment History" />
      <div className="p-4 space-y-4">
        {/* Summary card */}
        <div className="rounded-xl bg-card border border-border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="Wallet" size={20} className="text-primary" />
            <span className="font-semibold text-foreground">Earnings & Payments</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Deposit</span>
              <span className="font-medium text-success tabular-nums">{formatCurrency(driver?.depositAmount ?? 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Outstanding Balance</span>
              <span className="font-medium text-destructive tabular-nums">
                {formatCurrency(Math.abs(driver?.outstandingBalance ?? 0))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Penalty</span>
              <span className="font-medium text-destructive tabular-nums">{formatCurrency(driver?.penaltyAmount ?? 0)}</span>
            </div>
          </div>
          {(driver?.outstandingBalance ?? 0) > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
              <Icon name="AlertTriangle" size={18} className="text-destructive shrink-0" />
              <p className="text-sm text-destructive font-medium">You have pending payment balance.</p>
            </div>
          )}
        </div>

        {/* Performance */}
        <div className="rounded-xl bg-card border border-border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="BarChart3" size={20} className="text-primary" />
            <span className="font-semibold text-foreground">Performance</span>
          </div>
          <div className="space-y-2 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Score</span>
                <span className="font-medium">{driver?.performance ?? 0}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, driver?.performance ?? 0)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Delay</span>
              <span className="text-foreground">{driver?.paymentDelayDays ?? 0} Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rental Days</span>
              <span className="text-foreground">{driver?.cumulativeRentalDays ?? 0} Days</span>
            </div>
          </div>
        </div>

        {/* Recent payments list */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Icon name="List" size={18} className="text-foreground" />
            <span className="font-semibold text-foreground">Recent Payments</span>
          </div>
          {/* Tabs */}
          <div className="flex rounded-lg border border-border bg-muted/30 p-1 mb-3">
            <button
              type="button"
              onClick={() => setActiveTab("deposit")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "deposit" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Deposit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("penalty_refund")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "penalty_refund" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Penalty & Refund
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All
            </button>
          </div>
          {loading ? (
            <div className="rounded-xl bg-card border border-border p-6 text-center text-muted-foreground text-sm">
              Loading…
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="rounded-xl bg-card border border-border shadow-sm p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {payments.length === 0
                  ? "Payment history will appear here once available."
                  : activeTab === "deposit"
                    ? "No deposit transactions."
                    : activeTab === "penalty_refund"
                      ? "No penalty or refund transactions."
                      : "No transactions."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPayments.slice(0, 20).map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl bg-card border border-border shadow-sm p-4 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-medium text-foreground tabular-nums">
                      {Number(p.payment_amount) >= 0 ? formatCurrency(p.payment_amount) : `- ${formatCurrency(Math.abs(p.payment_amount))}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.payment_date ? new Date(p.payment_date).toLocaleDateString() : "—"} · {formatPaymentType(p.payment_type)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-lg ${
                      isPaidType(p.payment_type) ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isPaidType(p.payment_type) ? "Paid" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
