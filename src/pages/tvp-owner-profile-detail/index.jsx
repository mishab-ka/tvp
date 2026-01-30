import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ProfileHeader from "./components/ProfileHeader";
import TabNavigation from "./components/TabNavigation";
import OverviewTab from "./components/OverviewTab";
import VehiclesTab from "./components/VehiclesTab";
import FinancialsTab from "./components/FinancialsTab";
import DocumentsTab from "./components/DocumentsTab";
import ActivityTab from "./components/ActivityTab";
import { getTVPOwnerDetails, updateTVPOwner } from "../../lib/tvpManagementAPI";
import { useAuth } from "../../contexts/AuthContext";

const TVPOwnerProfileDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real data for TVP Owner
  const [ownerData, setOwnerData] = useState(null);

  // Load TVP owner data
  const loadOwnerData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!isAuthenticated) {
        throw new Error("User not authenticated");
      }

      if (!id) {
        throw new Error("No owner ID provided");
      }

      const data = await getTVPOwnerDetails(id);
      setOwnerData(data);
    } catch (err) {
      console.error("Error loading TVP owner data:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerData();
  }, [id, isAuthenticated]);

  const [financialData, setFinancialData] = useState({
    totalDeposits: 15000,
    outstandingBalance: 2500,
    monthlyEarnings: 4200,
    availableBalance: 12500,
    transactions: [
      {
        id: "TXN0001",
        type: "deposit",
        amount: 5000,
        description: "Initial security deposit",
        date: "2023-01-15",
        timestamp: "2023-01-15T10:30:00Z",
        status: "completed",
        account: "letzryd",
      },
      {
        id: "TXN0002",
        type: "deposit",
        amount: 3000,
        description: "Additional vehicle deposit",
        date: "2023-03-10",
        timestamp: "2023-03-10T14:20:00Z",
        status: "completed",
        account: "tawaaq_fleet",
      },
      {
        id: "TXN0003",
        type: "withdrawal",
        amount: 1200,
        description: "Vehicle maintenance costs",
        date: "2024-11-20",
        timestamp: "2024-11-20T09:15:00Z",
        status: "completed",
        account: "letzryd",
      },
      {
        id: "TXN0004",
        type: "penalty",
        amount: 250,
        description: "Late payment penalty",
        date: "2024-12-05",
        timestamp: "2024-12-05T16:45:00Z",
        status: "completed",
        account: "cash_in_hand",
      },
      {
        id: "TXN0005",
        type: "deposit",
        amount: 2000,
        description: "Monthly earnings deposit",
        date: "2025-01-15",
        timestamp: "2025-01-15T11:00:00Z",
        status: "completed",
        account: "cash_in_hand",
      },
    ],
    upcomingPayments: [
      {
        id: "PAY001",
        description: "Monthly vehicle fee",
        amount: 800,
        dueDate: "2025-02-01",
        status: "pending",
      },
      {
        id: "PAY002",
        description: "Insurance premium",
        amount: 450,
        dueDate: "2025-02-15",
        status: "pending",
      },
      {
        id: "PAY003",
        description: "Vehicle inspection fee",
        amount: 120,
        dueDate: "2025-03-01",
        status: "pending",
      },
    ],
  });

  const [documents, setDocuments] = useState([
    {
      id: "DOC001",
      name: "Driver_License_Michael_Rodriguez.pdf",
      category: "license",
      description: "Valid driver's license",
      size: 2048576,
      type: "application/pdf",
      uploadDate: "2023-01-15",
      expiryDate: "2027-01-15",
      status: "approved",
      version: 1,
      url: "#",
    },
    {
      id: "DOC002",
      name: "Vehicle_Insurance_Policy.pdf",
      category: "insurance",
      description: "Comprehensive vehicle insurance",
      size: 1536000,
      type: "application/pdf",
      uploadDate: "2023-01-20",
      expiryDate: "2025-01-20",
      status: "approved",
      version: 2,
      url: "#",
    },
    {
      id: "DOC003",
      name: "Vehicle_Registration_ABC1234.jpg",
      category: "registration",
      description: "Vehicle registration certificate",
      size: 3072000,
      type: "image/jpeg",
      uploadDate: "2023-01-20",
      expiryDate: "2026-01-20",
      status: "approved",
      version: 1,
      url: "#",
    },
    {
      id: "DOC004",
      name: "TVP_Owner_Contract.docx",
      category: "contract",
      description: "Signed TVP owner agreement",
      size: 512000,
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      uploadDate: "2023-01-15",
      expiryDate: null,
      status: "approved",
      version: 1,
      url: "#",
    },
    {
      id: "DOC005",
      name: "Bank_Statement_December.pdf",
      category: "financial",
      description: "Monthly bank statement",
      size: 1024000,
      type: "application/pdf",
      uploadDate: "2025-01-05",
      expiryDate: null,
      status: "pending",
      version: 1,
      url: "#",
    },
  ]);

  const [activities, setActivities] = useState([
    {
      id: "ACT001",
      type: "profile",
      description: "Profile information updated",
      details: "Emergency contact number changed",
      user: "Admin User",
      timestamp: "2025-01-20T14:30:00Z",
      ipAddress: "192.168.1.100",
      changes: {
        "Emergency Contact": {
          from: "+1 (555) 999-8888",
          to: "+1 (555) 987-6543",
        },
      },
    },
    {
      id: "ACT002",
      type: "vehicle",
      description: "Vehicle VEH003 status changed to maintenance",
      details: "Scheduled maintenance for Nissan Altima",
      user: "System",
      timestamp: "2025-01-10T09:15:00Z",
      ipAddress: "system",
      changes: {
        "Vehicle Status": {
          from: "active",
          to: "maintenance",
        },
      },
    },
    {
      id: "ACT003",
      type: "financial",
      description: "New deposit transaction added",
      details: "Monthly earnings deposit of $2,000",
      user: "Finance Team",
      timestamp: "2025-01-15T11:00:00Z",
      ipAddress: "192.168.1.105",
    },
    {
      id: "ACT004",
      type: "document",
      description: "New document uploaded",
      details: "Bank statement for December 2024",
      user: "Michael Rodriguez",
      timestamp: "2025-01-05T16:20:00Z",
      ipAddress: "203.0.113.45",
    },
    {
      id: "ACT005",
      type: "system",
      description: "Profile accessed",
      details: "Profile viewed by admin user",
      user: "Admin User",
      timestamp: "2025-01-23T10:45:00Z",
      ipAddress: "192.168.1.100",
    },
    {
      id: "ACT006",
      type: "financial",
      description: "Penalty applied",
      details: "Late payment penalty of $250",
      user: "System",
      timestamp: "2024-12-05T16:45:00Z",
      ipAddress: "system",
    },
    {
      id: "ACT007",
      type: "vehicle",
      description: "New vehicle assigned",
      details: "Honda Accord (XYZ-5678) assigned to owner",
      user: "Fleet Manager",
      timestamp: "2023-03-10T13:30:00Z",
      ipAddress: "192.168.1.102",
      changes: {
        "Vehicle Assignment": {
          from: "Unassigned",
          to: "VEH002 - Honda Accord",
        },
      },
    },
    {
      id: "ACT008",
      type: "profile",
      description: "Account status changed",
      details: "Account activated after verification",
      user: "Verification Team",
      timestamp: "2023-01-16T12:00:00Z",
      ipAddress: "192.168.1.103",
      changes: {
        "Account Status": {
          from: "pending",
          to: "active",
        },
      },
    },
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleStatusChange = (newStatus) => {
    setOwnerData((prev) => ({
      ...prev,
      status: newStatus,
    }));

    // Add activity log
    const newActivity = {
      id: `ACT${String(activities?.length + 1)?.padStart(3, "0")}`,
      type: "profile",
      description: `Owner status changed to ${newStatus}`,
      details: `Status updated from ${ownerData?.status} to ${newStatus}`,
      user: "Admin User",
      timestamp: new Date()?.toISOString(),
      ipAddress: "192.168.1.100",
      changes: {
        Status: {
          from: ownerData?.status,
          to: newStatus,
        },
      },
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleOwnerUpdate = (updatedData) => {
    const changes = {};
    Object.keys(updatedData)?.forEach((key) => {
      if (ownerData?.[key] !== updatedData?.[key]) {
        changes[key] = {
          from: ownerData?.[key],
          to: updatedData?.[key],
        };
      }
    });

    setOwnerData((prev) => ({
      ...prev,
      ...updatedData,
    }));

    if (Object.keys(changes)?.length > 0) {
      const newActivity = {
        id: `ACT${String(activities?.length + 1)?.padStart(3, "0")}`,
        type: "profile",
        description: "Profile information updated",
        details: `Updated: ${Object.keys(changes)?.join(", ")}`,
        user: "Admin User",
        timestamp: new Date()?.toISOString(),
        ipAddress: "192.168.1.100",
        changes,
      };

      setActivities((prev) => [newActivity, ...prev]);
    }
  };

  const handleIncludingRoomChange = async (checked) => {
    if (!ownerData?.id) return;
    try {
      await updateTVPOwner(ownerData.id, { includingRoom: !!checked });
      await loadOwnerData();
    } catch (err) {
      console.error("Failed to update including room:", err);
      setError(err?.message || "Failed to update");
    }
  };

  const handleVehicleAdd = (vehicleData) => {
    setOwnerData((prev) => ({
      ...prev,
      vehicles: [...prev?.vehicles, vehicleData],
    }));

    const newActivity = {
      id: `ACT${String(activities?.length + 1)?.padStart(3, "0")}`,
      type: "vehicle",
      description: "New vehicle assigned",
      details: `${vehicleData?.make} ${vehicleData?.model} (${vehicleData?.plateNumber}) assigned`,
      user: "Admin User",
      timestamp: new Date()?.toISOString(),
      ipAddress: "192.168.1.100",
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleVehicleUpdate = (vehicleId, updates) => {
    setOwnerData((prev) => ({
      ...prev,
      vehicles: prev?.vehicles?.map((vehicle) =>
        vehicle?.id === vehicleId ? { ...vehicle, ...updates } : vehicle
      ),
    }));

    const vehicle = ownerData?.vehicles?.find((v) => v?.id === vehicleId);
    const newActivity = {
      id: `ACT${String(activities?.length + 1)?.padStart(3, "0")}`,
      type: "vehicle",
      description: `Vehicle ${vehicleId} updated`,
      details: `${vehicle?.make} ${vehicle?.model} information modified`,
      user: "Admin User",
      timestamp: new Date()?.toISOString(),
      ipAddress: "192.168.1.100",
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleVehicleRemove = (vehicleId) => {
    const vehicle = ownerData?.vehicles?.find((v) => v?.id === vehicleId);

    setOwnerData((prev) => ({
      ...prev,
      vehicles: prev?.vehicles?.filter((v) => v?.id !== vehicleId),
    }));

    const newActivity = {
      id: `ACT${String(activities?.length + 1)?.padStart(3, "0")}`,
      type: "vehicle",
      description: "Vehicle removed",
      details: `${vehicle?.make} ${vehicle?.model} (${vehicle?.plateNumber}) removed from assignment`,
      user: "Admin User",
      timestamp: new Date()?.toISOString(),
      ipAddress: "192.168.1.100",
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleTransactionAdd = (transaction) => {
    setFinancialData((prev) => ({
      ...prev,
      transactions: [transaction, ...prev?.transactions],
      totalDeposits:
        transaction?.type === "deposit"
          ? prev?.totalDeposits + transaction?.amount
          : prev?.totalDeposits,
      availableBalance:
        transaction?.type === "deposit"
          ? prev?.availableBalance + transaction?.amount
          : prev?.availableBalance - transaction?.amount,
    }));

    const newActivity = {
      id: `ACT${String(activities?.length + 1)?.padStart(3, "0")}`,
      type: "financial",
      description: `New ${transaction?.type} transaction added`,
      details: `${
        transaction?.description
      } - $${transaction?.amount?.toLocaleString()}`,
      user: "Admin User",
      timestamp: new Date()?.toISOString(),
      ipAddress: "192.168.1.100",
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleTransactionUpdate = (transactionId, updates) => {
    setFinancialData((prev) => ({
      ...prev,
      transactions: prev?.transactions?.map((transaction) =>
        transaction?.id === transactionId
          ? { ...transaction, ...updates }
          : transaction
      ),
    }));

    const newActivity = {
      id: `ACT${String(activities?.length + 1)?.padStart(3, "0")}`,
      type: "financial",
      description: "Transaction updated",
      details: `Transaction ${transactionId} modified`,
      user: "Admin User",
      timestamp: new Date()?.toISOString(),
      ipAddress: "192.168.1.100",
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleDocumentUpload = (document) => {
    setDocuments((prev) => [document, ...prev]);

    const newActivity = {
      id: `ACT${String(activities?.length + 1)?.padStart(3, "0")}`,
      type: "document",
      description: "New document uploaded",
      details: `${document?.name} (${document?.category})`,
      user: "Admin User",
      timestamp: new Date()?.toISOString(),
      ipAddress: "192.168.1.100",
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleDocumentUpdate = (documentId, updates) => {
    setDocuments((prev) =>
      prev?.map((doc) =>
        doc?.id === documentId ? { ...doc, ...updates } : doc
      )
    );

    const newActivity = {
      id: `ACT${String(activities?.length + 1)?.padStart(3, "0")}`,
      type: "document",
      description: "Document updated",
      details: `Document ${documentId} status or information changed`,
      user: "Admin User",
      timestamp: new Date()?.toISOString(),
      ipAddress: "192.168.1.100",
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  const handleDocumentDelete = (documentId) => {
    const document = documents?.find((d) => d?.id === documentId);
    setDocuments((prev) => prev?.filter((doc) => doc?.id !== documentId));

    const newActivity = {
      id: `ACT${String(activities?.length + 1)?.padStart(3, "0")}`,
      type: "document",
      description: "Document deleted",
      details: `${document?.name} removed from records`,
      user: "Admin User",
      timestamp: new Date()?.toISOString(),
      ipAddress: "192.168.1.100",
    };

    setActivities((prev) => [newActivity, ...prev]);
  };

  const tabCounts = {
    vehicles: ownerData?.vehicles?.length,
    transactions: financialData?.transactions?.length,
    documents: documents?.length,
    activities: activities?.length,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading TVP owner profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
            <h3 className="text-red-800 font-medium mb-2">
              Error Loading Profile
            </h3>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => navigate("/tvp-owners-management")}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Back to TVP Owners
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ownerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-foreground font-medium mb-2">
            TVP Owner Not Found
          </h3>
          <p className="text-muted-foreground mb-4">
            The requested TVP owner profile could not be found.
          </p>
          <button
            onClick={() => navigate("/tvp-owners-management")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Back to TVP Owners
          </button>
        </div>
      </div>
    );
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return (
          <OverviewTab
            owner={ownerData}
            onUpdate={handleOwnerUpdate}
            onIncludingRoomChange={handleIncludingRoomChange}
          />
        );
      case "vehicles":
        return (
          <VehiclesTab
            vehicles={ownerData?.vehicles}
            onVehicleAdd={handleVehicleAdd}
            onVehicleUpdate={handleVehicleUpdate}
            onVehicleRemove={handleVehicleRemove}
          />
        );
      case "financials":
        return (
          <FinancialsTab
            financialData={financialData}
            onTransactionAdd={handleTransactionAdd}
            onTransactionUpdate={handleTransactionUpdate}
          />
        );
      case "documents":
        return (
          <DocumentsTab
            documents={documents}
            onDocumentUpload={handleDocumentUpload}
            onDocumentUpdate={handleDocumentUpdate}
            onDocumentDelete={handleDocumentDelete}
          />
        );
      case "activity":
        return (
          <ActivityTab activities={activities} onActivityFilter={() => {}} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ProfileHeader
        owner={ownerData}
        onStatusChange={handleStatusChange}
        onEdit={() => setActiveTab("overview")}
      />

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabCounts={tabCounts}
      />

      <main className="p-6">
        <div
          role="tabpanel"
          id={`${activeTab}-panel`}
          aria-labelledby={`${activeTab}-tab`}
        >
          {renderActiveTab()}
        </div>
      </main>
    </div>
  );
};

export default TVPOwnerProfileDetail;
