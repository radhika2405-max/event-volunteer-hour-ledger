import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, Award, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../services/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.login({ email, password });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
    setLoading(true);
    api.login({ email: demoEmail, password: demoPass })
      .then(() => navigate('/dashboard'))
      .catch((err: any) => setError(err.message || 'Quick login failed'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-navy-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-gold-500 to-gold-400 flex items-center justify-center shadow-xl shadow-gold-500/20 text-slate-950 font-bold text-2xl border border-gold-300">
          C
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          CHRIST (Deemed to be University)
        </h2>
        <p className="mt-1 text-xs text-gold-400 font-semibold tracking-wider uppercase">
          Delhi NCR Campus • School of Sciences
        </p>
        <p className="mt-1 text-sm text-slate-300 font-medium">
          Event Volunteer Hour Ledger & Certificate System
        </p>
      </div>

      {/* Main Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-100">
          {error && (
            <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Institutional Email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@christuniversity.in"
                  className="block w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Login Buttons for Evaluator */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 text-center flex items-center justify-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-gold-600" />
              1-Click Academic Demo Logins
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin@christuniversity.in', 'Admin@123')}
                className="w-full px-3 py-1.5 text-xs text-left bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 rounded-lg font-medium flex items-center justify-between transition"
              >
                <span><strong>Admin:</strong> Prof. Dr. Rajesh Sharma</span>
                <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-bold">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('coordinator@christuniversity.in', 'Coord@123')}
                className="w-full px-3 py-1.5 text-xs text-left bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg font-medium flex items-center justify-between transition"
              >
                <span><strong>Coordinator:</strong> Priya Menon</span>
                <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded font-bold">Coordinator</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('faculty@christuniversity.in', 'Faculty@123')}
                className="w-full px-3 py-1.5 text-xs text-left bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg font-medium flex items-center justify-between transition"
              >
                <span><strong>Approver:</strong> Dr. Anita Desai</span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-1.5 py-0.5 rounded font-bold">Faculty Approver</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('lead.tech@christuniversity.in', 'Lead@123')}
                className="w-full px-3 py-1.5 text-xs text-left bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-medium flex items-center justify-between transition"
              >
                <span><strong>Club Lead:</strong> Kavita Sundaram</span>
                <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold">Tech Lead</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('student.a@christuniversity.in', 'Student@123')}
                className="w-full px-3 py-1.5 text-xs text-left bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg font-medium flex items-center justify-between transition"
              >
                <span><strong>Volunteer A:</strong> Aarav Sharma (18h)</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">Student</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('student.b@christuniversity.in', 'Student@123')}
                className="w-full px-3 py-1.5 text-xs text-left bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg font-medium flex items-center justify-between transition"
              >
                <span><strong>Volunteer B:</strong> Bhavna Patel (20h)</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">Eligible</span>
              </button>
            </div>
          </div>

          <div className="mt-5 text-center">
            <Link
              to="/verify"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1"
            >
              <Award className="w-3.5 h-3.5 text-gold-500" />
              <span>Verify a Volunteer Certificate Publicly</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
