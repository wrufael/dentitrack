import React from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Layouts
import MainLayout from "../layouts/MainLayout";

// Auth Pages
import Landing from "../pages/auth/Landing";
import Login from "../pages/auth/Login";
import RegisterClinic from "../pages/auth/RegisterClinic";

// ============ OWNER PAGES ============
import OwnerDashboard from "../pages/owner/OwnerDashboard";
import OwnerProfile from "../pages/owner/OwnerProfile";
import OwnerExpenses from "../pages/owner/OwnerExpenses"; // ✅ NEW
import DoctorsManagement from "../components/owner/DoctorsManagement";
import CashiersManagement from "../components/owner/CashiersManagement";
import PatientsManagement from "../components/owner/PatientsManagement";
import PatientMedicalRecords from "../components/owner/PatientMedicalRecords";
import AppointmentsCalendar from "../components/appointments/AppointmentsCalendar";
import PaymentRequestsManagement from "../components/owner/PaymentRequestsManagement";
import RevenueManagement from "../components/owner/RevenueManagement";
import ExpenseManagement from "../components/owner/ExpenseManagement";
import InventoryManagement from "../components/owner/InventoryManagement";
import PatientCredit from "../components/owner/PatientCredit";
import ReportsHub from "../components/reports/ReportsHub";
import ProfileSettings from "../components/settings/ProfileSettings";
import SubscriptionManagement from "../components/owner/SubscriptionManagement";
import EmployeesManagement from "../components/owner/EmployeesManagement";
import OwnerRevenue from '../pages/owner/OwnerRevenue';
// ============ DOCTOR PAGES ============
import DoctorDashboard from "../pages/doctor/DoctorDashboard";
import TodayPatients from "../pages/doctor/TodayPatients";
import DoctorPatients from "../components/doctor/DoctorPatients";
import DoctorAppointments from "../components/doctor/DoctorAppointments";
import DoctorPayments from "../pages/doctor/DoctorPayments";
import DoctorSettings from "../components/doctor/DoctorSettings";
import DoctorSearchPatient from "../pages/doctor/SearchPatient";

// ============ CASHIER PAGES ============
import CashierDashboard from "../pages/cashier/CashierDashboard";
import CashierPatients from "../components/cashier/CashierPatients";
import CashierPayments from "../components/cashier/CashierPayments";
import CashierAppointments from "../components/cashier/CashierAppointments";
import CashierSettings from "../components/cashier/CashierSettings";
import RegisterPatient from "../pages/cashier/RegisterPatient";
import CashierSearchPatient from "../pages/cashier/SearchPatient";

// ============ STAFF PAGES (nurse / receptionist / lab_technician) ============
// One dashboard shared by all three; Patients/Appointments/Settings
// reuse the same real, API-backed cashier components — none of them
// hardcode the cashier role, so they work as-is for other staff too.
import StaffDashboard from "../pages/staff/StaffDashboard";

// ============ ADMIN PAGES ============
import AdminDashboard from "../pages/admin/AdminDashboard";
import ClinicsManagement from "../components/admin/ClinicsManagement";
import SubscriptionPlans from "../components/admin/SubscriptionPlans";
import SubscriptionRequests from "../components/admin/SubscriptionRequests";
import PlatformAnalytics from "../components/admin/PlatformAnalytics";
import AdminSettings from "../components/admin/AdminSettings";
import RegistrationRequests from "../components/admin/RegistrationRequests";

// ============ PROTECTED ROUTE ============
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F8FB]">
        <div className="text-center">
          <div className="inline-block w-10 h-10 border-4 border-[#0EA5A5] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-[#5B6B72]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// ============ MAIN APP ROUTES ============
