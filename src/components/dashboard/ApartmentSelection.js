import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useApi } from '../../hooks/useApi';
import ConnectionStatus from '../common/ConnectionStatus';
import LoadingSpinner from '../common/LoadingSpinner';

const ApartmentSelection = () => {
  const [apartments, setApartments] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newApartment, setNewApartment] = useState({
    name: '',
    location: '',
    totalUnits: '',
    floors: '',
    unitsPerFloor: '',
    description: '',
    priceRange: '',
    amenities: '',
    image: null
  });

  const { currentUser, logout } = useAuth();
  const { addNotification } = useNotification();
  const { apiCall, apiCallFormData, loading, error } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    loadApartments();
  }, []);

  const loadApartments = async () => {
    try {
      const data = await apiCall('/apartments');
      setApartments(data);
    } catch (err) {
      addNotification('Failed to load properties', 'error');
    }
  };

  const handleAddApartment = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData();
      Object.keys(newApartment).forEach(key => {
        if (newApartment[key] !== null && newApartment[key] !== '') {
          formData.append(key, newApartment[key]);
        }
      });

      await apiCallFormData('/apartments', formData);
      setShowAddForm(false);
      setNewApartment({ 
        name: '', location: '', totalUnits: '', floors: '', unitsPerFloor: '', 
        description: '', priceRange: '', amenities: '', image: null 
      });
      loadApartments();
      addNotification('Property added successfully!', 'success');
    } catch (err) {
      addNotification('Failed to add property', 'error');
    }
  };

  const handleLogout = () => {
    logout();
    addNotification('Logged out successfully', 'info');
  };

  const handleApartmentSelect = (apartment) => {
    navigate(`/apartment/${apartment.id}/dashboard`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
              <p className="text-gray-600">Welcome back, {currentUser?.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <ConnectionStatus />
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </button>
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-700 font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
            <button
              onClick={() => {/* Clear error */}}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <LoadingSpinner message="Loading properties..." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apartments.map((apartment) => (
              <div
                key={apartment.id}
                onClick={() => handleApartmentSelect(apartment)}
                className="bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer transform hover:scale-105 transition-transform duration-200"
              >
                <img
                  src={apartment.imageUrl ? `http://localhost:5000${apartment.imageUrl}` : "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop"}
                  alt={apartment.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400&h=300&fit=crop";
                  }}
                />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{apartment.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{apartment.location}</p>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Units:</span>
                      <span className="font-semibold">{apartment.totalUnits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sold:</span>
                      <span className="font-semibold text-green-600">{apartment.soldUnits || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Available:</span>
                      <span className="font-semibold text-blue-600">{apartment.availableUnits || apartment.totalUnits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-semibold text-green-600">
                        KSh {((apartment.totalRevenue || 0) / 1000000).toFixed(1)}M
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${apartment.occupancyRate || 0}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    {apartment.occupancyRate || 0}% Occupied
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Apartment Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add New Property</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddApartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Name</label>
                <input
                  type="text"
                  value={newApartment.name}
                  onChange={(e) => setNewApartment({...newApartment, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Nairobi Heights"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  value={newApartment.location}
                  onChange={(e) => setNewApartment({...newApartment, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Kilimani, Nairobi"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Units</label>
                  <input
                    type="number"
                    value={newApartment.totalUnits}
                    onChange={(e) => setNewApartment({...newApartment, totalUnits: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Floors</label>
                  <input
                    type="number"
                    value={newApartment.floors}
                    onChange={(e) => setNewApartment({...newApartment, floors: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Units/Floor</label>
                  <input
                    type="number"
                    value={newApartment.unitsPerFloor}
                    onChange={(e) => setNewApartment({...newApartment, unitsPerFloor: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
                <input
                  type="text"
                  value={newApartment.priceRange}
                  onChange={(e) => setNewApartment({...newApartment, priceRange: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., KSh 3M - 8M"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewApartment({...newApartment, image: e.target.files[0]})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={newApartment.description}
                  onChange={(e) => setNewApartment({...newApartment, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Brief description of the property"
                />
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Property'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
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

export default ApartmentSelection;
