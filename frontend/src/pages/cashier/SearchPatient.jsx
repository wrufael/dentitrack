// pages/cashier/SearchPatient.jsx
//
// Real-data patient search for the cashier.
//
//   GET /api/patients                    -> recent patients (default view,
//                                            before anything is typed)
//   GET /api/patients?search=...         -> live search results, fires as
//                                            the cashier types (debounced)
//   GET /api/patients/{id}               -> full record for the detail modal
//   GET /api/patients/{id}/consultations -> visit history
//                                            (shape: { patient, consultations: [...] })
//   PUT /api/patients/{id}                -> save edits made from the detail modal
//
// Two real bugs fixed here (not just cosmetic):
//   1. The visit-history call was silently 403-ing for cashiers — the
//      backend only allowed owner/doctor to view consultations. Fixed in
//      ConsultationController::canView().
//   2. Even when it succeeded, this page expected the history response to
//      be a bare array — it's actually { data: { patient, consultations } }.
//      That mismatch meant "No previous visits on record yet" showed even
//      when a patient DID have visits. Now reads consultations correctly.

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  PhoneIcon,
  CalendarIcon,
  ArrowLeftIcon,
  EyeIcon,
  PencilIcon,
  XMarkIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import api from '../../api';

const inputClass =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/20 focus:border-[#0EA5A5] transition-all';

const RECENT_LIMIT = 8;

const SearchPatient = () => {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const [recentPatients, setRecentPatients] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const [selectedPatient, setSelectedPatient] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const debounceRef = useRef(null);

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
  /* Recent patients — shown by default, before typing anything         */
  /* ------------------------------------------------------------------ */

  const loadRecentPatients = useCallback(async () => {
    if (!checkAuth()) return;
    try {
      setRecentLoading(true);
      // The backend already returns patients ordered by id desc (newest
      // registered first), so the first page IS "recent patients".
      const response = await api.get('/patients');
      const list = response.data?.data || [];
      setRecentPatients(list.slice(0, RECENT_LIMIT));
    } catch (error) {
      // Non-fatal — the page still works for explicit search.
      console.error('Load recent patients error:', error);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecentPatients();
  }, [loadRecentPatients]);

  /* ------------------------------------------------------------------ */
  /* Live search — fires automatically as the cashier types             */
  /* (name letters or ID letters, no need to press Search)              */
  /* ------------------------------------------------------------------ */

  const runSearch = useCallback(async (term) => {
    if (!checkAuth()) return;
    try {
      setSearching(true);
      setHasSearched(true);

      const response = await api.get('/patients', {
        params: { search: term },
      });

      setSearchResults(response.data?.data || []);
    } catch (error) {
      console.error('Search patient error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      toast.error(error.response?.data?.message || 'Unable to search patients.');
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!searchTerm.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      runSearch(searchTerm.trim());
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, runSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (searchTerm.trim()) runSearch(searchTerm.trim());
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // The list actually shown: live search results while typing,
  // otherwise the recent-patients list.
  const isSearchMode = searchTerm.trim().length > 0;
  const listToShow = isSearchMode ? searchResults : recentPatients;
  const listLoading = isSearchMode ? searching : recentLoading;

  /* ------------------------------------------------------------------ */
  /* View patient (real data) + visit history                          */
  /* ------------------------------------------------------------------ */

  const handleViewPatient = async (patientSummary) => {
    if (!checkAuth()) return;

    setIsEditing(false);
    setShowPatientModal(true);
    setSelectedPatient(patientSummary); // show something immediately
    setHistory([]);

    try {
      const response = await api.get(`/patients/${patientSummary.id}`);
      const full = response.data.data || response.data;
      setSelectedPatient(full);
    } catch (error) {
      console.error('Load patient error:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      toast.error(error.response?.data?.message || 'Unable to load patient.');
    }

    // Visit history — /consultations returns { data: { patient, consultations } }.
    try {
      setHistoryLoading(true);
      const historyRes = await api.get(`/patients/${patientSummary.id}/consultations`);
      const consultations = historyRes.data?.data?.consultations || [];
      setHistory(Array.isArray(consultations) ? consultations : []);
    } catch (error) {
      // Non-fatal — some patients simply have no history yet.
      console.error('Load history error:', error);
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* Edit patient (real data)                                           */
  /* ------------------------------------------------------------------ */

  const startEditing = () => {
    if (!selectedPatient) return;
    setEditForm({
      full_name: selectedPatient.full_name || '',
      age: selectedPatient.age ?? '',
      gender: selectedPatient.gender || 'male',
      phone: selectedPatient.phone || '',
      address: selectedPatient.address || '',
      emergency_contact: selectedPatient.emergency_contact || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const saveEdits = async () => {
    if (!checkAuth() || !selectedPatient || !editForm) return;

    if (!editForm.full_name.trim() || !editForm.phone.trim() || editForm.age === '') {
      toast.error('Full name, phone and age are required.');
      return;
    }

    try {
      setSaving(true);

      // Keep the patient's existing payment info unchanged — this modal
      // only edits the core patient record, not the payment.
      const payload = {
        full_name: editForm.full_name.trim(),
        age: Number(editForm.age),
        gender: editForm.gender,
        phone: editForm.phone.trim(),
        address: editForm.address.trim() || null,
        emergency_contact: editForm.emergency_contact.trim() || null,
        payment_method: selectedPatient.payment_method || 'free',
        payment_amount: selectedPatient.payment_amount ?? selectedPatient.amount ?? 0,
      };

      const response = await api.put(`/patients/${selectedPatient.id}`, payload);
      const updated = response.data.data || response.data;

      setSelectedPatient(updated);
      setSearchResults((prev) => prev.map((p) => (p.id === selectedPatient.id ? { ...p, ...updated } : p)));
      setRecentPatients((prev) => prev.map((p) => (p.id === selectedPatient.id ? { ...p, ...updated } : p)));

      toast.success('Patient updated successfully.');
      setIsEditing(false);
      setEditForm(null);
    } catch (error) {
      console.error('Update patient error:', error);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors).flat()[0];
        toast.error(firstError || 'Please check the form.');
        return;
      }

      toast.error(error.response?.data?.message || 'Unable to update patient.');
    } finally {
      setSaving(false);
    }
  };

  const closePatientModal = () => {
    setShowPatientModal(false);
    setSelectedPatient(null);
    setHistory([]);
    setIsEditing(false);
    setEditForm(null);
  };

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  const getGenderLabel = (gender) => {
    if (!gender) return '—';
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  };

  const getStatusBadge = (status) => {
    const map = {
      paid: 'bg-green-100 text-[#1FAE6B]',
      free: 'bg-green-100 text-[#1FAE6B]',
      pending: 'bg-yellow-100 text-[#E0A400]',
      partial: 'bg-blue-100 text-[#0EA5A5]',
      overdue: 'bg-red-100 text-[#E5484D]',
    };
    return map[status] || 'bg-gray-100 text-[#5B6B72]';
  };

  const getStatusLabel = (status) => {
    const map = {
      paid: '✅ Paid',
      free: '✅ Free',
      pending: '⏳ Pending',
      partial: '🟡 Partial',
      overdue: '⚠️ Overdue',
    };
    return map[status] || status || '—';
  };

  /* ------------------------------------------------------------------ */
  /* Shared patient card (used for both "recent" and "search results")  */
  /* ------------------------------------------------------------------ */

  const PatientCard = ({ patient }) => (
    <div
      className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md hover:border-[#0EA5A5]/30 border border-transparent transition-all cursor-pointer"
      onClick={() => handleViewPatient(patient)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#0EA5A5]/20 flex items-center justify-center text-[#0EA5A5] font-bold shrink-0">
              {patient.full_name?.charAt(0)}
            </div>
            <div>
              <div className="font-semibold text-[#2B2B2B]">{patient.full_name}</div>
              <div className="text-sm text-[#5B6B72] font-mono">
                {patient.patient_code} · {patient.age} yrs · {getGenderLabel(patient.gender)}
              </div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-1.5 text-[#5B6B72]">
              <PhoneIcon className="w-3.5 h-3.5" />
              <span>{patient.phone}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#5B6B72]">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>
                Registered: {patient.registered_at ? new Date(patient.registered_at).toLocaleDateString() : '—'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(patient.payment_status)}`}>
            {getStatusLabel(patient.payment_status)}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleViewPatient(patient);
            }}
            className="text-[#0EA5A5] hover:underline text-xs font-medium flex items-center gap-1"
          >
            <EyeIcon className="w-3.5 h-3.5" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F2F8FB] p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-lg transition-all">
            <ArrowLeftIcon className="w-5 h-5 text-[#5B6B72]" />
          </button>
          <div>
            <h1 className="text-2xl font-heading font-bold text-[#2B2B2B]">🔍 Search Patient</h1>
            <p className="text-[#5B6B72] text-sm mt-0.5">Find patient by name, ID, or phone</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-3xl">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-[#5B6B72]" />
          </div>
          <input
            type="text"
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, ID (e.g. PAT-0001), or phone..."
            className="w-full pl-12 pr-24 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all bg-white shadow-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-2">
            {searchTerm && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-all"
              >
                <XMarkIcon className="w-4 h-4 text-[#5B6B72]" />
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-1.5 bg-[#0EA5A5] text-white rounded-lg text-sm font-medium hover:bg-[#0B7A7A] transition-all"
            >
              Search
            </button>
          </div>
        </form>

        <p className="text-xs text-[#5B6B72] mt-2">
          💡 Results update as you type — try a name, a Patient ID (PAT-XXXX), or a phone number
        </p>

        {/* ============================== SEARCH MODE ============================== */}
        {isSearchMode && (
          <>
            {searching && (
              <div className="mt-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-[#0EA5A5] border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-2 text-[#5B6B72] text-sm">Searching patients...</p>
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-[#5B6B72]">
                  Found {searchResults.length} patient{searchResults.length > 1 ? 's' : ''}
                </span>
                <button onClick={handleClearSearch} className="text-sm text-[#0EA5A5] hover:underline">
                  Clear results
                </button>
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="mt-4 space-y-3">
                {searchResults.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </div>
            )}

            {!searching && hasSearched && searchResults.length === 0 && (
              <div className="mt-8 bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-lg font-heading font-semibold text-[#2B2B2B]">No patients found</h3>
                <p className="text-[#5B6B72] text-sm mt-1">
                  We couldn't find any patients matching "{searchTerm}"
                </p>
                <button
                  onClick={() => navigate('/cashier/patients')}
                  className="mt-4 bg-[#0EA5A5] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#0B7A7A] transition-all"
                >
                  Register New Patient
                </button>
              </div>
            )}
          </>
        )}

        {/* ============================== RECENT PATIENTS (default) ============================== */}
        {!isSearchMode && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <UserGroupIcon className="w-4 h-4 text-[#0EA5A5]" />
              <span className="text-sm font-semibold text-[#2B2B2B]">Recent Patients</span>
            </div>

            {recentLoading ? (
              <div className="text-center py-8">
                <div className="inline-block w-8 h-8 border-4 border-[#0EA5A5] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : recentPatients.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="text-5xl mb-4">👤</div>
                <h3 className="text-lg font-heading font-semibold text-[#2B2B2B]">No patients registered yet</h3>
                <p className="text-[#5B6B72] text-sm mt-1">
                  Start typing above to search, or register the clinic's first patient.
                </p>
                <button
                  onClick={() => navigate('/cashier/patients')}
                  className="mt-4 bg-[#0EA5A5] text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-[#0B7A7A] transition-all"
                >
                  Register New Patient
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentPatients.map((patient) => (
                  <PatientCard key={patient.id} patient={patient} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================================================================
          PATIENT DETAIL / EDIT MODAL
      ================================================================= */}
      {showPatientModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closePatientModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-[#2B2B2B] transition-all"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full bg-[#0EA5A5]/20 flex items-center justify-center text-[#0EA5A5] text-2xl font-bold">
                {selectedPatient.full_name?.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-heading font-bold text-[#2B2B2B]">{selectedPatient.full_name}</h3>
                <div className="text-sm text-[#5B6B72] font-mono">{selectedPatient.patient_code}</div>
              </div>
            </div>

            {!isEditing ? (
              <>
                {/* -------------------- VIEW MODE -------------------- */}
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div className="bg-[#F2F8FB] rounded-lg p-3">
                    <div className="text-[#5B6B72]">Age</div>
                    <div className="font-medium">{selectedPatient.age} years</div>
                  </div>
                  <div className="bg-[#F2F8FB] rounded-lg p-3">
                    <div className="text-[#5B6B72]">Gender</div>
                    <div className="font-medium">{getGenderLabel(selectedPatient.gender)}</div>
                  </div>
                  <div className="bg-[#F2F8FB] rounded-lg p-3">
                    <div className="text-[#5B6B72]">Phone</div>
                    <div className="font-medium">{selectedPatient.phone}</div>
                  </div>
                  <div className="bg-[#F2F8FB] rounded-lg p-3">
                    <div className="text-[#5B6B72]">Emergency Contact</div>
                    <div className="font-medium">{selectedPatient.emergency_contact || '—'}</div>
                  </div>
                </div>

                <div className="bg-[#F2F8FB] rounded-lg p-3 mb-4">
                  <div className="text-[#5B6B72] text-sm">Address</div>
                  <div className="font-medium">{selectedPatient.address || '—'}</div>
                </div>

                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-4">
                  <div>
                    <div className="text-[#5B6B72] text-sm">Payment Status</div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                        selectedPatient.payment_status
                      )}`}
                    >
                      {getStatusLabel(selectedPatient.payment_status)}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-[#5B6B72] text-sm">Registered</div>
                    <div className="font-medium text-sm">
                      {selectedPatient.registered_at
                        ? new Date(selectedPatient.registered_at).toLocaleDateString()
                        : '—'}
                    </div>
                  </div>
                </div>

                {/* -------------------- VISIT HISTORY -------------------- */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ClockIcon className="w-4 h-4 text-[#0EA5A5]" />
                    <span className="text-sm font-semibold text-[#2B2B2B]">Visit History</span>
                    {history.length > 0 && (
                      <span className="text-xs text-[#5B6B72] bg-[#F2F8FB] px-2 py-0.5 rounded-full">
                        {history.length} visit{history.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {historyLoading ? (
                    <div className="text-sm text-[#5B6B72] py-3 text-center">Loading history...</div>
                  ) : history.length === 0 ? (
                    <div className="text-sm text-[#5B6B72] py-3 text-center bg-[#F2F8FB] rounded-lg">
                      No previous visits on record yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {history.map((visit, idx) => (
                        <div key={visit.id || idx} className="bg-[#F2F8FB] rounded-lg px-3 py-2.5 text-sm">
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-[#2B2B2B]">
                              {visit.diagnosis || visit.chief_complaint || 'Consultation'}
                            </div>
                            <div className="text-xs text-[#5B6B72]">
                              {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString() : '—'}
                            </div>
                          </div>
                          <div className="text-xs text-[#5B6B72] mt-0.5">
                            Dr. {visit.doctor_name || 'Unknown'}
                            {visit.treatment ? ` · ${visit.treatment}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2 border-t border-gray-100">
                  <button
                    onClick={startEditing}
                    className="flex-1 bg-white border border-gray-300 text-[#2B2B2B] py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <PencilIcon className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      closePatientModal();
                      navigate('/cashier/payments');
                    }}
                    className="flex-1 bg-[#0EA5A5] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#0B7A7A] transition-all"
                  >
                    View Payments
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* -------------------- EDIT MODE -------------------- */}
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Full Name *</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Age *</label>
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={editForm.age}
                        onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Gender *</label>
                      <select
                        value={editForm.gender}
                        onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                        className={inputClass}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Phone *</label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Emergency Contact</label>
                    <input
                      type="text"
                      value={editForm.emergency_contact}
                      onChange={(e) => setEditForm({ ...editForm, emergency_contact: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Address</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-5 pt-4 border-t border-gray-100">
                  <button
                    onClick={cancelEditing}
                    disabled={saving}
                    className="flex-1 bg-gray-100 text-[#2B2B2B] py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveEdits}
                    disabled={saving}
                    className="flex-1 bg-[#0EA5A5] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#0B7A7A] transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPatient;