import React, { useState, useEffect } from 'react';
import { FileText, Send, CheckCircle2, AlertTriangle, Search, ChevronRight, X, Plus, Trash2, Edit2, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import toast from 'react-hot-toast';
import { generateChallanPDF } from '../../../utils/pdfChallanGenerator';

export default function Rule55ChallansPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [editingChallanId, setEditingChallanId] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    job: '',
    subcontractor_name: '',
    subcontractor_id_type: 'GSTIN',
    subcontractor_id_number: '',
    subcontractor_contact_person: '',
    subcontractor_contact_number: '',
    destination_address: '',
    mode_of_transport: '',
    vehicle_number: ''
  });
  
  const [materials, setMaterials] = useState([
     { description: '', hsn_code: '', quantity: '', unit: 'Meters', taxable_value_per_unit: '' }
  ]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [jobsRes, challansRes] = await Promise.all([
        axios.get('http://localhost:8000/api/jobs/', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('http://localhost:8000/api/challans/', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setJobs(jobsRes.data.filter(j => j.awarded_bid));
      setChallans(challansRes.data);
    } catch (err) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleJobSelect = (jobId) => {
    const job = jobs.find(j => j.id === parseInt(jobId));
    if (job && job.awarded_bid) {
      setFormData(prev => ({
        ...prev,
        job: job.id,
        subcontractor_name: job.awarded_bid.subcontractor_name || '',
        subcontractor_id_type: job.awarded_bid.subcontractor_id_type || 'GSTIN',
        subcontractor_id_number: job.awarded_bid.subcontractor_id_number || '',
        subcontractor_contact_person: job.awarded_bid.subcontractor_contact_person || '',
        subcontractor_contact_number: job.awarded_bid.subcontractor_contact_number || '',
        destination_address: job.awarded_bid.destination_address || ''
      }));
    } else {
       setFormData(prev => ({...prev, job: ''}));
    }
  };

  const handleMaterialChange = (index, field, value) => {
    const newMats = [...materials];
    newMats[index][field] = value;
    setMaterials(newMats);
  };
  
  const handleSaveDraft = async () => {
    try {
      if (!formData.job) return toast.error('Please select a contract');
      if (materials.some(m => !m.description || !m.quantity)) return toast.error('Fill material details properly');

      const token = localStorage.getItem('token');
      const payload = {
         ...formData,
         status: 'Draft',
         materials: materials
      };
      
      if (editingChallanId) {
        await axios.put(`http://localhost:8000/api/challans/${editingChallanId}/`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Draft Challan Updated.');
      } else {
        await axios.post('http://localhost:8000/api/challans/', payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Draft Challan Generated safely.');
      }
      
      // reset form
      setFormData({
        job: '', subcontractor_name: '', subcontractor_id_type: 'GSTIN', subcontractor_id_number: '',
        subcontractor_contact_person: '', subcontractor_contact_number: '',
        destination_address: '', mode_of_transport: '', vehicle_number: ''
      });
      setMaterials([{ description: '', hsn_code: '', quantity: '', unit: 'Meters', taxable_value_per_unit: '' }]);
      setEditingChallanId(null);
      
      setIsModalOpen(false);
      fetchData();
    } catch(err) {
      console.error(err);
      toast.error('Failed to save challan');
    }
  };

  const updateStatus = async (challan, newStatus) => {
      if (newStatus === 'In Transit' || newStatus === 'Gate-In Verified') {
         const requiredFields = [
            'job', 'subcontractor_name', 'subcontractor_id_number', 'destination_address',
            'subcontractor_contact_person', 'subcontractor_contact_number',
            'mode_of_transport', 'vehicle_number'
         ];
         const missing = requiredFields.filter(f => !challan[f] || String(challan[f]).trim() === '');
         
         let materialsValid = true;
         if (!challan.materials || challan.materials.length === 0) {
            materialsValid = false;
         } else {
            materialsValid = challan.materials.every(m => m.description && m.hsn_code && m.quantity);
         }

         if (missing.length > 0 || !materialsValid) {
            toast.error('Dispatch failed! Ensure all fields and materials are fully populated before transit.');
            return;
         }
      }

      try {
          const token = localStorage.getItem('token');
          await axios.put(`http://localhost:8000/api/challans/${challan.id}/`, { status: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
          toast.success(`Challan updated to ${newStatus}`);
          fetchData();
      } catch(err) {
          toast.error('Failed to update status');
      }
  };

  const handleEdit = (challan) => {
      setEditingChallanId(challan.id);
      setFormData({
          job: challan.job,
          subcontractor_name: challan.subcontractor_name,
          subcontractor_id_type: challan.subcontractor_id_type,
          subcontractor_id_number: challan.subcontractor_id_number,
          subcontractor_contact_person: challan.subcontractor_contact_person,
          subcontractor_contact_number: challan.subcontractor_contact_number,
          destination_address: challan.destination_address,
          mode_of_transport: challan.mode_of_transport,
          vehicle_number: challan.vehicle_number
      });
      if (challan.materials && challan.materials.length > 0) {
          setMaterials(challan.materials);
      } else {
          setMaterials([{ description: '', hsn_code: '', quantity: '', unit: 'Meters', taxable_value_per_unit: '' }]);
      }
      fetchData();
              setIsModalOpen(true);
  };

  const handleDelete = async (challanId) => {
      if (!window.confirm("Are you sure you want to delete this challan?")) return;
      try {
          const token = localStorage.getItem('token');
          await axios.delete(`http://localhost:8000/api/challans/${challanId}/`, { headers: { Authorization: `Bearer ${token}` } });
          toast.success('Challan deleted');
          fetchData();
      } catch(err) {
          toast.error('Failed to delete challan');
      }
  };

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Rule 55 Delivery Challan Management</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Track legally mandated material transfers between the export house and subcontractors to ensure seamless GST audit trails.
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Send size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Active In-Transit Challans</h3>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">{challans.filter(c => c.status === 'In Transit').length}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Draft Challans</h3>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">{challans.filter(c => c.status === 'Draft').length}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Total Issued</h3>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">{challans.length}</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-64">
            <input type="text" placeholder="Search Challan ID..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" />
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button onClick={() => {
              setEditingChallanId(null);
              setFormData({
                job: '', subcontractor_name: '', subcontractor_id_type: 'GSTIN', subcontractor_id_number: '',
                subcontractor_contact_person: '', subcontractor_contact_number: '',
                destination_address: '', mode_of_transport: '', vehicle_number: ''
              });
              setMaterials([{ description: '', hsn_code: '', quantity: '', unit: 'Meters', taxable_value_per_unit: '' }]);
              fetchData();
              setIsModalOpen(true);
          }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-emerald-700 transition-colors">
            + Generate Draft Challan
          </button>
        </div>
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
              <tr>
                <th className="px-6 py-4">Challan ID</th>
                <th className="px-6 py-4">Subcontractor Unit</th>
                <th className="px-6 py-4">Material Details</th>
                <th className="px-6 py-4">Status & Dispatch</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-10 font-bold text-slate-400">Loading Challans...</td></tr>
              ) : challans.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-10 font-bold text-slate-400 text-lg">No Challans Issued Yet</td></tr>
              ) : challans.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{row.challan_number}</div>
                    {row.job_name && <div className="text-[11px] font-semibold text-slate-600 mt-1">{row.job_name}</div>}
                    <div className="text-[10px] text-slate-400 uppercase">JOB-2026-{String(row.job).padStart(3, '0')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-700">{row.subcontractor_name}</div>
                    <div className="text-[10px] uppercase font-bold text-slate-400 mt-1">{row.subcontractor_id_type}: {row.subcontractor_id_number}</div>
                  </td>
                  <td className="px-6 py-4">
                     {row.materials?.map(m => (
                        <div key={m.id} className="mb-1 last:mb-0">
                           <span className="font-semibold text-slate-700">{m.quantity} {m.unit}</span> <span className="text-slate-500">of</span> {m.description}
                        </div>
                     ))}
                  </td>
                  <td className="px-6 py-4">
                    {row.status === 'Gate-In Verified' ? (
                        <div className="inline-block text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border bg-emerald-50 text-emerald-600 border-emerald-200">
                           {row.status}
                           {row.gate_in_timestamp && <div className="text-[9px] mt-0.5 text-emerald-500 opacity-80">{new Date(row.gate_in_timestamp).toLocaleString()}</div>}
                        </div>
                    ) : (
                      <select 
                        value={row.status} 
                        onChange={(e) => updateStatus(row, e.target.value)}
                        className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1.5 rounded-lg border appearance-none pr-8 cursor-pointer
                          ${row.status === 'Draft' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-amber-50 text-amber-600 border-amber-200'}
                        `}
                      >
                         <option value="Draft">Draft</option>
                         <option value="In Transit">In Transit</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                       {row.status === 'Draft' && (
                          <button onClick={() => handleEdit(row)} className="text-slate-400 hover:text-emerald-600 p-1.5 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100" title="Edit Draft">
                             <Edit2 size={16} />
                          </button>
                       )}
                       <button onClick={() => handleDelete(row.id)} className="text-slate-400 hover:text-rose-600 p-1.5 bg-slate-50 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100" title="Delete Challan">
                          <Trash2 size={16} />
                       </button>
                       {(row.status === 'In Transit' || row.status === 'Gate-In Verified') && (
                          <button 
                            onClick={async () => {
                              toast.loading("Rendering PDF Document...", { id: `pdf-${row.id}` });
                              const result = await generateChallanPDF(row);
                              if (result) {
                                 toast.dismiss(`pdf-${row.id}`);
                                 setPdfPreview(result);
                              } else {
                                 toast.error("Generation failed", { id: `pdf-${row.id}` });
                              }
                            }} 
                            className="text-slate-400 hover:text-emerald-600 p-1.5 bg-slate-50 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100" 
                            title="View Generated PDF"
                          >
                             <Eye size={16} />
                          </button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
              <div className="p-6 border-b border-slate-100 flex justify-between items-start sticky top-0 bg-white z-20 rounded-t-2xl">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-1">Generate Rule 55 Draft Challan</h2>
                  <p className="text-sm font-medium text-slate-500">Create a compliant material transfer document. The official challan date and transit clock will lock upon final dispatch confirmation.</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full transition-colors ml-4">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-8">
                {/* 1. Contract & Recipient Details */}
                <section>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">1. Contract & Recipient Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Select Awarded Contract / Job ID <span className="text-rose-500">*</span></label>
                      <select value={formData.job} onChange={(e) => handleJobSelect(e.target.value)} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-slate-50 font-medium">
                        <option value="">Select a previously awarded job...</option>
                        {jobs.filter(j => !j.has_challan || j.id === parseInt(formData.job)).map(j => (
                           <option key={j.id} value={j.id}>JOB-2026-{String(j.id).padStart(3, '0')} ({j.awarded_bid.subcontractor_name})</option>
                        ))}
                      </select>
                      <p className="text-[11px] text-emerald-600 mt-1 font-semibold">Auto-fills the fields below on selection based on contractor's verified profile.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Subcontractor Unit Name</label>
                        <input type="text" value={formData.subcontractor_name} readOnly onChange={e => setFormData({...formData, subcontractor_name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-slate-100 text-slate-500 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                           Document: {formData.subcontractor_id_type || 'ID'} 
                        </label>
                        <input type="text" value={formData.subcontractor_id_number} readOnly onChange={e => setFormData({...formData, subcontractor_id_number: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none uppercase bg-slate-100 text-slate-500 cursor-not-allowed" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Contact Person</label>
                        <input type="text" value={formData.subcontractor_contact_person} readOnly onChange={e => setFormData({...formData, subcontractor_contact_person: e.target.value})} placeholder="e.g. S. Kumar" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-slate-100 text-slate-500 cursor-not-allowed" />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Primary Phone</label>
                        <input type="text" value={formData.subcontractor_contact_number} readOnly onChange={e => setFormData({...formData, subcontractor_contact_number: e.target.value})} placeholder="+91..." className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none bg-slate-100 text-slate-500 cursor-not-allowed" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Destination Delivery Address / Shipping</label>
                      <textarea rows={2} value={formData.destination_address} onChange={e => setFormData({...formData, destination_address: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"></textarea>
                    </div>
                  </div>
                </section>

                {/* 2. Material & Inventory Details */}
                <section>
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
                     <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">2. Material & Inventory Details</h3>
                     <button onClick={() => setMaterials([...materials, {description:'', hsn_code:'', quantity:'', unit:'Meters', taxable_value_per_unit: ''}])} className="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold px-3">
                        <Plus size={14} /> Add Line Item
                     </button>
                  </div>
                  
                  <div className="space-y-3">
                     {materials.map((mat, i) => (
                       <div key={i} className="flex gap-2 items-start flex-wrap lg:flex-nowrap">
                         <div className="flex-[2] min-w-[200px]">
                            <input value={mat.description} onChange={e => handleMaterialChange(i, 'description', e.target.value)} type="text" placeholder="Material Description *" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
                         </div>
                         <div className="flex-1 min-w-[100px]">
                            <input value={mat.hsn_code} onChange={e => handleMaterialChange(i, 'hsn_code', e.target.value)} type="text" placeholder="HSN (opt)" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
                         </div>
                         <div className="flex-1 min-w-[100px]">
                            <input value={mat.quantity} onChange={e => handleMaterialChange(i, 'quantity', e.target.value)} type="number" placeholder="Qty *" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500" />
                         </div>
                         <div className="flex-1 min-w-[100px]">
                            <select value={mat.unit} onChange={e => handleMaterialChange(i, 'unit', e.target.value)} className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500 bg-white">
                               <option>Meters</option>
                               <option>Kgs</option>
                               <option>Pieces</option>
                               <option>Rolls</option>
                            </select>
                         </div>
                         <div className="flex-[1.5] min-w-[140px]">
                            <input value={mat.taxable_value_per_unit || ''} onChange={e => handleMaterialChange(i, 'taxable_value_per_unit', e.target.value)} type="number" placeholder="Taxable Value (Per Unit)" className="w-full border border-emerald-200 bg-emerald-50/30 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-emerald-500" title="Single product entry value" />
                         </div>
                         {materials.length > 1 && (
                            <button onClick={() => setMaterials(materials.filter((_, idx) => idx !== i))} className="p-2.5 mt-0.5 text-rose-500 hover:bg-rose-50 border border-transparent rounded-lg transition-colors">
                               <Trash2 size={18} />
                            </button>
                         )}
                       </div>
                     ))}
                  </div>
                </section>

                {/* 3. Logistics Information */}
                <section>
                  <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">3. Logistics Information (Optional at Draft)</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Mode of Transport</label>
                      <select value={formData.mode_of_transport} onChange={e => setFormData({...formData, mode_of_transport: e.target.value})} className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white">
                        <option value="">Select Mode...</option>
                        <option>Company Truck</option>
                        <option>Third-Party Logistics</option>
                        <option>Subcontractor Pickup</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-1">Vehicle Number / Tracking ID</label>
                      <input value={formData.vehicle_number} onChange={e => setFormData({...formData, vehicle_number: e.target.value})} type="text" placeholder="e.g., TN-38-BP-4321" className="w-full border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase" />
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-2xl">
                <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button onClick={handleSaveDraft} className="px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 rounded-lg shadow-md hover:bg-emerald-700 active:scale-95 transition-all">
                  Save as Draft
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pdfPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-10">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={() => setPdfPreview(null)} />
            
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white w-full max-w-5xl h-full max-h-[90vh] rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden">
              <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-100 flex justify-between items-center bg-white z-20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">Rule 55 Challan Viewer</h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <a
                    href={pdfPreview.url}
                    download={pdfPreview.filename}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
                  >
                    Download PDF
                  </a>
                  <button onClick={() => setPdfPreview(null)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2.5 rounded-xl transition-colors border border-slate-200">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100/50 p-2 sm:p-6 overflow-hidden">
                <div className="w-full h-full bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden">
                  <iframe 
                    src={`${pdfPreview.url}#page=1&toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full rounded-xl"
                    title="Challan PDF Preview"
                    style={{ border: 'none' }}
                  />
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
