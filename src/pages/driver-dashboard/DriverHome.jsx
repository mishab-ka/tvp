import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/AppIcon";
import { formatCurrency } from "../../utils/formatters";
import { getDriverBills } from "../../lib/tvpManagementAPI";
import { useAuth } from "../../contexts/AuthContext";

export default function DriverHome({ driver }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(true);

  useEffect(() => {
    if (!driver?.id) return;
    getDriverBills(driver.id)
      .then(setBills)
      .catch(() => setBills([]))
      .finally(() => setBillsLoading(false));
  }, [driver?.id]);

  const outstanding = Number(driver?.outstandingBalance ?? 0);
  const deposit = Number(driver?.depositAmount ?? 0);
  const penalty = Number(driver?.penaltyAmount ?? 0);
  const prepaid = Number(driver?.prePaidRentAmount ?? 0);
  const vehicles = driver?.vehicleNumbers?.length ? driver.vehicleNumbers : [];
  const recentBill = bills[0];

  const formatDateRange = (bill) => {
    if (!bill?.week_start && !bill?.created_at) return "—";
    const start = bill.week_start ? new Date(bill.week_start) : new Date(bill.created_at);
    const end = bill.week_end ? new Date(bill.week_end) : new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    return `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} - ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  };

  return (
    <div className="min-h-full bg-muted/30">
      <header className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
              {driver?.profilePhotoUrl ? (
                <img src={driver.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon name="User" size={24} className="text-primary" />
              )}
            </div>
            <div>
              <h1 className="font-bold text-foreground">{driver?.name || "Driver"}</h1>
              <p className="text-xs text-success font-medium">ONLINE · Driver</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="p-2 rounded-lg hover:bg-muted/50 relative">
              <Icon name="Bell" size={22} className="text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive" />
            </button>
            <button type="button" onClick={() => navigate("/driver/profile")} className="p-2 rounded-lg hover:bg-muted/50">
              <Icon name="Settings" size={22} className="text-foreground" />
            </button>
            <button type="button" onClick={handleLogout} className="p-2 rounded-lg hover:bg-muted/50" title="Log out">
              <Icon name="LogOut" size={22} className="text-foreground" />
            </button>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Outstanding balance */}
        <div className="rounded-2xl border-2 border-destructive/50 bg-destructive/5 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Wallet" size={20} className="text-destructive" />
            <span className="text-sm font-semibold text-foreground">Outstanding Balance</span>
          </div>
          <p className="text-2xl font-bold text-destructive tabular-nums">{formatCurrency(outstanding)}</p>
        </div>

        {/* Financial cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-card border border-border shadow-sm p-3 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center mb-1">
              <Icon name="Wallet" size={18} className="text-success" />
            </div>
            <span className="text-xs text-muted-foreground">Deposit</span>
            <span className="text-sm font-bold text-success tabular-nums">{formatCurrency(deposit)}</span>
          </div>
          <div className="rounded-xl bg-card border border-border shadow-sm p-3 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center mb-1">
              <Icon name="AlertCircle" size={18} className="text-destructive" />
            </div>
            <span className="text-xs text-muted-foreground">Penalty</span>
            <span className="text-sm font-bold text-destructive tabular-nums">{formatCurrency(penalty)}</span>
          </div>
          <div className="rounded-xl bg-card border border-border shadow-sm p-3 flex flex-col items-center text-center">
            <div className="w-9 h-9 rounded-full bg-success/15 flex items-center justify-center mb-1">
              <Icon name="CreditCard" size={18} className="text-success" />
            </div>
            <span className="text-xs text-muted-foreground">Prepaid</span>
            <span className="text-sm font-bold text-success tabular-nums">{formatCurrency(prepaid)}</span>
          </div>
        </div>

        {/* Recent bill */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-foreground">Recent Bill</h2>
            <button type="button" onClick={() => navigate("/driver/bills")} className="text-sm text-primary font-medium">
              View all
            </button>
          </div>
          {billsLoading ? (
            <div className="rounded-xl bg-card border border-border p-6 text-center text-muted-foreground text-sm">
              Loading…
            </div>
          ) : recentBill ? (
            <div className="rounded-xl bg-card border border-border shadow-sm p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <p className="font-semibold text-foreground truncate">{recentBill.bill_number || "—"}</p>
                <span className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary font-medium shrink-0">
                  {recentBill.status || "GENERATED"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{formatDateRange(recentBill)}</p>
              <p className="text-sm text-destructive font-bold tabular-nums mb-3">
                Current OS: {formatCurrency(recentBill.current_os ?? 0)}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Icon name="Eye" size={14} /> View
                </button>
                <button
                  type="button"
                  className="flex-1 py-2 rounded-lg border border-border text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Icon name="Download" size={14} /> Download
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border p-6 text-center text-muted-foreground text-sm">
              No bills yet
            </div>
          )}
        </div>

        {/* Assigned vehicle */}
        <div>
          <h2 className="font-bold text-foreground mb-2">Assigned Vehicle</h2>
          {vehicles.length > 0 ? (
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Icon name="Car" size={24} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">VEHICLE</p>
                <p className="font-bold text-foreground">{vehicles[0]} · Assigned</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-lg bg-primary/20 text-primary font-medium">Good Condition</span>
            </div>
          ) : (
            <div className="rounded-xl bg-card border border-border p-4 text-center text-muted-foreground text-sm">
              No vehicle assigned
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="font-bold text-foreground mb-2">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => navigate("/driver/outstanding")}
              className="rounded-xl bg-card border border-border shadow-sm p-4 flex items-center gap-3 text-left hover:bg-muted/30"
            >
              <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Icon name="AlertTriangle" size={20} className="text-destructive" />
              </div>
              <span className="font-medium text-foreground">Outstanding</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/driver/bills")}
              className="rounded-xl bg-card border border-border shadow-sm p-4 flex items-center gap-3 text-left hover:bg-muted/30"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="FileText" size={20} className="text-primary" />
              </div>
              <span className="font-medium text-foreground">Bills</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
