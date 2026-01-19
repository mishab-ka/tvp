import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';

const VehiclesTab = ({ vehicles, onVehicleUpdate, onVehicleRemove, onVehicleAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: '',
    model: '',
    year: '',
    plateNumber: '',
    color: '',
    vin: ''
  });

  const filteredVehicles = vehicles?.filter(vehicle => {
    const matchesSearch = vehicle?.make?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         vehicle?.model?.toLowerCase()?.includes(searchTerm?.toLowerCase()) ||
                         vehicle?.plateNumber?.toLowerCase()?.includes(searchTerm?.toLowerCase());
    const matchesStatus = statusFilter === 'all' || vehicle?.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-success text-success-foreground';
      case 'inactive': return 'bg-error text-error-foreground';
      case 'maintenance': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleAddVehicle = () => {
    const vehicleData = {
      ...newVehicle,
      id: `VEH${String(vehicles?.length + 1)?.padStart(3, '0')}`,
      status: 'active',
      assignedDate: new Date()?.toISOString()?.split('T')?.[0],
      totalTrips: 0,
      totalEarnings: 0,
      lastServiceDate: null
    };
    
    onVehicleAdd(vehicleData);
    setNewVehicle({
      make: '',
      model: '',
      year: '',
      plateNumber: '',
      color: '',
      vin: ''
    });
    setShowAddForm(false);
  };

  const handleStatusChange = (vehicleId, newStatus) => {
    onVehicleUpdate(vehicleId, { status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <Input
            type="search"
            placeholder="Search vehicles by make, model, or plate..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e?.target?.value)}
          />
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e?.target?.value)}
            className="px-3 py-2 border border-border rounded-md bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
          
          <Button
            variant="default"
            onClick={() => setShowAddForm(true)}
            iconName="Plus"
            iconPosition="left"
            iconSize={16}
          >
            Add Vehicle
          </Button>
        </div>
      </div>
      {/* Add Vehicle Form */}
      {showAddForm && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-card-foreground">Add New Vehicle</h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowAddForm(false)}
              iconName="X"
              iconSize={16}
            >
              <span className="sr-only">Close</span>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Input
              label="Make"
              type="text"
              value={newVehicle?.make}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, make: e?.target?.value }))}
              placeholder="e.g., Toyota"
            />
            
            <Input
              label="Model"
              type="text"
              value={newVehicle?.model}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e?.target?.value }))}
              placeholder="e.g., Camry"
            />
            
            <Input
              label="Year"
              type="number"
              value={newVehicle?.year}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, year: e?.target?.value }))}
              placeholder="e.g., 2022"
            />
            
            <Input
              label="Plate Number"
              type="text"
              value={newVehicle?.plateNumber}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, plateNumber: e?.target?.value }))}
              placeholder="e.g., ABC-1234"
            />
            
            <Input
              label="Color"
              type="text"
              value={newVehicle?.color}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, color: e?.target?.value }))}
              placeholder="e.g., White"
            />
            
            <Input
              label="VIN"
              type="text"
              value={newVehicle?.vin}
              onChange={(e) => setNewVehicle(prev => ({ ...prev, vin: e?.target?.value }))}
              placeholder="Vehicle Identification Number"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowAddForm(false)}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleAddVehicle}
              disabled={!newVehicle?.make || !newVehicle?.model || !newVehicle?.plateNumber}
            >
              Add Vehicle
            </Button>
          </div>
        </div>
      )}
      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredVehicles?.map((vehicle) => (
          <div key={vehicle?.id} className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Icon name="Car" size={20} className="text-primary-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-card-foreground">{vehicle?.make} {vehicle?.model}</h4>
                  <p className="text-sm text-muted-foreground">{vehicle?.year} • {vehicle?.color}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle?.status)}`}>
                  {vehicle?.status}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  iconName="MoreVertical"
                  iconSize={16}
                >
                  <span className="sr-only">More options</span>
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Plate Number:</span>
                <span className="font-medium">{vehicle?.plateNumber}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">VIN:</span>
                <span className="font-medium font-mono text-xs">{vehicle?.vin}</span>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Assigned Date:</span>
                <span className="font-medium">{vehicle?.assignedDate}</span>
              </div>
              
              <div className="border-t border-border pt-3 mt-3">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-lg font-semibold text-foreground">{vehicle?.totalTrips}</div>
                    <div className="text-xs text-muted-foreground">Total Trips</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-success">${vehicle?.totalEarnings?.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">Total Earnings</div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2 pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  onClick={() => handleStatusChange(vehicle?.id, vehicle?.status === 'active' ? 'inactive' : 'active')}
                  iconName={vehicle?.status === 'active' ? 'Pause' : 'Play'}
                  iconPosition="left"
                  iconSize={14}
                >
                  {vehicle?.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => onVehicleRemove(vehicle?.id)}
                  iconName="Trash2"
                  iconSize={14}
                >
                  <span className="sr-only">Remove vehicle</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {filteredVehicles?.length === 0 && (
        <div className="text-center py-12">
          <Icon name="Car" size={48} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No vehicles found</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || statusFilter !== 'all' ?'Try adjusting your search or filter criteria.' :'This TVP owner has no vehicles assigned yet.'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Button
              variant="default"
              onClick={() => setShowAddForm(true)}
              iconName="Plus"
              iconPosition="left"
              iconSize={16}
            >
              Add First Vehicle
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VehiclesTab;