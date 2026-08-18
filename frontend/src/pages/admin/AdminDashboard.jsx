import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, XCircle, Clock, Eye, AlertCircle, RefreshCw, CreditCard, Building2, User, Mail, Phone } from 'lucide-react';

const RegistrationRequests = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ all: 0 });
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get('/admin/registrations');
      console.log('Registrations response:', response.data);
      
      if (response.data.success !== false) {
        const data = response.data.registrations || [];
        setRegistrations(data);
        setStats({ all: data.length });
      } else {
        setError(response.data.message || 'Failed to fetch registrations');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError(error.response?.data?.message || 'Failed to fetch registrations.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200', label: 'Active' },
      pending_payment: { icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'Payment Pending' },
      pending: { icon: Clock, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Pending' },
      rejected: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'Rejected' },
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${badge.color} inline-flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  const getPlanBadge = (plan) => {
    const colors = {
      basic: 'bg-gray-100 text-gray-700',
      standard: 'bg-blue-100 text-blue-700',
      premium: 'bg-purple-100 text-purple-700'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[plan] || colors.basic}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    );
  };

  const getFilteredRegistrations = () => {
    if (filter === 'all') return registrations;
    return registrations.filter(r => r.status === filter);
  };

  const filteredRegistrations = getFilteredRegistrations();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading registrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registered Clinics</h1>
          <p className="text-sm text-gray-500">View all registered clinics and their subscription details</p>
        </div>
        <button
          onClick={fetchRegistrations}
          className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-teal-600">{stats.all}</p>
          <p className="text-sm text-gray-600">Total Registered</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">
            {registrations.filter(r => r.status === 'active').length}
          </p>
          <p className="text-sm text-gray-600">Active Subscriptions</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-yellow-600">
            {registrations.filter(r => r.status === 'pending_payment').length}
          </p>
          <p className="text-sm text-gray-600">Payment Pending</p>
        </div>
        <div className="bg-white border rounded-lg p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-blue-600">
            {registrations.filter(r => r.status === 'pending').length}
          </p>
          <p className="text-sm text-gray-600">Pending Verification</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'active', 'pending_payment', 'pending', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
              filter === status
                ? 'bg-teal-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ')}
            <span className="ml-1 text-xs opacity-75">
              ({registrations.filter(r => r.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filteredRegistrations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No registrations found</p>
          <p className="text-sm text-gray-400 mt-1">All caught up!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRegistrations.map((reg) => (
            <div key={reg.id} className="bg-white rounded-lg shadow border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">{reg.clinic_name}</h3>
                    {getStatusBadge(reg.status)}
                    {getPlanBadge(reg.subscription_plan)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Owner:</span>
                      <span className="font-medium text-gray-900">{reg.owner_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium text-gray-900">{reg.owner_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Phone:</span>
                      <span className="font-medium text-gray-900">{reg.owner_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Clinic:</span>
                      <span className="font-medium text-gray-900">{reg.clinic_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Plan:</span>
                      <span className="font-medium text-gray-900 capitalize">{reg.subscription_plan}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Registered:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(reg.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {reg.transaction_id && (
                    <div className="mt-3 text-sm bg-gray-50 rounded-lg p-2">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-mono text-gray-900 ml-2">{reg.transaction_id}</span>
                    </div>
                  )}
                </div>

                {/* Actions - View Only */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-start">
                  <button
                    onClick={() => {
                      setSelectedRegistration(reg);
                      setShowDetails(true);
                    }}
                    className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedRegistration && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Registration Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Clinic Name</p>
                  <p className="font-semibold">{selectedRegistration.clinic_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedRegistration.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plan</p>
                  <div className="mt-1">{getPlanBadge(selectedRegistration.subscription_plan)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registered</p>
                  <p className="font-semibold">
                    {new Date(selectedRegistration.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <hr />
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Owner Information</h3>
                <div className="space-y-1">
                  <p><span className="text-gray-500">Name:</span> {selectedRegistration.owner_name}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedRegistration.owner_email}</p>
                  <p><span className="text-gray-500">Phone:</span> {selectedRegistration.owner_phone}</p>
                </div>
              </div>
              
              <hr />
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Clinic Information</h3>
                <div className="space-y-1">
                  <p><span className="text-gray-500">Email:</span> {selectedRegistration.clinic_email}</p>
                  <p><span className="text-gray-500">Phone:</span> {selectedRegistration.clinic_phone}</p>
                  <p><span className="text-gray-500">Address:</span> {selectedRegistration.address || 'Not provided'}</p>
                  <p><span className="text-gray-500">City:</span> {selectedRegistration.city || 'Not provided'}</p>
                  <p><span className="text-gray-500">Country:</span> {selectedRegistration.country || 'Ethiopia'}</p>
                </div>
              </div>
              
              {selectedRegistration.transaction_id && (
                <>
                  <hr />
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Payment Information</h3>
                    <div className="space-y-1">
                      <p><span className="text-gray-500">Transaction ID:</span> <span className="font-mono">{selectedRegistration.transaction_id}</span></p>
                      <p><span className="text-gray-500">Payment Method:</span> {selectedRegistration.payment_method || 'Not specified'}</p>
                    </div>
                  </div>
                </>
              )}
              
              <button
                onClick={() => setShowDetails(false)}
                className="w-full mt-4 bg-teal-500 text-white rounded-lg py-2.5 font-medium hover:bg-teal-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationRequests;