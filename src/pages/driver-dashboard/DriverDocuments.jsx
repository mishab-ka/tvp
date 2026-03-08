import React, { useState, useRef } from "react";
import Icon from "../../components/AppIcon";
import MobileHeader from "./components/MobileHeader";
import { uploadDriverDocument, addDriverUberPhoto } from "../../lib/tvpManagementAPI";

const DOCS = [
  { key: "aadharFront", label: "Aadhaar Front", prop: "aadharFrontUrl" },
  { key: "aadharBack", label: "Aadhaar Back", prop: "aadharBackUrl" },
  { key: "licenseFront", label: "Driving License Front", prop: "licenseFrontUrl" },
  { key: "licenseBack", label: "Driving License Back", prop: "licenseBackUrl" },
];

export default function DriverDocuments({ driver }) {
  const initialDocs = driver?.documents || {};
  const [documents, setDocuments] = useState(initialDocs);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(driver?.profilePhotoUrl || null);
  const [uberPhotos, setUberPhotos] = useState(driver?.uberDriverPhotos ? [...driver.uberDriverPhotos] : []);
  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState(null);
  const fileRefs = useRef({});

  const updateDocUrl = (prop, url) => {
    setDocuments((prev) => ({ ...prev, [prop]: url }));
  };

  const handleFile = async (formKey, file, prop) => {
    if (!file?.length || !driver?.id) return;
    const f = file[0];
    setUploading(formKey);
    setError(null);
    try {
      const url = await uploadDriverDocument(driver.id, formKey, f);
      if (prop === "profilePhotoUrl") setProfilePhotoUrl(url);
      else updateDocUrl(prop, url);
    } catch (err) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(null);
      if (fileRefs.current[formKey]) fileRefs.current[formKey].value = "";
    }
  };

  const handleUberPhotos = async (files) => {
    if (!files?.length || !driver?.id) return;
    setUploading("uberProfile");
    setError(null);
    try {
      const newUrls = [];
      for (let i = 0; i < files.length; i++) {
        const url = await addDriverUberPhoto(driver.id, files[i]);
        if (url) newUrls.push(url);
      }
      if (newUrls.length) setUberPhotos((prev) => [...prev, ...newUrls]);
    } catch (err) {
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(null);
      if (fileRefs.current.uberProfile) fileRefs.current.uberProfile.value = "";
    }
  };

  return (
    <div className="min-h-full bg-muted/30">
      <MobileHeader title="Documents" />
      <div className="p-4 space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload and manage your documents. Verification is done by admin.
        </p>
        {error && (
          <div className="rounded-lg bg-destructive/10 text-destructive text-sm p-3">
            {error}
          </div>
        )}
        {DOCS.map((doc) => {
          const url = documents[doc.prop];
          const verified = !!url;
          const isUploading = uploading === doc.key;
          return (
            <div
              key={doc.key}
              className="rounded-xl bg-card border border-border shadow-sm p-4 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      verified ? "bg-success/15" : "bg-muted"
                    }`}
                  >
                    <Icon
                      name="FileText"
                      size={20}
                      className={verified ? "text-success" : "text-muted-foreground"}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{doc.label}</p>
                    <p
                      className={`text-xs font-medium ${
                        verified ? "text-success" : "text-muted-foreground"
                      }`}
                    >
                      {verified ? "Uploaded" : "Not uploaded"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {verified && (
                    <>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-primary font-medium px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/10"
                      >
                        View
                      </a>
                      <label className="text-sm text-muted-foreground font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                        Change
                        <input
                          ref={(el) => (fileRefs.current[doc.key] = el)}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={(e) => handleFile(doc.key, e.target.files, doc.prop)}
                          disabled={isUploading}
                        />
                      </label>
                    </>
                  )}
                  {!verified && (
                    <label className="text-sm text-primary font-medium px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/10 cursor-pointer">
                      {isUploading ? "Uploading…" : "Upload"}
                      <input
                        ref={(el) => (fileRefs.current[doc.key] = el)}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => handleFile(doc.key, e.target.files, doc.prop)}
                        disabled={isUploading}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div className="rounded-xl bg-card border border-border shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="Image" size={20} className="text-primary" />
                )}
              </div>
              <div>
                <p className="font-medium text-foreground">Profile Photo</p>
                <p className="text-xs text-muted-foreground">Optional</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {profilePhotoUrl && (
                <a
                  href={profilePhotoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary font-medium px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/10"
                >
                  View
                </a>
              )}
              <label className="text-sm text-muted-foreground font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                {uploading === "profilePhoto" ? "Uploading…" : profilePhotoUrl ? "Change" : "Upload"}
                <input
                  ref={(el) => (fileRefs.current.profilePhoto = el)}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile("profilePhoto", e.target.files, "profilePhotoUrl")}
                  disabled={uploading === "profilePhoto"}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Uber profile - multiple photos */}
        <div className="rounded-xl bg-card border border-border shadow-sm p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon name="Image" size={20} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">Uber profile</p>
                <p className="text-xs text-muted-foreground">
                  {uberPhotos.length ? `${uberPhotos.length} photo(s) uploaded` : "You can upload multiple photos"}
                </p>
              </div>
            </div>
            <label className="text-sm text-primary font-medium px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/10 cursor-pointer shrink-0">
              {uploading === "uberProfile" ? "Uploading…" : "Upload"}
              <input
                ref={(el) => (fileRefs.current.uberProfile = el)}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleUberPhotos(e.target.files)}
                disabled={uploading === "uberProfile"}
              />
            </label>
          </div>
          {uberPhotos.length > 0 && (
            <div className="space-y-2 mt-2">
              <p className="text-xs text-muted-foreground">Tap View to open in new tab</p>
              <div className="grid grid-cols-3 gap-2">
                {uberPhotos.map((url, idx) => (
                  <div key={idx} className="rounded-lg overflow-hidden border border-border bg-muted/30">
                    <div className="aspect-square relative">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-center text-xs text-primary font-medium py-1.5 hover:bg-primary/5"
                    >
                      View
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
