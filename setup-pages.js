// setup-pages.js — PAGE CHECKER AND CREATOR
// Run: node setup-pages.js
// Owner: MUFUNG ANGELBELL MBUYEH

const fs = require('fs');
const path = require('path');

const APP = path.join(process.cwd(), 'frontend-web', 'app');

function ensureExists(relPath, content) {
  const fullPath = path.join(APP, relPath);
  if (fs.existsSync(fullPath)) {
    console.log('OK (exists):', relPath);
    return;
  }
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('CREATED:', relPath);
}

// school-admin/dashboard — the page returning 404
ensureExists('school-admin/dashboard/page.tsx', `'use client';
import Link from 'next/link';
export default function SchoolAdminDashboard() {
  return (
    <div style={{minHeight:'100vh',background:'#080f20',color:'#e2e8f0'}}>
      <header style={{position:'sticky',top:0,zIndex:40,background:'rgba(8,15,32,0.97)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#8b5cf6,#6d28d9)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>🏫</div>
          <div>
            <p style={{color:'white',fontWeight:700,fontSize:14,margin:0}}>School Admin</p>
            <p style={{color:'#8b5cf6',fontSize:11,margin:0,fontFamily:'monospace'}}>CM-GBHS-2026-ADM-0001</p>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{color:'#64748b',fontSize:13}}>Dr. Nkeng Emmanuel</span>
          <Link href="/login" style={{color:'#64748b',fontSize:13,textDecoration:'none',padding:'6px 12px',borderRadius:8,border:'1px solid rgba(255,255,255,0.08)'}}>Sign Out</Link>
        </div>
      </header>
      <div style={{maxWidth:1200,margin:'0 auto',padding:'32px 24px'}}>
        <div style={{background:'linear-gradient(135deg,rgba(139,92,246,0.2),rgba(30,58,138,0.3))',border:'1px solid rgba(139,92,246,0.2)',borderRadius:16,padding:24,marginBottom:28}}>
          <h1 style={{color:'white',fontWeight:900,fontSize:'1.4rem',margin:'0 0 4px'}}>Welcome, Dr. Nkeng 👋</h1>
          <p style={{color:'#94a3b8',fontSize:14,margin:0}}>Government Bilingual High School Bamenda · Admin Panel</p>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:14,marginBottom:32}}>
          {[{l:'Total Students',v:'128',i:'🎓',c:'#3b82f6'},{l:'Total Teachers',v:'22',i:'👨‍🏫',c:'#10b981'},{l:'Active Parents',v:'35',i:'👨‍👩‍👧',c:'#8b5cf6'},{l:'Open Complaints',v:'3',i:'⚖️',c:'#f59e0b'},{l:'Results Published',v:'6',i:'📊',c:'#10b981'},{l:'Monthly Cost',v:'~$111',i:'💳',c:'#ef4444'}].map((s,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:18}}>
              <div style={{fontSize:'2rem',marginBottom:8}}>{s.i}</div>
              <div style={{fontSize:'2rem',fontWeight:900,color:s.c}}>{s.v}</div>
              <div style={{color:'#64748b',fontSize:12,marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>
        <h2 style={{color:'white',fontWeight:700,fontSize:'1rem',marginBottom:16}}>Quick Actions</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:14,marginBottom:32}}>
          {[{l:'Send Broadcast',h:'/school-admin/broadcast',i:'📢',d:'Announce to all users'},{l:'Upload Results',h:'/teacher/results/upload',i:'📊',d:'Publish class results'},{l:'View Complaints',h:'/teacher/complaints/inbox',i:'⚖️',d:'Review student complaints'},{l:'School Settings',h:'#',i:'⚙️',d:'Customize school profile'}].map((a,i)=>(
            <Link key={i} href={a.h} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:20,textDecoration:'none',display:'block'}}>
              <div style={{fontSize:'2rem',marginBottom:10}}>{a.i}</div>
              <p style={{color:'white',fontWeight:700,fontSize:15,margin:'0 0 4px'}}>{a.l}</p>
              <p style={{color:'#64748b',fontSize:12,margin:0}}>{a.d}</p>
            </Link>
          ))}
        </div>
        <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
            <h3 style={{color:'white',fontWeight:700,fontSize:'1rem',margin:0}}>📢 Recent Broadcasts</h3>
            <Link href="/school-admin/broadcast" style={{color:'#60a5fa',textDecoration:'none',fontSize:13,fontWeight:600}}>Send New →</Link>
          </div>
          {[{t:'End of Term Notice',s:'5h ago',r:163},{t:'URGENT: Maintenance Tonight',s:'2 days ago',r:185},{t:'Welcome to First Term 2026',s:'30 days ago',r:163}].map((b,i)=>(
            <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <span style={{color:'#e2e8f0',fontSize:14}}>{b.t}</span>
              <div style={{display:'flex',gap:16,fontSize:12}}>
                <span style={{color:'#64748b'}}>{b.r} recipients</span>
                <span style={{color:'#334155'}}>{b.s}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
`);

console.log('\nDone. Now run: cd frontend-web && npm run dev');
console.log('Test: http://localhost:3000/school-admin/dashboard');