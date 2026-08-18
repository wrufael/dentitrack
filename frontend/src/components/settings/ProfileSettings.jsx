import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import {
  KeyIcon,
  ShieldCheckIcon,
  PaintBrushIcon,
  BellIcon,
  LanguageIcon,
  GlobeAltIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const { user } = useAuth();
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [securityQuestions, setSecurityQuestions] = useState({
    question1: "",
    answer1: "",
    question2: "",
    answer2: ""
  });
  const [appearance, setAppearance] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    reminders: true
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || 'en';
  });

  // Apply theme on load and change
  useEffect(() => {
    document.documentElement.className = appearance === 'dark' ? 'dark' : '';
    localStorage.setItem('theme', appearance);
  }, [appearance]);

  // Apply language on load and change
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Handle Password Change
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      return toast.error("Please fill in all password fields");
    }
    if (passwords.next !== passwords.confirm) {
      return toast.error("New passwords don't match");
    }
    if (passwords.next.length < 8) {
      return toast.error("Password must be at least 8 characters");
    }
    toast.success("🔐 Password updated successfully!");
    setPasswords({ current: "", next: "", confirm: "" });
  };

  // Handle Security Questions
  const handleSecurityQuestions = (e) => {
    e.preventDefault();
    if (!securityQuestions.question1 || !securityQuestions.answer1) {
      return toast.error("Please complete at least one security question");
    }
    toast.success("🛡️ Security questions saved successfully!");
  };

  // Handle Appearance Change
  const handleAppearanceChange = (theme) => {
    setAppearance(theme);
    const themeName = theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'System';
    toast.success(`🎨 Theme changed to ${themeName} mode`);
  };

  // Handle Notifications
  const handleNotificationChange = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
    const label = key === 'email' ? 'Email' : key === 'push' ? 'Push' : 'Appointment Reminders';
    toast.success(`🔔 ${label} notifications ${!notifications[key] ? 'enabled' : 'disabled'}`);
  };

  // Handle Language Change
  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    const languageNames = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      ar: 'Arabic',
      am: 'Amharic',
      zh: 'Chinese',
      ja: 'Japanese'
    };
    toast.success(`🌍 Language changed to ${languageNames[e.target.value]}`);
  };

  // Save all settings
  const handleSaveAll = () => {
    toast.success("💾 All settings saved successfully!");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span className="bg-gradient-to-r from-teal-500 to-teal-600 p-2 rounded-xl">
              <UserCircleIcon className="w-6 h-6 text-white" />
            </span>
            Settings
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account preferences and security.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Change Password Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-teal-50 dark:bg-teal-900/30 rounded-xl">
                  <KeyIcon className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
              </div>
              
              <form onSubmit={handleChangePassword} className="space-y-4">
                <input 
                  type="password" 
                  placeholder="Current password" 
                  value={passwords.current} 
                  onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} 
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <input 
                  type="password" 
                  placeholder="New password" 
                  value={passwords.next} 
                  onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} 
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <input 
                  type="password" 
                  placeholder="Confirm new password" 
                  value={passwords.confirm} 
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} 
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                />
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl py-3 text-sm font-medium hover:from-teal-600 hover:to-teal-700 transform hover:scale-[1.02] transition-all duration-200 shadow-sm"
                >
                  Update Password
                </button>
              </form>
            </div>

            {/* Security Questions Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
                  <ShieldCheckIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Security Questions</h3>
              </div>
              
              <form onSubmit={handleSecurityQuestions} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Question 1</label>
                  <select 
                    value={securityQuestions.question1}
                    onChange={(e) => setSecurityQuestions({ ...securityQuestions, question1: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select a question...</option>
                    <option value="mother">What is your mother's maiden name?</option>
                    <option value="pet">What is the name of your first pet?</option>
                    <option value="school">What is the name of your elementary school?</option>
                    <option value="city">What city were you born in?</option>
                    <option value="car">What was your first car?</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Your Answer</label>
                  <input 
                    type="text" 
                    placeholder="Enter your answer"
                    value={securityQuestions.answer1}
                    onChange={(e) => setSecurityQuestions({ ...securityQuestions, answer1: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Question 2</label>
                  <select 
                    value={securityQuestions.question2}
                    onChange={(e) => setSecurityQuestions({ ...securityQuestions, question2: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  >
                    <option value="">Select a question...</option>
                    <option value="mother">What is your mother's maiden name?</option>
                    <option value="pet">What is the name of your first pet?</option>
                    <option value="school">What is the name of your elementary school?</option>
                    <option value="city">What city were you born in?</option>
                    <option value="car">What was your first car?</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Your Answer</label>
                  <input 
                    type="text" 
                    placeholder="Enter your answer"
                    value={securityQuestions.answer2}
                    onChange={(e) => setSecurityQuestions({ ...securityQuestions, answer2: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl py-3 text-sm font-medium hover:from-purple-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 shadow-sm"
                >
                  Save Security Questions
                </button>
              </form>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Appearance Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
                  <PaintBrushIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {['light', 'dark', 'system'].map((theme) => (
                  <button 
                    key={theme}
                    onClick={() => handleAppearanceChange(theme)}
                    className={`p-3 rounded-xl border-2 transition-all duration-200 capitalize ${
                      appearance === theme 
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20 shadow-md' 
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                  >
                    <span className="block text-2xl mb-1">
                      {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💻'}
                    </span>
                    <span className={`text-sm font-medium ${appearance === theme ? 'text-teal-600 dark:text-teal-400' : 'text-gray-600 dark:text-gray-300'}`}>
                      {theme}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
                  <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { key: 'email', label: 'Email Notifications', icon: '📧' },
                  { key: 'push', label: 'Push Notifications', icon: '📱' },
                  { key: 'reminders', label: 'Appointment Reminders', icon: '📅' }
                ].map((item) => (
                  <label 
                    key={item.key}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <span>{item.icon}</span>
                      {item.label}
                    </span>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        checked={notifications[item.key]}
                        onChange={() => handleNotificationChange(item.key)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Language Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-xl">
                  <LanguageIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Language</h3>
              </div>
              
              <select 
                value={language}
                onChange={handleLanguageChange}
                className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              >
                <option value="en">🇬🇧 English</option>
                <option value="es">🇪🇸 Spanish</option>
                <option value="fr">🇫🇷 French</option>
                <option value="de">🇩🇪 German</option>
                <option value="ar">🇸🇦 Arabic</option>
                <option value="am">🇪🇹 Amharic</option>
                <option value="zh">🇨🇳 Chinese</option>
                <option value="ja">🇯🇵 Japanese</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save All Button */}
        <div className="mt-8">
          <button 
            onClick={handleSaveAll}
            className="w-full bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-2xl py-4 text-base font-semibold hover:from-teal-600 hover:to-indigo-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg"
          >
            💾 Save All Settings
          </button>
        </div>
      </div>
    </div>
  );
}