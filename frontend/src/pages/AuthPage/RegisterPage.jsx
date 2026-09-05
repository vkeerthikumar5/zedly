import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Factory, EyeOff, User, Mail, Eye } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function RegisterPage() {
  const [role, setRole] = useState('subcontractor');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // In Django we use admin and subcontractor roles.
    const mappedRole = role === 'export_house' ? 'admin' : 'subcontractor';
    
    try {
        await axios.post('http://localhost:8000/api/auth/register/', {
            username: `${firstName} ${lastName}`.trim(),
            email,
            password,
            role: mappedRole
        });
        
        // Redirect to login page and pass a success toast message via state
        navigate('/login', { state: { successMessage: 'Account created successfully! Please log in to continue.' } });
    } catch (err) {
        console.error(err);
        const errors = err.response?.data;
        let errMsg = 'Registration failed. Please check your inputs.';
        if (errors && typeof errors === 'object') {
            const firstErr = Object.values(errors).flat();
            if (firstErr.length > 0) errMsg = firstErr[0];
        }
        setError(errMsg);
    }
  };

  return (
    <div className="h-screen w-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 overflow-hidden font-sans relative">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        transition={{ duration: 0.4 }}
        className="w-full max-w-[1024px] h-full max-h-[720px] bg-white rounded-3xl overflow-hidden flex flex-col-reverse lg:flex-row shadow-2xl shadow-slate-200/50 border border-slate-100 relative z-10"
      >
        <div className="flex-1 p-6 sm:p-8 flex flex-col relative z-20 bg-white">
          <div className="flex items-center justify-between mb-4 shrink-0">
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
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">Start for free</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1 tracking-tight">Create account<span className="text-emerald-500">.</span></h1>
            <p className="text-slate-500 text-sm mb-4">
              Already A Member? <Link to="/login" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">Log In</Link>
            </p>

            {error && <div className="mb-2 text-red-500 text-sm font-semibold">{error}</div>}

            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1 bg-white">First name</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm placeholder:text-slate-400 group-hover:border-slate-300 shadow-sm"
                    />
                    <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1 bg-white">Last name</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm placeholder:text-slate-400 group-hover:border-slate-300 shadow-sm"
                    />
                    <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                  </div>
                </div>
              </div>

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
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1 bg-white">Password</label>
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

              <div className="space-y-2 pt-0 h-[72px]">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1">Are you registering as:</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div 
                    onClick={() => setRole('export_house')}
                    className={`cursor-pointer border rounded-xl p-3 flex items-start gap-3 transition-all ${
                      role === 'export_house' 
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-500/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      role === 'export_house' ? 'border-emerald-500' : 'border-slate-300'
                    }`}>
                      {role === 'export_house' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <div>
                      <p className={`text-[13px] font-semibold ${role === 'export_house' ? 'text-emerald-700' : 'text-slate-700'}`}>Export House</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">(Admin / Brand)</p>
                    </div>
                  </div>

                  <div 
                    onClick={() => setRole('subcontractor')}
                    className={`cursor-pointer border rounded-xl p-3 flex items-start gap-3 transition-all ${
                      role === 'subcontractor' 
                        ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-500/10' 
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                      role === 'subcontractor' ? 'border-emerald-500' : 'border-slate-300'
                    }`}>
                      {role === 'subcontractor' && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                    </div>
                    <div>
                      <p className={`text-[13px] font-semibold ${role === 'subcontractor' ? 'text-emerald-700' : 'text-slate-700'}`}>Subcontractor</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-medium">(Workshop / Loom)</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-4 shrink-0">
                <button type="submit" className="w-full py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all text-sm transform hover:-translate-y-0.5">
                  Create account
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        <div className="flex-1 relative hidden lg:block overflow-hidden bg-slate-900">
           <img 
             src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?q=80&w=2070&auto=format&fit=crop" 
             alt="Logistics Dashboard Workspace" 
             className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-[10s] hover:scale-105"
           />
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
           <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply"></div>
        </div>
      </motion.div>
    </div>
  );
}
