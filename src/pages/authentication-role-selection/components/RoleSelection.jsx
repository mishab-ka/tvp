import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const RoleSelection = ({ userData, onRoleSelected }) => {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Mock user roles and permissions
  const availableRoles = {
    super_admin: {
      title: 'Super Administrator',
      description: 'Full system access including user management and system configuration',
      permissions: [
        'User Management',
        'System Configuration', 
        'Financial Reports',
        'TVP Management',
        'Audit Logs'
      ],
      lastLogin: '2025-01-22 09:15:00',
      icon: 'Crown',
      color: 'text-error',
      bgColor: 'bg-error/10',
      borderColor: 'border-error/20'
    },
    manager: {
      title: 'Manager',
      description: 'Comprehensive TVP and financial management access with reporting capabilities',
      permissions: [
        'TVP Management',
        'Financial Reports',
        'Vehicle Assignment',
        'Performance Analytics',
        'Team Oversight'
      ],
      lastLogin: '2025-01-22 08:30:00',
      icon: 'Users',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20'
    },
    admin: {
      title: 'Administrator',
      description: 'TVP owner management, vehicle assignments, and daily accounting operations',
      permissions: [
        'TVP Owner Management',
        'Vehicle Assignment',
        'Daily Accounting',
        'Document Management',
        'Basic Reports'
      ],
      lastLogin: '2025-01-21 16:45:00',
      icon: 'UserCheck',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      borderColor: 'border-primary/20'
    }
  };

  // Filter roles based on user's actual role
  const getUserRoles = () => {
    const userRole = userData?.role;
    if (userRole === 'super_admin') {
      return availableRoles;
    } else if (userRole === 'manager') {
      const { super_admin, ...managerRoles } = availableRoles;
      return managerRoles;
    } else {
      return { admin: availableRoles?.admin };
    }
  };

  const userRoles = getUserRoles();

  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const roleData = {
        ...userData,
        selectedRole,
        roleDetails: userRoles?.[selectedRole],
        loginTime: new Date()?.toISOString()
      };

      onRoleSelected(roleData);

      // Navigate based on role
      switch (selectedRole) {
        case 'super_admin': navigate('/executive-dashboard');
          break;
        case 'manager': navigate('/executive-dashboard');
          break;
        case 'admin': navigate('/tvp-owners-management');
          break;
        default:
          navigate('/executive-dashboard');
      }

    } catch (error) {
      console.error('Role selection failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastLogin = (timestamp) => {
    const date = new Date(timestamp);
    return date?.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
          <Icon name="UserCog" size={32} className="text-accent" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Select Your Role</h2>
        <p className="text-sm text-muted-foreground">
          Choose the role you want to use for this session
        </p>
      </div>
      <div className="space-y-3">
        {Object.entries(userRoles)?.map(([roleKey, role]) => (
          <div
            key={roleKey}
            onClick={() => handleRoleSelect(roleKey)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedRole === roleKey
                ? `${role?.bgColor} ${role?.borderColor} shadow-sm`
                : 'bg-card border-border hover:border-primary/30'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                selectedRole === roleKey ? role?.bgColor : 'bg-muted'
              }`}>
                <Icon 
                  name={role?.icon} 
                  size={24} 
                  className={selectedRole === roleKey ? role?.color : 'text-muted-foreground'} 
                />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">{role?.title}</h3>
                  {selectedRole === roleKey && (
                    <Icon name="CheckCircle" size={20} className={role?.color} />
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground">{role?.description}</p>
                
                <div className="flex flex-wrap gap-1">
                  {role?.permissions?.slice(0, 3)?.map((permission, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md"
                    >
                      {permission}
                    </span>
                  ))}
                  {role?.permissions?.length > 3 && (
                    <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md">
                      +{role?.permissions?.length - 3} more
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Icon name="Clock" size={12} />
                  <span>Last login: {formatLastLogin(role?.lastLogin)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <Button
        variant="default"
        size="lg"
        fullWidth
        onClick={handleContinue}
        disabled={!selectedRole}
        loading={isLoading}
        iconName="ArrowRight"
        iconPosition="right"
      >
        Continue as {selectedRole ? userRoles?.[selectedRole]?.title : 'Selected Role'}
      </Button>
      <div className="p-4 bg-muted/50 rounded-md border border-border">
        <div className="flex items-start space-x-3">
          <Icon name="Shield" size={16} className="text-primary mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Session Security</p>
            <p className="text-xs text-muted-foreground">
              Your session will automatically expire after 8 hours of inactivity. 
              All actions are logged for audit purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;