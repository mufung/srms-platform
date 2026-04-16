// ============================================================
// SRMS-1-SUPERADMIN-001: Super Admin Dashboard
// ============================================================
// Owner: MUFUNG ANGELBELL MBUYEH
// AWS Solutions Architect | Yaoundé, Cameroon Northwest
// Email: mufungangelbellmbuyeh@gmail.com
// WhatsApp: +237 671 534 067
// ============================================================
// SECURITY:
// - Only accessible via secret URL path (set in .env)
// - Requires MFA (Google Authenticator)
// - Session expires after 2 hours of inactivity
// - WAF rate limiting applied
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// SRMS-1-SUPERADMIN-002: Load map dynamically (prevents SSR issues with Leaflet)
const AdminMap = dynamic(() => import('../../../components/admin/AdminMap'), { ssr: false });

// SRMS-1-SUPERADMIN-003: Owner personal information
const OWNER_INFO = {
  name: 'MUFUNG ANGELBELL MBUYEH',
  title: 'AWS Solutions Architect',
  born: 'Cameroon, Northwest Region',
  location: 'Yaoundé, Cameroon',
  email: 'mufungangelbellmbuyeh@gmail.com',
  whatsapp: '+237 671 534 067',
  whatsappLink: 'https://wa.me/237671534067',
  latitude: 3.8480,
  longitude: 11.5021,
  avatar: 'MA',
};

// SRMS-1-SUPERADMIN-004: Navigation items for admin sidebar
const ADMIN_NAV = [
  { icon: '📊', label: 'Dashboard', href: '/super-admin/dashboard', active: true },
  { icon: '🏫', label: 'Schools', href: '/super-admin/schools', active: false },
  { icon: '💰', label: 'Revenue', href: '/super-admin/revenue', active: false },
  { icon: '🚀', label: 'Deployments', href: '/super-admin/deployments', active: false },
  { icon: '📋', label: 'Audit Logs', href: '/super-admin/audit', active: false },
  { icon: '⚙️', label: 'System Health', href: '/super-admin/system', active: false },
  { icon: '👥', label: 'All Users', href: '/super-admin/users', active: false },
];

// ============================================================
// SRMS-1-SUPERADMIN-010: MAIN DASHBOARD COMPONENT
// ============================================================
export default function SuperAdminDashboard() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sessionTimeLeft, setSessionTimeLeft] = useState(7200);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // SRMS-1-SUPERADMIN-011: Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setSessionTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // SRMS-1-SUPERADMIN-012: Load dashboard data
  useEffect(() => {
    const loadData = async () => {
      try {
        // SRMS-1-SUPERADMIN-013: In production, this calls the admin API
        // Mock data for Phase 1 testing
        const mockData = {
          schools: [
            { tenantId: 'cm-gbhs-001', schoolName: 'Government Bilingual High School', plan: 'professional', status: 'active', country: 'Cameroon', activeStudentIds: 1247, activeTeacherIds: 45, monthlyRevenueCents: 17220, enabledSections: ['section1', 'section2', 'section3', 'section4', 'section5'] },
            { tenantId: 'cm-press-002', schoolName: 'Presbyterian Secondary School', plan: 'standard', status: 'active', country: 'Cameroon', activeStudentIds: 654, activeTeacherIds: 28, monthlyRevenueCents: 6742, enabledSections: ['section1', 'section2', 'section5'] },
            { tenantId: 'ng-kings-003', schoolName: 'Kings College Lagos', plan: 'professional', status: 'trial', country: 'Nigeria', activeStudentIds: 2100, activeTeacherIds: 78, monthlyRevenueCents: 0, enabledSections: ['section1', 'section2', 'section3', 'section4', 'section5', 'section6', 'section7'] },
            { tenantId: 'cm-saker-004', schoolName: 'Saker Baptist College', plan: 'standard', status: 'payment_failed', country: 'Cameroon', activeStudentIds: 890, activeTeacherIds: 35, monthlyRevenueCents: 8750, enabledSections: ['section1', 'section5'] },
          ],
          summary: {
            totalSchools: 4,
            activeSchools: 2,
            totalMonthlyRevenueCents: 32712,
            totalMonthlyRevenueUSD: '327.12',
          },
        };
        setDashboardData(mockData);
      } catch (err) {
        console.error('[SRMS-ADMIN] Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // SRMS-1-SUPERADMIN-014: Format session countdown
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'text-emerald-400 bg-emerald-400/10',
      trial: 'text-purple-400 bg-purple-400/10',
      payment_failed: 'text-amber-400 bg-amber-400/10',
      suspended: 'text-red-400 bg-red-400/10',
      deploying: 'text-blue-400 bg-blue-400/10',
    };
    return colors[status] || 'text-slate-400 bg-slate-400/10';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-body">
      {/* ====================================================
          SRMS-1-SUPERADMIN-020: SIDEBAR
          ==================================================== */}
      <aside
        className={`${sidebarOpen ? 'w-72' : 'w-16'} transition-all duration-300 flex-shrink-0 bg-slate-900 border-r border-white/5 flex flex-col`}
      >
        {/* SRMS-1-SUPERADMIN-021: Sidebar header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center font-display font-bold text-white">
                S
              </div>
              <div>
                <div className="font-heading font-bold text-white text-sm">SRMS Admin</div>
                <div className="text-blue-400 text-xs">Super Admin</div>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            {sidebarOpen ? '←' : '→'}
          </button>
        </div>

        {/* SRMS-1-SUPERADMIN-022: Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {ADMIN_NAV.map((item) => (
            
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                item.active
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              {sidebarOpen && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </a>
          ))}
        </nav>

        {/* SRMS-1-SUPERADMIN-023: Owner profile card in sidebar */}
        {sidebarOpen && (
          <div className="p-4 border-t border-white/5">
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-heading font-bold text-slate-950 text-sm flex-shrink-0">
                  {OWNER_INFO.avatar}
                </div>
                <div className="min-w-0">
                  <div className="font-heading font-bold text-white text-xs truncate">
                    {OWNER_INFO.name}
                  </div>
                  <div className="text-amber-400 text-xs">{OWNER_INFO.title}</div>
                </div>
              </div>
              <div className="space-y-1 text-xs text-slate-500">
                <p>📍 {OWNER_INFO.location}</p>
                <a href={`mailto:${OWNER_INFO.email}`} className="block hover:text-blue-400 transition-colors truncate">
                  ✉️ {OWNER_INFO.email}
                </a>
                <a href={OWNER_INFO.whatsappLink} target="_blank" rel="noopener noreferrer" className="block hover:text-emerald-400 transition-colors">
                  💬 {OWNER_INFO.whatsapp}
                </a>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ====================================================
          SRMS-1-SUPERADMIN-030: MAIN CONTENT
          ==================================================== */}
      <main className="flex-1 overflow-auto">
        {/* SRMS-1-SUPERADMIN-031: Top bar */}
        <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-xl font-bold text-white">Super Admin Dashboard</h1>
              <p className="text-slate-500 text-sm">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} —{' '}
                {currentTime.toLocaleTimeString()}
              </p>
            </div>

            {/* SRMS-1-SUPERADMIN-032: Session timer and security info */}
            <div className="flex items-center gap-6">
              {/* Session countdown */}
              <div className="text-center">
                <div className="text-xs text-slate-500 mb-1">Session Expires In</div>
                <div className={`font-mono text-sm font-bold ${sessionTimeLeft < 600 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatTime(sessionTimeLeft)}
                </div>
              </div>

              {/* MFA indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 text-emerald-400 text-xs font-medium">
                <span>🔐</span>
                MFA Active
              </div>

              {/* Owner avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-heading font-bold text-slate-950 text-sm cursor-pointer">
                {OWNER_INFO.avatar}
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">

          {/* ====================================================
              SRMS-1-SUPERADMIN-040: OWNER PROFILE CARD
              ==================================================== */}
          <div className="glass-card p-8 border border-amber-500/20"
            style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05) 0%, rgba(30, 58, 138, 0.1) 100%)' }}>
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-heading font-black text-slate-950 text-4xl shadow-gold">
                  {OWNER_INFO.avatar}
                </div>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-xs">
                  ✓
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h2 className="font-heading text-2xl font-black text-white">{OWNER_INFO.name}</h2>
                  <span className="badge badge-active text-xs">Platform Owner</span>
                  <span className="badge badge-review text-xs">Super Admin</span>
                </div>
                <p className="text-amber-400 font-medium mb-1">{OWNER_INFO.title}</p>
                <div className="flex flex-wrap gap-6 text-sm text-slate-400 mt-3">
                  <span>🌍 Born in {OWNER_INFO.born}</span>
                  <span>📍 Lives in {OWNER_INFO.location}</span>
                  <a href={`mailto:${OWNER_INFO.email}`} className="hover:text-blue-400 transition-colors">
                    ✉️ {OWNER_INFO.email}
                  </a>
                  <a href={OWNER_INFO.whatsappLink} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">
                    💬 {OWNER_INFO.whatsapp}
                  </a>
                </div>
              </div>

              {/* Quick security info */}
              <div className="glass-card p-4 rounded-xl min-w-48">
                <p className="text-slate-500 text-xs mb-3 uppercase tracking-wider">Security Status</p>
                {[
                  { label: 'MFA', value: 'Active ✓', ok: true },
                  { label: 'Session', value: formatTime(sessionTimeLeft), ok: sessionTimeLeft > 600 },
                  { label: 'WAF', value: 'Active ✓', ok: true },
                  { label: 'Role', value: 'Super Admin', ok: true },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0">
                    <span className="text-slate-400 text-xs">{item.label}</span>
                    <span className={`text-xs font-medium ${item.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ====================================================
              SRMS-1-SUPERADMIN-050: KPI CARDS
              ==================================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Total Schools',
                value: dashboardData?.summary.totalSchools ?? '—',
                subtitle: `${dashboardData?.summary.activeSchools ?? 0} active`,
                icon: '🏫',
                color: 'from-blue-600/10 to-blue-800/10',
                border: 'border-blue-600/20',
                valueColor: 'text-blue-400',
              },
              {
                title: 'Monthly Revenue',
                value: dashboardData ? `$${dashboardData.summary.totalMonthlyRevenueUSD}` : '—',
                subtitle: 'All schools combined',
                icon: '💰',
                color: 'from-amber-600/10 to-amber-800/10',
                border: 'border-amber-600/20',
                valueColor: 'text-amber-400',
              },
              {
                title: 'Payment Issues',
                value: dashboardData?.schools.filter((s: any) => s.status === 'payment_failed').length ?? '—',
                subtitle: 'Require attention',
                icon: '⚠️',
                color: 'from-red-600/10 to-red-800/10',
                border: 'border-red-600/20',
                valueColor: 'text-red-400',
              },
              {
                title: 'On Trial',
                value: dashboardData?.schools.filter((s: any) => s.status === 'trial').length ?? '—',
                subtitle: 'Free trial period',
                icon: '🕐',
                color: 'from-purple-600/10 to-purple-800/10',
                border: 'border-purple-600/20',
                valueColor: 'text-purple-400',
              },
            ].map((kpi, i) => (
              <div key={i} className={`glass-card p-6 border ${kpi.border} bg-gradient-to-br ${kpi.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <span className="text-3xl">{kpi.icon}</span>
                </div>
                <div className={`font-heading text-3xl font-black ${kpi.valueColor} mb-1`}>
                  {loading ? '...' : kpi.value}
                </div>
                <div className="text-white text-sm font-medium">{kpi.title}</div>
                <div className="text-slate-500 text-xs mt-1">{kpi.subtitle}</div>
              </div>
            ))}
          </div>

          {/* ====================================================
              SRMS-1-SUPERADMIN-060: SCHOOLS TABLE
              ==================================================== */}
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-bold text-white">All Schools</h2>
              <button className="btn-primary text-sm px-4 py-2 rounded-lg">
                + Register School
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="results-table w-full">
                <thead>
                  <tr>
                    <th>School Name</th>
                    <th>Tenant ID</th>
                    <th>Country</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Students</th>
                    <th>Teachers</th>
                    <th>Monthly Revenue</th>
                    <th>Sections</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={10} className="text-center py-12 text-slate-500">
                        Loading schools...
                      </td>
                    </tr>
                  ) : dashboardData?.schools.map((school: any, i: number) => (
                    <tr key={i}>
                      <td>
                        <div className="font-medium text-white">{school.schoolName}</div>
                        <div className="text-slate-500 text-xs">{school.adminEmail}</div>
                      </td>
                      <td>
                        <code className="text-blue-400 text-xs bg-blue-400/10 px-2 py-0.5 rounded">
                          {school.tenantId}
                        </code>
                      </td>
                      <td className="text-slate-300">{school.country}</td>
                      <td>
                        <span className="badge badge-review text-xs capitalize">
                          {school.plan}
                        </span>
                      </td>
                      <td>
                        <span className={`badge text-xs capitalize ${getStatusColor(school.status)}`}>
                          {school.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="text-slate-300">{school.activeStudentIds.toLocaleString()}</td>
                      <td className="text-slate-300">{school.activeTeacherIds}</td>
                      <td className="text-amber-400 font-medium">
                        ${(school.monthlyRevenueCents / 100).toFixed(2)}
                      </td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {school.enabledSections.map((s: string) => (
                            <span key={s} className="badge badge-active text-xs">
                              {s.replace('section', 'S')}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="text-blue-400 hover:text-blue-300 text-xs transition-colors">View</button>
                          <button className="text-amber-400 hover:text-amber-300 text-xs transition-colors">Edit</button>
                          {school.status === 'active' ? (
                            <button className="text-red-400 hover:text-red-300 text-xs transition-colors">Suspend</button>
                          ) : (
                            <button className="text-emerald-400 hover:text-emerald-300 text-xs transition-colors">Activate</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ====================================================
              SRMS-1-SUPERADMIN-070: OWNER LOCATION MAP
              Shows map pointing to Yaoundé, Cameroon
              ==================================================== */}
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="font-heading text-lg font-bold text-white mb-1">
                  Platform Owner Location
                </h2>
                <p className="text-slate-500 text-sm">Yaoundé, Cameroon Northwest — Real-time tracking</p>
              </div>
              <div className="p-4">
                <AdminMap
                  latitude={OWNER_INFO.latitude}
                  longitude={OWNER_INFO.longitude}
                  ownerName={OWNER_INFO.name}
                  ownerTitle={OWNER_INFO.title}
                  ownerLocation={OWNER_INFO.location}
                />
              </div>
              <div className="p-6 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Platform Owner</p>
                    <p className="text-white font-medium">{OWNER_INFO.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Role</p>
                    <p className="text-amber-400 font-medium">{OWNER_INFO.title}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Email</p>
                    <a href={`mailto:${OWNER_INFO.email}`} className="text-blue-400 hover:text-blue-300 transition-colors text-xs">
                      {OWNER_INFO.email}
                    </a>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">WhatsApp</p>
                    <a href={OWNER_INFO.whatsappLink} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:text-emerald-300 transition-colors text-xs">
                      {OWNER_INFO.whatsapp}
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* SRMS-1-SUPERADMIN-071: Recent activity */}
            <div className="glass-card overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h2 className="font-heading text-lg font-bold text-white">Recent Platform Activity</h2>
              </div>
              <div className="divide-y divide-white/5">
                {[
                  { action: 'New school registered', detail: 'Kings College Lagos', time: '2 hours ago', icon: '🏫', color: 'text-emerald-400' },
                  { action: 'Payment failed', detail: 'Saker Baptist College', time: '5 hours ago', icon: '⚠️', color: 'text-amber-400' },
                  { action: 'Results published', detail: 'GBHS Bamenda - Form 5A', time: '1 day ago', icon: '📊', color: 'text-blue-400' },
                  { action: 'Complaint resolved', detail: 'Math score corrected', time: '2 days ago', icon: '✅', color: 'text-emerald-400' },
                  { action: 'Tenant stack deployed', detail: 'Presbyterian Secondary', time: '3 days ago', icon: '🚀', color: 'text-purple-400' },
                  { action: 'Payment received', detail: '$40.00 from GBHS', time: '7 days ago', icon: '💰', color: 'text-amber-400' },
                ].map((event, i) => (
                  <div key={i} className="p-4 flex items-start gap-4 hover:bg-white/2 transition-colors">
                    <span className="text-xl mt-0.5">{event.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${event.color}`}>{event.action}</p>
                      <p className="text-slate-400 text-xs">{event.detail}</p>
                    </div>
                    <span className="text-slate-600 text-xs flex-shrink-0">{event.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SRMS-1-SUPERADMIN-080: Footer */}
          <div className="text-center py-4 border-t border-white/5">
            <p className="text-slate-600 text-xs">
              SRMS Platform Super Admin — {OWNER_INFO.name} — {OWNER_INFO.title} — Yaoundé, Cameroon Northwest
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}