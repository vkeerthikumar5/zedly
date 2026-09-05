import React from 'react';
import { BadgeCheck } from 'lucide-react';

export default function VerifiedBadge({ status, docType }) {
  if (!status || status === 'UNVERIFIED') return null;

  const isBusinessDoc = ['GSTIN', 'UDYAM', 'BUSINESS_PAN'].includes(docType);
  const isIdentityDoc = ['AADHAAR', 'PERSONAL_PAN'].includes(docType);

  const isBusiness = status === 'Business Verified' || (status === 'VERIFIED' && isBusinessDoc);
  const isIdentity = status === 'User Verified' || status === 'Identity Verified' || (status === 'VERIFIED' && isIdentityDoc);

  if (isBusiness) {
    return (
      <span className="group relative inline-flex items-center">
        <BadgeCheck size={14} className="text-emerald-500 cursor-help" />
        <div className="absolute bottom-full mb-1 min-w-max left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none transition-opacity z-50">
          Business verified using {docType || 'Document'}
        </div>
      </span>
    );
  }

  if (isIdentity) {
    return (
      <span className="group relative inline-flex items-center">
        <BadgeCheck size={14} className="text-slate-400 cursor-help" />
        <div className="absolute bottom-full mb-1 min-w-max left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none transition-opacity z-50">
          Identity verified using {docType || 'Document'}
        </div>
      </span>
    );
  }

  // Fallback for generic verified status
  return (
    <span className="group relative inline-flex items-center">
      <BadgeCheck size={14} className="text-emerald-500 cursor-help" />
      <div className="absolute bottom-full mb-1 min-w-max left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg shadow-xl pointer-events-none transition-opacity z-50">
        Verified Partner {docType ? `(${docType})` : ''}
      </div>
    </span>
  );
}
