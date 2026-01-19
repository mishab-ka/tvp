import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleBasedRedirect from "./components/RoleBasedRedirect";
import TVPOwnerProfileDetail from "./pages/tvp-owner-profile-detail";
import AuthenticationRoleSelection from "./pages/authentication-role-selection";
import ExecutiveDashboard from "./pages/executive-dashboard";
import TVPOwnersManagement from "./pages/tvp-owners-management";
import HissabAccountingGenerator from "./pages/hissab-accounting-generator";
import AdminUserManagement from "./pages/admin-user-management";
import TVPOwnerDashboard from "./pages/tvp-owner-dashboard";
import VehicleManagement from "./pages/vehicle-management";
import Dashboard from "./pages/dashboard";
import BulkBillGenerator from "./pages/bulk-bill-generator";
import AdminSettings from "./pages/admin-settings";

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ScrollToTop />
        <RouterRoutes>
          {/* Public routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Default dashboard route - redirects based on role */}
          <Route path="/executive-dashboard" element={<RoleBasedRedirect />} />

          {/* Main Dashboard Landing Page */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredPermissions={["dashboard_view"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected routes with authentication and role-based access */}
          <Route
            path="/authentication-role-selection"
            element={
              <ProtectedRoute>
                <AuthenticationRoleSelection />
              </ProtectedRoute>
            }
          />

          <Route
            path="/executive-dashboard"
            element={
              <ProtectedRoute requiredPermissions={["dashboard_view"]}>
                <ExecutiveDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tvp-owners-management"
            element={
              <ProtectedRoute requiredPermissions={["tvp_management"]}>
                <TVPOwnersManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tvp-owner-profile-detail"
            element={
              <ProtectedRoute requiredPermissions={["tvp_management"]}>
                <TVPOwnerProfileDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/hissab-accounting-generator"
            element={
              <ProtectedRoute requiredPermissions={["financial_reports"]}>
                <HissabAccountingGenerator />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-user-management"
            element={
              <ProtectedRoute requiredPermissions={["user_management"]}>
                <AdminUserManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/tvp-owner-dashboard"
            element={
              <ProtectedRoute requiredPermissions={["cars_list"]}>
                <TVPOwnerDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehicle-management"
            element={
              <ProtectedRoute requiredPermissions={["vehicle_management"]}>
                <VehicleManagement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/bulk-bill-generator"
            element={
              <ProtectedRoute requiredPermissions={["tvp_management"]}>
                <BulkBillGenerator />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin-settings"
            element={
              <ProtectedRoute requiredPermissions={["system_settings"]}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* 404 route */}
          <Route path="*" element={<NotFound />} />
        </RouterRoutes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
