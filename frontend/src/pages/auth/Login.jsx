import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeftIcon,
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  UserPlusIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const Login = () => {
  const [email, setEmail] = useState('owner@dentitrack.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check for registration success message from navigation state
  useEffect(() => {
    console.log('Location state received:', location.state);
    
    if (location.state?.email) {
      setEmail(location.state.email);
      if (location.state?.message) {
        toast.success(location.state.message, { duration: 5000 });
      }
    }
  }, [location]);

  // Where each role lands after login. The server tells us the
  // account's role in the response — we no longer ask the person
  // to pick one up front.
  const redirectMap = {
    owner: '/owner/dashboard',
    doctor: '/doctor/dashboard',
    cashier: '/cashier/dashboard',
    platform_admin: '/admin/dashboard',
    nurse: '/nurse/dashboard',
    receptionist: '/receptionist/dashboard',
    lab_technician: '/lab/dashboard',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast.success(`Welcome, ${result.user.name}! 🎉`);
      navigate(redirectMap[result.user.role] || '/');
    } else {
      toast.error(result.message || 'Login failed. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F2F8FB] to-white p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        {/* Back Button */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1 text-[#5B6B72] hover:text-[#0EA5A5] transition-all mb-4 text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back</span>
        </button>

        {/* Show success message from registration */}
        {location.state?.message && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-green-800 text-sm font-medium">{location.state.message}</p>
                <p className="text-green-700 text-xs mt-1">
                  📧 We sent a confirmation to: <span className="font-semibold">{location.state.email}</span>
                </p>
                <p className="text-green-600 text-xs mt-1">
                  🔑 Please login with your registered email and password.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🦷</div>
          <h1 className="text-2xl font-heading font-bold text-[#0EA5A5]">DentiTrack</h1>
          <p className="text-[#5B6B72] text-sm">Sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email with Icon */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Email or Phone</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <EnvelopeIcon className="h-5 w-5 text-[#5B6B72]" />
              </div>
              <input 
                type="text" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all" 
                placeholder="owner@dentitrack.com" 
                required 
              />
            </div>
          </div>

          {/* Password with Icon + show/hide toggle */}
          <div className="mb-4">
            <label className="text-sm font-medium text-[#2B2B2B] mb-1.5 block">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-[#5B6B72]" />
              </div>
              <input 
                type={showPassword ? 'text' : 'password'} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0EA5A5]/30 focus:border-[#0EA5A5] transition-all" 
                placeholder="Enter your password" 
                required 
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5B6B72] hover:text-[#0EA5A5]"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password */}
          <div className="flex items-center justify-between mb-6">
            <Link to="/forgot-password" className="text-sm text-[#0EA5A5] hover:underline">
              Forgot Password?
            </Link>
          </div>

          {/* Sign In Button */}
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#0EA5A5] text-white py-2.5 rounded-lg font-medium hover:bg-[#0B7A7A] transition-all flex items-center justify-center"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* REGISTER LINK */}
        <div className="mt-6 text-center">
          <p className="text-sm text-[#5B6B72]">
            Don't have an account?{' '}
            <Link to="/register-clinic" className="text-[#0EA5A5] font-semibold hover:underline flex items-center justify-center gap-1">
              <UserPlusIcon className="w-4 h-4" />
              Register your clinic
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#5B6B72] mt-4">
          Dr. Rediet Dental Clinic - Addis Ababa, Ethiopia
        </p>
      </div>
    </div>
  );
};

export default Login;