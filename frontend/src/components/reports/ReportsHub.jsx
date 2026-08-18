import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CalendarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  PrinterIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell
} from 'recharts';

const ReportsHub = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('financial');
  const [dateRange, setDateRange] = useState('monthly');
  const [selectedMonth, setSelectedMonth] = useState('2026-07');

  // ===== SAMPLE DATA =====
  const dailyRevenue = [
    { day: 'Mon', revenue: 4500, expenses: 1200, patients: 12 },
    { day: 'Tue', revenue: 5200, expenses: 1500, patients: 15 },
    { day: 'Wed', revenue: 3800, expenses: 1100, patients: 10 },
    { day: 'Thu', revenue: 6100, expenses: 1800, patients: 18 },
    { day: 'Fri', revenue: 4900, expenses: 1400, patients: 14 },
    { day: 'Sat', revenue: 3200, expenses: 900, patients: 8 },
    { day: 'Sun', revenue: 2800, expenses: 800, patients: 6 },
  ];

  const monthlyRevenue = [
    { month: 'Jan', revenue: 45000, expenses: 28000, patients: 85 },
    { month: 'Feb', revenue: 52000, expenses: 31000, patients: 92 },
    { month: 'Mar', revenue: 48000, expenses: 29000, patients: 78 },
    { month: 'Apr', revenue: 61000, expenses: 35000, patients: 105 },
    { month: 'May', revenue: 55000, expenses: 32000, patients: 95 },
    { month: 'Jun', revenue: 49000, expenses: 30000, patients: 88 },
    { month: 'Jul', revenue: 58000, expenses: 33000, patients: 102 },
  ];

  const yearlyRevenue = [
    { year: '2022', revenue: 450000, expenses: 280000, patients: 850 },
    { year: '2023', revenue: 520000, expenses: 310000, patients: 920 },
    { year: '2024', revenue: 610000, expenses: 350000, patients: 1050 },
    { year: '2025', revenue: 680000, expenses: 390000, patients: 1200 },
    { year: '2026', revenue: 420000, expenses: 240000, patients: 750 },
  ];

  const topServices = [
    { name: 'Root Canal', revenue: 28500, count: 45 },
    { name: 'Braces', revenue: 24000, count: 12 },
    { name: 'Teeth Cleaning', revenue: 18000, count: 85 },
    { name: 'X-Ray', revenue: 14000, count: 120 },
    { name: 'Filling', revenue: 12000, count: 65 },
    { name: 'Whitening', revenue: 10000, count: 18 },
  ];

  const paymentMethods = [
    { name: 'Cash', value: 85000 },
    { name: 'Telebirr', value: 65000 },
    { name: 'CBEBirr', value: 45000 },
  ];

  const creditStatus = [
    { status: 'Paid', count: 85, amount: 120000 },
    { status: 'Partial', count: 25, amount: 35000 },
    { status: 'Pending', count: 30, amount: 45000 },
    { status: 'Overdue', count: 10, amount: 15000 },
  ];

  const doctorPerformance = [
    { name: 'Dr. Rediet Haile', patients: 120, revenue: 85000, treatments: 180 },
    { name: 'Dr. Liya Hailu', patients: 98, revenue: 72000, treatments: 150 },
    { name: 'Dr. Yonas Bekele', patients: 75, revenue: 55000, treatments: 110 },
  ];

  const patientDemographics = [
    { age: '0-12', male: 25, female: 30 },
    { age: '13-18', male: 15, female: 20 },
    { age: '19-30', male: 35, female: 45 },
    { age: '31-45', male: 30, female: 35 },
    { age: '46-60', male: 20, female: 25 },
    { age: '60+', male: 12, female: 18 },
  ];

  // ===== COMPUTED STATS =====
  const getCurrentData = () => {
    if (dateRange === 'daily') return dailyRevenue;
    if (dateRange === 'monthly') return monthlyRevenue;
    if (dateRange === 'yearly') return yearlyRevenue;
    return monthlyRevenue;
  };

  const currentData = getCurrentData();
  
  const totalRevenue = useMemo(() => 
    currentData.reduce((sum, d) => sum + d.revenue, 0), [currentData]
  );
  
  const totalExpenses = useMemo(() => 
    currentData.reduce((sum, d) => sum + d.expenses, 0), [currentData]
  );
  
  const totalPatients = useMemo(() => 
    currentData.reduce((sum, d) => sum + d.patients, 0), [currentData]
  );

  const netProfit = totalRevenue - totalExpenses;

  const COLORS = ['#0EA5A5', '#1FAE6B', '#E0A400', '#E5484D', '#0B7A7A'];

  const tabs = [
    { id: 'financial', label: '💰 Financial', icon: CurrencyDollarIcon },
    { id: 'clinical', label: '📊 Clinical', icon: UserGroupIcon },
    { id: 'credit', label: '💳 Credit', icon: ChartBarIcon },
    { id: 'demographics', label: '👥 Demographics', icon: UserGroupIcon },
  ];

  const rangeOptions = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-[#2B2B2B]">📊 Reports Hub</h1>
          <p className="text-[#5B6B72] text-sm">Financial, Clinical, and Credit Reports</p>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-100 text-[#2B2B2B] px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all flex items-center gap-2">
            <PrinterIcon className="w-4 h-4" />
            Print
          </button>
          <button className="bg-[#0EA5A5] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0B7A7A] transition-all flex items-center gap-2">
            <DocumentArrowDownIcon className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-[#0EA5A5] text-white shadow-md'
                : 'bg-gray-100 text-[#5B6B72] hover:bg-gray-200'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-4 bg-white rounded-xl shadow-sm p-4">
        <span className="text-sm font-medium text-[#2B2B2B]">Date Range:</span>
        <div className="flex gap-2">
          {rangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                dateRange === opt.value
                  ? 'bg-[#0EA5A5] text-white'
                  : 'bg-gray-100 text-[#5B6B72] hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {dateRange === 'monthly' && (
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          />
        )}
      </div>

      {/* ===== FINANCIAL TAB ===== */}
      {activeTab === 'financial' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#0EA5A5]">
              <div className="text-sm text-[#5B6B72]">Total Revenue</div>
              <div className="text-2xl font-heading font-bold text-[#0EA5A5]">ETB {totalRevenue.toLocaleString()}</div>
              <div className="text-xs text-[#1FAE6B]">↑ 12% from last period</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#E5484D]">
              <div className="text-sm text-[#5B6B72]">Total Expenses</div>
              <div className="text-2xl font-heading font-bold text-[#E5484D]">ETB {totalExpenses.toLocaleString()}</div>
              <div className="text-xs text-[#E5484D]">↑ 5% from last period</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#1FAE6B]">
              <div className="text-sm text-[#5B6B72]">Net Profit</div>
              <div className="text-2xl font-heading font-bold text-[#1FAE6B]">ETB {netProfit.toLocaleString()}</div>
              <div className="text-xs text-[#1FAE6B]">↑ 18% from last period</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-[#0EA5A5]">
              <div className="text-sm text-[#5B6B72]">Total Patients</div>
              <div className="text-2xl font-heading font-bold text-[#2B2B2B]">{totalPatients}</div>
              <div className="text-xs text-[#0EA5A5]">↑ 8% from last period</div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-heading font-semibold text-[#2B2B2B] mb-4">📈 Revenue vs Expenses</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey={dateRange === 'daily' ? 'day' : dateRange === 'monthly' ? 'month' : 'year'} 
                    stroke="#5B6B72"
                  />
                  <YAxis stroke="#5B6B72" />
                  <Tooltip 
                    formatter={(value) => `ETB ${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#0EA5A5" strokeWidth={3} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#E5484D" strokeWidth={3} name="Expenses" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-heading font-semibold text-[#2B2B2B] mb-4">💳 Payment Methods</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethods}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `ETB ${value.toLocaleString()}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Services */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-heading font-semibold text-[#2B2B2B] mb-4">🦷 Top Services</h3>
              <div className="space-y-3">
                {topServices.slice(0, 5).map((service, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[#2B2B2B]">{service.name}</span>
                      <span className="font-mono-amount text-[#0EA5A5]">ETB {service.revenue.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full mt-1">
                      <div 
                        className="h-2 bg-[#0EA5A5] rounded-full"
                        style={{ width: `${(service.revenue / topServices[0].revenue) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-[#5B6B72]">{service.count} treatments</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== CLINICAL TAB ===== */}
      {activeTab === 'clinical' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-sm text-[#5B6B72]">Total Patients</div>
              <div className="text-2xl font-heading font-bold text-[#2B2B2B]">{totalPatients}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-[#0EA5A5]">
              <div className="text-sm text-[#5B6B72]">Avg Patients/Day</div>
              <div className="text-2xl font-heading font-bold text-[#0EA5A5]">{(totalPatients / 30).toFixed(1)}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-[#1FAE6B]">
              <div className="text-sm text-[#5B6B72]">Top Doctor</div>
              <div className="text-lg font-heading font-bold text-[#1FAE6B]">{doctorPerformance[0].name}</div>
              <div className="text-xs text-[#5B6B72]">{doctorPerformance[0].patients} patients</div>
            </div>
          </div>

          {/* Doctor Performance */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-heading font-semibold text-[#2B2B2B] mb-4">👨‍⚕️ Doctor Performance</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={doctorPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#5B6B72" />
                  <YAxis stroke="#5B6B72" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="patients" fill="#0EA5A5" name="Patients" />
                  <Bar dataKey="treatments" fill="#1FAE6B" name="Treatments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Patients by Day */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-heading font-semibold text-[#2B2B2B] mb-4">📅 Daily Patients</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="day" stroke="#5B6B72" />
                  <YAxis stroke="#5B6B72" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="patients" fill="#0EA5A5" name="Patients" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {/* ===== CREDIT TAB ===== */}
      {activeTab === 'credit' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {creditStatus.map((item, index) => (
              <div key={index} className={`bg-white rounded-xl shadow-sm p-4 text-center border-l-4 ${
                item.status === 'Paid' ? 'border-[#1FAE6B]' :
                item.status === 'Partial' ? 'border-[#0EA5A5]' :
                item.status === 'Pending' ? 'border-[#E0A400]' : 'border-[#E5484D]'
              }`}>
                <div className="text-sm text-[#5B6B72]">{item.status}</div>
                <div className="text-2xl font-heading font-bold">{item.count}</div>
                <div className="text-xs text-[#5B6B72]">ETB {item.amount.toLocaleString()}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-heading font-semibold text-[#2B2B2B] mb-4">📊 Credit Status Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={creditStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="count"
                    >
                      {creditStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-heading font-semibold text-[#2B2B2B] mb-4">💳 Outstanding Balance</h3>
              <div className="space-y-4">
                <div className="bg-[#F2F8FB] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-[#5B6B72]">Total Outstanding</div>
                      <div className="text-2xl font-heading font-bold text-[#E5484D]">ETB 95,000</div>
                    </div>
                    <div className="p-3 bg-[#E5484D]/10 rounded-xl">
                      <CurrencyDollarIcon className="w-6 h-6 text-[#E5484D]" />
                    </div>
                  </div>
                </div>
                <div className="bg-[#F2F8FB] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-[#5B6B72]">Overdue Patients</div>
                      <div className="text-2xl font-heading font-bold text-[#E5484D]">10</div>
                    </div>
                    <div className="p-3 bg-[#E5484D]/10 rounded-xl">
                      <UserGroupIcon className="w-6 h-6 text-[#E5484D]" />
                    </div>
                  </div>
                </div>
                <button className="w-full bg-[#0EA5A5] text-white py-2.5 rounded-xl font-medium hover:bg-[#0B7A7A] transition-all">
                  View All Overdue Patients
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== DEMOGRAPHICS TAB ===== */}
      {activeTab === 'demographics' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-sm p-4 text-center">
              <div className="text-sm text-[#5B6B72]">Total Patients</div>
              <div className="text-2xl font-heading font-bold text-[#2B2B2B]">{totalPatients}</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-[#0EA5A5]">
              <div className="text-sm text-[#5B6B72]">Female Patients</div>
              <div className="text-2xl font-heading font-bold text-[#0EA5A5]">173 (52%)</div>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-4 text-center border-l-4 border-[#1FAE6B]">
              <div className="text-sm text-[#5B6B72]">Male Patients</div>
              <div className="text-2xl font-heading font-bold text-[#1FAE6B]">160 (48%)</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-heading font-semibold text-[#2B2B2B] mb-4">📊 Age Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patientDemographics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="age" stroke="#5B6B72" />
                    <YAxis stroke="#5B6B72" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="male" fill="#0EA5A5" name="Male" />
                    <Bar dataKey="female" fill="#1FAE6B" name="Female" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-heading font-semibold text-[#2B2B2B] mb-4">📋 Gender Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Male', value: 160 },
                        { name: 'Female', value: 173 }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      dataKey="value"
                    >
                      <Cell fill="#0EA5A5" />
                      <Cell fill="#1FAE6B" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsHub;