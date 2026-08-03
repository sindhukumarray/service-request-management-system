import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { ServiceRequest } from '../types';
import { Eye, Plus, AlertCircle, RefreshCw, XCircle } from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/requests');
      setRequests(res.data);
    } catch (err: any) {
      setError('Could not retrieve requests. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleCancelRequest = async (id: string) => {
    try {
      await api.post(`/requests/${id}/cancel`);
      alert('Request cancelled successfully.');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to cancel request');
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-blue-100 text-blue-800';
      case 'IN_REVIEW':
        return 'bg-amber-100 text-amber-800';
      case 'IN_PROGRESS':
        return 'bg-purple-100 text-purple-800';
      case 'RESOLVED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-500';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityBadgeClass = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'text-red-600 bg-red-50';
      case 'MEDIUM': return 'text-amber-600 bg-amber-50';
      case 'LOW': return 'text-green-600 bg-green-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Your Service Requests</h1>
          <p className="text-slate-500 mt-1">Raise, track, and manage your support tickets.</p>
        </div>
        <Link
          to="/create-request"
          className="flex items-center space-x-1 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-lg text-sm font-semibold shadow-md transition"
        >
          <Plus className="h-4 w-4" />
          <span>New Request</span>
        </Link>
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
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-slate-500">No requests found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Request ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Title</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Created By (Leak)</th>
                <th scope="col" className="px-6 py-3 className='text-right' text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {requests.map((req) => (
                <tr key={req._id} className="hover:bg-slate-50/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-brand-600">{req.requestNumber}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900 max-w-xs truncate">{req.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{req.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPriorityBadgeClass(req.priority)}`}>
                      {req.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(req.status)}`}>
                      {req.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {req.createdBy?.name || 'Unknown'} ({req.createdBy?.email || 'N/A'})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => navigate(`/request/${req._id}`)}
                      className="inline-flex items-center space-x-1 text-slate-600 hover:text-brand-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View</span>
                    </button>
                    
                    {req.status !== 'CANCELLED' && req.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleCancelRequest(req._id)}
                        className="inline-flex items-center space-x-1 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition border border-red-200"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
