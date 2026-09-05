import React from 'react';
import { motion } from 'framer-motion';
import { Factory, EyeOff, User, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AuthPage() {
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
        <div className="flex-1 p-8 sm:p-12 flex flex-col relative z-20 bg-white">
          <div className="flex items-center mb-10 shrink-0">
            <Link to="/" className="inline-flex items-center gap-2 group">
               <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                 <Factory size={18} />
               </div>
               <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">Zedly</span>
            </Link>
          </div>

          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-[400px] w-full mx-auto flex-1 flex flex-col justify-center">
            <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-2">Start for free</p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Create account<span className="text-emerald-500">.</span></h1>
            <p className="text-slate-500 text-sm mb-8">
              Already A Member? <a href="#" className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors">Log In</a>
            </p>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1 bg-white">First name</label>
                  <div className="relative group">
                    <input 
                      type="text" 
                      placeholder="Jane" 
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
                    className="w-full bg-white border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm placeholder:text-slate-400 group-hover:border-slate-300 shadow-sm"
                  />
                  <Mail size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest ml-1 bg-white">Password</label>
                <div className="relative group">
                  <input 
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full bg-white border border-slate-200 focus:border-emerald-500 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all text-sm tracking-widest placeholder:text-slate-400 group-hover:border-slate-300 shadow-sm"
                  />
                  <EyeOff size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 cursor-pointer hover:text-emerald-600 transition-colors" />
                </div>
              </div>

              <div className="pt-6 flex flex-col sm:flex-row gap-4 shrink-0">
                <button type="button" className="flex-1 py-3.5 rounded-xl font-semibold text-slate-600 bg-slate-50 border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition-all text-sm shadow-sm">
                  Change method
                </button>
                <button type="submit" className="flex-[1.5] py-3.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/30 transition-all text-sm transform hover:-translate-y-0.5">
                  Create account
                </button>
              </div>
            </form>
          </motion.div>
        </div>

        {/* Right Side: Image / Graphics */}
        <div className="flex-1 relative hidden lg:block overflow-hidden bg-slate-900">
           {/* Beautiful modern logistics/warehouse image */}
           <img 
             src="https://images.unsplash.com/photo-1586528116311-ad8ed7c83a50?q=80&w=2070&auto=format&fit=crop" 
             alt="Modern Logistics" 
             className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-[10s] hover:scale-105"
           />
           
           {/* Sophisticated gradient overlay */}
           <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
           <div className="absolute inset-0 bg-emerald-900/20 mix-blend-multiply"></div>

           {/* Floating Info Card */}
           <div className="absolute bottom-12 left-12 right-12 z-20">
             <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white border-2 border-white/20 shadow-inner">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">Enterprise Grade Security</h3>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <p className="text-emerald-100 text-xs">GST & Rule 55 Compliant</p>
                    </div>
                  </div>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Join over 5,000+ export houses commanding their unified supply chain and automated challan networks in real-time.
                </p>
             </div>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
