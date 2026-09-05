import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Briefcase, ListChecks, FileText, Wallet, Factory, Box, LogOut } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const navItems = [
  { name: 'Live Job Feed', path: '/user-dashboard', icon: Briefcase },
  { name: 'My Active Contracts', path: '/user-dashboard/contracts', icon: ListChecks },
  { name: 'Rule 55 Inward Challans', path: '/user-dashboard/challans', icon: FileText },
  { name: 'Earnings & Payouts', path: '/user-dashboard/earnings', icon: Wallet },
  { name: 'Workshop Profile & Capacity', path: '/user-dashboard/profile', icon: Factory },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="w-64 bg-stone-950 flex flex-col h-full border-r border-stone-800 shrink-0">
      <div className="h-20 flex items-center px-6 border-b border-stone-800">
        <Link to="/" className="inline-flex items-center gap-2 group">
           <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
             <Box size={16} />
           </div>
           <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">Zedly</span>
        </Link>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1">
        <p className="px-4 text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Subcontractor Portal</p>
        
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/user-dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all rounded-xl ${
                isActive 
                  ? 'bg-stone-900 text-emerald-400' 
                  : 'text-stone-400 hover:text-white hover:bg-stone-900/50'
              }`
            }
          >
            <item.icon size={18} />
            {item.name}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-stone-800 space-y-2">
        <Link 
          to="/user-dashboard/profile"
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-stone-900 cursor-pointer hover:bg-stone-800 transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-emerald-700 font-bold text-white flex items-center justify-center text-xs shrink-0 uppercase">
            {user?.username?.charAt(0) || 'S'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-white truncate">{user?.username || 'Sri Murugan'}</p>
            <p className="text-[11px] text-stone-400 truncate">{user?.email || 'contact@example.com'}</p>
          </div>
        </Link>
        <button 
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-stone-400 hover:text-white hover:bg-stone-900 transition-colors text-sm font-semibold"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
