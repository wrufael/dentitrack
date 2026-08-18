import React, { useState } from "react";
import {
  XMarkIcon,
  PlusIcon,
  BanknotesIcon,
  ClockIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";

// Same status palette used across DentiTrack (Appointments, Doctors, Cashiers)
export const CREDIT_STATUS_CONFIG = {
  paid: { label: "Paid", dot: "bg-[#1FAE6B]", text: "text-[#1FAE6B]", bg: "bg-[#1FAE6B]/10" },
  partial: { label: "Partial", dot: "bg-[#E0A400]", text: "text-[#9A6B00]", bg: "bg-[#E0A400]/10" },
  overdue: { label: "Overdue", dot: "bg-[#E5484D]", text: "text-[#E5484D]", bg: "bg-[#E5484D]/10" },
  pending: { label: "Pending", dot: "bg-[#5B6B72]", text: "text-[#5B6B72]", bg: "bg-gray-100" },
};

export const CreditStatusBadge = ({ status }) => {
  const cfg = CREDIT_STATUS_CONFIG[status] || CREDIT_STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const fieldClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/20 focus:border-[#0EA5A5] transition-all";

const NON_CASH_METHODS = ["Telebirr", "CBEBirr", "Card"];

/**
 * record shape (from GET /payments/credit-report):
 * {
 *   id, requestId, patient, patientId, total, paid, balance, dueDate, status,
 *   payments: [{ id, date, amount, method }]
 * }
 */
const PatientCreditDetailModal = ({ record, onClose, onAddPayment }) => {
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [method, setMethod] = useState("Cash");
  const [amount, setAmount] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const balance = record.balance;
  const isNonCash = NON_CASH_METHODS.includes(method);

  const handleMethodChange = (e) => {
    const next = e.target.value;
    setMethod(next);
    // Non-cash collections must exactly match the remaining balance.
    if (NON_CASH_METHODS.includes(next)) {
      setAmount(String(balance));
    }
  };

  const handleAddPayment = async (e) => {
    e.preventDefault();
    const amt = parseFloat(amount) || 0;

    if (amt <= 0) {
      toast.error("Enter a payment amount greater than 0");
      return;
    }
    if (amt > balance) {
      toast.error(`Amount exceeds remaining balance of ${balance.toLocaleString()} ETB`);
      return;
    }
    if (isNonCash && Math.round(amt * 100) !== Math.round(balance * 100)) {
      toast.error(`${method} payments must exactly match the outstanding balance of ${balance.toLocaleString()} ETB`);
      return;
    }
    if (isNonCash && !proofFile) {
      toast.error("Upload a proof photo for non-cash payments");
      return;
    }

    setSaving(true);
    const ok = await onAddPayment(record.id, { amount: amt, method, proofFile });
    setSaving(false);

    if (ok) {
      toast.success(`Recorded ${amt.toLocaleString()} ETB via ${method}`);
      setAmount("");
      setProofFile(null);
      setMethod("Cash");
      setShowAddPayment(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#0EA5A5] flex items-center justify-center text-white text-lg font-semibold">
              {record.patient.charAt(0)}
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#2B2B2B]">{record.patient}</h2>
              <p className="text-sm text-[#5B6B72]">{record.requestId} · Due {record.dueDate || "—"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Status + stats */}
          <div className="mb-5">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <CreditStatusBadge status={record.status} />
              {balance > 0 && (
                <button
                  onClick={() => setShowAddPayment(!showAddPayment)}
                  className="inline-flex items-center gap-1.5 bg-[#0EA5A5] text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-[#0B7A7A] transition-all"
                >
                  <PlusIcon className="w-4 h-4" />
                  Record Payment
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-xs text-[#5B6B72]">Total</div>
                <div className="text-lg font-semibold text-[#2B2B2B]">{record.total.toLocaleString()} ETB</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-xs text-[#5B6B72]">Paid</div>
                <div className="text-lg font-semibold text-[#1FAE6B]">{record.paid.toLocaleString()} ETB</div>
              </div>
              <div className="border border-gray-200 rounded-lg p-3 text-center">
                <div className="text-xs text-[#5B6B72]">Balance</div>
                <div className={`text-lg font-semibold ${balance > 0 ? "text-[#E5484D]" : "text-[#1FAE6B]"}`}>
                  {balance.toLocaleString()} ETB
                </div>
              </div>
            </div>
          </div>

          {/* Add payment form */}
          {showAddPayment && (
            <form onSubmit={handleAddPayment} className="border border-[#0EA5A5]/30 bg-[#0EA5A5]/5 rounded-lg p-4 space-y-3 mb-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#2B2B2B] mb-1 block">Amount (ETB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    max={balance}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isNonCash}
                    required
                    className={`${fieldClass} ${isNonCash ? "bg-gray-100 text-gray-500" : ""}`}
                    placeholder={`Up to ${balance.toLocaleString()}`}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#2B2B2B] mb-1 block">Method</label>
                  <select value={method} onChange={handleMethodChange} className={fieldClass}>
                    <option>Cash</option>
                    <option>Telebirr</option>
                    <option>CBEBirr</option>
                    <option>Card</option>
                  </select>
                </div>

                {isNonCash && (
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-[#2B2B2B] mb-1 block">Proof Photo *</label>
                    <label className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-[#5B6B72] cursor-pointer hover:bg-white transition-all">
                      <PaperClipIcon className="w-4 h-4" />
                      {proofFile ? proofFile.name : "Attach screenshot / receipt photo"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="text-xs text-[#5B6B72] mt-1">
                      {method} payments must exactly match the {balance.toLocaleString()} ETB balance.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddPayment(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#5B6B72] hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] transition-all disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Payment"}
                </button>
              </div>
            </form>
          )}

          {/* Payment history */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BanknotesIcon className="w-4 h-4 text-[#0EA5A5]" />
              <span className="text-sm font-semibold text-[#2B2B2B]">Payment History</span>
            </div>

            <div className="space-y-3">
              {record.payments.length === 0 ? (
                <div className="text-center py-8 text-[#5B6B72] text-sm border border-dashed border-gray-200 rounded-lg">
                  <ClockIcon className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                  No payments recorded yet
                </div>
              ) : (
                [...record.payments]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((p) => (
                    <div key={p.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                      <div>
                        <div className="font-semibold text-[#2B2B2B] text-sm">{p.method}</div>
                        <div className="text-sm text-[#5B6B72]">{p.date}</div>
                      </div>
                      <div className="font-semibold text-[#0EA5A5]">{p.amount.toLocaleString()} ETB</div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] transition-all"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientCreditDetailModal;
