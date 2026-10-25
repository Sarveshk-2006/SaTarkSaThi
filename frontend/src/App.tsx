import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { LanguageProvider } from './context/LanguageContext';
import { SeniorModeProvider, useSeniorMode } from './context/SeniorModeContext';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ScannerPage } from './pages/ScannerPage';
import { FamilyShieldPage } from './pages/FamilyShieldPage';
import { PaymentCheckpointPage } from './pages/PaymentCheckpointPage';
import { GoldenHourRecoveryPage } from './pages/GoldenHourRecoveryPage';
import { IncidentHistoryPage } from './pages/IncidentHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { MockUpiPage } from './pages/MockUpiPage';
import { SeniorHome } from './components/senior/SeniorHome';

import { NotificationProvider } from './context/NotificationContext';

const HomeRoute: React.FC = () => {
  const { seniorMode } = useSeniorMode();
  return seniorMode ? <SeniorHome /> : <OverviewPage />;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <DemoModeProvider>
        <LanguageProvider>
          <SeniorModeProvider>
            <NotificationProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<AppLayout />}>
                    <Route index element={<HomeRoute />} />
                    <Route path="scanner" element={<ScannerPage />} />
                    <Route path="payment-checkpoint" element={<PaymentCheckpointPage />} />
                    <Route path="family-shield" element={<FamilyShieldPage />} />
                    <Route path="golden-hour" element={<GoldenHourRecoveryPage />} />
                    <Route path="incident-history" element={<IncidentHistoryPage />} />
                    <Route path="mock-upi" element={<MockUpiPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </NotificationProvider>
          </SeniorModeProvider>
        </LanguageProvider>
      </DemoModeProvider>
    </ToastProvider>
  );
};

export default App;
