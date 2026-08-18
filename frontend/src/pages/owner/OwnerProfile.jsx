import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon,
  PencilIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const OwnerProfile = () => {
  const { user, clinicStatus } = useAuth();

  const getStatusInfo = () => {
    if (clinicStatus === 'approved' || clinicStatus === 'active') {
      return {
        icon: <CheckCircleIcon className="w-8 h-8 text-teal-500" />,
        label: '✅ Approved',
        color: 'text-teal-600 dark:text-teal-400',
        bg: 'bg-teal-50 dark:bg-teal-900/20',
        border: 'border-teal-200 dark:border-teal-800'
      };
    } else if (clinicStatus === 'pending') {
      return {
        icon: <ClockIcon className="w-8 h-8 text-yellow-500" />,
        label: '⏳ Pending Approval',
        color: 'text-yellow-600 dark:text-yellow-400',
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800'
      };
    } else {
      return {
        icon: <XCircleIcon className="w-8 h-8 text-red-500" />,
        label: '❌ Rejected',
        color: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-teal-500 to-teal-600 p-2 rounded-xl">
              <UserIcon className="w-6 h-6 text-white" />
            </span>
            My Profile
          </h1>
        </div>

        {/* Status Card */}
        <div className={`${statusInfo.bg} ${statusInfo.border} border-2 rounded-2xl p-6 mb-8 transition-all duration-300`}>
          <div className="flex items-center gap-4">
            {statusInfo.icon}
            <div>
              <p className={`font-semibold text-lg ${statusInfo.color}`}>{statusInfo.label}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {clinicStatus === 'pending' && 'Your clinic registration is being reviewed by the admin.'}
                {clinicStatus === 'approved' && 'Your clinic is approved! You have full access to all features.'}
                {clinicStatus === 'rejected' && 'Your clinic registration was rejected. Please contact support.'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 px-8 py-6">
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/50 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="text-white">
                <h3 className="text-2xl font-bold">{user?.name || 'User'}</h3>
                <p className="text-white/80 text-sm capitalize">{user?.role?.replace('_', ' ') || 'User'}</p>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-8 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: EnvelopeIcon, label: 'Email', value: user?.email || 'Not provided' },
                { icon: PhoneIcon, label: 'Phone', value: user?.phone || 'Not provided' },
                { icon: BuildingOfficeIcon, label: 'Clinic', value: user?.clinic_name || 'Not provided' },
                { icon: CalendarIcon, label: 'Member Since', value: new Date(user?.created_at || Date.now()).toLocaleDateString() }
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <item.icon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                    <p className="font-medium text-gray-900 dark:text-white">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Profile Button */}
        <div className="mt-8 flex justify-end">
          <button className="bg-gradient-to-r from-teal-500 to-teal-600 text-white px-8 py-3 rounded-xl font-medium hover:from-teal-600 hover:to-teal-700 transform hover:scale-[1.02] transition-all duration-200 shadow-sm flex items-center gap-2">
            <PencilIcon className="w-4 h-4" />
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerProfile;