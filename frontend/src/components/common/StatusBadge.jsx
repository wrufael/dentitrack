import React from "react";

// Central place for every status color in the app — payment statuses,
// credit statuses, and appointment statuses all resolve here.
const STATUS_STYLES = {
  pending: "bg-warning/10 text-warning",
  partial: "bg-warning/10 text-warning",
  paid: "bg-success/10 text-success",
  overdue: "bg-danger/10 text-danger",
  waiting: "bg-warning/10 text-warning",
  in_progress: "bg-teal/10 text-teal-dark",
  completed: "bg-success/10 text-success",
  cancelled: "bg-ink-soft/10 text-ink-soft",
  no_show: "bg-danger/10 text-danger",
  scheduled: "bg-teal/10 text-teal-dark",
  confirmed: "bg-success/10 text-success",
  active: "bg-success/10 text-success",
  inactive: "bg-danger/10 text-danger",
};

const LABELS = {
  in_progress: "In Progress",
  no_show: "No Show",
};

const StatusBadge = ({ status }) => {
  const key = (status || "").toLowerCase().replace(/\s+/g, "_");
  const style = STATUS_STYLES[key] || "bg-ink-soft/10 text-ink-soft";
  const label = LABELS[key] || (status ? status[0].toUpperCase() + status.slice(1) : "—");

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${style}`}>
      {label}
    </span>
  );
};

export default StatusBadge;