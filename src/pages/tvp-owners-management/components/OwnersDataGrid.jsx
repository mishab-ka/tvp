import React, { useState, useMemo } from "react";
import Icon from "../../../components/AppIcon";
import Button from "../../../components/ui/Button";
import { formatCurrency } from "../../../utils/formatters";
import Input from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";

const OwnersDataGrid = ({
  owners,
  selectedOwners,
  onOwnerSelect,
  onOwnerClick,
  onBulkAction,
  onOwnerEdit = () => {},
  onOwnerDelete = () => {},
  onGenerateBill = () => {},
  onStatusToggle = () => {},
  canManageOwners = false,
  currentPage = 1,
  totalPages = 1,
  pageSize = 25,
  totalOwners = 0,
  onPageChange = () => {},
}) => {
  const [sortConfig, setSortConfig] = useState({
    key: "tvpId",
    direction: "asc",
  });
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState("");

  const sortedOwners = useMemo(() => {
    if (!sortConfig?.key) return owners;

    return [...owners]?.sort((a, b) => {
      const aValue = a?.[sortConfig?.key];
      const bValue = b?.[sortConfig?.key];

      if (aValue < bValue) return sortConfig?.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig?.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [owners, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev?.key === key && prev?.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      onOwnerSelect(owners?.map((owner) => owner?.id));
    } else {
      onOwnerSelect([]);
    }
  };

  const handleOwnerToggle = (ownerId) => {
    const newSelection = selectedOwners?.includes(ownerId)
      ? selectedOwners?.filter((id) => id !== ownerId)
      : [...selectedOwners, ownerId];
    onOwnerSelect(newSelection);
  };

  const startEditing = (ownerId, field, currentValue) => {
    setEditingCell(`${ownerId}-${field}`);
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    // In real app, this would update the owner data
    console.log("Saving edit:", editingCell, editValue);
    setEditingCell(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: "bg-success text-success-foreground", label: "Active" },
      inactive: { color: "bg-muted text-muted-foreground", label: "Inactive" },
      pending: {
        color: "bg-warning text-warning-foreground",
        label: "Pending",
      },
      suspended: {
        color: "bg-error text-error-foreground",
        label: "Suspended",
      },
      under_review: {
        color: "bg-secondary text-secondary-foreground",
        label: "Under Review",
      },
    };

    const config = statusConfig?.[status] || statusConfig?.inactive;
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${config?.color}`}
      >
        {config?.label}
      </span>
    );
  };

  const getPerformanceIndicator = (performance) => {
    if (performance >= 90)
      return <Icon name="TrendingUp" size={16} className="text-success" />;
    if (performance >= 75)
      return <Icon name="Minus" size={16} className="text-accent" />;
    if (performance >= 60)
      return <Icon name="TrendingDown" size={16} className="text-warning" />;
    return <Icon name="AlertTriangle" size={16} className="text-error" />;
  };

  const SortableHeader = ({ label, sortKey, className = "" }) => (
    <th
      className={`px-4 py-3 text-left text-xs bg-white font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted/50 transition-colors ${className}`}
      onClick={() => handleSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <div className="flex flex-col">
          <Icon
            name="ChevronUp"
            size={12}
            className={
              sortConfig?.key === sortKey && sortConfig?.direction === "asc"
                ? "text-primary"
                : "text-muted-foreground/50"
            }
          />
          <Icon
            name="ChevronDown"
            size={12}
            className={
              sortConfig?.key === sortKey && sortConfig?.direction === "desc"
                ? "text-primary"
                : "text-muted-foreground/50"
            }
          />
        </div>
      </div>
    </th>
  );

  const EditableCell = ({ ownerId, field, value, type = "text" }) => {
    const cellKey = `${ownerId}-${field}`;
    const isEditing = editingCell === cellKey;

    if (isEditing) {
      return (
        <div className="flex items-center space-x-2">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e?.target?.value)}
            className="h-8 text-sm"
            autoFocus
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={saveEdit}
            iconName="Check"
            iconSize={14}
            className="h-6 w-6"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={cancelEdit}
            iconName="X"
            iconSize={14}
            className="h-6 w-6"
          />
        </div>
      );
    }

    return (
      <div
        className="cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors"
        onClick={() => startEditing(ownerId, field, value)}
      >
        {value}
      </div>
    );
  };

  return (
    <div className="h-full min-h-0  flex flex-col bg-surface">
      {/* Bulk Actions Toolbar */}
      {selectedOwners?.length > 0 && (
        <div className="p-4 bg-primary/5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-foreground">
                {selectedOwners?.length} owner
                {selectedOwners?.length !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction("request_documents")}
                  iconName="FileText"
                  iconPosition="left"
                  iconSize={14}
                >
                  Request Documents
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction("adjust_deposit")}
                  iconName="DollarSign"
                  iconPosition="left"
                  iconSize={14}
                >
                  Adjust Deposit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction("update_status")}
                  iconName="Settings"
                  iconPosition="left"
                  iconSize={14}
                >
                  Update Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onBulkAction("export")}
                  iconName="Download"
                  iconPosition="left"
                  iconSize={14}
                >
                  Export
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOwnerSelect([])}
              iconName="X"
              iconSize={14}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}
      {/* Data Grid - scrollable contacts list (mobile cards + desktop table) */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-y-contain">
        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <table className="w-full">
            <thead className="bg-muted/30 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 bg-white w-12">
                  <Checkbox
                    checked={
                      selectedOwners?.length === owners?.length &&
                      owners?.length > 0
                    }
                    onChange={(e) => handleSelectAll(e?.target?.checked)}
                    size="sm"
                  />
                </th>
                <SortableHeader label="TVP ID" sortKey="tvpId" />
                <SortableHeader label="Owner Name" sortKey="name" />
                <SortableHeader label="Contact" sortKey="phone" />
                <SortableHeader label="Category" sortKey="category" />
                <SortableHeader label="Vehicle Number" sortKey="vehicleCount" />
                <SortableHeader label="Deposit" sortKey="depositAmount" />
                <SortableHeader
                  label="Outstanding"
                  sortKey="outstandingBalance"
                />
                <SortableHeader label="Status" sortKey="status" />
                <th className="px-4 py-3 text-left bg-white text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-border">
              {sortedOwners?.map((owner) => (
                <tr
                  key={owner?.id}
                  className="hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => onOwnerClick(owner)}
                >
                  <td
                    className="px-4 py-4"
                    onClick={(e) => e?.stopPropagation()}
                  >
                    <Checkbox
                      checked={selectedOwners?.includes(owner?.id)}
                      onChange={() => handleOwnerToggle(owner?.id)}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-primary">
                      {owner?.tvpId}
                    </div>
                  </td>
                  <td
                    className="px-4 py-4"
                    onClick={(e) => e?.stopPropagation()}
                  >
                    <EditableCell
                      ownerId={owner?.id}
                      field="name"
                      value={owner?.name}
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-foreground">
                      {owner?.phone}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {owner?.email}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-foreground capitalize">
                      {owner?.category === "double_driver"
                        ? "Double Driver"
                        : "Single Driver"}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1">
                      {owner?.vehicleNumbers &&
                      owner.vehicleNumbers.length > 0 ? (
                        owner.vehicleNumbers.map((vehicle, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                          >
                            <Icon name="Car" size={12} className="mr-1" />
                            {vehicle}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          No vehicles
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-foreground">
                      {formatCurrency(owner?.depositAmount)}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div
                      className={`text-sm font-medium ${
                        owner?.outstandingBalance > 0
                          ? "text-error"
                          : "text-success"
                      }`}
                    >
                      {formatCurrency(owner?.outstandingBalance)}
                    </div>
                  </td>
                  <td
                    className="px-4 py-4"
                    onClick={(e) => e?.stopPropagation()}
                  >
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(owner?.status)}
                      {canManageOwners && (
                        <div className="flex items-center space-x-1">
                          {owner?.status !== "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-success hover:bg-success/10"
                              onClick={() =>
                                onStatusToggle(owner?.id, "active")
                              }
                            >
                              Activate
                            </Button>
                          )}
                          {owner?.status !== "inactive" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs text-muted-foreground hover:bg-muted"
                              onClick={() =>
                                onStatusToggle(owner?.id, "inactive")
                              }
                            >
                              Deactivate
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td
                    className="px-4 py-4"
                    onClick={(e) => e?.stopPropagation()}
                  >
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        iconName="Eye"
                        iconSize={14}
                        className="h-8 w-8"
                        onClick={() => onOwnerClick(owner)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        iconName="Edit"
                        iconSize={14}
                        className="h-8 w-8"
                        disabled={!canManageOwners}
                        onClick={(e) => {
                          e?.stopPropagation();
                          if (canManageOwners) {
                            onOwnerEdit(owner);
                          }
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        iconName="Trash2"
                        iconSize={14}
                        className="h-8 w-8 text-error"
                        disabled={!canManageOwners}
                        onClick={(e) => {
                          e?.stopPropagation();
                          if (canManageOwners) {
                            onOwnerDelete(owner);
                          }
                        }}
                      />
                      {canManageOwners && (
                        <Button
                          variant="ghost"
                          size="icon"
                          iconName="Receipt"
                          iconSize={14}
                          className="h-8 w-8"
                          title="Generate Bill"
                          onClick={(e) => {
                            e?.stopPropagation();
                            if (canManageOwners && onGenerateBill) {
                              onGenerateBill(owner);
                            }
                          }}
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        iconName="MoreVertical"
                        iconSize={14}
                        className="h-8 w-8"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4 p-4">
          {sortedOwners?.map((owner) => (
            <div
              key={owner?.id}
              className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onOwnerClick(owner)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={selectedOwners?.includes(owner?.id)}
                    onChange={(e) => {
                      e?.stopPropagation();
                      handleOwnerToggle(owner?.id);
                    }}
                    size="sm"
                  />
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {owner?.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {owner?.tvpId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(owner?.status)}
                  {canManageOwners && (
                    <>
                      {owner?.status !== "active" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-success"
                          onClick={(e) => {
                            e?.stopPropagation();
                            onStatusToggle(owner?.id, "active");
                          }}
                        >
                          Activate
                        </Button>
                      )}
                      {owner?.status !== "inactive" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-muted-foreground"
                          onClick={(e) => {
                            e?.stopPropagation();
                            onStatusToggle(owner?.id, "inactive");
                          }}
                        >
                          Deactivate
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        iconName="Edit"
                        iconSize={14}
                        className="h-8 w-8"
                        onClick={(e) => {
                          e?.stopPropagation();
                          onOwnerEdit(owner);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        iconName="Trash2"
                        iconSize={14}
                        className="h-8 w-8 text-error"
                        onClick={(e) => {
                          e?.stopPropagation();
                          onOwnerDelete(owner);
                        }}
                      />
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    iconName="MoreVertical"
                    iconSize={14}
                    className="h-8 w-8"
                    onClick={(e) => e?.stopPropagation()}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Contact:</span>
                  <p className="font-medium">{owner?.phone}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <p className="font-medium capitalize">
                    {owner?.category === "double_driver"
                      ? "Double Driver"
                      : "Single Driver"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Vehicles:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {owner?.vehicleNumbers?.length > 0 ? (
                      owner.vehicleNumbers.map((vehicle, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
                        >
                          <Icon name="Car" size={10} className="mr-1" />
                          {vehicle}
                        </span>
                      ))
                    ) : (
                      <p className="font-medium">
                        {owner?.vehicleCount ?? owner?.vehicles?.length ?? 0}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Outstanding:</span>
                  <p
                    className={`font-medium ${
                      owner?.outstandingBalance > 0
                        ? "text-error"
                        : "text-success"
                    }`}
                  >
                    {formatCurrency(owner?.outstandingBalance)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Deposit:</span>
                  <p className="font-medium">
                    {formatCurrency(owner?.depositAmount)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Pagination */}
      <div className="p-4 border-t border-border bg-surface">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(currentPage - 1) * pageSize + 1} -{" "}
            {Math.min(currentPage * pageSize, totalOwners)} of {totalOwners}{" "}
            owners
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronLeft"
              iconSize={14}
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center space-x-1">
              {/* First page */}
              {currentPage > 2 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(1)}
                  >
                    1
                  </Button>
                  {currentPage > 3 && (
                    <span className="text-sm text-muted-foreground">...</span>
                  )}
                </>
              )}

              {/* Previous page */}
              {currentPage > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange(currentPage - 1)}
                >
                  {currentPage - 1}
                </Button>
              )}

              {/* Current page */}
              <Button variant="default" size="sm">
                {currentPage}
              </Button>

              {/* Next page */}
              {currentPage < totalPages && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onPageChange(currentPage + 1)}
                >
                  {currentPage + 1}
                </Button>
              )}

              {/* Last page */}
              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && (
                    <span className="text-sm text-muted-foreground">...</span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPageChange(totalPages)}
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              iconName="ChevronRight"
              iconSize={14}
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnersDataGrid;
