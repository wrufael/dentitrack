import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  UserIcon,
  CurrencyDollarIcon,
  ClockIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  TrashIcon,
  DocumentTextIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../../api';

const money = (value) =>
  `ETB ${Number(value || 0).toLocaleString()}`;

let itemUid = 0;
const nextItemId = () => {
  itemUid += 1;
  return `item-${Date.now()}-${itemUid}`;
};

const emptyItem = () => ({ id: nextItemId(), name: '', price: '' });

const statusLabel = {
  pending: '⏳ Pending',
  partial: '🟡 Partial',
  paid: '✅ Paid',
  done: '✔ Done',
  cancelled: '🚫 Cancelled',
};

const statusClass = {
  pending: 'bg-yellow-100 text-yellow-700',
  partial: 'bg-cyan-100 text-cyan-700',
  paid: 'bg-green-100 text-green-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-600',
};

const normalizePatient = (patient) => ({
  ...patient,
  name: patient.full_name || patient.name || '',
  patient_id:
    patient.patient_id ||
    patient.patientId ||
    patient.id,
});

const normalizeRequest = (request) => ({
  ...request,

  patient_name:
    request.patient_name ||
    request.patient?.full_name ||
    request.patient?.name ||
    request.patient ||
    'Unknown patient',

  patient_code:
    request.patient_code ||
    request.patient_id_code ||
    request.patientId ||
    request.patient?.patient_id ||
    request.patient_id ||
    '—',

  total: Number(
    request.total ??
      request.amount ??
      0
  ),

  paid: Number(
    request.paid ??
      request.amount_paid ??
      0
  ),

  balance: Number(
    request.balance ??
      (
        (request.total ?? request.amount ?? 0) -
        (request.paid ?? request.amount_paid ?? 0)
      )
  ),

  items: Array.isArray(request.items)
    ? request.items
    : [],
});

const Modal = ({ children, wide = false }) => (
  <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div
      className={`bg-white rounded-2xl shadow-2xl w-full ${
        wide ? 'max-w-3xl' : 'max-w-xl'
      } max-h-[92vh] overflow-y-auto`}
    >
      {children}
    </div>
  </div>
);

