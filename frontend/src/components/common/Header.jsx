import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import NotificationBell from './NotificationBell';

const todayLabel = () =>
  new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const Header = ({ greeting, subtitle }) => {
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-heading font-bold text-[#2B2B2B]">
            {greeting || `👋 Good morning, ${user?.name || 'User'}`}
          </h1>
          <p className="text-sm text-[#5B6B72] mt-1">
            {subtitle || todayLabel()}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <NotificationBell />
          <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-[#F2F8FB] transition-all">
            <UserCircleIcon className="w-6 h-6 text-[#5B6B72]" />
            <span className="text-sm text-[#2B2B2B] hidden sm:inline">{user?.name || 'User'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;