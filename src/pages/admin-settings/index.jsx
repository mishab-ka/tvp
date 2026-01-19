import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Icon from "../../components/AppIcon";
import { useAuth } from "../../contexts/AuthContext";
import { useAdminSettings } from "../../hooks/useAdminSettings";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, hasRole } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const {
    loading,
    error,
    fleetRentSlabs,
    companyEarningsSlabs,
    companyEarningsSlabs24hr,
    vehiclePerformanceRentalIncome,
    companyInfo,
    notificationPreferences,
    systemConfig,
    penaltyDivisionSettings,
    updateFleetRentSlabs,
    updateCompanyEarningsSlabs,
    updateCompanyEarningsSlabs24hr,
    updateVehiclePerformanceRentalIncome,
    updateCompanyInfo,
    updateNotificationPreferences,
    updateSystemConfig,
    updatePenaltyDivisionSettings,
    loadSettings,
  } = useAdminSettings();

  // Local state for editing
  const [localCompanyInfo, setLocalCompanyInfo] = useState(companyInfo);
  const [localNotificationPrefs, setLocalNotificationPrefs] = useState(
    notificationPreferences
  );
  const [localSystemConfig, setLocalSystemConfig] = useState(systemConfig);
  const [localPenaltySettings, setLocalPenaltySettings] = useState(
    penaltyDivisionSettings
  );

  // Slab editing state
  const [editingFleetSlab, setEditingFleetSlab] = useState(null);
  const [editingEarningsSlab, setEditingEarningsSlab] = useState(null);
  const [editingEarningsSlab24hr, setEditingEarningsSlab24hr] = useState(null);

  // Sync local state when hook data loads
  useEffect(() => {
    setLocalCompanyInfo(companyInfo);
  }, [companyInfo]);

  useEffect(() => {
    setLocalNotificationPrefs(notificationPreferences);
  }, [notificationPreferences]);

  useEffect(() => {
    setLocalSystemConfig(systemConfig);
  }, [systemConfig]);

  useEffect(() => {
    setLocalPenaltySettings(penaltyDivisionSettings);
  }, [penaltyDivisionSettings]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveCompanyInfo = async () => {
    try {
      setSaving(true);
      await updateCompanyInfo(localCompanyInfo);
      showToast("Company information saved successfully");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotificationPrefs = async () => {
    try {
      setSaving(true);
      await updateNotificationPreferences(localNotificationPrefs);
      showToast("Notification preferences saved successfully");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystemConfig = async () => {
    try {
      setSaving(true);
      await updateSystemConfig(localSystemConfig);
      showToast("System configuration saved successfully");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePenaltySettings = async () => {
    try {
      setSaving(true);
      await updatePenaltyDivisionSettings(localPenaltySettings);
      showToast("Penalty division settings saved successfully");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFleetSlabs = async (slabs) => {
    try {
      setSaving(true);
      await updateFleetRentSlabs(slabs);
      setEditingFleetSlab(null);
      showToast("Fleet rent slabs saved successfully");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEarningsSlabs = async (slabs) => {
    try {
      setSaving(true);
      await updateCompanyEarningsSlabs(slabs);
      setEditingEarningsSlab(null);
      showToast("Company earnings slabs saved successfully");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEarningsSlabs24hr = async (slabs) => {
    try {
      setSaving(true);
      await updateCompanyEarningsSlabs24hr(slabs);
      setEditingEarningsSlab24hr(null);
      showToast("24-hour shift earnings slabs saved successfully");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRentalIncome = async () => {
    try {
      setSaving(true);
      await updateVehiclePerformanceRentalIncome(
        parseFloat(localSystemConfig.rentalIncome) || 0
      );
      showToast("Rental income saved successfully");
    } catch (err) {
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFleetSlab = () => {
    const newSlab = { min_trips: 0, max_trips: null, amount: 0 };
    setEditingFleetSlab(newSlab);
  };

  const handleEditFleetSlab = (slab, index) => {
    setEditingFleetSlab({ ...slab, _index: index });
  };

  const handleDeleteFleetSlab = (index) => {
    const newSlabs = fleetRentSlabs.filter((_, i) => i !== index);
    handleSaveFleetSlabs(newSlabs);
  };

  const handleSaveFleetSlab = () => {
    if (!editingFleetSlab) return;

    // Validate inputs
    const minTrips = parseInt(editingFleetSlab.min_trips);
    const maxTrips =
      editingFleetSlab.max_trips === "" ||
      editingFleetSlab.max_trips === null ||
      editingFleetSlab.max_trips === undefined
        ? null
        : parseInt(editingFleetSlab.max_trips);
    const amount = parseFloat(editingFleetSlab.amount);

    if (isNaN(minTrips) || minTrips < 0) {
      showToast("Minimum trips must be a valid number >= 0", "error");
      return;
    }
    if (maxTrips !== null && (isNaN(maxTrips) || maxTrips < minTrips)) {
      showToast("Maximum trips must be null or >= minimum trips", "error");
      return;
    }
    if (isNaN(amount) || amount < 0) {
      showToast("Amount must be a valid number >= 0", "error");
      return;
    }

    const newSlabs = [...fleetRentSlabs];
    const slabData = {
      min_trips: minTrips,
      max_trips: maxTrips,
      amount: amount,
    };

    if (editingFleetSlab._index !== undefined && editingFleetSlab._index >= 0) {
      newSlabs[editingFleetSlab._index] = slabData;
    } else {
      newSlabs.push(slabData);
    }
    handleSaveFleetSlabs(newSlabs);
  };

  const handleAddEarningsSlab = () => {
    const newSlab = { min_trips: 0, max_trips: null, amount: 0 };
    setEditingEarningsSlab(newSlab);
  };

  const handleEditEarningsSlab = (slab, index) => {
    setEditingEarningsSlab({ ...slab, _index: index });
  };

  const handleDeleteEarningsSlab = (index) => {
    const newSlabs = companyEarningsSlabs.filter((_, i) => i !== index);
    handleSaveEarningsSlabs(newSlabs);
  };

  const handleSaveEarningsSlab = () => {
    if (!editingEarningsSlab) return;

    // Validate inputs
    const minTrips = parseInt(editingEarningsSlab.min_trips);
    const maxTrips =
      editingEarningsSlab.max_trips === "" ||
      editingEarningsSlab.max_trips === null ||
      editingEarningsSlab.max_trips === undefined
        ? null
        : parseInt(editingEarningsSlab.max_trips);
    const amount = parseFloat(editingEarningsSlab.amount);

    if (isNaN(minTrips) || minTrips < 0) {
      showToast("Minimum trips must be a valid number >= 0", "error");
      return;
    }
    if (maxTrips !== null && (isNaN(maxTrips) || maxTrips < minTrips)) {
      showToast("Maximum trips must be null or >= minimum trips", "error");
      return;
    }
    if (isNaN(amount) || amount < 0) {
      showToast("Amount must be a valid number >= 0", "error");
      return;
    }

    const newSlabs = [...companyEarningsSlabs];
    const slabData = {
      min_trips: minTrips,
      max_trips: maxTrips,
      amount: amount,
    };

    if (
      editingEarningsSlab._index !== undefined &&
      editingEarningsSlab._index >= 0
    ) {
      newSlabs[editingEarningsSlab._index] = slabData;
    } else {
      newSlabs.push(slabData);
    }
    handleSaveEarningsSlabs(newSlabs);
  };

  const handleAddEarningsSlab24hr = () => {
    const newSlab = { min_trips: 0, max_trips: null, amount: 0 };
    setEditingEarningsSlab24hr(newSlab);
  };

  const handleEditEarningsSlab24hr = (slab, index) => {
    setEditingEarningsSlab24hr({ ...slab, _index: index });
  };

  const handleDeleteEarningsSlab24hr = (index) => {
    const newSlabs = companyEarningsSlabs24hr.filter((_, i) => i !== index);
    handleSaveEarningsSlabs24hr(newSlabs);
  };

  const handleSaveEarningsSlab24hr = () => {
    if (!editingEarningsSlab24hr) return;

    // Validate inputs
    const minTrips = parseInt(editingEarningsSlab24hr.min_trips);
    const maxTrips =
      editingEarningsSlab24hr.max_trips === "" ||
      editingEarningsSlab24hr.max_trips === null ||
      editingEarningsSlab24hr.max_trips === undefined
        ? null
        : parseInt(editingEarningsSlab24hr.max_trips);
    const amount = parseFloat(editingEarningsSlab24hr.amount);

    if (isNaN(minTrips) || minTrips < 0) {
      showToast("Minimum trips must be a valid number >= 0", "error");
      return;
    }
    if (maxTrips !== null && (isNaN(maxTrips) || maxTrips < minTrips)) {
      showToast("Maximum trips must be null or >= minimum trips", "error");
      return;
    }
    if (isNaN(amount) || amount < 0) {
      showToast("Amount must be a valid number >= 0", "error");
      return;
    }

    const newSlabs = [...companyEarningsSlabs24hr];
    const slabData = {
      min_trips: minTrips,
      max_trips: maxTrips,
      amount: amount,
    };

    if (
      editingEarningsSlab24hr._index !== undefined &&
      editingEarningsSlab24hr._index >= 0
    ) {
      newSlabs[editingEarningsSlab24hr._index] = slabData;
    } else {
      newSlabs.push(slabData);
    }
    handleSaveEarningsSlabs24hr(newSlabs);
  };

  const tabs = [
    { id: "general", label: "General", icon: "Settings" },
    { id: "fleet_expenses", label: "Fleet Expenses", icon: "Car" },
    { id: "company_earnings", label: "Company Earnings", icon: "DollarSign" },
    { id: "penalty_division", label: "Penalty Division", icon: "AlertCircle" },
    { id: "notifications", label: "Notifications", icon: "Bell" },
    { id: "system", label: "System", icon: "Cog" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Company Information
              </h3>
              <div className="space-y-4">
                <Input
                  label="Company Name"
                  value={localCompanyInfo.company_name || ""}
                  onChange={(e) =>
                    setLocalCompanyInfo({
                      ...localCompanyInfo,
                      company_name: e.target.value,
                    })
                  }
                  placeholder="Company Name"
                />
                <Input
                  label="Contact Email"
                  type="email"
                  value={localCompanyInfo.contact_email || ""}
                  onChange={(e) =>
                    setLocalCompanyInfo({
                      ...localCompanyInfo,
                      contact_email: e.target.value,
                    })
                  }
                  placeholder="admin@company.com"
                />
                <Input
                  label="Contact Phone"
                  type="tel"
                  value={localCompanyInfo.contact_phone || ""}
                  onChange={(e) =>
                    setLocalCompanyInfo({
                      ...localCompanyInfo,
                      contact_phone: e.target.value,
                    })
                  }
                  placeholder="+91 1234567890"
                />
                <Button
                  onClick={handleSaveCompanyInfo}
                  disabled={saving}
                  iconName="Save"
                  iconPosition="left"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        );

      case "fleet_expenses":
        return (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Fleet Rent Slabs</h3>
                <Button
                  onClick={handleAddFleetSlab}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Add Slab
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Configure fleet rent amounts based on trip count ranges. Amounts
                are calculated based on the number of trips.
              </p>

              {/* Slabs Table */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading slabs...
                </div>
              ) : fleetRentSlabs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No fleet rent slabs configured.</p>
                  <p className="text-sm">
                    Click "Add Slab" to create your first slab.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Min Trips
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Max Trips
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Amount (₹)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {fleetRentSlabs.map((slab, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">{slab.min_trips}</td>
                          <td className="px-4 py-3">
                            {slab.max_trips === null ? "∞" : slab.max_trips}
                          </td>
                          <td className="px-4 py-3">₹{slab.amount}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditFleetSlab(slab, index)}
                                title="Edit slab"
                              >
                                <Icon name="Edit" size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFleetSlab(index)}
                                title="Delete slab"
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
              )}

              {/* Edit Form */}
              {editingFleetSlab && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
                  <h4 className="font-medium mb-4">
                    {editingFleetSlab._index !== undefined
                      ? "Edit Slab"
                      : "Add New Slab"}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Min Trips"
                      type="number"
                      value={editingFleetSlab.min_trips || ""}
                      onChange={(e) =>
                        setEditingFleetSlab({
                          ...editingFleetSlab,
                          min_trips: e.target.value,
                        })
                      }
                      min="0"
                    />
                    <Input
                      label="Max Trips (leave empty for unlimited)"
                      type="number"
                      value={
                        editingFleetSlab.max_trips === null
                          ? ""
                          : editingFleetSlab.max_trips
                      }
                      onChange={(e) =>
                        setEditingFleetSlab({
                          ...editingFleetSlab,
                          max_trips: e.target.value || null,
                        })
                      }
                      min="0"
                      placeholder="Unlimited"
                    />
                    <Input
                      label="Amount (₹)"
                      type="number"
                      step="0.01"
                      value={editingFleetSlab.amount || ""}
                      onChange={(e) =>
                        setEditingFleetSlab({
                          ...editingFleetSlab,
                          amount: e.target.value,
                        })
                      }
                      min="0"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveFleetSlab} disabled={saving}>
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingFleetSlab(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case "company_earnings":
        return (
          <div className="space-y-6">
            {/* Regular Shift Earnings Slabs */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  Regular Shift Earnings Slabs
                </h3>
                <Button
                  onClick={handleAddEarningsSlab}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Add Slab
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Configure company earnings (driver rent) for morning/night
                shifts based on trip count.
              </p>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading slabs...
                </div>
              ) : companyEarningsSlabs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">No company earnings slabs configured.</p>
                  <p className="text-sm">
                    Click "Add Slab" to create your first slab.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Min Trips
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Max Trips
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Amount (₹)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {companyEarningsSlabs.map((slab, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">{slab.min_trips}</td>
                          <td className="px-4 py-3">
                            {slab.max_trips === null ? "∞" : slab.max_trips}
                          </td>
                          <td className="px-4 py-3">₹{slab.amount}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEditEarningsSlab(slab, index)
                                }
                                title="Edit slab"
                              >
                                <Icon name="Edit" size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteEarningsSlab(index)}
                                title="Delete slab"
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
              )}

              {editingEarningsSlab && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
                  <h4 className="font-medium mb-4">
                    {editingEarningsSlab._index !== undefined
                      ? "Edit Slab"
                      : "Add New Slab"}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Min Trips"
                      type="number"
                      value={editingEarningsSlab.min_trips || ""}
                      onChange={(e) =>
                        setEditingEarningsSlab({
                          ...editingEarningsSlab,
                          min_trips: e.target.value,
                        })
                      }
                      min="0"
                    />
                    <Input
                      label="Max Trips"
                      type="number"
                      value={
                        editingEarningsSlab.max_trips === null
                          ? ""
                          : editingEarningsSlab.max_trips
                      }
                      onChange={(e) =>
                        setEditingEarningsSlab({
                          ...editingEarningsSlab,
                          max_trips: e.target.value || null,
                        })
                      }
                      placeholder="Unlimited"
                    />
                    <Input
                      label="Amount (₹)"
                      type="number"
                      step="0.01"
                      value={editingEarningsSlab.amount || ""}
                      onChange={(e) =>
                        setEditingEarningsSlab({
                          ...editingEarningsSlab,
                          amount: e.target.value,
                        })
                      }
                      min="0"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button onClick={handleSaveEarningsSlab} disabled={saving}>
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingEarningsSlab(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 24-Hour Shift Earnings Slabs */}
            <div className="bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  24-Hour Shift Earnings Slabs
                </h3>
                <Button
                  onClick={handleAddEarningsSlab24hr}
                  iconName="Plus"
                  iconPosition="left"
                >
                  Add Slab
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Configure company earnings for 24-hour shifts (different rates
                from regular shifts).
              </p>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading slabs...
                </div>
              ) : companyEarningsSlabs24hr.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-2">
                    No 24-hour shift earnings slabs configured.
                  </p>
                  <p className="text-sm">
                    Click "Add Slab" to create your first slab.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Min Trips
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Max Trips
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Amount (₹)
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {companyEarningsSlabs24hr.map((slab, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3">{slab.min_trips}</td>
                          <td className="px-4 py-3">
                            {slab.max_trips === null ? "∞" : slab.max_trips}
                          </td>
                          <td className="px-4 py-3">₹{slab.amount}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEditEarningsSlab24hr(slab, index)
                                }
                                title="Edit slab"
                              >
                                <Icon name="Edit" size={14} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleDeleteEarningsSlab24hr(index)
                                }
                                title="Delete slab"
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
              )}

              {editingEarningsSlab24hr && (
                <div className="mt-6 p-4 bg-muted/30 rounded-lg border border-border">
                  <h4 className="font-medium mb-4">
                    {editingEarningsSlab24hr._index !== undefined
                      ? "Edit Slab"
                      : "Add New Slab"}
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Min Trips"
                      type="number"
                      value={editingEarningsSlab24hr.min_trips || ""}
                      onChange={(e) =>
                        setEditingEarningsSlab24hr({
                          ...editingEarningsSlab24hr,
                          min_trips: e.target.value,
                        })
                      }
                      min="0"
                    />
                    <Input
                      label="Max Trips"
                      type="number"
                      value={
                        editingEarningsSlab24hr.max_trips === null
                          ? ""
                          : editingEarningsSlab24hr.max_trips
                      }
                      onChange={(e) =>
                        setEditingEarningsSlab24hr({
                          ...editingEarningsSlab24hr,
                          max_trips: e.target.value || null,
                        })
                      }
                      placeholder="Unlimited"
                    />
                    <Input
                      label="Amount (₹)"
                      type="number"
                      step="0.01"
                      value={editingEarningsSlab24hr.amount || ""}
                      onChange={(e) =>
                        setEditingEarningsSlab24hr({
                          ...editingEarningsSlab24hr,
                          amount: e.target.value,
                        })
                      }
                      min="0"
                    />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={handleSaveEarningsSlab24hr}
                      disabled={saving}
                    >
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setEditingEarningsSlab24hr(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle Performance Rental Income */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Vehicle Performance Rental Income
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Set a fixed rental income amount displayed in Vehicle
                Performance tab.
              </p>
              <div className="max-w-md">
                <Input
                  label="Rental Income Amount (₹)"
                  type="number"
                  step="0.01"
                  value={vehiclePerformanceRentalIncome || ""}
                  onChange={(e) =>
                    setLocalSystemConfig({
                      ...localSystemConfig,
                      rentalIncome: e.target.value,
                    })
                  }
                  placeholder="0"
                />
                <Button
                  onClick={handleSaveRentalIncome}
                  disabled={saving}
                  className="mt-4"
                  iconName="Save"
                  iconPosition="left"
                >
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          </div>
        );

      case "penalty_division":
        return (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Penalty Division Settings
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Configure how penalties are divided and applied to drivers over
                time.
              </p>
              <div className="space-y-6">
                <div>
                  <Input
                    label="Division Period (Days)"
                    type="number"
                    min="1"
                    max="365"
                    value={localPenaltySettings.division_days || 7}
                    onChange={(e) =>
                      setLocalPenaltySettings({
                        ...localPenaltySettings,
                        division_days: parseInt(e.target.value) || 7,
                      })
                    }
                    description="Number of days over which penalties are divided (e.g., 7 = ₹700 penalty becomes ₹100/day for 7 days)"
                  />
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">
                        Enable Penalty Division
                      </label>
                      <p className="text-xs text-muted-foreground">
                        When enabled, penalties are automatically divided over
                        the division period
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localPenaltySettings.enabled || false}
                        onChange={(e) =>
                          setLocalPenaltySettings({
                            ...localPenaltySettings,
                            enabled: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium">
                        Auto-apply to Reports
                      </label>
                      <p className="text-xs text-muted-foreground">
                        When enabled, daily penalty amount is automatically
                        added to rent payable in submit reports
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={localPenaltySettings.auto_apply || false}
                        onChange={(e) =>
                          setLocalPenaltySettings({
                            ...localPenaltySettings,
                            auto_apply: e.target.checked,
                          })
                        }
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>
                </div>
                <Button
                  onClick={handleSavePenaltySettings}
                  disabled={saving}
                  iconName="Save"
                  iconPosition="left"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                Notification Preferences
              </h3>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">
                      Email Notifications
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Enable email notifications for important events
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={
                        localNotificationPrefs.email_notifications || false
                      }
                      onChange={(e) =>
                        setLocalNotificationPrefs({
                          ...localNotificationPrefs,
                          email_notifications: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">
                      SMS Notifications
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Enable SMS notifications for critical alerts
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={
                        localNotificationPrefs.sms_notifications || false
                      }
                      onChange={(e) =>
                        setLocalNotificationPrefs({
                          ...localNotificationPrefs,
                          sms_notifications: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">
                      New Report Notifications
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Get notified when a new report is submitted
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={
                        localNotificationPrefs.new_report_notifications || false
                      }
                      onChange={(e) =>
                        setLocalNotificationPrefs({
                          ...localNotificationPrefs,
                          new_report_notifications: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <Button
                  onClick={handleSaveNotificationPrefs}
                  disabled={saving}
                  iconName="Save"
                  iconPosition="left"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        );

      case "system":
        return (
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">
                System Configuration
              </h3>
              <div className="space-y-6">
                <div>
                  <Input
                    label="API Key"
                    type="password"
                    value={localSystemConfig.api_key || ""}
                    onChange={(e) =>
                      setLocalSystemConfig({
                        ...localSystemConfig,
                        api_key: e.target.value,
                      })
                    }
                    placeholder="Enter API key"
                    description="Keep this key secure. Do not share it publicly."
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        localSystemConfig.api_key || ""
                      );
                      showToast("API key copied to clipboard");
                    }}
                  >
                    <Icon name="Copy" size={14} className="mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Debug Mode</label>
                    <p className="text-xs text-muted-foreground">
                      Enable detailed error logging and debugging information
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={localSystemConfig.debug_mode || false}
                      onChange={(e) =>
                        setLocalSystemConfig({
                          ...localSystemConfig,
                          debug_mode: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">
                      Maintenance Mode
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Put the site in maintenance mode (users will see a
                      maintenance message)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={localSystemConfig.maintenance_mode || false}
                      onChange={(e) =>
                        setLocalSystemConfig({
                          ...localSystemConfig,
                          maintenance_mode: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium">Dark Mode</label>
                    <p className="text-xs text-muted-foreground">
                      Enable dark mode theme (may require page refresh)
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={localSystemConfig.dark_mode || false}
                      onChange={(e) =>
                        setLocalSystemConfig({
                          ...localSystemConfig,
                          dark_mode: e.target.checked,
                        })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                </div>
                <Button
                  onClick={handleSaveSystemConfig}
                  disabled={saving}
                  iconName="Save"
                  iconPosition="left"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return <div>Please log in to access settings.</div>;
  }

  const canAccess =
    hasRole?.(["admin", "super_admin"]) ||
    ["admin", "super_admin"].includes(currentUser?.role);
  if (!canAccess) {
    return <div>You do not have permission to access admin settings.</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Admin Settings"
        subtitle="Configure system settings and parameters"
        onMenuClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        onSidebarToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

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

      <main
        className={`transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"
        }`}
      >
        <div className="p-4 lg:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading settings...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <Icon
                  name="AlertCircle"
                  size={20}
                  className="text-red-600 mr-2"
                />
                <div>
                  <h3 className="text-red-800 font-medium">
                    Error Loading Settings
                  </h3>
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Reload Button */}
              <div className="mb-4 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadSettings}
                  disabled={loading}
                  iconName="RefreshCw"
                  iconPosition="left"
                >
                  {loading ? "Reloading..." : "Reload Settings"}
                </Button>
              </div>

              {/* Tab Navigation */}
              <div className="border-b border-border mb-6">
                <nav className="flex space-x-8 overflow-x-auto">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 whitespace-nowrap ${
                        activeTab === tab.id
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                      }`}
                    >
                      <Icon name={tab.icon} size={16} />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div>{renderTabContent()}</div>
            </>
          )}

          {/* Toast Notification */}
          {toast && (
            <div
              className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
                toast.type === "error"
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white"
              }`}
            >
              {toast.message}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
