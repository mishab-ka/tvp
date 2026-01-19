import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { useAuth } from "../../contexts/AuthContext";
import {
  getAllVehicles,
  getVehicleStatistics,
  addVehicleToOwner,
  updateVehicle,
  deleteVehicle,
} from "../../lib/tvpManagementAPI";
import { formatCurrency, formatIndianNumber } from "../../utils/formatters";

const ITEMS_PER_PAGE = 10;

const VehicleManagement = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    inactive: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);

  // Add vehicle form state
  const [newVehicle, setNewVehicle] = useState({
    car_number: "",
    fleet_name: "",
    deposit_amount: 0,
    audit_km: 0,
    audit_tires: 4,
    audit_body: "Good",
    audit_engine: "Good",
    audit_battery: "Good",
    status: "active",
    tvp_owner_id: "",
  });

  // Edit vehicle form state
  const [editVehicleData, setEditVehicleData] = useState({
    car_number: "",
    fleet_name: "",
    deposit_amount: 0,
    audit_km: 0,
    audit_tires: 4,
    audit_body: "Good",
    audit_engine: "Good",
    audit_battery: "Good",
    status: "active",
    tvp_owner_id: "",
  });

  // Load vehicles data
  const loadVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!isAuthenticated) {
        throw new Error("User not authenticated");
      }

      const [vehiclesData, statsData] = await Promise.all([
        getAllVehicles(),
        getVehicleStatistics(),
      ]);

      setVehicles(vehiclesData);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading vehicles:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [isAuthenticated]);

  // Filter vehicles
  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      searchTerm === "" ||
      vehicle.car_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.fleet_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.users?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (showInactiveOnly) {
      matchesStatus = vehicle.status === "inactive";
    } else if (statusFilter !== "all") {
      matchesStatus = vehicle.status === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedVehicles = filteredVehicles.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchTerm, statusFilter, showInactiveOnly]);

  // Handle vehicle selection
  const handleVehicleSelect = (vehicleIds) => {
    setSelectedVehicles(vehicleIds);
  };

  // Handle bulk actions
  const handleBulkAction = (action) => {
    console.log(`Bulk action: ${action} for vehicles:`, selectedVehicles);
    // Implement bulk actions here
  };

  // Handle add vehicle
  const handleAddVehicle = async () => {
    try {
      // Use null or empty string if tvp_owner_id is not provided
      const ownerId = newVehicle.tvp_owner_id?.trim() || null;
      await addVehicleToOwner(ownerId, newVehicle);
      setShowAddModal(false);
      setNewVehicle({
        car_number: "",
        fleet_name: "",
        deposit_amount: 0,
        audit_km: 0,
        audit_tires: 4,
        audit_body: "Good",
        audit_engine: "Good",
        audit_battery: "Good",
        status: "active",
        tvp_owner_id: "",
      });
      loadVehicles(); // Reload data
    } catch (err) {
      console.error("Error adding vehicle:", err);
      setError(err.message);
    }
  };

  // Handle edit vehicle
  const handleEditVehicle = async () => {
    if (!editingVehicle) return;
    try {
      // Prepare update data, convert empty string to null for tvp_owner_id
      const updateData = {
        ...editVehicleData,
        tvp_owner_id: editVehicleData.tvp_owner_id?.trim() || null,
      };
      await updateVehicle(editingVehicle.id, updateData);
      setEditingVehicle(null);
      setEditVehicleData({
        car_number: "",
        fleet_name: "",
        deposit_amount: 0,
        audit_km: 0,
        audit_tires: 4,
        audit_body: "Good",
        audit_engine: "Good",
        audit_battery: "Good",
        status: "active",
        tvp_owner_id: "",
      });
      loadVehicles(); // Reload data
    } catch (err) {
      console.error("Error updating vehicle:", err);
      setError(err.message);
    }
  };

  // Handle delete vehicle
  const handleDeleteVehicle = async (vehicleId) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await deleteVehicle(vehicleId);
        loadVehicles(); // Reload data
      } catch (err) {
        console.error("Error deleting vehicle:", err);
        setError(err.message);
      }
    }
  };

  // Handle status toggle
  const handleStatusToggle = async (vehicleId, currentStatus) => {
    try {
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await updateVehicle(vehicleId, { status: newStatus });
      loadVehicles(); // Reload data
    } catch (err) {
      console.error("Error toggling vehicle status:", err);
      setError(err.message);
    }
  };

  // Open edit modal
  const handleOpenEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setEditVehicleData({
      car_number: vehicle.car_number || "",
      fleet_name: vehicle.fleet_name || "",
      deposit_amount: vehicle.deposit_amount || 0,
      audit_km: vehicle.audit_km || 0,
      audit_tires: vehicle.audit_tires || 4,
      audit_body: vehicle.audit_body || "Good",
      audit_engine: vehicle.audit_engine || "Good",
      audit_battery: vehicle.audit_battery || "Good",
      status: vehicle.status || "active",
      tvp_owner_id: vehicle.tvp_owner_id || "",
    });
  };

  // Get status color
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header
        title="Vehicle Management"
        subtitle="Manage all vehicles and their assignments"
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
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading vehicles...</p>
              </div>
            </div>
          )}

          {/* Error State */}
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

          {/* Content */}
          {!loading && !error && (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Total Vehicles
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {stats.total}
                      </p>
                    </div>
                    <Icon name="Car" size={24} className="text-primary" />
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.active}
                      </p>
                    </div>
                    <Icon
                      name="CheckCircle"
                      size={24}
                      className="text-green-600"
                    />
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Maintenance
                      </p>
                      <p className="text-2xl font-bold text-orange-600">
                        {stats.maintenance}
                      </p>
                    </div>
                    <Icon name="Wrench" size={24} className="text-orange-600" />
                  </div>
                </div>

                <div className="bg-card border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Inactive</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.inactive}
                      </p>
                    </div>
                    <Icon name="XCircle" size={24} className="text-red-600" />
                  </div>
                </div>
              </div>

              {/* Search and Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <Input
                    placeholder="Search vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full sm:w-64"
                  />
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setShowInactiveOnly(false);
                    }}
                    className="px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <Button
                    variant={showInactiveOnly ? "default" : "outline"}
                    onClick={() => {
                      setShowInactiveOnly(!showInactiveOnly);
                      if (!showInactiveOnly) {
                        setStatusFilter("all");
                      }
                    }}
                    iconName={showInactiveOnly ? "X" : "Filter"}
                    iconPosition="left"
                  >
                    {showInactiveOnly ? "Show All" : "Show Inactive Only"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddModal(true)}>
                    <Icon name="Plus" size={16} className="mr-2" />
                    Add Vehicle
                  </Button>
                  <Button variant="outline">
                    <Icon name="Download" size={16} className="mr-2" />
                    Export
                  </Button>
                </div>
              </div>

              {/* Vehicles Table */}
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Vehicle Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Assigned To
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Financial
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Audit Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-surface divide-y divide-border">
                      {paginatedVehicles.map((vehicle) => (
                        <tr
                          key={vehicle.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-4">
                            <div>
                              <div className="font-medium text-foreground">
                                {vehicle.car_number}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {vehicle.fleet_name}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <div className="text-sm font-medium text-foreground">
                                {vehicle.users?.name || "Unassigned"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {vehicle.users?.email || ""}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-foreground">
                              Deposit: {formatCurrency(vehicle.deposit_amount)}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="space-y-1">
                              <div className="text-xs text-muted-foreground">
                                KM: {formatIndianNumber(vehicle.audit_km)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Tires: {vehicle.audit_tires}/4
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Body: {vehicle.audit_body}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              onClick={() =>
                                handleStatusToggle(vehicle.id, vehicle.status)
                              }
                              className={`px-2 py-1 text-xs font-medium rounded-full cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(
                                vehicle.status
                              )}`}
                              title={`Click to toggle to ${
                                vehicle.status === "active" ? "inactive" : "active"
                              }`}
                            >
                              {vehicle.status}
                            </button>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenEditModal(vehicle)}
                              >
                                <Icon name="Edit" size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteVehicle(vehicle.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Icon name="Trash" size={14} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/30">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to{" "}
                      {Math.min(endIndex, filteredVehicles.length)} of{" "}
                      {filteredVehicles.length} vehicles
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <Icon name="ChevronLeft" size={16} />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === totalPages ||
                              (page >= currentPage - 1 && page <= currentPage + 1)
                          )
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 text-muted-foreground">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={currentPage === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        <Icon name="ChevronRight" size={16} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* No vehicles message */}
              {filteredVehicles.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Icon
                    name="Car"
                    size={48}
                    className="text-muted-foreground mx-auto mb-4"
                  />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No vehicles found
                  </h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowAddModal(false)}
          />
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto relative z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Add New Vehicle
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAddModal(false)}
              >
                <Icon name="X" size={20} />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Car Number"
                  value={newVehicle.car_number}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      car_number: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="ABC-123"
                  required
                />
                <Input
                  label="Fleet Name"
                  value={newVehicle.fleet_name}
                  onChange={(e) =>
                    setNewVehicle({ ...newVehicle, fleet_name: e.target.value })
                  }
                  placeholder="Fleet Name"
                  required
                />
              </div>

              <Input
                label="Deposit Amount (INR)"
                type="number"
                min="0"
                step="0.01"
                value={newVehicle.deposit_amount}
                onChange={(e) =>
                  setNewVehicle({
                    ...newVehicle,
                    deposit_amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />

              <Input
                label="TVP Owner ID (User UUID) - Optional"
                value={newVehicle.tvp_owner_id}
                onChange={(e) =>
                  setNewVehicle({ ...newVehicle, tvp_owner_id: e.target.value })
                }
                placeholder="Enter user UUID (optional)"
                description="Enter the UUID of the user who owns this vehicle (leave empty if unassigned)"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Audit KM"
                  type="number"
                  min="0"
                  value={newVehicle.audit_km}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      audit_km: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
                <Input
                  label="Audit Tires"
                  type="number"
                  min="0"
                  max="4"
                  value={newVehicle.audit_tires}
                  onChange={(e) =>
                    setNewVehicle({
                      ...newVehicle,
                      audit_tires: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Audit Body
                  </label>
                  <select
                    value={newVehicle.audit_body}
                    onChange={(e) =>
                      setNewVehicle({ ...newVehicle, audit_body: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Audit Engine
                  </label>
                  <select
                    value={newVehicle.audit_engine}
                    onChange={(e) =>
                      setNewVehicle({
                        ...newVehicle,
                        audit_engine: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Audit Battery
                  </label>
                  <select
                    value={newVehicle.audit_battery}
                    onChange={(e) =>
                      setNewVehicle({
                        ...newVehicle,
                        audit_battery: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Status
                </label>
                <select
                  value={newVehicle.status}
                  onChange={(e) =>
                    setNewVehicle({ ...newVehicle, status: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  onClick={handleAddVehicle}
                  className="flex-1"
                  iconName="Plus"
                  iconPosition="left"
                >
                  Add Vehicle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Vehicle Modal */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setEditingVehicle(null)}
          />
          <div className="bg-card border border-border rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto relative z-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Edit Vehicle
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingVehicle(null)}
              >
                <Icon name="X" size={20} />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Car Number"
                  value={editVehicleData.car_number}
                  onChange={(e) =>
                    setEditVehicleData({
                      ...editVehicleData,
                      car_number: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="ABC-123"
                  required
                />
                <Input
                  label="Fleet Name"
                  value={editVehicleData.fleet_name}
                  onChange={(e) =>
                    setEditVehicleData({
                      ...editVehicleData,
                      fleet_name: e.target.value,
                    })
                  }
                  placeholder="Fleet Name"
                  required
                />
              </div>

              <Input
                label="Deposit Amount (INR)"
                type="number"
                min="0"
                step="0.01"
                value={editVehicleData.deposit_amount}
                onChange={(e) =>
                  setEditVehicleData({
                    ...editVehicleData,
                    deposit_amount: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="0"
              />

              <Input
                label="TVP Owner ID (User UUID) - Optional"
                value={editVehicleData.tvp_owner_id}
                onChange={(e) =>
                  setEditVehicleData({
                    ...editVehicleData,
                    tvp_owner_id: e.target.value,
                  })
                }
                placeholder="Enter user UUID (optional)"
                description="Enter the UUID of the user who owns this vehicle (leave empty if unassigned)"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Audit KM"
                  type="number"
                  min="0"
                  value={editVehicleData.audit_km}
                  onChange={(e) =>
                    setEditVehicleData({
                      ...editVehicleData,
                      audit_km: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="0"
                />
                <Input
                  label="Audit Tires"
                  type="number"
                  min="0"
                  max="4"
                  value={editVehicleData.audit_tires}
                  onChange={(e) =>
                    setEditVehicleData({
                      ...editVehicleData,
                      audit_tires: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="4"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Audit Body
                  </label>
                  <select
                    value={editVehicleData.audit_body}
                    onChange={(e) =>
                      setEditVehicleData({
                        ...editVehicleData,
                        audit_body: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Audit Engine
                  </label>
                  <select
                    value={editVehicleData.audit_engine}
                    onChange={(e) =>
                      setEditVehicleData({
                        ...editVehicleData,
                        audit_engine: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Audit Battery
                  </label>
                  <select
                    value={editVehicleData.audit_battery}
                    onChange={(e) =>
                      setEditVehicleData({
                        ...editVehicleData,
                        audit_battery: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                  >
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Status
                </label>
                <select
                  value={editVehicleData.status}
                  onChange={(e) =>
                    setEditVehicleData({
                      ...editVehicleData,
                      status: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  onClick={handleEditVehicle}
                  className="flex-1"
                  iconName="Save"
                  iconPosition="left"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingVehicle(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleManagement;
