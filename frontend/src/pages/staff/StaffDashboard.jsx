// pages/staff/StaffDashboard.jsx
//
// One dashboard shared by nurse, receptionist, and lab_technician
// accounts. There's no separate "NurseDashboard" / "ReceptionistDashboard"
// component — instead this reads the logged-in user's role + the
// permissions the owner granted them (from AuthContext) and shows a
// welcome panel plus quick links to whichever modules they can
// actually use. Patients/Appointments/Settings reuse the same real,
// API-backed components the cashier role already uses
// (CashierPatients / CashierAppointments / CashierSettings) — see
// AppRoutes.jsx.

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Calendar, Settings, ShieldCheck } from 'lucide-react';

const ROLE_LABELS = {
  nurse: 'Nurse',
  receptionist: 'Receptionist',
  lab_technician: 'Lab Technician',
};

const ROLE_BASE_PATH = {
  nurse: '/nurse',
  receptionist: '/receptionist',
  lab_technician: '/lab',
};

const StaffDashboard = () => {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();

  const role = user?.role;
  const roleLabel = ROLE_LABELS[role] || role;
  const basePath = ROLE_BASE_PATH[role] || '';

  // Group the flat "Category::Label" permission keys back into
  // { category: [labels] } for display.
  const grouped = (permissions || []).reduce((acc, key) => {
    const [category, label] = key.split('::');
    if (!acc[category]) acc[category] = [];
    acc[category].push(label || key);
    return acc;
  }, {});

  const hasAnyOf = (prefixes) =>
    (permissions || []).some((p) => prefixes.some((prefix) => p.startsWith(prefix)));

  const quickLinks = [
    {
      show: hasAnyOf(['Patients::']),
      icon: Users,
      label: 'Patients',
      path: `${basePath}/patients`,
      color: 'text-[#0EA5A5] bg-[#0EA5A5]/10',
    },
    {
      show: hasAnyOf(['Appointments::']),
      icon: Calendar,
      label: 'Appointments',
      path: `${basePath}/appointments`,
      color: 'text-[#1FAE6B] bg-[#1FAE6B]/10',
    },
    {
      show: true,
      icon: Settings,
      label: 'Settings',
      path: `${basePath}/settings`,
      color: 'text-[#5B6B72] bg-gray-100',
    },
  ].filter((l) => l.show);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-heading font-bold text-[#2B2B2B]">
          Welcome, {user?.name || roleLabel} 👋
        </h1>
        <p className="text-[#5B6B72] text-sm">
          You're signed in as a {roleLabel}. Here's what you have access to.
        </p>
      </div>

      {/* QUICK LINKS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {quickLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className="bg-white rounded-xl shadow-sm p-5 text-left hover:shadow-md transition-all border border-gray-100"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${link.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-[#2B2B2B]">{link.label}</div>
            </button>
          );
        })}
      </div>

      {/* GRANTED ACCESS */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-[#0EA5A5]" />
          <h2 className="text-lg font-semibold text-[#2B2B2B]">Your access</h2>
        </div>

        {Object.keys(grouped).length === 0 ? (
          <p className="text-sm text-[#5B6B72]">
            No modules have been granted yet. Ask your clinic owner to update your
            access from Employees.
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, labels]) => (
              <div key={category}>
                <div className="text-xs font-semibold uppercase tracking-wide text-[#8A999F] mb-2">
                  {category}
                </div>
                <div className="flex flex-wrap gap-2">
                  {labels.map((label) => (
                    <span
                      key={label}
                      className="text-sm bg-[#0EA5A5]/5 border border-[#0EA5A5]/15 text-[#2B2B2B] rounded-lg px-3 py-1.5"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;
