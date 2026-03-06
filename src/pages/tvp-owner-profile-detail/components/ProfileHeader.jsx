import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ProfileHeader = ({ owner, onStatusChange, onEdit }) => {
  const navigate = useNavigate();
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-error text-error-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'suspended': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(newStatus);
    setShowActions(false);
  };

  return (
    <div className="sticky top-0 z-50 bg-surface border-b border-border shadow-sm">
      <div className="px-6 py-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          {/* Left Section - Owner Info */}
          <div className="flex items-center gap-4 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/tvp-owners-management')}
              iconName="ArrowLeft"
              iconSize={20}
              className="shrink-0"
            >
              <span className="sr-only">Back to TVP Owners</span>
            </Button>
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                <span className="text-lg font-semibold text-primary-foreground">
                  {owner?.name?.split(' ')?.map(n => n?.[0])?.join('')}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-semibold text-foreground truncate">{owner?.name}</h1>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(owner?.status)}`}>
                    {owner?.status?.charAt(0)?.toUpperCase() + owner?.status?.slice(1)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="Hash" size={14} className="shrink-0 text-muted-foreground" />
                    {owner?.id}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="Phone" size={14} className="shrink-0 text-muted-foreground" />
                    {owner?.phone}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="Mail" size={14} className="shrink-0 text-muted-foreground" />
                    {owner?.email}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={onEdit}
              iconName="Edit"
              iconPosition="left"
              iconSize={16}
            >
              Edit Profile
            </Button>
            
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowActions(!showActions)}
                iconName="MoreVertical"
                iconSize={16}
              >
                Actions
              </Button>
              
              {showActions && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-200 py-1">
                  <button
                    onClick={() => handleStatusChange('active')}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                  >
                    <Icon name="CheckCircle" size={16} className="shrink-0 text-success" />
                    Mark Active
                  </button>
                  <button
                    onClick={() => handleStatusChange('inactive')}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                  >
                    <Icon name="XCircle" size={16} className="shrink-0 text-error" />
                    Mark Inactive
                  </button>
                  <button
                    onClick={() => handleStatusChange('suspended')}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                  >
                    <Icon name="Ban" size={16} className="shrink-0 text-destructive" />
                    Suspend
                  </button>
                  <div className="border-t border-border my-1" />
                  <button
                    onClick={() => console.log('Generate report')}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                  >
                    <Icon name="FileText" size={16} className="shrink-0 text-muted-foreground" />
                    Generate Report
                  </button>
                  <button
                    onClick={() => console.log('Export data')}
                    className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-popover-foreground hover:bg-muted transition-colors"
                  >
                    <Icon name="Download" size={16} className="shrink-0 text-muted-foreground" />
                    Export Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;