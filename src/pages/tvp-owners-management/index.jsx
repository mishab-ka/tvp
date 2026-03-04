import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import FilterModal from "./components/FilterModal";
import SearchAndActions from "./components/SearchAndActions";
import OwnersDataGrid from "./components/OwnersDataGrid";
import OwnerDetailPanel from "./components/OwnerDetailPanel";
import OwnerFormModal from "./components/OwnerFormModal";
import {
  getAllTVPOwners,
  getTVPOwnerDetails,
  createTVPOwner,
  updateTVPOwner,
  deleteTVPOwner,
  createDriverBill,
  getDriverBills,
  generateInvoiceHTML,
  exportBillToPDF,
} from "../../lib/tvpManagementAPI";
import { calculatePreviousWeek } from "../hissab-accounting-generator/components/WeekSelector";
import BillFormModal from "./components/BillFormModal";
import AddPenaltyModal from "./components/AddPenaltyModal";
import Button from "../../components/ui/Button";
import SettingsModal from "./components/SettingsModal";
import { useAuth } from "../../contexts/AuthContext";
import Icon from "../../components/AppIcon";
import { formatCurrency } from "../../utils/formatters";

// Format phone for WhatsApp URL (wa.me). Expects Indian numbers; adds 91 if 10 digits.
const formatPhoneForWhatsApp = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return "91" + digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.startsWith("0")) return "91" + digits.slice(1);
  return digits.length >= 10 ? digits : null;
};

const TVPOwnersManagement = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, hasRole } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [selectedOwners, setSelectedOwners] = useState([]);
  const [filters, setFilters] = useState({
    status: [],
    category: [],
    performance: [],
    financial: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [statsExpanded, setStatsExpanded] = useState(false); // Statistics dashboard fold state
  const [ownerFormOpen, setOwnerFormOpen] = useState(false);
  const [ownerFormMode, setOwnerFormMode] = useState("create");
  const [ownerFormInitial, setOwnerFormInitial] = useState(null);
  const [ownerFormSubmitting, setOwnerFormSubmitting] = useState(false);
  const [billFormOpen, setBillFormOpen] = useState(false);
  const [billFormDriver, setBillFormDriver] = useState(null);
  const [billFormSubmitting, setBillFormSubmitting] = useState(false);
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [penaltyModalDriver, setPenaltyModalDriver] = useState(null);
  const [billGeneratedSuccess, setBillGeneratedSuccess] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const canManageOwners =
    hasRole?.(["admin", "super_admin"]) ||
    ["admin", "super_admin"].includes(currentUser?.role);

  // Load TVP owners data
  const loadTVPOwners = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const ownersData = await getAllTVPOwners();
      setOwners(ownersData);
    } catch (err) {
      console.error("Error loading TVP owners:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTVPOwners();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!selectedOwner) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedOwner]);

  // Filter owners based on search and filters
  const filteredOwners = owners.filter((owner) => {
    const matchesSearch =
      searchTerm === "" ||
      owner?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner?.tvpId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      owner?.phone?.includes(searchTerm);

    const matchesStatus =
      !filters.status ||
      filters.status.length === 0 ||
      filters.status.includes(owner?.status);

    const matchesCategory =
      !filters.category ||
      filters.category.length === 0 ||
      filters.category.includes(owner?.category || "single_driver");

    // Performance filter
    let matchesPerformance = true;
    if (filters.performance && filters.performance.length > 0) {
      const perf = owner?.performance || 0;
      matchesPerformance = filters.performance.some((f) => {
        if (f === "excellent") return perf >= 90;
        if (f === "good") return perf >= 75 && perf < 90;
        if (f === "average") return perf >= 60 && perf < 75;
        if (f === "poor") return perf < 60;
        return false;
      });
    }

    // Financial filter
    let matchesFinancial = true;
    if (filters.financial && filters.financial.length > 0) {
      const deposit = owner?.depositAmount || 0;
      const outstanding = owner?.outstandingBalance || 0;
      matchesFinancial = filters.financial.some((f) => {
        if (f === "high_deposit") return deposit >= 15000;
        if (f === "medium_deposit") return deposit >= 5000 && deposit < 15000;
        if (f === "low_deposit") return deposit < 5000;
        if (f === "outstanding_balance") return outstanding > 0;
        return false;
      });
    }

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCategory &&
      matchesPerformance &&
      matchesFinancial
    );
  });

  // Calculate owner counts for filters
  const ownerCounts = {
    total: owners.length,
    active: owners.filter((o) => o.status === "active").length,
    inactive: owners.filter((o) => o.status === "inactive").length,
    pending: owners.filter((o) => o.status === "pending").length,
    suspended: owners.filter((o) => o.status === "suspended").length,
    under_review: owners.filter((o) => o.status === "under_review").length,
    single_driver: owners.filter(
      (o) => (o?.category || "single_driver") === "single_driver",
    ).length,
    double_driver: owners.filter((o) => o?.category === "double_driver").length,
    excellent: owners.filter((o) => o.performance >= 90).length,
    good: owners.filter((o) => o.performance >= 75 && o.performance < 90)
      .length,
    average: owners.filter((o) => o.performance >= 60 && o.performance < 75)
      .length,
    poor: owners.filter((o) => o.performance < 60).length,
    high_deposit: owners.filter((o) => o.depositAmount >= 15000).length,
    medium_deposit: owners.filter(
      (o) => o.depositAmount >= 5000 && o.depositAmount < 15000,
    ).length,
    low_deposit: owners.filter((o) => o.depositAmount < 5000).length,
    outstanding_balance: owners.filter((o) => o.outstandingBalance > 0).length,
    // Financial totals
    totalOutstanding: owners.reduce(
      (sum, o) => sum + Number(o.outstandingBalance || 0),
      0,
    ),
    totalDeposit: owners.reduce(
      (sum, o) => sum + Number(o.depositAmount || 0),
      0,
    ),
  };

  // Pagination
  const totalPages = Math.ceil(filteredOwners.length / pageSize);
  const paginatedOwners = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredOwners.slice(start, start + pageSize);
  }, [filteredOwners, currentPage, pageSize]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, searchType, filters]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleOwnerSelect = (ownerIds) => {
    setSelectedOwners(ownerIds);
  };

  const handleOwnerClick = (owner) => {
    setSelectedOwner(owner);
  };

  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} for owners:`, selectedOwners);
    // Implement bulk actions here
  };

  const handleSearch = (term, type) => {
    setSearchTerm(term);
    setSearchType(type);
  };

  const handleFilterChange = (category, filterArray) => {
    setFilters((prev) => ({
      ...prev,
      [category]: filterArray || [],
    }));
  };

  const handleApplyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleCloseDetailPanel = () => {
    setSelectedOwner(null);
  };

  const handleDetailPanelBackdropClick = (event) => {
    if (event.target === event.currentTarget) {
      handleCloseDetailPanel();
    }
  };

  const handleOwnerUpdate = (updatedOwner) => {
    setOwners((prev) =>
      prev.map((owner) =>
        owner.id === updatedOwner.id ? updatedOwner : owner,
      ),
    );
    setSelectedOwner(updatedOwner);
  };

  const handleStatusToggle = async (ownerId, newStatus) => {
    try {
      await updateTVPOwner(ownerId, { status: newStatus });
      // Update local state
      setOwners((prev) =>
        prev.map((owner) =>
          owner.id === ownerId ? { ...owner, status: newStatus } : owner,
        ),
      );
      // Update selected owner if it's the same one
      if (selectedOwner?.id === ownerId) {
        setSelectedOwner((prev) => ({ ...prev, status: newStatus }));
      }
    } catch (err) {
      console.error("Error updating owner status:", err);
      alert(err.message || "Failed to update status");
    }
  };

  const handleExport = () => {
    console.log("Exporting TVP owners data...");
    // Implement export functionality
    const exportData = filteredOwners.map((owner) => ({
      "TVP ID": owner.tvpId,
      Name: owner.name,
      Email: owner.email,
      Phone: owner.phone,
      Address: owner.address,
      Category:
        owner.category === "double_driver" ? "Double Driver" : "Single Driver",
      Status: owner.status,
      Vehicles: owner.vehicleCount,
      "Total Earnings": owner.totalEarnings,
      "Outstanding Balance": owner.outstandingBalance,
      "Join Date": new Date(owner.joinDate).toLocaleDateString(),
    }));

    // Create CSV content
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(","),
      ...exportData.map((row) =>
        headers.map((header) => `"${row[header]}"`).join(","),
      ),
    ].join("\n");

    // Download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tvp_owners_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddOwner = () => {
    if (!canManageOwners) {
      alert("You do not have permission to add TVP owners.");
      return;
    }
    setOwnerFormMode("create");
    setOwnerFormInitial(null);
    setOwnerFormOpen(true);
  };

  const handleEditOwner = (owner) => {
    if (!canManageOwners) return;
    setOwnerFormMode("edit");
    setOwnerFormInitial(owner);
    setOwnerFormOpen(true);
  };

  const handleOwnerFormClose = () => {
    if (ownerFormSubmitting) return;
    setOwnerFormOpen(false);
    setOwnerFormInitial(null);
  };

  const handleOwnerFormSubmit = async (formValues) => {
    try {
      setOwnerFormSubmitting(true);
      if (ownerFormMode === "edit" && ownerFormInitial?.id) {
        const updatedOwner = await updateTVPOwner(
          ownerFormInitial.id,
          formValues,
        );
        setOwners((prev) =>
          prev.map((owner) =>
            owner.id === updatedOwner.id ? updatedOwner : owner,
          ),
        );
        setSelectedOwner((prev) =>
          prev?.id === updatedOwner.id ? updatedOwner : prev,
        );
      } else {
        const newOwner = await createTVPOwner(formValues);
        setOwners((prev) => [newOwner, ...prev]);
      }
      setOwnerFormOpen(false);
      setOwnerFormInitial(null);
    } catch (err) {
      console.error("Failed to save TVP owner:", err);
      setError(err.message || "Unable to save TVP owner");
    } finally {
      setOwnerFormSubmitting(false);
    }
  };

  const handleOwnerDelete = async (owner) => {
    if (!canManageOwners || !owner?.id) {
      return;
    }
    const confirmed = window.confirm(
      `Delete ${owner?.name || "this owner"} and all linked data?`,
    );
    if (!confirmed) return;
    try {
      await deleteTVPOwner(owner.id);
      setOwners((prev) => prev.filter((item) => item.id !== owner.id));
      setSelectedOwners((prev) => prev.filter((id) => id !== owner.id));
      if (selectedOwner?.id === owner.id) {
        setSelectedOwner(null);
      }
    } catch (err) {
      console.error("Failed to delete TVP owner:", err);
      setError(err.message || "Unable to delete TVP owner");
    }
  };

  const handleGenerateBill = async (owner) => {
    if (!canManageOwners || !owner?.id) {
      return;
    }
    try {
      // Fetch full driver from tvp_drivers so vehicle_numbers is always present
      const driverWithVehicles = await getTVPOwnerDetails(owner.id);
      setBillFormDriver(driverWithVehicles);
      setBillFormOpen(true);
    } catch (err) {
      console.error("Failed to load driver for bill:", err);
      setError(err?.message || "Could not load driver details");
    }
  };

  const handleBillFormClose = () => {
    if (billFormSubmitting) return;
    setBillFormOpen(false);
    setBillFormDriver(null);
  };

  const handleAddPenalty = (owner) => {
    setPenaltyModalDriver(owner);
    setPenaltyModalOpen(true);
  };

  const handlePenaltyModalClose = () => {
    setPenaltyModalOpen(false);
    setPenaltyModalDriver(null);
  };

  const handlePenaltySubmitted = () => {
    loadTVPOwners();
    if (selectedOwner?.id === penaltyModalDriver?.id) {
      getTVPOwnerDetails(selectedOwner.id).then(setSelectedOwner).catch(() => {});
    }
  };

  const handleBillFormSubmit = async (billData) => {
    try {
      setBillFormSubmitting(true);

      // Open print window in same user gesture to avoid pop-up blocking (before any await)
      const printWindowRef = window.open("", "_blank");

      // Calculate week range from rental days or use current week
      let weekStart = billData.weekStart;
      let weekEnd = billData.weekEnd;

      if (!weekStart || !weekEnd) {
        // If week dates not provided, calculate from rental days
        // Assume rental days indicates the week (typically 7 days)
        const previousWeek = calculatePreviousWeek();
        weekStart = previousWeek.weekStart;
        weekEnd = previousWeek.weekEnd;
      }

      const billNumber = `INV-${Date.now()}-${billData.driverId
        .slice(-6)
        .toUpperCase()}`;

      // Prepare vehicles array for invoice generation
      const vehiclesForInvoice =
        billData.vehicles && Array.isArray(billData.vehicles)
          ? billData.vehicles.map((v) => ({
              vehicleNumber: v.vehicleNumber,
              rentalDays: Number(v.rentalDays) || 0,
              trips: Number(v.trips) || 0,
              dailyRent: Number(v.dailyRent) || 0,
            }))
          : null;

      const invoiceHTML = generateInvoiceHTML({
        ...billData,
        billNumber: billNumber,
        vehicles: vehiclesForInvoice,
      });

      const bill = await createDriverBill({
        ...billData,
        invoiceHtml: invoiceHTML,
        weekStart: weekStart,
        weekEnd: weekEnd,
      });

      // Refresh owner data to include new bill
      await loadTVPOwners();

      // Export as PDF with proper filename
      // Ensure we have all the data needed for export
      const billForExport = {
        ...bill,
        driver_name: bill.driver_name || billData.driverName,
        driverName: billData.driverName, // Also include camelCase
        week_start: weekStart,
        week_end: weekEnd,
        weekStart: weekStart, // Also include camelCase
        weekEnd: weekEnd, // Also include camelCase
        invoice_html: bill.invoice_html || invoiceHTML,
        invoiceHtml: invoiceHTML, // Also include camelCase
        vehicles_breakdown: bill.vehicles_breakdown || vehiclesForInvoice,
        vehicles: vehiclesForInvoice,
      };

      console.log("Exporting bill with data:", billForExport);
      const exportedFilename = exportBillToPDF(billForExport, printWindowRef);

      // Show user the filename that will be used
      // Note: Browser print dialog doesn't support custom filenames,
      // but the user can rename when saving from print dialog
      console.log("PDF filename:", exportedFilename);

      setBillFormOpen(false);
      setBillGeneratedSuccess({
        driver: billFormDriver,
        driverName: billData.driverName,
        weekStart,
        weekEnd,
      });
      setBillFormDriver(null);
    } catch (err) {
      console.error("Failed to generate bill:", err);
      setError(err.message || "Unable to generate bill");
    } finally {
      setBillFormSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-background">
        <Header
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          isMenuOpen={mobileMenuOpen}
        />
        <div className="flex ">
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />

          <main className={`flex-1 transition-all duration-300 `}>
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading TVP owners...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
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
              </div>
            )}

            {/* Content */}
            {!loading && !error && (
              <div className="flex flex-col h-screen overflow-hidden">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
                  <div className="flex-shrink-0">
                    <SearchAndActions
                      onSearch={handleSearch}
                      onExport={handleExport}
                      onAddOwner={handleAddOwner}
                      onOpenSettings={() => setSettingsOpen(true)}
                      onOpenFilterModal={() => setFilterModalOpen(true)}
                      totalOwners={owners?.length}
                      filteredOwners={filteredOwners?.length}
                      ownerCounts={ownerCounts}
                      canManageOwners={!!canManageOwners}
                      activeFilterCount={Object.values(filters).reduce(
                        (s, arr) => s + (arr?.length || 0),
                        0,
                      )}
                    />
                  </div>

                  {/* Statistics Dashboard - Collapsible */}
                  <div className="px-4 pb-2 pt-2">
                    <div className="bg-card border border-border rounded-lg overflow-hidden">
                      {/* Header - Always visible */}
                      <button
                        onClick={() => setStatsExpanded(!statsExpanded)}
                        className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center">
                          <Icon
                            name="BarChart3"
                            size={18}
                            className="mr-2 text-primary"
                          />
                          <span className="text-sm font-semibold text-foreground">
                            Statistics
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          {/* Quick Stats Preview (shown when collapsed) */}
                          {!statsExpanded && (
                            <div className="hidden sm:flex items-center space-x-4 text-xs">
                              <span className="text-primary font-medium">
                                {ownerCounts.total} Total
                              </span>
                              <span className="text-success font-medium">
                                {ownerCounts.active} Active
                              </span>
                              <span className="text-error font-medium">
                                {formatCurrency(
                                  ownerCounts.totalOutstanding || 0,
                                )}{" "}
                                OS
                              </span>
                            </div>
                          )}
                          <Icon
                            name={statsExpanded ? "ChevronUp" : "ChevronDown"}
                            size={16}
                            className="text-muted-foreground"
                          />
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {statsExpanded && (
                        <div className="p-4 pt-2 border-t border-border">
                          {/* Financial Totals - Top Row */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                            <div className="bg-primary/10 p-3 rounded-lg border border-primary/30">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">
                                  Total Drivers
                                </span>
                                <Icon
                                  name="Users"
                                  size={14}
                                  className="text-primary"
                                />
                              </div>
                              <div className="text-xl font-bold text-primary">
                                {ownerCounts.total || 0}
                              </div>
                            </div>

                            <div className="bg-error/10 p-3 rounded-lg border border-error/30">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">
                                  Total Outstanding
                                </span>
                                <Icon
                                  name="AlertCircle"
                                  size={14}
                                  className="text-error"
                                />
                              </div>
                              <div className="text-xl font-bold text-error">
                                {formatCurrency(
                                  ownerCounts.totalOutstanding || 0,
                                )}
                              </div>
                            </div>

                            <div className="bg-success/10 p-3 rounded-lg border border-success/30">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">
                                  Total Deposits
                                </span>
                                <Icon
                                  name="Wallet"
                                  size={14}
                                  className="text-success"
                                />
                              </div>
                              <div className="text-xl font-bold text-success">
                                {formatCurrency(ownerCounts.totalDeposit || 0)}
                              </div>
                            </div>

                            <div className="bg-warning/10 p-3 rounded-lg border border-warning/30">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">
                                  With Outstanding
                                </span>
                                <Icon
                                  name="AlertTriangle"
                                  size={14}
                                  className="text-warning"
                                />
                              </div>
                              <div className="text-xl font-bold text-warning">
                                {ownerCounts.outstanding_balance || 0}
                              </div>
                            </div>
                          </div>

                          {/* Status Row */}
                          <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                            <div className="bg-muted/30 p-2 rounded-lg border border-border text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <div className="w-2 h-2 bg-success rounded-full"></div>
                                <span className="text-xs text-muted-foreground">
                                  Active
                                </span>
                              </div>
                              <div className="text-lg font-bold text-foreground">
                                {ownerCounts.active || 0}
                              </div>
                            </div>

                            <div className="bg-muted/30 p-2 rounded-lg border border-border text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                                <span className="text-xs text-muted-foreground">
                                  Inactive
                                </span>
                              </div>
                              <div className="text-lg font-bold text-foreground">
                                {ownerCounts.inactive || 0}
                              </div>
                            </div>

                            <div className="bg-muted/30 p-2 rounded-lg border border-border text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <div className="w-2 h-2 bg-warning rounded-full"></div>
                                <span className="text-xs text-muted-foreground">
                                  Pending
                                </span>
                              </div>
                              <div className="text-lg font-bold text-foreground">
                                {ownerCounts.pending || 0}
                              </div>
                            </div>

                            <div className="bg-muted/30 p-2 rounded-lg border border-border text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <div className="w-2 h-2 bg-error rounded-full"></div>
                                <span className="text-xs text-muted-foreground">
                                  Suspended
                                </span>
                              </div>
                              <div className="text-lg font-bold text-foreground">
                                {ownerCounts.suspended || 0}
                              </div>
                            </div>

                            <div className="bg-muted/30 p-2 rounded-lg border border-border text-center">
                              <div className="flex items-center justify-center space-x-1 mb-1">
                                <div className="w-2 h-2 bg-warning rounded-full"></div>
                                <span className="text-xs text-muted-foreground">
                                  Review
                                </span>
                              </div>
                              <div className="text-lg font-bold text-foreground">
                                {ownerCounts.under_review || 0}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 min-w-0 overflow-auto">
                    <OwnersDataGrid
                      owners={paginatedOwners}
                      selectedOwners={selectedOwners}
                      onOwnerSelect={handleOwnerSelect}
                      onOwnerClick={handleOwnerClick}
                      onBulkAction={handleBulkAction}
                      onOwnerEdit={handleEditOwner}
                      onOwnerDelete={handleOwnerDelete}
                      onGenerateBill={handleGenerateBill}
                      onAddPenalty={handleAddPenalty}
                      onStatusToggle={handleStatusToggle}
                      canManageOwners={!!canManageOwners}
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      totalOwners={filteredOwners.length}
                      onPageChange={handlePageChange}
                    />
                  </div>
                </div>

                {/* Detail Panel - Popup to the right of sidebar, does not overlap */}
                {selectedOwner && (
                  <div
                    className={`fixed top-0 bottom-0 right-0 z-50 flex items-center justify-center overflow-y-auto p-6 transition-[left] duration-300 ${
                      sidebarCollapsed ? "left-16" : "left-60"
                    } bg-black/50 backdrop-blur-sm`}
                    onClick={handleDetailPanelBackdropClick}
                  >
                    <div
                      className="relative w-[min(90vw,56rem)] h-[85vh] min-h-[32rem] bg-card shadow-2xl rounded-2xl border border-border flex flex-col overflow-hidden flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <OwnerDetailPanel
                        owner={selectedOwner}
                        onClose={handleCloseDetailPanel}
                        onUpdate={handleOwnerUpdate}
                        onOpenAddPenalty={() => {
                          setPenaltyModalDriver(selectedOwner);
                          setPenaltyModalOpen(true);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
      <OwnerFormModal
        isOpen={ownerFormOpen}
        mode={ownerFormMode}
        initialData={ownerFormInitial}
        onClose={handleOwnerFormClose}
        onSubmit={handleOwnerFormSubmit}
        submitting={ownerFormSubmitting}
      />
      <BillFormModal
        isOpen={billFormOpen}
        driver={billFormDriver}
        onClose={handleBillFormClose}
        onSubmit={handleBillFormSubmit}
        submitting={billFormSubmitting}
      />
      <AddPenaltyModal
        isOpen={penaltyModalOpen}
        driver={penaltyModalDriver}
        onClose={handlePenaltyModalClose}
        onSubmit={handlePenaltySubmitted}
      />
      {/* Bill generated success modal - Share via WhatsApp */}
      {billGeneratedSuccess && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setBillGeneratedSuccess(null)}
        >
          <div
            className="relative w-full max-w-md bg-white rounded-lg border border-border shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
                <Icon name="CheckCircle" size={24} className="text-success" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Bill generated successfully
                </h3>
                <p className="text-sm text-muted-foreground">
                  PDF opened in print dialog. Save it, then share via WhatsApp.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {formatPhoneForWhatsApp(billGeneratedSuccess.driver?.phone) ? (
                <Button
                  variant="default"
                  className="bg-[#25D366] hover:bg-[#20BD5A] text-white"
                  iconName="MessageCircle"
                  iconPosition="left"
                  onClick={() => {
                    const phone = formatPhoneForWhatsApp(
                      billGeneratedSuccess.driver?.phone
                    );
                    const driverName =
                      billGeneratedSuccess.driverName ||
                      billGeneratedSuccess.driver?.name ||
                      "there";
                    const text = encodeURIComponent(
                      `Hi ${driverName}, your bill for the week has been generated. Please find the PDF attached.`
                    );
                    window.open(
                      `https://wa.me/${phone}?text=${text}`,
                      "_blank"
                    );
                  }}
                >
                  Share via WhatsApp
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Add phone number to owner profile to share via WhatsApp.
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => setBillGeneratedSuccess(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      )}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      <FilterModal
        isOpen={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        ownerCounts={ownerCounts}
      />
    </>
  );
};

export default TVPOwnersManagement;
