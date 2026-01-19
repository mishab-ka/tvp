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
  onToggleFilters,
  showFilters,
  totalOwners,
  filteredOwners,
  canManageOwners = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

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

          {/* Mobile Filter Toggle */}
          <Button
            variant="outline"
            onClick={onToggleFilters}
            iconName="Filter"
            iconPosition="left"
            iconSize={16}
            className="lg:hidden"
          >
            Filters
          </Button>

          {/* Advanced Search Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
            iconName="Filter"
            iconPosition="left"
            iconSize={16}
            className="hidden lg:flex"
          >
            Advanced
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
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span className="text-muted-foreground">Active: 156</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-warning rounded-full"></div>
              <span className="text-muted-foreground">Pending: 23</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-error rounded-full"></div>
              <span className="text-muted-foreground">Issues: 8</span>
            </div>
          </div>
        </div>
      </div>
      {/* Advanced Search Panel */}
      {showAdvancedSearch && (
        <div className="px-4 pb-4 border-t border-border bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
            <Select
              label="Status"
              options={[
                { value: "", label: "All Statuses" },
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
                { value: "pending", label: "Pending" },
                { value: "suspended", label: "Suspended" },
              ]}
              placeholder="Any Status"
            />

            <Select
              label="Region"
              options={[
                { value: "", label: "All Regions" },
                { value: "north", label: "North Zone" },
                { value: "south", label: "South Zone" },
                { value: "east", label: "East Zone" },
                { value: "west", label: "West Zone" },
                { value: "central", label: "Central Zone" },
              ]}
              placeholder="Any Region"
            />

            <Select
              label="Performance"
              options={[
                { value: "", label: "All Performance" },
                { value: "excellent", label: "Excellent (90%+)" },
                { value: "good", label: "Good (75-89%)" },
                { value: "average", label: "Average (60-74%)" },
                { value: "poor", label: "Poor (<60%)" },
              ]}
              placeholder="Any Performance"
            />

            <Input
              label="Vehicle Count"
              type="number"
              placeholder="Min vehicles"
            />

            <div className="flex items-end space-x-2">
              <Button
                variant="default"
                size="sm"
                iconName="Search"
                iconPosition="left"
                iconSize={14}
              >
                Apply Filters
              </Button>
              <Button variant="outline" size="sm" iconName="X" iconSize={14}>
                Clear
              </Button>
            </div>
          </div>

          {/* Saved Searches */}
          <div className="mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <Icon name="Star" size={14} className="text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Saved Searches
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-xs">
                High Performers
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                Needs Attention
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                New This Month
              </Button>
              <Button variant="ghost" size="sm" className="text-xs">
                Outstanding Balance
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchAndActions;
