import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';

const SecurityNotice = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionInfo, setSessionInfo] = useState({
    ipAddress: '192.168.1.100',
    location: 'New York, NY',
    device: 'Chrome on Windows',
    lastLogin: '2025-01-21 14:30:00'
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const securityFeatures = [
    {
      icon: 'Shield',
      title: 'End-to-End Encryption',
      description: 'All data transmitted using AES-256 encryption'
    },
    {
      icon: 'Lock',
      title: 'Session Security',
      description: 'Automatic logout after 8 hours of inactivity'
    },
    {
      icon: 'Eye',
      title: 'Audit Logging',
      description: 'All actions are logged and monitored'
    },
    {
      icon: 'AlertTriangle',
      title: 'Threat Detection',
      description: 'Real-time monitoring for suspicious activity'
    }
  ];

  const formatDateTime = (date) => {
    return date?.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Current Session Info */}
      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Icon name="Monitor" size={20} className="text-primary" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-foreground">Current Session</h3>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p><strong>Time:</strong> {formatDateTime(currentTime)}</p>
              <p><strong>IP Address:</strong> {sessionInfo?.ipAddress}</p>
              <p><strong>Location:</strong> {sessionInfo?.location}</p>
              <p><strong>Device:</strong> {sessionInfo?.device}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Security Features */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">Security Features</h3>
        <div className="grid grid-cols-1 gap-3">
          {securityFeatures?.map((feature, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-card border border-border rounded-md">
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                <Icon name={feature?.icon} size={16} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{feature?.title}</p>
                <p className="text-xs text-muted-foreground">{feature?.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Compliance Notice */}
      <div className="p-4 bg-warning/5 border border-warning/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <Icon name="AlertTriangle" size={20} className="text-warning" />
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Compliance Notice</h4>
            <p className="text-sm text-muted-foreground">
              This system is for authorized users only. All activities are monitored and logged. 
              Unauthorized access attempts will be reported to security personnel.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Data retention: 7 years as per corporate policy</p>
              <p>• Session timeout: 8 hours of inactivity</p>
              <p>• Failed login attempts: 3 attempts before lockout</p>
            </div>
          </div>
        </div>
      </div>
      {/* Contact Information */}
      <div className="p-4 bg-muted/30 border border-border rounded-lg">
        <div className="flex items-start space-x-3">
          <Icon name="HelpCircle" size={20} className="text-primary" />
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground">Need Help?</h4>
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>IT Support:</strong> support@tawaaq.com</p>
              <p><strong>Emergency:</strong> +1 (555) 123-4567</p>
              <p><strong>Security Issues:</strong> security@tawaaq.com</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityNotice;