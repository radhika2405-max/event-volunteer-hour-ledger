import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar, Users, Clock, Award, 
  FileSpreadsheet, ShieldAlert, CheckCircle2, LogOut, Menu, X, ExternalLink, GraduationCap
} from 'lucide-react';
import { getCurrentUser, api } from '../services/api';
import adikalaLogo from '../assets/adikala-logo.png';

export const AppLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = getCurrentUser() || { full_name: 'Guest User', role: 'volunteer', email: '' };

  const handleLogout = async () => {
    await api.logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'coordinator', 'approver', 'club_lead', 'volunteer'] },
    { name: 'Events', path: '/events', icon: Calendar, roles: ['admin', 'coordinator', 'approver', 'club_lead', 'volunteer'] },
    { name: 'Volunteers Directory', path: '/volunteers', icon: Users, roles: ['admin', 'coordinator', 'approver', 'club_lead', 'volunteer'] },
    { name: 'Hour Ledger', path: '/hours', icon: Clock, roles: ['admin', 'coordinator', 'approver', 'club_lead', 'volunteer'] },
    { name: 'Eligibility Report', path: '/reports/eligibility', icon: FileSpreadsheet, roles: ['admin', 'coordinator', 'approver', 'club_lead'], highlight: true },
    { name: 'Certificates', path: '/certificates', icon: Award, roles: ['admin', 'coordinator', 'approver', 'club_lead', 'volunteer'] },
    { name: 'Audit Logs', path: '/audit-logs', icon: ShieldAlert, roles: ['admin'] },
  ];

  const allowedNav = navItems.filter(item => item.roles.includes(user.role));

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    coordinator: 'bg-blue-100 text-blue-800 border-blue-200',
    approver: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    club_lead: 'bg-amber-100 text-amber-800 border-amber-200',
    volunteer: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shrink-0 shadow-xl border-r border-slate-800">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <img
              src={adikalaLogo}
              alt="Adikala - Izhaar Kala Ka"
              className="w-12 h-12 rounded-full border-2 border-gold-400 shadow-[0_0_15px_rgba(229,184,66,0.4)] object-cover bg-black shrink-0"
              onError={(e) => {
                const el = e.currentTarget;
                if (!el.dataset.fallback) {
                  el.dataset.fallback = '1';
                  el.src = './adikala-logo.png';
                }
              }}
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-serif font-bold text-sm tracking-wider text-gold-300">ADIKALA</h2>
              <p className="text-[10px] text-amber-200/80 font-semibold tracking-widest uppercase">IZHAAR KALA KA</p>
              <p className="text-[9px] text-slate-400 tracking-wide uppercase truncate">CHRIST NCR • Sciences</p>
            </div>
          </div>
          <div className="mt-4 px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-gold-500/30 flex items-center justify-between text-xs shadow-inner">
            <span className="text-gold-200 font-semibold flex items-center gap-1.5 text-[11px] tracking-wide">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              ADIKALA LEDGER
            </span>
            <span className="text-[10px] text-gold-400/80 font-mono">v1.0</span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {allowedNav.map(item => {
            const active = location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-gradient-to-r from-gold-500/25 via-amber-500/15 to-slate-800/40 text-gold-200 border-l-4 border-gold-400 shadow-md shadow-gold-950/40 font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-gold-200'
                } ${item.highlight && !active ? 'border border-gold-500/30 text-gold-300 bg-gold-950/20' : ''}`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-gold-400' : item.highlight ? 'text-gold-400' : 'text-slate-400'}`} />
                <span className="flex-1">{item.name}</span>
                {item.highlight && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold-500/20 text-gold-300 uppercase font-semibold">
                    Core
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Public Verification Link */}
        <div className="p-3 border-t border-slate-800/80">
          <Link
            to="/verify"
            className="flex items-center gap-2 px-3 py-2 text-xs text-slate-400 hover:text-gold-200 hover:bg-slate-800/70 rounded-lg transition"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Public Verification Portal</span>
            <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
          </Link>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-gold-400 border border-gold-500/40 shadow-sm">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${roleColors[user.role] || 'bg-slate-100 text-slate-800'}`}>
                  {user.role}
                </span>
                {user.registration_number && (
                  <span className="text-[10px] text-slate-400 font-mono">#{user.registration_number}</span>
                )}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white border-b border-gold-500/20 shadow-md">
        <div className="flex items-center gap-2.5">
          <img
            src={adikalaLogo}
            alt="Adikala Logo"
            className="w-9 h-9 rounded-full border border-gold-400 object-cover bg-black shadow"
            onError={(e) => {
              const el = e.currentTarget;
              if (!el.dataset.fallback) {
                el.dataset.fallback = '1';
                el.src = './adikala-logo.png';
              }
            }}
          />
          <div>
            <span className="font-serif font-bold text-sm text-gold-300 block leading-tight">ADIKALA LEDGER</span>
            <p className="text-[9px] text-amber-200/80 font-semibold tracking-widest uppercase">IZHAAR KALA KA</p>
          </div>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1 text-slate-300">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-gold-400" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900 text-white p-4 border-b border-slate-800 space-y-2">
          {allowedNav.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2 rounded text-sm hover:bg-slate-800 text-slate-200"
            >
              <item.icon className="w-4 h-4 text-slate-400" />
              <span>{item.name}</span>
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span>{user.full_name} ({user.role})</span>
            <button onClick={handleLogout} className="text-rose-400 flex items-center gap-1">
              <LogOut className="w-3.5 h-3.5" /> Logout
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Academic Institutional Banner Bar */}
        <header className="bg-slate-900 border-b border-gold-500/20 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <GraduationCap className="w-4 h-4 text-gold-400 shrink-0" />
            <span className="font-semibold text-white">CHRIST (Deemed to be University)</span>
            <span className="text-gold-500/40">•</span>
            <span>Delhi NCR Campus</span>
            <span className="text-gold-500/40">•</span>
            <span className="text-gold-300 font-medium">School of Sciences</span>
            <span className="text-gold-500/40 hidden lg:inline">•</span>
            <span className="hidden lg:inline text-amber-200/90 font-semibold tracking-wider text-[11px]">ADIKALA (IZHAAR KALA KA)</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gold-950/60 text-gold-300 border border-gold-400/40 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-gold-400 animate-pulse"></span>
              Threshold: 20 Verified Hours
            </span>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
