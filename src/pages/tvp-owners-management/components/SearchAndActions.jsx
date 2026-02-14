import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";

const SearchAndActions = ({
  onSearch,
  onExport,
  onAddOwner,
  onOpenSettings,
  onOpenFilterModal,
  totalOwners,
  filteredOwners,
  ownerCounts,
  canManageOwners = false,
  activeFilterCount = 0,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");

  const searchTypeOptions = [
    { value: "all", label: "All Fields" },
    { value: "name", label: "Owner Name" },
    { value: "tvpId", label: "TVP ID" },
    { value: "phone", label: "Phone Number" },
    { value: "email", label: "Email Address" },
    { value: "region", label: "Region" },
  ];

  const exportOptions = [
    { value: "excel", label: "Export to Excel" },
    { value: "pdf", label: "Export to PDF" },
    { value: "csv", label: "Export to CSV" },
  ];

  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch(value, searchType);
  };

  const handleSearchTypeChange = (type) => {
    setSearchType(type);
    onSearch(searchTerm, type);
  };

  const handleExport = (format) => {
    onExport(format);
  };

  const clearSearch = () => {
    setSearchTerm("");
    onSearch("", searchType);
  };

  return (
    <div className="bg-surface border-b border-border">
      {/* Main Search Bar */}
      <div className="p-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search Input */}
          <div className="flex-1 relative w-full">
            <div className="relative">
              <Icon
                name="Search"
                size={18}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                placeholder="Search TVP owners by name, ID, phone, or email..."
                value={searchTerm}
                onChange={(e) => handleSearch(e?.target?.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearSearch}
                  iconName="X"
                  iconSize={16}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                />
              )}
            </div>
          </div>

          {/* Search Type Selector */}
          <div className="w-full lg:w-48">
            <Select
              options={searchTypeOptions}
              value={searchType}
              onChange={handleSearchTypeChange}
              placeholder="Search in..."
            />
          </div>

          {/* Advanced Filter - Opens modal */}
          <Button
            variant="outline"
            onClick={onOpenFilterModal}
            iconName="Filter"
            iconPosition="left"
            iconSize={16}
            className="relative"
          >
            Advanced Filter
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 w-full lg:w-auto justify-between lg:justify-start">
            <Button
              variant="outline"
              onClick={onOpenSettings}
              iconName="Settings"
              iconPosition="left"
              iconSize={16}
              title="Trip Slab Settings"
            >
              Settings
            </Button>
            {canManageOwners && (
              <Button
                variant="default"
                onClick={onAddOwner}
                iconName="UserPlus"
                iconPosition="left"
                iconSize={16}
              >
                Add Owner
              </Button>
            )}

            {/* Export Dropdown */}
            <div className="relative group">
              <Button
                variant="outline"
                iconName="Download"
                iconPosition="left"
                iconSize={16}
              >
                Export
              </Button>

              <div className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md modal-shadow opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  {exportOptions?.map((option) => (
                    <button
                      key={option?.value}
                      onClick={() => handleExport(option?.value)}
                      className="flex items-center w-full px-3 py-2 text-sm text-popover-foreground hover:bg-muted transition-colors duration-150"
                    >
                      <Icon
                        name={
                          option?.value === "excel"
                            ? "FileSpreadsheet"
                            : option?.value === "pdf"
                            ? "FileText"
                            : "File"
                        }
                        size={16}
                        className="mr-2"
                      />
                      {option?.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              iconName="RefreshCw"
              iconSize={16}
              onClick={() => window.location?.reload()}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mt-4 space-y-2 lg:space-y-0">
          <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-1 lg:space-y-0 lg:space-x-4 text-sm text-muted-foreground">
            <span>
              Showing {filteredOwners} of {totalOwners} owners
            </span>
            {searchTerm && (
              <span className="flex items-center space-x-1">
                <Icon name="Search" size={14} />
                <span>Search: "{searchTerm}"</span>
              </span>
            )}
          </div>

          {/* Quick Stats */}
          {ownerCounts && (
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span className="text-muted-foreground">Active: {ownerCounts.active || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-warning rounded-full"></div>
                <span className="text-muted-foreground">Pending: {ownerCounts.pending || 0}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-error rounded-full"></div>
                <span className="text-muted-foreground">Issues: {(ownerCounts.suspended || 0) + (ownerCounts.under_review || 0)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchAndActions;
