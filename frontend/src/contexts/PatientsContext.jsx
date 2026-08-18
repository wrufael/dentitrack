// src/contexts/PatientsContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

const PatientsContext = createContext();

export const PatientsProvider = ({ children }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Fetch all patients
  const fetchPatients = async () => {
    setLoading(true);
    try {
      const response = await api.get('/patients');
      setPatients(response.data);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      toast.error('Failed to load patients');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Get a single patient by ID
  const getPatient = async (id) => {
    try {
      const response = await api.get(`/patients/${id}`);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch patient:', error);
      toast.error('Failed to load patient details');
      return null;
    }
  };

  // Create a new patient
  const createPatient = async (patientData) => {
    try {
      const response = await api.post('/patients', patientData);
      const newPatient = response.data;
      setPatients(prev => [newPatient, ...prev]);
      toast.success(`Patient ${newPatient.name} registered successfully`);
      return newPatient;
    } catch (error) {
      console.error('Failed to create patient:', error);
      toast.error(error.response?.data?.message || 'Failed to register patient');
      return null;
    }
  };

  // Update a patient
  const updatePatient = async (id, patientData) => {
    try {
      const response = await api.put(`/patients/${id}`, patientData);
      const updated = response.data;
      setPatients(prev => prev.map(p => p.id === id ? updated : p));
      toast.success(`Patient ${updated.name} updated`);
      return updated;
    } catch (error) {
      console.error('Failed to update patient:', error);
      toast.error(error.response?.data?.message || 'Failed to update patient');
      return null;
    }
  };

  // Delete a patient
  const deletePatient = async (id) => {
    if (!window.confirm('Are you sure you want to delete this patient?')) return false;
    try {
      await api.delete(`/patients/${id}`);
      setPatients(prev => prev.filter(p => p.id !== id));
      toast.success('Patient deleted');
      return true;
    } catch (error) {
      console.error('Failed to delete patient:', error);
      toast.error(error.response?.data?.message || 'Failed to delete patient');
      return false;
    }
  };

  // Search patients
  const searchPatients = async (query) => {
    try {
      const response = await api.get(`/patients/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Failed to search patients:', error);
      return [];
    }
  };

  const value = {
    patients,
    loading,
    selectedPatient,
    setSelectedPatient,
    fetchPatients,
    getPatient,
    createPatient,
    updatePatient,
    deletePatient,
    searchPatients,
  };

  return (
    <PatientsContext.Provider value={value}>
      {children}
    </PatientsContext.Provider>
  );
};

export const usePatients = () => {
  const context = useContext(PatientsContext);
  if (!context) {
    throw new Error('usePatients must be used within a PatientsProvider');
  }
  return context;
};