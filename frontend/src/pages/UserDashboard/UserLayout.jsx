import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ProfileCompletionModal from '../../components/ProfileCompletionModal';

export default function UserLayout() {
  return (
    <div className="admin-dashboard flex h-screen w-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <ProfileCompletionModal />
    </div>
  );
}
