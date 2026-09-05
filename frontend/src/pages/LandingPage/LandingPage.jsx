import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ProblemSolution from './components/ProblemSolution';
import CoreFeatures from './components/CoreFeatures';
import DualEcosystem from './components/DualEcosystem';
import Pricing from './components/Pricing';
import CTASection from './components/CTASection';
import Footer from './components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-x-hidden">
      <Navbar />
      <Hero />
      <ProblemSolution />
      <CoreFeatures />
      <DualEcosystem />
      <Pricing />
      <CTASection />
      <Footer />
    </div>
  );
}
