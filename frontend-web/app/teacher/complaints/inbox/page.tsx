'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Complaint {
  complaintId:string;studentId:string;studentName:string;subjectName:string;
  reason:string;status:string;priority:string;currentScore:number;claimedScore:number;
  description:string;hasProof:boolean;createdAt:string;correctedScore?:number;
  teacherResponse?:string;statusHistory:{status:string;timestamp:string;note:string}[];
}

const DEMO_INBOX: Complaint[] = [
  {complaintId:'CMP-SRMS-AAA111-BB22',studentId:'CM-GBHS-2026-STU-0042',studentName:'Tabe Collins Mbuye',subjectName:'Mathematics',reason:'wrong_score',status:'open',priority:'high',currentScore:45,claimedScore:75,description:'In question 7, I correctly solved all the integration problems but only received 10 marks instead of 25. My workings are clearly shown on the exam paper. Please review.',hasProof:true,createdAt:new Date(Date.now()-6*60*60*1000).toISOString(),statusHistory:[{status:'open',timestamp:new Date(Date.now()-6*60*60*1000).toISOString(),note:'Complaint submitted by student'}]},
  {complaintId:'CMP-SRMS-CCC333-DD44',studentId:'CM-GBHS-2026-STU-0018',studentName:'Alice Bih Nkeng',subjectName:'Mathematics',reason:'missing_marks',status:'reviewing',priority:'medium',currentScore:60,claimedScore:72,description:'The marks for section B question 3 were not added to my total. I answered 4 out of 5 sub-questions correctly. The teacher marked them correct but the marks are missing from the total.',hasProof:true,createdAt:new Date(Date.now()-2*24*60*60*1000).toISOString(),statusHistory:[{status:'open',timestamp:new Date(Date.now()-2*24*60*60*1000).toISOString(),note:'Complaint submitted'},{status:'reviewing',timestamp:new Date(Date.now()-1*24*60*60*1000).toISOString(),note:'Teacher reviewing'}]},
  {complaintId:'CMP-SRMS-EEE555-FF66',studentId:'CM-GBHS-2026-STU-0031',studentName:'Bob Ngwa Tangem',subjectName:'Mathematics',reason:'calculation_error',status:'open',priority:'low',currentScore:78,claimedScore:82,description:'The total at the bottom of my paper was added incorrectly. The individual marks add up to 82 but the total recorded is 78.',hasProof:false,createdAt:new Date(Date.now()-3*24*60*60*1000).toISOString(),statusHistory:[{status:'open',timestamp:new Date(Date.now()-3*24*60*60*1000).toISOString(),note:'Complaint submitted'}]},
];

const STATUS_CFG: Record<string,{label:string;color:string;bg:string;icon:string}> = {
  open:{label:'Open',color:'#f59e0b',bg:'rgba(245,158,11,0.15)',icon:'🟡'},
  reviewing:{label:'Reviewing',color:'#3b82f6',bg:'rgba(59,130,246,0.15)',icon:'🔵'},
  resolved:{label:'Resolved',color:'#10b981',bg:'rgba(16,185,129,0.15)',icon:'🟢'},
  rejected:{label:'Rejected',color:'#ef4444',bg:'rgba(239,68,68,0.15)',icon:'🔴'},
  'needs-evidence':{label:'Needs Evidence',color:'#8b5cf6',bg:'rgba(139,92,246,0.15)',icon:'🟣'},
};

function timeAgo(d:string){const diff=Date.now()-new Date(d).getTime();const h=Math.floor(diff/3600000);const days=Math.floor(diff/86400000);return days>0?days+'d ago':h>0?h+'h ago':'Just now';}

