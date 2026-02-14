import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";

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
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contact Information */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-card-foreground">
            Contact Information
          </h3>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              iconName="Edit"
              iconSize={16}
            >
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="default" size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Input
            label="Full Name"
            type="text"
            value={formData?.name}
            onChange={(e) => handleInputChange("name", e?.target?.value)}
            disabled={!isEditing}
          />

          <Input
            label="Email Address"
            type="email"
            value={formData?.email}
            onChange={(e) => handleInputChange("email", e?.target?.value)}
            disabled={!isEditing}
          />

          <Input
            label="Phone Number"
            type="tel"
            value={formData?.phone}
            onChange={(e) => handleInputChange("phone", e?.target?.value)}
            disabled={!isEditing}
          />

          <Input
            label="Address"
            type="text"
            value={formData?.address}
            onChange={(e) => handleInputChange("address", e?.target?.value)}
            disabled={!isEditing}
          />

          <Input
            label="Emergency Contact"
            type="tel"
            value={formData?.emergencyContact}
            onChange={(e) =>
              handleInputChange("emergencyContact", e?.target?.value)
            }
            disabled={!isEditing}
          />

          <Input
            label="License Number"
            type="text"
            value={formData?.licenseNumber}
            onChange={(e) =>
              handleInputChange("licenseNumber", e?.target?.value)
            }
            disabled={!isEditing}
          />

          <Input
            label="Join Date"
            type="date"
            value={formData?.joinDate}
            onChange={(e) => handleInputChange("joinDate", e?.target?.value)}
            disabled={!isEditing}
          />
        </div>
      </div>
      {/* Vehicle Summary & Financial Snapshot */}
      <div className="space-y-6">
        {/* Bill options: Including Room */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Bill options
          </h3>
          <Checkbox
            id="including-room-profile"
            checked={!!owner?.includingRoom}
            onCheckedChange={(checked) => onIncludingRoomChange?.(!!checked)}
            label="Including room — include room rent in bill generation"
            description="When enabled, room rent is added when generating bills for this driver."
          />
        </div>

        {/* Vehicle Summary */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Vehicle Summary
          </h3>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {owner?.vehicles?.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Vehicles
              </div>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-success">
                {owner?.vehicles?.filter((v) => v?.status === "active")?.length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </div>

          <div className="space-y-2">
            {owner?.vehicles?.slice(0, 3)?.map((vehicle) => (
              <div
                key={vehicle?.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    name="Car"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <div>
                    <div className="font-medium text-sm">
                      {vehicle?.make} {vehicle?.model}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {vehicle?.plateNumber}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    vehicle?.status === "active"
                      ? "bg-success text-success-foreground"
                      : "bg-error text-error-foreground"
                  }`}
                >
                  {vehicle?.status}
                </span>
              </div>
            ))}

            {owner?.vehicles?.length > 3 && (
              <Button variant="ghost" size="sm" fullWidth className="mt-2">
                View All {owner?.vehicles?.length} Vehicles
              </Button>
            )}
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h3 className="text-lg font-semibold text-card-foreground mb-4">
            Financial Snapshot
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="DollarSign" size={16} className="text-success" />
                <span className="text-sm font-medium">Total Deposits</span>
              </div>
              <span className="font-semibold text-success">
                ${owner?.totalDeposits?.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="AlertCircle" size={16} className="text-warning" />
                <span className="text-sm font-medium">Outstanding Balance</span>
              </div>
              <span className="font-semibold text-warning">
                ${owner?.outstandingBalance?.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon name="TrendingUp" size={16} className="text-primary" />
                <span className="text-sm font-medium">Monthly Earnings</span>
              </div>
              <span className="font-semibold text-primary">
                ${owner?.monthlyEarnings?.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center space-x-2">
                <Icon
                  name="Calendar"
                  size={16}
                  className="text-muted-foreground"
                />
                <span className="text-sm font-medium">Last Payment</span>
              </div>
              <span className="font-medium">{owner?.lastPaymentDate}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
