import React, { useState, useEffect } from 'react';
import { FileCheck, Users, Search, PhoneCall, MessageCircle, Star, BadgeCheck, X, CalendarClock, Edit, Trash, MoreVertical, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../api';
import toast from 'react-hot-toast';

import ActionBar from '../components/JobMarketplace/ActionBar';
import PostJobModal from '../components/JobMarketplace/PostJobModal';
import BidsModal from '../components/JobMarketplace/BidsModal';
import SubcontractorProfileSidebar from '../components/SubcontractorProfileSidebar';
import VerifiedBadge from '../components/VerifiedBadge';
import { generateContractPDF } from '../../../utils/pdfGenerator';

export default function ManageJobsAndContractsPage() {
  const [selectedSub, setSelectedSub] = useState(null);
  
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [selectedJobForBids, setSelectedJobForBids] = useState(null);
  const [dropdownOpenJobId, setDropdownOpenJobId] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/api/jobs/');
      setJobs(response.data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      toast.error("Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job batch? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/jobs/${jobId}/`);
      toast.success("Job batch deleted successfully!");
      fetchJobs();
    } catch (err) {
      toast.error("Failed to delete job.");
    }
  };

  const handleCancelContract = async (bidId) => {
    if (!window.confirm("Are you sure you want to cancel this contract?")) return;
    try {
      await api.post(`/api/bids/${bidId}/cancel/`, {});
      toast.success("Contract cancelled successfully!");
      fetchJobs();
    } catch (err) {
      toast.error("Failed to cancel contract.");
    }
  };

  const now = new Date();
  
  const scheduledJobs = jobs.filter(j => !j.awarded_bid && new Date(j.bidding_start_time) > now);
  const pendingJobs = jobs.filter(j => !j.awarded_bid && new Date(j.bidding_end_time) < now);
  const assignedJobs = jobs.filter(j => j.awarded_bid);

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-full">
      <ActionBar onPostClick={() => {
        setJobToEdit(null);
        setIsPostModalOpen(true);
      }} />

      <div className="mb-10 text-center sm:text-left mt-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Manage Jobs & Contracts</h1>
        <p className="text-slate-500 font-medium">Finalize awards and track your active subcontractor order pipeline.</p>
      </div>

      {!selectedJobForBids ? (
        <>
          {loading ? (
            <div className="py-20 text-slate-500 text-center font-bold">Loading pipeline data...</div>
          ) : (
      <div className="space-y-12">
        
        {/* Section: Scheduled / Future Bidding */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><CalendarClock className="text-indigo-500" /> Scheduled Bidding Pipeline</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search scheduled..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-sm" />
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-indigo-50 border-b border-indigo-100 text-slate-700 font-semibold text-xs tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-4">Job ID & Title</th>
                  <th className="px-6 py-4">Process & Quantity</th>
                  <th className="px-6 py-4">Target Rate</th>
                  <th className="px-6 py-4">Scheduled To Open</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {scheduledJobs.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-8 font-medium text-slate-400 italic">No scheduled upcoming jobs found.</td></tr>
                )}
                {scheduledJobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">JOB-2026-{String(job.id).padStart(3, '0')}</div>
                      <div className="text-slate-500 italic text-xs mt-0.5">{job.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold mr-2">{job.process_type}</span>
                      <span className="font-medium text-slate-600">{job.total_quantity?.toLocaleString()} {job.unit_of_measurement}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">₹{job.budget}</td>
                    <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50/50 text-indigo-700 border border-indigo-100 rounded-lg font-bold text-xs">
                          <CalendarClock size={14} /> {new Date(job.bidding_start_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setJobToEdit(job); setIsPostModalOpen(true); }} className="p-2 text-slate-500 hover:text-indigo-600 border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(job.id)} className="p-2 text-rose-500 hover:text-rose-700 border border-rose-100 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section A: Closed / Pending */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><FileCheck className="text-amber-500" /> Pending Award / Closed Bidding</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search closed jobs..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all shadow-sm" />
            </div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-amber-50 border-b border-amber-100 text-slate-700 font-semibold text-xs tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-4">Job ID & Title</th>
                  <th className="px-6 py-4">Process & Quantity</th>
                  <th className="px-6 py-4">Target Rate</th>
                  <th className="px-6 py-4">Bidding Ended Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingJobs.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-8 font-medium text-slate-400 italic">No pending awards found.</td></tr>
                )}
                {pendingJobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">JOB-2026-{String(job.id).padStart(3, '0')}</div>
                      <div className="text-slate-500 italic text-xs mt-0.5">{job.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold mr-2">{job.process_type}</span>
                      <span className="font-medium text-slate-600">{job.total_quantity?.toLocaleString()} {job.unit_of_measurement}</span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">₹{job.budget}</td>
                    <td className="px-6 py-4 font-medium text-slate-600">{new Date(job.bidding_end_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => setSelectedJobForBids({
                            ...job, 
                            displayId: `JOB-2026-${String(job.id).padStart(3, '0')}`,
                            quantity: `${job.total_quantity} ${job.unit_of_measurement}`
                          })}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-700 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors border border-amber-200"
                        >
                          Review Bids
                        </button>
                        <button onClick={() => handleDelete(job.id)} className="p-2 text-rose-500 hover:text-rose-700 border border-rose-100 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section B: Assigned Orders Directory */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Users className="text-emerald-500" /> Assigned Orders & Subcontractors</h2>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Search assigned..." className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-sm" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-emerald-50 border-b border-emerald-100 text-slate-700 font-semibold text-xs tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-4">Job ID</th>
                  <th className="px-6 py-4">Assigned Process</th>
                  <th className="px-6 py-4">Assigned Subcontractor</th>
                  <th className="px-6 py-4">Target Rate</th>
                  <th className="px-6 py-4">Locked Quote</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignedJobs.length === 0 && (
                  <tr><td colSpan="5" className="text-center py-8 font-medium text-slate-400 italic">No assigned orders found.</td></tr>
                )}
                {assignedJobs.map(job => (
                  <tr key={job.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4 font-bold text-slate-900 whitespace-nowrap">JOB-2026-{String(job.id).padStart(3, '0')}</td>
                    <td className="px-6 py-4 font-medium text-slate-700">{job.process_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-bold text-slate-800">
                        {job.awarded_bid.subcontractor_name}{' '}
                        <VerifiedBadge 
                          status={job.awarded_bid.verification_status} 
                          docType={job.awarded_bid.verification_doc_type} 
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700">₹{job.budget}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex flex-col">
                        <span className="font-black text-emerald-600 text-sm">₹{job.awarded_bid.quoted_price}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">By {new Date(job.awarded_bid.delivery_date).toLocaleDateString()}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 relative">
                        <button onClick={() => handleCancelContract(job.awarded_bid.id)} className="text-rose-500 hover:text-rose-700 font-bold text-xs transition-colors border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap">
                          Cancel Contract
                        </button>
                        
                        <button 
                          onClick={async () => {
                            toast.loading("Rendering PDF Document...", { id: `pdf-${job.id}` });
                            const result = await generateContractPDF(job);
                            if (result) {
                               toast.dismiss(`pdf-${job.id}`);
                               setPdfPreview(result);
                            } else {
                               toast.error("Generation failed", { id: `pdf-${job.id}` });
                            }
                          }} 
                          className="p-1.5 text-slate-500 hover:text-emerald-600 bg-slate-50 border border-slate-200 hover:border-emerald-200 hover:bg-emerald-50 rounded-lg shadow-sm transition-colors"
                          title="Generate & View PDF Agreement"
                        >
                          <Eye size={16} />
                        </button>

                        <div className="relative">
                          <button 
                            onClick={() => setDropdownOpenJobId(dropdownOpenJobId === job.id ? null : job.id)} 
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                          >
                            <MoreVertical size={16} />
                          </button>
                          
                          {dropdownOpenJobId === job.id && (
                            <div className="absolute right-0 bottom-full mb-1 w-36 bg-white rounded-lg shadow-[0_0_15px_-3px_rgba(0,0,0,0.2)] border border-slate-100 py-1 z-50 overflow-hidden origin-bottom-right">
                              <button 
                                onClick={() => {
                                  setDropdownOpenJobId(null);
                                  setSelectedSub({
                                    name: job.awarded_bid.subcontractor_name,
                                    contact: 'S. Kumar (Mocked)',
                                    phone: '+91 91234 56789',
                                    completed: Math.floor(Math.random() * 50) + 10,
                                    rating: 4.8
                                  });
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-sky-600 hover:bg-slate-50 transition-colors"
                              >
                                View Profile
                              </button>
                              <button 
                                onClick={() => {
                                  setDropdownOpenJobId(null);
                                  setSelectedJobForBids({
                                    ...job, 
                                    readOnly: true,
                                    displayId: `JOB-2026-${String(job.id).padStart(3, '0')}`,
                                    quantity: `${job.total_quantity} ${job.unit_of_measurement}`
                                  });
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100"
                              >
                                Past Bids
                              </button>
                              <button 
                                onClick={() => {
                                  setDropdownOpenJobId(null);
                                  handleDelete(job.id);
                                }}
                                className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                Delete Job
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
      )}
      
      <PostJobModal
        isOpen={isPostModalOpen}
        jobToEdit={jobToEdit}
        onClose={() => {
          setIsPostModalOpen(false);
          setJobToEdit(null);
        }}
        onJobPosted={fetchJobs}
      />
      </>
      ) : (
      <BidsModal 
        isOpen={!!selectedJobForBids}
        job={selectedJobForBids}
        onClose={() => {
          setSelectedJobForBids(null);
          // Re-fetch jobs so if a bid was awarded, it migrates to Assigned Orders in real-time
          fetchJobs();
        }}
      />
      )}

      {/* Profile Sidebar Window */}
      <SubcontractorProfileSidebar
        isOpen={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        profileData={selectedSub}
      />

      {/* PDF Viewer Modal */}
      {pdfPreview && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                 <FileCheck className="text-emerald-500" size={20} />
                 Job Work Agreement Viewer
              </h3>
              <div className="flex items-center gap-3">
                <a 
                  href={pdfPreview.url} 
                  download={pdfPreview.filename}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-bold text-sm shadow-md transition-colors flex items-center gap-2"
                >
                  Download PDF
                </a>
                <button 
                  onClick={() => setPdfPreview(null)}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100/50 p-4">
               <iframe 
                 src={`${pdfPreview.url}#toolbar=0&view=FitH`} 
                 className="w-full h-full rounded-xl border border-slate-200 shadow-sm"
                 title="PDF Preview"
               />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
