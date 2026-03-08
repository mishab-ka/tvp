import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/AppIcon";
import MobileHeader from "./components/MobileHeader";
import Button from "../../components/ui/Button";
import { formatCurrency } from "../../utils/formatters";

export default function DriverOutstanding({ driver }) {
  const navigate = useNavigate();
  const outstanding = Number(driver?.outstandingBalance ?? 0);

  return (
    <div className="min-h-full bg-muted/30">
      <MobileHeader title="Outstanding Payments" />
      <div className="p-4 space-y-6">
        <div className="rounded-2xl border-2 border-destructive/50 bg-destructive/5 p-6 text-center shadow-sm">
          <Icon name="AlertTriangle" size={40} className="text-destructive mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground mb-1">Unpaid balance</p>
          <p className="text-3xl font-bold text-destructive tabular-nums">{formatCurrency(outstanding)}</p>
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Pay your outstanding amount to avoid penalties. Contact support for payment options.
        </p>
        <Button
          variant="default"
          size="lg"
          fullWidth
          iconName="CreditCard"
          iconPosition="left"
          onClick={() => {}}
        >
          Pay now
        </Button>
        <button
          type="button"
          onClick={() => navigate("/driver/support")}
          className="w-full py-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground"
        >
          Contact Support
        </button>
      </div>
    </div>
  );
}
