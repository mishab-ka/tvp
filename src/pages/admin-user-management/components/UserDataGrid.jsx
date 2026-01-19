import React, { useState, useMemo } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import UserCard from "./UserCard";

const UserDataGrid = ({
  users,
  selectedUsers,
  onUserSelect,
  onSelectAll,
  onUserEdit,
  onUserToggleStatus,
  onUserResetPassword,
  onUserClick,
  sortBy,
  sortOrder,
  onSort,
}) => {
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'

  const sortedUsers = useMemo(() => {
    if (!sortBy) return users;

    return [...users]?.sort((a, b) => {
      let aValue = a?.[sortBy];
      let bValue = b?.[sortBy];

      // Handle different data types
      if (sortBy === "lastLogin") {
        aValue = new Date(aValue || 0);
        bValue = new Date(bValue || 0);
      } else if (typeof aValue === "string") {
        aValue = aValue?.toLowerCase();
        bValue = bValue?.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, sortBy, sortOrder]);

  const getSortIcon = (column) => {
    if (sortBy !== column) return "ArrowUpDown";
    return sortOrder === "asc" ? "ArrowUp" : "ArrowDown";
  };

  const handleSort = (column) => {
    if (sortBy === column) {
      onSort(column, sortOrder === "asc" ? "desc" : "asc");
    } else {
      onSort(column, "asc");
    }
  };

  const allSelected =
    users?.length > 0 && selectedUsers?.length === users?.length;
  const someSelected =
    selectedUsers?.length > 0 && selectedUsers?.length < users?.length;

  const formatLastLogin = (date) => {
    if (!date) return "Never";
    const now = new Date();
    const loginDate = new Date(date);
    const diffInHours = Math.floor((now - loginDate) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return loginDate?.toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-success bg-success/10";
      case "inactive":
        return "text-error bg-error/10";
      case "suspended":
        return "text-warning bg-warning/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "super_admin":
        return "text-error bg-error/10";
      case "manager":
        return "text-warning bg-warning/10";
      case "admin":
        return "text-primary bg-primary/10";
      default:
        return "text-muted-foreground bg-muted";
    }
  };

  if (users?.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-muted/10">
        <div className="text-center">
          <Icon
            name="Users"
            size={48}
            className="text-muted-foreground mx-auto mb-4"
          />
          <h3 className="text-lg font-medium text-foreground mb-2">
            No Users Found
          </h3>
          <p className="text-muted-foreground mb-4">
            No users match your current filters
          </p>
          <Button variant="outline" iconName="Plus" iconSize={16}>
            Add New User
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onChange={(e) => onSelectAll(e?.target?.checked)}
              className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
            />
            <span className="text-sm font-medium text-muted-foreground">
              {selectedUsers?.length > 0
                ? `${selectedUsers?.length} of ${users?.length} selected`
                : `${users?.length} users`}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("grid")}
              iconName="Grid3X3"
              iconSize={14}
            />
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="xs"
              onClick={() => setViewMode("table")}
              iconName="List"
              iconSize={14}
            />
          </div>

          <Button variant="outline" size="sm" iconName="Download" iconSize={16}>
            Export
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {viewMode === "grid" ? (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedUsers?.map((user) => (
                <UserCard
                  key={user?.id}
                  user={user}
                  isSelected={selectedUsers?.includes(user?.id)}
                  onSelect={onUserSelect}
                  onEdit={onUserEdit}
                  onToggleStatus={onUserToggleStatus}
                  onResetPassword={onUserResetPassword}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b border-border sticky top-0">
                <tr>
                  <th className="w-12 p-4">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => onSelectAll(e?.target?.checked)}
                      className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                    />
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <span>Name</span>
                      <Icon name={getSortIcon("name")} size={14} />
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <span>Email</span>
                      <Icon name={getSortIcon("email")} size={14} />
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort("role")}
                      className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <span>Role</span>
                      <Icon name={getSortIcon("role")} size={14} />
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <span>Status</span>
                      <Icon name={getSortIcon("status")} size={14} />
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort("lastLogin")}
                      className="flex items-center space-x-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                    >
                      <span>Last Login</span>
                      <Icon name={getSortIcon("lastLogin")} size={14} />
                    </button>
                  </th>
                  <th className="text-left p-4">Security</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers?.map((user) => (
                  <tr
                    key={user?.id}
                    className={`border-b border-border hover:bg-muted/20 cursor-pointer transition-colors ${
                      selectedUsers?.includes(user?.id) ? "bg-primary/5" : ""
                    }`}
                    onClick={() => onUserClick(user)}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers?.includes(user?.id)}
                        onChange={(e) => {
                          e?.stopPropagation();
                          onUserSelect(user?.id, e?.target?.checked);
                        }}
                        className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                          <Icon
                            name="User"
                            size={18}
                            className="text-muted-foreground"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-foreground truncate">
                            {user?.name}
                          </p>
                          <p className="text-sm text-muted-foreground truncate">
                            {user?.phone}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="min-w-0">
                        <p className="text-sm text-foreground truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {user?.department}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(
                          user?.role
                        )}`}
                      >
                        {user?.role?.replace("_", " ")?.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          user?.status
                        )}`}
                      >
                        {user?.status?.charAt(0)?.toUpperCase() +
                          user?.status?.slice(1)}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-foreground">
                        {formatLastLogin(user?.lastLogin)}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {user?.ssoEnabled && (
                          <div className="flex items-center space-x-1">
                            <Icon
                              name="Shield"
                              size={14}
                              className="text-success"
                            />
                            <span className="text-xs text-success">SSO</span>
                          </div>
                        )}
                        {user?.mfaEnabled && (
                          <div className="flex items-center space-x-1">
                            <Icon
                              name="Smartphone"
                              size={14}
                              className="text-primary"
                            />
                            <span className="text-xs text-primary">MFA</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e?.stopPropagation();
                            onUserEdit(user);
                          }}
                          iconName="Edit"
                          iconSize={14}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e?.stopPropagation();
                            onUserToggleStatus(user);
                          }}
                          iconName={
                            user?.status === "active" ? "UserX" : "UserCheck"
                          }
                          iconSize={14}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e?.stopPropagation();
                            onUserResetPassword(user);
                          }}
                          iconName="Key"
                          iconSize={14}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDataGrid;
