import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Dimensions,
  Animated,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Image
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { CameraView, useCameraPermissions } from 'expo-camera';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuth, API_URL } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

// ------------------------------------------------------------------
// Standard Docked Bottom Nav
// ------------------------------------------------------------------
const StandardBottomNav = ({ activeTab, setActiveTab }) => {
  return (
    <>
      <View style={styles.bottomNavContainer}>
        <View style={styles.bottomNav}>
          <View style={styles.navGroup}>
            <TouchableOpacity style={styles.navButton} onPress={() => setActiveTab('feed')}>
              <MaterialCommunityIcons name={activeTab === 'feed' ? 'home' : 'home-outline'} size={24} color={activeTab === 'feed' ? '#10b981' : '#94a3b8'} />
              <Text style={[styles.navLabel, activeTab === 'feed' && {color: '#10b981'}]}>Home</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navButton} onPress={() => setActiveTab('contracts')}>
              <MaterialCommunityIcons name={activeTab === 'contracts' ? 'file-document' : 'file-document-outline'} size={24} color={activeTab === 'contracts' ? '#10b981' : '#94a3b8'} />
              <Text style={[styles.navLabel, activeTab === 'contracts' && {color: '#10b981'}]}>Contracts</Text>
            </TouchableOpacity>
          </View>

          {/* Spacer for FAB */}
          <View style={{width: 60}} />

          <View style={styles.navGroup}>
            <TouchableOpacity style={styles.navButton} onPress={() => setActiveTab('earnings')}>
              <MaterialCommunityIcons name={activeTab === 'earnings' ? 'wallet' : 'wallet-outline'} size={24} color={activeTab === 'earnings' ? '#10b981' : '#94a3b8'} />
              <Text style={[styles.navLabel, activeTab === 'earnings' && {color: '#10b981'}]}>Earnings</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.navButton} onPress={() => setActiveTab('profile')}>
              <MaterialCommunityIcons name={activeTab === 'profile' ? 'account' : 'account-outline'} size={24} color={activeTab === 'profile' ? '#10b981' : '#94a3b8'} />
              <Text style={[styles.navLabel, activeTab === 'profile' && {color: '#10b981'}]}>Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Floating Center Action Button mapped to Challans */}
      <TouchableOpacity style={styles.fabCenter} onPress={() => setActiveTab('challans')}>
        <View style={styles.fabInner}>
          <MaterialCommunityIcons name="line-scan" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
    </>
  );
};

