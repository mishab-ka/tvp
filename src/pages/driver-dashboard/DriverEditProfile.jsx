import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/AppIcon";
import MobileHeader from "./components/MobileHeader";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import { updateTVPOwner } from "../../lib/tvpManagementAPI";

export default function DriverEditProfile({ driver }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (driver) {
      setName(driver.name || "");
      setPhone(driver.phone || "");
      setAddress(driver.address || "");
    }
  }, [driver]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!driver?.id) return;
    setSaving(true);
    setMessage(null);
    try {
      await updateTVPOwner(driver.id, {
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: driver.email,
        status: driver.status,
        category: driver.category,
        vehicleNumbers: driver.vehicleNumbers || [],
        depositAmount: driver.depositAmount,
        outstandingBalance: driver.outstandingBalance,
        cumulativeRentalDays: driver.cumulativeRentalDays,
        roomDeposit: driver.roomDeposit,
        prePaidRentAmount: driver.prePaidRentAmount,
        documentsCharge: driver.documentsCharge,
        includingRoom: driver.includingRoom,
      });
      setMessage("Profile updated.");
      setTimeout(() => navigate("/driver/profile"), 1500);
    } catch (err) {
      setMessage(err?.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-muted/30">
      <MobileHeader title="Edit Profile" />
      <div className="p-4">
        <div className="rounded-2xl bg-card border border-border shadow-sm p-6 flex flex-col items-center mb-6">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-4">
            {driver?.profilePhotoUrl ? (
              <img src={driver.profilePhotoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Icon name="User" size={48} className="text-primary" />
            )}
          </div>
          <p className="text-sm text-muted-foreground">Profile photo</p>
          <button type="button" className="mt-2 text-sm text-primary font-medium">
            Change photo
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message && (
            <div className={`p-3 rounded-lg text-sm ${message === "Profile updated." ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
              {message}
            </div>
          )}
          <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          <Input label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 9876543210" />
          <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Your address" />
          <Button type="submit" variant="default" fullWidth loading={saving} disabled={saving}>
            Save changes
          </Button>
        </form>
      </div>
    </div>
  );
}
