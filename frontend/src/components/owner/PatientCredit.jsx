import React, { useEffect, useState } from "react";
import { PlusIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import PatientCreditDetailModal, { CreditStatusBadge } from "./PatientCreditDetailModal";
import AddPatientCreditModal from "./AddPatientCreditModal";
import { usePatientCredit } from "../../contexts/PatientCreditContext";

export default function PatientCredit() {
  const { creditRecords: rows, loading, fetchCreditRecords, addCredit, addPayment } = usePatientCredit();
  const [selectedId, setSelectedId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchCreditRecords();
  }, [fetchCreditRecords]);

  const totalOutstanding = rows.reduce((s, r) => s + r.balance, 0);
  const overdueCount = rows.filter((r) => r.status === "overdue").length;
  const selectedRecord = rows.find((r) => r.id === selectedId) || null;

  const handleAddPayment = (id, payment) => addPayment(id, payment);
  const handleAddCredit = (record) => addCredit(record);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[#2B2B2B]">Patient Credit</h2>
          <p className="text-[#5B6B72] text-sm">Track balances owed and record payments toward them</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchCreditRecords()}
            className="inline-flex items-center gap-1.5 text-[#5B6B72] hover:text-[#2B2B2B] px-2.5 py-2 rounded-lg text-sm transition-all"
            title="Refresh"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 bg-[#0EA5A5] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#0B7A7A] transition-all shadow-sm hover:shadow-md"
          >
            <PlusIcon className="w-5 h-5" />
            New Credit
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400">Total Outstanding Balance</p>
          <p className="font-mono text-2xl font-bold text-gray-900">ETB {totalOutstanding.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs text-gray-400">Overdue Patients</p>
          <p className="font-mono text-2xl font-bold text-red-600">{overdueCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-3 px-4 font-medium">Patient</th>
              <th className="py-3 px-4 font-medium">Request</th>
              <th className="py-3 px-4 font-medium">Total</th>
              <th className="py-3 px-4 font-medium">Paid</th>
              <th className="py-3 px-4 font-medium">Balance</th>
              <th className="py-3 px-4 font-medium">Due Date</th>
              <th className="py-3 px-4 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#5B6B72]">
                  Loading credit records...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#5B6B72]">
                  No credit records yet.{" "}
                  <button onClick={() => setShowAddModal(true)} className="text-[#0EA5A5] hover:underline font-medium">
                    Add one →
                  </button>
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="border-b border-gray-50 cursor-pointer hover:bg-[#F2F8FB] transition-colors"
                >
                  <td className="py-3 px-4 text-gray-900 font-medium">{r.patient}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{r.requestId}</td>
                  <td className="py-3 px-4 font-mono text-gray-600">ETB {r.total.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono text-emerald-600">ETB {r.paid.toLocaleString()}</td>
                  <td className="py-3 px-4 font-mono text-red-600">ETB {r.balance.toLocaleString()}</td>
                  <td className="py-3 px-4 text-gray-600">{r.dueDate || "—"}</td>
                  <td className="py-3 px-4">
                    <CreditStatusBadge status={r.status} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRecord && (
        <PatientCreditDetailModal
          record={selectedRecord}
          onClose={() => setSelectedId(null)}
          onAddPayment={handleAddPayment}
        />
      )}

      {showAddModal && (
        <AddPatientCreditModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddCredit}
        />
      )}
    </div>
  );
}
