import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  CurrencyDollarIcon,
  ClockIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline';
import api from '../../api';

const statusStyles = {
  pending: 'bg-gray-100 text-gray-600',
  partial: 'bg-[#E0A400]/10 text-[#9A6B00]',
  paid: 'bg-[#1FAE6B]/10 text-[#1FAE6B]',
  done: 'bg-[#1FAE6B]/10 text-[#1FAE6B]',
  cancelled: 'bg-red-50 text-red-500',
};

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/doctor');
      setData(response.data?.data || null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const d = data || {};
  const recentPatients = d.recent_patients || [];

  const stats = [
    { title: "Today's Patients", value: loading ? '…' : (d.patients_today ?? 0), icon: UserGroupIcon },
    { title: 'Pending Payments', value: loading ? '…' : (d.pending_payments ?? 0), icon: ClockIcon },
    { title: "Today's Revenue", value: loading ? '…' : `ETB ${Number(d.todays_revenue || 0).toLocaleString()}`, icon: CurrencyDollarIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-[#2B2B2B]">
          👨‍⚕️ Good morning, {user?.name || 'Doctor'}
        </h1>
        <p className="text-[#5B6B72] text-sm">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-[#5B6B72]">{stat.title}</div>
                <div className="text-2xl font-heading font-bold text-[#2B2B2B]">{stat.value}</div>
              </div>
              <div className="p-3 bg-[#0EA5A5]/10 rounded-xl">
                <stat.icon className="w-6 h-6 text-[#0EA5A5]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-heading font-semibold text-[#2B2B2B] mb-4">Recent Patients</h3>
        {loading ? (
          <div className="text-center py-8 text-[#5B6B72]">Loading…</div>
        ) : recentPatients.length === 0 ? (
          <div className="text-center py-8 text-[#5B6B72]">
            <div className="text-4xl mb-2">🦷</div>
            <p>No payment requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentPatients.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 bg-[#F2F8FB] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#0EA5A5]/20 flex items-center justify-center text-[#0EA5A5] font-semibold">
                    {(req.patient || '?').charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium text-[#2B2B2B] text-sm">{req.patient}</div>
                    <div className="text-xs text-[#5B6B72]">{req.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${statusStyles[req.status] || statusStyles.pending}`}>
                    {req.status}
                  </span>
                  <span className="font-mono-amount text-sm font-semibold text-[#2B2B2B]">
                    ETB {req.total.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-[#5B6B72] mt-4 text-center">
          Go to <span className="text-[#0EA5A5] font-medium">Patients</span> to create a new payment request.
        </p>
      </div>
    </div>
  );
};

export default DoctorDashboard;
