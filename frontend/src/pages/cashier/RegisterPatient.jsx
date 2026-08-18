// pages/cashier/RegisterPatient.jsx
//
// Patient registration has been merged into the main Patients page
// (components/cashier/CashierPatients.jsx) — clicking "Register Patient"
// there now opens the same real-data modal that used to live on this
// standalone route.
//
// This file is kept only so any old links/bookmarks to /cashier/register
// don't break; it immediately redirects into /cashier/patients.

import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RegisterPatient = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/cashier/patients', { replace: true });
  }, [navigate]);

  return null;
};

export default RegisterPatient;