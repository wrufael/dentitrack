// src/lib/patientUtils.js

export const STATUS_CONFIG = {
  scheduled: { label: 'Scheduled', dot: 'bg-[#0EA5A5]', text: 'text-[#0EA5A5]', bg: 'bg-[#0EA5A5]/10' },
  confirmed: { label: 'Confirmed', dot: 'bg-[#1FAE6B]', text: 'text-[#1FAE6B]', bg: 'bg-[#1FAE6B]/10' },
  pending: { label: 'Pending', dot: 'bg-[#E0A400]', text: 'text-[#9A6B00]', bg: 'bg-[#E0A400]/10' },
  waiting: { label: 'Waiting', dot: 'bg-[#E0A400]', text: 'text-[#9A6B00]', bg: 'bg-[#E0A400]/10' },
  in_progress: { label: 'In Progress', dot: 'bg-[#6366F1]', text: 'text-[#6366F1]', bg: 'bg-[#6366F1]/10' },
  completed: { label: 'Completed', dot: 'bg-[#1FAE6B]', text: 'text-[#1FAE6B]', bg: 'bg-[#1FAE6B]/10' },
  cancelled: { label: 'Cancelled', dot: 'bg-[#E5484D]', text: 'text-[#E5484D]', bg: 'bg-[#E5484D]/10' },
  no_show: { label: 'No Show', dot: 'bg-[#E5484D]', text: 'text-[#E5484D]', bg: 'bg-[#E5484D]/10' },
};

export const AVATAR_STYLES = [
  { bg: 'bg-[#0EA5A5]/15', text: 'text-[#0EA5A5]' },
  { bg: 'bg-[#6366F1]/15', text: 'text-[#6366F1]' },
  { bg: 'bg-[#E0A400]/15', text: 'text-[#9A6B00]' },
  { bg: 'bg-[#E5484D]/15', text: 'text-[#E5484D]' },
  { bg: 'bg-[#1FAE6B]/15', text: 'text-[#1FAE6B]' },
];

export const getAvatarStyle = (name = '') => {
  const sum = name.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  return AVATAR_STYLES[sum % AVATAR_STYLES.length];
};

export const formatTime = (time24) => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
};

export const toDateStr = (d) => d.toISOString().split('T')[0];

export const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};