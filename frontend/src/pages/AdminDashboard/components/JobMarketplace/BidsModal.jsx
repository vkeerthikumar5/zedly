import React, { useState, useEffect } from "react";
import { X, Star, CheckCircle, Clock, MapPin, Factory, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../../api';
import { toast } from 'react-hot-toast';
import SubcontractorProfileSidebar from '../SubcontractorProfileSidebar';
import VerifiedBadge from '../VerifiedBadge';

export default function BidsModal({ isOpen, onClose, job }) {
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const fetchBids = () => {
    api.get(`/api/jobs/${job.id}/bids/`)
      .then(res => setBids(res.data))
      .catch(err => {
        console.error(err);
        toast.error("Failed to load bids.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (isOpen && job) {
      setLoading(true);
      fetchBids();
    }
  }, [isOpen, job]);

  const handleAward = async (bidId) => {
    if (!window.confirm("Are you sure you want to award this contract?")) return;
    try {
      setActionLoading(bidId);
      await api.post(`/api/bids/${bidId}/award/`, {});
      toast.success("Contract successfully awarded!");
      fetchBids();
    } catch (err) {
      toast.error(err.response?.data?.error || "Error awarding contract");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelAward = async (bidId) => {
    if (!window.confirm("Are you sure you want to cancel this contract award?")) return;
    try {
      setActionLoading(bidId);
      await api.post(`/api/bids/${bidId}/cancel/`, {});
      toast.success("Contract award cancelled.");
      fetchBids();
    } catch (err) {
      toast.error("Error cancelling contract");
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen || !job) return null;

  // Determine standard setters for tags
  let lowestPrice = Infinity;
  let earliestDate = null;

  if (bids.length > 0) {
    lowestPrice = Math.min(...bids.map(b => parseFloat(b.quoted_price)));
    earliestDate = bids.reduce((earliest, b) => {
      const d = new Date(b.delivery_date);
      if (!earliest || d < earliest) return d;
      return earliest;
    }, null);
  }

  const anyAccepted = bids.some(b => b.status === 'Accepted');

  return (
    <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="bg-white w-full rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[500px]"
        >
          {/* Header */}
          <div className="bg-slate-900 p-6 sm:px-8 text-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">JOB-2026-{String(job?.id || '').padStart(3, '0')}</h2>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Live Bidding</span>
                </div>
                <p className="text-slate-400 font-medium">{job.title} &mdash; {job.quantity?.toLocaleString() || job.total_quantity?.toLocaleString()} {job.unit_of_measurement}</p>
              </div>
            <button onClick={onClose} className="text-slate-900 bg-emerald-400 hover:bg-emerald-300 font-bold px-4 rounded-lg py-2 transition-colors flex items-center gap-2 text-sm shadow-md shrink-0 ml-2">
              ← Back
            </button>
          </div>

          {/* Body: Live Feed view */}
          <div className="p-6 sm:p-8 overflow-y-auto bg-slate-50 flex-1 relative">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Received Quoted Bids Table</h3>

            {loading ? (
              <div className="py-20 text-center font-bold text-slate-400">Fetching live bids...</div>
            ) : bids.length === 0 ? (
              <div className="py-20 text-center font-bold text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">No bids received yet for this batch.</div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
                    <tr>
                      <th className="px-4 py-4">Subcontractor</th>
                      <th className="px-4 py-4">Rating</th>
                      <th className="px-4 py-4">Quoted Rate</th>
                      <th className="px-4 py-4">Expected Delivery</th>
                      <th className="px-4 py-4">Bid Placed On</th>
                      {!job.readOnly && <th className="px-4 py-4 text-right">Action</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bids.map((bid) => {
                      const isLowest = parseFloat(bid.quoted_price) === lowestPrice;
                      const bd = new Date(bid.delivery_date);
                      const isEarliest = earliestDate && bd.getTime() === earliestDate.getTime();
                      const isAccepted = bid.status === 'Accepted';

                      return (
                        <tr key={bid.id} className={`hover:bg-slate-50/50 transition-colors ${isAccepted ? 'bg-emerald-50/50' : ''}`}>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="font-bold text-slate-900 leading-tight">
                              <span>
                                {bid.subcontractor_name}{' '}
                                <VerifiedBadge 
                                  status={bid.verification_status} 
                                  docType={bid.verification_doc_type} 
                                />
                              </span>
                            </div>
                            <button
                              onClick={() => setSelectedProfile(bid)}
                              className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider mt-1 transition-colors"
                            >
                              View Profile
                            </button>
                            {bid.remarks && (
                              <div className="text-xs text-slate-500 italic mt-1 max-w-[150px] truncate" title={bid.remarks}>
                                "{bid.remarks}"
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="flex items-center gap-1 font-bold text-amber-500">
                              <Star size={14} fill="currentColor" /> {bid.rating}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-black text-emerald-600 text-lg">₹{bid.quoted_price}</div>
                            {isLowest && <span className="inline-block text-[10px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 mt-1 rounded uppercase">Lowest Price</span>}
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-semibold text-slate-700">{bd.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            {isEarliest && <span className="inline-block text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 mt-1 rounded uppercase">Early Finish</span>}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                            {new Date(bid.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          {!job.readOnly && (
                          <td className="px-4 py-4 text-right">
                            {isAccepted ? (
                              <button
                                onClick={() => handleCancelAward(bid.id)}
                                disabled={actionLoading === bid.id}
                                className="bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50 inline-flex items-center gap-1.5 whitespace-nowrap"
                              >
                                <X size={16} /> Cancel Contract
                              </button>
                            ) : !anyAccepted ? (
                              <button
                                onClick={() => handleAward(bid.id)}
                                disabled={actionLoading === bid.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-all disabled:opacity-50 whitespace-nowrap"
                              >
                                Award Contract
                              </button>
                            ) : (
                              <span className="text-slate-400 text-sm font-semibold italic">N/A</span>
                            )}
                          </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
        
        {/* Profile Sidebar Window */}
        <SubcontractorProfileSidebar
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          profileData={selectedProfile}
        />
    </AnimatePresence>
  );
}
