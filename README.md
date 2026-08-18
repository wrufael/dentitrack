# DentiTrack - Dental Clinic Management System

A comprehensive full-stack dental clinic management system with role-based access control.

## Features

### Backend (Laravel)
- ✅ User authentication & authorization
- ✅ Role-based permissions (Doctor, Cashier, Nurse, Receptionist, Lab Technician)
- ✅ Patient management
- ✅ Appointment scheduling
- ✅ Medical records & consultations
- ✅ Payment processing & tracking
- ✅ Inventory management
- ✅ Expense tracking
- ✅ Reports & analytics
- ✅ Employee management with permission-based module access

### Frontend (React)
- Modern React-based user interface
- Responsive design
- Real-time updates

## Technology Stack

### Backend
- PHP 8.x
- Laravel 11.x
- MySQL
- Sanctum for API authentication

### Frontend
- React 18.x
- Vite
- TailwindCSS / Material UI

## Installation

### Backend Setup
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
php artisan serve
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Permission System

The system implements granular permission-based access control:
- Owners can create employees and assign specific permissions
- Employees only see modules/pages they have access to
- API endpoints are protected with permission middleware
- Supports custom permission combinations per employee

## License

Proprietary - All rights reserved

## Author

Wolederufael Derso (wrufael)
