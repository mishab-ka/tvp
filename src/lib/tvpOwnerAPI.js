import { supabase } from "./supabase";

// Helper function to get current user from localStorage
const getCurrentUser = () => {
  try {
    console.log("Checking localStorage for session data...");
    const session = localStorage.getItem("tawaaq_session");
    console.log("Session data from localStorage:", session);

    if (!session) {
      console.log("No session found in localStorage");
      throw new Error("User not authenticated");
    }

    const sessionData = JSON.parse(session);
    console.log("Parsed session data:", sessionData);

    if (new Date(sessionData.expiresAt) <= new Date()) {
      console.log("Session expired");
      throw new Error("Session expired");
    }

    if (!sessionData.id) {
      console.log("No user ID in session data");
      throw new Error("User not authenticated");
    }

    console.log("User authenticated successfully:", sessionData.id);
    return sessionData;
  } catch (error) {
    console.log("Error in getCurrentUser:", error);
    throw new Error("User not authenticated");
  }
};

// Test database connection and tables
export const testDatabase = {
  async checkTables() {
    try {
      console.log("Testing database connection...");

      // Test cars table
      const { data: carsTest, error: carsError } = await supabase
        .from("cars")
        .select("count")
        .limit(1);
      console.log("Cars table test:", { carsTest, carsError });

      // Test hissab_transactions table
      const { data: hissabTest, error: hissabError } = await supabase
        .from("hissab_transactions")
        .select("count")
        .limit(1);
      console.log("Hissab table test:", { hissabTest, hissabError });

      // Test support_tickets table
      const { data: ticketsTest, error: ticketsError } = await supabase
        .from("support_tickets")
        .select("count")
        .limit(1);
      console.log("Support tickets table test:", { ticketsTest, ticketsError });

      return {
        cars: { exists: !carsError, error: carsError },
        hissab: { exists: !hissabError, error: hissabError },
        tickets: { exists: !ticketsError, error: ticketsError },
      };
    } catch (error) {
      console.error("Database test error:", error);
      return { error: error.message };
    }
  },
};

export const tvpOwnerAPI = {
  // ===== CARS API =====

  // Get all cars for the current TVP owner
  async getCars() {
    try {
      const currentUser = getCurrentUser();

      console.log("Fetching cars for user ID:", currentUser.id);

      // First, let's check if the cars table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from("cars")
        .select("count")
        .limit(1);

      console.log("Table check result:", { tableCheck, tableError });

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("tvp_owner_id", currentUser.id)
        .order("created_at", { ascending: false });

      console.log("Cars API response:", { data, error });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching cars:", error);
      return { data: null, error: error.message };
    }
  },

  // Get a specific car by ID
  async getCar(carId) {
    try {
      const currentUser = getCurrentUser();

      const { data, error } = await supabase
        .from("cars")
        .select("*")
        .eq("id", carId)
        .eq("tvp_owner_id", currentUser.id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching car:", error);
      return { data: null, error: error.message };
    }
  },

  // ===== HISSAAB (ACCOUNTING) API =====

  // Get all transactions for the current TVP owner
  async getTransactions() {
    try {
      const currentUser = getCurrentUser();

      console.log("Fetching transactions for user ID:", currentUser.id);
      const { data, error } = await supabase
        .from("hissab_transactions")
        .select(
          `
          *,
          cars(car_number, fleet_name)
        `
        )
        .eq("tvp_owner_id", currentUser.id)
        .order("week_date", { ascending: false });

      console.log("Transactions API response:", { data, error });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return { data: null, error: error.message };
    }
  },

  // Get financial summary (totals, weekly stats)
  async getFinancialSummary() {
    try {
      const currentUser = getCurrentUser();

      // Get all transactions for the current year
      const currentYear = new Date().getFullYear();
      const startOfYear = `${currentYear}-01-01`;
      const endOfYear = `${currentYear}-12-31`;

      const { data: transactions, error } = await supabase
        .from("hissab_transactions")
        .select("*")
        .eq("tvp_owner_id", currentUser.id)
        .gte("week_date", startOfYear)
        .lte("week_date", endOfYear)
        .order("week_date", { ascending: true });

      if (error) throw error;

      // Calculate totals
      const totalEarnings = transactions.reduce(
        (sum, t) => sum + parseFloat(t.total_earnings),
        0
      );
      const totalCashCollect = transactions.reduce(
        (sum, t) => sum + parseFloat(t.cash_collect),
        0
      );
      const totalToll = transactions.reduce(
        (sum, t) => sum + parseFloat(t.toll),
        0
      );
      const totalAdjustments = transactions.reduce(
        (sum, t) => sum + parseFloat(t.adjustment_amount),
        0
      );
      const totalUberTransfer = transactions.reduce(
        (sum, t) => sum + parseFloat(t.uber_transfer),
        0
      );
      const totalOutstanding = transactions.reduce(
        (sum, t) => sum + parseFloat(t.total_outstanding),
        0
      );
      const netOutstanding = transactions.reduce(
        (sum, t) => sum + parseFloat(t.net_outstanding),
        0
      );

      // Calculate weekly stats (last 12 weeks)
      const weeklyStats = [];
      const last12Weeks = transactions.slice(-12);

      last12Weeks.forEach((transaction) => {
        weeklyStats.push({
          week: new Date(transaction.week_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          earnings: parseFloat(transaction.total_earnings),
          cashCollect: parseFloat(transaction.cash_collect),
          toll: parseFloat(transaction.toll),
          adjustments: parseFloat(transaction.adjustment_amount),
          uberTransfer: parseFloat(transaction.uber_transfer),
          outstanding: parseFloat(transaction.total_outstanding),
          netOutstanding: parseFloat(transaction.net_outstanding),
        });
      });

      return {
        data: {
          totalEarnings,
          totalCashCollect,
          totalToll,
          totalAdjustments,
          totalUberTransfer,
          totalOutstanding,
          netOutstanding,
          weeklyStats,
        },
        error: null,
      };
    } catch (error) {
      console.error("Error fetching financial summary:", error);
      return { data: null, error: error.message };
    }
  },

  // Get recent transactions (last 10)
  async getRecentTransactions(limit = 10) {
    try {
      const currentUser = getCurrentUser();

      const { data, error } = await supabase
        .from("hissab_transactions")
        .select(
          `
          *,
          cars(car_number, fleet_name)
        `
        )
        .eq("tvp_owner_id", currentUser.id)
        .order("week_date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching recent transactions:", error);
      return { data: null, error: error.message };
    }
  },

  // ===== SUPPORT TICKETS API =====

  // Get all support tickets for the current TVP owner
  async getSupportTickets() {
    try {
      const currentUser = getCurrentUser();

      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("tvp_owner_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      return { data: null, error: error.message };
    }
  },

  // Get support ticket statistics
  async getSupportTicketStats() {
    try {
      const currentUser = getCurrentUser();

      const { data: tickets, error } = await supabase
        .from("support_tickets")
        .select("status, priority")
        .eq("tvp_owner_id", currentUser.id);

      if (error) throw error;

      const stats = {
        total: tickets.length,
        open: tickets.filter((t) => t.status === "open").length,
        inProgress: tickets.filter((t) => t.status === "in_progress").length,
        resolved: tickets.filter((t) => t.status === "resolved").length,
        highPriority: tickets.filter((t) => t.priority === "high").length,
        mediumPriority: tickets.filter((t) => t.priority === "medium").length,
        lowPriority: tickets.filter((t) => t.priority === "low").length,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error fetching support ticket stats:", error);
      return { data: null, error: error.message };
    }
  },

  // Create a new support ticket
  async createSupportTicket(ticketData) {
    try {
      const currentUser = getCurrentUser();

      const { data, error } = await supabase
        .from("support_tickets")
        .insert({
          ...ticketData,
          tvp_owner_id: currentUser.id,
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error creating support ticket:", error);
      return { data: null, error: error.message };
    }
  },

  // ===== DASHBOARD OVERVIEW API =====

  // Get dashboard overview data
  async getDashboardOverview() {
    try {
      const currentUser = getCurrentUser();

      // Get cars count by status
      const { data: cars, error: carsError } = await supabase
        .from("cars")
        .select("status")
        .eq("tvp_owner_id", currentUser.id);

      if (carsError) throw carsError;

      const carStats = {
        total: cars.length,
        active: cars.filter((c) => c.status === "active").length,
        maintenance: cars.filter((c) => c.status === "maintenance").length,
        inactive: cars.filter((c) => c.status === "inactive").length,
      };

      // Get financial summary
      const { data: financialSummary, error: financialError } =
        await this.getFinancialSummary();
      if (financialError) throw financialError;

      // Get support ticket stats
      const { data: ticketStats, error: ticketError } =
        await this.getSupportTicketStats();
      if (ticketError) throw ticketError;

      return {
        data: {
          carStats,
          financialSummary: financialSummary,
          ticketStats,
        },
        error: null,
      };
    } catch (error) {
      console.error("Error fetching dashboard overview:", error);
      return { data: null, error: error.message };
    }
  },
};
