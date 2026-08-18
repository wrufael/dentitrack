// src/App.jsx

import React from "react";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { AuthProvider } from "./contexts/AuthContext";
import { PatientsProvider } from "./contexts/PatientsContext";
import { AppointmentsProvider } from "./contexts/AppointmentsContext";
import { PaymentProvider } from "./contexts/PaymentContext";
import { PatientCreditProvider } from "./contexts/PatientCreditContext";

import AppRoutes from "./routes/AppRoutes";

import "./styles/global.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PatientsProvider>
          <AppointmentsProvider>
            <PaymentProvider>
              <PatientCreditProvider>
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: "#363636",
                      color: "#fff",
                      borderRadius: "12px",
                      padding: "16px",
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: "#1FAE6B",
                        secondary: "#fff",
                      },
                    },
                    error: {
                      duration: 4000,
                      iconTheme: {
                        primary: "#E5484D",
                        secondary: "#fff",
                      },
                    },
                  }}
                />

                <AppRoutes />
              </PatientCreditProvider>
            </PaymentProvider>
          </AppointmentsProvider>
        </PatientsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}