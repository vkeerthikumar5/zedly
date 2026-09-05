import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Users, Star, Factory, Clock, FileCheck } from 'lucide-react';

export default function SubcontractorProfileSidebar({ isOpen, onClose, profileData }) {
  if (!profileData) return null;

  const sampleImages = [
    "https://images.unsplash.com/photo-1590212151175-69bc5393ac15?q=80&w=600&auto=format&fit=crop", // Factory floor
    "https://images.unsplash.com/photo-1534073828943-f801091bb18c?q=80&w=600&auto=format&fit=crop", // Textile making
    "https://images.unsplash.com/photo-1605372338072-a72eb37f7690?q=80&w=600&auto=format&fit=crop", // Fabric close up
    "https://images.unsplash.com/photo-1620803158652-6e27303f2de7?q=80&w=600&auto=format&fit=crop", // Threads
    "https://images.unsplash.com/photo-158ac52277884-6385cfcf4721?q=80&w=600&auto=format&fit=crop"  // Machinery
  ];

  const dummyReviews = [
    {
      author: "Apex Exports",
      rating: 5,
      date: "2 weeks ago",
      text: "Delivered exactly on time, quality was excellent. Highly recommend for high volume shirting orders."
    },
    {
      author: "Global Trendsetters Ltd",
      rating: 4,
      date: "1 month ago",
      text: "Good finish on the fabric, but had a slight delay in initial sampling. Overall, very reliable partner."
    },
    {
      author: "Nordic Apparel Co",
      rating: 5,
      date: "3 months ago",
      text: "Their air-jet looms produce incredible consistency. We've shifted 60% of our production to them."
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose} 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]" 
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[480px] bg-white shadow-2xl z-[101] flex flex-col overflow-hidden border-l border-slate-200"
          >
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white relative shrink-0">
              <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-700/50 rounded-full p-2 transition-colors">
                <X size={20} />
              </button>
              <div className="w-14 h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mb-5 backdrop-blur-md">
                <Factory size={28} className="text-emerald-400" />
              </div>
              <h3 className="text-2xl font-black tracking-tight pr-10">{profileData.subcontractor_name || profileData.name || "Verified Corporate Entity"}</h3>
              <p className="text-emerald-400 font-bold text-[11px] tracking-widest uppercase mt-2 flex items-center gap-1.5">
                <FileCheck size={14} /> Verified Subcontractor Profile
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pb-10">
              <div className="p-6 space-y-8">
                
                {/* Operating Base */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <MapPin size={14} className="text-indigo-500" /> Operating Base
                  </h4>
                  <p className="text-base font-bold text-slate-800">{profileData.location || "Tiruppur Textile District, TN"}</p>
                  <p className="text-xs font-semibold text-emerald-600 mt-1">Location Verified by Platform</p>
                </div>

                {/* Performance Stats */}
                <div className="border-t border-slate-100 pt-8">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={14} className="text-blue-500" /> Performance Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 text-center">
                      <div className="text-2xl font-black text-slate-800">{profileData.completed || profileData.jobs?.split(' ')[0] || 12}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-2">Jobs Delivered</div>
                    </div>
                    <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 text-center">
                      <div className="text-2xl font-black text-amber-600 flex items-center justify-center gap-1">
                        {profileData.rating || 4.8} <Star size={20} fill="currentColor"/>
                      </div>
                      <div className="text-[10px] font-bold text-amber-700/60 uppercase tracking-wider mt-2">Avg Rating</div>
                    </div>
                  </div>
                </div>

                {/* Machinery & Images */}
                <div className="border-t border-slate-100 pt-8">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Factory Portfolio</h4>
                  <p className="text-sm font-semibold text-slate-600 mb-4">{profileData.specialization || "Air-Jet Looms & Plain Powerlooms"}</p>
                  
                  {/* Horizontal Scroll Images */}
                  <div className="flex gap-3 overflow-x-auto pb-4 snap-x pr-4 -mr-6">
                    {sampleImages.map((src, idx) => (
                      <div key={idx} className="shrink-0 w-40 h-32 rounded-xl overflow-hidden shadow-sm bg-slate-100 snap-center first:ml-0">
                        <img src={src} className="w-full h-full object-cover" alt={`Factory sample ${idx+1}`} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews */}
                <div className="border-t border-slate-100 pt-8">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Export House Reviews</h4>
                  <div className="space-y-4">
                    {dummyReviews.map((rev, idx) => (
                      <div key={idx} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-1 text-amber-500">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} className={i >= rev.rating ? "text-slate-300" : ""} />
                            ))}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{rev.date}</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed mb-3">"{rev.text}"</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">- {rev.author}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Contact Information */}
                <div className="border-t border-slate-100 pt-8">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={14} className="text-emerald-500" /> Key Personnel (Verified)
                  </h4>
                  <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-widest mb-1">Contact Person</p>
                    <p className="font-bold text-slate-900 text-lg mb-4">{profileData.contact || "S. Kumar (Proprietor)"}</p>
                    
                    <p className="text-[10px] font-bold text-emerald-700/80 uppercase tracking-widest mb-1">Direct Callback Number</p>
                    <p className="font-semibold text-slate-800 text-base font-mono tracking-wide">{profileData.phone || "+91 91234 56789"}</p>
                  </div>
                </div>
                
              </div>
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
