// path: src/components/Owner/ConsultationFormModal.jsx

import React, { useEffect, useState } from 'react';

import {
  XMarkIcon,
  UserIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import { toast } from 'react-hot-toast';

import api from '../../api';

const emptyForm = {
  visit_date: new Date().toISOString().slice(0, 10),

  chief_complaint: '',
  symptoms: '',
  vital_signs: '',
  examination_findings: '',
  diagnosis: '',
  treatment: '',
  prescription: '',
  recommendations: '',
  doctor_notes: '',
  follow_up_date: '',
};

const fields = [
  [
    'chief_complaint',
    'Chief Complaint / Patient Questions',
    'What brought the patient to the clinic? What questions did the patient ask?',
    4,
  ],
  [
    'symptoms',
    'Symptoms / History',
    'Describe symptoms, duration, severity, previous treatment, allergies, current medications.',
    4,
  ],
  [
    'vital_signs',
    'Vital Signs',
    'Example: BP 120/80, temperature 36.7°C, pulse 72.',
    3,
  ],
  [
    'examination_findings',
    'Examination Findings',
    'What did the doctor observe? Tooth condition, oral exam, X-ray findings.',
    4,
  ],
  [
    'diagnosis',
    'Diagnosis',
    'Clinical diagnosis or assessment.',
    4,
  ],
  [
    'treatment',
    'Treatment / Procedure',
    'Treatment performed or planned. Example: Root canal, extraction, filling, crown.',
    4,
  ],
  [
    'prescription',
    'Prescription / Medication',
    'Medicine, dosage, frequency and duration.',
    4,
  ],
  [
    'recommendations',
    'Recommendations',
    'Example: Brush twice daily. Avoid chewing on the treated side.',
    3,
  ],
  [
    'doctor_notes',
    'Doctor Notes',
    'Additional clinical notes.',
    3,
  ],
];

/*
 * Treatments/services are names only.
 * There are NO built-in prices.
 * The owner must enter the amount when selecting a service.
 */
const SERVICES = [
  'X-Ray',
  'Teeth Cleaning',
  'Filling',
  'Root Canal',
  'Extraction',
  'Braces',
  'Crown',
  'Denture',
  'Implant',
].map((name, index) => ({
  id: index + 1,
  name,
}));

const money = (value) =>
  `ETB ${Number(value || 0).toLocaleString()}`;

/**
 * Add / Edit a patient's medical record (consultation).
 *
 * mode="create"
 *   -> owner picks the doctor, fills clinical fields,
 *      and can optionally send a payment request to cashier.
 *
 * mode="edit"
 *   -> pre-filled from record, only clinical fields
 *      can be changed.
 *
 * Payment requests are only created in create mode.
 */
export default function ConsultationFormModal({
  mode = 'create',
  patient,
  record,
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit';

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorId, setDoctorId] = useState('');

  const [items, setItems] = useState([]);
  const [sendPaymentRequest, setSendPaymentRequest] = useState(false);

  /*
   * Load record data when editing.
   * Load doctors when creating a new consultation.
   */
  useEffect(() => {
    if (isEdit && record) {
      setForm({
        visit_date: record.visit_date || emptyForm.visit_date,
        chief_complaint: record.chief_complaint || '',
        symptoms: record.symptoms || '',
        vital_signs: record.vital_signs || '',
        examination_findings: record.examination_findings || '',
        diagnosis: record.diagnosis || '',
        treatment: record.treatment || '',
        prescription: record.prescription || '',
        recommendations: record.recommendations || '',
        doctor_notes: record.doctor_notes || '',
        follow_up_date: record.follow_up_date || '',
      });

      return;
    }

    if (isEdit) {
      return;
    }

    const loadDoctors = async () => {
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
    };

    loadDoctors();
  }, [isEdit, record]);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /*
   * Select / unselect a treatment.
   *
   * IMPORTANT:
   * New items always start with an empty price.
   * The owner must enter the actual amount.
   */
  const toggleItem = (service) => {
    setItems((previous) => {
      const exists = previous.some(
        (item) => item.id === service.id
      );

      if (exists) {
        return previous.filter(
          (item) => item.id !== service.id
        );
      }

      return [
        ...previous,
        {
          ...service,
          price: '',
        },
      ];
    });

    /*
     * Selecting a treatment automatically enables
     * the payment request.
     */
    setSendPaymentRequest(true);
  };

  /*
   * Remove selected treatment.
   */
  const removeItem = (id) => {
    setItems((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  /*
   * Update the owner-entered price for a selected treatment.
   */
  const updateItemPrice = (id, price) => {
    setItems((previous) =>
      previous.map((item) =>
        item.id === id
          ? {
              ...item,
              price,
            }
          : item
      )
    );
  };

  /*
   * Calculate total payment request amount.
   */
  const total = items.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );

  const submit = async (event) => {
    event.preventDefault();

    /*
     * Basic medical-record validation.
     */
    if (
      !form.chief_complaint.trim() &&
      !form.diagnosis.trim()
    ) {
      toast.error(
        'Add the chief complaint or diagnosis.'
      );
      return;
    }

    /*
     * Doctor is required when creating a consultation.
     */
    if (!isEdit && !doctorId) {
      toast.error(
        'Select the doctor this record is for.'
      );
      return;
    }

    /*
     * If payment request is enabled, at least one
     * treatment/service must be selected.
     */
    if (
      !isEdit &&
      sendPaymentRequest &&
      items.length === 0
    ) {
      toast.error(
        'Add at least one treatment/service, or turn off "Send Payment Request".'
      );
      return;
    }

    /*
     * Every selected service must have a valid amount.
     */
    if (
      !isEdit &&
      sendPaymentRequest &&
      items.some(
        (item) =>
          !item.price ||
          Number(item.price) <= 0
      )
    ) {
      toast.error(
        'Enter an amount for every selected treatment.'
      );
      return;
    }

    try {
      setSaving(true);

      /*
       * EDIT MEDICAL RECORD
       */
      if (isEdit) {
        await api.put(`/consultations/${record.id}`, {
          ...form,
          follow_up_date:
            form.follow_up_date || null,
        });

        toast.success(
          'Medical record updated successfully.'
        );
      }

      /*
       * CREATE MEDICAL RECORD
       */
      else {
        await api.post('/consultations', {
          patient_id: patient.id,
          doctor_id: Number(doctorId),
          ...form,
          follow_up_date:
            form.follow_up_date || null,
        });

        /*
         * Send payment request to cashier.
         *
         * Prices come directly from the owner-entered
         * values. No hard-coded treatment prices.
         */
        if (
          sendPaymentRequest &&
          items.length > 0
        ) {
          await api.post('/payments', {
            patient_id: patient.id,
            doctor_id: Number(doctorId),

            items: items.map((item) => ({
              name: item.name,
              price: Number(item.price),
            })),

            notes: `Payment for consultation on ${form.visit_date}`,
          });
        }

        toast.success(
          sendPaymentRequest &&
          items.length > 0
            ? `Medical record saved. Payment request of ${money(
                total
              )} sent to cashier.`
            : 'Medical record saved successfully.'
        );
      }

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (isEdit
            ? 'Unable to update medical record.'
            : 'Unable to save medical record.')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[94vh] overflow-y-auto">

        {/* Header */}
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold">
              {isEdit
                ? '✏️ Edit Medical Record'
                : '📋 Add Medical Record'}
            </h2>

            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <UserIcon className="w-4 h-4" />

              {patient?.full_name ||
                patient?.name}

              {' · '}

              {patient?.patient_code ||
                patient?.patient_id ||
                patient?.id}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={submit}
          className="p-5 space-y-5"
        >

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <label className="text-sm font-medium">
              Visit Date

              <input
                type="date"
                value={form.visit_date}
                onChange={(event) =>
                  updateField(
                    'visit_date',
                    event.target.value
                  )
                }
                className="mt-1 w-full border rounded-xl p-2.5"
              />
            </label>

            <label className="text-sm font-medium">
              Follow-up Date

              <input
                type="date"
                value={form.follow_up_date}
                onChange={(event) =>
                  updateField(
                    'follow_up_date',
                    event.target.value
                  )
                }
                className="mt-1 w-full border rounded-xl p-2.5"
              />
            </label>

          </div>

          {/* Doctor */}
          {!isEdit && (
            <label className="text-sm font-medium block">
              Doctor

              <select
                value={doctorId}
                onChange={(event) =>
                  setDoctorId(event.target.value)
                }
                className="mt-1 w-full border rounded-xl p-2.5"
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
            </label>
          )}

          {/* Patient Interview */}
          <div className="border-t pt-5">
            <h3 className="font-semibold mb-3">
              Patient Interview & Examination
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {fields
                .slice(0, 4)
                .map(
                  ([
                    field,
                    title,
                    placeholder,
                    rows,
                  ]) => (
                    <label
                      key={field}
                      className="text-sm font-medium"
                    >
                      {title}

                      <textarea
                        value={form[field]}
                        onChange={(event) =>
                          updateField(
                            field,
                            event.target.value
                          )
                        }
                        rows={rows}
                        placeholder={placeholder}
                        className="mt-1 w-full border rounded-xl p-3 font-normal"
                      />
                    </label>
                  )
                )}
            </div>
          </div>

          {/* Clinical Assessment */}
          <div className="border-t pt-5">
            <h3 className="font-semibold mb-3">
              Clinical Assessment & Treatment
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {fields
                .slice(4)
                .map(
                  ([
                    field,
                    title,
                    placeholder,
                    rows,
                  ]) => (
                    <label
                      key={field}
                      className="text-sm font-medium"
                    >
                      {title}

                      <textarea
                        value={form[field]}
                        onChange={(event) =>
                          updateField(
                            field,
                            event.target.value
                          )
                        }
                        rows={rows}
                        placeholder={placeholder}
                        className="mt-1 w-full border rounded-xl p-3 font-normal"
                      />
                    </label>
                  )
                )}
            </div>
          </div>

          {/* Payment Request */}
          {!isEdit && (
            <div className="border-t pt-5">

              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  Treatments / Services — Payment Request
                </h3>

                <label className="flex items-center gap-2 text-sm font-medium text-gray-600">
                  <input
                    type="checkbox"
                    checked={sendPaymentRequest}
                    onChange={(event) =>
                      setSendPaymentRequest(
                        event.target.checked
                      )
                    }
                  />

                  Send payment request to cashier
                </label>
              </div>

              {/* Treatment buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">

                {SERVICES.map((service) => (
                  <button
                    type="button"
                    key={service.id}
                    onClick={() =>
                      toggleItem(service)
                    }
                    className={`p-3 rounded-xl border text-left ${
                      items.some(
                        (item) =>
                          item.id === service.id
                      )
                        ? 'border-[#0EA5A5] bg-[#0EA5A5]/5'
                        : 'border-gray-200 hover:border-[#0EA5A5]'
                    }`}
                  >
                    {/* Name only — no built-in price */}
                    <div className="font-medium">
                      {service.name}
                    </div>
                  </button>
                ))}

              </div>

              {/* Selected treatments */}
              {items.length > 0 && (
                <div className="space-y-2">

                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-center gap-3 p-3 bg-gray-50 rounded-xl"
                    >

                      <div className="font-medium flex-1">
                        {item.name}
                      </div>

                      {/* Owner enters price */}
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">
                          ETB
                        </span>

                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.price}
                          onChange={(event) =>
                            updateItemPrice(
                              item.id,
                              event.target.value
                            )
                          }
                          placeholder="0.00"
                          className="w-28 border rounded-lg px-2 py-1.5 text-sm text-right"
                          required
                        />
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() =>
                          removeItem(item.id)
                        }
                        className="text-red-500 hover:text-red-700"
                        aria-label={`Remove ${item.name}`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>

                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Total</span>

                    <span className="text-[#0EA5A5]">
                      {money(total)}
                    </span>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-[#0EA5A5] text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : isEdit
                ? 'Update Medical Record'
                : sendPaymentRequest &&
                  items.length > 0
                ? `Save & Send ${money(
                    total
                  )} to Cashier`
                : 'Save Medical Record'}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}