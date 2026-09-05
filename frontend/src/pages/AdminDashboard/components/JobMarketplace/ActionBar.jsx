import React from 'react';
import { Plus, Filter } from 'lucide-react';

export default function ActionBar({ onPostClick }) {
  return (
    <div className="mb-8 flex flex-col gap-6">
      <div>
        <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight mb-1">Job Marketplace & Broadcast Center</h1>
        <p className="text-slate-500 text-sm">
          Manage active fabric batches, view incoming subcontractor bids in real time, and award contracts instantly.
        </p>
      </div>
      
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
          <select className="bg-transparent text-sm font-medium text-slate-700 py-1.5 px-3 focus:outline-none cursor-pointer border-r border-slate-200">
            <option>Status: All Active</option>
            <option>Bidding Open</option>
            <option>In Production</option>
            <option>Completed</option>
          </select>
          <select className="bg-transparent text-sm font-medium text-slate-700 py-1.5 px-3 focus:outline-none cursor-pointer border-r border-slate-200">
            <option>Fabric: All</option>
            <option>Cotton</option>
            <option>Silk</option>
            <option>Polyester</option>
            <option>Denim</option>
          </select>
          <select className="bg-transparent text-sm font-medium text-slate-700 py-1.5 px-3 focus:outline-none cursor-pointer">
            <option>Urgency: All</option>
            <option>High Priority</option>
            <option>Standard</option>
          </select>
        </div>

        <button 
          onClick={onPostClick}
          className="bg-emerald-600 text-white flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold shadow-md shadow-emerald-500/20 hover:bg-emerald-700 transition-colors hover:-translate-y-0.5"
        >
          <Plus size={18} />
          Post New Job Batch
        </button>
      </div>
    </div>
  );
}
