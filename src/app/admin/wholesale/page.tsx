'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useAuthStore } from '@/store';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function AdminWholesalePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin') { router.push('/'); return; }
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/wholesale/requests?status=${filterStatus}&limit=50`);
      setRequests(data.data.requests);
    } catch { }
    setLoading(false);
  };

  const handleReview = async (action: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await api.put(`/wholesale/requests/${selectedRequest._id}`, { action, adminNote });
      toast.success(`Request ${action} successfully`);
      setSelectedRequest(null);
      setAdminNote('');
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 lg:ml-64">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Wholesale Requests</h1>

        {/* Status filter */}
        <div className="flex gap-2 mb-6">
          {['pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                filterStatus === s ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-20 skeleton-pulse bg-gray-200 rounded-xl" />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Clock className="w-12 h-12 mx-auto mb-3" />
            <p>No {filterStatus} requests</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req: any) => (
              <div key={req._id} className="card p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{req.businessName}</h3>
                      <span className={`badge text-xs ${
                        req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                        req.status === 'approved' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {req.fullName} · {req.user?.email} · {req.phone}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {req.city}, {req.state} · Monthly Volume: {req.expectedMonthlyVolume}
                    </p>
                    {req.gstNumber && <p className="text-xs text-gray-400">GST: {req.gstNumber}</p>}
                    <p className="text-xs text-gray-400 mt-1">
                      Submitted: {new Date(req.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Review Wholesale Request</h2>

            <div className="space-y-2 mb-5 text-sm">
              <p><strong>Business:</strong> {selectedRequest.businessName}</p>
              <p><strong>Owner:</strong> {selectedRequest.fullName}</p>
              <p><strong>Email:</strong> {selectedRequest.user?.email}</p>
              <p><strong>Phone:</strong> {selectedRequest.phone}</p>
              <p><strong>Address:</strong> {selectedRequest.businessAddress}, {selectedRequest.city}, {selectedRequest.state}</p>
              {selectedRequest.gstNumber && <p><strong>GST:</strong> {selectedRequest.gstNumber}</p>}
              <p><strong>Monthly Volume:</strong> {selectedRequest.expectedMonthlyVolume}</p>
            </div>

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Admin Note (optional)</label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={3}
                className="input-field resize-none"
                placeholder="Add a note for the user..."
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleReview('approved')}
                disabled={actionLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                onClick={() => handleReview('rejected')}
                disabled={actionLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={() => { setSelectedRequest(null); setAdminNote(''); }}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
