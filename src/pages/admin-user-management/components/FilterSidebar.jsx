import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";

const FilterSidebar = ({
  filters,
  onFiltersChange,
  onSaveFilter,
  savedFilters,
  onClose,
  roles = [],
  departments = [],
}) => {
  const [filterName, setFilterName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  const roleOptions = [
    { value: "", label: "All Roles" },
    ...roles.map((role) => ({
      value: role.role_name,
      label: role.role_name.replace("_", " ").toUpperCase(),
    })),
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
  ];

  const departmentOptions = [
    { value: "", label: "All Departments" },
    ...departments.map((dept) => ({
      value: dept,
      label: dept.charAt(0).toUpperCase() + dept.slice(1),
    })),
  ];

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      search: "",
      role: "",
      status: "",
      department: "",
      ssoEnabled: false,
      mfaEnabled: false,
      lastLoginDays: "",
    });
  };

  const handleSaveFilter = () => {
    if (filterName?.trim()) {
      onSaveFilter(filterName, filters);
      setFilterName("");
      setShowSaveDialog(false);
    }
  };

  const appliedFiltersCount = Object.values(filters)?.filter(
    (value) => value !== "" && value !== false
  )?.length;

  return (
    <div className="w-full h-full bg-card border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          <div className="flex items-center space-x-2">
            {appliedFiltersCount > 0 && (
              <>
                <span className="px-2 py-1 text-xs bg-primary/10 text-primary rounded-full font-medium">
                  {appliedFiltersCount} active
                </span>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleClearFilters}
                  iconName="X"
                  iconSize={14}
                >
                  Clear
                </Button>
              </>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onClose}
                iconName="X"
                iconSize={16}
                className="lg:hidden"
              >
                <span className="sr-only">Close filters</span>
              </Button>
            )}
          </div>
        </div>

        <Input
          type="search"
          placeholder="Search users..."
          value={filters?.search}
          onChange={(e) => handleFilterChange("search", e?.target?.value)}
          className="w-full"
        />
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Role Filter */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Role
          </label>
          <Select
            options={roleOptions}
            value={filters?.role}
            onChange={(value) => handleFilterChange("role", value)}
            placeholder="Select role"
            className="w-full"
          />
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Status
          </label>
          <Select
            options={statusOptions}
            value={filters?.status}
            onChange={(value) => handleFilterChange("status", value)}
            placeholder="Select status"
            className="w-full"
          />
        </div>

        {/* Department Filter */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Department
          </label>
          <Select
            options={departmentOptions}
            value={filters?.department}
            onChange={(value) => handleFilterChange("department", value)}
            placeholder="Select department"
            className="w-full"
          />
        </div>

        {/* Last Login Filter */}
        <div>
          <label className="text-sm font-medium text-foreground mb-3 block">
            Last Login
          </label>
          <Select
            options={[
              { value: "", label: "Any time" },
              { value: "1", label: "Last 24 hours" },
              { value: "7", label: "Last 7 days" },
              { value: "30", label: "Last 30 days" },
              { value: "90", label: "Last 90 days" },
            ]}
            value={filters?.lastLoginDays}
            onChange={(value) => handleFilterChange("lastLoginDays", value)}
            placeholder="Select time period"
            className="w-full"
          />
        </div>

        {/* Security Filters */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground block">
            Security
          </label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sso-enabled"
                checked={filters?.ssoEnabled}
                onCheckedChange={(checked) =>
                  handleFilterChange("ssoEnabled", checked)
                }
              />
              <label
                htmlFor="sso-enabled"
                className="text-sm text-foreground cursor-pointer"
              >
                SSO Enabled
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mfa-enabled"
                checked={filters?.mfaEnabled}
                onCheckedChange={(checked) =>
                  handleFilterChange("mfaEnabled", checked)
                }
              />
              <label
                htmlFor="mfa-enabled"
                className="text-sm text-foreground cursor-pointer"
              >
                MFA Enabled
              </label>
            </div>
          </div>
        </div>

        {/* Saved Filters */}
        {savedFilters?.length > 0 && (
          <div>
            <label className="text-sm font-medium text-foreground mb-3 block">
              Saved Filters
            </label>
            <div className="space-y-2">
              {savedFilters?.map((filter) => (
                <button
                  key={filter?.id}
                  onClick={() => onFiltersChange(filter?.filters)}
                  className="w-full text-left p-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                >
                  {filter?.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Save Filter Button */}
      <div className="p-4 border-t border-border flex-shrink-0">
        <Button
          variant="outline"
          onClick={() => setShowSaveDialog(true)}
          iconName="BookmarkPlus"
          iconSize={16}
          className="w-full"
        >
          Save Current Filter
        </Button>
      </div>

      {/* Save Filter Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Save Filter
            </h3>
            <Input
              type="text"
              placeholder="Filter name"
              value={filterName}
              onChange={(e) => setFilterName(e?.target?.value)}
              className="mb-4"
            />
            <div className="flex items-center justify-end space-x-2">
              <Button variant="ghost" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSaveFilter}
                disabled={!filterName?.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterSidebar;
