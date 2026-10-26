import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserMultiple,
  UserFollow,
  Phone,
  Email,
  TrashCan,
  Edit,
  Time,
  Send,
  Security,
  Renew,
  Checkmark,
  Radio,
  Password,
  CheckmarkFilled,
  WarningFilled,
} from '@carbon/icons-react';
import {
  Tile,
  Button,
  Tag,
  Modal,
} from '@carbon/react';
import { api } from '../api/endpoints';
import { TrustedContact, FamilyAlert, AlertLevel } from '../api/types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { SimulationBanner } from '../components/common/SimulationBanner';
import { useToast } from '../context/ToastContext';
import { useNotification } from '../context/NotificationContext';
import { GuardianInbox } from '../components/family/GuardianInbox';

const MAX_TRUSTED_CONTACTS = 2;

const isEligibleGuardian = (c: TrustedContact) =>
  c.is_active && c.consent_granted && c.contact_consent_status === 'ACCEPTED';

export const FamilyShieldPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { activeUserId, switchUser, activeProfileName, activeProfileRole, isWsConnected } = useNotification();

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
  const [inviteCodes, setInviteCodes] = useState<Record<number, string>>({});
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

  const handleSendInvite = async (c: TrustedContact) => {
    try {
      const res = await api.sendContactInvite(c.id);
      setInviteCodes((prev) => ({ ...prev, [c.id]: res.demo_invite_code }));
      showToast({
        type: 'info',
        title: 'Invitation created (demo)',
        message: `No SMS was sent. Give ${c.name} the code ${res.demo_invite_code} to accept in their guardian inbox.`,
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Invitation failed', message: err.message });
    }
  };

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

  const handleAcknowledgeAlert = async (alertId: number) => {
    try {
      await api.acknowledgeAlert(alertId);
      showToast({ type: 'success', title: 'Alert Acknowledged', message: 'Marked as received by Family Guardian.' });
      fetchData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to acknowledge', message: err.message });
    }
  };

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

  const handleDispatchTestAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const verifiedContacts = contacts.filter(isEligibleGuardian);
    if (verifiedContacts.length === 0) {
      showToast({ type: 'warning', title: 'No Eligible Contacts', message: 'A guardian needs your consent and must have accepted your invitation.' });
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
        <div className="border-b border-[#e0e0e0] pb-4">
          <h1 className="text-xl font-semibold text-[#161616]">Family Shield Network</h1>
        </div>
        <LoadingSkeleton rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <SimulationBanner message="Family Shield Carrier SMS and multi-device alerts operate in an authenticated demonstration sandbox. High-risk alerts are broadcast in real time across verified guardian sessions without sending unauthorized telecom spam." />

      {/* 2-Device Demo & Session Switcher Banner */}
      <Tile className="bg-[#161616] text-white p-5 border border-[#393939] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <span className="p-2.5 bg-[#262626] text-[#24a148] border border-[#393939] rounded">
            <Radio size={20} className="text-[#24a148] animate-pulse" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#c6c6c6]">
                2-Session Live Notification Demo
              </span>
              <Tag type={isWsConnected ? 'green' : 'warm-gray'} size="sm">
                {isWsConnected ? 'WebSocket Live' : 'Connecting'}
              </Tag>
            </div>
            <p className="text-xs text-[#c6c6c6] mt-1">
              Current Session: <strong className="text-white font-semibold">{activeProfileName}</strong> ({activeProfileRole})
              &nbsp;&bull; Carrier SMS &amp; In-App Transport Active.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            kind="tertiary"
            size="sm"
            renderIcon={Radio}
            disabled={isLoadingCarrierLogs}
            onClick={fetchCarrierLogs}
          >
            {isLoadingCarrierLogs ? 'Loading Carrier...' : 'DLT Carrier Logs'}
          </Button>
          <Button
            kind="primary"
            size="sm"
            renderIcon={Renew}
            onClick={() => switchUser(activeUserId === '1' ? '2' : '1')}
          >
            Switch to {activeUserId === '1' ? 'Aarav (Guardian)' : 'Rajesh (Protected)'}
          </Button>
          <Button
            kind="danger"
            size="sm"
            renderIcon={Send}
            onClick={() => setIsDispatchModalOpen(true)}
          >
            Trigger Test Alert
          </Button>
        </div>
      </Tile>

      {/* Invitations and payment approvals addressed to current persona */}
      <GuardianInbox />

      {/* Page Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#e0e0e0] pb-4">
        <div>
          <h1 className="text-xl font-semibold text-[#161616] flex items-center gap-2">
            <UserMultiple size={22} className="text-[#0f62fe]" />
            Trusted Family Contacts ({contacts.length}/{MAX_TRUSTED_CONTACTS})
          </h1>
          <p className="text-sm text-[#525252] mt-1">
            Up to two guardians. Alerts, incident sharing and payment approvals need both your consent and the guardian's own acceptance.
          </p>
        </div>

        <Button
          kind="primary"
          size="md"
          renderIcon={UserFollow}
          onClick={openCreateModal}
          disabled={contacts.length >= MAX_TRUSTED_CONTACTS}
          title={contacts.length >= MAX_TRUSTED_CONTACTS ? 'Remove a guardian before adding another (maximum two).' : undefined}
        >
          {contacts.length >= MAX_TRUSTED_CONTACTS ? 'Maximum of 2 guardians reached' : 'Add Trusted Guardian'}
        </Button>
      </div>

      {/* Trusted Contacts Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {contacts.map((c) => (
          <Tile
            key={c.id}
            className={`bg-white border p-5 flex flex-col justify-between ${
              c.is_primary ? 'border-[#0f62fe] ring-1 ring-[#0f62fe]' : 'border-[#e0e0e0]'
            }`}
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-[#edf5ff] border border-[#d0e2ff] text-[#0f62fe] font-bold flex items-center justify-center text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#161616] text-sm flex items-center gap-1.5">
                      {c.name}
                      {c.is_primary && (
                        <Tag type="blue" size="sm">PRIMARY</Tag>
                      )}
                    </h3>
                    <span className="text-xs text-[#525252]">{c.relationship}</span>
                  </div>
                </div>

                {c.is_verified ? (
                  <Tag type="green" size="sm" className="font-semibold">
                    <CheckmarkFilled size={14} className="mr-1 inline" />
                    Verified
                  </Tag>
                ) : (
                  <Button
                    kind="ghost"
                    size="sm"
                    renderIcon={Password}
                    onClick={() => handleRequestVerification(c)}
                    title="Click to verify phone number via OTP"
                  >
                    Verify Now
                  </Button>
                )}
              </div>

              <div className="space-y-2 text-xs text-[#525252] py-3 border-y border-[#e0e0e0]">
                <div className="flex items-center gap-2">
                  <Phone size={14} className="text-[#8d8d8d]" />
                  <span className="font-mono text-[#161616]">{c.phone_number}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Email size={14} className="text-[#8d8d8d]" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[#525252]">Alert Threshold:</span>
                  <Tag type="cool-gray" size="sm">
                    {c.alert_level === 'CRITICAL_ONLY' ? 'Critical Scams Only' : c.alert_level === 'HIGH_RISK_ONLY' ? 'High & Critical' : 'All Scans'}
                  </Tag>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#525252]">Your consent:</span>
                  <Tag type={c.consent_granted ? 'green' : 'red'} size="sm">
                    {c.consent_granted ? 'Granted' : 'Not granted'}
                  </Tag>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#525252]">Guardian accepted:</span>
                  <Tag
                    type={
                      c.contact_consent_status === 'ACCEPTED'
                        ? 'green'
                        : c.contact_consent_status === 'DECLINED'
                        ? 'red'
                        : 'warm-gray'
                    }
                    size="sm"
                  >
                    {c.contact_consent_status === 'ACCEPTED' ? 'Accepted' : c.contact_consent_status === 'DECLINED' ? 'Declined' : 'Awaiting acceptance'}
                  </Tag>
                </div>
                <p className={`text-[11px] font-semibold ${isEligibleGuardian(c) ? 'text-[#0e6027]' : 'text-[#da1e28]'}`}>
                  {isEligibleGuardian(c) ? 'Receives alerts and approval requests.' : 'Alerts disabled until both consents are in place.'}
                </p>
                {c.contact_consent_status !== 'ACCEPTED' && (
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Button
                      kind="ghost"
                      size="sm"
                      onClick={() => handleSendInvite(c)}
                    >
                      {c.contact_consent_status === 'DECLINED' ? 'Re-send invitation' : 'Send invitation (demo)'}
                    </Button>
                    {inviteCodes[c.id] && (
                      <span className="font-mono text-[11px] font-bold text-[#161616] bg-[#f4f4f4] px-2 py-0.5 border border-[#e0e0e0]" title="Demo only: no SMS was sent">
                        {inviteCodes[c.id]}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2">
              <span className={`text-[10px] font-semibold flex items-center gap-1 ${c.is_active ? 'text-[#0e6027]' : 'text-[#8d8d8d]'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${c.is_active ? 'bg-[#24a148]' : 'bg-[#8d8d8d]'}`} />
                {c.is_active ? 'Active Shield' : 'Paused'}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  kind="ghost"
                  hasIconOnly
                  renderIcon={Edit}
                  iconDescription="Edit contact"
                  size="sm"
                  onClick={() => openEditModal(c)}
                />
                <Button
                  kind="danger--ghost"
                  hasIconOnly
                  renderIcon={TrashCan}
                  iconDescription="Delete contact"
                  size="sm"
                  onClick={() => setContactToDelete(c)}
                />
              </div>
            </div>
          </Tile>
        ))}
      </div>

      {contacts.length === 0 && (
        <EmptyState
          icon={<UserMultiple size={28} className="text-[#0f62fe]" />}
          title="No Trusted Guardians Configured"
          description="Add a family member (son, daughter, spouse) who should be alerted when you encounter high-risk digital arrest scams."
          actionText="Add First Guardian"
          onAction={openCreateModal}
        />
      )}

      {/* Dispatched Alerts History Table */}
      <Tile className="bg-white p-0 border border-[#e0e0e0] overflow-hidden">
        <div className="p-5 border-b border-[#e0e0e0] bg-[#f4f4f4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-[#161616] flex items-center gap-2">
              <WarningFilled size={18} className="text-[#da1e28]" />
              Safety Alerts Audit Trail
            </h2>
            <p className="text-xs text-[#525252] mt-0.5">
              Live delivery status, failure retries, and guardian acknowledgments.
            </p>
          </div>
          <Tag type="cool-gray" size="sm" className="font-mono">
            {alerts.length} record(s) logged
          </Tag>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs cds--data-table cds--data-table--compact">
            <thead className="bg-[#f4f4f4] text-[#525252] font-semibold border-b border-[#e0e0e0] uppercase tracking-wider text-[10px]">
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
            <tbody className="divide-y divide-[#e0e0e0] text-[#161616]">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-[#f4f4f4] transition-colors">
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#161616]">
                    {alert.incident_id ? (
                      <button
                        type="button"
                        onClick={() => navigate(`/incident-history?q=${encodeURIComponent(alert.incident_id!)}`)}
                        className="text-[#0f62fe] hover:underline cursor-pointer"
                        title="View Incident Dossier in Incident History"
                      >
                        {alert.incident_id}
                      </button>
                    ) : (
                      `SA-ALERT-${alert.id}`
                    )}
                  </td>
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-semibold text-[#161616] truncate">{alert.threat_title}</p>
                    <p className="text-[11px] text-[#525252] line-clamp-1 mt-0.5">{alert.message_content}</p>
                    {alert.recommended_action && (
                      <p className="text-[10px] text-[#b28600] font-medium mt-0.5">Action: {alert.recommended_action}</p>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <Tag
                      type={alert.risk_level === 'CRITICAL' ? 'red' : 'warm-gray'}
                      size="sm"
                    >
                      {alert.risk_level || 'HIGH'}
                    </Tag>
                  </td>
                  <td className="py-3.5 px-4 font-medium">
                    {alert.contact?.name || `Contact #${alert.contact_id}`}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-[#f4f4f4] text-[#525252] border border-[#e0e0e0]">
                      IN_APP_SIMULATION
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <Tag
                      type={
                        alert.status === 'ACKNOWLEDGED'
                          ? 'green'
                          : alert.status === 'DELIVERED'
                          ? 'blue'
                          : alert.status === 'FAILED'
                          ? 'red'
                          : 'warm-gray'
                      }
                      size="sm"
                    >
                      {alert.status}
                    </Tag>
                    {alert.acknowledged_by && (
                      <span className="block text-[9px] text-[#8d8d8d] mt-0.5">By: {alert.acknowledged_by}</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[#525252] text-[11px] whitespace-nowrap">
                    {new Date(alert.delivered_at).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {alert.status !== 'ACKNOWLEDGED' && (
                        <Button
                          kind="ghost"
                          size="sm"
                          onClick={() => handleAcknowledgeAlert(alert.id)}
                        >
                          Acknowledge
                        </Button>
                      )}
                      <Button
                        kind="ghost"
                        size="sm"
                        renderIcon={Renew}
                        disabled={isRetryingAlertId === alert.id}
                        onClick={() => handleRetryAlert(alert.id)}
                      >
                        Retry
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {alerts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#8d8d8d] text-xs">
                    No safety alerts dispatched yet. High-risk scan detections automatically trigger family notifications.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Tile>

      {/* OTP Verification Code Modal */}
      {verifyingContact && (
        <Modal
          open={!!verifyingContact}
          modalHeading="Verify Guardian Phone"
          primaryButtonText={isVerifying ? 'Verifying...' : 'Confirm Verification'}
          secondaryButtonText="Cancel"
          onRequestSubmit={handleConfirmVerification}
          onRequestClose={() => setVerifyingContact(null)}
          size="sm"
        >
          <div className="space-y-4 pt-2 text-xs">
            <p className="text-[#525252] leading-relaxed">
              Enter the 6-digit confirmation code dispatched to verify that <strong>{verifyingContact.name}</strong> ({verifyingContact.phone_number}) is reachable during emergencies.
            </p>

            {demoCodeHint && (
              <div className="p-3 bg-[#fef7e0] border border-[#f1c21b] text-xs text-[#483700] flex items-center justify-between">
                <span>In-App Demo Code: <strong className="font-mono text-sm tracking-widest">{demoCodeHint}</strong></span>
                <Button
                  kind="ghost"
                  size="sm"
                  onClick={() => setVerificationCodeInput(demoCodeHint)}
                >
                  Auto-Fill Code
                </Button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[#161616] mb-1.5">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                value={verificationCodeInput}
                onChange={(e) => setVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
                placeholder="e.g. 849201"
                className="w-full text-center text-xl font-mono tracking-widest py-2.5 px-3 border border-[#e0e0e0] focus:outline-none focus:border-[#0f62fe]"
                autoFocus
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Add / Edit Contact Modal */}
      {isModalOpen && (
        <Modal
          open={isModalOpen}
          modalHeading={editingContact ? 'Edit Trusted Guardian' : 'Add Trusted Guardian'}
          primaryButtonText={editingContact ? 'Save Changes' : 'Add Guardian'}
          secondaryButtonText="Cancel"
          onRequestSubmit={handleSubmitContact}
          onRequestClose={() => setIsModalOpen(false)}
          size="md"
        >
          <div className="space-y-4 pt-2 text-xs">
            <div>
              <label className="block text-xs font-semibold text-[#161616] mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Aarav Sharma"
                className="w-full py-2 px-3 text-sm border border-[#e0e0e0] focus:outline-none focus:border-[#0f62fe]"
              />
              {formErrors.name && <p className="text-[#da1e28] text-[11px] mt-1">{formErrors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#161616] mb-1">Relationship</label>
                <select
                  value={formData.relationship}
                  onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                  className="w-full py-2 px-3 text-sm border border-[#e0e0e0] focus:outline-none focus:border-[#0f62fe]"
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
                <label className="block text-xs font-semibold text-[#161616] mb-1">Phone Number</label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="+91 98101 23456"
                  className="w-full py-2 px-3 text-sm border border-[#e0e0e0] focus:outline-none focus:border-[#0f62fe]"
                />
                {formErrors.phone_number && <p className="text-[#da1e28] text-[11px] mt-1">{formErrors.phone_number}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#161616] mb-1">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="aarav@example.com"
                className="w-full py-2 px-3 text-sm border border-[#e0e0e0] focus:outline-none focus:border-[#0f62fe]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#161616] mb-1">Alert Threshold</label>
              <select
                value={formData.alert_level}
                onChange={(e) => setFormData({ ...formData, alert_level: e.target.value as AlertLevel })}
                className="w-full py-2 px-3 text-sm border border-[#e0e0e0] focus:outline-none focus:border-[#0f62fe]"
              >
                <option value="HIGH_RISK_ONLY">High Risk & Critical Scams Only (Recommended)</option>
                <option value="CRITICAL_ONLY">Critical Scams Only (Severe digital arrest)</option>
                <option value="ALL">All Analyzed Scams (Maximum surveillance)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-[#e0e0e0] space-y-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer p-2.5 border border-[#e0e0e0] bg-[#f4f4f4]">
                <input
                  type="checkbox"
                  checked={formData.consent_granted}
                  onChange={(e) => setFormData({ ...formData, consent_granted: e.target.checked })}
                  className="mt-0.5"
                />
                <div>
                  <span className="text-xs text-[#161616] font-semibold block">
                    Explicit Guardian Consent Authorization
                  </span>
                  <span className="text-[11px] text-[#525252] block mt-0.5 leading-relaxed">
                    I agree to share scam alerts and emergency incident dossiers with this guardian. Both sides must consent before data is transmitted.
                  </span>
                </div>
              </label>
              <label className="flex items-center gap-2 cursor-pointer px-1">
                <input
                  type="checkbox"
                  checked={formData.is_primary}
                  onChange={(e) => setFormData({ ...formData, is_primary: e.target.checked })}
                />
                <span className="text-xs text-[#161616] font-medium">
                  Mark as Primary Guardian (First to be contacted in emergency).
                </span>
              </label>
            </div>
          </div>
        </Modal>
      )}

      {/* Manual Test Dispatch Modal */}
      {isDispatchModalOpen && (
        <Modal
          open={isDispatchModalOpen}
          modalHeading="Trigger Test Alert Broadcast"
          primaryButtonText="Send In-App Broadcast"
          secondaryButtonText="Cancel"
          onRequestSubmit={handleDispatchTestAlert}
          onRequestClose={() => setIsDispatchModalOpen(false)}
          size="md"
        >
          <div className="space-y-4 pt-2 text-xs">
            <div>
              <label className="block text-xs font-semibold text-[#161616] mb-1">Threat Title</label>
              <input
                type="text"
                value={dispatchData.threat_title}
                onChange={(e) => setDispatchData({ ...dispatchData, threat_title: e.target.value })}
                className="w-full py-2 px-3 text-sm border border-[#e0e0e0] focus:outline-none focus:border-[#0f62fe]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#161616] mb-1">Message Content</label>
              <textarea
                rows={3}
                value={dispatchData.message_content}
                onChange={(e) => setDispatchData({ ...dispatchData, message_content: e.target.value })}
                className="w-full py-2 px-3 text-sm border border-[#e0e0e0] focus:outline-none focus:border-[#0f62fe]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#161616] mb-1">Recommended Action</label>
              <input
                type="text"
                value={dispatchData.recommended_action}
                onChange={(e) => setDispatchData({ ...dispatchData, recommended_action: e.target.value })}
                className="w-full py-2 px-3 text-sm border border-[#e0e0e0] focus:outline-none focus:border-[#0f62fe]"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Carrier Logs Modal */}
      {isCarrierModalOpen && (
        <Modal
          open={isCarrierModalOpen}
          modalHeading="DLT Carrier SMS Dispatch Logs"
          passiveModal
          onRequestClose={() => setIsCarrierModalOpen(false)}
          size="lg"
        >
          <div className="space-y-3 pt-2 text-xs">
            <p className="text-[#525252]">
              Carrier gateway telemetry and simulated telecom routing status:
            </p>
            <pre className="p-3 bg-[#161616] text-[#24a148] font-mono text-[11px] overflow-x-auto max-h-72">
              {JSON.stringify(carrierLogs, null, 2)}
            </pre>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {contactToDelete && (
        <ConfirmationModal
          isOpen={!!contactToDelete}
          title="Remove Trusted Guardian"
          message={`Are you sure you want to remove ${contactToDelete.name} from your Family Shield? They will no longer receive emergency alerts.`}
          confirmLabel="Remove Guardian"
          isDangerous
          onConfirm={handleDeleteContact}
          onCancel={() => setContactToDelete(null)}
        />
      )}
    </div>
  );
};
