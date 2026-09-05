import React, { useState, useEffect } from 'react';
import { Briefcase, Target, TrendingUp, Clock, FileEdit, CheckCircle2 } from 'lucide-react';
import api from '../../../api';
import { toast } from 'react-hot-toast';

export default function LiveJobFeedPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [selectedJob, setSelectedJob] = useState(null);
  const [bidForm, setBidForm] = useState({ quoted_price: '', delivery_date: '', capacity_allocation: '', remarks: '' });
  const [submittingBid, setSubmittingBid] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchJobs = async (isPolling = false) => {
      try {
        const response = await api.get('/api/jobs/');
        if (active) {
          setJobs(response.data);
        }
      } catch (err) {
        console.error(err);
        if (!isPolling) {
          toast.error('Failed to load active job feed.');
        }
      } finally {
        if (active && !isPolling) {
          setLoading(false);
        }
      }
    };

    // Load initial jobs
    fetchJobs(false);

    // Auto-polling every 4 seconds to dynamically fetch new jobs when posted without refresh
    const pollInterval = setInterval(() => {
      fetchJobs(true);
    }, 4000);
    
    // Update current time every second for active seconds-level upcoming tickers
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      active = false;
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const getTimeLeftStr = (endTime) => {
    if (!endTime) return 'N/A';
    const diff = new Date(endTime) - currentTime;
    if (diff <= 0) return 'Closed';
    
    const seconds = Math.floor(diff / 1000);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} Day${days > 1 ? 's' : ''} Left`;
    if (hours > 0) return `${hours} Hour${hours > 1 ? 's' : ''} Left`;
    if (mins > 0) return `${mins} Min${mins > 1 ? 's' : ''} Left`;
    return `${seconds} Sec${seconds !== 1 ? 's' : ''} Left`;
  };

  const getBiddingStatus = (job) => {
    if (!job.bidding_start_time || !job.bidding_end_time) {
      return { state: 'ACTIVE', label: 'Place Bid' };
    }
    const start = new Date(job.bidding_start_time);
    const end = new Date(job.bidding_end_time);
    
    if (currentTime < start) {
      const diff = start - currentTime;
      const secs = Math.ceil(diff / 1000);
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) {
        return { state: 'UPCOMING', label: `Starts in ${days}d` };
      }
      if (hours > 0) {
        return { state: 'UPCOMING', label: `Starts in ${hours}h` };
      }
      if (mins > 0) {
        return { state: 'UPCOMING', label: `Starts in ${mins}m` };
      }
      // If starts in 0 min, represent the dynamic seconds counter here!
      return { state: 'UPCOMING', label: `Starts in ${secs}s` };
    }
    
    if (currentTime >= start && currentTime < end) {
      return { state: 'ACTIVE', label: 'Place Bid' };
    }
    
    return { state: 'CLOSED', label: 'Bidding Closed' };
  };

  // Calculate metrics
  const activeJobs = jobs.filter(job => {
    if (!job.bidding_end_time) return true;
    const end = new Date(job.bidding_end_time);
    return currentTime < end;
  });

  const totalRates = activeJobs.reduce((sum, job) => sum + parseFloat(job.budget || 0), 0);
  const avgRate = activeJobs.length > 0 ? (totalRates / activeJobs.length).toFixed(2) : "0.00";

  const closingSoonCount = activeJobs.filter(job => {
    if (!job.bidding_end_time) return false;
    const end = new Date(job.bidding_end_time);
    const diff = end - currentTime;
    return diff > 0 && diff < 2 * 60 * 60 * 1000; // 2 hours
  }).length;

  const handlePlaceBid = async (e) => {
    e.preventDefault();
    if (!bidForm.quoted_price || !bidForm.delivery_date || !bidForm.capacity_allocation) {
      return toast.error("Please fill all required fields.");
    }
    try {
      setSubmittingBid(true);
      const response = await api.post(`/api/jobs/${selectedJob.id}/bid/`, bidForm);
      toast.success("Official Bid Submitted Successfully!");
      // Optimistically update the job in feed by injecting response
      setJobs(prev => prev.map(j => j.id === selectedJob.id ? { ...j, my_bid: response.data } : j));
      setSelectedJob(null);
      setBidForm({ quoted_price: '', delivery_date: '', capacity_allocation: '', remarks: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit bid.");
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleCancelBid = async (bidId, jobId) => {
    if (!window.confirm("Are you sure you want to withdraw your bid? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/bids/${bidId}/delete/`);
      toast.success("Bid withdrawn successfully!");
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, my_bid: null } : j));
    } catch (err) {
      toast.error("Failed to withdraw bid.");
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-full">
      <div className="mb-8 flex flex-col gap-6">
        <div>
          <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight mb-1">Open Textile Job Marketplace</h1>
          <p className="text-slate-500 text-sm">
            Browse real-time fabric batches broadcasted by export houses, review target rates, and submit competitive bids instantly.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Briefcase size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Available Open Jobs</h3>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-extrabold text-slate-900">
              {activeJobs.length} <span className="text-lg font-medium text-slate-500">Batches</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-orange-600 font-bold text-xs bg-orange-50 w-max px-2.5 py-1 rounded-md">
            <span>⚡</span> {closingSoonCount} closing soon
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Target size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Average Market Rate</h3>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">
            ₹{avgRate}
          </div>
          <div className="mt-3 text-slate-500 font-medium text-sm">per unit</div>
        </div>

        <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-xl relative">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <TrendingUp size={20} />
            </div>
            <h3 className="font-semibold text-stone-300">Your Bid Success Rate</h3>
          </div>
          <div className="flex items-baseline gap-2 relative z-10">
            <div className="text-4xl font-black text-emerald-400">78%</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
              <p className="text-slate-500 text-sm font-medium">Fetching job listings...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <Briefcase size={28} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">No Active Jobs</h3>
              <p className="text-slate-500 text-sm max-w-sm">
                There are currently no active textile jobs visible in the feed. Check back later when export houses post new bids!
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-4">Export House & Title</th>
                  <th className="px-6 py-4">Process & Material</th>
                  <th className="px-6 py-4">Target Budget</th>
                  <th className="px-6 py-4">Bidding Closes</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((row) => {
                  const statusInfo = getBiddingStatus(row);
                  
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 max-w-[250px]">
                        <div className="flex items-start sm:items-center gap-1.5 flex-row">
                          <span className="font-bold text-slate-900 line-clamp-2 leading-tight">{row.company_name}</span>
                          {row.exporter_verified && (
                            <div className="group relative inline-flex items-center select-none shrink-0 mt-0.5 sm:mt-0">
                              <CheckCircle2 size={15} className="text-emerald-500 fill-emerald-500 text-white cursor-pointer" />
                              <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center z-50">
                                <span className="bg-stone-900 text-white text-[11px] font-medium px-2.5 py-1 rounded shadow-lg whitespace-nowrap">
                                  ✓ GSTIN Verified Partner Exporter
                                </span>
                                <div className="w-1.5 h-1.5 bg-stone-900 rotate-45 -mt-1"></div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-slate-500 italic mt-0.5">{row.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-slate-100 text-slate-700">
                            {row.process_type}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                            row.urgency_level === 'Immediate Dispatch'
                              ? 'bg-rose-50 text-rose-700'
                              : row.urgency_level === 'Urgent'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {row.urgency_level}
                          </span>
                        </div>
                        <div className="text-slate-700 font-medium mt-1">
                          {row.total_quantity ? row.total_quantity.toLocaleString() : '0'} {row.unit_of_measurement} ({row.raw_material_provided})
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        <div className="font-bold text-emerald-600">₹{parseFloat(row.budget || 0).toFixed(2)} / {row.unit_of_measurement}</div>
                        {row.budget_negotiable && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">
                            Negotiable
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {statusInfo.state === 'CLOSED' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 bg-slate-50">
                            Closed
                          </span>
                        ) : statusInfo.state === 'UPCOMING' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-600 bg-blue-50">
                            <Clock size={14} className="text-blue-500" />
                            {statusInfo.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-orange-600 bg-orange-50">
                            <Clock size={14} className="text-orange-500" />
                            {getTimeLeftStr(row.bidding_end_time)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {row.my_bid ? (
                          <div className="flex items-center justify-end gap-2">
                             <button
                               onClick={() => {
                                 setBidForm({
                                   quoted_price: row.my_bid.quoted_price,
                                   delivery_date: row.my_bid.delivery_date,
                                   capacity_allocation: row.my_bid.capacity_allocation,
                                   remarks: row.my_bid.remarks || ''
                                 });
                                 setSelectedJob({ ...row, isViewing: true });
                               }}
                               className="bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold select-none transition-colors"
                             >
                               <FileEdit size={16} className="mr-1.5"/> View Details
                             </button>
                             <button
                               onClick={() => handleCancelBid(row.my_bid.id, row.id)}
                               className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-bold select-none transition-colors"
                             >
                               Cancel Bid
                             </button>
                          </div>
                        ) : statusInfo.state === 'ACTIVE' ? (
                          <button
                            onClick={() => setSelectedJob(row)}
                            className="bg-slate-900 text-white flex inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-slate-800 transition-colors ml-auto select-none min-w-[125px]"
                          >
                            <FileEdit size={16} /> Place Bid
                          </button>
                        ) : statusInfo.state === 'UPCOMING' ? (
                          <button
                            disabled
                            className="bg-blue-50 text-blue-400 border border-blue-100 flex inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed select-none ml-auto min-w-[110px]"
                          >
                            Upcoming
                          </button>
                        ) : (
                          <button
                            disabled
                            className="bg-slate-100 text-slate-400 flex inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed select-none ml-auto min-w-[110px]"
                          >
                            Closed
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedJob && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">Submit Official Bid</h2>
              <p className="text-slate-500 text-sm mt-1">Review the order specifications carefully before quoting your final price and delivery commitment.</p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-blue-900 mb-3 border-b border-blue-200/60 pb-2">Order Summary Context</h3>
                
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div>
                    <span className="text-blue-700/70 text-xs block mb-0.5">Job Title</span>
                    <span className="font-semibold text-blue-900">{selectedJob.title}</span>
                  </div>
                  <div>
                    <span className="text-blue-700/70 text-xs block mb-0.5">Required Process</span>
                    <span className="font-semibold text-blue-900">{selectedJob.process_type}</span>
                  </div>
                  <div>
                    <span className="text-blue-700/70 text-xs block mb-0.5">Total Quantity</span>
                    <span className="font-semibold text-blue-900">{selectedJob.total_quantity?.toLocaleString()} {selectedJob.unit_of_measurement}</span>
                  </div>
                  <div>
                    <span className="text-blue-700/70 text-xs block mb-0.5">Export House</span>
                    <span className="font-semibold text-blue-900 flex items-center gap-1 whitespace-nowrap overflow-hidden text-ellipsis">
                      {selectedJob.company_name}
                      {selectedJob.exporter_verified && <CheckCircle2 size={13} className="text-emerald-500 fill-emerald-500 text-white shrink-0" />}
                    </span>
                  </div>
                </div>
              </div>

              <form id="bidForm" onSubmit={handlePlaceBid} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Quoted Price (Per {selectedJob.unit_of_measurement})</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">₹</span>
                    <input 
                      type="number" step="0.01" min="0.01" required
                      value={bidForm.quoted_price}
                      disabled={selectedJob.isViewing}
                      onChange={(e) => setBidForm({...bidForm, quoted_price: e.target.value})}
                      className="w-full pl-7 pr-4 py-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Committed Delivery Date</label>
                  <input 
                    type="date" required
                    min={new Date().toISOString().split('T')[0]}
                    value={bidForm.delivery_date}
                    disabled={selectedJob.isViewing}
                    onChange={(e) => setBidForm({...bidForm, delivery_date: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Capacity Allocation</label>
                  <select 
                    required
                    value={bidForm.capacity_allocation}
                    disabled={selectedJob.isViewing}
                    onChange={(e) => setBidForm({...bidForm, capacity_allocation: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all bg-white disabled:bg-slate-100 disabled:text-slate-600"
                  >
                    <option value="" disabled>Select capacity level</option>
                    <option value="25% Capacity">25% Capacity</option>
                    <option value="50% Capacity">50% Capacity</option>
                    <option value="75% Capacity">75% Capacity</option>
                    <option value="100% Dedicated">100% Dedicated Capacity</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Remarks</label>
                  <textarea 
                    rows={3}
                    value={bidForm.remarks}
                    disabled={selectedJob.isViewing}
                    onChange={(e) => setBidForm({...bidForm, remarks: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none disabled:bg-slate-100 disabled:text-slate-600"
                  />
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3 rounded-b-2xl">
              <button 
                type="button"
                onClick={() => {
                  setSelectedJob(null);
                  setBidForm({ quoted_price: '', delivery_date: '', capacity_allocation: '', remarks: '' });
                }}
                className="px-5 py-2.5 rounded-lg font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                disabled={submittingBid}
              >
                {selectedJob.isViewing ? 'Close' : 'Cancel'}
              </button>
              
              {!selectedJob.isViewing && (
                <button 
                  type="submit"
                  form="bidForm"
                  disabled={submittingBid}
                  className="px-5 py-2.5 rounded-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-md shadow-emerald-500/20 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {submittingBid ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Submitting...</>
                  ) : (
                    <>Submit Official Bid</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
