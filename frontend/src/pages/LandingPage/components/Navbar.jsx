import React from 'react';
import { Factory, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
              <Factory size={24} />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">Zedly</span>
          </div>
          <div className="hidden md:flex space-x-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-emerald-600 transition-colors">Overview</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Ecosystem</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Compliance</a>
            <a href="#" className="hover:text-emerald-600 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">Sign In</Link>
            <Link to="/register" className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 block">
              Book a Demo <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
