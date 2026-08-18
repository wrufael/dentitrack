// path: src/components/doctor/DoctorAppointments.jsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  UserIcon,
  PhoneIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../../api';

// =========================================================
// HELPERS
// =========================================================

const toDateStr = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getPatientDisplayName = (appointment) => {
  const p = appointment?.patient;
  if (p && typeof p === 'object') {
    return p.full_name || p.name || 'Unknown patient';
  }
  return appointment?.patient_name || 'Unknown patient';
};

const getPatientPhone = (appointment) => {
  const p = appointment?.patient;
  if (p && typeof p === 'object') {
    return p.phone || '—';
  }
  return '—';
};

const getPatientCode = (appointment) => {
  const p = appointment?.patient;
  if (p && typeof p === 'object') {
    return p.patient_code || p.patient_id || `PAT-${p.id}`;
  }
  return appointment?.patient_id ? `PAT-${appointment.patient_id}` : '—';
};

const STATUS_OPTIONS = [
  'scheduled',
  'confirmed',
  'waiting',
  'in_progress',
  'completed',
  'cancelled',
  'no_show',
];

const getStatusBadgeClass = (status) => {
  const map = {
    scheduled: 'bg-blue-100 text-[#0EA5A5]',
    confirmed: 'bg-green-100 text-[#1FAE6B]',
    waiting: 'bg-yellow-100 text-[#E0A400]',
    in_progress: 'bg-purple-100 text-[#6B21A5]',
    completed: 'bg-green-100 text-[#1FAE6B]',
    cancelled: 'bg-red-100 text-[#E5484D]',
    no_show: 'bg-gray-100 text-[#5B6B72]',
  };
  return `${map[status] || 'bg-gray-100 text-[#5B6B72]'} px-3 py-1 rounded-full text-sm font-medium`;
};

