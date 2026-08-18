import React, { useState } from 'react';

import {
  XMarkIcon,
  UserIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

import { toast } from 'react-hot-toast';

import api from '../../api';

const initialForm = {
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

const SERVICES = [
  ['X-Ray', 350],
  ['Teeth Cleaning', 600],
  ['Filling', 1200],
  ['Root Canal', 2850],
  ['Extraction', 2000],
  ['Braces', 8000],
  ['Crown', 5000],
  ['Denture', 4000],
  ['Implant', 15000],
].map(([name, price], index) => ({
  id: index + 1,
  name,
  price,
}));

const money = (value) => `ETB ${Number(value || 0).toLocaleString()}`;

export default function TreatmentRecording({
  patient,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const [items, setItems] = useState([]);
  const [sendPaymentRequest, setSendPaymentRequest] = useState(false);

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const toggleItem = (service) => {
    setItems((previous) => {
      const exists = previous.some((item) => item.id === service.id);

      if (exists) {
        return previous.filter((item) => item.id !== service.id);
      }

      return [...previous, { ...service }];
    });

    setSendPaymentRequest(true);
  };

  const removeItem = (id) => {
    setItems((previous) => previous.filter((item) => item.id !== id));
  };

  const total = items.reduce(
    (sum, item) => sum + Number(item.price || 0),
    0
  );

  const submit = async (event) => {
    event.preventDefault();

    if (!form.chief_complaint.trim() && !form.diagnosis.trim()) {
      toast.error('Add the chief complaint or diagnosis.');
      return;
    }

    if (sendPaymentRequest && items.length === 0) {
      toast.error('Add at least one treatment/service, or turn off "Send Payment Request".');
      return;
    }

    try {
      setSaving(true);

      // Step 1 — save the clinical consultation.
      await api.post('/consultations', {
        patient_id: patient.id,
        ...form,
        follow_up_date: form.follow_up_date || null,
      });

      // Step 2 — optionally send a payment request for the treatments given.
      if (sendPaymentRequest && items.length > 0) {
        await api.post('/payments', {
          patient_id: patient.id,
          items: items.map((item) => ({
            name: item.name,
            price: Number(item.price),
          })),
          notes: `Payment for consultation on ${form.visit_date}`,
        });
      }

      toast.success(
        sendPaymentRequest && items.length > 0
          ? `Medical record saved. Payment request of ${money(total)} sent to cashier.`
          : 'Medical record saved successfully.'
      );

      if (onSaved) {
        await onSaved();
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Unable to save consultation.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[94vh] overflow-y-auto">
        <div className="p-5 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold">
              🩺 Record Doctor Consultation
            </h2>

            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <UserIcon className="w-4 h-4" />
              {patient.full_name || patient.name}
              {' · '}
              {patient.patient_id || patient.id}
            </div>
          </div>

          <button type="button" onClick={onClose}>
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="text-sm font-medium">
              Visit Date
              <input
                type="date"
                value={form.visit_date}
                onChange={(event) =>
                  updateField('visit_date', event.target.value)
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
                  updateField('follow_up_date', event.target.value)
                }
                className="mt-1 w-full border rounded-xl p-2.5"
              />
            </label>
          </div>

          <div className="border-t pt-5">
            <h3 className="font-semibold mb-3">
              Patient Interview & Examination
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {fields.slice(0, 4).map(([field, title, placeholder, rows]) => (
                <label key={field} className="text-sm font-medium">
                  {title}
                  <textarea
                    value={form[field]}
                    onChange={(event) =>
                      updateField(field, event.target.value)
                    }
                    rows={rows}
                    placeholder={placeholder}
                    className="mt-1 w-full border rounded-xl p-3 font-normal"
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="border-t pt-5">
            <h3 className="font-semibold mb-3">
              Clinical Assessment & Treatment
            </h3>

            <div className="grid md:grid-cols-2 gap-4">
              {fields.slice(4).map(([field, title, placeholder, rows]) => (
                <label key={field} className="text-sm font-medium">
                  {title}
                  <textarea
                    value={form[field]}
                    onChange={(event) =>
                      updateField(field, event.target.value)
                    }
                    rows={rows}
                    placeholder={placeholder}
                    className="mt-1 w-full border rounded-xl p-3 font-normal"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* =========================================================
              PAYMENT REQUEST
          ========================================================== */}
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
                    setSendPaymentRequest(event.target.checked)
                  }
                />
                Send payment request to cashier
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {SERVICES.map((service) => (
                <button
                  type="button"
                  key={service.id}
                  onClick={() => toggleItem(service)}
                  className={`p-3 rounded-xl border text-left ${
                    items.some((item) => item.id === service.id)
                      ? 'border-[#0EA5A5] bg-[#0EA5A5]/5'
                      : 'border-gray-200 hover:border-[#0EA5A5]'
                  }`}
                >
                  <div className="font-medium">{service.name}</div>
                  <div className="text-xs text-gray-500">
                    {money(service.price)}
                  </div>
                </button>
              ))}
            </div>

            {items.length > 0 && (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-xl"
                  >
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        {money(item.price)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-red-500"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}

                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-[#0EA5A5]">{money(total)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 rounded-xl"
            >
              Cancel
            </button>

            <button
              disabled={saving}
              className="px-5 py-2.5 bg-[#0EA5A5] text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {saving
                ? 'Saving...'
                : sendPaymentRequest && items.length > 0
                ? `Save & Send ${money(total)} to Cashier`
                : 'Save Medical Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}