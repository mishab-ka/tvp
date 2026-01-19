import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import {
  formatCurrency,
  formatDate,
  formatIndianNumber,
} from "../../utils/formatters";

const TVPOwnerDashboard = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("cars");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Real data from Supabase
  const [cars, setCars] = useState([]);
  const [hissabData, setHissabData] = useState({
    totalEarnings: 0,
    totalCashCollect: 0,
    totalToll: 0,
    totalAdjustments: 0,
    totalUberTransfer: 0,
    totalOutstanding: 0,
    netOutstanding: 0,
    weeklyStats: [],
    recentTransactions: [],
  });
  const [supportTickets, setSupportTickets] = useState([]);
  const [dashboardOverview, setDashboardOverview] = useState(null);

  // Load data directly from Supabase
  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      console.log("Current user from AuthContext:", currentUser);
      console.log("Is authenticated:", isAuthenticated);

      if (!currentUser || !currentUser.id) {
        console.log("No current user found in AuthContext");
        throw new Error("User not authenticated. Please login again.");
      }

      const userId = currentUser.id;
      console.log("Loading data for user ID:", userId);

      // Load cars directly from Supabase
      console.log("Loading cars for user ID:", userId);
      const { data: carsData, error: carsError } = await supabase
        .from("cars")
        .select("*")
        .eq("tvp_owner_id", userId)
        .order("created_at", { ascending: false });

      console.log("Cars direct response:", { carsData, carsError });
      // console.log("Cars data length:", carsData?.length || 0);
      // console.log("First car data:", carsData?.[0]);

      if (carsError) throw new Error(`Cars: ${carsError.message}`);
      setCars(carsData || []);
      console.log("Cars state set to:", carsData || []);

      // Load hissab transactions directly from Supabase
      console.log("Loading hissab transactions for user ID:", userId);
      const { data: transactionsData, error: transactionsError } =
        await supabase
          .from("hissab_transactions")
          .select("*")
          .eq("tvp_owner_id", userId)
          .order("week_date", { ascending: false })
          .limit(10);

      console.log("Transactions direct response:", {
        transactionsData,
        transactionsError,
      });
      console.log("Transactions data length:", transactionsData?.length || 0);
      console.log("First transaction data:", transactionsData?.[0]);

      if (transactionsError)
        throw new Error(`Transactions: ${transactionsError.message}`);

      // Calculate financial summary from transactions
      const totalEarnings = (transactionsData || []).reduce(
        (sum, t) => sum + parseFloat(t.total_earnings || 0),
        0
      );
      const totalCashCollect = (transactionsData || []).reduce(
        (sum, t) => sum + parseFloat(t.cash_collect || 0),
        0
      );
      const totalToll = (transactionsData || []).reduce(
        (sum, t) => sum + parseFloat(t.toll || 0),
        0
      );
      const totalAdjustments = (transactionsData || []).reduce(
        (sum, t) => sum + parseFloat(t.adjustment_amount || 0),
        0
      );
      const totalUberTransfer = (transactionsData || []).reduce(
        (sum, t) => sum + parseFloat(t.uber_transfer || 0),
        0
      );
      const totalOutstanding = (transactionsData || []).reduce(
        (sum, t) => sum + parseFloat(t.total_outstanding || 0),
        0
      );
      const netOutstanding = (transactionsData || []).reduce(
        (sum, t) => sum + parseFloat(t.net_outstanding || 0),
        0
      );

      setHissabData({
        totalEarnings,
        totalCashCollect,
        totalToll,
        totalAdjustments,
        totalUberTransfer,
        totalOutstanding,
        netOutstanding,
        weeklyStats: [],
        recentTransactions: transactionsData || [],
      });
      console.log("Hissab state set to:", {
        totalEarnings,
        totalCashCollect,
        totalToll,
        totalAdjustments,
        totalUberTransfer,
        totalOutstanding,
        netOutstanding,
        recentTransactions: transactionsData || [],
      });

      // Load support tickets directly from Supabase
      console.log("Loading support tickets...");
      const { data: ticketsData, error: ticketsError } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("tvp_owner_id", userId)
        .order("created_at", { ascending: false });

      console.log("Tickets direct response:", { ticketsData, ticketsError });
      if (ticketsError) throw new Error(`Tickets: ${ticketsError.message}`);
      setSupportTickets(ticketsData || []);

      // Create dashboard overview
      const carStats = {
        total: (carsData || []).length,
        active: (carsData || []).filter((c) => c.status === "active").length,
        maintenance: (carsData || []).filter((c) => c.status === "maintenance")
          .length,
        inactive: (carsData || []).filter((c) => c.status === "inactive")
          .length,
      };

      const ticketStats = {
        total: (ticketsData || []).length,
        open: (ticketsData || []).filter((t) => t.status === "open").length,
        inProgress: (ticketsData || []).filter(
          (t) => t.status === "in_progress"
        ).length,
        resolved: (ticketsData || []).filter((t) => t.status === "resolved")
          .length,
      };

      setDashboardOverview({
        carStats,
        financialSummary: {
          totalEarnings,
          totalCashCollect,
          totalToll,
          totalAdjustments,
          totalUberTransfer,
          totalOutstanding,
          netOutstanding,
        },
        ticketStats,
      });

      console.log("All data loaded successfully!");
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError(err.message);

      // If authentication error, redirect to login
      if (
        err.message.includes("not authenticated") ||
        err.message.includes("Please login")
      ) {
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [currentUser, navigate]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "maintenance":
        return "text-orange-600 bg-orange-100";
      case "inactive":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-orange-600 bg-orange-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getTicketStatusColor = (status) => {
    switch (status) {
      case "open":
        return "text-blue-600 bg-blue-100";
      case "in_progress":
        return "text-orange-600 bg-orange-100";
      case "resolved":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        title="TVP Owner Dashboard"
        subtitle="Fleet Management & Financial Overview"
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
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
        }`}
      >
        <div className="p-4 lg:p-6">
          {/* Welcome Section */}
          <div className="mb-6 mt-18">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
              Welcome back, {currentUser?.name || "TVP Owner"}!
            </h1>
            <p className="text-muted-foreground">
              Manage your fleet, track finances, and get support
            </p>

            {/* Debug Information */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                Debug Info:
              </h3>
              <div className="text-xs text-yellow-700 space-y-1">
                <div>Is Authenticated: {isAuthenticated ? "Yes" : "No"}</div>
                <div>Current User ID: {currentUser?.id || "None"}</div>
                <div>Current User Role: {currentUser?.role || "None"}</div>
                <div>
                  LocalStorage Session:{" "}
                  {localStorage.getItem("tawaaq_session")
                    ? "Present"
                    : "Missing"}
                </div>
                <div>Cars Count: {cars.length}</div>
                <div>
                  Hissab Transactions: {hissabData.recentTransactions.length}
                </div>
                <div>Support Tickets: {supportTickets.length}</div>
                <button
                  onClick={() => {
                    console.log("Current User:", currentUser);
                    console.log(
                      "LocalStorage:",
                      localStorage.getItem("tawaaq_session")
                    );
                    console.log("Is Authenticated:", isAuthenticated);
                    console.log("Current Cars State:", cars);
                    console.log("Current Hissab State:", hissabData);
                    console.log("Current Support State:", supportTickets);
                  }}
                  className="text-blue-600 underline"
                >
                  Log Debug Info to Console
                </button>
                <button
                  onClick={() => {
                    console.log("Manually triggering data load...");
                    loadDashboardData();
                  }}
                  className="text-green-600 underline ml-2"
                >
                  Reload Data
                </button>
                <button
                  onClick={async () => {
                    console.log("Testing data without user filter...");

                    // Test cars without user filter
                    const { data: allCars, error: carsError } = await supabase
                      .from("cars")
                      .select("*");
                    console.log("All cars (no filter):", allCars);

                    // Test transactions without user filter
                    const { data: allTransactions, error: transactionsError } =
                      await supabase.from("hissab_transactions").select("*");
                    console.log(
                      "All transactions (no filter):",
                      allTransactions
                    );

                    console.log("Current user ID:", currentUser?.id);

                    // Check if any cars are assigned to current user
                    if (allCars && allCars.length > 0) {
                      console.log(
                        "Cars with tvp_owner_id:",
                        allCars.map((car) => ({
                          car_number: car.car_number,
                          tvp_owner_id: car.tvp_owner_id,
                        }))
                      );
                    }
                  }}
                  className="text-orange-600 underline ml-2"
                >
                  Test No Filter
                </button>
                <button
                  onClick={async () => {
                    console.log("Fixing data assignment for current user...");

                    const userId = currentUser?.id;
                    if (!userId) {
                      console.log("No user ID found!");
                      return;
                    }

                    // Update all cars to be assigned to current user
                    const { data: updateCars, error: carsUpdateError } =
                      await supabase
                        .from("cars")
                        .update({ tvp_owner_id: userId })
                        .neq("tvp_owner_id", userId);

                    console.log("Cars update result:", {
                      updateCars,
                      carsUpdateError,
                    });

                    // Update all transactions to be assigned to current user
                    const {
                      data: updateTransactions,
                      error: transactionsUpdateError,
                    } = await supabase
                      .from("hissab_transactions")
                      .update({ tvp_owner_id: userId })
                      .neq("tvp_owner_id", userId);

                    console.log("Transactions update result:", {
                      updateTransactions,
                      transactionsUpdateError,
                    });

                    // Update all support tickets to be assigned to current user
                    const { data: updateTickets, error: ticketsUpdateError } =
                      await supabase
                        .from("support_tickets")
                        .update({ tvp_owner_id: userId })
                        .neq("tvp_owner_id", userId);

                    console.log("Tickets update result:", {
                      updateTickets,
                      ticketsUpdateError,
                    });

                    console.log("Data assignment fixed! Now reload the data.");
                  }}
                  className="text-red-600 underline ml-2"
                >
                  Fix Data Assignment
                </button>
                <button
                  onClick={async () => {
                    console.log("Testing database tables directly...");

                    // Test cars table
                    const { data: carsTest, error: carsError } = await supabase
                      .from("cars")
                      .select("count")
                      .limit(1);
                    console.log("Cars table test:", { carsTest, carsError });

                    // Test hissab_transactions table
                    const { data: hissabTest, error: hissabError } =
                      await supabase
                        .from("hissab_transactions")
                        .select("count")
                        .limit(1);
                    console.log("Hissab table test:", {
                      hissabTest,
                      hissabError,
                    });

                    // Test support_tickets table
                    const { data: ticketsTest, error: ticketsError } =
                      await supabase
                        .from("support_tickets")
                        .select("count")
                        .limit(1);
                    console.log("Support tickets table test:", {
                      ticketsTest,
                      ticketsError,
                    });

                    // Check all cars in database
                    const { data: allCars, error: allCarsError } =
                      await supabase.from("cars").select("*");
                    console.log("All cars in database:", allCars);
                    console.log("All cars error:", allCarsError);

                    // Check all transactions in database
                    const {
                      data: allTransactions,
                      error: allTransactionsError,
                    } = await supabase.from("hissab_transactions").select("*");
                    console.log(
                      "All transactions in database:",
                      allTransactions
                    );
                    console.log(
                      "All transactions error:",
                      allTransactionsError
                    );

                    console.log("Database test complete!");
                  }}
                  className="text-purple-600 underline ml-2"
                >
                  Test Database
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 border-b border-border">
              <button
                onClick={() => setActiveTab("cars")}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === "cars"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon name="Car" size={16} className="inline mr-2" />
                Cars List
              </button>
              <button
                onClick={() => setActiveTab("hissab")}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === "hissab"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon name="BarChart3" size={16} className="inline mr-2" />
                Hissab
              </button>
              <button
                onClick={() => setActiveTab("support")}
                className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  activeTab === "support"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon name="HelpCircle" size={16} className="inline mr-2" />
                Support
              </button>
            </div>
          </div>

          {/* Loading and Error States */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">
                  Loading dashboard data...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Icon
                  name="AlertCircle"
                  size={20}
                  className="text-red-600 mr-2"
                />
                <div>
                  <h3 className="text-red-800 font-medium">
                    Error Loading Data
                  </h3>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="space-y-6">
            {/* Cars List Tab */}
            {activeTab === "cars" && !loading && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Fleet Overview
                    </h2>
                    <p className="text-muted-foreground">
                      {cars.length} vehicles in your fleet
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Icon name="Filter" size={16} className="mr-2" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm">
                      <Icon name="Download" size={16} className="mr-2" />
                      Export
                    </Button>
                  </div>
                </div>

                {/* Cars Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cars.map((car) => (
                    <div
                      key={car.id}
                      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {car.car_number}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {car.fleet_name}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            car.status
                          )}`}
                        >
                          {car.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Deposit:
                          </span>
                          <span className="text-foreground">
                            {formatCurrency(car.deposit_amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Audit KM:
                          </span>
                          <span className="text-foreground">
                            {formatIndianNumber(car.audit_km || 0)} km
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tires:</span>
                          <span className="text-foreground">
                            {car.audit_tires}/4
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Body:</span>
                          <span className="text-foreground">
                            {car.audit_body}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Engine:</span>
                          <span className="text-foreground">
                            {car.audit_engine}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Battery:
                          </span>
                          <span className="text-foreground">
                            {car.audit_battery}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border">
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Icon name="Eye" size={14} className="mr-1" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            <Icon name="FileText" size={14} className="mr-1" />
                            Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hissab Tab */}
            {activeTab === "hissab" && !loading && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Financial Overview
                    </h2>
                    <p className="text-muted-foreground">
                      Track your revenue, expenses, and profits
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Icon name="Calendar" size={16} className="mr-2" />
                      This Month
                    </Button>
                    <Button variant="outline" size="sm">
                      <Icon name="Download" size={16} className="mr-2" />
                      Export Report
                    </Button>
                  </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Earnings
                        </p>
                        <p className="text-xl font-bold text-green-600">
                          {formatCurrency(hissabData.totalEarnings)}
                        </p>
                      </div>
                      <Icon
                        name="TrendingUp"
                        size={20}
                        className="text-green-600"
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Cash Collect
                        </p>
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(hissabData.totalCashCollect)}
                        </p>
                      </div>
                      <Icon
                        name="DollarSign"
                        size={20}
                        className="text-blue-600"
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Total Outstanding
                        </p>
                        <p className="text-xl font-bold text-orange-600">
                          {formatCurrency(hissabData.totalOutstanding)}
                        </p>
                      </div>
                      <Icon
                        name="AlertCircle"
                        size={20}
                        className="text-orange-600"
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Net Outstanding
                        </p>
                        <p className="text-xl font-bold text-red-600">
                          {formatCurrency(hissabData.netOutstanding)}
                        </p>
                      </div>
                      <Icon
                        name="MinusCircle"
                        size={20}
                        className="text-red-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-card border border-border rounded-lg">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">
                      Recent Transactions
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {hissabData.recentTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-foreground">
                                Week of {formatDate(transaction.week_date)}
                              </h4>
                              {transaction.cars && (
                                <span className="text-sm text-muted-foreground">
                                  • {transaction.cars.car_number}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">
                                  Trips:
                                </span>
                                <span className="ml-1 font-medium">
                                  {transaction.total_trips}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Earnings:
                                </span>
                                <span className="ml-1 font-medium text-green-600">
                                  {formatCurrency(transaction.total_earnings)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Cash:
                                </span>
                                <span className="ml-1 font-medium text-blue-600">
                                  {formatCurrency(transaction.cash_collect)}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Outstanding:
                                </span>
                                <span className="ml-1 font-medium text-orange-600">
                                  {formatCurrency(
                                    transaction.total_outstanding
                                  )}
                                </span>
                              </div>
                            </div>
                            {transaction.adjustment_description && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                <span className="font-medium">Adjustment:</span>{" "}
                                {transaction.adjustment_description}
                                {transaction.adjustment_amount > 0 && (
                                  <span className="ml-1 text-red-600">
                                    (
                                    {formatCurrency(
                                      transaction.adjustment_amount
                                    )}
                                    )
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Icon name="Eye" size={14} className="mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Support Tab */}
            {activeTab === "support" && !loading && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Support Center
                    </h2>
                    <p className="text-muted-foreground">
                      Get help and submit support requests
                    </p>
                  </div>
                  <Button>
                    <Icon name="Plus" size={16} className="mr-2" />
                    New Ticket
                  </Button>
                </div>

                {/* Support Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Open Tickets
                        </p>
                        <p className="text-2xl font-bold text-blue-600">
                          {
                            supportTickets.filter((t) => t.status === "open")
                              .length
                          }
                        </p>
                      </div>
                      <Icon
                        name="AlertCircle"
                        size={24}
                        className="text-blue-600"
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          In Progress
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                          {
                            supportTickets.filter(
                              (t) => t.status === "in_progress"
                            ).length
                          }
                        </p>
                      </div>
                      <Icon
                        name="Clock"
                        size={24}
                        className="text-orange-600"
                      />
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Resolved
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {
                            supportTickets.filter(
                              (t) => t.status === "resolved"
                            ).length
                          }
                        </p>
                      </div>
                      <Icon
                        name="CheckCircle"
                        size={24}
                        className="text-green-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Support Tickets */}
                <div className="bg-card border border-border rounded-lg">
                  <div className="p-4 border-b border-border">
                    <h3 className="text-lg font-semibold text-foreground">
                      Recent Tickets
                    </h3>
                  </div>
                  <div className="divide-y divide-border">
                    {supportTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="p-4 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium text-foreground">
                                {ticket.title}
                              </h4>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getTicketStatusColor(
                                  ticket.status
                                )}`}
                              >
                                {ticket.status.replace("_", " ")}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                                  ticket.priority
                                )}`}
                              >
                                {ticket.priority}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {ticket.description}
                            </p>
                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                Created: {formatDate(ticket.created_at)}
                              </span>
                              <span>
                                Assigned: {ticket.assigned_to || "Unassigned"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Icon name="Eye" size={14} className="mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Icon
                                name="MessageSquare"
                                size={14}
                                className="mr-1"
                              />
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TVPOwnerDashboard;
