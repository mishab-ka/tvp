import React from 'react';
import Icon from '../../../components/AppIcon';


const TabNavigation = ({ activeTab, onTabChange, tabCounts }) => {
  const tabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: 'User',
      description: 'Contact details and summary'
    },
    {
      id: 'vehicles',
      label: 'Vehicles',
      icon: 'Car',
      description: 'Assigned fleet and performance',
      count: tabCounts?.vehicles
    },
    {
      id: 'financials',
      label: 'Financials',
      icon: 'DollarSign',
      description: 'Deposits and transactions',
      count: tabCounts?.transactions
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: 'FileText',
      description: 'Uploaded files and records',
      count: tabCounts?.documents
    },
    {
      id: 'activity',
      label: 'Activity',
      icon: 'Activity',
      description: 'Complete audit trail',
      count: tabCounts?.activities
    }
  ];

  return (
    <div className="bg-surface border-b border-border">
      <div className="px-6">
        <nav className="flex space-x-1" role="tablist">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              role="tab"
              aria-selected={activeTab === tab?.id}
              aria-controls={`${tab?.id}-panel`}
              onClick={() => onTabChange(tab?.id)}
              className={`group relative px-4 py-4 text-sm font-medium transition-all duration-200 border-b-2 ${
                activeTab === tab?.id
                  ? 'text-primary border-primary bg-primary/5' :'text-muted-foreground border-transparent hover:text-foreground hover:border-border'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Icon 
                  name={tab?.icon} 
                  size={16} 
                  className={activeTab === tab?.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'} 
                />
                <span>{tab?.label}</span>
                {tab?.count !== undefined && tab?.count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    activeTab === tab?.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground group-hover:bg-muted-foreground group-hover:text-background'
                  }`}>
                    {tab?.count}
                  </span>
                )}
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover border border-border rounded text-xs text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-200">
                {tab?.description}
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-popover"></div>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default TabNavigation;