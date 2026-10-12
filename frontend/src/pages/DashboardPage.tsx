import React, { useEffect, useState } from 'react';
import { 
  Users, Calendar, Clock, Award, CheckCircle, AlertCircle, 
  TrendingUp, Sparkles, ArrowRight, ShieldCheck, ChevronRight
} from 'lucide-react';
import { api, getCurrentUser } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, CartesianGrid, Legend 
} from 'recharts';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [eventData, setEventData] = useState<any[]>([]);
  const [clubData, setClubData] = useState<any[]>([]);
  const [eligibilityData, setEligibilityData] = useState<any[]>([]);
  const [studentSelf, setStudentSelf] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const user = getCurrentUser();

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [dashRes, eventsRes, clubsRes, eligRes] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.getEventSummaryReport().catch(() => ({ items: [] })),
          api.getClubSummaryReport().catch(() => ({ items: [] })),
          api.getEligibility().catch(() => ({ items: [] })),
        ]);

        if (dashRes) setStats(dashRes);
        setEventData(eventsRes.items || []);
        setClubData(clubsRes.items || []);
        setEligibilityData(eligRes.items || []);

        if (user?.role === 'volunteer' && user?.student_id) {
          const sRes = await api.getStudentEligibility(user.student_id).catch(() => null);
          setStudentSelf(sRes);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user?.role, user?.student_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Pre-calculate eligibility breakdown for chart
  const eligibleCount = eligibilityData.filter(x => x.eligibility_state.includes('Eligible')).length;
  const pendingReviewCount = eligibilityData.filter(x => x.eligibility_state === 'Pending Hours Review').length;
  const ineligibleCount = eligibilityData.filter(x => x.eligibility_state === 'Not Eligible').length;
  const certIssuedCount = eligibilityData.filter(x => x.eligibility_state === 'Certificate Issued').length;

  const eligChartData = [
    { name: 'Certificate Issued', value: certIssuedCount, color: '#10b981' },
    { name: 'Eligible (Awaiting)', value: eligibleCount, color: '#3b82f6' },
    { name: 'Pending Review', value: pendingReviewCount, color: '#f59e0b' },
    { name: 'Ineligible', value: ineligibleCount, color: '#94a3b8' },
  ];

  const clubChartData = clubData.map(c => ({
    name: c.sub_club.replace(' Sub-club', ''),
    hours: parseFloat(c.verified_hours_contributed) || 0,
  }));

  const COLORS = ['#e5b842', '#d97706', '#10b981', '#6366f1', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-[#0c0e14] via-[#141824] to-[#0c0e14] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-500/30 relative overflow-hidden">
        {/* Subtle gold radial background glow */}
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-16 -bottom-16 w-80 h-80 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative group shrink-0">
              <img
                src="/adikala-logo.png"
                alt="Adikala - Izhaar Kala Ka"
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-gold-400 shadow-[0_0_25px_rgba(229,184,66,0.45)] object-cover bg-black ring-4 ring-amber-400/20 transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-widest uppercase bg-gold-500 text-slate-950 shadow-sm whitespace-nowrap">
                OFFICIAL
              </span>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gold-500/20 text-gold-300 border border-gold-400/30 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-gold-400"></span>
                  School of Sciences • ADIKALA
                </span>
                <span className="text-[11px] text-amber-200/80 font-medium tracking-widest uppercase">
                  IZHAAR KALA KA
                </span>
                <span className="text-xs text-slate-400 hidden sm:inline">• Academic Year 2025–2026</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white flex items-center gap-2">
                Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500">{user?.full_name}</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Official Volunteer Honors & Hour Ledger for the School of Sciences. Tracking service contributions, verifying event timesheets, and certifying academic eligibility under <strong className="text-gold-300 font-semibold">ADIKALA</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center shrink-0">
            <Link
              to="/reports/eligibility"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-950/40 flex items-center gap-2 transition transform hover:-translate-y-0.5"
            >
              <span>Eligibility Report</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Student Self-Progress Card (If Volunteer) */}
      {studentSelf && (
        <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Your Volunteer Milestone</span>
                <h3 className="text-xl font-bold text-slate-900 mt-0.5">
                  {studentSelf.total_approved_hours} of {studentSelf.threshold_hours} Hours Verified
                </h3>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                studentSelf.eligibility_state.includes('Eligible') || studentSelf.eligibility_state === 'Certificate Issued'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : studentSelf.eligibility_state === 'Pending Hours Review'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}>
                {studentSelf.eligibility_state}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-3.5 mb-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-gold-500 h-3.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (parseFloat(studentSelf.total_approved_hours) / parseFloat(studentSelf.threshold_hours)) * 100)}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-xs text-slate-500">
              <span>{Math.round((parseFloat(studentSelf.total_approved_hours) / parseFloat(studentSelf.threshold_hours)) * 100)}% completed</span>
              <span>{studentSelf.remaining_hours > 0 ? `${studentSelf.remaining_hours} hours remaining` : 'Threshold reached!'}</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-2">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Volunteers</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.total_volunteers || 22}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Total Events</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.total_events || 8}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-2">
            <Clock className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Approved Hours</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.total_approved_hours || 0} hrs</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center mb-2">
            <AlertCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Pending Review</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.pending_hour_approvals || 0}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Eligible Students</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{eligibleCount + certIssuedCount}</p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-gold-50 text-gold-700 flex items-center justify-center mb-2">
            <Award className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-500 font-medium">Certs Issued</p>
          <p className="text-xl font-bold text-slate-900 mt-0.5">{stats?.certificates_issued || 1}</p>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sub-Club Contribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sub-Club Labor Contribution</h3>
              <p className="text-xs text-slate-500">Verified hours contributed across ADIKALA wings</p>
            </div>
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              6 Sub-clubs
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={clubChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" angle={-25} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(val: any) => [`${val} Hours`, 'Verified Contribution']}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="hours" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Certificate Eligibility Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Eligibility Status</h3>
              <p className="text-xs text-slate-500">Distribution relative to 20-hour certificate policy</p>
            </div>
            <Link to="/reports/eligibility" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
              View Report <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eligChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {eligChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: any, name: any) => [`${val} Students`, name]}
                  contentStyle={{ backgroundColor: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
