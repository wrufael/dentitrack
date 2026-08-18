// src/components/Appointments/AppointmentDetailModal.jsx

import React, { useMemo, useState } from 'react';

import {
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
  InformationCircleIcon,
  ClipboardDocumentListIcon,
  BanknotesIcon,
  ArrowPathIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import { toast } from 'react-hot-toast';

import {
  STATUS_CONFIG,
  formatTime,
  getInitials,
} from '../../lib/patientUtils';

import { usePatientCredit } from '../../contexts/PatientCreditContext';

const StatusBadge = ({ status }) => {
  const cfg =
    STATUS_CONFIG[status] || {
      label: status || 'Unknown',
      dot: 'bg-gray-400',
      text: 'text-gray-600',
      bg: 'bg-gray-100',
    };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}
      />

      {cfg.label}
    </span>
  );
};

const TABS = [
  {
    id: 'info',
    label: 'Info',
    icon: InformationCircleIcon,
  },
  {
    id: 'treatments',
    label: 'Treatments',
    icon: ClipboardDocumentListIcon,
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: BanknotesIcon,
  },
  {
    id: 'history',
    label: 'History',
    icon: CalendarDaysIcon,
  },
];

const fieldClass =
  'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/20 focus:border-[#0EA5A5] transition-all';

const AppointmentDetailModal = ({
  appointment,
  onClose,
  onUpdateStatus,
  onUpdateAppointment,
  onDelete,
  patients = [],
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [showAddPayment, setShowAddPayment] =
    useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const { getRecordsForPatient, addPayment: addCreditPayment } =
    usePatientCredit();

  /*
   * ---------------------------------------------------------
   * REAL PATIENT
   * ---------------------------------------------------------
   */

  const fullPatient = useMemo(() => {
    if (!appointment) {
      return {};
    }

    // BEST: Laravel relationship
    if (
      appointment.patient &&
      typeof appointment.patient === 'object'
    ) {
      return appointment.patient;
    }

    const patientId =
      appointment.patient_id ||
      appointment.patientId;

    // SECOND: patients prop
    const found = patients.find(
      (p) =>
        String(p.id) === String(patientId) ||
        String(p.patientId) === String(patientId)
    );

    if (found) {
      return found;
    }

    // THIRD: appointment fields
    return {
      id: patientId,
      patientId: patientId,
      name:
        appointment.patient_name ||
        (typeof appointment.patient === 'string'
          ? appointment.patient
          : 'Unknown Patient'),
      age: appointment.age,
      gender: appointment.gender,
      phone: appointment.phone,
      email: appointment.email,
      address: appointment.address,
      emergencyContact:
        appointment.emergency_contact,
      registeredDate:
        appointment.registered_date,
      recurring: appointment.recurring,
      notes: appointment.patient_notes,
    };
  }, [appointment, patients]);

  const patientId =
    fullPatient.patientId ||
    fullPatient.patient_id ||
    fullPatient.id ||
    appointment.patient_id ||
    appointment.patientId;

  const patientName =
    fullPatient.name ||
    fullPatient.full_name ||
    fullPatient.fullName ||
    'Unknown Patient';

  /*
   * ---------------------------------------------------------
   * EDIT FORM
   * ---------------------------------------------------------
   */

  const [form, setForm] = useState({
    date: appointment?.date || '',
    time: appointment?.time
      ? String(appointment.time).slice(0, 5)
      : '',
    status: appointment?.status || 'scheduled',
    notes: appointment?.notes || '',
  });

  const updateForm = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const startEditing = () => {
    setForm({
      date: appointment?.date || '',
      time: appointment?.time
        ? String(appointment.time).slice(0, 5)
        : '',
      status: appointment?.status || 'scheduled',
      notes: appointment?.notes || '',
    });

    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
  };

  const saveAppointment = async (e) => {
    e.preventDefault();

    if (!form.date) {
      toast.error('Please select an appointment date');
      return;
    }

    if (!form.time) {
      toast.error('Please select an appointment time');
      return;
    }

    setSaving(true);

    try {
      const updated = await onUpdateAppointment(
        appointment.id,
        {
          date: form.date,
          time: form.time,
          status: form.status,
          notes: form.notes || null,
        }
      );

      if (updated) {
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  };

  /*
   * ---------------------------------------------------------
   * CREDIT
   * ---------------------------------------------------------
   */

  const patientCredits = getRecordsForPatient(
    patientId,
    patientName
  );

  /*
   * ---------------------------------------------------------
   * EXISTING PAYMENT DATA
   * ---------------------------------------------------------
   *
   * These are still local until you connect them to your
   * real PaymentController.
   */

  const [payments, setPayments] = useState([]);

  const [treatments] = useState([]);

  const [appointmentHistory] = useState([]);

  const handleAddPayment = (e) => {
    e.preventDefault();

    const formElement = e.target;

    const amount =
      parseFloat(formElement.amount.value) || 0;

    if (amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    const newPayment = {
      id: Date.now(),
      date: formElement.date.value,
      amount,
      method: formElement.method.value,
      frequency: formElement.frequency.value,
      status: 'paid',
      receipt:
        'RCP-' +
        String(payments.length + 1).padStart(3, '0'),
    };

    setPayments((prev) => [
      newPayment,
      ...prev,
    ]);

    toast.success('Payment recorded');

    setShowAddPayment(false);
  };

  const handleRecordCreditPayment = (
    creditRecord
  ) => {
    const input = window.prompt(
      `Payment amount toward ${creditRecord.requestId} (balance ${creditRecord.balance.toLocaleString()} ETB):`
    );

    if (input === null) {
      return;
    }

    const amount = parseFloat(input);

    if (!amount || amount <= 0) {
      toast.error('Enter a valid amount');
      return;
    }

    addCreditPayment(
      creditRecord.requestId,
      {
        id: Date.now(),
        date: new Date()
          .toISOString()
          .slice(0, 10),
        amount,
        method: 'Cash',
      }
    );

    toast.success('Credit payment recorded');
  };

  const totalTreatments =
    treatments.length;

  const totalPaid =
    payments.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0
    );

  const completedTreatments =
    treatments.filter(
      (t) => t.status === 'completed'
    ).length;

  const getRecurringLabel = (type) => {
    const map = {
      none: 'One-time',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
    };

    return map[type] || 'One-time';
  };

  const quickActions = [
    {
      status: 'confirmed',
      label: 'Confirm',
      classes:
        'bg-[#1FAE6B]/10 text-[#1FAE6B] hover:bg-[#1FAE6B]/20',
    },
    {
      status: 'completed',
      label: 'Mark Completed',
      classes:
        'bg-[#0EA5A5]/10 text-[#0EA5A5] hover:bg-[#0EA5A5]/20',
    },
    {
      status: 'cancelled',
      label: 'Cancel',
      classes:
        'bg-[#E5484D]/10 text-[#E5484D] hover:bg-[#E5484D]/20',
    },
  ].filter(
    (a) => a.status !== appointment.status
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* HEADER */}

        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0EA5A5] flex items-center justify-center text-white text-lg font-semibold">
              {getInitials(patientName)}
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#2B2B2B] flex items-center gap-2">
                {patientName}

                {fullPatient.recurring &&
                  fullPatient.recurring !==
                    'none' && (
                    <span className="text-xs font-medium text-[#6366F1] bg-[#6366F1]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ArrowPathIcon className="w-3 h-3" />

                      {getRecurringLabel(
                        fullPatient.recurring
                      )}
                    </span>
                  )}
              </h2>

              <p className="text-sm text-[#5B6B72]">
                {patientId || 'N/A'} •{' '}
                {fullPatient.age
                  ? `${fullPatient.age} yrs`
                  : 'Age N/A'}{' '}
                · {fullPatient.gender || 'Gender N/A'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* STATUS */}

          <div className="mb-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <StatusBadge
                status={appointment.status}
              />

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={
                    appointment.status ||
                    'scheduled'
                  }
                  onChange={(e) =>
                    onUpdateStatus(
                      appointment.id,
                      e.target.value
                    )
                  }
                  className="w-auto px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-900"
                >
                  {Object.entries(
                    STATUS_CONFIG
                  ).map(
                    ([key, cfg]) => (
                      <option
                        key={key}
                        value={key}
                      >
                        {cfg.label}
                      </option>
                    )
                  )}
                </select>

                {quickActions.map((action) => (
                  <button
                    key={action.status}
                    onClick={() =>
                      onUpdateStatus(
                        appointment.id,
                        action.status
                      )
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${action.classes}`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-xs text-[#5B6B72]">
                  Treatments
                </div>
                <div className="text-lg font-semibold">
                  {totalTreatments}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-xs text-[#5B6B72]">
                  Completed
                </div>
                <div className="text-lg font-semibold text-[#1FAE6B]">
                  {completedTreatments}
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-xs text-[#5B6B72]">
                  Total Paid
                </div>
                <div className="text-lg font-semibold text-[#0EA5A5]">
                  {totalPaid.toLocaleString()} ETB
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-xs text-[#5B6B72]">
                  Visits
                </div>
                <div className="text-lg font-semibold">
                  {appointmentHistory.length}
                </div>
              </div>
            </div>
          </div>

          {/* TABS */}

          <div className="flex gap-1 bg-[#F2F8FB] rounded-xl p-1 mb-4">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active =
                activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() =>
                    setActiveTab(tab.id)
                  }
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium ${
                    active
                      ? 'bg-white text-[#0EA5A5] shadow-sm'
                      : 'text-[#5B6B72]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* CONTENT */}

          <div className="max-h-[420px] overflow-y-auto pr-1">
            {/* INFO */}

            {activeTab === 'info' && (
              <>
                {!editing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* PATIENT */}

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <InformationCircleIcon className="w-4 h-4 text-[#0EA5A5]" />

                          <span className="text-sm font-semibold">
                            Patient Information
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {[
                          [
                            'Full Name',
                            patientName,
                          ],
                          [
                            'Patient ID',
                            patientId,
                          ],
                          [
                            'Age',
                            fullPatient.age
                              ? `${fullPatient.age} years`
                              : 'Not provided',
                          ],
                          [
                            'Gender',
                            fullPatient.gender ||
                              'Not provided',
                          ],
                          [
                            'Phone',
                            fullPatient.phone ||
                              'Not provided',
                          ],
                          [
                            'Email',
                            fullPatient.email ||
                              'Not provided',
                          ],
                          [
                            'Address',
                            fullPatient.address ||
                              'Not provided',
                          ],
                          [
                            'Emergency Contact',
                            fullPatient.emergencyContact ||
                              fullPatient.emergency_contact ||
                              'Not provided',
                          ],
                          [
                            'Registered',
                            fullPatient.registeredDate ||
                              fullPatient.registered_date ||
                              'N/A',
                          ],
                        ].map(
                          ([label, value]) => (
                            <div
                              key={label}
                              className="flex justify-between gap-4"
                            >
                              <span className="text-[#5B6B72]">
                                {label}
                              </span>

                              <span className="font-medium text-[#2B2B2B] text-right">
                                {value || 'N/A'}
                              </span>
                            </div>
                          )
                        )}
                      </div>

                      {(fullPatient.notes ||
                        appointment.notes) && (
                        <div className="mt-3 p-3 bg-[#F2F8FB] rounded-lg">
                          <span className="text-[#5B6B72] text-xs">
                            Notes
                          </span>

                          <p className="text-sm mt-1">
                            {fullPatient.notes ||
                              appointment.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* APPOINTMENT */}

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <ClockIcon className="w-4 h-4 text-[#0EA5A5]" />

                          <span className="text-sm font-semibold">
                            Current Appointment
                          </span>
                        </div>

                        <button
                          onClick={
                            startEditing
                          }
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100"
                        >
                          <PencilSquareIcon className="w-4 h-4" />
                          Edit
                        </button>
                      </div>

                      <div className="space-y-2 text-sm">
                        {[
                          [
                            'Date',
                            appointment.date,
                          ],
                          [
                            'Time',
                            appointment.time
                              ? formatTime(
                                  appointment.time
                                )
                              : 'N/A',
                          ],
                          [
                            'Doctor',
                            appointment.doctor
                              ?.name ||
                              appointment.doctor_name ||
                              appointment.doctor ||
                              'N/A',
                          ],
                          [
                            'Service',
                            appointment.service ||
                              appointment.treatment ||
                              'General Consultation',
                          ],
                          [
                            'Recurring',
                            getRecurringLabel(
                              appointment.recurring
                            ),
                          ],
                        ].map(
                          ([label, value]) => (
                            <div
                              key={label}
                              className="flex justify-between gap-4"
                            >
                              <span className="text-[#5B6B72]">
                                {label}
                              </span>

                              <span className="font-medium text-right">
                                {value || 'N/A'}
                              </span>
                            </div>
                          )
                        )}

                        {appointment.notes && (
                          <div className="mt-2 p-3 bg-[#F2F8FB] rounded-lg">
                            <span className="text-[#5B6B72] text-xs">
                              Appointment Notes
                            </span>

                            <p className="text-sm mt-1">
                              {appointment.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* EDIT FORM */

                  <form
                    onSubmit={
                      saveAppointment
                    }
                    className="border border-[#0EA5A5]/30 bg-[#0EA5A5]/5 rounded-xl p-5"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-[#2B2B2B]">
                          Edit Appointment
                        </h3>

                        <p className="text-xs text-[#5B6B72] mt-1">
                          Update the appointment
                          information below.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Date *
                        </label>

                        <input
                          type="date"
                          value={form.date}
                          onChange={(e) =>
                            updateForm(
                              'date',
                              e.target.value
                            )
                          }
                          required
                          className={
                            fieldClass
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Time *
                        </label>

                        <input
                          type="time"
                          value={form.time}
                          onChange={(e) =>
                            updateForm(
                              'time',
                              e.target.value
                            )
                          }
                          required
                          className={
                            fieldClass
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Status
                        </label>

                        <select
                          value={
                            form.status
                          }
                          onChange={(e) =>
                            updateForm(
                              'status',
                              e.target.value
                            )
                          }
                          className={
                            fieldClass
                          }
                        >
                          {Object.entries(
                            STATUS_CONFIG
                          ).map(
                            ([key, cfg]) => (
                              <option
                                key={key}
                                value={key}
                              >
                                {cfg.label}
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">
                          Patient
                        </label>

                        <div className="px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-sm">
                          {patientName}
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium mb-1">
                          Notes
                        </label>

                        <textarea
                          value={form.notes}
                          onChange={(e) =>
                            updateForm(
                              'notes',
                              e.target.value
                            )
                          }
                          rows={3}
                          className={
                            fieldClass
                          }
                          placeholder="Appointment notes..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-5">
                      <button
                        type="button"
                        onClick={
                          cancelEditing
                        }
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] disabled:opacity-50"
                      >
                        {saving
                          ? 'Saving...'
                          : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* TREATMENTS */}

            {activeTab === 'treatments' && (
              <div className="space-y-3">
                {treatments.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">
                    No treatment records yet.
                  </div>
                ) : (
                  treatments.map(
                    (treatment) => (
                      <div
                        key={treatment.id}
                        className="border border-gray-200 rounded-lg p-4 flex justify-between"
                      >
                        <div>
                          <div className="font-semibold text-sm">
                            {treatment.service}
                          </div>

                          <div className="text-sm text-gray-500">
                            {treatment.doctor} ·{' '}
                            {treatment.date}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-[#0EA5A5]">
                            {Number(
                              treatment.amount
                            ).toLocaleString()}{' '}
                            ETB
                          </div>

                          <StatusBadge
                            status={
                              treatment.status
                            }
                          />
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            )}

            {/* PAYMENTS */}

            {activeTab === 'payments' && (
              <div className="space-y-3">
                {patientCredits.length >
                  0 && (
                  <div className="space-y-2 mb-4">
                    <span className="text-sm font-semibold">
                      Credit Requests
                    </span>

                    {patientCredits.map(
                      (credit) => (
                        <div
                          key={
                            credit.requestId
                          }
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between">
                            <div>
                              <div className="font-semibold text-sm">
                                {
                                  credit.requestId
                                }
                              </div>

                              <div className="text-sm text-gray-500">
                                Due{' '}
                                {
                                  credit.dueDate
                                }
                              </div>
                            </div>

                            <StatusBadge
                              status={
                                credit.status
                              }
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2 mt-3 text-center text-xs">
                            <div>
                              <div className="text-gray-500">
                                Total
                              </div>

                              <div className="font-semibold">
                                {credit.total.toLocaleString()}{' '}
                                ETB
                              </div>
                            </div>

                            <div>
                              <div className="text-gray-500">
                                Paid
                              </div>

                              <div className="font-semibold text-emerald-600">
                                {credit.paid.toLocaleString()}{' '}
                                ETB
                              </div>
                            </div>

                            <div>
                              <div className="text-gray-500">
                                Balance
                              </div>

                              <div className="font-semibold text-red-600">
                                {credit.balance.toLocaleString()}{' '}
                                ETB
                              </div>
                            </div>
                          </div>

                          {credit.balance >
                            0 && (
                            <button
                              onClick={() =>
                                handleRecordCreditPayment(
                                  credit
                                )
                              }
                              className="mt-3 text-xs font-medium text-[#0EA5A5]"
                            >
                              + Record credit
                              payment
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">
                    Total collected:{' '}
                    <span className="font-semibold text-[#0EA5A5]">
                      {totalPaid.toLocaleString()}{' '}
                      ETB
                    </span>
                  </span>

                  <button
                    onClick={() =>
                      setShowAddPayment(
                        !showAddPayment
                      )
                    }
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#0EA5A5]"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Payment
                  </button>
                </div>

                {showAddPayment && (
                  <form
                    onSubmit={
                      handleAddPayment
                    }
                    className="border border-[#0EA5A5]/30 bg-[#0EA5A5]/5 rounded-lg p-4 space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium">
                          Amount *
                        </label>

                        <input
                          type="number"
                          name="amount"
                          step="0.01"
                          min="0"
                          required
                          className={
                            fieldClass
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium">
                          Date *
                        </label>

                        <input
                          type="date"
                          name="date"
                          required
                          defaultValue={new Date()
                            .toISOString()
                            .slice(
                              0,
                              10
                            )}
                          className={
                            fieldClass
                          }
                        />
                      </div>

                      <div>
                        <label className="text-xs font-medium">
                          Method
                        </label>

                        <select
                          name="method"
                          className={
                            fieldClass
                          }
                        >
                          <option>
                            Cash
                          </option>
                          <option>
                            Telebirr
                          </option>
                          <option>
                            Bank Transfer
                          </option>
                          <option>
                            Card
                          </option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium">
                          Payment Plan
                        </label>

                        <select
                          name="frequency"
                          className={
                            fieldClass
                          }
                        >
                          <option>
                            One-time
                          </option>
                          <option>
                            Weekly
                          </option>
                          <option>
                            Monthly
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setShowAddPayment(
                            false
                          )
                        }
                        className="px-3 py-1.5 text-sm"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white bg-[#0EA5A5]"
                      >
                        Save Payment
                      </button>
                    </div>
                  </form>
                )}

                {payments.length ===
                0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">
                    No payment records yet.
                  </div>
                ) : (
                  payments.map(
                    (payment) => (
                      <div
                        key={payment.id}
                        className="border border-gray-200 rounded-lg p-4 flex justify-between"
                      >
                        <div>
                          <div className="font-semibold text-sm">
                            {payment.method}
                          </div>

                          <div className="text-sm text-gray-500">
                            {payment.date}
                          </div>

                          <div className="text-sm text-gray-500">
                            Receipt:{' '}
                            {
                              payment.receipt
                            }
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-semibold text-[#0EA5A5]">
                            {payment.amount.toLocaleString()}{' '}
                            ETB
                          </div>

                          <StatusBadge
                            status={
                              payment.status
                            }
                          />
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            )}

            {/* HISTORY */}

            {activeTab === 'history' && (
              <div className="space-y-3">
                {appointmentHistory.length ===
                0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">
                    No appointment history
                    available yet.
                  </div>
                ) : (
                  appointmentHistory.map(
                    (history) => (
                      <div
                        key={history.id}
                        className="border border-gray-200 rounded-lg p-4 flex justify-between"
                      >
                        <div>
                          <div className="font-semibold text-sm">
                            {history.service}
                          </div>

                          <div className="text-sm text-gray-500">
                            {history.doctor} ·{' '}
                            {history.date}
                          </div>
                        </div>

                        <StatusBadge
                          status={
                            history.status
                          }
                        />
                      </div>
                    )
                  )
                )}
              </div>
            )}
          </div>

          {/* FOOTER */}

          <div className="flex justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={() =>
                onDelete(appointment.id)
              }
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm text-[#E5484D] border border-[#E5484D]/30 hover:bg-[#E5484D]/5"
            >
              <TrashIcon className="w-4 h-4" />
              Delete Appointment
            </button>

            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailModal;