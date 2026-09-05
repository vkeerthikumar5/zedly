import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, ArrowRight, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProfileCompletionModal() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [closed, setClosed] = useState(false);

  // If already full completed, or they are on the profile page, or they closed the modal, do not show
  if (!user || user.profile_completion_percentage === 100 || closed || location.pathname.includes('/profile')) {
    return null;
  }

  const navigateToProfile = () => {
    if (user.role === 'admin') navigate('/admin-dashboard/profile');
    else navigate('/user-dashboard/profile');
    setClosed(true);
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden relative"
        >
          <button 
            onClick={() => setClosed(true)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors z-10"
          >
            <X size={20} />
          </button>
          
          <div className="p-6 relative">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-500 mb-5 relative">
              <AlertCircle size={24} />
              <span className="absolute top-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white rounded-full animate-pulse"></span>
            </div>
            
            <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Complete Your Profile</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Your profile is only <span className="font-bold text-amber-600">{user.profile_completion_percentage}% complete</span>. Please provide the required legal and business information before you start using Zedly.
            </p>
            
            <button 
              onClick={navigateToProfile}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-500/30 transform hover:-translate-y-0.5"
            >
              Update Profile Now
              <ArrowRight size={18} />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
