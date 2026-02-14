import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Input from "../../components/ui/Input";
import { formatCurrency } from "../../utils/formatters";
import {
  getVehiclePerformanceSheet,
  upsertVehiclePerformance,
} from "../../lib/vehiclePerformanceAPI";

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const calculateWeekFromDate = (dateStr) => {
  const parts = String(dateStr).split("-");
  const d = new Date(
    parseInt(parts[0], 10),
    parseInt(parts[1], 10) - 1,
    parseInt(parts[2], 10)
  );
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: formatDateLocal(monday),
    weekEnd: formatDateLocal(sunday),
  };
};

const getCurrentWeek = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return calculateWeekFromDate(formatDateLocal(today));
};

const VehiclePerformanceSheet = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [week, setWeek] = useState(() => getCurrentWeek());
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAdjustment, setEditingAdjustment] = useState(null);
  const [adjustmentValue, setAdjustmentValue] = useState("");
  const [savingFleetTrips, setSavingFleetTrips] = useState(null);

  const loadSheet = useCallback(async () => {
    if (!week?.weekStart || !week?.weekEnd) return;
    setLoading(true);
    setError(null);
    try {
      const { rows: data } = await getVehiclePerformanceSheet(
        week.weekStart,
        week.weekEnd
      );
      setRows(data || []);
    } catch (err) {
      console.error("Error loading vehicle performance sheet:", err);
      setError(err?.message || "Failed to load sheet");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [week?.weekStart, week?.weekEnd]);

  useEffect(() => {
    loadSheet();
  }, [loadSheet]);

  const parseDate = (dateStr) => {
    const parts = String(dateStr).split("-");
    return new Date(
      parseInt(parts[0], 10),
      parseInt(parts[1], 10) - 1,
      parseInt(parts[2], 10)
    );
  };

  const handlePreviousWeek = () => {
    const monday = parseDate(week.weekStart);
    monday.setDate(monday.getDate() - 7);
    setWeek(calculateWeekFromDate(formatDateLocal(monday)));
  };

  const handleNextWeek = () => {
    const monday = parseDate(week.weekStart);
    monday.setDate(monday.getDate() + 7);
    setWeek(calculateWeekFromDate(formatDateLocal(monday)));
  };

  const handleCurrentWeek = () => {
    setWeek(getCurrentWeek());
  };

  const handleSaveAdjustment = async () => {
    if (editingAdjustment == null) return;
    const row = rows.find((r) => r.id === editingAdjustment);
    if (!row) return;
    try {
      await upsertVehiclePerformance(
        row.vehicleNumber,
        week.weekStart,
        week.weekEnd,
        {
          vehicleLevelAdjustment: parseFloat(adjustmentValue) || 0,
          fleetTrips: row.fleetTrips,
        }
      );
      setEditingAdjustment(null);
      setAdjustmentValue("");
      await loadSheet();
    } catch (err) {
      console.error("Error saving adjustment:", err);
      alert("Failed to save: " + (err?.message || "Unknown error"));
    }
  };

  const handleSaveFleetTrips = async (row) => {
    const input = document.getElementById(`fleet-trips-${row.id}`);
    const value = input ? parseInt(input.value, 10) : null;
    if (value == null || isNaN(value)) return;
    setSavingFleetTrips(row.id);
    try {
      await upsertVehiclePerformance(
        row.vehicleNumber,
        week.weekStart,
        week.weekEnd,
        {
          vehicleLevelAdjustment: row.vehicleLevelAdjustment,
          fleetTrips: value,
        }
      );
      await loadSheet();
    } catch (err) {
      console.error("Error saving fleet trips:", err);
      alert("Failed to save: " + (err?.message || "Unknown error"));
    } finally {
      setSavingFleetTrips(null);
    }
  };

  const formatDisplayDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const totals = rows.reduce(
    (acc, r) => ({
      trips: acc.trips + (r.trips || 0),
      rentalIncome: acc.rentalIncome + (r.rentalIncome || 0),
      doubleDriver: acc.doubleDriver + (r.doubleDriverCharge || 0),
      insurance: acc.insurance + (r.insuranceIncome || 0),
      tds: acc.tds + (r.tdsIncome || 0),
      deadKm: acc.deadKm + (r.deadKmIncome || 0),
      accident: acc.accident + (r.accidentPenaltyIncome || 0),
      vehicleAdj: acc.vehicleAdj + (r.vehicleLevelAdjustment || 0),
      fleetRent: acc.fleetRent + (r.fleetRent || 0),
      grossProfit: acc.grossProfit + (r.grossProfit || 0),
    }),
    {
      trips: 0,
      rentalIncome: 0,
      doubleDriver: 0,
      insurance: 0,
      tds: 0,
      deadKm: 0,
      accident: 0,
      vehicleAdj: 0,
      fleetRent: 0,
      grossProfit: 0,
    }
  );

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Vehicle Performance Sheet"
        subtitle="Per-vehicle weekly performance and financial summary"
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
        <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
          <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              iconName="ArrowLeft"
              iconPosition="left"
              iconSize={16}
            >
              Back to Dashboard
            </Button>

            {/* Week Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousWeek}
                iconName="ChevronLeft"
              />
              <div className="px-4 py-2 bg-muted/30 rounded-lg border border-border min-w-[220px] text-center">
                <p className="text-sm font-medium text-foreground">
                  {week.weekStart && week.weekEnd
                    ? `${formatDisplayDate(week.weekStart)} - ${formatDisplayDate(week.weekEnd)}`
                    : "Select week"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {week.weekStart} to {week.weekEnd}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                iconName="ChevronRight"
              />
              <Button
                variant="default"
                size="sm"
                onClick={handleCurrentWeek}
                iconName="Calendar"
                iconPosition="left"
              >
                Current Week
              </Button>
              <div>
                <label className="text-xs text-muted-foreground mr-2">
                  Jump to week:
                </label>
                <input
                  type="date"
                  value={week.weekStart}
                  onChange={(e) =>
                    setWeek(calculateWeekFromDate(e.target.value))
                  }
                  className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-error/10 border border-error/30 rounded-lg text-error">
              {error}
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <span className="text-xs text-muted-foreground">Vehicles</span>
              <p className="text-xl font-bold text-foreground">{rows.length}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <span className="text-xs text-muted-foreground">Total Trips</span>
              <p className="text-xl font-bold text-foreground">{totals.trips}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <span className="text-xs text-muted-foreground">Total Rental Income</span>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(totals.rentalIncome)}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <span className="text-xs text-muted-foreground">Total Fleet Rent</span>
              <p className="text-xl font-bold text-foreground">
                {formatCurrency(totals.fleetRent)}
              </p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <span className="text-xs text-muted-foreground">Total Gross Profit</span>
              <p className="text-xl font-bold text-success">
                {formatCurrency(totals.grossProfit)}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden min-h-[400px]">
            {loading ? (
              <div className="py-16 text-center min-h-[400px] flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Loading vehicle performance data...
                </p>
              </div>
            ) : (
              <div className="overflow-auto max-h-[calc(100vh-320px)] min-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-3 text-left font-medium text-foreground">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left font-medium text-foreground">
                        Vehicle Number
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        Trips
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        Rental Income
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        Double Driver
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        Insurance
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        TDS
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        Dead KM
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        Accident Penalty
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        Vehicle Adj
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        Fleet Trips
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        Working Days
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        Fleet Rent
                      </th>
                      <th className="px-4 py-3 text-right font-medium text-foreground">
                        Gross Profit
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={14}
                          className="px-4 py-12 text-center text-muted-foreground"
                        >
                          No bills found for this week. Generate bills first.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={`${row.vehicleNumber}-${row.id}`}
                          className="border-b border-border/50 hover:bg-muted/20"
                        >
                          <td className="px-4 py-3">{row.id}</td>
                          <td className="px-4 py-3 font-medium">
                            {row.vehicleNumber}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.trips}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(row.rentalIncome)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(row.doubleDriverCharge)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(row.insuranceIncome)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(row.tdsIncome)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(row.deadKmIncome)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(row.accidentPenaltyIncome)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {editingAdjustment === row.id ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  value={adjustmentValue}
                                  onChange={(e) =>
                                    setAdjustmentValue(e.target.value)
                                  }
                                  className="w-20 text-right"
                                  autoFocus
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  iconName="Check"
                                  onClick={handleSaveAdjustment}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  iconName="X"
                                  onClick={() => {
                                    setEditingAdjustment(null);
                                    setAdjustmentValue("");
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 justify-end">
                                <span>{formatCurrency(row.vehicleLevelAdjustment)}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  iconName="Pencil"
                                  iconSize={12}
                                  onClick={() => {
                                    setEditingAdjustment(row.id);
                                    setAdjustmentValue(
                                      String(row.vehicleLevelAdjustment ?? 0)
                                    );
                                  }}
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 justify-end">
                              <input
                                id={`fleet-trips-${row.id}`}
                                type="number"
                                min="0"
                                defaultValue={row.fleetTrips ?? ""}
                                placeholder="—"
                                className="w-16 px-2 py-1 text-right border border-border rounded bg-background text-foreground text-sm"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                iconName="Check"
                                iconSize={12}
                                loading={savingFleetTrips === row.id}
                                disabled={savingFleetTrips === row.id}
                                onClick={() => handleSaveFleetTrips(row)}
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {row.workingDays}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {formatCurrency(row.fleetRent)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold">
                            <span
                              className={
                                (row.grossProfit ?? 0) >= 0
                                  ? "text-success"
                                  : "text-error"
                              }
                            >
                              {formatCurrency(row.grossProfit)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default VehiclePerformanceSheet;
