import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Factory, EyeOff, Eye, Mail } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const successMessage = location.state?.successMessage;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
        const response = await axios.post('http://localhost:8000/api/auth/login/', {
            email,
            password
        });
        login(response.data);
        if (response.data.user.role === 'admin') {
            navigate('/admin-dashboard');
        } else {
            navigate('/user-dashboard');
        }
    } catch (err) {
        setError('Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans relative">
      {/* Decorative background blob */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.4 }}
        className="w-full max-w-[1024px] h-full max-h-[720px] bg-white rounded-3xl overflow-hidden flex flex-col-reverse lg:flex-row shadow-2xl shadow-slate-200/50 border border-slate-100 relative z-10"
      >
        {/* Left Side: Form Container */}
        <div className="flex-1 p-6 sm:p-8 flex flex-col relative z-20 bg-white">
          <div className="flex items-center justify-between mb-10 shrink-0">
            <Link to="/" className="inline-flex items-center gap-2 group">
               <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                 <Factory size={18} />
               </div>
               <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">Zedly</span>
            </Link>
            
            <Link to="/" className="text-sm font-semibold text-slate-400 hover:text-emerald-600 transition-colors">
              &larr; Back to Home
            </Link>
          </div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-[400px] w-full mx-auto flex-1 flex flex-col justify-center">
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">Welcome Back</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Log In<span className="text-emerald-500">.</span></h1>
            <p className="text-slate-500 text-sm mb-6">
              New here? <Link to="/register" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">Create an account</Link>
            </p>

            <AnimatePresence>
              {successMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-6 p-4 bg-emerald-50 border border-emerald-100/50 rounded-xl flex items-start gap-3"
                >
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-emerald-800">Success</h4>
                    <p className="text-xs font-medium text-emerald-600">{successMessage}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && <div className="mb-4 text-red-500 text-sm font-semibold">{error}</div>}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1 bg-white">Email</label>
                <div className="relative group">
                  <input 
                    type="email" 
                    placeholder="jane.doe@organization.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm placeholder:text-slate-400 group-hover:border-slate-300 shadow-sm"
                  />
                  <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center bg-white pr-2">
                   <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                   <a href="#" className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700">Forgot?</a>
                </div>
                <div className="relative group">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm tracking-widest placeholder:text-slate-400 group-hover:border-slate-300 shadow-sm"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600 transition-colors outline-none"
                  >
                    {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-6 flex flex-col gap-4 shrink-0">
                <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all text-sm transform hover:-translate-y-0.5">
                  Sign In
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Right Side: Image / Graphics */}
        <div className="flex-1 relative hidden lg:block overflow-hidden bg-slate-900">
           {/* Beautiful modern logistics/warehouse image that works */}
           <img 
             src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop" 
             alt="Logistics Dashboard Workspace" 
             className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-[10s] hover:scale-105"
           />
           
           {/* Sophisticated gradient overlay */}
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
           <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply"></div>
        </div>
      </motion.div>
    </div>
  );
}
