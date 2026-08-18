import React, {
  useEffect,
  useState,
} from 'react';

import {
  MagnifyingGlassIcon,
  EyeIcon,
  XMarkIcon,
  ClipboardDocumentListIcon,
  PlusIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

import { toast } from 'react-hot-toast';
import api from '../../api';

import TreatmentRecording from './TreatmentRecording';

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString()
    : '—';

const displayValue = (value) =>
  value || '—';

export default function DoctorPatients() {

  const [patients, setPatients] =
    useState([]);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [selected, setSelected] =
    useState(null);

  const [history, setHistory] =
    useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(false);

  const [recording, setRecording] =
    useState(false);

  const loadPatients = async (
    query = ''
  ) => {

    try {

      setLoading(true);

      const response =
        await api.get(
          '/patients',
          {
            params: query
              ? { search: query }
              : {},
          }
        );

      setPatients(
        response.data?.data || []
      );

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
          'Unable to load patients.'
      );

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    const timer =
      setTimeout(
        () =>
          loadPatients(search),
        300
      );

    return () =>
      clearTimeout(timer);

  }, [search]);

  const openPatient = async (
    patient
  ) => {

    setSelected(patient);
    setHistory([]);

    try {

      setHistoryLoading(true);

      const response =
        await api.get(
          `/patients/${patient.id}/consultations`
        );

      setHistory(
        response.data?.data?.consultations || []
      );

    } catch (error) {

      toast.error(
        error.response?.data?.message ||
          'Unable to load patient history.'
      );

    } finally {
      setHistoryLoading(false);
    }
  };

  const refreshHistory =
    async () => {

      if (!selected) return;

      try {

        const response =
          await api.get(
            `/patients/${selected.id}/consultations`
          );

        setHistory(
          response.data?.data?.consultations || []
        );

      } catch (error) {

        toast.error(
          error.response?.data?.message ||
            'Unable to refresh history.'
        );
      }
    };

  return (
    <div className="space-y-6">

      <div>

        <h1 className="text-2xl font-bold">
          👨‍⚕️ Patients
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Search by Patient ID or name, open the full record, and record today's consultation.
        </p>

      </div>

      <div className="bg-white border rounded-2xl p-4">

        <div className="relative max-w-2xl">

          <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />

          <input
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Search by Patient ID, name or phone..."
            className="w-full pl-10 pr-4 py-2.5 border rounded-xl"
          />

        </div>

      </div>

      <div className="bg-white border rounded-2xl p-5">

        <h2 className="font-semibold mb-4">
          Registered Patients
        </h2>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead className="bg-gray-50">

              <tr>

                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-500">
                  Patient ID
                </th>

                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-500">
                  Name
                </th>

                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-500">
                  Age / Gender
                </th>

                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-500">
                  Phone
                </th>

                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-500">
                  Address
                </th>

                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-500">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-gray-100">

              {loading ? (

                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>

              ) : patients.length === 0 ? (

                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-gray-500">
                    No patient found.
                  </td>
                </tr>

              ) : (

                patients.map(
                  (patient) => (

                    <tr
                      key={patient.id}
                      className="hover:bg-[#F2F8FB] transition-all"
                    >

                      <td className="px-4 py-3">
                        <span className="font-mono text-sm font-semibold text-[#0EA5A5]">
                          {patient.patient_code ||
                            patient.patient_id ||
                            `PAT-${patient.id}`}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() =>
                            openPatient(patient)
                          }
                          className="font-medium text-[#0EA5A5] hover:underline cursor-pointer text-left"
                        >
                          {patient.full_name ||
                            patient.name}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {patient.age ?? '—'}
                        {' / '}
                        {patient.gender || '—'}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {patient.phone || '—'}
                      </td>

                      <td className="px-4 py-3 text-sm text-gray-600">
                        {patient.address || '—'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              openPatient(patient)
                            }
                            className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all"
                            title="View Patient / Record Consultation"
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

      {selected && (

        <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-y-auto">

            <div className="p-5 border-b flex justify-between">

              <div>

                <h2 className="text-xl font-bold">
                  {selected.full_name ||
                    selected.name}
                </h2>

                <p className="text-sm text-gray-500">
                  Patient ID:{' '}
                  {selected.patient_id ||
                    selected.id}
                </p>

              </div>

              <button
                onClick={() =>
                  setSelected(null)
                }
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

            </div>

            <div className="p-5 space-y-5">

              <section className="bg-[#F2F8FB] rounded-xl p-4">

                <div className="flex justify-between items-center mb-3">

                  <h3 className="font-semibold">
                    Patient Information
                  </h3>

                  <button
                    onClick={() =>
                      setRecording(true)
                    }
                    className="bg-[#0EA5A5] text-white px-4 py-2 rounded-xl inline-flex items-center gap-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Record Consultation
                  </button>

                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">

                  <Info
                    label="Patient ID"
                    value={
                      selected.patient_id ||
                      selected.id
                    }
                  />

                  <Info
                    label="Full Name"
                    value={
                      selected.full_name ||
                      selected.name
                    }
                  />

                  <Info
                    label="Age"
                    value={selected.age}
                  />

                  <Info
                    label="Gender"
                    value={selected.gender}
                  />

                  <Info
                    label="Phone"
                    value={selected.phone}
                  />

                  <Info
                    label="Address"
                    value={selected.address}
                  />

                  <Info
                    label="Emergency Contact"
                    value={
                      selected.emergency_contact
                    }
                  />

                  <Info
                    label="Registered"
                    value={formatDate(
                      selected.created_at
                    )}
                  />

                </div>

              </section>

              <section>

                <h3 className="font-semibold flex items-center gap-2 mb-3">

                  <ClipboardDocumentListIcon className="w-5 h-5 text-[#0EA5A5]" />

                  Medical / Consultation History

                </h3>

                {historyLoading ? (

                  <div className="py-8 text-center text-gray-500">
                    Loading history...
                  </div>

                ) : history.length === 0 ? (

                  <div className="border border-dashed rounded-xl p-8 text-center text-gray-500">
                    No previous consultations. Use "Record Consultation" to add today's information.
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
                          className="border rounded-xl"
                        >

                          <div className="bg-gray-50 p-4 flex justify-between">

                            <div>

                              <b>
                                Visit{' '}
                                {history.length -
                                  index}
                              </b>

                              <div className="text-sm text-gray-500">
                                {formatDate(
                                  visit.visit_date ||
                                    visit.created_at
                                )}
                                {' · '}
                                Doctor:{' '}
                                {visit.doctor_name ||
                                  visit.doctor?.name ||
                                  visit.user?.name ||
                                  'Current doctor'}
                              </div>

                            </div>

                            <CalendarDaysIcon className="w-5 h-5 text-gray-400" />

                          </div>

                          <div className="p-4 grid md:grid-cols-2 gap-4 text-sm">

                            <Info
                              label="Chief Complaint"
                              value={
                                visit.chief_complaint
                              }
                            />

                            <Info
                              label="Symptoms"
                              value={
                                visit.symptoms
                              }
                            />

                            <Info
                              label="Vital Signs"
                              value={
                                visit.vital_signs
                              }
                            />

                            <Info
                              label="Examination"
                              value={
                                visit.examination_findings
                              }
                            />

                            <Info
                              label="Diagnosis"
                              value={
                                visit.diagnosis
                              }
                            />

                            <Info
                              label="Treatment"
                              value={
                                visit.treatment
                              }
                            />

                            <Info
                              label="Prescription"
                              value={
                                visit.prescription
                              }
                            />

                            <Info
                              label="Recommendations"
                              value={
                                visit.recommendations
                              }
                            />

                            <Info
                              label="Follow-up"
                              value={formatDate(
                                visit.follow_up_date
                              )}
                            />

                            <div className="md:col-span-2">

                              <Info
                                label="Doctor Notes"
                                value={
                                  visit.doctor_notes
                                }
                              />

                            </div>

                          </div>

                        </article>

                      )
                    )}

                  </div>

                )}

              </section>

            </div>

          </div>

        </div>

      )}

      {recording &&
        selected && (

          <TreatmentRecording
            patient={selected}
            onClose={() =>
              setRecording(false)
            }
            onSaved={async () => {
              setRecording(false);
              await refreshHistory();
            }}
          />

        )}

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
        {displayValue(value)}
      </div>

    </div>
  );
}