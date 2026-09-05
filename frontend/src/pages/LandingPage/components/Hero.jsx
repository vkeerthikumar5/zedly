import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

export default function Hero() {
  return (
    <section className="min-h-[100svh] flex flex-col justify-center pt-[120px] pb-12 max-w-[1440px] border-none mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-[40px] p-8 lg:p-16 flex flex-col lg:flex-row items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-100">
        
        <div className="flex-1 relative z-20 lg:-mr-[40px] mb-12 lg:mb-0 max-w-[520px]">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 text-slate-700 text-sm font-semibold mb-6 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
            ⚡ The Next-Gen Logistics OS
          </motion.div>
          
          <motion.h1 initial="hidden" animate="visible" variants={fadeUp} className="text-5xl lg:text-[64px] font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Command Your <br/>
            <span className="text-emerald-600 relative border-l-[6px] border-slate-200 pl-6 -ml-[30px] block mt-2 mb-2 italic">Factory Floor.</span>
            Automate Supply.
          </motion.h1>
          
          <motion.p initial="hidden" animate="visible" variants={fadeUp} className="text-[17px] text-slate-500 mb-10 max-w-[90%] relative pl-[60px] before:content-[''] before:absolute before:left-0 before:top-[12px] before:w-[40px] before:h-[2px] before:bg-emerald-200">
            Eliminate production delays, track Rule 55 delivery challans in real time, and streamline subcontractor bidding with an elite platform built for modern manufacturing.
          </motion.p>
          
          <motion.div initial="hidden" animate="visible" variants={fadeUp} className="flex flex-wrap gap-4">
            <Link to="/register" className="inline-block bg-emerald-600 text-white px-8 py-4 rounded-full text-[15px] font-semibold hover:bg-emerald-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
              Get Started Free
            </Link>
            <button className="bg-white border border-slate-200 text-slate-800 px-8 py-4 rounded-full text-[15px] font-semibold hover:border-emerald-600 hover:text-emerald-600 transition-all shadow-sm">
              Watch Product Tour
            </button>
          </motion.div>
        </div>

        <div className="flex-[1.3] flex h-[500px] xl:h-[600px] 2xl:h-[640px] w-full max-w-[800px] lg:max-w-none relative z-10">
           <div className="relative flex-1 rounded-[40px] overflow-hidden bg-slate-200 block shadow-inner">
             {/* Magic CSS Cutout for the overlapping text */}
             <div className="hidden lg:block absolute top-[90px] -left-[2px] w-[140px] h-[460px] bg-white rounded-tr-[48px] rounded-br-[48px] z-10 before:content-[''] before:absolute before:-top-[48px] before:left-0 before:w-[48px] before:h-[48px] before:bg-transparent before:rounded-bl-[48px] before:shadow-[0_24px_0_0_#ffffff] after:content-[''] after:absolute after:-bottom-[48px] after:left-0 after:w-[48px] after:h-[48px] after:bg-transparent after:rounded-tl-[48px] after:shadow-[0_-24px_0_0_#ffffff]"></div>
             
             <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop" alt="Supply Chain Dashboard" className="absolute inset-0 w-full h-full object-cover" />
             
             <div className="absolute bottom-[30px] right-[30px] bg-white/15 backdrop-blur-xl border border-white/30 p-8 rounded-[30px] text-white w-[300px] shadow-2xl z-20">
                <h2 className="text-5xl font-medium tracking-tight mb-2">&gt;50K</h2>
                <p className="text-sm opacity-90 leading-relaxed mb-5">challans generated and tracked in real-time across factories.</p>
                <div className="flex gap-2">
                  <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-semibold shadow-sm">Compliance</span>
                  <span className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-semibold shadow-sm">Logistics</span>
                </div>
             </div>
           </div>
        </div>

      </div>
    </section>
  );
}
