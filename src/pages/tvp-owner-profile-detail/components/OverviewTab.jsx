import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";

const CARD =
  "bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden";
const PADDING = "p-6";
const SECTION_TITLE =
  "flex items-center gap-3 text-xl font-bold text-foreground";
const BOX = "rounded-xl border border-border/80 bg-muted/30 p-4";

const OverviewTab = ({ owner, onUpdate, onIncludingRoomChange }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: owner?.name,
    email: owner?.email,
    phone: owner?.phone,
    address: owner?.address,
    emergencyContact: owner?.emergencyContact,
    licenseNumber: owner?.licenseNumber,
    joinDate: owner?.joinDate,
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: owner?.name,
      email: owner?.email,
      phone: owner?.phone,
      address: owner?.address,
      emergencyContact: owner?.emergencyContact,
      licenseNumber: owner?.licenseNumber,
      joinDate: owner?.joinDate,
    });
    setIsEditing(false);
  };

  const contactFields = [
    { key: "name", label: "Full Name", icon: "User" },
    { key: "email", label: "Email Address", icon: "Mail" },
    { key: "phone", label: "Phone Number", icon: "Phone" },
    { key: "address", label: "Address", icon: "MapPin" },
    { key: "emergencyContact", label: "Emergency Contact", icon: "PhoneCall" },
    { key: "licenseNumber", label: "License Number", icon: "CreditCard" },
    { key: "joinDate", label: "Join Date", icon: "Calendar" },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Contact Information */}
      <div className={CARD}>
        <div className={`${PADDING} border-b border-border/60`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h2 className={SECTION_TITLE}>
              <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="User" size={22} className="text-primary" />
              </span>
              Contact Information
            </h2>
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                iconName="Edit"
                iconSize={14}
              >
                Edit
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="default" size="sm" onClick={handleSave}>
                  Save
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className={PADDING}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contactFields.map(({ key, label, icon }) => (
              <div key={key} className={BOX}>
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <Icon name={icon} size={18} className="text-muted-foreground shrink-0" />
                  {label}
                </label>
                <Input
                  label=""
                  type={
                    key === "joinDate"
                      ? "date"
                      : key === "email"
                        ? "email"
                        : key === "phone" || key === "emergencyContact"
                          ? "tel"
                          : "text"
                  }
                  value={formData?.[key]}
                  onChange={(e) => handleInputChange(key, e?.target?.value)}
                  disabled={!isEditing}
                  className="bg-background border-border/80"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metrics */}
        <div className={CARD}>
          <div className={PADDING}>
            <h2 className={`${SECTION_TITLE} mb-5`}>
              <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="BarChart3" size={22} className="text-primary" />
              </span>
              Metrics
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`${BOX} text-center`}>
                <div className="text-3xl font-bold text-foreground tabular-nums">
                  {owner?.vehicles?.length ?? 0}
                </div>
                <div className="text-sm font-semibold text-muted-foreground mt-1">
                  Total Vehicles
                </div>
              </div>
              <div className={`${BOX} text-center`}>
                <div className="text-3xl font-bold text-success tabular-nums">
                  {owner?.vehicles?.filter((v) => v?.status === "active")?.length ?? 0}
                </div>
                <div className="text-sm font-semibold text-muted-foreground mt-1">
                  Active
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {owner?.vehicles?.slice(0, 3)?.map((vehicle) => (
                <div
                  key={vehicle?.id}
                  className="flex items-center justify-between gap-3 py-3 px-4 rounded-xl border border-border/80 bg-muted/20"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon name="Car" size={20} className="text-primary" />
                    </span>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">
                        {vehicle?.make} {vehicle?.model}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {vehicle?.plateNumber}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                      vehicle?.status === "active"
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                  >
                    {vehicle?.status}
                  </span>
                </div>
              ))}
              {owner?.vehicles?.length > 3 && (
                <Button variant="ghost" size="sm" fullWidth className="mt-2">
                  View all {owner?.vehicles?.length} vehicles
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className={CARD}>
          <div className={PADDING}>
            <h2 className={`${SECTION_TITLE} mb-5`}>
              <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="DollarSign" size={22} className="text-primary" />
              </span>
              Financial Information
            </h2>
            <div className="space-y-3">
              {[
                {
                  icon: "DollarSign",
                  label: "Total deposits",
                  value: owner?.totalDeposits,
                  valueClass: "text-success font-bold",
                  format: (v) => `$${Number(v)?.toLocaleString() ?? "0"}`,
                },
                {
                  icon: "AlertCircle",
                  label: "Outstanding balance",
                  value: owner?.outstandingBalance,
                  valueClass: "text-warning font-bold",
                  format: (v) => `$${Number(v)?.toLocaleString() ?? "0"}`,
                },
                {
                  icon: "TrendingUp",
                  label: "Monthly earnings",
                  value: owner?.monthlyEarnings,
                  valueClass: "text-primary font-bold",
                  format: (v) => `$${Number(v)?.toLocaleString() ?? "0"}`,
                },
                {
                  icon: "Calendar",
                  label: "Last payment",
                  value: owner?.lastPaymentDate,
                  valueClass: "text-foreground font-semibold",
                  format: (v) => v ?? "—",
                },
              ].map(({ icon, label, value, valueClass, format }) => (
                <div
                  key={label}
                  className={`${BOX} flex items-center justify-between gap-4`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon name={icon} size={20} className="text-muted-foreground shrink-0" />
                    <span className="font-semibold text-foreground">{label}</span>
                  </div>
                  <span className={`text-lg tabular-nums shrink-0 ${valueClass}`}>
                    {format(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={CARD}>
        <div className={PADDING}>
          <h2 className={`${SECTION_TITLE} mb-5`}>
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon name="Zap" size={22} className="text-primary" />
            </span>
            Quick Actions
          </h2>
          <div className={`${BOX}`}>
            <Checkbox
              id="including-room-profile"
              checked={!!owner?.includingRoom}
              onCheckedChange={(checked) => onIncludingRoomChange?.(!!checked)}
              label="Including room — include room rent in bill generation"
              description="When enabled, room rent is added when generating bills for this driver."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
