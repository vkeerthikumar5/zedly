import React from 'react';
import { ListChecks, Layers, TrendingUp, RefreshCw, UploadCloud } from 'lucide-react';

const contractsData = [
  {
    id: 'JOB-2026-798',
    title: 'Denim Twill Batch',
    exporter: 'Apex Exports Ltd.',
    rate: '₹61.00 / meter',
    stage: 'Weaving in Progress',
    step: '(Step 2 of 4)',
    stageColor: 'text-blue-700 bg-blue-50',
    date: '18 Aug 2026',
    action: 'Update Progress'
  },
  {
    id: 'JOB-2026-785',
    title: 'Cambric Cotton',
    exporter: 'Sri Ramakrishna Textiles',
    rate: '₹38.50 / meter',
    stage: 'Quality Inspection',
    step: '(Step 3 of 4)',
    stageColor: 'text-amber-700 bg-amber-50',
    date: '10 Aug 2026',
    action: 'Upload Proof'
  }
];

export default function ActiveContractsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-full">
      <div className="mb-8 flex flex-col gap-6">
        <div>
          <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight mb-1">Active Production & Floor Jobs</h1>
          <p className="text-slate-500 text-sm">
            Track jobs you have successfully won, view stage progress milestones, and submit completion updates.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ListChecks size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Jobs in Production</h3>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">2 <span className="text-lg font-medium text-slate-500">Active</span></div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Layers size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Completed This Month</h3>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">8 <span className="text-lg font-medium text-slate-500">Batches</span></div>
        </div>

        <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-xl overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-semibold text-stone-300">Total Meterage Processed</h3>
          </div>
          <div className="text-4xl font-black text-emerald-400 relative z-10">32,000 <span className="text-xl font-medium text-emerald-600">Meters</span></div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
              <tr>
                <th className="px-6 py-4">Job ID & Title</th>
                <th className="px-6 py-4">Assigned Export House</th>
                <th className="px-6 py-4">Accepted Rate</th>
                <th className="px-6 py-4">Current Stage</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contractsData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{row.id}</div>
                    <div className="text-slate-500 italic mt-0.5">{row.title}</div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{row.exporter}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{row.rate}</td>
                  <td className="px-6 py-4">
                     <div className={`px-3 py-1.5 rounded-lg text-xs font-bold w-max ${row.stageColor}`}>
                       <span className="flex items-center gap-1.5">{row.stage}</span>
                       <span className="opacity-70 mt-0.5 block">{row.step}</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-700">{row.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="bg-white border border-emerald-500 text-emerald-600 flex inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-50 transition-colors">
                      {row.action === 'Update Progress' ? <RefreshCw size={16}/> : <UploadCloud size={16}/>} {row.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
