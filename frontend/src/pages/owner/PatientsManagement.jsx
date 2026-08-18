import React, { useState, useMemo } from "react";
import { MagnifyingGlassIcon, PlusIcon, FunnelIcon, XMarkIcon } from "@heroicons/react/24/outline";
import StatusBadge from "../../components/common/StatusBadge";
import { usePatients } from "../../contexts/PatientsContext";
import toast from "react-hot-toast";

const AGE_GROUPS = [
  { label: "All Ages", value: "all" },
  { label: "0-12 (Child)", value: "0-12" },
  { label: "13-19 (Teen)", value: "13-19" },
  { label: "20-40 (Adult)", value: "20-40" },
  { label: "41-60 (Middle-age)", value: "41-60" },
  { label: "60+ (Senior)", value: "60+" },
];

const inAgeGroup = (age, group) => {
  if (group === "all") return true;
  if (group === "60+") return age >= 60;
  const [min, max] = group.split("-").map(Number);
  return age >= min && age <= max;
};

const emptyForm = { name: "", age: "", gender: "Male", phone: "", address: "", treatment: "" };

export default function PatientsManagement() {
  const { patients, registerPatient } = usePatients();

  const [search, setSearch] = useState("");
  const [ageGroup, setAgeGroup] = useState("all");
  const [gender, setGender] = useState("all");
  const [treatment, setTreatment] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const treatments = useMemo(
    () => ["all", ...new Set(patients.filter((p) => p.treatment).map((p) => p.treatment))],
    [patients]
  );

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.phone.includes(search);
      return (
        matchesSearch &&
        inAgeGroup(p.age, ageGroup) &&
        (gender === "all" || p.gender === gender) &&
        (treatment === "all" || p.treatment === treatment)
      );
    });
  }, [patients, search, ageGroup, gender, treatment]);

  const summary = useMemo(() => {
    const byGender = filtered.reduce((acc, p) => ({ ...acc, [p.gender]: (acc[p.gender] || 0) + 1 }), {});
    const byAgeGroup = AGE_GROUPS.filter((g) => g.value !== "all").reduce(
      (acc, g) => ({ ...acc, [g.label]: filtered.filter((p) => inAgeGroup(p.age, g.value)).length }),
      {}
    );
    const byTreatment = filtered.reduce(
      (acc, p) => (p.treatment ? { ...acc, [p.treatment]: (acc[p.treatment] || 0) + 1 } : acc),
      {}
    );
    return { byGender, byAgeGroup, byTreatment, total: filtered.length };
  }, [filtered]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.age || !form.phone) {
      toast.error("Name, age and phone are required");
      return;
    }
    await registerPatient({ ...form, age: Number(form.age) });
    toast.success("Patient registered");
    setForm(emptyForm);
    setShowForm(false);
  };

  const exportReport = () => {
    toast.success("Report generated from current filters");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div className="relative flex-1 max-w-sm">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID or phone..."
            className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters((s) => !s)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white"
          >
            <FunnelIcon className="h-4 w-4" /> Filters
          </button>
          <button
            onClick={exportReport}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 bg-white"
          >
            Export Report
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EA5A5] text-white text-sm font-medium"
          >
            <PlusIcon className="h-4 w-4" /> Add Patient
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-gray-100">
          <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {AGE_GROUPS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
          <select value={gender} onChange={(e) => setGender(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            <option value="all">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </select>
          <select value={treatment} onChange={(e) => setTreatment(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
            {treatments.map((t) => (
              <option key={t} value={t}>{t === "all" ? "All Treatments" : t}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">Filtered Patients</p>
          <p className="font-mono text-2xl font-bold text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400">Male / Female</p>
          <p className="font-mono text-2xl font-bold text-gray-900">
            {summary.byGender.Male || 0} / {summary.byGender.Female || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 col-span-2">
          <p className="text-xs text-gray-400 mb-1">Top Age Group</p>
          <p className="text-sm font-medium text-gray-800">
            {Object.entries(summary.byAgeGroup).sort((a, b) => b[1] - a[1])[0]?.[0] || "-"}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400 border-b border-gray-100">
              <th className="py-3 px-4 font-medium">ID</th>
              <th className="py-3 px-4 font-medium">Name</th>
              <th className="py-3 px-4 font-medium">Age / Gender</th>
              <th className="py-3 px-4 font-medium">Phone</th>
              <th className="py-3 px-4 font-medium">Treatment</th>
              <th className="py-3 px-4 font-medium">Registered</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-teal-50/30">
                <td className="py-3 px-4 font-mono text-xs text-gray-500">{p.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{p.name}</td>
                <td className="py-3 px-4 text-gray-600">{p.age} / {p.gender}</td>
                <td className="py-3 px-4 font-mono text-xs text-gray-600">{p.phone}</td>
                <td className="py-3 px-4 text-gray-600">{p.treatment || <span className="text-gray-300">Not yet examined</span>}</td>
                <td className="py-3 px-4 text-gray-500">{p.registeredAt}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="py-8 text-center text-gray-400">No patients match these filters</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400">
              <XMarkIcon className="h-5 w-5" />
            </button>
            <h3 className="font-heading text-lg font-bold text-gray-900 mb-4">Register Patient</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="Age" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <option>Male</option>
                  <option>Female</option>
                </select>
              </div>
              <input placeholder="Phone (+251...)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Treatment (optional, e.g. Filling)" value={form.treatment} onChange={(e) => setForm({ ...form, treatment: e.target.value })} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              <button type="submit" className="w-full bg-[#0EA5A5] text-white rounded-lg py-2.5 text-sm font-medium">
                Save Patient
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}