// ------------------------------------------------------------------
// Screen 1: Live Feed
// ------------------------------------------------------------------
const FeedTab = ({ jobs, setJobs, loading, currentTime }) => {
  const [feedFilter, setFeedFilter] = useState('active');
  const [selectedJob, setSelectedJob] = useState(null);
  const [bidForm, setBidForm] = useState({ quoted_price: '', delivery_date: '', remarks: '' });
  const [submittingBid, setSubmittingBid] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePlaceBid = async () => {
    if (!bidForm.quoted_price || !bidForm.delivery_date) {
      return Alert.alert('Validation Error', 'Please fill all required fields before submitting.');
    }
    try {
      setSubmittingBid(true);
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/jobs/${selectedJob.id}/bid/`, { ...bidForm, capacity_allocation: '100% (Standard)' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      Alert.alert("Success", "Official Bid Submitted Successfully!");
      setJobs(prev => prev.map(j => j.id === selectedJob.id ? { 
        ...j, 
        my_bid: {
           id: res.data.id || Date.now(),
           quoted_price: bidForm.quoted_price,
           delivery_date: bidForm.delivery_date,
           remarks: bidForm.remarks
        }
      } : j));
      setSelectedJob(null);
      setBidForm({ quoted_price: '', delivery_date: '', remarks: '' });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || "Failed to submit bid.");
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleCancelBid = async (bidId, jobId) => {
    Alert.alert(
      "Cancel Bid",
      "Are you sure you want to withdraw your bid?",
      [
        { text: "No", style: "cancel" },
        { 
          text: "Yes, Cancel", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              await axios.delete(`${API_URL}/api/bids/${bidId}/delete/`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              Alert.alert("Success", "Bid withdrawn successfully!");
              setJobs(prev => prev.map(j => j.id === jobId ? { ...j, my_bid: null } : j));
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel the bid.');
            }
          }
        }
      ]
    );
  };

  const getBiddingStatus = (job) => {
    if (!job.bidding_start_time || !job.bidding_end_time) {
      return { state: 'ACTIVE', label: 'Place Bid' };
    }
    const start = new Date(job.bidding_start_time);
    const end = new Date(job.bidding_end_time);
    
    if (currentTime < start) {
      const diff = start - currentTime;
      const secs = Math.ceil(diff / 1000);
      const mins = Math.floor(diff / 60000);
      const hours = Math.floor(mins / 60);
      const days = Math.floor(hours / 24);
      
      if (days > 0) return { state: 'UPCOMING', label: `Starts in ${days}d` };
      if (hours > 0) return { state: 'UPCOMING', label: `Starts in ${hours}h` };
      if (mins > 0) return { state: 'UPCOMING', label: `Starts in ${mins}m` };
      return { state: 'UPCOMING', label: `Starts in ${secs}s` };
    }
    
    if (currentTime >= start && currentTime < end) {
      return { state: 'ACTIVE', label: 'Place Bid' };
    }
    
    return { state: 'CLOSED', label: 'Bidding Closed' };
  };

  const getTimeLeftStr = (endTime) => {
    if (!endTime) return 'N/A';
    const diff = new Date(endTime) - currentTime;
    if (diff <= 0) return 'Closed';
    const seconds = Math.floor(diff / 1000);
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} Day${days > 1 ? 's' : ''} Left`;
    if (hours > 0) return `${hours} Hour${hours > 1 ? 's' : ''} Left`;
    if (mins > 0) return `${mins} Min${mins > 1 ? 's' : ''} Left`;
    return `${seconds} Sec${seconds !== 1 ? 's' : ''} Left`;
  };

  const activeJobs = jobs.filter(job => getBiddingStatus(job).state === 'ACTIVE');
  
  const jobsToDisplay = feedFilter === 'active'
    ? activeJobs
    : jobs.filter(job => job.my_bid);

  const totalRates = activeJobs.reduce((sum, job) => sum + parseFloat(job.budget || 0), 0);
  const avgRate = activeJobs.length > 0 ? (totalRates / activeJobs.length).toFixed(2) : "0.00";

  return (
    <View style={styles.tabContainer}>
      {/* Metric Cards Row */}
      <View style={styles.metricsRow}>
         <LinearGradient colors={['#10b981', '#064e3b']} style={styles.metricCard}>
           <Text style={[styles.metricLabel, {color: 'rgba(255,255,255,0.85)'}]}>Open Batches</Text>
           <Text style={[styles.metricValue, {color: '#ffffff'}]}>{activeJobs.length} <Text style={{fontSize: 16, color: '#fde047'}}>Live</Text></Text>
         </LinearGradient>
         <LinearGradient colors={['#10b981', '#064e3b']} style={styles.metricCard}>
           <Text style={[styles.metricLabel, {color: 'rgba(255,255,255,0.85)'}]}>Avg. Rate</Text>
           <Text style={[styles.metricValue, {color: '#ffffff'}]}>₹{avgRate} <Text style={{fontSize: 14, color: 'rgba(255,255,255,0.8)'}}>/ u</Text></Text>
         </LinearGradient>
      </View>

      <View style={{flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginBottom: 12, paddingHorizontal: 4}}>
         <TouchableOpacity onPress={() => setFeedFilter('active')} style={{paddingHorizontal: 16, paddingVertical: 8, backgroundColor: feedFilter === 'active' ? '#10b981' : '#f1f5f9', borderRadius: 20, marginRight: 8}}>
            <Text style={{fontSize: 12, fontWeight: '800', color: feedFilter === 'active' ? '#fff' : '#64748b', textTransform: 'uppercase'}}>Active</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setFeedFilter('participated')} style={{paddingHorizontal: 16, paddingVertical: 8, backgroundColor: feedFilter === 'participated' ? '#0f172a' : '#f1f5f9', borderRadius: 20}}>
            <Text style={{fontSize: 12, fontWeight: '800', color: feedFilter === 'participated' ? '#fff' : '#64748b', textTransform: 'uppercase'}}>Participated</Text>
         </TouchableOpacity>
      </View>

      {loading ? (
          <Text style={{textAlign: 'center', marginTop: 40, color: '#64748b'}}>Fetching live feed...</Text>
      ) : jobsToDisplay.length === 0 ? (
          <Text style={{textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 16}}>No Jobs Found</Text>
      ) : (
        jobsToDisplay.map((job) => {
          const statusInfo = getBiddingStatus(job);
          return (
          <View key={job.id} style={styles.ticketCard}>
            <View style={[styles.ticketHeaderBlock, { justifyContent: 'space-between' }]}>
              <View style={{ flexDirection: 'row', flexShrink: 1 }}>
                <View style={[styles.iconWrap, {backgroundColor: '#e0e7ff', marginRight: 12}]}>
                  <MaterialCommunityIcons name="gavel" size={24} color="#4f46e5" />
                </View>
                <View style={{flexShrink: 1, paddingRight: 8, justifyContent: 'center'}}>
                  <Text style={styles.ticketJobId}>JOB-2026-{String(job.id).padStart(3, '0')}</Text>
                  <Text style={styles.ticketTitleSmall} numberOfLines={1}>{job.title}</Text>
                </View>
              </View>
              <View style={[
                  styles.urgencyBadge, 
                  statusInfo.state === 'UPCOMING' && {backgroundColor: '#dbeafe'},
                  statusInfo.state === 'CLOSED' && {backgroundColor: '#f1f5f9'}
              ]}>
                <Text style={[
                    styles.urgencyText, 
                    statusInfo.state === 'UPCOMING' && {color: '#2563eb'},
                    statusInfo.state === 'CLOSED' && {color: '#64748b'}
                ]}>
                    {statusInfo.state === 'ACTIVE' 
                        ? `⏳ ${getTimeLeftStr(job.bidding_end_time)}`
                        : statusInfo.state === 'UPCOMING'
                        ? `🕒 ${statusInfo.label}`
                        : `🔒 Closed`
                    }
                </Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.contractDetailRow}>
               <Text style={styles.contractLabel}>Assigned Client</Text>
               <View style={{flexDirection: 'row', alignItems: 'center', flexShrink: 1, paddingLeft: 12}}>
                 <Text style={[styles.contractValue, {flexShrink: 1, textAlign: 'right'}]} numberOfLines={1}>{job.company_name}</Text>
                 {job.exporter_verified && <MaterialCommunityIcons name="check-decagram" size={14} color="#10b981" style={{marginLeft: 4, transform: [{translateY: -1}]}} />}
               </View>
            </View>
            
            <View style={styles.ticketSpecsRow}>
              <Text style={styles.ticketSpec}>{job.total_quantity ? job.total_quantity.toLocaleString() : '0'} {job.unit_of_measurement}</Text>
              <Text style={styles.ticketSpec}>{job.process_type}</Text>
              <Text style={styles.ticketSpec}>{job.urgency_level}</Text>
            </View>
            
            <View style={styles.ticketBudgetRow}>
              <Text style={styles.ticketBudgetLabel}>Target Budget</Text>
              <View style={{alignItems: 'flex-end'}}>
                 <Text style={styles.ticketBudgetAmount}>₹{parseFloat(job.budget || 0).toFixed(2)} / {job.unit_of_measurement}</Text>
                 {job.budget_negotiable && <Text style={{fontSize: 10, color: '#059669', fontWeight: 'bold', textTransform: 'uppercase', marginTop: 2}}>Negotiable</Text>}
              </View>
            </View>
            
            {job.my_bid && feedFilter === 'participated' ? (
              job.awarded_bid ? (
                 job.awarded_bid.id === job.my_bid.id ? (
                    <View style={[styles.primaryBtn, {backgroundColor: '#dcfce7', borderColor: '#86efac', borderWidth: 1}]}>
                        <MaterialCommunityIcons name="trophy-outline" size={18} color="#166534" style={{marginRight: 8}} />
                        <Text style={[styles.primaryBtnText, {color: '#166534'}]}>Contract Won - Check Contracts Tab</Text>
                    </View>
                 ) : (
                    <View style={[styles.primaryBtn, {backgroundColor: '#f1f5f9', borderColor: '#cbd5e1', borderWidth: 1}]}>
                        <MaterialCommunityIcons name="lock-outline" size={18} color="#64748b" style={{marginRight: 8}} />
                        <Text style={[styles.primaryBtnText, {color: '#64748b'}]}>Awarded to another workshop</Text>
                    </View>
                 )
              ) : (
                 <View style={[styles.primaryBtn, {backgroundColor: '#fef9c3', borderColor: '#fde047', borderWidth: 1}]}>
                     <MaterialCommunityIcons name="check-circle-outline" size={18} color="#ca8a04" style={{marginRight: 8}} />
                     <Text style={[styles.primaryBtnText, {color: '#ca8a04'}]}>Decision Pending</Text>
                 </View>
              )
            ) : job.my_bid ? (
              <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: '#f1f5f9', paddingTop: 16 }}>
                <View style={{flexDirection: 'row', gap: 10}}>
                  <TouchableOpacity 
                     style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac', borderRadius: 10, paddingVertical: 10, shadowColor: '#10b981', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }}
                     onPress={() => {
                       setBidForm({
                         quoted_price: job.my_bid.quoted_price,
                         delivery_date: job.my_bid.delivery_date,
                         capacity_allocation: job.my_bid.capacity_allocation,
                         remarks: job.my_bid.remarks || ''
                       });
                       setSelectedJob({ ...job, isViewing: true });
                     }}
                  >
                    <MaterialCommunityIcons name="check-circle" size={16} color="#15803d" style={{marginRight: 6}}/>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#166534' }}>View Application</Text>
                  </TouchableOpacity>
  
                  <TouchableOpacity 
                     style={{ paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff1f2', borderRadius: 10 }}
                     onPress={() => handleCancelBid(job.my_bid.id, job.id)}
                  >
                    <MaterialCommunityIcons name="close" size={18} color="#e11d48"/>
                  </TouchableOpacity>
                </View>
              </View>
            ) : statusInfo.state === 'ACTIVE' ? (
              <TouchableOpacity style={styles.primaryBtn} onPress={() => setSelectedJob(job)}>
                <Text style={styles.primaryBtnText}>Place Quick Bid</Text>
                <MaterialCommunityIcons name="gavel" size={18} color="#fff" />
              </TouchableOpacity>
            ) : statusInfo.state === 'UPCOMING' ? (
              <View style={[styles.primaryBtn, {backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1}]}>
                <Text style={[styles.primaryBtnText, {color: '#60a5fa'}]}>Upcoming ({statusInfo.label})</Text>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#60a5fa" />
              </View>
            ) : (
              <View style={[styles.primaryBtn, {backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1}]}>
                <Text style={[styles.primaryBtnText, {color: '#94a3b8'}]}>Bidding Closed</Text>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#94a3b8" />
              </View>
            )}
          </View>
        );
        })
      )}

      {/* Bid Submission Modal */}
      <Modal
        visible={!!selectedJob}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSelectedJob(null)}
      >
        <View style={{flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end'}}>
          <View style={{backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 20, maxHeight: '90%'}}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <Text style={{fontSize: 20, fontWeight: '800', color: '#0f172a'}}>Submit Official Bid</Text>
              <TouchableOpacity onPress={() => setSelectedJob(null)} style={{padding: 4}}>
                <MaterialCommunityIcons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{marginBottom: 20}}>
              {selectedJob && (
                <View style={{backgroundColor: '#eff6ff', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#dbeafe'}}>
                  <Text style={{fontSize: 12, fontWeight: '700', color: '#1e3a8a', marginBottom: 10, textTransform: 'uppercase'}}>Order Context</Text>
                  <Text style={{fontSize: 15, fontWeight: 'bold', color: '#1e3a8a', marginBottom: 4}}>{selectedJob.title}</Text>
                  <Text style={{fontSize: 13, color: '#3b82f6', marginBottom: 4}}>{selectedJob.total_quantity} {selectedJob.unit_of_measurement} • {selectedJob.process_type}</Text>
                  <Text style={{fontSize: 13, color: '#1e40af', fontWeight: '600'}}>Target: ₹{selectedJob.budget}</Text>
                </View>
              )}

              <View style={{marginBottom: 16}}>
                <Text style={{fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 4}}>Your Quoted Price *</Text>
                <TextInput
                  style={[{borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#f8fafc', color: '#0f172a'}, selectedJob?.isViewing && {backgroundColor: '#e2e8f0', color: '#64748b'}]}
                  placeholder="e.g. 14.50"
                  keyboardType="decimal-pad"
                  value={bidForm.quoted_price}
                  editable={!selectedJob?.isViewing}
                  onChangeText={t => setBidForm({...bidForm, quoted_price: t})}
                />
              </View>

              <View style={{marginBottom: 16}}>
                <Text style={{fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 4}}>Ready Date *</Text>
                <TouchableOpacity 
                   style={[{borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, backgroundColor: '#f8fafc', justifyContent: 'center'}, selectedJob?.isViewing && {backgroundColor: '#e2e8f0'}]}
                   disabled={selectedJob?.isViewing}
                   onPress={() => setShowDatePicker(true)}
                >
                   <Text style={{fontSize: 16, color: bidForm.delivery_date ? '#0f172a' : '#94a3b8'}}>{bidForm.delivery_date || "Select Date"}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                   <DateTimePicker
                      value={bidForm.delivery_date ? new Date(bidForm.delivery_date) : new Date()}
                      mode="date"
                      display="default"
                      minimumDate={new Date()}
                      onChange={(event, selectedDate) => {
                         setShowDatePicker(false);
                         if (selectedDate) setBidForm({...bidForm, delivery_date: selectedDate.toISOString().split('T')[0]});
                      }}
                   />
                )}
              </View>

              <View style={{marginBottom: 16}}>
                <Text style={{fontSize: 14, fontWeight: '700', color: '#334155', marginBottom: 4}}>Remarks (Optional)</Text>
                <TextInput
                  style={[{borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#f8fafc', color: '#0f172a'}, selectedJob?.isViewing && {backgroundColor: '#e2e8f0', color: '#64748b'}]}
                  placeholder="Technical notes..."
                  multiline={true}
                  numberOfLines={3}
                  value={bidForm.remarks}
                  editable={!selectedJob?.isViewing}
                  onChangeText={t => setBidForm({...bidForm, remarks: t})}
                />
              </View>
            </ScrollView>

            <View style={{flexDirection: 'row', gap: 12}}>
               <TouchableOpacity 
                 style={[styles.outlineBtn, {flex: 1}]} 
                 onPress={() => {
                     setSelectedJob(null);
                     setBidForm({ quoted_price: '', delivery_date: '', remarks: '' });
                   }}
                 disabled={submittingBid}
               >
                 <Text style={styles.outlineBtnText}>{selectedJob?.isViewing ? 'Close' : 'Cancel'}</Text>
               </TouchableOpacity>

               {!selectedJob?.isViewing && (
                 <TouchableOpacity 
                   style={[styles.primaryBtn, submittingBid && {backgroundColor: '#94a3b8'}, {flex: 2}]} 
                   onPress={handlePlaceBid}
                   disabled={submittingBid}
                 >
                   {submittingBid ? (
                     <ActivityIndicator color="#fff" style={{marginRight: 8}} />
                   ) : (
                     <MaterialCommunityIcons name="gavel" size={18} color="#fff" style={{marginRight: 8}} />
                   )}
                   <Text style={styles.primaryBtnText}>Submit Bid</Text>
                 </TouchableOpacity>
               )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ------------------------------------------------------------------
// Screen 2: Contracts
// ------------------------------------------------------------------
const ContractsTab = ({ jobs = [], setJobs }) => {
  const [filterType, setFilterType] = useState('active'); // 'active', 'finished'
  const [activeCameraJob, setActiveCameraJob] = useState(null);
  const [capturingJob, setCapturingJob] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [processingState, setProcessingState] = useState(null);
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const cameraRef = useRef(null);

  const downloadContractPDF = async (job) => {
    const htmlContent = `
      <html>
        <head>
          <style>
             body { font-family: 'Times New Roman', serif; padding: 40px; color: #111111; }
             .header { text-align: left; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
             .ref-box { float: right; border: 1px solid #cccccc; padding: 5px 15px; font-size: 12px; font-weight: bold; }
             .divider { border-bottom: 2px solid #111111; margin: 20px 0; }
             .boxes { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 30px; }
             .box { border: 1px solid #cccccc; background: #f9f9f9; padding: 15px; width: 45%; }
             .box-title { color: #555555; font-size: 12px; margin-bottom: 10px; font-weight: bold; }
             .box-val { font-size: 14px; font-weight: bold; }
             table { width: 100%; border-collapse: collapse; margin: 20px 0; }
             th, td { border: 1px solid #cccccc; padding: 10px;text-align: left; }
             th { background: #222222; color: #ffffff; }
             .footer { margin-top: 50px; display: flex; justify-content: space-between; padding: 20px; border: 1px solid #cccccc; background: #f9f9f9; height: 150px; }
          </style>
        </head>
        <body>
            <div class="ref-box">REF: ZEDLY/JW/2026/JOB-00${job.id}</div>
            <div class="header">JOB WORK CONTRACT AGREEMENT</div>
            <div class="divider"></div>
            <div class="boxes">
               <div class="box">
                  <div class="box-title">PRINCIPAL (EXPORT HOUSE)</div>
                  <div class="box-val">${job.company_name || 'Verified Export House'}</div>
               </div>
               <div class="box">
                  <div class="box-title">SERVICE PROVIDER (SUBCONTRACTOR)</div>
                  <div class="box-val">${job.awarded_bid?.subcontractor_name || 'Subcontractor'}</div>
                  <div style="margin-top:20px;font-size:12px;color:#555;">ID: ${job.awarded_bid?.subcontractor_id_type}</div>
               </div>
            </div>
            
            <h3 style="margin-top: 20px;">SECTION 1: SCOPE OF WORK</h3>
            <table>
               <tr><th>Description</th><th>Quantity</th><th>Agreed Rate</th><th>Total Amount</th></tr>
               <tr>
                 <td>${job.title}</td>
                 <td>${job.total_quantity} ${job.unit_of_measurement}</td>
                 <td>Rs. ${job.awarded_bid?.quoted_price}</td>
                 <td>Rs. ${(job.total_quantity * (job.awarded_bid? job.awarded_bid.quoted_price : 0)).toFixed(2)}</td>
               </tr>
            </table>

            <h3>SECTION 2: COMPLIANCE & TERMS</h3>
            <ol style="line-height: 1.6; font-size: 14px;">
               <li><b>Return Timeline:</b> Goods must be processed and physically returned within 365 days.</li>
               <li><b>Quality Metrics:</b> Finished textiles must stringently adhere to technical metrics.</li>
               <li><b>Liability Clause:</b> Service Provider assumes absolute logistical liability in custody.</li>
            </ol>

            <div class="footer">
              <div>
                <b>For ${job.company_name}</b><br>
                ${job.export_house_signature ? `<img src="${job.export_house_signature}" style="height: 60px; max-width: 150px; margin-top: 5px; margin-bottom: 5px; object-fit: contain;" />` : '<br><br><br><br>'}
                <hr>
                <span style="font-size: 10px; color: #555;">(Authorized Signatory & Stamp)</span>
              </div>
              <div>
                <b>For ${job.awarded_bid?.subcontractor_name}</b><br><br><br><br>
                <hr>
                <span style="font-size: 10px; color: #555;">(Authorized Signatory)</span>
              </div>
            </div>
        </body>
      </html>
    `;
    try {
      if (Platform.OS === 'web') {
        const { uri } = await Print.printToFileAsync({ html: htmlContent });
        const link = document.createElement('a');
        link.href = uri;
        link.download = `Contract_JOB_${job.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        await Print.printAsync({ html: htmlContent });
      }
    } catch (err) {
      Alert.alert("Error", "Failed to generate agreement PDF.");
    }
  };
  
  const deleteReturnChallan = async (job) => {
    Alert.alert("Reset Return Challan", "Are you sure you want to delete and reset the generated return challan?", [
       {text: "Cancel", style: "cancel"},
       {text: "Yes, Reset", style: "destructive", onPress: async () => {
          try {
             const token = await AsyncStorage.getItem('token');
             await axios.put(`${API_URL}/api/challans/${job.gate_in_challan.id}/`, { return_challan_generated: false }, { headers: { Authorization: `Bearer ${token}` } });
             setJobs(prev => prev.map(j => j.id === job.id ? {...j, gate_in_challan: {...j.gate_in_challan, return_challan_generated: false}} : j));
          } catch(err) { Alert.alert("Error", "Failed to reset."); }
       }}
    ]);
  };

  const generateReturnChallanPDF = async (job, skipApi = false) => {
    const runGeneration = async () => {
      try {
        const c = job.gate_in_challan;
        if (!c) return Alert.alert("Error", "Original Challan missing");
        const materialsRows = (c.materials || []).map((m, i) => `
                 <tr>
                   <td style="text-align: center; border: 1px solid #ccc; padding: 8px;">${i+1}</td>
                   <td style="border: 1px solid #ccc; padding: 8px;">${m.description || '-'}</td>
                   <td style="text-align: center; border: 1px solid #ccc; padding: 8px;">${m.hsn_code || '-'}</td>
                   <td style="text-align: center; border: 1px solid #ccc; padding: 8px;">${m.quantity || '0'} ${m.unit || 'Units'}</td>
                   <td style="text-align: right; border: 1px solid #ccc; padding: 8px;">Rs. ${ ((parseFloat(m.quantity)||0) * (parseFloat(m.taxable_value_per_unit)||0)).toFixed(2) }</td>
                 </tr>
              `).join('');
              const pages = ['ORIGINAL FOR CONSIGNEE', 'DUPLICATE FOR TRANSPORTER', 'TRIPLICATE FOR CONSIGNOR']    
              const htmlContent = `
              <html>
                <head>
                  <style>
                     .page { padding: 40px; page-break-after: always; }
                  </style>
                </head>
                <body style="font-family: 'Times New Roman', Times, serif; font-size: 14px; margin: 0; padding: 0; color: #111;">
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
                       <div style="width: 48%; background: #f9f9f9; border: 1px solid #ccc; padding: 15px;">
                         <div style="font-size: 12px; font-weight: bold; color: #555; margin-bottom: 10px;">CONSIGNOR (SUBCONTRACTOR)</div>
                         <div style="font-size: 16px; font-weight: bold;">${c.subcontractor_name || 'Subcontractor Name'}</div>
                         <div style="font-size: 12px; color: #555; margin-top: 5px;">${c.destination_address || '-'}</div>
                         <div style="margin-top: 10px; font-weight: bold;">${c.subcontractor_id_type || 'ID'}: ${c.subcontractor_id_number || 'N/A'}</div>
                       </div>
                       <div style="width: 48%; background: #f9f9f9; border: 1px solid #ccc; padding: 15px;">
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
                <div style="width: 45%; background: #f9f9f9; border: 1px solid #ccc; padding: 20px;">
                   <div style="font-weight: bold;">For ${c.subcontractor_name || 'Consignor'}</div>
                   <div style="margin-top: 80px; border-top: 1px solid #222; padding-top: 10px; font-size: 12px; font-style: italic; color: #555;">(Authorized Signatory & Stamp)</div>
                </div>
             </div>
           </div>
           `).join('')}
        </body>
      </html>`;
      try {
        if (!skipApi) {
           const token = await AsyncStorage.getItem('token');
           await axios.put(`${API_URL}/api/challans/${job.gate_in_challan.id}/`, 
              { return_challan_generated: true }, 
              { headers: { Authorization: `Bearer ${token}` } }
           );
           setJobs(prev => prev.map(j => j.id === job.id ? {...j, gate_in_challan: {...j.gate_in_challan, return_challan_generated: true}} : j));
        }
        await Print.printAsync({ html: htmlContent });
      } catch(err) {
         Alert.alert("Error", "Failed to generate return challan PDF.");
      }
      } catch (outerErr) {
        console.error("Error generating HTML", outerErr);
      }
    };
    
    if (skipApi) {
      runGeneration();
    } else {
      Alert.alert(
        "Generate Return Challan",
        `If generated, materials should be dispatched within today (${new Date().toLocaleDateString()}). Are you sure?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Yes, Generate", onPress: runGeneration }
        ]
      );
    }
  };

  const handleMarkFinished = async (jobId) => {
    Alert.alert(
      "Confirm Submission",
      "Are you sure you want to mark this job as finished? This will log the final timestamp and notify the export house.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: async () => {
             setProcessingState(jobId);
              try {
                 const token = await AsyncStorage.getItem('token');
                 const formData = new FormData();
                 if (activeCameraJob?.photoUri) {
                    formData.append('completion_proof', {
                       uri: activeCameraJob.photoUri,
                       name: `proof_${Date.now()}.jpg`,
                       type: 'image/jpeg'
                    });
                 }
                 await axios.post(`${API_URL}/api/jobs/${jobId}/finish/`, formData, { 
                    headers: { 
                       Authorization: `Bearer ${token}`,
                       'Content-Type': 'multipart/form-data'
                    } 
                 });
                 setJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: 'Closed', completed_at: new Date().toISOString() } : j));
                 Alert.alert("Success", "Job marked as finished.");
             } catch(err) {
                Alert.alert("Error", "Failed to mark job as finished.");
             } finally {
                setProcessingState(null);
                setActiveCameraJob(null);
             }
          }
        }
      ]
    );
  };
  const wonJobs = jobs.filter(j => j.my_bid && j.awarded_bid && j.my_bid.id === j.awarded_bid.id && !j.has_challan);
  const activeProduction = jobs.filter(j => j.my_bid && j.awarded_bid && j.my_bid.id === j.awarded_bid.id && j.has_challan && j.status !== 'Closed' && j.gate_in_challan);
  const finishedJobs = jobs.filter(j => j.my_bid && j.awarded_bid && j.my_bid.id === j.awarded_bid.id && j.status === 'Closed' && j.gate_in_challan);
  
  const displayJobs = filterType === 'active' ? activeProduction : finishedJobs;
  
  return (
  <View style={styles.tabContainer}>
    {wonJobs.length > 0 && (
      <>
        <View style={styles.sectionHeaderTop}>
          <Text style={styles.sectionTitle}>New Contracts (Won)</Text>
        </View>
        <View style={{marginBottom: 20}}>
          {wonJobs.map(job => (
            <View key={job.id} style={styles.ticketCard}>
              <View style={styles.ticketHeaderBlock}>
                <View style={[styles.iconWrap, {backgroundColor: '#dcfce7'}]}><MaterialCommunityIcons name="trophy" size={24} color="#166534" /></View>
                <View style={{flexShrink: 1, paddingRight: 4}}>
                  <Text style={styles.ticketJobId}>JOB-2026-00{job.id}</Text>
                  <Text style={styles.ticketTitleSmall} numberOfLines={1}>{job.title}</Text>
                </View>
              </View>
              
              <View style={styles.divider} />
              
              <View style={styles.contractDetailRow}>
                 <Text style={styles.contractLabel}>Export House</Text>
                 <Text style={[styles.contractValue, { flexShrink: 1, paddingLeft: 12, textAlign: 'right' }]}>{job.company_name}</Text>
              </View>
              <View style={styles.contractDetailRow}>
                 <Text style={styles.contractLabel}>Locked Rate</Text>
                 <Text style={styles.contractValue}>₹{job.awarded_bid.quoted_price} / {job.unit_of_measurement}</Text>
              </View>
              <View style={[styles.contractDetailRow, { marginBottom: 12 }]}>
                 <Text style={styles.contractLabel}>Volume</Text>
                 <Text style={styles.contractValue}>{job.total_quantity} {job.unit_of_measurement}</Text>
              </View>

              <TouchableOpacity 
                style={{ backgroundColor: '#10b981', padding: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}
                onPress={() => downloadContractPDF(job)}
              >
                 <MaterialCommunityIcons name="file-pdf-box" size={20} color="#fff" style={{ marginRight: 8 }} />
                 <Text style={{ fontSize: 14, color: '#fff', fontWeight: 'bold' }}>Download Contract PDF</Text>
              </TouchableOpacity>

              <View style={{ backgroundColor: '#fff7ed', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#fed7aa', flexDirection: 'row', alignItems: 'center' }}>
                 <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#ea580c" style={{ marginRight: 8 }} />
                 <Text style={{ fontSize: 13, color: '#f97316', fontWeight: 'bold', flex: 1 }}>Waiting for Export House to dispatch Challan</Text>
              </View>
            </View>
          ))}
        </View>
      </>
    )}

    <View style={[styles.sectionHeaderTop, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
      <Text style={styles.sectionTitle}>Production Jobs</Text>
      <View style={{flexDirection: 'row', backgroundColor: '#f1f5f9', borderRadius: 20, p: 2}}>
         <TouchableOpacity onPress={() => setFilterType('active')} style={{paddingHorizontal: 16, paddingVertical: 6, backgroundColor: filterType === 'active' ? '#10b981' : 'transparent', borderRadius: 20}}>
            <Text style={{fontSize: 12, fontWeight: '800', color: filterType === 'active' ? '#fff' : '#64748b', textTransform: 'uppercase'}}>Active</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setFilterType('finished')} style={{paddingHorizontal: 16, paddingVertical: 6, backgroundColor: filterType === 'finished' ? '#0f172a' : 'transparent', borderRadius: 20}}>
            <Text style={{fontSize: 12, fontWeight: '800', color: filterType === 'finished' ? '#fff' : '#64748b', textTransform: 'uppercase'}}>Finished</Text>
         </TouchableOpacity>
      </View>
    </View>

    <LinearGradient colors={['#10b981', '#064e3b']} style={styles.bannerInfo}>
      <Text style={[styles.bannerText, {color: 'rgba(255,255,255,0.85)'}]}>In Production: <Text style={{fontWeight: '900', color: '#ffffff'}}>{activeProduction.length}</Text>  |  Completed: <Text style={{fontWeight: '900', color: '#ffffff'}}>{finishedJobs.length}</Text></Text>
    </LinearGradient>

    {displayJobs.length === 0 ? (
      <Text style={{textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 16}}>No {filterType} jobs found</Text>
    ) : (
      displayJobs.map(job => (
        <View key={job.id} style={styles.ticketCard}>
          <View style={[styles.ticketHeaderBlock, {justifyContent: 'space-between'}]}>
            <View style={{flexDirection: 'row', flexShrink: 1}}>
              <View style={[styles.iconWrap, filterType === 'finished' && {backgroundColor: '#dcfce7'}]}>
                <MaterialCommunityIcons name={filterType === 'finished' ? "check-decagram" : "factory"} size={24} color={filterType === 'finished' ? "#166534" : "#059669"} />
              </View>
              <View style={{flexShrink: 1}}>
                <Text style={styles.ticketJobId} numberOfLines={1} adjustsFontSizeToFit>JOB-2026-{String(job.id).padStart(3, '0')}</Text>
                <Text style={styles.ticketTitleSmall} numberOfLines={1}>{job.title}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => {
                Alert.alert("Options", "Choose an action", [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Download Contract', onPress: () => downloadContractPDF(job) }
                ]);
            }} style={{padding: 4}}>
              <MaterialCommunityIcons name="dots-vertical" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.contractDetailRow}>
             <Text style={styles.contractLabel}>Assigned Client</Text>
             <Text style={[styles.contractValue, {flexShrink: 1, paddingLeft: 12, textAlign: 'right'}]} numberOfLines={1}>{job.company_name}</Text>
          </View>
          <View style={styles.contractDetailRow}>
             <Text style={styles.contractLabel}>Rate</Text>
             <Text style={styles.contractValue}>₹{job.awarded_bid.quoted_price} / {job.unit_of_measurement}</Text>
          </View>
          
          {filterType === 'finished' ? (
             <View style={[styles.contractDetailRow, { marginBottom: 12 }]}>
                <Text style={styles.contractLabel}>Completion Marked</Text>
                <Text style={[styles.contractValue, {color: '#059669'}]}>{new Date(job.completed_at || job.created_at).toLocaleString()}</Text>
             </View>
          ) : (
             <View style={[styles.contractDetailRow, { marginBottom: 12 }]}>
                <Text style={styles.contractLabel}>Due Date</Text>
                <Text style={styles.contractValue}>{job.expected_delivery_date}</Text>
             </View>
          )}

          {filterType === 'finished' ? (
              job.gate_in_challan?.return_challan_generated ? (
                 <View style={{flexDirection: 'row', gap: 10}}>
                   <TouchableOpacity onPress={() => generateReturnChallanPDF(job, true)} style={[styles.primaryBtn, {flex: 1}]}>
                      <MaterialCommunityIcons name="cloud-download-outline" size={18} color="#fff" style={{marginRight: 8}} />
                      <Text style={styles.primaryBtnText}>Download Challan</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => deleteReturnChallan(job)} style={{backgroundColor: '#fff1f2', width: 48, justifyContent: 'center', alignItems: 'center', borderRadius: 12}}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#e11d48"/>
                   </TouchableOpacity>
                 </View>
              ) : (
                <TouchableOpacity onPress={() => generateReturnChallanPDF(job)} style={styles.primaryBtn}>
                   <MaterialCommunityIcons name="file-pdf-box" size={18} color="#fff" style={{marginRight: 8}} />
                   <Text style={styles.primaryBtnText}>Generate Return Challan</Text>
                </TouchableOpacity>
              )
          ) : (
            <>
              {activeCameraJob?.id === job.id ? (
                <View style={{alignItems: 'center', backgroundColor: '#f1f5f9', padding: 20, borderRadius: 12}}>
                   <View style={{position: 'relative', marginBottom: 10}}>
                     <TouchableOpacity onPress={() => setPreviewImageModal(activeCameraJob.photoUri)}>
                        <Image source={{uri: activeCameraJob.photoUri}} style={{width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderColor: '#10b981'}} />
                     </TouchableOpacity>
                     <TouchableOpacity 
                        onPress={() => setActiveCameraJob(null)} 
                        style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#fff', borderRadius: 12, padding: 2, elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 2}, shadowOpacity: 0.3, shadowRadius: 3 }}
                     >
                        <MaterialCommunityIcons name="close-circle" size={24} color="#e11d48" />
                     </TouchableOpacity>
                   </View>
                   <Text style={{fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 16}}>Photo Preview Attached & Verified</Text>
                   
                   <TouchableOpacity 
                      style={[styles.primaryBtn, {width: '100%', marginBottom: 8}, processingState === job.id && {opacity: 0.6}]}
                      onPress={() => handleMarkFinished(job.id)}
                      disabled={processingState === job.id}
                   >
                     {processingState === job.id ? <ActivityIndicator color="#fff" style={{marginRight: 8}} /> : <MaterialCommunityIcons name="check-all" size={18} color="#fff" style={{marginRight: 8}} />}
                     <Text style={styles.primaryBtnText}>Confirm Submit Finished</Text>
                   </TouchableOpacity>
                   <TouchableOpacity style={styles.outlineBtn} onPress={() => setActiveCameraJob(null)} disabled={processingState === job.id}>
                     <Text style={styles.outlineBtnText}>Cancel</Text>
                   </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity 
                   style={styles.outlineBtn}
                   onPress={() => {
                     if (!permission?.granted) {
                       requestPermission();
                       return;
                     }
                     setCapturingJob(job);
                   }}
                >
                   <MaterialCommunityIcons name="camera" size={18} color="#334155" style={{marginRight: 8}} />
                   <Text style={styles.outlineBtnText}>Mark as Completed</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      ))
    )}

    {/* Camera Modal */}
    <Modal visible={!!capturingJob} animationType="slide" transparent={false} onRequestClose={() => setCapturingJob(null)}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <SafeAreaView style={{ flex: 1 }}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, zIndex: 10 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Take Photo of Completed Items</Text>
              <TouchableOpacity onPress={() => setCapturingJob(null)}>
                <MaterialCommunityIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>
           </View>
           
           <View style={{ flex: 1, overflow: 'hidden', borderRadius: 20, margin: 20 }}>
             {permission?.granted && capturingJob && (
               <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  ref={cameraRef}
               />
             )}
           </View>
           <View style={{ paddingBottom: 40, alignItems: 'center' }}>
             <TouchableOpacity 
                onPress={async () => {
                   if (cameraRef.current) {
                      try {
                        const photo = await cameraRef.current.takePictureAsync({quality: 0.5});
                        setActiveCameraJob({ ...capturingJob, photoUri: photo.uri });
                      } catch (e) {
                         console.log(e);
                         setActiveCameraJob({ ...capturingJob, photoUri: 'https://picsum.photos/400' });
                      }
                      setCapturingJob(null);
                   }
                }}
                style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' }}
             >
                <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#000' }} />
             </TouchableOpacity>
           </View>
        </SafeAreaView>
      </View>
    </Modal>

    {/* Full Screen Image Modal */}
    <Modal visible={!!previewImageModal} transparent={true} onRequestClose={() => setPreviewImageModal(null)} animationType="fade">
      <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center'}}>
        <SafeAreaView style={{flex: 1, width: '100%'}}>
          <TouchableOpacity onPress={() => setPreviewImageModal(null)} style={{position: 'absolute', top: 40, right: 20, zIndex: 10, padding: 10}}>
             <MaterialCommunityIcons name="close" size={32} color="#fff" />
          </TouchableOpacity>
          <Image source={{uri: previewImageModal}} style={{width: '90%', height: '80%', alignSelf: 'center', resizeMode: 'contain', marginTop: 80}} />
        </SafeAreaView>
      </View>
    </Modal>
  </View>
)};

// ------------------------------------------------------------------
// Challan PDF Utility
// ------------------------------------------------------------------
const generateRule55ChallanPDF = async (challan) => {
  try {
    const materialsRows = (challan.materials || []).map((m, i) => `
      <tr>
        <td style="text-align: center; border: 1px solid #ccc; padding: 8px;">${i+1}</td>
        <td style="border: 1px solid #ccc; padding: 8px;">${m.description || '-'}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 8px;">${m.hsn_code || '-'}</td>
        <td style="text-align: center; border: 1px solid #ccc; padding: 8px;">${m.quantity || '0'} ${m.unit || 'Units'}</td>
        <td style="text-align: right; border: 1px solid #ccc; padding: 8px;">Rs. ${ ((parseFloat(m.quantity)||0) * (parseFloat(m.taxable_value_per_unit)||0)).toFixed(2) }</td>
      </tr>
    `).join('');

    const html = `
    <html>
      <body style="font-family: 'Times New Roman', Times, serif; font-size: 14px; padding: 40px; color: #111;">
        <div style="text-align: right; font-size: 14px; font-weight: bold; font-style: italic; color: #333;">ORIGINAL FOR CONSIGNEE</div>
        <div style="text-align: center; font-size: 24px; font-weight: bold; margin-top: 20px;">DELIVERY CHALLAN</div>
        <div style="text-align: center; font-size: 12px; color: #555;">(Issued under Rule 55 of CGST Rules, 2017)</div>
        
        <div style="margin-top: 40px; display: flex; justify-content: space-between; font-weight: bold;">
          <div>Challan No: ${challan.challan_number || 'N/A'}</div>
          <div>Date: ${new Date(challan.created_at || Date.now()).toLocaleDateString()}</div>
        </div>
        <hr style="border: 1px solid #111; margin: 15px 0 30px 0;" />

        <div style="display: flex; justify-content: space-between; margin-bottom: 40px;">
          <div style="width: 48%; background: #f9f9f9; border: 1px solid #ccc; padding: 15px;">
            <div style="font-size: 12px; font-weight: bold; color: #555; margin-bottom: 10px;">CONSIGNOR (EXPORT HOUSE)</div>
            <div style="font-size: 16px; font-weight: bold;">${challan.export_house_name || 'Verified Export House'}</div>
          </div>
          <div style="width: 48%; background: #f9f9f9; border: 1px solid #ccc; padding: 15px;">
             <div style="font-size: 12px; font-weight: bold; color: #555; margin-bottom: 10px;">CONSIGNEE (SUBCONTRACTOR)</div>
             <div style="font-size: 16px; font-weight: bold;">${challan.subcontractor_name || 'Subcontractor Name'}</div>
             <div style="font-size: 12px; color: #555; margin-top: 5px;">${challan.destination_address || '-'}</div>
             <div style="margin-top: 10px; font-weight: bold;">${challan.subcontractor_id_type || 'ID'}: ${challan.subcontractor_id_number || 'N/A'}</div>
          </div>
        </div>

        <div style="margin-bottom: 40px;">
           <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">TRANSIT LOGISTICS</div>
           <hr style="border: 0.5px solid #ccc; margin-bottom: 15px;" />
           <table style="width: 100%; border-collapse: collapse;">
             <tr>
               <td style="padding-bottom: 15px; width: 50%;">Mode of Transport: <b>${challan.mode_of_transport || '-'}</b></td>
               <td style="padding-bottom: 15px; width: 50%;">Vehicle Number: <b>${challan.vehicle_number || '-'}</b></td>
             </tr>
             <tr>
               <td>Contact Person: <b>${challan.subcontractor_contact_person || '-'}</b></td>
               <td>Contact Number: <b>${challan.subcontractor_contact_number || '-'}</b></td>
             </tr>
           </table>
        </div>

        <div style="margin-bottom: 60px;">
           <div style="font-size: 16px; font-weight: bold; margin-bottom: 10px;">MATERIAL DETAILS</div>
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
             <tbody>
               ${materialsRows}
             </tbody>
           </table>
        </div>

        <div style="background: #f9f9f9; border: 1px solid #ccc; padding: 20px; display: flex; justify-content: space-between; margin-top: 40px;">
           <div style="width: 45%;">
              <div style="font-weight: bold;">For ${challan.export_house_name || 'Consignor'}</div>
              ${challan.export_house_signature ? `<img src="${challan.export_house_signature}" style="height: 60px; max-width: 150px; margin-top: 10px; margin-bottom: -10px; object-fit: contain;" />` : '<div style="margin-top: 80px;"></div>'}
              <div style="border-top: 1px solid #222; padding-top: 10px; font-size: 12px; font-style: italic; color: #555;">(Authorized Signatory & Stamp)</div>
           </div>
           <div style="width: 45%;">
              <div style="font-weight: bold;">For ${challan.subcontractor_name || 'Consignee'}</div>
              <div style="margin-top: 60px; border-top: 1px solid #222; padding-top: 10px; font-size: 12px; font-style: italic; color: #555;">(Receiver's Signature / Stamp)</div>
           </div>
        </div>
      </body>
    </html>
    `;

    if (Platform.OS === 'web') {
      const { uri } = await Print.printToFileAsync({ html });
      const link = document.createElement('a');
      link.href = uri;
      link.download = `Challan_${challan.challan_number || 'Document'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      await Print.printAsync({ html });
    }
  } catch (err) {
    Alert.alert("Error", "Failed to generate Challan PDF.");
  }
};

// ------------------------------------------------------------------
// Screen 3: Challans
// ------------------------------------------------------------------
const ChallansTab = ({ challans = [], onRefresh }) => {
  const { user } = useAuth();
  const [scanningChallan, setScanningChallan] = useState(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [isVerifying, setIsVerifying] = useState(false);

  const pendingGateIn = challans.filter(c => c.status === 'Draft' || c.status === 'In Transit').length;
  const verified = challans.filter(c => c.status !== 'Draft' && c.status !== 'In Transit').length;

  const handleBarcodeScanned = async ({ type, data }) => {
    if (isVerifying || !scanningChallan) return;
    setIsVerifying(true);

    try {
      if (!data.startsWith('ZEDLY:CHALLAN:')) {
         Alert.alert("Invalid QR", "This QR code is not recognized by Zedly.");
         setScanningChallan(null);
         return;
      }
      
      const parts = data.split(':');
      const scannedChallanId = parseInt(parts[2], 10);
      const scannedSubId = parseInt(parts[4], 10);

      
      if (scannedSubId !== user.id) {
         Alert.alert("Unauthorized", "This challan belongs to another subcontractor. You cannot gate-in this parcel.");
         setScanningChallan(null);
         return;
      }

      if (scannedChallanId !== scanningChallan.id) {
         Alert.alert("Challan Mismatch", "You scanned a QR code for a different contract/job than the one selected.");
         setScanningChallan(null);
         return;
      }

      // Hit Backend
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${API_URL}/api/challans/${scanningChallan.id}/`, 
        { status: 'Gate-In Verified' },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      Alert.alert("Success", "Gate-In entry verified successfully! Timestamp recorded.");
      if (onRefresh) onRefresh();
    } catch (err) {
      Alert.alert("Error", "Failed to update challan status.");
    } finally {
      setIsVerifying(false);
      setScanningChallan(null);
    }
  };

  const handleScanPress = (challan) => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    setScanningChallan(challan);
  };

  return (
  <View style={styles.tabContainer}>
    <View style={styles.sectionHeaderTop}>
      <Text style={styles.sectionTitle}>Rule 55 Inward Challans</Text>
    </View>

    <LinearGradient colors={['#10b981', '#064e3b']} style={styles.bannerInfo}>
      <Text style={[styles.bannerText, {color: 'rgba(255,255,255,0.85)'}]}>Pending Gate-In: <Text style={{fontWeight: '900', color: '#fde047'}}>{pendingGateIn}</Text>  |  Verified: <Text style={{fontWeight: '900', color: '#ffffff'}}>{verified}</Text></Text>
    </LinearGradient>

    {challans.filter(c => c.status !== 'Draft').length === 0 ? (
      <Text style={{textAlign: 'center', marginTop: 40, color: '#94a3b8', fontSize: 16}}>No Challans Found</Text>
    ) : (
      challans.filter(c => c.status !== 'Draft').map(challan => {
        const isPending = challan.status === 'In Transit';
        
        return (
          <View key={challan.id} style={[styles.ticketCard, isPending && { borderColor: '#fde68a', borderWidth: 1 }]}>
            <View style={[styles.ticketHeaderBlock, {justifyContent: 'space-between', marginBottom: 16}]}>
              <View style={{flexDirection: 'row', flexShrink: 1}}>
                <View style={[styles.iconWrap, isPending ? {backgroundColor: '#fef3c7'} : {backgroundColor: '#d1fae5'}]}>
                  <MaterialCommunityIcons name={isPending ? "truck-fast-outline" : "check-decagram"} size={24} color={isPending ? "#d97706" : "#059669"} />
                </View>
                <View style={{flexShrink: 1}}>
                  <Text style={styles.ticketJobId} numberOfLines={1}>{challan.job_name || 'Processed Goods'}</Text>
                  <Text style={styles.ticketTitleSmall}>JOB-2026-{String(challan.job).padStart(3, '0')}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => {
                  Alert.alert(
                    "Options", 
                    "Choose an action", 
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Download Challan PDF", onPress: () => generateRule55ChallanPDF(challan) }
                    ]
                  );
                }} style={{padding: 4}}>
                <MaterialCommunityIcons name="dots-vertical" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.contractDetailRow}>
               <Text style={styles.contractLabel}>Challan Ref</Text>
               <Text style={[styles.contractValue, {flexShrink: 1, paddingLeft: 12, textAlign: 'right'}]} adjustsFontSizeToFit>{challan.challan_number}</Text>
            </View>

            <View style={styles.contractDetailRow}>
               <Text style={styles.contractLabel}>Export House</Text>
               <View style={{flexShrink: 1, paddingLeft: 12, alignItems: 'flex-end'}}>
                 <Text style={[styles.contractValue, {textAlign: 'right'}]}>{challan.export_house_name || 'Export House'}</Text>
                 <TouchableOpacity onPress={() => Alert.alert("Export House Verified", `GSTIN: ${challan.export_house_gstin || 'Verified'}`)}>
                    <Text style={{color: '#059669', fontSize: 11, fontWeight: 'bold', marginTop: 3}}>✓ Verified Profile</Text>
                 </TouchableOpacity>
               </View>
            </View>

            <View style={[styles.contractDetailRow, { marginBottom: 16 }]}>
               <Text style={styles.contractLabel}>Status</Text>
               <Text style={[styles.contractValue, isPending ? {color: '#d97706'} : {color: '#059669'}]}>
                 {isPending ? '🟡 In Transit' : '🟢 Verified & Accepted'}
               </Text>
            </View>
            
            <TouchableOpacity 
               style={isPending ? styles.primaryBtn : styles.outlineBtn}
               onPress={() => isPending ? handleScanPress(challan) : generateRule55ChallanPDF(challan)}
            >
              <MaterialCommunityIcons name={isPending ? "qrcode-scan" : "cloud-download-outline"} size={18} color={isPending ? "#fff" : "#0f172a"} style={{marginRight: 8}}/>
              <Text style={isPending ? styles.primaryBtnText : styles.outlineBtnText}>
                {isPending ? 'Verify & Gate-In' : 'Download PDF'}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })
    )}

    <Modal visible={!!scanningChallan} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <SafeAreaView style={{ flex: 1 }}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 20, zIndex: 10 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Scan Invoice QR</Text>
              <TouchableOpacity onPress={() => setScanningChallan(null)}>
                <MaterialCommunityIcons name="close" size={28} color="#fff" />
              </TouchableOpacity>
           </View>
           
           <View style={{ flex: 1, overflow: 'hidden', borderRadius: 20, margin: 20 }}>
             {permission?.granted && scanningChallan && (
               <CameraView
                  style={{ flex: 1 }}
                  facing="back"
                  onBarcodeScanned={isVerifying ? undefined : handleBarcodeScanned}
               />
             )}
           </View>

           <View style={{ padding: 20, alignItems: 'center', paddingBottom: 40 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontSize: 16 }}>Point camera at the QR code attached to the physical parcel.</Text>
           </View>
        </SafeAreaView>
      </View>
    </Modal>
  </View>
  );
};
const EarningsTab = () => (
  <View style={styles.tabContainer}>
    <View style={styles.sectionHeaderTop}>
      <Text style={styles.sectionTitle}>Financial Ledger & Payouts</Text>
    </View>

    <LinearGradient colors={['#10b981', '#064e3b']} style={styles.financeHero}>
       <MaterialCommunityIcons name="wallet" size={48} color="rgba(255,255,255,0.2)" style={styles.financeBgIcon} />
       <Text style={styles.financeLabel}>Available Balance</Text>
       <Text style={styles.financeBig}>₹1,42,500</Text>
       
       <View style={styles.escrowBox}>
          <Text style={styles.escrowLabel}>Escrow Holding</Text>
          <Text style={styles.escrowValue}>₹85,000</Text>
       </View>
    </LinearGradient>

    <Text style={styles.miniTitle}>Recent Transactions</Text>

    {/* Transaction 1 */}
    <View style={styles.txnCard}>
       <View style={styles.txnLeft}>
         <View style={styles.txnIconWrap}>
            <MaterialCommunityIcons name="arrow-bottom-left" size={24} color="#10b981" />
         </View>
         <View>
            <Text style={styles.txnClient}>Apex Exports Ltd.</Text>
            <Text style={styles.txnRef}>TXN-9941 (JOB-2026-770)</Text>
         </View>
       </View>
       <View style={styles.txnRight}>
          <Text style={styles.txnAmount}>+ ₹2,10,000</Text>
          <Text style={styles.txnStatus}>✅ Settled (02 Aug)</Text>
       </View>
    </View>

    {/* Transaction 2 */}
    <View style={styles.txnCard}>
       <View style={styles.txnLeft}>
         <View style={styles.txnIconWrap}>
            <MaterialCommunityIcons name="arrow-bottom-left" size={24} color="#10b981" />
         </View>
         <View>
            <Text style={styles.txnClient}>Kaveri Fabrics</Text>
            <Text style={styles.txnRef}>TXN-9820 (JOB-2026-752)</Text>
         </View>
       </View>
       <View style={styles.txnRight}>
          <Text style={styles.txnAmount}>+ ₹1,75,000</Text>
          <Text style={styles.txnStatus}>✅ Settled (28 Jul)</Text>
       </View>
    </View>
  </View>
);

// ------------------------------------------------------------------
// Screen 5: Profile
// ------------------------------------------------------------------
const ProfileTab = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState({});
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [verifying, setVerifying] = useState(false);
    const [gstStatus, setGstStatus] = useState('idle');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            const res = await axios.get(`${API_URL}/api/profile/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
            setFormData(res.data);
            
            if (res.data.verification_status && res.data.verification_status !== 'UNVERIFIED') {
                setGstStatus('verified');
            }
        } catch (error) {
            console.log("Failed to fetch profile in mobile", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyDocument = async () => {
        const docType = formData.verification_doc_type;
        const idNum = formData.id_number;

        if (!docType) {
            Alert.alert("Required", "Please select a verification document type first.");
            return;
        }
        if (!idNum || idNum.trim().length < 5) {
            Alert.alert("Required", "Please enter a valid document ID number.");
            return;
        }

        setVerifying(true);
        try {
            const token = await AsyncStorage.getItem('token');
            const response = await axios.post(`${API_URL}/api/profile/verify-document/`, {
                doc_type: docType,
                id_number: idNum
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = response.data;
            if (data && data.profile) {
                setProfile(data.profile);
                setFormData(data.profile);
                setGstStatus('verified');
                Alert.alert("Verified", data.message || "Identity verified successfully!");
            }
        } catch (err) {
            setGstStatus('idle');
            const errMsg = err.response?.data?.details || err.response?.data?.error || "Verification failed. Please check inputs.";
            Alert.alert("Verification Failed", errMsg);
        } finally {
            setVerifying(false);
        }
    };

    const handleSave = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await axios.put(`${API_URL}/api/profile/`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfile(res.data);
            setEditing(false);
            Alert.alert("Synchronized", "Profile saved synchronously across Web & Mobile apps!");
        } catch (error) {
            Alert.alert("Error", "Failed to lock profile updates to backend.");
        }
    };

    const selectDocType = () => {
        if (gstStatus === 'verified' || !editing) return;
        Alert.alert("Verification Document", "Select document type", [
            { text: "GSTIN", onPress: () => setFormData({...formData, verification_doc_type: 'GSTIN'}) },
            { text: "Udyam (MSME)", onPress: () => setFormData({...formData, verification_doc_type: 'UDYAM'}) },
            { text: "PAN Card", onPress: () => setFormData({...formData, verification_doc_type: 'PAN'}) },
            { text: "Aadhaar Card", onPress: () => setFormData({...formData, verification_doc_type: 'AADHAAR'}) },
            { text: "Cancel", style: "cancel" }
        ]);
    };

    if (loading) return <View style={styles.tabContainer}><Text style={{textAlign: 'center', marginTop: 40, color: '#64748b'}}>Fetching sync records...</Text></View>;

    const primaryName = profile.workshop_name || profile.legal_name || "Unverified User";
    const isVerified = gstStatus === 'verified';
    
    if (!editing) {
        return (
          <View style={styles.tabContainer}>
            <View style={styles.sectionHeaderTop}>
              <Text style={styles.sectionTitle}>Workshop Profile & Capacity</Text>
            </View>

            <View style={styles.ticketCard}>
               <View style={styles.avatarLarge}>
                 <MaterialCommunityIcons name="factory" size={40} color="#059669" />
               </View>
               <Text style={styles.profileName}>{primaryName}</Text>
               <Text style={styles.profileLoc}>{profile.operating_location || "Location unconfigured"}</Text>
               {user?.email && <Text style={[styles.profileLoc, {marginTop: 4, color: '#334155'}]}>{user.email}</Text>}
               
               <View style={[styles.gstinBox, {backgroundColor: profile.verification_status !== 'UNVERIFIED' ? '#d1fae5' : '#f1f5f9'}]}>
                  <Text style={[styles.gstinText, {color: profile.verification_status !== 'UNVERIFIED' ? '#059669' : '#64748b'}]}>
                    {profile.verification_status && profile.verification_status !== 'UNVERIFIED' ? `[${profile.verification_status}] ${profile.id_number}` : 'Awaiting Cashfree Verification'}
                  </Text>
                  {profile.verification_status && profile.verification_status !== 'UNVERIFIED' && <MaterialCommunityIcons name="check-decagram" size={16} color="#10b981" style={{marginLeft: 4}} />}
               </View>

               <View style={styles.divider} />
               
               <View style={styles.contractDetailRow}>
                  <Text style={styles.contractLabel}>Machinery Config</Text>
                  <Text style={styles.contractValue}>{profile.primary_machinery || "Untracked"}</Text>
               </View>
               <View style={styles.contractDetailRow}>
                  <Text style={styles.contractLabel}>Engine Deployment</Text>
                  <Text style={styles.contractValue}>{profile.active_machines || 0} Assets Running</Text>
               </View>
            </View>

            <View style={styles.ticketCard}>
               <Text style={styles.chartTitle}>Secure Escrow Integration</Text>
               <View style={styles.divider} />
               <View style={styles.contractDetailRow}>
                  <Text style={styles.contractLabel}>Account Routing No.</Text>
                  <Text style={styles.contractValue}>{profile.account_number || "Missing Setup"}</Text>
               </View>
               <View style={styles.contractDetailRow}>
                  <Text style={styles.contractLabel}>IFSC Node Trace</Text>
                  <Text style={styles.contractValue}>{profile.ifsc_code || "Missing Setup"}</Text>
               </View>
            </View>

            <View style={styles.ticketCard}>
               <Text style={styles.chartTitle}>Platform Trust Standing</Text>
               <View style={{flexDirection: 'row', alignItems: 'center', marginVertical: 12}}>
                 <MaterialCommunityIcons name="star" size={32} color="#f59e0b" />
                 <Text style={{fontSize: 32, fontWeight: '900', color: '#0f172a', marginLeft: 8}}>4.8<Text style={{fontSize: 16, color: '#64748b'}}>/ 5.0</Text></Text>
               </View>
               <Text style={{color: '#64748b', fontSize: 14, marginBottom: 16}}>(52 Verified Cycles Completed)</Text>
               
               <TouchableOpacity style={styles.outlineBtn} onPress={() => {setEditing(true); setFormData(profile);}}>
                 <MaterialCommunityIcons name="pencil-ruler" size={18} color="#0f172a" style={{marginRight: 8}}/>
                 <Text style={styles.outlineBtnText}>Edit Workshop Profile</Text>
               </TouchableOpacity>
            </View>
          </View>
        );
    }

    const docLockObj = {
        name: isVerified && ['GSTIN', 'UDYAM', 'BUSINESS_PAN'].includes(formData.verification_doc_type),
        location: isVerified && ['GSTIN', 'UDYAM'].includes(formData.verification_doc_type)
    };

    return (
      <View style={styles.tabContainer}>
        <View style={styles.sectionHeaderTop}>
          <Text style={styles.sectionTitle}>Edit Facility Details</Text>
        </View>

        {/* Verification Section */}
        <View style={styles.ticketCard}>
           <Text style={styles.chartTitle}>ID Verification</Text>
           <View style={styles.divider} />
           
           <View style={{marginBottom: 16}}>
              <Text style={styles.contractLabel}>Verification Doc</Text>
              {!isVerified ? (
                  <TouchableOpacity onPress={selectDocType} style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', paddingVertical: 8 }]}>
                      <Text style={{color: formData.verification_doc_type ? '#0f172a' : '#94a3b8'}}>{formData.verification_doc_type || 'Select Document...'}</Text>
                  </TouchableOpacity>
              ) : (
                  <Text style={[styles.contractValue, isVerified && {color: '#059669', fontWeight: 'bold'}]}>
                      {profile.verification_doc_type || "None"} (Verified)
                  </Text>
              )}
           </View>
           
           <View style={{marginBottom: 16}}>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                  <Text style={styles.contractLabel}>ID Number</Text>
                  {isVerified && <Text style={{fontSize: 10, fontWeight: 'bold', color: '#059669'}}>✓ VERIFIED</Text>}
              </View>
              {!isVerified ? (
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                      <TextInput 
                          style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', padding: 4, flex: 1, marginRight: 8, textTransform: 'uppercase' }]}
                          value={formData.id_number || ''}
                          autoCapitalize="characters"
                          onChangeText={(t) => {
                              setFormData({...formData, id_number: t});
                              if (gstStatus === 'verified') setGstStatus('idle');
                          }}
                          placeholder="Enter ID Number"
                      />
                      <TouchableOpacity onPress={handleVerifyDocument} style={{backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#10b981'}}>
                          <Text style={{color: '#059669', fontWeight: 'bold', fontSize: 12}}>{verifying ? '...' : 'VERIFY'}</Text>
                      </TouchableOpacity>
                  </View>
              ) : (
                  <Text style={[styles.contractValue, isVerified && {color: '#059669'}]}>{profile.id_number || "Not provided"}</Text>
              )}
           </View>
        </View>

        {/* Personal Details Section */}
        <View style={styles.ticketCard}>
           <Text style={styles.chartTitle}>Personal Details</Text>
           <View style={styles.divider} />
           
           <View style={{flexDirection: 'row', gap: 12, marginBottom: 16}}>
               <View style={{flex: 1}}>
                  <Text style={styles.contractLabel}>First Name</Text>
                  <TextInput 
                    style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', paddingVertical: 4 }]}
                    value={formData.first_name || ''}
                    onChangeText={(t) => setFormData({...formData, first_name: t})}
                    placeholder="First Name"
                  />
               </View>
               <View style={{flex: 1}}>
                  <Text style={styles.contractLabel}>Last Name</Text>
                  <TextInput 
                    style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', paddingVertical: 4 }]}
                    value={formData.last_name || ''}
                    onChangeText={(t) => setFormData({...formData, last_name: t})}
                    placeholder="Last Name"
                  />
               </View>
           </View>
           
           <View style={{flexDirection: 'row', gap: 12}}>
               <View style={{flex: 1}}>
                  <Text style={styles.contractLabel}>Contact Person</Text>
                  <TextInput 
                    style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', paddingVertical: 4 }]}
                    value={formData.contact_person || ''}
                    onChangeText={(t) => setFormData({...formData, contact_person: t})}
                    placeholder="e.g. S. Kumar"
                  />
               </View>
               <View style={{flex: 1}}>
                  <Text style={styles.contractLabel}>Primary Phone</Text>
                  <TextInput 
                    style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', paddingVertical: 4 }]}
                    value={formData.contact_number || ''}
                    keyboardType="phone-pad"
                    onChangeText={(t) => setFormData({...formData, contact_number: t})}
                    placeholder="+91..."
                  />
               </View>
           </View>
        </View>

        {/* Workshop Profile Section */}
        <View style={styles.ticketCard}>
           <Text style={styles.chartTitle}>{docLockObj.name ? '✓ Workshop Name (Locked)' : 'Workshop Name'}</Text>
           <View style={styles.divider} />
           <View style={styles.contractDetailRow}>
              {!docLockObj.name ? (
                  <TextInput 
                    style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', padding: 0 }]}
                    value={formData.workshop_name || ''}
                    onChangeText={(t) => setFormData({...formData, workshop_name: t})}
                    placeholder="e.g. Sri Murugan Powerlooms"
                  />
              ) : (
                  <Text style={[styles.contractValue, docLockObj.name && {color: '#64748b'}]}>
                      {profile.workshop_name || "Unconfigured"}
                  </Text>
              )}
           </View>
           
           <Text style={[styles.chartTitle, {marginTop: 16}]}>{docLockObj.location ? '✓ Operating Location (Locked)' : 'Operating Location'}</Text>
           <View style={styles.divider} />
           <View style={styles.contractDetailRow}>
              {!docLockObj.location ? (
                  <TextInput 
                    style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', padding: 0 }]}
                    value={formData.operating_location || ''}
                    onChangeText={(t) => setFormData({...formData, operating_location: t})}
                    placeholder="e.g. Somanur, Coimbatore"
                  />
              ) : (
                  <Text style={[styles.contractValue, docLockObj.location && {color: '#64748b'}]}>
                      {profile.operating_location || "Unconfigured"}
                  </Text>
              )}
           </View>

           <Text style={[styles.chartTitle, {marginTop: 16}]}>Shipping / Delivery Address</Text>
           <View style={styles.divider} />
           <View style={styles.contractDetailRow}>
              <TextInput 
                style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', padding: 0 }]}
                value={formData.shipping_address || ''}
                onChangeText={(t) => setFormData({...formData, shipping_address: t})}
                placeholder="Full delivery address"
                multiline={true}
              />
           </View>

           <Text style={[styles.chartTitle, {marginTop: 16}]}>Machinery Config</Text>
           <View style={styles.divider} />
           <View style={styles.contractDetailRow}>
              <TextInput 
                style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', padding: 0 }]}
                value={formData.primary_machinery || ''}
                onChangeText={(t) => setFormData({...formData, primary_machinery: t})}
                placeholder="e.g. Circular Knitting"
              />
           </View>

           <Text style={[styles.chartTitle, {marginTop: 16}]}>Active Machines</Text>
           <View style={styles.divider} />
           <View style={styles.contractDetailRow}>
              <TextInput 
                style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', padding: 0 }]}
                keyboardType="numeric"
                value={formData.active_machines?.toString() || ''}
                onChangeText={(t) => setFormData({...formData, active_machines: parseInt(t) || 0})}
                placeholder="0"
              />
           </View>
        </View>

        {/* Escrow Bank Section */}
        <View style={styles.ticketCard}>
           <Text style={styles.chartTitle}>Payout Bank Details (Escrow)</Text>
           <View style={styles.divider} />
           <View style={{marginBottom: 16}}>
              <Text style={styles.contractLabel}>Account Routing No.</Text>
              <TextInput 
                style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', paddingVertical: 4 }]}
                value={formData.account_number || ''}
                onChangeText={(t) => setFormData({...formData, account_number: t})}
                placeholder="Enter Account"
              />
           </View>
           <View>
              <Text style={styles.contractLabel}>IFSC Node Trace</Text>
              <TextInput 
                style={[styles.contractValue, { borderBottomWidth: 1, borderColor: '#cbd5e1', paddingVertical: 4, textTransform: 'uppercase' }]}
                value={formData.ifsc_code || ''}
                autoCapitalize="characters"
                onChangeText={(t) => setFormData({...formData, ifsc_code: t})}
                placeholder="Enter IFSC"
              />
           </View>
        </View>

        <View style={{flexDirection: 'row', marginBottom: 20, gap: 12}}>
           <TouchableOpacity style={[styles.outlineBtn, {flex: 1}]} onPress={() => {setEditing(false); setFormData(profile);}}>
             <Text style={styles.outlineBtnText}>Cancel</Text>
           </TouchableOpacity>
           
           <TouchableOpacity style={[styles.primaryBtn, {flex: 2}]} onPress={handleSave}>
             <MaterialCommunityIcons name="content-save-all" size={18} color="#fff" style={{marginRight: 8}}/>
             <Text style={styles.primaryBtnText}>Save</Text>
           </TouchableOpacity>
        </View>
      </View>
    );
};

// ------------------------------------------------------------------
// Main Dashboard Container
// ------------------------------------------------------------------
export default function UserDashboard() {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState('feed');
  const scrollY = useRef(new Animated.Value(0)).current;

  const [jobs, setJobs] = useState([]);
  const [challans, setChallans] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const slideAnim = useRef(new Animated.Value(-150)).current;
  const [notificationData, setNotificationData] = useState(null);

  const triggerNotification = (title, message, type='success') => {
    setNotificationData({ title, message, type });
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 50, duration: 400, useNativeDriver: true }),
      Animated.delay(4000),
      Animated.timing(slideAnim, { toValue: -150, duration: 400, useNativeDriver: true })
    ]).start(() => setNotificationData(null));
  };

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (!token) return;
        const [jobsRes, challansRes] = await Promise.all([
          axios.get(`${API_URL}/api/jobs/`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/api/challans/`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (active) {
          setJobs(prevJobs => {
             if (prevJobs.length > 0) {
               const previouslyAwarded = prevJobs.filter(j => j.awarded_bid).map(j => j.id);
               const recentlyAwarded = jobsRes.data.filter(j => j.awarded_bid && !previouslyAwarded.includes(j.id));
               if (recentlyAwarded.length > 0) {
                   triggerNotification("Contract Awarded! 🎉", `You won the bid for ${recentlyAwarded[0].title}. Check Contracts tab!`);
               }
             }
             return jobsRes.data;
          });

          setChallans(prevChallans => {
             if (prevChallans.length > 0) {
               const previouslyGateIn = prevChallans.filter(c => c.status === 'Gate-In Verified').map(c => c.id);
               const recentlyGateIn = challansRes.data.filter(c => c.status === 'Gate-In Verified' && !previouslyGateIn.includes(c.id));
               if (recentlyGateIn.length > 0) {
                   triggerNotification("Gate-In Verified! ✅", `Your materials for ${recentlyGateIn[0].job_name} have securely arrived at the workshop.`);
               }

               const previouslyReceived = prevChallans.filter(c => c.status === 'Received').map(c => c.id);
               const recentlyReceived = challansRes.data.filter(c => c.status === 'Received' && !previouslyReceived.includes(c.id));
               if (recentlyReceived.length > 0) {
                   triggerNotification("Return Received! 📦", `Export house has received your return for ${recentlyReceived[0].job_name}.`);
               }
             }
             return challansRes.data;
          });
        }
      } catch (err) {
        console.log("Failed to load jobs", err);
      } finally {
        if (active) setLoadingJobs(false);
      }
    };
    fetchData();
    const pollInterval = setInterval(() => {
      fetchData();
    }, 4000);
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      active = false;
      clearInterval(pollInterval);
      clearInterval(timeInterval);
    };
  }, []);

  const displayName = user?.first_name || (user?.username ? user.username.split('@')[0] : 'User');

  const HEADER_MAX_HEIGHT = 150;
  const HEADER_MIN_HEIGHT = 110;
  const headerHeight = activeTab === 'feed'
    ? scrollY.interpolate({
        inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
        outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
        extrapolate: 'clamp',
      })
    : HEADER_MIN_HEIGHT;

  const headerScale = activeTab === 'feed'
    ? scrollY.interpolate({
        inputRange: [0, HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT],
        outputRange: [1, 0.82], // smoothly shrinks by 18%
        extrapolate: 'clamp',
      })
    : 0.82;

  const handleSettings = () => {
    Alert.alert(
      "Settings",
      "Choose an action",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Log Out", onPress: logout, style: "destructive" }
      ]
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'feed': return <FeedTab jobs={jobs} setJobs={setJobs} loading={loadingJobs} currentTime={currentTime} />;
      case 'contracts': return <ContractsTab jobs={jobs} setJobs={setJobs} />;
      case 'challans': return <ChallansTab challans={challans} />;
      case 'earnings': return <EarningsTab />;
      case 'profile': return <ProfileTab />;
      case 'notifications': return (
         <View style={{padding: 20}}>
            <Text style={{fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 12}}>Notifications</Text>
            <View style={{backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2}}>
               <MaterialCommunityIcons name="bell-sleep" size={48} color="#cbd5e1" style={{marginBottom: 12}} />
               <Text style={{color: '#94a3b8', fontSize: 16, fontWeight: '600'}}>All caught up!</Text>
               <Text style={{color: '#94a3b8', fontSize: 13, textAlign: 'center', marginTop: 4}}>New alerts will appear here when your bidding status changes.</Text>
            </View>
         </View>
      );
      default: return <FeedTab jobs={jobs} setJobs={setJobs} loading={loadingJobs} currentTime={currentTime} />;
    }
  };
  return (
    <View style={styles.container}>
      <Animated.View style={{
         position: 'absolute', transform: [{translateY: slideAnim}], top: 0, left: 20, right: 20, zIndex: 1000,
         backgroundColor: '#1e293b', borderRadius: 16, padding: 16,
         flexDirection: 'row', alignItems: 'center',
         shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 15
      }}>
         <View style={{backgroundColor: notificationData?.type==='success'?'#10b981':'#f59e0b', width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12}}>
            <MaterialCommunityIcons name="bell-ring" size={20} color="#fff" />
         </View>
         <View style={{flexShrink: 1}}>
            <Text style={{color: '#fff', fontWeight: '800', fontSize: 15, marginBottom: 2}}>{notificationData?.title}</Text>
            <Text style={{color: '#94a3b8', fontSize: 13, lineHeight: 18}}>{notificationData?.message}</Text>
         </View>
      </Animated.View>
      <Animated.View style={[styles.globalHeader, { height: headerHeight }]}>
        <LinearGradient colors={['#10b981', '#064e3b']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.headerContent}>
          <Animated.View style={[styles.userInfo, { transform: [{ scale: headerScale }, { translateX: activeTab==='feed' ? scrollY.interpolate({ inputRange:[0, 40], outputRange:[0, -10], extrapolate:'clamp'}) : -10 }] }]}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={28} color="#059669" />
            </View>
            <View style={{ marginLeft: 16 }}>
              <Text style={styles.greetingHeader}>Welcome Back</Text>
              {activeTab === 'feed' && (
                 <Animated.Text style={[styles.subGreetingHeader, {
                     opacity: scrollY.interpolate({
                        inputRange: [0, 30],
                        outputRange: [1, 0],
                        extrapolate: 'clamp'
                     })
                 }]}>{displayName} 👋</Animated.Text>
              )}
            </View>
          </Animated.View>

          <Animated.View style={[styles.headerActions, { transform: [{ scale: headerScale }, { translateX: activeTab==='feed' ? scrollY.interpolate({ inputRange:[0, 40], outputRange:[0, 10], extrapolate:'clamp'}) : 10 }] }]}>
            <TouchableOpacity style={styles.iconBtnHeader} onPress={() => setActiveTab('notifications')}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtnHeader} onPress={handleSettings}>
              <MaterialCommunityIcons name="cog-outline" size={24} color="#ffffff" />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingTop: activeTab === 'feed' ? 170 : 130 }]} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {renderContent()}

        {/* Bottom Padding for floating nav */}
        <View style={{ height: 100 }} />
      </Animated.ScrollView>

      <StandardBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff', // Pure white background for Egovern style
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  tabContainer: {
    paddingBottom: 20,
    paddingTop: 16,
  },
  globalHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: 'hidden',
  },
  headerSafeArea: {
    flex: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 50, // Mobile status bar safety padding
  },
  greetingHeader: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
  },
  subGreetingHeader: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
  iconBtnHeader: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  // Sub Components
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderTop: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  // Feed Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
  },
  // Unified Ticket Cards
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  ticketSub: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  urgencyBadge: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  urgencyText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  ticketSpecsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ticketSpec: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ticketBudgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  ticketBudgetLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  ticketBudgetAmount: {
    fontSize: 16,
    color: '#059669',
    fontWeight: '800',
  },
  primaryBtn: {
    backgroundColor: '#10b981', // emerald
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  outlineBtn: {
    backgroundColor: '#ffffff', 
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  outlineBtnText: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  // Contracts Screen
  bannerInfo: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  bannerText: {
    fontSize: 14,
    fontWeight: '500',
  },
  ticketHeaderBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ticketJobId: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  ticketTitleSmall: {
    fontSize: 14,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 16,
  },
  contractDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  contractLabel: {
    color: '#64748b',
    fontSize: 14,
  },
  contractValue: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '600',
  },
  stageTrackerContainer: {
    marginVertical: 16,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
  },
  stageRunning: {
    color: '#0284c7',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  stagePending: {
    color: '#d97706',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284c7',
    borderRadius: 3,
  },
  // Challans
  challanDesc: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
    marginBottom: 20,
    marginTop: -4,
  },
  // Earnings
  financeHero: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    overflow: 'hidden', // to clip bg icon
  },
  financeBgIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
  },
  financeLabel: {
    color: '#a7f3d0',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  financeBig: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
    marginBottom: 24,
  },
  escrowBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  escrowLabel: {
    color: '#ffffff',
    fontSize: 14,
  },
  escrowValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  miniTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  txnCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txnIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#d1fae5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  txnClient: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  txnRef: {
    fontSize: 13,
    color: '#64748b',
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#059669',
  },
  txnStatus: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  // Profile
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    color: '#0f172a',
  },
  profileLoc: {
    fontSize: 15,
    textAlign: 'center',
    color: '#64748b',
    marginBottom: 12,
  },
  gstinBox: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: 'center',
  },
  gstinText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 16,
  },
  capacityHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  capacityLoad: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  capacityOpen: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  sliderTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    marginVertical: 12,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#10b981',
    transform: [{ translateX: -10 }],
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
  },

  // Standard Bottom Nav
  bottomNavContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    paddingBottom: 20, // For iOS Home bar
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 20,
  },
  navGroup: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-around',
  },
  navButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 4,
  },
  fabCenter: {
    position: 'absolute',
    bottom: 35,
    alignSelf: 'center',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#ffffff', // Cutout effect stroke
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  fabInner: {
    flex: 1,
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
