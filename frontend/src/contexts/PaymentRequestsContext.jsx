import React, { createContext, useContext, useState } from 'react';

const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const [requests, setRequests] = useState([
    {
      id: 1,
      requestId: 'REQ-1001',
      patient: 'Abebe Bekele',
      patientId: 'PAY-3801',
      doctor: 'Dr. Liya Hailu',
      date: '2026-07-27',
      items: [
        { name: 'Root Canal', price: 2850 },
        { name: 'X-Ray', price: 350 }
      ],
      total: 3200,
      paid: 0,
      balance: 3200,
      status: 'pending',
      cashier: null,
      paymentMethod: null,
      receipt: null,
      createdAt: '2026-07-27T09:00:00',
      patientAge: 35,
      patientGender: 'Male',
      patientPhone: '+251 91 234 5678'
    },
    {
      id: 2,
      requestId: 'REQ-1002',
      patient: 'Tigist Haile',
      patientId: 'PAY-3802',
      doctor: 'Dr. Liya Hailu',
      date: '2026-07-26',
      items: [
        { name: 'Teeth Cleaning', price: 600 }
      ],
      total: 600,
      paid: 0,
      balance: 600,
      status: 'pending',
      cashier: null,
      paymentMethod: null,
      receipt: null,
      createdAt: '2026-07-26T10:30:00',
      patientAge: 28,
      patientGender: 'Female',
      patientPhone: '+251 92 345 6789'
    },
    {
      id: 3,
      requestId: 'REQ-1003',
      patient: 'Dawit Tesfaye',
      patientId: 'PAY-3803',
      doctor: 'Dr. Liya Hailu',
      date: '2026-07-25',
      items: [
        { name: 'X-Ray', price: 550 }
      ],
      total: 550,
      paid: 200,
      balance: 350,
      status: 'partial',
      cashier: 'Saron Kebede',
      paymentMethod: 'Telebirr',
      receipt: 'RCP-002',
      createdAt: '2026-07-25T14:00:00',
      patientAge: 42,
      patientGender: 'Male',
      patientPhone: '+251 93 456 7890'
    },
    {
      id: 4,
      requestId: 'REQ-1004',
      patient: 'Hiwot Girma',
      patientId: 'PAY-3804',
      doctor: 'Dr. Liya Hailu',
      date: '2026-07-24',
      items: [
        { name: 'Filling', price: 1400 }
      ],
      total: 1400,
      paid: 1400,
      balance: 0,
      status: 'paid',
      cashier: 'Saron Kebede',
      paymentMethod: 'Cash',
      receipt: 'RCP-003',
      createdAt: '2026-07-24T11:00:00',
      patientAge: 24,
      patientGender: 'Female',
      patientPhone: '+251 94 567 8901'
    },
    {
      id: 5,
      requestId: 'REQ-1005',
      patient: 'Meron Alemu',
      patientId: 'PAY-3805',
      doctor: 'Dr. Liya Hailu',
      date: '2026-07-23',
      items: [
        { name: 'Teeth Cleaning', price: 600 },
        { name: 'Whitening', price: 1200 }
      ],
      total: 1800,
      paid: 1800,
      balance: 0,
      status: 'done',
      cashier: 'Saron Kebede',
      paymentMethod: 'CBEBirr',
      receipt: 'RCP-004',
      createdAt: '2026-07-23T15:30:00',
      patientAge: 31,
      patientGender: 'Female',
      patientPhone: '+251 95 678 9012'
    },
  ]);

  // ✅ CREATE PAYMENT REQUEST (Doctor)
  const createPaymentRequest = (data) => {
    const total = data.items.reduce((sum, item) => sum + item.price, 0);
    const newRequest = {
      id: requests.length + 1,
      requestId: `REQ-${1000 + requests.length + 1}`,
      patient: data.patient,
      patientId: data.patientId || `PAT-${String(requests.length + 1).padStart(4, '0')}`,
      doctor: data.doctor || 'Dr. Liya Hailu',
      date: new Date().toISOString().slice(0, 10),
      items: data.items,
      total: total,
      paid: 0,
      balance: total,
      status: 'pending',
      cashier: null,
      paymentMethod: null,
      receipt: null,
      createdAt: new Date().toISOString(),
      patientAge: data.patientAge || 0,
      patientGender: data.patientGender || 'Not specified',
      patientPhone: data.patientPhone || ''
    };
    setRequests(prev => [newRequest, ...prev]);
    return newRequest;
  };

  // ✅ COLLECT PAYMENT (Cashier)
  const collectPayment = (requestId, amount, method, proofImage) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const newPaid = req.paid + amount;
        const newBalance = req.total - newPaid;
        let newStatus = 'paid';
        if (newBalance > 0) newStatus = 'partial';

        return {
          ...req,
          paid: newPaid,
          balance: newBalance,
          status: newStatus,
          cashier: 'Saron Kebede',
          paymentMethod: method,
          receipt: `RCP-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          proofImage: proofImage || null
        };
      }
      return req;
    }));
  };

  // ✅ START TREATMENT (Doctor)
  const startTreatment = (requestId) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId && req.status === 'paid') {
        return { ...req, status: 'done' };
      }
      return req;
    }));
  };

  // ✅ GET PENDING REQUESTS (Cashier)
  const getPendingRequests = () => {
    return requests.filter(req => req.status === 'pending' || req.status === 'partial');
  };

  // ✅ GET ALL REQUESTS (Doctor)
  const getDoctorRequests = () => {
    return requests;
  };

  const value = {
    requests,
    paymentRequests: requests,
    createPaymentRequest,
    collectPayment,
    startTreatment,
    getPendingRequests,
    getDoctorRequests,
    setRequests
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export const usePayments = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
};

// ---------------------------------------------------------------------
// Aliases: some components import this context under a different name
// (PaymentRequestsProvider / usePaymentRequests). Rather than renaming
// every file that uses the "Payment..." naming, we export both names
// here so both work.
// ---------------------------------------------------------------------
export const PaymentRequestsProvider = PaymentProvider;
export const usePaymentRequests = usePayments;