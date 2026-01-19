import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const TemplateManager = ({ 
  templates = [], 
  onSaveTemplate, 
  onLoadTemplate, 
  onDeleteTemplate,
  currentParameters = {}
}) => {
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Mock saved templates
  const mockTemplates = [
    {
      id: 'template_1',
      name: 'Weekly Standard Report',
      description: 'Standard weekly report for all active TVP owners',
      createdAt: '2025-01-15',
      lastUsed: '2025-01-20',
      parameters: {
        reportType: 'weekly',
        vehicleFilter: 'active',
        includeInactive: false
      },
      usage: 15
    },
    {
      id: 'template_2',
      name: 'Monthly Performance Review',
      description: 'Comprehensive monthly performance analysis',
      createdAt: '2025-01-10',
      lastUsed: '2025-01-18',
      parameters: {
        reportType: 'monthly',
        vehicleFilter: 'high_performance',
        includeInactive: false
      },
      usage: 8
    },
    {
      id: 'template_3',
      name: 'Custom Audit Report',
      description: 'Detailed audit report including inactive owners',
      createdAt: '2025-01-05',
      lastUsed: '2025-01-16',
      parameters: {
        reportType: 'custom',
        vehicleFilter: 'all',
        includeInactive: true
      },
      usage: 3
    }
  ];

  const allTemplates = [...mockTemplates, ...templates];

  const handleSaveTemplate = () => {
    if (!templateName?.trim()) return;

    const newTemplate = {
      id: `template_${Date.now()}`,
      name: templateName,
      description: templateDescription,
      createdAt: new Date()?.toISOString()?.split('T')?.[0],
      lastUsed: new Date()?.toISOString()?.split('T')?.[0],
      parameters: currentParameters,
      usage: 0
    };

    onSaveTemplate(newTemplate);
    setTemplateName('');
    setTemplateDescription('');
    setShowSaveDialog(false);
  };

  const handleLoadTemplate = (template) => {
    onLoadTemplate(template);
    setSelectedTemplate(template?.id);
  };

  const handleDeleteTemplate = (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      onDeleteTemplate(templateId);
      if (selectedTemplate === templateId) {
        setSelectedTemplate(null);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString)?.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getTemplateTypeIcon = (reportType) => {
    switch (reportType) {
      case 'daily': return 'Calendar';
      case 'weekly': return 'CalendarDays';
      case 'monthly': return 'CalendarRange';
      default: return 'FileText';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-border">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Template Manager</h3>
          <p className="text-sm text-muted-foreground">Save and manage calculation templates</p>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => setShowSaveDialog(true)}
          iconName="Plus"
          iconPosition="left"
          iconSize={16}
        >
          Save Template
        </Button>
      </div>
      <div className="p-6">
        {/* Template List */}
        {allTemplates?.length > 0 ? (
          <div className="space-y-4">
            {allTemplates?.map((template) => (
              <div
                key={template?.id}
                className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-sm ${
                  selectedTemplate === template?.id 
                    ? 'border-primary bg-primary/5' :'border-border bg-background'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                      <Icon 
                        name={getTemplateTypeIcon(template?.parameters?.reportType)} 
                        size={18} 
                        className="text-muted-foreground" 
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-semibold text-foreground">{template?.name}</h4>
                        {selectedTemplate === template?.id && (
                          <span className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                            Active
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {template?.description}
                      </p>
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Created: {formatDate(template?.createdAt)}</span>
                        <span>Last used: {formatDate(template?.lastUsed)}</span>
                        <span>Used {template?.usage} times</span>
                      </div>
                      
                      {/* Template Parameters Preview */}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                          {template?.parameters?.reportType || 'Custom'}
                        </span>
                        <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                          {template?.parameters?.vehicleFilter || 'All vehicles'}
                        </span>
                        {template?.parameters?.includeInactive && (
                          <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded">
                            Includes inactive
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLoadTemplate(template)}
                      iconName="Download"
                      iconSize={16}
                    >
                      Load
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template?.id)}
                      iconName="Trash2"
                      iconSize={16}
                      className="text-error hover:text-error"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="FileText" size={48} className="text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No saved templates yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              Save your current parameters as a template for quick access
            </p>
          </div>
        )}
      </div>
      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-200">
          <div className="bg-card rounded-lg border border-border w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Save Template</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSaveDialog(false)}
                iconName="X"
                iconSize={16}
              />
            </div>
            
            <div className="p-6 space-y-4">
              <Input
                label="Template Name"
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e?.target?.value)}
                placeholder="e.g., Weekly Standard Report"
                required
              />
              
              <Input
                label="Description"
                type="text"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e?.target?.value)}
                placeholder="Brief description of this template..."
                description="Optional description to help identify this template"
              />
              
              {/* Current Parameters Preview */}
              <div className="bg-muted/30 rounded-lg p-3">
                <h4 className="text-sm font-medium text-foreground mb-2">Current Parameters</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <div>Report Type: {currentParameters?.reportType || 'Not set'}</div>
                  <div>Vehicle Filter: {currentParameters?.vehicleFilter || 'Not set'}</div>
                  <div>Selected Owners: {currentParameters?.selectedOwners?.length || 0}</div>
                  <div>Include Inactive: {currentParameters?.includeInactive ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setShowSaveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleSaveTemplate}
                disabled={!templateName?.trim()}
                iconName="Save"
                iconPosition="left"
                iconSize={16}
              >
                Save Template
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;