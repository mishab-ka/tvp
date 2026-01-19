import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import KPICard from "./components/KPICard";
import PerformanceChart from "./components/PerformanceChart";
import ActivityFeed from "./components/ActivityFeed";
import FilterToolbar from "./components/FilterToolbar";
import SystemStatus from "./components/SystemStatus";
import Sidebar from "components/ui/Sidebar";

const ExecutiveDashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("super_admin"); // Mock role
  const [filters, setFilters] = useState({
    dateRange: "30d",
    department: "all",
    metric: "revenue",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Mock KPI data
  const kpiData = [
    {
      title: "Total TVP Owners",
      value: "156",
      change: "+12.5%",
      changeType: "positive",
      icon: "Users",
      subtitle: "Active partnerships",
    },
    {
      title: "Active Vehicles",
      value: "342",
      change: "+8.2%",
      changeType: "positive",
      icon: "Car",
      subtitle: "Fleet utilization: 89%",
    },
    {
      title: "Outstanding Balance",
      value: "$47,250",
      change: "-15.3%",
      changeType: "positive",
      icon: "AlertTriangle",
      subtitle: "Overdue payments",
    },
    {
      title: "Monthly Earnings",
      value: "$125,840",
      change: "+22.1%",
      changeType: "positive",
      icon: "TrendingUp",
      subtitle: "Revenue this month",
    },
  ];

  // Additional KPIs for Super Admin
  const adminKpiData = [
    {
      title: "System Users",
      value: "24",
      change: "+2",
      changeType: "positive",
      icon: "UserCog",
      subtitle: "Active admin accounts",
    },
    {
      title: "Data Sync Status",
      value: "99.2%",
      change: "+0.5%",
      changeType: "positive",
      icon: "Database",
      subtitle: "ERP integration health",
    },
  ];

  const quickActions = [
    {
      title: "Add TVP Owner",
      description: "Register new vendor partner",
      icon: "UserPlus",
      action: () => navigate("/tvp-owners-management"),
      roles: ["super_admin", "manager", "admin"],
    },
    {
      title: "Generate Report",
      description: "Create financial summary",
      icon: "FileText",
      action: () => navigate("/hissab-accounting-generator"),
      roles: ["super_admin", "manager"],
    },
    {
      title: "Manage Users",
      description: "Admin user controls",
      icon: "Settings",
      action: () => navigate("/admin-user-management"),
      roles: ["super_admin"],
    },
    {
      title: "View Profiles",
      description: "TVP owner details",
      icon: "Eye",
      action: () => navigate("/tvp-owner-profile-detail"),
      roles: ["super_admin", "manager", "admin"],
    },
  ];

  const hasPermission = (roles) => {
    return roles?.includes(userRole);
  };

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    console.log("Filters updated:", newFilters);
  };

  const handleQuickAction = (action) => {
    action();
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>
      {/* Header */}

      <div className="  px-2 w-full">
        <div className="bg-card border-b border-border">
          <div className=" ">
            <div className="flex items-center justify-between h-16 mb-2">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Executive Dashboard
                </h1>
                <p className="text-sm text-muted-foreground">
                  Strategic overview and performance metrics
                </p>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2 px-3 py-1 bg-primary/10 rounded-full">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                  <span className="text-xs font-medium text-primary">
                    Live Data
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  iconName="Download"
                  iconPosition="left"
                  iconSize={16}
                >
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Filter Toolbar */}
        <div className="py-2">
          <FilterToolbar onFiltersChange={handleFiltersChange} />
        </div>
        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiData?.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi?.title}
              value={kpi?.value}
              change={kpi?.change}
              changeType={kpi?.changeType}
              icon={kpi?.icon}
              subtitle={kpi?.subtitle}
              trend={true}
            />
          ))}
        </div>

        {/* Admin-only KPIs */}
        {userRole === "super_admin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            {adminKpiData?.map((kpi, index) => (
              <div key={index} className="lg:col-span-3">
                <KPICard
                  title={kpi?.title}
                  value={kpi?.value}
                  change={kpi?.change}
                  changeType={kpi?.changeType}
                  icon={kpi?.icon}
                  subtitle={kpi?.subtitle}
                  trend={true}
                />
              </div>
            ))}
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Performance Charts - 60% width */}
          <div className="lg:col-span-2">
            <PerformanceChart />
          </div>

          {/* Activity Feed - 40% width */}
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions?.map((action, index) => {
              if (!hasPermission(action?.roles)) return null;

              return (
                <div
                  key={index}
                  onClick={() => handleQuickAction(action?.action)}
                  className="bg-card rounded-lg border border-border p-4 card-shadow hover:shadow-lg transition-all duration-200 cursor-pointer group"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center group-hover:bg-primary/20 transition-colors duration-200">
                      <Icon
                        name={action?.icon}
                        size={20}
                        className="text-primary"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                        {action?.title}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {action?.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <Icon
                      name="ArrowRight"
                      size={16}
                      className="text-muted-foreground group-hover:text-primary transition-colors duration-200"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Status - Admin Only */}
        {userRole === "super_admin" && (
          <div className="mb-8">
            <SystemStatus />
          </div>
        )}

        {/* Footer Stats */}
        <div className="bg-card rounded-lg border border-border p-6 card-shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                2.4s
              </div>
              <div className="text-sm text-muted-foreground">Avg Load Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                99.8%
              </div>
              <div className="text-sm text-muted-foreground">System Uptime</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground mb-1">
                {new Date()?.getFullYear()}
              </div>
              <div className="text-sm text-muted-foreground">
                © Tawaaq Admin Portal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
