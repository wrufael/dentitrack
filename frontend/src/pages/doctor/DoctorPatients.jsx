// src/pages/Doctor/DoctorPatients.jsx
import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, UserCircleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { usePatients } from '../../contexts/PatientsContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import TreatmentRecording from '../../components/doctor/TreatmentRecording';

const DoctorPatients = () => {
  const { patients, loading, fetchPatients, searchPatients } = usePatients();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState(null); // null = not searching, show `patients`
  const [isSearching, setIsSearching] = useState(false);

  const [activePatient, setActivePatient] = useState(null); // patient being recorded for
  const [historyPatient, setHistoryPatient] = useState(null); // patient whose history is shown
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load the real clinic patient list on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  // Debounced real search against the backend
  useEffect(() => {
    if (search.trim().length < 2) {
      setSearchResults(null);
      return;
    }
    setIsSearching(true);
    const debounce = setTimeout(async () => {
      const results = await searchPatients(search.trim());
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(debounce);
  }, [search]);

  const list = searchResults !== null ? searchResults : patients;

  const openHistory = async (patient) => {
    setHistoryPatient(patient);
    setLoadingHistory(true);
    try {
      const res = await api.get(`/patients/${patient.id}/consultations`);
      setHistory(res.data?.data?.consultations || []);
    } catch (error) {
      console.error('Failed to load history:', error);
      toast.error('Failed to load patient history');
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-[#2B2B2B]">My Patients</h1>
        <p className="text-[#5B6B72] text-sm mt-1">All patients registered at your clinic</p>
      </div>

      <div className="relative max-w-md">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-[#5B6B72]" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID, or phone..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all bg-white"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5 max-w-xs">
        <div className="text-sm text-[#5B6B72]">Total Patients</div>
        <div className="text-2xl font-bold text-[#2B2B2B] mt-1">{patients.length}</div>
      </div>

      <div className="space-y-3">
        {loading || isSearching ? (
          <p className="text-[#5B6B72] text-sm">Loading patients...</p>
        ) : list.length === 0 ? (
          <p className="text-[#5B6B72] text-sm">
            {search.trim() ? `No patients found for "${search}"` : 'No patients registered yet.'}
          </p>
        ) : (
          list.map((p) => (
            <div
              key={p.id}
              className="w-full flex items-center gap-4 bg-white rounded-xl shadow-sm p-4"
            >
              <div className="w-10 h-10 rounded-full bg-[#0EA5A5]/10 flex items-center justify-center">
                <UserCircleIcon className="w-6 h-6 text-[#0EA5A5]" />
              </div>
              <div className="flex-1">
                <div className="font-medium text-[#2B2B2B]">{p.name}</div>
                <div className="text-xs text-[#5B6B72]">
                  {p.patient_id || p.id} · {p.age ?? '—'} yrs · {p.gender ?? '—'} · {p.phone ?? '—'}
                </div>
              </div>
              <button
                onClick={() => openHistory(p)}
                className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all"
                title="View history"
              >
                <ClipboardDocumentListIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActivePatient(p)}
                className="bg-[#0EA5A5] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#0B7A7A] transition-all"
              >
                Record Consultation
              </button>
            </div>
          ))
        )}
      </div>

      {/* Record consultation modal */}
      {activePatient && (
        <TreatmentRecording
          patient={activePatient}
          onClose={() => setActivePatient(null)}
          onSaved={() => {
            if (historyPatient && historyPatient.id === activePatient.id) {
              openHistory(activePatient);
            }
          }}
        />
      )}

      {/* Patient history modal */}
      {historyPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-heading font-bold text-[#2B2B2B]">
                {historyPatient.name}'s History
              </h3>
              <button
                onClick={() => setHistoryPatient(null)}
                className="p-2 hover:bg-gray-100 rounded-lg text-[#5B6B72]"
              >
                ✕
              </button>
            </div>

            {loadingHistory ? (
              <p className="text-[#5B6B72] text-sm">Loading...</p>
            ) : history.length === 0 ? (
              <p className="text-[#5B6B72] text-sm">No consultations recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {history.map((c) => (
                  <div key={c.id} className="bg-[#F2F8FB] rounded-xl p-4 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-[#2B2B2B]">{c.visit_date}</span>
                      <span className="text-[#0EA5A5]">Dr. {c.doctor_name}</span>
                    </div>
                    {c.diagnosis && <div><span className="text-[#5B6B72]">Diagnosis:</span> {c.diagnosis}</div>}
                    {c.treatment && <div><span className="text-[#5B6B72]">Treatment:</span> {c.treatment}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPatients;