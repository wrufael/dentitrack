@echo off
cd /d C:\xampp\htdocs\dentitrack\frontend

:: Components - Appointments
if not exist "src\components\appointments\AppointmentsCalendar.jsx" type nul > "src\components\appointments\AppointmentsCalendar.jsx"
if not exist "src\components\appointments\AppointmentsList.jsx" type nul > "src\components\appointments\AppointmentsList.jsx"
if not exist "src\components\appointments\CreateAppointmentModal.jsx" type nul > "src\components\appointments\CreateAppointmentModal.jsx"
if not exist "src\components\appointments\EditAppointmentModal.jsx" type nul > "src\components\appointments\EditAppointmentModal.jsx"
if not exist "src\components\appointments\RescheduleModal.jsx" type nul > "src\components\appointments\RescheduleModal.jsx"

:: Components - Reports
if not exist "src\components\reports\ReportsHub.jsx" type nul > "src\components\reports\ReportsHub.jsx"
if not exist "src\components\reports\FinancialReports.jsx" type nul > "src\components\reports\FinancialReports.jsx"
if not exist "src\components\reports\ClinicalReports.jsx" type nul > "src\components\reports\ClinicalReports.jsx"
if not exist "src\components\reports\CreditReports.jsx" type nul > "src\components\reports\CreditReports.jsx"
if not exist "src\components\reports\DemographicsReports.jsx" type nul > "src\components\reports\DemographicsReports.jsx"

:: Pages - Owner
if not exist "src\pages\owner\OwnerDashboard.jsx" type nul > "src\pages\owner\OwnerDashboard.jsx"
if not exist "src\pages\owner\OwnerDoctors.jsx" type nul > "src\pages\owner\OwnerDoctors.jsx"
if not exist "src\pages\owner\OwnerCashiers.jsx" type nul > "src\pages\owner\OwnerCashiers.jsx"
if not exist "src\pages\owner\OwnerPatients.jsx" type nul > "src\pages\owner\OwnerPatients.jsx"
if not exist "src\pages\owner\OwnerAppointments.jsx" type nul > "src\pages\owner\OwnerAppointments.jsx"
if not exist "src\pages\owner\OwnerPayments.jsx" type nul > "src\pages\owner\OwnerPayments.jsx"
if not exist "src\pages\owner\OwnerInventory.jsx" type nul > "src\pages\owner\OwnerInventory.jsx"
if not exist "src\pages\owner\OwnerReports.jsx" type nul > "src\pages\owner\OwnerReports.jsx"
if not exist "src\pages\owner\OwnerSubscription.jsx" type nul > "src\pages\owner\OwnerSubscription.jsx"
if not exist "src\pages\owner\OwnerSettings.jsx" type nul > "src\pages\owner\OwnerSettings.jsx"

:: Pages - Doctor
if not exist "src\pages\doctor\DoctorDashboard.jsx" type nul > "src\pages\doctor\DoctorDashboard.jsx"
if not exist "src\pages\doctor\DoctorPatients.jsx" type nul > "src\pages\doctor\DoctorPatients.jsx"
if not exist "src\pages\doctor\DoctorAppointments.jsx" type nul > "src\pages\doctor\DoctorAppointments.jsx"
if not exist "src\pages\doctor\DoctorPayments.jsx" type nul > "src\pages\doctor\DoctorPayments.jsx"
if not exist "src\pages\doctor\DoctorSettings.jsx" type nul > "src\pages\doctor\DoctorSettings.jsx"

:: Pages - Cashier
if not exist "src\pages\cashier\CashierDashboard.jsx" type nul > "src\pages\cashier\CashierDashboard.jsx"
if not exist "src\pages\cashier\CashierPatients.jsx" type nul > "src\pages\cashier\CashierPatients.jsx"
if not exist "src\pages\cashier\CashierPayments.jsx" type nul > "src\pages\cashier\CashierPayments.jsx"
if not exist "src\pages\cashier\CashierAppointments.jsx" type nul > "src\pages\cashier\CashierAppointments.jsx"
if not exist "src\pages\cashier\CashierSettings.jsx" type nul > "src\pages\cashier\CashierSettings.jsx"

:: Pages - Admin
if not exist "src\pages\admin\AdminDashboard.jsx" type nul > "src\pages\admin\AdminDashboard.jsx"
if not exist "src\pages\admin\AdminClinics.jsx" type nul > "src\pages\admin\AdminClinics.jsx"
if not exist "src\pages\admin\AdminSubscriptions.jsx" type nul > "src\pages\admin\AdminSubscriptions.jsx"
if not exist "src\pages\admin\AdminAnalytics.jsx" type nul > "src\pages\admin\AdminAnalytics.jsx"
if not exist "src\pages\admin\AdminSettings.jsx" type nul > "src\pages\admin\AdminSettings.jsx"

echo.
echo =====================================
echo ALL MISSING FILES CREATED SUCCESSFULLY
echo =====================================
pause