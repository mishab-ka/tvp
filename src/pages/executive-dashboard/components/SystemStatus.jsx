import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SystemStatus = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const systemIntegrations = [
    {
      id: 'erp',
      name: 'ERP System',
      status: 'connected',
      lastSync: new Date(Date.now() - 300000),
      description: 'Financial data synchronization',
      uptime: '99.8%'
    },
    {
      id: 'accounting',
      name: 'Accounting Software',
      status: 'connected',
      lastSync: new Date(Date.now() - 600000),
      description: 'Transaction processing',
      uptime: '99.9%'
    },
    {
      id: 'sso',
      name: 'Single Sign-On',
      status: 'warning',
      lastSync: new Date(Date.now() - 1800000),
      description: 'Authentication service',
      uptime: '98.5%'
    },
    {
      id: 'backup',
      name: 'Backup System',
      status: 'connected',
      lastSync: new Date(Date.now() - 3600000),
      description: 'Data backup & recovery',
      uptime: '100%'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return 'text-success';
      case 'warning': return 'text-warning';
      case 'error': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return 'CheckCircle';
      case 'warning': return 'AlertTriangle';
      case 'error': return 'XCircle';
      default: return 'Circle';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'connected': return 'bg-success/10';
      case 'warning': return 'bg-warning/10';
      case 'error': return 'bg-error/10';
      default: return 'bg-muted/10';
    }
  };

  const formatLastSync = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLastUpdate(new Date());
    setIsRefreshing(false);
  };

  useEffect(() => {
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 300000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card rounded-lg border border-border p-6 card-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">System Status</h3>
          <p className="text-sm text-muted-foreground">
            Last updated: {lastUpdate?.toLocaleTimeString()}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          loading={isRefreshing}
          iconName="RefreshCw"
          iconSize={16}
        >
          Refresh
        </Button>
      </div>
      <div className="space-y-4">
        {systemIntegrations?.map((integration) => (
          <div key={integration?.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors duration-150">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusBg(integration?.status)}`}>
                <Icon 
                  name={getStatusIcon(integration?.status)} 
                  size={20} 
                  className={getStatusColor(integration?.status)} 
                />
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-foreground">
                  {integration?.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {integration?.description}
                </p>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Last sync: {formatLastSync(integration?.lastSync)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Uptime: {integration?.uptime}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                integration?.status === 'connected' ?'bg-success/10 text-success' 
                  : integration?.status === 'warning' ?'bg-warning/10 text-warning' :'bg-error/10 text-error'
              }`}>
                {integration?.status === 'connected' ? 'Online' : 
                 integration?.status === 'warning' ? 'Warning' : 'Offline'}
              </span>
              
              <Button
                variant="ghost"
                size="icon"
                iconName="Settings"
                iconSize={14}
              >
                <span className="sr-only">Configure {integration?.name}</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
      {/* Overall System Health */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="Shield" size={16} className="text-success" />
            <span className="text-sm font-medium text-foreground">
              Overall System Health
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
            <span className="text-sm text-success font-medium">Operational</span>
          </div>
        </div>
        
        <div className="mt-2 bg-muted rounded-full h-2">
          <div className="bg-success h-2 rounded-full" style={{ width: '94%' }}></div>
        </div>
        
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>System Performance: 94%</span>
          <span>3 of 4 services optimal</span>
        </div>
      </div>
    </div>
  );
};

export default SystemStatus;