// src/components/DoctorsManagement.jsx

import React, { useState, useEffect } from 'react';
import {
  PlusIcon, PencilIcon, PowerIcon, KeyIcon, TrashIcon, XMarkIcon,
  UserIcon, CheckCircleIcon, XCircleIcon, EyeIcon, CalendarDaysIcon,
  BriefcaseIcon, CurrencyDollarIcon, ClockIcon, PhoneIcon, EnvelopeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../../api';

const inputClass = "w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/20 focus:border-[#0EA5A5] transition-all";

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  specialty: '',
  department: '',
  shift: '',
  salary: '',
  start_date: '',
  license_number: '',
};

const getTenure = (dateStr) => {
  if (!dateStr) return '—';
  const start = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return '—';
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  if (years > 0) return `${years}y ${months}m · ${diffDays} days`;
  if (months > 0) return `${months}m · ${diffDays} days`;
  return `${diffDays} days`;
};

const DoctorsManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const loadDoctors = async () => {
    try {
      setLoading(true);
      const response = await api.get('/doctors');
      setDoctors(response.data || []);
    } catch (error) {
      console.error('Load doctors error:', error);
      toast.error(error.response?.data?.message || 'Unable to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const activeCount = doctors.filter(d => d.user?.is_active).length;

  const toggleStatus = async (doctor) => {
    try {
      const isActive = doctor.user?.is_active;
      const endpoint = isActive
        ? `/doctors/${doctor.id}/deactivate`
        : `/doctors/${doctor.id}/activate`;

      const response = await api.post(endpoint);

      setDoctors(prev =>
        prev.map(d => (d.id === doctor.id ? response.data : d))
      );

      toast.success(
        `${doctor.user?.name} ${isActive ? 'deactivated' : 'activated'} successfully!`
      );
    } catch (error) {
      console.error('Toggle status error:', error);
      toast.error(error.response?.data?.message || 'Unable to update status.');
    }
  };

  const handleDelete = async (doctor) => {
    if (!window.confirm(`Are you sure you want to remove ${doctor.user?.name}?`)) return;

    try {
      await api.delete(`/doctors/${doctor.id}`);
      setDoctors(prev => prev.filter(d => d.id !== doctor.id));
      toast.success('Doctor removed successfully.');
    } catch (error) {
      console.error('Delete doctor error:', error);
      toast.error(error.response?.data?.message || 'Unable to remove doctor.');
    }
  };

  const handleResetPassword = async (doctor) => {
    if (!window.confirm(`Reset password for ${doctor.user?.name}?`)) return;

    try {
      const response = await api.post(`/doctors/${doctor.id}/reset-password`);
      toast.success(
        `Password reset. Default password: ${response.data?.default_password || 'password123'}`
      );
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.message || 'Unable to reset password.');
    }
  };

  const handleViewDetails = (doctor) => {
    setSelectedDoctor(doctor);
    setShowDetailModal(true);
  };

  const openAddModal = () => {
    setEditingDoctor(null);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEditModal = (doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      name: doctor.user?.name || '',
      email: doctor.user?.email || '',
      phone: doctor.user?.phone || '',
      password: '',
      specialty: doctor.specialty || '',
      department: doctor.department || '',
      shift: doctor.shift || '',
      salary: doctor.salary || '',
      start_date: doctor.start_date || '',
      license_number: doctor.license_number || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Name and email are required.');
      return;
    }

    if (!editingDoctor && (!formData.phone.trim() || !formData.password.trim())) {
      toast.error('Phone and password are required for new doctors.');
      return;
    }

    try {
      setSaving(true);

      if (editingDoctor) {
        const response = await api.put(`/doctors/${editingDoctor.id}`, {
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          specialty: formData.specialty.trim() || null,
          department: formData.department.trim() || null,
          shift: formData.shift.trim() || null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          start_date: formData.start_date || null,
          license_number: formData.license_number.trim() || null,
        });

        setDoctors(prev =>
          prev.map(d => (d.id === editingDoctor.id ? response.data : d))
        );

        toast.success('Doctor updated successfully!');
      } else {
        const response = await api.post('/doctors', {
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
          specialty: formData.specialty.trim() || null,
          department: formData.department.trim() || null,
          shift: formData.shift.trim() || null,
          salary: formData.salary ? parseFloat(formData.salary) : null,
          start_date: formData.start_date || null,
          license_number: formData.license_number.trim() || null,
        });

        setDoctors(prev => [response.data, ...prev]);
        toast.success('Doctor added successfully!');
      }

      setShowModal(false);
      setEditingDoctor(null);
      setFormData(emptyForm);
    } catch (error) {
      console.error('Save doctor error:', error);

      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors).flat()[0];
        toast.error(firstError || 'Please check the form.');
        return;
      }

      toast.error(error.response?.data?.message || 'Unable to save doctor.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (isActive) => isActive
    ? 'bg-green-100 text-[#1FAE6B] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1'
    : 'bg-gray-100 text-[#5B6B72] px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1';

  const getStatusIcon = (isActive) => isActive
    ? <CheckCircleIcon className="w-4 h-4" />
    : <XCircleIcon className="w-4 h-4" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[#2B2B2B]">Doctors Management</h2>
          <p className="text-[#5B6B72] text-sm">Manage clinic doctors and their access</p>
        </div>
        <button onClick={openAddModal} className="bg-[#0EA5A5] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0B7A7A] transition-all flex items-center gap-2">
          <PlusIcon className="w-5 h-5" />
          Add Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-[#5B6B72]">Active Doctors</div>
          <div className="text-2xl font-bold text-[#2B2B2B] mt-1">{activeCount}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-[#5B6B72]">Total Doctors</div>
          <div className="text-2xl font-bold text-[#2B2B2B] mt-1">{doctors.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-[#5B6B72]">Departments</div>
          <div className="text-2xl font-bold text-[#2B2B2B] mt-1">
            {new Set(doctors.map(d => d.department).filter(Boolean)).size}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Doctor</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Specialty</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Department</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Contact</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Status</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Tenure</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-[#5B6B72]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-[#5B6B72]">
                    Loading doctors from database...
                  </td>
                </tr>
              ) : doctors.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-[#5B6B72]">
                    No doctors found.
                  </td>
                </tr>
              ) : (
                doctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-[#F2F8FB] transition-all">
                    <td className="px-6 py-4">
                      <button onClick={() => handleViewDetails(doctor)} className="font-medium text-[#0EA5A5] hover:underline cursor-pointer text-left">
                        {doctor.user?.name || '—'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#5B6B72]">{doctor.specialty || '—'}</td>
                    <td className="px-6 py-4 text-sm text-[#5B6B72]">{doctor.department || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">{doctor.user?.email || '—'}</div>
                      <div className="text-sm text-[#5B6B72]">{doctor.user?.phone || '—'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={getStatusBadge(doctor.user?.is_active)}>
                        {getStatusIcon(doctor.user?.is_active)}
                        {doctor.user?.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#5B6B72]">{getTenure(doctor.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleViewDetails(doctor)} className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all" title="View Details">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleStatus(doctor)}
                          className={`p-2 rounded-lg transition-all ${doctor.user?.is_active ? 'text-[#E0A400] hover:bg-yellow-100' : 'text-[#1FAE6B] hover:bg-green-100'}`}
                          title={doctor.user?.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <PowerIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditModal(doctor)} className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all" title="Edit">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleResetPassword(doctor)} className="p-2 text-[#E0A400] hover:bg-yellow-100 rounded-lg transition-all" title="Reset Password">
                          <KeyIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(doctor)} className="p-2 text-[#E5484D] hover:bg-red-50 rounded-lg transition-all" title="Delete">
                          <TrashIcon className="w-4 h-4" />
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

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0EA5A5] flex items-center justify-center text-white text-lg font-semibold">
                  {selectedDoctor.user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#2B2B2B]">{selectedDoctor.user?.name}</h2>
                  <p className="text-sm text-[#5B6B72]">{selectedDoctor.specialty || 'No specialty set'}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UserIcon className="w-4 h-4 text-[#0EA5A5]" />
                  <span className="text-sm font-semibold">Personal Information</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-[#5B6B72]">Full Name</span><span className="font-medium">{selectedDoctor.user?.name}</span></div>
                  <div className="flex justify-between"><span className="text-[#5B6B72]">Email</span><span className="font-medium">{selectedDoctor.user?.email}</span></div>
                  <div className="flex justify-between"><span className="text-[#5B6B72]">Phone</span><span className="font-medium">{selectedDoctor.user?.phone}</span></div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BriefcaseIcon className="w-4 h-4 text-[#0EA5A5]" />
                  <span className="text-sm font-semibold">Professional Information</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-[#5B6B72]">Specialty</span><span className="font-medium">{selectedDoctor.specialty || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-[#5B6B72]">Department</span><span className="font-medium">{selectedDoctor.department || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-[#5B6B72]">License Number</span><span className="font-medium">{selectedDoctor.license_number || '—'}</span></div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ClockIcon className="w-4 h-4 text-[#0EA5A5]" />
                  <span className="text-sm font-semibold">Work Information</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-[#5B6B72]">Shift</span><span className="font-medium">{selectedDoctor.shift || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-[#5B6B72]">Salary</span><span className="font-medium">{selectedDoctor.salary ? `${selectedDoctor.salary} ETB` : '—'}</span></div>
                  <div className="flex justify-between"><span className="text-[#5B6B72]">Start Date</span><span className="font-medium">{selectedDoctor.start_date || '—'}</span></div>
                  <div className="flex justify-between"><span className="text-[#5B6B72]">Tenure</span><span className="font-medium">{getTenure(selectedDoctor.created_at)}</span></div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedDoctor.user?.is_active)}
                    <span className="text-sm font-semibold">Status</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#5B6B72]">Account Status</span>
                    <span className={getStatusBadge(selectedDoctor.user?.is_active)}>
                      {getStatusIcon(selectedDoctor.user?.is_active)}
                      {selectedDoctor.user?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => { setShowDetailModal(false); openEditModal(selectedDoctor); }} className="px-5 py-2.5 rounded-lg font-medium text-sm text-[#2B2B2B] border border-gray-300 hover:bg-gray-50 transition-all">Edit</button>
                <button onClick={() => setShowDetailModal(false)} className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] transition-all">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== ADD/EDIT MODAL ===== */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-[#2B2B2B] flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-[#0EA5A5]" />
                  {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
                </h2>
                <p className="text-sm text-[#5B6B72] mt-0.5">
                  {editingDoctor ? "Update this doctor's profile." : 'Add a new doctor — a login account will be created automatically.'}
                </p>
              </div>
              <button onClick={() => setShowModal(false)} disabled={saving} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Full Name *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} placeholder="Dr. John Doe" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Specialty</label>
                    <input type="text" value={formData.specialty} onChange={(e) => setFormData({ ...formData, specialty: e.target.value })} className={inputClass} placeholder="e.g., Orthodontist" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Department</label>
                    <input type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputClass} placeholder="e.g., Cardiology" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                    Email {!editingDoctor && '*'}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClass}
                    placeholder="doctor@clinic.com"
                    disabled={!!editingDoctor}
                  />
                  {editingDoctor && (
                    <p className="text-xs text-[#5B6B72] mt-1">Email cannot be changed here.</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Phone {!editingDoctor && '*'}</label>
                  <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputClass} placeholder="+251 91 000 0000" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Shift</label>
                    <select 
                      value={formData.shift} 
                      onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">Select Shift</option>
                      <option value="Morning (8AM - 2PM)">Morning (8AM - 2PM)</option>
                      <option value="Afternoon (2PM - 8PM)">Afternoon (2PM - 8PM)</option>
                      <option value="Night (8PM - 8AM)">Night (8PM - 8AM)</option>
                      <option value="Flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">License Number</label>
                    <input type="text" value={formData.license_number} onChange={(e) => setFormData({ ...formData, license_number: e.target.value })} className={inputClass} placeholder="e.g., MED-12345" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Monthly Salary (ETB)</label>
                    <input type="number" value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} className={inputClass} placeholder="e.g., 8000" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Start Date</label>
                    <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className={inputClass} />
                  </div>
                </div>

                {!editingDoctor && (
                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Password *</label>
                    <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className={inputClass} placeholder="Minimum 6 characters" />
                    <p className="text-xs text-[#5B6B72] mt-1">
                      Temporary password for new doctor. They can change it after login.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button onClick={() => setShowModal(false)} disabled={saving} className="px-5 py-2.5 rounded-lg font-medium text-sm text-[#2B2B2B] border border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : editingDoctor ? 'Update Doctor' : 'Add Doctor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorsManagement;