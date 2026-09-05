import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="bg-emerald-600 py-24 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
         <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute w-full h-full fill-white/20">
           <path d="M0,0 L100,0 L100,100 L0,100 Z" stroke="none"></path>
           <path d="M0,100 Q 50,0 100,100" fill="white"></path>
         </svg>
      </div>
      <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
        <motion.h2 initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight">
          Ready to Transform Your Supply Chain?
        </motion.h2>
        <motion.p initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.1}} className="text-xl text-emerald-100 mb-10 max-w-2xl mx-auto">
          Join leading textile manufacturers who have replaced manual paperwork with lightning-fast digital logistics.
        </motion.p>
        <motion.div initial={{opacity: 0, y: 20}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.2}} className="flex flex-col sm:flex-row justify-center gap-4">
          <Link to="/register" className="inline-block px-8 py-5 rounded-full font-bold text-emerald-700 bg-white hover:bg-emerald-50 border-2 border-transparent transition-all shadow-xl shadow-slate-900/10 text-lg hover:-translate-y-1">
            Launch Your Free Workspace Today
          </Link>
          <button className="px-8 py-5 rounded-full font-bold text-white bg-emerald-700 border-2 border-emerald-500 hover:bg-emerald-800 transition-all text-lg">
            Schedule a Custom Demo
          </button>
        </motion.div>
      </div>
    </section>
  );
}
