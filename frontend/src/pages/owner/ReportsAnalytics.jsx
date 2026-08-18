import React, { useState, useMemo } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { PrinterIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import PatientReports from "../../components/reports/PatientReports";
import PatientCredit from "../../components/owner/PatientCredit";
import api from "../../api/axios";
import toast from "react-hot-toast";

const revenueTrend = [
  { month: "Jan", revenue: 38000 },
  { month: "Feb", revenue: 42000 },
  { month: "Mar", revenue: 45000 },
  { month: "Apr", revenue: 41000 },
  { month: "May", revenue: 48000 },
  { month: "Jun", revenue: 46000 },
  { month: "Jul", revenue: 52000 },
];

const weeklyVisits = [
  { day: "Mon", visits: 12 },
  { day: "Tue", visits: 18 },
  { day: "Wed", visits: 14 },
  { day: "Thu", visits: 22 },
  { day: "Fri", visits: 19 },
  { day: "Sat", visits: 8 },
  { day: "Sun", visits: 4 },
];

const REPORT_CATEGORIES = [
  {
    title: "Financial Reports",
    color: "text-[#0EA5A5]",
    items: [
      { key: "daily-revenue", label: "Daily Revenue Report" },
      { key: "monthly-revenue", label: "Monthly Revenue Summary" },
      { key: "yearly-revenue", label: "Yearly Revenue" },
    ],
  },
  {
    title: "Clinical Reports",
    color: "text-[#0EA5A5]",
    items: [
      { key: "appointments-per-day", label: "Appointments Per Day" },
      { key: "treatments-per-month", label: "Treatments Per Month" },
      { key: "demographics", label: "Patient Demographics" },
    ],
  },
  {
    title: "Credit Reports",
    color: "text-[#0EA5A5]",
    items: [
      { key: "outstanding", label: "Outstanding Balances" },
      { key: "overdue", label: "Overdue Patients List" },
      { key: "collections", label: "Collection Reports" },
    ],
  },
];

export default function ReportsAnalytics() {
  const [activeReport, setActiveReport] = useState(null);

  const exportPdf = async () => {
    try {
      await api.post("/reports/export", { report: activeReport || "overview" });
      toast.success("Report exported");
    } catch {
      toast.error("Backend not connected — printable preview only");
    }
  };

  const activeLabel = useMemo(() => {
    for (const cat of REPORT_CATEGORIES) {
      const found = cat.items.find((i) => i.key === activeReport);
      if (found) return found.label;
    }
    return null;
  }, [activeReport]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-sm text-gray-500">Comprehensive clinic performance insights</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-600">
            <PrinterIcon className="h-4 w-4" /> Print
          </button>
          <button onClick={exportPdf} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0EA5A5] text-white text-sm font-medium">
            <ArrowDownTrayIcon className="h-4 w-4" /> Export PDF
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-900 mb-4">Revenue Trend</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip formatter={(v) => `ETB ${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="revenue" stroke="#0EA5A5" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm font-medium text-gray-900 mb-4">Patient Visits (This Week)</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyVisits}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Bar dataKey="visits" fill="#0EA5A5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Report categories */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REPORT_CATEGORIES.map((cat) => (
          <div key={cat.title} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className={`text-sm font-semibold mb-3 ${cat.color}`}>{cat.title}</p>
            <div className="space-y-2">
              {cat.items.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveReport(item.key)}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    activeReport === item.key ? "bg-teal-50 text-[#0EA5A5] font-medium" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Active report detail */}
      {activeReport && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-sm font-semibold text-gray-900 mb-4">{activeLabel}</p>

          {activeReport === "demographics" && <PatientReports />}

          {(activeReport === "outstanding" || activeReport === "overdue" || activeReport === "collections") && (
            <PatientCredit />
          )}

          {["daily-revenue", "monthly-revenue", "yearly-revenue", "appointments-per-day", "treatments-per-month"].includes(activeReport) && (
            <p className="text-sm text-gray-500">
              This report pulls from your Revenue / Appointments data once the Laravel API is connected.
              For now, use the Revenue and Appointments pages directly for live numbers.
            </p>
          )}
        </div>
      )}
    </div>
  );
}