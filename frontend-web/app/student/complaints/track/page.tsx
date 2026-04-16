'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Complaint {
  complaintId: string;
  subjectName: string;
  reason: string;
  status: 'open'|'reviewing'|'resolved'|'rejected'|'needs-evidence';
  priority: 'high'|'medium'|'low';
  currentScore: number;
  claimedScore: number;
  correctedScore?: number;
  teacherResponse?: string;
  hasProof: boolean;
  createdAt: string;
  resolvedAt?: string;
  statusHistory: {status:string;timestamp:string;note:string}[];
}

const DEMO_COMPLAINTS: Complaint[] = [
  {
    complaintId:'CMP-SRMS-ABC123-XY12',
    subjectName:'Physics',
    reason:'wrong_score',
    status:'resolved',
    priority:'high',
    currentScore:45,
    claimedScore:75,
    correctedScore:72,
    teacherResponse:'After reviewing your exam paper, I confirmed the marking error. Your score has been corrected from 45 to 72. The grade has been updated to C. Thank you for bringing this to our attention.',
    hasProof:true,
    createdAt:new Date(Date.now()-4*24*60*60*1000).toISOString(),
    resolvedAt:new Date(Date.now()-1*24*60*60*1000).toISOString(),
    statusHistory:[
      {status:'open',timestamp:new Date(Date.now()-4*24*60*60*1000).toISOString(),note:'Complaint submitted by student'},
      {status:'reviewing',timestamp:new Date(Date.now()-3*24*60*60*1000).toISOString(),note:'Teacher reviewing exam paper'},
      {status:'resolved',timestamp:new Date(Date.now()-1*24*60*60*1000).toISOString(),note:'Score corrected from 45 to 72'},
    ],
  },
  {
    complaintId:'CMP-SRMS-DEF456-MN34',
    subjectName:'Geography',
    reason:'missing_marks',
    status:'reviewing',
    priority:'medium',
    currentScore:55,
    claimedScore:68,
    hasProof:true,
    createdAt:new Date(Date.now()-2*24*60*60*1000).toISOString(),
    statusHistory:[
      {status:'open',timestamp:new Date(Date.now()-2*24*60*60*1000).toISOString(),note:'Complaint submitted by student'},
      {status:'reviewing',timestamp:new Date(Date.now()-1*24*60*60*1000).toISOString(),note:'Teacher reviewing submitted evidence'},
    ],
  },
  {
    complaintId:'CMP-SRMS-GHI789-OP56',
    subjectName:'Chemistry',
    reason:'calculation_error',
    status:'needs-evidence',
    priority:'medium',
    currentScore:62,
    claimedScore:70,
    teacherResponse:'Please provide a clearer photo of your answer to question 4. The image submitted is too blurry to read.',
    hasProof:false,
    createdAt:new Date(Date.now()-5*24*60*60*1000).toISOString(),
    statusHistory:[
      {status:'open',timestamp:new Date(Date.now()-5*24*60*60*1000).toISOString(),note:'Complaint submitted by student'},
      {status:'needs-evidence',timestamp:new Date(Date.now()-3*24*60*60*1000).toISOString(),note:'Teacher requests clearer photo of question 4'},
    ],
  },
];

const STATUS_CONFIG = {
  open: { label:'Open', color:'#f59e0b', bg:'rgba(245,158,11,0.15)', icon:'🟡' },
  reviewing: { label:'Under Review', color:'#3b82f6', bg:'rgba(59,130,246,0.15)', icon:'🔵' },
  resolved: { label:'Resolved', color:'#10b981', bg:'rgba(16,185,129,0.15)', icon:'🟢' },
  rejected: { label:'Rejected', color:'#ef4444', bg:'rgba(239,68,68,0.15)', icon:'🔴' },
  'needs-evidence': { label:'More Evidence Needed', color:'#8b5cf6', bg:'rgba(139,92,246,0.15)', icon:'🟣' },
};

const PRIORITY_CONFIG = {
  high: { label:'High', color:'#ef4444', bg:'rgba(239,68,68,0.1)' },
  medium: { label:'Medium', color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
  low: { label:'Low', color:'#10b981', bg:'rgba(16,185,129,0.1)' },
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 0) return days + ' day' + (days>1?'s':'') + ' ago';
  if (hours > 0) return hours + ' hour' + (hours>1?'s':'') + ' ago';
  return mins + ' minute' + (mins>1?'s':'') + ' ago';
}