export default function TeacherComplaintsInbox(){
  const [complaints,setComplaints]=useState<Complaint[]>(DEMO_INBOX);
  const [selected,setSelected]=useState<Complaint|null>(null);
  const [filter,setFilter]=useState('all');
  const [correctedScore,setCorrectedScore]=useState('');
  const [teacherNote,setTeacherNote]=useState('');
  const [action,setAction]=useState<'resolve'|'reject'|'evidence'|null>(null);
  const [processing,setProcessing]=useState(false);
  const [successMsg,setSuccessMsg]=useState('');

  const filtered=filter==='all'?complaints:complaints.filter(c=>c.status===filter);

  const handleAction=async()=>{
    if(!selected||!action)return;
    if(action==='resolve'&&!correctedScore){alert('Enter the corrected score');return;}
    if((action==='reject'||action==='evidence')&&!teacherNote.trim()){alert('Enter a note explaining your decision');return;}

    setProcessing(true);
    await new Promise(r=>setTimeout(r,1000));

    const statusMap={resolve:'resolved',reject:'rejected',evidence:'needs-evidence'};
    const newStatus=statusMap[action];

    setComplaints(prev=>prev.map(c=>{
      if(c.complaintId!==selected.complaintId)return c;
      return{
        ...c,status:newStatus,
        correctedScore:action==='resolve'&&correctedScore?parseFloat(correctedScore):c.correctedScore,
        teacherResponse:teacherNote||c.teacherResponse,
        statusHistory:[...c.statusHistory,{status:newStatus,timestamp:new Date().toISOString(),note:teacherNote||'Teacher action taken'}],
      };
    }));

    const msgs={resolve:'✅ Complaint resolved. Score corrected to '+correctedScore+'. Student will be notified.',reject:'Complaint rejected. Student has been notified.',evidence:'Student has been asked to provide more evidence.'};
    setSuccessMsg(msgs[action]);
    setAction(null);setCorrectedScore('');setTeacherNote('');
    setSelected(null);setProcessing(false);

    setTimeout(()=>setSuccessMsg(''),5000);
  };

  const inpS:React.CSSProperties={background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'12px 14px',color:'#e2e8f0',fontSize:14,width:'100%',outline:'none',boxSizing:'border-box'};

  return(
    <div style={{minHeight:'100vh',background:'#080f20',color:'#e2e8f0'}}>
      <header style={{position:'sticky',top:0,zIndex:40,background:'rgba(8,15,32,0.97)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Link href="/teacher/dashboard" style={{color:'#64748b',textDecoration:'none',fontSize:14}}>← Dashboard</Link>
          <span style={{color:'#334155'}}>|</span>
          <span style={{color:'white',fontWeight:700}}>Complaint Inbox</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:100,background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.2)'}}>
          <span style={{color:'#fbbf24',fontWeight:700,fontSize:13}}>{complaints.filter(c=>c.status==='open').length} Open</span>
          <span style={{color:'#475569',fontSize:11}}>complaints</span>
        </div>
      </header>

      <div style={{maxWidth:1400,margin:'0 auto',padding:'32px 24px'}}>

        {successMsg&&<div style={{marginBottom:24,padding:'16px 20px',borderRadius:12,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',color:'#34d399',fontSize:14}}>{successMsg}</div>}

        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:14,marginBottom:28}}>
          {[
            {label:'Total',value:complaints.length,color:'#3b82f6',icon:'📋'},
            {label:'Open',value:complaints.filter(c=>c.status==='open').length,color:'#f59e0b',icon:'🟡'},
            {label:'Reviewing',value:complaints.filter(c=>c.status==='reviewing').length,color:'#3b82f6',icon:'🔵'},
            {label:'Resolved',value:complaints.filter(c=>c.status==='resolved').length,color:'#10b981',icon:'🟢'},
            {label:'High Priority',value:complaints.filter(c=>c.priority==='high').length,color:'#ef4444',icon:'🔥'},
          ].map((c,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:16,textAlign:'center'}}>
              <div style={{fontSize:'1.3rem',marginBottom:4}}>{c.icon}</div>
              <div style={{fontSize:'1.8rem',fontWeight:900,color:c.color}}>{c.value}</div>
              <div style={{color:'#64748b',fontSize:11,marginTop:2}}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={{display:'flex',gap:4,background:'rgba(255,255,255,0.04)',borderRadius:12,padding:4,width:'fit-content',marginBottom:24}}>
          {[['all','All'],['open','Open'],['reviewing','Reviewing'],['resolved','Resolved']].map(([v,l])=>(
            <button key={v} onClick={()=>setFilter(v)} style={{padding:'8px 16px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:600,background:filter===v?'linear-gradient(135deg,#1d4ed8,#3b82f6)':'transparent',color:filter===v?'white':'#64748b'}}>
              {l}
            </button>
          ))}
        </div>

        <div style={{display:'grid',gridTemplateColumns:selected?'1fr 1.4fr':'1fr',gap:24,alignItems:'start'}}>
          {/* Inbox list */}
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {filtered.map((c,i)=>{
              const st=STATUS_CFG[c.status]||STATUS_CFG.open;
              const isSelected=selected?.complaintId===c.complaintId;
              return(
                <button key={i} onClick={()=>setSelected(isSelected?null:c)}
                  style={{textAlign:'left',background:isSelected?'rgba(59,130,246,0.08)':'rgba(255,255,255,0.03)',border:'1px solid '+(isSelected?'rgba(59,130,246,0.4)':'rgba(255,255,255,0.07)'),borderRadius:14,padding:18,cursor:'pointer',transition:'all 0.2s'}}>
                  <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                    <div>
                      <p style={{color:'white',fontWeight:700,fontSize:14,margin:0,marginBottom:2}}>{c.studentName}</p>
                      <p style={{color:'#64748b',fontSize:11,margin:0,fontFamily:'monospace'}}>{c.studentId}</p>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      {c.priority==='high'&&<span style={{padding:'2px 8px',borderRadius:100,fontSize:10,fontWeight:700,background:'rgba(239,68,68,0.15)',color:'#f87171'}}>🔥 HIGH</span>}
                      <span style={{padding:'2px 8px',borderRadius:100,fontSize:10,fontWeight:700,background:st.bg,color:st.color}}>{st.icon} {st.label}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                    <span style={{background:'rgba(59,130,246,0.1)',color:'#60a5fa',padding:'3px 10px',borderRadius:6,fontSize:12,fontWeight:600}}>{c.subjectName}</span>
                    <span style={{color:'#475569',fontSize:12}}>Score: <strong style={{color:'#ef4444'}}>{c.currentScore}</strong> → claimed <strong style={{color:'#10b981'}}>{c.claimedScore}</strong></span>
                  </div>
                  <p style={{color:'#64748b',fontSize:12,margin:0,lineHeight:1.5,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{c.description}</p>
                  <div style={{display:'flex',alignItems:'center',gap:16,marginTop:10}}>
                    <span style={{color:'#334155',fontSize:11}}>{timeAgo(c.createdAt)}</span>
                    {c.hasProof&&<span style={{color:'#34d399',fontSize:11,fontWeight:600}}>📎 Has Proof</span>}
                  </div>
                </button>
              );
            })}
            {filtered.length===0&&(
              <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:48,textAlign:'center'}}>
                <div style={{fontSize:'3rem',marginBottom:12}}>📭</div>
                <p style={{color:'#64748b'}}>No complaints in this category.</p>
              </div>
            )}
          </div>

          {/* Complaint detail and action panel */}
          {selected&&(
            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:24,position:'sticky',top:80}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                <h3 style={{color:'white',fontWeight:700,fontSize:'1rem',margin:0}}>⚖️ Review Complaint</h3>
                <button onClick={()=>{setSelected(null);setAction(null);}} style={{background:'rgba(255,255,255,0.05)',border:'none',color:'#64748b',cursor:'pointer',borderRadius:6,padding:'4px 10px',fontSize:12}}>✕</button>
              </div>

              {/* Student and complaint info */}
              <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:16,marginBottom:20}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                  {[
                    ['Student',selected.studentName],
                    ['Student ID',selected.studentId],
                    ['Subject',selected.subjectName],
                    ['Complaint ID',selected.complaintId],
                    ['Score on Record',String(selected.currentScore)],
                    ['Score Claimed',String(selected.claimedScore)],
                    ['Score Difference',Math.abs(selected.claimedScore-selected.currentScore)+' marks'],
                    ['Has Proof',selected.hasProof?'✅ Yes':'❌ No'],
                  ].map(([l,v],i)=>(
                    <div key={i} style={{padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                      <p style={{color:'#64748b',fontSize:10,margin:'0 0 2px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{l}</p>
                      <p style={{color:l==='Score on Record'?'#f87171':l==='Score Claimed'?'#34d399':'white',fontSize:13,margin:0,fontFamily:l==='Student ID'||l==='Complaint ID'?'monospace':'inherit',fontWeight:l==='Score Difference'?700:400}}>{v}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Student description */}
              <div style={{background:'rgba(59,130,246,0.05)',border:'1px solid rgba(59,130,246,0.15)',borderRadius:12,padding:16,marginBottom:20}}>
                <p style={{color:'#60a5fa',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:8}}>Student's Description</p>
                <p style={{color:'#e2e8f0',fontSize:14,lineHeight:1.7,margin:0}}>{selected.description}</p>
              </div>

              {/* Proof indicator */}
              {selected.hasProof&&(
                <div style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:12,padding:14,marginBottom:20}}>
                  <p style={{color:'#34d399',fontSize:13,fontWeight:600,margin:0}}>📸 Student has uploaded proof (exam paper photo or document)</p>
                  <p style={{color:'#475569',fontSize:12,margin:'4px 0 0'}}>In production, click to view the uploaded file from S3.</p>
                </div>
              )}

              {/* Action buttons */}
              {(selected.status==='open'||selected.status==='reviewing')&&!action&&(
                <div>
                  <p style={{color:'#64748b',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Take Action</p>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <button onClick={()=>setAction('resolve')} style={{padding:'12px 16px',borderRadius:10,border:'1px solid rgba(16,185,129,0.3)',background:'rgba(16,185,129,0.08)',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:'1.5rem'}}>✅</span>
                      <div><p style={{color:'#34d399',fontWeight:700,fontSize:14,margin:0}}>Resolve — Correct the Score</p><p style={{color:'#475569',fontSize:12,margin:'2px 0 0'}}>The student is right. Update the score.</p></div>
                    </button>
                    <button onClick={()=>setAction('evidence')} style={{padding:'12px 16px',borderRadius:10,border:'1px solid rgba(139,92,246,0.3)',background:'rgba(139,92,246,0.08)',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:'1.5rem'}}>📎</span>
                      <div><p style={{color:'#a78bfa',fontWeight:700,fontSize:14,margin:0}}>Request More Evidence</p><p style={{color:'#475569',fontSize:12,margin:'2px 0 0'}}>Ask student to provide additional proof.</p></div>
                    </button>
                    <button onClick={()=>setAction('reject')} style={{padding:'12px 16px',borderRadius:10,border:'1px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.08)',cursor:'pointer',textAlign:'left',display:'flex',alignItems:'center',gap:12}}>
                      <span style={{fontSize:'1.5rem'}}>❌</span>
                      <div><p style={{color:'#f87171',fontWeight:700,fontSize:14,margin:0}}>Reject Complaint</p><p style={{color:'#475569',fontSize:12,margin:'2px 0 0'}}>The score is correct. Dismiss complaint.</p></div>
                    </button>
                  </div>
                </div>
              )}

              {/* Resolve form */}
              {action==='resolve'&&(
                <div style={{background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:12,padding:18}}>
                  <p style={{color:'#34d399',fontWeight:700,fontSize:14,marginBottom:16}}>✅ Correct the Score</p>
                  <div style={{marginBottom:14}}>
                    <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Corrected Score *</label>
                    <input style={inpS} type="number" placeholder="Enter the correct score e.g. 72" value={correctedScore} onChange={e=>setCorrectedScore(e.target.value)}/>
                    <p style={{color:'#475569',fontSize:11,marginTop:6}}>Current: {selected.currentScore} → Student claimed: {selected.claimedScore}</p>
                  </div>
                  <div style={{marginBottom:14}}>
                    <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Note to Student *</label>
                    <textarea style={{...inpS,minHeight:90,resize:'vertical',lineHeight:1.6}} placeholder="Explain what happened and confirm the correction..." value={teacherNote} onChange={e=>setTeacherNote(e.target.value)}/>
                  </div>
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>setAction(null)} style={{flex:1,background:'rgba(255,255,255,0.05)',color:'#64748b',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:12,cursor:'pointer',fontWeight:600}}>Cancel</button>
                    <button onClick={handleAction} disabled={processing} style={{flex:2,background:processing?'#334155':'linear-gradient(135deg,#059669,#10b981)',color:'white',border:'none',borderRadius:8,padding:12,cursor:processing?'not-allowed':'pointer',fontWeight:700}}>
                      {processing?'Processing...':'✅ Confirm Correction'}
                    </button>
                  </div>
                </div>
              )}

              {/* Reject form */}
              {action==='reject'&&(
                <div style={{background:'rgba(239,68,68,0.06)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:12,padding:18}}>
                  <p style={{color:'#f87171',fontWeight:700,fontSize:14,marginBottom:16}}>❌ Reject Complaint</p>
                  <div style={{marginBottom:14}}>
                    <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Reason for Rejection *</label>
                    <textarea style={{...inpS,minHeight:90,resize:'vertical',lineHeight:1.6}} placeholder="Explain why the complaint is rejected and the score is correct..." value={teacherNote} onChange={e=>setTeacherNote(e.target.value)}/>
                  </div>
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>setAction(null)} style={{flex:1,background:'rgba(255,255,255,0.05)',color:'#64748b',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:12,cursor:'pointer',fontWeight:600}}>Cancel</button>
                    <button onClick={handleAction} disabled={processing} style={{flex:2,background:processing?'#334155':'linear-gradient(135deg,#dc2626,#ef4444)',color:'white',border:'none',borderRadius:8,padding:12,cursor:processing?'not-allowed':'pointer',fontWeight:700}}>
                      {processing?'Processing...':'❌ Reject Complaint'}
                    </button>
                  </div>
                </div>
              )}

              {/* Request evidence form */}
              {action==='evidence'&&(
                <div style={{background:'rgba(139,92,246,0.06)',border:'1px solid rgba(139,92,246,0.2)',borderRadius:12,padding:18}}>
                  <p style={{color:'#a78bfa',fontWeight:700,fontSize:14,marginBottom:16}}>📎 Request More Evidence</p>
                  <div style={{marginBottom:14}}>
                    <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>What Evidence is Needed? *</label>
                    <textarea style={{...inpS,minHeight:90,resize:'vertical',lineHeight:1.6}} placeholder="e.g. Please provide a clearer photo of question 4. The image submitted is too blurry..." value={teacherNote} onChange={e=>setTeacherNote(e.target.value)}/>
                  </div>
                  <div style={{display:'flex',gap:10}}>
                    <button onClick={()=>setAction(null)} style={{flex:1,background:'rgba(255,255,255,0.05)',color:'#64748b',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8,padding:12,cursor:'pointer',fontWeight:600}}>Cancel</button>
                    <button onClick={handleAction} disabled={processing} style={{flex:2,background:processing?'#334155':'linear-gradient(135deg,#6d28d9,#8b5cf6)',color:'white',border:'none',borderRadius:8,padding:12,cursor:processing?'not-allowed':'pointer',fontWeight:700}}>
                      {processing?'Sending...':'📎 Send Request'}
                    </button>
                  </div>
                </div>
              )}

              {/* Resolved state */}
              {selected.status==='resolved'&&(
                <div style={{background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:12,padding:16}}>
                  <p style={{color:'#34d399',fontWeight:700,fontSize:14,margin:'0 0 8px'}}>✅ Complaint Resolved</p>
                  {selected.correctedScore&&<p style={{color:'#e2e8f0',fontSize:13,margin:'0 0 4px'}}>Score corrected to: <strong style={{color:'#34d399'}}>{selected.correctedScore}</strong></p>}
                  {selected.teacherResponse&&<p style={{color:'#94a3b8',fontSize:13,margin:0}}>{selected.teacherResponse}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
