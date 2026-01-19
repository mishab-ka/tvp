import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/ui/Header";
import Sidebar from "../../components/ui/Sidebar";
import Icon from "../../components/AppIcon";
import Button from "../../components/ui/Button";

import UserDetailsPanel from "./components/UserDetailsPanel";
import BulkActionsToolbar from "./components/BulkActionsToolbar";
import FilterSidebar from "./components/FilterSidebar";
import UserDataGrid from "./components/UserDataGrid";
import AddUserModal from "./components/AddUserModal";
import { userManagementAPI } from "../../lib/supabase";

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterSidebarOpen, setFilterSidebarOpen] = useState(false);

  // Data states
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    ssoEnabled: 0,
    mfaEnabled: 0,
  });
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [usersPerPage] = useState(10);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    status: "",
    department: "",
    ssoEnabled: false,
    mfaEnabled: false,
    lastLoginDays: "",
  });

  const [savedFilters] = useState([
    {
      id: 1,
      name: "Active Admins",
      filters: { role: "admin", status: "active" },
    },
    { id: 2, name: "SSO Users", filters: { ssoEnabled: true } },
    { id: 3, name: "Recent Logins", filters: { lastLoginDays: "7" } },
  ]);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  // Load users when filters or page changes
  useEffect(() => {
    loadUsers();
  }, [filters, currentPage]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load data in parallel
      const [statsData, rolesData, departmentsData] = await Promise.all([
        userManagementAPI.getUserStats(),
        userManagementAPI.getRoles(),
        userManagementAPI.getDepartments(),
      ]);

      setUserStats(statsData);
      setRoles(rolesData);
      setDepartments(departmentsData);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load initial data:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await userManagementAPI.getUsers(
        currentPage,
        usersPerPage,
        filters
      );

      // Transform data to match the expected format
      const transformedUsers = result.users.map((user) => {
        console.log("Raw user data:", user); // Debug log

        // Handle user_profiles data (might be array or object)
        const profile = Array.isArray(user.user_profiles)
          ? user.user_profiles[0]
          : user.user_profiles;

        // Handle user_roles data (might be array or object)
        const role = Array.isArray(user.user_roles)
          ? user.user_roles[0]
          : user.user_roles;

        console.log("Extracted profile for user", user.id, ":", profile); // Debug log
        console.log("Extracted role for user", user.id, ":", role); // Debug log

        const transformedUser = {
          id: user.id,
          name: profile?.full_name || user.email,
          email: user.email,
          phone: profile?.phone || "",
          role: role?.role_name || "user",
          status: user.status,
          department: profile?.department || "",
          lastLogin: user.last_sign_in_at
            ? new Date(user.last_sign_in_at)
            : null,
          ssoEnabled: user.sso_enabled || false,
          mfaEnabled: user.mfa_enabled || false,
          sessionCount: 0, // We'll add this later if needed
          permissions: role?.permissions || [],
          createdAt: user.created_at,
          updatedAt: user.updated_at,
        };

        console.log("Transformed user", user.id, ":", transformedUser); // Debug log
        return transformedUser;
      });

      console.log("Transformed users:", transformedUsers); // Debug log

      setUsers(transformedUsers);
      setTotalUsers(result.total);
    } catch (err) {
      setError(err.message);
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
        setMobileFilterOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleUserSelect = (userId, selected) => {
    if (selected) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers?.filter((id) => id !== userId));
    }
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedUsers(filteredUsers?.map((user) => user?.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleUserClick = async (user) => {
    try {
      console.log("Clicked user:", user); // Debug log

      // Load full user data with profile for viewing
      const fullUser = await userManagementAPI.getUserById(user.id);
      console.log("Full user data loaded:", fullUser); // Debug log

      // Handle user_profiles data (might be array, object, or null)
      const profile = Array.isArray(fullUser.user_profiles)
        ? fullUser.user_profiles[0]
        : fullUser.user_profiles;

      // Handle user_roles data (might be array, object, or null)
      const role = Array.isArray(fullUser.user_roles)
        ? fullUser.user_roles[0]
        : fullUser.user_roles;

      console.log("Extracted profile:", profile); // Debug log
      console.log("Extracted role:", role); // Debug log

      // Transform the data to match the expected format for the panel
      const userWithProfile = {
        id: fullUser.id,
        name: profile?.full_name || fullUser.email,
        email: fullUser.email,
        phone: profile?.phone || "",
        role: role?.role_name || "user",
        roleId: fullUser.role_id,
        status: fullUser.status,
        department: profile?.department || "",
        lastLogin: fullUser.last_sign_in_at
          ? new Date(fullUser.last_sign_in_at)
          : null,
        ssoEnabled: fullUser.sso_enabled || false,
        mfaEnabled: fullUser.mfa_enabled || false,
        sessionCount: fullUser.user_sessions?.length || 0,
        permissions: role?.permissions || [],
        createdAt: fullUser.created_at,
        updatedAt: fullUser.updated_at,
        // Profile data
        avatarUrl: profile?.avatar_url || "",
        bio: profile?.bio || "",
      };

      console.log("User with profile for panel:", userWithProfile); // Debug log
      setSelectedUser(userWithProfile);
      setShowDetailsPanel(true);
    } catch (err) {
      console.error("Failed to load user details:", err);
      setError(err.message);
    }
  };

  const handleUserEdit = async (user) => {
    try {
      // Load full user data with profile for editing
      const fullUser = await userManagementAPI.getUserById(user.id);

      // Handle user_profiles data (might be array, object, or null)
      const profile = Array.isArray(fullUser.user_profiles)
        ? fullUser.user_profiles[0]
        : fullUser.user_profiles;

      // Handle user_roles data (might be array, object, or null)
      const role = Array.isArray(fullUser.user_roles)
        ? fullUser.user_roles[0]
        : fullUser.user_roles;

      // Transform the data to match the expected format for the panel
      const userWithProfile = {
        id: fullUser.id,
        name: profile?.full_name || fullUser.email,
        email: fullUser.email,
        phone: profile?.phone || "",
        role: role?.role_name || "user",
        roleId: fullUser.role_id,
        status: fullUser.status,
        department: profile?.department || "",
        lastLogin: fullUser.last_sign_in_at
          ? new Date(fullUser.last_sign_in_at)
          : null,
        ssoEnabled: fullUser.sso_enabled || false,
        mfaEnabled: fullUser.mfa_enabled || false,
        sessionCount: fullUser.user_sessions?.length || 0,
        permissions: role?.permissions || [],
        createdAt: fullUser.created_at,
        updatedAt: fullUser.updated_at,
        // Profile data
        avatarUrl: profile?.avatar_url || "",
        bio: profile?.bio || "",
      };

      setSelectedUser(userWithProfile);
      setShowDetailsPanel(true);
    } catch (err) {
      console.error("Failed to load user details:", err);
      setError(err.message);
    }
  };

  const handleUserSave = async (userData) => {
    try {
      setLoading(true);
      console.log("handleUserSave called with data:", userData); // Debug log

      if (userData.id) {
        // Update existing user
        const updateData = {
          email: userData.email,
          status: userData.status,
          ssoEnabled: userData.ssoEnabled,
          mfaEnabled: userData.mfaEnabled,
          roleId: userData.roleId,
          profile: {
            fullName: userData.name,
            phone: userData.phone,
            department: userData.department,
            avatarUrl: userData.avatarUrl,
            bio: userData.bio,
          },
        };

        console.log("Calling updateUser with data:", updateData); // Debug log
        await userManagementAPI.updateUser(userData.id, updateData);
        console.log("User updated successfully"); // Debug log
      } else {
        // Create new user
        await userManagementAPI.createUser({
          email: userData.email,
          password: userData.password,
          status: userData.status || "active",
          ssoEnabled: userData.ssoEnabled || false,
          mfaEnabled: userData.mfaEnabled || false,
          roleId: userData.roleId,
          profile: {
            fullName: userData.name,
            phone: userData.phone,
            department: userData.department,
            avatarUrl: userData.avatarUrl,
          },
        });
      }

      // Reload data
      console.log("Reloading data..."); // Debug log
      await loadUsers();
      await loadInitialData();

      setShowDetailsPanel(false);
      setSelectedUser(null);
      console.log("User save completed successfully"); // Debug log
    } catch (err) {
      console.error("Failed to save user:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (userData) => {
    try {
      setLoading(true);
      await userManagementAPI.createUser(userData);

      // Reload data
      await loadUsers();
      await loadInitialData();

      setShowAddUserModal(false);
    } catch (err) {
      console.error("Failed to create user:", err);
      throw err; // Re-throw to let the modal handle the error
    } finally {
      setLoading(false);
    }
  };

  const handleUserToggleStatus = async (user) => {
    try {
      setLoading(true);

      const newStatus = user.status === "active" ? "inactive" : "active";
      await userManagementAPI.updateUser(user.id, {
        status: newStatus,
      });

      // Reload data
      await loadUsers();
      await loadInitialData();
    } catch (err) {
      console.error("Failed to toggle user status:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUserResetPassword = async (user) => {
    try {
      setLoading(true);
      await userManagementAPI.resetUserPassword(user.email);
      // Show success message
      console.log("Password reset email sent to:", user.email);
    } catch (err) {
      console.error("Failed to reset password:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkAction = async (action, userIds) => {
    try {
      setLoading(true);

      switch (action) {
        case "activate":
          await userManagementAPI.bulkUpdateUsers(userIds, {
            status: "active",
          });
          break;
        case "deactivate":
          await userManagementAPI.bulkUpdateUsers(userIds, {
            status: "inactive",
          });
          break;
        case "suspend":
          await userManagementAPI.bulkUpdateUsers(userIds, {
            status: "suspended",
          });
          break;
        case "delete":
          // Delete users one by one (Supabase doesn't support bulk delete)
          for (const userId of userIds) {
            await userManagementAPI.deleteUser(userId);
          }
          break;
        default:
          console.log("Bulk action:", action, "for users:", userIds);
      }

      // Reload data
      await loadUsers();
      await loadInitialData();
      setSelectedUsers([]);
    } catch (err) {
      console.error("Bulk action failed:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFilter = (name, filterData) => {
    console.log("Saving filter:", name, filterData);
    // Implementation for saving filters
  };

  const handleAuditView = (user) => {
    console.log("Viewing audit for user:", user?.id);
    // Implementation for audit view
  };

  const handleSort = (column, order) => {
    setSortBy(column);
    setSortOrder(order);
  };

  const handleExportUsers = () => {
    console.log("Exporting users");
    // Implementation for exporting users
  };

  const appliedFiltersCount = Object.values(filters)?.filter(
    (value) => value !== "" && value !== false
  )?.length;

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon
            name="Loader2"
            size={48}
            className="text-primary animate-spin mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Loading Users
          </h3>
          <p className="text-muted-foreground">
            Please wait while we fetch the user data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Icon
            name="AlertTriangle"
            size={48}
            className="text-error mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Error Loading Data
          </h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadInitialData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        isMenuOpen={mobileMenuOpen}
      />

      <div className="flex h-screen pt-16">
        <div className="hidden lg:block">
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
        </div>

        <div className={`flex-1 flex flex-col transition-all duration-300 `}>
          <div className="flex flex-col lg:flex-row h-full">
            {/* Filter Sidebar */}
            {filterSidebarOpen && (
              <div className="hidden lg:block w-80 border-r border-border bg-card">
                <FilterSidebar
                  filters={filters}
                  onFiltersChange={setFilters}
                  onSaveFilter={handleSaveFilter}
                  savedFilters={savedFilters}
                  onClose={() => setFilterSidebarOpen(false)}
                  roles={roles}
                  departments={departments}
                />
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Header Section */}
              <div className="bg-card border-b border-border p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl lg:text-2xl font-bold text-foreground truncate">
                      User Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage system users, roles, and permissions
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={() => setFilterSidebarOpen(!filterSidebarOpen)}
                      iconName="Filter"
                      iconSize={16}
                      className="hidden lg:flex w-full sm:w-auto relative"
                    >
                      {filterSidebarOpen ? "Hide Filters" : "Show Filters"}
                      {appliedFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {appliedFiltersCount}
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setMobileFilterOpen(true)}
                      iconName="Filter"
                      iconSize={16}
                      className="lg:hidden w-full sm:w-auto relative"
                    >
                      Filters
                      {appliedFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {appliedFiltersCount}
                        </span>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleExportUsers}
                      iconName="Download"
                      iconSize={16}
                      className="w-full sm:w-auto"
                    >
                      Export
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => setShowAddUserModal(true)}
                      iconName="UserPlus"
                      iconSize={16}
                      className="w-full sm:w-auto"
                    >
                      Add User
                    </Button>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <div className="flex items-center space-x-3">
                      <Icon
                        name="Users"
                        size={20}
                        className="text-primary flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold text-foreground">
                          {userStats?.total}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total Users
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <div className="flex items-center space-x-3">
                      <Icon
                        name="UserCheck"
                        size={20}
                        className="text-success flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold text-foreground">
                          {userStats?.active}
                        </p>
                        <p className="text-sm text-muted-foreground">Active</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <div className="flex items-center space-x-3">
                      <Icon
                        name="Shield"
                        size={20}
                        className="text-warning flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold text-foreground">
                          {userStats?.ssoEnabled}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          SSO Enabled
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-background rounded-lg p-4 border border-border">
                    <div className="flex items-center space-x-3">
                      <Icon
                        name="Smartphone"
                        size={20}
                        className="text-accent flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-2xl font-bold text-foreground">
                          {userStats?.mfaEnabled}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          MFA Enabled
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Grid Section */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <BulkActionsToolbar
                  selectedUsers={selectedUsers}
                  onBulkAction={handleBulkAction}
                  onClearSelection={() => setSelectedUsers([])}
                />

                <div className="flex-1 overflow-hidden">
                  <UserDataGrid
                    users={filteredUsers}
                    selectedUsers={selectedUsers}
                    onUserSelect={handleUserSelect}
                    onSelectAll={handleSelectAll}
                    onUserEdit={handleUserEdit}
                    onUserToggleStatus={handleUserToggleStatus}
                    onUserResetPassword={handleUserResetPassword}
                    onUserClick={handleUserClick}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    onSort={handleSort}
                  />
                </div>
              </div>
            </div>

            {/* User Details Panel */}
            {showDetailsPanel && (
              <div className="hidden xl:block w-96 border-l border-border bg-card">
                <UserDetailsPanel
                  user={selectedUser}
                  roles={roles}
                  onClose={() => {
                    setShowDetailsPanel(false);
                    setSelectedUser(null);
                  }}
                  onSave={handleUserSave}
                  onAuditView={handleAuditView}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onSave={handleAddUser}
        roles={roles}
      />

      {/* Mobile Filter Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="fixed left-0 top-16 bottom-0 w-full max-w-sm bg-card border-r border-border overflow-y-auto">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Filters</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileFilterOpen(false)}
                iconName="X"
                iconSize={18}
              >
                <span className="sr-only">Close filters</span>
              </Button>
            </div>
            <FilterSidebar
              filters={filters}
              onFiltersChange={setFilters}
              onSaveFilter={handleSaveFilter}
              savedFilters={savedFilters}
              onClose={() => setMobileFilterOpen(false)}
              roles={roles}
              departments={departments}
            />
          </div>
        </div>
      )}

      {/* Mobile User Details Modal */}
      {showDetailsPanel && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowDetailsPanel(false);
              setSelectedUser(null);
            }}
          />
          <div className="fixed right-0 top-16 bottom-0 w-full max-w-md bg-card border-l border-border overflow-y-auto">
            <UserDetailsPanel
              user={selectedUser}
              roles={roles}
              onClose={() => {
                setShowDetailsPanel(false);
                setSelectedUser(null);
              }}
              onSave={handleUserSave}
              onAuditView={handleAuditView}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUserManagement;
