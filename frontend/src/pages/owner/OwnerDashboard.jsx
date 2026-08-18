import React, { useEffect, useState, useCallback } from "react";
import {
  DollarSign, Users, Clock, TrendingUp, BarChart3, TrendingDown, Package, UserCircle2,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import Header from "../../components/common/Header.jsx";
import StatCard from "../../components/common/StatCard.jsx";
import { useAuth } from "../../contexts/AuthContext.jsx";
import api from "../../api";

const money = (v) => `ETB ${Number(v || 0).toLocaleString()}`;

const PIE_COLORS = ["#0EA5A5", "#0B7A7A", "#5EC9C9", "#9EE0E0", "#1FAE6B", "#E0A400"];

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/dashboard/owner");
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
  const trend = (d.revenue_trend || []).map((t) => ({
    ...t,
    label: new Date(t.date).toLocaleDateString("en-US", { day: "numeric", month: "short" }),
  }));
  const byService = d.revenue_by_service || [];

  return (
    <div>
      <Header
        greeting={`Good morning, ${user?.name?.split(" ")[0] || "Doctor"} 👋`}
        subtitle={user?.clinic_name}
        unreadCount={3}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Today's Revenue" value={loading ? "…" : money(d.todays_revenue)} icon={DollarSign} iconColorClass="bg-success/10 text-success" />
        <StatCard label="Patients Today" value={loading ? "…" : (d.patients_today ?? 0)} icon={Users} iconColorClass="bg-teal/10 text-teal-dark" />
        <StatCard label="Pending Payments" value={loading ? "…" : money(d.pending_payments)} icon={Clock} highlight />
        <StatCard label="Net Profit (this month)" value={loading ? "…" : money(d.net_profit_month)} icon={TrendingUp} iconColorClass="bg-success/10 text-success" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Revenue" value={loading ? "…" : money(d.total_revenue)} icon={BarChart3} iconColorClass="bg-teal/10 text-teal-dark" />
        <StatCard label="Total Expenses" value={loading ? "…" : money(d.total_expenses)} icon={TrendingDown} iconColorClass="bg-danger/10 text-danger" />
        <StatCard label="Total Patients" value={loading ? "…" : (d.total_patients ?? 0).toLocaleString()} icon={UserCircle2} iconColorClass="bg-teal/10 text-teal-dark" />
        <StatCard label="Inventory Value" value={loading ? "…" : money(d.inventory_value)} icon={Package} iconColorClass="bg-warning/10 text-warning" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-card shadow-card p-5">
          <h3 className="font-semibold text-ink mb-4">Revenue vs Expenses (14 days)</h3>
          <div className="h-56">
            {loading ? (
              <div className="h-full flex items-center justify-center text-ink-soft text-sm">Loading…</div>
            ) : trend.every((t) => t.revenue === 0 && t.expenses === 0) ? (
              <div className="h-full flex items-center justify-center text-ink-soft text-sm border border-dashed border-gray-200 rounded-lg">
                No revenue or expenses recorded in the last 14 days yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5A5" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0EA5A5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E5484D" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#E5484D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F3F4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#8A999F" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#8A999F" }} axisLine={false} tickLine={false} width={40} />
                  <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: "1px solid #F0F3F4", fontSize: 12 }} />
                  <Area type="monotone" dataKey="revenue" stroke="#0EA5A5" fill="url(#revGrad)" strokeWidth={2} name="Revenue" />
                  <Area type="monotone" dataKey="expenses" stroke="#E5484D" fill="url(#expGrad)" strokeWidth={2} name="Expenses" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white rounded-card shadow-card p-5">
          <h3 className="font-semibold text-ink mb-4">Revenue by Service</h3>
          <div className="h-56">
            {loading ? (
              <div className="h-full flex items-center justify-center text-ink-soft text-sm">Loading…</div>
            ) : byService.length === 0 ? (
              <div className="h-full flex items-center justify-center text-ink-soft text-sm border border-dashed border-gray-200 rounded-lg">
                No paid treatments recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byService} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    {byService.map((entry, i) => (
                      <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => money(v)} contentStyle={{ borderRadius: 10, border: "1px solid #F0F3F4", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          {byService.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
              {byService.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs text-ink-soft">
                  <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {s.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
