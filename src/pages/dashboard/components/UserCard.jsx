import React from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const UserCard = ({
  user,
  onEdit,
  onToggleStatus,
  onResetPassword,
  isSelected,
  onSelect,
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-success bg-success/10";
      case "inactive":
        return "text-error bg-error/10";
      case "suspended":
        return "text-warning bg-warning/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "super_admin":
        return "text-error bg-error/10";
      case "manager":
        return "text-warning bg-warning/10";
      case "admin":
        return "text-primary bg-primary/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const formatLastLogin = (date) => {
    if (!date) return "Never";
    const now = new Date();
    const loginDate = new Date(date);
    const diffInHours = Math.floor((now - loginDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return loginDate?.toLocaleDateString();
  };

  return (
    <div
      className={`bg-card border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200 ${
        isSelected ? "ring-2 ring-primary border-primary" : ""
      }`}
    >
      {/* Header Section */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect(user?.id, e?.target?.checked)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
            />
          </div>
          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
            <Icon name="User" size={24} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground truncate mb-1">
              {user?.name}
            </h3>
            <p className="text-sm text-muted-foreground truncate mb-1">
              {user?.email}
            </p>
            <p className="text-xs text-muted-foreground">{user?.phone}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <span
            className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
              user?.status
            )}`}
          >
            {user?.status?.charAt(0)?.toUpperCase() + user?.status?.slice(1)}
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs text-muted-foreground block mb-1">Role</span>
          <span
            className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(
              user?.role
            )}`}
          >
            {user?.role?.replace("_", " ")?.toUpperCase()}
          </span>
        </div>
        <div>
          <span className="text-xs text-muted-foreground block mb-1">
            Department
          </span>
          <p className="text-sm font-medium text-foreground capitalize">
            {user?.department}
          </p>
        </div>
      </div>

      {/* Security & Session Info */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {user?.ssoEnabled && (
            <div className="flex items-center space-x-1">
              <Icon name="Shield" size={14} className="text-success" />
              <span className="text-xs text-success font-medium">SSO</span>
            </div>
          )}
          {user?.mfaEnabled && (
            <div className="flex items-center space-x-1">
              <Icon name="Smartphone" size={14} className="text-primary" />
              <span className="text-xs text-primary font-medium">MFA</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <Icon name="Clock" size={14} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {user?.sessionCount} sessions
          </span>
        </div>
      </div>

      {/* Last Login */}
      <div className="mb-4">
        <span className="text-xs text-muted-foreground block mb-1">
          Last Login
        </span>
        <p className="text-sm font-medium text-foreground">
          {formatLastLogin(user?.lastLogin)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2 pt-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(user)}
          iconName="Edit"
          iconSize={14}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleStatus(user)}
          iconName={user?.status === "active" ? "UserX" : "UserCheck"}
          iconSize={14}
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onResetPassword(user)}
          iconName="Key"
          iconSize={14}
        />
      </div>
    </div>
  );
};

export default UserCard;
