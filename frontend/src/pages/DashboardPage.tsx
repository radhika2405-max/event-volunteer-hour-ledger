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

  const COLORS = ['#2563eb', '#d97706', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4'];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-slate-800 text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gold-500/20 text-gold-300 border border-gold-400/30">
                School of Sciences • AADIKALA
              </span>
              <span className="text-xs text-slate-400">Academic Year 2025–2026</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Welcome, {user?.full_name}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Track volunteer service hours, monitor event submissions, and verify certificate eligibility against configured academic thresholds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/reports/eligibility"
              className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-slate-950 font-semibold text-sm shadow-md flex items-center gap-2 transition"
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
              <p className="text-xs text-slate-500">Verified hours contributed across AADIKALA wings</p>
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
