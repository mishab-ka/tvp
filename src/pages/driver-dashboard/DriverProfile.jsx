import React from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/AppIcon";
import MobileHeader from "./components/MobileHeader";
import { formatCurrency } from "../../utils/formatters";
import { useAuth } from "../../contexts/AuthContext";

export default function DriverProfile({ driver }) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };
  const name = driver?.name || "Driver";
  const phone = driver?.phone || "—";
  const outstanding = Number(driver?.outstandingBalance ?? 0);
  const deposit = Number(driver?.depositAmount ?? 0);
  const penalty = Number(driver?.penaltyAmount ?? 0);
  const prepaid = Number(driver?.prePaidRentAmount ?? 0);
  const docCount = [driver?.documents?.aadharFrontUrl, driver?.documents?.aadharBackUrl, driver?.documents?.licenseFrontUrl, driver?.documents?.licenseBackUrl].filter(Boolean).length;

  const email = driver?.email || "—";
  const alt1 = driver?.alternativePhone1 || "—";
  const alt2 = driver?.alternativePhone2 || "—";
  const alt3 = driver?.alternativePhone3 || "—";
  const address = driver?.address || "—";
  const status = driver?.status
    ? String(driver.status).replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
    : "—";
  const joinDate = driver?.joinDate
    ? new Date(driver.joinDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  const category = driver?.category
    ? String(driver.category).replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
    : "—";
  const vehicles = driver?.vehicleNumbers?.length ? driver.vehicleNumbers : [];

  const detailRow = (label, value, icon) => (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
        <Icon name={icon} size={16} className="text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-foreground mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-full bg-muted/30">
      <MobileHeader
        title="Driver Profile"
        showBack={false}
        rightIcon="Settings"
        onRightClick={() => navigate("/driver/profile/edit")}
      />
      <div className="p-4 space-y-4">
        {/* Driver info card */}
        <div className="rounded-2xl bg-card border border-border shadow-sm p-6 flex flex-col items-center">
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
              {driver?.profilePhotoUrl ? (
                <img src={driver.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Icon name="User" size={48} className="text-primary" />
              )}
            </div>
            <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-success border-2 border-card" title="Online" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{name}</h2>
          <p className="text-sm text-muted-foreground">{phone}</p>
        </div>

        {/* Outstanding balance card */}
        <div className="rounded-2xl border-2 border-destructive/50 bg-destructive/5 p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="Wallet" size={20} className="text-destructive" />
            <span className="text-sm font-semibold text-foreground">Outstanding Balance</span>
          </div>
          <p className="text-2xl font-bold text-destructive tabular-nums">
            {formatCurrency(outstanding)}
          </p>
        </div>

        {/* Financial summary - 3 cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-card border border-border shadow-sm p-4 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center mb-2">
              <Icon name="Wallet" size={20} className="text-success" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Deposit</span>
            <span className="text-sm font-bold text-success tabular-nums mt-0.5">{formatCurrency(deposit)}</span>
          </div>
          <div className="rounded-xl bg-card border border-border shadow-sm p-4 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center mb-2">
              <Icon name="AlertCircle" size={20} className="text-destructive" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Penalty</span>
            <span className="text-sm font-bold text-destructive tabular-nums mt-0.5">{formatCurrency(penalty)}</span>
          </div>
          <div className="rounded-xl bg-card border border-border shadow-sm p-4 flex flex-col items-center text-center">
            <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center mb-2">
              <Icon name="CreditCard" size={20} className="text-success" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Prepaid</span>
            <span className="text-sm font-bold text-success tabular-nums mt-0.5">{formatCurrency(prepaid)}</span>
          </div>
        </div>

        {/* Driver details */}
        <div className="rounded-2xl bg-card border border-border shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Icon name="User" size={20} className="text-primary" />
            <span className="font-semibold text-foreground">Driver details</span>
          </div>
          <div className="divide-y divide-border">
            {detailRow("Email", email, "Mail")}
            {detailRow("Primary phone", phone, "Phone")}
            {detailRow("Alternative phone 1", alt1, "Phone")}
            {detailRow("Alternative phone 2", alt2, "Phone")}
            {detailRow("Alternative phone 3", alt3, "Phone")}
            {detailRow("Address", address, "MapPin")}
            {detailRow("Status", status, "UserCheck")}
            {detailRow("Join date", joinDate, "Calendar")}
            {detailRow("Category", category, "Tag")}
            {detailRow("Vehicles", vehicles.length ? vehicles.join(", ") : "—", "Car")}
          </div>
        </div>

        {/* Menu options */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate("/driver/profile/edit")}
            className="w-full rounded-xl bg-card border border-border shadow-sm p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon name="UserCog" size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Edit Profile</p>
              <p className="text-xs text-muted-foreground">Update your personal information</p>
            </div>
            <Icon name="ChevronRight" size={18} className="text-muted-foreground shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/driver/documents")}
            className="w-full rounded-xl bg-card border border-border shadow-sm p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon name="FileText" size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Documents</p>
              <p className="text-xs text-success font-medium">{docCount} VERIFIED</p>
            </div>
            <Icon name="ChevronRight" size={18} className="text-muted-foreground shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => navigate("/driver/support")}
            className="w-full rounded-xl bg-card border border-border shadow-sm p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon name="Headphones" size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Contact Support</p>
              <p className="text-xs text-muted-foreground">24/7 help center access</p>
            </div>
            <Icon name="ChevronRight" size={18} className="text-muted-foreground shrink-0" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-xl bg-card border border-border shadow-sm p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <Icon name="LogOut" size={20} className="text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground">Log out</p>
              <p className="text-xs text-muted-foreground">Sign out of your account</p>
            </div>
            <Icon name="ChevronRight" size={18} className="text-muted-foreground shrink-0" />
          </button>
        </div>
      </div>
    </div>
  );
}
