import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

const RoleBasedRedirect = () => {
  const navigate = useNavigate();
  const { currentUser, hasPermission, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Show loading while checking authentication
    if (isLoading) {
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Determine the appropriate dashboard based on user permissions
    if (hasPermission(["user_management"])) {
      // Super Admin or Admin - can access user management
      navigate("/admin-user-management");
    } else if (hasPermission(["tvp_management"])) {
      // TVP Management users
      navigate("/tvp-owners-management");
    } else if (hasPermission(["cars_list"])) {
      // TVP Owner - redirect to TVP Owner Dashboard
      navigate("/tvp-owner-dashboard");
    } else if (hasPermission(["dashboard_view"])) {
      // Regular users with dashboard access
      navigate("/executive-dashboard");
    } else if (hasPermission(["financial_reports"])) {
      // Users with financial access
      navigate("/hissab-accounting-generator");
    } else {
      // Fallback - redirect to executive dashboard
      navigate("/executive-dashboard");
    }
  }, [currentUser, hasPermission, isAuthenticated, isLoading, navigate]);

  // Show loading spinner while checking authentication or redirecting
  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return <LoadingSpinner message="Redirecting to your dashboard..." />;
};

export default RoleBasedRedirect;
