import React, { useState } from 'react';
import { 
  PlusIcon, PencilIcon, PowerIcon, KeyIcon, TrashIcon, XMarkIcon,
  UserIcon, CheckCircleIcon, XCircleIcon, ClockIcon, EyeIcon,
  CalendarDaysIcon, BanknotesIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const inputClass = "w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/20 focus:border-[#0EA5A5] transition-all";

const getTenure = (startDate) => {
  if (!startDate) return '—';
  const start = new Date(startDate);
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'Starts ' + startDate;
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = diffDays % 30;
  if (years > 0) return `${years}y ${months}m • ${diffDays} days`;
  if (months > 0) return `${months}m ${days}d • ${diffDays} days`;
  return `${diffDays} days`;
};

const CashiersManagement = () => {
  const [cashiers, setCashiers] = useState([
    { 
      id: 1, name: 'Saron Kebede', email: 'saron@drediet.com', phone: '+251 92 111 1111', status: 'active', since: '2023-01-10',
      shift: 'Morning (8AM - 2PM)', department: 'Front Desk', total_collected: 245000, transactions: 320, patients_handled: 180, rating: 4.8,
      address: 'Bole, Addis Ababa', emergency: '+251 92 111 1112', monthly_salary: 9000
    },
    { 
      id: 2, name: 'Feven Girma', email: 'feven@drediet.com', phone: '+251 92 222 2222', status: 'active', since: '2024-02-20',
      shift: 'Afternoon (2PM - 8PM)', department: 'Front Desk', total_collected: 180000, transactions: 250, patients_handled: 140, rating: 4.5,
      address: 'Cazanchis, Addis Ababa', emergency: '+251 92 222 2223', monthly_salary: 8500
    },
    { 
      id: 3, name: 'Selam Tesfaye', email: 'selam@drediet.com', phone: '+251 92 333 3333', status: 'inactive', since: '2024-06-01',
      shift: 'Evening (8PM - 12AM)', department: 'Front Desk', total_collected: 95000, transactions: 130, patients_handled: 80, rating: 4.2,
      address: 'Summit, Addis Ababa', emergency: '+251 92 333 3334', monthly_salary: 8000
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [editingCashier, setEditingCashier] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', shift: 'Morning (8AM - 2PM)', department: 'Front Desk',
    monthly_salary: '', since: new Date().toISOString().slice(0, 10)
  });

  const totalMonthlySalary = cashiers
    .filter(c => c.status === 'active')
    .reduce((sum, c) => sum + (Number(c.monthly_salary) || 0), 0);

  const toggleStatus = (id) => {
    setCashiers(prev => prev.map(cashier => {
      if (cashier.id === id) {
        const newStatus = cashier.status === 'active' ? 'inactive' : 'active';
        toast.success(`${cashier.name} ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
        return { ...cashier, status: newStatus };
      }
      return cashier;
    }));
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this cashier?')) {
      setCashiers(prev => prev.filter(c => c.id !== id));
      toast.success('Cashier deleted successfully');
    }
  };

  const handleResetPassword = (id) => {
    if (window.confirm('Reset password for this cashier?')) {
      toast.success('Password reset to default: password123');
    }
  };

  const handleViewDetails = (cashier) => {
    setSelectedCashier(cashier);
    setShowDetailModal(true);
  };

  const openAddModal = () => {
    setEditingCashier(null);
    setFormData({ name: '', email: '', phone: '', shift: 'Morning (8AM - 2PM)', department: 'Front Desk', monthly_salary: '', since: new Date().toISOString().slice(0, 10) });
    setShowModal(true);
  };

  const openEditModal = (cashier) => {
    setEditingCashier(cashier);
    setFormData({
      name: cashier.name, email: cashier.email, phone: cashier.phone,
      shift: cashier.shift || 'Morning (8AM - 2PM)', department: cashier.department || 'Front Desk',
      monthly_salary: cashier.monthly_salary || '', since: cashier.since || new Date().toISOString().slice(0, 10)
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }
    if (editingCashier) {
      setCashiers(prev => prev.map(c => c.id === editingCashier.id ? { ...c, ...formData } : c));
      toast.success('Cashier updated successfully!');
    } else {
      const newCashier = { id: cashiers.length + 1, ...formData, status: 'active', total_collected: 0, transactions: 0, patients_handled: 0, rating: 0 };
      setCashiers([...cashiers, newCashier]);
      toast.success('Cashier added successfully!');
    }
    setShowModal(false);
  };

  const getStatusBadge = (status) => status === 'active' 
    ? 'bg-green-100 text-[#1FAE6B] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1'
    : 'bg-gray-100 text-[#5B6B72] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1';

  const getStatusIcon = (status) => status === 'active' 
    ? <CheckCircleIcon className="w-4 h-4" />
    : <XCircleIcon className="w-4 h-4" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[#2B2B2B]">Cashiers Management</h2>
          <p className="text-[#5B6B72] text-sm">Manage clinic cashiers and their access</p>
        </div>
        <button onClick={openAddModal} className="bg-[#0EA5A5] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0B7A7A] transition-all flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Cashier
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-[#5B6B72]">Active Cashiers</div>
          <div className="text-2xl font-bold text-[#2B2B2B] mt-1">{cashiers.filter(c => c.status === 'active').length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-[#5B6B72]">Total Cashiers</div>
          <div className="text-2xl font-bold text-[#2B2B2B] mt-1">{cashiers.length}</div>
        </div>
        <div className="bg-[#0EA5A5]/5 border border-[#0EA5A5]/20 rounded-xl shadow-sm p-4">
          <div className="text-sm text-[#5B6B72] flex items-center gap-1.5"><BanknotesIcon className="w-4 h-4" />Monthly Salary Expense</div>
          <div className="text-2xl font-bold text-[#0EA5A5] mt-1">ETB {totalMonthlySalary.toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Cashier</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Contact</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Shift</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Salary</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Tenure</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-[#5B6B72]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cashiers.map((cashier) => (
                <tr key={cashier.id} className="hover:bg-[#F2F8FB] transition-all">
                  <td className="px-6 py-4">
                    <button onClick={() => handleViewDetails(cashier)} className="font-medium text-[#0EA5A5] hover:underline cursor-pointer text-left">
                      {cashier.name}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">{cashier.email}</div>
                    <div className="text-sm text-[#5B6B72]">{cashier.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#5B6B72]">{cashier.shift}</td>
                  <td className="px-6 py-4 text-sm font-medium text-[#2B2B2B]">
                    {cashier.monthly_salary ? `ETB ${Number(cashier.monthly_salary).toLocaleString()}` : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={getStatusBadge(cashier.status)}>
                      {getStatusIcon(cashier.status)}
                      {cashier.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#5B6B72]">{getTenure(cashier.since)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleViewDetails(cashier)} className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all" title="View Details">
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => toggleStatus(cashier.id)} className={`p-2 rounded-lg transition-all ${cashier.status === 'active' ? 'text-[#E0A400] hover:bg-yellow-100' : 'text-[#1FAE6B] hover:bg-green-100'}`} title={cashier.status === 'active' ? 'Deactivate' : 'Activate'}>
                        <PowerIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEditModal(cashier)} className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all" title="Edit">
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleResetPassword(cashier.id)} className="p-2 text-[#E0A400] hover:bg-yellow-100 rounded-lg transition-all" title="Reset Password">
                        <KeyIcon className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(cashier.id)} className="p-2 text-[#E5484D] hover:bg-red-50 rounded-lg transition-all" title="Delete">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== DETAIL MODAL — clean flat design ===== */}
      {showDetailModal && selectedCashier && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0EA5A5] flex items-center justify-center text-white text-lg font-semibold">
                  {selectedCashier.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#2B2B2B]">{selectedCashier.name}</h2>
                  <p className="text-sm text-[#5B6B72]">{selectedCashier.department} • {selectedCashier.shift}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-[#5B6B72]">Total Collected</div>
                  <div className="text-lg font-semibold text-[#0EA5A5]">ETB {selectedCashier.total_collected.toLocaleString()}</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-[#5B6B72]">Transactions</div>
                  <div className="text-lg font-semibold text-[#2B2B2B]">{selectedCashier.transactions}</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-[#5B6B72]">Patients Handled</div>
                  <div className="text-lg font-semibold text-[#2B2B2B]">{selectedCashier.patients_handled}</div>
                </div>
                <div className="border border-gray-200 rounded-lg p-3 text-center">
                  <div className="text-xs text-[#5B6B72]">Rating</div>
                  <div className="text-lg font-semibold text-[#E0A400]">⭐ {selectedCashier.rating}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#0EA5A5]/5 border border-[#0EA5A5]/20 rounded-lg p-3">
                  <div className="text-xs text-[#5B6B72] flex items-center gap-1"><BanknotesIcon className="w-3.5 h-3.5" />Monthly Salary</div>
                  <div className="text-lg font-semibold text-[#0EA5A5]">{selectedCashier.monthly_salary ? `ETB ${Number(selectedCashier.monthly_salary).toLocaleString()}` : 'Not set'}</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="text-xs text-[#5B6B72] flex items-center gap-1"><CalendarDaysIcon className="w-3.5 h-3.5" />Tenure</div>
                  <div className="text-lg font-semibold text-[#2B2B2B]">{getTenure(selectedCashier.since)}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <UserIcon className="w-4 h-4 text-[#0EA5A5]" />
                    <span className="text-sm font-semibold">Personal Info</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-[#5B6B72]">Email</span><span className="font-medium">{selectedCashier.email}</span></div>
                    <div className="flex justify-between"><span className="text-[#5B6B72]">Phone</span><span className="font-medium">{selectedCashier.phone}</span></div>
                    <div className="flex justify-between"><span className="text-[#5B6B72]">Address</span><span className="font-medium">{selectedCashier.address}</span></div>
                    <div className="flex justify-between"><span className="text-[#5B6B72]">Joined</span><span className="font-medium">{selectedCashier.since}</span></div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="w-4 h-4 text-[#0EA5A5]" />
                    <span className="text-sm font-semibold">Work Info</span>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-[#5B6B72]">Department</span><span className="font-medium">{selectedCashier.department}</span></div>
                    <div className="flex justify-between"><span className="text-[#5B6B72]">Shift</span><span className="font-medium">{selectedCashier.shift}</span></div>
                    <div className="flex justify-between items-center"><span className="text-[#5B6B72]">Status</span>
                      <span className={getStatusBadge(selectedCashier.status)}>
                        {getStatusIcon(selectedCashier.status)}
                        {selectedCashier.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-xs text-[#5B6B72]">Emergency Contact</div>
                <div className="font-medium text-sm mt-0.5">{selectedCashier.emergency}</div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setShowDetailModal(false); openEditModal(selectedCashier); }} className="px-5 py-2.5 rounded-lg font-medium text-sm text-[#2B2B2B] border border-gray-300 hover:bg-gray-50 transition-all">Edit</button>
                <button onClick={() => setShowDetailModal(false)} className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] transition-all">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD/EDIT MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-[#2B2B2B] flex items-center gap-2">
                  <PlusIcon className="w-5 h-5 text-[#0EA5A5]" />
                  {editingCashier ? 'Edit Cashier' : 'Add New Cashier'}
                </h2>
                <p className="text-sm text-[#5B6B72] mt-0.5">
                  {editingCashier ? "Update this cashier's profile and shift details." : 'Add a new cashier to your front desk team.'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Full Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputClass} placeholder="cashier@clinic.com" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} placeholder="+251 91 000 0000" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Shift</label>
                  <select value={formData.shift} onChange={(e) => setFormData({ ...formData, shift: e.target.value })} className={inputClass}>
                    <option value="Morning (8AM - 2PM)">Morning (8AM - 2PM)</option>
                    <option value="Afternoon (2PM - 8PM)">Afternoon (2PM - 8PM)</option>
                    <option value="Evening (8PM - 12AM)">Evening (8PM - 12AM)</option>
                    <option value="Rotating">Rotating</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Department</label>
                  <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputClass} placeholder="Front Desk" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Monthly Salary (ETB)</label>
                  <input type="number" value={formData.monthly_salary} onChange={(e) => setFormData({ ...formData, monthly_salary: e.target.value })} className={inputClass} placeholder="e.g., 8000" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Start Date</label>
                  <input type="date" value={formData.since} onChange={(e) => setFormData({ ...formData, since: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => setShowModal(false)} className="px-5 py-2.5 rounded-lg font-medium text-sm text-[#2B2B2B] border border-gray-300 hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleSave} className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] transition-all">
                  {editingCashier ? 'Update Cashier' : 'Add Cashier'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashiersManagement;