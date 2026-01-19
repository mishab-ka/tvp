import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const SystemStatus = () => {
  const [systemHealth, setSystemHealth] = useState({});
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const integrationSystems = {
    sso: {
      name: 'Corporate SSO',
      status: 'connected',
      description: 'Active Directory integration',
      lastSync: '2 minutes ago'
    },
    erp: {
      name: 'ERP System',
      status: 'connected',
      description: 'Financial data sync',
      lastSync: '5 minutes ago'
    },
    mfa: {
      name: 'MFA Service',
      status: 'connected',
      description: 'Two-factor authentication',
      lastSync: '1 minute ago'
    },
    audit: {
      name: 'Audit Logging',
      status: 'warning',
      description: 'High volume detected',
      lastSync: '30 seconds ago'
    },
    backup: {
      name: 'Backup System',
      status: 'connected',
      description: 'Last backup successful',
      lastSync: '1 hour ago'
    }
  };

  useEffect(() => {
    // Simulate real-time status updates
    const interval = setInterval(() => {
      setLastUpdated(new Date());
      
      // Randomly update audit system status for demo
      if (Math.random() > 0.7) {
        setSystemHealth(prev => ({
          ...prev,
          audit: {
            ...integrationSystems?.audit,
            status: Math.random() > 0.5 ? 'connected' : 'warning'
          }
        }));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return 'CheckCircle';
      case 'warning': return 'AlertTriangle';
      case 'error': return 'XCircle';
      default: return 'Circle';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case 'connected': return 'bg-success/10';
      case 'warning': return 'bg-warning/10';
      case 'error': return 'bg-error/10';
      default: return 'bg-muted/10';
    }
  };

  const currentSystems = { ...integrationSystems, ...systemHealth };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">System Status</h3>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
          <Icon name="RefreshCw" size={12} />
          <span>Updated {lastUpdated?.toLocaleTimeString()}</span>
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(currentSystems)?.map(([key, system]) => (
          <div
            key={key}
            className={`p-3 rounded-md border transition-all duration-200 ${
              system?.status === 'connected' ?'border-success/20 bg-success/5' 
                : system?.status === 'warning' ?'border-warning/20 bg-warning/5' :'border-error/20 bg-error/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusBgColor(system?.status)}`}>
                  <Icon 
                    name={getStatusIcon(system?.status)} 
                    size={14} 
                    className={getStatusColor(system?.status)} 
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{system?.name}</p>
                  <p className="text-xs text-muted-foreground">{system?.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  system?.status === 'connected' ?'bg-success/10 text-success' 
                    : system?.status === 'warning' ?'bg-warning/10 text-warning' :'bg-error/10 text-error'
                }`}>
                  {system?.status === 'connected' ? 'Online' : 
                   system?.status === 'warning' ? 'Warning' : 'Offline'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{system?.lastSync}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 bg-muted/30 rounded-md border border-border">
        <div className="flex items-center space-x-2">
          <Icon name="Info" size={14} className="text-primary" />
          <p className="text-xs text-muted-foreground">
            All systems operational. Contact IT support if you experience any issues.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;