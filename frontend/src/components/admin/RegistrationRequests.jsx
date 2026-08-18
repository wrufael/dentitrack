import React, { useState, useEffect } from 'react';
import {
  EyeIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  UserIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';

const RegistrationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [pageLoading, setPageLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchRequests = async () => {
    setPageLoading(true);
    try {
      const res = await api.get('/admin/registrations', { params: { status: filter } });
      if (res.data.success) {
        setRequests(res.data.data.registrations);
        setStats(res.data.data.stats);
      } else {
        toast.error(res.data.message || 'Failed to load registration requests');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load registration requests');
    } finally {
      setPageLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-[#E0A400] px-3 py-1 rounded-full text-sm font-medium',
      approved: 'bg-green-100 text-[#1FAE6B] px-3 py-1 rounded-full text-sm font-medium',
      rejected: 'bg-red-100 text-[#E5484D] px-3 py-1 rounded-full text-sm font-medium'
    };
    return map[status] || 'bg-gray-100 text-[#5B6B72]';
  };

  const getStatusLabel = (status) => ({
    pending: '⏳ Pending', approved: '✅ Approved', rejected: '❌ Rejected'
  }[status] || status);

  const getPlanBadge = (plan) => ({
    basic: 'bg-gray-100 text-[#5B6B72]',
    standard: 'bg-blue-100 text-[#0EA5A5]',
    premium: 'bg-yellow-100 text-[#E0A400]'
  }[plan] || 'bg-gray-100 text-[#5B6B72]');

  const handleApprove = async (request) => {
    if (!window.confirm(`Approve ${request.clinic_name}?`)) return;
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/registrations/${request.id}/approve`);
      if (res.data.success) {
        toast.success(res.data.message || `✅ ${request.clinic_name} approved successfully!`);
        setShowDetailModal(false);
        fetchRequests();
      } else {
        toast.error(res.data.message || 'Failed to approve registration');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve registration');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    if (rejectReason.trim().length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.patch(`/admin/registrations/${selectedRequest.id}/reject`, {
        admin_notes: rejectReason,
      });
      if (res.data.success) {
        toast.error(`❌ ${selectedRequest.clinic_name} rejected`);
        setShowRejectModal(false);
        setShowDetailModal(false);
        setRejectReason('');
        fetchRequests();
      } else {
        toast.error(res.data.message || 'Failed to reject registration');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject registration');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#2B2B2B]">📋 Registration Requests</h1>
          <p className="text-[#5B6B72] text-sm">Review and manage clinic registration requests</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-[#5B6B72]">Total Requests</div>
          <div className="text-2xl font-heading font-bold text-[#2B2B2B]">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#E0A400]">
          <div className="text-sm text-[#5B6B72]">Pending</div>
          <div className="text-2xl font-heading font-bold text-[#E0A400]">{stats.pending}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#1FAE6B]">
          <div className="text-sm text-[#5B6B72]">Approved</div>
          <div className="text-2xl font-heading font-bold text-[#1FAE6B]">{stats.approved}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#E5484D]">
          <div className="text-sm text-[#5B6B72]">Rejected</div>
          <div className="text-2xl font-heading font-bold text-[#E5484D]">{stats.rejected}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status ? 'bg-[#0EA5A5] text-white shadow-md' : 'bg-gray-100 text-[#5B6B72] hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? '📋 All' : status === 'pending' ? '⏳ Pending' : status === 'approved' ? '✅ Approved' : '❌ Rejected'}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        {pageLoading ? (
          <div className="text-center py-8 text-[#5B6B72]">
            <div className="w-8 h-8 border-2 border-[#0EA5A5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p>Loading registration requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8 text-[#5B6B72]">
            <div className="text-4xl mb-2">📋</div>
            <p>No registration requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="bg-[#F2F8FB] rounded-xl p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] flex items-center justify-center text-white font-bold text-lg">
                      {request.clinic_name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[#2B2B2B]">{request.clinic_name}</div>
                      <div className="text-sm text-[#5B6B72]">{request.owner_name} · {request.owner_email}</div>
                      <div className="text-xs text-[#5B6B72] flex items-center gap-2">
                        <ClockIcon className="w-3 h-3" />
                        {new Date(request.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanBadge(request.requested_plan)}`}>
                      {request.requested_plan.toUpperCase()}
                    </span>
                    <span className={getStatusBadge(request.status)}>{getStatusLabel(request.status)}</span>
                    <button
                      onClick={() => { setSelectedRequest(request); setShowDetailModal(true); }}
                      className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] p-6 rounded-t-2xl sticky top-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-white">🏥 Registration Request</h2>
                  <p className="text-white/80 text-sm">{selectedRequest.clinic_name}</p>
                </div>
                <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-white/20 rounded-lg text-white">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#F2F8FB] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <BuildingOfficeIcon className="w-5 h-5 text-[#0EA5A5]" />
                    <span className="text-sm font-semibold text-[#2B2B2B]">Clinic Information</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-gray-200 pb-1"><span className="text-[#5B6B72]">Email</span><span className="font-medium">{selectedRequest.clinic_email}</span></div>
                    <div className="flex justify-between border-b border-gray-200 pb-1"><span className="text-[#5B6B72]">Phone</span><span className="font-medium">{selectedRequest.clinic_phone}</span></div>
                    <div className="flex justify-between"><span className="text-[#5B6B72]">Address</span><span className="font-medium">{selectedRequest.address}, {selectedRequest.city}</span></div>
                  </div>
                </div>
                <div className="bg-[#F2F8FB] rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <UserIcon className="w-5 h-5 text-[#0EA5A5]" />
                    <span className="text-sm font-semibold text-[#2B2B2B]">Owner Information</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between border-b border-gray-200 pb-1"><span className="text-[#5B6B72]">Name</span><span className="font-medium">{selectedRequest.owner_name}</span></div>
                    <div className="flex justify-between border-b border-gray-200 pb-1"><span className="text-[#5B6B72]">Email</span><span className="font-medium">{selectedRequest.owner_email}</span></div>
                    <div className="flex justify-between"><span className="text-[#5B6B72]">Phone</span><span className="font-medium">{selectedRequest.owner_phone}</span></div>
                  </div>
                </div>
              </div>

              {selectedRequest.admin_notes && (
                <div className="bg-[#F2F8FB] rounded-xl p-4">
                  <div className="text-sm text-[#5B6B72]">Admin Notes</div>
                  <div className="text-sm text-[#2B2B2B]">{selectedRequest.admin_notes}</div>
                </div>
              )}

              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    disabled={actionLoading}
                    onClick={() => { setShowDetailModal(false); setShowRejectModal(true); }}
                    className="flex-1 bg-[#E5484D] text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <XMarkIcon className="w-5 h-5" /> Reject
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleApprove(selectedRequest)}
                    className="flex-1 bg-[#1FAE6B] text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircleIcon className="w-5 h-5" /> {actionLoading ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-heading font-bold text-[#2B2B2B]">❌ Reject Request</h3>
              <button onClick={() => setShowRejectModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-6 h-6 text-[#5B6B72]" />
              </button>
            </div>
            <p className="text-sm text-[#5B6B72] mb-4">
              Please provide a reason for rejecting <strong>{selectedRequest.clinic_name}</strong> (minimum 10 characters)
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="input-field"
              rows="4"
              placeholder="e.g., Invalid license document, Missing information, etc."
            />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 bg-gray-100 text-[#2B2B2B] py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-all">Cancel</button>
              <button disabled={actionLoading} onClick={handleReject} className="flex-1 bg-[#E5484D] text-white py-2.5 rounded-xl font-medium hover:bg-red-600 transition-all disabled:opacity-50">
                {actionLoading ? 'Rejecting...' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationRequests;