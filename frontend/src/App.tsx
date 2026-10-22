import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ScannerPage } from './pages/ScannerPage';
import { FamilyShieldPage } from './pages/FamilyShieldPage';
import { PaymentCheckpointPage } from './pages/PaymentCheckpointPage';
import { GoldenHourRecoveryPage } from './pages/GoldenHourRecoveryPage';
import { IncidentHistoryPage } from './pages/IncidentHistoryPage';
import { SettingsPage } from './pages/SettingsPage';

import { NotificationProvider } from './context/NotificationContext';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <DemoModeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<OverviewPage />} />
                  <Route path="scanner" element={<ScannerPage />} />
                  <Route path="payment-checkpoint" element={<PaymentCheckpointPage />} />
                  <Route path="family-shield" element={<FamilyShieldPage />} />
                  <Route path="golden-hour" element={<GoldenHourRecoveryPage />} />
                  <Route path="incident-history" element={<IncidentHistoryPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </NotificationProvider>
        </LanguageProvider>
      </DemoModeProvider>
    </ToastProvider>
  );
};

export default App;
