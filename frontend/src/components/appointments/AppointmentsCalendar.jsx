// src/components/Appointments/AppointmentsCalendar.jsx

import React, {
  useState,
  useMemo,
  useEffect,
} from 'react';

import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  EyeIcon,
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  UserPlusIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import { toast } from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import { usePatients } from '../../contexts/PatientsContext';
import { useAppointments } from '../../contexts/AppointmentsContext';

import api from '../../api/axios';

import AppointmentDetailModal from './AppointmentDetailModal';
import PatientSearchInput from './PatientSearchInput';
import AddPatientModal from './AddPatientModal';

import {
  STATUS_CONFIG,
  getAvatarStyle,
  formatTime,
  toDateStr,
  getInitials,
} from '../../lib/patientUtils';

const WEEKDAY_ABBR = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
];

const StatusBadge = ({ status }) => {
  const cfg =
    STATUS_CONFIG[status] || {
      label: status || 'Unknown',
      dot: 'bg-gray-400',
      text: 'text-gray-600',
      bg: 'bg-gray-100',
    };

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1.5
        px-2.5
        py-1
        rounded-full
        text-xs
        font-medium
        ${cfg.bg}
        ${cfg.text}
      `}
    >
      <span
        className={`
          w-1.5
          h-1.5
          rounded-full
          ${cfg.dot}
        `}
      />

      {cfg.label}
    </span>
  );
};

const inputClass =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/20 focus:border-[#0EA5A5] transition-all';

const RECURRING_OPTIONS = [
  {
    value: 'none',
    label: 'None (One-time)',
  },
  {
    value: 'weekly',
    label: 'Weekly',
  },
  {
    value: 'biweekly',
    label: 'Bi-weekly',
  },
  {
    value: 'monthly',
    label: 'Monthly',
  },
  {
    value: 'quarterly',
    label: 'Quarterly',
  },
];

const normalizeGenderForSelect = (value) => {
  const g = (value || '').toLowerCase();

  if (g === 'male') return 'Male';
  if (g === 'female') return 'Female';
  if (g === 'other') return 'Other';

  return 'Male';
};

const getPatientDisplayName = (appointment) => {
  if (!appointment) return 'Unknown';

  const p = appointment.patient;

  if (p && typeof p === 'object') {
    return (
      p.full_name ||
      p.name ||
      'Unknown'
    );
  }

  return (
    appointment.patient ||
    appointment.patient_name ||
    'Unknown'
  );
};

const getDoctorDisplayName = (appointment) => {
  if (!appointment) return 'Unknown';

  const d = appointment.doctor;

  if (d && typeof d === 'object') {
    return (
      d.full_name ||
      d.name ||
      'Unknown'
    );
  }

  return appointment.doctor || 'Unknown';
};

const normalizeDoctorsResponse = (
  response
) => {
  const data = response?.data;

  const list = Array.isArray(data)
    ? data
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.doctors)
    ? data.doctors
    : [];

  return list.map((d) => ({
    id: d.id,
    name:
      d.full_name ||
      d.name ||
      `Doctor #${d.id}`,
  }));
};

const AppointmentsCalendar = () => {
  // =========================================================
  // PROVIDERS
  // =========================================================

  const { user, hasPermission } = useAuth();

  const {
    patients,
    loading: patientsLoading,
    fetchPatients,
    createPatient,
  } = usePatients();

  const {
    appointments,
    loading: appointmentsLoading,
    fetchAppointments,
    createAppointment,
    createRecurringAppointments,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
  } = useAppointments();

  // =========================================================
  // LOCAL STATE
  // =========================================================

  const [selectedDate, setSelectedDate] =
    useState(new Date());

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [editingAppointment, setEditingAppointment] =
    useState(null);

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  const [showDetailModal, setShowDetailModal] =
    useState(false);

  const [searchQuery, setSearchQuery] =
    useState('');

  const [filterDoctor, setFilterDoctor] =
    useState('all');

  const [filterStatus, setFilterStatus] =
    useState('all');

  const [showPatientRegister, setShowPatientRegister] =
    useState(false);

  const [pendingPatientName, setPendingPatientName] =
    useState('');

  const [selectedPatient, setSelectedPatient] =
    useState(null);

  // =========================================================
  // IMPORTANT PATIENT FIELD STATE
  // =========================================================

  // This is now the single source of truth for exactly
  // what is inside the patient search field.
  const [patientNameValue, setPatientNameValue] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [doctorsList, setDoctorsList] =
    useState([]);

  const [doctorsLoading, setDoctorsLoading] =
    useState(true);

  // =========================================================
  // CONSTANTS
  // =========================================================

  const services = [
    'Root Canal',
    'Teeth Cleaning',
    'Braces Adjustment',
    'X-Ray',
    'Filling',
    'Extraction',
    'Whitening',
    'Checkup',
  ];

  // =========================================================
  // LOAD REAL DATA
  // =========================================================

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      if (cancelled) return;

      setLoading(true);
      setDoctorsLoading(true);

      try {
        const [
          ,
          ,
          doctorsResponse,
        ] = await Promise.all([
          fetchAppointments(),
          fetchPatients(),
          api.get('/doctors'),
        ]);

        if (!cancelled) {
          setDoctorsList(
            normalizeDoctorsResponse(
              doctorsResponse
            )
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            '[AppointmentsCalendar] Failed to load data:',
            error
          );

          toast.error(
            'Failed to load doctors list'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setDoctorsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // =========================================================
  // HELPERS
  // =========================================================

  const getAppointmentsForDate = (date) => {
    const dateStr = toDateStr(date);

    return (appointments || [])
      .filter(
        (appointment) =>
          appointment.date === dateStr
      )
      .sort((a, b) =>
        (a.time || '').localeCompare(
          b.time || ''
        )
      );
  };

  const getPatientById = (patientId) => {
    if (!patientId) return null;

    return (patients || []).find(
      (patient) =>
        patient.patientId === patientId ||
        patient.id === patientId
    );
  };

  const startOfWeek = (d) => {
    const date = new Date(d);

    date.setDate(
      date.getDate() - date.getDay()
    );

    date.setHours(0, 0, 0, 0);

    return date;
  };

  // =========================================================
  // WEEK NAVIGATION
  // =========================================================

  const weekDays = useMemo(() => {
    const start = startOfWeek(
      selectedDate
    );

    return Array.from(
      { length: 7 },
      (_, i) => {
        const d = new Date(start);

        d.setDate(
          d.getDate() + i
        );

        return d;
      }
    );
  }, [selectedDate]);

  const goToPrevWeek = () => {
    const d = new Date(
      selectedDate
    );

    d.setDate(
      d.getDate() - 7
    );

    setSelectedDate(d);
  };

  const goToNextWeek = () => {
    const d = new Date(
      selectedDate
    );

    d.setDate(
      d.getDate() + 7
    );

    setSelectedDate(d);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday =
    toDateStr(selectedDate) ===
    toDateStr(new Date());

  const monthYearLabel =
    selectedDate.toLocaleDateString(
      'en-US',
      {
        month: 'long',
        year: 'numeric',
      }
    );

  const dateLabel =
    selectedDate.toLocaleDateString(
      'en-US',
      {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }
    );

  // =========================================================
  // FILTERED APPOINTMENTS
  // =========================================================

  const dayAppointments = useMemo(() => {
    return getAppointmentsForDate(
      selectedDate
    ).filter((appointment) => {
      const patientName =
        getPatientDisplayName(
          appointment
        );

      const safePatientName =
        String(
          patientName
        ).toLowerCase();

      const safeSearch =
        String(
          searchQuery
        ).toLowerCase();

      const matchesSearch =
        safePatientName.includes(
          safeSearch
        );

      const appointmentDoctorId =
        appointment.doctor?.id ??
        appointment.doctor_id ??
        null;

      const matchesDoctor =
        filterDoctor === 'all' ||
        String(
          appointmentDoctorId
        ) ===
          String(
            filterDoctor
          );

      const matchesStatus =
        filterStatus === 'all' ||
        appointment.status ===
          filterStatus;

      return (
        matchesSearch &&
        matchesDoctor &&
        matchesStatus
      );
    });
  }, [
    appointments,
    selectedDate,
    searchQuery,
    filterDoctor,
    filterStatus,
  ]);

  const allDayAppointments =
    getAppointmentsForDate(
      selectedDate
    );

  const confirmedCount =
    allDayAppointments.filter(
      (appointment) =>
        appointment.status ===
          'confirmed' ||
        appointment.status ===
          'completed'
    ).length;

  const pendingCount =
    allDayAppointments.filter(
      (appointment) =>
        appointment.status ===
          'scheduled' ||
        appointment.status ===
          'waiting'
    ).length;

  const hasActiveFilters =
    searchQuery ||
    filterDoctor !== 'all' ||
    filterStatus !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterDoctor('all');
    setFilterStatus('all');
  };

  // =========================================================
  // PATIENT HANDLERS
  // =========================================================

  const handlePatientSelect = (
    patient
  ) => {
    setSelectedPatient(patient);

    // IMPORTANT:
    // Keep the patient field state synchronized.
    setPatientNameValue(
      patient?.name ||
        patient?.full_name ||
        ''
    );

    if (!patient) return;

    const form =
      document.getElementById(
        'appointmentForm'
      );

    if (!form) return;

    if (form.patientName) {
      form.patientName.value =
        patient.name ||
        patient.full_name ||
        '';
    }

    if (form.phone) {
      form.phone.value =
        patient.phone || '';
    }

    if (form.age) {
      form.age.value =
        patient.age || '';
    }

    if (form.gender) {
      form.gender.value =
        normalizeGenderForSelect(
          patient.gender
        );
    }

    if (form.recurring) {
      form.recurring.value =
        patient.recurring ||
        'none';
    }
  };

  const handleRegisterNewPatient = (
    name
  ) => {
    const cleanName =
      (name || '').trim();

    setPendingPatientName(
      cleanName
    );

    setShowPatientRegister(
      true
    );
  };

  const handleAddPatient = async (
    newPatient
  ) => {
    const created =
      await createPatient(
        newPatient
      );

    if (!created) return;

    setSelectedPatient(
      created
    );

    // IMPORTANT:
    // New registered patient is immediately
    // synchronized with the search field.
    setPatientNameValue(
      created?.name ||
        created?.full_name ||
        ''
    );

    const form =
      document.getElementById(
        'appointmentForm'
      );

    if (form) {
      if (form.patientName) {
        form.patientName.value =
          created.name ||
          created.full_name ||
          '';
      }

      if (form.phone) {
        form.phone.value =
          created.phone || '';
      }

      if (form.age) {
        form.age.value =
          created.age || '';
      }

      if (form.gender) {
        form.gender.value =
          normalizeGenderForSelect(
            created.gender
          );
      }

      if (form.recurring) {
        form.recurring.value =
          created.recurring ||
          'none';
      }
    }

    setShowPatientRegister(
      false
    );

    setPendingPatientName('');
  };

  // =========================================================
  // APPOINTMENT HANDLERS
  // =========================================================

  const handleAppointmentClick = (
    appointment
  ) => {
    const fullPatient =
      getPatientById(
        appointment.patientId ||
          appointment.patient_id
      );

    setSelectedAppointment({
      ...appointment,
      patientData:
        fullPatient,
    });

    setShowDetailModal(
      true
    );
  };

  const openAddModal = () => {
    if (
      !hasPermission(
        'manage_appointments'
      )
    ) {
      toast.error(
        'You do not have permission to create appointments'
      );

      return;
    }

    setEditingAppointment(
      null
    );

    setSelectedPatient(
      null
    );

    // IMPORTANT: clear previous patient name.
    setPatientNameValue('');

    setShowAddModal(
      true
    );
  };

  const openEditModal = (
    appointment
  ) => {
    if (
      !hasPermission(
        'manage_appointments'
      )
    ) {
      toast.error(
        'You do not have permission to edit appointments'
      );

      return;
    }

    const fullPatient =
      getPatientById(
        appointment.patientId ||
          appointment.patient_id
      );

    setEditingAppointment(
      appointment
    );

    setSelectedPatient(
      fullPatient || null
    );

    // IMPORTANT:
    // Pre-fill the controlled patient field
    // with the real patient name.
    setPatientNameValue(
      fullPatient?.name ||
        fullPatient?.full_name ||
        getPatientDisplayName(
          appointment
        ) ||
        ''
    );

    setShowAddModal(
      true
    );
  };

  // =========================================================
  // CLOSE ADD / EDIT MODAL
  // =========================================================

  const closeAddModal = () => {
    setShowAddModal(false);
    setEditingAppointment(null);
    setSelectedPatient(null);
    setPatientNameValue('');
  };

  // =========================================================
  // SAVE APPOINTMENT
  // =========================================================

  const handleSaveAppointment =
    async (e) => {
      e.preventDefault();

      const form =
        e.target;

      const recurringType =
        form.recurring?.value ||
        'none';

      // IMPORTANT:
      // Read patient name from STATE.
      // Do NOT read the old stale defaultValue.
      const patientName =
        patientNameValue
          .trim();

      if (!patientName) {
        toast.error(
          'Please select or enter a patient'
        );

        return;
      }

      const doctorIdValue =
        form.doctor_id?.value ||
        '';

      if (!doctorIdValue) {
        toast.error(
          'Please select a doctor'
        );

        return;
      }

      const patientIdValue =
        selectedPatient?.id ||
        editingAppointment?.patient?.id ||
        editingAppointment?.patient_id ||
        null;

      // IMPORTANT:
      // If the typed patient does not exist,
      // automatically open registration instead
      // of showing the same error forever.
      if (!patientIdValue) {
        toast.error(
          `"${patientName}" isn't registered yet — opening the registration form.`
        );

        handleRegisterNewPatient(
          patientName
        );

        return;
      }

      const baseData = {
        patient_id:
          patientIdValue,

        doctor_id:
          parseInt(
            doctorIdValue,
            10
          ),

        date:
          form.date.value,

        time:
          form.time.value,

        service:
          form.service.value,

        notes:
          form.notes.value ||
          '',

        status:
          editingAppointment?.status ||
          'scheduled',

        patient:
          patientName,

        patient_name:
          patientName,

        phone:
          form.phone.value ||
          '',

        age:
          parseInt(
            form.age.value,
            10
          ) || 0,

        gender:
          form.gender.value ||
          'Not specified',

        recurring:
          recurringType,
      };

      // =====================================================
      // EDIT EXISTING
      // =====================================================

      if (editingAppointment) {
        const updated =
          await updateAppointment(
            editingAppointment.id,
            baseData
          );

        if (updated) {
          closeAddModal();
        }

        return;
      }

      // =====================================================
      // CREATE NEW
      // =====================================================

      let result = null;

      if (
        recurringType !==
        'none'
      ) {
        result =
          await createRecurringAppointments(
            baseData,
            6
          );
      } else {
        result =
          await createAppointment(
            baseData
          );
      }

      if (result) {
        closeAddModal();
      }
    };

  // =========================================================
  // RECURRING LABEL
  // =========================================================

  const getRecurringLabel = (
    type
  ) => {
    const found =
      RECURRING_OPTIONS.find(
        (option) =>
          option.value ===
          type
      );

    return found
      ? found.label
      : 'One-time';
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (
    loading ||
    patientsLoading ||
    appointmentsLoading ||
    doctorsLoading
  ) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0EA5A5]" />
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

        <div>
          <h2 className="text-2xl font-heading font-bold text-[#2B2B2B]">
            Appointments
          </h2>

          <p className="text-[#5B6B72] text-sm">
            Manage your clinic appointments
          </p>
        </div>

        {hasPermission(
          'manage_appointments'
        ) && (
          <button
            onClick={
              openAddModal
            }
            className="inline-flex items-center gap-2 bg-[#0EA5A5] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#0B7A7A] transition-all shadow-sm hover:shadow-md"
          >
            <PlusIcon className="w-5 h-5" />

            New Appointment
          </button>
        )}
      </div>

      {/* =====================================================
          WEEK NAVIGATOR
      ====================================================== */}

      <div className="bg-white rounded-2xl shadow-sm p-4">

        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">

          <div className="flex items-center gap-2">

            <CalendarDaysIcon className="w-5 h-5 text-[#0EA5A5]" />

            <span className="font-heading font-semibold text-[#2B2B2B]">

              {isToday
                ? 'Today'
                : dateLabel}

              <span className="text-[#5B6B72] font-normal">
                {' '}
                · {monthYearLabel}
              </span>

            </span>
          </div>

          <div className="flex items-center gap-2">

            {!isToday && (
              <button
                onClick={
                  goToToday
                }
                className="text-sm text-[#0EA5A5] hover:underline font-medium px-2"
              >
                Jump to Today
              </button>
            )}

            <input
              type="date"
              value={toDateStr(
                selectedDate
              )}
              onChange={(e) => {
                if (
                  !e.target.value
                )
                  return;

                const [
                  y,
                  m,
                  d,
                ] =
                  e.target.value
                    .split('-')
                    .map(
                      Number
                    );

                setSelectedDate(
                  new Date(
                    y,
                    m - 1,
                    d
                  )
                );
              }}
              className="input-field !py-2 !w-auto text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">

          <button
            onClick={
              goToPrevWeek
            }
            className="p-2 hover:bg-[#F2F8FB] rounded-lg transition-all flex-shrink-0"
          >
            <ChevronLeftIcon className="w-5 h-5 text-[#5B6B72]" />
          </button>

          <div className="flex-1 grid grid-cols-7 gap-2">

            {weekDays.map(
              (d) => {
                const count =
                  getAppointmentsForDate(
                    d
                  ).length;

                const active =
                  toDateStr(d) ===
                  toDateStr(
                    selectedDate
                  );

                const today =
                  toDateStr(d) ===
                  toDateStr(
                    new Date()
                  );

                return (
                  <button
                    key={toDateStr(
                      d
                    )}
                    onClick={() =>
                      setSelectedDate(
                        d
                      )
                    }
                    className={`relative flex flex-col items-center py-2.5 rounded-xl transition-all ${
                      active
                        ? 'bg-[#0EA5A5] text-white shadow-sm'
                        : today
                        ? 'bg-[#0EA5A5]/10 text-[#0EA5A5]'
                        : 'text-[#2B2B2B] hover:bg-[#F2F8FB]'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-medium uppercase tracking-wide ${
                        active
                          ? 'text-white/80'
                          : 'text-[#5B6B72]'
                      }`}
                    >
                      {
                        WEEKDAY_ABBR[
                          d.getDay()
                        ]
                      }
                    </span>

                    <span className="text-lg font-heading font-bold leading-tight mt-0.5">
                      {d.getDate()}
                    </span>

                    {count >
                      0 && (
                      <span
                        className={`mt-1 w-1.5 h-1.5 rounded-full ${
                          active
                            ? 'bg-white'
                            : 'bg-[#0EA5A5]'
                        }`}
                      />
                    )}
                  </button>
                );
              }
            )}
          </div>

          <button
            onClick={
              goToNextWeek
            }
            className="p-2 hover:bg-[#F2F8FB] rounded-lg transition-all flex-shrink-0"
          >
            <ChevronRightIcon className="w-5 h-5 text-[#5B6B72]" />
          </button>
        </div>
      </div>

      {/* =====================================================
          QUICK STATS
      ====================================================== */}

      <div className="grid grid-cols-3 gap-4">

        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-[#0EA5A5]/10 flex items-center justify-center flex-shrink-0">
            <CalendarDaysIcon className="w-5 h-5 text-[#0EA5A5]" />
          </div>

          <div>
            <div className="text-xs text-[#5B6B72]">
              Total
            </div>

            <div className="text-xl font-heading font-bold text-[#2B2B2B]">
              {
                allDayAppointments.length
              }
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-[#1FAE6B]/10 flex items-center justify-center flex-shrink-0">
            <CheckCircleIcon className="w-5 h-5 text-[#1FAE6B]" />
          </div>

          <div>
            <div className="text-xs text-[#5B6B72]">
              Confirmed
            </div>

            <div className="text-xl font-heading font-bold text-[#1FAE6B]">
              {confirmedCount}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">

          <div className="w-10 h-10 rounded-full bg-[#E0A400]/10 flex items-center justify-center flex-shrink-0">
            <ClockIcon className="w-5 h-5 text-[#E0A400]" />
          </div>

          <div>
            <div className="text-xs text-[#5B6B72]">
              Pending
            </div>

            <div className="text-xl font-heading font-bold text-[#E0A400]">
              {pendingCount}
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          SEARCH / FILTERS
      ====================================================== */}

      <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col sm:flex-row gap-3">

        <div className="relative flex-1">

          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) =>
              setSearchQuery(
                e.target.value
              )
            }
            placeholder="Search patient name..."
            className="input-field !pl-9"
            autoComplete="off"
            data-lpignore="true"
          />
        </div>

        <select
          value={filterDoctor}
          onChange={(e) =>
            setFilterDoctor(
              e.target.value
            )
          }
          className="input-field sm:w-56"
        >
          <option value="all">
            All Doctors
          </option>

          {doctorsList.map(
            (doctor) => (
              <option
                key={doctor.id}
                value={doctor.id}
              >
                {doctor.name}
              </option>
            )
          )}
        </select>

        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(
              e.target.value
            )
          }
          className="input-field sm:w-44"
        >
          <option value="all">
            All Statuses
          </option>

          {Object.entries(
            STATUS_CONFIG
          ).map(
            ([key, cfg]) => (
              <option
                key={key}
                value={key}
              >
                {cfg.label}
              </option>
            )
          )}
        </select>

        {hasActiveFilters && (
          <button
            onClick={
              clearFilters
            }
            className="text-sm text-[#0EA5A5] hover:underline font-medium px-2 whitespace-nowrap"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* =====================================================
          APPOINTMENT LIST
      ====================================================== */}

      <div className="bg-white rounded-2xl shadow-sm p-6">

        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">

          <h3 className="font-heading font-semibold text-[#2B2B2B]">
            {isToday
              ? "Today's Appointments"
              : `Appointments — ${dateLabel}`}
          </h3>

          <span className="text-sm text-[#5B6B72]">
            {
              dayAppointments.length
            }{' '}
            of{' '}
            {
              allDayAppointments.length
            }
          </span>
        </div>

        <div className="space-y-3">

          {dayAppointments.length ===
          0 ? (
            <div className="text-center py-12 text-[#5B6B72]">

              <div className="w-16 h-16 rounded-full bg-[#0EA5A5]/10 flex items-center justify-center mx-auto mb-3">
                <CalendarDaysIcon className="w-8 h-8 text-[#0EA5A5]/60" />
              </div>

              <p className="font-medium text-[#2B2B2B]">
                {hasActiveFilters
                  ? 'No appointments match your filters'
                  : 'No appointments for this day'}
              </p>

              {hasActiveFilters ? (
                <button
                  onClick={
                    clearFilters
                  }
                  className="text-[#0EA5A5] hover:underline text-sm mt-2"
                >
                  Clear filters
                </button>
              ) : (
                hasPermission(
                  'manage_appointments'
                ) && (
                  <button
                    onClick={
                      openAddModal
                    }
                    className="text-[#0EA5A5] hover:underline text-sm mt-2"
                  >
                    Add appointment →
                  </button>
                )
              )}
            </div>
          ) : (
            dayAppointments.map(
              (appointment) => {
                const patientName =
                  getPatientDisplayName(
                    appointment
                  );

                const doctorName =
                  getDoctorDisplayName(
                    appointment
                  );

                const avatarStyle =
                  getAvatarStyle(
                    patientName
                  );

                const recurringLabel =
                  getRecurringLabel(
                    appointment.recurring
                  );

                return (
                  <div
                    key={
                      appointment.id
                    }
                    onClick={() =>
                      handleAppointmentClick(
                        appointment
                      )
                    }
                    className="group relative flex items-center gap-4 rounded-2xl border border-gray-100 bg-white pl-5 pr-4 py-4 cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
                  >
                    <span
                      className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${
                        STATUS_CONFIG[
                          appointment.status
                        ]?.dot ||
                        'bg-gray-300'
                      }`}
                    />

                    <div className="w-16 flex-shrink-0 text-sm font-semibold text-[#2B2B2B]">
                      {formatTime(
                        appointment.time
                      )}
                    </div>

                    <div
                      className={`w-11 h-11 rounded-full ${avatarStyle.bg} ${avatarStyle.text} flex items-center justify-center font-semibold flex-shrink-0`}
                    >
                      {getInitials(
                        patientName
                      )}
                    </div>

                    <div className="flex-1 min-w-0">

                      <div className="flex items-center gap-2 flex-wrap">

                        <span className="font-semibold text-[#2B2B2B] truncate">
                          {
                            patientName
                          }
                        </span>

                        <StatusBadge
                          status={
                            appointment.status
                          }
                        />

                        {appointment.recurring &&
                          appointment.recurring !==
                            'none' && (
                          <span className="text-[10px] font-medium text-[#6366F1] bg-[#6366F1]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ArrowPathIcon className="w-3 h-3" />

                            {
                              recurringLabel
                            }
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-[#5B6B72] mt-0.5 truncate">
                        {
                          appointment.service
                        }{' '}
                        ·{' '}
                        {
                          doctorName
                        }
                      </div>

                      <div className="text-xs text-[#5B6B72] mt-0.5">
                        {appointment.patient?.patient_code ||
                          appointment.patientId ||
                          appointment.patient_id ||
                          '—'}{' '}
                        ·{' '}
                        {appointment.patient?.age ??
                          appointment.age ??
                          '—'}{' '}
                        yrs ·{' '}
                        {appointment.patient?.gender ||
                          appointment.gender ||
                          '—'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">

                      <button
                        type="button"
                        onClick={(
                          e
                        ) => {
                          e.stopPropagation();

                          handleAppointmentClick(
                            appointment
                          );
                        }}
                        className="p-2 rounded-lg text-[#5B6B72] hover:bg-[#F2F8FB] hover:text-[#0EA5A5] transition-all"
                        title="View details"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>

                      {hasPermission(
                        'manage_appointments'
                      ) && (
                        <button
                          type="button"
                          onClick={(
                            e
                          ) => {
                            e.stopPropagation();

                            openEditModal(
                              appointment
                            );
                          }}
                          className="p-2 rounded-lg text-[#5B6B72] hover:bg-[#F2F8FB] hover:text-[#0EA5A5] transition-all"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }
            )
          )}
        </div>
      </div>

      {/* =====================================================
          ADD / EDIT APPOINTMENT MODAL
      ====================================================== */}

      {showAddModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4"
          onClick={
            closeAddModal
          }
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">

              <div>
                <h2 className="text-lg font-semibold text-[#2B2B2B] flex items-center gap-2">

                  <PlusIcon className="w-5 h-5 text-[#0EA5A5]" />

                  {editingAppointment
                    ? 'Edit Appointment'
                    : 'New Appointment'}
                </h2>

                <p className="text-sm text-[#5B6B72] mt-0.5">
                  {editingAppointment
                    ? "Update this patient's visit details."
                    : 'Schedule a visit for a patient.'}
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeAddModal
                }
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form
              id="appointmentForm"
              onSubmit={
                handleSaveAppointment
              }
              className="p-6"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">

                {/* PATIENT */}

                <div className="md:col-span-2">

                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                    Patient *{' '}
                    <span className="text-xs text-[#5B6B72] font-normal">
                      (search existing or register new)
                    </span>
                  </label>

                  <div className="flex gap-2">

                    <div className="flex-1">

                      <PatientSearchInput
                        patients={
                          patients
                        }
                        onSelectPatient={
                          handlePatientSelect
                        }
                        onRegisterNew={
                          handleRegisterNewPatient
                        }
                        onQueryChange={
                          setPatientNameValue
                        }
                        value={
                          patientNameValue
                        }
                        placeholder="Search for existing patient..."
                        required
                      />

                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPendingPatientName(
                          patientNameValue
                        );

                        setShowPatientRegister(
                          true
                        );
                      }}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 bg-[#0EA5A5]/10 text-[#0EA5A5] rounded-lg text-sm font-medium hover:bg-[#0EA5A5]/20 transition-all"
                      title="Register new patient"
                    >
                      <UserPlusIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* CONTROLLED HIDDEN FIELD */}

                  <input
                    type="hidden"
                    name="patientName"
                    value={
                      patientNameValue
                    }
                    readOnly
                    required
                  />
                </div>

                {/* PHONE */}

                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                    Phone
                  </label>

                  <input
                    type="text"
                    name="phone"
                    defaultValue={
                      editingAppointment?.patient?.phone ||
                      editingAppointment?.phone ||
                      ''
                    }
                    className={
                      inputClass
                    }
                    placeholder="+251 91 234 5678"
                  />
                </div>

                {/* AGE / GENDER */}

                <div className="grid grid-cols-2 gap-4">

                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                      Age
                    </label>

                    <input
                      type="number"
                      name="age"
                      defaultValue={
                        editingAppointment?.patient?.age ??
                        editingAppointment?.age ??
                        ''
                      }
                      className={
                        inputClass
                      }
                      placeholder="35"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                      Gender
                    </label>

                    <select
                      name="gender"
                      defaultValue={normalizeGenderForSelect(
                        editingAppointment?.patient?.gender ||
                          editingAppointment?.gender
                      )}
                      className={
                        inputClass
                      }
                    >
                      <option value="Male">
                        Male
                      </option>

                      <option value="Female">
                        Female
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </div>
                </div>

                {/* DOCTOR */}

                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                    Doctor *
                  </label>

                  <select
                    name="doctor_id"
                    defaultValue={
                      editingAppointment?.doctor?.id ||
                      editingAppointment?.doctor_id ||
                      (doctorsList[0]?.id ??
                        '')
                    }
                    className={
                      inputClass
                    }
                    required
                  >
                    {doctorsList.length ===
                      0 && (
                      <option value="">
                        No doctors found
                      </option>
                    )}

                    {doctorsList.map(
                      (doctor) => (
                        <option
                          key={
                            doctor.id
                          }
                          value={
                            doctor.id
                          }
                        >
                          {
                            doctor.name
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* SERVICE */}

                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                    Service *
                  </label>

                  <select
                    name="service"
                    defaultValue={
                      editingAppointment?.service ||
                      services[0]
                    }
                    className={
                      inputClass
                    }
                    required
                  >
                    {services.map(
                      (service) => (
                        <option
                          key={
                            service
                          }
                          value={
                            service
                          }
                        >
                          {
                            service
                          }
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* DATE */}

                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                    Date *
                  </label>

                  <input
                    type="date"
                    name="date"
                    defaultValue={
                      editingAppointment?.date ||
                      toDateStr(
                        selectedDate
                      )
                    }
                    className={
                      inputClass
                    }
                    required
                  />
                </div>

                {/* TIME */}

                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                    Time *
                  </label>

                  <input
                    type="time"
                    name="time"
                    defaultValue={
                      editingAppointment?.time ||
                      '09:00'
                    }
                    className={
                      inputClass
                    }
                    required
                  />
                </div>

                {/* RECURRING */}

                <div className="md:col-span-2">

                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                    Recurring Visit

                    <span className="text-xs text-[#5B6B72] ml-2">
                      (For regular patients)
                    </span>
                  </label>

                  <select
                    name="recurring"
                    defaultValue={
                      editingAppointment?.recurring ||
                      'none'
                    }
                    className={
                      inputClass
                    }
                  >
                    {RECURRING_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {
                            option.label
                          }
                        </option>
                      )
                    )}
                  </select>

                  <p className="text-xs text-[#5B6B72] mt-1">
                    <ArrowPathIcon className="w-3 h-3 inline mr-1" />

                    Creates a series of appointments at the selected interval
                  </p>
                </div>

                {/* NOTES */}

                <div className="md:col-span-2">

                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                    Notes
                  </label>

                  <textarea
                    name="notes"
                    defaultValue={
                      editingAppointment?.notes ||
                      ''
                    }
                    className={
                      inputClass
                    }
                    rows="3"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">

                <button
                  type="button"
                  onClick={
                    closeAddModal
                  }
                  className="px-5 py-2.5 rounded-lg font-medium text-sm text-[#2B2B2B] border border-gray-300 hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] transition-all"
                >
                  {editingAppointment
                    ? 'Update Appointment'
                    : 'Add Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================
          PATIENT REGISTRATION MODAL
      ====================================================== */}

      {showPatientRegister && (
        <AddPatientModal
          onAdd={
            handleAddPatient
          }
          onClose={() => {
            setShowPatientRegister(
              false
            );

            setPendingPatientName(
              ''
            );
          }}
          defaultName={
            pendingPatientName
          }
        />
      )}

      {/* =====================================================
          APPOINTMENT DETAIL MODAL
      ====================================================== */}

      {showDetailModal &&
        selectedAppointment && (
          <AppointmentDetailModal
            appointment={
              selectedAppointment
            }
            onClose={() =>
              setShowDetailModal(
                false
              )
            }
            onUpdateStatus={
              updateAppointmentStatus
            }
            onDelete={
              deleteAppointment
            }
            patients={
              patients
            }
          />
        )}
    </div>
  );
};

export default AppointmentsCalendar;