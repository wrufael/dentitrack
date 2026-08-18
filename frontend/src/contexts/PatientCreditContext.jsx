// src/contexts/PatientCreditContext.jsx
import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import api from "../api";
import { toast } from "react-hot-toast";

const PatientCreditContext = createContext(null);
const today = new Date().toISOString().slice(0, 10);

export function PatientCreditProvider({ children }) {
  const [creditRecords, setCreditRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  // GET /api/payments/credit-report
  const fetchCreditRecords = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/payments/credit-report");
      setCreditRecords(response.data?.data || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load patient credit records.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new credit record.
  // payload: { patient_id, doctor_id, service, total, due_date }
  const addCredit = async (payload) => {
    try {
      const response = await api.post("/payments", {
        patient_id: payload.patientId,
        doctor_id: payload.doctorId,
        items: [{ name: payload.service, price: payload.total }],
        due_date: payload.dueDate,
        notes: payload.notes || null,
      });

      const created = response.data?.data;
      if (!created) return null;

      // Refresh from the server so the row shows normalized fields
      // (patient name, request code, computed balance, etc).
      await fetchCreditRecords();
      return created;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not create credit record.");
      return null;
    }
  };

  // Record a payment against an existing credit record.
  // amount/method/proofFile — proofFile required for non-Cash methods.
  const addPayment = async (id, { amount, method, proofFile }) => {
    try {
      const formData = new FormData();
      formData.append("amount", amount);
      formData.append("payment_method", method);
      if (proofFile) formData.append("proof_photo", proofFile);

      await api.post(`/payments/${id}/collect`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      await fetchCreditRecords();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not record payment.");
      return false;
    }
  };

  // Derived rows: server sends paid/balance/status already, but "overdue"
  // is a client-side view on top of due date + balance (kept identical to
  // the original local logic so status colors/labels don't change).
  const rows = useMemo(
    () =>
      creditRecords.map((r) => {
        const status =
          r.balance <= 0
            ? "paid"
            : r.dueDate && r.dueDate < today
            ? "overdue"
            : r.paid > 0
            ? "partial"
            : "pending";
        return { ...r, status };
      }),
    [creditRecords]
  );

  const getRecordsForPatient = (patientId, patientName) =>
    rows.filter(
      (r) =>
        (patientId && String(r.patientId) === String(patientId)) ||
        (!r.patientId && patientName && r.patient === patientName)
    );

  const value = {
    creditRecords: rows,
    loading,
    fetchCreditRecords,
    addCredit,
    addPayment,
    getRecordsForPatient,
  };

  return <PatientCreditContext.Provider value={value}>{children}</PatientCreditContext.Provider>;
}

export function usePatientCredit() {
  const ctx = useContext(PatientCreditContext);
  if (!ctx) throw new Error("usePatientCredit must be used within a PatientCreditProvider");
  return ctx;
}
