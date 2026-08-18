// components/cashier/CashierPatients.jsx
//
// Cashier "Patients" module.
//
// Mirrors the Owner's PatientsManagement.jsx (real MySQL data through
// the Laravel API, "Register Patient" opens a full modal that captures
// patient info + payment method, just like the owner side).
//
// DIFFERENCE FROM OWNER VERSION:
//   - No Delete action. Cashiers can only Register, View and Edit.
//
// NOTE: This file replaces the old mock-data version. All data now
// comes from GET/POST/PUT /api/patients (PatientController).

import React, { useEffect, useState } from 'react';

import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  UserIcon,
  IdentificationIcon,
  CreditCardIcon,
  BanknotesIcon,
  DevicePhoneMobileIcon,
  BuildingLibraryIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

import { toast } from 'react-hot-toast';
import api from '../../api';

const inputClass =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/20 focus:border-[#0EA5A5] transition-all';

const emptyForm = {
  full_name: '',
  age: '',
  gender: 'male',
  phone: '',
  address: '',
  emergency_contact: '',

  // Payment
  payment_method: 'free',
  payment_amount: '0',

  // Telebirr
  telebirr_phone: '',
  telebirr_reference: '',

  // CBE Birr
  cbe_birr_phone: '',
  cbe_birr_reference: '',

  // Bank
  bank_name: '',
  bank_reference: '',

  // Card
  card_holder_name: '',
  card_number: '',
  card_expiry: '',
  card_cvv: '',
};

const paymentMethods = [
  { value: 'free', label: 'Free', description: 'No payment required', icon: BanknotesIcon },
  { value: 'cash', label: 'Cash', description: 'Patient pays with cash', icon: BanknotesIcon },
  { value: 'telebirr', label: 'Telebirr', description: 'Pay using Telebirr', icon: DevicePhoneMobileIcon },
  { value: 'cbe_birr', label: 'CBE Birr', description: 'Pay using CBE Birr', icon: DevicePhoneMobileIcon },
  { value: 'bank_transfer', label: 'Bank Transfer', description: 'Pay through bank', icon: BuildingLibraryIcon },
  { value: 'card', label: 'Card', description: 'Debit / Credit Card', icon: CreditCardIcon },
];

const CashierPatients = () => {
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingPatient, setEditingPatient] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [showPaymentSection, setShowPaymentSection] = useState(true);

  const [summary, setSummary] = useState({
    total: 0,
    male: 0,
    female: 0,
    children: 0,
  });

  /* ------------------------------------------------------------------ */
  /* Auth guard                                                         */
  /* ------------------------------------------------------------------ */

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first.');
      window.location.href = '/login';
      return false;
    }
    return true;
  };

  /* ------------------------------------------------------------------ */
  /* Load patients (real data)                                          */
  /* ------------------------------------------------------------------ */

  const loadPatients = async (search = '') => {
    if (!checkAuth()) return;

    try {
      setLoading(true);

      const response = await api.get('/patients', {
        params: search.trim() ? { search: search.trim() } : {},
      });

      setPatients(response.data.data || []);
      setSummary(
        response.data.summary || { total: 0, male: 0, female: 0, children: 0 }
      );
    } catch (error) {
      console.error('Load patients error:', error);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      if (error.response?.status === 403) {
        toast.error('You do not have permission to view patients.');
        return;
      }

      toast.error(error.response?.data?.message || 'Unable to load patients.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadPatients(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  /* ------------------------------------------------------------------ */
  /* Modal open helpers                                                 */
  /* ------------------------------------------------------------------ */

  const openRegisterModal = () => {
    if (!checkAuth()) return;
    setEditingPatient(null);
    setFormData({ ...emptyForm });
    setShowPaymentSection(true);
    setShowFormModal(true);
  };

  const openEditModal = (patient) => {
    if (!checkAuth()) return;

    setEditingPatient(patient);
    setFormData({
      full_name: patient.full_name || '',
      age: patient.age ?? '',
      gender: patient.gender || 'male',
      phone: patient.phone || '',
      address: patient.address || '',
      emergency_contact: patient.emergency_contact || '',

      payment_method: patient.payment_method || 'free',
      payment_amount: patient.payment_amount ?? patient.amount ?? '0',

      telebirr_phone: patient.telebirr_phone || '',
      telebirr_reference: patient.telebirr_reference || '',

      cbe_birr_phone: patient.cbe_birr_phone || '',
      cbe_birr_reference: patient.cbe_birr_reference || '',

      bank_name: patient.bank_name || '',
      bank_reference: patient.bank_reference || '',

      // Never pre-fill raw card data
      card_holder_name: '',
      card_number: '',
      card_expiry: '',
      card_cvv: '',
    });

    setShowPaymentSection(true);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (saving) return;
    setShowFormModal(false);
    setEditingPatient(null);
    setFormData({ ...emptyForm });
  };

  /* ------------------------------------------------------------------ */
  /* Field helpers                                                      */
  /* ------------------------------------------------------------------ */

  const handlePaymentMethodChange = (method) => {
    setFormData((prev) => ({
      ...prev,
      payment_method: method,
      payment_amount:
        method === 'free' ? '0' : prev.payment_amount === '0' ? '' : prev.payment_amount,
    }));
    setShowPaymentSection(true);
  };

  const handleAmountChange = (value) => {
    if (!/^\d*\.?\d*$/.test(value)) return;
    setFormData((prev) => ({ ...prev, payment_amount: value }));
  };

  const handleCardNumberChange = (value) => {
    const numbersOnly = value.replace(/\D/g, '').slice(0, 19);
    const formatted = numbersOnly.replace(/(.{4})/g, '$1 ').trim();
    setFormData((prev) => ({ ...prev, card_number: formatted }));
  };

  const handleExpiryChange = (value) => {
    const numbersOnly = value.replace(/\D/g, '').slice(0, 4);
    let formatted = numbersOnly;
    if (numbersOnly.length >= 3) {
      formatted = numbersOnly.slice(0, 2) + '/' + numbersOnly.slice(2);
    }
    setFormData((prev) => ({ ...prev, card_expiry: formatted }));
  };

  /* ------------------------------------------------------------------ */
  /* Save (register / update)                                           */
  /* ------------------------------------------------------------------ */

  const handleSave = async () => {
    if (!checkAuth()) return;

    if (!formData.full_name.trim()) {
      toast.error('Full name is required.');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Phone number is required.');
      return;
    }
    if (formData.age === '' || formData.age === null || formData.age === undefined) {
      toast.error('Age is required.');
      return;
    }
    if (!formData.payment_method) {
      toast.error('Please select a payment method.');
      return;
    }
    if (formData.payment_method !== 'free') {
      if (formData.payment_amount === '' || Number(formData.payment_amount) <= 0) {
        toast.error('Please enter the amount to pay.');
        return;
      }
    }
    if (formData.payment_method === 'telebirr' && !formData.telebirr_phone.trim()) {
      toast.error('Telebirr phone number is required.');
      return;
    }
    if (formData.payment_method === 'cbe_birr' && !formData.cbe_birr_phone.trim()) {
      toast.error('CBE Birr phone number is required.');
      return;
    }
    if (formData.payment_method === 'bank_transfer' && !formData.bank_name.trim()) {
      toast.error('Bank name is required.');
      return;
    }
    if (formData.payment_method === 'card') {
      if (!formData.card_holder_name.trim()) {
        toast.error('Card holder name is required.');
        return;
      }
      if (formData.card_number.replace(/\s/g, '').length < 12) {
        toast.error('Please enter a valid card number.');
        return;
      }
      if (!formData.card_expiry) {
        toast.error('Card expiry date is required.');
        return;
      }
      if (!formData.card_cvv || formData.card_cvv.length < 3) {
        toast.error('Card CVV is required.');
        return;
      }
    }

    try {
      setSaving(true);
      const isEditing = Boolean(editingPatient);

      const payload = {
        full_name: formData.full_name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        phone: formData.phone.trim(),
        address: formData.address.trim() || null,
        emergency_contact: formData.emergency_contact.trim() || null,

        payment_method: formData.payment_method,
        payment_amount:
          formData.payment_method === 'free' ? 0 : Number(formData.payment_amount),

        cash_amount:
          formData.payment_method === 'cash' ? Number(formData.payment_amount) : null,

        telebirr_phone:
          formData.payment_method === 'telebirr' ? formData.telebirr_phone.trim() : null,
        telebirr_reference:
          formData.payment_method === 'telebirr'
            ? formData.telebirr_reference.trim() || null
            : null,

        cbe_birr_phone:
          formData.payment_method === 'cbe_birr' ? formData.cbe_birr_phone.trim() : null,
        cbe_birr_reference:
          formData.payment_method === 'cbe_birr'
            ? formData.cbe_birr_reference.trim() || null
            : null,

        bank_name:
          formData.payment_method === 'bank_transfer' ? formData.bank_name.trim() : null,
        bank_reference:
          formData.payment_method === 'bank_transfer'
            ? formData.bank_reference.trim() || null
            : null,

        card_holder_name:
          formData.payment_method === 'card' ? formData.card_holder_name.trim() : null,

        // Security: never send full card number / CVV to the backend.
        card_last_four:
          formData.payment_method === 'card'
            ? formData.card_number.replace(/\s/g, '').slice(-4)
            : null,

        payment_status: formData.payment_method === 'free' ? 'free' : 'pending',
      };

      let response;
      if (isEditing) {
        response = await api.put(`/patients/${editingPatient.id}`, payload);
      } else {
        response = await api.post('/patients', payload);
      }

      const patientCode =
        response.data?.data?.patient_code || response.data?.patient?.patient_code || '';

      if (isEditing) {
        toast.success('Patient updated successfully.');
      } else {
        toast.success(
          `Patient registered successfully${patientCode ? ` — ID: ${patientCode}` : ''}`
        );
      }

      if (formData.payment_method === 'card' && response.data?.payment?.checkout_url) {
        window.location.href = response.data.payment.checkout_url;
        return;
      }

      setShowFormModal(false);
      setEditingPatient(null);
      setFormData({ ...emptyForm });

      await loadPatients(searchTerm);
    } catch (error) {
      console.error('Save patient error:', error);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action.');
        return;
      }
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors).flat()[0];
        toast.error(firstError || 'Please check the form.');
        return;
      }

      toast.error(error.response?.data?.message || 'Unable to connect to the server.');
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* View details                                                       */
  /* ------------------------------------------------------------------ */

  const handleViewDetails = async (patient) => {
    if (!checkAuth()) return;

    try {
      const response = await api.get(`/patients/${patient.id}`);
      setSelectedPatient(response.data.data || response.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('View patient error:', error);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      toast.error(error.response?.data?.message || 'Unable to load patient.');
    }
  };

  /* ------------------------------------------------------------------ */
  /* NOTE: Delete is intentionally NOT implemented for the cashier role. */
  /* Only Owners can delete patient records.                            */
  /* ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  const getGenderLabel = (gender) => {
    if (!gender) return '—';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const getPaymentLabel = (method) => {
    const payment = paymentMethods.find((item) => item.value === method);
    return payment?.label || 'Free';
  };

  return (
    <div>
      {/* ================================================================
          HEADER
      ================================================================= */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[#2B2B2B]">📋 Patients</h2>
          <p className="text-[#5B6B72] text-sm">Register and manage patients</p>
        </div>

        <button
          onClick={openRegisterModal}
          className="bg-[#0EA5A5] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0B7A7A] transition-all flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Register Patient
        </button>
      </div>

      {/* ================================================================
          SUMMARY (real data)
      ================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm text-[#5B6B72]">Total Patients</div>
          <div className="text-2xl font-heading font-bold text-[#2B2B2B]">{summary.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#0EA5A5]">
          <div className="text-sm text-[#5B6B72]">Male</div>
          <div className="text-2xl font-heading font-bold text-[#0EA5A5]">{summary.male}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#1FAE6B]">
          <div className="text-sm text-[#5B6B72]">Female</div>
          <div className="text-2xl font-heading font-bold text-[#1FAE6B]">{summary.female}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-400">
          <div className="text-sm text-[#5B6B72]">Children</div>
          <div className="text-2xl font-heading font-bold text-orange-500">{summary.children}</div>
        </div>
      </div>

      {/* ================================================================
          SEARCH
      ================================================================= */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-[#5B6B72]" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, ID, or phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all"
          />
        </div>
      </div>

      {/* ================================================================
          PATIENT TABLE (real data)
      ================================================================= */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Patient ID</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Age / Gender</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Phone</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Payment</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Address</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-[#5B6B72]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-[#5B6B72]">
                    Loading patients from database...
                  </td>
                </tr>
              ) : patients.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-10 text-center text-[#5B6B72]">
                    No patients found.
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr key={patient.id} className="hover:bg-[#F2F8FB] transition-all">
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm font-semibold text-[#0EA5A5]">
                        {patient.patient_code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleViewDetails(patient)}
                        className="font-medium text-[#0EA5A5] hover:underline cursor-pointer text-left"
                      >
                        {patient.full_name}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#5B6B72]">
                      {patient.age} / {getGenderLabel(patient.gender)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#5B6B72]">{patient.phone}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#0EA5A5]/10 text-[#0EA5A5] text-xs font-medium">
                        {getPaymentLabel(patient.payment_method)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#5B6B72]">{patient.address || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewDetails(patient)}
                          className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all"
                          title="View Details"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(patient)}
                          className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        {/* Delete intentionally removed for the cashier role */}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================================================================
          PATIENT DETAIL MODAL
      ================================================================= */}
      {showDetailModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#0EA5A5] flex items-center justify-center text-white text-lg font-semibold">
                  {selectedPatient.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#2B2B2B]">{selectedPatient.full_name}</h2>
                  <p className="text-sm text-[#5B6B72]">
                    {selectedPatient.patient_code} • {selectedPatient.age} years •{' '}
                    {getGenderLabel(selectedPatient.gender)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Patient information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <UserIcon className="w-5 h-5 text-[#0EA5A5]" />
                  <span className="font-semibold">Patient Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-[#5B6B72]">Patient ID</div>
                    <div className="font-semibold text-[#0EA5A5]">{selectedPatient.patient_code}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5B6B72]">Full Name</div>
                    <div className="font-medium">{selectedPatient.full_name}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5B6B72]">Age</div>
                    <div className="font-medium">{selectedPatient.age}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5B6B72]">Gender</div>
                    <div className="font-medium">{getGenderLabel(selectedPatient.gender)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5B6B72]">Phone</div>
                    <div className="font-medium">{selectedPatient.phone}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5B6B72]">Address</div>
                    <div className="font-medium">{selectedPatient.address || '—'}</div>
                  </div>
                  <div>
                    <div className="text-xs text-[#5B6B72]">Emergency Contact</div>
                    <div className="font-medium">{selectedPatient.emergency_contact || '—'}</div>
                  </div>
                </div>
              </div>

              {/* Payment information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCardIcon className="w-5 h-5 text-[#0EA5A5]" />
                  <span className="font-semibold">Payment Information</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#5B6B72]">Payment Method</span>
                    <span className="font-semibold text-[#0EA5A5]">
                      {getPaymentLabel(selectedPatient.payment_method)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#5B6B72]">Amount</span>
                    <span className="font-semibold">
                      {selectedPatient.payment_amount ?? selectedPatient.amount ?? 0} ETB
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#5B6B72]">Status</span>
                    <span className="font-medium">{selectedPatient.payment_status || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Registration information */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-4">
                  <IdentificationIcon className="w-5 h-5 text-[#0EA5A5]" />
                  <span className="font-semibold">Registration Information</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-[#5B6B72]">Patient Code</span>
                    <span className="font-semibold text-[#0EA5A5]">{selectedPatient.patient_code}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#5B6B72]">Registered At</span>
                    <span className="font-medium">
                      {selectedPatient.registered_at
                        ? new Date(selectedPatient.registered_at).toLocaleString()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-[#5B6B72]">Registered By</span>
                    <span className="font-medium">{selectedPatient.registered_by || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedPatient);
                  }}
                  className="px-5 py-2.5 rounded-lg font-medium text-sm text-[#2B2B2B] border border-gray-300 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          REGISTER / EDIT PATIENT MODAL
      ================================================================= */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white flex items-start justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-[#2B2B2B] flex items-center gap-2">
                  <PlusIcon className="w-5 h-5 text-[#0EA5A5]" />
                  {editingPatient ? 'Edit Patient' : 'Register New Patient'}
                </h2>
                <p className="text-sm text-[#5B6B72] mt-0.5">
                  {editingPatient ? 'Update the patient record.' : 'Register a new patient and record payment.'}
                </p>
              </div>
              <button
                onClick={closeFormModal}
                disabled={saving}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Patient information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Full Name *</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className={inputClass}
                    placeholder="Patient full name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Phone *</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClass}
                    placeholder="+251 91 000 0000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Emergency Contact</label>
                  <input
                    type="text"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                    className={inputClass}
                    placeholder="+251 91 000 0000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Age *</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. 28"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className={inputClass}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. Bole, Addis Ababa"
                  />
                </div>
              </div>

              {/* Payment section */}
              <div className="mt-7 border-t border-gray-200 pt-6">
                <button
                  type="button"
                  onClick={() => setShowPaymentSection(!showPaymentSection)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <CreditCardIcon className="w-5 h-5 text-[#0EA5A5]" />
                      <span className="text-base font-semibold text-[#2B2B2B]">Payment</span>
                    </div>
                    <p className="text-xs text-[#5B6B72] mt-1">Choose payment method and enter amount</p>
                  </div>
                  <ChevronDownIcon
                    className={`w-5 h-5 text-gray-500 transition-transform ${
                      showPaymentSection ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {showPaymentSection && (
                  <div className="mt-5">
                    <div>
                      <label className="text-sm font-medium text-[#2B2B2B] mb-2 block">Payment Method *</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {paymentMethods.map((method) => {
                          const Icon = method.icon;
                          const selected = formData.payment_method === method.value;
                          return (
                            <button
                              key={method.value}
                              type="button"
                              onClick={() => handlePaymentMethodChange(method.value)}
                              className={`text-left p-4 rounded-xl border-2 transition-all ${
                                selected
                                  ? 'border-[#0EA5A5] bg-[#0EA5A5]/5 shadow-sm'
                                  : 'border-gray-200 hover:border-[#0EA5A5]/40'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                    selected ? 'bg-[#0EA5A5] text-white' : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  <Icon className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="text-sm font-semibold text-[#2B2B2B]">{method.label}</div>
                                  <div className="text-xs text-[#5B6B72] mt-0.5">{method.description}</div>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                    selected ? 'border-[#0EA5A5]' : 'border-gray-300'
                                  }`}
                                >
                                  {selected && <div className="w-2.5 h-2.5 rounded-full bg-[#0EA5A5]" />}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {formData.payment_method === 'free' && (
                      <div className="mt-5 p-4 rounded-xl bg-green-50 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-green-800">Free Registration</div>
                            <div className="text-xs text-green-700 mt-1">No payment is required.</div>
                          </div>
                          <div className="text-xl font-bold text-green-700">0 ETB</div>
                        </div>
                      </div>
                    )}

                    {formData.payment_method === 'cash' && (
                      <div className="mt-5 p-4 rounded-xl border border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-2 mb-4">
                          <BanknotesIcon className="w-5 h-5 text-[#0EA5A5]" />
                          <span className="font-semibold text-[#2B2B2B]">Cash Payment</span>
                        </div>
                        <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Amount to Pay (ETB) *</label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.payment_amount}
                          onChange={(e) => handleAmountChange(e.target.value)}
                          className={inputClass}
                          placeholder="Enter amount"
                        />
                      </div>
                    )}

                    {formData.payment_method === 'telebirr' && (
                      <div className="mt-5 p-4 rounded-xl border border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-2 mb-4">
                          <DevicePhoneMobileIcon className="w-5 h-5 text-[#0EA5A5]" />
                          <span className="font-semibold text-[#2B2B2B]">Telebirr Payment</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Amount (ETB) *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.payment_amount}
                              onChange={(e) => handleAmountChange(e.target.value)}
                              className={inputClass}
                              placeholder="Enter amount"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Telebirr Phone *</label>
                            <input
                              type="text"
                              value={formData.telebirr_phone}
                              onChange={(e) => setFormData({ ...formData, telebirr_phone: e.target.value })}
                              className={inputClass}
                              placeholder="+251 9..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Transaction Reference</label>
                            <input
                              type="text"
                              value={formData.telebirr_reference}
                              onChange={(e) => setFormData({ ...formData, telebirr_reference: e.target.value })}
                              className={inputClass}
                              placeholder="Optional transaction/reference number"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.payment_method === 'cbe_birr' && (
                      <div className="mt-5 p-4 rounded-xl border border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-2 mb-4">
                          <DevicePhoneMobileIcon className="w-5 h-5 text-[#0EA5A5]" />
                          <span className="font-semibold text-[#2B2B2B]">CBE Birr Payment</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Amount (ETB) *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.payment_amount}
                              onChange={(e) => handleAmountChange(e.target.value)}
                              className={inputClass}
                              placeholder="Enter amount"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">CBE Birr Phone *</label>
                            <input
                              type="text"
                              value={formData.cbe_birr_phone}
                              onChange={(e) => setFormData({ ...formData, cbe_birr_phone: e.target.value })}
                              className={inputClass}
                              placeholder="+251 9..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Transaction Reference</label>
                            <input
                              type="text"
                              value={formData.cbe_birr_reference}
                              onChange={(e) => setFormData({ ...formData, cbe_birr_reference: e.target.value })}
                              className={inputClass}
                              placeholder="Optional transaction/reference number"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.payment_method === 'bank_transfer' && (
                      <div className="mt-5 p-4 rounded-xl border border-gray-200 bg-gray-50">
                        <div className="flex items-center gap-2 mb-4">
                          <BuildingLibraryIcon className="w-5 h-5 text-[#0EA5A5]" />
                          <span className="font-semibold text-[#2B2B2B]">Bank Transfer</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Amount (ETB) *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.payment_amount}
                              onChange={(e) => handleAmountChange(e.target.value)}
                              className={inputClass}
                              placeholder="Enter amount"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Bank Name *</label>
                            <input
                              type="text"
                              value={formData.bank_name}
                              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                              className={inputClass}
                              placeholder="e.g. CBE"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Transaction Reference</label>
                            <input
                              type="text"
                              value={formData.bank_reference}
                              onChange={(e) => setFormData({ ...formData, bank_reference: e.target.value })}
                              className={inputClass}
                              placeholder="Bank transaction/reference number"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.payment_method === 'card' && (
                      <div className="mt-5 p-4 rounded-xl border border-[#0EA5A5]/30 bg-[#0EA5A5]/5">
                        <div className="flex items-center gap-2 mb-4">
                          <CreditCardIcon className="w-5 h-5 text-[#0EA5A5]" />
                          <div>
                            <div className="font-semibold text-[#2B2B2B]">Card Payment</div>
                            <div className="text-xs text-[#5B6B72]">Enter the amount and card information</div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Amount to Pay (ETB) *</label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formData.payment_amount}
                              onChange={(e) => handleAmountChange(e.target.value)}
                              className={inputClass}
                              placeholder="Enter amount"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Card Holder Name *</label>
                            <input
                              type="text"
                              value={formData.card_holder_name}
                              onChange={(e) => setFormData({ ...formData, card_holder_name: e.target.value })}
                              className={inputClass}
                              placeholder="Name on card"
                              autoComplete="cc-name"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Card Number *</label>
                            <div className="relative">
                              <CreditCardIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formData.card_number}
                                onChange={(e) => handleCardNumberChange(e.target.value)}
                                className={`${inputClass} pl-10`}
                                placeholder="1234 5678 9012 3456"
                                autoComplete="cc-number"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Expiry *</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={formData.card_expiry}
                                onChange={(e) => handleExpiryChange(e.target.value)}
                                className={inputClass}
                                placeholder="MM/YY"
                                autoComplete="cc-exp"
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">CVV *</label>
                              <input
                                type="password"
                                inputMode="numeric"
                                maxLength="4"
                                value={formData.card_cvv}
                                onChange={(e) =>
                                  setFormData({ ...formData, card_cvv: e.target.value.replace(/\D/g, '') })
                                }
                                className={inputClass}
                                placeholder="123"
                                autoComplete="cc-csc"
                              />
                            </div>
                          </div>
                          <div className="p-3 rounded-lg bg-white border border-gray-200">
                            <div className="text-xs text-[#5B6B72]">
                              <strong className="text-[#2B2B2B]">Security:</strong> For production card payments, use
                              a secure payment gateway/tokenization service. The card number and CVV are never sent
                              to the server — only the last 4 digits are stored.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-5 p-4 rounded-xl bg-gray-900 text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-gray-400">Payment Method</div>
                          <div className="font-semibold">{getPaymentLabel(formData.payment_method)}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">Amount</div>
                          <div className="text-2xl font-bold">
                            {Number(formData.payment_amount || 0).toFixed(2)} ETB
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!editingPatient && (
                <div className="mt-5 p-3 bg-[#0EA5A5]/5 border border-[#0EA5A5]/20 rounded-lg">
                  <div className="text-sm font-medium text-[#0EA5A5]">Patient ID will be generated automatically</div>
                  <div className="text-xs text-[#5B6B72] mt-1">
                    Example: PAT-0016. The code is created by Laravel after the database record is inserted.
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  onClick={closeFormModal}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg font-medium text-sm text-[#2B2B2B] border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? 'Saving...' : editingPatient ? 'Update Patient' : 'Register Patient'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierPatients;