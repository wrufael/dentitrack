import React, { useState } from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

// TODO: replace with real GET/POST /api/admin/clinics once the backend is wired up
const SEED_CLINICS = [
  { id: "CLN-001", name: "Dr. Rediet Dental Clinic", plan: "Standard", doctors: 2, cashiers: 1, active: true, joined: "2026-02-01" },
  { id: "CLN-002", name: "Sunrise Smiles Clinic", plan: "Basic", doctors: 1, cashiers: 1, active: true, joined: "2026-05-14" },
  { id: "CLN-003", name: "Bole Dental Care", plan: "Premium", doctors: 4, cashiers: 2, active: false, joined: "2026-01-20" },
];

const emptyForm = { name: "", plan: "Basic" };

export default function ClinicsManagement() {
  const [clinics, setClinics] = useState(SEED_CLINICS);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const toggleActive = (id) => {
    setClinics((prev) => prev.map((c) => (c.id === id ? { ...c, active: !c.active } : c)));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return toast.error("Clinic name is required");
    const clinic = {
      id: `CLN-${String(clinics.length + 1).padStart(3, "0")}`,
      name: form.name,
      plan: form.plan,
      doctors: 0,
      cashiers: 0,
      active: true,
      joined: new Date().toISOString().slice(0, 10),
    };
    setClinics((prev) => [...prev, clinic]);
    setForm(emptyForm);
    setShowForm(false);
    toast.success("Clinic added");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-gray-900">Clinics</h1>
          <p className="text-sm text-gray-400">Every clinic registered on the platform.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EA5A5] text-white text-sm font-medium"
        >
          <PlusIcon className="h-4 w-4" /> Add Clinic
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-3 px-4 font-medium">Clinic</th>
              <th className="py-3 px-4 font-medium">Plan</th>
              <th className="py-3 px-4 font-medium">Staff</th>
              <th className="py-3 px-4 font-medium">Joined</th>
              <th className="py-3 px-4 font-medium">Status</th>
              <th className="py-3 px-4 font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {clinics.map((c) => (
              <tr key={c.id} className="border-b border-gray-50">
                <td className="py-3 px-4">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{c.id}</p>
                </td>
                <td className="py-3 px-4 text-gray-600">{c.plan}</td>
                <td className="py-3 px-4 text-gray-600">{c.doctors} doctors · {c.cashiers} cashiers</td>
                <td className="py-3 px-4 text-gray-500">{c.joined}</td>
                <td className="py-3 px-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${c.active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                    {c.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={() => toggleActive(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      c.active ? "border-red-200 text-red-600" : "border-emerald-200 text-emerald-700"
                    }`}
                  >
                    {c.active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400">
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Add Clinic</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                placeholder="Clinic name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={form.plan}
                onChange={(e) => setForm({ ...form, plan: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option>Basic</option>
                <option>Standard</option>
                <option>Premium</option>
              </select>
              <button type="submit" className="w-full bg-[#0EA5A5] text-white rounded-lg py-2.5 text-sm font-medium">
                Add Clinic
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}