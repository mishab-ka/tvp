import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const FilterSidebar = ({ filters, onFilterChange, ownerCounts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    status: true,
    category: true,
    performance: true,
    financial: false
  });

  const statusFilters = [
    { id: 'active', label: 'Active', count: ownerCounts?.active || 0, color: 'text-success' },
    { id: 'inactive', label: 'Inactive', count: ownerCounts?.inactive || 0, color: 'text-muted-foreground' },
    { id: 'pending', label: 'Pending Approval', count: ownerCounts?.pending || 0, color: 'text-warning' },
    { id: 'suspended', label: 'Suspended', count: ownerCounts?.suspended || 0, color: 'text-error' },
    { id: 'under_review', label: 'Under Review', count: ownerCounts?.under_review || 0, color: 'text-secondary' }
  ];

  const categoryFilters = [
    { id: 'single_driver', label: 'Single Driver', count: ownerCounts?.single_driver || 0 },
    { id: 'double_driver', label: 'Double Driver', count: ownerCounts?.double_driver || 0 }
  ];

  const performanceFilters = [
    { id: 'excellent', label: 'Excellent (90%+)', count: ownerCounts?.excellent || 0, color: 'text-success' },
    { id: 'good', label: 'Good (75-89%)', count: ownerCounts?.good || 0, color: 'text-accent' },
    { id: 'average', label: 'Average (60-74%)', count: ownerCounts?.average || 0, color: 'text-warning' },
    { id: 'poor', label: 'Poor (<60%)', count: ownerCounts?.poor || 0, color: 'text-error' }
  ];

  const financialFilters = [
    { id: 'high_deposit', label: 'High Deposit (>$5000)', count: ownerCounts?.high_deposit || 0 },
    { id: 'medium_deposit', label: 'Medium Deposit ($2000-5000)', count: ownerCounts?.medium_deposit || 0 },
    { id: 'low_deposit', label: 'Low Deposit (<$2000)', count: ownerCounts?.low_deposit || 0 },
    { id: 'outstanding_balance', label: 'Outstanding Balance', count: ownerCounts?.outstanding_balance || 0 }
  ];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev?.[section]
    }));
  };

  const handleFilterToggle = (category, filterId) => {
    const currentFilters = filters?.[category] || [];
    const newFilters = currentFilters?.includes(filterId)
      ? currentFilters?.filter(id => id !== filterId)
      : [...currentFilters, filterId];
    
    onFilterChange(category, newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange('status', []);
    onFilterChange('category', []);
    onFilterChange('performance', []);
    onFilterChange('financial', []);
    setSearchTerm('');
  };

  const getActiveFilterCount = () => {
    return Object.values(filters)?.reduce((total, filterArray) => total + filterArray?.length, 0);
  };

  const renderFilterSection = (title, filterList, category, icon) => (
    <div className="mb-6">
      <button
        onClick={() => toggleSection(category)}
        className="flex items-center justify-between w-full p-2 text-sm font-medium text-foreground hover:bg-muted rounded-md transition-colors"
      >
        <div className="flex items-center space-x-2">
          <Icon name={icon} size={16} />
          <span>{title}</span>
        </div>
        <Icon 
          name={expandedSections?.[category] ? "ChevronDown" : "ChevronRight"} 
          size={14} 
        />
      </button>
      
      {expandedSections?.[category] && (
        <div className="mt-2 space-y-2 pl-6">
          {filterList?.map((filter) => (
            <div key={filter?.id} className="flex items-center justify-between">
              <Checkbox
                label={
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-sm ${filter?.color || 'text-foreground'}`}>
                      {filter?.label}
                    </span>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {filter?.count}
                    </span>
                  </div>
                }
                checked={filters?.[category]?.includes(filter?.id) || false}
                onChange={() => handleFilterToggle(category, filter?.id)}
                size="sm"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full bg-surface border-r border-border overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          {getActiveFilterCount() > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              iconName="X"
              iconSize={14}
              className="text-xs"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Active Filter Count */}
        {getActiveFilterCount() > 0 && (
          <div className="mb-4 p-2 bg-primary/10 border border-primary/20 rounded-md">
            <div className="flex items-center space-x-2">
              <Icon name="Filter" size={14} className="text-primary" />
              <span className="text-sm text-primary font-medium">
                {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
              </span>
            </div>
          </div>
        )}

        {/* Quick Search */}
        <div className="mb-6">
          <Input
            type="search"
            placeholder="Search owners..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
            className="text-sm"
          />
        </div>

        {/* Filter Sections */}
        {renderFilterSection('Status', statusFilters, 'status', 'Activity')}
        {renderFilterSection('Category', categoryFilters, 'category', 'User')}
        {renderFilterSection('Performance', performanceFilters, 'performance', 'TrendingUp')}
        {renderFilterSection('Financial', financialFilters, 'financial', 'DollarSign')}

        {/* Saved Filters */}
        <div className="mt-8 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-foreground mb-3">Saved Filters</h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              iconName="Star"
              iconPosition="left"
              iconSize={14}
              className="justify-start text-xs"
            >
              High Performers
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              iconName="AlertTriangle"
              iconPosition="left"
              iconSize={14}
              className="justify-start text-xs"
            >
              Needs Attention
            </Button>
            <Button
              variant="ghost"
              size="sm"
              fullWidth
              iconName="Clock"
              iconPosition="left"
              iconSize={14}
              className="justify-start text-xs"
            >
              Recent Additions
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;