'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

interface Row { id:string;studentId:string;studentName:string;score:string;maxScore:string;grade:string;color:string;pct:number; }

const gi=(sc:number,mx:number)=>{const p=mx>0?(sc/mx)*100:0;return p>=80?{grade:'A',color:'#10b981'}:p>=70?{grade:'B',color:'#3b82f6'}:p>=60?{grade:'C',color:'#8b5cf6'}:p>=50?{grade:'D',color:'#f59e0b'}:{grade:'F',color:'#ef4444'};};
const nr=():Row=>({id:Math.random().toString(36).slice(2),studentId:'',studentName:'',score:'',maxScore:'100',grade:'—',color:'#64748b',pct:0});

export default function UploadPage(){
  const [cls,setCls]=useState('');
  const [term,setTerm]=useState('First Term');
  const [year,setYear]=useState('2026');
  const [sub,setSub]=useState('');
  const [rows,setRows]=useState<Row[]>(Array.from({length:5},nr));
  const [loading,setLoading]=useState(false);
  const [err,setErr]=useState('');
  const [ok,setOk]=useState('');
  const [mode,setMode]=useState<'manual'|'file'>('manual');
  const [drag,setDrag]=useState(false);
  const fRef=useRef<HTMLInputElement>(null);

  const upd=(id:string,f:keyof Row,v:string)=>setRows(p=>p.map(r=>{
    if(r.id!==id)return r;
    const u={...r,[f]:v};
    if(f==='score'||f==='maxScore'){const sc=parseFloat(f==='score'?v:r.score)||0;const mx=parseFloat(f==='maxScore'?v:r.maxScore)||100;if(sc>=0&&mx>0){const g=gi(sc,mx);u.grade=g.grade;u.color=g.color;u.pct=Math.round((sc/mx)*100);}}
    return u;
  }));

  const handleFile=async(file:File)=>{
    if(!file.name.match(/\.(xlsx|xls|csv)$/i)){setErr('Only Excel or CSV files.');return;}
    try{
      const XLSX=await import('xlsx');
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf);
      const data:any[]=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if(!data.length){setErr('File is empty.');return;}
      const p=data.map((row:any)=>{
        const sc=parseFloat(row['Score']||row['score']||row['Marks']||'0')||0;
        const mx=parseFloat(row['MaxScore']||row['Max']||'100')||100;
        const g=gi(sc,mx);
        return{id:Math.random().toString(36).slice(2),studentId:String(row['Student ID']||row['ID']||''),studentName:String(row['Student Name']||row['Name']||''),score:String(sc),maxScore:String(mx),grade:g.grade,color:g.color,pct:Math.round((sc/mx)*100)};
      }).filter((s:Row)=>s.studentName||s.studentId);
      if(!p.length){setErr('No valid data. Need: Student ID, Student Name, Score');return;}
      setRows(p);setMode('manual');setOk(p.length+' students loaded. Review and save.');
    }catch{setErr('Could not read file.');}
  };

  const submit=async()=>{
    setErr('');setOk('');
    if(!cls.trim()){setErr('Enter the class name');return;}
    if(!sub.trim()){setErr('Enter the subject name');return;}
    const valid=rows.filter(r=>r.studentId.trim()&&r.studentName.trim()&&r.score.trim());
    if(!valid.length){setErr('Add at least one student with ID, name and score');return;}
    setLoading(true);
    await new Promise(r=>setTimeout(r,1000));
    const avg=Math.round(valid.reduce((s,r)=>s+r.pct,0)/valid.length);
    const passed=valid.filter(r=>r.grade!=='F').length;
    setOk('Results saved for '+valid.length+' students. Class average: '+avg+'%. Passed: '+passed+'/'+valid.length+'. Status: Draft — go to dashboard to publish.');
    setLoading(false);
  };

  const filled=rows.filter(r=>r.studentName);
  const scored=rows.filter(r=>r.score&&r.grade!=='—');
  const avg=scored.length?Math.round(scored.reduce((s,r)=>s+r.pct,0)/scored.length):0;
  const I:React.CSSProperties={background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'12px 14px',color:'#e2e8f0',fontSize:14,width:'100%',outline:'none',boxSizing:'border-box'};
  const C:React.CSSProperties={background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:8,padding:'8px 10px',color:'#e2e8f0',outline:'none'};

  return(
    <div style={{minHeight:'100vh',background:'#080f20',color:'#e2e8f0'}}>
      <header style={{position:'sticky',top:0,zIndex:40,background:'rgba(8,15,32,0.97)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Link href="/teacher/dashboard" style={{color:'#64748b',textDecoration:'none',fontSize:14}}>← Dashboard</Link>
          <span style={{color:'#334155'}}>|</span>
          <span style={{color:'white',fontWeight:700}}>Upload Results</span>
        </div>
        <button onClick={submit} disabled={loading} style={{background:loading?'#334155':'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'white',border:'none',borderRadius:8,padding:'10px 24px',cursor:loading?'not-allowed':'pointer',fontWeight:700,fontSize:14}}>
          {loading?'Saving...':'💾 Save as Draft'}
        </button>
      </header>
      <div style={{maxWidth:1300,margin:'0 auto',padding:'32px 24px'}}>
        {err&&<div style={{marginBottom:20,padding:'16px 20px',borderRadius:12,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',fontSize:14}}>⚠️ {err}</div>}
        {ok&&<div style={{marginBottom:20,padding:'16px 20px',borderRadius:12,background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',color:'#34d399',fontSize:14}}>✅ {ok}</div>}

        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:28}}>
          {[
            {label:'Students',value:String(filled.length),color:'#3b82f6',icon:'👥'},
            {label:'Class Average',value:scored.length?avg+'%':'—',color:avg>=70?'#10b981':avg>=50?'#f59e0b':'#ef4444',icon:'📊'},
            {label:'Passed',value:scored.length?String(scored.filter(r=>r.grade!=='F').length):'—',color:'#10b981',icon:'✅'},
            {label:'Failed',value:scored.length?String(scored.filter(r=>r.grade==='F').length):'—',color:'#ef4444',icon:'❌'},
          ].map((c,i)=>(
            <div key={i} style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:14,padding:20}}>
              <div style={{fontSize:'1.8rem',marginBottom:6}}>{c.icon}</div>
              <div style={{fontSize:'2rem',fontWeight:900,color:c.color}}>{c.value}</div>
              <div style={{color:'#64748b',fontSize:12,marginTop:4}}>{c.label}</div>
            </div>
          ))}
        </div>

        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:24,marginBottom:24}}>
          <h2 style={{color:'white',fontWeight:700,fontSize:'1rem',marginBottom:20}}>📋 Result Details</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16}}>
            {[['Class / Form *',cls,setCls,'e.g. Form 5 Science A'],['Subject *',sub,setSub,'e.g. Mathematics'],['Year',year,setYear,'2026']].map(([l,v,s,p]:any,i)=>(
              <div key={i}>
                <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:8,textTransform:'uppercase' as const,letterSpacing:'0.05em'}}>{l}</label>
                <input style={I} placeholder={p} value={v} onChange={e=>s(e.target.value)} onFocus={e=>e.target.style.borderColor='rgba(59,130,246,0.6)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>
            ))}
            <div>
              <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:8,textTransform:'uppercase' as const,letterSpacing:'0.05em'}}>Term *</label>
              <select style={{...I,background:'#0f172a'}} value={term} onChange={e=>setTerm(e.target.value)}>
                <option>First Term</option><option>Second Term</option><option>Third Term</option>
              </select>
            </div>
          </div>
        </div>

        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:24,marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:mode==='file'?20:0}}>
            <h2 style={{color:'white',fontWeight:700,fontSize:'1rem',margin:0}}>📁 Entry Method</h2>
            <div style={{display:'flex',background:'rgba(255,255,255,0.05)',borderRadius:10,padding:4,gap:4}}>
              {(['manual','file'] as const).map(m=>(
                <button key={m} onClick={()=>setMode(m)} style={{padding:'8px 18px',borderRadius:8,border:'none',cursor:'pointer',fontSize:13,fontWeight:600,background:mode===m?'linear-gradient(135deg,#1d4ed8,#3b82f6)':'transparent',color:mode===m?'white':'#64748b'}}>
                  {m==='manual'?'✏️ Type Manually':'📂 Upload File'}
                </button>
              ))}
            </div>
          </div>
          {mode==='file'&&(
            <div onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
              onDrop={e=>{e.preventDefault();setDrag(false);const f=e.dataTransfer.files[0];if(f)handleFile(f);}}
              onClick={()=>fRef.current?.click()}
              style={{border:'2px dashed '+(drag?'#3b82f6':'rgba(255,255,255,0.15)'),borderRadius:12,padding:'48px 24px',textAlign:'center' as const,cursor:'pointer',background:drag?'rgba(59,130,246,0.05)':'rgba(255,255,255,0.02)'}}>
              <div style={{fontSize:'3rem',marginBottom:12}}>📊</div>
              <p style={{color:'white',fontWeight:700,fontSize:16,marginBottom:8}}>Drop file here or click to browse</p>
              <p style={{color:'#64748b',fontSize:13}}>Excel (.xlsx, .xls) or CSV (.csv)</p>
              <p style={{color:'#475569',fontSize:12,marginTop:8}}>Required columns: <strong style={{color:'#94a3b8'}}>Student ID | Student Name | Score</strong></p>
              <input ref={fRef} type="file" style={{display:'none'}} accept=".xlsx,.xls,.csv" onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);}}/>
            </div>
          )}
        </div>

        <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,overflow:'hidden',marginBottom:24}}>
          <div style={{padding:'18px 24px',borderBottom:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h2 style={{color:'white',fontWeight:700,fontSize:'1rem',margin:0}}>📝 Student Scores — {sub||'Enter subject above'}</h2>
            <button onClick={()=>setRows(p=>[...p,nr()])} style={{background:'rgba(59,130,246,0.15)',color:'#60a5fa',border:'1px solid rgba(59,130,246,0.3)',borderRadius:8,padding:'8px 16px',cursor:'pointer',fontSize:13,fontWeight:600}}>+ Add Row</button>
          </div>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'rgba(30,58,138,0.3)'}}>
                {['#','Student ID','Full Name','Score','Out Of','Grade (Live)','Progress','Remove'].map((h,i)=>(
                  <th key={i} style={{padding:'12px 14px',textAlign:'left' as const,color:'#93c5fd',fontSize:11,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.05em',borderBottom:'1px solid rgba(59,130,246,0.2)',whiteSpace:'nowrap' as const}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={r.id} style={{borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                    <td style={{padding:'10px 14px',color:'#475569',fontSize:13}}>{i+1}</td>
                    <td style={{padding:'10px 14px'}}><input style={{...C,width:170,fontSize:12}} placeholder="CM-GBHS-2026-STU-0042" value={r.studentId} onChange={e=>upd(r.id,'studentId',e.target.value)}/></td>
                    <td style={{padding:'10px 14px'}}><input style={{...C,width:180}} placeholder="Student full name" value={r.studentName} onChange={e=>upd(r.id,'studentName',e.target.value)}/></td>
                    <td style={{padding:'10px 14px'}}>
                      <input style={{...C,width:75,fontSize:18,fontWeight:900,textAlign:'center' as const,color:r.score?r.color:'#e2e8f0',borderColor:r.score?r.color+'50':'rgba(255,255,255,0.08)'}}
                        placeholder="0" type="number" min="0" max={r.maxScore} value={r.score} onChange={e=>upd(r.id,'score',e.target.value)}/>
                    </td>
                    <td style={{padding:'10px 14px'}}><input style={{...C,width:65,textAlign:'center' as const,color:'#64748b'}} type="number" value={r.maxScore} onChange={e=>upd(r.id,'maxScore',e.target.value)}/></td>
                    <td style={{padding:'10px 14px'}}>
                      {r.grade!=='—'?<div><span style={{fontSize:'1.8rem',fontWeight:900,color:r.color}}>{r.grade}</span><span style={{fontSize:11,color:'#64748b',marginLeft:6}}>{r.pct}%</span></div>
                      :<span style={{color:'#334155',fontSize:12}}>Enter score →</span>}
                    </td>
                    <td style={{padding:'10px 14px'}}>
                      {r.score&&<div style={{background:'rgba(255,255,255,0.05)',borderRadius:100,height:6,width:100,overflow:'hidden'}}><div style={{height:'100%',borderRadius:100,background:r.color,width:r.pct+'%',transition:'width 0.3s ease'}}/></div>}
                    </td>
                    <td style={{padding:'10px 14px'}}>
                      <button onClick={()=>{if(rows.length>1)setRows(p=>p.filter(x=>x.id!==r.id));}} disabled={rows.length<=1}
                        style={{background:'rgba(239,68,68,0.1)',color:'#f87171',border:'none',borderRadius:6,padding:'6px 10px',cursor:rows.length<=1?'not-allowed':'pointer',opacity:rows.length<=1?0.3:1,fontSize:12}}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{padding:'14px 24px',borderTop:'1px solid rgba(255,255,255,0.05)',display:'flex',alignItems:'center',gap:16}}>
            <button onClick={()=>setRows(p=>[...p,nr()])} style={{background:'none',color:'#60a5fa',border:'1px dashed rgba(59,130,246,0.4)',borderRadius:8,padding:'8px 20px',cursor:'pointer',fontSize:13}}>+ Add Another Student</button>
            <span style={{color:'#334155',fontSize:13}}>{filled.length} students entered</span>
          </div>
        </div>

        <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:20,marginBottom:24}}>
          <p style={{color:'#64748b',fontSize:11,fontWeight:700,textTransform:'uppercase' as const,letterSpacing:'0.1em',marginBottom:14}}>Grading Scale</p>
          <div style={{display:'flex',gap:12,flexWrap:'wrap' as const}}>
            {[{r:'80–100',g:'A',l:'Excellent',c:'#10b981'},{r:'70–79',g:'B',l:'Very Good',c:'#3b82f6'},{r:'60–69',g:'C',l:'Good',c:'#8b5cf6'},{r:'50–59',g:'D',l:'Pass',c:'#f59e0b'},{r:'0–49',g:'F',l:'Fail',c:'#ef4444'}].map((g,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',borderRadius:8,background:g.c+'12',border:'1px solid '+g.c+'25'}}>
                <span style={{color:g.c,fontWeight:900,fontSize:16}}>{g.g}</span>
                <div><div style={{color:'#e2e8f0',fontSize:12,fontWeight:600}}>{g.l}</div><div style={{color:'#64748b',fontSize:11}}>{g.r}%</div></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{display:'flex',gap:12,justifyContent:'flex-end'}}>
          <Link href="/teacher/dashboard" style={{padding:'14px 28px',borderRadius:10,border:'1px solid rgba(255,255,255,0.1)',color:'#64748b',textDecoration:'none',fontSize:14,fontWeight:600}}>Cancel</Link>
          <button onClick={submit} disabled={loading} style={{background:loading?'#334155':'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'white',border:'none',borderRadius:10,padding:'14px 40px',cursor:loading?'not-allowed':'pointer',fontWeight:700,fontSize:15}}>
            {loading?'Saving...':'💾 Save Results as Draft →'}
          </button>
        </div>
      </div>
    </div>
  );
}
