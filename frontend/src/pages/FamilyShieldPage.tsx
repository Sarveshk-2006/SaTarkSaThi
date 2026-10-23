import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  ShieldAlert,
  CheckCircle,
  Phone,
  Mail,
  Trash2,
  Edit,
  Clock,
  Send,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  Check,
  Radio,
  ExternalLink,
  Lock,
  PhoneCall,
  KeyRound,
  Eye,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/endpoints';
import { TrustedContact, FamilyAlert, AlertLevel } from '../api/types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { SimulationBanner } from '../components/common/SimulationBanner';
import { useToast } from '../context/ToastContext';
import { useNotification } from '../context/NotificationContext';

export const FamilyShieldPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { activeUserId, switchUser, activeProfileName, activeProfileRole, isWsConnected, manualTriggerDemoNotification } = useNotification();

  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [alerts, setAlerts] = useState<FamilyAlert[]>([]);
  const [loading, setLoading] = useState(true);

  // Contact Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<TrustedContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    relationship: 'Son',
    phone_number: '',
    email: '',
    alert_level: 'HIGH_RISK_ONLY' as AlertLevel,
    is_primary: false,
    consent_granted: false,
  });
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Verification Modal
  const [verifyingContact, setVerifyingContact] = useState<TrustedContact | null>(null);
  const [verificationCodeInput, setVerificationCodeInput] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Manual Dispatch Modal
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [dispatchData, setDispatchData] = useState({
    threat_title: 'Digital Arrest Threat Blocked for Rajesh',
    message_content: 'Satark Saathi Alert: High-risk imposter calling from fake Mumbai Police. Risk Score: 94/100. Rajesh has been advised not to transfer money.',
    risk_level: 'CRITICAL',
    recommended_action: 'Call Rajesh immediately to reassure him and ensure no bank transfer is initiated.',
  });

  // Delete Confirmation
  const [contactToDelete, setContactToDelete] = useState<TrustedContact | null>(null);
  const [isRetryingAlertId, setIsRetryingAlertId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contactsData, alertsData] = await Promise.all([
        api.getContacts(),
        api.getAlerts(),
      ]);
      setContacts(contactsData);
      setAlerts(alertsData);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to load Family Shield', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeUserId]);

  const openCreateModal = () => {
    setEditingContact(null);
    setFormData({
      name: '',
      relationship: 'Son',
      phone_number: '+91 ',
      email: '',
      alert_level: 'HIGH_RISK_ONLY',
      is_primary: contacts.length === 0,
      consent_granted: false,
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (c: TrustedContact) => {
    setEditingContact(c);
    setFormData({
      name: c.name,
      relationship: c.relationship,
      phone_number: c.phone_number,
      email: c.email || '',
      alert_level: c.alert_level,
      is_primary: c.is_primary,
      consent_granted: Boolean(c.consent_granted),
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = 'Full name is required';
    if (!formData.relationship.trim()) errors.relationship = 'Relationship is required';
    if (!formData.phone_number.trim() || formData.phone_number.trim().length < 10) {
      errors.phone_number = 'A valid 10-digit mobile number is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingContact) {
        await api.updateContact(editingContact.id, formData);
        showToast({ type: 'success', title: 'Contact Updated', message: `${formData.name}'s settings updated.` });
      } else {
        await api.createContact(formData);
        showToast({ type: 'success', title: 'Guardian Added', message: `${formData.name} added to Family Shield.` });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to save contact', message: err.message });
    }
  };

  const handleDeleteContact = async () => {
    if (!contactToDelete) return;
    try {
      await api.deleteContact(contactToDelete.id);
      showToast({ type: 'success', title: 'Guardian Removed', message: 'Contact successfully deleted.' });
      setContactToDelete(null);
      fetchData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to delete contact', message: err.message });
    }
  };

  // Start OTP verification flow
  const handleRequestVerification = async (c: TrustedContact) => {
    try {
      setVerifyingContact(c);
      setVerificationCodeInput('');
      const res = await api.requestContactVerification(c.id);
      setDemoCodeHint(res.demo_verification_code);
      showToast({
        type: 'info',
        title: 'Verification Code Dispatched',
        message: `OTP sent to ${c.phone_number}. (Demo code: ${res.demo_verification_code})`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Verification Request Failed', message: err.message });
    }
  };

  // Confirm OTP verification flow
  const handleConfirmVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingContact || !verificationCodeInput.trim()) return;

    setIsVerifying(true);
    try {
      await api.confirmContactVerification(verifyingContact.id, verificationCodeInput.trim());
      showToast({
        type: 'success',
        title: 'Phone Verified Successfully',
        message: `${verifyingContact.name} is now a verified Family Guardian.`,
      });
      setVerifyingContact(null);
      fetchData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Verification Failed', message: err.message || 'Incorrect 6-digit code.' });
    } finally {
      setIsVerifying(false);
    }
  };

  // Acknowledge alert
  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId);
      showToast({ type: 'success', title: 'Alert Acknowledged', message: 'Marked as received by Family Guardian.' });
      fetchData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to acknowledge', message: err.message });
    }
  };

  // Retry alert delivery
  const handleRetryAlert = async (alertId: number) => {
    setIsRetryingAlertId(alertId);
    try {
      await api.retryAlert(alertId);
      showToast({ type: 'success', title: 'Alert Retried', message: 'Delivery successfully re-dispatched.' });
      fetchData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Retry failed', message: err.message });
    } finally {
      setIsRetryingAlertId(null);
    }
  };

  // Manual In-App Test Dispatch
  const handleDispatchTestAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const verifiedContacts = contacts.filter((c) => c.is_active && c.consent_granted);
    if (verifiedContacts.length === 0) {
      showToast({ type: 'warning', title: 'No Eligible Contacts', message: 'You need at least one active contact with consent granted.' });
      return;
    }

    try {
      const res = await api.dispatchAlert({
        contact_ids: verifiedContacts.map((c) => c.id),
        threat_title: dispatchData.threat_title,
        message_content: dispatchData.message_content,
        risk_level: dispatchData.risk_level,
        recommended_action: dispatchData.recommended_action,
        delivery_channel: 'IN_APP_SIMULATION',
      });
      showToast({
        type: 'success',
        title: 'In-App Alerts Dispatched',
        message: `Alert broadcast to ${res.length} contact(s) via real-time WebSocket transport.`,
      });
      setIsDispatchModalOpen(false);
      fetchData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Dispatch failed', message: err.message });
    }
  };

  // Telecom DLT Carrier Dispatch Logs
  const [isCarrierModalOpen, setIsCarrierModalOpen] = useState(false);
  const [carrierLogs, setCarrierLogs] = useState<any | null>(null);
  const [isLoadingCarrierLogs, setIsLoadingCarrierLogs] = useState(false);

  const fetchCarrierLogs = async () => {
    setIsLoadingCarrierLogs(true);
    try {
      const data = await api.getCarrierLogs();
      setCarrierLogs(data);
      setIsCarrierModalOpen(true);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Carrier Logs Failed', message: err.message });
    } finally {
      setIsLoadingCarrierLogs(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-xl font-bold text-slate-900">Family Shield Network</h1>
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SimulationBanner message="Family Shield Carrier SMS and multi-device alerts operate in an authenticated demonstration sandbox. High-risk alerts are broadcast in real time across verified guardian sessions without sending unauthorized telecom spam." />

      {/* 2-Device Demo & Session Switcher Banner */}
      <div className="bg-[#14243A] text-white p-5 rounded-2xl border border-slate-700/60 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="p-2.5 rounded-xl bg-white/10 text-emerald-400 border border-white/10">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                2-Session Live Notification Demo
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                isWsConnected ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                {isWsConnected ? 'WebSocket Live' : 'Connecting'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Current Session: <strong className="text-white font-semibold">{activeProfileName}</strong> ({activeProfileRole})
              &nbsp;&bull; Carrier SMS &amp; In-App Transport Active.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={fetchCarrierLogs}
            disabled={isLoadingCarrierLogs}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors shadow-sm flex items-center gap-2 cursor-pointer border border-slate-700"
          >
            <Radio className="w-3.5 h-3.5 text-teal-400" />
            {isLoadingCarrierLogs ? 'Loading Carrier...' : 'DLT Carrier Logs'}
          </button>
          <button
            onClick={() => switchUser(activeUserId === '1' ? '2' : '1')}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-[#176B58] hover:bg-[#125243] text-white transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Switch to {activeUserId === '1' ? 'Aarav (Guardian)' : 'Rajesh (Protected)'}
          </button>
          <button
            onClick={() => setIsDispatchModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Trigger Test Alert
          </button>
        </div>
      </div>

      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#176B58]" />
            Trusted Family Contacts
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Configure trusted family guardians who receive automated high-risk security alerts with verified consent.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#176B58] hover:bg-[#125243] text-white text-xs font-semibold rounded-xl shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          Add Trusted Guardian
        </button>
      </div>

      {/* Trusted Contacts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {contacts.map((c) => (
          <div
            key={c.id}
            className={`bg-white rounded-2xl border p-5 transition-all shadow-sm flex flex-col justify-between ${
              c.is_primary ? 'border-[#176B58] ring-2 ring-[#176B58]/20' : 'border-slate-200'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F5EF] border border-teal-200 text-[#176B58] font-bold flex items-center justify-center text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      {c.name}
                      {c.is_primary && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#E8F5EF] text-[#176B58]">
                          PRIMARY
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-slate-500">{c.relationship}</span>
                  </div>
                </div>

                {/* Verification Badge */}
                {c.is_verified ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified
                  </span>
                ) : (
                  <button
                    onClick={() => handleRequestVerification(c)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 cursor-pointer"
                    title="Click to verify phone number via OTP"
                  >
                    <KeyRound className="w-3 h-3 text-amber-600" />
                    Verify Now
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs text-slate-600 py-3 border-y border-slate-100">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono text-slate-800">{c.phone_number}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Alert Threshold:</span>
                  <span className="font-semibold px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700">
                    {c.alert_level === 'CRITICAL_ONLY' ? 'Critical Scams Only' : c.alert_level === 'HIGH_RISK_ONLY' ? 'High & Critical' : 'All Scans'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Sharing Consent:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.consent_granted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {c.consent_granted ? 'Consent Granted' : 'Consent Pending (Alerts Disabled)'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2">
              <span className={`text-[10px] font-semibold flex items-center gap-1 ${c.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {c.is_active ? 'Active Shield' : 'Paused'}
              </span>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEditModal(c)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Edit contact"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setContactToDelete(c)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete contact"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {contacts.length === 0 && (
        <EmptyState
          icon={<Users className="w-6 h-6 text-teal-700" />}
          title="No Trusted Guardians Configured"
          description="Add a family member (son, daughter, spouse) who should be alerted when you encounter high-risk digital arrest scams."
          actionText="Add First Guardian"
          onAction={openCreateModal}
        />
      )}

      {/* Dispatched Alerts History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-700" />
              Safety Alerts Audit Trail
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live delivery status, failure retries, and guardian acknowledgments.
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {alerts.length} record(s) logged
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Threat Details</th>
                <th className="py-3 px-4">Risk Level</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Delivery Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {alert.incident_id ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/incidents?q=${encodeURIComponent(alert.incident_id!)}`)}
                        className="text-teal-800 hover:text-teal-900 hover:underline cursor-pointer"
                        title="View Incident Dossier in Incident History"
                      >
                        {alert.incident_id}
                      </button>
                    ) : (
                      `SA-ALERT-${alert.id}`
                    )}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-semibold text-slate-900 truncate">{alert.threat_title}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{alert.message_content}</p>
                    {alert.recommended_action && (
                      <p className="text-[10px] text-amber-700 font-medium mt-0.5">Action: {alert.recommended_action}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      alert.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {alert.risk_level || 'HIGH'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium">
                    {alert.contact?.name || `Contact #${alert.contact_id}`}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      IN_APP_SIMULATION
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                      alert.status === 'ACKNOWLEDGED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : alert.status === 'DELIVERED'
                        ? 'bg-blue-100 text-blue-800'
                        : alert.status === 'FAILED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.status === 'ACKNOWLEDGED' && <Check className="w-3 h-3 text-emerald-700" />}
                      {alert.status}
                    </span>
                    {alert.acknowledged_by && (
                      <span className="block text-[9px] text-slate-400 mt-0.5">By: {alert.acknowledged_by}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(alert.delivered_at).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {alert.status !== 'ACKNOWLEDGED' && (
                        <button
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}
                      <button
                        onClick={() => handleRetryAlert(alert.id)}
                        disabled={isRetryingAlertId === alert.id}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                        title="Retry alert delivery"
                      >
                        <RotateCcw className={`w-3 h-3 ${isRetryingAlertId === alert.id ? 'animate-spin' : ''}`} />
                        Retry
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                    No safety alerts dispatched yet. High-risk scan detections automatically trigger family notifications.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Code Modal */}
      {verifyingContact && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 mb-4 text-[#176B58]">
              <span className="p-2.5 rounded-xl bg-[#E8F5EF] border border-teal-200">
                <KeyRound className="w-6 h-6 text-[#176B58]" />
              </span>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Verify Guardian Phone</h3>
                <p className="text-xs text-slate-500">Contact: {verifyingContact.name} ({verifyingContact.phone_number})</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Enter the 6-digit confirmation code dispatched to verify that this contact is reachable during digital emergencies.
            </p>

            {demoCodeHint && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 mb-4 flex items-center justify-between">
                <span>In-App Demo Code: <strong className="font-mono text-sm tracking-widest">{demoCodeHint}</strong></span>
                <button
                  type="button"
                  onClick={() => setVerificationCodeInput(demoCodeHint)}
                  className="px-2 py-1 rounded bg-amber-200 hover:bg-amber-300 font-semibold text-[10px] cursor-pointer"
                >
                  Auto-Fill Code
                </button>
              </div>
            )}

            <form onSubmit={handleConfirmVerification} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCodeInput}
                  onChange={(e) => setVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 849201"
                  className="w-full text-center text-xl font-mono tracking-widest py-2.5 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyingContact(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verificationCodeInput.length < 4 || isVerifying}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#176B58] hover:bg-[#125243] text-white cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? 'Verifying...' : 'Confirm Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              {editingContact ? 'Edit Trusted Guardian' : 'Add Trusted Guardian'}
            </h3>

            <form onSubmit={handleSubmitContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Aarav Sharma"
                  className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                />
                {formErrors.name && <p className="text-red-600 text-[11px] mt-1">{formErrors.name}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                  >
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Lawyer">Lawyer / Advisor</option>
                    <option value="Friend">Trusted Friend</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder="+91 98101 23456"
                    className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                  />
                  {formErrors.phone_number && <p className="text-red-600 text-[11px] mt-1">{formErrors.phone_number}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="aarav@example.com"
                  className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alert Threshold</label>
                <select
                  value={formData.alert_level}
                  onChange={(e) => setFormData({ ...formData, alert_level: e.target.value as AlertLevel })}
                  className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
                >
                  <option value="HIGH_RISK_ONLY">High Risk & Critical Scams Only (Recommended)</option>
                  <option value="CRITICAL_ONLY">Critical Scams Only (Severe digital arrest)</option>
                  <option value="ALL">All Analyzed Scams (Maximum surveillance)</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={formData.consent_granted}
                    onChange={(e) => setFormData({ ...formData, consent_granted: e.target.checked })}
                    className="mt-0.5 rounded text-[#176B58] focus:ring-[#176B58]"
                  />
                  <div>
                    <span className="text-xs text-slate-900 font-bold block">
                      Explicit Guardian Consent Authorization
                    </span>
                    <span className="text-[11px] text-slate-600 block mt-0.5 leading-relaxed">
                      I confirm I have informed this guardian and obtained their consent to receive scam alerts and access emergency incident dossiers. Alerts remain disabled until consent is granted.
                    </span>
                  </div>
                </label>
                <label className="flex items-center gap-2 cursor-pointer px-1">
                  <input
                    type="checkbox"
                    checked={formData.is_primary}
                    onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                    className="rounded text-[#176B58] focus:ring-[#176B58]"
                  />
                  <span className="text-xs text-slate-700 font-medium">
                    Mark as Primary Guardian (First to be contacted in emergency).
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-[#176B58] hover:bg-[#125243] text-white cursor-pointer"
                >
                  {editingContact ? 'Save Changes' : 'Add Guardian'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Dispatch Modal */}
      {isDispatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Send className="w-5 h-5 text-rose-700" />
              Dispatch In-App Live Alert (Simulation)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Demonstrates real-time WebSockets push notification to secondary device sessions without requiring external SMS carrier.
            </p>

            <form onSubmit={handleDispatchTestAlert} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Threat Title</label>
                <input
                  type="text"
                  value={dispatchData.threat_title}
                  onChange={(e) => setDispatchData({ ...dispatchData, threat_title: e.target.value })}
                  className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alert Message</label>
                <textarea
                  rows={3}
                  value={dispatchData.message_content}
                  onChange={(e) => setDispatchData({ ...dispatchData, message_content: e.target.value })}
                  className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Recommended Action</label>
                <input
                  type="text"
                  value={dispatchData.recommended_action}
                  onChange={(e) => setDispatchData({ ...dispatchData, recommended_action: e.target.value })}
                  className="w-full py-2 px-3 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDispatchModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white cursor-pointer"
                >
                  Broadcast Live Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Telecom DLT Carrier SMS Dispatch Modal */}
      {isCarrierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Indian Telecom DLT Carrier SMS Audit Trail</h3>
                  <p className="text-[11px] text-slate-400">
                    Sender: <span className="text-teal-300 font-mono font-bold">SATARK</span> &bull; Template: <span className="font-mono text-teal-300">1407168923481729012</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCarrierModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900">National SMS Gateway: </span>
                  <span className="font-mono text-teal-900 font-semibold">{carrierLogs?.active_provider === 'simulated' ? 'Jio / Bharti Airtel Telecom Gateway' : carrierLogs?.active_provider}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  CARRIER ACTIVE
                </span>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Emergency Carrier Dispatches ({carrierLogs?.recent_dispatches?.length || 0})
                </h4>

                {!carrierLogs?.recent_dispatches || carrierLogs.recent_dispatches.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No emergency SMS dispatched yet in this demonstration session. Trigger an alert from Scam Analyzer or click "Trigger Test Alert" above.
                  </div>
                ) : (
                  carrierLogs.recent_dispatches.map((log: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition-colors space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{log.contact_name}</span>
                          <span className="text-slate-500 font-mono text-[11px]">{log.phone_number}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                          {log.status} &bull; {log.carrier_message_id}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
                        {log.message}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>DLT Template ID: {log.dlt_template_id}</span>
                        <span>Dispatched: {new Date(log.sent_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setIsCarrierModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold cursor-pointer"
              >
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Contact Confirmation */}
      <ConfirmationModal
        isOpen={Boolean(contactToDelete)}
        title="Remove Guardian Contact?"
        message={`Are you sure you want to remove ${contactToDelete?.name}? They will no longer receive emergency alerts.`}
        confirmLabel="Remove Contact"
        isDangerous={true}
        onConfirm={handleDeleteContact}
        onCancel={() => setContactToDelete(null)}
      />
    </div>
  );
};
