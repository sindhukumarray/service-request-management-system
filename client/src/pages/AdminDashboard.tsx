import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { ServiceRequest } from '../types';
import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState({
    total: 35,
    open: 18,
    inProgress: 10,
    resolved: 5,
    cancelled: 2
  });

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err: any) {
      setError('Failed to retrieve service requests for admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await api.put(`/requests/${id}/status`, { status: newStatus });
      alert('Status updated successfully!');
      fetchRequests();
    } catch (err: any) {
      alert(`Error updating status: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleAssign = async (id: string, assignedUserId: string) => {
    try {
      const res = await api.put(`/requests/${id}/assign`, { assignedTo: assignedUserId });
      alert(res.data.message || 'Assigned successfully.');
      fetchRequests();
    } catch (err: any) {
      alert('Assignment failed.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-red-100 text-red-600 p-2.5 rounded-xl">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Control Panel</h1>
          <p className="text-slate-500 mt-1">Review, assign, and manage all organization service requests.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Tickets</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-blue-500 uppercase">Open</span>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.open}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-purple-500 uppercase">In Progress</span>
          <p className="text-2xl font-bold text-purple-600 mt-1">{stats.inProgress}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-green-500 uppercase">Resolved</span>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.resolved}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-xs font-semibold text-slate-400 uppercase">Cancelled</span>
          <p className="text-2xl font-bold text-slate-500 mt-1">{stats.cancelled}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
          <button onClick={fetchRequests} className="text-red-700 hover:text-red-900">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <RefreshCw className="animate-spin h-8 w-8 text-brand-600" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Number</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignee</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-600">{req.requestNumber}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-xs truncate">{req.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.createdBy?.name || 'User'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${req.priority === 'HIGH' ? 'text-red-700 bg-red-50' : 'text-slate-700 bg-slate-100'}`}>
                        {req.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <select
                        value={req.status}
                        onChange={(e) => handleStatusChange(req._id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-1"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="IN_REVIEW">IN_REVIEW</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="RESOLVED">RESOLVED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <select
                        value={req.assignedTo?._id || ''}
                        onChange={(e) => handleAssign(req._id, e.target.value)}
                        className="bg-slate-50 border border-slate-300 text-slate-900 text-xs rounded-lg focus:ring-brand-500 focus:border-brand-500 block p-1"
                      >
                        <option value="">Unassigned</option>
                        <option value="60d5ec49867c2e36f0b48c1a">Admin User (admin@example.com)</option>
                        <option value="60d5ec49867c2e36f0b48c1b">Backup Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => navigate(`/request/${req._id}`)}
                        className="text-brand-600 hover:text-brand-900 px-3 py-1 bg-brand-50 hover:bg-brand-100 rounded-lg transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
