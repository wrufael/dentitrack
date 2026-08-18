import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePayments } from '../../contexts/PaymentContext';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  UserIcon,
  PhoneIcon,
  CalendarIcon,
  EyeIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const SearchPatient = () => {
  const { user } = useAuth();
  const { requests, createPaymentRequest, startTreatment } = usePayments();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // All patients data
  const allPatients = [
    {
      id: 1,
      name: 'Abebe Bekele',
      patientId: 'PAY-3801',
      age: 35,
      gender: 'Male',
      phone: '+251 91 234 5678',
      lastVisit: '2026-07-27',
      status: 'pending',
      amount: 3200,
      paid: 0,
      balance: 3200,
      items: ['Root Canal', 'X-Ray'],
      diagnosis: 'Pulpitis - Root Canal Required',
      treatment: 'Root Canal Treatment + Crown'
    },
    {
      id: 2,
      name: 'Tigist Haile',
      patientId: 'PAY-3802',
      age: 28,
      gender: 'Female',
      phone: '+251 92 345 6789',
      lastVisit: '2026-07-26',
      status: 'pending',
      amount: 600,
      paid: 0,
      balance: 600,
      items: ['Teeth Cleaning'],
      diagnosis: 'Gingivitis - Cleaning Required',
      treatment: 'Deep Cleaning + Follow-up'
    },
    {
      id: 3,
      name: 'Dawit Tesfaye',
      patientId: 'PAY-3803',
      age: 42,
      gender: 'Male',
      phone: '+251 93 456 7890',
      lastVisit: '2026-07-25',
      status: 'partial',
      amount: 550,
      paid: 200,
      balance: 350,
      items: ['X-Ray'],
      diagnosis: 'Impacted Wisdom Tooth',
      treatment: 'X-Ray + Extraction'
    },
    {
      id: 4,
      name: 'Hiwot Girma',
      patientId: 'PAY-3804',
      age: 24,
      gender: 'Female',
      phone: '+251 94 567 8901',
      lastVisit: '2026-07-24',
      status: 'paid',
      amount: 1400,
      paid: 1400,
      balance: 0,
      items: ['Filling'],
      diagnosis: 'Dental Caries',
      treatment: 'Composite Filling'
    },
    {
      id: 5,
      name: 'Meron Alemu',
      patientId: 'PAY-3805',
      age: 31,
      gender: 'Female',
      phone: '+251 95 678 9012',
      lastVisit: '2026-07-23',
      status: 'done',
      amount: 1800,
      paid: 1800,
      balance: 0,
      items: ['Cleaning', 'Whitening'],
      diagnosis: 'Staining and Plaque',
      treatment: 'Cleaning + Whitening'
    },
    {
      id: 6,
      name: 'Yonas Tadesse',
      patientId: 'PAY-3806',
      age: 55,
      gender: 'Male',
      phone: '+251 96 789 0123',
      lastVisit: '2026-07-22',
      status: 'pending',
      amount: 2000,
      paid: 0,
      balance: 2000,
      items: ['Extraction'],
      diagnosis: 'Wisdom Tooth Impaction',
      treatment: 'Wisdom Tooth Extraction'
    },
    {
      id: 7,
      name: 'Selam Tesfaye',
      patientId: 'PAY-3807',
      age: 29,
      gender: 'Female',
      phone: '+251 97 890 1234',
      lastVisit: '2026-07-21',
      status: 'paid',
      amount: 3500,
      paid: 3500,
      balance: 0,
      items: ['Root Canal'],
      diagnosis: 'Severe Tooth Decay',
      treatment: 'Root Canal + Crown'
    },
  ];

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

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    const search = searchTerm.toLowerCase().trim();
    
    if (!search) {
      toast.error('Please enter a search term');
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    // Simulate API search
    setTimeout(() => {
      const results = allPatients.filter(patient =>
        patient.name.toLowerCase().includes(search) ||
        patient.patientId.toLowerCase().includes(search) ||
        patient.phone.includes(search)
      );
      setSearchResults(results);
      setIsLoading(false);
      
      if (results.length === 0) {
        toast.error('No patients found');
      }
    }, 500);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
  };

  // View patient details
  const handleViewDetails = (patient) => {
    setSelectedPatient(patient);
    setShowDetailModal(true);
  };

  // Create payment for patient
  const handleCreatePayment = (patient) => {
    toast.info(`Creating payment request for ${patient.name}`);
  };

  // Start treatment
  const handleStartTreatment = (patient) => {
    if (patient.status === 'paid') {
      toast.success(`🦷 Starting treatment for ${patient.name}`);
    } else {
      toast.error('⛔ Payment required before starting treatment');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-heading font-bold text-[#2B2B2B]">
          🔍 Search Patient
        </h1>
        <p className="text-[#5B6B72] text-sm">Find patients by name, ID, or phone number</p>
      </div>

      {/* Search Form */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="w-5 h-5 text-[#5B6B72]" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter patient name, ID (e.g. PAY-3801), or phone number..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all"
            />
          </div>
          <button
            type="submit"
            className="bg-[#0EA5A5] text-white px-8 py-3 rounded-lg font-medium hover:bg-[#0B7A7A] transition-all flex items-center gap-2 justify-center"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            Search
          </button>
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="bg-gray-200 text-[#2B2B2B] px-6 py-3 rounded-lg font-medium hover:bg-gray-300 transition-all flex items-center gap-2 justify-center"
            >
              <XMarkIcon className="w-5 h-5" />
              Clear
            </button>
          )}
        </form>

        {/* Search Tips */}
        <div className="mt-3 text-xs text-[#5B6B72] flex flex-wrap gap-4">
          <span>💡 Tip: Search by:</span>
          <span>• Patient Name: "Abebe"</span>
          <span>• Patient ID: "PAY-3801"</span>
          <span>• Phone: "0912345678"</span>
        </div>
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-[#2B2B2B]">
              Search Results
            </h3>
            <span className="text-sm text-[#5B6B72]">
              {isLoading ? 'Searching...' : `${searchResults.length} patient${searchResults.length !== 1 ? 's' : ''} found`}
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-[#0EA5A5] border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2 text-[#5B6B72] text-sm">Searching patients...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-heading font-semibold text-[#2B2B2B]">No patients found</h3>
              <p className="text-[#5B6B72] text-sm mt-1">
                We couldn't find any patients matching "{searchTerm}"
              </p>
              <button
                onClick={clearSearch}
                className="mt-4 text-[#0EA5A5] hover:underline text-sm"
              >
                Clear search
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((patient) => (
                <div key={patient.id} className="bg-[#F2F8FB] rounded-xl p-4 hover:shadow-md transition-all">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-[#0EA5A5]/20 flex items-center justify-center text-[#0EA5A5] font-bold text-lg flex-shrink-0">
                        {patient.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#2B2B2B] text-lg">{patient.name}</div>
                        <div className="text-sm text-[#5B6B72]">
                          {patient.patientId} · {patient.age} yrs · {patient.gender}
                        </div>
                        <div className="text-xs text-[#5B6B72] flex items-center gap-2 flex-wrap">
                          <PhoneIcon className="w-3 h-3" />
                          {patient.phone}
                          <CalendarIcon className="w-3 h-3 ml-2" />
                          Last visit: {patient.lastVisit}
                        </div>
                        {patient.diagnosis && (
                          <div className="text-xs text-[#0EA5A5] mt-1">
                            Diagnosis: {patient.diagnosis}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-amount font-bold text-[#2B2B2B]">
                        ETB {patient.amount.toLocaleString()}
                      </span>
                      <span className={getStatusBadge(patient.status)}>
                        {getStatusLabel(patient.status)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleViewDetails(patient)}
                      className="bg-[#0EA5A5] text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-[#0B7A7A] transition-all flex items-center gap-1"
                    >
                      <EyeIcon className="w-3 h-3" />
                      View Details
                    </button>
                    {patient.status === 'pending' || patient.status === 'partial' ? (
                      <button
                        onClick={() => handleCreatePayment(patient)}
                        className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-blue-600 transition-all flex items-center gap-1"
                      >
                        <PaperAirplaneIcon className="w-3 h-3" />
                        Create Payment
                      </button>
                    ) : patient.status === 'paid' ? (
                      <button
                        onClick={() => handleStartTreatment(patient)}
                        className="bg-[#1FAE6B] text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-green-600 transition-all flex items-center gap-1"
                      >
                        <CheckCircleIcon className="w-3 h-3" />
                        Start Treatment
                      </button>
                    ) : null}
                    {patient.status === 'done' && (
                      <span className="bg-green-100 text-[#1FAE6B] text-xs px-3 py-1.5 rounded-lg font-medium">
                        ✅ Treatment Done
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Initial State - No Search */}
      {!hasSearched && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-heading font-semibold text-[#2B2B2B]">Search for patients</h3>
          <p className="text-[#5B6B72] text-sm mt-2 max-w-md mx-auto">
            Enter a patient name, ID, or phone number to find their records
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3 text-sm text-[#5B6B72]">
            <span className="bg-[#F2F8FB] px-3 py-1 rounded-full">🔍 Name: "Abebe"</span>
            <span className="bg-[#F2F8FB] px-3 py-1 rounded-full">🔍 ID: "PAY-3801"</span>
            <span className="bg-[#F2F8FB] px-3 py-1 rounded-full">🔍 Phone: "0912345678"</span>
          </div>
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && selectedPatient && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-heading font-bold text-[#2B2B2B]">📋 Patient Details</h2>
                <p className="text-[#5B6B72] text-sm">
                  {selectedPatient.name} · {selectedPatient.patientId}
                </p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-6 h-6 text-[#5B6B72]" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-[#F2F8FB] rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-[#5B6B72]">Name</div>
                    <div className="font-medium">{selectedPayment?.name}</div>
                  </div>
                  <div>
                    <div className="text-[#5B6B72]">ID</div>
                    <div className="font-medium">{selectedPayment?.patientId}</div>
                  </div>
                  <div>
                    <div className="text-[#5B6B72]">Age</div>
                    <div className="font-medium">{selectedPayment?.age} yrs</div>
                  </div>
                  <div>
                    <div className="text-[#5B6B72]">Gender</div>
                    <div className="font-medium">{selectedPayment?.gender}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#5B6B72]">Phone</div>
                    <div className="font-medium">{selectedPayment?.phone}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#5B6B72]">Last Visit</div>
                    <div className="font-medium">{selectedPayment?.lastVisit}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#5B6B72]">Diagnosis</div>
                    <div className="font-medium">{selectedPayment?.diagnosis || 'N/A'}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-[#5B6B72]">Treatment Plan</div>
                    <div className="font-medium">{selectedPayment?.treatment || 'N/A'}</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#F2F8FB] rounded-lg p-4">
                <div className="text-[#5B6B72] text-sm">Services</div>
                <div className="mt-1">
                  {selectedPayment?.items && selectedPayment.items.map((item, idx) => (
                    <span key={idx} className="inline-block bg-white px-3 py-1 rounded-full text-sm mr-2 mb-1">
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-[#F2F8FB] rounded-lg p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[#5B6B72] text-xs">Total</div>
                    <div className="font-mono font-bold text-[#2B2B2B]">
                      ETB {selectedPayment?.amount?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#5B6B72] text-xs">Paid</div>
                    <div className="font-mono font-bold text-[#1FAE6B]">
                      ETB {selectedPayment?.paid?.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[#5B6B72] text-xs">Balance</div>
                    <div className="font-mono font-bold text-[#E5484D]">
                      ETB {selectedPayment?.balance?.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowDetailModal(false)}
              className="w-full mt-6 bg-[#0EA5A5] text-white py-2.5 rounded-lg font-medium hover:bg-[#0B7A7A] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPatient;