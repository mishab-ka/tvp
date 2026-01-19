import React, { useState, useEffect } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Icon from "../../../components/AppIcon";

const TRIP_SLAB_STORAGE_KEY = "tvp_trip_slabs";

const SettingsModal = ({ isOpen, onClose }) => {
  const [tripSlabs, setTripSlabs] = useState({
    company: [],
    tawaaq: [],
  });
  const [newSlab, setNewSlab] = useState({
    type: "tawaaq",
    minTrips: "",
    maxTrips: "",
    dailyRent: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadTripSlabs();
    }
  }, [isOpen]);

  const loadTripSlabs = () => {
    try {
      const stored = localStorage.getItem(TRIP_SLAB_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setTripSlabs({
          company: parsed.company || [],
          tawaaq: parsed.tawaaq || [],
        });
      }
    } catch (err) {
      console.error("Error loading trip slabs:", err);
    }
  };

  const saveTripSlabs = (slabs) => {
    try {
      localStorage.setItem(TRIP_SLAB_STORAGE_KEY, JSON.stringify(slabs));
      setTripSlabs(slabs);
    } catch (err) {
      console.error("Error saving trip slabs:", err);
    }
  };

  const handleAddSlab = () => {
    const errors = {};
    if (!newSlab.minTrips || Number(newSlab.minTrips) < 0) {
      errors.minTrips = "Minimum trips is required";
    }
    if (!newSlab.maxTrips || Number(newSlab.maxTrips) < Number(newSlab.minTrips)) {
      errors.maxTrips = "Maximum trips must be >= minimum trips";
    }
    if (!newSlab.dailyRent || Number(newSlab.dailyRent) < 0) {
      errors.dailyRent = "Daily rent is required";
    }

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    const slab = {
      id: Date.now().toString(),
      minTrips: Number(newSlab.minTrips),
      maxTrips: Number(newSlab.maxTrips),
      dailyRent: Number(newSlab.dailyRent),
    };

    const updated = {
      ...tripSlabs,
      [newSlab.type]: [...tripSlabs[newSlab.type], slab].sort(
        (a, b) => a.minTrips - b.minTrips
      ),
    };

    saveTripSlabs(updated);
    setNewSlab({ type: newSlab.type, minTrips: "", maxTrips: "", dailyRent: "" });
    setErrors({});
  };

  const handleDeleteSlab = (type, id) => {
    const updated = {
      ...tripSlabs,
      [type]: tripSlabs[type].filter((s) => s.id !== id),
    };
    saveTripSlabs(updated);
  };

  const getDailyRentForTrips = (trips, type = "tawaaq") => {
    const slabs = tripSlabs[type] || [];
    const tripCount = Number(trips) || 0;

    for (const slab of slabs) {
      if (tripCount >= slab.minTrips && tripCount <= slab.maxTrips) {
        return slab.dailyRent;
      }
    }
    return 0;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 px-4">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-background rounded-lg border border-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              Trip Slab Settings
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Configure trip slabs for rent calculation
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            iconName="X"
            iconSize={20}
          />
        </div>

        <div className="p-6 space-y-6">
          {/* Add New Slab */}
          <div className="p-4 bg-muted/20 rounded-lg border border-border">
            <h3 className="text-sm font-medium text-foreground mb-4">
              Add New Trip Slab
            </h3>
            <div className="grid gap-4 md:grid-cols-4">
              <select
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={newSlab.type}
                onChange={(e) =>
                  setNewSlab({ ...newSlab, type: e.target.value })
                }
              >
                <option value="tawaaq">Tawaaq Trip Slab</option>
                <option value="company">Company Trip Slab</option>
              </select>
              <Input
                label="Min Trips"
                type="number"
                min="0"
                value={newSlab.minTrips}
                onChange={(e) =>
                  setNewSlab({ ...newSlab, minTrips: e.target.value })
                }
                error={errors.minTrips}
              />
              <Input
                label="Max Trips"
                type="number"
                min="0"
                value={newSlab.maxTrips}
                onChange={(e) =>
                  setNewSlab({ ...newSlab, maxTrips: e.target.value })
                }
                error={errors.maxTrips}
              />
              <Input
                label="Daily Rent (SAR)"
                type="number"
                min="0"
                step="0.01"
                value={newSlab.dailyRent}
                onChange={(e) =>
                  setNewSlab({ ...newSlab, dailyRent: e.target.value })
                }
                error={errors.dailyRent}
              />
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleAddSlab}
              iconName="Plus"
              iconPosition="left"
              iconSize={14}
              className="mt-4"
            >
              Add Slab
            </Button>
          </div>

          {/* Tawaaq Trip Slabs */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Tawaaq Trip Slabs
            </h3>
            {tripSlabs.tawaaq.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg">
                No trip slabs configured. Add one above.
              </p>
            ) : (
              <div className="space-y-2">
                {tripSlabs.tawaaq.map((slab) => (
                  <div
                    key={slab.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-foreground">
                        {slab.minTrips} - {slab.maxTrips} trips
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Daily Rent: {slab.dailyRent} SAR
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      iconName="Trash2"
                      iconSize={14}
                      className="text-error"
                      onClick={() => handleDeleteSlab("tawaaq", slab.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Company Trip Slabs */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3">
              Company Trip Slabs
            </h3>
            {tripSlabs.company.length === 0 ? (
              <p className="text-sm text-muted-foreground p-4 bg-muted/20 rounded-lg">
                No trip slabs configured. Add one above.
              </p>
            ) : (
              <div className="space-y-2">
                {tripSlabs.company.map((slab) => (
                  <div
                    key={slab.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-foreground">
                        {slab.minTrips} - {slab.maxTrips} trips
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Daily Rent: {slab.dailyRent} SAR
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      iconName="Trash2"
                      iconSize={14}
                      className="text-error"
                      onClick={() => handleDeleteSlab("company", slab.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6 flex items-center justify-end">
          <Button variant="default" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

// Export function to get daily rent for trips
export const getDailyRentForTrips = (trips, type = "tawaaq") => {
  try {
    const stored = localStorage.getItem(TRIP_SLAB_STORAGE_KEY);
    if (!stored) return 0;
    const slabs = JSON.parse(stored);
    const tripSlabs = slabs[type] || [];
    const tripCount = Number(trips) || 0;

    for (const slab of tripSlabs) {
      if (tripCount >= slab.minTrips && tripCount <= slab.maxTrips) {
        return slab.dailyRent;
      }
    }
    return 0;
  } catch (err) {
    console.error("Error getting daily rent:", err);
    return 0;
  }
};

export default SettingsModal;

