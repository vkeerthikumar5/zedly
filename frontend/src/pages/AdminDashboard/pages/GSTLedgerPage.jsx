import React, { useState, useEffect } from 'react';
import { Calculator, ArrowUpRight, ArrowDownLeft, AlertCircle, CheckCircle2, AlertTriangle, FileSpreadsheet, Eye, MoreVertical, Truck, X, FileText, Star, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { getMediaUrl } from '../../../api';
import { useAuth } from '../../../context/AuthContext';

export default function GSTLedgerPage() {
  const [challans, setChallans] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [ratingModal, setRatingModal] = useState({ isOpen: false, challanId: null, rating: 0, comments: '' });
  const [photoModal, setPhotoModal] = useState({ isOpen: false, photoUrl: null, jobRef: null, timestamp: null });
  const [itcModal, setItcModal] = useState({ isOpen: false, fromDate: '', toDate: '' });
  const { user } = useAuth();

  const fetchLedger = async () => {
    try {
      const [challansRes, jobsRes] = await Promise.all([
         api.get('/api/challans/'),
         api.get('/api/jobs/')
      ]);
      const validChallans = challansRes.data.filter(c => c.status !== 'Draft');
      setChallans(validChallans);
      setJobs(jobsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchLedger();
    const interval = setInterval(fetchLedger, 5000); // Polling for real-time updates as requested
    return () => clearInterval(interval);
  }, []);

  const viewReturnChallan = (c) => {
    const materialsRows = (c.materials || []).map((m, i) => `
       <tr>
         <td style="text-align: center; border: 1px solid #ccc; padding: 8px;">${i+1}</td>
         <td style="border: 1px solid #ccc; padding: 8px;">${m.description || '-'}</td>
         <td style="text-align: center; border: 1px solid #ccc; padding: 8px;">${m.hsn_code || '-'}</td>
         <td style="text-align: center; border: 1px solid #ccc; padding: 8px;">${m.quantity || '0'} ${m.unit || 'Units'}</td>
         <td style="text-align: right; border: 1px solid #ccc; padding: 8px;">Rs. ${ ((parseFloat(m.quantity)||0) * (parseFloat(m.taxable_value_per_unit)||0)).toFixed(2) }</td>
       </tr>
    `).join('');
    
    const pages = ['ORIGINAL FOR CONSIGNEE', 'DUPLICATE FOR TRANSPORTER', 'TRIPLICATE FOR CONSIGNOR'];
    
    const htmlContent = `
    <html>
      <head>
        <title>Return Challan - ${c.challan_number}</title>
        <style>
           .page { padding: 40px; page-break-after: always; font-family: 'Times New Roman', Times, serif; font-size: 14px; color: #111; }
           @media print { .page { page-break-after: always; } }
        </style>
      </head>
      <body style="margin: 0; padding: 0;">
         ${pages.map(label => `
         <div class="page">
           <div style="text-align: right; font-size: 14px; font-weight: bold; font-style: italic; color: #333;">${label}</div>
           <div style="text-align: center; font-size: 24px; font-weight: bold; margin-top: 20px;">JOB WORK RETURN DELIVERY CHALLAN</div>
           <div style="text-align: center; font-size: 12px; color: #555;">(Issued under Rule 55 of CGST Rules, 2017)</div>
           <div style="margin-top: 20px; text-align: center; font-weight: bold; padding: 10px; border: 1px solid #111;">
              Against Original Outgoing Challan No: ${c.challan_number} | Date: ${new Date().toLocaleDateString()}
           </div>
           <hr style="border: 1px solid #111; margin: 15px 0 30px 0;" />
           <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
             <div style="width: 48%; background: #f9f9f9; border: 1px solid #ccc; padding: 15px; box-sizing: border-box;">
               <div style="font-size: 12px; font-weight: bold; color: #555; margin-bottom: 10px;">CONSIGNOR (SUBCONTRACTOR)</div>
               <div style="font-size: 16px; font-weight: bold;">${c.subcontractor_name || 'Subcontractor Name'}</div>
               <div style="font-size: 12px; color: #555; margin-top: 5px;">${c.destination_address || '-'}</div>
               <div style="margin-top: 10px; font-weight: bold;">${c.subcontractor_id_type || 'ID'}: ${c.subcontractor_id_number || 'N/A'}</div>
             </div>
             <div style="width: 48%; background: #f9f9f9; border: 1px solid #ccc; padding: 15px; box-sizing: border-box;">
                <div style="font-size: 12px; font-weight: bold; color: #555; margin-bottom: 10px;">CONSIGNEE (EXPORT HOUSE)</div>
                <div style="font-size: 16px; font-weight: bold;">${c.export_house_name || 'Verified Export House'}</div>
                <div style="font-size: 12px; color: #555; margin-top: 5px;">${c.export_house_address || '-'}</div>
                <div style="margin-top: 10px; font-weight: bold;">GSTIN: ${c.export_house_gstin || 'N/A'}</div>
             </div>
           </div>
           <div style="margin-bottom: 60px;">
              <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">MATERIAL DETAILS (PROCESSED)</div>
              <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                <thead>
                  <tr style="background: #222; color: #fff;">
                    <th style="padding: 10px; border: 1px solid #ccc;">S.No</th>
                    <th style="padding: 10px; border: 1px solid #ccc; text-align: left;">Description of Goods</th>
                    <th style="padding: 10px; border: 1px solid #ccc;">HSN Code</th>
                    <th style="padding: 10px; border: 1px solid #ccc;">Quantity</th>
                    <th style="padding: 10px; border: 1px solid #ccc; text-align: right;">Est. Taxable Value</th>
                  </tr>
                </thead>
                <tbody>${materialsRows}</tbody>
              </table>
           </div>
           <div style="display: flex; justify-content: flex-end; margin-top: 40px;">
              <div style="width: 45%; background: #f9f9f9; border: 1px solid #ccc; padding: 20px; box-sizing: border-box;">
                 <div style="font-weight: bold;">For ${c.subcontractor_name || 'Consignor'}</div>
                 <div style="margin-top: 80px; border-top: 1px solid #222; padding-top: 10px; font-size: 12px; font-style: italic; color: #555;">(Authorized Signatory & Stamp)</div>
              </div>
           </div>
         </div>
         `).join('')}
         <script>window.print();</script>
      </body>
    </html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPdfPreview({ url, filename: `Return_Challan_${c.challan_number}.pdf` });
  };

  const generateITC04 = async () => {
    const { fromDate, toDate } = itcModal;
    if (!fromDate || !toDate) return;
    
    const from = new Date(fromDate);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    
    // Filter challans for Section 1 (Sent to Job Worker)
    const sentChallans = challans.filter(c => {
       const d = new Date(c.created_at);
       return d >= from && d <= to;
    });
    
    // Filter challans for Section 2 (Received back)
    const receivedChallans = challans.filter(c => {
       if (c.status !== 'Received' || !c.gate_in_timestamp) return false;
       const d = new Date(c.gate_in_timestamp); // date received back
       return d >= from && d <= to;
    });

    let profileInfo = {};
    try {
      const profileRes = await api.get('/api/profile/');
      profileInfo = profileRes.data;
    } catch(e) { console.error("Failed to load profile", e); }

    const exportHouseName = profileInfo?.company_name || user?.username || 'Export House';
    const exportHouseGSTIN = profileInfo?.gstin || 'GSTIN Missing';
    
    let table4Rows = sentChallans.map((c, i) => {
       const m = (c.materials && c.materials.length > 0) ? c.materials[0] : {};
       const tVal = ((parseFloat(m.quantity)||0) * (parseFloat(m.taxable_value_per_unit)||0));
       return `
         <tr>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${i+1}</td>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${c.subcontractor_id_number || '-'}</td>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${c.challan_number}</td>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${new Date(c.created_at).toLocaleDateString()}</td>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${m.hsn_code || '-'}</td>
           <td style="border: 1px solid #ccc; padding: 6px;">${m.description || '-'}</td>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${m.quantity || '0'} ${m.unit || 'UQC'}</td>
           <td style="text-align: right; border: 1px solid #ccc; padding: 6px;">${tVal.toFixed(2)}</td>
         </tr>
       `;
    }).join('');
    if (!table4Rows) table4Rows = `<tr><td colspan="8" style="text-align: center; border: 1px solid #ccc; padding: 10px;">No records found for this period</td></tr>`;

    let table5Rows = receivedChallans.map((c, i) => {
       const m = (c.materials && c.materials.length > 0) ? c.materials[0] : {};
       return `
         <tr>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${i+1}</td>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${c.challan_number}</td>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${c.subcontractor_id_number || '-'}</td>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">RET-${c.id}</td>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${new Date(c.gate_in_timestamp).toLocaleDateString()}</td>
           <td style="border: 1px solid #ccc; padding: 6px;">${m.description || '-'}</td>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">${m.quantity || '0'}</td>
           <td style="text-align: center; border: 1px solid #ccc; padding: 6px;">0</td>
         </tr>
       `;
    }).join('');
    if (!table5Rows) table5Rows = `<tr><td colspan="8" style="text-align: center; border: 1px solid #ccc; padding: 10px;">No records found for this period</td></tr>`;

    const htmlContent = `
    <html>
      <head>
        <title>ITC-04 Report HTML</title>
        <style>
           body { margin: 0; padding: 40px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 11px; color: #111; }
           h1 { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 5px; color: #1a365d; }
           h2 { text-align: center; font-size: 12px; margin-bottom: 20px; color: #4a5568; font-weight: normal; }
           .meta-box { border: 1.5px solid #1a365d; padding: 15px; margin-bottom: 30px; display: flex; justify-content: space-between; border-radius: 4px; background: #f8fafc; }
           .meta-item { margin-bottom: 8px; }
           .meta-item strong { color: #1a365d; }
           table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
           th { background: #1a365d; color: #fff; padding: 8px; border: 1px solid #1a365d; font-size: 10px; font-weight: bold; }
           td { border: 1px solid #e2e8f0; font-size: 10px; }
           .section-title { font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #1a365d; text-transform: uppercase; }
           .footer { margin-top: 50px; text-align: right; font-size: 9px; color: #718096; font-style: italic; border-top: 1px solid #e2e8f0; padding-top: 10px;}
        </style>
      </head>
      <body>
         <h1>FORM GST ITC-04</h1>
         <h2>(See Rule 45 - Details of goods/capital goods sent to job worker and received back)</h2>
         <div class="meta-box">
            <div>
               <div class="meta-item"><strong>Principal GSTIN:</strong> ${exportHouseGSTIN}</div>
               <div class="meta-item"><strong>Legal Name:</strong> ${exportHouseName}</div>
               <div class="meta-item"><strong>Trade Name:</strong> ${exportHouseName}</div>
            </div>
            <div style="text-align: right;">
               <div class="meta-item"><strong>Filing Period:</strong> ${new Date(fromDate).toLocaleDateString()} to ${new Date(toDate).toLocaleDateString()}</div>
               <div class="meta-item"><strong>Generated On:</strong> ${new Date().toLocaleString()}</div>
            </div>
         </div>
         
         <div class="section-title">Table 4: Details of inputs/capital goods sent for job work</div>
         <table>
            <thead>
               <tr>
                  <th>Sr. No.</th>
                  <th>Job Worker GSTIN</th>
                  <th>Challan No.</th>
                  <th>Challan Date</th>
                  <th>HSN Code</th>
                  <th>Description of Goods</th>
                  <th>UQC / Qty</th>
                  <th>Taxable Value (INR)</th>
               </tr>
            </thead>
            <tbody>${table4Rows}</tbody>
         </table>

         <div class="section-title">Table 5A: Details of inputs/capital goods received back from job worker</div>
         <table>
            <thead>
               <tr>
                  <th>Sr. No.</th>
                  <th>Original Challan Ref</th>
                  <th>Job Worker GSTIN</th>
                  <th>Return Challan No.</th>
                  <th>Return Date</th>
                  <th>Description</th>
                  <th>Qty Received</th>
                  <th>Qty Wasted / Loss</th>
               </tr>
            </thead>
            <tbody>${table5Rows}</tbody>
         </table>

         <div class="footer">
            Generated via Zedly Supply Chain OS - Statutory Compliance Module
         </div>
         <script>window.print();</script>
      </body>
    </html>`;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    setPdfPreview({ url, filename: `ITC-04_${fromDate}_to_${toDate}.pdf` });
    setItcModal({ ...itcModal, isOpen: false });
  };

  const updateChallanStatus = async (id, newStatus, extraData = {}) => {
    try {
      await api.put(`/api/challans/${id}/`, { status: newStatus, ...extraData });
      fetchLedger();
    } catch (err) { console.error(err); }
  };

  const ledgerData = challans.map(c => {
    const dispatchDate = new Date(c.created_at);
    const dueDate = new Date(dispatchDate.getTime() + (365 * 24 * 60 * 60 * 1000));
    const now = new Date();
    
    const relatedJob = jobs.find(j => j.id === c.job);
    
    let currentStatus = 'IN PRODUCTION';
    let currentBadgeClass = 'bg-slate-100 text-slate-700';

    if (c.status === 'Received') {
      currentStatus = 'RECEIVED';
      currentBadgeClass = 'bg-indigo-100 text-indigo-700';
    } else if (relatedJob && relatedJob.completed_at) {
      currentStatus = `COMPLETED ${new Date(relatedJob.completed_at).toLocaleDateString([], { month: 'short', day: 'numeric'})}`;
      currentBadgeClass = 'bg-emerald-100 text-emerald-700';
    } else if (now > dueDate) {
      currentStatus = 'OVERDUE';
      currentBadgeClass = 'bg-rose-100 text-rose-700';
    } else {
      currentStatus = 'IN PRODUCTION';
      currentBadgeClass = 'bg-blue-100 text-blue-700';
    }
    
    let dispatchStatus = 'Pending Completion';
    let dispatchColor = 'text-slate-500';
    let dispatchBg = 'bg-slate-50';
    
    if (c.status === 'Received') {
      dispatchStatus = 'Returned & Received';
      dispatchColor = 'text-indigo-700 font-bold';
      dispatchBg = 'bg-indigo-50';
    }
    else if (c.return_challan_generated) {
      dispatchStatus = 'In-Transit';
      dispatchColor = 'text-amber-700 font-bold';
      dispatchBg = 'bg-amber-50';
    } else if (relatedJob && relatedJob.completed_at) {
      dispatchStatus = 'Waiting for Return Challan';
      dispatchColor = 'text-rose-600 font-semibold';
      dispatchBg = 'bg-rose-50';
    }

    return {
       id: c.id,
       challan: c,
       ref: c.challan_number,
       jobIdAndName: `JOB-2026-${String(c.job || c.id).padStart(3, '0')} | ${c.job_name || 'Processed Goods'}`,
       dispatch: dispatchDate.toLocaleDateString(),
       due: `${dueDate.toLocaleDateString()} (365 Days)`,
       status: currentStatus,
       statusColor: currentBadgeClass,
       dispatchStatus: dispatchStatus,
       dispatchColor: dispatchColor,
       dispatchBg: dispatchBg,
       actionDisabled: !c.return_challan_generated
    };
  });
  
  // Calculate aggregate monetary metrics
  const inputsValueTotal = challans.filter(c => c.status !== 'Received').reduce((sum, c) => {
     let cTotal = 0;
     (c.materials || []).forEach(m => cTotal += (parseFloat(m.quantity) || 0) * (parseFloat(m.taxable_value_per_unit) || 0));
     return sum + cTotal;
  }, 0);
  const returnedValueTotal = challans.filter(c => c.status === 'Received').reduce((sum, c) => {
     let cTotal = 0;
     (c.materials || []).forEach(m => cTotal += (parseFloat(m.quantity) || 0) * (parseFloat(m.taxable_value_per_unit) || 0));
     return sum + cTotal;
  }, 0);
  
  const formattedInputs = (inputsValueTotal > 0 ? inputsValueTotal : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formattedReturned = (returnedValueTotal > 0 ? returnedValueTotal : 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  const pending = ledgerData.filter(x => x.status === 'IN PRODUCTION' || x.status === 'OVERDUE').length;

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-full">
      <div className="mb-8 flex flex-col gap-6">
        <div>
          <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight mb-1">GST ITC-04 Reconciliation</h1>
          <p className="text-slate-500 text-sm">
            Automated tracking and filing preparation for capital goods and inputs sent to job workers.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-4">
          <button onClick={() => setItcModal({ isOpen: true, fromDate: '', toDate: '' })} className="bg-slate-900 text-white flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:bg-slate-800 transition-colors shrink-0">
            <FileSpreadsheet size={18} />
            Export ITC-04 Draft
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <ArrowUpRight size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Raw Materials Currently Outside</h3>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">₹{formattedInputs}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ArrowDownLeft size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Received Back on Time</h3>
          </div>
          <div className="text-4xl font-extrabold text-emerald-600">₹{formattedReturned}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative text-white bg-gradient-to-br from-slate-900 to-slate-800 border-none">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <AlertCircle size={20} />
            </div>
            <h3 className="font-semibold text-slate-300">Pending Return Window</h3>
          </div>
          <div className="flex items-end gap-3">
            <div className="text-4xl font-extrabold">{pending}</div>
            <div className="text-sm font-medium text-slate-400 mb-1">Challans</div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
              <tr>
                <th className="px-6 py-4">Challan Ref</th>
                <th className="px-6 py-4">Job Reference</th>
                <th className="px-6 py-4">Date Dispatched</th>
                <th className="px-6 py-4">Due Date for Return</th>
                <th className="px-6 py-4">Current Status</th>
                <th className="px-6 py-4">Dispatch Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledgerData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 leading-tight">
                    {row.ref}<br/>
                    <span className="text-[10px] text-slate-400 font-normal uppercase">{row.jobIdAndName.split('|')[0]}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{row.jobIdAndName.split('|')[1]}</td>
                  <td className="px-6 py-4 font-medium">{row.dispatch}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{row.due}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider ${row.statusColor}`}>
                       {row.status === 'OVERDUE' ? <AlertTriangle size={14}/> : <CheckCircle2 size={14}/>}
                       {row.status}
                     </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className={`px-3 py-1.5 rounded-lg text-[11px] inline-block uppercase tracking-wider ${row.dispatchBg} ${row.dispatchColor}`}>
                        {row.dispatchStatus}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 relative">
                      <button 
                         disabled={row.actionDisabled}
                         onClick={() => viewReturnChallan(row.challan)}
                         className={`flex items-center gap-1.5 justify-center px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition-colors ${row.actionDisabled ? 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-white border border-emerald-500 text-emerald-600 hover:bg-emerald-50'}`}
                      >
                         <Eye size={14} />
                         Return Challan(PDF)
                      </button>
                      <div className="relative">
                        <button onClick={() => setOpenDropdownId(openDropdownId === row.id ? null : row.id)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                           <MoreVertical size={20} />
                        </button>
                        {openDropdownId === row.id && (
                           <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                              <button 
                                onClick={() => { setOpenDropdownId(null); setRatingModal({ isOpen: true, challanId: row.id, rating: 0, comments: '' }); }}
                                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                              >
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                Mark as Received
                              </button>
                              {jobs.find(j => j.id === row.challan.job)?.completion_proof && (
                                <button 
                                  onClick={() => { 
                                     setOpenDropdownId(null); 
                                     const pJob = jobs.find(j => j.id === row.challan.job);
                                     setPhotoModal({ isOpen: true, photoUrl: getMediaUrl(pJob.completion_proof), jobRef: row.jobIdAndName, timestamp: new Date(pJob.completed_at).toLocaleString() }); 
                                  }}
                                  className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-100"
                                >
                                  <ImageIcon size={16} className="text-blue-500" />
                                  See Photo Proof
                                </button>
                              )}
                           </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {ledgerData.length === 0 && (
                <tr>
                   <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                      No deployed challans found.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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

        {ratingModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white w-full max-w-md rounded-2xl shadow-2xl relative z-10 p-6 flex flex-col">
               <h3 className="text-xl font-bold text-slate-900 mb-2">Rate Subcontractor Performance</h3>
               <p className="text-sm text-slate-500 mb-6">How was the quality of the processed goods received?</p>
               
               <div className="flex items-center justify-center gap-4 mb-6">
                 {[1,2,3,4,5].map(star => (
                   <button key={star} onClick={() => setRatingModal(prev => ({...prev, rating: star}))} className="focus:outline-none transition-transform hover:scale-110">
                     <Star size={40} className={star <= ratingModal.rating ? "fill-amber-400 text-amber-400" : "text-slate-200 fill-slate-50"} />
                   </button>
                 ))}
               </div>

               <textarea 
                  value={ratingModal.comments}
                  onChange={e => setRatingModal(prev => ({...prev, comments: e.target.value}))}
                  placeholder="Optional feedback..."
                  className="w-full p-4 border border-slate-200 rounded-xl mb-6 text-sm resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  rows={3}
               />

               <div className="flex gap-4">
                 <button onClick={() => setRatingModal({isOpen: false, challanId: null, rating: 0, comments: ''})} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                 <button 
                    disabled={ratingModal.rating === 0} 
                    onClick={() => {
                        updateChallanStatus(ratingModal.challanId, 'Received', { rating: ratingModal.rating, comments: ratingModal.comments });
                        setRatingModal({isOpen: false, challanId: null, rating: 0, comments: ''});
                    }} 
                    className="flex-1 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:bg-slate-400"
                 >Submit & Receive</button>
               </div>
            </motion.div>
          </div>
        )}

        {photoModal.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/90 backdrop-blur-md" onClick={() => setPhotoModal({isOpen: false, photoUrl: null})} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-2xl relative z-10 flex flex-col items-center">
               <div className="w-full flex justify-between items-center mb-4 text-white">
                 <div>
                   <h3 className="font-bold text-lg">{photoModal.jobRef}</h3>
                   <p className="text-emerald-400 text-sm font-medium">Recorded at: {photoModal.timestamp}</p>
                 </div>
                 <button onClick={() => setPhotoModal({isOpen: false, photoUrl: null})} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X size={24} /></button>
               </div>
               <img src={photoModal.photoUrl} alt="Completion Proof" className="w-full rounded-2xl shadow-2xl object-contain max-h-[80vh] border border-white/10" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {itcModal.isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-slate-600" /> Generate ITC-04
                </h3>
                <button onClick={() => setItcModal({ ...itcModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4">
                   <label className="block text-xs font-bold text-slate-500 mb-1">From Date</label>
                   <input type="date" value={itcModal.fromDate} onChange={e => setItcModal({ ...itcModal, fromDate: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <div className="mb-6">
                   <label className="block text-xs font-bold text-slate-500 mb-1">To Date</label>
                   <input type="date" value={itcModal.toDate} onChange={e => setItcModal({ ...itcModal, toDate: e.target.value })} className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                </div>
                <button onClick={generateITC04} disabled={!itcModal.fromDate || !itcModal.toDate} className="w-full bg-slate-900 text-white font-bold py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed">
                   Generate Report PDF
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
