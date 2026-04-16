'use client';
import NotificationBell from '../../../components/notifications/NotificationBell';
import { useState } from 'react';
import Link from 'next/link';

interface R { subject:string;score:number;maxScore:number;grade:string;color:string;pct:number;pos:number;size:number;remarks:string;confirmed:boolean;id:string; }

const DEMO:R[]=[
  {subject:'Mathematics',score:78,maxScore:100,grade:'B',color:'#3b82f6',pct:78,pos:5,size:42,remarks:'Very good performance. Keep it up.',confirmed:false,id:'r1'},
  {subject:'English Language',score:85,maxScore:100,grade:'A',color:'#10b981',pct:85,pos:2,size:42,remarks:'Outstanding work! Excellent writing skills.',confirmed:true,id:'r2'},
  {subject:'Physics',score:45,maxScore:100,grade:'F',color:'#ef4444',pct:45,pos:38,size:42,remarks:'Requires significant improvement. Seek extra help.',confirmed:false,id:'r3'},
  {subject:'Chemistry',score:62,maxScore:100,grade:'C',color:'#8b5cf6',pct:62,pos:14,size:42,remarks:'Satisfactory. More practice needed in calculations.',confirmed:false,id:'r4'},
  {subject:'Biology',score:71,maxScore:100,grade:'B',color:'#3b82f6',pct:71,pos:8,size:42,remarks:'Good understanding of biological concepts.',confirmed:false,id:'r5'},
  {subject:'History',score:88,maxScore:100,grade:'A',color:'#10b981',pct:88,pos:1,size:42,remarks:'Top of the class! Exceptional analysis.',confirmed:true,id:'r6'},
  {subject:'Geography',score:55,maxScore:100,grade:'D',color:'#f59e0b',pct:55,pos:22,size:42,remarks:'Borderline pass. More study needed.',confirmed:false,id:'r7'},
  {subject:'Computer Science',score:92,maxScore:100,grade:'A',color:'#10b981',pct:92,pos:1,size:42,remarks:'Exceptional programming skills.',confirmed:true,id:'r8'},
  {subject:'French Language',score:67,maxScore:100,grade:'C',color:'#8b5cf6',pct:67,pos:11,size:42,remarks:'Good oral skills. Written work needs improvement.',confirmed:false,id:'r9'},
];

const og=(p:number)=>p>=80?{g:'A',c:'#10b981',l:'Excellent'}:p>=70?{g:'B',c:'#3b82f6',l:'Very Good'}:p>=60?{g:'C',c:'#8b5cf6',l:'Good'}:p>=50?{g:'D',c:'#f59e0b',l:'Pass'}:{g:'F',c:'#ef4444',l:'Fail'};

