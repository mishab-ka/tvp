import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";

const AddUserModal = ({ isOpen, onClose, onSave, roles = [] }) => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    phone: "",
    department: "",
    role: "",
    status: "active",
    ssoEnabled: false,
    mfaEnabled: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const departmentOptions = [
    { value: "", label: "Select Department" },
    { value: "operations", label: "Operations" },
    { value: "finance", label: "Finance" },
    { value: "it", label: "IT" },
    { value: "hr", label: "Human Resources" },
    { value: "marketing", label: "Marketing" },
    { value: "sales", label: "Sales" },
  ];

  const statusOptions = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  const roleOptions = [
    { value: "", label: "Select Role" },
    ...roles.map((role) => ({
      value: role.id,
      label:
        role.display_name || role.role_name.replace("_", " ").toUpperCase(),
    })),
  ];

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      phone: "",
      department: "",
      role: "",
      status: "active",
      ssoEnabled: false,
      mfaEnabled: false,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    // Role validation
    if (!formData.role) {
      newErrors.role = "Role is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        profile: {
          fullName: formData.fullName,
          phone: formData.phone,
          department: formData.department,
        },
        status: formData.status,
        roleId: formData.role,
        ssoEnabled: formData.ssoEnabled,
        mfaEnabled: formData.mfaEnabled,
      };

      await onSave(userData);
      onClose();
    } catch (error) {
      console.error("Failed to create user:", error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            Add New User
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={18}
          >
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Account Information */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="user@example.com"
                  error={errors.email}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Password *
                </label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  placeholder="Enter password"
                  error={errors.password}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Confirm Password *
                </label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  placeholder="Confirm password"
                  error={errors.confirmPassword}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Role *
                </label>
                <Select
                  options={roleOptions}
                  value={formData.role}
                  onChange={(value) => handleInputChange("role", value)}
                  placeholder="Select role"
                  error={errors.role}
                />
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Profile Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Full Name *
                </label>
                <Input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  placeholder="Enter full name"
                  error={errors.fullName}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Phone Number
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Department
                </label>
                <Select
                  options={departmentOptions}
                  value={formData.department}
                  onChange={(value) => handleInputChange("department", value)}
                  placeholder="Select department"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Status
                </label>
                <Select
                  options={statusOptions}
                  value={formData.status}
                  onChange={(value) => handleInputChange("status", value)}
                  placeholder="Select status"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div>
            <h3 className="text-lg font-medium text-foreground mb-4">
              Security Settings
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sso-enabled"
                  checked={formData.ssoEnabled}
                  onCheckedChange={(checked) =>
                    handleInputChange("ssoEnabled", checked)
                  }
                />
                <label
                  htmlFor="sso-enabled"
                  className="text-sm text-foreground cursor-pointer"
                >
                  Enable SSO (Single Sign-On)
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mfa-enabled"
                  checked={formData.mfaEnabled}
                  onCheckedChange={(checked) =>
                    handleInputChange("mfaEnabled", checked)
                  }
                />
                <label
                  htmlFor="mfa-enabled"
                  className="text-sm text-foreground cursor-pointer"
                >
                  Enable MFA (Multi-Factor Authentication)
                </label>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <Icon name="AlertTriangle" size={16} className="text-error" />
                <span className="text-sm text-error">{errors.submit}</span>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              loading={loading}
              iconName="UserPlus"
              iconSize={16}
            >
              Create User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
