import React, { useEffect, useState, useMemo } from 'react';
import { 
  FileSpreadsheet, Download, Printer, Search, Filter, 
  CheckCircle2, XCircle, Clock, Award, ShieldAlert, RefreshCw, 
  ChevronDown, ExternalLink, HelpCircle
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';

export const EligibilityReportPage: React.FC = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);

  // Filter state
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [programme, setProgramme] = useState('');
  const [status, setStatus] = useState('');
  const [eventId, setEventId] = useState('');
  const [clubId, setClubId] = useState('');
  const [minHours, setMinHours] = useState('');

  // Issuing state
  const [issuingStudentId, setIssuingStudentId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const user = getCurrentUser();
  const canIssue = ['admin', 'approver'].includes(user?.role);

  // Debounce search text (300ms) to ensure smooth typing while maintaining live updates
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      const cleanSearch = (debouncedSearch || '').trim();
      if (cleanSearch) params.search = cleanSearch;
      if (academicYear) params.academic_year = academicYear;
      if (programme) params.programme = programme;
      if (status) params.status = status;
      if (eventId) params.event_id = eventId;
      if (clubId) params.club_id = clubId;
      if (minHours) params.min_hours = minHours;

      const data = await api.getCertificateEligibilityReport(params);
      setReportData(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadMeta() {
      try {
        const [evRes, clRes] = await Promise.all([
          api.getEvents(),
          api.getClubs(),
        ]);
        setEvents(evRes.items || []);
        setClubs(clRes.items || []);
      } catch (e) {}
    }
    loadMeta();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [debouncedSearch, academicYear, programme, status, eventId, clubId, minHours]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(search);
  };

  const handleResetFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setAcademicYear('');
    setProgramme('');
    setStatus('');
    setEventId('');
    setClubId('');
    setMinHours('');
  };

  const handleExportCSV = () => {
    const headers = [
      'Registration Number',
      'Student Name',
      'Programme',
      'Academic Year',
      'Approved Hours',
      'Pending Hours',
      'Events Count',
      'Threshold (Hours)',
      'Remaining Hours',
      'Eligibility Status',
      'Certificate Number',
      'Issued Date',
    ];

    const rows = items.map((x: any) => [
      `"${x.university_registration_number || ''}"`,
      `"${(x.student_name || '').replace(/"/g, '""')}"`,
      `"${(x.programme || '').replace(/"/g, '""')}"`,
      `"${x.academic_year || ''}"`,
      x.total_approved_hours ?? 0,
      x.total_pending_hours ?? 0,
      x.approved_events_count ?? 0,
      x.threshold_hours ?? 20,
      x.remaining_hours ?? 0,
      `"${x.eligibility_state || ''}"`,
      `"${x.certificate_number || 'N/A'}"`,
      `"${x.certificate_issued_at ? x.certificate_issued_at.slice(0, 10) : 'N/A'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `certificate_eligibility_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleIssueCertificate = async (studentId: number) => {
    if (!confirm('Are you sure you want to authorize and issue this certificate?')) return;
    try {
      setIssuingStudentId(studentId);
      setActionMessage(null);
      const res = await api.issueCertificate(studentId);
      setActionMessage(res.message || 'Certificate successfully issued');
      await fetchReport();
    } catch (err: any) {
      alert(`Certificate Issuance Failed: ${err.message}`);
    } finally {
      setIssuingStudentId(null);
    }
  };

  const rawItems = reportData?.items || [];

  // Instant multi-criteria displayed items computation
  const displayedItems = useMemo(() => {
    let result = rawItems;

    const cleanSearch = (search || '').trim().toLowerCase();
    if (cleanSearch) {
      result = result.filter((x: any) =>
        (x.student_name || '').toLowerCase().includes(cleanSearch) ||
        (x.university_registration_number || '').toLowerCase().includes(cleanSearch)
      );
    }
    if (academicYear) {
      result = result.filter((x: any) => x.academic_year === academicYear);
    }
    if (programme) {
      result = result.filter((x: any) => (x.programme || '').trim().toLowerCase() === programme.trim().toLowerCase());
    }
    if (status) {
      const sClean = status.trim().toLowerCase();
      result = result.filter((x: any) => {
        const itemState = (x.eligibility_state || '').trim().toLowerCase();
        if (sClean === 'eligible') {
          return itemState.startsWith('eligible') || itemState === 'certificate issued';
        }
        if (sClean === 'pending' || sClean === 'pending hours review') {
          return itemState === 'pending hours review';
        }
        if (sClean === 'not eligible' || sClean === 'ineligible') {
          return itemState === 'not eligible';
        }
        if (sClean === 'certificate issued' || sClean === 'issued') {
          return itemState === 'certificate issued';
        }
        if (sClean === 'certificate revoked' || sClean === 'revoked') {
          return itemState === 'certificate revoked';
        }
        return itemState === sClean;
      });
    }
    if (minHours) {
      const mh = parseFloat(minHours);
      if (!isNaN(mh)) {
        result = result.filter((x: any) => (x.total_approved_hours || 0) >= mh);
      }
    }
    return result;
  }, [rawItems, search, academicYear, programme, status, minHours]);

  const items = displayedItems;

  const summary = useMemo(() => {
    return {
      total_students: displayedItems.length,
      eligible_count: displayedItems.filter((x: any) => ((x.eligibility_state || '').startsWith('Eligible') || x.eligibility_state === 'Certificate Issued')).length,
      ineligible_count: displayedItems.filter((x: any) => x.eligibility_state === 'Not Eligible').length,
      pending_review_count: displayedItems.filter((x: any) => x.eligibility_state === 'Pending Hours Review').length,
      issued_count: displayedItems.filter((x: any) => x.eligibility_state === 'Certificate Issued').length,
    };
  }, [displayedItems]);

  const metadata = reportData?.report_metadata;

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-gold-100 text-gold-800 font-bold">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Certificate Eligibility Report
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Authoritative verification of student volunteer service hours against threshold criteria
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 no-print">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Summary KPI Cards with Click-to-Filter */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={() => handleResetFilters()}
          title="Click to view all volunteers"
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            !status && !search && !academicYear && !programme && !eventId && !clubId && !minHours
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-400/20 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Filtered Volunteers</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{summary.total_students}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatus(status === 'eligible' ? '' : 'eligible')}
          title="Click to toggle filter for all eligible students (met 20h)"
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            status === 'eligible'
              ? 'bg-emerald-100/70 border-emerald-500 ring-2 ring-emerald-400/30 shadow-sm'
              : 'bg-white border-emerald-200 bg-emerald-50/20 hover:border-emerald-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Eligible</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-bold text-emerald-900 mt-0.5">{summary.eligible_count}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatus(status === 'Pending Hours Review' ? '' : 'Pending Hours Review')}
          title="Click to toggle filter for Pending Hours Review"
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            status === 'Pending Hours Review'
              ? 'bg-amber-100/70 border-amber-500 ring-2 ring-amber-400/30 shadow-sm'
              : 'bg-white border-amber-200 bg-amber-50/20 hover:border-amber-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Pending Review</p>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-bold text-amber-900 mt-0.5">{summary.pending_review_count}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatus(status === 'Not Eligible' ? '' : 'Not Eligible')}
          title="Click to toggle filter for Not Eligible"
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
            status === 'Not Eligible'
              ? 'bg-slate-200/80 border-slate-500 ring-2 ring-slate-400/30 shadow-sm'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Not Eligible</p>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xl font-bold text-slate-700 mt-0.5">{summary.ineligible_count}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatus(status === 'Certificate Issued' ? '' : 'Certificate Issued')}
          title="Click to toggle filter for Certificate Issued"
          className={`p-3.5 rounded-xl border text-left transition cursor-pointer col-span-2 md:col-span-1 ${
            status === 'Certificate Issued'
              ? 'bg-gold-100/90 border-gold-500 ring-2 ring-gold-400/30 shadow-sm'
              : 'bg-white border-gold-200 bg-gold-50/20 hover:border-gold-300 shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-gold-800 uppercase tracking-wider">Certs Issued</p>
            <Award className="w-4 h-4 text-gold-600" />
          </div>
          <p className="text-xl font-bold text-gold-950 mt-0.5">{summary.issued_count}</p>
        </button>
      </div>

      {/* Filter Toolbar Card (Hidden in print) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 no-print">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Multi-Criteria Filters</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Reset Filters
          </button>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Search Student</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Name or Reg. Number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Academic Year</label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">All Years</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2024-2025">2024-2025</option>
            </select>
          </div>

          {/* Programme */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Programme</label>
            <select
              value={programme}
              onChange={(e) => setProgramme(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">All Programmes</option>
              <option value="B.Sc Data Science">B.Sc Data Science</option>
              <option value="BCA">BCA</option>
              <option value="B.Sc Computer Science">B.Sc Computer Science</option>
              <option value="M.Sc Data Science">M.Sc Data Science</option>
              <option value="M.Sc Computer Science">M.Sc Computer Science</option>
            </select>
          </div>

          {/* Event Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Event</label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">All Events</option>
              {events.map((ev: any) => (
                <option key={ev.event_id} value={ev.event_id}>{ev.event_name}</option>
              ))}
            </select>
          </div>

          {/* Sub-club Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Sub-club</label>
            <select
              value={clubId}
              onChange={(e) => setClubId(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="">All Wings</option>
              {clubs.filter((c: any) => c.parent_club_id !== null).map((c: any) => (
                <option key={c.club_id} value={c.club_id}>{c.club_name.replace(' Sub-club', '')}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Eligibility State</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
            >
              <option value="">All Statuses</option>
              <option value="eligible">Eligible (All - Met 20h)</option>
              <option value="Eligible - Awaiting Certificate Approval">Eligible - Awaiting Approval</option>
              <option value="Certificate Issued">Certificate Issued</option>
              <option value="Pending Hours Review">Pending Hours Review</option>
              <option value="Not Eligible">Not Eligible</option>
              <option value="Certificate Revoked">Certificate Revoked</option>
            </select>
          </div>
        </form>
      </div>

      {/* Applied Scope Badge Bar */}
      <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 px-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Authoritative Policy:</span>
          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium border border-blue-200">
            All-Events Honors (Threshold: 20.0 Hours / 1,200 Mins)
          </span>
        </div>
        <div>
          <span>Generated: {metadata ? new Date(metadata.generated_at).toLocaleString() : new Date().toLocaleString()}</span>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Querying MySQL authoritative views...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Volunteer Records Found</h4>
            <p className="text-xs text-slate-400 mt-1">Try adjusting the filter criteria or search keyword.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Reg. No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Programme</th>
                  <th className="py-3 px-3 text-center">Approved Hours</th>
                  <th className="py-3 px-3 text-center">Pending Hours</th>
                  <th className="py-3 px-3 text-center">Events</th>
                  <th className="py-3 px-3 text-center">Threshold</th>
                  <th className="py-3 px-3 text-center">Remaining</th>
                  <th className="py-3 px-4">Eligibility Status</th>
                  <th className="py-3 px-4 text-right no-print">Certificate & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((row: any) => {
                  const approved = parseFloat(row.total_approved_hours) || 0;
                  const threshold = parseFloat(row.threshold_hours) || 20;
                  const isEligible = (row.eligibility_state || '').startsWith('Eligible');
                  const isIssued = row.eligibility_state === 'Certificate Issued';
                  const isPendingReview = row.eligibility_state === 'Pending Hours Review';
                  const isRevoked = row.eligibility_state === 'Certificate Revoked';

                  return (
                    <tr key={row.student_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {row.university_registration_number}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {row.student_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {row.programme}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-blue-900">
                        {row.total_approved_hours}h
                      </td>
                      <td className="py-3.5 px-3 text-center text-amber-700 font-semibold">
                        {parseFloat(row.total_pending_hours) > 0 ? `${row.total_pending_hours}h` : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-600">
                        {row.approved_events_count}
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-500 font-medium">
                        {row.threshold_hours}h
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold">
                        {row.remaining_hours > 0 ? (
                          <span className="text-slate-500">{row.remaining_hours}h</span>
                        ) : (
                          <span className="text-emerald-600">Met</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          isIssued
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isEligible
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : isPendingReview
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : isRevoked
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {isIssued && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                          {isPendingReview && <Clock className="w-3 h-3 text-amber-600" />}
                          {isRevoked && <ShieldAlert className="w-3 h-3 text-rose-600" />}
                          {row.eligibility_state}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right no-print">
                        {isIssued ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[10px] font-mono text-slate-400">
                              {row.certificate_number}
                            </span>
                            <a
                              href={`#/verify?token=${row.verification_token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-emerald-600 hover:text-emerald-800"
                              title="Open Public Verification"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ) : isEligible && canIssue ? (
                          <button
                            onClick={() => handleIssueCertificate(row.student_id)}
                            disabled={issuingStudentId === row.student_id}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[11px] shadow-sm transition disabled:opacity-50"
                          >
                            {issuingStudentId === row.student_id ? 'Issuing...' : 'Issue Certificate'}
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
