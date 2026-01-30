import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllTVPOwners,
  getAllVehicles,
  getVehicleStatistics,
  getBillSummaryStatistics,
  getPaymentsSummaryByAccount,
} from "../../lib/tvpManagementAPI";
import { userManagementAPI } from "../../lib/supabase";
import { formatCurrency } from "../../utils/formatters";
import {
  calculatePreviousWeek,
  calculateWeekFromDate,
} from "../hissab-accounting-generator/components/WeekSelector";

const toLocalDateString = (d) => {
  const y = d.getFullYear(),
    m = d.getMonth() + 1,
    day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

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
    accountsCollected: {
      letzryd: 0,
      tawaaq_fleet: 0,
      cash_in_hand: 0,
    },
  });

  const [financialDateMode, setFinancialDateMode] = useState("week");
  const [financialWeek, setFinancialWeek] = useState(() => calculatePreviousWeek());
  const [financialCustomStart, setFinancialCustomStart] = useState("");
  const [financialCustomEnd, setFinancialCustomEnd] = useState("");
  const [financialCustomApplied, setFinancialCustomApplied] = useState(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  const { dateFrom, dateTo, rangeLabel } = useMemo(() => {
    if (financialDateMode === "week" && financialWeek?.weekStart && financialWeek?.weekEnd) {
      return {
        dateFrom: financialWeek.weekStart,
        dateTo: financialWeek.weekEnd,
        rangeLabel: (() => {
          const s = new Date(financialWeek.weekStart);
          const e = new Date(financialWeek.weekEnd);
          return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
        })(),
      };
    }
    if (financialDateMode === "custom" && financialCustomApplied?.start && financialCustomApplied?.end) {
      const s = new Date(financialCustomApplied.start);
      const e = new Date(financialCustomApplied.end);
      return {
        dateFrom: financialCustomApplied.start,
        dateTo: financialCustomApplied.end,
        rangeLabel: `${s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      };
    }
    return { dateFrom: null, dateTo: null, rangeLabel: null };
  }, [financialDateMode, financialWeek, financialCustomApplied]);

  const balanceToCollect = useMemo(() => {
    const outstanding = stats.bills.totalOutstandingAmount ?? 0;
    if (dateFrom && dateTo && stats.accountsCollected) {
      const totalCollected =
        (stats.accountsCollected.letzryd ?? 0) +
        (stats.accountsCollected.tawaaq_fleet ?? 0) +
        (stats.accountsCollected.cash_in_hand ?? 0);
      return Math.max(0, outstanding - totalCollected);
    }
    return outstanding;
  }, [dateFrom, dateTo, stats.bills.totalOutstandingAmount, stats.accountsCollected]);

  const loadFinancialSummary = useCallback(
    async (from, to) => {
      if (!hasPermission(["tvp_management", "financial_reports"])) return;
      try {
        setFinancialLoading(true);
        const opts = from && to ? { dateFrom: from, dateTo: to } : {};
        const [billStats, totals] = await Promise.all([
          getBillSummaryStatistics(opts),
          getPaymentsSummaryByAccount(opts),
        ]);
        setStats((prev) => ({
          ...prev,
          bills: billStats || { totalOutstandingAmount: 0 },
          accountsCollected: totals || { letzryd: 0, tawaaq_fleet: 0, cash_in_hand: 0 },
        }));
      } catch (err) {
        console.error("Error loading financial summary:", err);
      } finally {
        setFinancialLoading(false);
      }
    },
    [hasPermission]
  );

  useEffect(() => {
    const loadStats = async () => {
      if (!isAuthenticated) return;
      try {
        setLoading(true);
        const promises = [];

        if (hasPermission(["tvp_management"])) {
          promises.push(
            getAllTVPOwners().then((owners) => ({
              tvpOwners: owners?.length || 0,
            }))
          );
        } else {
          promises.push(Promise.resolve({ tvpOwners: 0 }));
        }

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

        if (hasPermission(["user_management"])) {
          promises.push(
            userManagementAPI.getUserStats().then((userStats) => ({
              users: userStats || { total: 0, active: 0 },
            }))
          );
        } else {
          promises.push(Promise.resolve({ users: { total: 0, active: 0 } }));
        }

        const results = await Promise.all(promises);
        const combined = results.reduce((acc, r) => ({ ...acc, ...r }), {});
        setStats((prev) => ({ ...prev, ...combined }));
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [isAuthenticated, hasPermission]);

  useEffect(() => {
    if (!hasPermission(["tvp_management", "financial_reports"])) return;
    if (!dateFrom || !dateTo) return;
    loadFinancialSummary(dateFrom, dateTo);
  }, [dateFrom, dateTo, hasPermission, loadFinancialSummary]);

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

          {/* Financial Summary */}
          {hasPermission(["tvp_management", "financial_reports"]) && (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Financial Summary
                </h2>
                <div className="flex flex-wrap items-center gap-3">
                  <Select
                    value={financialDateMode}
                    onChange={(v) => {
                      setFinancialDateMode(v ?? "week");
                      if (v === "custom") setFinancialCustomApplied(null);
                    }}
                    options={[
                      { value: "week", label: "Week" },
                      { value: "custom", label: "Custom range" },
                    ]}
                    className="w-36"
                  />
                  {financialDateMode === "week" && (
                    <>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const m = new Date(financialWeek.weekStart);
                            m.setDate(m.getDate() - 7);
                            setFinancialWeek(calculateWeekFromDate(toLocalDateString(m)));
                          }}
                          iconName="ChevronLeft"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const m = new Date(financialWeek.weekStart);
                            m.setDate(m.getDate() + 7);
                            setFinancialWeek(calculateWeekFromDate(toLocalDateString(m)));
                          }}
                          iconName="ChevronRight"
                        />
                      </div>
                      <Input
                        type="date"
                        value={financialWeek?.weekStart ?? ""}
                        onChange={(e) => {
                          const v = e?.target?.value;
                          if (v) setFinancialWeek(calculateWeekFromDate(v));
                        }}
                        className="w-40"
                      />
                    </>
                  )}
                  {financialDateMode === "custom" && (
                    <>
                      <Input
                        type="date"
                        placeholder="Start"
                        value={financialCustomStart}
                        onChange={(e) => setFinancialCustomStart(e?.target?.value ?? "")}
                        className="w-36"
                      />
                      <span className="text-muted-foreground text-sm">to</span>
                      <Input
                        type="date"
                        placeholder="End"
                        value={financialCustomEnd}
                        onChange={(e) => setFinancialCustomEnd(e?.target?.value ?? "")}
                        className="w-36"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={
                          !financialCustomStart ||
                          !financialCustomEnd ||
                          financialCustomStart > financialCustomEnd
                        }
                        onClick={() => {
                          if (
                            financialCustomStart &&
                            financialCustomEnd &&
                            financialCustomStart <= financialCustomEnd
                          ) {
                            setFinancialCustomApplied({
                              start: financialCustomStart,
                              end: financialCustomEnd,
                            });
                          }
                        }}
                        iconName="Check"
                        iconSize={14}
                      >
                        Apply
                      </Button>
                    </>
                  )}
                  {rangeLabel && (
                    <span className="text-sm text-muted-foreground">
                      {rangeLabel}
                    </span>
                  )}
                  {dateFrom && dateTo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={financialLoading}
                      onClick={() => loadFinancialSummary(dateFrom, dateTo)}
                      iconName="RefreshCw"
                      iconSize={14}
                      iconPosition="left"
                    >
                      Refresh
                    </Button>
                  )}
                </div>
              </div>
              {financialLoading ? (
                <div className="flex items-center justify-center py-12 border border-border rounded-lg bg-muted/20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-2" />
                  <span className="text-sm text-muted-foreground">Loading financial summary…</span>
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
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
                {/* Balance to collect */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">
                        Balance to collect
                      </p>
                      <p
                        className={`text-2xl font-bold ${
                          balanceToCollect > 0
                            ? "text-error"
                            : "text-success"
                        }`}
                      >
                        {formatCurrency(balanceToCollect)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Outstanding balance from drivers
                      </p>
                    </div>
                    <Icon
                      name="Banknote"
                      size={24}
                      className={
                        balanceToCollect > 0
                          ? "text-error"
                          : "text-success"
                      }
                    />
                  </div>
                </div>
                {/* Amount collected by account (for selected period) */}
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">LetzRyd A/c</p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(stats.accountsCollected?.letzryd ?? 0)}
                      </p>
                      {rangeLabel && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Collected in selected period
                        </p>
                      )}
                    </div>
                    <Icon name="Building2" size={24} className="text-primary" />
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tawaaq Fleet A/c</p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(stats.accountsCollected?.tawaaq_fleet ?? 0)}
                      </p>
                      {rangeLabel && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Collected in selected period
                        </p>
                      )}
                    </div>
                    <Icon name="Car" size={24} className="text-primary" />
                  </div>
                </div>
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Cash In hand</p>
                      <p className="text-xl font-bold text-foreground">
                        {formatCurrency(stats.accountsCollected?.cash_in_hand ?? 0)}
                      </p>
                      {rangeLabel && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Collected in selected period
                        </p>
                      )}
                    </div>
                    <Icon name="Wallet" size={24} className="text-primary" />
                  </div>
                </div>
              </div>
              )}
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
