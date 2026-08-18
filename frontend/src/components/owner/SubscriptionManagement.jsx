import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  ClockIcon,
  UserGroupIcon,
  UsersIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

const SubscriptionManagement = () => {
  const { user } = useAuth();

  const [currentPlan, setCurrentPlan] = useState({
    name: 'Standard',
    price: 2500,
    daysLeft: 45,
    expiresAt: '2026-09-08',
    features: ['5 Doctors', '3 Cashiers', '3,000 Patients', 'Advanced Reports', 'Inventory Management']
  });

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('premium');

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 1000,
      features: ['1 Doctor', '1 Cashier', '300 Patients', 'Basic Reports'],
      icon: '📋'
    },
    {
      id: 'standard',
      name: 'Standard',
      price: 2500,
      features: ['5 Doctors', '3 Cashiers', '3,000 Patients', 'Advanced Reports', 'Inventory Management'],
      icon: '⭐',
      current: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 5000,
      features: ['Unlimited Doctors', 'Unlimited Cashiers', 'Unlimited Patients', 'Full Analytics', 'Priority Support', 'Custom Features'],
      icon: '👑'
    }
  ];

  const handleUpgrade = () => {
    toast.success(`✅ Upgraded to ${selectedPlan}! Subscription will be updated.`);
    setShowUpgradeModal(false);
  };

  return (
    <div>
      <h2 className="text-2xl font-heading font-bold text-[#2B2B2B] mb-6">💳 Subscription Management</h2>

      {/* Current Plan Card */}
      <div className="bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] rounded-2xl shadow-lg p-8 mb-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm text-white/70">Current Plan</div>
            <div className="text-3xl font-heading font-bold mt-1">{currentPlan.name}</div>
            <div className="text-xl font-bold mt-1">ETB {currentPlan.price.toLocaleString()}/month</div>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <div className="flex items-center gap-2 justify-end">
              <ClockIcon className="w-5 h-5 text-white/70" />
              <span className="text-sm text-white/70">Days Remaining</span>
            </div>
            <div className="text-4xl font-heading font-bold">{currentPlan.daysLeft} days</div>
            <div className="text-sm text-white/70">Expires: {currentPlan.expiresAt}</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${(currentPlan.daysLeft / 90) * 100}%` }}
            />
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 flex flex-wrap gap-3">
          {currentPlan.features.map((feature, i) => (
            <span key={i} className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full">
              <CheckCircleIcon className="w-4 h-4" />
              {feature}
            </span>
          ))}
        </div>

        <div className="mt-6 flex gap-4">
          <button 
            onClick={() => setShowUpgradeModal(true)}
            className="bg-white text-[#0EA5A5] px-6 py-2 rounded-xl font-semibold hover:bg-white/90 transition-all"
          >
            Upgrade Plan
          </button>
          <button className="border border-white/50 text-white px-6 py-2 rounded-xl font-semibold hover:bg-white/10 transition-all">
            Renew Now
          </button>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#5B6B72]">Doctors Used</div>
              <div className="text-2xl font-heading font-bold text-[#2B2B2B]">3 / 5</div>
            </div>
            <div className="p-3 bg-[#0EA5A5]/10 rounded-xl">
              <UserGroupIcon className="w-6 h-6 text-[#0EA5A5]" />
            </div>
          </div>
          <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#0EA5A5] rounded-full" style={{ width: '60%' }} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#5B6B72]">Cashiers Used</div>
              <div className="text-2xl font-heading font-bold text-[#2B2B2B]">2 / 3</div>
            </div>
            <div className="p-3 bg-[#0EA5A5]/10 rounded-xl">
              <UsersIcon className="w-6 h-6 text-[#0EA5A5]" />
            </div>
          </div>
          <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#0EA5A5] rounded-full" style={{ width: '67%' }} />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-[#5B6B72]">Patients Used</div>
              <div className="text-2xl font-heading font-bold text-[#2B2B2B]">1,247 / 3,000</div>
            </div>
            <div className="p-3 bg-[#0EA5A5]/10 rounded-xl">
              <UsersIcon className="w-6 h-6 text-[#0EA5A5]" />
            </div>
          </div>
          <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#0EA5A5] rounded-full" style={{ width: '42%' }} />
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-[#0EA5A5] to-[#0B7A7A] p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-heading font-bold text-white">🚀 Upgrade Plan</h2>
                  <p className="text-white/80 text-sm">Choose a plan that fits your clinic</p>
                </div>
                <button onClick={() => setShowUpgradeModal(false)} className="p-2 hover:bg-white/20 rounded-lg text-white">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-[#0EA5A5] bg-[#0EA5A5]/5 shadow-sm'
                        : 'border-gray-200 hover:border-[#0EA5A5]/50'
                    } ${plan.current ? 'border-[#0EA5A5] bg-[#0EA5A5]/10' : ''}`}
                  >
                    <input
                      type="radio"
                      name="plan"
                      value={plan.id}
                      checked={selectedPlan === plan.id}
                      onChange={() => setSelectedPlan(plan.id)}
                      className="sr-only"
                    />
                    <div className="text-center">
                      <div className="text-2xl">{plan.icon}</div>
                      <div className="font-heading font-bold text-[#2B2B2B]">{plan.name}</div>
                      <div className="text-xl font-bold text-[#0EA5A5]">ETB {plan.price.toLocaleString()}</div>
                      <div className="text-xs text-[#5B6B72] mt-2">
                        {plan.features.map((f, i) => (
                          <div key={i} className="flex items-center justify-center gap-1 py-0.5">
                            <CheckCircleIcon className="w-3 h-3 text-[#1FAE6B]" />
                            <span>{f}</span>
                          </div>
                        ))}
                      </div>
                      {plan.current && (
                        <span className="inline-block mt-2 bg-[#0EA5A5] text-white text-xs px-2 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="flex-1 bg-gray-100 text-[#2B2B2B] py-2.5 rounded-xl font-medium hover:bg-gray-200 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  className="flex-1 bg-[#0EA5A5] text-white py-2.5 rounded-xl font-medium hover:bg-[#0B7A7A] transition-all"
                >
                  Upgrade Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;