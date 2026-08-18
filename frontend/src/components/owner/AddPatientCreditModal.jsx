import React, { useState, useEffect, useRef, useCallback } from "react";
import { XMarkIcon, PlusIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import api from "../../api";
import { usePatientCredit } from "../../contexts/PatientCreditContext";

const fieldClass =
  "w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/20 focus:border-[#0EA5A5] transition-all";

const services = ["Braces Adjustment", "Root Canal", "Teeth Cleaning", "X-Ray", "Filling", "Extraction", "Whitening", "Other"];

const AddPatientCreditModal = ({ onClose, onSave }) => {
  const { addPayment } = usePatientCredit();

  const [query, setQuery] = useState("");
  const [patients, setPatients] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const searchBoxRef = useRef(null);

  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");

  const [addInitialPayment, setAddInitialPayment] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadPatients = useCallback(async (search) => {
    setPatientLoading(true);
    try {
      const response = await api.get("/patients", { params: search ? { search } : {} });
      setPatients(response.data?.data || []);
    } catch {
      toast.error("Unable to load patients.");
    } finally {
      setPatientLoading(false);
    }
  }, []);

  const loadDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const response = await api.get("/doctors");
      setDoctors(response.data || []);
    } catch {
      toast.error("Unable to load doctors.");
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  useEffect(() => {
    const timer = setTimeout(() => loadPatients(query.trim()), 250);
    return () => clearTimeout(timer);
  }, [query, loadPatients]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const pickPatient = (patient) => {
    setSelectedPatient(patient);
    setQuery(patient.full_name || patient.name);
    setShowResults(false);
  };

  const clearPatient = () => {
    setSelectedPatient(null);
    setQuery("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    if (!selectedPatient) {
      toast.error("Search for and select an existing patient.");
      return;
    }
    if (!selectedDoctorId) {
      toast.error("Select the treating doctor.");
      return;
    }

    const total = parseFloat(form.total.value) || 0;
    if (total <= 0) {
      toast.error("Enter a total amount greater than 0");
      return;
    }

    const dueDate = form.dueDate.value;
    if (!dueDate) {
      toast.error("Enter a due date");
      return;
    }

    const initialAmount = addInitialPayment ? parseFloat(form.initialAmount.value) || 0 : 0;
    if (initialAmount > total) {
      toast.error("Initial payment can't exceed the total amount");
      return;
    }

    setSaving(true);
    try {
      const created = await onSave({
        patientId: selectedPatient.id,
        doctorId: Number(selectedDoctorId),
        service: form.service.value,
        total,
        dueDate,
      });

      if (!created) {
        // addCredit already surfaced an error toast
        return;
      }

      // Only Cash is allowed here: the backend requires non-cash amounts
      // to exactly match the full outstanding balance and a proof photo,
      // which doesn't fit a same-form initial partial payment.
      if (addInitialPayment && initialAmount > 0) {
        await addPayment(created.id, { amount: initialAmount, method: "Cash" });
      }

      toast.success(`Credit added for ${selectedPatient.full_name || selectedPatient.name}`);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-semibold text-[#2B2B2B] flex items-center gap-2">
              <PlusIcon className="w-5 h-5 text-[#0EA5A5]" />
              New Patient Credit
            </h2>
            <p className="text-sm text-[#5B6B72] mt-0.5">Set up a payment plan or partial-payment balance.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient search */}
          <div ref={searchBoxRef} className="relative">
            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Patient *</label>
            {selectedPatient ? (
              <div className="flex items-center justify-between px-3.5 py-2.5 border border-[#0EA5A5]/40 bg-[#0EA5A5]/5 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#0EA5A5]/15 text-[#0EA5A5] flex items-center justify-center text-sm font-semibold">
                    {(selectedPatient.full_name || selectedPatient.name || "?").charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#2B2B2B]">{selectedPatient.full_name || selectedPatient.name}</div>
                    <div className="text-xs text-[#5B6B72]">
                      {selectedPatient.patient_code || `#${selectedPatient.id}`} · {selectedPatient.phone}
                    </div>
                  </div>
                </div>
                <button type="button" onClick={clearPatient} className="text-xs text-[#5B6B72] hover:text-[#E5484D] font-medium">
                  Change
                </button>
              </div>
            ) : (
              <>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setShowResults(true); }}
                    onFocus={() => setShowResults(true)}
                    className={`${fieldClass} !pl-9`}
                    placeholder="Search by name, patient code, or phone..."
                  />
                </div>
                {showResults && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                    {patientLoading ? (
                      <div className="px-3 py-3 text-sm text-[#5B6B72]">Searching...</div>
                    ) : patients.length > 0 ? (
                      patients.slice(0, 8).map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => pickPatient(p)}
                          className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-[#F2F8FB] transition-all text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-[#0EA5A5]/15 text-[#0EA5A5] flex items-center justify-center text-xs font-semibold flex-shrink-0">
                            {p.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#2B2B2B]">{p.full_name}</div>
                            <div className="text-xs text-[#5B6B72]">{p.patient_code} · {p.phone}</div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-sm text-[#5B6B72]">No matching patients.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div>
            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Doctor *</label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className={fieldClass}
              required
            >
              <option value="">{doctorsLoading ? "Loading doctors..." : "Select the treating doctor"}</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.user?.name || d.name || `Doctor #${d.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Service / Reason *</label>
            <select name="service" defaultValue={services[0]} className={fieldClass} required>
              {services.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Total Amount (ETB) *</label>
              <input type="number" name="total" step="0.01" min="0" className={fieldClass} placeholder="e.g. 5000" required />
            </div>
            <div>
              <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Due Date *</label>
              <input type="date" name="dueDate" className={fieldClass} required />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4">
            <label className="flex items-center gap-2 text-sm font-medium text-[#2B2B2B] cursor-pointer">
              <input
                type="checkbox"
                checked={addInitialPayment}
                onChange={(e) => setAddInitialPayment(e.target.checked)}
                className="rounded border-gray-300 text-[#0EA5A5] focus:ring-[#0EA5A5]/30"
              />
              Patient already paid something today
            </label>

            {addInitialPayment && (
              <div className="mt-3">
                <label className="text-xs font-medium text-[#2B2B2B] mb-1 block">Amount Paid (ETB, Cash only)</label>
                <input type="number" name="initialAmount" step="0.01" min="0" className={fieldClass} placeholder="e.g. 300" />
                <p className="text-xs text-[#5B6B72] mt-1">
                  Non-cash initial payments aren't supported here — collect those from Payment Requests instead, since they require an exact-match amount and proof photo.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg font-medium text-sm text-[#2B2B2B] border border-gray-300 hover:bg-gray-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] transition-all disabled:opacity-60">
              {saving ? "Saving..." : "Add Credit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientCreditModal;
