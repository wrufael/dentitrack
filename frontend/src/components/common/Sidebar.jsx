// path: components/common/Sidebar.jsx

import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import {
  LayoutDashboard,
  Users,
  UserCog,
  CreditCard,
  Calendar,
  TrendingDown,
  Package,
  Wallet,
  BarChart3,
  Building2,
  ShieldCheck,
  Settings,
  LogOut,
  Search,
  Menu,
  X,
  FileText,
  DollarSign,
} from 'lucide-react';

const Sidebar = ({ collapsed = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const role = user?.role;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const getMenuItems = () => {
    const items = [];

    // =======================================================
    // OWNER
    // =======================================================
    if (role === 'owner') {
      items.push(
        {
          category: 'Workspace',
          items: [
            {
              path: '/owner/dashboard',
              icon: LayoutDashboard,
              label: 'Dashboard',
            },
          ],
        },

        {
          category: 'Operations',
          items: [
            {
              path: '/owner/patients',
              icon: Users,
              label: 'Patients',
            },
            {
              path: '/owner/medical-records',
              icon: FileText,
              label: 'Patient Medical Records',
            },
            {
              path: '/owner/doctors',
              icon: UserCog,
              label: 'Doctors',
            },
            {
              path: '/owner/appointments',
              icon: Calendar,
              label: 'Appointments',
            },
            {
              path: '/owner/inventory',
              icon: Package,
              label: 'Inventory',
            },
          ],
        },

        {
          category: 'Finance',
          items: [
            {
              path: '/owner/cashiers',
              icon: CreditCard,
              label: 'Cashiers',
            },
            {
              path: '/owner/revenue',
              icon: DollarSign,
              label: 'Revenue',
            },
            {
              path: '/owner/expenses',
              icon: TrendingDown,
              label: 'Expenses',
            },
            {
              path: '/owner/patient-credit',
              icon: Wallet,
              label: 'Patient Credit',
            },
          ],
        },

        {
          category: 'Management',
          items: [
            {
              path: '/owner/reports',
              icon: BarChart3,
              label: 'Reports',
            },
            {
              path: '/owner/employees',
              icon: UserCog,
              label: 'Employees',
            },
          ],
        },

        {
          category: 'System',
          items: [
            {
              path: '/owner/subscription',
              icon: ShieldCheck,
              label: 'Subscription',
            },
            {
              path: '/owner/settings',
              icon: Settings,
              label: 'Settings',
            },
          ],
        }
      );
    }

    // =======================================================
    // DOCTOR
    // =======================================================
    else if (role === 'doctor') {
      items.push(
        {
          category: 'Workspace',
          items: [
            {
              path: '/doctor/dashboard',
              icon: LayoutDashboard,
              label: 'Dashboard',
            },
          ],
        },

        {
          category: 'Clinical',
          items: [
            {
              path: '/doctor/patients',
              icon: Users,
              label: 'Patients',
            },
            {
              path: '/doctor/appointments',
              icon: Calendar,
              label: 'Appointments',
            },
          ],
        },

        {
          category: 'System',
          items: [
            {
              path: '/doctor/settings',
              icon: Settings,
              label: 'Settings',
            },
          ],
        }
      );
    }

    // =======================================================
    // CASHIER
    // =======================================================
    else if (role === 'cashier') {
      items.push(
        {
          category: 'Workspace',
          items: [
            {
              path: '/cashier/dashboard',
              icon: LayoutDashboard,
              label: 'Dashboard',
            },
          ],
        },

        {
          category: 'Operations',
          items: [
            {
              path: '/cashier/patients',
              icon: Users,
              label: 'Register Patients',
            },
            {
              path: '/cashier/appointments',
              icon: Calendar,
              label: 'Appointments',
            },
          ],
        },

        {
          category: 'Finance',
          items: [
            {
              path: '/cashier/payments',
              icon: CreditCard,
              label: 'Payment Requested',
            },
          ],
        },

        {
          category: 'System',
          items: [
            {
              path: '/cashier/settings',
              icon: Settings,
              label: 'Settings',
            },
          ],
        }
      );
    }

    // =======================================================
    // NURSE
    // =======================================================
    else if (role === 'nurse') {
      items.push(
        {
          category: 'Workspace',
          items: [
            {
              path: '/nurse/dashboard',
              icon: LayoutDashboard,
              label: 'Dashboard',
            },
          ],
        },
        {
          category: 'Clinical',
          items: [
            {
              path: '/nurse/patients',
              icon: Users,
              label: 'Patients',
            },
            {
              path: '/nurse/appointments',
              icon: Calendar,
              label: 'Appointments',
            },
          ],
        },
        {
          category: 'System',
          items: [
            {
              path: '/nurse/settings',
              icon: Settings,
              label: 'Settings',
            },
          ],
        }
      );
    }

    // =======================================================
    // RECEPTIONIST
    // =======================================================
    else if (role === 'receptionist') {
      items.push(
        {
          category: 'Workspace',
          items: [
            {
              path: '/receptionist/dashboard',
              icon: LayoutDashboard,
              label: 'Dashboard',
            },
          ],
        },
        {
          category: 'Operations',
          items: [
            {
              path: '/receptionist/patients',
              icon: Users,
              label: 'Patients',
            },
            {
              path: '/receptionist/appointments',
              icon: Calendar,
              label: 'Appointments',
            },
          ],
        },
        {
          category: 'System',
          items: [
            {
              path: '/receptionist/settings',
              icon: Settings,
              label: 'Settings',
            },
          ],
        }
      );
    }

    // =======================================================
    // LAB TECHNICIAN
    // =======================================================
    else if (role === 'lab_technician') {
      items.push(
        {
          category: 'Workspace',
          items: [
            {
              path: '/lab/dashboard',
              icon: LayoutDashboard,
              label: 'Dashboard',
            },
          ],
        },
        {
          category: 'Clinical',
          items: [
            {
              path: '/lab/patients',
              icon: Users,
              label: 'Patients',
            },
            {
              path: '/lab/appointments',
              icon: Calendar,
              label: 'Appointments',
            },
          ],
        },
        {
          category: 'System',
          items: [
            {
              path: '/lab/settings',
              icon: Settings,
              label: 'Settings',
            },
          ],
        }
      );
    }

    // =======================================================
    // PLATFORM ADMIN
    // =======================================================
    else if (role === 'admin' || role === 'platform_admin' || role === 'platform-admin' || role === 'super_admin') {
      items.push(
        {
          category: 'Workspace',
          items: [
            {
              path: '/admin/dashboard',
              icon: LayoutDashboard,
              label: 'Dashboard',
            },
          ],
        },

        {
          category: 'Platform',
          items: [
            {
              path: '/admin/clinics',
              icon: Building2,
              label: 'Clinics',
            },
            {
              path: '/admin/registrations',
              icon: FileText,
              label: 'Registration Requests',
            },
            {
              path: '/admin/subscriptions',
              icon: ShieldCheck,
              label: 'Subscription Plans',
            },
            {
              path: '/admin/subscription-requests',
              icon: ClipboardList,
              label: 'Subscription Requests',
            },
          ],
        },

        {
          category: 'Insights',
          items: [
            {
              path: '/admin/analytics',
              icon: BarChart3,
              label: 'Analytics',
            },
          ],
        },

        {
          category: 'System',
          items: [
            {
              path: '/admin/settings',
              icon: Settings,
              label: 'Settings',
            },
          ],
        }
      );
    }

    return items;
  };

  const menuGroups = getMenuItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // =========================================================
  // MOBILE SIDEBAR
  // =========================================================
  if (isMobile) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center bg-white border border-gray-200 rounded-lg shadow-sm md:hidden"
        >
          {isMobileOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        {isMobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setIsMobileOpen(false)}
          >
            <div
              className="w-72 h-full bg-white shadow-xl p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6 px-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] flex items-center justify-center text-white text-xl">
                  🦷
                </div>

                <div>
                  <p className="font-bold text-[#2B2B2B]">DentiTrack</p>
                  <p className="text-xs text-[#5B6B72]">Track. Manage. Treat.</p>
                </div>
              </div>

              <div className="mb-4 px-2">
                <span className="text-[11px] font-medium text-[#0EA5A5] bg-[#0EA5A5]/10 px-2.5 py-0.5 rounded-full">
                  {role?.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="flex items-center gap-2.5 px-2 mb-5 pb-3 border-b border-gray-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] flex items-center justify-center text-white font-semibold text-xs shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[#2B2B2B] truncate">
                    {user?.name || 'User'}
                  </p>
                  <p className="text-[11px] text-[#5B6B72] truncate">
                    {user?.clinic_name || 'Clinic'}
                  </p>
                </div>
              </div>

              <nav className="space-y-5">
                {menuGroups.map((group) => (
                  <div key={group.category}>
                    <p className="px-2 mb-2 text-[10px] uppercase tracking-wider font-semibold text-[#8A999F]">
                      {group.category}
                    </p>

                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;

                        return (
                          <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                isActive
                                  ? 'bg-[#0EA5A5]/10 text-[#0EA5A5]'
                                  : 'text-[#5B6B72] hover:bg-[#F2F8FB] hover:text-[#2B2B2B]'
                              }`
                            }
                          >
                            <Icon className="w-5 h-5 shrink-0" />
                            {item.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>

              <div className="mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-[#E5484D] hover:bg-red-50 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // =========================================================
  // DESKTOP SIDEBAR
  // =========================================================
  return (
    <aside
      className={`h-screen sticky top-0 bg-white border-r border-gray-100 px-3 py-5 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div
        className={`flex items-center ${
          collapsed ? 'justify-center' : 'gap-3 px-2'
        } mb-6`}
      >
        <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] flex items-center justify-center text-white text-xl shadow-lg">
          🦷
        </div>

        {!collapsed && (
          <div>
            <p className="font-bold text-[#2B2B2B] text-lg">DentiTrack</p>
            <p className="text-xs text-[#5B6B72]">Track. Manage. Treat.</p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="mb-4 px-2">
          <span className="text-[11px] font-medium text-[#0EA5A5] bg-[#0EA5A5]/10 px-2.5 py-0.5 rounded-full">
            {role?.replace('_', ' ').toUpperCase()}
          </span>
        </div>
      )}

      <div
        className={`flex items-center ${
          collapsed ? 'justify-center' : 'gap-2.5 px-2'
        } mb-5 pb-3 border-b border-gray-100`}
      >
        <div className="w-8 h-8 shrink-0 rounded-full bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] flex items-center justify-center text-white font-semibold text-xs">
          {user?.name?.charAt(0) || 'U'}
        </div>

        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#2B2B2B] truncate">
              {user?.name || 'User'}
            </p>
            <p className="text-[11px] text-[#5B6B72] truncate">
              {user?.clinic_name || 'Clinic'}
            </p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto space-y-5">
        {menuGroups.map((group) => (
          <div key={group.category}>
            {!collapsed && (
              <p className="px-2 mb-2 text-[10px] uppercase tracking-wider font-semibold text-[#8A999F]">
                {group.category}
              </p>
            )}

            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center ${
                        collapsed ? 'justify-center' : 'gap-3'
                      } px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-[#0EA5A5]/10 text-[#0EA5A5]'
                          : 'text-[#5B6B72] hover:bg-[#F2F8FB] hover:text-[#2B2B2B]'
                      }`
                    }
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex items-center ${
            collapsed ? 'justify-center' : 'gap-3'
          } px-3 py-2.5 w-full rounded-lg text-sm font-medium text-[#E5484D] hover:bg-red-50 transition-all`}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;