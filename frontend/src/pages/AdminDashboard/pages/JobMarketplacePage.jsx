import React, { useState, useEffect } from 'react';
import Metrics from '../components/JobMarketplace/Metrics';
import DataTable from '../components/JobMarketplace/DataTable';
import BidsScreen from '../components/JobMarketplace/BidsModal';
import PostJobModal from '../components/JobMarketplace/PostJobModal';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function JobMarketplacePage() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [jobToEdit, setJobToEdit] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState({ active_jobs: 0, total_bids_today: 0, bids_increase_pct: 0, jobs_in_production: 0 });
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const [jobsRes, statsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/jobs/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8000/api/dashboard-stats/', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      const now = new Date();
      const activeJobs = jobsRes.data.filter(job => {
        const start = new Date(job.bidding_start_time);
        const end = new Date(job.bidding_end_time);
        return now >= start && now <= end && !job.awarded_bid;
      });
      setJobs(activeJobs);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleEdit = (job) => {
    setJobToEdit(job);
    setIsPostModalOpen(true);
  };
  
  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job batch? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:8000/api/jobs/${jobId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Job batch deleted successfully!");
      fetchJobs();
    } catch (err) {
      console.error("Failed to delete job:", err);
      toast.error("Failed to delete job batch. Please try again.");
    }
  };

  return (
    <div className="p-6 lg:p-top-8 lg:px-10 py-10 max-w-[1400px] mx-auto min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Live Job Marketplace</h1>
        <p className="text-slate-500 font-medium">Monitor active bidding wars happening right now.</p>
      </div>

      {!selectedJob ? (
        <>
          <Metrics stats={stats} />
          
          {loading ? (
            <div className="p-12 text-slate-500 text-center font-medium">Loading active jobs...</div>
          ) : (
            <DataTable 
              jobs={jobs} 
              onInspect={(job) => setSelectedJob(job)}
              onEdit={handleEdit} 
              onDelete={handleDelete}
            />
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
        <BidsScreen 
          isOpen={!!selectedJob} 
          job={selectedJob} 
          onClose={() => setSelectedJob(null)} 
        />
      )}
    </div>
  );
}
