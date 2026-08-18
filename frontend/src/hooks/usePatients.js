import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const usePatients = (searchTerm = '') => {
  const [patients, setPatients] = useState([]);
  const [summary, setSummary] = useState({ total: 0, male: 0, female: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/patients', {
        params: searchTerm ? { search: searchTerm } : {},
      });
      setPatients(response.data.data);
      setSummary(response.data.summary);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  return { patients, summary, loading, error, refetch: fetchPatients };
};

export const registerPatient = async (formData) => {
  const response = await api.post('/patients', {
    full_name: formData.fullName,
    phone: formData.phone,
    age: formData.age,
    address: formData.address,
    gender: formData.gender,
  });
  return response.data;
};