'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface School {
  tenantId: string; name: string; shortCode: string;
  region: string; plan: string; status: string;
  students: number; teachers: number; parents: number; admins: number;
  monthlyUSD: string; monthlyXAF: number;
  registeredAt: string; lastPayment: string;
  adminEmail: string; adminName: string;
}

interface AuditLog {
  id: string; action: string; school: string;
  actor: string; detail: string; time: string; type: string;
}

const PLAN_COLOR: Record<string, string> = {
  starter: '#3b82f6',
  standard: '#f59e0b',
  professional: '#8b5cf6',
};

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  active: { color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
  suspended: { color: '#f87171', bg: 'rgba(239,68,68,0.15)' },
  grace: { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)' },
};

const ACTION_ICON: Record<string, string> = {
  results: '📊', payment: '💳', complaint: '⚖️',
  registration: '🏫', id: '🆔', payment_failed: '❌',
  suspension: '🔴',
};

export default function SuperAdminDashboard() {
  const [tab, setTab] = useState<'overview' | 'schools' | 'revenue' | 'audit'>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [actionMsg, setActionMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const api = process.env.NEXT_PUBLIC_TENANT_API_URL || '';

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [ovRes, schRes, audRes] = await Promise.all([
          fetch(`${api}/superadmin/overview`),
          fetch(`${api}/superadmin/schools`),
          fetch(`${api}/superadmin/audit`),
        ]);
        const [ovData, schData, audData] = await Promise.all([
          ovRes.json(), schRes.json(), audRes.json()
        ]);
        if (ovData.success) setOverview(ovData.data);
        if (schData.success) setSchools(schData.data.schools);
        if (audData.success) setAuditLogs(audData.data.logs);
      } catch (e) {
        console.error('API error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [api]);

  const handleSuspend = async (school: School) => {
    if (!confirm(`Suspend ${school.name}?`)) return;
    try {
      await fetch(`${api}/superadmin/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: school.tenantId, reason: 'Manual suspension by Super Admin' }),
      });
      setSchools(prev => prev.map(s => s.tenantId === school.tenantId ? { ...s, status: 'suspended' } : s));
      setActionMsg(`✅ ${school.name} suspended`);
      setSelectedSchool(null);
      setTimeout(() => setActionMsg(''), 4000);
    } catch { setActionMsg('❌ Action failed'); }
  };

  const handleReactivate = async (school: School) => {
    try {
      await fetch(`${api}/superadmin/reactivate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: school.tenantId }),
      });
      setSchools(prev => prev.map(s => s.tenantId === school.tenantId ? { ...s, status: 'active' } : s));
      setActionMsg(`✅ ${school.name} reactivated`);
      setSelectedSchool(null);
      setTimeout(() => setActionMsg(''), 4000);
    } catch { setActionMsg('❌ Action failed'); }
  };

  const filtered = schools.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.plan.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevXAF = schools.reduce((sum, s) => sum + s.monthlyXAF, 0);
  const totalRevUSD = schools.reduce((sum, s) => sum + parseFloat(s.monthlyUSD), 0);

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0' }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,15,32,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#dc2626,#b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👑</div>
          <div>
            <p style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: 0 }}>Super Admin</p>
            <p style={{ color: '#dc2626', fontSize: 11, margin: 0 }}>MUFUNG ANGELBELL MBUYEH · Platform Owner</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#64748b', fontSize: 13 }}>mufungangelbellmbuyeh@gmail.com</span>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>Live</span>
          <Link href="/login" style={{ color: '#64748b', fontSize: 13, textDecoration: 'none', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>Sign Out</Link>
        </div>
      </header>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 24px' }}>

        {/* Action message */}
        {actionMsg && (
          <div style={{ marginBottom: 16, padding: '12px 18px', borderRadius: 10, background: actionMsg.includes('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid ' + (actionMsg.includes('✅') ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'), color: actionMsg.includes('✅') ? '#34d399' : '#f87171', fontWeight: 700 }}>
            {actionMsg}
          </div>
        )}

        {/* Welcome banner */}
        <div style={{ background: 'linear-gradient(135deg,rgba(220,38,38,0.15),rgba(30,58,138,0.3))', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16 }}>
            <div>
              <h1 style={{ color: 'white', fontWeight: 900, fontSize: '1.4rem', margin: '0 0 4px' }}>👑 Platform Control Center</h1>
              <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>
                SRMS Platform · {new Date().toLocaleDateString('en-GB', { weekday:'long', day:'2-digit', month:'long', year:'numeric' })}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' as const }}>
                <p style={{ color: '#34d399', fontWeight: 900, fontSize: '1.4rem', margin: 0 }}>${totalRevUSD.toFixed(2)}</p>
                <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>Monthly Revenue</p>
              </div>
              <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '10px 16px', textAlign: 'center' as const }}>
                <p style={{ color: '#60a5fa', fontWeight: 900, fontSize: '1.4rem', margin: 0 }}>{totalRevXAF.toLocaleString()}</p>
                <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>XAF / Month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        {overview && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 28 }}>
            {[
              { label:'Total Schools', value: overview.stats.totalSchools, icon:'🏫', color:'#3b82f6' },
              { label:'Active Schools', value: overview.stats.activeSchools, icon:'✅', color:'#10b981' },
              { label:'Suspended', value: overview.stats.suspendedSchools, icon:'🔴', color:'#ef4444' },
              { label:'Student IDs', value: overview.stats.totalStudentIds.toLocaleString(), icon:'🎓', color:'#3b82f6' },
              { label:'Teacher IDs', value: overview.stats.totalTeacherIds, icon:'👨‍🏫', color:'#10b981' },
              { label:'Parent IDs', value: overview.stats.totalParentIds, icon:'👨‍👩‍👧', color:'#8b5cf6' },
              { label:'Total IDs', value: overview.stats.totalIds.toLocaleString(), icon:'🆔', color:'#f59e0b' },
              { label:'Growth', value: '+'+overview.revenue.growthPercent+'%', icon:'📈', color:'#34d399' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 24, flexWrap: 'wrap' as const }}>
          {[
            { key:'overview', label:'🏠 Overview' },
            { key:'schools', label:`🏫 Schools (${schools.length})` },
            { key:'revenue', label:'💰 Revenue' },
            { key:'audit', label:'📋 Audit Log' },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key as any)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === key ? 'linear-gradient(135deg,#dc2626,#b91c1c)' : 'transparent', color: tab === key ? 'white' : '#64748b' }}>
              {label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && overview && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

            {/* Recent activity */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>🕐 Recent Activity</h3>
              </div>
              {overview.recentActivity.map((a: any, i: number) => (
                <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                    {ACTION_ICON[a.type] || '📌'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: 13, margin: '0 0 2px' }}>{a.action}</p>
                    <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{a.school}</p>
                    {a.amount && <p style={{ color: '#34d399', fontSize: 12, margin: '2px 0 0', fontWeight: 600 }}>{a.amount}</p>}
                  </div>
                  <span style={{ color: '#334155', fontSize: 11, flexShrink: 0 }}>{a.time}</span>
                </div>
              ))}
            </div>

            {/* Revenue breakdown */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>💰 Revenue This Month</h3>
              </div>
              <div style={{ padding: '20px' }}>
                {[
                  { label:'Starter Plans (3 schools)', usd:'79.40', xaf:51610, color:'#3b82f6', pct:9 },
                  { label:'Standard Plans (4 schools)', usd:'296.00', xaf:192400, color:'#f59e0b', pct:33 },
                  { label:'Professional Plans (2 schools)', usd:'310.75', xaf:201988, color:'#8b5cf6', pct:35 },
                  { label:'Per-ID Charges (all schools)', usd:'198.85', xaf:129253, color:'#10b981', pct:23 },
                ].map((r, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>{r.label}</span>
                      <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>${r.usd}</span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 6 }}>
                      <div style={{ height: '100%', borderRadius: 100, background: r.color, width: r.pct + '%' }} />
                    </div>
                    <p style={{ color: '#475569', fontSize: 11, margin: '4px 0 0' }}>{r.xaf.toLocaleString()} XAF</p>
                  </div>
                ))}

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>Total</span>
                    <div style={{ textAlign: 'right' as const }}>
                      <p style={{ color: '#34d399', fontWeight: 900, fontSize: '1.4rem', margin: 0 }}>${overview.revenue.thisMonthUSD}</p>
                      <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{overview.revenue.thisMonthXAF.toLocaleString()} XAF</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCHOOLS TAB */}
        {tab === 'schools' && (
          <div>
            {/* Search */}
            <div style={{ marginBottom: 16 }}>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search schools by name, region, plan, or status..."
                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', color: '#e2e8f0', fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selectedSchool ? '1fr 360px' : '1fr', gap: 20 }}>

              {/* School list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map((school, i) => {
                  const st = STATUS_COLOR[school.status] || STATUS_COLOR.active;
                  const isSelected = selectedSchool?.tenantId === school.tenantId;
                  return (
                    <div key={i} onClick={() => setSelectedSchool(isSelected ? null : school)}
                      style={{ background: isSelected ? 'rgba(220,38,38,0.06)' : 'rgba(255,255,255,0.03)', border: '1px solid ' + (isSelected ? 'rgba(220,38,38,0.3)' : 'rgba(255,255,255,0.07)'), borderRadius: 14, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' as const }}>

                      <div style={{ width: 44, height: 44, borderRadius: 12, background: PLAN_COLOR[school.plan] + '20', border: '1px solid ' + PLAN_COLOR[school.plan] + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🏫</div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' as const }}>
                          <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>{school.name}</p>
                          <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>
                            {school.status.toUpperCase()}
                          </span>
                          <span style={{ padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: PLAN_COLOR[school.plan] + '20', color: PLAN_COLOR[school.plan] }}>
                            {school.plan.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{school.region}, {school.country} · {school.adminName}</p>
                      </div>

                      <div style={{ display: 'flex', gap: 16, fontSize: 12, flexWrap: 'wrap' as const }}>
                        <div style={{ textAlign: 'center' as const }}>
                          <p style={{ color: '#3b82f6', fontWeight: 700, margin: 0 }}>{school.students}</p>
                          <p style={{ color: '#475569', margin: 0 }}>Students</p>
                        </div>
                        <div style={{ textAlign: 'center' as const }}>
                          <p style={{ color: '#10b981', fontWeight: 700, margin: 0 }}>{school.teachers}</p>
                          <p style={{ color: '#475569', margin: 0 }}>Teachers</p>
                        </div>
                        <div style={{ textAlign: 'center' as const }}>
                          <p style={{ color: '#f59e0b', fontWeight: 700, margin: 0 }}>${school.monthlyUSD}</p>
                          <p style={{ color: '#475569', margin: 0 }}>Monthly</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* School detail panel */}
              {selectedSchool && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, position: 'sticky' as const, top: 80, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>School Details</h3>
                    <button onClick={() => setSelectedSchool(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: 6, padding: '4px 10px' }}>✕</button>
                  </div>

                  <div style={{ fontSize: '2.5rem', textAlign: 'center' as const, marginBottom: 12 }}>🏫</div>
                  <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1rem', textAlign: 'center' as const, marginBottom: 4 }}>{selectedSchool.name}</h2>
                  <p style={{ color: '#64748b', fontSize: 12, textAlign: 'center' as const, marginBottom: 20 }}>{selectedSchool.region}, {selectedSchool.country}</p>

                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                    {[
                      ['Tenant ID', selectedSchool.tenantId],
                      ['Short Code', selectedSchool.shortCode],
                      ['Plan', selectedSchool.plan.charAt(0).toUpperCase() + selectedSchool.plan.slice(1)],
                      ['Status', selectedSchool.status.toUpperCase()],
                      ['Admin', selectedSchool.adminName],
                      ['Email', selectedSchool.adminEmail],
                      ['Registered', new Date(selectedSchool.registeredAt).toLocaleDateString('en-GB')],
                      ['Last Payment', new Date(selectedSchool.lastPayment).toLocaleDateString('en-GB')],
                      ['Students', String(selectedSchool.students)],
                      ['Teachers', String(selectedSchool.teachers)],
                      ['Parents', String(selectedSchool.parents)],
                      ['Monthly USD', '$' + selectedSchool.monthlyUSD],
                      ['Monthly XAF', selectedSchool.monthlyXAF.toLocaleString() + ' XAF'],
                    ].map(([label, value], i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
                        <span style={{ color: label === 'Status' ? (STATUS_COLOR[selectedSchool.status]?.color || 'white') : 'white', fontSize: 12, fontFamily: label === 'Tenant ID' ? 'monospace' : 'inherit', fontWeight: label === 'Status' ? 700 : 400 }}>{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                    {selectedSchool.status === 'active' ? (
                      <button onClick={() => handleSuspend(selectedSchool)}
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                        🔴 Suspend This School
                      </button>
                    ) : (
                      <button onClick={() => handleReactivate(selectedSchool)}
                        style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                        ✅ Reactivate This School
                      </button>
                    )}
                    <a href={`mailto:${selectedSchool.adminEmail}`}
                      style={{ display: 'block', textAlign: 'center' as const, background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '10px', textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
                      ✉️ Email Admin
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* REVENUE TAB */}
        {tab === 'revenue' && (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Monthly Revenue History</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(30,58,138,0.25)' }}>
                    {['Month', 'Revenue USD', 'Revenue XAF', 'Active Schools', 'Growth'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 20px', textAlign: 'left' as const, color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(59,130,246,0.15)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { month: 'April 2026', usd: '$885.00', xaf: '575,250', schools: 9, growth: '+12%', growthColor: '#34d399' },
                    { month: 'March 2026', usd: '$790.00', xaf: '513,500', schools: 8, growth: '+8%', growthColor: '#34d399' },
                    { month: 'February 2026', usd: '$731.00', xaf: '475,150', schools: 8, growth: '+15%', growthColor: '#34d399' },
                    { month: 'January 2026', usd: '$635.00', xaf: '412,750', schools: 7, growth: '—', growthColor: '#64748b' },
                  ].map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 20px', color: 'white', fontWeight: 600 }}>{r.month}</td>
                      <td style={{ padding: '14px 20px', color: '#34d399', fontWeight: 700, fontSize: 15 }}>{r.usd}</td>
                      <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 13 }}>{r.xaf} XAF</td>
                      <td style={{ padding: '14px 20px', color: '#60a5fa', fontWeight: 600 }}>{r.schools}</td>
                      <td style={{ padding: '14px 20px', color: r.growthColor, fontWeight: 700 }}>{r.growth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Per school revenue */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Revenue by School — This Month</h3>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(30,58,138,0.25)' }}>
                    {['School', 'Plan', 'IDs', 'Monthly USD', 'Monthly XAF', 'Status'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: 'left' as const, color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(59,130,246,0.15)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schools.map((s, i) => {
                    const st = STATUS_COLOR[s.status] || STATUS_COLOR.active;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <p style={{ color: 'white', fontWeight: 600, fontSize: 13, margin: 0 }}>{s.name}</p>
                          <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{s.region}</p>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: PLAN_COLOR[s.plan] + '20', color: PLAN_COLOR[s.plan] }}>
                            {s.plan}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13 }}>{s.students + s.teachers + s.parents + s.admins}</td>
                        <td style={{ padding: '12px 16px', color: '#34d399', fontWeight: 700 }}>${s.monthlyUSD}</td>
                        <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{s.monthlyXAF.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ padding: '3px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700, background: st.bg, color: st.color }}>
                            {s.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>TOTAL ({schools.length} schools)</span>
                <div style={{ display: 'flex', gap: 24 }}>
                  <span style={{ color: '#34d399', fontWeight: 900, fontSize: 16 }}>${totalRevUSD.toFixed(2)}</span>
                  <span style={{ color: '#64748b', fontSize: 13 }}>{totalRevXAF.toLocaleString()} XAF</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AUDIT LOG TAB */}
        {tab === 'audit' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Platform Audit Log</h3>
            </div>
            {loading ? (
              <div style={{ padding: 48, textAlign: 'center' as const, color: '#64748b' }}>Loading...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(30,58,138,0.25)' }}>
                    {['ID', 'Action', 'School', 'Actor', 'Details', 'Time'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: 'left' as const, color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(59,130,246,0.15)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map((log, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 16px', color: '#475569', fontSize: 11, fontFamily: 'monospace' }}>{log.id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{ACTION_ICON[log.type] || '📌'}</span>
                          <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{log.action}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13 }}>{log.school}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{log.actor}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12 }}>{log.detail}</td>
                      <td style={{ padding: '12px 16px', color: '#334155', fontSize: 12 }}>{log.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}