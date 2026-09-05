import React from 'react';
import { Wallet, Clock, CheckCircle2, Download } from 'lucide-react';

const earningsData = [
  {
    txn: 'TXN-9941',
    ref: 'JOB-2026-770',
    client: 'Apex Exports Ltd.',
    amount: '₹2,10,000',
    status: 'Settled to Bank',
    action: 'Download PDF'
  },
  {
    txn: 'TXN-9820',
    ref: 'JOB-2026-752',
    client: 'Kaveri Fabrics',
    amount: '₹1,75,000',
    status: 'Settled to Bank',
    action: 'Download PDF'
  }
];

export default function EarningsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-full">
      <div className="mb-8 flex flex-col gap-6">
        <div>
          <h1 className="text-[32px] font-extrabold text-slate-900 tracking-tight mb-1">Financial Ledger & Payout History</h1>
          <p className="text-slate-500 text-sm">
            Track completed contract payments, pending escrow balances, and direct bank remittances.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Wallet size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Available Balance</h3>
          </div>
          <div className="text-4xl font-extrabold text-emerald-600">₹1,42,500</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <h3 className="font-semibold text-slate-600">Pending Escrow Clearance</h3>
          </div>
          <div className="text-4xl font-extrabold text-slate-900">₹85,000</div>
        </div>

        <div className="bg-stone-900 text-white rounded-2xl p-6 shadow-xl overflow-hidden relative">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <h3 className="font-semibold text-stone-300">Total Earned (2026)</h3>
          </div>
          <div className="text-4xl font-black text-white relative z-10">₹12.4 <span className="text-xl font-medium text-slate-400">Lakhs</span></div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs tracking-wider uppercase">
              <tr>
                <th className="px-6 py-4">Transaction ID</th>
                <th className="px-6 py-4">Job Reference</th>
                <th className="px-6 py-4">Client Name</th>
                <th className="px-6 py-4">Amount Credited</th>
                <th className="px-6 py-4">Payout Status</th>
                <th className="px-6 py-4 text-right">Statement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {earningsData.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{row.txn}</td>
                  <td className="px-6 py-4 font-mono font-semibold text-slate-700 bg-slate-50 px-2 py-1 rounded w-max inline-block mt-3">{row.ref}</td>
                  <td className="px-6 py-4 font-semibold text-slate-700">{row.client}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600">{row.amount}</td>
                  <td className="px-6 py-4">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700">
                       <CheckCircle2 size={14} className="text-blue-500" />
                       {row.status}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="bg-white border border-slate-200 text-slate-600 flex inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 transition-colors">
                      <Download size={16}/> {row.action}
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
