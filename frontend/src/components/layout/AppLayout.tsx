import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F6F8FB] text-[#182536]">
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
