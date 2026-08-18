// src/components/Appointments/AddPatientModal.jsx
import React, { useState } from 'react';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const inputClass =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/20 focus:border-[#0EA5A5] transition-all';

const AddPatientModal = ({ onAdd, onClose, defaultName = '' }) => {
  const [formData, setFormData] = useState({
    name: defaultName || '',
    phone: '',
    age: '',
    gender: 'Male',
    email: '',
    address: '',
    emergencyContact: '',
    notes: '',
    recurring: 'none',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Patient name is required');
      return;
    }
    const newPatient = {
      id: Date.now(),
      patientId: 'PAT-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
      ...formData,
      age: parseInt(formData.age) || 0,
      registeredDate: new Date().toISOString().split('T')[0],
    };
    onAdd(newPatient);
    toast.success(`Patient ${newPatient.name} registered`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-[#2B2B2B] flex items-center gap-2">
              <UserPlusIcon className="w-5 h-5 text-[#0EA5A5]" />
              Register New Patient
            </h2>
            <p className="text-sm text-[#5B6B72] mt-0.5">Add a new patient to the clinic system</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter full name"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Phone</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={inputClass}
                placeholder="+251 91 234 5678"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Age</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="35"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Gender</label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className={inputClass}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="patient@email.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={inputClass}
                placeholder="Bole, Addis Ababa"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Emergency Contact</label>
              <input
                type="text"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                className={inputClass}
                placeholder="+251 91 876 5432"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Recurring Visit</label>
              <select
                name="recurring"
                value={formData.recurring}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="none">None (One-time)</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className={inputClass}
                rows="2"
                placeholder="Any medical notes or allergies..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg font-medium text-sm text-[#2B2B2B] border border-gray-300 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] transition-all"
            >
              Register Patient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal;