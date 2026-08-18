// src/components/owner/InventoryManagement.jsx
// FIX: The "Adjust Stock" (restock) modal now has Buying Price / Selling
// Price fields. Before, restocking only sent a quantity delta with no way
// to enter a new price, so every restock silently kept the OLD price —
// even though the backend was already built to accept a new one.

import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  Plus,
  Search,
  Package,
  AlertCircle,
  X,
  Trash2,
  RefreshCw,
  Box,
  Pill,
  Syringe,
  Clipboard,
  Info,
  Eye,
  PackagePlus,
  Calendar,
  Truck,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'consumable', label: '🔄 Consumables', icon: Package },
  { value: 'medication', label: '💊 Medications', icon: Pill },
  { value: 'instrument', label: '🔧 Instruments', icon: Syringe },
  { value: 'equipment', label: '⚙️ Equipment', icon: Box },
  { value: 'other', label: '📋 Other', icon: Clipboard },
];

const emptyForm = {
  name: '',
  category: 'consumable',
  quantity: '',
  buying_price: '',
  selling_price: '',
  low_stock_threshold: '10',
  supplier: '',
  description: '',
};

export default function InventoryManagement() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filters, setFilters] = useState({
    category: 'all',
    search: '',
  });
  const [summary, setSummary] = useState({
    total_value: 0,
    total_cost: 0,
    potential_revenue: 0,
    potential_profit: 0,
    low_stock: 0,
  });

  // ✅ Detail modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // ✅ Restock modal (single confirm — avoids firing one request per click)
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockMode, setRestockMode] = useState('add'); // 'add' | 'remove'
  const [restockQty, setRestockQty] = useState('1');
  // ✅ NEW: editable prices for this restock. Pre-filled with the item's
  // current prices so the fields are never blank — the user only needs to
  // change them if this batch actually costs something different.
  const [restockBuyPrice, setRestockBuyPrice] = useState('');
  const [restockSellPrice, setRestockSellPrice] = useState('');
  const [restocking, setRestocking] = useState(false);

  // ✅ Check if user has clinic_id
  const hasClinic = user?.clinic_id;

  useEffect(() => {
    if (!hasClinic) {
      toast.error('⚠️ No clinic found. Please contact admin.');
      setLoading(false);
      return;
    }
    fetchInventory();
  }, [filters, hasClinic]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category !== 'all') params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/inventory?${params.toString()}`);

      if (response.data.success) {
        setItems(response.data.data || []);
        setSummary(response.data.summary || {
          total_value: 0,
          total_cost: 0,
          potential_revenue: 0,
          potential_profit: 0,
          low_stock: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      toast.error(error.response?.data?.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Check if user has clinic_id
    if (!hasClinic) {
      toast.error('❌ No clinic found. Please contact admin.');
      return;
    }

    if (!form.name) {
      toast.error('Please enter item name');
      return;
    }
    if (!form.quantity || parseInt(form.quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (!form.buying_price || parseFloat(form.buying_price) <= 0) {
      toast.error('Please enter a valid buying price');
      return;
    }
    if (!form.selling_price || parseFloat(form.selling_price) <= 0) {
      toast.error('Please enter a valid selling price');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        category: form.category,
        quantity: parseInt(form.quantity),
        buying_price: parseFloat(form.buying_price),
        selling_price: parseFloat(form.selling_price),
        low_stock_threshold: parseInt(form.low_stock_threshold) || 10,
        supplier: form.supplier || '',
        description: form.description || '',
      };

      const response = await api.post('/inventory', payload);

      if (response.data.success) {
        toast.success('✅ Item added to inventory!');
        if (response.data.expense_created) {
          toast.success('💰 Expense recorded automatically!');
        } else if (response.data.expense) {
          toast.success('💰 Expense total updated (existing item)!');
        }
        setShowForm(false);
        resetForm();
        fetchInventory();
      }
    } catch (error) {
      console.error('❌ Error adding inventory:', error);

      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        Object.keys(errors).forEach(key => {
          toast.error(`${key}: ${errors[key][0]}`);
        });
      } else {
        toast.error('Failed to add inventory item. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await api.delete(`/inventory/${id}`);
      toast.success('Item deleted successfully!');
      fetchInventory();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  // ===== VIEW DETAILS =====
  const openDetailModal = (item) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // ===== RESTOCK (single confirm, one API call) =====
  const openRestockModal = (item, mode = 'add') => {
    setRestockItem(item);
    setRestockMode(mode);
    setRestockQty('1');
    // ✅ Pre-fill with the item's current prices so the fields always show
    // something sensible. The user edits these only when THIS batch's
    // price is actually different.
    setRestockBuyPrice(item.buy_price != null ? String(item.buy_price) : '');
    setRestockSellPrice(item.sell_price != null ? String(item.sell_price) : '');
    setShowRestockModal(true);
  };

  const closeRestockModal = () => {
    setShowRestockModal(false);
    setRestockItem(null);
    setRestockQty('1');
    setRestockBuyPrice('');
    setRestockSellPrice('');
  };

  const handleRestockSubmit = async (e) => {
    e.preventDefault();
    const qty = parseInt(restockQty);

    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    if (restockMode === 'remove' && qty > restockItem.quantity) {
      toast.error('Cannot remove more than current stock');
      return;
    }

    // Only validate/send prices when ADDING stock — removing stock never
    // touches price or expenses.
    let buyPriceNum = null;
    let sellPriceNum = null;
    if (restockMode === 'add') {
      buyPriceNum = parseFloat(restockBuyPrice);
      sellPriceNum = parseFloat(restockSellPrice);
      if (!restockBuyPrice || isNaN(buyPriceNum) || buyPriceNum < 0) {
        toast.error('Please enter a valid buying price for this restock');
        return;
      }
      if (!restockSellPrice || isNaN(sellPriceNum) || sellPriceNum < 0) {
        toast.error('Please enter a valid selling price for this restock');
        return;
      }
    }

    const delta = restockMode === 'add' ? qty : -qty;

    const payload = { quantity: delta };
    if (restockMode === 'add') {
      payload.buying_price = buyPriceNum;
      payload.selling_price = sellPriceNum;
    }

    try {
      setRestocking(true);
      // ✅ ONE request per confirm. On 'add', this now also carries the
      // batch's buying/selling price so the backend can fold the real
      // cost into the item's expense total instead of reusing the old price.
      const response = await api.patch(`/inventory/${restockItem.id}/restock`, payload);

      if (restockMode === 'add') {
        toast.success(`✅ Added ${qty} × ${restockItem.name} to stock`);
        if (response.data?.expense_updated) {
          toast.success(`💰 Expense updated: +${qty} @ ${buyPriceNum} ETB each`);
        }
      } else {
        toast.success(`✅ Removed ${qty} × ${restockItem.name} from stock`);
      }

      closeRestockModal();
      fetchInventory();
    } catch (error) {
      console.error('Restock error:', error);
      toast.error(error.response?.data?.message || 'Failed to update stock');
    } finally {
      setRestocking(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-ET', {
      style: 'currency',
      currency: 'ETB',
    }).format(amount || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusColor = (quantity, lowStockThreshold) => {
    if (quantity <= 0) return 'bg-red-100 text-red-800';
    if (lowStockThreshold && quantity <= lowStockThreshold) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (quantity, lowStockThreshold) => {
    if (quantity <= 0) return 'Out of Stock';
    if (lowStockThreshold && quantity <= lowStockThreshold) return 'Low Stock';
    return 'In Stock';
  };

  const getCategoryIcon = (category) => {
    const found = CATEGORIES.find(c => c.value === category);
    return found ? found.icon : Package;
  };

  const getCategoryLabel = (category) => {
    const found = CATEGORIES.find(c => c.value === category);
    return found ? found.label : category;
  };

  const lowStockItems = useMemo(() => {
    return items.filter(i => i.quantity <= (i.low_stock_threshold || 10));
  }, [items]);

  // ✅ Show error if no clinic
  if (!hasClinic && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl border border-red-200 p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">⚠️ No Clinic Found</h2>
          <p className="text-gray-600 mb-4">
            Your account is not assigned to any clinic.
            Please contact your administrator to set up your clinic access.
          </p>
          <p className="text-sm text-gray-400">
            User ID: {user?.id || 'Unknown'} | Role: {user?.role || 'Unknown'}
          </p>
        </div>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-8 h-8 text-teal-600" />
              Inventory Management
            </h1>
            <p className="text-gray-500 mt-1">Track and manage all clinic inventory items</p>
            {user?.clinic_id && (
              <p className="text-xs text-gray-400 mt-1">
                Clinic ID: {user.clinic_id} | {user?.clinic_name || 'Your Clinic'}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={fetchInventory}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Add Item
            </button>
          </div>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                {lowStockItems.length} item(s) low on stock
              </p>
              <p className="text-xs text-red-500">
                {lowStockItems.map(i => i.name).join(', ')}
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Total Inventory Value</p>
            <p className="text-2xl font-bold text-teal-600">{formatAmount(summary.total_value || 0)}</p>
            <p className="text-xs text-gray-400">Cost price</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Potential Revenue</p>
            <p className="text-2xl font-bold text-blue-600">{formatAmount(summary.potential_revenue || 0)}</p>
            <p className="text-xs text-gray-400">At selling price</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Potential Profit</p>
            <p className="text-2xl font-bold text-green-600">{formatAmount(summary.potential_profit || 0)}</p>
            <p className="text-xs text-gray-400">Revenue - Cost</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <p className="text-sm text-gray-500">Low Stock Items</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.low_stock || 0}</p>
            <p className="text-xs text-gray-400">Need restocking</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-800 font-medium">Auto-Expense Tracking</p>
              <p className="text-sm text-blue-700">
                Adding a brand-new item records its cost as a fresh expense. Restocking an
                existing item — even at a different price — adds that cost onto the item's
                existing expense instead of creating a new row.
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search inventory..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setFilters({ category: 'all', search: '' })}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Buying Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <Package className="w-12 h-12 text-gray-300 mb-3" />
                        <p className="text-gray-500 font-medium">No inventory items found</p>
                        <p className="text-gray-400 text-sm mt-1">Start adding items to your inventory</p>
                        <button
                          onClick={() => setShowForm(true)}
                          className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
                        >
                          + Add your first item
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const CategoryIcon = getCategoryIcon(item.category);
                    const statusColor = getStatusColor(item.quantity, item.low_stock_threshold);
                    const statusText = getStatusText(item.quantity, item.low_stock_threshold);

                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => openDetailModal(item)}
                            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                          >
                            <div className="p-2 bg-gray-50 rounded-lg">
                              <CategoryIcon className="w-4 h-4 text-gray-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{item.name}</p>
                              {item.supplier && (
                                <p className="text-xs text-gray-400">{item.supplier}</p>
                              )}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                            {getCategoryLabel(item.category)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-sm font-medium text-gray-900">
                            {item.quantity}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {formatAmount(item.buy_price)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {formatAmount(item.sell_price)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-gray-900">
                            {formatAmount(item.quantity * item.buy_price)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-xs px-3 py-1 rounded-full ${statusColor}`}>
                            {statusText}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => openDetailModal(item)}
                              className="p-1.5 hover:bg-teal-50 rounded-lg transition-colors"
                              title="View details"
                            >
                              <Eye className="w-4 h-4 text-gray-400 hover:text-teal-600" />
                            </button>
                            <button
                              onClick={() => openRestockModal(item, 'add')}
                              className="p-1.5 hover:bg-green-50 rounded-lg transition-colors"
                              title="Restock"
                            >
                              <PackagePlus className="w-4 h-4 text-gray-400 hover:text-green-600" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex justify-between items-center rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 rounded-xl">
                  {React.createElement(getCategoryIcon(selectedItem.category), { className: 'w-6 h-6 text-teal-600' })}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedItem.name}</h2>
                  <p className="text-sm text-gray-500">{getCategoryLabel(selectedItem.category)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusColor(selectedItem.quantity, selectedItem.low_stock_threshold)}`}>
                  {getStatusText(selectedItem.quantity, selectedItem.low_stock_threshold)}
                </span>
                <span className="text-sm text-gray-500">
                  Low stock alert at {selectedItem.low_stock_threshold || 10}
                </span>
              </div>

              {/* Stock & Value */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400">Quantity in Stock</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedItem.quantity}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {formatAmount(selectedItem.quantity * selectedItem.buy_price)}
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 mb-2">Pricing</p>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Buying Price</p>
                    <p className="font-medium text-gray-900">{formatAmount(selectedItem.buy_price)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Selling Price</p>
                    <p className="font-medium text-gray-900">{formatAmount(selectedItem.sell_price)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Margin / Unit</p>
                    <p className="font-medium text-green-600">
                      {formatAmount((selectedItem.sell_price || 0) - (selectedItem.buy_price || 0))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Supplier */}
              {selectedItem.supplier && (
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                  <Truck className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Supplier</p>
                    <p className="text-sm font-medium text-gray-900">{selectedItem.supplier}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedItem.description && (
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                  <FileText className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-400">Description</p>
                    <p className="text-sm text-gray-700">{selectedItem.description}</p>
                  </div>
                </div>
              )}

              {/* Dates */}
              {(selectedItem.created_at || selectedItem.updated_at) && (
                <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedItem.created_at && (
                      <div>
                        <p className="text-xs text-gray-400">Added</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedItem.created_at)}</p>
                      </div>
                    )}
                    {selectedItem.updated_at && (
                      <div>
                        <p className="text-xs text-gray-400">Last Updated</p>
                        <p className="font-medium text-gray-900">{formatDate(selectedItem.updated_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openRestockModal(selectedItem, 'add');
                  }}
                  className="flex-1 bg-[#0EA5A5] text-white py-2.5 rounded-xl font-medium hover:bg-[#0B7A7A] transition-all flex items-center justify-center gap-2"
                >
                  <PackagePlus className="w-4 h-4" />
                  Restock
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== RESTOCK MODAL — now with editable price fields ===== */}
      {showRestockModal && restockItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-100 px-6 py-5 flex justify-between items-center rounded-t-3xl sticky top-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 rounded-xl">
                  <PackagePlus className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Adjust Stock</h2>
                  <p className="text-sm text-gray-500">{restockItem.name} · currently {restockItem.quantity} in stock</p>
                </div>
              </div>
              <button
                onClick={closeRestockModal}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="p-6 space-y-4">
              {/* Add / Remove toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRestockMode('add')}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    restockMode === 'add' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setRestockMode('remove')}
                  className={`py-2 rounded-lg text-sm font-medium transition-all ${
                    restockMode === 'remove' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  − Remove Stock
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Quantity to {restockMode === 'add' ? 'add' : 'remove'}
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="1"
                  autoFocus
                  required
                />
              </div>

              {/* ✅ NEW: price fields — only shown & required when ADDING stock,
                  since removing stock has no price and no expense impact. */}
              {restockMode === 'add' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Buying Price (ETB) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={restockBuyPrice}
                      onChange={(e) => setRestockBuyPrice(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                      required
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      This batch's cost — change it if it's different from before.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Selling Price (ETB) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={restockSellPrice}
                      onChange={(e) => setRestockSellPrice(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between text-sm">
                <span className="text-gray-500">New quantity will be</span>
                <span className="font-semibold text-gray-900">
                  {restockMode === 'add'
                    ? restockItem.quantity + (parseInt(restockQty) || 0)
                    : Math.max(0, restockItem.quantity - (parseInt(restockQty) || 0))}
                </span>
              </div>

              {restockMode === 'add' && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between text-sm">
                  <span className="text-blue-700">This restock will add to the expense total</span>
                  <span className="font-semibold text-blue-900">
                    {formatAmount((parseInt(restockQty) || 0) * (parseFloat(restockBuyPrice) || 0))}
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeRestockModal}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={restocking}
                  className="flex-1 px-4 py-3 bg-[#0EA5A5] text-white rounded-xl hover:bg-[#0B7A7A] transition-all font-medium disabled:opacity-50"
                >
                  {restocking ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-5 flex justify-between items-center rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-50 rounded-xl">
                  <Package className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add Inventory Item</h2>
                  <p className="text-sm text-gray-500">
                    New item name: creates it + records an expense. Existing item name: restocks it
                    and adds to its existing expense instead.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForm(false);
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
                  Item Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="e.g., Dental Filling Composite"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  required
                >
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Low Stock Alert <span className="text-gray-400 text-xs">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.low_stock_threshold}
                    onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Buying Price (ETB) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.buying_price}
                      onChange={(e) => setForm({ ...form, buying_price: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="w-4 h-4 text-yellow-600" />
                    <p className="text-xs text-yellow-700">
                      ⚠️ Recorded as an expense (or added to the existing one if this name already exists)
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Selling Price (ETB) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.selling_price}
                    onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Supplier <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={form.supplier}
                  onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Description <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                  rows="2"
                  placeholder="Add additional details..."
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all font-medium shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : '💾 Add to Inventory & Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}