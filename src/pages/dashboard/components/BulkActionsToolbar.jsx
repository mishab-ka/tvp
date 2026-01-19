import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Select from "../../../components/ui/Select";

const BulkActionsToolbar = ({
  selectedUsers,
  onBulkAction,
  onClearSelection,
}) => {
  const [bulkAction, setBulkAction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const bulkActionOptions = [
    { value: "", label: "Select Action", disabled: true },
    { value: "activate", label: "Activate Users" },
    { value: "deactivate", label: "Deactivate Users" },
    { value: "suspend", label: "Suspend Users" },
    { value: "reset_password", label: "Reset Passwords" },
    { value: "change_role", label: "Change Role" },
    { value: "export", label: "Export Selected" },
    { value: "delete", label: "Delete Users" },
  ];

  const roleOptions = [
    { value: "super_admin", label: "Super Admin" },
    { value: "manager", label: "Manager" },
    { value: "admin", label: "Admin" },
  ];

  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers?.length === 0) return;

    setIsProcessing(true);
    try {
      await onBulkAction(bulkAction, selectedUsers);
      setBulkAction("");
    } catch (error) {
      console.error("Bulk action failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getActionIcon = (action) => {
    switch (action) {
      case "activate":
        return "UserCheck";
      case "deactivate":
        return "UserX";
      case "suspend":
        return "UserMinus";
      case "reset_password":
        return "Key";
      case "change_role":
        return "UserCog";
      case "export":
        return "Download";
      case "delete":
        return "Trash2";
      default:
        return "Play";
    }
  };

  const getActionVariant = (action) => {
    switch (action) {
      case "delete":
        return "destructive";
      case "suspend":
        return "warning";
      case "activate":
        return "success";
      default:
        return "default";
    }
  };

  if (selectedUsers?.length === 0) {
    return null;
  }

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mx-4 mt-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Icon
              name="CheckSquare"
              size={18}
              className="text-primary flex-shrink-0"
            />
            <span className="text-sm font-semibold text-foreground">
              {selectedUsers?.length} user
              {selectedUsers?.length !== 1 ? "s" : ""} selected
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <Select
            options={bulkActionOptions}
            value={bulkAction}
            onChange={setBulkAction}
            placeholder="Choose action"
            className="w-full sm:w-48"
          />

          {bulkAction && (
            <Button
              variant={getActionVariant(bulkAction)}
              size="sm"
              onClick={handleBulkAction}
              loading={isProcessing}
              iconName={getActionIcon(bulkAction)}
              iconSize={16}
              disabled={!bulkAction}
              className="w-full sm:w-auto"
            >
              Apply
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            iconName="X"
            iconSize={16}
            className="w-full sm:w-auto"
          >
            Clear Selection
          </Button>
        </div>
      </div>
      {/* Progress indicator for bulk operations */}
      {isProcessing && (
        <div className="mt-3">
          <div className="flex items-center space-x-2 mb-2">
            <Icon
              name="Loader2"
              size={16}
              className="text-primary animate-spin"
            />
            <span className="text-sm text-muted-foreground">
              Processing bulk action...
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full animate-pulse"
              style={{ width: "60%" }}
            ></div>
          </div>
        </div>
      )}
      {/* Action-specific options */}
      {bulkAction === "change_role" && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">New Role:</span>
            <Select
              options={roleOptions}
              placeholder="Select role"
              className="w-40"
            />
          </div>
        </div>
      )}
      {bulkAction === "delete" && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center space-x-2 text-error">
            <Icon name="AlertTriangle" size={16} />
            <span className="text-sm">
              Warning: This action cannot be undone. Users will be permanently
              deleted.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActionsToolbar;
