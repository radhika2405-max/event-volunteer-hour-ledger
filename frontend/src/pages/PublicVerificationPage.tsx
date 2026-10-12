import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  ShieldCheck, CheckCircle2, XCircle, Search, 
  Award, GraduationCap, ArrowLeft, Building2, Calendar, Clock 
} from 'lucide-react';
import { api } from '../services/api';
import adikalaLogo from '../assets/adikala-logo.png';

export const PublicVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlToken = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null;
  const hashToken = searchParams.get('token');
  const tokenParam = hashToken || urlToken || '';

  const [inputToken, setInputToken] = useState(tokenParam);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const verifyToken = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await api.publicVerifyCertificate(tokenToVerify.trim());
      setResult(data);
    } catch (err: any) {
      setResult({
        verification_status: 'NOT_FOUND',
        message: 'No certificate matches this verification identifier.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tokenParam) {
      setInputToken(tokenParam);
      verifyToken(tokenParam);
    }
  }, [tokenParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    verifyToken(inputToken);
  };

  const isValid = result?.verification_status === 'VALID';
  const isRevoked = result?.verification_status === 'REVOKED';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto space-y-6">
        {/* Navigation & Brand */}
        <div className="flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Staff / Volunteer Portal</span>
          </Link>
          <span className="text-xs font-mono font-bold text-slate-400">
            OFFICIAL PUBLIC VERIFICATION
          </span>
        </div>

        {/* Verification Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 text-white p-6 sm:p-8 text-center relative overflow-hidden border-b border-gold-500/20">
            <img
              src={adikalaLogo}
              alt="Adikala - Izhaar Kala Ka"
              className="mx-auto w-16 h-16 rounded-full border-2 border-gold-400 shadow-[0_0_18px_rgba(229,184,66,0.45)] object-cover bg-black mb-3 ring-4 ring-amber-400/20"
              onError={(e) => {
                const el = e.currentTarget;
                if (!el.dataset.fallback) {
                  el.dataset.fallback = '1';
                  el.src = './adikala-logo.png';
                }
              }}
            />
            <h1 className="text-lg sm:text-xl font-serif font-bold tracking-tight text-white">
              CHRIST (Deemed to be University)
            </h1>
            <p className="text-xs text-gold-400 font-semibold uppercase tracking-wider mt-0.5">
              Delhi NCR Campus • School of Sciences
            </p>
            <p className="text-xs text-amber-200/90 font-medium tracking-wide mt-1">
              ADIKALA (IZHAAR KALA KA) Volunteer Honor Ledger • Credential Verification
            </p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Search Box */}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Enter 40+ char verification token or certificate hash..."
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-mono border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-md transition disabled:opacity-50 shrink-0"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>

            {/* Quick Demo Tokens */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
              <span className="font-bold text-slate-800">Quick Test Credentials:</span>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const t = 'd3b07384d113edec49eaa6238ad5ff00b98e1a78';
                    setInputToken(t);
                    verifyToken(t);
                  }}
                  className="font-mono text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-semibold transition"
                >
                  ✓ Valid Cert Token (Eshan Gupta)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = 'c4ca4238a0b923820dcc509a6f75849b23820dcc';
                    setInputToken(t);
                    verifyToken(t);
                  }}
                  className="font-mono text-[10px] bg-rose-100 hover:bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-semibold transition"
                >
                  ✕ Revoked Cert Token (Fatima Khan)
                </button>
              </div>
            </div>

            {/* Result View */}
            {searched && (
              <div className="pt-2">
                {isValid && (
                  <div className="p-6 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300 space-y-4">
                    <div className="flex items-center gap-3 border-b border-emerald-200 pb-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-200 px-2 py-0.5 rounded-full">
                          Authentic & Verified
                        </span>
                        <h3 className="text-base font-bold text-emerald-950 mt-1">
                          Official Certificate of Volunteer Contribution
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500 font-medium">Recipient Volunteer</p>
                        <p className="text-sm font-bold text-slate-900 mt-0.5">{result.student_name}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Certificate Number</p>
                        <p className="font-mono font-bold text-slate-900 mt-0.5">{result.certificate_number}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Academic Programme</p>
                        <p className="font-semibold text-slate-800 mt-0.5">{result.programme}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Verified Volunteer Labor</p>
                        <p className="font-bold text-blue-900 text-sm mt-0.5">
                          ★ {result.verified_volunteer_hours} Certified Hours ★
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Issued Date</p>
                        <p className="font-medium text-slate-700 mt-0.5">{result.issued_at}</p>
                      </div>
                      <div>
                        <p className="text-slate-500 font-medium">Issuing Body</p>
                        <p className="font-medium text-slate-700 mt-0.5">School of Sciences & ADIKALA</p>
                      </div>
                    </div>
                  </div>
                )}

                {isRevoked && (
                  <div className="p-6 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3">
                    <div className="flex items-center gap-3 border-b border-rose-200 pb-3">
                      <div className="w-10 h-10 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                        <XCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 bg-rose-200 px-2 py-0.5 rounded-full">
                          Certificate Revoked / Invalidated
                        </span>
                        <h3 className="text-base font-bold text-rose-950 mt-1">
                          Revocation Recorded in Institutional Ledger
                        </h3>
                      </div>
                    </div>

                    <div className="text-xs space-y-2 text-rose-900">
                      <p><strong>Student:</strong> {result.student_name} (#{result.certificate_number})</p>
                      <p className="p-2.5 rounded bg-rose-100/70 border border-rose-200 font-medium">
                        <strong>Official Revocation Reason:</strong> {result.revocation_reason}
                      </p>
                    </div>
                  </div>
                )}

                {result?.verification_status === 'NOT_FOUND' && (
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                    <XCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-800">Certificate Not Found</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      No volunteer certificate matches this verification identifier. Please check the token characters or contact the School of Sciences office.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="text-center text-[11px] text-slate-400 mt-8">
        CHRIST (Deemed to be University) • Delhi NCR Campus • Institutional Volunteer Management System
      </footer>
    </div>
  );
};
