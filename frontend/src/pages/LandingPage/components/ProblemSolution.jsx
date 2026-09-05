import React from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, Factory } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function ProblemSolution() {
  return (
    <section className="min-h-[100svh] flex flex-col justify-center pt-32 pb-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-emerald-600 font-semibold tracking-wide uppercase text-sm mb-3">The Industry Bottleneck</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-slate-900 max-w-3xl mx-auto leading-tight">
            Traditional Textile Logistics is Plagued by Friction. <span className="text-slate-400">Zedly Fixes It.</span>
          </h3>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} className="grid md:grid-cols-3 gap-8">
          <motion.div variants={fadeUp} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow bg-gradient-to-br hover:from-white hover:to-emerald-50/50 group">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform text-slate-700">
              <Users size={28} className="group-hover:text-emerald-500 transition-colors" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-4">The Communication Gap</h4>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 line-through decoration-red-400/50">
                <strong className="text-slate-700 font-semibold">Old Way:</strong> Coordinating with dozens of local workshops via phone calls and unverified slips.
              </p>
              <p className="text-sm text-slate-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <strong className="text-emerald-700 font-semibold mb-1 block">Zedly Way:</strong> Instant broadcast bidding and live stage tracking across a centralized mobile network.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow bg-gradient-to-br hover:from-white hover:to-emerald-50/50 group">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform text-slate-700">
              <ShieldCheck size={28} className="group-hover:text-emerald-500 transition-colors" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-4">The Compliance Risk</h4>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 line-through decoration-red-400/50">
                <strong className="text-slate-700 font-semibold">Old Way:</strong> Manual tracking of Rule 55 delivery challans and error-prone GST ITC-04 reconciliations.
              </p>
              <p className="text-sm text-slate-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <strong className="text-emerald-700 font-semibold mb-1 block">Zedly Way:</strong> Automated digital audit trails that keep your export house 100% audit-ready.
              </p>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="bg-slate-50 p-8 rounded-3xl border border-slate-100 hover:shadow-xl transition-shadow bg-gradient-to-br hover:from-white hover:to-emerald-50/50 group">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6 group-hover:scale-110 transition-transform text-slate-700">
              <Factory size={28} className="group-hover:text-emerald-500 transition-colors" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-4">The Concurrency Wall</h4>
            <div className="space-y-4">
              <p className="text-sm text-slate-500 line-through decoration-red-400/50">
                <strong className="text-slate-700 font-semibold">Old Way:</strong> Server crashes and locked databases when hundreds of subcontractors submit bids simultaneously.
              </p>
              <p className="text-sm text-slate-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                <strong className="text-emerald-700 font-semibold mb-1 block">Zedly Way:</strong> High-throughput asynchronous queueing built to handle massive traffic spikes seamlessly.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
