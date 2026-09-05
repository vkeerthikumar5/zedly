import React, { useState, useEffect } from 'react';
import { Building2, Factory, Mail, Lock, CheckCircle2, Loader2 } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export default function ProfilePage({ role }) {
  const isAdmin = role === 'admin';
  const { user, setUser } = useAuth();
  
  const [profileData, setProfileData] = useState({});
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [gstStatus, setGstStatus] = useState('idle'); // idle, verifying, verified

  const handleVerifyGst = async (gstinVal) => {
    const parsedVal = (typeof gstinVal === 'string') ? gstinVal : '';
    const val = parsedVal || (isAdmin ? profileData.gstin : profileData.id_number);
    if (!val || val.length < 15) {
      toast.error('Please enter a valid 15-character GSTIN');
      return;
    }
    setGstStatus('verifying');
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8000/api/profile/verify-gstin/', {
        gstin: val
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const verifiedData = response.data;
      if (verifiedData.status === 'VALID' || verifiedData.gstin_status === 'Active') {
        const legalName = verifiedData.legal_name_of_business;
        const address = verifiedData.principal_place_address;
        
        // Auto fill and lock (Workflow 1)
        if (isAdmin) {
          setProfileData(prev => ({
            ...prev,
            gstin: val.toUpperCase(),
            company_name: legalName,
            corporate_address: address
          }));
        } else {
          setProfileData(prev => ({
            ...prev,
            id_number: val.toUpperCase(),
            workshop_name: legalName,
            operating_location: address
          }));
        }
        
        setGstStatus('verified');
        toast.success(verifiedData.message || 'GSTIN Verified Successfully!');
      } else {
        setGstStatus('idle');
        toast.error('Provided GSTIN is invalid or inactive.');
      }
    } catch (err) {
      setGstStatus('idle');
      const errMsg = err.response?.data?.details || err.response?.data?.error || 'GSTIN verification failed. Please try again.';
      toast.error(errMsg);
    }
  };

  const handleVerifyDocument = async () => {
    const docType = profileData.verification_doc_type;
    const idNum = profileData.id_number;

    if (!docType) {
      toast.error('Please select verification document type');
      return;
    }
    if (!idNum || idNum.trim().length < 5) {
      toast.error('Please enter a valid document ID number');
      return;
    }

    setGstStatus('verifying');
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8000/api/profile/verify-document/', {
        doc_type: docType,
        id_number: idNum
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = response.data;
      if (data && data.profile) {
        setProfileData(data.profile);
        setGstStatus('verified');
        toast.success(data.message || 'Identity verified successfully!');
      } else {
        setGstStatus('idle');
        toast.error('Verification failed. Invalid document details.');
      }
    } catch (err) {
      setGstStatus('idle');
      const errMsg = err.response?.data?.details || err.response?.data?.error || 'Verification failed. Please check inputs.';
      toast.error(errMsg);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:8000/api/profile/', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileData(res.data);
        if (role === 'admin' && res.data.gstin) {
          setGstStatus('verified');
        } else if (role !== 'admin' && res.data.verification_status === 'VERIFIED') {
          setGstStatus('verified');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [role]);

  const handleChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
    if (e.target.name === 'gstin' || e.target.name === 'verification_doc_type' || e.target.name === 'id_number') {
      setGstStatus('idle');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setMessage('Saving...');
      const token = localStorage.getItem('token');
      
      let dataOut = profileData;
      let headers = { Authorization: `Bearer ${token}` };
      
      if (profileData.companyStampFile || profileData.signatureFile) {
         dataOut = new FormData();
         Object.keys(profileData).forEach(key => {
            if (key === 'companyStampFile' && profileData.companyStampFile) {
               dataOut.append('company_stamp', profileData.companyStampFile);
            } else if (key === 'signatureFile' && profileData.signatureFile) {
               dataOut.append('authorized_signature', profileData.signatureFile);
            } else if (profileData[key] !== null && profileData[key] !== undefined && key !== 'company_stamp' && key !== 'authorized_signature') {
               dataOut.append(key, profileData[key]);
            }
         });
         headers['Content-Type'] = 'multipart/form-data';
      }

      await axios.put('http://localhost:8000/api/profile/', dataOut, {
        headers
      });
      // Refresh user to get new percentage
      const userRes = await axios.get('http://localhost:8000/api/auth/user/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(userRes.data);
      setMessage('Profile saved successfully!');
      toast.success('Profile saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Error saving profile');
      const errRes = err.response?.data;
      let errMsg = 'Failed to save profile. Please check validation errors.';
      if (errRes) {
        if (typeof errRes === 'object') {
          const errors = Object.values(errRes).flat();
          if (errors.length > 0) {
            errMsg = errors[0];
          }
        } else if (typeof errRes === 'string') {
          errMsg = errRes;
        }
      }
      toast.error(errMsg);
    }
  };

  // SVG Circle calculations
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const completionPercentage = user?.profile_completion_percentage || 0;
  const strokeDashoffset = circumference - (circumference * completionPercentage) / 100;

  if (loading) return <div className="p-10 text-slate-500">Loading profile data...</div>;

  return (
    <div className="p-6 lg:p-10 max-w-[1400px] mx-auto min-h-full font-sans">
      
      {/* Header and Progress Split */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md bg-emerald-600 shadow-emerald-600/20">
              {isAdmin ? <Building2 size={20} /> : <Factory size={20} />}
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Profile
            </h1>
          </div>
          <p className="text-slate-500 text-sm max-w-2xl mt-2 ml-14">
            {isAdmin 
              ? 'Provide your account credentials, legal compliance, and hub details to start broadcasting textile job orders.' 
              : 'Confirm your login credentials, facility details, and machinery to receive matching textile job batches.'}
          </p>
        </div>

        {/* Circular Progress Widget */}
        <div className="flex items-center gap-4 bg-white p-4 pr-6 rounded-2xl border border-slate-200 shadow-sm shrink-0">
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90 absolute inset-0">
              <circle cx="28" cy="28" r={radius} stroke="currentColor" strokeWidth="5" fill="transparent" className="text-slate-100" />
              <circle 
                cx="28" cy="28" r={radius} 
                stroke="currentColor" 
                strokeWidth="5" 
                fill="transparent" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                className="text-emerald-500" 
                strokeLinecap="round" 
              />
            </svg>
            <span className="text-sm font-extrabold text-slate-700">{completionPercentage}%</span>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-900 mb-0.5">Profile Status</p>
            <p className="text-[11px] font-medium text-amber-500 flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                {completionPercentage < 100 && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${completionPercentage === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              {completionPercentage === 100 ? <span className="text-emerald-500">Completed</span> : 'Action Required'}
            </p>
          </div>
        </div>
      </div>

      {message && <div className="mb-4 bg-emerald-50 text-emerald-700 p-3 rounded-lg text-sm font-semibold">{message}</div>}

      <form className="space-y-8" onSubmit={handleSave}>
        
        {/* Form Block 1: Account Credentials */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-100 pb-3">Account Credentials</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <input 
                  type="email" 
                  value={user?.email || ''}
                  disabled
                  className="w-full bg-slate-50 opacity-70 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 pl-11 focus:outline-none text-sm cursor-not-allowed"
                />
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium ml-1">Your primary login and notification email.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Secure Password</label>
              <div className="relative group">
                <input 
                  type="password" 
                  value="********"
                  disabled
                  className="w-full bg-slate-50 opacity-70 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 pl-11 focus:outline-none text-sm tracking-widest cursor-not-allowed"
                />
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500" />
              </div>
              <p className="text-[11px] text-slate-500 font-medium ml-1">Minimum 8 characters with letters & symbols.</p>
            </div>
          </div>
        </div>

        {/* Form Block 2: Profile Specific Details */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 border-b border-slate-100 pb-3">
            {isAdmin ? 'Corporate Information' : 'Facility Details'}
          </h3>
          
          {isAdmin ? (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Official Company Name</label>
                <input 
                  type="text" 
                  name="company_name" 
                  value={profileData.company_name || ''} 
                  onChange={handleChange} 
                  disabled={true}
                  placeholder="Auto-filled upon GSTIN verification" 
                  className={`w-full border text-slate-900 rounded-xl py-3 px-4 focus:outline-none text-sm transition-all bg-slate-100 border-slate-200 cursor-not-allowed opacity-80 ${
                    gstStatus === 'verified' ? 'font-semibold' : ''
                  }`} 
                />
                <p className="text-[11px] text-slate-500 font-medium ml-1">
                  {gstStatus === 'verified' ? '✓ Legal name locked from official GST registry records.' : 'This field is read-only and requires valid GSTIN verification.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center pr-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Company GSTIN (Mandatory)</label>
                  {gstStatus === 'verified' && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> VERIFIED</span>}
                </div>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    name="gstin" 
                    value={profileData.gstin || ''} 
                    onChange={handleChange} 
                    disabled={gstStatus === 'verified'}
                    placeholder="e.g., 33AAAAA0000A1Z5" 
                    className={`w-full border text-slate-900 rounded-xl py-3 px-4 focus:outline-none text-sm transition-all ${
                      gstStatus === 'verified'
                        ? 'bg-slate-100 border-emerald-500 cursor-not-allowed opacity-85 font-semibold text-emerald-950'
                        : 'bg-slate-50 border-slate-200 focus:border-emerald-500 focus:bg-white'
                    } ${gstStatus !== 'verified' ? 'pr-24' : ''} uppercase`} 
                  />
                  {gstStatus !== 'verified' && (
                    <button 
                      type="button" 
                      onClick={handleVerifyGst}
                      disabled={gstStatus === 'verifying'} 
                      className="absolute right-2 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1"
                    >
                      {gstStatus === 'verifying' ? <><Loader2 size={12} className="animate-spin" /> Verifying</> : 'Verify'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium ml-1">Used for Rule 55 compliance challans.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Corporate Office Address</label>
                <input 
                  type="text" 
                  name="corporate_address" 
                  value={profileData.corporate_address || ''} 
                  onChange={handleChange} 
                  disabled={true}
                  placeholder="Auto-filled upon GSTIN verification" 
                  className={`w-full border text-slate-900 rounded-xl py-3 px-4 focus:outline-none text-sm transition-all bg-slate-100 border-slate-200 cursor-not-allowed opacity-80 ${
                    gstStatus === 'verified' ? 'font-semibold' : ''
                  }`} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Primary Dispatch Hub</label>
                <input type="text" name="dispatch_hub" value={profileData.dispatch_hub || ''} onChange={handleChange} placeholder="e.g., SIPCOT Industrial Park, Perundurai, Erode" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm" />
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Official Document Signatures (Rule 55 / E-Way)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Company Rubber Stamp</label>
                    {profileData.company_stamp && typeof profileData.company_stamp === 'string' && (
                       <div className="mb-2 w-32 h-32 border border-slate-200 rounded-lg overflow-hidden bg-white flex items-center justify-center p-2">
                          <img src={`http://localhost:8000${profileData.company_stamp}`} alt="Stamp" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
                       </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png"
                      onChange={(e) => {
                         if (e.target.files && e.target.files[0]) {
                            setProfileData({...profileData, companyStampFile: e.target.files[0]});
                         }
                      }}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                    />
                    <p className="text-[10px] text-slate-400">JPEG/PNG only. Max 2MB.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Authorized Signature</label>
                    {profileData.authorized_signature && typeof profileData.authorized_signature === 'string' && (
                       <div className="mb-2 w-32 h-20 border border-slate-200 rounded-lg overflow-hidden bg-white flex items-center justify-center p-2">
                          <img src={`http://localhost:8000${profileData.authorized_signature}`} alt="Signature" style={{maxWidth: '100%', maxHeight: '100%', objectFit: 'contain'}} />
                       </div>
                    )}
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png"
                      onChange={(e) => {
                         if (e.target.files && e.target.files[0]) {
                            setProfileData({...profileData, signatureFile: e.target.files[0]});
                         }
                      }}
                      className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 transition-colors"
                    />
                    <p className="text-[10px] text-slate-400">JPEG/PNG only. Use transparent background if possible.</p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              
              {/* 1. Verification Doc & ID Number at the VERY top */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Verification Doc</label>
                  <select 
                    name="verification_doc_type" 
                    value={profileData.verification_doc_type || ''} 
                    onChange={handleChange} 
                    disabled={gstStatus === 'verified'}
                    className={`w-full border text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm appearance-none cursor-pointer h-[46px] ${
                      gstStatus === 'verified' ? 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed' : 'bg-slate-50 border-slate-200 text-slate-950 font-semibold'
                    }`}
                  >
                    <option value="">Select Document...</option>
                    <option value="GSTIN">GSTIN</option>
                    <option value="UDYAM">Udyam (MSME) Registration</option>
                    <option value="PAN">PAN Card</option>
                    <option value="AADHAAR">Aadhaar Card</option>
                    {profileData.verification_doc_type === 'PERSONAL_PAN' && <option value="PERSONAL_PAN">PERSONAL_PAN (Verified)</option>}
                    {profileData.verification_doc_type === 'BUSINESS_PAN' && <option value="BUSINESS_PAN">BUSINESS_PAN (Verified)</option>}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center pr-2">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">ID Number</label>
                    {gstStatus === 'verified' && <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> VERIFIED</span>}
                  </div>
                  <div className="relative flex items-center">
                    <input 
                      type="text" 
                      name="id_number" 
                      value={profileData.id_number || ''} 
                      onChange={handleChange}
                      disabled={gstStatus === 'verified'}
                      placeholder="Enter Registration ID" 
                      className={`w-full border text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm uppercase h-[46px] ${
                        gstStatus === 'verified'
                          ? 'bg-slate-100 border-emerald-500 cursor-not-allowed opacity-85 font-semibold text-emerald-950'
                          : 'bg-slate-50 border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-950 font-semibold'
                      } ${gstStatus !== 'verified' ? 'pr-24' : ''}`}
                    />
                    {gstStatus !== 'verified' && (
                      <button 
                        type="button" 
                        onClick={handleVerifyDocument}
                        disabled={gstStatus === 'verifying'} 
                        className="absolute right-2 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 select-none"
                      >
                        {gstStatus === 'verifying' ? <><Loader2 size={12} className="animate-spin" /> Verifying</> : 'Verify'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Optional Legal Name display for Personal identity verifications */}
              {(profileData.verification_doc_type === 'PERSONAL_PAN' || 
                profileData.verification_doc_type === 'AADHAAR') && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">✓ Verified Legal Name (Identity Locked)</label>
                  <input 
                    type="text" 
                    value={profileData.legal_name || ''} 
                    disabled={true} 
                    className="w-full border text-slate-900 rounded-xl py-3 px-4 focus:outline-none text-sm transition-all bg-emerald-50/50 border-emerald-200 cursor-not-allowed font-semibold text-emerald-950 shadow-sm" 
                  />
                  <p className="text-[11px] text-emerald-600 font-semibold ml-1">
                    ✓ Legal Name verified from personal {profileData.verification_doc_type === 'PERSONAL_PAN' ? 'PAN' : 'Aadhaar'} registry. Workshop name is not verified.
                  </p>
                </div>
              )}

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">First Name</label>
                  <input type="text" name="first_name" value={profileData.first_name || ''} onChange={handleChange} placeholder="First Name" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Last Name</label>
                  <input type="text" name="last_name" value={profileData.last_name || ''} onChange={handleChange} placeholder="Last Name" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contact Person</label>
                  <input type="text" name="contact_person" value={profileData.contact_person || ''} onChange={handleChange} placeholder="e.g. S. Kumar" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Primary Phone</label>
                  <input type="text" name="contact_number" value={profileData.contact_number || ''} onChange={handleChange} placeholder="+91..." className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm" />
                </div>
              </div>

              {/* 3. Workshop Name & Location Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {gstStatus === 'verified' && 
                   ['GSTIN', 'UDYAM', 'BUSINESS_PAN'].includes(profileData.verification_doc_type) 
                    ? '✓ Workshop / Business Name (Locked)' 
                    : 'Workshop / Business Name'}
                </label>
                <input 
                  type="text" 
                  name="workshop_name" 
                  value={profileData.workshop_name || ''} 
                  onChange={handleChange} 
                  disabled={gstStatus === 'verified' && ['GSTIN', 'UDYAM', 'BUSINESS_PAN'].includes(profileData.verification_doc_type)}
                  placeholder={gstStatus === 'verified' && ['GSTIN', 'UDYAM', 'BUSINESS_PAN'].includes(profileData.verification_doc_type) 
                    ? 'Auto-filled upon verification' 
                    : 'e.g., Sri Murugan Powerlooms'} 
                  className={`w-full border text-slate-900 rounded-xl py-3 px-4 focus:outline-none text-sm transition-all ${
                    gstStatus === 'verified' && ['GSTIN', 'UDYAM', 'BUSINESS_PAN'].includes(profileData.verification_doc_type)
                      ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-80 font-semibold text-slate-500' 
                      : 'bg-slate-50 border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-950 font-semibold'
                  }`} 
                />
                <p className="text-[11px] text-slate-500 font-medium ml-1">
                  {gstStatus === 'verified' && ['GSTIN', 'UDYAM'].includes(profileData.verification_doc_type) 
                    ? `✓ Workshop name is auto-filled and locked from official ${profileData.verification_doc_type} registry records.`
                    : gstStatus === 'verified' && profileData.verification_doc_type === 'BUSINESS_PAN'
                    ? "✓ Workshop name is auto-filled and locked from corporate PAN records. Address must be entered manually."
                    : "Please enter your workshop or business name manually."}
                </p>
              </div>
 
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {gstStatus === 'verified' && ['GSTIN', 'UDYAM'].includes(profileData.verification_doc_type) 
                    ? '✓ Operating Location / Address (Locked)' 
                    : 'Operating Location / Textile Cluster'}
                </label>
                <input 
                  type="text" 
                  name="operating_location" 
                  value={profileData.operating_location || ''} 
                  onChange={handleChange} 
                  disabled={gstStatus === 'verified' && ['GSTIN', 'UDYAM'].includes(profileData.verification_doc_type)}
                  placeholder={gstStatus === 'verified' && ['GSTIN', 'UDYAM'].includes(profileData.verification_doc_type)
                    ? 'Auto-filled upon verification' 
                    : 'e.g., Somanur, Coimbatore, Tamil Nadu'} 
                  className={`w-full border text-slate-900 rounded-xl py-3 px-4 focus:outline-none text-sm transition-all ${
                    gstStatus === 'verified' && ['GSTIN', 'UDYAM'].includes(profileData.verification_doc_type)
                      ? 'bg-slate-100 border-slate-200 cursor-not-allowed opacity-80 font-semibold text-slate-500' 
                      : 'bg-slate-50 border-slate-200 focus:border-emerald-500 focus:bg-white text-slate-950 font-semibold'
                  }`} 
                />
                <p className="text-[11px] text-slate-500 font-medium ml-1">
                  {gstStatus === 'verified' && ['GSTIN', 'UDYAM'].includes(profileData.verification_doc_type)
                    ? `✓ Operating location / address is auto-filled and locked from official ${profileData.verification_doc_type} registry records.`
                    : "Please enter your operating location or factory address manually."}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Shipping / Delivery Address</label>
                <textarea rows={3} name="shipping_address" value={profileData.shipping_address || ''} onChange={handleChange} placeholder="Full delivery address" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm resize-none"></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Primary Machinery Type</label>
                  <select name="primary_machinery" value={profileData.primary_machinery || ''} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm appearance-none">
                    <option value="">Select Machinery...</option>
                    <option value="Plain Powerlooms">Plain Powerlooms</option>
                    <option value="Rapier Looms">Rapier Looms</option>
                    <option value="Air-Jet Looms">Air-Jet Looms</option>
                    <option value="Circular Knitting Machines">Circular Knitting Machines</option>
                    <option value="Dyeing Units">Dyeing Units</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Total Active Machines</label>
                  <input type="number" name="active_machines" value={profileData.active_machines || ''} onChange={handleChange} placeholder="e.g., 24" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm" />
                </div>
              </div>



              <div className="mt-6 border-t border-slate-100 pt-6">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Payout Bank Details (Escrow)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Account Number</label>
                    <input type="text" name="account_number" value={profileData.account_number || ''} onChange={handleChange} placeholder="Enter bank account number" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">IFSC Code</label>
                    <input type="text" name="ifsc_code" value={profileData.ifsc_code || ''} onChange={handleChange} placeholder="e.g., SBIN0001234" className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl py-3 px-4 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all text-sm uppercase" />
                    <p className="text-[11px] text-emerald-600 font-medium ml-1">Verified via penny-drop check</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex justify-end gap-3 pt-4 pb-10">
          <button 
            type="button"
            className="px-6 py-3.5 rounded-xl font-bold text-slate-600 shadow-sm border border-slate-200 bg-white hover:bg-slate-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-8 py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 text-sm bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
          >
            Save & Complete Profile
          </button>
        </div>
      </form>
    </div>
  );
}
