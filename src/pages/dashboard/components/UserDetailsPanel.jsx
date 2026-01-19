import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";

const UserDetailsPanel = ({
  user,
  onClose,
  onSave,
  onAuditView,
  roles = [],
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [loading, setLoading] = useState(false);

  // Update editData when user changes
  useEffect(() => {
    if (user) {
      setEditData({
        id: user.id,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        department: user.department || "",
        role: user.role || "",
        roleId: user.roleId || "",
        status: user.status || "active",
        ssoEnabled: user.ssoEnabled || false,
        mfaEnabled: user.mfaEnabled || false,
        permissions: user.permissions || [],
        avatarUrl: user.avatarUrl || "",
        bio: user.bio || "",
        lastLogin: user.lastLogin || null,
        createdAt: user.createdAt || null,
        updatedAt: user.updatedAt || null,
      });
    }
  }, [user]);

  // Generate role options from database roles
  const roleOptions = [
    { value: "", label: "Select Role" },
    ...roles.map((role) => ({
      value: role.id,
      label:
        role.display_name || role.role_name.replace("_", " ").toUpperCase(),
      description: role.description || "",
    })),
  ];

  const departmentOptions = [
    { value: "", label: "Select Department" },
    { value: "operations", label: "Operations" },
    { value: "finance", label: "Finance" },
    { value: "it", label: "IT" },
    { value: "hr", label: "Human Resources" },
    { value: "marketing", label: "Marketing" },
    { value: "sales", label: "Sales" },
    { value: "customer_support", label: "Customer Support" },
    { value: "research", label: "Research & Development" },
    { value: "legal", label: "Legal" },
    { value: "executive", label: "Executive" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  const permissions = [
    { id: "dashboard_view", label: "Dashboard View", category: "Dashboard" },
    { id: "tvp_management", label: "TVP Management", category: "TVP" },
    {
      id: "financial_reports",
      label: "Financial Reports",
      category: "Finance",
    },
    { id: "user_management", label: "User Management", category: "Admin" },
    { id: "system_settings", label: "System Settings", category: "System" },
    { id: "audit_logs", label: "Audit Logs", category: "Admin" },
  ];

  const auditLogs = [
    {
      id: 1,
      action: "Login",
      timestamp: new Date(Date.now() - 3600000),
      ip: "192.168.1.100",
      details: "Successful login from desktop",
    },
    {
      id: 2,
      action: "Role Change",
      timestamp: new Date(Date.now() - 86400000),
      ip: "192.168.1.100",
      details: "Role changed from Admin to Manager",
    },
    {
      id: 3,
      action: "Password Reset",
      timestamp: new Date(Date.now() - 172800000),
      ip: "192.168.1.100",
      details: "Password reset requested",
    },
  ];

  if (!user) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/20">
        <div className="text-center">
          <Icon
            name="Users"
            size={48}
            className="text-muted-foreground mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No User Selected
          </h3>
          <p className="text-muted-foreground">Select a user to view details</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      setLoading(true);
      console.log("UserDetailsPanel handleSave - editData:", editData); // Debug log

      // Prepare the data for saving
      const userData = {
        id: editData.id,
        email: editData.email,
        name: editData.name,
        phone: editData.phone,
        department: editData.department,
        roleId: editData.roleId,
        status: editData.status,
        ssoEnabled: editData.ssoEnabled,
        mfaEnabled: editData.mfaEnabled,
        avatarUrl: editData.avatarUrl,
        bio: editData.bio,
        // Profile data for the API
        profile: {
          fullName: editData.name,
          phone: editData.phone,
          department: editData.department,
          avatarUrl: editData.avatarUrl,
          bio: editData.bio,
        },
      };

      console.log("UserDetailsPanel handleSave - prepared userData:", userData); // Debug log
      await onSave(userData);
      console.log("UserDetailsPanel handleSave - onSave completed"); // Debug log
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save user:", error);
      // You might want to show an error message here
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset editData to original user data
    setEditData({
      id: user.id,
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      department: user.department || "",
      role: user.role || "",
      roleId: user.roleId || "",
      status: user.status || "active",
      ssoEnabled: user.ssoEnabled || false,
      mfaEnabled: user.mfaEnabled || false,
      permissions: user.permissions || [],
      avatarUrl: user.avatarUrl || "",
      bio: user.bio || "",
      lastLogin: user.lastLogin || null,
      createdAt: user.createdAt || null,
      updatedAt: user.updatedAt || null,
    });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="h-full bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <Icon name="User" size={20} className="text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {user?.name}
            </h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
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
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSave}
                loading={loading}
                iconName="Save"
                iconSize={16}
              >
                Save
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={16}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Profile Information */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Profile Information
            </h3>
            <div className="space-y-4">
              <Input
                label="Full Name"
                value={editData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={!isEditing}
                placeholder="Enter full name..."
              />
              <Input
                label="Email Address"
                type="email"
                value={editData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={!isEditing}
                placeholder="Enter email address..."
              />
              <Input
                label="Phone Number"
                type="tel"
                value={editData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                disabled={!isEditing}
                placeholder="Enter phone number..."
              />
              <Select
                label="Department"
                options={departmentOptions}
                value={editData.department}
                onChange={(value) => handleInputChange("department", value)}
                disabled={!isEditing}
              />
              <Input
                label="Avatar URL"
                type="url"
                value={editData.avatarUrl}
                onChange={(e) => handleInputChange("avatarUrl", e.target.value)}
                disabled={!isEditing}
                placeholder="Enter avatar image URL..."
              />
              <Input
                label="Bio"
                type="textarea"
                value={editData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={!isEditing}
                placeholder="Enter user bio..."
              />
            </div>
          </div>

          {/* Account Settings */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Account Settings
            </h3>
            <div className="space-y-4">
              <Select
                label="Role"
                options={roleOptions}
                value={editData.roleId}
                onChange={(value) => handleInputChange("roleId", value)}
                disabled={!isEditing}
              />

              <Select
                label="Status"
                options={statusOptions}
                value={editData.status}
                onChange={(value) => handleInputChange("status", value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Security Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon
                    name="Shield"
                    size={16}
                    className={
                      editData.ssoEnabled
                        ? "text-success"
                        : "text-muted-foreground"
                    }
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      SSO Authentication
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Single Sign-On integration
                    </p>
                  </div>
                </div>
                {isEditing ? (
                  <Checkbox
                    checked={editData.ssoEnabled}
                    onCheckedChange={(checked) =>
                      handleInputChange("ssoEnabled", checked)
                    }
                  />
                ) : (
                  <div
                    className={`px-2 py-1 text-xs rounded-full ${
                      editData.ssoEnabled
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {editData.ssoEnabled ? "Enabled" : "Disabled"}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon
                    name="Smartphone"
                    size={16}
                    className={
                      editData.mfaEnabled
                        ? "text-primary"
                        : "text-muted-foreground"
                    }
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Multi-Factor Authentication
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Additional security layer
                    </p>
                  </div>
                </div>
                {isEditing ? (
                  <Checkbox
                    checked={editData.mfaEnabled}
                    onCheckedChange={(checked) =>
                      handleInputChange("mfaEnabled", checked)
                    }
                  />
                ) : (
                  <div
                    className={`px-2 py-1 text-xs rounded-full ${
                      editData.mfaEnabled
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {editData.mfaEnabled ? "Enabled" : "Disabled"}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon
                    name="Clock"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Active Sessions
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current login sessions
                    </p>
                  </div>
                </div>
                <div className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground">
                  {user?.sessionCount || 0} sessions
                </div>
              </div>
            </div>
          </div>

          {/* Account Information */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Account Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon
                    name="Calendar"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Last Login
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Most recent sign in
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(editData.lastLogin)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon
                    name="Plus"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Created At
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Account creation date
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(editData.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Icon
                    name="RefreshCw"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Last Updated
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Profile last modified
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {formatDate(editData.updatedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground">
                Recent Activity
              </h3>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onAuditView(user)}
                iconName="ExternalLink"
                iconSize={14}
              >
                View All
              </Button>
            </div>
            <div className="space-y-2">
              {auditLogs?.slice(0, 3)?.map((log) => (
                <div
                  key={log?.id}
                  className="flex items-center justify-between p-2 bg-muted/20 rounded-lg"
                >
                  <div className="flex items-center space-x-2">
                    <Icon
                      name="Activity"
                      size={14}
                      className="text-muted-foreground"
                    />
                    <div>
                      <p className="text-xs font-medium text-foreground">
                        {log?.action}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {log?.details}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {log?.timestamp?.toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{log?.ip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsPanel;
