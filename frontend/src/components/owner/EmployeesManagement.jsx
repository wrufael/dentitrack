// src/components/owner/EmployeesManagement.jsx
//
// Owner's Employee & Permission Management page.
//
// Wired to the real API (see EmployeeController on the backend).
// Each employee gets their role's default permission set when
// created, but the owner can add or remove individual modules for
// that specific employee before saving — access isn't locked to
// the role.

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  PowerIcon,
  XMarkIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  CheckIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import api from '../../api';

const inputClass =
  'w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/20 focus:border-[#0EA5A5] transition-all';

// ============================================================
// ROLES + FIXED DEFAULT PERMISSIONS
// ============================================================
// Simple model: one role per employee, permissions are fixed
// per role (not individually customizable). This mirrors the
// permission list from the product spec, grouped by category
// for display in the "Access this role gets" panel.

export const EMPLOYEE_ROLES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'lab_technician', label: 'Lab Technician' },
];

export const ROLE_PERMISSIONS = {
  doctor: {
    Patients: ['View Patients', 'Create Patients', 'Edit Patients', 'View Medical History'],
    Appointments: ['View Appointments (own)', 'Create Appointments', 'Edit Appointments'],
    'Medical Records': ['View Records', 'Create Records', 'Edit Records', 'Add Prescriptions'],
    Payments: ['Create Payment Requests', 'View Payments'],
  },
  cashier: {
    Patients: ['View Patients (basic info)'],
    Appointments: ['View Appointments (for payment verification)'],
    Payments: ['Collect Payments', 'View Payment History', 'Generate Receipts', 'View Daily Summaries'],
  },
  nurse: {
    Patients: ['View Patients', 'View Medical History'],
    Appointments: ['View Appointments'],
    'Medical Records': ['View Records', 'Update Patient Vitals'],
  },
  receptionist: {
    Patients: ['View Patients (basic info)'],
    Appointments: ['View Appointments', 'Create Appointments', 'Edit Appointments', 'Check-in / Check-out'],
  },
  lab_technician: {
    Patients: ['View Patients (basic info)'],
    Appointments: ['View Appointments (lab-relevant)'],
    'Medical Records': ['View Lab Requests', 'Update Lab Results'],
  },
};

const roleLabel = (value) =>
  EMPLOYEE_ROLES.find((r) => r.value === value)?.label || value;

// ============================================================
// PERMISSION KEYS
// ============================================================
// A permission is identified as "Category::Label" — this MUST
// match how the backend builds keys in PermissionCatalog.php.

const permKey = (category, label) => `${category}::${label}`;

// Master catalog: union of every permission across every role,
// grouped by category. The owner can grant any of these to any
// employee, regardless of that employee's role.
const ALL_PERMISSIONS = (() => {
  const byCategory = {};

  Object.values(ROLE_PERMISSIONS).forEach((groups) => {
    Object.entries(groups).forEach(([category, labels]) => {
      if (!byCategory[category]) byCategory[category] = new Set();
      labels.forEach((label) => byCategory[category].add(label));
    });
  });

  return Object.entries(byCategory).map(([category, labelSet]) => ({
    category,
    labels: Array.from(labelSet),
  }));
})();

// Flat list of permission keys a role gets by default.
const defaultPermissionsForRole = (role) => {
  const groups = ROLE_PERMISSIONS[role] || {};
  const keys = [];
  Object.entries(groups).forEach(([category, labels]) => {
    labels.forEach((label) => keys.push(permKey(category, label)));
  });
  return keys;
};

const roleBadgeColor = (value) => {
  const map = {
    doctor: 'bg-[#0EA5A5]/10 text-[#0EA5A5]',
    cashier: 'bg-[#E0A400]/10 text-[#9A6B00]',
    nurse: 'bg-[#1FAE6B]/10 text-[#1FAE6B]',
    receptionist: 'bg-[#6366F1]/10 text-[#6366F1]',
    lab_technician: 'bg-[#E5484D]/10 text-[#E5484D]',
  };
  return map[value] || 'bg-gray-100 text-[#5B6B72]';
};

// ============================================================
// FORM DEFAULTS
// ============================================================

const emptyForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: 'doctor',
  permissions: defaultPermissionsForRole('doctor'),
};

// ============================================================
// PERMISSION CHECKLIST (read-only — role determines it)
// ============================================================

const PermissionChecklist = ({ role }) => {
  const groups = ROLE_PERMISSIONS[role] || {};
  const categories = Object.keys(groups);

  if (categories.length === 0) {
    return (
      <p className="text-sm text-[#5B6B72]">No permissions defined for this role.</p>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category}>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#8A999F] mb-2">
            {category}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {groups[category].map((perm) => (
              <div
                key={perm}
                className="flex items-center gap-2 text-sm text-[#2B2B2B] bg-[#0EA5A5]/5 border border-[#0EA5A5]/15 rounded-lg px-3 py-2"
              >
                <span className="w-4 h-4 rounded flex items-center justify-center bg-[#0EA5A5] shrink-0">
                  <CheckIcon className="w-3 h-3 text-white" />
                </span>
                {perm}
              </div>
            ))}
          </div>
        </div>
      ))}
      <p className="text-xs text-[#5B6B72] pt-1">
        This role's access is fixed. To change what this role can do, contact your
        developer to update the role's default permissions.
      </p>
    </div>
  );
};

// ============================================================
// PERMISSION CHECKLIST (editable — owner can add/remove modules)
// ============================================================

const EditablePermissionChecklist = ({ role, selected, onToggle, onResetToDefault }) => {
  return (
    <div className="space-y-4">
      {ALL_PERMISSIONS.map(({ category, labels }) => (
        <div key={category}>
          <div className="text-xs font-semibold uppercase tracking-wide text-[#8A999F] mb-2">
            {category}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {labels.map((label) => {
              const key = permKey(category, label);
              const isChecked = selected.includes(key);
              return (
                <label
                  key={key}
                  className={`flex items-center gap-2 text-sm rounded-lg px-3 py-2 border cursor-pointer transition-all ${
                    isChecked
                      ? 'bg-[#0EA5A5]/5 border-[#0EA5A5]/25 text-[#2B2B2B]'
                      : 'bg-white border-gray-200 text-[#5B6B72] hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => onToggle(key)}
                    className="w-4 h-4 rounded border-gray-300 text-[#0EA5A5] focus:ring-[#0EA5A5]/30"
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1">
        <p className="text-xs text-[#5B6B72]">
          Starts from {roleLabel(role)}'s default access — check or uncheck anything to
          customize it for this employee.
        </p>
        <button
          type="button"
          onClick={onResetToDefault}
          className="text-xs font-medium text-[#0EA5A5] hover:underline whitespace-nowrap ml-3"
        >
          Reset to {roleLabel(role)} defaults
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const EmployeesManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [permissionsRole, setPermissionsRole] = useState('doctor');

  // ----------------------------------------------------------
  // Load employees from the real API
  // ----------------------------------------------------------

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await api.get('/employees');
      setEmployees(response.data?.data || []);
    } catch (error) {
      console.error('Load employees error:', error);
      toast.error(error.response?.data?.message || 'Unable to load employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // ----------------------------------------------------------
  // Filtering
  // ----------------------------------------------------------

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      !searchTerm.trim() ||
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'all' || emp.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  // ----------------------------------------------------------
  // Modal open/close
  // ----------------------------------------------------------

  const openAddModal = () => {
    setEditingEmployee(null);
    setFormData(emptyForm);
    setShowFormModal(true);
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      password: '',
      role: employee.role,
      permissions:
        employee.permissions && employee.permissions.length > 0
          ? employee.permissions
          : defaultPermissionsForRole(employee.role),
    });
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    if (saving) return;
    setShowFormModal(false);
    setEditingEmployee(null);
    setFormData(emptyForm);
  };

  // ----------------------------------------------------------
  // Permission toggles inside the Add/Edit modal
  // ----------------------------------------------------------

  const handleRoleChange = (newRole) => {
    setFormData((prev) => ({
      ...prev,
      role: newRole,
      permissions: defaultPermissionsForRole(newRole),
    }));
  };

  const handleTogglePermission = (key) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(key)
        ? prev.permissions.filter((p) => p !== key)
        : [...prev.permissions, key],
    }));
  };

  const handleResetPermissionsToDefault = () => {
    setFormData((prev) => ({
      ...prev,
      permissions: defaultPermissionsForRole(prev.role),
    }));
  };

  const openPermissionsPreview = (role) => {
    setPermissionsRole(role);
    setShowPermissionsModal(true);
  };

  // ----------------------------------------------------------
  // Save (create or update) — LOCAL STATE ONLY for now
  // ----------------------------------------------------------

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Name is required.');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Email is required.');
      return;
    }
    if (!editingEmployee && !formData.password.trim()) {
      toast.error('Password is required for a new employee.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        role: formData.role,
        permissions: formData.permissions,
        ...(formData.password.trim() ? { password: formData.password.trim() } : {}),
      };

      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, payload);
        toast.success('Employee updated.');
      } else {
        const response = await api.post('/employees', payload);
        toast.success(
          `${response.data?.data?.name || formData.name} added as ${roleLabel(formData.role)}.`
        );
      }

      closeFormModal();
      await loadEmployees();
    } catch (error) {
      console.error('Save employee error:', error);

      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors).flat()[0];
        toast.error(firstError || 'Please check the form.');
      } else {
        toast.error(error.response?.data?.message || 'Unable to save employee.');
      }
    } finally {
      setSaving(false);
    }
  };

  // ----------------------------------------------------------
  // Activate / Deactivate
  // ----------------------------------------------------------

  const handleToggleActive = async (employee) => {
    try {
      if (employee.is_active) {
        await api.post(`/employees/${employee.id}/deactivate`);
        toast.success(`${employee.name} deactivated.`);
      } else {
        await api.post(`/employees/${employee.id}/activate`);
        toast.success(`${employee.name} activated.`);
      }
      await loadEmployees();
    } catch (error) {
      console.error('Toggle active error:', error);
      toast.error(error.response?.data?.message || 'Unable to update employee status.');
    }
  };

  // ----------------------------------------------------------
  // Delete
  // ----------------------------------------------------------

  const handleDelete = async (employee) => {
    const confirmed = window.confirm(
      `Remove ${employee.name} permanently? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/employees/${employee.id}`);
      toast.success(`${employee.name} removed.`);
      await loadEmployees();
    } catch (error) {
      console.error('Delete employee error:', error);
      toast.error(error.response?.data?.message || 'Unable to remove employee.');
    }
  };

  return (
    <div>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-heading font-bold text-[#2B2B2B]">Employees</h2>
          <p className="text-[#5B6B72] text-sm">
            Add staff and see what each role can access
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-[#0EA5A5] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#0B7A7A] transition-all flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      {/* SEARCH + FILTER */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-[#5B6B72]" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className={`${inputClass} sm:w-56`}
        >
          <option value="all">All Roles</option>
          {EMPLOYEE_ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* ROLE QUICK-REFERENCE */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="text-sm font-semibold text-[#2B2B2B] mb-3">
          What each role can access
        </div>
        <div className="flex flex-wrap gap-2">
          {EMPLOYEE_ROLES.map((r) => (
            <button
              key={r.value}
              onClick={() => openPermissionsPreview(r.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:opacity-80 ${roleBadgeColor(
                r.value
              )}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* EMPLOYEE TABLE */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Name</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Role</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Email</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Phone</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-[#5B6B72]">Status</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-[#5B6B72]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-[#5B6B72]">
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-[#5B6B72]">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#F2F8FB] transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#0EA5A5] flex items-center justify-center text-white text-sm font-semibold">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-[#2B2B2B]">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openPermissionsPreview(emp.role)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium hover:opacity-80 transition-all ${roleBadgeColor(
                          emp.role
                        )}`}
                        title="View what this role can access"
                      >
                        {roleLabel(emp.role)}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#5B6B72]">{emp.email}</td>
                    <td className="px-6 py-4 text-sm text-[#5B6B72]">{emp.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          emp.is_active
                            ? 'bg-[#1FAE6B]/10 text-[#1FAE6B]'
                            : 'bg-gray-100 text-[#5B6B72]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            emp.is_active ? 'bg-[#1FAE6B]' : 'bg-gray-400'
                          }`}
                        />
                        {emp.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-2 text-[#0EA5A5] hover:bg-[#0EA5A5]/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(emp)}
                          className={`p-2 rounded-lg transition-all ${
                            emp.is_active
                              ? 'text-[#E0A400] hover:bg-[#E0A400]/10'
                              : 'text-[#1FAE6B] hover:bg-[#1FAE6B]/10'
                          }`}
                          title={emp.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <PowerIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Remove"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-semibold text-[#2B2B2B] flex items-center gap-2">
                  <PlusIcon className="w-5 h-5 text-[#0EA5A5]" />
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h2>
                <p className="text-sm text-[#5B6B72] mt-0.5">
                  {editingEmployee
                    ? 'Update this employee\'s details or role.'
                    : 'Create a staff account and pick their role.'}
                </p>
              </div>
              <button
                onClick={closeFormModal}
                disabled={saving}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                  Full Name *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-[#5B6B72]" />
                  </div>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all"
                    placeholder="e.g. Dr. Sarah Tesfaye"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-[#5B6B72]" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all"
                    placeholder="employee@dentitrack.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                  Phone
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <PhoneIcon className="h-5 w-5 text-[#5B6B72]" />
                  </div>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all"
                    placeholder="+251 91 000 0000"
                  />
                </div>
              </div>

              {!editingEmployee && (
                <div>
                  <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                    Temporary Password *
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className={inputClass}
                    placeholder="Employee will use this to log in"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  className={inputClass}
                >
                  {EMPLOYEE_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Editable access — owner can add or remove modules */}
              <div className="border border-gray-200 rounded-lg p-4 bg-[#F2F8FB]">
                <div className="text-sm font-semibold text-[#2B2B2B] mb-3">
                  What this employee can access
                </div>
                <EditablePermissionChecklist
                  role={formData.role}
                  selected={formData.permissions}
                  onToggle={handleTogglePermission}
                  onResetToDefault={handleResetPermissionsToDefault}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 pb-6 pt-2">
              <button
                onClick={closeFormModal}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg font-medium text-sm text-[#2B2B2B] border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A] disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMISSIONS PREVIEW MODAL */}
      {showPermissionsModal && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-[#2B2B2B]">
                {roleLabel(permissionsRole)} Access
              </h2>
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <PermissionChecklist role={permissionsRole} />
            </div>
            <div className="flex justify-end px-6 pb-6">
              <button
                onClick={() => setShowPermissionsModal(false)}
                className="px-5 py-2.5 rounded-lg font-medium text-sm text-white bg-[#0EA5A5] hover:bg-[#0B7A7A]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeesManagement;