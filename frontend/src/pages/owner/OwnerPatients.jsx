import React, { useState } from 'react';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { usePatients } from '../../hooks/usePatients';

const statusBadge = (status) =>
  status === 'Inactive'
    ? 'bg-red-100 text-[#E5484D] px-3 py-1 rounded-full text-xs font-medium'
    : 'bg-green-100 text-[#1FAE6B] px-3 py-1 rounded-full text-xs font-medium';

const OwnerPatients = () => {
  const [search, setSearch] = useState('');
  const { patients, summary, loading, error } = usePatients(search);

  const topAgeGroup = () => {
    if (patients.length === 0) return '—';
    const groups = { '0-12': 0, '13-19': 0, '20-40': 0, '41-60': 0, '60+': 0 };
    patients.forEach((p) => {
      if (p.age <= 12) groups['0-12']++;
      else if (p.age <= 19) groups['13-19']++;
      else if (p.age <= 40) groups['20-40']++;
      else if (p.age <= 60) groups['41-60']++;
      else groups['60+']++;
    });
    const [topGroup] = Object.entries(groups).sort((a, b) => b[1] - a[1])[0];
    const labelMap = {
      '0-12': '0-12 (Child)',
      '13-19': '13-19 (Teen)',
      '20-40': '20-40 (Adult)',
      '41-60': '41-60 (Middle-aged)',
      '60+': '60+ (Senior)',
    };
    return labelMap[topGroup];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-[#5B6B72]" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID or phone..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 text-[#2B2B2B] px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all">
            <FunnelIcon className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-1.5 bg-white border border-gray-200 text-[#2B2B2B] px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all">
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export Report
          </button>
          <button className="flex items-center gap-1.5 bg-[#0EA5A5] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0B7A7A] transition-all">
            <PlusIcon className="w-4 h-4" />
            Add Patient
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-[#5B6B72]">Filtered Patients</div>
          <div className="text-2xl font-bold text-[#2B2B2B] mt-1">{summary.total}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-[#5B6B72]">Male / Female</div>
          <div className="text-2xl font-bold text-[#2B2B2B] mt-1">
            {summary.male} / {summary.female}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-[#5B6B72]">Top Age Group</div>
          <div className="text-2xl font-bold text-[#2B2B2B] mt-1">{topAgeGroup()}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[#5B6B72]">Loading patients...</div>
        ) : error ? (
          <div className="p-8 text-center text-[#E5484D]">{error}</div>
        ) : patients.length === 0 ? (
          <div className="p-8 text-center text-[#5B6B72]">No patients found</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#5B6B72] border-b border-gray-100">
                <th className="py-3 px-5 font-medium">ID</th>
                <th className="py-3 px-5 font-medium">Name</th>
                <th className="py-3 px-5 font-medium">Age / Gender</th>
                <th className="py-3 px-5 font-medium">Phone</th>
                <th className="py-3 px-5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 px-5 text-[#0EA5A5] font-medium">{p.patient_code}</td>
                  <td className="py-3 px-5 text-[#2B2B2B] font-medium">{p.full_name}</td>
                  <td className="py-3 px-5 text-[#5B6B72]">{p.age} / {p.gender}</td>
                  <td className="py-3 px-5 text-[#5B6B72]">{p.phone}</td>
                  <td className="py-3 px-5">
                    <span className={statusBadge(p.status || 'Active')}>
                      {p.status || 'Active'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default OwnerPatients;