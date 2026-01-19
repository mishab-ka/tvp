import React, { useEffect, useRef, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { formatCurrency } from "../../../utils/formatters";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { 
  updateTVPOwner, 
  getDriverBills,
  getDriverPayments,
  createDriverPayment,
  deleteDriverPayment,
  deleteDriverBill,
  getTotalOutstandingBalance,
  getTVPOwnerDetails
} from "../../../lib/tvpManagementAPI";
import { supabase } from "../../../lib/supabase";

const OwnerDetailPanel = ({ owner, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(owner || {});
  const [documentAction, setDocumentAction] = useState(null);
  const [documentError, setDocumentError] = useState(null);
  const [documentMessage, setDocumentMessage] = useState(null);
  const fileInputRefs = useRef({});

  if (!owner) {
    return (
      <div className="h-full bg-surface border-l border-border flex items-center justify-center">
        <div className="text-center">
          <Icon
            name="Users"
            size={48}
            className="text-muted-foreground mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Owner Selected
          </h3>
          <p className="text-sm text-muted-foreground">
            Select an owner from the list to view details
          </p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    setEditData({
      ...owner,
      cumulativeRentalDays: owner?.cumulativeRentalDays ?? 0,
      roomDeposit: owner?.roomDeposit ?? 0,
      prePaidRentAmount: owner?.prePaidRentAmount ?? 0,
      documentsCharge: owner?.documentsCharge ?? 0,
      alternativePhone1: owner?.alternativePhone1 ?? "",
      alternativePhone2: owner?.alternativePhone2 ?? "",
      alternativePhone3: owner?.alternativePhone3 ?? "",
    });
  }, [owner]);

  const tabs = [
    { id: "profile", label: "Profile", icon: "User" },
    { id: "vehicles", label: "Vehicles", icon: "Car" },
    { id: "financial", label: "Financial", icon: "DollarSign" },
    { id: "bills", label: "Bills", icon: "Receipt" },
    { id: "payments", label: "Payments", icon: "CreditCard" },
    { id: "documents", label: "Documents", icon: "FileText" },
    { id: "activity", label: "Activity", icon: "Activity" },
  ];

  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [payments, setPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentType: "paid",
    paymentAmount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "",
    referenceNumber: "",
    notes: "",
    screenshot: null,
  });
  const paymentScreenshotRef = useRef(null);

  useEffect(() => {
    if (owner?.id && activeTab === "bills") {
      loadBills();
    }
  }, [owner?.id, activeTab]);

  useEffect(() => {
    if (owner?.id && activeTab === "payments") {
      loadPayments();
    }
  }, [owner?.id, activeTab]);

  useEffect(() => {
    if (owner?.id && activeTab === "financial") {
      loadPayments();
    }
  }, [owner?.id, activeTab]);

  const loadBills = async () => {
    if (!owner?.id) return;
    try {
      setBillsLoading(true);
      const billsData = await getDriverBills(owner.id);
      setBills(billsData || []);
    } catch (err) {
      console.error("Error loading bills:", err);
    } finally {
      setBillsLoading(false);
    }
  };

  const handleDownloadBill = (bill) => {
    if (!bill?.invoice_html) {
      alert("Invoice HTML not available for this bill.");
      return;
    }
    const blob = new Blob([bill.invoice_html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Invoice_${bill.bill_number}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDeleteBill = async (billId) => {
    if (!owner?.id) return;
    const confirmed = window.confirm(
      "Are you sure you want to delete this bill? This will also update the outstanding balance and cumulative rental days."
    );
    if (!confirmed) return;
    try {
      await deleteDriverBill(billId, owner.id);
      // Reload bills and owner data
      await loadBills();
      const updatedOwner = await getTVPOwnerDetails(owner.id);
      onUpdate(updatedOwner);
    } catch (err) {
      console.error("Error deleting bill:", err);
      alert(err.message || "Failed to delete bill");
    }
  };

  const handleSave = async () => {
    if (!owner?.id) return;
    try {
      const payload = buildOwnerUpdatePayload();
      const updatedOwner = await updateTVPOwner(owner.id, payload);
      setEditData(updatedOwner);
      onUpdate(updatedOwner);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating owner:", err);
      alert(err.message || "Failed to update owner");
    }
  };

  const handleCancel = () => {
    setEditData(owner);
    setIsEditing(false);
  };

  const getStatusColor = (status) => {
    const colors = {
      active: "text-success",
      inactive: "text-muted-foreground",
      pending: "text-warning",
      suspended: "text-error",
      under_review: "text-secondary",
    };
    return colors?.[status] || colors?.inactive;
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Owner Avatar and Basic Info */}
      <div className="text-center pb-6 border-b border-border">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="User" size={32} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">{owner?.name}</h2>
        <p className="text-sm text-muted-foreground">{owner?.tvpId}</p>
        <div className="flex items-center justify-center gap-3 mt-2">
          <div
            className={`inline-flex items-center ${getStatusColor(
              owner?.status
            )}`}
          >
            <Icon name="Circle" size={8} className="mr-2 fill-current" />
            <span className="text-sm font-medium capitalize">
              {owner?.status?.replace("_", " ")}
            </span>
          </div>
          <div className="inline-flex items-center text-secondary">
            <Icon name="User" size={8} className="mr-2" />
            <span className="text-sm font-medium capitalize">
              {owner?.category === "double_driver" ? "Double Driver" : "Single Driver"}
            </span>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Contact Information
        </h3>
        <div className="space-y-3">
          {isEditing ? (
            <>
              <Input
                label="Phone Number"
                type="tel"
                value={editData?.phone || ""}
                onChange={(e) =>
                  setEditData({ ...editData, phone: e?.target?.value })
                }
              />
              <Input
                label="Alternative Phone 1"
                type="tel"
                value={editData?.alternativePhone1 || ""}
                onChange={(e) =>
                  setEditData({ ...editData, alternativePhone1: e?.target?.value })
                }
              />
              <Input
                label="Alternative Phone 2"
                type="tel"
                value={editData?.alternativePhone2 || ""}
                onChange={(e) =>
                  setEditData({ ...editData, alternativePhone2: e?.target?.value })
                }
              />
              <Input
                label="Alternative Phone 3"
                type="tel"
                value={editData?.alternativePhone3 || ""}
                onChange={(e) =>
                  setEditData({ ...editData, alternativePhone3: e?.target?.value })
                }
              />
              <Input
                label="Email Address"
                type="email"
                value={editData?.email || ""}
                onChange={(e) =>
                  setEditData({ ...editData, email: e?.target?.value })
                }
              />
              <Input
                label="Address"
                value={editData?.address || ""}
                onChange={(e) =>
                  setEditData({ ...editData, address: e?.target?.value })
                }
              />
            </>
          ) : (
            <>
              <div className="flex items-center space-x-3">
                <Icon
                  name="Phone"
                  size={16}
                  className="text-muted-foreground"
                />
                <span className="text-sm text-foreground">{owner?.phone || "Not provided"}</span>
              </div>
              {owner?.alternativePhone1 && (
                <div className="flex items-center space-x-3">
                  <Icon
                    name="Phone"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm text-foreground">
                    Alt. 1: {owner.alternativePhone1}
                  </span>
                </div>
              )}
              {owner?.alternativePhone2 && (
                <div className="flex items-center space-x-3">
                  <Icon
                    name="Phone"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm text-foreground">
                    Alt. 2: {owner.alternativePhone2}
                  </span>
                </div>
              )}
              {owner?.alternativePhone3 && (
                <div className="flex items-center space-x-3">
                  <Icon
                    name="Phone"
                    size={16}
                    className="text-muted-foreground"
                  />
                  <span className="text-sm text-foreground">
                    Alt. 3: {owner.alternativePhone3}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Icon name="Mail" size={16} className="text-muted-foreground" />
                <span className="text-sm text-foreground">{owner?.email || "Not provided"}</span>
              </div>
              <div className="flex items-start space-x-3">
                <Icon
                  name="MapPin"
                  size={16}
                  className="text-muted-foreground mt-0.5"
                />
                <span className="text-sm text-foreground">
                  {owner?.address || "Not provided"}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Vehicle Numbers */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Vehicle Numbers
        </h3>
        <div className="flex flex-wrap gap-2">
          {resolveVehicleNumbers().length > 0 ? (
            resolveVehicleNumbers().map((vehicle, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary/20"
              >
                <Icon name="Car" size={14} className="mr-2" />
                {vehicle}
              </span>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">No vehicles assigned</span>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Metrics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Vehicles</span>
              <Icon name="Car" size={14} className="text-primary" />
            </div>
            <div className="text-lg font-semibold text-foreground mt-1">
              {owner?.vehicleCount}
            </div>
          </div>
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Rental Days</span>
              <Icon name="Calendar" size={14} className="text-secondary" />
            </div>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                value={editData.cumulativeRentalDays ?? owner?.cumulativeRentalDays ?? 0}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    cumulativeRentalDays: parseInt(e.target.value) || 0,
                  })
                }
                className="mt-1"
              />
            ) : (
              <div className="text-lg font-semibold text-foreground mt-1">
                {owner?.cumulativeRentalDays ?? 0}
              </div>
            )}
          </div>
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Category</span>
              <Icon name="User" size={14} className="text-primary" />
            </div>
            <div className="text-lg font-semibold text-foreground mt-1 capitalize">
              {owner?.category === "double_driver" ? "Double" : "Single"}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Financial Information */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Additional Financial Information
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Room Deposit</span>
              <Icon name="Home" size={14} className="text-primary" />
            </div>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.roomDeposit ?? owner?.roomDeposit ?? 0}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    roomDeposit: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1"
              />
            ) : (
              <div className="text-lg font-semibold text-foreground mt-1">
                {formatCurrency(owner?.roomDeposit ?? 0)}
              </div>
            )}
          </div>
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Pre-Paid Rent Amount</span>
              <Icon name="Wallet" size={14} className="text-success" />
            </div>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.prePaidRentAmount ?? owner?.prePaidRentAmount ?? 0}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    prePaidRentAmount: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1"
              />
            ) : (
              <div className="text-lg font-semibold text-foreground mt-1">
                {formatCurrency(owner?.prePaidRentAmount ?? 0)}
              </div>
            )}
          </div>
          <div className="bg-muted/30 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Documents Charge</span>
              <Icon name="FileText" size={14} className="text-secondary" />
            </div>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editData.documentsCharge ?? owner?.documentsCharge ?? 0}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    documentsCharge: parseFloat(e.target.value) || 0,
                  })
                }
                className="mt-1"
              />
            ) : (
              <div className="text-lg font-semibold text-foreground mt-1">
                {formatCurrency(owner?.documentsCharge ?? 0)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="Key"
            iconPosition="left"
            iconSize={14}
            fullWidth
          >
            Reset Password
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="Car"
            iconPosition="left"
            iconSize={14}
            fullWidth
          >
            Assign Vehicle
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="FileText"
            iconPosition="left"
            iconSize={14}
            fullWidth
          >
            Request Docs
          </Button>
          <Button
            variant="outline"
            size="sm"
            iconName="AlertTriangle"
            iconPosition="left"
            iconSize={14}
            fullWidth
          >
            Apply Penalty
          </Button>
        </div>
      </div>
    </div>
  );

  const renderVehiclesTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">
          Assigned Vehicles
        </h3>
        <Button
          variant="outline"
          size="sm"
          iconName="Plus"
          iconPosition="left"
          iconSize={14}
        >
          Assign Vehicle
        </Button>
      </div>
      <div className="space-y-3">
        {owner?.vehicles?.length > 0 ? (
          owner?.vehicles?.map((vehicle, index) => {
            const plateNumber =
              vehicle?.plateNumber ||
              vehicle?.car_number ||
              vehicle?.carNumber ||
              `Vehicle #${index + 1}`;
            const vehicleMeta = vehicle?.model
              ? `${vehicle?.model}${
                  vehicle?.year ? ` • ${vehicle?.year}` : ""
                }`
              : vehicle?.fleetName ||
                vehicle?.fleet_name ||
                "Fleet not specified";
            return (
              <div
                key={vehicle?.id || plateNumber}
                className="p-3 border border-border rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">
                      {plateNumber}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {vehicleMeta}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        vehicle?.status === "active"
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {vehicle?.status || "unknown"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      iconName="MoreVertical"
                      iconSize={14}
                      className="h-6 w-6"
                    />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <Icon
              name="Car"
              size={32}
              className="text-muted-foreground mx-auto mb-2"
            />
            <p className="text-sm text-muted-foreground">
              No vehicles assigned
            </p>
          </div>
        )}
      </div>
    </div>
  );

  const loadPayments = async () => {
    if (!owner?.id) return;
    try {
      setPaymentsLoading(true);
      const paymentsData = await getDriverPayments(owner.id);
      setPayments(paymentsData || []);
    } catch (err) {
      console.error("Error loading payments:", err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    if (!owner?.id) return;
    try {
      await createDriverPayment({
        driverId: owner.id,
        paymentType: paymentForm.paymentType || "paid",
        paymentAmount: paymentForm.paymentAmount,
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        referenceNumber: paymentForm.referenceNumber,
        notes: paymentForm.notes,
        screenshot: paymentForm.screenshot,
      });
      
      // Reload payments and owner data
      await loadPayments();
      // Trigger parent to reload owner data
      const updatedOwner = await getTVPOwnerDetails(owner.id);
      onUpdate(updatedOwner);
      
      // Reset form
      setPaymentForm({
        paymentType: "paid",
        paymentAmount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "",
        referenceNumber: "",
        notes: "",
        screenshot: null,
      });
      if (paymentScreenshotRef.current) {
        paymentScreenshotRef.current.value = "";
      }
      setShowPaymentForm(false);
    } catch (err) {
      console.error("Error adding payment:", err);
      alert(err.message || "Failed to add payment");
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!owner?.id) return;
    const confirmed = window.confirm("Delete this payment?");
    if (!confirmed) return;
    try {
      await deleteDriverPayment(paymentId, owner.id);
      await loadPayments();
      // Trigger parent to reload owner data
      const updatedOwner = await getTVPOwnerDetails(owner.id);
      onUpdate(updatedOwner);
    } catch (err) {
      console.error("Error deleting payment:", err);
      alert(err.message || "Failed to delete payment");
    }
  };


  const renderFinancialTab = () => (
    <div className="space-y-6">
      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Total Deposit</span>
            <Icon name="DollarSign" size={16} className="text-success" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(owner?.depositAmount)}
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Outstanding Balance
            </span>
            <Icon name="AlertCircle" size={16} className="text-error" />
          </div>
          <div className="text-2xl font-bold text-error">
            {formatCurrency(owner?.outstandingBalance)}
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Cumulative Rental Days
            </span>
            <Icon name="Calendar" size={16} className="text-primary" />
          </div>
          {isEditing ? (
            <Input
              type="number"
              min="0"
              value={editData.cumulativeRentalDays ?? owner?.cumulativeRentalDays ?? 0}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  cumulativeRentalDays: parseInt(e.target.value) || 0,
                })
              }
            />
          ) : (
            <div className="text-2xl font-bold text-foreground">
              {owner?.cumulativeRentalDays ?? 0} days
            </div>
          )}
        </div>
      </div>

      {/* Payment Management Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-foreground">Payments</h3>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Plus"
              iconPosition="left"
              iconSize={14}
              onClick={() => setShowPaymentForm(true)}
            >
              Add Payment
            </Button>
          </div>
        </div>

        {/* Payment Form */}
        {showPaymentForm && (
          <form onSubmit={handleAddPayment} className="p-4 border border-border rounded-lg bg-muted/20 space-y-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-foreground">Add Payment</h4>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconName="X"
                iconSize={14}
                onClick={() => {
                  setShowPaymentForm(false);
                  setPaymentForm({
                    paymentType: "paid",
                    paymentAmount: "",
                    paymentDate: new Date().toISOString().split("T")[0],
                    paymentMethod: "",
                    referenceNumber: "",
                    notes: "",
                    screenshot: null,
                  });
                  if (paymentScreenshotRef.current) {
                    paymentScreenshotRef.current.value = "";
                  }
                }}
              >
                Cancel
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Payment Category"
                value={paymentForm.paymentType}
                onChange={(value) =>
                  setPaymentForm({ ...paymentForm, paymentType: value })
                }
                options={[
                  { value: "paid", label: "Paid (Reduces Outstanding Balance)" },
                  { value: "due", label: "Due (Increases Outstanding Balance)" },
                ]}
                required
              />
              <Input
                label="Payment Amount (₹)"
                type="number"
                min="0"
                step="0.01"
                value={paymentForm.paymentAmount}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paymentAmount: e.target.value })
                }
                required
              />
              <Input
                label="Payment Date"
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
                }
                required
              />
              <Input
                label="Payment Method"
                placeholder="Cash, UPI, Bank Transfer, etc."
                value={paymentForm.paymentMethod}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })
                }
              />
              <Input
                label="Reference Number"
                placeholder="Transaction ID, Receipt No, etc."
                value={paymentForm.referenceNumber}
                onChange={(e) =>
                  setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })
                }
              />
            </div>
            <Input
              label="Notes"
              placeholder="Additional notes about this payment"
              value={paymentForm.notes}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, notes: e.target.value })
              }
            />
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Payment Screenshot (Optional)
              </label>
              <input
                ref={paymentScreenshotRef}
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setPaymentForm({
                    ...paymentForm,
                    screenshot: e.target.files?.[0] || null,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {paymentForm.screenshot && (
                <p className="text-xs text-muted-foreground mt-1">
                  Selected: {paymentForm.screenshot.name}
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPaymentForm(false);
                  setPaymentForm({
                    paymentType: "paid",
                    paymentAmount: "",
                    paymentDate: new Date().toISOString().split("T")[0],
                    paymentMethod: "",
                    referenceNumber: "",
                    notes: "",
                    screenshot: null,
                  });
                  if (paymentScreenshotRef.current) {
                    paymentScreenshotRef.current.value = "";
                  }
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="default"
                className={paymentForm.paymentType === "due" ? "bg-error hover:bg-error/90" : "bg-success hover:bg-success/90"}
              >
                Add {paymentForm.paymentType === "due" ? "Due" : "Payment"}
              </Button>
            </div>
          </form>
        )}

        {/* Payments List */}
        {paymentsLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-8">
            <Icon
              name="CreditCard"
              size={32}
              className="text-muted-foreground mx-auto mb-2"
            />
            <p className="text-sm text-muted-foreground">No payments recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-start justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className={`text-sm font-semibold ${
                      payment.payment_type === "due" ? "text-error" : "text-success"
                    }`}>
                      {formatCurrency(payment.payment_amount)}
                    </span>
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      payment.payment_type === "due" 
                        ? "bg-error/10 text-error border border-error/30" 
                        : "bg-success/10 text-success border border-success/30"
                    }`}>
                      {payment.payment_type === "due" ? "Due" : "Paid"}
                    </span>
                    {payment.payment_method && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                        {payment.payment_method}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>
                      Date:{" "}
                      {new Date(payment.payment_date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    {payment.reference_number && (
                      <p>Ref: {payment.reference_number}</p>
                    )}
                    {payment.notes && <p>Notes: {payment.notes}</p>}
                    {payment.screenshot_url && (
                      <div className="mt-2">
                        <a
                          href={payment.screenshot_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs text-primary hover:underline"
                        >
                          <Icon name="Image" size={12} className="mr-1" />
                          View Screenshot
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Trash2"
                  iconSize={14}
                  className="text-error"
                  onClick={() => handleDeletePayment(payment.id)}
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const documentEntries = [
    { key: "aadharFrontUrl", formKey: "aadharFront", label: "Aadhaar Front" },
    { key: "aadharBackUrl", formKey: "aadharBack", label: "Aadhaar Back" },
    { key: "licenseFrontUrl", formKey: "licenseFront", label: "License Front" },
    { key: "licenseBackUrl", formKey: "licenseBack", label: "License Back" },
  ];

  const resolveVehicleNumbers = () => {
    if (Array.isArray(owner?.vehicleNumbers) && owner.vehicleNumbers.length > 0) {
      return owner.vehicleNumbers;
    }
    if (Array.isArray(owner?.vehicles)) {
      return owner.vehicles
        .map(
          (vehicle) =>
            vehicle?.plateNumber || vehicle?.car_number || vehicle?.carNumber
        )
        .filter(Boolean);
    }
    return [];
  };

  const buildOwnerUpdatePayload = (overrides = {}) => ({
    name: editData?.name || owner?.name || "",
    email: editData?.email || owner?.email || "",
    phone: editData?.phone || owner?.phone || "",
    address: editData?.address || owner?.address || "",
    category: editData?.category || owner?.category || "single_driver",
    cumulativeRentalDays: editData?.cumulativeRentalDays ?? owner?.cumulativeRentalDays ?? 0,
    status: editData?.status || owner?.status || "active",
    depositAmount:
      Number(
        editData?.depositAmount ?? owner?.depositAmount ?? owner?.deposit_amount
      ) || 0,
    outstandingBalance:
      Number(
        editData?.outstandingBalance ??
          owner?.outstandingBalance ??
          owner?.outstanding_balance
      ) || 0,
    paymentDelayDays:
      Number(
        editData?.paymentDelayDays ??
          owner?.paymentDelayDays ??
          owner?.payment_delay_days
      ) || 0,
    performance: Number(editData?.performance ?? owner?.performance ?? 0),
    roomDeposit: editData?.roomDeposit ?? owner?.roomDeposit ?? 0,
    prePaidRentAmount: editData?.prePaidRentAmount ?? owner?.prePaidRentAmount ?? 0,
    documentsCharge: editData?.documentsCharge ?? owner?.documentsCharge ?? 0,
    alternativePhone1: editData?.alternativePhone1 ?? owner?.alternativePhone1 ?? "",
    alternativePhone2: editData?.alternativePhone2 ?? owner?.alternativePhone2 ?? "",
    alternativePhone3: editData?.alternativePhone3 ?? owner?.alternativePhone3 ?? "",
    uberDriverPhotos: editData?.uberDriverPhotos ?? owner?.uberDriverPhotos ?? [],
    vehicleNumbers: resolveVehicleNumbers(),
    documents: {},
    removeDocuments: [],
    ...overrides,
  });

  const isProcessingDocument = (formKey) =>
    documentAction?.key === formKey && documentAction?.loading;

  const handleDocumentUpload = async (event, entry) => {
    const file = event?.target?.files?.[0];
    event.target.value = "";
    if (!owner?.id || !file) return;
    setDocumentError(null);
    setDocumentMessage(null);
    setDocumentAction({ key: entry.formKey, type: "upload", loading: true });
    try {
      const payload = buildOwnerUpdatePayload({
        documents: { [entry.formKey]: file },
      });
      const updatedOwner = await updateTVPOwner(owner.id, payload);
      setEditData(updatedOwner);
      onUpdate(updatedOwner);
      setDocumentMessage(`${entry.label} uploaded successfully.`);
    } catch (err) {
      console.error("Document upload failed:", err);
      setDocumentError(err.message || "Failed to upload document.");
    } finally {
      setDocumentAction(null);
    }
  };

  const handleDocumentDelete = async (entry) => {
    if (!owner?.id) return;
    const confirmed = window.confirm(
      `Remove ${entry.label} from this owner’s records?`
    );
    if (!confirmed) return;
    setDocumentError(null);
    setDocumentMessage(null);
    setDocumentAction({ key: entry.formKey, type: "delete", loading: true });
    try {
      const payload = buildOwnerUpdatePayload({
        removeDocuments: [entry.formKey],
      });
      const updatedOwner = await updateTVPOwner(owner.id, payload);
      setEditData(updatedOwner);
      onUpdate(updatedOwner);
      setDocumentMessage(`${entry.label} removed successfully.`);
    } catch (err) {
      console.error("Document delete failed:", err);
      setDocumentError(err.message || "Failed to delete document.");
    } finally {
      setDocumentAction(null);
    }
  };

  const renderDocumentsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Documents</h3>
        <p className="text-xs text-muted-foreground">
          Upload PDF or image files up to 10 MB each.
        </p>
      </div>

      {(documentError || documentMessage) && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            documentError
              ? "bg-error/10 text-error border border-error/30"
              : "bg-success/10 text-success border border-success/30"
          }`}
        >
          {documentError || documentMessage}
        </div>
      )}

      <div className="space-y-2">
        {documentEntries.map((doc) => {
          const url = owner?.documents?.[doc.key];
          const isProcessing = isProcessingDocument(doc.formKey);
          return (
            <div
              key={doc.key}
              className="flex flex-col gap-3 rounded-lg border border-border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-start space-x-3">
                <Icon
                  name="FileText"
                  size={16}
                  className="mt-1 text-muted-foreground"
                />
                <div>
                  <div className="text-sm font-medium text-foreground">
                    {doc.label}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {url ? "Uploaded" : "Pending upload"}
                  </div>
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center text-xs text-primary hover:underline"
                    >
                      <Icon name="ExternalLink" size={12} className="mr-1" />
                      View current file
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  ref={(ref) => {
                    if (ref) {
                      fileInputRefs.current[doc.formKey] = ref;
                    }
                  }}
                  onChange={(event) => handleDocumentUpload(event, doc)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Upload"
                  iconPosition="left"
                  iconSize={14}
                  disabled={isProcessing}
                  onClick={() =>
                    fileInputRefs.current[doc.formKey]?.click?.()
                  }
                >
                  {isProcessing
                    ? "Processing..."
                    : url
                    ? "Replace"
                    : "Upload"}
                </Button>
                {url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    iconName="Trash2"
                    iconPosition="left"
                    iconSize={14}
                    className="text-error"
                    disabled={isProcessing}
                    onClick={() => handleDocumentDelete(doc)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Documents and Uber Driver Profile Photos */}
      <div className="space-y-6 mt-6 pt-6 border-t border-border">
        {/* Documents */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Documents</h3>
          <div className="space-y-3">
            {documentEntries.map((doc) => {
              const url = owner?.documents?.[doc.key];
              const isProcessing = isProcessingDocument(doc.formKey);
              if (!url) return null; // Only show uploaded documents
              return (
                <div
                  key={doc.key}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center space-x-3">
                    <Icon
                      name="FileText"
                      size={16}
                      className="text-muted-foreground"
                    />
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {doc.label}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Uploaded
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Eye"
                      iconPosition="left"
                      iconSize={14}
                      onClick={() => window.open(url, '_blank')}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      iconPosition="left"
                      iconSize={14}
                      className="text-error"
                      disabled={isProcessing}
                      onClick={() => handleDocumentDelete(doc)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              );
            })}
            {!documentEntries.some(doc => owner?.documents?.[doc.key]) && (
              <div className="text-center py-6 border border-dashed border-border rounded-lg">
                <Icon name="FileText" size={24} className="text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
              </div>
            )}
          </div>
        </div>

        {/* Uber Driver Profile Photos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">Uber Driver Profile Photos</h3>
            <p className="text-xs text-muted-foreground">
              {owner?.uberDriverPhotos?.length || 0} photo(s)
            </p>
          </div>

          {owner?.uberDriverPhotos && Array.isArray(owner.uberDriverPhotos) && owner.uberDriverPhotos.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {owner.uberDriverPhotos.map((photoUrl, index) => (
                <div key={`uber-photo-${index}`} className="relative group">
                  <img
                    src={photoUrl}
                    alt={`Uber driver profile ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-border"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Eye"
                      iconSize={14}
                      className="text-white hover:bg-white/20 h-8"
                      onClick={() => window.open(photoUrl, '_blank')}
                    >
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      iconName="Trash2"
                      iconSize={14}
                      className="text-white hover:bg-white/20 h-8 text-error hover:text-error"
                      onClick={async () => {
                        if (window.confirm(`Delete Uber driver photo ${index + 1}?`)) {
                          try {
                            const updatedPhotos = owner.uberDriverPhotos.filter((_, i) => i !== index);
                            const payload = buildOwnerUpdatePayload({
                              uberDriverPhotos: updatedPhotos,
                              existingUberPhotos: updatedPhotos,
                            });
                            const updatedOwner = await updateTVPOwner(owner.id, payload);
                            setEditData(updatedOwner);
                            onUpdate(updatedOwner);
                          } catch (err) {
                            console.error("Failed to delete photo:", err);
                            alert("Failed to delete photo: " + (err.message || "Unknown error"));
                          }
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border border-dashed border-border rounded-lg">
              <Icon name="Image" size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No Uber driver photos uploaded</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderBillsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Bill History</h3>
        <Button
          variant="outline"
          size="sm"
          iconName="RefreshCw"
          iconPosition="left"
          iconSize={14}
          onClick={loadBills}
          disabled={billsLoading}
        >
          Refresh
        </Button>
      </div>

      {billsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading bills...</p>
        </div>
      ) : bills.length === 0 ? (
        <div className="text-center py-8">
          <Icon
            name="Receipt"
            size={32}
            className="text-muted-foreground mx-auto mb-2"
          />
          <p className="text-sm text-muted-foreground">No bills generated yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-semibold text-foreground">
                    {bill.bill_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full ${
                      bill.status === "generated"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {bill.status}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-2">
                  <div className="flex flex-wrap gap-1 items-center">
                    <span>Vehicle{bill.vehicle_number?.includes(',') ? 's' : ''}:</span>
                    {bill.vehicle_number ? (
                      bill.vehicle_number.split(',').map((vehicle, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
                        >
                          <Icon name="Car" size={10} className="mr-1" />
                          {vehicle.trim()}
                        </span>
                      ))
                    ) : (
                      <span>N/A</span>
                    )}
                  </div>
                  
                  {/* Vehicle Breakdown */}
                  {bill.vehicles_breakdown && Array.isArray(bill.vehicles_breakdown) && bill.vehicles_breakdown.length > 0 && (
                    <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border">
                      <p className="text-xs font-medium text-foreground mb-2">Vehicle Breakdown:</p>
                      <div className="space-y-2">
                        {bill.vehicles_breakdown.map((vehicle, idx) => (
                          <div key={idx} className="text-xs space-y-1 pb-2 border-b border-border last:border-0 last:pb-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">
                                Vehicle {idx + 1}: {vehicle.vehicleNumber || 'N/A'}
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-1">
                              <div>
                                <span className="text-muted-foreground">Days:</span>
                                <span className="ml-1 font-medium text-foreground">{vehicle.rentalDays || 0}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Trips:</span>
                                <span className="ml-1 font-medium text-foreground">{vehicle.trips || 0}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Rent:</span>
                                <span className="ml-1 font-medium text-foreground">₹{Number(vehicle.vehicleRent || vehicle.dailyRent * vehicle.rentalDays || 0).toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="text-muted-foreground mt-1">
                              <span>₹{Number(vehicle.dailyRent || 0).toFixed(2)} × {vehicle.rentalDays || 0} days</span>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-border mt-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-foreground">Total Vehicle Rent:</span>
                            <span className="font-semibold text-foreground">
                              ₹{bill.vehicles_breakdown.reduce((sum, v) => sum + (Number(v.vehicleRent || v.dailyRent * v.rentalDays || 0)), 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {(!bill.vehicles_breakdown || !Array.isArray(bill.vehicles_breakdown) || bill.vehicles_breakdown.length === 0) && (
                    <p>
                      {bill.rental_days} days • {bill.trips} trips
                    </p>
                  )}
                  
                  <p>
                    Generated:{" "}
                    {new Date(bill.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="mt-2 flex items-center space-x-4 text-sm">
                  <span className="text-muted-foreground">
                    Final Amount:{" "}
                    <span
                      className={`font-medium ${
                        bill.current_os >= 0 ? "text-success" : "text-error"
                      }`}
                    >
                      {formatCurrency(bill.current_os)}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  iconName="Download"
                  iconPosition="left"
                  iconSize={14}
                  onClick={() => handleDownloadBill(bill)}
                >
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  iconName="Trash2"
                  iconSize={14}
                  className="text-error"
                  onClick={() => handleDeleteBill(bill.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-foreground">Payment History</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName="RefreshCw"
            iconPosition="left"
            iconSize={14}
            onClick={loadPayments}
            disabled={paymentsLoading}
          >
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            iconName="Plus"
            iconPosition="left"
            iconSize={14}
            onClick={() => setShowPaymentForm(true)}
          >
            Add Payment
          </Button>
        </div>
      </div>

      {showPaymentForm && (
        <form onSubmit={handleAddPayment} className="p-4 border border-border rounded-lg bg-muted/20 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-foreground">Add Payment</h4>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconName="X"
              iconSize={14}
              onClick={() => setShowPaymentForm(false)}
            >
              Cancel
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Payment Type"
              value={paymentForm.paymentType}
              onChange={(value) =>
                setPaymentForm({ ...paymentForm, paymentType: value })
              }
              options={[
                { value: "paid", label: "Paid (Reduces Outstanding Balance)" },
                { value: "due", label: "Due (Increases Outstanding Balance)" },
              ]}
              required
            />
            <Input
              label="Payment Amount (₹)"
              type="number"
              min="0"
              step="0.01"
              value={paymentForm.paymentAmount}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, paymentAmount: e.target.value })
              }
              required
            />
            <Input
              label="Payment Date"
              type="date"
              value={paymentForm.paymentDate}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, paymentDate: e.target.value })
              }
              required
            />
            <Input
              label="Payment Method"
              placeholder="Cash, UPI, Bank Transfer, etc."
              value={paymentForm.paymentMethod}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })
              }
            />
            <Input
              label="Reference Number"
              placeholder="Transaction ID, Receipt No, etc."
              value={paymentForm.referenceNumber}
              onChange={(e) =>
                setPaymentForm({ ...paymentForm, referenceNumber: e.target.value })
              }
            />
          </div>
          <Input
            label="Notes"
            placeholder="Additional notes about this payment"
            value={paymentForm.notes}
            onChange={(e) =>
              setPaymentForm({ ...paymentForm, notes: e.target.value })
            }
          />
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Payment Screenshot (Optional)
            </label>
            <input
              ref={paymentScreenshotRef}
              type="file"
              accept="image/*"
              onChange={(e) =>
                setPaymentForm({
                  ...paymentForm,
                  screenshot: e.target.files?.[0] || null,
                })
              }
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {paymentForm.screenshot && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {paymentForm.screenshot.name}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowPaymentForm(false);
                setPaymentForm({
                  paymentType: "paid",
                  paymentAmount: "",
                  paymentDate: new Date().toISOString().split("T")[0],
                  paymentMethod: "",
                  referenceNumber: "",
                  notes: "",
                  screenshot: null,
                });
                if (paymentScreenshotRef.current) {
                  paymentScreenshotRef.current.value = "";
                }
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="default"
              className={paymentForm.paymentType === "due" ? "bg-error hover:bg-error/90" : "bg-success hover:bg-success/90"}
            >
              Add {paymentForm.paymentType === "due" ? "Due" : "Payment"}
            </Button>
          </div>
        </form>
      )}

      {paymentsLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-8">
          <Icon
            name="CreditCard"
            size={32}
            className="text-muted-foreground mx-auto mb-2"
          />
          <p className="text-sm text-muted-foreground">No payments recorded yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`text-sm font-semibold ${
                    payment.payment_type === "due" ? "text-error" : "text-success"
                  }`}>
                    {formatCurrency(payment.payment_amount)}
                  </span>
                  {payment.payment_type && (
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      payment.payment_type === "due" 
                        ? "bg-error/10 text-error border border-error/30" 
                        : "bg-success/10 text-success border border-success/30"
                    }`}>
                      {payment.payment_type === "due" ? "Due" : "Paid"}
                    </span>
                  )}
                  {payment.payment_method && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                      {payment.payment_method}
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>
                    Date:{" "}
                    {new Date(payment.payment_date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  {payment.reference_number && (
                    <p>Ref: {payment.reference_number}</p>
                  )}
                  {payment.notes && <p>Notes: {payment.notes}</p>}
                  {payment.screenshot_url && (
                    <div className="mt-2">
                      <a
                        href={payment.screenshot_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-xs text-primary hover:underline"
                      >
                        <Icon name="Image" size={12} className="mr-1" />
                        View Screenshot
                      </a>
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                iconName="Trash2"
                iconSize={14}
                className="text-error"
                onClick={() => handleDeletePayment(payment.id)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderActivityTab = () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground">Recent Activity</h3>
      <div className="space-y-3">
        {owner?.recentActivity?.map((activity, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 border border-border rounded-lg"
          >
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Icon name={activity?.icon} size={14} className="text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm text-foreground">
                {activity?.description}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {activity?.timestamp}
              </div>
            </div>
          </div>
        )) || (
          <div className="text-center py-8">
            <Icon
              name="Activity"
              size={32}
              className="text-muted-foreground mx-auto mb-2"
            />
            <p className="text-sm text-muted-foreground">No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return renderProfileTab();
      case "vehicles":
        return renderVehiclesTab();
      case "financial":
        return renderFinancialTab();
      case "bills":
        return renderBillsTab();
      case "payments":
        return renderPaymentsTab();
      case "documents":
        return renderDocumentsTab();
      case "activity":
        return renderActivityTab();
      default:
        return renderProfileTab();
    }
  };

  return (
    <div className="h-full bg-surface border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Owner Details
          </h2>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  iconName="X"
                  iconSize={14}
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                  iconName="Check"
                  iconSize={14}
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                iconName="Edit"
                iconSize={14}
              >
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              iconName="X"
              iconSize={16}
            />
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex space-x-1 p-1">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab?.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon name={tab?.icon} size={14} />
              <span>{tab?.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">{renderTabContent()}</div>
    </div>
  );
};

export default OwnerDetailPanel;
