import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ActivityFeed = () => {
  const [filter, setFilter] = useState('all');

  const activities = [
    {
      id: 1,
      type: 'user',
      title: 'New TVP Owner Registered',
      description: 'Ahmed Hassan (TVP156) completed registration with 2 vehicles',
      timestamp: new Date(Date.now() - 300000),
      icon: 'UserPlus',
      priority: 'normal'
    },
    {
      id: 2,
      type: 'financial',
      title: 'Outstanding Balance Alert',
      description: 'TVP089 has overdue payment of $2,450 for 7 days',
      timestamp: new Date(Date.now() - 900000),
      icon: 'AlertTriangle',
      priority: 'high'
    },
    {
      id: 3,
      type: 'system',
      title: 'ERP Integration Sync',
      description: 'Daily financial data synchronized successfully',
      timestamp: new Date(Date.now() - 1800000),
      icon: 'CheckCircle',
      priority: 'normal'
    },
    {
      id: 4,
      type: 'vehicle',
      title: 'Vehicle Assignment Updated',
      description: 'Car #VH-2847 reassigned from TVP023 to TVP045',
      timestamp: new Date(Date.now() - 3600000),
      icon: 'Car',
      priority: 'normal'
    },
    {
      id: 5,
      type: 'financial',
      title: 'Monthly Earnings Milestone',
      description: 'Total fleet earnings exceeded $75,000 target',
      timestamp: new Date(Date.now() - 7200000),
      icon: 'TrendingUp',
      priority: 'normal'
    },
    {
      id: 6,
      type: 'user',
      title: 'Admin Access Granted',
      description: 'Sarah Mitchell assigned Manager role for Operations',
      timestamp: new Date(Date.now() - 10800000),
      icon: 'Shield',
      priority: 'normal'
    },
    {
      id: 7,
      type: 'system',
      title: 'Backup Completed',
      description: 'Weekly system backup completed successfully',
      timestamp: new Date(Date.now() - 14400000),
      icon: 'Database',
      priority: 'normal'
    },
    {
      id: 8,
      type: 'financial',
      title: 'Payment Received',
      description: 'TVP034 paid outstanding balance of $1,850',
      timestamp: new Date(Date.now() - 18000000),
      icon: 'CreditCard',
      priority: 'normal'
    }
  ];

  const filterOptions = [
    { key: 'all', label: 'All Activities', icon: 'Activity' },
    { key: 'user', label: 'User Actions', icon: 'Users' },
    { key: 'financial', label: 'Financial', icon: 'DollarSign' },
    { key: 'system', label: 'System', icon: 'Settings' },
    { key: 'vehicle', label: 'Vehicles', icon: 'Car' }
  ];

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities?.filter(activity => activity?.type === filter);

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-error';
      case 'medium': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'user': return 'bg-blue-100 text-blue-700';
      case 'financial': return 'bg-green-100 text-green-700';
      case 'system': return 'bg-purple-100 text-purple-700';
      case 'vehicle': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
        <Button
          variant="ghost"
          size="sm"
          iconName="RefreshCw"
          iconSize={16}
        >
          Refresh
        </Button>
      </div>
      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 mb-4 overflow-x-auto">
        {filterOptions?.map((option) => (
          <Button
            key={option?.key}
            variant={filter === option?.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setFilter(option?.key)}
            iconName={option?.icon}
            iconPosition="left"
            iconSize={14}
            className="whitespace-nowrap"
          >
            {option?.label}
          </Button>
        ))}
      </div>
      {/* Activity List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {filteredActivities?.map((activity) => (
          <div key={activity?.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors duration-150">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getTypeColor(activity?.type)}`}>
                <Icon name={activity?.icon} size={14} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-sm font-medium text-foreground truncate">
                  {activity?.title}
                </h4>
                <span className={`text-xs ${getPriorityColor(activity?.priority)}`}>
                  {formatTimestamp(activity?.timestamp)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {activity?.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      {filteredActivities?.length === 0 && (
        <div className="text-center py-8">
          <Icon name="Inbox" size={48} className="text-muted-foreground/50 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No activities found</p>
        </div>
      )}
      {/* View All Button */}
      <div className="mt-4 pt-4 border-t border-border">
        <Button
          variant="ghost"
          fullWidth
          iconName="ArrowRight"
          iconPosition="right"
          iconSize={16}
        >
          View All Activities
        </Button>
      </div>
    </div>
  );
};

export default ActivityFeed;