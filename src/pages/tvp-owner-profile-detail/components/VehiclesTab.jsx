import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const CARD = "bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden";
const PADDING = "p-6";
const BOX = "rounded-xl border border-border/80 bg-muted/30 p-4";
const SECTION_TITLE = "text-xl font-bold text-foreground";

const VehiclesTab = ({ vehicles, onVehicleUpdate, onVehicleRemove, onVehicleAdd }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: "",
    model: "",
    year: "",
    plateNumber: "",
    color: "",
    vin: "",
  });

  const filteredVehicles = vehicles?.filter((vehicle) => {
    const matchesSearch =
      vehicle?.make?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      vehicle?.model?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      vehicle?.plateNumber?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesStatus = statusFilter === "all" || vehicle?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-success/15 text-success border border-success/30";
      case "inactive":
        return "bg-destructive/15 text-destructive border border-destructive/30";
      case "maintenance":
        return "bg-warning/15 text-warning border border-warning/30";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const handleAddVehicle = () => {
    const vehicleData = {
      ...newVehicle,
      id: `VEH${String(vehicles?.length + 1)?.padStart(3, "0")}`,
      status: "active",
      assignedDate: new Date()?.toISOString()?.split("T")?.[0],
      totalTrips: 0,
      totalEarnings: 0,
      lastServiceDate: null,
    };
    onVehicleAdd(vehicleData);
    setNewVehicle({
      make: "",
      model: "",
      year: "",
      plateNumber: "",
      color: "",
      vin: "",
    });
    setShowAddForm(false);
  };

  const handleStatusChange = (vehicleId, newStatus) => {
    onVehicleUpdate(vehicleId, { status: newStatus });
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className={CARD}>
        <div className={PADDING}>
          <h2 className={`${SECTION_TITLE} mb-4 flex items-center gap-3`}>
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon name="Car" size={22} className="text-primary" />
            </span>
            Assigned Vehicles
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
                <Icon name="Search" size={16} className="text-muted-foreground" />
                Search
              </label>
              <Input
                type="search"
                placeholder="Make, model, or plate..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e?.target?.value)}
              />
            </div>
            <div className="flex items-end gap-3">
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
                  <Icon name="Filter" size={16} className="text-muted-foreground" />
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e?.target?.value)}
                  className="h-10 px-4 py-2 border border-border/80 rounded-xl bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring min-w-[140px]"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <Button
                variant="default"
                onClick={() => setShowAddForm(true)}
                iconName="Plus"
                iconPosition="left"
                iconSize={18}
              >
                Add Vehicle
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Vehicle Form */}
      {showAddForm && (
        <div className={CARD}>
          <div className={PADDING}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`${SECTION_TITLE} flex items-center gap-3`}>
                <Icon name="PlusCircle" size={24} className="text-primary" />
                Add New Vehicle
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)} iconName="X" iconSize={18}>
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <Input
                label="Make"
                type="text"
                value={newVehicle?.make}
                onChange={(e) => setNewVehicle((prev) => ({ ...prev, make: e?.target?.value }))}
                placeholder="e.g., Toyota"
              />
              <Input
                label="Model"
                type="text"
                value={newVehicle?.model}
                onChange={(e) => setNewVehicle((prev) => ({ ...prev, model: e?.target?.value }))}
                placeholder="e.g., Camry"
              />
              <Input
                label="Year"
                type="number"
                value={newVehicle?.year}
                onChange={(e) => setNewVehicle((prev) => ({ ...prev, year: e?.target?.value }))}
                placeholder="e.g., 2022"
              />
              <Input
                label="Plate Number"
                type="text"
                value={newVehicle?.plateNumber}
                onChange={(e) => setNewVehicle((prev) => ({ ...prev, plateNumber: e?.target?.value }))}
                placeholder="e.g., ABC-1234"
              />
              <Input
                label="Color"
                type="text"
                value={newVehicle?.color}
                onChange={(e) => setNewVehicle((prev) => ({ ...prev, color: e?.target?.value }))}
                placeholder="e.g., White"
              />
              <Input
                label="VIN"
                type="text"
                value={newVehicle?.vin}
                onChange={(e) => setNewVehicle((prev) => ({ ...prev, vin: e?.target?.value }))}
                placeholder="Vehicle Identification Number"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
              <Button
                variant="default"
                onClick={handleAddVehicle}
                disabled={!newVehicle?.make || !newVehicle?.model || !newVehicle?.plateNumber}
              >
                Add Vehicle
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Vehicle Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVehicles?.map((vehicle) => (
          <div key={vehicle?.id} className={CARD}>
            <div className={PADDING}>
              <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-border/60">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon name="Car" size={28} className="text-primary" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold text-foreground truncate">
                      {vehicle?.make} {vehicle?.model}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {vehicle?.year} · {vehicle?.color}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${getStatusColor(
                    vehicle?.status,
                  )}`}
                >
                  {vehicle?.status}
                </span>
              </div>

              <div className="space-y-3 mb-5">
                <div className={`${BOX} flex items-center justify-between`}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Icon name="Hash" size={16} />
                    Plate Number
                  </span>
                  <span className="font-bold text-foreground">{vehicle?.plateNumber}</span>
                </div>
                <div className={`${BOX} flex items-center justify-between`}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Icon name="FileDigit" size={16} />
                    VIN
                  </span>
                  <span className="font-mono text-sm font-medium text-foreground">{vehicle?.vin || "—"}</span>
                </div>
                <div className={`${BOX} flex items-center justify-between`}>
                  <span className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                    <Icon name="Calendar" size={16} />
                    Assigned
                  </span>
                  <span className="font-medium text-foreground">{vehicle?.assignedDate || "—"}</span>
                </div>
              </div>

              <div className={`${BOX} grid grid-cols-2 gap-4 text-center mb-5`}>
                <div>
                  <div className="text-2xl font-bold text-foreground tabular-nums">{vehicle?.totalTrips ?? 0}</div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">
                    Total Trips
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-success tabular-nums">
                    ${vehicle?.totalEarnings?.toLocaleString() ?? "0"}
                  </div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-1">
                    Total Earnings
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() =>
                    handleStatusChange(vehicle?.id, vehicle?.status === "active" ? "inactive" : "active")
                  }
                  iconName={vehicle?.status === "active" ? "Pause" : "Play"}
                  iconPosition="left"
                  iconSize={16}
                >
                  {vehicle?.status === "active" ? "Deactivate" : "Activate"}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onVehicleRemove(vehicle?.id)}
                  iconName="Trash2"
                  iconSize={16}
                >
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles?.length === 0 && (
        <div className={CARD}>
          <div className="p-12 text-center border border-dashed border-border/80 rounded-2xl bg-muted/20">
            <Icon name="Car" size={56} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">No vehicles found</h3>
            <p className="text-muted-foreground mb-5 max-w-sm mx-auto">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting search or filters."
                : "This driver has no vehicles assigned yet."}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button variant="default" onClick={() => setShowAddForm(true)} iconName="Plus" iconPosition="left" iconSize={18}>
                Add First Vehicle
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesTab;
