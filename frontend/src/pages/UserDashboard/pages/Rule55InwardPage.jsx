import React from 'react';
import { Truck, CheckCircle2, ShieldCheck, QrCode, FileText } from 'lucide-react';

const inwardData = [
  {
    ref: 'CH-2026-902',
    exporter: 'Apex Exports Ltd.',
    material: 'Dyed Silk Fabric',
    qty: '1,200 Meters',
    gateStatus: 'In Transit',
    action: 'Verify & Gate-In',
    badgeClass: 'bg-amber-100 text-amber-700'
  },
  {
    ref: 'CH-2026-891',
    exporter: 'Elite Garments',
    material: 'Cotton Warp Yarn',
    qty: '4,000 Meters',
    gateStatus: 'Verified & Accepted',
    action: 'View Challan',
    badgeClass: 'bg-emerald-100 text-emerald-700'
  }
];

export default function Rule55InwardPage() {
  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-full">
      <div className="mb-8 flex flex-col gap-6">
        <div>
          <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight mb-1">Material Inward & Rule 55 Challans</h1>
          <p className="text-slate-500 text-sm">
            Verify raw materials dispatched from export houses, log gate-in timestamps, and ensure legal compliance.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Truck size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Pending Inward Gate-Ins</h3>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">1</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Verified This Week</h3>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">14</div>
        </div>

        <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-xl overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-semibold text-stone-300">Audit Compliance</h3>
          </div>
          <div className="text-4xl font-black text-emerald-400 relative z-10">100%</div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
              <tr>
                <th className="px-6 py-4">Challan Ref</th>
                <th className="px-6 py-4">Dispatching Export House</th>
                <th className="px-6 py-4">Material Description</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Gate Status</th>
                <th className="px-6 py-4 text-right">Action Required</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inwardData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{row.ref}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{row.exporter}</td>
                  <td className="px-6 py-4 text-slate-700">{row.material}</td>
                  <td className="px-6 py-4 font-bold text-slate-700">{row.qty}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${row.badgeClass}`}>
                       {row.gateStatus}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors ${row.action === 'Verify & Gate-In' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                      {row.action === 'Verify & Gate-In' ? <QrCode size={16}/> : <FileText size={16}/>} {row.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
