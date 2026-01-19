import React, { useCallback, useState } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import WeekSelector, { calculatePreviousWeek } from "../../hissab-accounting-generator/components/WeekSelector";

const CSVUploadSection = ({ onFileUpload, loading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [weekRange, setWeekRange] = useState(calculatePreviousWeek());

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
    const csvFile = files.find(file => 
      file.type === "text/csv" || 
      file.name.endsWith(".csv") ||
      file.type === "application/vnd.ms-excel"
    );
    
    if (csvFile) {
      setSelectedFile(csvFile);
      onFileUpload(csvFile, weekRange);
    }
  }, [onFileUpload, weekRange]);

  const handleFileSelect = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file && (
      file.type === "text/csv" || 
      file.name.endsWith(".csv") ||
      file.type === "application/vnd.ms-excel"
    )) {
      setSelectedFile(file);
      onFileUpload(file, weekRange);
    }
  }, [onFileUpload, weekRange]);

  const handleWeekChange = useCallback((newWeek) => {
    setWeekRange(newWeek);
    // If file is already selected, re-upload with new week range
    if (selectedFile) {
      onFileUpload(selectedFile, newWeek);
    }
  }, [selectedFile, onFileUpload]);

  return (
    <div className="space-y-6">
      {/* Week Selector */}
      <WeekSelector value={weekRange} onChange={handleWeekChange} />

      {/* CSV Upload Section */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Upload CSV Bill Document
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
            accept=".csv,text/csv,application/vnd.ms-excel"
            onChange={handleFileSelect}
            className="hidden"
            id="csv-upload-input"
            disabled={loading}
          />
          
          <Icon
            name="FileSpreadsheet"
            size={48}
            className="mx-auto mb-4 text-muted-foreground"
          />
          
          <p className="text-lg font-medium text-foreground mb-2">
            {selectedFile ? selectedFile.name : "Drop CSV file here or click to browse"}
          </p>
          
          <p className="text-sm text-muted-foreground mb-4">
            Upload a CSV file containing bill data. The system will automatically extract vehicle information and generate draft bills for the selected week.
          </p>
          
          <label htmlFor="csv-upload-input">
            <Button
              variant="outline"
              as="span"
              disabled={loading}
              iconName="Upload"
              iconPosition="left"
            >
              {selectedFile ? "Upload Another File" : "Select CSV File"}
            </Button>
          </label>
          
          {loading && (
            <div className="mt-4 flex items-center justify-center gap-2 text-primary">
              <Icon name="Loader2" size={20} className="animate-spin" />
              <span className="text-sm">Processing CSV...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVUploadSection;
