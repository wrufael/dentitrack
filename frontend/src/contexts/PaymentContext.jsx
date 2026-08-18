import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const PaymentContext = createContext();

export const PaymentProvider = ({ children }) => {
  const [requests, setRequests] = useState([
    {
      id: 1,
      requestId: 'REQ-1001',
      patient: 'Abebe Bekele',
      patientId: 'PAT-001',
      doctor: 'Dr. Liya Hailu',
      date: '2026-07-31',
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
      createdAt: '2026-07-31T09:00:00',
      patientAge: 35,
      patientGender: 'Male',
      patientPhone: '+251 91 234 5678',
      notes: 'Patient has severe pain',
      isNew: false
    },
    {
      id: 2,
      requestId: 'REQ-1002',
      patient: 'Tigist Haile',
      patientId: 'PAT-002',
      doctor: 'Dr. Liya Hailu',
      date: '2026-07-31',
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
      createdAt: '2026-07-31T10:30:00',
      patientAge: 28,
      patientGender: 'Female',
      patientPhone: '+251 92 345 6789',
      notes: 'Regular cleaning',
      isNew: false
    },
  ]);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // ===== CREATE PAYMENT REQUEST =====
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
      patientPhone: data.patientPhone || '',
      notes: data.notes || '',
      isNew: true
    };

    setRequests(prev => [newRequest, ...prev]);

    // 🔔 SEND NOTIFICATION TO CASHIER
    const notification = {
      id: Date.now(),
      type: 'new_payment_request',
      title: '💳 New Payment Request',
      message: `${data.patient} - ETB ${total.toLocaleString()}`,
      requestId: newRequest.requestId,
      patient: data.patient,
      amount: total,
      read: false,
      createdAt: new Date().toISOString()
    };

    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // 🔔 Show toast notification
    toast.success(`🔔 New payment request from ${data.patient}!`, {
      duration: 5000,
      icon: '💳',
    });

    return newRequest;
  };

  // ===== COLLECT PAYMENT =====
  const collectPayment = (requestId, amount, method, proofImage) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const newPaid = req.paid + amount;
        const newBalance = req.total - newPaid;
        let newStatus = 'paid';
        if (newBalance > 0) newStatus = 'partial';
        
        const updated = {
          ...req,
          paid: newPaid,
          balance: newBalance,
          status: newStatus,
          cashier: 'Saron Kebede',
          paymentMethod: method,
          receipt: `RCP-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
          proofImage: proofImage || null,
          isNew: false
        };

        // 🔔 Notification for payment collected
        const notification = {
          id: Date.now(),
          type: 'payment_collected',
          title: '✅ Payment Collected',
          message: `${req.patient} - ETB ${amount.toLocaleString()} (${method})`,
          requestId: req.requestId,
          patient: req.patient,
          amount: amount,
          read: false,
          createdAt: new Date().toISOString()
        };

        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);

        toast.success(`✅ Payment collected from ${req.patient}!`);

        return updated;
      }
      return req;
    }));
  };

  // ===== START TREATMENT =====
  const startTreatment = (requestId) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId && req.status === 'paid') {
        return { ...req, status: 'done' };
      }
      return req;
    }));
  };

  // ===== UPDATE REQUEST =====
  const updatePaymentRequest = (requestId, data) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        const total = data.items.reduce((sum, item) => sum + item.price, 0);
        return {
          ...req,
          items: data.items,
          total: total,
          balance: total - req.paid,
          notes: data.notes || req.notes
        };
      }
      return req;
    }));
  };

  // ===== CANCEL REQUEST =====
  const cancelPaymentRequest = (requestId) => {
    setRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        return { ...req, status: 'cancelled' };
      }
      return req;
    }));
  };

  // ===== MARK NOTIFICATION AS READ =====
  const markAsRead = (notificationId) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // ===== MARK ALL AS READ =====
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // ===== GET PENDING REQUESTS =====
  const getPendingRequests = () => {
    return requests.filter(req => req.status === 'pending' || req.status === 'partial');
  };

  // ===== GET REQUEST BY ID =====
  const getRequestById = (id) => {
    return requests.find(req => req.id === id || req.requestId === id);
  };

  // ===== GET REQUESTS BY PATIENT =====
  const getRequestsByPatient = (patientId) => {
    return requests.filter(req => req.patientId === patientId);
  };

  // ===== GET TODAY'S REQUESTS =====
  const getTodayRequests = () => {
    const today = new Date().toISOString().slice(0, 10);
    return requests.filter(req => req.date === today);
  };

  const value = {
    requests,
    paymentRequests: requests,
    notifications,
    unreadCount,
    createPaymentRequest,
    collectPayment,
    startTreatment,
    updatePaymentRequest,
    cancelPaymentRequest,
    getPendingRequests,
    getRequestById,
    getRequestsByPatient,
    getTodayRequests,
    markAsRead,
    markAllAsRead,
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