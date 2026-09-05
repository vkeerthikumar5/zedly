import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Smartphone } from 'lucide-react';

export default function DualEcosystem() {
  return (
    <section className="min-h-[100svh] flex flex-col justify-center pt-32 pb-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-emerald-600 font-semibold tracking-wide uppercase text-sm mb-3">Built for Every Role</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-slate-900">Tailored Interfaces for Admins and Floor Teams</h3>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
           <motion.div initial={{opacity: 0, scale: 0.95}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true}} className="bg-slate-900 rounded-[2.5rem] p-10 lg:p-14 text-white shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl -mx-20 -my-20"></div>
              <LayoutDashboard size={40} className="text-emerald-400 mb-8" />
              <h4 className="text-3xl font-bold mb-4 z-10 relative">Export House Web Portal <span className="block text-emerald-400 text-xl mt-2 font-medium">(Admin Dashboard)</span></h4>
              <p className="text-slate-400 text-lg leading-relaxed relative z-10 mb-8">
                Designed for office managers and controllers. Features dark stone side navigation, deep analytics grids, bulk job posting tools, and live incoming bid boards.
              </p>
              <div className="w-full h-48 bg-slate-800 rounded-xl border border-slate-700/50 p-4 relative z-10 shadow-inner">
                 <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                   <div className="h-4 w-32 bg-slate-700 rounded"></div>
                   <div className="h-4 w-16 bg-emerald-500/30 rounded"></div>
                 </div>
                 <div className="space-y-3">
                   <div className="h-3 w-full bg-slate-700/50 rounded"></div>
                   <div className="h-3 w-5/6 bg-slate-700/50 rounded"></div>
                   <div className="h-3 w-4/6 bg-slate-700/50 rounded"></div>
                 </div>
              </div>
           </motion.div>

           <motion.div initial={{opacity: 0, scale: 0.95}} whileInView={{opacity: 1, scale: 1}} viewport={{once: true}} transition={{delay: 0.2}} className="bg-white border-2 border-emerald-50 rounded-[2.5rem] p-10 lg:p-14 text-slate-900 shadow-xl shadow-emerald-500/5 relative overflow-hidden">
              <Smartphone size={40} className="text-emerald-500 mb-8" />
              <h4 className="text-3xl font-bold mb-4 z-10 relative">Subcontractor Mobile App <span className="block text-emerald-600 text-xl mt-2 font-medium">(Floor View)</span></h4>
              <p className="text-slate-600 text-lg leading-relaxed relative z-10 mb-8">
                Built for speed and simplicity. Optimized for quick on-the-go bidding, stage progress updates, and rapid photo-snapping of finished bundles right from the factory floor.
              </p>
              <div className="w-full h-48 bg-emerald-50 rounded-xl border border-emerald-100 p-4 relative z-10 flex gap-4">
                 <div className="w-24 h-full bg-white rounded-lg border border-slate-100 flex flex-col justify-end p-2 pb-4 shadow-sm">
                   <div className="w-full h-1 bg-emerald-200 mt-auto rounded mb-1"></div>
                   <div className="w-2/3 h-1 bg-emerald-300 rounded mb-4"></div>
                   <div className="w-full h-8 bg-emerald-500 rounded-md"></div>
                 </div>
                 <div className="flex-1 flex flex-col pt-4">
                    <div className="h-4 w-32 bg-slate-200 rounded mb-2"></div>
                    <div className="h-3 w-48 bg-slate-200 rounded mb-6"></div>
                    <div className="mt-auto flex justify-end">
                       <div className="w-12 h-12 bg-white shadow-md rounded-full border border-slate-100 flex items-center justify-center">
                         <div className="w-4 h-4 rounded-full bg-emerald-500 border border-white"></div>
                       </div>
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      </div>
    </section>
  );
}
