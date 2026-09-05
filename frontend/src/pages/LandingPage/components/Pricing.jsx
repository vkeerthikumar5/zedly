import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Pricing() {
  return (
    <section className="min-h-[100svh] flex flex-col justify-center pt-32 pb-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-emerald-600 font-semibold tracking-wide uppercase text-sm mb-3">Transparent Investment</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-slate-900">Choose the Plan That Fits Your Scale</h3>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-end">
          {/* Starter */}
          <motion.div initial={{opacity: 0, y: 30}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:shadow-xl transition-shadow">
            <h4 className="text-2xl font-bold text-slate-900 mb-2">Starter Workshop</h4>
            <p className="text-slate-500 text-sm mb-6 h-10">Best for small independent workshops and local processing units.</p>
            <div className="mb-8">
              <span className="text-5xl font-extrabold text-slate-900">₹2,999</span>
              <span className="text-slate-500 font-medium">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['Up to 5 user seats', 'Basic job bidding', 'Mobile app access', 'Standard challan generation'].map((item, i) => (
                <li key={i} className="flex flex-row items-center gap-3 text-slate-600">
                  <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/register" className="block text-center w-full py-4 rounded-xl font-bold bg-white border border-slate-300 text-slate-900 hover:border-slate-800 transition-colors">
              Start Free Trial
            </Link>
          </motion.div>

          {/* Growth Enterprise */}
          <motion.div initial={{opacity: 0, y: 30}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.1}} className="bg-slate-900 rounded-3xl p-10 border border-slate-800 shadow-2xl relative lg:-mt-8 z-10 transform lg:scale-105">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1.5 rounded-b-xl text-sm font-bold uppercase tracking-wider shadow-lg">
              Most Popular
            </div>
            <h4 className="text-2xl font-bold text-white mb-2 mt-4">Growth Enterprise</h4>
            <p className="text-slate-400 text-sm mb-6 h-10">Best for mid-tier manufacturing units and scaling export houses.</p>
            <div className="mb-8 relative">
              <span className="text-6xl font-extrabold text-white">₹7,999</span>
              <span className="text-slate-400 font-medium">/month</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['Unlimited user seats', 'Advanced Rule 55 automation', 'Priority bidding queue', 'Real-time web dashboard analytics', 'GST ledger support'].map((item, i) => (
                <li key={i} className="flex flex-row items-center gap-3 text-slate-300">
                  <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/register" className="block text-center w-full py-4 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-500/30 text-lg">
              Get Started Now
            </Link>
          </motion.div>

          {/* Custom Industrial */}
          <motion.div initial={{opacity: 0, y: 30}} whileInView={{opacity: 1, y: 0}} viewport={{once: true}} transition={{delay: 0.2}} className="bg-slate-50 rounded-3xl p-8 border border-slate-200 hover:shadow-xl transition-shadow">
            <h4 className="text-2xl font-bold text-slate-900 mb-2">Custom Industrial</h4>
            <p className="text-slate-500 text-sm mb-6 h-10">Best for large enterprise manufacturing hubs with custom ERP requirements.</p>
            <div className="mb-8">
              <span className="text-4xl font-extrabold text-slate-900">Contact Us</span>
            </div>
            <ul className="space-y-4 mb-8">
              {['Dedicated server deployment', 'Custom API integrations', '24/7 priority support', 'Custom workflow automation'].map((item, i) => (
                <li key={i} className="flex flex-row items-center gap-3 text-slate-600">
                  <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button className="w-full py-4 rounded-xl font-bold bg-white border border-slate-300 text-slate-900 hover:border-slate-800 transition-colors">
              Talk to Sales
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