export default function StudentResults(){
  const [results,setResults]=useState<R[]>(DEMO);
  const [conf,setConf]=useState<string|null>(null);

  // DEMO MODE: no login required for testing
  // In production, student name comes from Cognito token
  const name='Tabe Collins Mbuye';
  const srmsId='CM-GBHS-2026-STU-0042';

  const confirm=(id:string)=>{
    setConf(id);
    setResults(p=>p.map(r=>r.id===id?{...r,confirmed:true}:r));
    setTimeout(()=>setConf(null),500);
  };

  const total=results.reduce((s,r)=>s+r.score,0);
  const tMax=results.reduce((s,r)=>s+r.maxScore,0);
  const pct=tMax>0?Math.round((total/tMax)*100):0;
  const O=og(pct);
  const passed=results.filter(r=>r.grade!=='F').length;
  const failed=results.filter(r=>r.grade==='F');
  const cfd=results.filter(r=>r.confirmed).length;

  return(
    <div style={{minHeight:'100vh',background:'#080f20',color:'#e2e8f0'}}>
      <style>{`@media print{body{background:white!important;color:black!important;}.np{display:none!important;}}`}</style>

      <header className="np" style={{position:'sticky',top:0,zIndex:40,background:'rgba(8,15,32,0.97)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Link href="/student/dashboard" style={{color:'#64748b',textDecoration:'none',fontSize:14}}>← Dashboard</Link>
          <span style={{color:'#334155'}}>|</span>
          <span style={{color:'white',fontWeight:700}}>My Results & Report Card</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
  <NotificationBell />
  <button onClick={() => window.print()}
    style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
    🖨️ Print / Save PDF
  </button>
  <Link href="/student/complaints/new"
    style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '8px 16px', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
    ⚖️ Raise Complaint
  </Link>
</div>
      </header>

      <div style={{maxWidth:1300,margin:'0 auto',padding:'32px 24px'}}>

        {/* DEMO BANNER */}
        <div className="np" style={{marginBottom:24,padding:'12px 20px',borderRadius:10,background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.2)',display:'flex',alignItems:'center',gap:10}}>
          <span style={{fontSize:'1.2rem'}}>ℹ️</span>
          <span style={{color:'#60a5fa',fontSize:13}}>Demo Mode — showing sample data. In production, students log in with their SRMS ID to see real results.</span>
        </div>

        {/* STUDENT IDENTITY */}
        <div style={{background:'linear-gradient(135deg,rgba(30,58,138,0.4),rgba(139,92,246,0.2))',border:'1px solid rgba(59,130,246,0.2)',borderRadius:20,padding:28,marginBottom:28}}>
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:20}}>
            <div>
              <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
                <div style={{width:54,height:54,borderRadius:'50%',background:'linear-gradient(135deg,#1d4ed8,#7c3aed)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,fontWeight:900,color:'white'}}>{name.charAt(0)}</div>
                <div><h2 style={{color:'white',fontSize:'1.4rem',fontWeight:900,margin:0,marginBottom:4}}>{name}</h2><p style={{color:'#60a5fa',fontSize:13,margin:0,fontFamily:'monospace'}}>{srmsId}</p></div>
              </div>
              <div style={{display:'flex',gap:20,flexWrap:'wrap',fontSize:13,color:'#94a3b8'}}>
                <span>📚 Form 5 Science A</span><span>📅 First Term · 2026</span>
                <span>📋 {results.length} Subjects</span><span>✅ {cfd}/{results.length} Confirmed</span>
              </div>
            </div>
            <div style={{textAlign:'center',background:'rgba(0,0,0,0.2)',borderRadius:14,padding:'18px 28px',border:'1px solid '+O.c+'30'}}>
              <div style={{fontSize:'3rem',fontWeight:900,color:O.c,lineHeight:1}}>{O.g}</div>
              <div style={{color:O.c,fontSize:12,fontWeight:700,marginTop:4}}>{O.l}</div>
              <div style={{color:'#64748b',fontSize:11}}>Overall: {pct}%</div>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:14,marginBottom:28}}>
          {[
            {label:'Total Score',value:total+'/'+tMax,color:'#3b82f6',icon:'🎯'},
            {label:'Average',value:pct+'%',color:O.c,icon:'📊'},
            {label:'Passed',value:String(passed),color:'#10b981',icon:'✅'},
            {label:'Failed',value:String(failed.length),color:failed.length>0?'#ef4444':'#10b981',icon:'❌'},
            {label:'Best Position',value:'#'+Math.min(...results.map(r=>r.pos)),color:'#f59e0b',icon:'🏆'},
          ].map((c,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:12,padding:16}}>
              <div style={{fontSize:'1.4rem',marginBottom:6}}>{c.icon}</div>
              <div style={{fontSize:'1.4rem',fontWeight:900,color:c.color}}>{c.value}</div>
              <div style={{color:'#64748b',fontSize:11,marginTop:4}}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* FAILED WARNING */}
        {failed.length>0&&(
          <div style={{marginBottom:24,padding:'16px 20px',borderRadius:12,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)'}}>
            <p style={{color:'#f87171',fontWeight:700,fontSize:14,margin:'0 0 6px'}}>⚠️ Failed {failed.length} subject{failed.length>1?'s':''}: {failed.map(s=>s.subject).join(', ')}</p>
            <p style={{color:'#94a3b8',fontSize:13,margin:0}}>If any score is wrong, click Dispute and upload your exam paper as proof. Phase 5 builds the full complaint system.</p>
          </div>
        )}

        {/* RESULTS TABLE */}
        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,overflow:'hidden',marginBottom:32}}>
          <div style={{padding:'18px 24px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h2 style={{color:'white',fontWeight:700,fontSize:'1rem',margin:0}}>📊 Academic Results — First Term 2026</h2>
            <span style={{color:'#64748b',fontSize:12}}>{results.length} subjects · Class: Form 5 Science A</span>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:'rgba(30,58,138,0.3)'}}>
                  {['Subject','Score','Grade','Performance Bar','Class Position','Teacher Remarks','Status','Actions'].map((h,i)=>(
                    <th key={i} style={{padding:'12px 14px',textAlign:'left' as const,color:'#93c5fd',fontSize:11,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.05em',borderBottom:'1px solid rgba(59,130,246,0.2)',whiteSpace:'nowrap' as const}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r,i)=>(
                  <tr key={i} style={{borderBottom:'1px solid rgba(255,255,255,0.04)',transition:'background 0.2s'}}
                    onMouseEnter={e=>(e.currentTarget.style.background='rgba(59,130,246,0.04)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                    <td style={{padding:'14px 14px',fontWeight:700,color:'white',fontSize:14}}>{r.subject}</td>
                    <td style={{padding:'14px 14px'}}>
                      <span style={{fontSize:'1.4rem',fontWeight:900,color:r.color}}>{r.score}</span>
                      <span style={{color:'#334155',fontSize:12}}>/{r.maxScore}</span>
                    </td>
                    <td style={{padding:'14px 14px'}}>
                      <span style={{fontSize:'1.8rem',fontWeight:900,color:r.color}}>{r.grade}</span>
                      <div style={{color:'#64748b',fontSize:11}}>{r.pct}%</div>
                    </td>
                    <td style={{padding:'14px 14px',minWidth:140}}>
                      <div style={{background:'rgba(255,255,255,0.05)',borderRadius:100,height:8,width:120,overflow:'hidden',marginBottom:4}}>
                        <div style={{height:'100%',borderRadius:100,background:r.color,width:r.pct+'%',transition:'width 0.6s ease'}}/>
                      </div>
                      <span style={{color:'#475569',fontSize:11}}>{r.pct}% of max score</span>
                    </td>
                    <td style={{padding:'14px 14px',textAlign:'center' as const}}>
                      <div style={{fontWeight:700,color:r.pos<=3?'#f59e0b':'white',fontSize:16}}>{r.pos<=3?'🏆':''}#{r.pos}</div>
                      <div style={{color:'#475569',fontSize:11}}>of {r.size}</div>
                    </td>
                    <td style={{padding:'14px 14px',maxWidth:200}}>
                      <p style={{color:r.grade==='F'?'#f87171':r.grade==='A'?'#34d399':'#94a3b8',fontSize:12,fontStyle:'italic',margin:0,lineHeight:1.5}}>"{r.remarks}"</p>
                    </td>
                    <td style={{padding:'14px 14px'}}>
                      {r.confirmed
                        ?<span style={{display:'inline-flex',padding:'4px 10px',borderRadius:100,background:'rgba(16,185,129,0.15)',color:'#34d399',fontSize:11,fontWeight:700}}>✓ Confirmed</span>
                        :<span style={{display:'inline-flex',padding:'4px 10px',borderRadius:100,background:'rgba(245,158,11,0.15)',color:'#fbbf24',fontSize:11,fontWeight:700}}>⏳ Pending</span>}
                    </td>
                    <td style={{padding:'14px 14px'}}>
                      <div style={{display:'flex',gap:8,flexDirection:'column'}}>
                        {!r.confirmed&&(
                          <button onClick={()=>confirm(r.id)} disabled={conf===r.id}
                            style={{background:'rgba(16,185,129,0.15)',color:'#34d399',border:'1px solid rgba(16,185,129,0.3)',borderRadius:6,padding:'6px 10px',cursor:'pointer',fontSize:11,fontWeight:600,whiteSpace:'nowrap' as const}}>
                            {conf===r.id?'Saving...':'✓ Confirm'}
                          </button>
                        )}
                        <Link href={'/student/complaints/new?subject='+encodeURIComponent(r.subject)+'&score='+r.score+'&id='+r.id}
                          style={{background:'rgba(245,158,11,0.1)',color:'#fbbf24',border:'1px solid rgba(245,158,11,0.2)',borderRadius:6,padding:'6px 10px',textDecoration:'none',fontSize:11,fontWeight:600,whiteSpace:'nowrap' as const}}>
                          ⚖️ Dispute
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:'rgba(30,58,138,0.2)'}}>
                  <td style={{padding:'14px 14px',fontWeight:700,color:'#93c5fd'}}>OVERALL TOTAL</td>
                  <td style={{padding:'14px 14px'}}><span style={{fontSize:'1.3rem',fontWeight:900,color:O.c}}>{total}</span><span style={{color:'#334155',fontSize:12}}>/{tMax}</span></td>
                  <td style={{padding:'14px 14px'}}><span style={{fontSize:'1.8rem',fontWeight:900,color:O.c}}>{O.g}</span></td>
                  <td style={{padding:'14px 14px'}}>
                    <div style={{background:'rgba(255,255,255,0.05)',borderRadius:100,height:8,width:120,overflow:'hidden'}}>
                      <div style={{height:'100%',borderRadius:100,background:O.c,width:pct+'%'}}/>
                    </div>
                    <span style={{color:O.c,fontSize:12,fontWeight:700}}>{pct}% average</span>
                  </td>
                  <td colSpan={4} style={{padding:'14px 14px',color:'#64748b',fontSize:13}}>
                    {passed} passed · {failed.length} failed · {cfd} confirmed out of {results.length}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* PRINTABLE REPORT CARD */}
        <div style={{background:'white',borderRadius:16,overflow:'hidden',marginBottom:28,boxShadow:'0 20px 60px rgba(0,0,0,0.4)'}}>
          <div style={{background:'linear-gradient(135deg,#1e3a8a,#1d4ed8)',padding:'28px',textAlign:'center' as const}}>
            <h2 style={{color:'white',fontSize:'1.4rem',fontWeight:900,margin:0,marginBottom:6}}>🏫 SRMS PLATFORM SCHOOL</h2>
            <p style={{color:'rgba(255,255,255,0.7)',fontSize:13,margin:0,marginBottom:12}}>Official Academic Result Report Card</p>
            <div style={{background:'rgba(255,255,255,0.1)',borderRadius:8,padding:'8px 20px',display:'inline-block'}}>
              <span style={{color:'white',fontSize:13}}>First Term · Academic Year 2025/2026 · Form 5 Science A</span>
            </div>
          </div>
          <div style={{padding:'20px 28px',background:'#f8fafc',borderBottom:'1px solid #e2e8f0',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap' as const,gap:16}}>
            <div>
              <p style={{color:'#64748b',fontSize:11,margin:'0 0 4px',textTransform:'uppercase' as const,letterSpacing:'0.05em'}}>Student Name</p>
              <p style={{color:'#0f172a',fontWeight:800,fontSize:'1.2rem',margin:0}}>{name}</p>
              <p style={{color:'#64748b',fontSize:12,margin:'4px 0 0',fontFamily:'monospace'}}>{srmsId}</p>
            </div>
            <div style={{textAlign:'center' as const}}>
              <p style={{color:'#64748b',fontSize:11,margin:'0 0 4px',textTransform:'uppercase' as const}}>Class</p>
              <p style={{color:'#0f172a',fontWeight:700,fontSize:'1rem',margin:0}}>Form 5 Science A</p>
            </div>
            <div style={{textAlign:'center' as const,background:'white',borderRadius:12,padding:'16px 24px',border:'3px solid '+O.c,boxShadow:'0 4px 20px '+O.c+'30'}}>
              <div style={{fontSize:'3rem',fontWeight:900,color:O.c,lineHeight:1}}>{O.g}</div>
              <div style={{color:O.c,fontWeight:700,fontSize:12}}>{O.l}</div>
              <div style={{color:'#64748b',fontSize:11}}>{pct}% Overall</div>
            </div>
          </div>
          <div style={{padding:'20px 28px'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'#1e3a8a'}}>
                  {['Subject','Score','Max Score','Percentage','Grade','Class Position','Teacher Remarks'].map((h,i)=>(
                    <th key={i} style={{padding:'10px 12px',textAlign:'left' as const,color:'white',fontSize:11,fontWeight:700,textTransform:'uppercase' as const}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r,i)=>(
                  <tr key={i} style={{background:i%2===0?'#f8fafc':'white',borderBottom:'1px solid #e2e8f0'}}>
                    <td style={{padding:'9px 12px',fontWeight:600,color:'#0f172a'}}>{r.subject}</td>
                    <td style={{padding:'9px 12px',fontWeight:700,color:r.color,fontSize:15}}>{r.score}</td>
                    <td style={{padding:'9px 12px',color:'#64748b'}}>{r.maxScore}</td>
                    <td style={{padding:'9px 12px',color:r.color,fontWeight:600}}>{r.pct}%</td>
                    <td style={{padding:'9px 12px'}}><span style={{fontWeight:900,fontSize:'1.2rem',color:r.color}}>{r.grade}</span></td>
                    <td style={{padding:'9px 12px',color:'#0f172a',fontWeight:600}}>{r.pos} / {r.size}</td>
                    <td style={{padding:'9px 12px',color:'#64748b',fontStyle:'italic',fontSize:12}}>{r.remarks}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{background:'#1e3a8a'}}>
                  <td style={{padding:'12px 12px',color:'white',fontWeight:700,fontSize:14}}>TOTALS</td>
                  <td style={{padding:'12px 12px',color:'white',fontWeight:900,fontSize:16}}>{total}</td>
                  <td style={{padding:'12px 12px',color:'rgba(255,255,255,0.7)'}}>{tMax}</td>
                  <td style={{padding:'12px 12px',color:pct>=50?'#86efac':'#fca5a5',fontWeight:700,fontSize:14}}>{pct}%</td>
                  <td style={{padding:'12px 12px',color:'white',fontWeight:900,fontSize:'1.4rem'}}>{O.g}</td>
                  <td colSpan={2} style={{padding:'12px 12px',color:'rgba(255,255,255,0.7)',fontSize:12}}>{passed} subjects passed · {failed.length} failed · {O.l}</td>
                </tr>
              </tfoot>
            </table>

            <div style={{marginTop:32,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:24,borderTop:'1px solid #e2e8f0',paddingTop:24}}>
              {['Class Teacher Signature','Principal / Head Teacher Signature','Parent / Guardian Signature'].map((l,i)=>(
                <div key={i} style={{textAlign:'center' as const}}>
                  <div style={{height:40,borderBottom:'1px solid #0f172a',marginBottom:8}}/>
                  <p style={{color:'#64748b',fontSize:11,margin:0}}>{l}</p>
                </div>
              ))}
            </div>
            <div style={{marginTop:20,padding:'12px 16px',background:'#f8fafc',borderRadius:8,textAlign:'center' as const}}>
              <p style={{color:'#94a3b8',fontSize:11,margin:0}}>
                This result was generated electronically by SRMS Platform · {new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'long',year:'numeric'})} · Powered by Amazon Web Services · Built by MUFUNG ANGELBELL MBUYEH — AWS Solutions Architect · Yaoundé, Cameroon
              </p>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="np" style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap' as const}}>
          <button onClick={()=>window.print()} style={{background:'linear-gradient(135deg,#10b981,#059669)',color:'white',border:'none',borderRadius:10,padding:'14px 32px',cursor:'pointer',fontWeight:700,fontSize:15}}>
            🖨️ Print Report Card / Save as PDF
          </button>
          <Link href="/student/complaints/new" style={{background:'rgba(245,158,11,0.15)',color:'#fbbf24',border:'1px solid rgba(245,158,11,0.3)',borderRadius:10,padding:'14px 32px',textDecoration:'none',fontWeight:700,fontSize:15}}>
            ⚖️ Raise a Complaint
          </Link>
          <Link href="/student/complaints/track" style={{background:'rgba(59,130,246,0.15)',color:'#60a5fa',border:'1px solid rgba(59,130,246,0.3)',borderRadius:10,padding:'14px 32px',textDecoration:'none',fontWeight:700,fontSize:14}}>📋 Track My Complaints</Link>
          <Link href="/student/dashboard" style={{background:'rgba(255,255,255,0.05)',color:'#94a3b8',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'14px 28px',textDecoration:'none',fontWeight:600,fontSize:14}}>
            ← Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
