import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import ConnectionStatus from '../common/ConnectionStatus';

const Reports = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reportType, setReportType] = useState('daily');
  const [startDate, setStartDate] = useState('2024-06-01');
  const [endDate, setEndDate] = useState('2024-06-18');
  const [loading, setLoading] = useState(false);

  const { addNotification } = useNotification();

  const generateReport = async () => {
    setLoading(true);
    // This would integrate with the backend report generation
    setTimeout(() => {
      addNotification('Report generation feature coming soon!', 'info');
      setLoading(false);
    }, 1000);
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
              <p className="text-2xl font-bold text-blue-600">-</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-600">Total Units</h4>
              <p className="text-2xl font-bold text-green-600">-</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-600">Occupied Units</h4>
              <p className="text-2xl font-bold text-yellow-600">-</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-medium text-gray-600">Total Revenue</h4>
              <p className="text-2xl font-bold text-purple-600">KSh -M</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
