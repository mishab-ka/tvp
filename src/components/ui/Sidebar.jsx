import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Icon from "../AppIcon";
import Button from "./Button";
import LogoutButton from "../LogoutButton";
import { useAuth } from "../../contexts/AuthContext";

const Sidebar = ({ isCollapsed = false, onToggle }) => {
  const location = useLocation();
  const {
    currentUser,
    sessionExpiry,
    hasPermission,
    isSessionExpiringSoon,
    extendSession,
  } = useAuth();

  const navigationItems = [
    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "BarChart3",
      permissions: ["dashboard_view"],
      tooltip: "Your personalized dashboard",
    },
    {
      label: "TVP Management",
      path: "/tvp-owners-management",
      icon: "Users",
      permissions: ["tvp_management"],
      tooltip: "Vendor relationship management",
    },

    // {
    //   label: "Owner Profile",
    //   path: "/tvp-owner-profile-detail",
    //   icon: "UserCheck",
    //   permissions: ["tvp_management"],
    //   tooltip: "Detailed owner information",
    // },
    // {
    //   label: "TVP Owner Dashboard",
    //   path: "/tvp-owner-dashboard",
    //   icon: "Car",
    //   permissions: ["cars_list"],
    //   tooltip: "Fleet management and financial overview",
    // },
    {
      label: "Cars",
      path: "/vehicle-management",
      icon: "Car",
      permissions: ["vehicle_management"],
      tooltip: "Manage all vehicles and cars",
    },
    {
      label: "Financial Reports",
      path: "/hissab-accounting-generator",
      icon: "FileText",
      permissions: ["financial_reports"],
      tooltip: "Accounting and reporting tools",
    },
    {
      label: "Vehicle Performance Sheet",
      path: "/vehicle-performance-sheet",
      icon: "BarChart2",
      permissions: ["financial_reports"],
      tooltip: "Per-vehicle weekly performance and financial summary",
    },
    {
      label: "User Management",
      path: "/admin-user-management",
      icon: "UserCog",
      permissions: ["user_management"],
      tooltip: "System and user administration",
    },
    {
      label: "Bulk Bill Generator",
      path: "/bulk-bill-generator",
      icon: "Upload",
      permissions: ["tvp_management"],
      tooltip: "Generate bills from PDF upload",
    },
    {
      label: "Admin Settings",
      path: "/admin-settings",
      icon: "Settings",
      permissions: ["dashboard_view"],
      tooltip: "Admin settings and system configuration",
    },
  ];

  const quickActions = [
    {
      label: "Add TVP Owner",
      icon: "UserPlus",
      action: () => console.log("Add TVP Owner"),
      permissions: ["tvp_management"],
    },
    {
      label: "View Fleet",
      icon: "Car",
      action: () => navigate("/dashboard"),
      permissions: ["cars_list"],
    },
    {
      label: "Generate Report",
      icon: "FileBarChart",
      action: () => console.log("Generate Report"),
      permissions: ["financial_reports"],
    },
    {
      label: "Create User",
      icon: "UserPlus2",
      action: () => console.log("Create User"),
      permissions: ["user_management"],
    },
  ];

  const integrationStatus = {
    erp: { status: "connected", label: "ERP System" },
    accounting: { status: "connected", label: "Accounting" },
    sso: { status: "warning", label: "SSO" },
  };

  const isActivePath = (path) => {
    return location?.pathname === path || location?.pathname?.startsWith(path);
  };

  // hasPermission is now provided by useAuth hook

  const handleNavigation = (path) => {
    window.location.href = path;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
        return "text-success";
      case "warning":
        return "text-warning";
      case "error":
        return "text-error";
      default:
        return "text-muted-foreground";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
        return "CheckCircle";
      case "warning":
        return "AlertTriangle";
      case "error":
        return "XCircle";
      default:
        return "Circle";
    }
  };

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-100 h-full bg-surface border-r border-border sidebar-shadow transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                  <span className="text-primary-foreground">T</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">
                    Tawaaq
                  </h1>
                  <p className="text-xs text-muted-foreground -mt-1">
                    Admin Portal
                  </p>
                </div>
              </div>
            )}

            <Button
              variant="none"
              size="icon"
              onClick={onToggle}
              iconName={isCollapsed ? "ChevronRight" : "ChevronLeft"}
              iconSize={18}
            >
              <span className="sr-only">Toggle sidebar</span>
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems?.map((item) => {
              if (!hasPermission(item?.permissions)) return null;

              const isActive = isActivePath(item?.path);

              return (
                <div key={item?.path} className="relative group">
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    fullWidth
                    onClick={() => handleNavigation(item?.path)}
                    iconName={item?.icon}
                    iconPosition="left"
                    iconSize={18}
                    className={`justify-start nav-item-hover ${
                      isCollapsed ? "px-2" : ""
                    }`}
                  >
                    {!isCollapsed && item?.label}
                  </Button>
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-popover border border-border rounded-md px-2 py-1 text-xs text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-200">
                      {item?.label}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-popover"></div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Quick Actions */}
          {!isCollapsed && (
            <div className="p-4 border-t border-border">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              <div className="space-y-1">
                {quickActions?.map((action, index) => {
                  if (!hasPermission(action?.permissions)) return null;

                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      size="sm"
                      fullWidth
                      onClick={action?.action}
                      iconName={action?.icon}
                      iconPosition="left"
                      iconSize={16}
                      className="justify-start text-xs nav-item-hover"
                    >
                      {action?.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Integration Status */}
          <div className="p-4 border-t border-border">
            {!isCollapsed ? (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  System Status
                </h3>
                <div className="space-y-2">
                  {Object.entries(integrationStatus)?.map(
                    ([key, integration]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-muted-foreground">
                          {integration.label}
                        </span>
                        <div className="flex items-center space-x-1">
                          <Icon
                            name={getStatusIcon(integration.status)}
                            size={12}
                            className={getStatusColor(integration.status)}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2">
                {Object.entries(integrationStatus)?.map(
                  ([key, integration]) => (
                    <div key={key} className="flex justify-center">
                      <Icon
                        name={getStatusIcon(integration.status)}
                        size={16}
                        className={getStatusColor(integration.status)}
                      />
                    </div>
                  ),
                )}
              </div>
            )}
          </div>

          {/* User Profile & Logout */}
          <div className="p-4 border-t border-border">
            {!isCollapsed ? (
              <div className="space-y-3">
                {/* User Info */}
                {currentUser && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 p-2 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <Icon
                          name="User"
                          size={16}
                          className="text-primary-foreground"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {currentUser.name || currentUser.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {currentUser.roleName || currentUser.role}
                        </p>
                      </div>
                    </div>

                    {/* Session Expiry */}
                    {sessionExpiry && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs px-2">
                          <span className="text-muted-foreground">
                            Session expires
                          </span>
                          <span
                            className={`font-medium ${
                              isSessionExpiringSoon()
                                ? "text-warning"
                                : "text-muted-foreground"
                            }`}
                          >
                            {sessionExpiry.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Session Expiry Warning */}
                        {isSessionExpiringSoon() && (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1 px-2 py-1 bg-warning/10 border border-warning/20 rounded text-xs">
                              <Icon
                                name="Clock"
                                size={12}
                                className="text-warning"
                              />
                              <span className="text-warning">
                                Session expiring soon
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="xs"
                              fullWidth
                              onClick={() => {
                                const success = extendSession();
                                if (success) {
                                  // Session expiry will be updated automatically by AuthContext
                                  console.log("Session extended successfully");
                                }
                              }}
                              iconName="RefreshCw"
                              iconSize={12}
                              className="text-xs text-primary hover:text-primary/80"
                            >
                              Extend Session
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Logout Button */}
                <LogoutButton
                  variant="ghost"
                  size="sm"
                  fullWidth
                  className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-2">
                {/* User Avatar */}
                {currentUser && (
                  <div className="relative">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Icon
                        name="User"
                        size={16}
                        className="text-primary-foreground"
                      />
                    </div>
                    {/* Session expiry indicator */}
                    {isSessionExpiringSoon() && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning rounded-full border-2 border-surface"></div>
                    )}
                  </div>
                )}

                {/* Session Refresh Button (when expiring) */}
                {isSessionExpiringSoon() && (
                  <div className="relative group">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        const success = extendSession();
                        if (success) {
                          // Session expiry will be updated automatically by AuthContext
                          console.log("Session extended successfully");
                        }
                      }}
                      iconName="RefreshCw"
                      iconSize={16}
                      className="text-primary hover:text-primary/80"
                    />
                    {/* Tooltip for collapsed state */}
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-popover border border-border rounded-md px-2 py-1 text-xs text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-200">
                      Extend Session
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-popover"></div>
                    </div>
                  </div>
                )}

                {/* Logout Icon */}
                <div className="relative group">
                  <LogoutButton
                    variant="ghost"
                    size="icon"
                    showText={false}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  />
                  {/* Tooltip for collapsed state */}
                  <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-popover border border-border rounded-md px-2 py-1 text-xs text-popover-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-200">
                    Logout
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-popover"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
      {/* Content Spacer */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          isCollapsed ? "ml-16" : "ml-60"
        }`}
      >
        {/* This div ensures content doesn't overlap with fixed sidebar */}
      </div>
    </>
  );
};

export default Sidebar;
