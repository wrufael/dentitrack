import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Loader,
  ArrowLeft,
  FileText,
  User,
  Mail,
  Phone,
  Lock,
  Building,
  MapPin,
  Globe,
  Calendar,
  Users
} from 'lucide-react';

export default function RegisterClinic() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [formData, setFormData] = useState({
    // Clinic Info
    clinicName: '',
    clinicEmail: '',
    clinicPhone: '',
    taxId: '',
    address: '',
    city: '',
    country: 'Ethiopia',
    website: '',
    // Owner Info
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    password: '',
    confirmPassword: '',
    // Documents
    businessLicense: null,
    ownerId: null,
    clinicPhoto: null,
    // Subscription
    subscriptionPlan: 'standard',
    // Payment
    paymentMethod: 'telebirr',
    transactionId: '',
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    }
  };

  const validateStep = (stepNum) => {
    const newErrors = {};
    
    if (stepNum === 1) {
      if (!formData.clinicName) newErrors.clinicName = 'Clinic name is required';
      if (!formData.clinicEmail) newErrors.clinicEmail = 'Clinic email is required';
      if (!formData.clinicPhone) newErrors.clinicPhone = 'Phone is required';
      if (!formData.ownerName) newErrors.ownerName = 'Owner name is required';
      if (!formData.ownerEmail) newErrors.ownerEmail = 'Owner email is required';
      if (!formData.ownerPhone) newErrors.ownerPhone = 'Owner phone is required';
      if (!formData.password) newErrors.password = 'Password is required';
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    if (stepNum === 2) {
      if (!formData.businessLicense) newErrors.businessLicense = 'Business license is required';
      if (!formData.ownerId) newErrors.ownerId = 'Owner ID is required';
      if (!formData.clinicPhoto) newErrors.clinicPhoto = 'Clinic photo is required';
    }
    
    if (stepNum === 3) {
      if (!formData.subscriptionPlan) {
        newErrors.subscriptionPlan = 'Please select a subscription plan';
      }
    }
    
    if (stepNum === 4) {
      if (!formData.paymentMethod) newErrors.paymentMethod = 'Please select a payment method';
      if (!formData.transactionId) newErrors.transactionId = 'Transaction ID is required';
      if (formData.transactionId.length < 4) {
        newErrors.transactionId = 'Please enter a valid transaction ID';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const isValid = validateStep(step);
    if (isValid) {
      if (step < 4) {
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      const firstError = Object.values(errors)[0];
      if (firstError) {
        toast.error(firstError);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Process Payment
  const processPayment = async () => {
    setPaymentProcessing(true);
    setPaymentStatus('processing');
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo, always success
      setPaymentStatus('success');
      toast.success('✅ Payment processed successfully!');
      return true;
      
    } catch (error) {
      setPaymentStatus('failed');
      toast.error('❌ Payment failed. Please try again.');
      return false;
    }
  };

  // Handle Complete Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) {
      const firstError = Object.values(errors)[0];
      if (firstError) toast.error(firstError);
      return;
    }
    
    // Process payment first
    const paymentSuccess = await processPayment();
    
    if (!paymentSuccess) {
      return;
    }
    
    setLoading(true);
    try {
      const submissionData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          submissionData.append(key, formData[key]);
        }
      });
      submissionData.append('paymentStatus', 'completed');

      // Use the correct API endpoint - check your routes
      const response = await axios.post('/api/register-clinic', submissionData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('🎉 Clinic registered successfully!');
        
        // Navigate to login with pre-filled email
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              fromRegistration: true,
              email: formData.ownerEmail,
              message: '✅ Registration successful! Please login with your credentials.'
            } 
          });
        }, 1500);
      } else {
        toast.error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
      setPaymentProcessing(false);
    }
  };

  // Handle Save and Later
  const handleSaveAndLater = async () => {
    try {
      const saveData = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          saveData.append(key, formData[key]);
        }
      });
      saveData.append('status', 'draft');

      const response = await axios.post('/api/save-registration-draft', saveData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        toast.success('💾 Registration saved! You can continue later.');
        navigate('/login');
      }
    } catch (error) {
      toast.error('Failed to save. Please try again.');
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel registration? All data will be lost.')) {
      toast.info('Registration cancelled.');
      navigate('/');
    }
  };

  const totalSteps = 4;
  const steps = ['Clinic Info', 'Documents', 'Subscription', 'Payment'];

  const getPlanPrice = () => {
    switch(formData.subscriptionPlan) {
      case 'basic': return '1,000 ETB';
      case 'standard': return '2,500 ETB';
      case 'premium': return '5,000 ETB';
      default: return '2,500 ETB';
    }
  };

  const getPlanName = () => {
    switch(formData.subscriptionPlan) {
      case 'basic': return 'Basic';
      case 'standard': return 'Standard';
      case 'premium': return 'Premium';
      default: return 'Standard';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-teal-600 hover:text-teal-700">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🦷</div>
            <h1 className="text-3xl font-bold text-gray-900">Register Your Clinic</h1>
            <p className="text-gray-500">Fill in the details to request clinic registration</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((label, index) => (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step > index + 1 ? 'bg-teal-500 text-white' :
                      step === index + 1 ? 'bg-teal-600 text-white ring-4 ring-teal-200' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      {step > index + 1 ? '✓' : index + 1}
                    </div>
                    <span className="text-xs mt-1 text-gray-500">{label}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${
                      step > index + 1 ? 'bg-teal-500' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Step 1: Clinic Information */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Clinic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Name *</label>
                    <input
                      type="text"
                      name="clinicName"
                      value={formData.clinicName}
                      onChange={handleInputChange}
                      className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.clinicName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="e.g., Smile Dental Clinic"
                    />
                    {errors.clinicName && <p className="text-red-500 text-sm mt-1">{errors.clinicName}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Clinic Email *</label>
                    <input
                      type="email"
                      name="clinicEmail"
                      value={formData.clinicEmail}
                      onChange={handleInputChange}
                      className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.clinicEmail ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="clinic@email.com"
                    />
                    {errors.clinicEmail && <p className="text-red-500 text-sm mt-1">{errors.clinicEmail}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                    <input
                      type="tel"
                      name="clinicPhone"
                      value={formData.clinicPhone}
                      onChange={handleInputChange}
                      className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        errors.clinicPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="+251 91 234 5678"
                    />
                    {errors.clinicPhone && <p className="text-red-500 text-sm mt-1">{errors.clinicPhone}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                    <input
                      type="text"
                      name="taxId"
                      value={formData.taxId}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Tax identification number"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Full address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Addis Ababa"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="Ethiopia"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      placeholder="www.clinic.com"
                    />
                  </div>
                </div>

                <div className="border-t pt-6 mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Owner Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                      <input
                        type="text"
                        name="ownerName"
                        value={formData.ownerName}
                        onChange={handleInputChange}
                        className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.ownerName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Dr. John Doe"
                      />
                      {errors.ownerName && <p className="text-red-500 text-sm mt-1">{errors.ownerName}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email *</label>
                      <input
                        type="email"
                        name="ownerEmail"
                        value={formData.ownerEmail}
                        onChange={handleInputChange}
                        className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.ownerEmail ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="owner@email.com"
                      />
                      {errors.ownerEmail && <p className="text-red-500 text-sm mt-1">{errors.ownerEmail}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Owner Phone *</label>
                      <input
                        type="tel"
                        name="ownerPhone"
                        value={formData.ownerPhone}
                        onChange={handleInputChange}
                        className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.ownerPhone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="+251 91 234 5678"
                      />
                      {errors.ownerPhone && <p className="text-red-500 text-sm mt-1">{errors.ownerPhone}</p>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Min 8 characters"
                      />
                      {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Confirm your password"
                      />
                      {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Documents */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Documents *</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    errors.businessLicense ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-teal-500'
                  }`}>
                    <div className="mb-3 text-4xl">📄</div>
                    <label className="block cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">Business License *</span>
                      <input
                        type="file"
                        name="businessLicense"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.png"
                        className="hidden"
                      />
                      <div className="mt-2 text-sm text-teal-600 hover:text-teal-700">
                        {formData.businessLicense ? formData.businessLicense.name : 'Upload License'}
                      </div>
                    </label>
                    {errors.businessLicense && <p className="text-red-500 text-sm mt-2">{errors.businessLicense}</p>}
                  </div>
                  
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    errors.ownerId ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-teal-500'
                  }`}>
                    <div className="mb-3 text-4xl">🪪</div>
                    <label className="block cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">Owner ID *</span>
                      <input
                        type="file"
                        name="ownerId"
                        onChange={handleFileChange}
                        accept=".pdf,.jpg,.png"
                        className="hidden"
                      />
                      <div className="mt-2 text-sm text-teal-600 hover:text-teal-700">
                        {formData.ownerId ? formData.ownerId.name : 'Upload ID'}
                      </div>
                    </label>
                    {errors.ownerId && <p className="text-red-500 text-sm mt-2">{errors.ownerId}</p>}
                  </div>
                  
                  <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                    errors.clinicPhoto ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-teal-500'
                  }`}>
                    <div className="mb-3 text-4xl">🏥</div>
                    <label className="block cursor-pointer">
                      <span className="text-sm font-medium text-gray-700">Clinic Photo *</span>
                      <input
                        type="file"
                        name="clinicPhoto"
                        onChange={handleFileChange}
                        accept=".jpg,.png"
                        className="hidden"
                      />
                      <div className="mt-2 text-sm text-teal-600 hover:text-teal-700">
                        {formData.clinicPhoto ? formData.clinicPhoto.name : 'Upload Photo'}
                      </div>
                    </label>
                    {errors.clinicPhoto && <p className="text-red-500 text-sm mt-2">{errors.clinicPhoto}</p>}
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 text-center">* All documents are required</p>
              </div>
            )}

            {/* Step 3: Subscription */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Select Subscription Plan</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      id: 'basic',
                      name: 'Basic',
                      price: '1,000 ETB',
                      features: ['1 Doctor', '1 Cashier', '300 Patients', 'Basic Reports', 'Email Support']
                    },
                    {
                      id: 'standard',
                      name: 'Standard',
                      price: '2,500 ETB',
                      features: ['5 Doctors', '3 Cashiers', '3,000 Patients', 'Advanced Reports', 'Inventory Management', 'Priority Support'],
                      popular: true
                    },
                    {
                      id: 'premium',
                      name: 'Premium',
                      price: '5,000 ETB',
                      features: ['Unlimited Doctors', 'Unlimited Cashiers', 'Unlimited Patients', 'Full Analytics', 'Inventory Management', '24/7 Priority Support', 'Custom Features']
                    }
                  ].map((plan) => (
                    <div
                      key={plan.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, subscriptionPlan: plan.id }));
                        if (errors.subscriptionPlan) {
                          setErrors(prev => ({ ...prev, subscriptionPlan: '' }));
                        }
                      }}
                      className={`border-2 rounded-xl p-6 cursor-pointer transition-all relative ${
                        formData.subscriptionPlan === plan.id
                          ? 'border-teal-500 shadow-lg bg-teal-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-500 text-white text-xs px-4 py-1 rounded-full font-medium">
                          Popular
                        </span>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 text-center capitalize">{plan.name}</h3>
                      <p className="text-2xl font-bold text-teal-600 text-center my-3">{plan.price}</p>
                      <ul className="space-y-2">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                            <span className="text-teal-500">✓</span> {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {errors.subscriptionPlan && <p className="text-red-500 text-sm text-center">{errors.subscriptionPlan}</p>}
              </div>
            )}

            {/* Step 4: Payment */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Payment</h2>
                
                {paymentStatus === 'success' && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-semibold text-green-800">Payment Successful!</p>
                      <p className="text-sm text-green-700">Your payment has been processed successfully.</p>
                    </div>
                  </div>
                )}

                {paymentStatus === 'failed' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <div>
                      <p className="font-semibold text-red-800">Payment Failed</p>
                      <p className="text-sm text-red-700">Please try again or use a different payment method.</p>
                    </div>
                  </div>
                )}

                {paymentStatus === 'processing' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                    <Loader className="w-6 h-6 text-blue-600 animate-spin" />
                    <div>
                      <p className="font-semibold text-blue-800">Processing Payment...</p>
                      <p className="text-sm text-blue-700">Please wait while we verify your transaction.</p>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    💳 Please complete payment using one of the methods below. 
                    Enter the transaction ID to verify your payment.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { id: 'telebirr', name: 'TeleBirr', icon: Smartphone, description: 'Pay with TeleBirr mobile money' },
                    { id: 'bank', name: 'Bank Transfer', icon: Building2, description: 'Direct bank transfer' },
                    { id: 'card', name: 'Card Payment', icon: CreditCard, description: 'Credit or Debit card' }
                  ].map((method) => (
                    <div
                      key={method.id}
                      onClick={() => {
                        setFormData(prev => ({ ...prev, paymentMethod: method.id }));
                        if (errors.paymentMethod) {
                          setErrors(prev => ({ ...prev, paymentMethod: '' }));
                        }
                      }}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all ${
                        formData.paymentMethod === method.id
                          ? 'border-teal-500 bg-teal-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          formData.paymentMethod === method.id
                            ? 'bg-teal-100 text-teal-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <method.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{method.name}</p>
                          <p className="text-xs text-gray-500">{method.description}</p>
                        </div>
                        {formData.paymentMethod === method.id && (
                          <CheckCircle className="w-5 h-5 text-teal-500 ml-auto" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {errors.paymentMethod && <p className="text-red-500 text-sm">{errors.paymentMethod}</p>}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Transaction ID *
                    <span className="text-xs text-gray-400 ml-2">
                      (Enter the transaction ID from your payment)
                    </span>
                  </label>
                  <input
                    type="text"
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleInputChange}
                    className={`w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                      errors.transactionId ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="e.g., Bgff4263"
                  />
                  {errors.transactionId && (
                    <p className="text-red-500 text-sm mt-1">{errors.transactionId}</p>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <h3 className="font-semibold text-gray-900">Order Summary</h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Plan:</span>
                    <span className="font-medium text-gray-900">{getPlanName()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium text-gray-900 capitalize">
                      {formData.paymentMethod === 'telebirr' ? 'TeleBirr' :
                       formData.paymentMethod === 'bank' ? 'Bank Transfer' : 'Card Payment'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-teal-600 text-lg">{getPlanPrice()}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                  >
                    ← Back
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSaveAndLater}
                    className="px-6 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
                  >
                    💾 Save & Continue Later
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                  >
                    ✕ Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={loading || paymentProcessing}
                    className="flex-1 px-8 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-lg font-medium hover:from-teal-600 hover:to-teal-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-w-[200px]"
                  >
                    {loading || paymentProcessing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Registration ✓'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Navigation Buttons for Steps 1-3 */}
            {step < 4 && (
              <div className="flex justify-between mt-8 pt-6 border-t">
                <button
                  type="button"
                  onClick={handleBack}
                  className={`px-6 py-2.5 rounded-lg font-medium ${
                    step === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={step === 1}
                >
                  ← Back
                </button>
                
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-colors flex items-center gap-2"
                >
                  Next →
                </button>
              </div>
            )}
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link to="/login" className="text-teal-600 hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}