import React, { useMemo, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { ACCOUNT_OPTIONS, getAccountLabel } from "../../../utils/accounts";

const CARD_CLASS = "bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden";
const CARD_PADDING = "p-6";
const BOX = "rounded-xl border border-border/80 bg-muted/30 p-4";
const SECTION_TITLE = "flex items-center gap-3 text-xl font-bold text-foreground";

const FinancialsTab = ({
  financialData,
  onTransactionAdd,
  onTransactionUpdate,
}) => {
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const getDefaultTransaction = () => ({
    type: "deposit",
    account: "",
    amount: "",
    description: "",
    date: new Date()?.toISOString()?.split("T")?.[0],
  });

  const [newTransaction, setNewTransaction] = useState(() =>
    getDefaultTransaction(),
  );

  const totalCollectedByAccount = useMemo(() => {
    const totals = { letzryd: 0, tawaaq_fleet: 0, cash_in_hand: 0 };
    (financialData?.transactions ?? []).forEach((t) => {
      const key =
        t?.account && totals[t.account] !== undefined ? t.account : "letzryd";
      if (t?.type === "deposit") totals[key] += Number(t?.amount) || 0;
    });
    return totals;
  }, [financialData?.transactions]);

  const amountNum = Number(newTransaction?.amount);
  const isFormValid = Boolean(
    newTransaction?.account &&
      (editingTransaction ? amountNum >= 0 : amountNum > 0) &&
      (newTransaction?.description?.trim() ?? ""),
  );

  const handleAddTransaction = () => {
    if (!isFormValid) return;
    const transaction = {
      ...newTransaction,
      id: `TXN${String(financialData?.transactions?.length + 1)?.padStart(4, "0")}`,
      amount: parseFloat(newTransaction?.amount),
      account: newTransaction?.account || "letzryd",
      timestamp: new Date()?.toISOString(),
      status: "completed",
    };
    onTransactionAdd(transaction);
    setNewTransaction(getDefaultTransaction());
    setShowAddTransaction(false);
  };

  const handleEditTransaction = (transaction) => {
    setEditingTransaction(transaction?.id);
    setNewTransaction({
      type: transaction?.type,
      account: transaction?.account || "letzryd",
      amount: transaction?.amount?.toString(),
      description: transaction?.description,
      date: transaction?.date,
    });
  };

  const handleUpdateTransaction = () => {
    if (!isFormValid) return;
    const updatedTransaction = {
      ...newTransaction,
      amount: parseFloat(newTransaction?.amount),
      account: newTransaction?.account || "letzryd",
    };
    onTransactionUpdate(editingTransaction, updatedTransaction);
    setEditingTransaction(null);
    setNewTransaction(getDefaultTransaction());
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "deposit":
        return "ArrowDownCircle";
      case "withdrawal":
        return "ArrowUpCircle";
      case "penalty":
        return "AlertTriangle";
      case "adjustment":
        return "Edit";
      default:
        return "DollarSign";
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case "deposit":
        return "text-success";
      case "withdrawal":
        return "text-error";
      case "penalty":
        return "text-warning";
      case "adjustment":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const getAmountDisplay = (type, amount) => {
    const prefix = type === "deposit" ? "+" : "-";
    return `${prefix}$${amount?.toLocaleString()}`;
  };

  const accountCards = [
    {
      key: "letzryd",
      label: "LetzRyd A/c",
      icon: "Building2",
    },
    {
      key: "tawaaq_fleet",
      label: "Tawaaq Fleet A/c",
      icon: "Car",
    },
    {
      key: "cash_in_hand",
      label: "Cash in hand",
      icon: "Wallet",
    },
  ];

  const statCards = [
    {
      key: "totalDeposits",
      label: "Deposit",
      icon: "DollarSign",
      class: "text-success",
      value: `$${Number(financialData?.totalDeposits)?.toLocaleString() ?? "0"}`,
    },
    {
      key: "outstandingBalance",
      label: "Outstanding Balance",
      icon: "AlertCircle",
      class: "text-warning",
      value: `$${Number(financialData?.outstandingBalance)?.toLocaleString() ?? "0"}`,
    },
    {
      key: "rentalDays",
      label: "Rental Days",
      icon: "CalendarDays",
      class: "text-primary",
      value: String(financialData?.rentalDays ?? 0),
    },
    {
      key: "availableBalance",
      label: "Available Balance",
      icon: "Wallet",
      class: "text-foreground",
      value: `$${Number(financialData?.availableBalance)?.toLocaleString() ?? "0"}`,
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Key statistics */}
      <div className={CARD_CLASS}>
        <div className={`${CARD_PADDING} border-b border-border/60`}>
          <h2 className={SECTION_TITLE}>
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon name="BarChart3" size={22} className="text-primary" />
            </span>
            Financial Overview
          </h2>
        </div>
        <div className={CARD_PADDING}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map(({ key, label, icon, class: colorClass, value }) => (
              <div key={key} className={`${BOX} border-border/80`}>
                <div className="flex items-center gap-2 mb-2">
                  <Icon name={icon} size={20} className={`shrink-0 ${colorClass}`} />
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
                    {label}
                  </span>
                </div>
                <div className={`text-2xl font-bold tabular-nums ${colorClass}`}>
                  {value}
                </div>
              </div>
            ))}
          </div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Amount collected by account
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {accountCards.map(({ key, label, icon }) => (
              <div key={key} className={`${BOX} flex items-center gap-3`}>
                <span className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon name={icon} size={22} className="text-primary" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {label}
                  </div>
                  <div className="text-xl font-bold text-foreground tabular-nums">
                    ${(totalCollectedByAccount?.[key] ?? 0)?.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className={CARD_CLASS}>
        <div className={`${CARD_PADDING} border-b border-border/60`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className={SECTION_TITLE}>
              <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="Receipt" size={22} className="text-primary" />
              </span>
              Transaction history
            </h2>
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                setNewTransaction(getDefaultTransaction());
                setShowAddTransaction(true);
                setEditingTransaction(null);
              }}
              iconName="Plus"
              iconPosition="left"
              iconSize={14}
            >
              Add transaction
            </Button>
          </div>
        </div>

        {(showAddTransaction || editingTransaction) && (
          <div className={`${CARD_PADDING} bg-muted/30 border-b border-border/60`}>
            <h3 className="text-sm font-semibold text-foreground mb-4">
              {editingTransaction ? "Edit transaction" : "New transaction"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                  <Icon name="ArrowDownCircle" size={14} className="text-muted-foreground shrink-0" />
                  Type
                </label>
                <select
                  value={newTransaction?.type}
                  onChange={(e) =>
                    setNewTransaction((prev) => ({
                      ...prev,
                      type: e?.target?.value,
                    }))
                  }
                  className="w-full h-10 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="deposit">Deposit</option>
                  <option value="withdrawal">Withdrawal</option>
                  <option value="penalty">Penalty</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>
              <Select
                label="Account"
                required
                options={ACCOUNT_OPTIONS}
                value={newTransaction?.account ?? ""}
                onChange={(v) =>
                  setNewTransaction((prev) => ({ ...prev, account: v ?? "" }))
                }
                placeholder="Select account"
              />
              <Input
                label="Amount"
                type="number"
                value={newTransaction?.amount}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    amount: e?.target?.value,
                  }))
                }
                placeholder="0.00"
              />
              <Input
                label="Date"
                type="date"
                value={newTransaction?.date}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    date: e?.target?.value,
                  }))
                }
              />
            </div>
            <div className="mb-4">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                <Icon name="FileText" size={14} className="text-muted-foreground shrink-0" />
                Description
              </label>
              <Input
                label=""
                type="text"
                value={newTransaction?.description}
                onChange={(e) =>
                  setNewTransaction((prev) => ({
                    ...prev,
                    description: e?.target?.value,
                  }))
                }
                placeholder="Transaction description"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAddTransaction(false);
                  setEditingTransaction(null);
                  setNewTransaction(getDefaultTransaction());
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={
                  editingTransaction
                    ? handleUpdateTransaction
                    : handleAddTransaction
                }
                disabled={!isFormValid}
              >
                {editingTransaction ? "Update" : "Add"} transaction
              </Button>
            </div>
          </div>
        )}

        <div className={CARD_PADDING}>
          <div className="space-y-2">
            {financialData?.transactions?.map((transaction) => (
              <div
                key={transaction?.id}
                className={`${BOX} flex items-center justify-between gap-4 hover:bg-muted/50 transition-colors`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-lg bg-background flex items-center justify-center shrink-0 border border-border/50 ${getTransactionColor(transaction?.type)}`}
                  >
                    <Icon
                      name={getTransactionIcon(transaction?.type)}
                      size={18}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-foreground">
                      {transaction?.description}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                      <Icon name="Calendar" size={12} className="shrink-0" />
                      <span>{transaction?.date}</span>
                      <span>·</span>
                      <span className="capitalize">{transaction?.type}</span>
                      {transaction?.account && (
                        <>
                          <span>·</span>
                          <span>{getAccountLabel(transaction.account)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-base font-semibold tabular-nums ${getTransactionColor(transaction?.type)}`}
                  >
                    {getAmountDisplay(
                      transaction?.type,
                      transaction?.amount,
                    )}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEditTransaction(transaction)}
                    iconName="Edit"
                    iconSize={14}
                  >
                    <span className="sr-only">Edit transaction</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {financialData?.transactions?.length === 0 && (
            <div className="text-center py-12 rounded-lg bg-muted/30 border border-dashed border-border">
              <Icon
                name="Receipt"
                size={40}
                className="mx-auto text-muted-foreground mb-3"
              />
              <h3 className="text-base font-medium text-foreground mb-1">
                No transactions yet
              </h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-sm mx-auto">
                Add the first transaction for this driver to see history here.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  setNewTransaction(getDefaultTransaction());
                  setShowAddTransaction(true);
                  setEditingTransaction(null);
                }}
                iconName="Plus"
                iconPosition="left"
                iconSize={14}
              >
                Add first transaction
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bills & Invoices */}
      <div className={CARD_CLASS}>
        <div className={`${CARD_PADDING} border-b border-border/60`}>
          <h2 className={SECTION_TITLE}>
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon name="Receipt" size={22} className="text-primary" />
            </span>
            Bills & Invoices
          </h2>
        </div>
        <div className={CARD_PADDING}>
          <div className="space-y-4">
            {financialData?.upcomingPayments?.map((payment) => (
              <div
                key={payment?.id}
                className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-sm"
              >
                <div className="p-5 border-b border-border/60 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name="FileText" size={24} className="text-primary" />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">
                        {payment?.description}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <Icon name="Calendar" size={14} className="shrink-0" />
                        Due {payment?.dueDate}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                      payment?.status === "pending"
                        ? "bg-warning/15 text-warning border border-warning/30"
                        : payment?.status === "overdue"
                          ? "bg-destructive/15 text-destructive border border-destructive/30"
                          : "bg-success/15 text-success border border-success/30"
                    }`}
                  >
                    {payment?.status}
                  </span>
                </div>
                <div className="p-5 bg-muted/20">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-muted-foreground">
                        Rent breakdown
                      </div>
                      <div className="text-sm text-foreground">
                        {payment?.description} — ${payment?.amount?.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-0.5">
                        Final amount
                      </div>
                      <div className="text-2xl font-bold text-foreground tabular-nums">
                        ${payment?.amount?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-3 border-t border-border/60">
                    <Button variant="outline" size="sm" iconName="Eye" iconPosition="left" iconSize={14}>
                      View
                    </Button>
                    <Button variant="outline" size="sm" iconName="Download" iconPosition="left" iconSize={14}>
                      Download
                    </Button>
                    {payment?.status === "pending" && (
                      <Button variant="default" size="sm" iconName="CreditCard" iconPosition="left" iconSize={14}>
                        Mark paid
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {!financialData?.upcomingPayments?.length && (
            <div className="text-center py-12 rounded-2xl bg-muted/20 border border-dashed border-border/80">
              <Icon name="CalendarCheck" size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-base font-semibold text-foreground mb-1">No bills</p>
              <p className="text-sm text-muted-foreground">Upcoming invoices will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialsTab;
