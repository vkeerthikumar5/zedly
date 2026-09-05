import React from 'react';
import { Shield, Webhook, Smartphone, Lock, User, Plus } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-10 max-w-[1200px] mx-auto min-h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">Workspace Settings & Role Permissions</h1>
        <p className="text-slate-500 text-sm max-w-2xl">
          Configure user accounts, security tokens, webhook integrations, and export house profile preferences.
        </p>
      </div>

      <div className="space-y-6">
        
        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <User size={20} className="text-slate-400" />
              Team Access Roles
            </h2>
            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
              <Plus size={16} /> Invite User
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div>
                <h3 className="font-bold text-slate-900">Admin <span className="mx-2 text-slate-300">|</span> <span className="text-slate-500 font-medium text-sm">Full Access</span></h3>
                <p className="text-slate-500 text-xs mt-1">Complete control over jobs, bidding, and financial ledgers.</p>
              </div>
              <div className="bg-slate-200 text-slate-700 px-3 py-1 rounded-md text-sm font-bold">2 Users</div>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div>
                <h3 className="font-bold text-slate-900">Inventory Controller <span className="mx-2 text-slate-300">|</span> <span className="text-slate-500 font-medium text-sm">Challan & Gate Management</span></h3>
                <p className="text-slate-500 text-xs mt-1">Can create Rule 55 challans and verify inbound/outbound materials.</p>
              </div>
              <div className="bg-slate-200 text-slate-700 px-3 py-1 rounded-md text-sm font-bold">4 Users</div>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors">
              <div>
                <h3 className="font-bold text-slate-900">Accountant <span className="mx-2 text-slate-300">|</span> <span className="text-slate-500 font-medium text-sm">GST & Ledger Access</span></h3>
                <p className="text-slate-500 text-xs mt-1">Read-only access to ITC-04 data and financial tracking.</p>
              </div>
              <div className="bg-slate-200 text-slate-700 px-3 py-1 rounded-md text-sm font-bold">2 Users</div>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 mb-6">
            <Webhook size={20} className="text-slate-400" />
            System Integrations
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-5 flex items-start gap-4 hover:border-emerald-500/50 transition-colors shadow-sm cursor-pointer">
              <div className="w-10 h-10 bg-slate-900 text-white flex items-center justify-center rounded-lg shrink-0">
                <Webhook size={20} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-900">ERP Webhook Endpoints</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-sm">Active</span>
                </div>
                <p className="text-sm font-medium text-slate-500">Syncs live job awards directly with your legacy SAP/Oracle ERP systems.</p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 flex items-start gap-4 hover:border-emerald-500/50 transition-colors shadow-sm cursor-pointer">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 flex items-center justify-center rounded-lg shrink-0">
                <Smartphone size={20} />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-bold text-slate-900">SMS / WhatsApp Gateway</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-sm">Connected</span>
                </div>
                <p className="text-sm font-medium text-slate-500">Sends automated bid alerts and challan confirmations to subcontractors.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden">
          <div className="absolute -top-12 -right-12 text-stone-800 opacity-20 pointer-events-none">
            <Shield size={160} />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Lock size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold mb-1">Enforced Security protocols</h2>
                <p className="text-stone-400 text-sm max-w-md">
                  Two-Factor Authentication (2FA) is strictly enforced for all admin accounts accessing financial bidding and GST ledgers.
                </p>
              </div>
            </div>
            
            <button className="whitespace-nowrap bg-white text-stone-900 px-6 py-3 rounded-xl font-bold text-sm shadow-md hover:bg-stone-100 transition-colors w-full md:w-auto">
              Manage Security Keys
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
