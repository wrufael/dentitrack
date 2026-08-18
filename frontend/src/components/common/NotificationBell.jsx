import React, { useState, useRef, useEffect } from 'react';
import { BellIcon, XMarkIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { usePayments } from '../../contexts/PaymentContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = usePayments();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'new_payment_request':
        return <div className="w-10 h-10 rounded-full bg-[#0EA5A5]/20 flex items-center justify-center text-[#0EA5A5]">💳</div>;
      case 'payment_collected':
        return <div className="w-10 h-10 rounded-full bg-[#1FAE6B]/20 flex items-center justify-center text-[#1FAE6B]">✅</div>;
      default:
        return <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">📋</div>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[#F2F8FB] transition-all"
      >
        <BellIcon className="w-6 h-6 text-[#5B6B72]" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#E5484D] text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl z-50 max-h-[500px] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div>
              <h3 className="font-heading font-semibold text-[#2B2B2B]">Notifications</h3>
              <p className="text-xs text-[#5B6B72]">{unreadCount} unread</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-[#0EA5A5] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-96">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-[#5B6B72]">
                <div className="text-4xl mb-2">🔔</div>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 p-4 hover:bg-[#F2F8FB] transition-all cursor-pointer border-b border-gray-50 ${
                    !notification.read ? 'bg-[#0EA5A5]/5' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-[#2B2B2B]">{notification.title}</p>
                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-[#0EA5A5] flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-sm text-[#5B6B72]">{notification.message}</p>
                    <p className="text-xs text-[#5B6B72] mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 text-center">
            <button className="text-sm text-[#0EA5A5] hover:underline">
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;