import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import { useAuth } from "../../contexts/AuthContext";
import { parseCSVBills } from "../../utils/csvParser";
import {
  matchVehicleAndDriver,
  bulkCreateDraftBills,
  getDraftBills,
  updateBill,
  finalizeBill,
  getAllVehicles,
  exportBillToPDF,
} from "../../lib/tvpManagementAPI";
import { supabase } from "../../lib/supabase";
import CSVUploadSection from "./components/CSVUploadSection";
import ProcessingStatus from "./components/ProcessingStatus";
import BillsTable from "./components/BillsTable";
import BillEditModal from "./components/BillEditModal";
import UnmatchedVehiclesPanel from "./components/UnmatchedVehiclesPanel";
import ManualMatchModal from "./components/ManualMatchModal";

const BulkBillGenerator = () => {
  const navigate = useNavigate();
  const { currentUser, isAuthenticated, hasPermission } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(null);
  
  // Draft bills state
  const [draftBills, setDraftBills] = useState([]);
  const [selectedBills, setSelectedBills] = useState([]);
  const [editingBill, setEditingBill] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Unmatched vehicles
  const [unmatchedVehicles, setUnmatchedVehicles] = useState([]);
  const [showUnmatchedPanel, setShowUnmatchedPanel] = useState(false);
  const [manualMatchingVehicle, setManualMatchingVehicle] = useState(null);
  const [showManualMatchModal, setShowManualMatchModal] = useState(false);
  
  // Vehicles list for reference
  const [vehicles, setVehicles] = useState([]);

  // Load draft bills and vehicles on mount
  useEffect(() => {
    if (isAuthenticated) {
      loadDraftBills();
      loadVehicles();
    }
  }, [isAuthenticated]);

  const loadDraftBills = async () => {
    try {
      setLoading(true);
      // Load both draft and generated bills
      const { data, error } = await supabase
        .from("tvp_driver_bills")
        .select("*")
        .in("status", ["draft", "generated"])
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setDraftBills(data || []);
    } catch (error) {
      console.error("Error loading draft bills:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      const vehiclesData = await getAllVehicles();
      setVehicles(vehiclesData);
    } catch (error) {
      console.error("Error loading vehicles:", error);
    }
  };

  const handleCSVUpload = async (file, weekRange) => {
    try {
      setLoading(true);
      setProcessingStatus({ stage: "parsing", message: "Extracting data from CSV..." });

      // Parse CSV and extract bill data
      console.log("Starting CSV parsing for file:", file.name);
      const extractedBills = await parseCSVBills(file);
      console.log("Extracted bills:", extractedBills);
      
      if (!extractedBills || extractedBills.length === 0) {
        setProcessingStatus({
          stage: "error",
          message: "No bill data could be extracted from the CSV. Please check the CSV format.",
        });
        setLoading(false);
        return;
      }
      
      setProcessingStatus({ 
        stage: "matching", 
        message: `Found ${extractedBills.length} bills. Matching vehicles...`,
        extractedCount: extractedBills.length,
      });

      // Match each extracted bill to vehicles and drivers
      const matchedBills = [];
      const unmatchedBills = [];

      for (const billData of extractedBills) {
        try {
          console.log(`Attempting to match vehicle: ${billData.vehicleNumber}`);
          const matchResult = await matchVehicleAndDriver(billData.vehicleNumber);
          console.log(`Match result for ${billData.vehicleNumber}:`, matchResult);
          
          if (matchResult.matched && matchResult.driver) {
            // Calculate double driver charge if category is double_driver
            let doubleDriverCharge = billData.doubleDriverCharge || 0;
            if (matchResult.driver.category === "double_driver") {
              const vehicleCount = matchResult.driver.vehicleCount || 1;
              doubleDriverCharge = 350 / vehicleCount; // 350 divided by number of vehicles
            }

            // Calculate TDS if not provided (1% of total earnings)
            let tds = billData.tds || 0;
            if (tds === 0 && billData.totalEarnings > 0) {
              tds = billData.totalEarnings * 0.01;
            }

            // Create draft bill data
            const draftBillData = {
              driverId: matchResult.driver.id,
              tvpId: matchResult.driver.tvpId || matchResult.tvpOwner?.id || "",
              driverName: matchResult.driver.name || matchResult.tvpOwner?.name || "",
              vehicleNumber: billData.vehicleNumber,
              rentalDays: billData.rentalDays || 0,
              trips: billData.trips || 0,
              dailyRent: billData.dailyRent || 0,
              weeklyInsurance: billData.weeklyInsurance || 210,
              doubleDriverCharge: doubleDriverCharge,
              netWeeklyRent: billData.netWeeklyRent || 0,
              totalEarnings: billData.totalEarnings || 0,
              totalCashCollect: billData.totalCashCollect || 0,
              difference: billData.difference || 0,
              platformFee: billData.platformFee || 0,
              toll: billData.toll || 0,
              tds: tds,
              vehicleAdjustment: billData.vehicleAdjustment || 0,
              rtoFine: billData.rtoFine || 0,
              accident: billData.accident || 0,
              deadKm: billData.deadKm || 0,
              currentOS: billData.currentOS || 0,
              weekStart: weekRange?.weekStart || null,
              weekEnd: weekRange?.weekEnd || null,
            };

            matchedBills.push(draftBillData);
          } else {
            const errorMsg = matchResult.driver 
              ? "Vehicle found but driver information incomplete" 
              : `Vehicle "${billData.vehicleNumber}" not found in database. Please ensure the vehicle exists in the cars table or in a driver's vehicle_numbers list.`;
            console.warn(`Failed to match vehicle ${billData.vehicleNumber}:`, errorMsg);
            unmatchedBills.push({
              ...billData,
              matchError: errorMsg,
            });
          }
        } catch (error) {
          console.error("Error matching vehicle:", error);
          unmatchedBills.push({
            ...billData,
            matchError: error.message || "Error matching vehicle",
          });
        }
      }

      // Bulk create draft bills
      if (matchedBills.length > 0) {
        setProcessingStatus({ 
          stage: "creating", 
          message: `Creating ${matchedBills.length} draft bills...`,
        });

        await bulkCreateDraftBills(matchedBills);
      }

      setProcessingStatus({ 
        stage: "completed", 
        message: `Successfully created ${matchedBills.length} draft bills. ${unmatchedBills.length} vehicles could not be matched.`,
        matchedCount: matchedBills.length,
        unmatchedCount: unmatchedBills.length,
      });

      // Set unmatched vehicles
      if (unmatchedBills.length > 0) {
        setUnmatchedVehicles(unmatchedBills);
        setShowUnmatchedPanel(true);
      }

      // Reload draft bills
      await loadDraftBills();

      // Clear processing status after a delay
      setTimeout(() => {
        setProcessingStatus(null);
      }, 5000);
    } catch (error) {
      console.error("Error processing CSV:", error);
      setProcessingStatus({ 
        stage: "error", 
        message: error.message || "Failed to process CSV. Please check the browser console for details.",
      });
      // Keep error status visible longer
      setTimeout(() => {
        setProcessingStatus(null);
      }, 10000);
    } finally {
      setLoading(false);
    }
  };

  const handleBillEdit = (bill) => {
    setEditingBill(bill);
    setShowEditModal(true);
  };

  const handleBillUpdate = async (billData) => {
    try {
      setLoading(true);
      await updateBill(editingBill.id, billData);
      await loadDraftBills();
      setShowEditModal(false);
      setEditingBill(null);
    } catch (error) {
      console.error("Error updating bill:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBillFinalize = async (billId) => {
    try {
      setLoading(true);
      await finalizeBill(billId);
      await loadDraftBills();
    } catch (error) {
      console.error("Error finalizing bill:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBulkFinalize = async () => {
    try {
      setLoading(true);
      for (const billId of selectedBills) {
        await finalizeBill(billId);
      }
      setSelectedBills([]);
      await loadDraftBills();
    } catch (error) {
      console.error("Error bulk finalizing bills:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBillDelete = async (billId) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from("tvp_driver_bills")
        .delete()
        .eq("id", billId);
      
      if (error) throw error;
      await loadDraftBills();
    } catch (error) {
      console.error("Error deleting bill:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleBillExport = async (bill) => {
    try {
      setLoading(true);
      const filename = exportBillToPDF(bill);
      console.log("Bill exported with filename:", filename);
    } catch (error) {
      console.error("Error exporting bill:", error);
      alert("Error exporting bill: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMenuOpen={mobileMenuOpen}
      />

      <div className="flex h-screen pt-16">
        <div className="hidden lg:block">
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "lg:ml-16" : "lg:ml-60"}`}>
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                Bulk Bill Generator
              </h1>
              <p className="text-muted-foreground">
                Upload a CSV file to automatically extract bill data and generate invoices
              </p>
            </div>

            {/* Processing Status */}
            {processingStatus && (
              <ProcessingStatus status={processingStatus} />
            )}

            {/* CSV Upload Section */}
            <div className="mb-6">
              <CSVUploadSection onFileUpload={handleCSVUpload} loading={loading} />
            </div>

            {/* Draft Bills Table */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Draft Bills ({draftBills.length})
                </h2>
                {selectedBills.length > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedBills([])}
                      size="sm"
                    >
                      Clear Selection
                    </Button>
                    <Button
                      onClick={handleBulkFinalize}
                      size="sm"
                      disabled={loading}
                    >
                      Finalize Selected ({selectedBills.length})
                    </Button>
                  </div>
                )}
              </div>
              <BillsTable
                bills={draftBills}
                selectedBills={selectedBills}
                onSelectBills={setSelectedBills}
                onEdit={handleBillEdit}
                onFinalize={handleBillFinalize}
                onDelete={handleBillDelete}
                onExport={handleBillExport}
                loading={loading}
              />
            </div>

            {/* Unmatched Vehicles Panel */}
            {showUnmatchedPanel && unmatchedVehicles.length > 0 && (
              <UnmatchedVehiclesPanel
                unmatchedVehicles={unmatchedVehicles}
                vehicles={vehicles}
                onClose={() => setShowUnmatchedPanel(false)}
                onMatch={(vehicleNumber, vehicle) => {
                  setManualMatchingVehicle(vehicle);
                  setShowManualMatchModal(true);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
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

      {/* Bill Edit Modal */}
      {showEditModal && editingBill && (
        <BillEditModal
          bill={editingBill}
          vehicles={vehicles}
          onClose={() => {
            setShowEditModal(false);
            setEditingBill(null);
          }}
          onSave={handleBillUpdate}
          loading={loading}
        />
      )}

      {/* Manual Match Modal */}
      {showManualMatchModal && manualMatchingVehicle && (
        <ManualMatchModal
          unmatchedVehicle={manualMatchingVehicle}
          availableVehicles={vehicles}
          onClose={() => {
            setShowManualMatchModal(false);
            setManualMatchingVehicle(null);
          }}
          onSuccess={async () => {
            // Reload draft bills and update unmatched vehicles list
            await loadDraftBills();
            // Remove the matched vehicle from unmatched list
            setUnmatchedVehicles(prev => 
              prev.filter(v => v.vehicleNumber !== manualMatchingVehicle.vehicleNumber)
            );
            // Close modal if no more unmatched vehicles
            if (unmatchedVehicles.length <= 1) {
              setShowUnmatchedPanel(false);
            }
          }}
          loading={loading}
        />
      )}
    </div>
  );
};

export default BulkBillGenerator;

