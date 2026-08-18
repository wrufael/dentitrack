// src/components/cashier/CashierAppointments.jsx
//
// This used to be a standalone mock module: it stored appointments in
// localStorage instead of the real backend, and used fake patient shapes
// (p.id / p.name) that don't match the real Patient model. It also crashed
// whenever `patients` from PatientsContext wasn't an array yet.
//
// Appointments already has a real, backend-connected implementation used
// by Owner: AppointmentsCalendar. It has no owner-only logic in it, so we
// reuse it directly here instead of maintaining a second, divergent copy.

import AppointmentsCalendar from '../appointments/AppointmentsCalendar';

const CashierAppointments = () => {
  return <AppointmentsCalendar />;
};

export default CashierAppointments;