export default function TrackComplaintsPage() {
  const [complaints] = useState<Complaint[]>(DEMO_COMPLAINTS);
  const [selected, setSelected] = useState<Complaint|null>(null);
  const [filter, setFilter] = useState('all');

  const filtered = filter === 'all' ? complaints : complaints.filter(c => c.status === filter);

  const summary = {
    total: complaints.length,
    open: complaints.filter(c => c.status==='open').length,
    reviewing: complaints.filter(c => c.status==='reviewing').length,
    resolved: complaints.filter(c => c.status==='resolved').length,
    rejected: complaints.filter(c => c.status==='rejected').length,
  };

  return (
    <div style={{minHeight:'100vh',background:'#080f20',color:'#e2e8f0'}}>
      <header style={{position:'sticky',top:0,zIndex:40,background:'rgba(8,15,32,0.97)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Link href="/student/dashboard" style={{color:'#64748b',textDecoration:'none',fontSize:14}}>← Dashboard</Link>
          <span style={{color:'#334155'}}>|</span>
          <span style={{color:'white',fontWeight:700}}>My Complaints</span>
        </div>
        <Link href="/student/complaints/new" style={{background:'linear-gradient(135deg,#d97706,#f59e0b)',color:'#0f172a',textDecoration:'none',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:700}}>
          + New Complaint
        </Link>
      </header>

      <div style={{maxWidth:1200,margin:'0 auto',padding:'32px 24px'}}>

        {/* Summary cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:28}}>
          {[
            {label:'Total',value:summary.total,color:'#3b82f6',icon:'📋'},
            {label:'Open',value:summary.open,color:'#f59e0b',icon:'🟡'},
            {label:'Under Review',value:summary.reviewing,color:'#3b82f6',icon:'🔵'},
            {label:'Resolved',value:summary.resolved,color:'#10b981',icon:'🟢'},
            {label:'Rejected',value:summary.rejected,color:'#ef4444',icon:'🔴'},
          ].map((c,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:16,textAlign:'center'}}>
              <div style={{fontSize:'1.5rem',marginBottom:6}}>{c.icon}</div>
              <div style={{fontSize:'2rem',fontWeight:900,color:c.color}}>{c.value}</div>
              <div style={{color:'#64748b',fontSize:11,marginTop:4}}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.04)',borderRadius:12,padding:4,width:'fit-content',marginBottom:24}}>
          {[['all','All'],['open','Open'],['reviewing','Reviewing'],['resolved','Resolved'],['rejected','Rejected']].map(([val,label])=>(
            <button key={val} onClick={()=>setFilter(val)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:filter===val?'linear-gradient(135deg,#1d4ed8,#3b82f6)':'transparent',color:filter===val?'white':'#64748b'}}>
              {label}
            </button>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:selected?'1fr 1.2fr':'1fr',gap:24}}>
          {/* Complaints list */}
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            {filtered.length === 0 && (
              <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:48,textAlign:'center'}}>
                <div style={{fontSize:'3rem',marginBottom:12}}>📭</div>
                <p style={{color:'#64748b',fontSize:14}}>No complaints in this category.</p>
                <Link href="/student/complaints/new" style={{display:'inline-block',marginTop:12,color:'#60a5fa',fontSize:13,textDecoration:'none'}}>Raise a new complaint →</Link>
              </div>
            )}
            {filtered.map((c,i)=>{
              const st=STATUS_CONFIG[c.status]||STATUS_CONFIG.open;
              const pr=PRIORITY_CONFIG[c.priority];
              return(
                <button key={i} onClick={()=>setSelected(selected?.complaintId===c.complaintId?null:c)}
                  style={{textAlign:'left',background:selected?.complaintId===c.complaintId?'rgba(59,130,246,0.08)':'rgba(255,255,255,0.03)',border:'1px solid '+(selected?.complaintId===c.complaintId?'rgba(59,130,246,0.4)':'rgba(255,255,255,0.08)'),borderRadius:14,padding:20,cursor:'pointer',transition:'all 0.2s'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
                    <div>
                      <p style={{color:'white',fontWeight:700,fontSize:15,margin:0,marginBottom:4}}>{c.subjectName}</p>
                      <p style={{color:'#64748b',fontSize:11,margin:0,fontFamily:'monospace'}}>{c.complaintId}</p>
                    </div>
                    <div style={{display:'flex',gap:8,alignItems:'center'}}>
                      <span style={{padding:'3px 10px',borderRadius:100,fontSize:10,fontWeight:700,background:pr.bg,color:pr.color}}>{pr.label}</span>
                      <span style={{padding:'3px 10px',borderRadius:100,fontSize:10,fontWeight:700,background:st.bg,color:st.color}}>{st.icon} {st.label}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:20,fontSize:12,color:'#64748b'}}>
                    <span>Score: <strong style={{color:'#ef4444'}}>{c.currentScore}</strong> → claimed: <strong style={{color:'#10b981'}}>{c.claimedScore}</strong></span>
                    {c.correctedScore && <span>✅ Corrected to: <strong style={{color:'#10b981'}}>{c.correctedScore}</strong></span>}
                    <span>{timeAgo(c.createdAt)}</span>
                  </div>
                  {c.status==='needs-evidence'&&<div style={{marginTop:10,padding:'8px 12px',borderRadius:8,background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)'}}><p style={{color:'#a78bfa',fontSize:12,margin:0}}>🟣 Teacher is requesting more evidence from you</p></div>}
                </button>
              );
            })}
          </div>

          {/* Complaint detail panel */}
          {selected && (() => {
            const st=STATUS_CONFIG[selected.status]||STATUS_CONFIG.open;
            return(
              <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:24,position:'sticky',top:80,maxHeight:'calc(100vh - 120px)',overflowY:'auto'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                  <h3 style={{color:'white',fontWeight:700,fontSize:'1rem',margin:0}}>Complaint Details</h3>
                  <button onClick={()=>setSelected(null)} style={{background:'rgba(255,255,255,0.05)',border:'none',color:'#64748b',cursor:'pointer',borderRadius:6,padding:'4px 10px',fontSize:12}}>✕ Close</button>
                </div>

                <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 16px',borderRadius:100,background:st.bg,border:'1px solid '+st.color+'30',marginBottom:20}}>
                  <span style={{fontSize:'1rem'}}>{st.icon}</span>
                  <span style={{color:st.color,fontWeight:700,fontSize:14}}>{st.label}</span>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:14,marginBottom:24}}>
                  {[
                    ['Complaint ID',selected.complaintId],
                    ['Subject',selected.subjectName],
                    ['Score on Record',String(selected.currentScore)],
                    ['Score You Claimed',String(selected.claimedScore)],
                    selected.correctedScore?['Corrected To',String(selected.correctedScore)]:null,
                    ['Proof Attached',selected.hasProof?'Yes — uploaded':'No'],
                    ['Submitted',timeAgo(selected.createdAt)],
                    selected.resolvedAt?['Resolved',timeAgo(selected.resolvedAt)]:null,
                  ].filter(Boolean).map(([label,value],i)=>(
                    <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                      <span style={{color:'#64748b',fontSize:13}}>{label}</span>
                      <span style={{color:label==='Corrected To'?'#34d399':label==='Score on Record'?'#f87171':'white',fontSize:13,fontWeight:label==='Complaint ID'?700:400,fontFamily:label==='Complaint ID'?'monospace':'inherit'}}>{value}</span>
                    </div>
                  ))}
                </div>

                {selected.teacherResponse && (
                  <div style={{background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',borderRadius:12,padding:16,marginBottom:24}}>
                    <p style={{color:'#60a5fa',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:8}}>Teacher's Response</p>
                    <p style={{color:'#e2e8f0',fontSize:14,lineHeight:1.6,margin:0}}>{selected.teacherResponse}</p>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <p style={{color:'#64748b',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>Complaint Timeline</p>
                  <div style={{position:'relative',paddingLeft:24}}>
                    <div style={{position:'absolute',left:8,top:0,bottom:0,width:1,background:'rgba(255,255,255,0.08)'}}/>
                    {selected.statusHistory.map((h,i)=>{
                      const cfg=STATUS_CONFIG[h.status as keyof typeof STATUS_CONFIG]||STATUS_CONFIG.open;
                      return(
                        <div key={i} style={{position:'relative',marginBottom:20,paddingLeft:8}}>
                          <div style={{position:'absolute',left:-18,top:2,width:12,height:12,borderRadius:'50%',background:cfg.color,border:'2px solid #080f20'}}/>
                          <p style={{color:cfg.color,fontSize:11,fontWeight:700,textTransform:'uppercase',margin:'0 0 4px'}}>{cfg.label}</p>
                          <p style={{color:'#e2e8f0',fontSize:13,margin:'0 0 4px',lineHeight:1.5}}>{h.note}</p>
                          <p style={{color:'#475569',fontSize:11,margin:0}}>{timeAgo(h.timestamp)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selected.status==='needs-evidence'&&(
                  <Link href={'/student/complaints/new?subject='+encodeURIComponent(selected.subjectName)+'&score='+selected.currentScore}
                    style={{display:'block',textAlign:'center',marginTop:16,background:'linear-gradient(135deg,#7c3aed,#8b5cf6)',color:'white',textDecoration:'none',borderRadius:10,padding:12,fontWeight:700,fontSize:13}}>
                    📎 Submit Additional Evidence →
                  </Link>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
