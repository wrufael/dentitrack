import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Calendar,
  DollarSign,
  User,
  Building2,
  Wifi,
  ShoppingBag,
  Megaphone,
  Wrench,
  Shield,
  Laptop,
  GraduationCap,
  Landmark,
  MoreHorizontal,
  Trash2,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const OwnerExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total: 0,
    today: 0,
    this_month: 0,
    by_category: {}
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    start_date: '',
    end_date: '',
  });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    category: 'other',
    employee_id: null,
    employee_name: '',
    employee_role: '',
    payment_method: 'cash',
    transaction_id: '',
    notes: '',
  });

  const categories = [
    { value: 'salary', label: '💰 Salary', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { value: 'rent', label: '🏢 Rent', icon: Building2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { value: 'utilities', label: '💡 Utilities', icon: Wifi, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { value: 'inventory', label: '📦 Inventory', icon: ShoppingBag, color: 'text-green-600', bg: 'bg-green-50' },
    { value: 'marketing', label: '📢 Marketing', icon: Megaphone, color: 'text-pink-600', bg: 'bg-pink-50' },
    { value: 'maintenance', label: '🔧 Maintenance', icon: Wrench, color: 'text-orange-600', bg: 'bg-orange-50' },
    { value: 'insurance', label: '🛡️ Insurance', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { value: 'software', label: '💻 Software', icon: Laptop, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { value: 'training', label: '📚 Training', icon: GraduationCap, color: 'text-red-600', bg: 'bg-red-50' },
    { value: 'tax', label: '🏛️ Tax', icon: Landmark, color: 'text-gray-600', bg: 'bg-gray-50' },
    { value: 'other', label: '📋 Other', icon: MoreHorizontal, color: 'text-gray-500', bg: 'bg-gray-50' },
  ];

  const statusColors = {
    pending: 'text-yellow-600 bg-yellow-50',
    approved: 'text-blue-600 bg-blue-50',
    paid: 'text-green-600 bg-green-50',
    cancelled: 'text-red-600 bg-red-50',
  };

  useEffect(() => {
    fetchExpenses();
    fetchEmployees();
  }, [filters]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      
      const response = await api.get(`/expenses?${params.toString()}`);
      
      if (response.data.success) {
        setExpenses(response.data.data || []);
        setSummary(response.data.summary || { 
          total: 0, 
          today: 0, 
          this_month: 0, 
          by_category: {} 
        });
      }
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/expenses/employees');
      if (response.data.success) {
        setEmployees(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title) {
      toast.error('Title is required');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (!formData.category) {
      toast.error('Category is required');
      return;
    }
    if (!formData.expense_date) {
      toast.error('Date is required');
      return;
    }

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description?.trim() || '',
        amount: parseFloat(formData.amount),
        expense_date: formData.expense_date,
        category: formData.category,
        employee_id: formData.employee_id || null,
        employee_name: formData.employee_name || '',
        employee_role: formData.employee_role || '',
        payment_method: formData.payment_method || 'cash',
        transaction_id: formData.transaction_id?.trim() || '',
        notes: formData.notes?.trim() || '',
      };

      console.log('📤 Sending expense:', payload);

      const response = await api.post('/expenses', payload);
      
      if (response.data.success) {
        toast.success('✅ Expense added successfully!');
        setShowAddModal(false);
        resetForm();
        fetchExpenses();
      }
    } catch (error) {
      console.error('❌ Save error:', error);
      
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          toast.error(`${key}: ${errors[key][0]}`);
        });
      } else {
        toast.error(error.response?.data?.message || 'Failed to add expense');
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted successfully!');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      category: 'other',
      employee_id: null,
      employee_name: '',
      employee_role: '',
      payment_method: 'cash',
      transaction_id: '',
      notes: '',
    });
  };

  const getCategoryIcon = (category) => {
    const cat = categories.find(c => c.value === category);
    return cat || categories.find(c => c.value === 'other');
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount || 0);
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expenses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-500">Track and manage all clinic expenses</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchExpenses}
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
            Add Expense
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Today's Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.today)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">This Month</p>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.this_month)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatAmount(summary.total)}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">From</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">To</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ category: 'all', status: 'all', start_date: '', end_date: '' })}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">No expenses found</p>
            <p className="text-gray-400 text-sm mt-1">Start tracking your clinic expenses</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
            >
              + Add your first expense
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((expense) => {
            const category = getCategoryIcon(expense.category);
            const CategoryIcon = category.icon;
            
            return (
              <div key={expense.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${category.bg}`}>
                      <CategoryIcon className={`w-5 h-5 ${category.color}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{expense.title}</h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                        <span>{category.label}</span>
                        <span>•</span>
                        <span>{new Date(expense.expense_date).toLocaleDateString()}</span>
                        {expense.employee_name && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {expense.employee_name} ({expense.employee_role})
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">{formatAmount(expense.amount)}</p>
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[expense.status]}`}>
                        {expense.status.charAt(0).toUpperCase() + expense.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setSelectedExpense(expense);
                          setShowDetailsModal(true);
                        }}
                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex justify-between items-center rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 rounded-xl">
                  <DollarSign className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add Expense</h2>
                  <p className="text-sm text-gray-500">Record a new expense entry</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="e.g., Staff Salary - July 2026"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              {formData.category === 'salary' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Employee <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.employee_id || ''}
                    onChange={(e) => {
                      const employeeId = e.target.value ? parseInt(e.target.value) : null;
                      const employee = employees.find(emp => emp.id === employeeId);
                      setFormData({
                        ...formData,
                        employee_id: employeeId,
                        employee_name: employee ? employee.name : '',
                        employee_role: employee ? employee.role : '',
                      });
                    }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    required={formData.category === 'salary'}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      value={formData.expense_date}
                      onChange={(e) => setFormData({ ...formData, expense_date: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                  rows="2"
                  placeholder="Add details about this expense..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Payment Method
                </label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                >
                  <option value="cash">💰 Cash</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="cheque">📝 Cheque</option>
                  <option value="mobile_money">📱 Mobile Money</option>
                </select>
              </div>

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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Notes <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Additional notes..."
                />
              </div>

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
                  💾 Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetailsModal && selectedExpense && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Expense Details</h3>
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
                  <p className="text-2xl font-bold text-red-600">- {formatAmount(selectedExpense.amount)}</p>
                </div>
                <span className={`text-sm px-4 py-2 rounded-full ${statusColors[selectedExpense.status]}`}>
                  {selectedExpense.status.charAt(0).toUpperCase() + selectedExpense.status.slice(1)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Title</p>
                <p className="font-medium text-gray-900">{selectedExpense.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium text-gray-900">
                  {categories.find(c => c.value === selectedExpense.category)?.label || selectedExpense.category}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium text-gray-900">{new Date(selectedExpense.expense_date).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              {selectedExpense.employee_name && (
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="font-medium text-gray-900">{selectedExpense.employee_name} ({selectedExpense.employee_role})</p>
                </div>
              )}
              {selectedExpense.description && (
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="font-medium text-gray-900">{selectedExpense.description}</p>
                </div>
              )}
              {selectedExpense.transaction_id && (
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-mono text-sm text-gray-700">{selectedExpense.transaction_id}</p>
                </div>
              )}
              {selectedExpense.notes && (
                <div>
                  <p className="text-sm text-gray-500">Notes</p>
                  <p className="font-medium text-gray-900">{selectedExpense.notes}</p>
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

export default OwnerExpenses;