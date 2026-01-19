import React, { useCallback, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";

const PDFUploadSection = ({ onFileUpload, loading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const pdfFile = files.find(file => file.type === "application/pdf" || file.name.endsWith(".pdf"));
    
    if (pdfFile) {
      setSelectedFile(pdfFile);
      onFileUpload(pdfFile);
    }
  }, [onFileUpload]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.endsWith(".pdf"))) {
      setSelectedFile(file);
      onFileUpload(file);
    }
  }, [onFileUpload]);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Upload PDF Bill Document
      </h3>
      
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50"
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".pdf,application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="pdf-upload-input"
          disabled={loading}
        />
        
        <Icon
          name="FileText"
          size={48}
          className="mx-auto mb-4 text-muted-foreground"
        />
        
        <p className="text-lg font-medium text-foreground mb-2">
          {selectedFile ? selectedFile.name : "Drop PDF file here or click to browse"}
        </p>
        
        <p className="text-sm text-muted-foreground mb-4">
          Upload a PDF document containing bill data. The system will automatically extract vehicle information and generate draft bills.
        </p>
        
        <label htmlFor="pdf-upload-input">
          <Button
            variant="outline"
            as="span"
            disabled={loading}
            iconName="Upload"
            iconPosition="left"
          >
            {selectedFile ? "Upload Another File" : "Select PDF File"}
          </Button>
        </label>
        
        {loading && (
          <div className="mt-4 flex items-center justify-center gap-2 text-primary">
            <Icon name="Loader2" size={20} className="animate-spin" />
            <span className="text-sm">Processing PDF...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFUploadSection;



