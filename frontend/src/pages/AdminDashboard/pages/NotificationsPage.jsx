import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, CheckCircle2, FileText, Truck, Check, Factory, FileArchive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readUntil, setReadUntil] = useState(parseInt(localStorage.getItem('zedly_notifications_read') || '0'));

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const [jobsRes, challansRes] = await Promise.all([
          axios.get('http://localhost:8000/api/jobs/', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:8000/api/challans/', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        const jobs = jobsRes.data;
        const challans = challansRes.data;
        
        let events = [];
        
        challans.forEach(c => {
           if (c.status === 'Gate-In Verified' || c.gate_in_timestamp) {
               events.push({
                  id: `gate-in-${c.id}`,
                  title: 'Gate-In Verified',
                  description: `${c.subcontractor_name} securely gate-in verified the materials for ${c.job_name || 'Job Work'}.`,
                  time: new Date(c.gate_in_timestamp || c.created_at).getTime(),
                  type: 'gate-in'
               });
           }
           if (c.return_challan_generated) {
               events.push({
                  id: `return-${c.id}`,
                  title: 'Return Challan Issued',
                  description: `${c.subcontractor_name} has successfully generated the Return Delivery Challan for their finished goods.`,
                  time: new Date(c.gate_in_timestamp || c.created_at).getTime() + 1000 * 60 * 60, // approximate 1hr later for sorting
                  type: 'return'
               });
           }
        });
        
        jobs.forEach(j => {
           if (j.completed_at) {
               events.push({
                   id: `job-comp-${j.id}`,
                   title: 'Job Marked Completed',
                   description: `${j.awarded_bid?.subcontractor_name || 'Subcontractor'} successfully marked JOB-2026-${String(j.id).padStart(3, '0')} (${j.title}) as finished production.`,
                   time: new Date(j.completed_at).getTime(),
                   type: 'completed'
               });
           }
        });
        
        events.sort((a, b) => b.time - a.time);
        setNotifications(events);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    
    const pollId = setInterval(fetchData, 10000); // Live sync every 10s
    return () => clearInterval(pollId);
  }, []);

  const handleMarkAllRead = () => {
     const now = Date.now();
     localStorage.setItem('zedly_notifications_read', now.toString());
     setReadUntil(now);
  };
  
  const getIcon = (type) => {
     switch(type) {
         case 'gate-in': return <Truck size={20} className="text-amber-500" />;
         case 'completed': return <CheckCircle2 size={20} className="text-emerald-500" />;
         case 'return': return <FileArchive size={20} className="text-indigo-500" />;
         default: return <Bell size={20} className="text-slate-500" />;
     }
  };
  
  const getIconBg = (type) => {
      switch(type) {
         case 'gate-in': return 'bg-amber-100 border-amber-200';
         case 'completed': return 'bg-emerald-100 border-emerald-200';
         case 'return': return 'bg-indigo-100 border-indigo-200';
         default: return 'bg-slate-100 border-slate-200';
     }
  };

  const unreadCount = notifications.filter(n => n.time > readUntil).length;

  return (
    <div className="p-6 lg:p-10 max-w-[1000px] mx-auto min-h-[90vh]">
      <div className="flex justify-between items-end mb-8 relative">
        <div className="flex-1">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2.5 bg-slate-900 rounded-xl relative">
                <Bell size={24} className="text-emerald-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-500 border-2 border-white rounded-full flex items-center justify-center text-[10px] font-black text-white">
                     {unreadCount}
                  </span>
                )}
             </div>
             <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notification Center</h1>
           </div>
           <p className="text-slate-500 text-sm">Stay synchronized with subcontractor milestones, gate-in activities, and completed production jobs live.</p>
        </div>
        
        {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead} 
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-all active:scale-95"
            >
              <Check size={16} /> Mark all as read
            </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
        {loading ? (
           <div className="p-12 text-center text-slate-400 font-bold">Fetching Live Data...</div>
        ) : notifications.length === 0 ? (
           <div className="p-16 flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4 border-2 border-slate-100 border-dashed">
                 <Bell size={32} />
              </div>
              <p className="text-lg font-bold text-slate-400">All caught up!</p>
              <p className="text-sm text-slate-400">No recent notifications across your supply chain network.</p>
           </div>
        ) : (
           <div className="divide-y divide-slate-100">
             <AnimatePresence>
               {notifications.map((note) => {
                 const isUnread = note.time > readUntil;
                 return (
                   <motion.div 
                     layout
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     className={`p-6 transition-all hover:bg-slate-50/50 flex gap-5 items-start ${isUnread ? 'bg-emerald-50/30' : 'bg-white'}`}
                     key={note.id}
                   >
                     <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center border shadow-sm ${getIconBg(note.type)}`}>
                        {getIcon(note.type)}
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-start mb-1.5">
                           <h3 className={`text-[15px] ${isUnread ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                             {note.title}
                           </h3>
                           <div className="flex items-center gap-2">
                              {isUnread && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>}
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                {new Date(note.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                           </div>
                        </div>
                        <p className={`text-[14px] leading-relaxed ${isUnread ? 'text-slate-700' : 'text-slate-500'}`}>
                           {note.description}
                        </p>
                     </div>
                   </motion.div>
                 );
               })}
             </AnimatePresence>
           </div>
        )}
      </div>
    </div>
  );
}
