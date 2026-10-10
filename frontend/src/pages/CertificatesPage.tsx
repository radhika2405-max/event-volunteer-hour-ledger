import React, { useEffect, useState } from 'react';
import { 
  Award, Download, ExternalLink, ShieldAlert, CheckCircle2, 
  Settings, Clock, FileText, XCircle, ChevronRight, X 
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';

export const CertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [revocationReason, setRevocationReason] = useState('');

  // Policy threshold editor modal
  const [editingPolicy, setEditingPolicy] = useState<any | null>(null);
  const [policyThresholdHours, setPolicyThresholdHours] = useState('');

  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  const loadData = async () => {
    try {
      setLoading(true);
      const [certRes, polRes] = await Promise.all([
        api.getCertificates(),
        api.getCertificatePolicies().catch(() => ({ items: [] })),
      ]);
      setCertificates(certRes.items || []);
      setPolicies(polRes.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownload = (certId: number) => {
    const url = api.downloadCertificateUrl(certId);
    window.open(url, '_blank');
  };

  const handleRevoke = async () => {
    if (!revokingId || !revocationReason.trim()) {
      alert('A revocation reason is required.');
      return;
    }
    try {
      await api.revokeCertificate(revokingId, revocationReason.trim());
      setRevokingId(null);
      setRevocationReason('');
      loadData();
    } catch (err: any) {
      alert(`Revocation failed: ${err.message}`);
    }
  };

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPolicy || !policyThresholdHours) return;
    try {
      const minutes = Math.round(parseFloat(policyThresholdHours) * 60);
      await api.updateCertificatePolicy(editingPolicy.policy_id, {
        minimum_approved_minutes: minutes,
      });
      setEditingPolicy(null);
      loadData();
    } catch (err: any) {
      alert(`Policy update failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-gold-600" />
            Certificate Lifecycle & Policies
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Issued certificates of volunteer contribution, tamper-proof verification, and threshold settings
          </p>
        </div>

        <a
          href="/verify"
          target="_blank"
          rel="noreferrer"
          className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <ExternalLink className="w-4 h-4 text-emerald-600" />
          <span>Open Public Verifier</span>
        </a>
      </div>

      {/* Configured Policies Grid (For Admin / Approvers) */}
      {policies.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>Configured Certificate Threshold Policies</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {policies.map(p => (
              <div key={p.policy_id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {p.scope_type}
                    </span>
                    <span className="text-xs font-bold text-blue-900">
                      {p.minimum_approved_hours} Hours Required
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 leading-snug mt-1">
                    {p.policy_name}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Effective: {p.effective_from} • Requires Faculty Approval: Yes
                  </p>
                </div>

                {isAdmin && (
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex justify-end">
                    <button
                      onClick={() => {
                        setEditingPolicy(p);
                        setPolicyThresholdHours(p.minimum_approved_hours.toString());
                      }}
                      className="text-[11px] font-semibold text-blue-600 hover:text-blue-800"
                    >
                      Configure Threshold →
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Issued Certificates List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Registered & Issued Certificates ({certificates.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs text-slate-500">Loading certificate registry...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Award className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-slate-700">No Certificates Issued Yet</p>
            <p className="text-xs text-slate-400 mt-1">Check the Eligibility Report to issue certificates to eligible volunteers.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Certificate No</th>
                  <th className="py-3 px-4">Student Recipient</th>
                  <th className="py-3 px-4">Policy</th>
                  <th className="py-3 px-3 text-center">Certified Hours</th>
                  <th className="py-3 px-3">Issued Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {certificates.map(c => {
                  const isIssued = c.certificate_status === 'issued';
                  const isRevoked = c.certificate_status === 'revoked';

                  return (
                    <tr key={c.certificate_id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {c.certificate_number}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-900">{c.student_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">#{c.registration_number}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {c.policy_name}
                      </td>
                      <td className="py-3.5 px-3 text-center font-bold text-blue-900">
                        {c.eligibility_snapshot_hours}h
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {c.issued_at?.slice(0, 10)}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isIssued
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {isIssued ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <ShieldAlert className="w-3 h-3 text-rose-600" />}
                          {c.certificate_status}
                        </span>
                        {isRevoked && (
                          <p className="text-[10px] text-rose-700 italic mt-0.5 max-w-xs truncate" title={c.revocation_reason}>
                            {c.revocation_reason}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isIssued && (
                            <button
                              onClick={() => handleDownload(c.certificate_id)}
                              className="px-2.5 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] flex items-center gap-1 transition"
                            >
                              <Download className="w-3 h-3" />
                              <span>PDF</span>
                            </button>
                          )}

                          <a
                            href={`/verify?token=${c.verification_token}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1 text-slate-500 hover:text-emerald-700"
                            title="Verify Token"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          {isIssued && isAdmin && (
                            <button
                              onClick={() => setRevokingId(c.certificate_id)}
                              className="px-2 py-1 rounded text-rose-600 hover:bg-rose-50 font-semibold text-[11px]"
                            >
                              Revoke
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

      {/* Revocation Modal */}
      {revokingId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2 text-rose-700">
              <ShieldAlert className="w-5 h-5" />
              Revoke Certificate Authorization
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Revocation is recorded in audit logs and immediately invalidated on public verification lookups.
            </p>

            <textarea
              required
              rows={3}
              value={revocationReason}
              onChange={(e) => setRevocationReason(e.target.value)}
              placeholder="e.g. Audit detected timesheet overlap or academic discrepancy..."
              className="w-full p-3 text-xs border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-rose-500 mb-4"
            ></textarea>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRevokingId(null)}
                className="px-3.5 py-1.5 text-xs border border-slate-300 rounded-lg font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevoke}
                className="px-3.5 py-1.5 text-xs bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700"
              >
                Confirm Revocation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Policy Threshold Editor Modal */}
      {editingPolicy && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" />
              Configure Policy Threshold
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Update minimum approved hours required without modifying source code.
            </p>

            <form onSubmit={handleUpdatePolicy} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Policy Name</label>
                <input
                  type="text"
                  disabled
                  value={editingPolicy.policy_name}
                  className="w-full p-2.5 border border-slate-200 bg-slate-50 rounded-lg font-medium text-slate-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Minimum Approved Hours Threshold</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  required
                  value={policyThresholdHours}
                  onChange={(e) => setPolicyThresholdHours(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg outline-none font-bold text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default sample threshold: 20 hours (1,200 minutes)
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setEditingPolicy(null)}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Save Policy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
