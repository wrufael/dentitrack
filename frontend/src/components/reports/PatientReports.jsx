import React, { useState, useMemo } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";

const patients = [
  { name: "Abebe Girma", age: 35, gender: "Male", treatment: "Filling" },
  { name: "Hana Tesfaye", age: 8, gender: "Female", treatment: "Cleaning" },
  { name: "Mekdes Alemu", age: 61, gender: "Female", treatment: "Extraction" },
  { name: "Kebede Worku", age: 17, gender: "Male", treatment: "Braces" },
  { name: "Tigist Haile", age: 28, gender: "Female", treatment: "Filling" },
  { name: "Dawit Tesfaye", age: 45, gender: "Male", treatment: "Root Canal" },
];

const AGE_BUCKETS = [
  { label: "0-12", test: (a) => a <= 12 },
  { label: "13-19", test: (a) => a >= 13 && a <= 19 },
  { label: "20-40", test: (a) => a >= 20 && a <= 40 },
  { label: "41-60", test: (a) => a >= 41 && a <= 60 },
  { label: "60+", test: (a) => a >= 60 },
];

export default function PatientReports() {
  const [reportType, setReportType] = useState("demographics");

  const byAge = useMemo(
    () => AGE_BUCKETS.map((b) => ({ label: b.label, count: patients.filter((p) => b.test(p.age)).length })),
    []
  );
  const byGender = useMemo(() => {
    return patients.reduce((acc, p) => ({ ...acc, [p.gender]: (acc[p.gender] || 0) + 1 }), {});
  }, []);
  const byTreatment = useMemo(() => {
    return patients.reduce((acc, p) => ({ ...acc, [p.treatment]: (acc[p.treatment] || 0) + 1 }), {});
  }, []);

  const maxAgeCount = Math.max(...byAge.map((b) => b.count), 1);

  const download = async () => {
    try {
      await api.post("/reports/patients/export", { reportType });
      toast.success("Report exported");
    } catch {
      toast.error("Backend not connected — showing preview only");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="demographics">Demographics Report</option>
          <option value="treatment">Treatment Report</option>
        </select>
        <button onClick={download} className="px-4 py-2.5 rounded-xl bg-[#0EA5A5] text-white text-sm font-medium">
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-900 mb-4">Patients by Age Group</p>
          <div className="space-y-3">
            {byAge.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{b.label}</span>
                  <span className="font-mono">{b.count}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#0EA5A5] rounded-full" style={{ width: `${(b.count / maxAgeCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-900 mb-4">Patients by Gender</p>
          <div className="flex items-center justify-center gap-6 py-4">
            {Object.entries(byGender).map(([g, c]) => (
              <div key={g} className="text-center">
                <p className="font-mono text-3xl font-bold text-gray-900">{c}</p>
                <p className="text-xs text-gray-400">{g}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <p className="text-sm font-medium text-gray-900 mb-4">Patients by Treatment Type</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(byTreatment).map(([t, c]) => (
            <div key={t} className="bg-teal-50 rounded-lg p-3 text-center">
              <p className="font-mono text-xl font-bold text-[#0EA5A5]">{c}</p>
              <p className="text-xs text-gray-600 mt-1">{t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}