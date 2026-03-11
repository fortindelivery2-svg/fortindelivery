import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DeliveryAlertWatcher from '@/components/DeliveryAlertWatcher';

const Dashboard = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return undefined;
    }

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="min-h-screen bg-[var(--layout-bg)] flex">
      <Sidebar isMobileOpen={isMobileMenuOpen} onCloseMobileMenu={() => setIsMobileMenuOpen(false)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <DeliveryAlertWatcher />
        <main className="flex-1 overflow-auto bg-[var(--layout-bg)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
