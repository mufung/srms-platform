'use client';
import { useState } from 'react';
import Link from 'next/link';

const name = 'Mr. Fon Emmanuel';
const srmsId = 'CM-GBHS-2026-TCH-0007';

const classes = [
  {name:'Form 5 Science A',students:42,status:'published',complaints:2,avg:72},
  {name:'Form 4 Science B',students:38,status:'draft',complaints:1,avg:65},
  {name:'Form 3 General',students:48,status:'not-uploaded',complaints:0,avg:0},
  {name:'Form 2 Arts A',students:35,status:'published',complaints:0,avg:78},
];

export default function TeacherDashboard(){
  const [tab,setTab]=useState<'classes'|'complaints'>('classes');

  return(
    <div style={{minHeight:'100vh',background:'#080f20',color:'#e2e8f0'}}>
      <header style={{position:'sticky',top:0,zIndex:40,background:'rgba(8,15,32,0.97)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:36,height:36,borderRadius:10,background:'linear-gradient(135deg,#3b82f6,#1e3a8a)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>👨‍🏫</div>
          <div><p style={{color:'white',fontWeight:700,fontSize:14,margin:0}}>Teacher Portal</p><p style={{color:'#60a5fa',fontSize:11,margin:0,fontFamily:'monospace'}}>{srmsId}</p></div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <span style={{color:'#64748b',fontSize:13}}>{name}</span>
          <Link href="/login" style={{color:'#64748b',fontSize:13,textDecoration:'none'}}>Sign Out</Link>
        </div>
      </header>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'32px 24px'}}>

        {/* DEMO BANNER */}
        <div style={{marginBottom:24,padding:'12px 20px',borderRadius:10,background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',display:'flex',alignItems:'center',gap:10}}>
          <span>ℹ️</span>
          <span style={{color:'#60a5fa',fontSize:13}}>Demo Mode — sample data shown. Real teachers log in with MFA to access live class data.</span>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:16,marginBottom:32}}>
          {[
            {label:'Total Students',value:'163',icon:'🎓',color:'#3b82f6'},
            {label:'Results Uploaded',value:'6 subjects',icon:'📊',color:'#10b981'},
            {label:'Open Complaints',value:'3',icon:'⚖️',color:'#f59e0b'},
            {label:'Published',value:'4 sets',icon:'✅',color:'#8b5cf6'},
          ].map((s,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:20}}>
              <div style={{fontSize:'2rem',marginBottom:8}}>{s.icon}</div>
              <div style={{fontSize:'2rem',fontWeight:900,color:s.color}}>{s.value}</div>
              <div style={{color:'#64748b',fontSize:12,marginTop:4}}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
          <h2 style={{color:'white',fontWeight:700,fontSize:'1.2rem',margin:0}}>My Classes</h2>
          <Link href="/teacher/results/upload" style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'white',textDecoration:'none',borderRadius:10,padding:'12px 24px',fontSize:14,fontWeight:700}}>
            + Upload New Results
          </Link>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {classes.map((c,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:'20px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:16}}>
              <div>
                <h3 style={{color:'white',fontWeight:700,fontSize:'1rem',margin:0,marginBottom:4}}>{c.name}</h3>
                <p style={{color:'#64748b',fontSize:13,margin:0}}>{c.students} students enrolled{c.avg>0?' · Class avg: '+c.avg+'%':''}</p>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
                <span style={{padding:'5px 14px',borderRadius:100,fontSize:11,fontWeight:700,
                  background:c.status==='published'?'rgba(16,185,129,0.15)':c.status==='draft'?'rgba(245,158,11,0.15)':'rgba(239,68,68,0.15)',
                  color:c.status==='published'?'#34d399':c.status==='draft'?'#fbbf24':'#f87171'}}>
                  {c.status==='published'?'✅ Published':c.status==='draft'?'📝 Draft':'⬆️ Not Uploaded'}
                </span>
                {c.complaints>0&&<span style={{padding:'5px 14px',borderRadius:100,fontSize:11,fontWeight:700,background:'rgba(239,68,68,0.15)',color:'#f87171'}}>{c.complaints} Complaint{c.complaints>1?'s':''}</span>}
                <Link href="/teacher/results/upload" style={{color:'#60a5fa',textDecoration:'none',fontSize:13,fontWeight:600,padding:'6px 14px',borderRadius:8,border:'1px solid rgba(59,130,246,0.3)'}}>
                  {c.status==='not-uploaded'?'Upload Results':'Edit Results'}
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div style={{marginTop:32,background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:24}}>
          <h3 style={{color:'white',fontWeight:700,fontSize:'1rem',marginBottom:16}}>⚖️ Pending Complaints (3)</h3>
          {[
            {student:'Alice Bah',subject:'Mathematics',claim:'Score entered as 45 but exam paper shows 75',time:'2 hours ago'},
            {student:'Bob Ngwa',subject:'Mathematics',claim:'Missing marks for question 5B',time:'1 day ago'},
            {student:'Mary Fon',subject:'Mathematics',claim:'Grade shows F but I scored above pass mark',time:'2 days ago'},
          ].map((c,i)=>(
            <div key={i} style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'14px 0',borderBottom:i<2?'1px solid rgba(255,255,255,0.05)':'none',flexWrap:'wrap',gap:12}}>
              <div>
                <p style={{color:'white',fontWeight:600,fontSize:14,margin:'0 0 4px'}}>{c.student} — {c.subject}</p>
                <p style={{color:'#94a3b8',fontSize:13,margin:'0 0 4px',fontStyle:'italic'}}>"{c.claim}"</p>
                <p style={{color:'#475569',fontSize:11,margin:0}}>{c.time}</p>
              </div>
              <Link href="/teacher/complaints/inbox" style={{background:'rgba(59,130,246,0.15)',color:'#60a5fa',border:'1px solid rgba(59,130,246,0.3)',borderRadius:8,padding:'8px 16px',textDecoration:'none',fontSize:12,fontWeight:600,whiteSpace:'nowrap' as const}}>
                Review Complaint →
              </Link>
            </div>
          ))}
          <p style={{color:'#475569',fontSize:12,marginTop:12}}>Full complaint review system comes in Phase 5.</p>
        </div>

        {/* AI Tool Banner */}
        <div style={{ marginTop: 24, background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h3 style={{ color: '#a5b4fc', fontWeight: 800, fontSize: '1rem', margin: '0 0 4px' }}>🤖 AI Anomaly Detector</h3>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Before publishing results, run AI analysis to catch data entry errors and suspicious scores.</p>
          </div>
          <Link href="/teacher/ai" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', textDecoration: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
            Run AI Check →
          </Link>
        </div>

      </div>
    </div>
  );
}