import React, { useState, useEffect } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { Checkbox } from "../../../components/ui/Checkbox";

const FilterModal = ({ isOpen, onClose, filters, onApply, ownerCounts }) => {
  const [pendingFilters, setPendingFilters] = useState({
    status: [],
    category: [],
    performance: [],
    financial: [],
  });
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    category: true,
    performance: true,
    financial: true,
  });

  useEffect(() => {
    if (isOpen) {
      setPendingFilters({
        status: filters?.status || [],
        category: filters?.category || [],
        performance: filters?.performance || [],
        financial: filters?.financial || [],
      });
    }
  }, [isOpen, filters]);

  const handleFilterToggle = (category, filterId) => {
    const current = pendingFilters?.[category] || [];
    const newFilters = current.includes(filterId)
      ? current.filter((id) => id !== filterId)
      : [...current, filterId];
    setPendingFilters((prev) => ({ ...prev, [category]: newFilters }));
  };

  const handleApply = () => {
    onApply(pendingFilters);
    onClose();
  };

  const handleClear = () => {
    setPendingFilters({
      status: [],
      category: [],
      performance: [],
      financial: [],
    });
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const getActiveCount = () =>
    Object.values(pendingFilters).reduce((sum, arr) => sum + (arr?.length || 0), 0);

  const statusFilters = [
    { id: "active", label: "Active", count: ownerCounts?.active || 0, color: "text-success" },
    { id: "inactive", label: "Inactive", count: ownerCounts?.inactive || 0, color: "text-muted-foreground" },
    { id: "pending", label: "Pending Approval", count: ownerCounts?.pending || 0, color: "text-warning" },
    { id: "suspended", label: "Suspended", count: ownerCounts?.suspended || 0, color: "text-error" },
    { id: "under_review", label: "Under Review", count: ownerCounts?.under_review || 0, color: "text-secondary" },
  ];

  const categoryFilters = [
    { id: "single_driver", label: "Single Driver", count: ownerCounts?.single_driver || 0 },
    { id: "double_driver", label: "Double Driver", count: ownerCounts?.double_driver || 0 },
  ];

  const performanceFilters = [
    { id: "excellent", label: "Excellent (90%+)", count: ownerCounts?.excellent || 0, color: "text-success" },
    { id: "good", label: "Good (75-89%)", count: ownerCounts?.good || 0, color: "text-accent" },
    { id: "average", label: "Average (60-74%)", count: ownerCounts?.average || 0, color: "text-warning" },
    { id: "poor", label: "Poor (<60%)", count: ownerCounts?.poor || 0, color: "text-error" },
  ];

  const financialFilters = [
    { id: "high_deposit", label: "High Deposit (≥₹15,000)", count: ownerCounts?.high_deposit || 0 },
    { id: "medium_deposit", label: "Medium Deposit (₹5,000-15,000)", count: ownerCounts?.medium_deposit || 0 },
    { id: "low_deposit", label: "Low Deposit (<₹5,000)", count: ownerCounts?.low_deposit || 0 },
    { id: "outstanding_balance", label: "Has Outstanding Balance", count: ownerCounts?.outstanding_balance || 0, color: "text-error" },
  ];

  const renderSection = (title, list, category, icon) => (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => toggleSection(category)}
        className="flex items-center justify-between w-full p-2 text-sm font-medium text-foreground hover:bg-muted rounded-md"
      >
        <div className="flex items-center space-x-2">
          <Icon name={icon} size={16} className="text-muted-foreground" />
          <span>{title}</span>
          {(pendingFilters?.[category]?.length || 0) > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
              {pendingFilters[category].length}
            </span>
          )}
        </div>
        <Icon
          name={expandedSections[category] ? "ChevronDown" : "ChevronRight"}
          size={14}
          className="text-muted-foreground"
        />
      </button>
      {expandedSections[category] && (
        <div className="mt-2 space-y-2 pl-4">
          {list.map((f) => (
            <div key={f.id} className="flex items-center">
              <Checkbox
                label={
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className={`text-sm ${f.color || "text-foreground"}`}>{f.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0">
                      {f.count}
                    </span>
                  </div>
                }
                checked={pendingFilters?.[category]?.includes(f.id) || false}
                onChange={() => handleFilterToggle(category, f.id)}
                size="sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md max-h-[85vh] overflow-hidden bg-background rounded-lg border border-border shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <Icon name="Filter" size={20} className="text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Advanced Filters</h2>
            {getActiveCount() > 0 && (
              <span className="px-2 py-0.5 text-xs bg-primary text-primary-foreground rounded-full">
                {getActiveCount()} active
              </span>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} iconName="X" iconSize={20} />
        </div>

        {/* Filter Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {renderSection("Status", statusFilters, "status", "Activity")}
          {renderSection("Category", categoryFilters, "category", "Users")}
          {renderSection("Performance", performanceFilters, "performance", "TrendingUp")}
          {renderSection("Financial", financialFilters, "financial", "Wallet")}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-2 p-4 border-t border-border bg-muted/20">
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear All
          </Button>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="default" size="sm" onClick={handleApply} iconName="Check" iconSize={14}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
