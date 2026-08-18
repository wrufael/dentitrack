import React, { useState } from "react";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const SEED_REQUESTS = [
  { id: "SR-001", clinicName: "Dr. Rediet Dental Clinic", fromPlan: "Basic", toPlan: "Standard", requestedAt: "2026-07-20", status: "Pending" },
  { id: "SR-002", clinicName: "Sunrise Smiles Clinic", fromPlan: "Standard", toPlan: "Premium", requestedAt: "2026-07-22", status: "Pending" },
];

export default function SubscriptionRequests() {
  const [requests, setRequests] = useState(SEED_REQUESTS);

  const decide = (id, decision) => {
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: decision } : r)));
    toast.success(`Request ${decision.toLowerCase()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Subscription Requests</h1>
        <p className="text-sm text-gray-400">Clinics requesting to upgrade or change their plan.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-3 px-4 font-medium">Clinic</th>
              <th className="py-3 px-4 font-medium">Change</th>
              <th className="py-3 px-4 font-medium">Requested</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-gray-50">
                <td className="py-3 px-4 text-gray-900 font-medium">{r.clinicName}</td>
                <td className="py-3 px-4 text-gray-600">{r.fromPlan} → {r.toPlan}</td>
                <td className="py-3 px-4 text-gray-500">{r.requestedAt}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    r.status === "Approved" ? "bg-emerald-50 text-emerald-700" :
                    r.status === "Rejected" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {r.status === "Pending" ? (
                    <div className="flex gap-2">
                      <button onClick={() => decide(r.id, "Approved")} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                        <CheckIcon className="h-4 w-4" />
                      </button>
                      <button onClick={() => decide(r.id, "Rejected")} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-300">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}