export default function PaymentRequestsManagement() {
  const [requests, setRequests] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [patientLoading, setPatientLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  const [saving, setSaving] = useState(false);

  const [selectedPatient, setSelectedPatient] =
    useState(null);

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');

  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState('');

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get('/payments');

      setRequests(
        (response.data?.data || []).map(normalizeRequest)
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Unable to load payment requests.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPatients = useCallback(async (query = '') => {
    try {
      setPatientLoading(true);

      const response = await api.get('/patients', {
        params: query.trim()
          ? { search: query.trim() }
          : {},
      });

      setPatients(
        (response.data?.data || []).map(normalizePatient)
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Unable to load patients.'
      );
    } finally {
      setPatientLoading(false);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    try {
      setDoctorsLoading(true);

      const response = await api.get('/doctors');

      setDoctors(response.data || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Unable to load doctors.'
      );
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
    loadDoctors();
  }, [loadRequests, loadDoctors]);

  useEffect(() => {
    if (!formOpen) return;

    const timer = setTimeout(() => {
      loadPatients(patientSearch);
    }, 250);

    return () => clearTimeout(timer);
  }, [
    patientSearch,
    formOpen,
    loadPatients,
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadRequests();
    }, 15000);

    return () => clearInterval(timer);
  }, [loadRequests]);

  const counts = useMemo(
    () => ({
      all: requests.length,

      pending: requests.filter(
        (r) => r.status === 'pending'
      ).length,

      partial: requests.filter(
        (r) => r.status === 'partial'
      ).length,

      paid: requests.filter(
        (r) => r.status === 'paid'
      ).length,

      done: requests.filter(
        (r) => r.status === 'done'
      ).length,

      cancelled: requests.filter(
        (r) => r.status === 'cancelled'
      ).length,
    }),
    [requests]
  );

  const visible = useMemo(() => {
    return requests.filter((request) => {
      const tabMatches =
        filter === 'all' ||
        request.status === filter;

      const query = search
        .toLowerCase()
        .trim();

      const text =
        `${request.patient_name} ` +
        `${request.patient_code} ` +
        `${request.request_code || ''}`
          .toLowerCase();

      return (
        tabMatches &&
        (!query || text.includes(query))
      );
    });
  }, [
    requests,
    filter,
    search,
  ]);

  const totalAmount = requests.reduce(
    (sum, request) =>
      sum + request.total,
    0
  );

  const pendingAmount = requests
    .filter((request) =>
      ['pending', 'partial'].includes(
        request.status
      )
    )
    .reduce(
      (sum, request) =>
        sum + request.balance,
      0
    );

  const openNew = () => {
    setSelectedPatient(null);
    setSelectedDoctorId('');
    setItems([]);
    setNotes('');
    setPatientSearch('');
    setFormOpen(true);

    loadPatients('');
    loadDoctors();
  };

  const addItem = () => {
    setItems((previous) => [...previous, emptyItem()]);
  };

  const updateItem = (id, field, value) => {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeItem = (id) => {
    setItems((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );
  };

  // Only rows with a name AND a valid, non-negative numeric amount count
  // toward the total / get submitted — the owner types every price in,
  // nothing here is ever defaulted.
  const validItems = items.filter(
    (item) => item.name.trim() && item.price !== '' && !isNaN(Number(item.price)) && Number(item.price) >= 0
  );

  const total = validItems.reduce(
    (sum, item) =>
      sum + Number(item.price || 0),
    0
  );

  const createRequest = async (event) => {
    event.preventDefault();

    if (!selectedPatient) {
      toast.error(
        'Select a patient.'
      );
      return;
    }

    if (!selectedDoctorId) {
      toast.error(
        'Select the doctor this treatment is for.'
      );
      return;
    }

    const incomplete = items.some((item) => {
      const hasName = item.name.trim().length > 0;
      const hasPrice = item.price !== '' && item.price !== null;
      if (!hasName && !hasPrice) return false; // untouched blank row, ignore
      const priceIsValidNumber = hasPrice && !isNaN(Number(item.price)) && Number(item.price) >= 0;
      return !(hasName && priceIsValidNumber);
    });

    if (incomplete) {
      toast.error(
        'Each treatment/service needs a name and a valid amount (0 or more).'
      );
      return;
    }

    if (!validItems.length) {
      toast.error(
        'Add at least one service/treatment with an amount.'
      );
      return;
    }

    try {
      setSaving(true);

      const response = await api.post(
        '/payments',
        {
          patient_id:
            selectedPatient.id,

          doctor_id:
            Number(selectedDoctorId),

          items: validItems.map((item) => ({
            name: item.name.trim(),
            price: Number(item.price),
          })),

          notes:
            notes.trim() || null,
        }
      );

      const created =
        normalizeRequest(
          response.data?.data || {}
        );

      setRequests((previous) => [
        created,
        ...previous,
      ]);

      toast.success(
        `${money(total)} payment request sent to cashier.`
      );

      setFormOpen(false);
      setSelectedPatient(null);
      setSelectedDoctorId('');
      setItems([]);
      setNotes('');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not create payment request.'
      );
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (request) => {
    try {
      const response = await api.get(
        `/payments/${request.id}`
      );

      setSelected(
        normalizeRequest(
          response.data?.data ||
            request
        )
      );
    } catch {
      setSelected(request);
    }

    setDetailOpen(true);
  };

  const cancel = async () => {
    if (
      !selected ||
      !window.confirm(
        'Cancel this payment request?'
      )
    ) {
      return;
    }

    try {
      const response =
        await api.post(
          `/payments/${selected.id}/cancel`
        );

      const updated =
        normalizeRequest(
          response.data?.data || {
            ...selected,
            status: 'cancelled',
          }
        );

      setRequests((previous) =>
        previous.map((request) =>
          request.id === selected.id
            ? updated
            : request
        )
      );

      setSelected(updated);

      toast.success(
        'Payment request cancelled.'
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Unable to cancel request.'
      );
    }
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2B2B2B]">
            💳 Payment Requests
          </h1>

          <p className="text-sm text-[#5B6B72] mt-1">
            Create requests for the cashier and track real collections.
          </p>
        </div>

        <button
          onClick={openNew}
          className="inline-flex items-center justify-center gap-2 bg-[#0EA5A5] text-white px-5 py-3 rounded-xl font-semibold hover:bg-[#0B7A7A]"
        >
          <PlusIcon className="w-5 h-5" />
          New Payment Request
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

        <Stat
          title="Total Requests"
          value={counts.all}
          icon={<CurrencyDollarIcon />}
        />

        <Stat
          title="Pending"
          value={
            counts.pending +
            counts.partial
          }
          icon={<ClockIcon />}
          accent="yellow"
        />

        <Stat
          title="Outstanding"
          value={money(pendingAmount)}
          icon={<ClockIcon />}
          accent="red"
        />

        <Stat
          title="Requested Amount"
          value={money(totalAmount)}
          icon={<CheckCircleIcon />}
          accent="green"
        />

      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">

        <div className="flex flex-col md:flex-row gap-3">

          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search patient name, patient ID or request code..."
              className="w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-[#0EA5A5]/20 focus:border-[#0EA5A5]"
            />
          </div>

          <button
            onClick={loadRequests}
            className="px-4 py-2.5 border rounded-xl hover:bg-gray-50 inline-flex items-center gap-2"
          >
            <ArrowPathIcon className="w-5 h-5" />
            Refresh
          </button>

        </div>

        <div className="flex flex-wrap gap-2">

          {[
            'all',
            'pending',
            'partial',
            'paid',
            'done',
            'cancelled',
          ].map((status) => (
            <button
              key={status}
              onClick={() =>
                setFilter(status)
              }
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                filter === status
                  ? 'bg-[#0EA5A5] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {status === 'all'
                ? '📋 All'
                : statusLabel[status]}

              {' '}
              ({counts[status] || 0})
            </button>
          ))}

        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">

        <h2 className="font-semibold text-[#2B2B2B] mb-4">
          Requests sent to Cashier
        </h2>

        {loading ? (
          <div className="py-12 text-center text-gray-500">
            Loading...
          </div>
        ) : visible.length === 0 ? (
          <Empty onClick={openNew} />
        ) : (
          <div className="space-y-3">

            {visible.map((request) => (
              <div
                key={request.id}
                className="rounded-xl bg-[#F2F8FB] border border-transparent hover:border-[#0EA5A5]/30 p-4"
              >

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">

                  <div className="flex items-center gap-3 min-w-0">

                    <div className="w-12 h-12 rounded-full bg-[#0EA5A5] text-white flex items-center justify-center text-lg font-bold">
                      {request.patient_name
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div className="min-w-0">

                      <div className="font-semibold truncate">
                        {request.patient_name}
                      </div>

                      <div className="text-sm text-gray-500">
                        {request.patient_code}
                        {' · '}
                        {request.request_code ||
                          `Request #${request.id}`}
                      </div>

                      <div className="text-xs text-gray-400">
                        {request.created_at
                          ? new Date(
                              request.created_at
                            ).toLocaleString()
                          : '—'}
                      </div>

                    </div>

                  </div>

                  <div className="flex items-center gap-3">

                    <div className="text-right">
                      <div className="font-bold">
                        {money(request.total)}
                      </div>

                      <div className="text-xs text-gray-500">
                        Balance {money(request.balance)}
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        statusClass[
                          request.status
                        ] ||
                        statusClass.cancelled
                      }`}
                    >
                      {statusLabel[
                        request.status
                      ] ||
                        request.status}
                    </span>

                    <button
                      onClick={() =>
                        openDetails(request)
                      }
                      className="p-2 rounded-lg text-[#0EA5A5] hover:bg-[#0EA5A5]/10"
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>

                  </div>

                </div>

                {request.items?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">

                    {request.items.map(
                      (item, index) => (
                        <span
                          key={index}
                          className="bg-white px-3 py-1.5 rounded-full text-xs"
                        >
                          {item.name}
                          {' · '}
                          {money(item.price)}
                        </span>
                      )
                    )}

                  </div>
                )}

              </div>
            ))}

          </div>
        )}

      </div>

      {formOpen && (
        <Modal wide>

          <form onSubmit={createRequest}>

            <div className="p-5 border-b flex items-center justify-between">

              <div>
                <h2 className="text-xl font-bold">
                  New Payment Request
                </h2>

                <p className="text-sm text-gray-500">
                  Select the patient, add treatments, then send to cashier.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setFormOpen(false)
                }
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

            </div>

            <div className="p-5 space-y-5">

              <section>

                <label className="block text-sm font-semibold mb-2">
                  1. Patient
                </label>

                <div className="relative">

                  <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

                  <input
                    value={patientSearch}
                    onChange={(event) =>
                      setPatientSearch(
                        event.target.value
                      )
                    }
                    placeholder="Search by patient name, ID or phone..."
                    className="w-full pl-10 pr-4 py-2.5 border rounded-xl"
                  />

                </div>

                {selectedPatient && (
                  <div className="mt-2 p-3 rounded-xl bg-[#0EA5A5]/10 flex items-center justify-between">

                    <div>

                      <div className="font-semibold">
                        {selectedPatient.name}
                      </div>

                      <div className="text-xs text-gray-500">
                        {selectedPatient.patient_id}
                        {' · '}
                        {selectedPatient.age ?? '—'} yrs
                        {' · '}
                        {selectedPatient.gender || '—'}
                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedPatient(null)
                      }
                      className="text-red-500"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>

                  </div>
                )}

                {!selectedPatient &&
                  patientSearch && (
                    <div className="mt-2 max-h-44 overflow-y-auto border rounded-xl">

                      {patientLoading ? (
                        <div className="p-3 text-sm text-gray-500">
                          Searching...
                        </div>
                      ) : patients.length ? (
                        patients
                          .slice(0, 8)
                          .map((patient) => (
                            <button
                              type="button"
                              key={patient.id}
                              onClick={() => {
                                setSelectedPatient(
                                  patient
                                );

                                setPatientSearch(
                                  patient.name
                                );
                              }}
                              className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-0"
                            >
                              <div className="font-medium">
                                {patient.name}
                              </div>

                              <div className="text-xs text-gray-500">
                                {patient.patient_id}
                                {' · '}
                                {patient.phone ||
                                  'No phone'}
                              </div>
                            </button>
                          ))
                      ) : (
                        <div className="p-3 text-sm text-gray-500">
                          No patients found.
                        </div>
                      )}

                    </div>
                  )}

              </section>

              <section>

                <label className="block text-sm font-semibold mb-2">
                  2. Doctor
                </label>

                <select
                  value={selectedDoctorId}
                  onChange={(event) =>
                    setSelectedDoctorId(
                      event.target.value
                    )
                  }
                  className="w-full border rounded-xl p-2.5"
                >
                  <option value="">
                    {doctorsLoading
                      ? 'Loading doctors...'
                      : 'Select the treating doctor'}
                  </option>

                  {doctors.map((doctor) => (
                    <option
                      key={doctor.id}
                      value={doctor.id}
                    >
                      {doctor.user?.name ||
                        doctor.name ||
                        `Doctor #${doctor.id}`}
                      {doctor.specialty
                        ? ` · ${doctor.specialty}`
                        : ''}
                    </option>
                  ))}
                </select>

              </section>

              <section>

                <label className="block text-sm font-semibold mb-2">
                  3. Treatments / Services
                </label>

                {/* Manual treatment / service rows — the owner types the
                    name and amount for each item. Nothing here is a
                    default/hardcoded price; the total is calculated
                    live from what has actually been entered. */}
                {!items.length ? (
                  <div className="border border-dashed rounded-xl p-5 text-center text-sm text-gray-500">
                    No treatment added yet.
                  </div>
                ) : (
                  <div className="space-y-2">

                    {items.map((item, index) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-xl"
                      >
                        <span className="text-xs font-medium text-gray-400 sm:w-16">
                          Item {index + 1}
                        </span>

                        <input
                          type="text"
                          value={item.name}
                          onChange={(event) =>
                            updateItem(item.id, 'name', event.target.value)
                          }
                          placeholder="Treatment / Service name (e.g. Root Canal)"
                          className="flex-1 border rounded-lg p-2.5 text-sm"
                        />

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500 whitespace-nowrap">
                            ETB
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(event) =>
                              updateItem(item.id, 'price', event.target.value)
                            }
                            placeholder="Amount"
                            className="w-32 border rounded-lg p-2.5 text-sm"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              removeItem(item.id)
                            }
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg"
                            title="Remove"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>

                      </div>
                    ))}

                  </div>
                )}

                <button
                  type="button"
                  onClick={addItem}
                  className="w-full mt-2 flex items-center justify-center gap-2 border-2 border-dashed border-[#0EA5A5]/40 text-[#0EA5A5] rounded-xl py-2.5 font-medium hover:bg-[#0EA5A5]/5 transition-all"
                >
                  <PlusIcon className="w-4 h-4" />
                  Add Treatment / Service
                </button>

                {validItems.length > 0 && (
                  <div className="flex justify-between font-bold pt-3 mt-2 border-t">
                    <span>Total</span>

                    <span className="text-[#0EA5A5]">
                      {money(total)}
                    </span>
                  </div>
                )}

              </section>

              <section>

                <label className="block text-sm font-semibold mb-2">
                  Notes
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Optional note for the cashier..."
                  className="w-full border rounded-xl p-3"
                />

              </section>

            </div>

            <div className="p-5 border-t flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setFormOpen(false)
                }
                className="px-5 py-2.5 rounded-xl bg-gray-100"
              >
                Cancel
              </button>

              <button
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#0EA5A5] text-white font-semibold disabled:opacity-50"
              >
                {saving
                  ? 'Sending...'
                  : `Send to Cashier · ${money(total)}`}
              </button>

            </div>

          </form>

        </Modal>
      )}

      {detailOpen && selected && (
        <Modal wide>

          <div className="p-5 border-b flex items-center justify-between">

            <div>
              <h2 className="text-xl font-bold">
                Payment Request Details
              </h2>

              <p className="text-sm text-gray-500">
                {selected.request_code ||
                  `Request #${selected.id}`}
              </p>
            </div>

            <button
              onClick={() =>
                setDetailOpen(false)
              }
            >
              <XMarkIcon className="w-6 h-6" />
            </button>

          </div>

          <div className="p-5 space-y-4">

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

              <Info
                label="Patient"
                value={selected.patient_name}
              />

              <Info
                label="Patient ID"
                value={selected.patient_code}
              />

              <Info
                label="Status"
                value={
                  statusLabel[
                    selected.status
                  ] ||
                  selected.status
                }
              />

              <Info
                label="Balance"
                value={money(selected.balance)}
              />

            </div>

            <div className="bg-gray-50 rounded-xl p-4">

              <div className="flex items-center gap-2 font-semibold mb-3">

                <UserIcon className="w-5 h-5 text-[#0EA5A5]" />

                Patient / Request

              </div>

              <div className="grid md:grid-cols-2 gap-3 text-sm">

                <Info
                  label="Requested by"
                  value={
                    selected.requested_by_user?.name ||
                    selected.doctor_name ||
                    selected.created_by?.name ||
                    'Current user'
                  }
                />

                <Info
                  label="Created"
                  value={
                    selected.created_at
                      ? new Date(
                          selected.created_at
                        ).toLocaleString()
                      : '—'
                  }
                />

                <Info
                  label="Total"
                  value={money(selected.total)}
                />

                <Info
                  label="Paid"
                  value={money(selected.paid)}
                />

              </div>

            </div>

            <div className="bg-gray-50 rounded-xl p-4">

              <div className="flex items-center gap-2 font-semibold mb-3">

                <DocumentTextIcon className="w-5 h-5 text-[#0EA5A5]" />

                Treatments

              </div>

              {selected.items?.map(
                (item, index) => (
                  <div
                    key={index}
                    className="flex justify-between py-2 border-b last:border-0"
                  >
                    <span>
                      {item.name}
                    </span>

                    <span className="font-semibold">
                      {money(item.price)}
                    </span>
                  </div>
                )
              )}

            </div>

            {selected.notes && (
              <div className="bg-gray-50 rounded-xl p-4">

                <div className="text-xs text-gray-500">
                  Notes
                </div>

                <div className="mt-1">
                  {selected.notes}
                </div>

              </div>
            )}

            <div className="flex justify-end gap-2">

              {[
                'pending',
                'partial',
              ].includes(selected.status) && (
                <button
                  onClick={cancel}
                  className="px-4 py-2 rounded-xl bg-red-50 text-red-600 inline-flex gap-2 items-center"
                >
                  <NoSymbolIcon className="w-5 h-5" />
                  Cancel Request
                </button>
              )}

              <button
                onClick={() =>
                  setDetailOpen(false)
                }
                className="px-4 py-2 rounded-xl bg-gray-100"
              >
                Close
              </button>

            </div>

          </div>

        </Modal>
      )}

    </div>
  );
}

function Stat({
  title,
  value,
  icon,
  accent = '',
}) {
  const colors =
    accent === 'yellow'
      ? 'text-yellow-600 bg-yellow-50'
      : accent === 'red'
      ? 'text-red-600 bg-red-50'
      : accent === 'green'
      ? 'text-green-600 bg-green-50'
      : 'text-[#0EA5A5] bg-[#0EA5A5]/10';

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">

      <div className="flex justify-between items-center">

        <div>
          <div className="text-sm text-gray-500">
            {title}
          </div>

          <div className="text-2xl font-bold mt-1">
            {value}
          </div>
        </div>

        <div
          className={`p-3 rounded-xl ${colors}`}
        >
          {React.cloneElement(icon, {
            className: 'w-6 h-6',
          })}
        </div>

      </div>

    </div>
  );
}

function Info({
  label,
  value,
}) {
  return (
    <div>
      <div className="text-xs text-gray-500">
        {label}
      </div>

      <div className="font-medium mt-0.5">
        {value ?? '—'}
      </div>
    </div>
  );
}

function Empty({ onClick }) {
  return (
    <div className="py-12 text-center text-gray-500">

      <CurrencyDollarIcon className="w-10 h-10 mx-auto mb-2 text-gray-300" />

      <p>
        No payment requests found.
      </p>

      <button
        onClick={onClick}
        className="mt-3 text-[#0EA5A5] font-medium"
      >
        Create a payment request →
      </button>

    </div>
  );
}