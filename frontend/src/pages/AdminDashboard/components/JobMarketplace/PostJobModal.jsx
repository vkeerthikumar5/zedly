import React, { useState, useEffect } from 'react';
import { X, Calendar, DollarSign, FileText, Upload, HelpCircle, Landmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../../api';
import toast from 'react-hot-toast';

export default function PostJobModal({ isOpen, onClose, onJobPosted, jobToEdit }) {
  const [formData, setFormData] = useState({
    title: '',
    process_type: '',
    custom_process_type: '',
    urgency_level: 'Normal',
    raw_material_provided: '',
    total_quantity: '',
    unit_of_measurement: 'Meters',
    expected_delivery_date: '',
    pickup_delivery_location: '',
    budget: '',
    budget_negotiable: false,
    bidding_start_time: '',
    bidding_end_time: '',
    visibility_option: '30mins',
    custom_visible_from_time: '',
    technical_specifications: '',
    design_document: null
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill location from profile when mapping a new post, or load job spec when editing
  useEffect(() => {
    if (isOpen) {
      if (jobToEdit) {
        // Format ISO-8601 string to YYYY-MM-DDTHH:MM format for datetime-local controls
        const formatDateTimeLocal = (isoStr) => {
          if (!isoStr) return '';
          const date = new Date(isoStr);
          const tzoffset = date.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(date.getTime() - tzoffset)).toISOString().slice(0, 16);
          return localISOTime;
        };

        const startMs = new Date(jobToEdit.bidding_start_time).getTime();
        const visMs = new Date(jobToEdit.visible_from_time).getTime();
        // check if visible time is exactly 30 minutes before start (with 15s leeway)
        const is30Mins = Math.abs((startMs - visMs) - 30 * 60 * 1000) < 15000;

        const defaultProcesses = ['Weaving', 'Dyeing', 'Printing', 'Embroidery', 'Stitching/Garmenting', 'Washing', 'Finishing'];
        const isCustomProcess = jobToEdit.process_type && !defaultProcesses.includes(jobToEdit.process_type);

        setFormData({
          title: jobToEdit.title || '',
          process_type: isCustomProcess ? 'Other' : (jobToEdit.process_type || ''),
          custom_process_type: isCustomProcess ? jobToEdit.process_type : '',
          urgency_level: jobToEdit.urgency_level || 'Normal',
          raw_material_provided: jobToEdit.raw_material_provided || '',
          total_quantity: jobToEdit.total_quantity || '',
          unit_of_measurement: jobToEdit.unit_of_measurement || 'Meters',
          expected_delivery_date: jobToEdit.expected_delivery_date || '',
          pickup_delivery_location: jobToEdit.pickup_delivery_location || '',
          budget: jobToEdit.budget || '',
          budget_negotiable: jobToEdit.budget_negotiable || false,
          bidding_start_time: formatDateTimeLocal(jobToEdit.bidding_start_time),
          bidding_end_time: formatDateTimeLocal(jobToEdit.bidding_end_time),
          visibility_option: is30Mins ? '30mins' : 'custom',
          custom_visible_from_time: is30Mins ? '' : formatDateTimeLocal(jobToEdit.visible_from_time),
          technical_specifications: jobToEdit.technical_specifications || '',
          design_document: null
        });
      } else {
        // Reset/Empty creation mode
        setFormData({
          title: '',
          process_type: '',
          custom_process_type: '',
          urgency_level: 'Normal',
          raw_material_provided: '',
          total_quantity: '',
          unit_of_measurement: 'Meters',
          expected_delivery_date: '',
          pickup_delivery_location: '',
          budget: '',
          budget_negotiable: false,
          bidding_start_time: '',
          bidding_end_time: '',
          visibility_option: '30mins',
          custom_visible_from_time: '',
          technical_specifications: '',
          design_document: null
        });

        const fetchProfileAddress = async () => {
          try {
            const res = await api.get('/api/profile/');
            if (res.data && res.data.corporate_address) {
              setFormData(prev => ({
                ...prev,
                pickup_delivery_location: res.data.corporate_address
              }));
            }
          } catch (err) {
            console.error("Failed to load profile address:", err);
          }
        };
        fetchProfileAddress();
      }
    }
  }, [isOpen, jobToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      design_document: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    if (!formData.title.trim()) return toast.error("Job Title is required");
    
    const finalProcessType = formData.process_type === 'Other' ? formData.custom_process_type : formData.process_type;
    if (formData.process_type === 'Other' && !formData.custom_process_type.trim()) {
      return toast.error("Please enter a custom process name");
    }
    if (!formData.process_type) return toast.error("Process Type is required");
    
    if (!formData.raw_material_provided.trim()) return toast.error("Raw Material is required");
    if (!formData.total_quantity || parseFloat(formData.total_quantity) <= 0) {
      return toast.error("Total Quantity must be greater than 0");
    }
    if (!formData.expected_delivery_date) return toast.error("Expected Delivery Date is required");
    if (!formData.pickup_delivery_location.trim()) return toast.error("Pickup/Delivery Location is required");
    if (!formData.budget_negotiable && (!formData.budget || parseFloat(formData.budget) <= 0)) {
      return toast.error("Please enter a valid rate/budget or set it as Negotiable");
    }

    // Bidding Dates Validation
    if (!formData.bidding_start_time) return toast.error("Bidding start time is required");
    if (!formData.bidding_end_time) return toast.error("Bidding end time is required");

    const startVal = new Date(formData.bidding_start_time).getTime();
    const endVal = new Date(formData.bidding_end_time).getTime();
    if (startVal >= endVal) {
      return toast.error("Bidding end time must be after the bidding start time");
    }

    let calculatedVisibleTime;
    if (formData.visibility_option === '30mins') {
      calculatedVisibleTime = new Date(startVal - 30 * 60 * 1000).toISOString();
    } else {
      if (!formData.custom_visible_from_time) {
        return toast.error("Custom visibility start time is required");
      }
      const visVal = new Date(formData.custom_visible_from_time).getTime();
      const diffMin = (startVal - visVal) / (1000 * 60);
      if (diffMin < 30) {
        return toast.error("Visibility start time must be configured to be at least 30 minutes before the bidding start time.");
      }
      calculatedVisibleTime = new Date(visVal).toISOString();
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const dataToSend = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (key === 'design_document') {
          if (formData[key]) {
            dataToSend.append(key, formData[key]);
          }
        } else if (key === 'budget') {
          if (formData.budget_negotiable) {
            // Send empty string or omit for null budget logic
          } else if (formData[key]) {
            dataToSend.append(key, formData[key]);
          }
        } else if (key === 'process_type') {
          dataToSend.append(key, finalProcessType);
        } else if (key === 'bidding_start_time') {
          dataToSend.append(key, new Date(formData.bidding_start_time).toISOString());
        } else if (key === 'bidding_end_time') {
          dataToSend.append(key, new Date(formData.bidding_end_time).toISOString());
        } else if (key === 'custom_process_type' || key === 'visibility_option' || key === 'custom_visible_from_time') {
          // Skip client-only configurations
        } else {
          dataToSend.append(key, formData[key]);
        }
      });
      
      dataToSend.append('visible_from_time', calculatedVisibleTime);

      const url = jobToEdit 
        ? `/api/jobs/${jobToEdit.id}/` 
        : '/api/jobs/';
      const method = jobToEdit ? 'PUT' : 'POST';

      await api({
        method: method,
        url: url,
        data: dataToSend,
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success(jobToEdit ? "Job spec changes saved!" : "Job batch posted successfully in Marketplace!");
      onJobPosted();
      onClose();
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;
      let errMsg = "Failed to submit job. Please verify inputs.";
      if (errors && typeof errors === 'object') {
        const firstErr = Object.values(errors).flat();
        if (firstErr.length > 0) errMsg = firstErr[0];
      }
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        ></motion.div>
        
        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl relative z-10 flex flex-col overflow-hidden max-h-[90vh]"
        >
          {/* Header */}
          <div className="bg-slate-900 p-6 sm:px-8 text-white flex justify-between items-center border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
                {jobToEdit ? "Edit Job Batch Spec" : "Post New Job Batch"}
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {jobToEdit ? "Modify already broadcasted job batch specifications securely" : "Broadcast custom job specifications directly to our subcontractor network"}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full p-2 transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-8 space-y-8 bg-slate-50 flex-1">
            
            {/* 1. Job Basic Details */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">1. Job Basic Details</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Job Title</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required
                  placeholder="e.g. Cotton Yarn Weaving - 40s Compact" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 gallery-select">
                  <label className="text-xs font-bold text-slate-700 uppercase">Process Type</label>
                  <select 
                    name="process_type" 
                    value={formData.process_type} 
                    onChange={handleChange} 
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="">Select Process...</option>
                    <option value="Weaving">Weaving</option>
                    <option value="Dyeing">Dyeing</option>
                    <option value="Printing">Printing</option>
                    <option value="Embroidery">Embroidery</option>
                    <option value="Stitching/Garmenting">Stitching / Garmenting</option>
                    <option value="Washing">Washing</option>
                    <option value="Finishing">Finishing</option>
                    <option value="Other">Other...</option>
                  </select>
                  
                  {formData.process_type === 'Other' && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2.5 space-y-1.5"
                    >
                      <label className="text-xs font-bold text-slate-600 uppercase">Custom Process Name</label>
                      <input 
                        type="text" 
                        name="custom_process_type" 
                        value={formData.custom_process_type} 
                        onChange={handleChange} 
                        required
                        placeholder="e.g. Sizing, Mercerizing, Raising..." 
                        className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm"
                      />
                    </motion.div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Urgency Level</label>
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-xl border border-slate-200">
                    {['Normal', 'Urgent', 'Immediate'].map((level) => {
                      const apiLevel = level === 'Immediate' ? 'Immediate Dispatch' : level;
                      const active = formData.urgency_level === apiLevel;
                      return (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setFormData(p => ({ ...p, urgency_level: apiLevel }))}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            active 
                              ? 'bg-slate-900 text-white shadow-sm' 
                              : 'text-slate-600 hover:bg-slate-200/50'
                          }`}
                        >
                          {level}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Material & Quantity Specifications */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">2. Material & Quantity</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Raw Material Provided</label>
                <input 
                  type="text" 
                  name="raw_material_provided" 
                  value={formData.raw_material_provided} 
                  onChange={handleChange} 
                  required
                  placeholder="e.g. 40s Combed Cotton Yarn on Cones" 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Total Quantity</label>
                  <input 
                    type="number" 
                    name="total_quantity" 
                    value={formData.total_quantity} 
                    onChange={handleChange} 
                    required
                    min="1"
                    placeholder="e.g. 15000" 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">Unit of Measurement</label>
                  <select 
                    name="unit_of_measurement" 
                    value={formData.unit_of_measurement} 
                    onChange={handleChange} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    <option value="Meters">Meters</option>
                    <option value="Kgs">Kgs</option>
                    <option value="Pieces">Pieces</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Yards">Yards</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Timeline & Delivery */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">3. Timeline & Delivery</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                  <Calendar size={14} className="text-slate-500" />
                  Expected Delivery Date
                </label>
                <input 
                  type="date" 
                  name="expected_delivery_date" 
                  value={formData.expected_delivery_date} 
                  onChange={handleChange} 
                  required
                  className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm uppercase cursor-pointer"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Pickup / Delivery Location</label>
                <textarea 
                  name="pickup_delivery_location" 
                  value={formData.pickup_delivery_location} 
                  onChange={handleChange} 
                  required
                  rows="2"
                  placeholder="Street Address, Factory gate or warehouse details..." 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm"
                />
              </div>
            </div>

            {/* 4. Bidding Live Period & Scheduling */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">4. Bidding Live Schedule</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 flex flex-col justify-start">
                  <label className="text-xs font-bold text-slate-700 uppercase">Bidding Start Time</label>
                  <input 
                    type="datetime-local" 
                    name="bidding_start_time" 
                    value={formData.bidding_start_time} 
                    onChange={handleChange} 
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-start">
                  <label className="text-xs font-bold text-slate-700 uppercase">Bidding End Time</label>
                  <input 
                    type="datetime-local" 
                    name="bidding_end_time" 
                    value={formData.bidding_end_time} 
                    onChange={handleChange} 
                    required
                    className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm cursor-pointer"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-slate-700 uppercase">When should this show up in subcontractors feed?</label>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, visibility_option: '30mins' }))}
                    className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                      formData.visibility_option === '30mins'
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800">30 minutes before starting</span>
                    <span className="text-[10px] text-slate-400 mt-1">Automatically relative to Bidding Start Time</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, visibility_option: 'custom' }))}
                    className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                      formData.visibility_option === 'custom'
                        ? 'border-emerald-500 bg-emerald-50/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-800">Custom Date & Time</span>
                    <span className="text-[10px] text-slate-400 mt-1">Specify manual broadcast time</span>
                  </button>
                </div>

                {formData.visibility_option === 'custom' && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1.5 mt-2"
                  >
                    <label className="text-xs font-bold text-slate-600 uppercase">Broadcast Date & Time</label>
                    <input 
                      type="datetime-local" 
                      name="custom_visible_from_time" 
                      value={formData.custom_visible_from_time} 
                      onChange={handleChange} 
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm cursor-pointer"
                    />
                  </motion.div>
                )}
              </div>
            </div>

            {/* 5. Pricing & Budget */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">5. Pricing & Budget</h3>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    name="budget_negotiable" 
                    checked={formData.budget_negotiable} 
                    onChange={handleChange} 
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <span className="text-xs font-bold text-slate-700">Negotiable on Bidding</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Job Work Rate (INR / Unit)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-4 text-slate-500 font-bold text-sm">₹</span>
                  <input 
                    type="number" 
                    name="budget" 
                    value={formData.budget_negotiable ? '' : formData.budget} 
                    onChange={handleChange} 
                    disabled={formData.budget_negotiable}
                    required={!formData.budget_negotiable}
                    placeholder={formData.budget_negotiable ? "Negotiable (subcontractors will bid custom rates)" : "e.g. 15"} 
                    className={`w-full border rounded-xl py-3 pl-8 pr-4 focus:outline-none text-sm transition-all shadow-sm ${
                      formData.budget_negotiable 
                        ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-80 text-slate-500 font-medium'
                        : 'bg-slate-50 border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-950 font-semibold'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* 6. Technical Instructions & Document Attachments */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">6. Remarks & Technical Attachments</h3>
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Technical Specifications & Remarks</label>
                <textarea 
                  name="technical_specifications" 
                  value={formData.technical_specifications} 
                  onChange={handleChange} 
                  rows="3"
                  placeholder="Details regarding gauge size, color fastness, quality parameters or packing instructions..." 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-950 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">Reference Design / Tech Pack Document</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50 hover:bg-slate-100/50 hover:border-emerald-400 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer relative group">
                  <input 
                    type="file" 
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Upload size={20} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  <span className="text-xs font-semibold text-slate-700 text-center">
                    {formData.design_document ? formData.design_document.name : "Click to upload design file (PDF or Image)"}
                  </span>
                  <span className="text-[10px] text-slate-400">PDF, PNG, JPG up to 10MB</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200/50">
              <button 
                type="button" 
                onClick={onClose}
                disabled={isSubmitting}
                className="px-5 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-bold transition-all text-xs"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all shadow-md shadow-emerald-500/10 text-xs flex items-center gap-2"
              >
                {isSubmitting ? "Saving..." : (jobToEdit ? "Save Changes" : "Publish Job to Marketplace")}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
