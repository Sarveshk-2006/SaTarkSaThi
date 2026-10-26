import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { DemoModeProvider } from './context/DemoModeContext';
import { LanguageProvider } from './context/LanguageContext';
import { SeniorModeProvider, useSeniorMode } from './context/SeniorModeContext';
import { AuthSessionProvider, useAuthSession } from './context/AuthSessionContext';
import { ViewModeProvider, useViewMode } from './context/ViewModeContext';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { ScannerPage } from './pages/ScannerPage';
import { FamilyShieldPage } from './pages/FamilyShieldPage';
import { PaymentCheckpointPage } from './pages/PaymentCheckpointPage';
import { GoldenHourRecoveryPage } from './pages/GoldenHourRecoveryPage';
import { IncidentHistoryPage } from './pages/IncidentHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { ApkTestbedPage } from './pages/ApkTestbedPage';
import { SeniorHome } from './components/senior/SeniorHome';

import { NotificationProvider } from './context/NotificationContext';

const HomeRoute: React.FC = () => {
  const { seniorMode } = useSeniorMode();
  return seniorMode ? <SeniorHome /> : <OverviewPage />;
};

/** Signed-out visitors see the landing page at "/" and are sent to sign-in for anything else. */
const RequireSession: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { session } = useAuthSession();
  const location = useLocation();
  if (session) return children;
  if (location.pathname === '/') return <Navigate to="/welcome" replace />;
  return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
};

const LoginRoute: React.FC = () => {
  const { session } = useAuthSession();
  return session ? <Navigate to="/" replace /> : <LoginPage />;
};

/** Old links to /mock-upi now switch the whole UI into App mode. */
const OpenAppMode: React.FC = () => {
  const { setViewMode } = useViewMode();
  useEffect(() => setViewMode('app'), [setViewMode]);
  return <Navigate to="/" replace />;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <DemoModeProvider>
        <LanguageProvider>
          <SeniorModeProvider>
            <AuthSessionProvider>
              <ViewModeProvider>
                <NotificationProvider>
                  <BrowserRouter>
                    <Routes>
                      <Route path="/welcome" element={<LandingPage />} />
                      <Route path="/login" element={<LoginRoute />} />
                      <Route path="/apk-testbed" element={<ApkTestbedPage />} />
                      <Route path="/apk-preview" element={<ApkTestbedPage />} />
                      <Route
                        path="/"
                        element={
                          <RequireSession>
                            <AppLayout />
                          </RequireSession>
                        }
                      >
                        <Route index element={<HomeRoute />} />
                        <Route path="scanner" element={<ScannerPage />} />
                        <Route path="payment-checkpoint" element={<PaymentCheckpointPage />} />
                        <Route path="checkpoint" element={<Navigate to="/payment-checkpoint" replace />} />
                        <Route path="family-shield" element={<FamilyShieldPage />} />
                        <Route path="golden-hour" element={<GoldenHourRecoveryPage />} />
                        <Route path="incident-history" element={<IncidentHistoryPage />} />
                        <Route path="mock-upi" element={<OpenAppMode />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Route>
                    </Routes>
                  </BrowserRouter>
                </NotificationProvider>
              </ViewModeProvider>
            </AuthSessionProvider>
          </SeniorModeProvider>
        </LanguageProvider>
      </DemoModeProvider>
    </ToastProvider>
  );
};

export default App;
