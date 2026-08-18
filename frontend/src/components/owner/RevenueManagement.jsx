import React, { useState, useEffect } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../api/axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const RevenueManagement = () => {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [form, setForm] = useState({
    source: '',
    amount: '',
    method: 'Cash',
    date: new Date().toISOString().slice(0, 10)
  });

  // Fetch revenue data
  const fetchRevenue = async () => {
    try {
      setLoading(true);
      const response = await api.get('/revenue');
      setEntries(response.data);
      
      // Get summary
      const summaryRes = await api.get('/revenue/summary');
      setTodayTotal(summaryRes.data.today || 0);
      setMonthTotal(summaryRes.data.month || 0);
      
    } catch (error) {
      console.error('Failed to fetch revenue:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenue();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.source || !form.amount) {
      toast.error('Source and amount are required');
      return;
    }

    try {
      const response = await api.post('/revenue', {
        ...form,
        amount: Number(form.amount)
      });
      
      toast.success('✅ Revenue recorded');
      setEntries([response.data.revenue, ...entries]);
      fetchRevenue(); // Refresh totals
      setShowForm(false);
      setForm({ source: '', amount: '', method: 'Cash', date: new Date().toISOString().slice(0, 10) });
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add revenue');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[#2B2B2B]">💰 Revenue Management</h2>
          <p className="text-[#5B6B72] text-sm">Track all clinic revenue sources</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-[#0EA5A5] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0B7A7A] transition-all flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Revenue
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="text-sm text-[#5B6B72]">Today's Revenue</div>
          <div className="text-2xl font-heading font-bold text-[#0EA5A5]">ETB {todayTotal.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#1FAE6B]">
          <div className="text-sm text-[#5B6B72]">This Month</div>
          <div className="text-2xl font-heading font-bold text-[#1FAE6B]">ETB {monthTotal.toLocaleString()}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Date</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Source</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Method</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-[#5B6B72]">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="4" className="text-center py-8 text-[#5B6B72]">Loading...</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan="4" className="text-center py-8 text-[#5B6B72]">No revenue entries found</td></tr>
              ) : (
                entries.map((e) => (
                  <tr key={e.id} className="hover:bg-[#F2F8FB] transition-all">
                    <td className="px-6 py-4 text-sm text-[#5B6B72]">{e.date}</td>
                    <td className="px-6 py-4 text-sm text-[#2B2B2B]">{e.source}</td>
                    <td className="px-6 py-4 text-sm text-[#5B6B72]">{e.method}</td>
                    <td className="px-6 py-4 text-sm font-mono-amount font-semibold text-[#0EA5A5] text-right">
                      ETB {e.amount.toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-heading font-bold text-[#2B2B2B]">➕ Add Revenue</h3>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-6 h-6 text-[#5B6B72]" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Source *</label>
                <input
                  type="text"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="input-field"
                  placeholder="e.g., Filling - Patient Name"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Amount (ETB) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="input-field"
                  placeholder="Enter amount"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Payment Method</label>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="input-field"
                >
                  <option value="Cash">Cash</option>
                  <option value="telebirr">Telebirr</option>
                  <option value="cbe_birr">CBEBirr</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 text-[#2B2B2B] py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-[#0EA5A5] text-white py-2.5 rounded-xl font-medium hover:bg-[#0B7A7A] transition-all">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueManagement;