import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useNotification } from '../../contexts/NotificationContext';
import ConnectionStatus from '../common/ConnectionStatus';
import LoadingSpinner from '../common/LoadingSpinner';

const UnitManagement = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartment, setApartment] = useState(null);
  const [units, setUnits] = useState([]);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [showAddUnitForm, setShowAddUnitForm] = useState(false);
  const [newUnit, setNewUnit] = useState({
    unitNumber: '',
    floor: 1,
    area: '',
    price: '',
    bedrooms: '1',
    bathrooms: '1',
    unitType: '1br'
  });

  const { apiCall, loading } = useApi();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (id) {
      loadApartmentData();
      loadUnits();
    }
  }, [id, selectedFloor]);

  const loadApartmentData = async () => {
    try {
      const data = await apiCall(`/apartments/${id}`);
      setApartment(data);
    } catch (err) {
      addNotification('Failed to load apartment data', 'error');
    }
  };

  const loadUnits = async () => {
    try {
      const queryParams = new URLSearchParams({ apartmentId: id });
      if (selectedFloor) queryParams.append('floor', selectedFloor);
      
      const data = await apiCall(`/units?${queryParams.toString()}`);
      setUnits(data);
    } catch (err) {
      addNotification('Failed to load units', 'error');
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();

    try {
      await apiCall('/units', {
        method: 'POST',
        body: JSON.stringify({
          ...newUnit,
          apartmentId: id
        }),
      });
      setShowAddUnitForm(false);
      setNewUnit({
        unitNumber: '',
        floor: selectedFloor,
        area: '',
        price: '',
        bedrooms: '1',
        bathrooms: '1',
        unitType: '1br'
      });
      loadUnits();
      addNotification('Unit added successfully!', 'success');
    } catch (err) {
      addNotification('Failed to add unit', 'error');
    }
  };

  const handleUpdateUnitStatus = async (unitId, newStatus) => {
    try {
      await apiCall('/units', {
        method: 'PATCH',
        body: JSON.stringify({ unitId, status: newStatus }),
      });
      loadUnits();
      addNotification(`Unit status updated to ${newStatus}`, 'success');
    } catch (err) {
      addNotification('Failed to update unit status', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      available: 'bg-green-500',
      reserved: 'bg-yellow-500',
      sold: 'bg-red-500',
      installment: 'bg-orange-500',
      fully_paid: 'bg-blue-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getStatusText = (status) => {
    const texts = {
      available: 'Available',
      reserved: 'Reserved',
      sold: 'Sold',
      installment: 'Installment',
      fully_paid: 'Fully Paid'
    };
    return texts[status] || 'Unknown';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/apartment/${id}/dashboard`)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">Unit Management - {apartment?.name}</h1>
              <ConnectionStatus />
            </div>
            <button
              onClick={() => setShowAddUnitForm(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Unit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Floor Selection */}
        {apartment && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Select Floor</h3>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {Array.from({ length: apartment.floors }, (_, i) => i + 1).map((floor) => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor)}
                  className={`p-3 rounded-lg font-medium transition-colors ${
                    selectedFloor === floor
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Floor {floor}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status Legend */}
        <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Status Legend</h3>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
              <span>Reserved</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span>Sold</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
              <span>Installment</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
              <span>Fully Paid</span>
            </div>
          </div>
        </div>

        {/* Units Display */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Floor {selectedFloor} Units</h3>
          {loading ? (
            <LoadingSpinner message="Loading units..." />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {units.map((unit) => (
                <div
                  key={unit.id}
                  className="border-2 border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className={`w-full h-3 rounded mb-3 transition-all ${getStatusColor(unit.status)}`}></div>
                  <div className="text-center">
                    <p className="font-bold text-lg">{unit.unitNumber}</p>
                    <p className="text-sm text-gray-600">{getStatusText(unit.status)}</p>
                    <p className="text-sm text-gray-600">{unit.area}m² • {unit.unitType}</p>
                    {unit.Tenant && (
                      <p className="text-xs text-blue-600 mt-1">{unit.Tenant.name}</p>
                    )}
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      KSh {(unit.price / 1000000).toFixed(1)}M
                    </p>
                    
                    {/* Quick Actions */}
                    <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <select
                        value={unit.status}
                        onChange={(e) => handleUpdateUnitStatus(unit.id, e.target.value)}
                        className="text-xs px-2 py-1 border rounded w-full"
                      >
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="sold">Sold</option>
                        <option value="installment">Installment</option>
                        <option value="fully_paid">Fully Paid</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Unit Modal */}
      {showAddUnitForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Unit</h3>
              <button
                onClick={() => setShowAddUnitForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddUnit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Number</label>
                  <input
                    type="text"
                    value={newUnit.unitNumber}
                    onChange={(e) => setNewUnit({...newUnit, unitNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 1A"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                  <select
                    value={newUnit.floor}
                    onChange={(e) => setNewUnit({...newUnit, floor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {apartment && Array.from({ length: apartment.floors }, (_, i) => i + 1).map((floor) => (
                      <option key={floor} value={floor}>Floor {floor}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Area (m²)</label>
                  <input
                    type="number"
                    value={newUnit.area}
                    onChange={(e) => setNewUnit({...newUnit, area: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="85"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (KSh)</label>
                  <input
                    type="number"
                    value={newUnit.price}
                    onChange={(e) => setNewUnit({...newUnit, price: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="4500000"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
                  <select
                    value={newUnit.bedrooms}
                    onChange={(e) => setNewUnit({...newUnit, bedrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
                  <select
                    value={newUnit.bathrooms}
                    onChange={(e) => setNewUnit({...newUnit, bathrooms: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                  <select
                    value={newUnit.unitType}
                    onChange={(e) => setNewUnit({...newUnit, unitType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="studio">Studio</option>
                    <option value="1br">1 Bedroom</option>
                    <option value="2br">2 Bedroom</option>
                    <option value="3br">3 Bedroom</option>
                    <option value="4br+">4+ Bedroom</option>
                    <option value="penthouse">Penthouse</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Unit'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddUnitForm(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitManagement;
