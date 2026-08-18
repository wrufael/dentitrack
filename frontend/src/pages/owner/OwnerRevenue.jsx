import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  Trash2,
  Eye,
  RefreshCw,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

const OwnerRevenue = () => {
  const { user } = useAuth();
  const [revenues, setRevenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState(null);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    payment_method: 'all',
  });

  // ✅ FORM DATA - INCLUDES AMOUNT
  const [formData, setFormData] = useState({
    source: '',
    amount: '',           // ✅ AMOUNT FIELD - REQUIRED
    payment_method: 'cash',
    date: new Date().toISOString().split('T')[0],
    description: '',
    transaction_id: '',
  });

  const [summary, setSummary] = useState({
    today: 0,
    this_month: 0,
    total: 0,
  });

  const paymentMethods = [
    { value: 'cash', label: '💵 Cash' },
    { value: 'bank_transfer', label: '🏦 Bank Transfer' },
    { value: 'mobile_money', label: '📱 Mobile Money' },
    { value: 'card', label: '💳 Card' },
  ];

  useEffect(() => {
    fetchRevenues();
  }, [filters]);

  const fetchRevenues = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.payment_method !== 'all') params.append('payment_method', filters.payment_method);
      
      const response = await axios.get(`/api/revenue?${params.toString()}`);
      
      if (response.data.success) {
        setRevenues(response.data.data || []);
        setSummary(response.data.summary || { today: 0, this_month: 0, total: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch revenues:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  // ✅ HANDLE SUBMIT - WITH AMOUNT
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validate all required fields
    if (!formData.source) {
      toast.error('Please enter a source');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!formData.date) {
      toast.error('Please select a date');
      return;
    }

    try {
      const payload = {
        source: formData.source,
        amount: parseFloat(formData.amount), // ✅ Send amount as number
        payment_method: formData.payment_method,
        date: formData.date,
        description: formData.description || '',
        transaction_id: formData.transaction_id || '',
      };

      console.log('📤 Sending revenue payload:', payload);

      const response = await axios.post('/api/revenue', payload);
      
      if (response.data.success) {
        toast.success('✅ Revenue added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchRevenues();
      }
    } catch (error) {
      console.error('❌ Error adding revenue:', error);
      
      // ✅ Show detailed error
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          toast.error(`${key}: ${errors[key][0]}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to add revenue');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this revenue entry?')) return;
    
    try {
      await axios.delete(`/api/revenue/${id}`);
      toast.success('Revenue deleted successfully!');
      fetchRevenues();
    } catch (error) {
      toast.error('Failed to delete revenue');
    }
  };

  const resetForm = () => {
    setFormData({
      source: '',
      amount: '',
      payment_method: 'cash',
      date: new Date().toISOString().split('T')[0],
      description: '',
      transaction_id: '',
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount || 0);
  };

  const getPaymentMethodLabel = (method) => {
    const found = paymentMethods.find(m => m.value === method);
    return found ? found.label : method;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-teal-600" />
              Revenue Management
            </h1>
            <p className="text-gray-500 mt-1">Track all clinic revenue sources</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchRevenues}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add Revenue
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-teal-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-teal-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Today's Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(summary.today)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-blue-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">This Month</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(summary.this_month)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-purple-100 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="p-3 bg-purple-50 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatAmount(summary.total)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filters.start_date}
                onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <span className="text-gray-400">to</span>
              <input
                type="date"
                value={filters.end_date}
                onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
                className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <select
              value={filters.payment_method}
              onChange={(e) => setFilters({ ...filters, payment_method: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              {paymentMethods.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            <button
              onClick={() => setFilters({ start_date: '', end_date: '', payment_method: 'all' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Revenue Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="text-gray-400 mt-2">Loading revenue data...</p>
                    </td>
                  </tr>
                ) : revenues.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <DollarSign className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No revenue entries found</p>
                        <p className="text-gray-400 text-sm mt-1">Start tracking your clinic revenue</p>
                        <button
                          onClick={() => setShowAddModal(true)}
                          className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
                        >
                          + Add your first revenue entry
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  revenues.map((revenue) => (
                    <tr key={revenue.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(revenue.date).toLocaleDateString('en-ET', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{revenue.source}</p>
                          {revenue.description && (
                            <p className="text-xs text-gray-400">{revenue.description}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700">
                          {getPaymentMethodLabel(revenue.payment_method)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm font-bold text-teal-600">
                          {formatAmount(revenue.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedRevenue(revenue);
                              setShowDetailsModal(true);
                            }}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(revenue.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== ADD REVENUE MODAL ===== */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex justify-between items-center rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 rounded-xl">
                  <DollarSign className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add Revenue</h2>
                  <p className="text-sm text-gray-500">Record a new revenue entry</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Source */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Source <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="e.g., Filling - Patient Name"
                  required
                />
              </div>

              {/* ✅ AMOUNT FIELD - NOW VISIBLE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Amount (ETB) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">💰</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, payment_method: method.value })}
                      className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        formData.payment_method === method.value
                          ? 'border-teal-500 bg-teal-50 text-teal-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                  rows="2"
                  placeholder="Add additional details..."
                />
              </div>

              {/* Transaction ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Transaction ID <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.transaction_id}
                  onChange={(e) => setFormData({ ...formData, transaction_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Enter transaction reference"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all font-medium shadow-lg hover:shadow-xl"
                >
                  💾 Save Revenue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRevenue && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Revenue Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-2xl font-bold text-teal-600">{formatAmount(selectedRevenue.amount)}</p>
                </div>
                <span className="text-sm px-4 py-2 rounded-full bg-gray-100 text-gray-700">
                  {getPaymentMethodLabel(selectedRevenue.payment_method)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="font-medium text-gray-900">{selectedRevenue.source}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{new Date(selectedRevenue.date).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              {selectedRevenue.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium text-gray-900">{selectedRevenue.description}</p>
                </div>
              )}
              {selectedRevenue.transaction_id && (
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-mono text-sm text-gray-700">{selectedRevenue.transaction_id}</p>
                </div>
              )}
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full mt-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
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

export default OwnerRevenue;