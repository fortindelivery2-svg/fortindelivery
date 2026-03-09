import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar';
import DeliveryAlertWatcher from '@/components/DeliveryAlertWatcher';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-[#1a2332] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        <DeliveryAlertWatcher />
        <main className="flex-1 overflow-auto bg-[#1a2332]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
