import React from "react";

/**
 * Dashboard summary card.
 * Default = white background + small colored icon badge (the rule we
 * agreed on: cards stay calm, only the icon carries color).
 * Pass `highlight` for the ONE actionable card that should be fully
 * colored (e.g. Pending Payments) so it stands out.
 */
const StatCard = ({ label, value, icon: Icon, trend, iconColorClass = "bg-teal/10 text-teal-dark", highlight = false }) => {
  if (highlight) {
    return (
      <div className="rounded-card bg-teal p-5 shadow-card text-white">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-white/85">{label}</p>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
            <Icon size={16} className="text-white" />
          </div>
        </div>
        <p className="text-2xl font-bold font-nums">{value}</p>
        {trend && <p className="text-xs mt-1 text-white/80">{trend}</p>}
      </div>
    );
  }

  return (
    <div className="rounded-card bg-white p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconColorClass}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-2xl font-bold text-ink font-nums">{value}</p>
      {trend && <p className="text-xs mt-1 text-success">{trend}</p>}
    </div>
  );
};

export default StatCard;