import React from "react";
import { BuildingOffice2Icon, UserGroupIcon, CurrencyDollarIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";

const STATS = {
  totalClinics: 12,
  activeClinics: 10,
  totalPatients: 4820,
  platformRevenue: 186000,
  growthRate: "+14%",
};

export default function PlatformAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-gray-900">Platform Analytics</h1>
        <p className="text-sm text-gray-400">Growth metrics across every clinic on DentiTrack.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Clinics" value={STATS.totalClinics} icon={BuildingOffice2Icon} />
        <StatCard label="Active Clinics" value={STATS.activeClinics} icon={BuildingOffice2Icon} tone="dark" />
        <StatCard label="Patients Tracked" value={STATS.totalPatients.toLocaleString()} icon={UserGroupIcon} />
        <StatCard label="Platform Revenue" value={`ETB ${STATS.platformRevenue.toLocaleString()}`} icon={CurrencyDollarIcon} />
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center gap-3">
        <ArrowTrendingUpIcon className="h-6 w-6 text-[#0EA5A5]" />
        <div>
          <p className="text-sm font-medium text-gray-900">Platform growth this quarter: {STATS.growthRate}</p>
          <p className="text-xs text-gray-400">Based on new clinic sign-ups and subscription upgrades.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone }) {
  const dark = tone === "dark";
  return (
    <div className={`rounded-xl p-4 border ${dark ? "bg-[#0EA5A5] border-[#0EA5A5] text-white" : "bg-white border-gray-100"}`}>
      <div className="flex items-center justify-between mb-3">
        <p className={`text-xs ${dark ? "text-white/80" : "text-gray-400"}`}>{label}</p>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${dark ? "bg-white/20" : "bg-teal-50"}`}>
          <Icon className={`h-4 w-4 ${dark ? "text-white" : "text-[#0EA5A5]"}`} />
        </div>
      </div>
      <p className={`font-mono text-2xl font-bold ${dark ? "text-white" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}