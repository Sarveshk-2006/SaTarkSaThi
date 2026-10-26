import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Theme } from '@carbon/react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';
import { useViewMode } from '../../context/ViewModeContext';
import { AppModeShell } from '../appmode/AppModeShell';
import { pageTransitionVariants } from '../../utils/motionVariants';

export const AppLayout: React.FC = () => {
  const { viewMode } = useViewMode();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

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
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={shouldReduceMotion ? undefined : pageTransitionVariants}
                initial={shouldReduceMotion ? false : 'initial'}
                animate={shouldReduceMotion ? undefined : 'animate'}
                exit={shouldReduceMotion ? undefined : 'exit'}
                className="w-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </Theme>
  );
};
