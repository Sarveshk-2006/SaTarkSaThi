import React from 'react';
import { Outlet } from 'react-router-dom';
import { Theme } from '@carbon/react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';
import { useViewMode } from '../../context/ViewModeContext';
import { AppModeShell } from '../appmode/AppModeShell';

export const AppLayout: React.FC = () => {
  const { viewMode } = useViewMode();

  if (viewMode === 'app') {
    return <AppModeShell />;
  }

  return (
    <Theme theme="white">
      <div className="cds--app-layout flex flex-col lg:flex-row min-h-screen bg-[#f4f4f4] text-[#161616] font-sans antialiased">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <MobileHeader />
          <Header />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto" id="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </Theme>
  );
};
