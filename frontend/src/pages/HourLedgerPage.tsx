import React, { useEffect, useState, useMemo } from 'react';
import { 
  Clock, Plus, CheckCircle, XCircle, Edit3, Filter, 
  Calendar, AlertCircle, FileText, Check, X, ShieldAlert 
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';

export const HourLedgerPage: React.FC = () => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);

  // Rejection modal
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Correction modal
  const [correctingId, setCorrectingId] = useState<number | null>(null);
  const [correctionHours, setCorrectionHours] = useState('');
  const [correctionNotes, setCorrectionNotes] = useState('');

  // Form state
  const [participations, setParticipations] = useState<any[]>([]);
  const [selectedPartId, setSelectedPartId] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [breakMinutes, setBreakMinutes] = useState('30');
  const [formError, setFormError] = useState<string | null>(null);

  const user = getCurrentUser();
  const canReview = ['admin', 'approver'].includes(user?.role);
  const canSubmit = ['admin', 'coordinator'].includes(user?.role);
  const canCorrect = user?.role === 'admin';

  const loadEntries = async () => {
    try {
      setLoading(true);
      const res = await api.getHours();
      setEntries(res.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  useEffect(() => {
    if (showLogModal) {
      api.getParticipations().then(res => setParticipations(res.items || [])).catch(() => {});
    }
  }, [showLogModal]);

  // Calculated claimed duration preview
  const calculateDurationHours = () => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const diffMins = (eh * 60 + em) - (sh * 60 + sm) - (parseInt(breakMinutes) || 0);
    return Math.max(0, parseFloat((diffMins / 60.0).toFixed(2)));
  };

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!selectedPartId) {
      setFormError('Please select a student event assignment');
      return;
    }

    try {
      await api.submitHours({
        participation_id: parseInt(selectedPartId),
        work_date: workDate,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        break_minutes: parseInt(breakMinutes) || 0,
      });
      setShowLogModal(false);
      loadEntries();
    } catch (err: any) {
      setFormError(err.message || 'Submission failed');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approveHours(id);
      loadEntries();
    } catch (err: any) {
      alert(`Approval Failed: ${err.message}`);
    }
  };

  const handleReject = async () => {
    if (!rejectingId || !rejectionReason.trim()) {
      alert('A rejection reason is required.');
      return;
    }
    try {
      await api.rejectHours(rejectingId, rejectionReason.trim());
      setRejectingId(null);
      setRejectionReason('');
      loadEntries();
    } catch (err: any) {
      alert(`Rejection Failed: ${err.message}`);
    }
  };

  const handleCorrect = async () => {
    if (!correctingId || !correctionHours || !correctionNotes.trim()) {
      alert('New verified hours and correction notes are required.');
      return;
    }
    try {
      const mins = Math.round(parseFloat(correctionHours) * 60);
      await api.correctHours(correctingId, {
        verified_minutes: mins,
        correction_notes: correctionNotes.trim(),
      });
      setCorrectingId(null);
      setCorrectionHours('');
      setCorrectionNotes('');
      loadEntries();
    } catch (err: any) {
      alert(`Correction Failed: ${err.message}`);
    }
  };

  const pendingEntries = useMemo(() => {
    return entries.filter(e => (e.submission_status || '').trim().toLowerCase() === 'pending');
  }, [entries]);

  const filteredEntries = useMemo(() => {
    const norm = statusFilter.trim().toLowerCase();
    if (!norm) return entries;
    return entries.filter(e => (e.submission_status || '').trim().toLowerCase() === norm);
  }, [entries, statusFilter]);

  const statusOptions = [
    { id: '', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'corrected', label: 'Corrected' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Volunteer Hour Ledger
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Record, verify, and audit individual time entries contributing to certified totals
          </p>
        </div>

        {canSubmit && (
          <button
            onClick={() => setShowLogModal(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Log Volunteer Hours</span>
          </button>
        )}
      </div>

      {/* Pending Approval Callout (For Approvers) */}
      {canReview && pendingEntries.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Pending Review Queue ({pendingEntries.length} Items Awaiting Verification)</span>
          </div>
          <div className="space-y-2">
            {pendingEntries.slice(0, 3).map(pe => (
              <div key={pe.hour_entry_id} className="bg-white p-3 rounded-lg border border-amber-200 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-slate-900">{pe.student_name}</span>
                  <span className="text-slate-500 mx-1.5">•</span>
                  <span className="text-blue-700 font-semibold">{pe.event_name}</span>
                  <span className="text-slate-500 mx-1.5">•</span>
                  <span className="text-slate-600">{pe.work_date} ({pe.claimed_hours} hrs)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleApprove(pe.hour_entry_id)}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <Check className="w-3 h-3" /> Approve
                  </button>
                  <button
                    onClick={() => setRejectingId(pe.hour_entry_id)}
                    className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1 text-[11px]"
                  >
                    <X className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700 uppercase">Filter Status:</span>
          <div className="flex gap-1.5">
            {statusOptions.map(st => {
              const isActive = statusFilter.toLowerCase() === st.id.toLowerCase();
              return (
                <button
                  key={st.id}
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/30'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredEntries.length} {statusFilter ? `(${statusFilter})` : ''} of {entries.length} Ledger Records
        </span>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading hours ledger...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-semibold text-slate-700">
              {statusFilter
                ? `No records found for "${statusFilter}" status`
                : 'No Volunteer Hour Entries Found'}
            </p>
            {statusFilter && (
              <button
                onClick={() => setStatusFilter('')}
                className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-semibold"
              >
                Clear filter to show all records
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Event</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Interval</th>
                  <th className="py-3 px-3 text-center">Break</th>
                  <th className="py-3 px-3 text-center">Claimed</th>
                  <th className="py-3 px-3 text-center">Verified</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Review Notes / Reason</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map(row => {
                  const statusNorm = (row.submission_status || '').trim().toLowerCase();
                  const isApproved = statusNorm === 'approved';
                  const isCorrected = statusNorm === 'corrected';
                  const isRejected = statusNorm === 'rejected';
                  const isPending = statusNorm === 'pending';

                  return (
                    <tr key={row.hour_entry_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{row.student_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{row.registration_number}</p>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        {row.event_name}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {row.work_date}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-mono">
                        {row.start_time?.slice(0, 5)} – {row.end_time?.slice(0, 5)}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-500">
                        {row.break_minutes}m
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                        {row.claimed_hours}h
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-blue-900">
                        {row.verified_hours > 0 ? `${row.verified_hours}h` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isApproved || isCorrected
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : isPending
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {row.submission_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={row.rejection_reason || row.correction_notes}>
                        {row.rejection_reason ? (
                          <span className="text-rose-700">Rejection: {row.rejection_reason}</span>
                        ) : row.correction_notes ? (
                          <span className="text-purple-700">Audit: {row.correction_notes}</span>
                        ) : row.reviewed_by_name ? (
                          <span className="text-slate-500">Reviewed by {row.reviewed_by_name}</span>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && canReview && (
                            <>
                              <button
                                onClick={() => handleApprove(row.hour_entry_id)}
                                title="Approve Entry"
                                className="p-1 rounded text-emerald-600 hover:bg-emerald-50"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setRejectingId(row.hour_entry_id)}
                                title="Reject Entry"
                                className="p-1 rounded text-rose-600 hover:bg-rose-50"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {canCorrect && (
                            <button
                              onClick={() => {
                                setCorrectingId(row.hour_entry_id);
                                setCorrectionHours(row.verified_hours.toString());
                              }}
                              title="Audit / Correct"
                              className="p-1 rounded text-slate-500 hover:text-purple-700 hover:bg-purple-50"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Hours Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Log Volunteer Service Entry</h3>
            <p className="text-xs text-slate-500 mb-4">Record hours for an event volunteer</p>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg mb-4">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateEntry} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Student & Event Assignment</label>
                <select
                  required
                  value={selectedPartId}
                  onChange={(e) => setSelectedPartId(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none bg-white font-medium"
                >
                  <option value="">Select student registration...</option>
                  {participations.map(p => (
                    <option key={p.participation_id} value={p.participation_id}>
                      {p.student_name} (#{p.registration_number}) — {p.event_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Date</label>
                  <input
                    type="date"
                    required
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Break (Minutes)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-blue-900 font-semibold">
                <span>Calculated Claimed Duration:</span>
                <span className="text-sm font-bold">{calculateDurationHours()} Hours</span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-md"
                >
                  Submit Hours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
              Mandatory Rejection Reason
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Institutional policy requires documenting a reason before rejecting student hours.
            </p>

            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Absence reported during event session by faculty coordinator..."
              className="w-full p-3 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 mb-4"
            ></textarea>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectingId(null)}
                className="px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-3.5 py-1.5 text-xs bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Correction Modal */}
      {correctingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2 text-purple-800">
              <Edit3 className="w-5 h-5" />
              Administrative Hour Correction
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Audited correction requires specifying verified hours and an audit rationale.
            </p>

            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Verified Hours</label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  required
                  value={correctionHours}
                  onChange={(e) => setCorrectionHours(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Audit Correction Notes</label>
                <textarea
                  required
                  rows={3}
                  value={correctionNotes}
                  onChange={(e) => setCorrectionNotes(e.target.value)}
                  placeholder="e.g. Adjusted to deduct unscheduled absence confirmed by attendance log..."
                  className="w-full p-2 text-xs border border-slate-300 rounded-lg outline-none"
                ></textarea>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCorrectingId(null)}
                className="px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCorrect}
                className="px-3.5 py-1.5 text-xs bg-purple-700 text-white rounded-lg font-semibold hover:bg-purple-800"
              >
                Commit Audited Correction
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
