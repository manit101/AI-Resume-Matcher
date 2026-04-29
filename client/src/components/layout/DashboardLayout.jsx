import React from 'react';
import { Outlet } from 'react-router-dom';
import DashboardNavbar from '../dashboard/Navbar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 font-sans text-slate-900 dark:text-slate-50 transition-colors duration-200">
      <DashboardNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
