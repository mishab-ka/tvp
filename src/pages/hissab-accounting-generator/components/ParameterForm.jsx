import React, { useState, useEffect } from 'react';

import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';

const ParameterForm = ({ onParameterChange, savedTemplates = [] }) => {
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    selectedOwners: [],
    vehicleFilter: 'all',
    reportType: 'weekly',
    includeInactive: false
  });

  const [ownerSearch, setOwnerSearch] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Mock TVP owners data
  const mockOwners = [
    { value: 'TVP001', label: 'Ahmed Hassan', vehicleCount: 5, status: 'active' },
    { value: 'TVP002', label: 'Sarah Johnson', vehicleCount: 3, status: 'active' },
    { value: 'TVP003', label: 'Mohammed Ali', vehicleCount: 7, status: 'active' },
    { value: 'TVP004', label: 'Lisa Chen', vehicleCount: 2, status: 'inactive' },
    { value: 'TVP005', label: 'David Rodriguez', vehicleCount: 4, status: 'active' },
    { value: 'TVP006', label: 'Fatima Al-Zahra', vehicleCount: 6, status: 'active' },
    { value: 'TVP007', label: 'James Wilson', vehicleCount: 3, status: 'active' },
    { value: 'TVP008', label: 'Aisha Patel', vehicleCount: 5, status: 'active' },
    { value: 'TVP009', label: 'Carlos Martinez', vehicleCount: 2, status: 'inactive' },
    { value: 'TVP010', label: 'Noor Abdullah', vehicleCount: 4, status: 'active' }
  ];

  const reportTypeOptions = [
    { value: 'daily', label: 'Daily Report' },
    { value: 'weekly', label: 'Weekly Report' },
    { value: 'monthly', label: 'Monthly Report' },
    { value: 'custom', label: 'Custom Period' }
  ];

  const vehicleFilterOptions = [
    { value: 'all', label: 'All Vehicles' },
    { value: 'active', label: 'Active Only' },
    { value: 'high_performance', label: 'High Performance (>100 trips/week)' },
    { value: 'low_performance', label: 'Low Performance (<50 trips/week)' }
  ];

  const templateOptions = savedTemplates?.map(template => ({
    value: template?.id,
    label: template?.name,
    description: template?.description
  }));

  useEffect(() => {
    onParameterChange(formData);
  }, [formData, onParameterChange]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleOwnerSelection = (selectedValues) => {
    const selectedOwnerObjects = mockOwners?.filter(owner => 
      selectedValues?.includes(owner?.value)
    );
    setFormData(prev => ({
      ...prev,
      selectedOwners: selectedOwnerObjects
    }));
  };

  const setQuickDateRange = (type) => {
    const today = new Date();
    let startDate, endDate;

    switch (type) {
      case 'today':
        startDate = endDate = today?.toISOString()?.split('T')?.[0];
        break;
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday?.setDate(yesterday?.getDate() - 1);
        startDate = endDate = yesterday?.toISOString()?.split('T')?.[0];
        break;
      case 'this_week':
        const startOfWeek = new Date(today);
        startOfWeek?.setDate(today?.getDate() - today?.getDay());
        startDate = startOfWeek?.toISOString()?.split('T')?.[0];
        endDate = today?.toISOString()?.split('T')?.[0];
        break;
      case 'last_week':
        const lastWeekEnd = new Date(today);
        lastWeekEnd?.setDate(today?.getDate() - today?.getDay() - 1);
        const lastWeekStart = new Date(lastWeekEnd);
        lastWeekStart?.setDate(lastWeekEnd?.getDate() - 6);
        startDate = lastWeekStart?.toISOString()?.split('T')?.[0];
        endDate = lastWeekEnd?.toISOString()?.split('T')?.[0];
        break;
      case 'this_month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1)?.toISOString()?.split('T')?.[0];
        endDate = today?.toISOString()?.split('T')?.[0];
        break;
      default:
        return;
    }

    setFormData(prev => ({
      ...prev,
      startDate,
      endDate
    }));
  };

  const loadTemplate = (templateId) => {
    const template = savedTemplates?.find(t => t?.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        ...template?.parameters
      }));
    }
  };

  const filteredOwners = mockOwners?.filter(owner => {
    const matchesSearch = owner?.label?.toLowerCase()?.includes(ownerSearch?.toLowerCase()) ||
                         owner?.value?.toLowerCase()?.includes(ownerSearch?.toLowerCase());
    const matchesStatus = formData?.includeInactive || owner?.status === 'active';
    return matchesSearch && matchesStatus;
  });

  const ownerOptions = filteredOwners?.map(owner => ({
    value: owner?.value,
    label: `${owner?.value} - ${owner?.label}`,
    description: `${owner?.vehicleCount} vehicles • ${owner?.status}`
  }));

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Report Parameters</h3>
          <p className="text-sm text-muted-foreground">Configure calculation parameters and filters</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            iconName={showAdvanced ? "ChevronUp" : "ChevronDown"}
            iconPosition="right"
            iconSize={16}
          >
            Advanced
          </Button>
        </div>
      </div>
      <div className="p-6 space-y-6">
        {/* Template Selection */}
        {templateOptions?.length > 0 && (
          <div>
            <Select
              label="Load Saved Template"
              placeholder="Choose a saved template..."
              options={templateOptions}
              onChange={loadTemplate}
              clearable
              description="Load previously saved calculation parameters"
            />
          </div>
        )}

        {/* Date Range Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-foreground">Date Range</h4>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setQuickDateRange('today')}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setQuickDateRange('this_week')}
              >
                This Week
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setQuickDateRange('this_month')}
              >
                This Month
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={formData?.startDate}
              onChange={(e) => handleInputChange('startDate', e?.target?.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              value={formData?.endDate}
              onChange={(e) => handleInputChange('endDate', e?.target?.value)}
              required
            />
          </div>
        </div>

        {/* Report Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Report Type"
            options={reportTypeOptions}
            value={formData?.reportType}
            onChange={(value) => handleInputChange('reportType', value)}
            required
          />
          <Select
            label="Vehicle Filter"
            options={vehicleFilterOptions}
            value={formData?.vehicleFilter}
            onChange={(value) => handleInputChange('vehicleFilter', value)}
          />
        </div>

        {/* TVP Owner Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-foreground">TVP Owner Selection</h4>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleOwnerSelection(filteredOwners?.map(o => o?.value))}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="xs"
                onClick={() => handleOwnerSelection([])}
              >
                Clear All
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <Input
              label="Search TVP Owners"
              type="search"
              placeholder="Search by name or ID..."
              value={ownerSearch}
              onChange={(e) => setOwnerSearch(e?.target?.value)}
              description={`${filteredOwners?.length} owners available`}
            />
            
            <Select
              label="Selected TVP Owners"
              options={ownerOptions}
              value={formData?.selectedOwners?.map(o => o?.value)}
              onChange={handleOwnerSelection}
              multiple
              searchable
              placeholder="Select TVP owners for calculation..."
              description={`${formData?.selectedOwners?.length} owners selected`}
            />
          </div>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="border-t border-border pt-6">
            <h4 className="text-md font-semibold text-foreground mb-4">Advanced Options</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="includeInactive"
                    checked={formData?.includeInactive}
                    onChange={(e) => handleInputChange('includeInactive', e?.target?.checked)}
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                  />
                  <label htmlFor="includeInactive" className="text-sm text-foreground">
                    Include inactive TVP owners
                  </label>
                </div>
                
                <Input
                  label="Minimum Trip Threshold"
                  type="number"
                  placeholder="0"
                  description="Exclude owners with fewer trips"
                />
              </div>
              
              <div className="space-y-4">
                <Input
                  label="Performance Bonus Threshold (%)"
                  type="number"
                  placeholder="85"
                  description="Performance percentage for bonus eligibility"
                />
                
                <Input
                  label="Custom Multiplier"
                  type="number"
                  step="0.01"
                  placeholder="1.00"
                  description="Apply custom calculation multiplier"
                />
              </div>
            </div>
          </div>
        )}

        {/* Selection Summary */}
        {formData?.selectedOwners?.length > 0 && (
          <div className="bg-muted/30 rounded-lg p-4">
            <h4 className="text-md font-semibold text-foreground mb-3">Selection Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Selected Owners</p>
                <p className="text-lg font-bold text-foreground">{formData?.selectedOwners?.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total Vehicles</p>
                <p className="text-lg font-bold text-foreground">
                  {formData?.selectedOwners?.reduce((sum, owner) => sum + owner?.vehicleCount, 0)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Date Range</p>
                <p className="text-lg font-bold text-foreground">
                  {formData?.startDate && formData?.endDate ? 
                    Math.ceil((new Date(formData.endDate) - new Date(formData.startDate)) / (1000 * 60 * 60 * 24)) + 1 : 0} days
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Report Type</p>
                <p className="text-lg font-bold text-foreground capitalize">
                  {formData?.reportType?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ParameterForm;