import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import LoadingSpinner from "./LoadingSpinner";

const ProtectedRoute = ({
  children,
  requiredPermissions = [],
  requiredRoles = [],
}) => {
  const { isAuthenticated, isLoading, currentUser, hasPermission, hasRole } =
    useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role requirements
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have the required role to access this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Required roles: {requiredRoles.join(", ")}
          </p>
          <p className="text-sm text-muted-foreground">
            Your role: {currentUser?.roleName || "Unknown"}
          </p>
        </div>
      </div>
    );
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && !hasPermission(requiredPermissions)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold text-foreground">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have the required permissions to access this page.
          </p>
          <p className="text-sm text-muted-foreground">
            Required permissions: {requiredPermissions.join(", ")}
          </p>
          <p className="text-sm text-muted-foreground">
            Your permissions: {currentUser?.permissions?.join(", ") || "None"}
          </p>
        </div>
      </div>
    );
  }

  // User is authenticated and has required permissions/roles
  return children;
};

export default ProtectedRoute;
