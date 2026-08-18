import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePayments } from '../../contexts/PaymentContext';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  XMarkIcon,
  TrashIcon,
  PlusIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const TodayPatients = () => {
  const { user } = useAuth();
  const { requests, createPaymentRequest } = usePayments();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const [sending, setSending] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPatientDetail, setSelectedPatientDetail] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Poll for updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Available treatments
  const availableTreatments = [
    { id: 1, name: 'X-Ray', price: 350 },
    { id: 2, name: 'Teeth Cleaning', price: 600 },
    { id: 3, name: 'Filling', price: 1200 },
    { id: 4, name: 'Root Canal', price: 3500 },
    { id: 5, name: 'Extraction', price: 2000 },
    { id: 6, name: 'Braces', price: 8000 },
    { id: 7, name: 'Teeth Whitening', price: 6000 },
    { id: 8, name: 'Crown', price: 5000 },
    { id: 9, name: 'Denture', price: 4000 },
    { id: 10, name: 'Implant', price: 15000 },
  ];

  // Today's patients
  const [todayPatients, setTodayPatients] = useState([
    {
      id: 1,
      name: 'Tigist Haile',
      patientId: 'PAT-1082',
      age: 28,
      gender: 'Female',
      phone: '+251 92 345 6789',
      time: '09:00 AM',
      status: 'waiting',
      paymentStatus: 'pending',
      amount: 600,
      items: ['Teeth Cleaning'],
      diagnosis: 'Gingivitis - Cleaning Required',
      registeredBy: 'Cashier Saron',
      registeredAt: '2026-07-27 08:45 AM',
      appointmentDate: '2026-07-27'
    },
    {
      id: 2,
      name: 'Abebe Bekele',
      patientId: 'PAT-1081',
      age: 35,
      gender: 'Male',
      phone: '+251 91 234 5678',
      time: '10:30 AM',
      status: 'in_progress',
      paymentStatus: 'pending',
      amount: 3200,
      items: ['Root Canal', 'X-Ray'],
      diagnosis: 'Pulpitis - Root Canal Required',
      registeredBy: 'Cashier Saron',
      registeredAt: '2026-07-27 09:15 AM',
      appointmentDate: '2026-07-27'
    },
    {
      id: 3,
      name: 'Dawit Tesfaye',
      patientId: 'PAT-1083',
      age: 42,
      gender: 'Male',
      phone: '+251 93 456 7890',
      time: '11:30 AM',
      status: 'waiting',
      paymentStatus: 'partial',
      amount: 550,
      items: ['X-Ray'],
      diagnosis: 'Impacted Wisdom Tooth',
      registeredBy: 'Cashier Feven',
      registeredAt: '2026-07-27 10:00 AM',
      appointmentDate: '2026-07-27'
    },
    {
      id: 4,
      name: 'Hiwot Girma',
      patientId: 'PAT-1084',
      age: 24,
      gender: 'Female',
      phone: '+251 94 567 8901',
      time: '02:00 PM',
      status: 'paid',
      paymentStatus: 'paid',
      amount: 1400,
      items: ['Filling'],
      diagnosis: 'Dental Caries',
      registeredBy: 'Cashier Saron',
      registeredAt: '2026-07-27 01:00 PM',
      appointmentDate: '2026-07-27'
    },
    {
      id: 5,
      name: 'Meron Alemu',
      patientId: 'PAT-1085',
      age: 31,
      gender: 'Female',
      phone: '+251 95 678 9012',
      time: '03:30 PM',
      status: 'done',
      paymentStatus: 'paid',
      amount: 1800,
      items: ['Cleaning', 'Whitening'],
      diagnosis: 'Staining and Plaque',
      registeredBy: 'Cashier Feven',
      registeredAt: '2026-07-27 02:30 PM',
      appointmentDate: '2026-07-27'
    },
  ]);

  // Simulate new patient registration by Cashier
  const simulateNewPatient = () => {
    const names = ['Bruktawit', 'Mekdes', 'Yonas', 'Selam', 'Henok', 'Tsion', 'Nahom', 'Ruth'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const newPatient = {
      id: todayPatients.length + 1,
      name: randomName + ' ' + ['Alemu', 'Tesfaye', 'Girma', 'Haile'][Math.floor(Math.random() * 4)],
      patientId: `PAT-${String(1000 + todayPatients.length + 1).padStart(4, '0')}`,
      age: Math.floor(Math.random() * 40) + 18,
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      phone: `+251 91 ${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      time: ['09:00 AM', '10:30 AM', '11:30 AM', '02:00 PM', '03:30 PM'][Math.floor(Math.random() * 5)],
      status: 'waiting',
      paymentStatus: 'pending',
      amount: 0,
      items: [],
      diagnosis: 'New patient - Awaiting examination',
      registeredBy: 'Cashier',
      registeredAt: new Date().toLocaleString(),
      appointmentDate: new Date().toISOString().slice(0, 10)
    };
    setTodayPatients(prev => [newPatient, ...prev]);
    toast.success(`✅ New patient ${newPatient.name} registered by Cashier!`);
  };

  // Filter patients based on tab
  const filteredPatients = todayPatients.filter(patient => {
    if (activeTab === 'all') return true;
    return patient.status === activeTab;
  });

  // Search patients
  const searchedPatients = filteredPatients.filter(patient => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return patient.name.toLowerCase().includes(search) ||
           patient.patientId.toLowerCase().includes(search) ||
           patient.phone.includes(search);
  });

  // Stats
  const totalToday = todayPatients.length;
  const waitingCount = todayPatients.filter(p => p.status === 'waiting').length;
  const inProgressCount = todayPatients.filter(p => p.status === 'in_progress').length;
  const paidCount = todayPatients.filter(p => p.status === 'paid').length;
  const doneCount = todayPatients.filter(p => p.status === 'done').length;

  const tabs = [
    { id: 'all', label: '📋 All', count: totalToday },
    { id: 'waiting', label: '⏳ Waiting', count: waitingCount },
    { id: 'in_progress', label: '🔄 In Progress', count: inProgressCount },
    { id: 'paid', label: '✅ Paid', count: paidCount },
    { id: 'done', label: '✔️ Done', count: doneCount },
  ];

  const getStatusBadge = (status) => {
    const map = {
      waiting: 'bg-yellow-100 text-[#E0A400] px-3 py-1 rounded-full text-sm font-medium',
      in_progress: 'bg-blue-100 text-[#0EA5A5] px-3 py-1 rounded-full text-sm font-medium',
      paid: 'bg-green-100 text-[#1FAE6B] px-3 py-1 rounded-full text-sm font-medium',
      done: 'bg-green-100 text-[#1FAE6B] px-3 py-1 rounded-full text-sm font-medium'
    };
    return map[status] || 'bg-gray-100 text-[#5B6B72] px-3 py-1 rounded-full text-sm font-medium';
  };

  const getStatusLabel = (status) => {
    const map = {
      waiting: '⏳ Waiting',
      in_progress: '🔄 In Progress',
      paid: '✅ Paid',
      done: '✔️ Done'
    };
    return map[status] || status;
  };

  const getPaymentBadge = (status) => {
    const map = {
      paid: 'bg-green-100 text-[#1FAE6B] px-3 py-1 rounded-full text-sm font-medium',
      pending: 'bg-yellow-100 text-[#E0A400] px-3 py-1 rounded-full text-sm font-medium',
      partial: 'bg-blue-100 text-[#0EA5A5] px-3 py-1 rounded-full text-sm font-medium'
    };
    return map[status] || 'bg-gray-100 text-[#5B6B72] px-3 py-1 rounded-full text-sm font-medium';
  };

  const getPaymentLabel = (status) => {
    const map = {
      paid: '✅ Paid',
      pending: '⏳ Pending',
      partial: '🟡 Partial'
    };
    return map[status] || status;
  };

  // ===== PAYMENT MODAL FUNCTIONS =====
  const openPaymentModal = (patient) => {
    setSelectedPatient(patient);
    setSelectedTreatments([]);
    setShowPaymentModal(true);
  };

  const handleAddTreatment = (treatment) => {
    if (selectedTreatments.find(t => t.id === treatment.id)) {
      setSelectedTreatments(selectedTreatments.filter(t => t.id !== treatment.id));
    } else {
      setSelectedTreatments([...selectedTreatments, treatment]);
    }
  };

  const handleRemoveTreatment = (treatmentId) => {
    setSelectedTreatments(selectedTreatments.filter(t => t.id !== treatmentId));
  };

  const getTotal = () => {
    return selectedTreatments.reduce((sum, t) => sum + t.price, 0);
  };

  const handleSendToCashier = () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }
    if (selectedTreatments.length === 0) {
      toast.error('Please add at least one treatment');
      return;
    }

    setSending(true);
    
    const newRequest = createPaymentRequest({
      patient: selectedPatient.name,
      patientId: selectedPatient.patientId,
      doctor: user?.name || 'Dr. Liya Hailu',
      items: selectedTreatments.map(t => ({ 
        name: t.name, 
        price: t.price 
      })),
      patientAge: selectedPatient.age,
      patientGender: selectedPatient.gender,
      patientPhone: selectedPatient.phone
    });

    // Update patient status locally
    setTodayPatients(prev => prev.map(p => 
      p.id === selectedPatient.id 
        ? { 
            ...p, 
            status: 'waiting', 
            paymentStatus: 'pending', 
            amount: getTotal(), 
            items: selectedTreatments.map(t => t.name) 
          }
        : p
    ));

    setTimeout(() => {
      toast.success(`✅ Payment request sent to Cashier! Total: ${getTotal()} ETB`);
      setShowPaymentModal(false);
      setSelectedTreatments([]);
      setSending(false);
    }, 500);
  };

  const handleCancel = () => {
    if (selectedTreatments.length > 0 || selectedPatient) {
      if (window.confirm('Are you sure you want to cancel this payment request?')) {
        setShowPaymentModal(false);
        setSelectedTreatments([]);
        toast.info('❌ Payment request cancelled');
      }
    } else {
      setShowPaymentModal(false);
    }
  };

  // View patient details
  const handleViewDetails = (patient) => {
    setSelectedPatientDetail(patient);
    setShowDetailModal(true);
  };

  // Start treatment
  const handleStartTreatment = (patient) => {
    if (patient.status === 'paid') {
      toast.success(`🦷 Starting treatment for ${patient.name}`);
      setTodayPatients(prev => prev.map(p => 
        p.id === patient.id ? { ...p, status: 'in_progress' } : p
      ));
    } else {
      toast.error('⛔ Payment required before starting treatment');
    }
  };

  // Complete treatment
  const handleCompleteTreatment = (patient) => {
    if (patient.status === 'in_progress') {
      toast.success(`✅ Treatment completed for ${patient.name}`);
      setTodayPatients(prev => prev.map(p => 
        p.id === patient.id ? { ...p, status: 'done' } : p
      ));
    } else {
      toast.error('⛔ Treatment not in progress');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#2B2B2B]">
            📋 Today's Patients
          </h1>
          <p className="text-[#5B6B72] text-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} · {todayPatients.length} patients today
          </p>
        </div>
        <button
          onClick={simulateNewPatient}
          className="bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] text-white px-4 py-2 rounded-xl text-sm font-medium hover:shadow-lg transition-all flex items-center gap-2"
        >
          <PlusIcon className="w-4 h-4" />
          Simulate New Patient
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <div className="text-2xl font-heading font-bold text-[#2B2B2B]">{totalToday}</div>
          <div className="text-xs text-[#5B6B72]">Total</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center border-l-4 border-[#E0A400]">
          <div className="text-2xl font-heading font-bold text-[#E0A400]">{waitingCount}</div>
          <div className="text-xs text-[#5B6B72]">Waiting</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center border-l-4 border-[#0EA5A5]">
          <div className="text-2xl font-heading font-bold text-[#0EA5A5]">{inProgressCount}</div>
          <div className="text-xs text-[#5B6B72]">In Progress</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center border-l-4 border-[#1FAE6B]">
          <div className="text-2xl font-heading font-bold text-[#1FAE6B]">{paidCount}</div>
          <div className="text-xs text-[#5B6B72]">Paid</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center border-l-4 border-[#1FAE6B]">
          <div className="text-2xl font-heading font-bold text-[#1FAE6B]">{doneCount}</div>
          <div className="text-xs text-[#5B6B72]">Done</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-[#0EA5A5] text-white shadow-md'
                : 'bg-gray-100 text-[#5B6B72] hover:bg-gray-200'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Patients List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {searchedPatients.length === 0 ? (
          <div className="text-center py-12 text-[#5B6B72]">
            <div className="text-5xl mb-4">👤</div>
            <p className="text-lg font-medium">No patients found</p>
            <p className="text-sm">No patients match your search or filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {searchedPatients.map((patient) => (
              <div key={patient.id} className="bg-[#F2F8FB] rounded-xl p-4 hover:shadow-md transition-all cursor-pointer">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {patient.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#2B2B2B] text-lg">{patient.name}</span>
                        <span className="text-sm text-[#5B6B72]">{patient.patientId}</span>
                        <span className={`text-xs ${getStatusBadge(patient.status)}`}>
                          {getStatusLabel(patient.status)}
                        </span>
                      </div>
                      <div className="text-sm text-[#5B6B72] flex items-center gap-3 flex-wrap">
                        <span>{patient.age} yrs · {patient.gender}</span>
                        <span className="flex items-center gap-1">
                          <PhoneIcon className="w-3 h-3" />
                          {patient.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-3 h-3" />
                          {patient.time}
                        </span>
                      </div>
                      <div className="text-xs text-[#5B6B72] mt-0.5">
                        Registered by: {patient.registeredBy} at {patient.registeredAt}
                      </div>
                      {patient.items && patient.items.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {patient.items.map((item, idx) => (
                            <span key={idx} className="bg-white px-2 py-0.5 rounded-full text-xs shadow-sm">
                              {item}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {patient.amount > 0 && (
                      <span className="font-mono-amount font-bold text-[#2B2B2B] text-lg">
                        ETB {patient.amount.toLocaleString()}
                      </span>
                    )}
                    {patient.paymentStatus && (
                      <span className={getPaymentBadge(patient.paymentStatus)}>
                        {getPaymentLabel(patient.paymentStatus)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                  {patient.status === 'waiting' || patient.status === 'in_progress' ? (
                    <>
                      <button 
                        onClick={() => openPaymentModal(patient)}
                        className="bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:shadow-lg transition-all flex items-center gap-1"
                      >
                        <PaperAirplaneIcon className="w-3 h-3" />
                        Create Payment
                      </button>
                      <button 
                        onClick={() => handleViewDetails(patient)}
                        className="bg-gray-200 text-[#2B2B2B] text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-gray-300 transition-all flex items-center gap-1"
                      >
                        <EyeIcon className="w-3 h-3" />
                        View Details
                      </button>
                    </>
                  ) : patient.status === 'paid' ? (
                    <>
                      <button 
                        onClick={() => handleStartTreatment(patient)}
                        className="bg-[#1FAE6B] text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-green-600 transition-all flex items-center gap-1"
                      >
                        <CheckCircleIcon className="w-3 h-3" />
                        Start Treatment
                      </button>
                      <button 
                        onClick={() => handleViewDetails(patient)}
                        className="bg-gray-200 text-[#2B2B2B] text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-gray-300 transition-all flex items-center gap-1"
                      >
                        <EyeIcon className="w-3 h-3" />
                        View Details
                      </button>
                    </>
                  ) : patient.status === 'in_progress' ? (
                    <>
                      <button 
                        onClick={() => handleCompleteTreatment(patient)}
                        className="bg-[#0EA5A5] text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-[#0B7A7A] transition-all flex items-center gap-1"
                      >
                        <CheckCircleIcon className="w-3 h-3" />
                        Complete Treatment
                      </button>
                      <button 
                        onClick={() => handleViewDetails(patient)}
                        className="bg-gray-200 text-[#2B2B2B] text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-gray-300 transition-all flex items-center gap-1"
                      >
                        <EyeIcon className="w-3 h-3" />
                        View Details
                      </button>
                    </>
                  ) : patient.status === 'done' ? (
                    <>
                      <span className="bg-green-100 text-[#1FAE6B] text-xs px-3 py-1.5 rounded-lg font-medium">
                        ✅ Treatment Done
                      </span>
                      <button 
                        onClick={() => handleViewDetails(patient)}
                        className="bg-gray-200 text-[#2B2B2B] text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-gray-300 transition-all flex items-center gap-1"
                      >
                        <EyeIcon className="w-3 h-3" />
                        View History
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== PAYMENT REQUEST MODAL ===== */}
      {showPaymentModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
                    💳 New Payment Request
                  </h2>
                  <p className="text-white/80 text-sm">
                    Patient: <span className="font-semibold text-white">{selectedPatient.name}</span>
                    <span className="ml-2 text-white/70">{selectedPatient.patientId}</span>
                  </p>
                  <p className="text-white/60 text-xs">
                    {selectedPatient.age} yrs · {selectedPatient.gender} · {selectedPatient.phone}
                  </p>
                </div>
                <button
                  onClick={handleCancel}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Doctor */}
              <div className="bg-[#F2F8FB] rounded-xl p-3 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0EA5A5]/20 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-[#0EA5A5]" />
                </div>
                <div>
                  <div className="text-xs text-[#5B6B72]">Doctor</div>
                  <div className="font-medium text-[#2B2B2B]">{user?.name || 'Dr. Liya Hailu'}</div>
                </div>
              </div>

              {/* Select Treatments */}
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-2 block flex items-center gap-2">
                  <span className="text-[#0EA5A5]">🦷</span> Select Treatments
                  <span className="text-xs text-[#5B6B72] font-normal">(click to add/remove)</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {availableTreatments.map((treatment) => {
                    const isSelected = selectedTreatments.find(t => t.id === treatment.id);
                    return (
                      <div
                        key={treatment.id}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#0EA5A5] bg-[#0EA5A5]/5 shadow-sm'
                            : 'border-gray-200 hover:border-[#0EA5A5]/50 hover:bg-[#F2F8FB]'
                        }`}
                        onClick={() => handleAddTreatment(treatment)}
                      >
                        <div>
                          <div className="text-sm font-medium text-[#2B2B2B]">{treatment.name}</div>
                          <div className="text-xs text-[#5B6B72] font-mono-amount">ETB {treatment.price.toLocaleString()}</div>
                        </div>
                        <button className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold transition-all ${
                          isSelected ? 'bg-[#E5484D] hover:bg-red-600' : 'bg-[#0EA5A5] hover:bg-[#0B7A7A]'
                        }`}>
                          {isSelected ? '✕' : '+'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Add Another Item */}
              <button
                onClick={() => {
                  const randomTreatment = availableTreatments[Math.floor(Math.random() * availableTreatments.length)];
                  if (!selectedTreatments.find(t => t.id === randomTreatment.id)) {
                    handleAddTreatment(randomTreatment);
                    toast.success(`Added ${randomTreatment.name}`);
                  } else {
                    toast.info('Treatment already added');
                  }
                }}
                className="text-sm text-[#0EA5A5] font-medium hover:underline flex items-center gap-1 transition-all"
              >
                <PlusIcon className="w-4 h-4" />
                Add another item
              </button>

              {/* Selected Treatments */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-[#2B2B2B] flex items-center gap-2">
                    📋 Selected Treatments
                  </h3>
                  <span className="px-3 py-1 bg-[#0EA5A5]/10 text-[#0EA5A5] rounded-full text-sm font-medium">
                    {selectedTreatments.length} items
                  </span>
                </div>
                {selectedTreatments.length === 0 ? (
                  <div className="text-center py-4 text-[#5B6B72] border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-sm">No treatments added yet</p>
                    <p className="text-xs">Select treatments from above</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedTreatments.map((treatment) => (
                      <div key={treatment.id} className="flex items-center justify-between p-3 bg-[#F2F8FB] rounded-xl">
                        <div>
                          <div className="font-medium text-[#2B2B2B] text-sm">{treatment.name}</div>
                          <div className="text-xs text-[#5B6B72] font-mono-amount">ETB {treatment.price.toLocaleString()}</div>
                        </div>
                        <button
                          onClick={() => handleRemoveTreatment(treatment.id)}
                          className="p-1 text-[#E5484D] hover:bg-red-50 rounded-lg transition-all"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-[#F2F8FB] to-white rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-[#0EA5A5]/20 flex items-center justify-center">
                      <CurrencyDollarIcon className="w-5 h-5 text-[#0EA5A5]" />
                    </div>
                    <div>
                      <div className="text-xs text-[#5B6B72]">Total Amount</div>
                      <div className="text-sm text-[#5B6B72]">Including all treatments</div>
                    </div>
                  </div>
                  <div className="text-3xl font-heading font-bold text-[#0EA5A5] font-mono-amount">
                    {getTotal().toLocaleString()} ETB
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCancel}
                  className="flex-1 bg-gray-100 text-[#2B2B2B] py-3 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendToCashier}
                  disabled={sending || !selectedPatient || selectedTreatments.length === 0}
                  className="flex-1 bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sending ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5" />
                      Send to Cashier →
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && selectedPatientDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                    📋 Patient Details
                  </h2>
                  <p className="text-white/80 text-sm">
                    {selectedPatientDetail.name} · {selectedPatientDetail.patientId}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-3">
              <div className="bg-[#F2F8FB] rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[#5B6B72]">Name</div>
                    <div className="font-medium">{selectedPatientDetail.name}</div>
                  </div>
                  <div>
                    <div className="text-[#5B6B72]">ID</div>
                    <div className="font-medium">{selectedPatientDetail.patientId}</div>
                  </div>
                  <div>
                    <div className="text-[#5B6B72]">Age</div>
                    <div className="font-medium">{selectedPatientDetail.age} yrs</div>
                  </div>
                  <div>
                    <div className="text-[#5B6B72]">Gender</div>
                    <div className="font-medium">{selectedPatientDetail.gender}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#5B6B72]">Phone</div>
                    <div className="font-medium">{selectedPatientDetail.phone}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#5B6B72]">Time</div>
                    <div className="font-medium">{selectedPatientDetail.time}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#5B6B72]">Status</div>
                    <span className={getStatusBadge(selectedPatientDetail.status)}>
                      {getStatusLabel(selectedPatientDetail.status)}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#5B6B72]">Diagnosis</div>
                    <div className="font-medium">{selectedPatientDetail.diagnosis || 'N/A'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#5B6B72]">Registered By</div>
                    <div className="font-medium">{selectedPatientDetail.registeredBy}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#5B6B72]">Registered At</div>
                    <div className="font-medium">{selectedPatientDetail.registeredAt}</div>
                  </div>
                </div>
              </div>

              {selectedPatientDetail.items && selectedPatientDetail.items.length > 0 && (
                <div className="bg-[#F2F8FB] rounded-xl p-4">
                  <div className="text-[#5B6B72] text-sm">Treatments</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedPatientDetail.items.map((item, idx) => (
                      <span key={idx} className="bg-white px-3 py-1 rounded-full text-sm shadow-sm">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedPatientDetail.amount > 0 && (
                <div className="bg-[#F2F8FB] rounded-xl p-4">
                  <div className="text-[#5B6B72] text-sm">Amount</div>
                  <div className="font-mono font-bold text-[#2B2B2B] text-lg">
                    ETB {selectedPatientDetail.amount.toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 pt-0">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all"
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

export default TodayPatients;