import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import FilterSidebar from "./components/FilterSidebar";
import SearchAndActions from "./components/SearchAndActions";
import OwnersDataGrid from "./components/OwnersDataGrid";
import OwnerDetailPanel from "./components/OwnerDetailPanel";
import OwnerFormModal from "./components/OwnerFormModal";
import {
  getAllTVPOwners,
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
import SettingsModal from "./components/SettingsModal";
import { useAuth } from "../../contexts/AuthContext";
import Icon from "../../components/AppIcon";

const TVPOwnersManagement = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, hasRole } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [selectedOwners, setSelectedOwners] = useState([]);
  const [filters, setFilters] = useState({
    status: [],
    region: [],
    performance: [],
    financial: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("all");
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [ownerFormOpen, setOwnerFormOpen] = useState(false);
  const [ownerFormMode, setOwnerFormMode] = useState("create");
  const [ownerFormInitial, setOwnerFormInitial] = useState(null);
  const [ownerFormSubmitting, setOwnerFormSubmitting] = useState(false);
  const [billFormOpen, setBillFormOpen] = useState(false);
  const [billFormDriver, setBillFormDriver] = useState(null);
  const [billFormSubmitting, setBillFormSubmitting] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      !filters.status || filters.status.length === 0 || filters.status.includes(owner?.status);
    const matchesCategory =
      !filters.category || filters.category.length === 0 || filters.category.includes(owner?.category || "single_driver");

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate owner counts for filters
  const ownerCounts = {
    active: owners.filter((o) => o.status === "active").length,
    inactive: owners.filter((o) => o.status === "inactive").length,
    pending: owners.filter((o) => o.status === "pending").length,
    suspended: owners.filter((o) => o.status === "suspended").length,
    under_review: owners.filter((o) => o.status === "under_review").length,
    single_driver: owners.filter((o) => (o?.category || "single_driver") === "single_driver").length,
    double_driver: owners.filter((o) => o?.category === "double_driver").length,
    excellent: owners.filter((o) => o.performance >= 90).length,
    good: owners.filter((o) => o.performance >= 75 && o.performance < 90)
      .length,
    average: owners.filter((o) => o.performance >= 60 && o.performance < 75)
      .length,
    poor: owners.filter((o) => o.performance < 60).length,
    high_deposit: owners.filter((o) => o.depositAmount >= 15000).length,
    medium_deposit: owners.filter(
      (o) => o.depositAmount >= 5000 && o.depositAmount < 15000
    ).length,
    low_deposit: owners.filter((o) => o.depositAmount < 5000).length,
    outstanding_balance: owners.filter((o) => o.outstandingBalance > 0).length,
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
      prev.map((owner) => (owner.id === updatedOwner.id ? updatedOwner : owner))
    );
    setSelectedOwner(updatedOwner);
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
      Category: owner.category === "double_driver" ? "Double Driver" : "Single Driver",
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
        headers.map((header) => `"${row[header]}"`).join(",")
      ),
    ].join("\n");

    // Download CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `tvp_owners_${new Date().toISOString().split("T")[0]}.csv`
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
          formValues
        );
        setOwners((prev) =>
          prev.map((owner) =>
            owner.id === updatedOwner.id ? updatedOwner : owner
          )
        );
        setSelectedOwner((prev) =>
          prev?.id === updatedOwner.id ? updatedOwner : prev
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
      `Delete ${owner?.name || "this owner"} and all linked data?`
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

  const handleGenerateBill = (owner) => {
    if (!canManageOwners || !owner?.id) {
      return;
    }
    setBillFormDriver(owner);
    setBillFormOpen(true);
  };

  const handleBillFormClose = () => {
    if (billFormSubmitting) return;
    setBillFormOpen(false);
    setBillFormDriver(null);
  };

  const handleBillFormSubmit = async (billData) => {
    try {
      setBillFormSubmitting(true);
      
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
      const vehiclesForInvoice = billData.vehicles && Array.isArray(billData.vehicles) 
        ? billData.vehicles.map(v => ({
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
      const exportedFilename = exportBillToPDF(billForExport);
      
      // Show user the filename that will be used
      // Note: Browser print dialog doesn't support custom filenames,
      // but the user can rename when saving from print dialog
      console.log("PDF filename:", exportedFilename);
      
      setBillFormOpen(false);
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
        <div className="flex pt-16">
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
              <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-y-auto">
                {/* Filter Sidebar - Mobile: Full width, Desktop: 20% */}
                {/* <div
                className={`${
                  showFilters ? "block" : "hidden"
                } lg:block w-full lg:w-1/5 lg:min-w-[280px] lg:max-w-[320px] border-r border-border bg-background`}
              >
                <div className="lg:hidden p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Filters</h3>
                    <button
                      onClick={() => setShowFilters(false)}
                      className="p-2 hover:bg-muted rounded-lg"
                    >
                      <Icon name="X" size={20} />
                    </button>
                  </div>
                </div>
                <FilterSidebar
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  ownerCounts={ownerCounts}
                />
              </div> */}

                {/* Main Content Area - Mobile: Full width, Desktop: Flexible */}
                <div className="flex-1 flex flex-col min-w-0">
                  <SearchAndActions
                    onSearch={handleSearch}
                    onExport={handleExport}
                    onAddOwner={handleAddOwner}
                    onOpenSettings={() => setSettingsOpen(true)}
                    onToggleFilters={() => setShowFilters(!showFilters)}
                    showFilters={showFilters}
                    totalOwners={owners?.length}
                    filteredOwners={filteredOwners?.length}
                    canManageOwners={!!canManageOwners}
                  />

                  <div className="flex-1 min-h-0">
                    <OwnersDataGrid
                      owners={filteredOwners}
                      selectedOwners={selectedOwners}
                      onOwnerSelect={handleOwnerSelect}
                      onOwnerClick={handleOwnerClick}
                      onBulkAction={handleBulkAction}
                      onOwnerEdit={handleEditOwner}
                      onOwnerDelete={handleOwnerDelete}
                      onGenerateBill={handleGenerateBill}
                      canManageOwners={!!canManageOwners}
                    />
                  </div>
                </div>

                {/* Detail Panel - Mobile: Full width overlay, Desktop: 25% */}
                {selectedOwner && (
                  <div
                    className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/40 backdrop-blur-sm"
                    onClick={handleDetailPanelBackdropClick}
                  >
                    <div className="relative h-full w-full max-w-4xl bg-background shadow-2xl border-l border-border lg:rounded-l-2xl">
                      <OwnerDetailPanel
                        owner={selectedOwner}
                        onClose={handleCloseDetailPanel}
                        onUpdate={handleOwnerUpdate}
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
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
};

export default TVPOwnersManagement;
