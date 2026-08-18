import React, { useState } from "react";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// TODO: replace with real GET/PUT /api/admin/plans once the backend is wired up
const SEED_PLANS = [
  { id: "basic", name: "Basic", price: 1000, doctors: "1", cashiers: "1", patients: "300" },
  { id: "standard", name: "Standard", price: 2500, doctors: "5", cashiers: "3", patients: "3,000" },
  { id: "premium", name: "Premium", price: 5000, doctors: "Unlimited", cashiers: "Unlimited", patients: "Unlimited" },
];

export default function SubscriptionPlans() {
  const [plans, setPlans] = useState(SEED_PLANS);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);

  const startEdit = (plan) => {
    setEditingId(plan.id);
    setDraft({ ...plan });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    setPlans((prev) => prev.map((p) => (p.id === editingId ? draft : p)));
    toast.success(`${draft.name} plan updated`);
    setEditingId(null);
    setDraft(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-sm text-gray-400">Create and edit the plans clinics can subscribe to.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {plans.map((plan) => {
          const isEditing = editingId === plan.id;
          return (
            <div key={plan.id} className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
              <div className="flex items-center justify-between">
                {isEditing ? (
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    className="font-heading font-bold text-gray-900 border border-gray-200 rounded-lg px-2 py-1 text-sm w-28"
                  />
                ) : (
                  <h3 className="font-heading font-bold text-gray-900">{plan.name}</h3>
                )}
                {isEditing ? (
                  <div className="flex gap-1">
                    <button onClick={saveEdit} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700"><CheckIcon className="h-4 w-4" /></button>
                    <button onClick={cancelEdit} className="p-1.5 rounded-lg bg-gray-50 text-gray-500"><XMarkIcon className="h-4 w-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => startEdit(plan)} className="p-1.5 rounded-lg hover:bg-gray-50 text-gray-400">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isEditing ? (
                <input
                  type="number"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                  className="font-mono text-2xl font-bold text-[#0EA5A5] border border-gray-200 rounded-lg px-2 py-1 w-32"
                />
              ) : (
                <p className="font-mono text-2xl font-bold text-[#0EA5A5]">ETB {plan.price.toLocaleString()}<span className="text-sm text-gray-400">/mo</span></p>
              )}

              <div className="space-y-1 text-sm text-gray-600 border-t border-gray-50 pt-3">
                <Row label="Doctors" value={plan.doctors} editing={isEditing} onChange={(v) => setDraft({ ...draft, doctors: v })} />
                <Row label="Cashiers" value={plan.cashiers} editing={isEditing} onChange={(v) => setDraft({ ...draft, cashiers: v })} />
                <Row label="Patients" value={plan.patients} editing={isEditing} onChange={(v) => setDraft({ ...draft, patients: v })} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Row({ label, value, editing, onChange }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      {editing ? (
        <input value={value} onChange={(e) => onChange(e.target.value)} className="border border-gray-200 rounded px-2 py-0.5 text-xs w-20 text-right" />
      ) : (
        <span className="font-medium text-gray-800">{value}</span>
      )}
    </div>
  );
}