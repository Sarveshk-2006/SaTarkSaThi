import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Time,
  Search,
  Filter,
  TrashCan,
  Launch,
  Help,
  DocumentDownload,
  Close,
  ChevronRight,
  ArrowRight,
  Document,
  Information,
} from '@carbon/icons-react';
import {
  Tile,
  Button,
  Tag,
  TextInput,
  Select,
  SelectItem,
} from '@carbon/react';
import { api } from '../api/endpoints';
import { Incident, IncidentStatus, AuditEvent } from '../api/types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';

export const IncidentHistoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { activeUserId } = useNotification();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('search') || '');
  const [scamTypeFilter, setScamTypeFilter] = useState('');
  const [riskLevelFilter, setRiskLevelFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Detail Drawer
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [incidentToDelete, setIncidentToDelete] = useState<Incident | null>(null);

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    if (q && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const data = await api.getIncidents({
        search: searchQuery.trim() || undefined,
        scam_type: scamTypeFilter || undefined,
        risk_level: riskLevelFilter || undefined,
        status: statusFilter || undefined,
      });
      setIncidents(data);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Failed to load incidents', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [searchQuery, scamTypeFilter, riskLevelFilter, statusFilter, activeUserId]);

  const handleSelectIncident = async (inc: Incident) => {
    setSelectedIncident(inc);
    setLoadingAudit(true);
    try {
      const audits = await api.getIncidentAudit(inc.incident_id);
      setAuditEvents(audits);
    } catch (err) {
      setAuditEvents([]);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleUpdateStatus = async (incidentId: string | number, newStatus: IncidentStatus) => {
    try {
      await api.updateIncident(incidentId, { status: newStatus });
      showToast({ type: 'success', title: 'Status Updated', message: `Marked as ${newStatus}` });
      fetchIncidents();
      if (selectedIncident) {
        setSelectedIncident({ ...selectedIncident, status: newStatus });
      }
    } catch (err: any) {
      showToast({ type: 'error', title: 'Update failed', message: err.message });
    }
  };

  const handleDeleteIncident = async () => {
    if (!incidentToDelete) return;
    try {
      await api.deleteIncident(incidentToDelete.incident_id);
      showToast({ type: 'success', title: 'Incident Deleted' });
      setIncidentToDelete(null);
      setSelectedIncident(null);
      fetchIncidents();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Delete failed', message: err.message });
    }
  };

  const handleExportAuditJson = () => {
    if (!selectedIncident) return;
    const exportData = {
      incident: selectedIncident,
      audit_events: auditEvents,
      exported_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident_audit_${selectedIncident.incident_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setScamTypeFilter('');
    setRiskLevelFilter('');
    setStatusFilter('');
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Action */}
      <div className="border-b border-[#e0e0e0] pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-[#161616] flex items-center gap-2">
            <Time size={22} className="text-[#0f62fe]" />
            Incident History &amp; Audit Ledger
          </h1>
          <p className="text-sm text-[#525252] mt-1">
            Complete database records of detected scam attempts, family notifications, and recovery filings.
          </p>
        </div>

        <Button
          kind="primary"
          size="md"
          renderIcon={Help}
          onClick={() => navigate('/golden-hour')}
        >
          New Recovery Case
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Tile className="p-4 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Query */}
          <div className="md:col-span-5">
            <TextInput
              id="search-incidents"
              labelText="Search Records"
              hideLabel
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (SA-...), title, bank, or UTR..."
            />
          </div>

          {/* Scam Type Filter */}
          <div className="md:col-span-3">
            <Select
              id="filter-scam-type"
              labelText="Scam Category"
              hideLabel
              value={scamTypeFilter}
              onChange={(e) => setScamTypeFilter(e.target.value)}
            >
              <SelectItem value="" text="All Scam Categories" />
              <SelectItem value="Digital Arrest / Police Impersonation Fraud" text="Digital Arrest Fraud" />
              <SelectItem value="Utility Impersonation Phishing" text="Electricity Bill Threat" />
              <SelectItem value="Part-Time Job / Telegram Task Fraud" text="Telegram Task Fraud" />
              <SelectItem value="Fake Investment Scheme" text="Investment Ponzi" />
            </Select>
          </div>

          {/* Risk Level Filter */}
          <div className="md:col-span-2">
            <Select
              id="filter-risk-level"
              labelText="Risk Level"
              hideLabel
              value={riskLevelFilter}
              onChange={(e) => setRiskLevelFilter(e.target.value)}
            >
              <SelectItem value="" text="All Risk Levels" />
              <SelectItem value="CRITICAL" text="Critical" />
              <SelectItem value="HIGH" text="High" />
              <SelectItem value="MEDIUM" text="Medium" />
              <SelectItem value="LOW" text="Low" />
            </Select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <Select
              id="filter-status"
              labelText="Status"
              hideLabel
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <SelectItem value="" text="All Statuses" />
              <SelectItem value="UNDER_REVIEW" text="Under Review" />
              <SelectItem value="REPORTED_1930" text="Reported 1930" />
              <SelectItem value="BANK_FREEZE_REQUESTED" text="Bank Freeze Requested" />
              <SelectItem value="RESOLVED" text="Resolved" />
            </Select>
          </div>
        </div>

        {(searchQuery || scamTypeFilter || riskLevelFilter || statusFilter) && (
          <div className="flex items-center justify-between pt-2 border-t border-[#e0e0e0] text-xs">
            <span className="text-[#525252]">Filtered view active</span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-[#0f62fe] font-semibold hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </Tile>

      {/* Main Grid: Incident List & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Incident Table / List */}
        <div className={`${selectedIncident ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white border border-[#e0e0e0] shadow-sm transition-all`}>
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : incidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[#161616]">
                <thead className="bg-[#f4f4f4] text-[#525252] font-semibold border-b border-[#e0e0e0] uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Incident ID</th>
                    <th className="py-3 px-4">Title / Category</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Recorded Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e0e0e0]">
                  {incidents.map((inc, idx) => (
                    <motion.tr
                      key={inc.id}
                      initial={{ opacity: 0, y: 3 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15, delay: idx * 0.03 }}
                      onClick={() => handleSelectIncident(inc)}
                      className={`hover:bg-[#f4f4f4] transition-colors cursor-pointer ${
                        selectedIncident?.id === inc.id ? 'bg-[#edf5ff]' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-semibold text-[#161616]">
                        {inc.incident_id}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-[#161616] truncate">{inc.title}</p>
                        <p className="text-[11px] text-[#525252] truncate">{inc.scam_type}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Tag
                          type={
                            inc.risk_level === 'CRITICAL'
                              ? 'red'
                              : inc.risk_level === 'HIGH'
                              ? 'magenta'
                              : 'warm-gray'
                          }
                          size="sm"
                        >
                          {inc.risk_level}
                        </Tag>
                      </td>
                      <td className="py-3 px-4 font-mono font-semibold text-[#161616]">
                        ₹{inc.financial_loss.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Tag
                          type={
                            inc.status === 'BANK_FREEZE_REQUESTED'
                              ? 'teal'
                              : inc.status === 'REPORTED_1930'
                              ? 'blue'
                              : inc.status === 'RESOLVED'
                              ? 'green'
                              : 'gray'
                          }
                          size="sm"
                        >
                          {inc.status === 'BANK_FREEZE_REQUESTED'
                            ? 'LIEN MARKED'
                            : inc.status === 'REPORTED_1930'
                            ? '1930 FILED'
                            : inc.status.replace(/_/g, ' ')}
                        </Tag>
                      </td>
                      <td className="py-3 px-4 text-[#525252] text-[11px] whitespace-nowrap">
                        {new Date(inc.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ChevronRight size={16} className="text-[#8d8d8d] inline" />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<Time size={24} className="text-[#0f62fe]" />}
                title="No Incidents Match Search"
                description="No scam incidents found matching the specified search criteria or date filters."
                actionText="Clear Filters"
                onAction={resetFilters}
              />
            </div>
          )}
        </div>

        {/* Incident Detail Drawer / Panel */}
        <AnimatePresence>
          {selectedIncident && (
            <motion.div
              key={selectedIncident.incident_id}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2 }}
              className="lg:col-span-5"
            >
              <Tile className="shadow-sm p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-[#e0e0e0] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Tag type="teal" size="sm">
                    {selectedIncident.incident_id}
                  </Tag>
                  <Tag
                    type={selectedIncident.risk_level === 'CRITICAL' ? 'red' : 'magenta'}
                    size="sm"
                  >
                    {selectedIncident.risk_level} RISK
                  </Tag>
                </div>
                <h3 className="font-semibold text-base text-[#161616] mt-1">
                  {selectedIncident.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedIncident(null)}
                className="text-[#525252] hover:text-[#161616] p-1 cursor-pointer"
                title="Close drawer"
              >
                <Close size={20} />
              </button>
            </div>

            {/* Incident Summary Parameters */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#f4f4f4] p-4 border border-[#e0e0e0]">
              <div>
                <span className="text-[#525252] block">Reported Loss:</span>
                <span className="font-mono font-bold text-[#161616] text-sm">
                  ₹{selectedIncident.financial_loss.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[#525252] block">Bank / Payment App:</span>
                <span className="font-semibold text-[#161616]">
                  {selectedIncident.bank_name || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-[#525252] block">Transaction Reference:</span>
                <span className="font-mono text-[#161616]">
                  {selectedIncident.transaction_ref || '[UTR Pending Statement]'}
                </span>
              </div>
              <div>
                <span className="text-[#525252] block">Suspect Identifier:</span>
                <span className="font-mono text-[#161616]">
                  {selectedIncident.suspect_contact || 'Unknown'}
                </span>
              </div>
            </div>

            {/* Narrative */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#525252] mb-1.5">
                Statement of Facts
              </h4>
              <p className="text-xs text-[#161616] bg-[#f4f4f4] p-3 border border-[#e0e0e0] leading-relaxed">
                {selectedIncident.description}
              </p>
            </div>

            {/* Quick Link to Golden Hour Recovery */}
            <div>
              <Button
                kind="primary"
                renderIcon={ArrowRight}
                className="w-full"
                onClick={() => navigate(`/golden-hour?incident_id=${encodeURIComponent(selectedIncident.incident_id)}`)}
              >
                Open Golden Hour Recovery Desk for this Case
              </Button>
            </div>

            {/* Recovery Progress & Status Controller */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#525252] mb-2">
                Recovery Progress Status
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {(['UNDER_REVIEW', 'REPORTED_1930', 'BANK_FREEZE_REQUESTED', 'RESOLVED'] as IncidentStatus[]).map((st) => (
                  <button
                    type="button"
                    key={st}
                    onClick={() => handleUpdateStatus(selectedIncident.incident_id, st)}
                    className={`py-2 px-2.5 text-xs font-semibold border text-center transition-all cursor-pointer ${
                      selectedIncident.status === st
                        ? 'bg-[#0f62fe] text-white border-[#0f62fe]'
                        : 'border-[#e0e0e0] text-[#525252] hover:bg-[#f4f4f4]'
                    }`}
                  >
                    {st.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Chronological Audit Trail from Database */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#525252]">
                  Audit Events Trail ({auditEvents.length})
                </h4>
                <button
                  type="button"
                  onClick={handleExportAuditJson}
                  className="text-xs text-[#0f62fe] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <DocumentDownload size={14} />
                  Export JSON
                </button>
              </div>

              {loadingAudit ? (
                <LoadingSkeleton rows={2} />
              ) : auditEvents.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {auditEvents.map((ev) => (
                    <div key={ev.id} className="p-2.5 bg-[#f4f4f4] border border-[#e0e0e0] text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#161616] text-[11px]">{ev.event_type}</span>
                        <span className="text-[10px] text-[#525252] font-mono">
                          {new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[#525252] mt-0.5 text-[11px]">{ev.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#8d8d8d] italic">No individual audit logs recorded yet.</p>
              )}
            </div>

            {/* Destructive Action */}
            <div className="pt-3 border-t border-[#e0e0e0] flex justify-between items-center">
              <Button
                kind="danger--ghost"
                size="sm"
                renderIcon={TrashCan}
                onClick={() => setIncidentToDelete(selectedIncident)}
              >
                Delete Incident Record
              </Button>
              <Button
                kind="ghost"
                size="sm"
                renderIcon={ArrowRight}
                onClick={() =>
                  navigate('/golden-hour', {
                    state: {
                      classification: selectedIncident.scam_type,
                      summary: selectedIncident.description,
                    },
                  })
                }
              >
                Draft Complaint Dossier
              </Button>
            </div>
          </Tile>
        </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(incidentToDelete)}
        title="Delete Incident Record?"
        message={`Are you sure you want to permanently delete incident ${incidentToDelete?.incident_id}? This action cannot be undone.`}
        confirmLabel="Delete Record"
        isDangerous={true}
        onConfirm={handleDeleteIncident}
        onCancel={() => setIncidentToDelete(null)}
      />
    </div>
  );
};
