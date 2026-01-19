import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const FilterToolbar = ({ onFiltersChange }) => {
  const [dateRange, setDateRange] = useState('30d');
  const [department, setDepartment] = useState('all');
  const [metric, setMetric] = useState('revenue');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDate, setShowCustomDate] = useState(false);

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 days' },
    { value: '30d', label: 'Last 30 days' },
    { value: '90d', label: 'Last 3 months' },
    { value: '1y', label: 'Last year' },
    { value: 'custom', label: 'Custom range' }
  ];

  const departmentOptions = [
    { value: 'all', label: 'All Departments' },
    { value: 'operations', label: 'Operations' },
    { value: 'finance', label: 'Finance' },
    { value: 'fleet', label: 'Fleet Management' },
    { value: 'admin', label: 'Administration' }
  ];

  const metricOptions = [
    { value: 'revenue', label: 'Revenue Focus' },
    { value: 'utilization', label: 'Vehicle Utilization' },
    { value: 'performance', label: 'Owner Performance' },
    { value: 'financial', label: 'Financial Health' }
  ];

  const handleDateRangeChange = (value) => {
    setDateRange(value);
    setShowCustomDate(value === 'custom');
    if (value !== 'custom') {
      applyFilters({ dateRange: value, department, metric });
    }
  };

  const handleDepartmentChange = (value) => {
    setDepartment(value);
    applyFilters({ dateRange, department: value, metric });
  };

  const handleMetricChange = (value) => {
    setMetric(value);
    applyFilters({ dateRange, department, metric: value });
  };

  const applyFilters = (filters) => {
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  };

  const handleCustomDateApply = () => {
    if (customStartDate && customEndDate) {
      applyFilters({
        dateRange: 'custom',
        customStartDate,
        customEndDate,
        department,
        metric
      });
    }
  };

  const resetFilters = () => {
    setDateRange('30d');
    setDepartment('all');
    setMetric('revenue');
    setCustomStartDate('');
    setCustomEndDate('');
    setShowCustomDate(false);
    applyFilters({ dateRange: '30d', department: 'all', metric: 'revenue' });
  };

  const exportData = () => {
    // Mock export functionality
    console.log('Exporting dashboard data...');
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 card-shadow mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Date Range */}
          <div className="flex items-center space-x-2">
            <Icon name="Calendar" size={16} className="text-muted-foreground" />
            <Select
              options={dateRangeOptions}
              value={dateRange}
              onChange={handleDateRangeChange}
              className="w-40"
            />
          </div>

          {/* Custom Date Range */}
          {showCustomDate && (
            <div className="flex items-center space-x-2">
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e?.target?.value)}
                className="w-36"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e?.target?.value)}
                className="w-36"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCustomDateApply}
                iconName="Check"
                iconSize={14}
              >
                Apply
              </Button>
            </div>
          )}

          {/* Department Filter */}
          <div className="flex items-center space-x-2">
            <Icon name="Building" size={16} className="text-muted-foreground" />
            <Select
              options={departmentOptions}
              value={department}
              onChange={handleDepartmentChange}
              className="w-44"
            />
          </div>

          {/* Metric Focus */}
          <div className="flex items-center space-x-2">
            <Icon name="Target" size={16} className="text-muted-foreground" />
            <Select
              options={metricOptions}
              value={metric}
              onChange={handleMetricChange}
              className="w-40"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            iconName="RotateCcw"
            iconPosition="left"
            iconSize={14}
          >
            Reset
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
            iconName="Download"
            iconPosition="left"
            iconSize={14}
          >
            Export
          </Button>
          
          <Button
            variant="default"
            size="sm"
            iconName="RefreshCw"
            iconPosition="left"
            iconSize={14}
          >
            Refresh
          </Button>
        </div>
      </div>
      {/* Active Filters Display */}
      <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">Active filters:</span>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
            {dateRangeOptions?.find(opt => opt?.value === dateRange)?.label}
          </span>
          {department !== 'all' && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-accent/10 text-accent">
              {departmentOptions?.find(opt => opt?.value === department)?.label}
            </span>
          )}
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary/10 text-secondary">
            {metricOptions?.find(opt => opt?.value === metric)?.label}
          </span>
        </div>
      </div>
    </div>
  );
};

export default FilterToolbar;