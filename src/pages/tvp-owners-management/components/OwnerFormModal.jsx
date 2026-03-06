import React, { useEffect, useMemo, useState } from "react";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Select from "../../../components/ui/Select";
import { Checkbox } from "../../../components/ui/Checkbox";
import Icon from "../../../components/AppIcon";
import { getActiveVehicles } from "../../../lib/tvpManagementAPI";

const statusOptions = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
  { value: "under_review", label: "Under Review" },
];

const categoryOptions = [
  { value: "single_driver", label: "Single Driver" },
  { value: "double_driver", label: "Double Driver" },
];


const documentFields = [
  { key: "aadharFront", label: "Aadhaar Card (Front)" },
  { key: "aadharBack", label: "Aadhaar Card (Back)" },
  { key: "licenseFront", label: "Driving License (Front)" },
  { key: "licenseBack", label: "Driving License (Back)" },
];

const OwnerFormModal = ({
  isOpen,
  mode = "create",
  initialData = {},
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    alternativePhone1: "",
    alternativePhone2: "",
    alternativePhone3: "",
    address: "",
    status: "active",
    category: "single_driver",
    depositAmount: "",
    outstandingBalance: "",
    penaltyAmount: "",
    paymentDelayDays: 0,
    roomDeposit: "",
    prePaidRentAmount: "",
    documentsCharge: "",
    includingRoom: false,
  });
  const [vehicleNumbers, setVehicleNumbers] = useState([""]);
  const [activeVehicles, setActiveVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [documents, setDocuments] = useState({
    aadharFront: null,
    aadharBack: null,
    licenseFront: null,
    licenseBack: null,
  });
  const [uberDriverPhotos, setUberDriverPhotos] = useState([]);
  const [errors, setErrors] = useState({});

  const handleUberPhotoAdd = (file) => {
    if (!file) return;
    if (file.type && !file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }
    setUberDriverPhotos(prev => [...prev, file]);
  };

  const handleUberPhotoRemove = (index) => {
    setUberDriverPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleUberPhotoRemoveExisting = (index, photoUrls) => {
    const updated = [...photoUrls];
    updated.splice(index, 1);
    return updated;
  };

  const formattedMode = mode === "edit" ? "Edit TVP Owner" : "Add TVP Owner";

  // Include driver's current vehicles in options so they show as selected in edit mode
  // (they may not be in activeVehicles if inactive or from another source)
  const vehicleOptionsWithExisting = useMemo(() => {
    const fromApi = activeVehicles || [];
    const existing =
      (initialData?.vehicleNumbers && initialData.vehicleNumbers.length > 0
        ? initialData.vehicleNumbers
        : initialData?.vehicles?.map(
            (v) => v?.plateNumber || v?.car_number || v?.carNumber || v
          )) || [];
    const existingStrings = existing.filter((v) => v && String(v).trim());
    const notInApi = existingStrings.filter(
      (v) => !fromApi.some((o) => String(o?.value).trim() === String(v).trim())
    );
    const extra = notInApi.map((v) => ({
      value: String(v).trim(),
      label: String(v).trim(),
    }));
    return [...fromApi, ...extra];
  }, [activeVehicles, initialData?.vehicleNumbers, initialData?.vehicles]);

  const computedPerformance = useMemo(() => {
    const delay = Number(formData.paymentDelayDays) || 0;
    const score = Math.max(0, 100 - delay * 5);
    return Math.min(100, Math.round(score));
  }, [formData.paymentDelayDays]);

  // Load active vehicles when modal opens
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadActiveVehicles = async () => {
      try {
        setLoadingVehicles(true);
        const vehicles = await getActiveVehicles();
        const seen = new Set();
        const vehicleOptions = vehicles
          .filter((v) => {
            const key = v.car_number;
            if (!key || seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .map((v) => ({
            value: v.car_number,
            label: `${v.car_number}${v.fleet_name ? ` - ${v.fleet_name}` : ""}`,
          }));
        setActiveVehicles(vehicleOptions);
      } catch (err) {
        console.error("Error loading active vehicles:", err);
        setActiveVehicles([]);
      } finally {
        setLoadingVehicles(false);
      }
    };

    loadActiveVehicles();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "edit" && initialData) {
      setFormData({
        name: initialData?.name || "",
        email: initialData?.email || "",
        phone: initialData?.phone || "",
        alternativePhone1: initialData?.alternativePhone1 || "",
        alternativePhone2: initialData?.alternativePhone2 || "",
        alternativePhone3: initialData?.alternativePhone3 || "",
        address: initialData?.address || "",
        status: initialData?.status || "active",
        category: initialData?.category || "single_driver",
        depositAmount:
          typeof initialData?.depositAmount === "number"
            ? initialData.depositAmount.toString()
            : initialData?.depositAmount || "",
        outstandingBalance:
          typeof initialData?.outstandingBalance === "number"
            ? initialData.outstandingBalance.toString()
            : initialData?.outstandingBalance || "",
        penaltyAmount:
          typeof initialData?.penaltyAmount === "number"
            ? initialData.penaltyAmount.toString()
            : initialData?.penaltyAmount ?? "",
        paymentDelayDays: initialData?.paymentDelayDays || 0,
        roomDeposit:
          typeof initialData?.roomDeposit === "number"
            ? initialData.roomDeposit.toString()
            : initialData?.roomDeposit || "",
        prePaidRentAmount:
          typeof initialData?.prePaidRentAmount === "number"
            ? initialData.prePaidRentAmount.toString()
            : initialData?.prePaidRentAmount || "",
        documentsCharge:
          typeof initialData?.documentsCharge === "number"
            ? initialData.documentsCharge.toString()
            : initialData?.documentsCharge || "",
        includingRoom: !!initialData?.includingRoom,
      });

      const existingVehicles =
        (initialData?.vehicleNumbers && initialData.vehicleNumbers.length > 0
          ? initialData.vehicleNumbers
          : initialData?.vehicles?.map(
              (vehicle) =>
                vehicle?.car_number ||
                vehicle?.plateNumber ||
                vehicle?.carNumber ||
                vehicle
            )) || [];
      setVehicleNumbers(existingVehicles.length > 0 ? existingVehicles : [""]);
      setDocuments({
        aadharFront: null,
        aadharBack: null,
        licenseFront: null,
        licenseBack: null,
      });
      setUberDriverPhotos(initialData?.uberDriverPhotos || []);
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        alternativePhone1: "",
        alternativePhone2: "",
        alternativePhone3: "",
        address: "",
        status: "active",
        category: "single_driver",
        depositAmount: "",
        outstandingBalance: "",
        penaltyAmount: "",
        paymentDelayDays: 0,
        roomDeposit: "",
        prePaidRentAmount: "",
        documentsCharge: "",
        includingRoom: false,
      });
      setVehicleNumbers([""]);
      setDocuments({
        aadharFront: null,
        aadharBack: null,
        licenseFront: null,
        licenseBack: null,
      });
      setUberDriverPhotos([]);
    }
    setErrors({});
  }, [isOpen, mode, initialData]);

  if (!isOpen) {
    return null;
  }

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVehicleChange = (index, value) => {
    setVehicleNumbers((prev) => {
      const updated = [...prev];
      updated[index] = value || "";
      return updated;
    });
  };

  const addVehicleField = () => {
    setVehicleNumbers((prev) => [...prev, ""]);
  };

  const removeVehicleField = (index) => {
    setVehicleNumbers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleDocumentChange = (key, file) => {
    setDocuments((prev) => ({
      ...prev,
      [key]: file || null,
    }));
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.name?.trim()) {
      nextErrors.name = "Owner name is required";
    }
    if (!formData.phone?.trim()) {
      nextErrors.phone = "Phone number is required";
    }
    const cleanedVehicles = vehicleNumbers
      .map((v) => v?.trim())
      .filter((v) => v);
    if (cleanedVehicles.length === 0) {
      nextErrors.vehicles = "Enter at least one vehicle number";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    const cleanedVehicles = vehicleNumbers
      .map((value) => value?.trim())
      .filter((value) => value);

    onSubmit({
      ...formData,
      depositAmount: parseFloat(formData.depositAmount) || 0,
      outstandingBalance: parseFloat(formData.outstandingBalance) || 0,
      penaltyAmount: parseFloat(formData.penaltyAmount) || 0,
      paymentDelayDays: Number(formData.paymentDelayDays) || 0,
      roomDeposit: parseFloat(formData.roomDeposit) || 0,
      prePaidRentAmount: parseFloat(formData.prePaidRentAmount) || 0,
      documentsCharge: parseFloat(formData.documentsCharge) || 0,
      includingRoom: !!formData.includingRoom,
      performance: computedPerformance,
      vehicleNumbers: cleanedVehicles,
      documents,
      existingDocuments: initialData?.documents || {},
      uberDriverPhotos: uberDriverPhotos.filter(photo => photo instanceof File),
      existingUberPhotos: Array.isArray(initialData?.uberDriverPhotos) 
        ? initialData.uberDriverPhotos.filter(url => typeof url === 'string')
        : [],
    });
  };

  const inputClass = "border-border/60 bg-muted/5 focus-visible:ring-primary/30";

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/50 px-4 py-4">
      <div className="w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden">
        {/* Header — lit theme */}
        <div className="flex items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Icon name={mode === "edit" ? "UserCog" : "UserPlus"} size={22} className="text-primary" />
            </span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-foreground truncate">
                {formattedMode}
              </h3>
              <p className="text-sm text-muted-foreground truncate">
                Required: Aadhaar & driving license scans.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            iconSize={18}
            onClick={onClose}
            disabled={submitting}
            className="shrink-0"
          />
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid  gap-5 p-5">
            {/* Left column */}
            <div className="space-y-5">
              {/* Contact */}
              <section className="rounded-xl border border-border/80 bg-muted/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2 bg-primary/5">
                  <Icon name="Phone" size={16} className="text-primary shrink-0" />
                  <h4 className="text-sm font-bold text-foreground">Contact</h4>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Full Name"
                      placeholder="e.g., Abdul Rahman"
                      value={formData.name}
                      onChange={(e) => handleFieldChange("name", e?.target?.value)}
                      required
                      error={errors.name}
                      className={inputClass}
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      placeholder="+966 5X XXX XXXX"
                      value={formData.phone}
                      onChange={(e) => handleFieldChange("phone", e?.target?.value)}
                      required
                      error={errors.phone}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      label="Alt. Phone 1"
                      type="tel"
                      placeholder="+966…"
                      value={formData.alternativePhone1}
                      onChange={(e) => handleFieldChange("alternativePhone1", e?.target?.value)}
                      className={inputClass}
                    />
                    <Input
                      label="Alt. Phone 2"
                      type="tel"
                      placeholder="+966…"
                      value={formData.alternativePhone2}
                      onChange={(e) => handleFieldChange("alternativePhone2", e?.target?.value)}
                      className={inputClass}
                    />
                    <Input
                      label="Alt. Phone 3"
                      type="tel"
                      placeholder="+966…"
                      value={formData.alternativePhone3}
                      onChange={(e) => handleFieldChange("alternativePhone3", e?.target?.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Email"
                      type="email"
                      placeholder="owner@domain.com"
                      value={formData.email}
                      onChange={(e) => handleFieldChange("email", e?.target?.value)}
                      className={inputClass}
                    />
                    <Input
                      label="Address"
                      placeholder="Street, City, Country"
                      value={formData.address}
                      onChange={(e) => handleFieldChange("address", e?.target?.value)}
                      className={inputClass}
                    />
                  </div>
                </div>
              </section>

              {/* Status & Category */}
              <section className="rounded-xl border border-border/80 bg-muted/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2 bg-primary/5">
                  <Icon name="User" size={16} className="text-primary shrink-0" />
                  <h4 className="text-sm font-bold text-foreground">Status & Category</h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <Select
                    label="Status"
                    options={statusOptions}
                    value={formData.status}
                    onChange={(value) => handleFieldChange("status", value)}
                    placeholder="Active"
                    required
                    className={inputClass}
                  />
                  <Select
                    label="Category"
                    options={categoryOptions}
                    value={formData.category}
                    onChange={(value) => handleFieldChange("category", value)}
                    placeholder="Single Driver"
                    required
                    className={inputClass}
                  />
                </div>
              </section>

              {/* Financial */}
              <section className="rounded-xl border border-border/80 bg-muted/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2 bg-primary/5">
                  <Icon name="DollarSign" size={16} className="text-primary shrink-0" />
                  <h4 className="text-sm font-bold text-foreground">Financial</h4>
                </div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      label="Deposit (SAR)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.depositAmount}
                      onChange={(e) => handleFieldChange("depositAmount", e?.target?.value)}
                      className={inputClass}
                    />
                    <Input
                      label="Outstanding (SAR)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.outstandingBalance}
                      onChange={(e) => handleFieldChange("outstandingBalance", e?.target?.value)}
                      className={inputClass}
                    />
                    <Input
                      label="Payment Delay Days"
                      type="number"
                      min="0"
                      value={formData.paymentDelayDays}
                      description="Last 90 days"
                      onChange={(e) => handleFieldChange("paymentDelayDays", e?.target?.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      label="Penalty (INR)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.penaltyAmount}
                      description="Next bill"
                      onChange={(e) => handleFieldChange("penaltyAmount", e?.target?.value)}
                      className={inputClass}
                    />
                    <Input
                      label="Room Deposit (SAR)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.roomDeposit}
                      onChange={(e) => handleFieldChange("roomDeposit", e?.target?.value)}
                      className={inputClass}
                    />
                    <Input
                      label="Pre-Paid Rent (SAR)"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.prePaidRentAmount}
                      onChange={(e) => handleFieldChange("prePaidRentAmount", e?.target?.value)}
                      className={inputClass}
                    />
                  </div>
                  <Input
                    label="Documents Charge (SAR)"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.documentsCharge}
                    onChange={(e) => handleFieldChange("documentsCharge", e?.target?.value)}
                    className={inputClass}
                  />
                </div>
              </section>

              {/* Options & Performance */}
              <section className="rounded-xl border border-border/80 bg-muted/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2 bg-primary/5">
                  <Icon name="Settings" size={16} className="text-primary shrink-0" />
                  <h4 className="text-sm font-bold text-foreground">Options & Performance</h4>
                </div>
                <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <Checkbox
                    id="including-room-form"
                    checked={!!formData.includingRoom}
                    onCheckedChange={(checked) =>
                      handleFieldChange("includingRoom", !!checked)
                    }
                    label="Including room — include room rent in bill generation"
                  />
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">Performance</span>
                    <span className="text-2xl font-bold text-primary tabular-nums">{computedPerformance}%</span>
                    <span className="text-xs text-muted-foreground">(payment delays)</span>
                  </div>
                </div>
              </section>
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {/* Vehicles */}
              <section className="rounded-xl border border-border/80 bg-muted/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/60 flex items-center justify-between gap-2 bg-primary/5">
                  <div className="flex items-center gap-2">
                    <Icon name="Car" size={16} className="text-primary shrink-0" />
                    <h4 className="text-sm font-bold text-foreground">Vehicle Numbers</h4>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    iconName="Plus"
                    iconSize={14}
                    onClick={addVehicleField}
                  >
                    Add
                  </Button>
                </div>
                <div className="p-4 space-y-2">
                  {vehicleNumbers.map((value, index) => {
                    const availableOptions = vehicleOptionsWithExisting.filter(
                      (vehicle) => !vehicleNumbers.some((v, i) => i !== index && v === vehicle.value)
                    );
                    return (
                      <div key={`vehicle-${index}`} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <Select
                            label={index === 0 ? "Vehicle #1" : `#${index + 1}`}
                            options={availableOptions}
                            value={value}
                            onChange={(val) => handleVehicleChange(index, val)}
                            placeholder={
                              loadingVehicles ? "Loading…" : "Select vehicle"
                            }
                            required={index === 0}
                            searchable
                            className={inputClass}
                          />
                        </div>
                        {vehicleNumbers.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="mt-6 h-9 w-9 text-destructive hover:bg-destructive/10"
                            iconName="Trash2"
                            iconSize={14}
                            onClick={() => removeVehicleField(index)}
                          />
                        )}
                      </div>
                    );
                  })}
                  {errors.vehicles && (
                    <p className="text-sm text-destructive">{errors.vehicles}</p>
                  )}
                </div>
              </section>

              {/* Mandatory Documents */}
              <section className="rounded-xl border border-border/80 bg-muted/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2 bg-primary/5">
                  <Icon name="FileText" size={16} className="text-primary shrink-0" />
                  <h4 className="text-sm font-bold text-foreground">Mandatory Documents</h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  {documentFields.map((doc) => (
                    <div key={doc.key} className="space-y-1.5">
                      <Input
                        type="file"
                        label={doc.label}
                        accept="image/*,application/pdf"
                        onChange={(e) =>
                          handleDocumentChange(doc.key, e?.target?.files?.[0])
                        }
                        className={inputClass}
                      />
                      {initialData?.documents?.[`${doc.key}Url`] && (
                        <a
                          href={initialData.documents[`${doc.key}Url`]}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-xs text-primary hover:underline"
                        >
                          <Icon name="ExternalLink" size={12} className="mr-1 shrink-0" />
                          View current
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Uber Driver Profile Photos */}
              <section className="rounded-xl border border-border/80 bg-muted/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2 bg-primary/5">
                  <Icon name="Image" size={16} className="text-primary shrink-0" />
                  <h4 className="text-sm font-bold text-foreground">Uber Driver Photos (3+)</h4>
                </div>
                <div className="p-4 space-y-3">
                  {initialData?.uberDriverPhotos && Array.isArray(initialData.uberDriverPhotos) && initialData.uberDriverPhotos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {initialData.uberDriverPhotos.map((photoUrl, index) => (
                        <div key={`existing-${index}`} className="relative group">
                          <img
                            src={photoUrl}
                            alt={`Uber ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-border/60"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const existing = initialData.uberDriverPhotos.filter((_, i) => i !== index);
                              setUberDriverPhotos(prev => {
                                const filePhotos = prev.filter(p => p instanceof File);
                                return [...filePhotos, ...existing];
                              });
                            }}
                            className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Icon name="X" size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {uberDriverPhotos.filter(p => p instanceof File).length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {uberDriverPhotos.filter(p => p instanceof File).map((photo, index) => (
                        <div key={`new-${index}`} className="relative group">
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`New ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-border/60"
                          />
                          <button
                            type="button"
                            onClick={() => handleUberPhotoRemove(uberDriverPhotos.findIndex(p => p === photo))}
                            className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Icon name="X" size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => handleUberPhotoAdd(file));
                      e.target.value = "";
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-border/60 bg-muted/5 text-sm text-foreground file:mr-2 file:rounded file:border-0 file:bg-primary/20 file:px-3 file:py-1 file:text-xs file:font-medium file:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <p className="text-xs text-muted-foreground">
                    Multiple at once. Min 3 recommended.
                  </p>
                </div>
              </section>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-border/60 bg-muted/10 shrink-0">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={submitting}
            iconName={mode === "edit" ? "Save" : "UserPlus"}
            iconPosition="left"
          >
            {submitting ? "Saving…" : mode === "edit" ? "Save Changes" : "Create Owner"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OwnerFormModal;

