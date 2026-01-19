import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const ActivityTab = ({ activities, onActivityFilter }) => {
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const activityTypes = [
    { value: 'all', label: 'All Activities', icon: 'Activity' },
    { value: 'profile', label: 'Profile Changes', icon: 'User' },
    { value: 'vehicle', label: 'Vehicle Updates', icon: 'Car' },
    { value: 'financial', label: 'Financial Transactions', icon: 'DollarSign' },
    { value: 'document', label: 'Document Changes', icon: 'FileText' },
    { value: 'system', label: 'System Events', icon: 'Settings' }
  ];

  const filteredActivities = activities?.filter(activity => {
    const matchesType = filterType === 'all' || activity?.type === filterType;
    const matchesSearch = activity?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         activity?.user?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    
    let matchesDate = true;
    if (dateRange?.start && dateRange?.end) {
      const activityDate = new Date(activity.timestamp);
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      matchesDate = activityDate >= startDate && activityDate <= endDate;
    }
    
    return matchesType && matchesSearch && matchesDate;
  });

  const getActivityIcon = (type) => {
    const typeConfig = activityTypes?.find(t => t?.value === type);
    return typeConfig ? typeConfig?.icon : 'Activity';
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'profile': return 'text-primary';
      case 'vehicle': return 'text-success';
      case 'financial': return 'text-warning';
      case 'document': return 'text-accent';
      case 'system': return 'text-muted-foreground';
      default: return 'text-foreground';
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} days ago`;
    } else {
      return date?.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const groupActivitiesByDate = (activities) => {
    const groups = {};
    activities?.forEach(activity => {
      const date = new Date(activity.timestamp)?.toDateString();
      if (!groups?.[date]) {
        groups[date] = [];
      }
      groups?.[date]?.push(activity);
    });
    return groups;
  };

  const groupedActivities = groupActivitiesByDate(filteredActivities);

  const handleExportActivities = () => {
    const csvContent = [
      ['Timestamp', 'Type', 'User', 'Description', 'Details']?.join(','),
      ...filteredActivities?.map(activity => [
        activity?.timestamp,
        activity?.type,
        activity?.user,
        `"${activity?.description}"`,
        `"${activity?.details || ''}"`
      ]?.join(','))
    ]?.join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tvp-owner-activity-${new Date()?.toISOString()?.split('T')?.[0]}.csv`;
    document.body?.appendChild(a);
    a?.click();
    document.body?.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Activity Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e?.target?.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {activityTypes?.map(type => (
                <option key={type?.value} value={type?.value}>
                  {type?.label}
                </option>
              ))}
            </select>
          </div>
          
          <Input
            label="Start Date"
            type="date"
            value={dateRange?.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e?.target?.value }))}
          />
          
          <Input
            label="End Date"
            type="date"
            value={dateRange?.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e?.target?.value }))}
          />
          
          <Input
            label="Search"
            type="search"
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
          />
        </div>
        
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredActivities?.length} of {activities?.length} activities
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterType('all');
                setDateRange({ start: '', end: '' });
                setSearchTerm('');
              }}
              iconName="RotateCcw"
              iconPosition="left"
              iconSize={14}
            >
              Clear Filters
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportActivities}
              iconName="Download"
              iconPosition="left"
              iconSize={14}
            >
              Export
            </Button>
          </div>
        </div>
      </div>
      {/* Activity Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedActivities)?.map(([date, dayActivities]) => (
          <div key={date} className="bg-card rounded-lg border border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-card-foreground">
                {new Date(date)?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h3>
              <p className="text-sm text-muted-foreground">{dayActivities?.length} activities</p>
            </div>
            
            <div className="p-4">
              <div className="space-y-4">
                {dayActivities?.map((activity) => (
                  <div key={activity?.id} className="flex items-start space-x-4">
                    <div className={`w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0 ${getActivityColor(activity?.type)}`}>
                      <Icon name={getActivityIcon(activity?.type)} size={16} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{activity?.description}</p>
                          {activity?.details && (
                            <p className="text-sm text-muted-foreground mt-1">{activity?.details}</p>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center">
                              <Icon name="User" size={12} className="mr-1" />
                              {activity?.user}
                            </span>
                            <span className="flex items-center">
                              <Icon name="Clock" size={12} className="mr-1" />
                              {formatTimestamp(activity?.timestamp)}
                            </span>
                            {activity?.ipAddress && (
                              <span className="flex items-center">
                                <Icon name="Globe" size={12} className="mr-1" />
                                {activity?.ipAddress}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            activity?.type === 'profile' ? 'bg-primary/10 text-primary' :
                            activity?.type === 'vehicle' ? 'bg-success/10 text-success' :
                            activity?.type === 'financial' ? 'bg-warning/10 text-warning' :
                            activity?.type === 'document'? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                          }`}>
                            {activity?.type}
                          </span>
                          
                          {activity?.changes && (
                            <Button
                              variant="ghost"
                              size="icon"
                              iconName="Info"
                              iconSize={12}
                              className="w-6 h-6"
                            >
                              <span className="sr-only">View changes</span>
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      {activity?.changes && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <h5 className="text-xs font-medium text-foreground mb-2">Changes Made:</h5>
                          <div className="space-y-1">
                            {Object.entries(activity?.changes)?.map(([field, change]) => (
                              <div key={field} className="text-xs">
                                <span className="font-medium text-foreground">{field}:</span>
                                <span className="text-error ml-1">"{change?.from}"</span>
                                <Icon name="ArrowRight" size={10} className="inline mx-1" />
                                <span className="text-success">"{change?.to}"</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredActivities?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="Activity" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No activities found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterType !== 'all' || dateRange?.start || dateRange?.end ?'Try adjusting your search or filter criteria.' :'No activities have been recorded for this TVP owner yet.'}
          </p>
          {(searchTerm || filterType !== 'all' || dateRange?.start || dateRange?.end) && (
            <Button
              variant="outline"
              onClick={() => {
                setFilterType('all');
                setDateRange({ start: '', end: '' });
                setSearchTerm('');
              }}
              iconName="RotateCcw"
              iconPosition="left"
              iconSize={16}
            >
              Clear All Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityTab;