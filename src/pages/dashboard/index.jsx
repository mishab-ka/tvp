import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllTVPOwners,
  getAllVehicles,
  getVehicleStatistics,
  getBillSummaryStatistics,
} from "../../lib/tvpManagementAPI";
import { userManagementAPI } from "../../lib/supabase";
import { formatCurrency } from "../../utils/formatters";

const Dashboard = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, hasPermission } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    tvpOwners: 0,
    vehicles: {
      total: 0,
      active: 0,
      maintenance: 0,
      inactive: 0,
    },
    users: {
      total: 0,
      active: 0,
    },
    bills: {
      totalOutstandingAmount: 0,
    },
  });

  // Load dashboard statistics
  useEffect(() => {
    const loadStats = async () => {
      if (!isAuthenticated) return;

      try {
        setLoading(true);
        const promises = [];

        // Load TVP Owners count
        if (hasPermission(["tvp_management"])) {
          promises.push(
            getAllTVPOwners().then((owners) => ({
              tvpOwners: owners?.length || 0,
            }))
          );
        } else {
          promises.push(Promise.resolve({ tvpOwners: 0 }));
        }

        // Load Vehicle statistics
        if (hasPermission(["vehicle_management", "tvp_management"])) {
          promises.push(
            getVehicleStatistics().then((vehicleStats) => ({
              vehicles: vehicleStats || {
                total: 0,
                active: 0,
                maintenance: 0,
                inactive: 0,
              },
            }))
          );
        } else {
          promises.push(
            Promise.resolve({
              vehicles: { total: 0, active: 0, maintenance: 0, inactive: 0 },
            })
          );
        }

        // Load User statistics
        if (hasPermission(["user_management"])) {
          promises.push(
            userManagementAPI.getUserStats().then((userStats) => ({
              users: userStats || { total: 0, active: 0 },
            }))
          );
        } else {
          promises.push(Promise.resolve({ users: { total: 0, active: 0 } }));
        }

        // Load Bill summary statistics
        if (hasPermission(["tvp_management", "financial_reports"])) {
          promises.push(
            getBillSummaryStatistics().then((billStats) => ({
              bills: billStats || {
                totalOutstandingAmount: 0,
              },
            }))
          );
        } else {
          promises.push(
            Promise.resolve({
              bills: {
                totalOutstandingAmount: 0,
              },
            })
          );
        }

        const results = await Promise.all(promises);
        const combinedStats = results.reduce((acc, result) => {
          return { ...acc, ...result };
        }, {});

        setStats(combinedStats);
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isAuthenticated, hasPermission]);

  // Quick action cards based on permissions
  const quickActions = [
    {
      title: "TVP Management",
      description: "Manage TVP owners and drivers",
      icon: "Users",
      path: "/tvp-owners-management",
      permissions: ["tvp_management"],
      color: "bg-blue-500",
    },
    {
      title: "Vehicle Management",
      description: "View and manage all vehicles",
      icon: "Car",
      path: "/vehicle-management",
      permissions: ["vehicle_management"],
      color: "bg-green-500",
    },
    {
      title: "User Management",
      description: "Manage system users and roles",
      icon: "UserCog",
      path: "/admin-user-management",
      permissions: ["user_management"],
      color: "bg-purple-500",
    },
    {
      title: "Financial Reports",
      description: "Generate accounting reports",
      icon: "FileText",
      path: "/hissab-accounting-generator",
      permissions: ["financial_reports"],
      color: "bg-orange-500",
    },
    {
      title: "Executive Dashboard",
      description: "View executive overview",
      icon: "BarChart3",
      path: "/executive-dashboard",
      permissions: ["dashboard_view"],
      color: "bg-indigo-500",
    },
  ].filter((action) => hasPermission(action.permissions));

  if (loading) {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        title="Dashboard"
        subtitle="Welcome to Tawaaq Admin Portal"
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border">
            <Sidebar
              isCollapsed={false}
              onToggle={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`transition-all duration-300 ease-in-out pt-16 ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
        }`}
      >
        <div className="p-4 lg:p-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Welcome back, {currentUser?.name || currentUser?.email}!
            </h1>
            <p className="text-muted-foreground">
              Here's an overview of your system
            </p>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {hasPermission(["tvp_management"]) && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      TVP Owners
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.tvpOwners}
                    </p>
                  </div>
                  <Icon name="Users" size={24} className="text-primary" />
                </div>
              </div>
            )}

            {hasPermission(["vehicle_management", "tvp_management"]) && (
              <>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Total Vehicles
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.vehicles.total}
                      </p>
                    </div>
                    <Icon name="Car" size={24} className="text-primary" />
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Active Vehicles
                      </p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.vehicles.active}
                      </p>
                    </div>
                    <Icon
                      name="CheckCircle"
                      size={24}
                      className="text-green-600"
                    />
                  </div>
                </div>
              </>
            )}

            {hasPermission(["user_management"]) && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      System Users
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {stats.users.total}
                    </p>
                  </div>
                  <Icon name="UserCog" size={24} className="text-primary" />
                </div>
              </div>
            )}
          </div>

          {/* Outstanding Balance Summary */}
          {hasPermission(["tvp_management", "financial_reports"]) && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Financial Summary
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Outstanding Amount */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        Total Outstanding Amount
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          stats.bills.totalOutstandingAmount > 0
                            ? "text-error"
                            : "text-success"
                        }`}
                      >
                        {formatCurrency(stats.bills.totalOutstandingAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Amount to collect from all drivers
                      </p>
                    </div>
                    <Icon
                      name="AlertCircle"
                      size={24}
                      className={
                        stats.bills.totalOutstandingAmount > 0
                          ? "text-error"
                          : "text-success"
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="bg-card border border-border rounded-lg p-6 hover:border-primary hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                    >
                      <Icon
                        name={action.icon}
                        size={24}
                        className="text-white"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                    <Icon
                      name="ChevronRight"
                      size={20}
                      className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0"
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Activity / Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Info */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                System Information
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Your Role
                  </span>
                  <span className="text-sm font-medium text-foreground capitalize">
                    {currentUser?.role || "User"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium text-foreground">
                    {currentUser?.email}
                  </span>
                </div>
                {currentUser?.department && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Department
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {currentUser.department}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Help & Support */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Need Help?
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  If you need assistance or have questions about the system,
                  please contact your administrator.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/executive-dashboard")}
                  >
                    <Icon name="BarChart3" size={16} className="mr-2" />
                    View Reports
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