export default function AppRoutes() {
  const { user } = useAuth();

  // Get default route based on role
  const getDefaultRoute = () => {
    if (!user) return '/login';
    const routes = {
      owner: '/owner/dashboard',
      doctor: '/doctor/dashboard',
      cashier: '/cashier/dashboard',
      nurse: '/nurse/dashboard',
      receptionist: '/receptionist/dashboard',
      lab_technician: '/lab/dashboard',
      admin: '/admin/dashboard',
      platform_admin: '/admin/dashboard',
    };
    return routes[user.role] || '/login';
  };

  return (
    <Routes>
      {/* ===== PUBLIC ROUTES ===== */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register-clinic" element={<RegisterClinic />} />

      {/* ===== OWNER ROUTES ===== */}
      <Route
        path="/owner"
        element={
          <ProtectedRoute allowedRoles={['owner']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="revenue" element={<OwnerRevenue />} />
        <Route index element={<Navigate to="/owner/dashboard" replace />} />
        <Route path="dashboard" element={<OwnerDashboard />} />
        <Route path="profile" element={<OwnerProfile />} />
        <Route path="patients" element={<PatientsManagement />} />
        <Route path="medical-records" element={<PatientMedicalRecords />} />
        <Route path="doctors" element={<DoctorsManagement />} />
        <Route path="cashiers" element={<CashiersManagement />} />
        <Route path="appointments" element={<AppointmentsCalendar />} />
        <Route path="payment-requests" element={<PaymentRequestsManagement />} />
        <Route path="revenue" element={<RevenueManagement />} />
        <Route path="expenses" element={<OwnerExpenses />} /> {/* ✅ UPDATED - Uses new component */}
        <Route path="expenses-old" element={<ExpenseManagement />} /> {/* Keep old for reference */}
        <Route path="inventory" element={<InventoryManagement />} />
        <Route path="patient-credit" element={<PatientCredit />} />
        <Route path="reports" element={<ReportsHub />} />
        <Route path="employees" element={<EmployeesManagement />} />
        <Route path="subscription" element={<SubscriptionManagement />} />
        <Route path="settings" element={<ProfileSettings />} />
        <Route path="*" element={<Navigate to="/owner/dashboard" replace />} />
      </Route>
      

      {/* ===== DOCTOR ROUTES ===== */}
      <Route
        path="/doctor"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/doctor/dashboard" replace />} />
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="today-patients" element={<TodayPatients />} />
        <Route path="patients" element={<DoctorPatients />} />
        <Route path="appointments" element={<DoctorAppointments />} />
        <Route path="payments" element={<DoctorPayments />} />
        <Route path="search" element={<DoctorSearchPatient />} />
        <Route path="settings" element={<DoctorSettings />} />
        <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
      </Route>

      {/* ===== CASHIER ROUTES ===== */}
      <Route
        path="/cashier"
        element={
          <ProtectedRoute allowedRoles={['cashier']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/cashier/dashboard" replace />} />
        <Route path="dashboard" element={<CashierDashboard />} />
        <Route path="patients" element={<CashierPatients />} />
        <Route path="payments" element={<CashierPayments />} />
        <Route path="appointments" element={<CashierAppointments />} />
        <Route path="register" element={<RegisterPatient />} />
        <Route path="search" element={<CashierSearchPatient />} />
        <Route path="settings" element={<CashierSettings />} />
        <Route path="*" element={<Navigate to="/cashier/dashboard" replace />} />
      </Route>

      {/* ===== NURSE ROUTES ===== */}
      <Route
        path="/nurse"
        element={
          <ProtectedRoute allowedRoles={['nurse']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/nurse/dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="patients" element={<CashierPatients />} />
        <Route path="appointments" element={<CashierAppointments />} />
        <Route path="settings" element={<CashierSettings />} />
        <Route path="*" element={<Navigate to="/nurse/dashboard" replace />} />
      </Route>

      {/* ===== RECEPTIONIST ROUTES ===== */}
      <Route
        path="/receptionist"
        element={
          <ProtectedRoute allowedRoles={['receptionist']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/receptionist/dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="patients" element={<CashierPatients />} />
        <Route path="appointments" element={<CashierAppointments />} />
        <Route path="settings" element={<CashierSettings />} />
        <Route path="*" element={<Navigate to="/receptionist/dashboard" replace />} />
      </Route>

      {/* ===== LAB TECHNICIAN ROUTES ===== */}
      <Route
        path="/lab"
        element={
          <ProtectedRoute allowedRoles={['lab_technician']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/lab/dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="patients" element={<CashierPatients />} />
        <Route path="appointments" element={<CashierAppointments />} />
        <Route path="settings" element={<CashierSettings />} />
        <Route path="*" element={<Navigate to="/lab/dashboard" replace />} />
      </Route>

      {/* ===== ADMIN ROUTES ===== */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin', 'platform_admin']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="clinics" element={<ClinicsManagement />} />
        <Route path="subscriptions" element={<SubscriptionPlans />} />
        <Route path="subscription-requests" element={<SubscriptionRequests />} />
        <Route path="analytics" element={<PlatformAnalytics />} />
        <Route path="registration-requests" element={<RegistrationRequests />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* ===== FALLBACK ===== */}
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}