import React from 'react';
import { Factory } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-20 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                <Factory size={20} />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Zedly</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-500">
              The definitive operating system for modern textile supply chains, bidding, and compliance.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Job Marketplace</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Rule 55 Challans</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Mobile App</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Web Portal</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Pricing</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Compliance</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">GST Integration</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Security Architecture</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Audit Trails</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-6">Connect</h4>
            <ul className="space-y-4 text-sm">
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Chennai Office</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Contact Sales</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Documentation</a></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Zedly Technologies Inc. All rights reserved.</p>
          <p>Built with precision for high-performance manufacturing.</p>
        </div>
      </div>
    </footer>
  );
}
