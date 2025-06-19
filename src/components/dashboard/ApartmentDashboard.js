import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { Home, TrendingUp, Building, DollarSign } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useNotification } from '../../contexts/NotificationContext';
import ConnectionStatus from '../common/ConnectionStatus';
import LoadingSpinner from '../common/LoadingSpinner';

const ApartmentDashboard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [apartment, setApartment] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const { apiCall, loading } = useApi();
  const { addNotification } = useNotification();

  useEffect(() => {
    if (id) {
      loadApartmentData();
      loadDashboardStats();
    }
  }, [id]);

  const loadApartmentData = async () => {
    try {
      const data = await apiCall(`/apartments/${id}`);
      setApartment(data);
    } catch (err) {
      addNotification('Failed to load apartment data', 'error');
    }
  };

  const loadDashboardStats = async () => {
    try {
      const data = await apiCall(`/dashboard/stats?apartmentId=${id}`);
      setDashboardStats(data);
    } catch (err) {
      addNotification('Failed to load dashboard data', 'error');
    }
  };

  const Navigation = () => (
    <div className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← Back to Properties
            </button>
            <h1 className="text-xl font-bold text-gray-900">{apartment?.name}</h1>
            <ConnectionStatus />
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/apartment/${id}/units`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Units
            </button>
            <button
              onClick={() => navigate(`/apartment/${id}/tenants`)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              View Tenants
            </button>
            <button
              onClick={() => navigate(`/apartment/${id}/reports`)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading || !dashboardStats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner message="Loading dashboard..." />
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

export default ApartmentDashboard;
