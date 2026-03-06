import React, { useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";

const CARD = "bg-card rounded-2xl border border-border/80 shadow-sm overflow-hidden";
const PADDING = "p-6";
const BOX = "rounded-xl border border-border/80 bg-muted/30 p-4";
const SECTION_TITLE = "text-xl font-bold text-foreground";

const DOCUMENT_TYPES = [
  { value: "aadhaar", label: "Aadhaar", icon: "CreditCard" },
  { value: "license", label: "License", icon: "IdCard" },
  { value: "insurance", label: "Insurance", icon: "Shield" },
  { value: "registration", label: "Registration", icon: "FileCheck" },
  { value: "contract", label: "Contract", icon: "FileSignature" },
  { value: "financial", label: "Financial", icon: "Wallet" },
  { value: "other", label: "Other", icon: "File" },
];

const DocumentsTab = ({
  documents,
  onDocumentUpload,
  onDocumentUpdate,
  onDocumentDelete,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadCategory, setUploadCategory] = useState(null);
  const [uploadData, setUploadData] = useState({
    category: "license",
    description: "",
    expiryDate: "",
  });

  const filteredBySearch = documents?.filter(
    (doc) =>
      doc?.name?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
      doc?.description?.toLowerCase()?.includes(searchTerm?.toLowerCase()),
  );

  const handleDrag = (e) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (e?.type === "dragenter" || e?.type === "dragover") setDragActive(true);
    else if (e?.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e, category) => {
    e?.preventDefault();
    e?.stopPropagation();
    setDragActive(false);
    if (e?.dataTransfer?.files?.[0]) {
      handleFileUpload(e.dataTransfer.files[0], category);
    }
  };

  const handleFileUpload = (file, category) => {
    const doc = {
      id: `DOC${String(documents?.length + 1)?.padStart(3, "0")}`,
      name: file?.name,
      category: category ?? uploadData?.category,
      description: uploadData?.description || file?.name,
      size: file?.size,
      type: file?.type,
      uploadDate: new Date()?.toISOString()?.split("T")?.[0],
      expiryDate: uploadData?.expiryDate,
      status: "pending",
      version: 1,
      url: URL.createObjectURL(file),
    };
    onDocumentUpload(doc);
    setUploadData({ category: "license", description: "", expiryDate: "" });
    setUploadCategory(null);
  };

  const getDocumentIcon = (type) => {
    if (type?.includes("pdf")) return "FileText";
    if (type?.includes("image")) return "Image";
    return "File";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "approved":
        return "bg-success/15 text-success border border-success/30";
      case "pending":
        return "bg-warning/15 text-warning border border-warning/30";
      case "rejected":
        return "bg-destructive/15 text-destructive border border-destructive/30";
      case "expired":
        return "bg-destructive/15 text-destructive border border-destructive/30";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const diffDays = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate) => {
    return expiryDate && new Date(expiryDate) < new Date();
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className={CARD}>
        <div className={PADDING}>
          <h2 className={`${SECTION_TITLE} mb-4 flex items-center gap-3`}>
            <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon name="FileText" size={22} className="text-primary" />
            </span>
            Document Management
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 max-w-md">
              <label className="flex items-center gap-2 text-sm font-semibold text-foreground mb-1.5">
                <Icon name="Search" size={16} className="text-muted-foreground" />
                Search documents
              </label>
              <Input
                type="search"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e?.target?.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upload form (when a category is selected for upload) */}
      {uploadCategory && (
        <div className={CARD}>
          <div className={PADDING}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`${SECTION_TITLE} flex items-center gap-3`}>
                <Icon name="Upload" size={24} className="text-primary" />
                Upload {DOCUMENT_TYPES.find((t) => t.value === uploadCategory)?.label}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setUploadCategory(null)} iconName="X" iconSize={18}>
                <span className="sr-only">Close</span>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Input
                label="Description"
                type="text"
                value={uploadData?.description}
                onChange={(e) => setUploadData((p) => ({ ...p, description: e?.target?.value }))}
                placeholder="Optional description"
              />
              <Input
                label="Expiry date (optional)"
                type="date"
                value={uploadData?.expiryDate}
                onChange={(e) => setUploadData((p) => ({ ...p, expiryDate: e?.target?.value }))}
              />
            </div>
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-border/80 bg-muted/20"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={(e) => handleDrop(e, uploadCategory)}
            >
              <Icon name="Upload" size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="text-base font-semibold text-foreground mb-1">Drop file here or click to upload</p>
              <p className="text-sm text-muted-foreground mb-4">PDF, DOC, DOCX, JPG, PNG up to 10MB</p>
              <input
                type="file"
                onChange={(e) => e?.target?.files?.[0] && handleFileUpload(e.target.files[0], uploadCategory)}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                className="hidden"
                id="file-upload-docs"
              />
              <label htmlFor="file-upload-docs">
                <Button variant="outline" type="button" asChild>
                  <span>Choose file</span>
                </Button>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Document type cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DOCUMENT_TYPES.map(({ value, label, icon }) => {
          const typeDocs = (searchTerm ? filteredBySearch : documents)?.filter((d) => d?.category === value) ?? [];
          return (
            <div key={value} className={CARD}>
              <div className={PADDING}>
                <div className="flex items-center justify-between gap-4 mb-4 pb-4 border-b border-border/60">
                  <h3 className={`${SECTION_TITLE} flex items-center gap-3`}>
                    <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon name={icon} size={22} className="text-primary" />
                    </span>
                    {label}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUploadData((p) => ({ ...p, category: value }));
                      setUploadCategory(value);
                    }}
                    iconName="Upload"
                    iconPosition="left"
                    iconSize={14}
                  >
                    Upload
                  </Button>
                </div>
                <div className="space-y-3">
                  {typeDocs.length === 0 ? (
                    <div
                      className={`${BOX} border-dashed text-center py-8 cursor-pointer hover:bg-muted/50 transition-colors`}
                      onClick={() => {
                        setUploadData((p) => ({ ...p, category: value }));
                        setUploadCategory(value);
                      }}
                    >
                      <Icon name="FilePlus" size={32} className="mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm font-semibold text-foreground">No {label.toLowerCase()} uploaded</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Click or upload above to add</p>
                    </div>
                  ) : (
                    typeDocs.map((doc) => (
                      <div key={doc?.id} className={`${BOX} flex items-center justify-between gap-4`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-10 h-10 rounded-xl bg-background border border-border/80 flex items-center justify-center shrink-0">
                            <Icon name={getDocumentIcon(doc?.type)} size={20} className="text-muted-foreground" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate">{doc?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(doc?.size)} · {doc?.uploadDate}
                              {doc?.expiryDate &&
                                ` · Expires ${doc.expiryDate}${isExpired(doc.expiryDate) ? " (Expired)" : isExpiringSoon(doc.expiryDate) ? " (Soon)" : ""}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${getStatusColor(doc?.status)}`}>
                            {doc?.status}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            iconName="Download"
                            iconSize={14}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => onDocumentDelete(doc?.id)}
                            iconName="Trash2"
                            iconSize={14}
                          >
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(!documents?.length || (searchTerm && !filteredBySearch?.length)) && (
        <div className={CARD}>
          <div className="p-12 text-center border border-dashed border-border/80 rounded-2xl bg-muted/20">
            <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-lg font-bold text-foreground mb-1">No documents found</p>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? "Try a different search." : "Upload documents using the cards above."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsTab;
