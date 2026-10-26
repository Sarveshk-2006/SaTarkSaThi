import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  History,
  Search,
  Filter,
  FileText,
  Trash2,
  ExternalLink,
  LifeBuoy,
  CheckCircle,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  X,
  Calendar,
  Building2,
  FileDown,
  RotateCcw,
  CheckCircle2,
  AlertOctagon,
  Eye,
} from 'lucide-react';
import { api } from '../api/endpoints';
import { Incident, IncidentStatus, AuditEvent } from '../api/types';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useToast } from '../context/ToastContext';
import { useNotification } from '../context/NotificationContext';

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
      {/* Page Title */}
      <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-[#176B58]" />
            Incident History &amp; Audit Ledger
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete database records of detected scam attempts, family notifications, and recovery filings.
          </p>
        </div>

        <button
          onClick={() => navigate('/golden-hour')}
          className="px-4 py-2 rounded-xl bg-[#176B58] hover:bg-[#125243] text-white font-semibold text-xs flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto transition-colors"
        >
          <LifeBuoy className="w-4 h-4" />
          New Recovery Case
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Query */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ID (SA-...), title, bank, or UTR..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58] font-mono"
            />
          </div>

          {/* Scam Type Filter */}
          <div className="md:col-span-3">
            <select
              value={scamTypeFilter}
              onChange={(e) => setScamTypeFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
            >
              <option value="">All Scam Categories</option>
              <option value="Digital Arrest / Police Impersonation Fraud">Digital Arrest Fraud</option>
              <option value="Utility Impersonation Phishing">Electricity Bill Threat</option>
              <option value="Part-Time Job / Telegram Task Fraud">Telegram Task Fraud</option>
              <option value="Fake Investment Scheme">Investment Ponzi</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="md:col-span-2">
            <select
              value={riskLevelFilter}
              onChange={(e) => setRiskLevelFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
            >
              <option value="">All Risk Levels</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#176B58]"
            >
              <option value="">All Statuses</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="REPORTED_1930">Reported 1930</option>
              <option value="BANK_FREEZE_REQUESTED">Bank Freeze Requested</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {(searchQuery || scamTypeFilter || riskLevelFilter || statusFilter) && (
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
            <span className="text-slate-500">Filtered view active</span>
            <button
              onClick={resetFilters}
              className="text-[#176B58] font-semibold hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Main Grid: Incident List & Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Incident Table / List */}
        <div className={`${selectedIncident ? 'lg:col-span-7' : 'lg:col-span-12'} bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all`}>
          {loading ? (
            <div className="p-6">
              <LoadingSkeleton rows={4} />
            </div>
          ) : incidents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Incident ID</th>
                    <th className="py-3 px-4">Title / Category</th>
                    <th className="py-3 px-4">Risk Level</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Recorded Date</th>
                    <th className="py-3 px-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incidents.map((inc) => (
                    <tr
                      key={inc.id}
                      onClick={() => handleSelectIncident(inc)}
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                        selectedIncident?.id === inc.id ? 'bg-teal-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inc.incident_id}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-semibold text-slate-900 truncate">{inc.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">{inc.scam_type}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800' : inc.risk_level === 'HIGH' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {inc.risk_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ₹{inc.financial_loss.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          inc.status === 'BANK_FREEZE_REQUESTED'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : inc.status === 'REPORTED_1930'
                            ? 'bg-blue-100 text-blue-900 border border-blue-300'
                            : inc.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {inc.status === 'BANK_FREEZE_REQUESTED' ? '⚡ LIEN MARKED' : inc.status === 'REPORTED_1930' ? '1930 FILED' : inc.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(inc.created_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <ChevronRight className="w-4 h-4 text-slate-400 inline" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<History className="w-6 h-6 text-teal-700" />}
                title="No Incidents Match Search"
                description="No scam incidents found matching the specified search criteria or date filters."
                actionText="Clear Filters"
                onAction={resetFilters}
              />
            </div>
          )}
        </div>

        {/* Incident Detail Drawer / Panel */}
        {selectedIncident && (
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#176B58] bg-[#DCEDE5] px-2 py-0.5 rounded border border-teal-200">
                    {selectedIncident.incident_id}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedIncident.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {selectedIncident.risk_level} RISK
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 mt-1">
                  {selectedIncident.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Incident Summary Parameters */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block">Reported Loss:</span>
                <span className="font-mono font-bold text-slate-900 text-sm">₹{selectedIncident.financial_loss.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Bank / Payment App:</span>
                <span className="font-bold text-slate-800">{selectedIncident.bank_name || 'Not specified'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Transaction Reference:</span>
                <span className="font-mono text-slate-800">{selectedIncident.transaction_ref || '[UTR Pending Statement]'}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Suspect Identifier:</span>
                <span className="font-mono text-slate-800">{selectedIncident.suspect_contact || 'Unknown'}</span>
              </div>
            </div>

            {/* Narrative */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Statement of Facts
              </h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                {selectedIncident.description}
              </p>
            </div>

            {/* Quick Link to Golden Hour Recovery */}
            <div>
              <button
                type="button"
                onClick={() => navigate(`/golden-hour?incident_id=${encodeURIComponent(selectedIncident.incident_id)}`)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#176B58] hover:bg-[#125243] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <LifeBuoy className="w-4 h-4 text-amber-400" />
                Open Golden Hour Recovery Desk for this Case &rarr;
              </button>
            </div>

            {/* Recovery Progress & Status Controller */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Recovery Progress Status
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {(['UNDER_REVIEW', 'REPORTED_1930', 'BANK_FREEZE_REQUESTED', 'RESOLVED'] as IncidentStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedIncident.incident_id, st)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      selectedIncident.status === st
                        ? 'bg-[#176B58] text-white border-[#176B58] shadow-xs'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
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
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Audit Events Trail ({auditEvents.length})
                </h4>
                <button
                  type="button"
                  onClick={handleExportAuditJson}
                  className="text-xs text-[#176B58] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Export JSON
                </button>
              </div>

              {loadingAudit ? (
                <LoadingSkeleton rows={2} />
              ) : auditEvents.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {auditEvents.map((ev) => (
                    <div key={ev.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-[11px]">{ev.event_type}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 text-[11px]">{ev.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No individual audit logs recorded yet.</p>
              )}
            </div>

            {/* Destructive Action */}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setIncidentToDelete(selectedIncident)}
                className="text-xs font-semibold text-rose-700 hover:text-rose-900 flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                Delete Incident Record
              </button>
              <button
                type="button"
                onClick={() => navigate('/golden-hour', { state: { classification: selectedIncident.scam_type, summary: selectedIncident.description } })}
                className="text-xs font-semibold text-[#176B58] hover:text-[#125243] flex items-center gap-1 cursor-pointer"
              >
                Draft Complaint Dossier &rarr;
              </button>
            </div>
          </div>
        )}
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
