import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { formatCurrency } from "../../../utils/formatters";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";
import {
  updateTVPOwner,
  getDriverBills,
  getDriverPayments,
  createDriverPayment,
  updateDriverPayment,
  deleteDriverPayment,
  deleteDriverBill,
  getTotalOutstandingBalance,
  getTVPOwnerDetails,
  updateBill,
  getDriverWeekSummary,
} from "../../../lib/tvpManagementAPI";
import { supabase } from "../../../lib/supabase";
import {
  ACCOUNT_OPTIONS,
  getAccountLabel,
  DEPOSIT_LEDGER_OPTIONS,
  PENALTY_LEDGER_OPTIONS,
  PAYMENT_TYPES_REQUIRING_ACCOUNT,
  getPaymentTypeLabel,
  getPaymentTypeColor,
  getLedgerForType,
} from "../../../utils/accounts";
import {
  calculatePreviousWeek,
  calculateWeekFromDate,
} from "../../../pages/hissab-accounting-generator/components/WeekSelector";
import TransactionModal from "./TransactionModal";
import BillEditModal from "../../bulk-bill-generator/components/BillEditModal";

const OwnerDetailPanel = ({ owner, onClose, onUpdate, onOpenAddPenalty }) => {
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
      includingRoom: owner?.includingRoom ?? false,
      penaltyAmount: owner?.penaltyAmount ?? owner?.penalty_amount ?? 0,
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
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionModalLedger, setTransactionModalLedger] =
    useState("deposit");
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [paymentFormSubmitting, setPaymentFormSubmitting] = useState(false);
  const [paymentsSubTab, setPaymentsSubTab] = useState("deposit");
  const [paymentForm, setPaymentForm] = useState({
    ledger: "deposit",
    paymentType: "deposit_due",
    account: "",
    paymentAmount: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "",
    referenceNumber: "",
    notes: "",
    screenshot: null,
  });
  const [editingBill, setEditingBill] = useState(null);
  const [showBillEditModal, setShowBillEditModal] = useState(false);
  const [billEditLoading, setBillEditLoading] = useState(false);
  const defaultWeek = useMemo(() => calculatePreviousWeek(), []);
  const [financialWeek, setFinancialWeek] = useState(() => calculatePreviousWeek());
  const [weekSummary, setWeekSummary] = useState({ totalBillForWeek: 0, outstandingForWeek: 0 });
  const [weekSummaryLoading, setWeekSummaryLoading] = useState(false);
  const paymentWeekOptions = useMemo(() => {
    const formatWeekLabel = (weekStart) => {
      const d = new Date(weekStart);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const currentWeek = calculateWeekFromDate(todayStr);
    const options = [
      {
        value: currentWeek.weekEnd,
        label: `Current week (${formatWeekLabel(currentWeek.weekStart)} – ${formatWeekLabel(currentWeek.weekEnd)})`,
      },
    ];
    const currentMonday = new Date(currentWeek.weekStart);
    for (let n = 1; n <= 12; n++) {
      const prevMonday = new Date(currentMonday);
      prevMonday.setDate(prevMonday.getDate() - 7 * n);
      const prevMondayStr = `${prevMonday.getFullYear()}-${String(prevMonday.getMonth() + 1).padStart(2, "0")}-${String(prevMonday.getDate()).padStart(2, "0")}`;
      const week = calculateWeekFromDate(prevMondayStr);
      const label =
        n === 1
          ? `Previous week (${formatWeekLabel(week.weekStart)} – ${formatWeekLabel(week.weekEnd)})`
          : `${n} weeks ago (${formatWeekLabel(week.weekStart)} – ${formatWeekLabel(week.weekEnd)})`;
      options.push({ value: week.weekEnd, label });
    }
    return options;
  }, []);

  useEffect(() => {
    if (owner?.id && activeTab === "bills") {
      loadBills();
    }
  }, [owner?.id, activeTab]);

  useEffect(() => {
    if (owner?.id && (activeTab === "payments" || activeTab === "financial")) {
      loadPayments();
    }
  }, [owner?.id, activeTab]);

  useEffect(() => {
    if (owner?.id && activeTab === "financial") {
      loadPayments();
    }
  }, [owner?.id, activeTab]);

  useEffect(() => {
    if (!owner?.id || !financialWeek?.weekStart || !financialWeek?.weekEnd) {
      setWeekSummary({ totalBillForWeek: 0, outstandingForWeek: 0 });
      return;
    }
    let cancelled = false;
    const load = async () => {
      setWeekSummaryLoading(true);
      try {
        const summary = await getDriverWeekSummary(owner.id, financialWeek.weekStart, financialWeek.weekEnd);
        if (!cancelled) setWeekSummary(summary);
      } catch (err) {
        console.error("Error loading week summary:", err);
        if (!cancelled) setWeekSummary({ totalBillForWeek: 0, outstandingForWeek: 0 });
      } finally {
        if (!cancelled) setWeekSummaryLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [owner?.id, financialWeek?.weekStart, financialWeek?.weekEnd]);

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
      "Are you sure you want to delete this bill? This will also update the outstanding balance and cumulative rental days.",
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

  const handleBillEdit = (bill) => {
    setEditingBill(bill);
    setShowBillEditModal(true);
  };

  const handleBillUpdate = async (billData) => {
    if (!editingBill?.id || !owner?.id) return;
    try {
      setBillEditLoading(true);
      await updateBill(editingBill.id, billData);
      await loadBills();
      const updatedOwner = await getTVPOwnerDetails(owner.id);
      onUpdate(updatedOwner);
      setShowBillEditModal(false);
      setEditingBill(null);
    } catch (err) {
      console.error("Error updating bill:", err);
      throw err;
    } finally {
      setBillEditLoading(false);
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
              owner?.status,
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
              {owner?.category === "double_driver"
                ? "Double Driver"
                : "Single Driver"}
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
                  setEditData({
                    ...editData,
                    alternativePhone1: e?.target?.value,
                  })
                }
              />
              <Input
                label="Alternative Phone 2"
                type="tel"
                value={editData?.alternativePhone2 || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    alternativePhone2: e?.target?.value,
                  })
                }
              />
              <Input
                label="Alternative Phone 3"
                type="tel"
                value={editData?.alternativePhone3 || ""}
                onChange={(e) =>
                  setEditData({
                    ...editData,
                    alternativePhone3: e?.target?.value,
                  })
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
                <span className="text-sm text-foreground">
                  {owner?.phone || "Not provided"}
                </span>
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
                <span className="text-sm text-foreground">
                  {owner?.email || "Not provided"}
                </span>
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
            <span className="text-sm text-muted-foreground">
              No vehicles assigned
            </span>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Metrics</h3>
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
                value={
                  editData.cumulativeRentalDays ??
                  owner?.cumulativeRentalDays ??
                  0
                }
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
              <span className="text-xs text-muted-foreground">
                Room Deposit
              </span>
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
              <span className="text-xs text-muted-foreground">
                Pre-Paid Rent Amount
              </span>
              <Icon name="Wallet" size={14} className="text-success" />
            </div>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                step="0.01"
                value={
                  editData.prePaidRentAmount ?? owner?.prePaidRentAmount ?? 0
                }
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
              <span className="text-xs text-muted-foreground">
                Documents Charge
              </span>
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

      {/* Bill options: Including Room */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Bill options
        </h3>
        <div className="bg-muted/30 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Including room
            </span>
            <Icon name="Home" size={14} className="text-primary" />
          </div>
          {isEditing ? (
            <Checkbox
              id="including-room"
              checked={!!(editData.includingRoom ?? owner?.includingRoom)}
              onCheckedChange={(checked) =>
                setEditData({
                  ...editData,
                  includingRoom: !!checked,
                })
              }
              label="Include room rent in bill generation"
              className="mt-2"
            />
          ) : (
            <div className="text-lg font-semibold text-foreground mt-1">
              {owner?.includingRoom ? "Yes" : "No"}
            </div>
          )}
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
            onClick={() => onOpenAddPenalty?.(owner)}
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
              ? `${vehicle?.model}${vehicle?.year ? ` • ${vehicle?.year}` : ""}`
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

  const mapLegacyPaymentType = (pt) => {
    const map = {
      paid: "penalty_paid",
      due: "penalty_due",
      refund: "penalty_refund",
      deposit: "deposit_due",
      deposit_due: "deposit_refund",
    };
    return map[pt] || pt;
  };

  const handleEditPayment = (payment) => {
    setEditingPaymentId(payment.id);
    const pt = mapLegacyPaymentType(payment.payment_type || "penalty_paid");
    setPaymentForm({
      ledger: getLedgerForType(pt),
      paymentType: pt,
      account: payment.account ?? "",
      paymentAmount: payment.payment_amount?.toString() ?? "",
      paymentDate:
        payment.payment_date ?? new Date().toISOString().split("T")[0],
      paymentMethod: payment.payment_method ?? "",
      referenceNumber: payment.reference_number ?? "",
      notes: payment.notes ?? "",
      screenshot: null,
    });
    setTransactionModalLedger(getLedgerForType(pt));
    setTransactionModalOpen(true);
  };

  const handleTransactionModalSubmit = async (formData) => {
    if (!owner?.id) return;
    const isEditing = Boolean(editingPaymentId);
    try {
      setPaymentFormSubmitting(true);
      // For Paid: week = which week's bill they're paying (from WeekSelector). Date = when they paid.
      const weekFromDate = formData.paymentDate
        ? calculateWeekFromDate(formData.paymentDate)
        : null;
      const useFormWeek = (formData.paymentType === "penalty_other" || formData.paymentType === "accident_due" || formData.paymentType === "penalty_paid") && formData.weekStart && formData.weekEnd;
      const weekStart = useFormWeek ? formData.weekStart : weekFromDate?.weekStart;
      const weekEnd = useFormWeek ? formData.weekEnd : weekFromDate?.weekEnd;

      if (isEditing) {
        await updateDriverPayment(editingPaymentId, owner.id, {
          paymentType: formData.paymentType || "penalty_paid",
          account: PAYMENT_TYPES_REQUIRING_ACCOUNT.includes(
            formData.paymentType,
          )
            ? formData.account || "letzryd"
            : null,
          paymentAmount: formData.paymentAmount,
          paymentDate: formData.paymentDate,
          weekStart,
          weekEnd,
          paymentMethod: formData.paymentMethod,
          referenceNumber: formData.referenceNumber,
          notes: formData.notes,
          screenshot: formData.screenshot,
        });
      } else {
        await createDriverPayment({
          driverId: owner.id,
          paymentType: formData.paymentType || "penalty_paid",
          account: PAYMENT_TYPES_REQUIRING_ACCOUNT.includes(
            formData.paymentType,
          )
            ? formData.account || "letzryd"
            : null,
          paymentAmount: formData.paymentAmount,
          paymentDate: formData.paymentDate,
          weekStart,
          weekEnd,
          paymentMethod: formData.paymentMethod,
          referenceNumber: formData.referenceNumber,
          notes: formData.notes,
          screenshot: formData.screenshot,
        });
      }

      await loadPayments();
      const updatedOwner = await getTVPOwnerDetails(owner.id);
      onUpdate(updatedOwner);

      setPaymentForm({
        ledger: transactionModalLedger,
        paymentType:
          transactionModalLedger === "deposit" ? "deposit_due" : "penalty_due",
        account: "",
        paymentAmount: "",
        paymentDate: new Date().toISOString().split("T")[0],
        paymentMethod: "",
        referenceNumber: "",
        notes: "",
        screenshot: null,
      });
      setEditingPaymentId(null);
      setTransactionModalOpen(false);
    } catch (err) {
      console.error(
        isEditing ? "Error updating payment:" : "Error adding payment:",
        err,
      );
      const message =
        err?.message ||
        (isEditing
          ? "Failed to update transaction"
          : "Failed to add transaction");
      alert(message);
    } finally {
      setPaymentFormSubmitting(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!owner?.id) return;
    const confirmed = window.confirm(
      "Delete this transaction? The outstanding balance and deposit will be adjusted accordingly.",
    );
    if (!confirmed) return;
    try {
      await deleteDriverPayment(paymentId, owner.id);
      await loadPayments();
      const updatedOwner = await getTVPOwnerDetails(owner.id);
      onUpdate(updatedOwner);
    } catch (err) {
      console.error("Error deleting payment:", err);
      const message =
        err?.message ||
        "Failed to delete transaction. Please refresh and try again.";
      alert(message);
    }
  };

  const depositLedgerTypes = [
    "deposit_due",
    "deposit_refund",
    "deposit_paid",
    "deposit",
  ];
  const penaltyLedgerTypes = [
    "penalty_due",
    "penalty_refund",
    "penalty_paid",
    "penalty_other",
    "accident_due",
    "accident_paid",
    "paid",
    "due",
    "refund",
  ];

  const depositPayments = useMemo(
    () =>
      (payments || []).filter((p) =>
        depositLedgerTypes.includes(p.payment_type),
      ),
    [payments],
  );
  const penaltyPayments = useMemo(
    () =>
      (payments || []).filter(
        (p) =>
          penaltyLedgerTypes.includes(p.payment_type) ||
          p.payment_type === "bill",
      ),
    [payments],
  );

  const depositByAccount = useMemo(() => {
    const totals = { letzryd: 0, tawaaq_fleet: 0, cash_in_hand: 0 };
    depositPayments.forEach((p) => {
      if (!p.account || totals[p.account] === undefined) return;
      if (["deposit", "deposit_refund", "deposit_paid"].includes(p.payment_type))
        totals[p.account] += Number(p?.payment_amount) || 0;
      else totals[p.account] -= Number(p?.payment_amount) || 0;
    });
    return totals;
  }, [depositPayments]);

  const penaltyByAccount = useMemo(() => {
    const totals = { letzryd: 0, tawaaq_fleet: 0, cash_in_hand: 0 };
    penaltyPayments.forEach((p) => {
      if (p.payment_type === "bill") return;
      if (!p.account || totals[p.account] === undefined) return;
      if (["penalty_paid", "paid", "refund", "penalty_refund", "accident_paid"].includes(p.payment_type))
        totals[p.account] -= Number(p?.payment_amount) || 0;
      else totals[p.account] += Number(p?.payment_amount) || 0;
    });
    return totals;
  }, [penaltyPayments]);

  const totalCollectedByAccount = useMemo(() => {
    const totals = { letzryd: 0, tawaaq_fleet: 0, cash_in_hand: 0 };
    (payments || []).forEach((p) => {
      if (!["paid", "penalty_paid", "accident_paid"].includes(p.payment_type)) return;
      const k =
        p?.account && totals[p.account] !== undefined ? p.account : "letzryd";
      totals[k] += Number(p?.payment_amount) || 0;
    });
    return totals;
  }, [payments]);

  const formatWeekLabel = (weekStart, weekEnd) => {
    if (!weekStart || !weekEnd) return "";
    const s = new Date(weekStart);
    const e = new Date(weekEnd);
    return `${s.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const renderFinancialTab = () => (
    <div className="space-y-6">
      {/* Week selector: same as Paid transaction week — Total bill & Outstanding for this week */}
      <div className="bg-muted/20 border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">
          For selected week (same as &quot;Paid&quot; transaction week)
        </h3>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setFinancialWeek(calculatePreviousWeek())}
            iconName="Calendar"
            iconSize={14}
            iconPosition="left"
          >
            Previous week
          </Button>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const d = new Date(financialWeek.weekStart);
                d.setDate(d.getDate() - 7);
                const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
                const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                setFinancialWeek(calculateWeekFromDate(dateStr));
              }}
              iconName="ChevronLeft"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => {
                const d = new Date(financialWeek.weekStart);
                d.setDate(d.getDate() + 7);
                const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
                const dateStr = `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                setFinancialWeek(calculateWeekFromDate(dateStr));
              }}
              iconName="ChevronRight"
            />
          </div>
          <Input
            type="date"
            value={financialWeek?.weekStart ?? ""}
            onChange={(e) => {
              const v = e?.target?.value;
              if (v) setFinancialWeek(calculateWeekFromDate(v));
            }}
            className="w-40"
          />
          <span className="text-sm text-muted-foreground">
            {formatWeekLabel(financialWeek?.weekStart, financialWeek?.weekEnd)}
          </span>
        </div>
        {weekSummaryLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            Loading week summary…
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-card border border-border p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Total bill (this week)</span>
                <Icon name="Receipt" size={16} className="text-primary" />
              </div>
              <div className="text-xl font-bold text-foreground">
                {formatCurrency(weekSummary?.totalBillForWeek ?? 0)}
              </div>
            </div>
            <div className="bg-white dark:bg-card border border-border p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Outstanding (this week)</span>
                <Icon
                  name="AlertCircle"
                  size={16}
                  className={(weekSummary?.outstandingForWeek ?? 0) > 0 ? "text-error" : "text-emerald-600 dark:text-emerald-400"}
                />
              </div>
              <div
                className={`text-xl font-bold ${
                  (weekSummary?.outstandingForWeek ?? 0) > 0 ? "text-error" : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {formatCurrency(weekSummary?.outstandingForWeek ?? 0)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Financial Summary (all-time) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-border p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Deposit</span>
            <Icon name="DollarSign" size={16} className="text-success" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(owner?.depositAmount)}
          </div>
        </div>

        <div className="bg-white border border-border p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Outstanding Balance
            </span>
            <Icon
              name="AlertCircle"
              size={16}
              className={(owner?.outstandingBalance ?? 0) > 0 ? "text-error" : "text-emerald-600 dark:text-emerald-400"}
            />
          </div>
          <div
            className={`text-2xl font-bold ${
              (owner?.outstandingBalance ?? 0) > 0
                ? "text-error"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {formatCurrency(Math.abs(owner?.outstandingBalance ?? 0))}
          </div>
        </div>

        <div className="bg-white border border-border p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              Pending Penalty (INR)
            </span>
            <Icon name="AlertTriangle" size={16} className="text-warning" />
          </div>
          <p className="text-xs text-muted-foreground mb-1">
            Added to the driver&apos;s next generated bill; reduces after the bill is created.
          </p>
          {isEditing ? (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={
                editData.penaltyAmount ??
                owner?.penaltyAmount ??
                owner?.penalty_amount ??
                0
              }
              onChange={(e) =>
                setEditData({
                  ...editData,
                  penaltyAmount: parseFloat(e.target.value) || 0,
                })
              }
            />
          ) : (
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(owner?.penaltyAmount ?? owner?.penalty_amount ?? 0)}
            </div>
          )}
        </div>

        <div className="bg-white border border-border p-4 rounded-lg">
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
              value={
                editData.cumulativeRentalDays ??
                owner?.cumulativeRentalDays ??
                0
              }
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

      {/* Amount collected by account (this driver) */}
      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">
          Amount collected by account
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">LetzRyd A/c</span>
              <Icon name="Building2" size={16} className="text-primary" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(totalCollectedByAccount?.letzryd ?? 0)}
            </div>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Tawaaq Fleet A/c
              </span>
              <Icon name="Car" size={16} className="text-primary" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(totalCollectedByAccount?.tawaaq_fleet ?? 0)}
            </div>
          </div>
          <div className="bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">
                Cash In hand
              </span>
              <Icon name="Wallet" size={16} className="text-primary" />
            </div>
            <div className="text-xl font-bold text-foreground">
              {formatCurrency(totalCollectedByAccount?.cash_in_hand ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions preview */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-foreground">
              Transactions
            </div>
            <div className="text-xs text-muted-foreground">
              Preview (latest 5)
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Plus"
              iconPosition="left"
              iconSize={14}
              onClick={() => setActiveTab("payments")}
            >
              Add / Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("payments")}
            >
              View all
            </Button>
          </div>
        </div>

        <div className="p-4">
          {paymentsLoading ? (
            <div className="text-center py-6">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">
                Loading transactions...
              </p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-border rounded-lg">
              <Icon
                name="CreditCard"
                size={24}
                className="text-muted-foreground mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No transactions yet
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payments.slice(0, 5).map((payment) => (
                <div
                  key={payment.id}
                  className="py-3 flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(() => {
                        const { text, className } = formatTransactionAmount(payment.payment_type, payment.payment_amount);
                        return <span className={`font-semibold ${className}`}>{text}</span>;
                      })()}
                      <span
                        className={`text-xs px-2 py-1 rounded-md font-medium border ${getTransactionBadgeClass(payment.payment_type)}`}
                      >
                        {getPaymentTypeLabel(payment.payment_type)?.split(
                          " (",
                        )[0] || payment.payment_type}
                      </span>
                      {payment.account && (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
                          {getAccountLabel(payment.account)}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(payment.payment_date).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                      {payment.reference_number
                        ? ` • Ref: ${payment.reference_number}`
                        : ""}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab("payments")}
                  >
                    Open
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
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
    if (
      Array.isArray(owner?.vehicleNumbers) &&
      owner.vehicleNumbers.length > 0
    ) {
      return owner.vehicleNumbers;
    }
    if (Array.isArray(owner?.vehicles)) {
      return owner.vehicles
        .map(
          (vehicle) =>
            vehicle?.plateNumber || vehicle?.car_number || vehicle?.carNumber,
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
    cumulativeRentalDays:
      editData?.cumulativeRentalDays ?? owner?.cumulativeRentalDays ?? 0,
    status: editData?.status || owner?.status || "active",
    depositAmount:
      Number(
        editData?.depositAmount ??
          owner?.depositAmount ??
          owner?.deposit_amount,
      ) || 0,
    outstandingBalance:
      Number(
        editData?.outstandingBalance ??
          owner?.outstandingBalance ??
          owner?.outstanding_balance,
      ) || 0,
    paymentDelayDays:
      Number(
        editData?.paymentDelayDays ??
          owner?.paymentDelayDays ??
          owner?.payment_delay_days,
      ) || 0,
    performance: Number(editData?.performance ?? owner?.performance ?? 0),
    roomDeposit: editData?.roomDeposit ?? owner?.roomDeposit ?? 0,
    prePaidRentAmount:
      editData?.prePaidRentAmount ?? owner?.prePaidRentAmount ?? 0,
    documentsCharge: editData?.documentsCharge ?? owner?.documentsCharge ?? 0,
    alternativePhone1:
      editData?.alternativePhone1 ?? owner?.alternativePhone1 ?? "",
    alternativePhone2:
      editData?.alternativePhone2 ?? owner?.alternativePhone2 ?? "",
    alternativePhone3:
      editData?.alternativePhone3 ?? owner?.alternativePhone3 ?? "",
    includingRoom: editData?.includingRoom ?? owner?.includingRoom ?? false,
    penaltyAmount:
      Number(
        editData?.penaltyAmount ??
          owner?.penaltyAmount ??
          owner?.penalty_amount,
      ) || 0,
    uberDriverPhotos:
      editData?.uberDriverPhotos ?? owner?.uberDriverPhotos ?? [],
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
      `Remove ${entry.label} from this owner’s records?`,
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
                  onClick={() => fileInputRefs.current[doc.formKey]?.click?.()}
                >
                  {isProcessing ? "Processing..." : url ? "Replace" : "Upload"}
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
          <h3 className="text-sm font-medium text-foreground mb-3">
            Documents
          </h3>
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
                      onClick={() => window.open(url, "_blank")}
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
            {!documentEntries.some((doc) => owner?.documents?.[doc.key]) && (
              <div className="text-center py-6 border border-dashed border-border rounded-lg">
                <Icon
                  name="FileText"
                  size={24}
                  className="text-muted-foreground mx-auto mb-2"
                />
                <p className="text-sm text-muted-foreground">
                  No documents uploaded
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Uber Driver Profile Photos */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-foreground">
              Uber Driver Profile Photos
            </h3>
            <p className="text-xs text-muted-foreground">
              {owner?.uberDriverPhotos?.length || 0} photo(s)
            </p>
          </div>

          {owner?.uberDriverPhotos &&
          Array.isArray(owner.uberDriverPhotos) &&
          owner.uberDriverPhotos.length > 0 ? (
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
                      onClick={() => window.open(photoUrl, "_blank")}
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
                        if (
                          window.confirm(
                            `Delete Uber driver photo ${index + 1}?`,
                          )
                        ) {
                          try {
                            const updatedPhotos = owner.uberDriverPhotos.filter(
                              (_, i) => i !== index,
                            );
                            const payload = buildOwnerUpdatePayload({
                              uberDriverPhotos: updatedPhotos,
                              existingUberPhotos: updatedPhotos,
                            });
                            const updatedOwner = await updateTVPOwner(
                              owner.id,
                              payload,
                            );
                            setEditData(updatedOwner);
                            onUpdate(updatedOwner);
                          } catch (err) {
                            console.error("Failed to delete photo:", err);
                            alert(
                              "Failed to delete photo: " +
                                (err.message || "Unknown error"),
                            );
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
              <Icon
                name="Image"
                size={24}
                className="text-muted-foreground mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No Uber driver photos uploaded
              </p>
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
          <p className="text-sm text-muted-foreground">
            No bills generated yet
          </p>
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
                    <span>
                      Vehicle{bill.vehicle_number?.includes(",") ? "s" : ""}:
                    </span>
                    {bill.vehicle_number ? (
                      bill.vehicle_number.split(",").map((vehicle, idx) => (
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
                  {bill.vehicles_breakdown &&
                    Array.isArray(bill.vehicles_breakdown) &&
                    bill.vehicles_breakdown.length > 0 && (
                      <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border">
                        <p className="text-xs font-medium text-foreground mb-2">
                          Vehicle Breakdown:
                        </p>
                        <div className="space-y-2">
                          {bill.vehicles_breakdown.map((vehicle, idx) => (
                            <div
                              key={idx}
                              className="text-xs space-y-1 pb-2 border-b border-border last:border-0 last:pb-0"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">
                                  Vehicle {idx + 1}:{" "}
                                  {vehicle.vehicleNumber || "N/A"}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 mt-1">
                                <div>
                                  <span className="text-muted-foreground">
                                    Days:
                                  </span>
                                  <span className="ml-1 font-medium text-foreground">
                                    {vehicle.rentalDays || 0}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Trips:
                                  </span>
                                  <span className="ml-1 font-medium text-foreground">
                                    {vehicle.trips || 0}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">
                                    Rent:
                                  </span>
                                  <span className="ml-1 font-medium text-foreground">
                                    ₹
                                    {Number(
                                      vehicle.vehicleRent ||
                                        vehicle.dailyRent *
                                          vehicle.rentalDays ||
                                        0,
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                              <div className="text-muted-foreground mt-1">
                                <span>
                                  ₹{Number(vehicle.dailyRent || 0).toFixed(2)} ×{" "}
                                  {vehicle.rentalDays || 0} days
                                </span>
                              </div>
                            </div>
                          ))}
                          <div className="pt-2 border-t border-border mt-2">
                            <div className="flex justify-between items-center">
                              <span className="font-medium text-foreground">
                                Total Vehicle Rent:
                              </span>
                              <span className="font-semibold text-foreground">
                                ₹
                                {bill.vehicles_breakdown
                                  .reduce(
                                    (sum, v) =>
                                      sum +
                                      Number(
                                        v.vehicleRent ||
                                          v.dailyRent * v.rentalDays ||
                                          0,
                                      ),
                                    0,
                                  )
                                  .toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  {(!bill.vehicles_breakdown ||
                    !Array.isArray(bill.vehicles_breakdown) ||
                    bill.vehicles_breakdown.length === 0) && (
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
                  iconName="Pencil"
                  iconPosition="left"
                  iconSize={14}
                  onClick={() => handleBillEdit(bill)}
                >
                  Edit
                </Button>
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

  const openAddForm = (ledger) => {
    setEditingPaymentId(null);
    const prevWeek = calculatePreviousWeek();
    setPaymentForm({
      ledger,
      paymentType: ledger === "deposit" ? "deposit_due" : "penalty_due",
      account: "",
      paymentAmount: "",
      paymentDate: prevWeek.weekEnd,
      paymentMethod: "",
      referenceNumber: "",
      notes: "",
      screenshot: null,
    });
    setTransactionModalLedger(ledger);
    setTransactionModalOpen(true);
  };

  const DUE_TYPES = ["deposit_due", "penalty_due", "due", "accident_due"];
  const REFUND_PAID_TYPES = ["deposit_refund", "deposit_paid", "penalty_refund", "penalty_paid", "accident_paid", "paid", "refund"];

  const formatTransactionAmount = (paymentType, amount) => {
    const num = Number(amount) || 0;
    const formatted = formatCurrency(num);
    if (DUE_TYPES.includes(paymentType)) {
      return { text: `-${formatted}`, className: "text-red-600 dark:text-red-400 font-medium" };
    }
    if (REFUND_PAID_TYPES.includes(paymentType)) {
      return { text: `+${formatted}`, className: "text-emerald-600 dark:text-emerald-400 font-medium" };
    }
    return { text: formatted, className: "font-medium text-foreground" };
  };

  const getTransactionBadgeClass = (paymentType) => {
    const t = paymentType || "";
    if (["deposit_due", "deposit"].includes(t))
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700";
    if (["deposit_refund", "deposit_paid"].includes(t))
      return "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700";
    if (["penalty_due", "due", "accident_due"].includes(t))
      return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700";
    if (["penalty_refund", "refund"].includes(t))
      return "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-900/30 dark:text-sky-400 dark:border-sky-700";
    if (["penalty_paid", "paid", "accident_paid"].includes(t))
      return "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700";
    return "bg-muted/50 text-muted-foreground border-border";
  };

  const renderLedgerSection = (
    title,
    ledger,
    balance,
    byAccount,
    ledgerPayments,
    loading,
  ) => (
    <div className="border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        <Button
          variant="outline"
          size="sm"
          iconName="Plus"
          iconSize={14}
          onClick={() => openAddForm(ledger)}
        >
          Add
        </Button>
      </div>
      <div className="space-y-3">
        <div className="bg-muted/30 p-3 rounded-lg">
          <span className="text-xs text-muted-foreground">Current balance</span>
          <div
            className={`text-xl font-bold ${
              ledger === "deposit"
                ? "text-foreground"
                : (balance ?? 0) > 0
                  ? "text-error"
                  : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {formatCurrency(Math.abs(balance ?? 0))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {ACCOUNT_OPTIONS.map((acc) => (
            <div
              key={acc.value}
              className="bg-muted/20 p-2 rounded text-center"
            >
              <div className="text-xs text-muted-foreground truncate">
                {acc.label}
              </div>
              <div className="text-sm font-semibold">
                {formatCurrency(byAccount?.[acc.value] ?? 0)}
              </div>
            </div>
          ))}
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-2">
            History
          </div>
          {loading ? (
            <div className="py-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
            </div>
          ) : ledgerPayments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No transactions yet</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ledgerPayments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    {(() => {
                      const { text, className } = formatTransactionAmount(p.payment_type, p.payment_amount);
                      return <span className={className}>{text}</span>;
                    })()}
                    <span
                      className={`text-xs px-2 py-1 rounded-md font-medium border ${getTransactionBadgeClass(p.payment_type)}`}
                    >
                      {getPaymentTypeLabel(p.payment_type)?.split(" (")[0]}
                    </span>
                    {p.account && (
                      <span className="text-xs text-muted-foreground">
                        {getAccountLabel(p.account)}
                      </span>
                    )}
                  </div>
                  {/* eslint-disable-next-line no-nested-ternary */}
                  {p.payment_type !== "bill" && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Pencil"
                        iconSize={12}
                        onClick={() => handleEditPayment(p)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        iconName="Trash2"
                        iconSize={12}
                        className="text-error"
                        onClick={() => handleDeletePayment(p.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const paymentsSubTabs = [
    { id: "deposit", label: "Deposit", icon: "Wallet" },
    { id: "penalty_refund", label: "Penalty and Refund", icon: "AlertCircle" },
  ];

  const renderPaymentsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 p-1 bg-muted/50 rounded-lg">
          {paymentsSubTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPaymentsSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                paymentsSubTab === tab.id
                  ? "bg-card text-primary shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
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
      </div>

      <div className="mt-4">
        {paymentsSubTab === "deposit" &&
          renderLedgerSection(
            "Deposit Transaction",
            "deposit",
            owner?.depositAmount,
            depositByAccount,
            depositPayments,
            paymentsLoading,
          )}
        {paymentsSubTab === "penalty_refund" &&
          renderLedgerSection(
            "Penalty and Refund Transaction",
            "penalty",
            owner?.outstandingBalance,
            penaltyByAccount,
            penaltyPayments.filter((p) => p.payment_type !== "bill"),
            paymentsLoading,
          )}
      </div>

      <TransactionModal
        isOpen={transactionModalOpen}
        ledger={transactionModalLedger}
        initialForm={{
          paymentType: paymentForm.paymentType,
          account: paymentForm.account,
          paymentAmount: paymentForm.paymentAmount,
          paymentDate: paymentForm.paymentDate,
          paymentMethod: paymentForm.paymentMethod,
          referenceNumber: paymentForm.referenceNumber,
          notes: paymentForm.notes,
        }}
        isEdit={Boolean(editingPaymentId)}
        submitting={paymentFormSubmitting}
        onClose={() => {
          setTransactionModalOpen(false);
          setEditingPaymentId(null);
          setPaymentForm({
            ledger: "deposit",
            paymentType: "deposit_due",
            account: "",
            paymentAmount: "",
            paymentDate: new Date().toISOString().split("T")[0],
            paymentMethod: "",
            referenceNumber: "",
            notes: "",
            screenshot: null,
          });
        }}
        onSubmit={handleTransactionModalSubmit}
      />
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
    <div className="h-full flex flex-col min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-border bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={22} className="text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-foreground truncate">
                  {owner?.name || "Owner"}
                </h2>
                {owner?.tvpId && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {owner.tvpId}
                  </span>
                )}
                {owner?.status && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border border-border capitalize ${getStatusColor(owner.status)}`}
                  >
                    {owner.status.replace("_", " ")}
                  </span>
                )}
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                  {owner?.category === "double_driver"
                    ? "Double driver"
                    : "Single driver"}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Icon
                    name="AlertCircle"
                    size={12}
                    className={
                      (owner?.outstandingBalance ?? 0) > 0
                        ? "text-error"
                        : "text-emerald-600 dark:text-emerald-400"
                    }
                  />
                  OS:{" "}
                  <span
                    className={`font-medium ${
                      (owner?.outstandingBalance ?? 0) > 0
                        ? "text-error"
                        : "text-emerald-600 dark:text-emerald-400"
                    }`}
                  >
                    {formatCurrency(Math.abs(owner?.outstandingBalance ?? 0))}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="Wallet" size={12} className="text-success" />
                  Deposit:{" "}
                  <span className="text-foreground font-medium">
                    {formatCurrency(owner?.depositAmount ?? 0)}
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
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
              iconSize={18}
              className="rounded-full hover:bg-muted"
            />
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="flex-shrink-0 px-4 pt-2 border-b border-border bg-muted/30">
        <nav className="flex gap-1 overflow-x-auto whitespace-nowrap pb-px -mb-px scrollbar-thin">
          {tabs?.map((tab) => (
            <button
              key={tab?.id}
              onClick={() => setActiveTab(tab?.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-all flex-shrink-0 border-b-2 ${
                activeTab === tab?.id
                  ? "bg-card text-primary border-primary -mb-px"
                  : "text-muted-foreground hover:text-foreground border-transparent hover:border-border"
              }`}
            >
              <Icon name={tab?.icon} size={16} />
              <span>{tab?.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-5 bg-background">
        {renderTabContent()}
      </div>

      {/* Edit Bill modal - rendered here so it opens from Bills tab */}
      {showBillEditModal && editingBill && (
        <BillEditModal
          bill={editingBill}
          vehicles={[]}
          onClose={() => {
            setShowBillEditModal(false);
            setEditingBill(null);
          }}
          onSave={handleBillUpdate}
          loading={billEditLoading}
        />
      )}
    </div>
  );
};

export default OwnerDetailPanel;