const getStatusLabel = (status) => {
  const map = {
    scheduled: '📅 Scheduled',
    confirmed: '✅ Confirmed',
    waiting: '⏳ Waiting',
    in_progress: '🔄 In Progress',
    completed: '✅ Completed',
    cancelled: '❌ Cancelled',
    no_show: '❌ No Show',
  };
  return map[status] || status;
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const emptyForm = {
  patient_id: '',
  date: '',
  time: '',
  notes: '',
  status: 'scheduled',
};

const DoctorAppointments = () => {
  const { user } = useAuth();

  // ===== REAL DATA STATE =====
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [currentDoctorId, setCurrentDoctorId] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== CALENDAR / UI STATE =====
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null); // null = creating new
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  // =========================================================
  // LOAD REAL DATA
  // =========================================================

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Step 1 — figure out THIS logged-in doctor's `doctors.id`
      // (appointments store doctor_id referencing the doctors table,
      // not the users table, so we resolve it via GET /doctors first).
      const doctorsRes = await api.get('/doctors');
      const doctorsList = Array.isArray(doctorsRes.data)
        ? doctorsRes.data
        : doctorsRes.data?.data || [];

      const myDoctorRecord = doctorsList.find(
        (d) => d.user_id === user?.id || d.user?.id === user?.id
      );
      const myDoctorId = myDoctorRecord?.id ?? user?.doctor_id ?? null;
      setCurrentDoctorId(myDoctorId);

      // Step 2 — load only THIS doctor's appointments (server-side
      // filtered via ?doctor_id=) plus the clinic's patient list for
      // the "New Appointment" picker.
      const [appointmentsRes, patientsRes] = await Promise.all([
        api.get('/appointments', {
          params: myDoctorId ? { doctor_id: myDoctorId } : {},
        }),
        api.get('/patients'),
      ]);

      // AppointmentController::index() returns a raw array.
      const myAppointments = Array.isArray(appointmentsRes.data)
        ? appointmentsRes.data
        : appointmentsRes.data?.data || [];

      // PatientController::index() wraps the list in { data: [...] }.
      const allPatients = patientsRes.data?.data || [];

      setAppointments(myAppointments);
      setPatients(allPatients);
    } catch (error) {
      console.error('[DoctorAppointments] Failed to load data:', error);
      toast.error(
        error.response?.data?.message || 'Failed to load appointments.'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.doctor_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // =========================================================
  // DERIVED DATA
  // =========================================================

  const getAppointmentsForDate = (date) => {
    const dateStr = toDateStr(date);
    return appointments
      .filter((a) => a.date === dateStr)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  };

  const selectedDateAppointments = useMemo(
    () => getAppointmentsForDate(selectedDate),
    [appointments, selectedDate]
  );

  const appointmentDatesSet = useMemo(
    () => new Set(appointments.map((a) => a.date)),
    [appointments]
  );

  // =========================================================
  // CREATE / EDIT (real API)
  // =========================================================

  const openCreateModal = () => {
    setEditingAppointment(null);
    setFormData({
      ...emptyForm,
      date: toDateStr(selectedDate),
    });
    setShowFormModal(true);
  };

  const openEditModal = (appointment) => {
    setEditingAppointment(appointment);
    setFormData({
      patient_id: appointment.patient?.id ?? appointment.patient_id ?? '',
      date: appointment.date || '',
      time: (appointment.time || '').slice(0, 5),
      notes: appointment.notes || '',
      status: appointment.status || 'scheduled',
    });
    setShowFormModal(true);
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    if (!formData.patient_id || !formData.date || !formData.time) {
      toast.error('Please select a patient, date and time.');
      return;
    }

    if (!currentDoctorId) {
      toast.error('Could not identify your doctor profile. Please re-login and try again.');
      return;
    }

    const payload = {
      patient_id: Number(formData.patient_id),
      doctor_id: currentDoctorId,
      date: formData.date,
      time: formData.time,
      status: formData.status,
      notes: formData.notes,
    };

    try {
      setSaving(true);

      if (editingAppointment) {
        const response = await api.put(
          `/appointments/${editingAppointment.id}`,
          payload
        );
        const updated = response.data;
        setAppointments((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        );
        toast.success('✅ Appointment updated');
      } else {
        const response = await api.post('/appointments', payload);
        const created = response.data;
        setAppointments((prev) => [created, ...prev]);
        toast.success('✅ Appointment created');
      }

      setShowFormModal(false);
      setEditingAppointment(null);
      setFormData(emptyForm);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.errors?.[Object.keys(error.response?.data?.errors || {})[0]]?.[0] ||
          'Failed to save appointment.'
      );
    } finally {
      setSaving(false);
    }
  };

  // ===== UPDATE STATUS (real API) =====
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await api.put(`/appointments/${id}`, { status: newStatus });
      const updated = response.data;
      setAppointments((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setSelectedAppointment(updated);
      toast.success(`✅ Status updated to ${getStatusLabel(newStatus)}`);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to update status.'
      );
    }
  };

  // ===== DELETE (real API) =====
  const deleteAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast.success('❌ Appointment deleted');
      setShowDetailModal(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || 'Failed to delete appointment.'
      );
    }
  };

  // =========================================================
  // CALENDAR NAVIGATION
  // =========================================================

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  const selectDate = (day) => {
    setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = toDateStr(date);
      const hasAppt = appointmentDatesSet.has(dateStr);
      const isToday =
        day === new Date().getDate() &&
        month === new Date().getMonth() &&
        year === new Date().getFullYear();
      const isSelected =
        day === selectedDate.getDate() &&
        month === selectedDate.getMonth() &&
        year === selectedDate.getFullYear();

      days.push(
        <div
          key={day}
          onClick={() => selectDate(day)}
          className={`
            h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all text-sm font-medium relative
            ${isToday ? 'border-2 border-[#0EA5A5]' : ''}
            ${isSelected ? 'bg-[#0EA5A5] text-white' : 'hover:bg-[#F2F8FB]'}
            ${hasAppt && !isSelected ? 'bg-[#0EA5A5]/10' : ''}
          `}
        >
          {day}
          {hasAppt && !isSelected && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#0EA5A5] rounded-full"></span>
          )}
        </div>
      );
    }

    return days;
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[#2B2B2B]">📅 My Appointments</h2>
          <p className="text-[#5B6B72] text-sm">Manage your appointments</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            title="Refresh"
            className="p-2.5 border border-gray-200 rounded-lg hover:bg-[#F2F8FB] transition-all"
          >
            <ArrowPathIcon className={`w-5 h-5 text-[#5B6B72] ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="bg-[#0EA5A5] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0B7A7A] transition-all flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" />
            New Appointment
          </button>
        </div>
      </div>

      {/* Calendar and Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={prevMonth} className="p-2 hover:bg-[#F2F8FB] rounded-lg transition-all">
                <ChevronLeftIcon className="w-5 h-5 text-[#5B6B72]" />
              </button>
              <span className="text-lg font-heading font-semibold text-[#2B2B2B]">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </span>
              <button onClick={nextMonth} className="p-2 hover:bg-[#F2F8FB] rounded-lg transition-all">
                <ChevronRightIcon className="w-5 h-5 text-[#5B6B72]" />
              </button>
            </div>
            <button onClick={goToToday} className="text-sm text-[#0EA5A5] hover:underline font-medium">
              Today
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <div key={day} className="text-center text-sm font-semibold text-[#5B6B72] py-2">
                {day}
              </div>
            ))}
            {renderCalendar()}
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-[#2B2B2B]">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
            <span className="text-sm text-[#5B6B72]">{selectedDateAppointments.length} appointments</span>
          </div>

          <div className="space-y-3 max-h-[440px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-[#5B6B72]">Loading...</div>
            ) : selectedDateAppointments.length === 0 ? (
              <div className="text-center py-8 text-[#5B6B72]">
                <div className="text-4xl mb-2">📅</div>
                <p>No appointments for this day</p>
                <button onClick={openCreateModal} className="text-[#0EA5A5] hover:underline text-sm mt-2">
                  Add appointment →
                </button>
              </div>
            ) : (
              selectedDateAppointments.map((appointment) => (
                <div key={appointment.id} className="p-3 bg-[#F2F8FB] rounded-lg hover:shadow-md transition-all">
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        setSelectedAppointment(appointment);
                        setShowDetailModal(true);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#2B2B2B] truncate">
                          {getPatientDisplayName(appointment)}
                        </span>
                        <span className={`badge ${getStatusBadgeClass(appointment.status)} text-xs`}>
                          {getStatusLabel(appointment.status)}
                        </span>
                      </div>
                      <div className="text-sm text-[#5B6B72] mt-0.5">
                        <span className="font-mono-amount">{(appointment.time || '').slice(0, 5)}</span>
                        <span className="mx-2">·</span>
                        {getPatientCode(appointment)}
                      </div>
                    </div>

                    {/* View + Edit actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedAppointment(appointment);
                          setShowDetailModal(true);
                        }}
                        className="p-1.5 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all"
                        title="View"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(appointment)}
                        className="p-1.5 text-[#5B6B72] hover:bg-gray-200 rounded-lg transition-all"
                        title="Edit"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ===== CREATE / EDIT APPOINTMENT MODAL ===== */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-heading font-bold text-[#2B2B2B]">
                {editingAppointment ? '✏️ Edit Appointment' : '➕ New Appointment'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-6 h-6 text-[#5B6B72]" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Patient *</label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="">Select a patient...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {(p.full_name || p.name)} — {p.patient_code || p.patient_id || `PAT-${p.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Time *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
              </div>

              {editingAppointment && (
                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="input-field"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{getStatusLabel(s)}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input-field"
                  rows="3"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 bg-gray-100 text-[#2B2B2B] py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#0EA5A5] text-white py-2.5 rounded-xl font-medium hover:bg-[#0B7A7A] transition-all disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingAppointment ? 'Save Changes' : 'Add Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DETAIL MODAL ===== */}
      {showDetailModal && selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-heading font-bold text-[#2B2B2B]">📋 Appointment Details</h3>
                <p className="text-sm text-[#5B6B72]">{getPatientCode(selectedAppointment)}</p>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <XMarkIcon className="w-6 h-6 text-[#5B6B72]" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-[#F2F8FB] rounded-xl p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-[#5B6B72] flex items-center gap-1"><UserIcon className="w-3.5 h-3.5" /> Patient</span>
                    <div className="font-medium">{getPatientDisplayName(selectedAppointment)}</div>
                  </div>
                  <div>
                    <span className="text-[#5B6B72]">ID</span>
                    <div className="font-medium">{getPatientCode(selectedAppointment)}</div>
                  </div>
                  <div>
                    <span className="text-[#5B6B72] flex items-center gap-1"><PhoneIcon className="w-3.5 h-3.5" /> Phone</span>
                    <div className="font-medium">{getPatientPhone(selectedAppointment)}</div>
                  </div>
                  <div>
                    <span className="text-[#5B6B72] flex items-center gap-1"><CalendarIcon className="w-3.5 h-3.5" /> Date</span>
                    <div className="font-medium">{selectedAppointment.date}</div>
                  </div>
                  <div>
                    <span className="text-[#5B6B72] flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" /> Time</span>
                    <div className="font-medium">{(selectedAppointment.time || '').slice(0, 5)}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[#5B6B72]">Status</span>
                    <div>
                      <span className={getStatusBadgeClass(selectedAppointment.status)}>
                        {getStatusLabel(selectedAppointment.status)}
                      </span>
                    </div>
                  </div>
                  {selectedAppointment.notes && (
                    <div className="col-span-2">
                      <span className="text-[#5B6B72]">Notes</span>
                      <div className="font-medium">{selectedAppointment.notes}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update */}
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] block mb-2">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(selectedAppointment.id, status)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedAppointment.status === status
                          ? 'bg-[#0EA5A5] text-white'
                          : 'bg-gray-100 text-[#5B6B72] hover:bg-gray-200'
                      }`}
                    >
                      {getStatusLabel(status)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(selectedAppointment);
                  }}
                  className="flex-1 bg-gray-100 text-[#2B2B2B] py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => deleteAppointment(selectedAppointment.id)}
                  className="flex-1 bg-[#E5484D] text-white py-2.5 rounded-xl font-medium hover:bg-red-600 transition-all"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments;