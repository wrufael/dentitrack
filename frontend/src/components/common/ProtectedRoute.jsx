// src/components/common/ProtectedRoute.jsx
//
// THE REFRESH -> LOGIN BUG, EXPLAINED
// ------------------------------------------------------------------
// AuthContext.jsx already does the right thing on mount: it reads the
// token from localStorage, sets the Authorization header, and calls
// fetchUser() to confirm it with the server — but that's async, so for
// a brief moment right after a page refresh, `loading` is true and
// `isAuthenticated` is still false (it only flips to true once
// fetchUser() resolves).
//
// If your route guard checks `isAuthenticated` WITHOUT also checking
// `loading`, it sees "not authenticated yet" during that brief window
// and redirects to /login immediately — even though the token is
// valid and fetchUser() would have confirmed it a moment later. That
// exactly matches "refreshing a workspace page bounces to login."
//
// This component is the fix: it waits for `loading` to become false
// before making any redirect decision.
//
// If you already have a ProtectedRoute/PrivateRoute file, replace its
// contents with this (same import path your routes already use), or
// send me that file and I'll patch it precisely instead of swapping
// it wholesale.

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  // Auth check still in flight (e.g. right after a page refresh) —
  // render nothing yet instead of redirecting prematurely.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F8FB]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#0EA5A5] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#5B6B72]">Loading DentiTrack…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
