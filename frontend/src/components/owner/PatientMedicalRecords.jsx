import React, { useEffect, useState } from 'react';

import {
  MagnifyingGlassIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
  UserIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
} from '@heroicons/react/24/outline';

import { toast } from 'react-hot-toast';
import api from '../../api';
import ConsultationFormModal from './ConsultationFormModal';

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

const field = (label, value) => (
  <div>
    <div className="text-xs text-[#5B6B72]">
      {label}
    </div>

    <div className="font-medium mt-0.5 text-[#2B2B2B] whitespace-pre-wrap">
      {value || '—'}
    </div>
  </div>
);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString()
    : '—';

const money = (value) =>
  `ETB ${Number(value || 0).toLocaleString()}`;

const getGenderLabel = (gender) =>
  !gender
    ? '—'
    : gender.charAt(0).toUpperCase() +
      gender.slice(1);

const paymentStatusClass = {
  pending:
    'bg-yellow-100 text-yellow-700',

  partial:
    'bg-cyan-100 text-cyan-700',

  paid:
    'bg-green-100 text-green-700',

  done:
    'bg-green-100 text-green-700',

  cancelled:
    'bg-gray-100 text-gray-600',
};

/*
|--------------------------------------------------------------------------
| Component
|--------------------------------------------------------------------------
*/

export default function PatientMedicalRecords() {
  const [patients, setPatients] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [summary, setSummary] =
    useState({
      total: 0,
      male: 0,
      female: 0,
      children: 0,
    });

  const [selected, setSelected] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [payments, setPayments] =
    useState([]);

  const [paymentsLoading, setPaymentsLoading] =
    useState(false);

  // Add / Edit medical record modal.
  // recordForm = { mode: 'create' | 'edit', record?: {...} }
  const [recordForm, setRecordForm] =
    useState(null);

  /*
  |--------------------------------------------------------------------------
  | Authentication
  |--------------------------------------------------------------------------
  */

  const checkAuth = () => {
    const token =
      localStorage.getItem('token');

    if (!token) {
      toast.error(
        'Please login first.'
      );

      window.location.href =
        '/login';

      return false;
    }

    return true;
  };

  /*
  |--------------------------------------------------------------------------
  | Load Patients
  |--------------------------------------------------------------------------
  */

  const loadPatients = async (
    query = ''
  ) => {
    if (!checkAuth()) return;

    try {
      setLoading(true);

      const response =
        await api.get('/patients', {
          params: query.trim()
            ? {
                search:
                  query.trim(),
              }
            : {},
        });

      setPatients(
        response.data?.data || []
      );

      setSummary(
        response.data?.summary || {
          total: 0,
          male: 0,
          female: 0,
          children: 0,
        }
      );
    } catch (error) {
      console.error(
        'Load patients error:',
        error
      );

      /*
      |--------------------------------------------------------------------------
      | Unauthorized
      |--------------------------------------------------------------------------
      */

      if (
        error.response?.status === 401
      ) {
        toast.error(
          'Session expired. Please login again.'
        );

        localStorage.removeItem(
          'token'
        );

        localStorage.removeItem(
          'user'
        );

        window.location.href =
          '/login';

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Forbidden
      |--------------------------------------------------------------------------
      */

      if (
        error.response?.status === 403
      ) {
        toast.error(
          'You do not have permission to view patients.'
        );

        return;
      }

      toast.error(
        error.response?.data?.message ||
          'Unable to load patients.'
      );
    } finally {
      setLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Initial Load
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadPatients();
  }, []);

  /*
  |--------------------------------------------------------------------------
  | Search
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const timer =
      setTimeout(() => {
        loadPatients(search);
      }, 350);

    return () =>
      clearTimeout(timer);
  }, [search]);

  /*
  |--------------------------------------------------------------------------
  | Open Patient Medical Record
  |--------------------------------------------------------------------------
  */

  const openRecord = async (
    patient
  ) => {
    setSelected(patient);

    setHistory([]);

    setPayments([]);

    /*
    |--------------------------------------------------------------------------
    | Load Clinical History
    |--------------------------------------------------------------------------
    */

    try {
      setHistoryLoading(true);

      const response =
        await api.get(
          `/patients/${patient.id}/consultations`
        );

      /*
      |--------------------------------------------------------------------------
      | API response:
      |
      | {
      |   data: {
      |     patient: {...},
      |     consultations: [...]
      |   }
      | }
      |--------------------------------------------------------------------------
      */

      setHistory(
        response.data?.data
          ?.consultations || []
      );
    } catch (error) {
      console.error(
        'Load consultation history error:',
        error
      );

      toast.error(
        error.response?.data?.message ||
          'Unable to load medical history.'
      );
    } finally {
      setHistoryLoading(false);
    }

    /*
    |--------------------------------------------------------------------------
    | Load Patient Payment History
    |--------------------------------------------------------------------------
    */

    try {
      setPaymentsLoading(true);

      const response =
        await api.get('/payments');

      const allPayments =
        response.data?.data || [];

      /*
      |--------------------------------------------------------------------------
      | Only payments belonging to
      | this patient
      |--------------------------------------------------------------------------
      */

      const patientPayments =
        allPayments.filter(
          (request) =>
            Number(
              request.patient_id
            ) ===
            Number(patient.id)
        );

      setPayments(
        patientPayments
      );
    } catch (error) {
      console.error(
        'Load patient payments error:',
        error
      );

      /*
      |--------------------------------------------------------------------------
      | Payment history is not allowed
      | to break the medical record page.
      |--------------------------------------------------------------------------
      */

      setPayments([]);
    } finally {
      setPaymentsLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Close Record
  |--------------------------------------------------------------------------
  */

  const closeRecord = () => {
    setSelected(null);

    setHistory([]);

    setPayments([]);
  };

  /*
  |--------------------------------------------------------------------------
  | Refresh Clinical History (after Add / Edit Record)
  |--------------------------------------------------------------------------
  */

  const refreshHistory = async () => {
    if (!selected) return;

    try {
      setHistoryLoading(true);

      const response = await api.get(
        `/patients/${selected.id}/consultations`
      );

      setHistory(
        response.data?.data?.consultations || []
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Unable to refresh medical history.'
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  /*
  |--------------------------------------------------------------------------
  | Render
  |--------------------------------------------------------------------------
  */

  return (
    <div>

      {/* =========================================================
          HEADER
      ========================================================== */}

      <div className="flex items-center justify-between mb-6">

        <div>

          <h2 className="text-2xl font-heading font-bold text-[#2B2B2B]">
            Patient Medical Records
          </h2>

          <p className="text-[#5B6B72] text-sm mt-1">
            View complete patient information,
            clinical history, treatments,
            recommendations and payment records.
          </p>

        </div>

      </div>

      {/* =========================================================
          SUMMARY CARDS
      ========================================================== */}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

        {/* Total */}

        <div className="bg-white rounded-xl shadow-sm p-4">

          <div className="text-sm text-[#5B6B72]">
            Total Patients
          </div>

          <div className="text-2xl font-heading font-bold text-[#2B2B2B] mt-1">
            {summary.total}
          </div>

        </div>

        {/* Male */}

        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#0EA5A5]">

          <div className="text-sm text-[#5B6B72]">
            Male
          </div>

          <div className="text-2xl font-heading font-bold text-[#0EA5A5] mt-1">
            {summary.male}
          </div>

        </div>

        {/* Female */}

        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#1FAE6B]">

          <div className="text-sm text-[#5B6B72]">
            Female
          </div>

          <div className="text-2xl font-heading font-bold text-[#1FAE6B] mt-1">
            {summary.female}
          </div>

        </div>

        {/* Children */}

        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-orange-400">

          <div className="text-sm text-[#5B6B72]">
            Children
          </div>

          <div className="text-2xl font-heading font-bold text-orange-500 mt-1">
            {summary.children}
          </div>

        </div>

      </div>

      {/* =========================================================
          SEARCH
      ========================================================== */}

      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">

        <div className="relative">

          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">

            <MagnifyingGlassIcon className="w-5 h-5 text-[#5B6B72]" />

          </div>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            placeholder="Search by patient name, ID, or phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all"
          />

        </div>

      </div>

      {/* =========================================================
          PATIENT TABLE
      ========================================================== */}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">
                  Patient ID
                </th>

                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">
                  Name
                </th>

                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">
                  Age / Gender
                </th>

                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">
                  Phone
                </th>

                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">
                  Address
                </th>

                <th className="text-right px-6 py-3 text-sm font-semibold text-[#5B6B72]">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {/* Loading */}

              {loading ? (

                <tr>

                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-[#5B6B72]"
                  >
                    Loading patients from database...
                  </td>

                </tr>

              ) : patients.length === 0 ? (

                /* Empty */

                <tr>

                  <td
                    colSpan="6"
                    className="px-6 py-10 text-center text-[#5B6B72]"
                  >
                    No patients found.
                  </td>

                </tr>

              ) : (

                /* Patients */

                patients.map(
                  (patient) => (

                    <tr
                      key={patient.id}
                      className="hover:bg-[#F2F8FB] transition-all"
                    >

                      {/* Patient ID */}

                      <td className="px-6 py-4">

                        <span className="font-mono text-sm font-semibold text-[#0EA5A5]">
                          {patient.patient_code ||
                            patient.patient_id ||
                            `PAT-${patient.id}`}
                        </span>

                      </td>

                      {/* Name */}

                      <td className="px-6 py-4">

                        <button
                          onClick={() =>
                            openRecord(
                              patient
                            )
                          }
                          className="font-medium text-[#0EA5A5] hover:underline cursor-pointer text-left"
                        >
                          {patient.full_name ||
                            patient.name ||
                            '—'}
                        </button>

                      </td>

                      {/* Age / Gender */}

                      <td className="px-6 py-4 text-sm text-[#5B6B72]">

                        {patient.age ?? '—'}

                        {' / '}

                        {getGenderLabel(
                          patient.gender
                        )}

                      </td>

                      {/* Phone */}

                      <td className="px-6 py-4 text-sm text-[#5B6B72]">
                        {patient.phone ||
                          '—'}
                      </td>

                      {/* Address */}

                      <td className="px-6 py-4 text-sm text-[#5B6B72]">
                        {patient.address ||
                          '—'}
                      </td>

                      {/* Actions */}

                      <td className="px-6 py-4">

                        <div className="flex items-center justify-end gap-2">

                          <button
                            onClick={() =>
                              openRecord(
                                patient
                              )
                            }
                            className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all"
                            title="View Medical Record"
                          >

                            <EyeIcon className="w-4 h-4" />

                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =========================================================
          MEDICAL RECORD MODAL
      ========================================================== */}

      {selected && (

        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">

            {/* =====================================================
                MODAL HEADER
            ====================================================== */}

            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">

              <div className="flex items-center gap-3">

                {/* Avatar */}

                <div className="w-12 h-12 rounded-full bg-[#0EA5A5] flex items-center justify-center text-white text-lg font-semibold">

                  {(
                    selected.full_name ||
                    selected.name ||
                    'P'
                  )
                    .charAt(0)
                    .toUpperCase()}

                </div>

                <div>

                  <h2 className="text-lg font-semibold text-[#2B2B2B]">

                    {selected.full_name ||
                      selected.name ||
                      'Patient'}

                  </h2>

                  <p className="text-sm text-[#5B6B72]">

                    {selected.patient_code ||
                      selected.patient_id ||
                      `PAT-${selected.id}`}

                    {' • '}

                    {selected.age ?? '—'}
                    {' years • '}

                    {getGenderLabel(
                      selected.gender
                    )}

                  </p>

                </div>

              </div>

              <button
                onClick={closeRecord}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Close"
              >

                <XMarkIcon className="w-5 h-5" />

              </button>

            </div>

            {/* =====================================================
                MODAL CONTENT
            ====================================================== */}

            <div className="p-6 space-y-6">

              {/* ===================================================
                  PATIENT INFORMATION
              ==================================================== */}

              <section className="bg-[#F2F8FB] rounded-xl p-4">

                <h3 className="font-semibold flex items-center gap-2 mb-4 text-[#2B2B2B]">

                  <UserIcon className="w-5 h-5 text-[#0EA5A5]" />

                  Patient Information

                </h3>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 text-sm">

                  {field(
                    'Patient ID',
                    selected.patient_code ||
                      selected.patient_id ||
                      `PAT-${selected.id}`
                  )}

                  {field(
                    'Full Name',
                    selected.full_name ||
                      selected.name
                  )}

                  {field(
                    'Age',
                    selected.age
                  )}

                  {field(
                    'Gender',
                    getGenderLabel(
                      selected.gender
                    )
                  )}

                  {field(
                    'Phone',
                    selected.phone
                  )}

                  {field(
                    'Address',
                    selected.address
                  )}

                  {field(
                    'Emergency Contact',
                    selected.emergency_contact
                  )}

                  {field(
                    'Registered',
                    formatDate(
                      selected.created_at
                    )
                  )}

                </div>

              </section>

              {/* ===================================================
                  CLINICAL HISTORY
              ==================================================== */}

              <section>

                <div className="flex items-center justify-between gap-2 mb-3">

                  <div className="flex items-center gap-2">

                    <ClipboardDocumentListIcon className="w-5 h-5 text-[#0EA5A5]" />

                    <h3 className="font-semibold text-[#2B2B2B]">
                      Clinical History
                    </h3>

                  </div>

                  <button
                    onClick={() =>
                      setRecordForm({ mode: 'create' })
                    }
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0EA5A5] text-white text-sm font-medium"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Record
                  </button>

                </div>

                {/* Loading */}

                {historyLoading ? (

                  <div className="py-10 text-center text-[#5B6B72]">

                    Loading consultations...

                  </div>

                ) : history.length === 0 ? (

                  /* Empty */

                  <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-[#5B6B72]">

                    <ClipboardDocumentListIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />

                    <p className="font-medium">
                      No doctor consultation has been recorded yet.
                    </p>

                    <p className="text-xs mt-1">
                      The patient's clinical history
                      will appear here after a doctor
                      records a consultation.
                    </p>

                  </div>

                ) : (

                  <div className="space-y-4">

                    {history.map(
                      (visit, index) => (

                        <article
                          key={
                            visit.id ||
                            index
                          }
                          className="border border-gray-100 rounded-xl overflow-hidden"
                        >

                          {/* Visit Header */}

                          <div className="bg-gray-50 p-4 flex flex-col md:flex-row md:justify-between gap-2">

                            <div>

                              <div className="font-semibold text-[#2B2B2B]">

                                Visit {index + 1}

                                {' • '}

                                {formatDate(
                                  visit.visit_date ||
                                    visit.created_at
                                )}

                              </div>

                              <div className="text-sm text-[#5B6B72] mt-1">

                                Doctor:{' '}

                                {visit.doctor_name ||
                                  visit.doctor?.user
                                    ?.name ||
                                  visit.doctor?.name ||
                                  '—'}

                              </div>

                            </div>

                            <div className="flex items-center gap-3">

                              <button
                                onClick={() =>
                                  setRecordForm({
                                    mode: 'edit',
                                    record: visit,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-[#0EA5A5] hover:bg-[#0EA5A5]/10"
                                title="Edit this record"
                              >
                                <PencilSquareIcon className="w-4 h-4" />
                                Edit
                              </button>

                              <CalendarDaysIcon className="w-5 h-5 text-gray-400" />

                            </div>

                          </div>

                          {/* Visit Details */}

                          <div className="p-4 grid md:grid-cols-2 gap-5 text-sm">

                            {field(
                              'Chief Complaint',
                              visit.chief_complaint
                            )}

                            {field(
                              'Symptoms / History',
                              visit.symptoms
                            )}

                            {field(
                              'Vital Signs',
                              visit.vital_signs
                            )}

                            {field(
                              'Examination Findings',
                              visit.examination_findings
                            )}

                            {field(
                              'Diagnosis',
                              visit.diagnosis
                            )}

                            {field(
                              'Treatment / Procedure',
                              visit.treatment
                            )}

                            {field(
                              'Prescription / Medication',
                              visit.prescription
                            )}

                            {field(
                              'Recommendations',
                              visit.recommendations
                            )}

                            {field(
                              'Follow-up Date',
                              formatDate(
                                visit.follow_up_date
                              )
                            )}

                            <div className="md:col-span-2">

                              {field(
                                'Doctor Notes',
                                visit.doctor_notes
                              )}

                            </div>

                          </div>

                        </article>

                      )
                    )}

                  </div>

                )}

              </section>

              {/* ===================================================
                  PAYMENT HISTORY
              ==================================================== */}

              <section>

                <div className="flex items-center gap-2 mb-3">

                  <CurrencyDollarIcon className="w-5 h-5 text-[#0EA5A5]" />

                  <h3 className="font-semibold text-[#2B2B2B]">
                    Payment History
                  </h3>

                </div>

                {/* Loading */}

                {paymentsLoading ? (

                  <div className="py-8 text-center text-[#5B6B72]">

                    Loading payment records...

                  </div>

                ) : payments.length === 0 ? (

                  <div className="border border-dashed border-gray-200 rounded-xl p-8 text-center text-[#5B6B72]">

                    <CurrencyDollarIcon className="w-10 h-10 mx-auto mb-3 text-gray-300" />

                    <p className="font-medium">
                      No payment requests for this patient yet.
                    </p>

                  </div>

                ) : (

                  <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

                    <div className="overflow-x-auto">

                      <table className="w-full text-sm">

                        <thead className="bg-gray-50">

                          <tr>

                            <th className="text-left px-4 py-3 font-semibold text-[#5B6B72]">
                              Request
                            </th>

                            <th className="text-left px-4 py-3 font-semibold text-[#5B6B72]">
                              Date
                            </th>

                            <th className="text-left px-4 py-3 font-semibold text-[#5B6B72]">
                              Services
                            </th>

                            <th className="text-left px-4 py-3 font-semibold text-[#5B6B72]">
                              Total
                            </th>

                            <th className="text-left px-4 py-3 font-semibold text-[#5B6B72]">
                              Paid
                            </th>

                            <th className="text-left px-4 py-3 font-semibold text-[#5B6B72]">
                              Balance
                            </th>

                            <th className="text-left px-4 py-3 font-semibold text-[#5B6B72]">
                              Status
                            </th>

                          </tr>

                        </thead>

                        <tbody className="divide-y divide-gray-100">

                          {payments.map(
                            (payment) => (

                              <tr
                                key={
                                  payment.id
                                }
                                className="hover:bg-gray-50"
                              >

                                {/* Request Code */}

                                <td className="px-4 py-3">

                                  <span className="font-mono text-xs font-semibold text-[#0EA5A5]">

                                    {payment.request_code ||
                                      `REQ-${payment.id}`}

                                  </span>

                                </td>

                                {/* Date */}

                                <td className="px-4 py-3 text-[#5B6B72]">

                                  {formatDate(
                                    payment.created_at
                                  )}

                                </td>

                                {/* Services */}

                                <td className="px-4 py-3">

                                  {Array.isArray(
                                    payment.items
                                  ) &&
                                  payment.items.length >
                                    0 ? (

                                    <div className="space-y-1">

                                      {payment.items.map(
                                        (
                                          item,
                                          itemIndex
                                        ) => (

                                          <div
                                            key={
                                              item.id ||
                                              itemIndex
                                            }
                                            className="text-xs"
                                          >

                                            {item.name}

                                            <span className="text-gray-400 ml-1">

                                              {money(
                                                item.price
                                              )}

                                            </span>

                                          </div>

                                        )
                                      )}

                                    </div>

                                  ) : (

                                    <span className="text-gray-400">
                                      —
                                    </span>

                                  )}

                                </td>

                                {/* Total */}

                                <td className="px-4 py-3 font-semibold text-[#2B2B2B]">

                                  {money(
                                    payment.total
                                  )}

                                </td>

                                {/* Paid */}

                                <td className="px-4 py-3 text-[#5B6B72]">

                                  {money(
                                    payment.paid
                                  )}

                                </td>

                                {/* Balance */}

                                <td className="px-4 py-3 text-[#5B6B72]">

                                  {money(
                                    payment.balance
                                  )}

                                </td>

                                {/* Status */}

                                <td className="px-4 py-3">

                                  <span
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                      paymentStatusClass[
                                        payment.status
                                      ] ||
                                      'bg-gray-100 text-gray-600'
                                    }`}
                                  >

                                    {payment.status
                                      ? payment.status
                                          .charAt(
                                            0
                                          )
                                          .toUpperCase() +
                                        payment.status.slice(
                                          1
                                        )
                                      : 'Unknown'}

                                  </span>

                                </td>

                              </tr>

                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                  </div>

                )}

              </section>

              {/* ===================================================
                  CLOSE BUTTON
              ==================================================== */}

              <div className="flex justify-end pt-2">

                <button
                  onClick={
                    closeRecord
                  }
                  className="px-5 py-2.5 rounded-lg font-medium text-sm text-[#2B2B2B] border border-gray-300 hover:bg-gray-50 transition"
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =========================================================
          ADD / EDIT MEDICAL RECORD MODAL
      ========================================================== */}

      {recordForm && selected && (

        <ConsultationFormModal
          mode={recordForm.mode}
          patient={selected}
          record={recordForm.record}
          onClose={() => setRecordForm(null)}
          onSaved={async () => {
            setRecordForm(null);
            await refreshHistory();
          }}
        />

      )}

    </div>
  );
}