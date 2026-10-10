import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getToken } from './services/api';
import { AppLayout } from './layouts/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { EventsPage } from './pages/EventsPage';
import { VolunteersPage } from './pages/VolunteersPage';
import { HourLedgerPage } from './pages/HourLedgerPage';
import { EligibilityReportPage } from './pages/EligibilityReportPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { PublicVerificationPage } from './pages/PublicVerificationPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = getToken();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify" element={<PublicVerificationPage />} />

        {/* Protected App Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="volunteers" element={<VolunteersPage />} />
          <Route path="hours" element={<HourLedgerPage />} />
          <Route path="reports/eligibility" element={<EligibilityReportPage />} />
          <Route path="certificates" element={<CertificatesPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
