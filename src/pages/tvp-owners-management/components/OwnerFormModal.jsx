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

  return (
    <div className="fixed inset-0 z-200 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              {formattedMode}
            </h3>
            <p className="text-sm text-muted-foreground">
              Enter the owner’s onboarding details. Required files: Aadhaar and
              driving license scans.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            iconName="X"
            iconSize={18}
            onClick={onClose}
            disabled={submitting}
          />
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto">
          <div className="grid gap-6 p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Full Name"
                placeholder="e.g., Abdul Rahman"
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e?.target?.value)}
                required
                error={errors.name}
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="+966 5X XXX XXXX"
                value={formData.phone}
                onChange={(e) => handleFieldChange("phone", e?.target?.value)}
                required
                error={errors.phone}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Alternative Phone 1 (optional)"
                type="tel"
                placeholder="+966 5X XXX XXXX"
                value={formData.alternativePhone1}
                onChange={(e) => handleFieldChange("alternativePhone1", e?.target?.value)}
              />
              <Input
                label="Alternative Phone 2 (optional)"
                type="tel"
                placeholder="+966 5X XXX XXXX"
                value={formData.alternativePhone2}
                onChange={(e) => handleFieldChange("alternativePhone2", e?.target?.value)}
              />
              <Input
                label="Alternative Phone 3 (optional)"
                type="tel"
                placeholder="+966 5X XXX XXXX"
                value={formData.alternativePhone3}
                onChange={(e) => handleFieldChange("alternativePhone3", e?.target?.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Email (optional)"
                type="email"
                placeholder="owner@domain.com"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e?.target?.value)}
              />
              <Input
                label="Address"
                placeholder="Street, City, Country"
                value={formData.address}
                onChange={(e) => handleFieldChange("address", e?.target?.value)}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Status"
                options={statusOptions}
                value={formData.status}
                onChange={(value) => handleFieldChange("status", value)}
                placeholder="Active"
                required
              />
              <Select
                label="Category"
                options={categoryOptions}
                value={formData.category}
                onChange={(value) => handleFieldChange("category", value)}
                placeholder="Single Driver"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Deposit Amount (SAR)"
                type="number"
                min="0"
                step="0.01"
                value={formData.depositAmount}
                onChange={(e) =>
                  handleFieldChange("depositAmount", e?.target?.value)
                }
              />
              <Input
                label="Outstanding Balance (SAR)"
                type="number"
                min="0"
                step="0.01"
                value={formData.outstandingBalance}
                onChange={(e) =>
                  handleFieldChange("outstandingBalance", e?.target?.value)
                }
              />
              <Input
                label="Payment Delay Days"
                type="number"
                min="0"
                value={formData.paymentDelayDays}
                description="Total delayed payment days in the last 90 days"
                onChange={(e) =>
                  handleFieldChange("paymentDelayDays", e?.target?.value)
                }
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Input
                label="Room Deposit (SAR)"
                type="number"
                min="0"
                step="0.01"
                value={formData.roomDeposit}
                onChange={(e) =>
                  handleFieldChange("roomDeposit", e?.target?.value)
                }
              />
              <Input
                label="Pre-Paid Rent Amount (SAR)"
                type="number"
                min="0"
                step="0.01"
                value={formData.prePaidRentAmount}
                onChange={(e) =>
                  handleFieldChange("prePaidRentAmount", e?.target?.value)
                }
              />
              <Input
                label="Documents Charge (SAR)"
                type="number"
                min="0"
                step="0.01"
                value={formData.documentsCharge}
                onChange={(e) =>
                  handleFieldChange("documentsCharge", e?.target?.value)
                }
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <Checkbox
                id="including-room-form"
                checked={!!formData.includingRoom}
                onCheckedChange={(checked) =>
                  handleFieldChange("includingRoom", !!checked)
                }
                label="Including room — include room rent in bill generation"
              />
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Calculated Performance
              </p>
              <div className="mt-2 flex items-center space-x-3">
                <div className="text-3xl font-semibold text-foreground">
                  {computedPerformance}%
                </div>
                <span className="text-sm text-muted-foreground">
                  Based on reported payment delays
                </span>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-dashed border-border p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  Vehicle Numbers
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  iconName="Plus"
                  iconSize={14}
                  onClick={addVehicleField}
                >
                  Add Vehicle
                </Button>
              </div>
              {vehicleNumbers.map((value, index) => {
                // Filter out already selected vehicles from this field's options
                const availableOptions = activeVehicles.filter(
                  (vehicle) => !vehicleNumbers.some((v, i) => i !== index && v === vehicle.value)
                );
                
                return (
                  <div key={`vehicle-${index}`} className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        label={`Vehicle #${index + 1}`}
                        options={availableOptions}
                        value={value}
                        onChange={(val) => handleVehicleChange(index, val)}
                        placeholder={
                          loadingVehicles
                            ? "Loading vehicles..."
                            : "Select active vehicle"
                        }
                        required={index === 0}
                        searchable
                      />
                    </div>
                  {vehicleNumbers.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6 h-10 w-10 text-error"
                      iconName="Trash2"
                      iconSize={16}
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

            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">
                Mandatory Documents
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {documentFields.map((doc) => (
                  <div key={doc.key} className="space-y-2 rounded-lg border border-border p-3">
                    <Input
                      type="file"
                      label={doc.label}
                      accept="image/*,application/pdf"
                      onChange={(e) =>
                        handleDocumentChange(doc.key, e?.target?.files?.[0])
                      }
                    />
                    {initialData?.documents?.[`${doc.key}Url`] && (
                      <a
                        href={initialData.documents[`${doc.key}Url`]}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center text-sm text-primary hover:underline"
                      >
                        <Icon name="ExternalLink" size={14} className="mr-2" />
                        View current file
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Uber Driver Profile Photos */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">
                Uber Driver Profile Photos (3 or more)
              </p>
              <div className="space-y-3">
                {/* Existing photos */}
                {initialData?.uberDriverPhotos && Array.isArray(initialData.uberDriverPhotos) && initialData.uberDriverPhotos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {initialData.uberDriverPhotos.map((photoUrl, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <img
                          src={photoUrl}
                          alt={`Uber driver ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border"
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
                          className="absolute top-1 right-1 bg-error text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Icon name="X" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* New photo uploads */}
                {uberDriverPhotos.filter(p => p instanceof File).length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {uberDriverPhotos.filter(p => p instanceof File).map((photo, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`New photo ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border border-border"
                        />
                        <button
                          type="button"
                          onClick={() => handleUberPhotoRemove(uberDriverPhotos.findIndex(p => p === photo))}
                          className="absolute top-1 right-1 bg-error text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Icon name="X" size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add photo button */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(file => handleUberPhotoAdd(file));
                      e.target.value = '';
                    }}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    You can upload multiple photos at once. Minimum 3 photos recommended.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-end space-x-3 border-t border-border px-6 py-4">
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
            {submitting ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Owner"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OwnerFormModal;

