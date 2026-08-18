// pages/cashier/CashierDashboard.jsx
//
// Real-data cashier dashboard.
//
// Previously this pulled from PaymentContext, which was seeded with
// hard-coded mock requests (Abebe Bekele / Tigist Haile etc). It now
// loads everything from the live Laravel API:
//
//   GET /api/payments/daily-summary  -> today's collection + counts
//   GET /api/payments/pending        -> the pending payment requests list
//
// NOTE: I don't have PaymentController.php, so the exact JSON keys are
// my best guess based on how the rest of this app's real endpoints are
// shaped (response.data / response.data.data, snake_case fields). The
// code below reads several likely key names defensively and falls back
// to 0 / '—' if a field isn't present, so nothing crashes — but if your
// actual response uses different field names, send me PaymentController.php
// and I'll wire the exact keys.

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { DollarSign, Clock, ClipboardList, CreditCard } from 'lucide-react';
import { BellAlertIcon } from '@heroicons/react/24/outline';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import NotificationBell from '../../components/common/NotificationBell';
import { toast } from 'react-hot-toast';
import api from '../../api';

const CashierDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    todayCollection: 0,
    pendingCount: 0,
    transactions: 0,
    creditCollections: 0,
  });
  const [pendingPayments, setPendingPayments] = useState([]);

  /* ------------------------------------------------------------------ */
  /* Auth guard                                                         */
  /* ------------------------------------------------------------------ */

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login first.');
      window.location.href = '/login';
      return false;
    }
    return true;
  };

  /* ------------------------------------------------------------------ */
  /* Load real dashboard data                                           */
  /* ------------------------------------------------------------------ */

  const loadDashboard = useCallback(async () => {
    if (!checkAuth()) return;

    try {
      setLoading(true);

      const [summaryRes, pendingRes] = await Promise.all([
        api.get('/payments/daily-summary'),
        api.get('/payments/pending'),
      ]);

      // Daily summary — read several likely shapes defensively.
      const s = summaryRes.data?.data || summaryRes.data || {};

      // Pending list — read several likely shapes defensively.
      const pendingList = pendingRes.data?.data || pendingRes.data || [];

      const normalizedPending = (Array.isArray(pendingList) ? pendingList : []).map((r) => ({
        id: r.id,
        patient: r.patient_name || r.patient?.full_name || r.patient || '—',
        patientId: r.patient_code || r.patient?.patient_code || r.patient_id || '—',
        balance: Number(r.balance ?? r.amount ?? r.total ?? 0),
        status: r.status || 'pending',
      }));

      setSummary({
        todayCollection: Number(
          s.today_collection ?? s.todays_collection ?? s.collection_today ?? 0
        ),
        pendingCount: Number(
          s.pending_count ?? s.pending_requests ?? normalizedPending.length
        ),
        transactions: Number(s.transactions_count ?? s.transactions ?? 0),
        creditCollections: Number(
          s.credit_collections ??
            s.pending_amount ??
            normalizedPending.reduce((sum, r) => sum + r.balance, 0)
        ),
      });

      setPendingPayments(normalizedPending);
    } catch (error) {
      console.error('Load dashboard error:', error);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      toast.error(error.response?.data?.message || 'Unable to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();

    // Refresh periodically so new payment requests from doctors/owners show up.
    const interval = setInterval(loadDashboard, 15000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  /* ------------------------------------------------------------------ */
  /* Collect payment (jumps to the Payments page for the full flow)     */
  /* ------------------------------------------------------------------ */

  const handleCollect = (request) => {
    navigate('/cashier/payments', { state: { paymentId: request.id } });
  };

  const initials = (name) =>
    (name || '')
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#2B2B2B]">
            💰 Welcome, {user?.name?.split(' ')[0] || 'Cashier'} 🎉
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
        <div className="flex items-center gap-4">
          <NotificationBell />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Today's Collection"
          value={`ETB ${summary.todayCollection.toLocaleString()}`}
          icon={DollarSign}
          iconColorClass="bg-success/10 text-success"
        />
        <StatCard label="Pending Payments" value={summary.pendingCount} icon={Clock} highlight />
        <StatCard
          label="Transactions"
          value={summary.transactions}
          icon={ClipboardList}
          iconColorClass="bg-teal/10 text-teal-dark"
        />
        <StatCard
          label="Credit Collections"
          value={`ETB ${summary.creditCollections.toLocaleString()}`}
          icon={CreditCard}
          iconColorClass="bg-warning/10 text-warning"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-[#2B2B2B]">Pending Payment Requests</h3>
          <span className="text-xs font-semibold text-warning bg-warning/10 px-2.5 py-1 rounded-full">
            {summary.pendingCount} pending
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="text-center py-8 text-[#5B6B72]">Loading pending payments...</div>
          ) : pendingPayments.length === 0 ? (
            <div className="text-center py-8 text-[#5B6B72]">
              <div className="text-4xl mb-2">🎉</div>
              <p>No pending payments</p>
            </div>
          ) : (
            pendingPayments.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal/10 text-teal-dark flex items-center justify-center text-xs font-semibold">
                    {initials(p.patient)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2B2B2B]">{p.patient}</p>
                    <p className="text-xs text-[#5B6B72] font-nums">{p.patientId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-nums text-[#2B2B2B]">ETB {p.balance.toLocaleString()}</p>
                  <StatusBadge status={p.status} />
                  <button
                    onClick={() => handleCollect(p)}
                    className="bg-[#0EA5A5] hover:bg-[#0B7A7A] text-white text-xs font-semibold px-4 py-1.5 rounded-lg transition-all"
                  >
                    Collect
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;