// src/contexts/AppointmentsContext.jsx

import React, {
  createContext,
  useState,
  useContext,
  useCallback,
} from 'react';

import api from '../api/axios';
import { toast } from 'react-hot-toast';

const AppointmentsContext =
  createContext(null);

export const AppointmentsProvider = ({
  children,
}) => {
  const [appointments, setAppointments] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [
    selectedAppointment,
    setSelectedAppointment,
  ] = useState(null);

  const getErrorMessage = (
    error,
    fallback
  ) => {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.response?.data?.error) {
      return error.response.data.error;
    }

    if (error?.response?.data?.errors) {
      const errors =
        error.response.data.errors;

      const firstError = Object.values(
        errors
      )[0];

      if (
        Array.isArray(firstError) &&
        firstError.length
      ) {
        return firstError[0];
      }
    }

    if (error?.response?.status) {
      return `${fallback} (HTTP ${error.response.status})`;
    }

    if (error?.message) {
      return `${fallback}: ${error.message}`;
    }

    return fallback;
  };

  const normalizeAppointmentsResponse = (
    response
  ) => {
    const data = response?.data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.appointments)) {
      return data.appointments;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    if (Array.isArray(data?.results)) {
      return data.results;
    }

    return [];
  };

  /*
   * FETCH
   */

  const fetchAppointments = useCallback(
    async (filters = {}) => {
      setLoading(true);

      try {
        const params = new URLSearchParams();

        Object.entries(filters || {}).forEach(
          ([key, value]) => {
            if (
              value !== undefined &&
              value !== null &&
              value !== ''
            ) {
              params.append(key, value);
            }
          }
        );

        const query =
          params.toString();

        const url = query
          ? `/appointments?${query}`
          : '/appointments';

        const response =
          await api.get(url);

        const data =
          normalizeAppointmentsResponse(
            response
          );

        setAppointments(data);

        return data;
      } catch (error) {
        console.error(
          '[Appointments] Fetch error:',
          error
        );

        toast.error(
          getErrorMessage(
            error,
            'Failed to load appointments'
          )
        );

        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  /*
   * GET BY DATE
   */

  const getAppointmentsForDate =
    useCallback(async (date) => {
      try {
        const response =
          await api.get(
            `/appointments/date/${date}`
          );

        return normalizeAppointmentsResponse(
          response
        );
      } catch (error) {
        console.error(
          '[Appointments] Date fetch error:',
          error
        );

        return [];
      }
    }, []);

  /*
   * CREATE
   */

  const createAppointment =
    useCallback(
      async (appointmentData) => {
        try {
          const response =
            await api.post(
              '/appointments',
              appointmentData
            );

          const newAppointment =
            response.data?.appointment ||
            response.data?.data ||
            response.data;

          setAppointments((prev) => [
            ...prev,
            newAppointment,
          ]);

          toast.success(
            `Appointment scheduled for ${
              newAppointment?.patient?.name ||
              newAppointment?.patient_name ||
              appointmentData?.patient_name ||
              'patient'
            }`
          );

          return newAppointment;
        } catch (error) {
          console.error(
            '[Appointments] Create error:',
            error
          );

          toast.error(
            getErrorMessage(
              error,
              'Failed to create appointment'
            )
          );

          return null;
        }
      },
      []
    );

  /*
   * CREATE RECURRING
   */

  const createRecurringAppointments =
    useCallback(
      async (
        baseAppointment,
        count = 4
      ) => {
        try {
          const response =
            await api.post(
              '/appointments/recurring',
              {
                ...baseAppointment,
                count,
              }
            );

          const data =
            response.data;

          const newAppointments =
            Array.isArray(data)
              ? data
              : Array.isArray(
                  data?.appointments
                )
              ? data.appointments
              : Array.isArray(data?.data)
              ? data.data
              : [];

          setAppointments((prev) => [
            ...prev,
            ...newAppointments,
          ]);

          toast.success(
            `${newAppointments.length} appointments created`
          );

          return newAppointments;
        } catch (error) {
          console.error(
            '[Appointments] Recurring error:',
            error
          );

          toast.error(
            getErrorMessage(
              error,
              'Failed to create recurring appointments'
            )
          );

          return [];
        }
      },
      []
    );

  /*
   * UPDATE
   */

  const updateAppointment =
    useCallback(
      async (id, appointmentData) => {
        try {
          const response =
            await api.put(
              `/appointments/${id}`,
              appointmentData
            );

          const updated =
            response.data?.appointment ||
            response.data?.data ||
            response.data;

          setAppointments((prev) =>
            prev.map((appointment) =>
              String(appointment.id) ===
              String(id)
                ? updated
                : appointment
            )
          );

          setSelectedAppointment(
            (current) =>
              current &&
              String(current.id) ===
                String(id)
                ? updated
                : current
          );

          toast.success(
            'Appointment updated successfully'
          );

          return updated;
        } catch (error) {
          console.error(
            '[Appointments] Update error:',
            error
          );

          toast.error(
            getErrorMessage(
              error,
              'Failed to update appointment'
            )
          );

          return null;
        }
      },
      []
    );

  /*
   * UPDATE STATUS
   */

  const updateAppointmentStatus =
    useCallback(
      async (id, status) => {
        try {
          const response =
            await api.patch(
              `/appointments/${id}/status`,
              { status }
            );

          const updated =
            response.data?.appointment ||
            response.data?.data ||
            response.data;

          setAppointments((prev) =>
            prev.map((appointment) =>
              String(appointment.id) ===
              String(id)
                ? updated
                : appointment
            )
          );

          setSelectedAppointment(
            (current) =>
              current &&
              String(current.id) ===
                String(id)
                ? updated
                : current
          );

          toast.success(
            `Status updated to ${status}`
          );

          return updated;
        } catch (error) {
          console.error(
            '[Appointments] Status error:',
            error
          );

          toast.error(
            getErrorMessage(
              error,
              'Failed to update status'
            )
          );

          return null;
        }
      },
      []
    );

  /*
   * DELETE
   */

  const deleteAppointment =
    useCallback(async (id) => {
      try {
        await api.delete(
          `/appointments/${id}`
        );

        setAppointments((prev) =>
          prev.filter(
            (appointment) =>
              String(appointment.id) !==
              String(id)
          )
        );

        setSelectedAppointment(
          (current) =>
            current &&
            String(current.id) ===
              String(id)
              ? null
              : current
        );

        toast.success(
          'Appointment deleted successfully'
        );

        return true;
      } catch (error) {
        console.error(
          '[Appointments] Delete error:',
          error
        );

        toast.error(
          getErrorMessage(
            error,
            'Failed to delete appointment'
          )
        );

        return false;
      }
    }, []);

  /*
   * CHECK CONFLICTS
   */

  const checkConflicts =
    useCallback(
      async (
        doctorId,
        date,
        time,
        excludeId = null
      ) => {
        try {
          const response =
            await api.get(
              '/appointments/conflicts',
              {
                params: {
                  doctor_id:
                    doctorId,
                  date,
                  time,
                  exclude_id:
                    excludeId,
                },
              }
            );

          return response.data;
        } catch (error) {
          console.error(
            '[Appointments] Conflict error:',
            error
          );

          return {
            hasConflict: false,
          };
        }
      },
      []
    );

  return (
    <AppointmentsContext.Provider
      value={{
        appointments,
        loading,
        selectedAppointment,
        setSelectedAppointment,

        fetchAppointments,
        getAppointmentsForDate,

        createAppointment,
        createRecurringAppointments,

        updateAppointment,
        updateAppointmentStatus,

        deleteAppointment,

        checkConflicts,
      }}
    >
      {children}
    </AppointmentsContext.Provider>
  );
};

export const useAppointments =
  () => {
    const context =
      useContext(
        AppointmentsContext
      );

    if (!context) {
      throw new Error(
        'useAppointments must be used within an AppointmentsProvider'
      );
    }

    return context;
  };