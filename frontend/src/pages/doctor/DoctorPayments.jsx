import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePayments } from '../../contexts/PaymentContext';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PaperAirplaneIcon,
  TrashIcon,
  PlusIcon,
  ClockIcon,
  EyeIcon,
  CheckCircleIcon,
  PencilIcon,
  NoSymbolIcon,
  DocumentTextIcon,
  CreditCardIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import NotificationBell from '../../components/common/NotificationBell';

const DoctorPayments = () => {
  const { user } = useAuth();
  const { 
    requests, 
    createPaymentRequest, 
    updatePaymentRequest, 
    cancelPaymentRequest,
    notifications,
    unreadCount 
  } = usePayments();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [editingRequest, setEditingRequest] = useState(null);
  const [formNotes, setFormNotes] = useState('');

  // Available treatments
  const availableTreatments = [
    { id: 1, name: '🦷 X-Ray', price: 350 },
    { id: 2, name: '🧹 Teeth Cleaning', price: 600 },
    { id: 3, name: '🦷 Filling', price: 1200 },
    { id: 4, name: '🦷 Root Canal', price: 3500 },
    { id: 5, name: '🦷 Extraction', price: 2000 },
    { id: 6, name: '🦷 Braces', price: 8000 },
    { id: 7, name: '✨ Teeth Whitening', price: 6000 },
    { id: 8, name: '👑 Crown', price: 5000 },
    { id: 9, name: '🦷 Denture', price: 4000 },
    { id: 10, name: '💉 Implant', price: 15000 },
  ];

  // Sample patients for search
  const allPatients = [
    { id: 1, name: 'Abebe Bekele', patientId: 'PAT-001', phone: '+251 91 234 5678', age: 35, gender: 'Male' },
    { id: 2, name: 'Tigist Haile', patientId: 'PAT-002', phone: '+251 92 345 6789', age: 28, gender: 'Female' },
    { id: 3, name: 'Dawit Tesfaye', patientId: 'PAT-003', phone: '+251 93 456 7890', age: 42, gender: 'Male' },
    { id: 4, name: 'Hiwot Girma', patientId: 'PAT-004', phone: '+251 94 567 8901', age: 24, gender: 'Female' },
    { id: 5, name: 'Meron Alemu', patientId: 'PAT-005', phone: '+251 95 678 9012', age: 31, gender: 'Female' },
  ];

  // Payment requests with more data
  const [paymentRequests, setPaymentRequests] = useState([
    {
      id: 1,
      requestId: 'REQ-1001',
      patient: 'Abebe Bekele',
      patientId: 'PAT-001',
      doctor: 'Dr. Liya Hailu',
      date: '2026-07-27',
      items: [
        { name: 'Root Canal', price: 2850 },
        { name: 'X-Ray', price: 350 }
      ],
      total: 3200,
      paid: 0,
      balance: 3200,
      status: 'pending',
      cashier: null,
      paymentMethod: null,
      receipt: null,
      createdAt: '2026-07-27T09:00:00',
      patientAge: 35,
      patientGender: 'Male',
      patientPhone: '+251 91 234 5678',
      notes: 'Patient has severe pain',
      isNew: true
    },
    {
      id: 2,
      requestId: 'REQ-1002',
      patient: 'Tigist Haile',
      patientId: 'PAT-002',
      doctor: 'Dr. Liya Hailu',
      date: '2026-07-26',
      items: [
        { name: 'Teeth Cleaning', price: 600 }
      ],
      total: 600,
      paid: 0,
      balance: 600,
      status: 'pending',
      cashier: null,
      paymentMethod: null,
      receipt: null,
      createdAt: '2026-07-26T10:30:00',
      patientAge: 28,
      patientGender: 'Female',
      patientPhone: '+251 92 345 6789',
      notes: 'Regular cleaning',
      isNew: false
    },
    {
      id: 3,
      requestId: 'REQ-1003',
      patient: 'Dawit Tesfaye',
      patientId: 'PAT-003',
      doctor: 'Dr. Liya Hailu',
      date: '2026-07-25',
      items: [
        { name: 'X-Ray', price: 550 }
      ],
      total: 550,
      paid: 200,
      balance: 350,
      status: 'partial',
      cashier: 'Saron Kebede',
      paymentMethod: 'Telebirr',
      receipt: 'RCP-002',
      createdAt: '2026-07-25T14:00:00',
      patientAge: 42,
      patientGender: 'Male',
      patientPhone: '+251 93 456 7890',
      notes: 'X-Ray for wisdom tooth',
      isNew: false
    },
  ]);

  const filteredPatients = allPatients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.patientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone.includes(searchTerm)
  );

  const filteredRequests = paymentRequests.filter(req => {
    if (filter === 'all') return true;
    return req.status === filter;
  });

  const getStatusBadge = (status) => {
    const map = {
      paid: 'bg-green-100 text-[#1FAE6B] px-3 py-1 rounded-full text-sm font-medium',
      pending: 'bg-yellow-100 text-[#E0A400] px-3 py-1 rounded-full text-sm font-medium',
      partial: 'bg-blue-100 text-[#0EA5A5] px-3 py-1 rounded-full text-sm font-medium',
      done: 'bg-green-100 text-[#1FAE6B] px-3 py-1 rounded-full text-sm font-medium'
    };
    return map[status] || 'bg-gray-100 text-[#5B6B72] px-3 py-1 rounded-full text-sm font-medium';
  };

  const getStatusLabel = (status) => {
    const map = {
      paid: '✅ Paid',
      pending: '⏳ Pending',
      partial: '🟡 Partial',
      done: '✅ Done'
    };
    return map[status] || status;
  };

  // ===== OPEN DETAIL MODAL =====
  const handleRequestClick = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  // ===== EDIT REQUEST =====
  const handleEditRequest = (request) => {
    setEditingRequest(request);
    setSelectedTreatments(request.items);
    setShowEditForm(true);
    setShowDetailModal(false);
  };

  // ===== CANCEL REQUEST =====
  const handleCancelRequest = (request) => {
    if (window.confirm(`Are you sure you want to cancel this payment request for ${request.patient}?`)) {
      cancelPaymentRequest(request.id);
      toast.success(`❌ Payment request cancelled for ${request.patient}`);
      setShowDetailModal(false);
    }
  };

  // ===== SEND TO CASHIER WITH NOTIFICATION =====
  const handleSendToCashier = (request) => {
    const updatedRequests = paymentRequests.map(req => {
      if (req.id === request.id) {
        return { ...req, status: 'pending', isNew: true };
      }
      return req;
    });
    setPaymentRequests(updatedRequests);
    toast.success(`✅ Payment request sent to Cashier for ${request.patient}`);
    toast.success('🔔 Cashier has been notified!');
    setShowDetailModal(false);
  };

  // ===== SAVE EDITED REQUEST =====
  const handleSaveEdit = () => {
    const updatedRequests = paymentRequests.map(req => {
      if (req.id === editingRequest.id) {
        const total = selectedTreatments.reduce((sum, t) => sum + t.price, 0);
        return {
          ...req,
          items: selectedTreatments,
          total: total,
          balance: total - req.paid
        };
      }
      return req;
    });
    setPaymentRequests(updatedRequests);
    toast.success('✅ Payment request updated successfully!');
    setShowEditForm(false);
    setSelectedTreatments([]);
    setEditingRequest(null);
  };

  // ===== FORM FUNCTIONS =====
  const openForm = () => {
    setSelectedPatient(null);
    setSelectedTreatments([]);
    setShowForm(true);
    setSearchTerm('');
    setShowPatientSearch(false);
    setFormNotes('');
  };

  const closeForm = () => {
    setShowForm(false);
    setShowEditForm(false);
    setSelectedPatient(null);
    setSelectedTreatments([]);
    setSearchTerm('');
    setShowPatientSearch(false);
    setEditingRequest(null);
    setFormNotes('');
  };

  const selectPatient = (patient) => {
    setSelectedPatient(patient);
    setSearchTerm(patient.name);
    setShowPatientSearch(false);
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

  // ===== CREATE REQUEST WITH NOTIFICATION =====
  const handleCreateRequest = () => {
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }
    if (selectedTreatments.length === 0) {
      toast.error('Please add at least one treatment');
      return;
    }

    setSending(true);
    
    const newRequest = {
      id: paymentRequests.length + 1,
      requestId: `REQ-${1000 + paymentRequests.length + 1}`,
      patient: selectedPatient.name,
      patientId: selectedPatient.patientId,
      doctor: user?.name || 'Dr. Liya Hailu',
      date: new Date().toISOString().slice(0, 10),
      items: selectedTreatments.map(t => ({ name: t.name.replace(/[^\w\s]/g, '').trim(), price: t.price })),
      total: getTotal(),
      paid: 0,
      balance: getTotal(),
      status: 'pending',
      cashier: null,
      paymentMethod: null,
      receipt: null,
      createdAt: new Date().toISOString(),
      patientAge: selectedPatient.age,
      patientGender: selectedPatient.gender,
      patientPhone: selectedPatient.phone,
      notes: formNotes,
      isNew: true
    };

    setPaymentRequests([newRequest, ...paymentRequests]);

    setTimeout(() => {
      toast.success(`✅ Payment request sent to Cashier! Total: ${getTotal()} ETB`);
      toast.success('🔔 Cashier has been notified!');
      closeForm();
      setSending(false);
    }, 500);
  };

  // Stats
  const totalRequests = paymentRequests.length;
  const pendingCount = paymentRequests.filter(r => r.status === 'pending' || r.status === 'partial').length;
  const totalAmount = paymentRequests.reduce((sum, r) => sum + r.total, 0);

  return (
    <div className="space-y-6">
      {/* Header with Notification Bell */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#2B2B2B]">💳 Payment Requests</h1>
          <p className="text-[#5B6B72] text-sm">Create, edit, and manage payment requests</p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <button
            onClick={openForm}
            className="bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] text-white px-6 py-2.5 rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Payment Request
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#5B6B72]">Total Requests</div>
              <div className="text-2xl font-heading font-bold text-[#2B2B2B]">{totalRequests}</div>
            </div>
            <div className="p-3 bg-[#0EA5A5]/10 rounded-xl">
              <CurrencyDollarIcon className="w-6 h-6 text-[#0EA5A5]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#E0A400]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#5B6B72]">Pending</div>
              <div className="text-2xl font-heading font-bold text-[#E0A400]">{pendingCount}</div>
            </div>
            <div className="p-3 bg-[#E0A400]/10 rounded-xl">
              <ClockIcon className="w-6 h-6 text-[#E0A400]" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#1FAE6B]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#5B6B72]">Total Amount</div>
              <div className="text-2xl font-heading font-bold text-[#1FAE6B]">ETB {totalAmount.toLocaleString()}</div>
            </div>
            <div className="p-3 bg-[#1FAE6B]/10 rounded-xl">
              <CurrencyDollarIcon className="w-6 h-6 text-[#1FAE6B]" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'pending', 'partial', 'paid', 'done', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              filter === status
                ? 'bg-[#0EA5A5] text-white shadow-md'
                : 'bg-gray-100 text-[#5B6B72] hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? '📋 All' : 
             status === 'pending' ? '⏳ Pending' :
             status === 'partial' ? '🟡 Partial' :
             status === 'paid' ? '✅ Paid' : 
             status === 'done' ? '✔️ Done' : '🚫 Cancelled'}
            ({paymentRequests.filter(r => r.status === status).length})
          </button>
        ))}
      </div>

      {/* Requests List - CLICKABLE */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-heading font-semibold text-[#2B2B2B] mb-4">💰 Payment Requests</h3>
        
        {filteredRequests.length === 0 ? (
          <div className="text-center py-8 text-[#5B6B72]">
            <div className="text-4xl mb-2">💳</div>
            <p>No payment requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <div 
                key={request.id} 
                className={`bg-[#F2F8FB] rounded-xl p-5 hover:shadow-md transition-all cursor-pointer ${request.isNew ? 'border-2 border-[#0EA5A5] animate-pulse' : ''}`}
                onClick={() => handleRequestClick(request)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] flex items-center justify-center text-white font-bold text-lg">
                      {request.patient.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-[#2B2B2B]">{request.patient}</div>
                      <div className="text-sm text-[#5B6B72]">{request.patientId}</div>
                      <div className="text-xs text-[#5B6B72]">{request.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {request.isNew && (
                      <span className="bg-[#0EA5A5] text-white text-xs px-2 py-0.5 rounded-full animate-pulse">New</span>
                    )}
                    <span className="font-mono-amount font-bold text-[#2B2B2B]">
                      ETB {request.total.toLocaleString()}
                    </span>
                    <span className={getStatusBadge(request.status)}>
                      {getStatusLabel(request.status)}
                    </span>
                    <button 
                      className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRequestClick(request);
                      }}
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-sm text-[#5B6B72]">Treatments:</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {request.items.map((item, idx) => (
                      <span key={idx} className="bg-white px-3 py-1 rounded-full text-xs shadow-sm">
                        {item.name} - ETB {item.price.toLocaleString()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== DETAIL MODAL with Edit, Cancel, Send to Cashier ===== */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                    {selectedRequest.patient.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-heading font-bold text-white">💰 Payment Request</h2>
                    <p className="text-white/80 text-sm">
                      {selectedRequest.patient} · {selectedRequest.patientId}
                    </p>
                    <p className="text-white/60 text-xs">{selectedRequest.date}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Status & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#F2F8FB] rounded-xl p-4 text-center">
                  <div className="text-xs text-[#5B6B72]">Status</div>
                  <span className={getStatusBadge(selectedRequest.status)}>
                    {getStatusLabel(selectedRequest.status)}
                  </span>
                </div>
                <div className="bg-[#F2F8FB] rounded-xl p-4 text-center">
                  <div className="text-xs text-[#5B6B72]">Total Amount</div>
                  <div className="text-2xl font-heading font-bold text-[#0EA5A5]">
                    ETB {selectedRequest.total.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="bg-[#F2F8FB] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-4 h-4 text-[#0EA5A5]" />
                  <span className="text-sm font-semibold text-[#2B2B2B]">Patient Information</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-[#5B6B72]">Name</span>
                    <div className="font-medium">{selectedRequest.patient}</div>
                  </div>
                  <div>
                    <span className="text-[#5B6B72]">ID</span>
                    <div className="font-medium">{selectedRequest.patientId}</div>
                  </div>
                  <div>
                    <span className="text-[#5B6B72]">Age</span>
                    <div className="font-medium">{selectedRequest.patientAge} yrs</div>
                  </div>
                  <div>
                    <span className="text-[#5B6B72]">Gender</span>
                    <div className="font-medium">{selectedRequest.patientGender}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#5B6B72]">Phone</span>
                    <div className="font-medium">{selectedRequest.patientPhone}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#5B6B72]">Doctor</span>
                    <div className="font-medium">{selectedRequest.doctor}</div>
                  </div>
                </div>
              </div>

              {/* Treatments */}
              <div className="bg-[#F2F8FB] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DocumentTextIcon className="w-4 h-4 text-[#0EA5A5]" />
                  <span className="text-sm font-semibold text-[#2B2B2B]">Treatments</span>
                </div>
                <div className="space-y-2">
                  {selectedRequest.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg">
                      <span className="text-sm text-[#2B2B2B]">{item.name}</span>
                      <span className="font-mono-amount text-sm font-semibold text-[#0EA5A5]">
                        ETB {item.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-gray-200 pt-2 flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span className="font-mono-amount text-[#0EA5A5]">
                      ETB {selectedRequest.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#F2F8FB] rounded-xl p-3 text-center">
                  <div className="text-xs text-[#5B6B72]">Total</div>
                  <div className="font-mono font-bold text-[#2B2B2B]">
                    ETB {selectedRequest.total.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#F2F8FB] rounded-xl p-3 text-center">
                  <div className="text-xs text-[#5B6B72]">Paid</div>
                  <div className="font-mono font-bold text-[#1FAE6B]">
                    ETB {selectedRequest.paid.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#F2F8FB] rounded-xl p-3 text-center">
                  <div className="text-xs text-[#5B6B72]">Balance</div>
                  <div className={`font-mono font-bold ${selectedRequest.balance > 0 ? 'text-[#E5484D]' : 'text-[#1FAE6B]'}`}>
                    ETB {selectedRequest.balance.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div className="bg-[#F2F8FB] rounded-xl p-4">
                  <div className="text-[#5B6B72] text-sm">Notes</div>
                  <div className="text-sm text-[#2B2B2B]">{selectedRequest.notes}</div>
                </div>
              )}

              {/* Collection Info */}
              {selectedRequest.cashier && (
                <div className="bg-[#F2F8FB] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCardIcon className="w-4 h-4 text-[#0EA5A5]" />
                    <span className="text-sm font-semibold text-[#2B2B2B]">Collection Info</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-[#5B6B72]">Collected By</span>
                      <div className="font-medium">{selectedRequest.cashier}</div>
                    </div>
                    <div>
                      <span className="text-[#5B6B72]">Payment Method</span>
                      <div className="font-medium">{selectedRequest.paymentMethod || '-'}</div>
                    </div>
                    <div>
                      <span className="text-[#5B6B72]">Receipt</span>
                      <div className="font-medium">{selectedRequest.receipt || '-'}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons - EDIT, CANCEL, SEND TO CASHIER */}
              <div className="flex flex-wrap gap-3 pt-2">
                {selectedRequest.status === 'pending' || selectedRequest.status === 'partial' ? (
                  <>
                    <button 
                      onClick={() => handleEditRequest(selectedRequest)}
                      className="flex-1 bg-[#0EA5A5] text-white py-2.5 rounded-xl font-medium hover:bg-[#0B7A7A] transition-all flex items-center justify-center gap-2"
                    >
                      <PencilIcon className="w-5 h-5" />
                      Edit
                    </button>
                    <button 
                      onClick={() => handleSendToCashier(selectedRequest)}
                      className="flex-1 bg-[#1FAE6B] text-white py-2.5 rounded-xl font-medium hover:bg-green-600 transition-all flex items-center justify-center gap-2"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                      Send to Cashier
                    </button>
                    <button 
                      onClick={() => handleCancelRequest(selectedRequest)}
                      className="flex-1 bg-[#E5484D] text-white py-2.5 rounded-xl font-medium hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                    >
                      <NoSymbolIcon className="w-5 h-5" />
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 bg-[#0EA5A5] text-white py-2.5 rounded-xl font-medium hover:bg-[#0B7A7A] transition-all"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT FORM MODAL ===== */}
      {showEditForm && editingRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
                    ✏️ Edit Payment Request
                  </h2>
                  <p className="text-white/80 text-sm">
                    {editingRequest.patient} · {editingRequest.patientId}
                  </p>
                </div>
                <button
                  onClick={closeForm}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-[#0EA5A5]" />
                  Doctor
                </label>
                <div className="bg-[#F2F8FB] rounded-xl p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0EA5A5]/20 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-[#0EA5A5]" />
                  </div>
                  <span className="font-medium text-[#2B2B2B]">{user?.name || 'Dr. Liya Hailu'}</span>
                </div>
              </div>

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

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeForm}
                  className="flex-1 bg-gray-100 text-[#2B2B2B] py-3 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-[#0EA5A5] text-white py-3 rounded-xl font-medium hover:bg-[#0B7A7A] transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== NEW PAYMENT REQUEST FORM MODAL ===== */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
                    💳 New Payment Request
                  </h2>
                  <p className="text-white/80 text-sm">Create a new payment request for a patient</p>
                </div>
                <button
                  onClick={closeForm}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all text-white"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-[#0EA5A5]" />
                  Patient
                  <span className="text-xs text-[#E5484D]">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="w-5 h-5 text-[#5B6B72]" />
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setShowPatientSearch(true);
                      if (e.target.value === '') {
                        setSelectedPatient(null);
                      }
                    }}
                    onFocus={() => setShowPatientSearch(true)}
                    placeholder="Search patient by name, ID, or phone..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all"
                  />
                </div>

                {showPatientSearch && searchTerm && (
                  <div className="absolute z-10 mt-1 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                    {filteredPatients.length === 0 ? (
                      <div className="p-4 text-center text-[#5B6B72] text-sm">No patients found</div>
                    ) : (
                      filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => selectPatient(patient)}
                          className="p-3 hover:bg-[#F2F8FB] cursor-pointer transition-all flex items-center gap-3"
                        >
                          <div className="w-10 h-10 rounded-full bg-[#0EA5A5]/20 flex items-center justify-center text-[#0EA5A5] font-bold">
                            {patient.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-[#2B2B2B]">{patient.name}</div>
                            <div className="text-sm text-[#5B6B72]">{patient.patientId} · {patient.phone}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {selectedPatient && (
                  <div className="mt-2 bg-[#0EA5A5]/5 border border-[#0EA5A5]/20 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0EA5A5] flex items-center justify-center text-white font-bold">
                        {selectedPatient.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-[#2B2B2B]">{selectedPatient.name}</div>
                        <div className="text-sm text-[#5B6B72]">{selectedPatient.patientId} · {selectedPatient.age} yrs · {selectedPatient.gender}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedPatient(null);
                        setSearchTerm('');
                      }}
                      className="text-[#E5484D] hover:bg-red-50 p-1 rounded-lg"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4 text-[#0EA5A5]" />
                  Doctor
                </label>
                <div className="bg-[#F2F8FB] rounded-xl p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0EA5A5]/20 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-[#0EA5A5]" />
                  </div>
                  <span className="font-medium text-[#2B2B2B]">{user?.name || 'Dr. Liya Hailu'}</span>
                </div>
              </div>

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

              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Notes</label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="input-field"
                  rows="2"
                  placeholder="Add any notes about this request..."
                />
              </div>

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

              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeForm}
                  className="flex-1 bg-gray-100 text-[#2B2B2B] py-3 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRequest}
                  disabled={sending || !selectedPatient || selectedTreatments.length === 0}
                  className="flex-1 bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sending ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-5 h-5" />
                      Create Request
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorPayments;