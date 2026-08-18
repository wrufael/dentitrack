// src/components/Appointments/AppointmentList.jsx

import React, { useMemo, useState } from 'react';
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  ClockIcon,
  CalendarDaysIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

import AppointmentDetailModal from './AppointmentDetailModal';
import { useAppointments } from '../../contexts/AppointmentsContext';
import { STATUS_CONFIG, formatTime, getInitials } from '../../lib/patientUtils';

const AppointmentList = ({
  appointments: appointmentsProp,
  patients = [],
  onEdit,
}) => {
  const {
    appointments: contextAppointments,
    updateAppointment,
    updateAppointmentStatus,
    deleteAppointment,
  } = useAppointments();

  const appointments = appointmentsProp || contextAppointments || [];

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  /*
   * ---------------------------------------------------------
   * Normalize patient information
   * ---------------------------------------------------------
   *
   * Laravel returns:
   *
   * appointment.patient
   *
   * but older frontend data may contain:
   *
   * patient_name
   * patient
   * patientId
   */

  const getPatient = (appointment) => {
    if (!appointment) return null;

    // Real Laravel relationship
    if (appointment.patient && typeof appointment.patient === 'object') {
      return appointment.patient;
    }

    // Patient list passed from parent
    const patientId =
      appointment.patient_id ||
      appointment.patientId;

    const found = patients.find(
      (patient) =>
        String(patient.id) === String(patientId) ||
        String(patient.patientId) === String(patientId)
    );

    if (found) {
      return found;
    }

    // Fallback
    return {
      id: patientId,
      patientId: patientId,
      name:
        appointment.patient_name ||
        (typeof appointment.patient === 'string'
          ? appointment.patient
          : 'Unknown Patient'),
      age: appointment.age,
      gender: appointment.gender,
      phone: appointment.phone,
      email: appointment.email,
      address: appointment.address,
      notes: appointment.notes,
    };
  };

  /*
   * ---------------------------------------------------------
   * Open details
   * ---------------------------------------------------------
   */

  const handleView = (appointment) => {
    setSelectedAppointment(appointment);
    setShowDetails(true);
  };

  /*
   * ---------------------------------------------------------
   * Edit
   * ---------------------------------------------------------
   */

  const handleEdit = (appointment) => {
    if (onEdit) {
      onEdit(appointment);
      return;
    }

    setSelectedAppointment(appointment);
    setShowDetails(true);
  };

  /*
   * ---------------------------------------------------------
   * Delete
   * ---------------------------------------------------------
   */

  const handleDelete = async (appointment) => {
    const patient = getPatient(appointment);

    const patientName =
      patient?.name ||
      patient?.full_name ||
      patient?.fullName ||
      'this patient';

    const confirmed = window.confirm(
      `Delete the appointment for ${patientName}?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    const success = await deleteAppointment(appointment.id);

    if (success) {
      if (
        selectedAppointment &&
        String(selectedAppointment.id) === String(appointment.id)
      ) {
        setSelectedAppointment(null);
        setShowDetails(false);
      }

      toast.success('Appointment deleted successfully');
    }
  };

  /*
   * ---------------------------------------------------------
   * Update status
   * ---------------------------------------------------------
   */

  const handleStatusChange = async (appointment, status) => {
    const updated = await updateAppointmentStatus(
      appointment.id,
      status
    );

    if (updated) {
      if (
        selectedAppointment &&
        String(selectedAppointment.id) === String(appointment.id)
      ) {
        setSelectedAppointment(updated);
      }
    }
  };

  /*
   * ---------------------------------------------------------
   * Group/sort appointments
   * ---------------------------------------------------------
   */

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const dateA = `${a.date || ''} ${a.time || ''}`;
      const dateB = `${b.date || ''} ${b.time || ''}`;

      return dateA.localeCompare(dateB);
    });
  }, [appointments]);

  /*
   * ---------------------------------------------------------
   * Empty state
   * ---------------------------------------------------------
   */

  if (!sortedAppointments.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
        <CalendarDaysIcon className="w-12 h-12 mx-auto text-gray-300" />

        <h3 className="mt-3 text-sm font-semibold text-gray-800">
          No appointments found
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Appointments you create will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F2F8FB] border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-[#5B6B72]">
                  Patient
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-[#5B6B72]">
                  Date & Time
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-[#5B6B72]">
                  Doctor
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-[#5B6B72]">
                  Service
                </th>

                <th className="text-left px-5 py-3 text-xs font-semibold text-[#5B6B72]">
                  Status
                </th>

                <th className="text-right px-5 py-3 text-xs font-semibold text-[#5B6B72]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {sortedAppointments.map((appointment) => {
                const patient = getPatient(appointment);

                const patientName =
                  patient?.name ||
                  patient?.full_name ||
                  patient?.fullName ||
                  'Unknown Patient';

                const patientId =
                  patient?.patientId ||
                  patient?.patient_id ||
                  patient?.id ||
                  appointment.patient_id ||
                  appointment.patientId ||
                  'N/A';

                const statusConfig =
                  STATUS_CONFIG[appointment.status] || {
                    label: appointment.status || 'Scheduled',
                    dot: 'bg-gray-400',
                    text: 'text-gray-600',
                    bg: 'bg-gray-100',
                  };

                return (
                  <tr
                    key={appointment.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* PATIENT - CLICKABLE */}
                    <td className="px-5 py-4">
                      <button
                        type="button"
                        onClick={() => handleView(appointment)}
                        className="flex items-center gap-3 text-left group"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#0EA5A5] flex items-center justify-center text-white text-sm font-semibold shrink-0">
                          {getInitials(patientName)}
                        </div>

                        <div>
                          <div className="font-semibold text-[#2B2B2B] group-hover:text-[#0EA5A5] transition-colors">
                            {patientName}
                          </div>

                          <div className="text-xs text-[#5B6B72]">
                            ID: {patientId}
                          </div>
                        </div>
                      </button>
                    </td>

                    {/* DATE/TIME */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-[#2B2B2B]">
                        <CalendarDaysIcon className="w-4 h-4 text-[#0EA5A5]" />
                        {appointment.date || 'N/A'}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-[#5B6B72] mt-1">
                        <ClockIcon className="w-4 h-4" />
                        {appointment.time
                          ? formatTime(appointment.time)
                          : 'N/A'}
                      </div>
                    </td>

                    {/* DOCTOR */}
                    <td className="px-5 py-4">
                      <div className="text-sm font-medium text-[#2B2B2B]">
                        {appointment.doctor?.name ||
                          appointment.doctor_name ||
                          appointment.doctor ||
                          'N/A'}
                      </div>
                    </td>

                    {/* SERVICE */}
                    <td className="px-5 py-4">
                      <div className="text-sm text-[#2B2B2B]">
                        {appointment.service ||
                          appointment.treatment ||
                          'General Consultation'}
                      </div>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <select
                        value={appointment.status || 'scheduled'}
                        onChange={(e) =>
                          handleStatusChange(
                            appointment,
                            e.target.value
                          )
                        }
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border-0 cursor-pointer ${statusConfig.bg} ${statusConfig.text}`}
                      >
                        {Object.entries(STATUS_CONFIG).map(
                          ([key, config]) => (
                            <option key={key} value={key}>
                              {config.label}
                            </option>
                          )
                        )}
                      </select>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-4">
                      <div className="flex justify-end items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleView(appointment)
                          }
                          title="View patient information"
                          className="p-2 rounded-lg text-[#0EA5A5] hover:bg-[#0EA5A5]/10 transition-all"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleEdit(appointment)
                          }
                          title="Edit appointment"
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all"
                        >
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(appointment)
                          }
                          title="Delete appointment"
                          className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-all"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {sortedAppointments.map((appointment) => {
            const patient = getPatient(appointment);

            const patientName =
              patient?.name ||
              patient?.full_name ||
              patient?.fullName ||
              'Unknown Patient';

            const patientId =
              patient?.patientId ||
              patient?.patient_id ||
              patient?.id ||
              appointment.patient_id ||
              appointment.patientId ||
              'N/A';

            const statusConfig =
              STATUS_CONFIG[appointment.status] || {
                label: appointment.status || 'Scheduled',
                dot: 'bg-gray-400',
                text: 'text-gray-600',
                bg: 'bg-gray-100',
              };

            return (
              <div
                key={appointment.id}
                className="p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleView(appointment)
                    }
                    className="flex items-center gap-3 text-left"
                  >
                    <div className="w-11 h-11 rounded-full bg-[#0EA5A5] flex items-center justify-center text-white font-semibold shrink-0">
                      {getInitials(patientName)}
                    </div>

                    <div>
                      <div className="font-semibold text-[#2B2B2B]">
                        {patientName}
                      </div>

                      <div className="text-xs text-[#5B6B72]">
                        ID: {patientId}
                      </div>
                    </div>
                  </button>

                  <select
                    value={appointment.status || 'scheduled'}
                    onChange={(e) =>
                      handleStatusChange(
                        appointment,
                        e.target.value
                      )
                    }
                    className={`px-2 py-1 rounded-lg text-xs font-medium border-0 ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    {Object.entries(STATUS_CONFIG).map(
                      ([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-[#5B6B72]">
                    <CalendarDaysIcon className="w-4 h-4" />
                    {appointment.date || 'N/A'}
                    <ClockIcon className="w-4 h-4 ml-2" />
                    {appointment.time
                      ? formatTime(appointment.time)
                      : 'N/A'}
                  </div>

                  <div className="flex items-center gap-2 text-[#5B6B72]">
                    <UserIcon className="w-4 h-4" />
                    {appointment.doctor?.name ||
                      appointment.doctor_name ||
                      appointment.doctor ||
                      'No doctor'}
                  </div>

                  <div className="text-[#2B2B2B]">
                    {appointment.service ||
                      appointment.treatment ||
                      'General Consultation'}
                  </div>
                </div>

                <div className="flex justify-end gap-1 mt-4">
                  <button
                    type="button"
                    onClick={() =>
                      handleView(appointment)
                    }
                    className="p-2 rounded-lg text-[#0EA5A5] hover:bg-[#0EA5A5]/10"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleEdit(appointment)
                    }
                    className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(appointment)
                    }
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAIL MODAL */}
      {showDetails && selectedAppointment && (
        <AppointmentDetailModal
          appointment={selectedAppointment}
          patients={patients}
          onClose={() => {
            setShowDetails(false);
            setSelectedAppointment(null);
          }}
          onUpdateStatus={async (id, status) => {
            const updated =
              await updateAppointmentStatus(id, status);

            if (updated) {
              setSelectedAppointment(updated);
            }
          }}
          onUpdateAppointment={async (id, data) => {
            const updated =
              await updateAppointment(id, data);

            if (updated) {
              setSelectedAppointment(updated);
            }

            return updated;
          }}
          onDelete={async (id) => {
            const success =
              await deleteAppointment(id);

            if (success) {
              setShowDetails(false);
              setSelectedAppointment(null);
            }
          }}
        />
      )}
    </>
  );
};

export default AppointmentList;