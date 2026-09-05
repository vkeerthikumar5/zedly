import React from 'react';
import { Layers, FileText, Clock } from 'lucide-react';

export default function Metrics({ stats }) {
  if (!stats) return null;
  return (
    <div className="grid sm:grid-cols-3 gap-6 mb-8">
      {/* Card 1 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Layers size={80} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Layers size={20} />
          </div>
          <h3 className="font-semibold text-slate-600">Active Live Jobs</h3>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-extrabold text-slate-900">{stats.active_jobs}</span>
          <span className="text-sm font-medium text-slate-500">Batches</span>
        </div>
      </div>

      {/* Card 2 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <FileText size={80} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <FileText size={20} />
          </div>
          <h3 className="font-semibold text-slate-600">Total Bids Today</h3>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-extrabold text-slate-900">{stats.total_bids_today}</span>
          <span className="text-sm font-medium text-slate-500">Bids</span>
        </div>
        {stats.bids_increase_pct > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-emerald-700 font-medium text-xs bg-emerald-50 w-max px-2.5 py-1 rounded-md">
            <span>📈</span> +{stats.bids_increase_pct}% vs yesterday
          </div>
        )}
      </div>

      {/* Card 3 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Clock size={80} />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Clock size={20} />
          </div>
          <h3 className="font-semibold text-slate-600">Jobs In Production</h3>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-extrabold text-slate-900">{stats.jobs_in_production}</span>
          <span className="text-sm font-medium text-slate-500">Awarded</span>
        </div>
      </div>
    </div>
  );
}
