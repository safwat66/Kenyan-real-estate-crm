import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { User, Building, DollarSign, Users, FileText, Phone, Mail, Download, Calendar, Search, Filter, Eye, Edit, Plus, Home, TrendingUp, AlertTriangle, Upload, Save, X, Wifi, WifiOff } from 'lucide-react';

// Socket.io import (install with: npm install socket.io-client)
// Uncomment this line after installing socket.io-client:
// import io from 'socket.io-client';

// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';
//const SOCKET_URL = 'http://localhost:5000';

// Socket.io connection (uncomment after installing socket.io-client)
let socket = null;

// API Helper Functions
const apiCall = async (endpoint, options = {}) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

const apiCallFormData = async (endpoint, formData) => {
  const token = localStorage.getItem('token');
  const headers = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
};

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  // Data states
  const [apartments, setApartments] = useState([]);
  const [units, setUnits] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Socket.io setup (uncomment after installing socket.io-client)
  /*
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !socket) {
      socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket']
      });

      socket.on('connect', () => {
        console.log('✅ Real-time connection established');
        setSocketConnected(true);
        addNotification('Connected to real-time updates', 'success');
      });

      socket.on('disconnect', () => {
        console.log('❌ Real-time connection lost');
        setSocketConnected(false);
        addNotification('Real-time connection lost', 'warning');
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setSocketConnected(false);
        addNotification('Failed to connect to real-time updates', 'error');
      });

      // Real-time event handlers
      socket.on('apartment_created', (data) => {
        addNotification(`New property "${data.name}" added`, 'info');
        loadApartments();
      });

      socket.on('unit_created', (data) => {
        addNotification(`New unit ${data.unitNumber} added`, 'info');
        if (selectedApartment && selectedApartment.id === data.apartmentId) {
          loadUnits(data.apartmentId, selectedFloor);
        }
      });

      socket.on('unit_updated', (data) => {
        addNotification(`Unit ${data.unitNumber} updated`, 'info');
        if (selectedApartment && selectedApartment.id === data.apartmentId) {
          loadUnits(data.apartmentId, selectedFloor);
          loadDashboardStats(data.apartmentId);
        }
      });

      socket.on('tenant_created', (data) => {
        addNotification(`New tenant ${data.tenant.name} added to unit ${data.unit.unitNumber}`, 'success');
        if (selectedApartment && selectedApartment.id === data.unit.apartmentId) {
          loadUnits(data.unit.apartmentId, selectedFloor);
          loadDashboardStats(data.unit.apartmentId);
        }
        if (currentView === 'tenants') {
          loadTenants(searchTerm, filterStatus);
        }
      });

      return () => {
        if (socket) {
          socket.disconnect();
          socket = null;
        }
      };
    }
  }, [currentUser, selectedApartment, selectedFloor, searchTerm, filterStatus, currentView]);

  // Join apartment room when apartment is selected
  useEffect(() => {
    if (socket && selectedApartment) {
      socket.emit('join-apartment', selectedApartment.id);
      return () => {
        socket.emit('leave-apartment', selectedApartment.id);
      };
    }
  }, [selectedApartment]);
  */

  // Notification system
  const addNotification = (message, type = 'info') => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only last 5
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  // Notification component
  const NotificationBar = () => {
    if (notifications.length === 0) return null;

    return (
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
              notification.type === 'success' ? 'bg-green-500 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              notification.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                className="ml-2 text-white hover:text-gray-200"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs opacity-75 mt-1">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
        ))}
      </div>
    );
  };

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className="flex items-center space-x-2">
      {socketConnected ? (
        <>
          <Wifi className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-600">Live</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">Offline</span>
        </>
      )}
    </div>
  );

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setCurrentUser(JSON.parse(user));
      setCurrentView('dashboard');
    }
  }, []);

  // Authentication component
  const LoginForm = () => {
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [isRegistering, setIsRegistering] = useState(false);
    const [registerData, setRegisterData] = useState({ username: '', email: '', password: '', confirmPassword: '' });

    const handleLogin = async (e) => {
      if (e) e.preventDefault();
      setLoading(true);
      setError(null);

      try {
        const response = await apiCall('/auth/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        });

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setCurrentUser(response.user);
        setCurrentView('dashboard');
        addNotification('Login successful!', 'success');
      } catch (err) {
        setError(err.message);
        addNotification('Login failed', 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleRegister = async (e) => {
      if (e) e.preventDefault();
      if (registerData.password !== registerData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiCall('/auth/register', {
          method: 'POST',
          body: JSON.stringify({
            username: registerData.username,
            email: registerData.email,
            password: registerData.password,
          }),
        });

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        setCurrentUser(response.user);
        setCurrentView('dashboard');
        addNotification('Account created successfully!', 'success');
      } catch (err) {
        setError(err.message);
        addNotification('Registration failed', 'error');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-600 flex items-center justify-center p-4">
        <NotificationBar />
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Real Estate CRM</h1>
            <p className="text-gray-600">Kenyan Property Management</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {!isRegistering ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your username"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                  disabled={loading}
                />
              </div>
              
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </button>

              <button
                onClick={() => setIsRegistering(true)}
                className="w-full text-blue-600 hover:text-blue-700 font-medium"
              >
                Don't have an account? Register
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  type="text"
                  value={registerData.username}
                  onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Choose a username"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Create a password"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                <input
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your password"
                  disabled={loading}
                />
              </div>
              
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <button
                onClick={() => setIsRegistering(false)}
                className="w-full text-blue-600 hover:text-blue-700 font-medium"
              >
                Already have an account? Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Load apartments data
  const loadApartments = async () => {
    setLoading(true);
    try {
      const data = await apiCall('/apartments');
      setApartments(data);
    } catch (err) {
      setError(err.message);
      addNotification('Failed to load properties', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load units for selected apartment - UPDATED API CALL
  const loadUnits = async (apartmentId, floor = null) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({ apartmentId });
      if (floor) queryParams.append('floor', floor);
      
      const data = await apiCall(`/units?${queryParams.toString()}`);
      setUnits(data);
    } catch (err) {
      setError(err.message);
      addNotification('Failed to load units', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load tenants
  const loadTenants = async (search = '', status = 'all') => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append('search', search);
      if (status !== 'all') queryParams.append('status', status);
      
      const data = await apiCall(`/tenants?${queryParams.toString()}`);
      setTenants(data.tenants || data);
    } catch (err) {
      setError(err.message);
      addNotification('Failed to load tenants', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load dashboard stats - UPDATED API CALL
  const loadDashboardStats = async (apartmentId) => {
    setLoading(true);
    try {
      const data = await apiCall(`/dashboard/stats?apartmentId=${apartmentId}`);
      setDashboardStats(data);
    } catch (err) {
      setError(err.message);
      addNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Apartment selection dashboard
  const ApartmentSelection = () => {
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

    useEffect(() => {
      loadApartments();
    }, []);

    const handleAddApartment = async (e) => {
      e.preventDefault();
      setLoading(true);

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
        setError(err.message);
        addNotification('Failed to add property', 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setCurrentUser(null);
      setCurrentView('login');
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      addNotification('Logged out successfully', 'info');
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <NotificationBar />
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
                onClick={() => setError(null)}
                className="absolute top-0 bottom-0 right-0 px-4 py-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading properties...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apartments.map((apartment) => (
                <div
                  key={apartment.id}
                  onClick={() => {
                    setSelectedApartment(apartment);
                    setCurrentView('apartment-dashboard');
                  }}
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

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Property Name</label>
                  <input
                    type="text"
                    value={newApartment.name}
                    onChange={(e) => setNewApartment({...newApartment, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Nairobi Heights"
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Floors</label>
                    <input
                      type="number"
                      value={newApartment.floors}
                      onChange={(e) => setNewApartment({...newApartment, floors: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Units/Floor</label>
                    <input
                      type="number"
                      value={newApartment.unitsPerFloor}
                      onChange={(e) => setNewApartment({...newApartment, unitsPerFloor: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                    onClick={handleAddApartment}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Property'}
                  </button>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Individual apartment dashboard
  const ApartmentDashboard = () => {
    const apartment = selectedApartment;

    useEffect(() => {
      if (apartment?.id) {
        loadDashboardStats(apartment.id);
      }
    }, [apartment]);

    const Navigation = () => (
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Properties
              </button>
              <h1 className="text-xl font-bold text-gray-900">{apartment.name}</h1>
              <ConnectionStatus />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentView('unit-management')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Manage Units
              </button>
              <button
                onClick={() => setCurrentView('tenants')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                View Tenants
              </button>
              <button
                onClick={() => setCurrentView('reports')}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Reports
              </button>
            </div>
          </div>
        </div>
      </div>
    );

    if (!dashboardStats) {
      return (
        <div className="min-h-screen bg-gray-50">
          <NotificationBar />
          <Navigation />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading dashboard...</p>
            </div>
          </div>
        </div>
      );
    }

    const stats = dashboardStats.apartment;
    const pieData = [
      { name: 'Sold', value: stats.soldUnits, color: '#10B981' },
      { name: 'Available', value: stats.availableUnits, color: '#3B82F6' },
      { name: 'Reserved', value: stats.reservedUnits || 0, color: '#F59E0B' }
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        <NotificationBar />
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Home className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Units</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUnits}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-full">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Units Sold</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.soldUnits}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <Building className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.availableUnits}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg transform hover:scale-105 transition-transform">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    KSh {(stats.totalRevenue / 1000000).toFixed(1)}M
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Unit Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dashboardStats.monthlyRevenue || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value) => [`KSh ${(value / 1000000).toFixed(1)}M`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Unit Management Component with Real-time updates
  const UnitManagement = () => {
    const apartment = selectedApartment;
    const [showAddUnitForm, setShowAddUnitForm] = useState(false);
    const [newUnit, setNewUnit] = useState({
      unitNumber: '',
      floor: selectedFloor,
      area: '',
      price: '',
      bedrooms: '1',
      bathrooms: '1',
      unitType: '1br'
    });

    useEffect(() => {
      if (apartment?.id) {
        loadUnits(apartment.id, selectedFloor);
      }
    }, [apartment, selectedFloor]);

    const handleAddUnit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        // UPDATED API CALL - using body parameters instead of path parameters
        await apiCall('/units', {
          method: 'POST',
          body: JSON.stringify({
            ...newUnit,
            apartmentId: apartment.id
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
        loadUnits(apartment.id, selectedFloor);
        addNotification('Unit added successfully!', 'success');
      } catch (err) {
        setError(err.message);
        addNotification('Failed to add unit', 'error');
      } finally {
        setLoading(false);
      }
    };

    const handleUpdateUnitStatus = async (unitId, newStatus) => {
      try {
        // UPDATED API CALL - using body parameters instead of path parameters
        await apiCall('/units', {
          method: 'PATCH',
          body: JSON.stringify({ unitId, status: newStatus }),
        });
        loadUnits(apartment.id, selectedFloor);
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
        <NotificationBar />
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('apartment-dashboard')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-xl font-bold text-gray-900">Unit Management - {apartment.name}</h1>
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
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading units...</p>
              </div>
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
                      {unit.status === 'installment' && unit.Tenant && unit.Tenant.Payments && (
                        <div className="mt-2">
                          {(() => {
                            const totalPaid = unit.Tenant.Payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
                            const progress = (totalPaid / parseFloat(unit.price)) * 100;
                            return (
                              <>
                                <div className="bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-orange-500 h-2 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {Math.round(progress)}% paid
                                </p>
                              </>
                            );
                          })()}
                        </div>
                      )}
                      
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

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Unit Number</label>
                    <input
                      type="text"
                      value={newUnit.unitNumber}
                      onChange={(e) => setNewUnit({...newUnit, unitNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 1A"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Floor</label>
                    <select
                      value={newUnit.floor}
                      onChange={(e) => setNewUnit({...newUnit, floor: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {Array.from({ length: apartment.floors }, (_, i) => i + 1).map((floor) => (
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
                    onClick={handleAddUnit}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Unit'}
                  </button>
                  <button
                    onClick={() => setShowAddUnitForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Tenant Management with real-time updates
  const TenantManagement = () => {
    const [showAddTenantForm, setShowAddTenantForm] = useState(false);
    const [newTenant, setNewTenant] = useState({
      name: '',
      email: '',
      phone: '',
      idNumber: '',
      occupation: '',
      emergencyContact: '',
      monthlyIncome: '',
      unitId: '',
      notes: ''
    });
    const [availableUnits, setAvailableUnits] = useState([]);

    useEffect(() => {
      loadTenants(searchTerm, filterStatus);
    }, [searchTerm, filterStatus]);

    useEffect(() => {
      if (showAddTenantForm && selectedApartment) {
        loadAvailableUnits();
      }
    }, [showAddTenantForm, selectedApartment]);

    const loadAvailableUnits = async () => {
      try {
        const data = await apiCall(`/units?apartmentId=${selectedApartment.id}&status=available`);
        setAvailableUnits(data);
      } catch (err) {
        console.error('Failed to load available units:', err);
      }
    };

    const handleAddTenant = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        await apiCall('/tenants', {
          method: 'POST',
          body: JSON.stringify(newTenant),
        });
        setShowAddTenantForm(false);
        setNewTenant({
          name: '', email: '', phone: '', idNumber: '', occupation: '',
          emergencyContact: '', monthlyIncome: '', unitId: '', notes: ''
        });
        loadTenants(searchTerm, filterStatus);
        addNotification('Tenant added successfully!', 'success');
      } catch (err) {
        setError(err.message);
        addNotification('Failed to add tenant', 'error');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <NotificationBar />
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('apartment-dashboard')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-xl font-bold text-gray-900">Tenant Management</h1>
                <ConnectionStatus />
              </div>
              <button
                onClick={() => setShowAddTenantForm(true)}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tenant
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filter */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search tenants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="current">Current</option>
                <option value="installment">Installment</option>
                <option value="overdue">Overdue</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Tenants List */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading tenants...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tenant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Unit
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Join Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tenants.map((tenant) => (
                      <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="bg-gray-300 w-10 h-10 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                              <div className="text-sm text-gray-500">{tenant.occupation || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="font-medium">{tenant.Unit?.unitNumber || 'N/A'}</div>
                            <div className="text-gray-500">{tenant.Unit?.Apartment?.name || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>
                            <div className="flex items-center mb-1">
                              <Phone className="w-4 h-4 text-gray-400 mr-2" />
                              {tenant.phone}
                            </div>
                            <div className="flex items-center">
                              <Mail className="w-4 h-4 text-gray-400 mr-2" />
                              {tenant.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            tenant.status === 'current' ? 'bg-green-100 text-green-800' :
                            tenant.status === 'installment' ? 'bg-yellow-100 text-yellow-800' :
                            tenant.status === 'overdue' ? 'bg-red-100 text-red-800' :
                            tenant.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {tenant.status.charAt(0).toUpperCase() + tenant.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(tenant.joinDate).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add Tenant Modal */}
        {showAddTenantForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Add New Tenant</h3>
                <button
                  onClick={() => setShowAddTenantForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={newTenant.email}
                      onChange={(e) => setNewTenant({...newTenant, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newTenant.phone}
                      onChange={(e) => setNewTenant({...newTenant, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="+254712345678"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Number</label>
                    <input
                      type="text"
                      value={newTenant.idNumber}
                      onChange={(e) => setNewTenant({...newTenant, idNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="12345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                    <input
                      type="text"
                      value={newTenant.occupation}
                      onChange={(e) => setNewTenant({...newTenant, occupation: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Software Engineer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                  <select
                    value={newTenant.unitId}
                    onChange={(e) => setNewTenant({...newTenant, unitId: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a unit</option>
                    {availableUnits.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.unitNumber} - Floor {unit.floor} - KSh {(unit.price / 1000000).toFixed(1)}M
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Income (KSh)</label>
                  <input
                    type="number"
                    value={newTenant.monthlyIncome}
                    onChange={(e) => setNewTenant({...newTenant, monthlyIncome: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="150000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label>
                  <input
                    type="text"
                    value={newTenant.emergencyContact}
                    onChange={(e) => setNewTenant({...newTenant, emergencyContact: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Jane Doe - +254723456789"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={newTenant.notes}
                    onChange={(e) => setNewTenant({...newTenant, notes: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Additional notes..."
                  />
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={handleAddTenant}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Tenant'}
                  </button>
                  <button
                    onClick={() => setShowAddTenantForm(false)}
                    className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Reports component (simplified)
  const Reports = () => {
    const [reportType, setReportType] = useState('daily');
    const [startDate, setStartDate] = useState('2024-06-01');
    const [endDate, setEndDate] = useState('2024-06-18');

    const generateReport = async () => {
      // This would integrate with the backend report generation
      addNotification('Report generation feature coming soon!', 'info');
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <NotificationBar />
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentView('apartment-dashboard')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Back to Dashboard
                </button>
                <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
                <ConnectionStatus />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Report Configuration */}
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Report</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily Report</option>
                  <option value="weekly">Weekly Report</option>
                  <option value="monthly">Monthly Report</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={generateReport}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center disabled:opacity-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Excel'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-600">Total Properties</h4>
                <p className="text-2xl font-bold text-blue-600">{apartments.length}</p>
              </div>
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-600">Total Units</h4>
                <p className="text-2xl font-bold text-green-600">
                  {apartments.reduce((sum, apt) => sum + apt.totalUnits, 0)}
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-600">Occupied Units</h4>
                <p className="text-2xl font-bold text-yellow-600">
                  {apartments.reduce((sum, apt) => sum + (apt.soldUnits || 0), 0)}
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-sm font-medium text-gray-600">Total Revenue</h4>
                <p className="text-2xl font-bold text-purple-600">
                  KSh {(apartments.reduce((sum, apt) => sum + (apt.totalRevenue || 0), 0) / 1000000).toFixed(1)}M
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render logic
  if (!currentUser) {
    return <LoginForm />;
  }

  switch (currentView) {
    case 'dashboard':
      return <ApartmentSelection />;
    case 'apartment-dashboard':
      return <ApartmentDashboard />;
    case 'unit-management':
      return <UnitManagement />;
    case 'tenants':
      return <TenantManagement />;
    case 'reports':
      return <Reports />;
    default:
      return <ApartmentSelection />;
  }
}

export default App;