import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import Icon from "../../components/AppIcon";
import { getTVPOwnerDetails } from "../../lib/tvpManagementAPI";
import DriverHome from "./DriverHome";
import DriverProfile from "./DriverProfile";
import DriverEditProfile from "./DriverEditProfile";
import DriverDocuments from "./DriverDocuments";
import DriverBills from "./DriverBills";
import DriverPaymentHistory from "./DriverPaymentHistory";
import DriverOutstanding from "./DriverOutstanding";
import DriverSupport from "./DriverSupport";

export const DriverContext = React.createContext(null);

function DriverLayoutContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.id) {
      setLoading(false);
      return;
    }
    getTVPOwnerDetails(currentUser.id)
      .then(setDriver)
      .catch(() => setDriver(null))
      .finally(() => setLoading(false));
  }, [currentUser?.id]);

  const path = location.pathname;
  const isHome = path === "/driver" || path === "/driver/";
  const isProfile = path.startsWith("/driver/profile");
  const isPaymentHistory = path.startsWith("/driver/payment-history");

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!driver && currentUser?.id) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4 max-w-md mx-auto">
        <p className="text-muted-foreground text-center mb-4">Driver profile could not be loaded.</p>
        <button
          type="button"
          onClick={() => window.location.href = "/login"}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium"
        >
          Back to login
        </button>
      </div>
    );
  }

  let page = null;
  if (path === "/driver" || path === "/driver/") {
    page = <DriverHome driver={driver} />;
  } else if (path === "/driver/profile/edit") {
    page = <DriverEditProfile driver={driver} />;
  } else if (path === "/driver/profile") {
    page = <DriverProfile driver={driver} />;
  } else if (path === "/driver/documents") {
    page = <DriverDocuments driver={driver} />;
  } else if (path === "/driver/bills") {
    page = <DriverBills driver={driver} />;
  } else if (path === "/driver/payment-history") {
    page = <DriverPaymentHistory driver={driver} />;
  } else if (path === "/driver/outstanding") {
    page = <DriverOutstanding driver={driver} />;
  } else if (path === "/driver/support") {
    page = <DriverSupport driver={driver} />;
  } else {
    page = <DriverHome driver={driver} />;
  }

  return (
    <DriverContext.Provider value={driver}>
      <div className="min-h-screen bg-muted/30 flex flex-col max-w-md mx-auto shadow-lg bg-background">
        <main className="flex-1 overflow-y-auto pb-20 min-h-0">
          {page}
        </main>
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card border-t border-border flex items-center justify-around py-2 safe-area-pb z-10">
          <button
            type="button"
            onClick={() => navigate("/driver")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              isHome ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon name="Home" size={24} />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/driver/profile")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              isProfile ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon name="User" size={24} />
            <span className="text-xs font-medium">Profile</span>
          </button>
          <button
            type="button"
            onClick={() => navigate("/driver/payment-history")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              isPaymentHistory ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon name="Wallet" size={24} />
            <span className="text-xs font-medium">Payment History</span>
          </button>
        </nav>
      </div>
    </DriverContext.Provider>
  );
}

const DriverLayout = () => <DriverLayoutContent />;

export default DriverLayout;
