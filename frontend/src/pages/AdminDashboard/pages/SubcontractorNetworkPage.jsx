import React, { useState, useEffect } from 'react';
import { Users, Star, Factory, Search, ChevronRight, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SubcontractorProfileSidebar from '../components/SubcontractorProfileSidebar';
import VerifiedBadge from '../components/VerifiedBadge';
import axios from 'axios';

export default function SubcontractorNetworkPage() {
  const [selectedSub, setSelectedSub] = useState(null);
  const [networkData, setNetworkData] = useState([]);
  const [stats, setStats] = useState({ total_partners: 0, avg_rating: '0.0' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/api/network/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNetworkData(res.data.network);
        setStats({
           total_partners: res.data.total_partners,
           avg_rating: res.data.avg_rating
        });
      } catch (err) {
        console.error("Failed to load network:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchNetwork();
    const interval = setInterval(fetchNetwork, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Verified Subcontractor Directory</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Manage manufacturing partners, inspect factory floor capacity, review ratings, and onboard new workshops.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Total Active Partners</h3>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">{stats.total_partners}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-500 flex items-center justify-center">
              <Star size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Average Network Rating</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900">{stats.avg_rating}</span>
            <Star size={24} className="text-amber-400 fill-amber-400 -mb-1" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Factory size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Total Floor Capacity</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-slate-900">1.2M</span>
            <span className="text-sm font-medium text-slate-500">Meters / mo</span>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-64">
            <input type="text" placeholder="Search Workshop..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
              <tr>
                <th className="px-6 py-4">Workshop Name & Location</th>
                <th className="px-6 py-4">Identification</th>
                <th className="px-6 py-4">Active Jobs</th>
                <th className="px-6 py-4">Rating</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {networkData.map((partner, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-bold text-slate-800 leading-tight">
                      <span>{partner.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-semibold text-slate-600 text-xs tracking-wider uppercase">{partner.verification_doc_type}</span>
                        <VerifiedBadge 
                           status={partner.verification_status} 
                           docType={partner.verification_doc_type} 
                        />
                     </div>
                     <div className="text-slate-900 font-bold text-xs tracking-wide">{partner.id_number}</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">{partner.jobs}</td>
                  <td className="px-6 py-4">
                    {partner.rating === 'No rating' ? (
                       <div className="text-slate-400 text-sm">No rating</div>
                    ) : (
                       <div className="flex items-center gap-1 font-bold text-slate-800">
                         <Star size={14} className="text-amber-500 fill-amber-500" />
                         {partner.rating}
                       </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setSelectedSub(partner)} className="text-slate-600 font-semibold hover:text-emerald-600 inline-flex items-center gap-1 group text-sm transition-colors border border-slate-200 px-3 py-1.5 rounded-lg hover:border-emerald-600 cursor-pointer">
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Profile Sidebar Window */}
      <SubcontractorProfileSidebar
        isOpen={!!selectedSub}
        onClose={() => setSelectedSub(null)}
        profileData={selectedSub}
      />
    </div>
  );
}
