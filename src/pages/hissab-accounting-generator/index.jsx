import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";

// Import components
import ParameterForm from "./components/ParameterForm";
import CalculationEngine from "./components/CalculationEngine";
import ReportPreview from "./components/ReportPreview";
import ProgressTracker from "./components/ProgressTracker";
import TemplateManager from "./components/TemplateManager";
import HissabGenerator from "./components/HissabGenerator";
import HissabPreview from "./components/HissabPreview";

const HissabAccountingGenerator = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("parameters");

  // Form and calculation states
  const [parameters, setParameters] = useState({});
  const [calculations, setCalculations] = useState({});
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [savedTemplates, setSavedTemplates] = useState([]);

  // Hissab Generator states
  const [hissabPreviewData, setHissabPreviewData] = useState(null);
  const [hissabLoading, setHissabLoading] = useState(false);

  // Mock report generation
  const generateReport = useCallback(async () => {
    if (
      !parameters?.selectedOwners?.length ||
      !parameters?.startDate ||
      !parameters?.endDate
    ) {
      alert("Please configure all required parameters first");
      return;
    }

    setIsGenerating(true);
    setProcessingStatus("processing");
    setCurrentStep(2);

    // Simulate processing delay
    setTimeout(() => {
      const mockReportData = {
        totalOwners: parameters?.selectedOwners?.length,
        summary: {
          totalRevenue: calculations?.totalRevenue || 45750,
          totalTrips: calculations?.totalTrips || 2340,
          netOutstanding: 8920,
          activeVehicles: parameters?.selectedOwners?.reduce(
            (sum, owner) => sum + owner?.vehicleCount,
            0
          ),
        },
        owners: parameters?.selectedOwners?.map((owner, index) => ({
          id: owner?.value,
          name: owner?.label?.split(" - ")?.[1],
          vehicleCount: owner?.vehicleCount,
          dailyRent: owner?.vehicleCount * 45,
          trips: owner?.vehicleCount * 8 * 7, // 8 trips per day for 7 days
          earnings:
            owner?.vehicleCount * 45 * 7 + owner?.vehicleCount * 8 * 7 * 2.5,
          outstanding: Math.random() * 1000 + 200,
        })),
        breakdown: {
          dailyRent: calculations?.totalRevenue * 0.7 || 32025,
          bonuses: calculations?.totalRevenue * 0.2 || 9150,
          incentives: calculations?.totalRevenue * 0.1 || 4575,
          documentCharges: 500,
        },
        deductions: {
          tolls: 1200,
          penalties: 800,
          fines: 450,
          accidents: 300,
        },
      };

      setReportData(mockReportData);
      setIsGenerating(false);
      setProcessingStatus("completed");
      setCurrentStep(3);
      setActiveTab("preview");
    }, 3000);
  }, [parameters, calculations]);

  const handleParameterChange = useCallback((newParameters) => {
    setParameters(newParameters);
    if (
      newParameters?.selectedOwners?.length > 0 &&
      newParameters?.startDate &&
      newParameters?.endDate
    ) {
      setCurrentStep(2);
    } else {
      setCurrentStep(1);
    }
  }, []);

  const handleCalculationUpdate = useCallback((newCalculations) => {
    setCalculations(newCalculations);
  }, []);

  const handleExport = (format) => {
    if (!reportData) return;

    // Mock export functionality
    const filename = `hissab_report_${
      new Date()?.toISOString()?.split("T")?.[0]
    }.${format}`;
    console.log(`Exporting report as ${format}:`, filename);

    // In a real app, this would trigger actual file download
    alert(`Report exported as ${format?.toUpperCase()}: ${filename}`);
    setCurrentStep(4);
  };

  const handleSaveReport = () => {
    if (!reportData) return;

    console.log("Saving report:", reportData);
    alert("Report saved successfully!");
  };

  const handleSaveTemplate = (template) => {
    setSavedTemplates((prev) => [...prev, template]);
    alert(`Template "${template?.name}" saved successfully!`);
  };

  const handleLoadTemplate = (template) => {
    setParameters((prev) => ({
      ...prev,
      ...template?.parameters,
    }));
    alert(`Template "${template?.name}" loaded successfully!`);
  };

  const handleDeleteTemplate = (templateId) => {
    setSavedTemplates((prev) => prev?.filter((t) => t?.id !== templateId));
    alert("Template deleted successfully!");
  };

  const handleHissabExport = async (format) => {
    if (!hissabPreviewData) return;

    try {
      setHissabLoading(true);
      const { generateMultiVehicleInvoiceHTML, createMultiVehicleBill } =
        await import("../../lib/tvpManagementAPI");

      // Generate invoice HTML
      const invoiceHtml = generateMultiVehicleInvoiceHTML(hissabPreviewData);

      // Create bill record
      await createMultiVehicleBill({
        ...hissabPreviewData,
        invoiceHtml,
      });

      // Generate filename
      const ownerName = hissabPreviewData.owner.name.replace(/\s+/g, "_");
      const weekStart = hissabPreviewData.week.weekStart;
      const weekEnd = hissabPreviewData.week.weekEnd;
      const filename = `${ownerName}_${weekStart}_to_${weekEnd}.${
        format === "excel" ? "xlsx" : "pdf"
      }`;

      if (format === "pdf") {
        // Create a new window and print/download
        const printWindow = window.open("", "_blank");
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
        printWindow.focus();

        // Wait a bit for content to load, then trigger print
        setTimeout(() => {
          printWindow.print();
        }, 250);
      } else {
        // For Excel, you would need a library like xlsx
        alert(
          `Excel export functionality will be implemented. Filename: ${filename}`
        );
      }

      alert(`Invoice exported successfully! Filename: ${filename}`);
    } catch (error) {
      console.error("Error exporting hissab:", error);
      alert("Error exporting invoice: " + error.message);
    } finally {
      setHissabLoading(false);
    }
  };

  const handleHissabSaveDraft = async () => {
    if (!hissabPreviewData) return;

    try {
      setHissabLoading(true);
      const { createMultiVehicleBill } = await import(
        "../../lib/tvpManagementAPI"
      );

      await createMultiVehicleBill({
        ...hissabPreviewData,
        invoiceHtml: null, // Draft doesn't need HTML
      });

      alert("Draft saved successfully!");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Error saving draft: " + error.message);
    } finally {
      setHissabLoading(false);
    }
  };

  const tabs = [
    { id: "parameters", label: "Parameters", icon: "Settings" },
    { id: "calculations", label: "Calculations", icon: "Calculator" },
    { id: "preview", label: "Preview", icon: "Eye" },
    { id: "templates", label: "Templates", icon: "Save" },
    { id: "hissab_generator", label: "Hissab Generator", icon: "FileText" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Hissab Accounting Generator"
        subtitle="Automated financial reporting and calculation engine for TVP operations"
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
        <div className="p-4 lg:p-6 max-w-7xl mx-auto">
          {/* Action Buttons */}
          <div className="mb-6 flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => navigate("/executive-dashboard")}
              iconName="ArrowLeft"
              iconPosition="left"
              iconSize={16}
            >
              Back to Dashboard
            </Button>

            <Button
              variant="default"
              onClick={generateReport}
              disabled={isGenerating || !parameters?.selectedOwners?.length}
              loading={isGenerating}
              iconName="Play"
              iconPosition="left"
              iconSize={16}
            >
              Generate Report
            </Button>
          </div>

          {/* Progress Tracker */}
          <div className="mb-6">
            <ProgressTracker
              currentStep={currentStep}
              totalSteps={4}
              processingStatus={processingStatus}
            />
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-border">
              <nav className="flex space-x-8">
                {tabs?.map((tab) => (
                  <button
                    key={tab?.id}
                    onClick={() => setActiveTab(tab?.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab?.id
                        ? "border-primary text-primary"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                    }`}
                  >
                    <Icon name={tab?.icon} size={16} />
                    <span>{tab?.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === "parameters" && (
              <ParameterForm
                onParameterChange={handleParameterChange}
                savedTemplates={savedTemplates}
              />
            )}

            {activeTab === "calculations" && (
              <CalculationEngine
                selectedOwners={parameters?.selectedOwners || []}
                dateRange={{
                  startDate: parameters?.startDate,
                  endDate: parameters?.endDate,
                }}
                onCalculationUpdate={handleCalculationUpdate}
                calculations={calculations}
              />
            )}

            {activeTab === "preview" && (
              <ReportPreview
                reportData={reportData}
                isGenerating={isGenerating}
                onExport={handleExport}
                onSave={handleSaveReport}
              />
            )}

            {activeTab === "templates" && (
              <TemplateManager
                templates={savedTemplates}
                onSaveTemplate={handleSaveTemplate}
                onLoadTemplate={handleLoadTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                currentParameters={parameters}
              />
            )}

            {activeTab === "hissab_generator" &&
              (hissabPreviewData ? (
                <HissabPreview
                  previewData={hissabPreviewData}
                  onEdit={() => setHissabPreviewData(null)}
                  onExport={handleHissabExport}
                  onSaveDraft={handleHissabSaveDraft}
                  loading={hissabLoading}
                />
              ) : (
                <HissabGenerator
                  onPreview={setHissabPreviewData}
                  onSave={handleHissabSaveDraft}
                />
              ))}
          </div>

          {/* Quick Actions Panel */}
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-card border border-border rounded-lg shadow-lg p-4">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab("parameters")}
                  iconName="Settings"
                  iconSize={16}
                  disabled={activeTab === "parameters"}
                >
                  Configure
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateReport}
                  disabled={isGenerating || !parameters?.selectedOwners?.length}
                  iconName="Play"
                  iconSize={16}
                >
                  Generate
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExport("pdf")}
                  disabled={!reportData}
                  iconName="Download"
                  iconSize={16}
                >
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HissabAccountingGenerator;
