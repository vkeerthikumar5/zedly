import React from 'react';
import { Eye, Clock, Pencil, Trash } from 'lucide-react';

const jobsData = [
  {
    id: 'JOB-2026-801',
    title: 'Pure Cotton Shirting',
    quantity: '10,000 Meters',
    specs: '(40s Compact)',
    rate: '₹45.00 / meter',
    bids: 6,
    lowestBid: '₹42.50',
    status: 'Bidding Open',
    time: 'Closes in 2h',
    statusColor: 'bg-emerald-100 text-emerald-700',
    dotColor: 'bg-emerald-500',
    actionText: 'Inspect Bids'
  },
  {
    id: 'JOB-2026-802',
    title: 'Raw Silk Weaving',
    quantity: '2,500 Meters',
    specs: '(Traditional)',
    rate: '₹120.00 / meter',
    bids: 3,
    lowestBid: '₹115.00',
    status: 'Bidding Open',
    time: 'Closes in 5h',
    statusColor: 'bg-emerald-100 text-emerald-700',
    dotColor: 'bg-emerald-500',
    actionText: 'Inspect Bids'
  },
  {
    id: 'JOB-2026-798',
    title: 'Denim Twill Batch',
    quantity: '15,000 Meters',
    specs: '(Heavyweight)',
    rate: '₹65.00 / meter',
    bids: 12,
    lowestBid: '₹61.00',
    status: 'In Production',
    time: 'Awarded to Sri Amman Textiles',
    statusColor: 'bg-blue-100 text-blue-700',
    dotColor: 'bg-blue-500',
    actionText: 'View Progress'
  }
];

export default function DataTable({ jobs, onInspect, onEdit, onDelete }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center shadow-sm max-w-2xl mx-auto mt-6">
        <div className="w-20 h-20 bg-emerald-50 border border-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-600 shadow-inner">
          <Clock size={36} className="animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">No Jobs Created Yet</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto mb-8 leading-relaxed">
          Your job board is currently empty. Broadcast a fabric batch production order now to receive competitive bids from subcontractors.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
            <tr>
              <th className="px-6 py-4">Job ID & Title</th>
              <th className="px-6 py-4">Process & Quantity</th>
              <th className="px-6 py-4">Target Rate / Unit</th>
              <th className="px-6 py-4">Bids Submitted</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.map((job) => {
              const unitLabel = job.unit_of_measurement ? job.unit_of_measurement.toLowerCase().replace(/s$/, '') : 'unit';
              
              // Dynamic pricing labels
              const targetRate = job.budget_negotiable 
                ? 'Negotiable' 
                : `₹${parseFloat(job.budget).toFixed(2)} / ${unitLabel}`;
              
              const lowestBid = job.budget_negotiable 
                ? `₹42.50 / ${unitLabel}` 
                : `₹${(parseFloat(job.budget) * 0.95).toFixed(2)}`;

              const displayId = `JOB-2026-${String(job.id).padStart(3, '0')}`;

              // Dynamic status calculation
              const now = new Date();
              const start = new Date(job.bidding_start_time);
              const end = new Date(job.bidding_end_time);
              const visible = new Date(job.visible_from_time);

              let statusText = 'Bidding Open';
              let badgeColor = 'bg-emerald-100 text-emerald-700';
              let dotColor = 'bg-emerald-500';
              let subtext = '';

              if (now < visible) {
                statusText = 'Bidding Scheduled';
                badgeColor = 'bg-slate-100 text-slate-700';
                dotColor = 'bg-slate-400';
                subtext = `Visible on ${visible.toLocaleDateString()} at ${visible.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              } else if (now < start) {
                statusText = 'Upcoming Bidding';
                badgeColor = 'bg-amber-100 text-amber-700';
                dotColor = 'bg-amber-500';
                
                const diffMs = start.getTime() - now.getTime();
                const diffMins = Math.ceil(diffMs / (60 * 1000));
                if (diffMins < 60) {
                  subtext = `Starts in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
                } else {
                  const diffHrs = Math.floor(diffMins / 60);
                  subtext = `Starts in ${diffHrs} hour${diffHrs > 1 ? 's' : ''}`;
                }
              } else if (now < end) {
                statusText = 'Bidding Open';
                badgeColor = 'bg-emerald-100 text-emerald-700';
                dotColor = 'bg-emerald-500';

                const diffMs = end.getTime() - now.getTime();
                const diffMins = Math.ceil(diffMs / (60 * 1000));
                if (diffMins < 60) {
                  subtext = `Closes in ${diffMins} min${diffMins > 1 ? 's' : ''}`;
                } else {
                  const diffHrs = Math.floor(diffMins / 60);
                  subtext = `Closes in ${diffHrs} hour${diffHrs > 1 ? 's' : ''}`;
                }
              } else {
                statusText = 'Bidding Closed';
                badgeColor = 'bg-rose-100 text-rose-700';
                dotColor = 'bg-rose-500';
                subtext = `Closed on ${end.toLocaleDateString()}`;
              }

              return (
                <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{displayId}</div>
                    <div className="text-slate-500 italic mt-0.5">{job.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-700">{job.process_type}</div>
                    <div className="text-slate-500 font-medium mt-0.5">
                      {job.total_quantity?.toLocaleString()} {job.unit_of_measurement}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{targetRate}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">3 Subcontractors</div>
                    <div className="text-emerald-600 font-semibold mt-0.5">(Lowest: {lowestBid})</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 ${badgeColor} rounded-full text-xs font-bold`}>
                      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                      {statusText}
                    </div>
                    <div className="text-slate-400 text-xs mt-1.5 flex items-center gap-1.5 font-medium">
                      <Clock size={12} />
                      {subtext}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onInspect({
                          id: job.id,
                          displayId: displayId,
                          title: job.title,
                          quantity: `${job.total_quantity?.toLocaleString()} ${job.unit_of_measurement}`
                        })}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-slate-800 transition-colors"
                      >
                        <Eye size={15} />
                        Inspect Bids
                      </button>
                      
                      <button 
                        onClick={() => onEdit(job)}
                        title="Edit Job Spec"
                        className="p-2 text-slate-500 hover:text-slate-950 border border-slate-200 hover:bg-slate-100/50 rounded-lg transition-colors"
                      >
                        <Pencil size={15} />
                      </button>

                      <button 
                        onClick={() => onDelete(job.id)}
                        title="Delete Job"
                        className="p-2 text-red-500 hover:text-red-700 border border-red-100 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
