'use client';

import Link from 'next/link';

const adminName = 'Dr. Nkeng Emmanuel';
const schoolName = 'Government Bilingual High School Bamenda';
const srmsId = 'CM-GBHS-2026-ADM-0001';

const stats = [
  { label:'Total Students', value:'128', icon:'🎓', color:'#3b82f6' },
  { label:'Total Teachers', value:'22', icon:'👨‍🏫', color:'#10b981' },
  { label:'Active Parents', value:'35', icon:'👨‍👩‍👧', color:'#8b5cf6' },
  { label:'Open Complaints', value:'3', icon:'⚖️', color:'#f59e0b' },
  { label:'Results Published', value:'6', icon:'📊', color:'#10b981' },
  { label:'Monthly Cost', value:'~$111', icon:'💳', color:'#ef4444' },
];

const actions = [
  { label:'Send Broadcast', href:'/school-admin/broadcast', icon:'📢', color:'#3b82f6', desc:'Announce to students, teachers, parents' },
  { label:'View Billing', href:'/school-admin/billing', icon:'💳', color:'#f59e0b', desc:'Pay monthly bill and view invoices' },
  { label:'Upload Results', href:'/teacher/results/upload', icon:'📊', color:'#10b981', desc:'Publish class results for a subject' },
  { label:'View Complaints', href:'/teacher/complaints/inbox', icon:'⚖️', color:'#f59e0b', desc:'Review and respond to student complaints' },
  { label:'School Settings', href:'#', icon:'⚙️', color:'#8b5cf6', desc:'Customize your school profile' },
];

export default function SchoolAdminDashboard() {
  return (
    <div style={{ minHeight:'100vh', background:'#080f20', color:'#e2e8f0' }}>
      <header style={{ position:'sticky', top:0, zIndex:40, background:'rgba(8,15,32,0.97)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#8b5cf6,#6d28d9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🏫</div>
          <div>
            <p style={{ color:'white', fontWeight:700, fontSize:14, margin:0 }}>School Admin</p>
            <p style={{ color:'#8b5cf6', fontSize:11, margin:0, fontFamily:'monospace' }}>{srmsId}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ color:'#64748b', fontSize:13 }}>{adminName}</span>
          <Link href="/login" style={{ color:'#64748b', fontSize:13, textDecoration:'none', padding:'6px 12px', borderRadius:8, border:'1px solid rgba(255,255,255,0.08)' }}>Sign Out</Link>
        </div>
      </header>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'32px 24px' }}>

        <div style={{ background:'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(30,58,138,0.3))', border:'1px solid rgba(139,92,246,0.2)', borderRadius:16, padding:24, marginBottom:28 }}>
          <h1 style={{ color:'white', fontWeight:900, fontSize:'1.4rem', margin:'0 0 4px' }}>Welcome, {adminName.split(' ')[0]} 👋</h1>
          <p style={{ color:'#94a3b8', fontSize:14, margin:0 }}>{schoolName} · Admin Panel · {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})}</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:14, marginBottom:32 }}>
          {stats.map((s,i) => (
            <div key={i} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:18 }}>
              <div style={{ fontSize:'2rem', marginBottom:8 }}>{s.icon}</div>
              <div style={{ fontSize:'2rem', fontWeight:900, color:s.color }}>{s.value}</div>
              <div style={{ color:'#64748b', fontSize:12, marginTop:4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <h2 style={{ color:'white', fontWeight:700, fontSize:'1rem', marginBottom:16 }}>Quick Actions</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14, marginBottom:32 }}>
          {actions.map((a,i) => (
            <Link key={i} href={a.href} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, padding:20, textDecoration:'none', display:'block' }}>
              <div style={{ fontSize:'2rem', marginBottom:10 }}>{a.icon}</div>
              <p style={{ color:'white', fontWeight:700, fontSize:15, margin:'0 0 4px' }}>{a.label}</p>
              <p style={{ color:'#64748b', fontSize:12, margin:0 }}>{a.desc}</p>
            </Link>
          ))}
        </div>

        <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:14, padding:20 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <h3 style={{ color:'white', fontWeight:700, fontSize:'1rem', margin:0 }}>📢 Recent Broadcasts</h3>
            <Link href="/school-admin/broadcast" style={{ color:'#60a5fa', textDecoration:'none', fontSize:13, fontWeight:600 }}>Send New →</Link>
          </div>
          {[
            { title:'End of Term Notice', sent:'5h ago', recipients:163, urgent:false },
            { title:'URGENT: System Maintenance Tonight', sent:'2 days ago', recipients:185, urgent:true },
            { title:'Welcome to First Term 2026', sent:'30 days ago', recipients:163, urgent:false },
          ].map((b,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color:'#e2e8f0', fontSize:14 }}>{b.urgent && '🚨 '}{b.title}</span>
              <div style={{ display:'flex', gap:16, fontSize:12 }}>
                <span style={{ color:'#64748b' }}>{b.recipients} recipients</span>
                <span style={{ color:'#334155' }}>{b.sent}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}