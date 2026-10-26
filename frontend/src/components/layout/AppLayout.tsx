import React from 'react';
import { Outlet } from 'react-router-dom';
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
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#F7F8F4] text-[#142A36]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader />
        <Header />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
