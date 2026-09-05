import React from 'react';
import { motion } from 'framer-motion';
import { Truck, ShieldCheck, Box, LayoutDashboard } from 'lucide-react';

export default function CoreFeatures() {
  return (
    <section className="min-h-[100svh] flex flex-col justify-center pt-32 pb-20 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop')] opacity-5 bg-center bg-cover mix-blend-overlay"></div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-16">
          <h2 className="text-emerald-400 font-semibold tracking-wide uppercase text-sm mb-3">Powerful Capabilities</h2>
          <h3 className="text-3xl md:text-5xl font-bold text-white max-w-2xl leading-tight">
            Everything You Need to Scale Your Operations
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {[
            {
              title: "Live Job Bidding Marketplace",
              desc: "Broadcast fabric batches instantly. Subcontractors review specifications and submit competitive bids in seconds.",
              icon: <Truck size={24} />
            },
            {
              title: "Rule 55 & Challan Management",
              desc: "Generate, track, and verify digital delivery challans from gate-to-gate with zero paperwork loss.",
              icon: <ShieldCheck size={24} />
            },
            {
              title: "Real-Time Factory Floor Updates",
              desc: "Subcontractors snap photos of completed bundles on the mobile app, instantly updating the admin web dashboard.",
              icon: <Box size={24} />
            },
            {
              title: "GST Compliance & Ledger Sync",
              desc: "Automated tracking designed to align with strict tax filing standards and streamline financial reconciliations.",
              icon: <LayoutDashboard size={24} />
            }
          ].map((feature, i) => (
            <motion.div initial={{opacity: 0, x: -20}} whileInView={{opacity: 1, x: 0}} viewport={{once: true}} transition={{delay: i * 0.1}} key={i} className="flex gap-6 items-start group cursor-pointer">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all transform group-hover:-translate-y-1">
                {feature.icon}
              </div>
              <div>
                <h4 className="text-2xl font-bold mb-3 group-hover:text-emerald-300 transition-colors">{feature.title}</h4>
                <p className="text-slate-400 text-lg leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
