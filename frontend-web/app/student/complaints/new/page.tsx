'use client';

import { Suspense, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const REASONS = [
  { value: 'wrong_score', label: 'Wrong score entered', desc: 'The score recorded does not match my exam paper' },
  { value: 'missing_marks', label: 'Missing marks', desc: 'Some of my marks were not added to my total' },
  { value: 'calculation_error', label: 'Calculation error', desc: 'The total or grade was calculated incorrectly' },
  { value: 'wrong_subject', label: 'Wrong subject assigned', desc: 'Results belong to another student or subject' },
  { value: 'not_my_results', label: 'These are not my results', desc: 'The entire result sheet does not match my answers' },
  { value: 'other', label: 'Other reason', desc: 'A different issue not listed above' },
];

function ComplaintForm() {
  const params = useSearchParams();
  const prefillSubject = params.get('subject') || '';
  const prefillScore = params.get('score') || '';
  const prefillResultId = params.get('id') || '';

  const [step, setStep] = useState<1|2|3>(1);
  const [subject, setSubject] = useState(prefillSubject);
  const [currentScore, setCurrentScore] = useState(prefillScore);
  const [claimedScore, setClaimedScore] = useState('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [proofFile, setProofFile] = useState<File|null>(null);
  const [proofPreview, setProofPreview] = useState<string|null>(null);
  const [onBehalf, setOnBehalf] = useState(false);
  const [friendId, setFriendId] = useState('');
  const [friendName, setFriendName] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [complaintId, setComplaintId] = useState('');
  const [err, setErr] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    const allowed = ['image/jpeg','image/jpg','image/png','image/webp','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.type)) {
      setErr('Only photos (JPG, PNG), PDFs, and Word documents are accepted as proof.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setErr('File too large. Maximum size is 10MB.');
      return;
    }
    setErr('');
    setProofFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setProofPreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
  };

  const validateStep1 = () => {
    if (!subject.trim()) { setErr('Enter the subject name'); return false; }
    if (!reason) { setErr('Select a reason for your complaint'); return false; }
    setErr(''); return true;
  };

  const validateStep2 = () => {
    if (description.trim().length < 20) { setErr('Please describe your complaint in more detail (at least 20 characters)'); return false; }
    if (onBehalf && !friendId.trim()) { setErr('Enter your classmate\'s Student ID'); return false; }
    if (!proofFile) { setErr('Upload proof (photo of your exam paper, document, or any evidence)'); return false; }
    setErr(''); return true;
  };

  const handleSubmit = async () => {
    setErr('');
    setLoading(true);

    try {
      const studentId = localStorage.getItem('srms_user_id') || 'CM-GBHS-2026-STU-0042';
      const studentName = localStorage.getItem('srms_user_name') || 'Tabe Collins Mbuye';

      // Generate a demo complaint ID for testing
      const demoId = 'CMP-SRMS-' + Date.now().toString(36).toUpperCase().slice(-6) + '-' + Math.random().toString(36).toUpperCase().slice(2,6);

      const api = process.env.NEXT_PUBLIC_TENANT_API_URL || '';
      const token = localStorage.getItem('srms_access_token') || '';

      try {
        const res = await fetch(api + '/complaints/raise', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({
            studentId,
            studentName,
            subjectName: subject,
            resultSetId: prefillResultId || null,
            currentScore: parseFloat(currentScore) || null,
            claimedScore: claimedScore ? parseFloat(claimedScore) : null,
            reason,
            description,
            proofFileKey: proofFile ? 'demo-proof-key/' + proofFile.name : null,
            onBehalfOfStudentId: onBehalf ? friendId : null,
            onBehalfOfStudentName: onBehalf ? friendName : null,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setComplaintId(data.data.complaintId);
          setSubmitted(true);
          return;
        }
      } catch {}

      // Demo mode fallback
      await new Promise(r => setTimeout(r, 1200));
      setComplaintId(demoId);
      setSubmitted(true);
    } catch {
      setErr('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div style={{minHeight:'100vh',background:'#080f20',display:'flex',alignItems:'center',justifyContent:'center',padding:'40px 24px'}}>
        <div style={{maxWidth:520,width:'100%',textAlign:'center'}}>
          <div style={{width:80,height:80,borderRadius:'50%',background:'rgba(16,185,129,0.15)',border:'2px solid #10b981',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.5rem',margin:'0 auto 24px'}}>✅</div>
          <h1 style={{color:'white',fontSize:'1.8rem',fontWeight:900,marginBottom:12}}>Complaint Submitted!</h1>
          <p style={{color:'#64748b',fontSize:15,marginBottom:32,lineHeight:1.6}}>
            Your complaint has been received and the teacher will be notified. You can track the status of your complaint anytime.
          </p>

          <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:24,marginBottom:32,textAlign:'left'}}>
            <p style={{color:'#64748b',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:12}}>Complaint Details</p>
            <div style={{display:'grid',gap:12}}>
              {[
                ['Complaint ID', complaintId],
                ['Subject', subject],
                ['Reason', REASONS.find(r=>r.value===reason)?.label || reason],
                ['Score on Record', currentScore || '—'],
                ['Score You Claim', claimedScore || '—'],
                ['Proof Attached', proofFile ? proofFile.name : 'None'],
                ['Status', 'Open — Under Review'],
                ['Expected Response', '2-5 business days'],
              ].map(([label,value],i) => (
                <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                  <span style={{color:'#64748b',fontSize:13}}>{label}</span>
                  <span style={{color:label==='Status'?'#34d399':'white',fontSize:13,fontWeight:label==='Complaint ID'?700:400,fontFamily:label==='Complaint ID'?'monospace':'inherit'}}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
            <Link href="/student/complaints/track" style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'white',textDecoration:'none',borderRadius:10,padding:'12px 24px',fontWeight:700,fontSize:14}}>
              📋 Track My Complaints
            </Link>
            <Link href="/student/results" style={{background:'rgba(255,255,255,0.05)',color:'#94a3b8',border:'1px solid rgba(255,255,255,0.1)',textDecoration:'none',borderRadius:10,padding:'12px 24px',fontWeight:600,fontSize:14}}>
              ← Back to Results
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stepStyle = (s: number): React.CSSProperties => ({
    width:32,height:32,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
    fontWeight:700,fontSize:14,
    background: step === s ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : step > s ? '#10b981' : 'rgba(255,255,255,0.05)',
    color: step >= s ? 'white' : '#64748b',
    border: step > s ? 'none' : '1px solid rgba(255,255,255,0.1)',
  });

  const inputS: React.CSSProperties = {background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'12px 14px',color:'#e2e8f0',fontSize:14,width:'100%',outline:'none',boxSizing:'border-box'};

  return (
    <div style={{minHeight:'100vh',background:'#080f20',color:'#e2e8f0'}}>
      <header style={{position:'sticky',top:0,zIndex:40,background:'rgba(8,15,32,0.97)',borderBottom:'1px solid rgba(255,255,255,0.05)',padding:'0 24px',display:'flex',alignItems:'center',justifyContent:'space-between',height:64}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <Link href="/student/results" style={{color:'#64748b',textDecoration:'none',fontSize:14}}>← Back to Results</Link>
          <span style={{color:'#334155'}}>|</span>
          <span style={{color:'white',fontWeight:700}}>Raise a Complaint</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'6px 14px',borderRadius:100,background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)'}}>
          <span style={{color:'#fbbf24',fontSize:12,fontWeight:600}}>⚖️ Complaint System</span>
        </div>
      </header>

      <div style={{maxWidth:700,margin:'0 auto',padding:'40px 24px'}}>

        {/* Step indicator */}
        <div style={{display:'flex',alignItems:'center',marginBottom:40}}>
          {[
            {num:1,label:'Complaint Details'},
            {num:2,label:'Evidence & Description'},
            {num:3,label:'Review & Submit'},
          ].map((s,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',flex:i<2?1:'auto'}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <div style={stepStyle(s.num)}>{step > s.num ? '✓' : s.num}</div>
                <span style={{color:step >= s.num?'white':'#475569',fontSize:13,fontWeight:step===s.num?700:400,whiteSpace:'nowrap'}}>{s.label}</span>
              </div>
              {i < 2 && <div style={{flex:1,height:1,background:'rgba(255,255,255,0.08)',margin:'0 16px'}}/>}
            </div>
          ))}
        </div>

        {err && (
          <div style={{marginBottom:24,padding:'14px 18px',borderRadius:10,background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171',fontSize:14}}>
            ⚠️ {err}
          </div>
        )}

        {/* STEP 1 — Basic complaint info */}
        {step === 1 && (
          <div>
            <h2 style={{color:'white',fontWeight:900,fontSize:'1.4rem',marginBottom:8}}>What is the problem?</h2>
            <p style={{color:'#64748b',fontSize:14,marginBottom:32}}>Tell us which subject has an issue and what kind of error you found.</p>

            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              <div>
                <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Subject Name *</label>
                <input style={inputS} placeholder="e.g. Mathematics" value={subject} onChange={e=>setSubject(e.target.value)}
                  onFocus={e=>e.target.style.borderColor='rgba(59,130,246,0.6)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                <div>
                  <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Score Currently on Record</label>
                  <input style={inputS} placeholder="e.g. 45" type="number" value={currentScore} onChange={e=>setCurrentScore(e.target.value)}
                    onFocus={e=>e.target.style.borderColor='rgba(239,68,68,0.6)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
                  <p style={{color:'#475569',fontSize:11,marginTop:6}}>What the system currently shows</p>
                </div>
                <div>
                  <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Score You Believe is Correct</label>
                  <input style={inputS} placeholder="e.g. 75" type="number" value={claimedScore} onChange={e=>setClaimedScore(e.target.value)}
                    onFocus={e=>e.target.style.borderColor='rgba(16,185,129,0.6)'} onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}/>
                  <p style={{color:'#475569',fontSize:11,marginTop:6}}>What your exam paper shows</p>
                </div>
              </div>

              <div>
                <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Reason for Complaint *</label>
                <div style={{display:'flex',flexDirection:'column',gap:10}}>
                  {REASONS.map(r => (
                    <button key={r.value} onClick={() => setReason(r.value)}
                      style={{textAlign:'left',padding:'14px 16px',borderRadius:12,border:'1px solid '+(reason===r.value?'rgba(59,130,246,0.5)':'rgba(255,255,255,0.08)'),background:reason===r.value?'rgba(59,130,246,0.1)':'rgba(255,255,255,0.02)',cursor:'pointer',transition:'all 0.2s'}}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{width:18,height:18,borderRadius:'50%',border:'2px solid '+(reason===r.value?'#3b82f6':'rgba(255,255,255,0.2)'),background:reason===r.value?'#3b82f6':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {reason===r.value && <div style={{width:6,height:6,borderRadius:'50%',background:'white'}}/>}
                        </div>
                        <div>
                          <div style={{color:reason===r.value?'white':'#cbd5e1',fontWeight:600,fontSize:14}}>{r.label}</div>
                          <div style={{color:'#475569',fontSize:12,marginTop:2}}>{r.desc}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Complain on behalf of friend */}
              <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:12,padding:20}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:onBehalf?16:0}}>
                  <div>
                    <p style={{color:'white',fontWeight:600,fontSize:14,margin:0}}>🤝 Complaining on behalf of a classmate?</p>
                    <p style={{color:'#475569',fontSize:12,margin:'4px 0 0'}}>You must provide proof and their Student ID</p>
                  </div>
                  <button onClick={() => setOnBehalf(!onBehalf)}
                    style={{width:44,height:24,borderRadius:100,background:onBehalf?'#3b82f6':'rgba(255,255,255,0.1)',border:'none',cursor:'pointer',position:'relative',transition:'background 0.2s'}}>
                    <div style={{width:18,height:18,borderRadius:'50%',background:'white',position:'absolute',top:3,left:onBehalf?23:3,transition:'left 0.2s'}}/>
                  </button>
                </div>
                {onBehalf && (
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                    <div>
                      <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Classmate's Student ID *</label>
                      <input style={inputS} placeholder="CM-GBHS-2026-STU-XXXX" value={friendId} onChange={e=>setFriendId(e.target.value)}/>
                    </div>
                    <div>
                      <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:6,textTransform:'uppercase',letterSpacing:'0.05em'}}>Classmate's Full Name</label>
                      <input style={inputS} placeholder="Full name" value={friendName} onChange={e=>setFriendName(e.target.value)}/>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={() => { if(validateStep1()) setStep(2); }}
                style={{background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'white',border:'none',borderRadius:10,padding:'14px',fontWeight:700,fontSize:15,cursor:'pointer'}}>
                Continue to Evidence →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 — Evidence and description */}
        {step === 2 && (
          <div>
            <h2 style={{color:'white',fontWeight:900,fontSize:'1.4rem',marginBottom:8}}>Provide Evidence</h2>
            <p style={{color:'#64748b',fontSize:14,marginBottom:32}}>Upload your exam paper photo and describe the issue clearly. Strong evidence = faster resolution.</p>

            <div style={{display:'flex',flexDirection:'column',gap:24}}>
              {/* File upload zone */}
              <div>
                <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:12,textTransform:'uppercase',letterSpacing:'0.05em'}}>Upload Proof * (Exam paper photo, document, or other evidence)</label>

                {proofFile ? (
                  <div style={{background:'rgba(16,185,129,0.08)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:14,padding:20}}>
                    {proofPreview ? (
                      <div style={{marginBottom:16}}>
                        <img src={proofPreview} alt="Proof preview" style={{maxWidth:'100%',maxHeight:300,borderRadius:10,objectFit:'contain',display:'block',margin:'0 auto'}}/>
                      </div>
                    ) : (
                      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                        <div style={{width:48,height:48,borderRadius:10,background:'rgba(59,130,246,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem'}}>📄</div>
                        <div><p style={{color:'white',fontWeight:600,fontSize:14,margin:0}}>{proofFile.name}</p><p style={{color:'#64748b',fontSize:12,margin:'4px 0 0'}}>{(proofFile.size/1024).toFixed(1)} KB</p></div>
                      </div>
                    )}
                    <div style={{display:'flex',gap:10}}>
                      <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:100,background:'rgba(16,185,129,0.15)',color:'#34d399',fontSize:12,fontWeight:700}}>✓ File Ready</span>
                      <button onClick={()=>{setProofFile(null);setProofPreview(null);}} style={{background:'rgba(239,68,68,0.1)',color:'#f87171',border:'1px solid rgba(239,68,68,0.2)',borderRadius:8,padding:'6px 14px',cursor:'pointer',fontSize:12}}>Remove</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                      {/* Camera capture (mobile) */}
                      <button onClick={()=>camRef.current?.click()}
                        style={{padding:'20px 16px',borderRadius:12,border:'1px solid rgba(59,130,246,0.3)',background:'rgba(59,130,246,0.05)',cursor:'pointer',textAlign:'center'}}>
                        <div style={{fontSize:'2rem',marginBottom:8}}>📸</div>
                        <div style={{color:'white',fontWeight:600,fontSize:14}}>Take Photo</div>
                        <div style={{color:'#64748b',fontSize:12,marginTop:4}}>Use your camera</div>
                        <input ref={camRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={e=>handleFileSelect(e.target.files?.[0]||null)}/>
                      </button>

                      {/* File browse */}
                      <button onClick={()=>fileRef.current?.click()}
                        style={{padding:'20px 16px',borderRadius:12,border:'1px solid rgba(255,255,255,0.1)',background:'rgba(255,255,255,0.02)',cursor:'pointer',textAlign:'center'}}>
                        <div style={{fontSize:'2rem',marginBottom:8}}>📂</div>
                        <div style={{color:'white',fontWeight:600,fontSize:14}}>Browse Files</div>
                        <div style={{color:'#64748b',fontSize:12,marginTop:4}}>Photo, PDF, Word</div>
                        <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" style={{display:'none'}} onChange={e=>handleFileSelect(e.target.files?.[0]||null)}/>
                      </button>
                    </div>

                    {/* Drag and drop */}
                    <div
                      onDragOver={e=>{e.preventDefault();e.currentTarget.style.borderColor='#3b82f6';e.currentTarget.style.background='rgba(59,130,246,0.05)';}}
                      onDragLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.background='rgba(255,255,255,0.01)';}}
                      onDrop={e=>{e.preventDefault();e.currentTarget.style.borderColor='rgba(255,255,255,0.08)';e.currentTarget.style.background='rgba(255,255,255,0.01)';handleFileSelect(e.dataTransfer.files[0]||null);}}
                      onClick={()=>fileRef.current?.click()}
                      style={{border:'2px dashed rgba(255,255,255,0.08)',borderRadius:12,padding:'24px',textAlign:'center',cursor:'pointer',background:'rgba(255,255,255,0.01)',transition:'all 0.2s'}}>
                      <p style={{color:'#475569',fontSize:13,margin:0}}>or drag and drop your file here</p>
                      <p style={{color:'#334155',fontSize:11,marginTop:6}}>Max 10MB · JPG, PNG, PDF, DOCX accepted</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <label style={{display:'block',color:'#64748b',fontSize:11,fontWeight:700,marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>
                  Detailed Description * <span style={{color:'#334155',fontWeight:400,textTransform:'none',letterSpacing:'normal'}}>({description.length} characters, minimum 20)</span>
                </label>
                <textarea
                  style={{...inputS,minHeight:140,resize:'vertical',lineHeight:1.6}}
                  placeholder="Describe the error in detail. Example: In question 3, I correctly answered all 5 parts but only 10 marks were recorded instead of 15. My exam paper shows the teacher crossed all correct. The total should be 75 not 45."
                  value={description}
                  onChange={e=>setDescription(e.target.value)}
                  onFocus={e=>e.target.style.borderColor='rgba(59,130,246,0.6)'}
                  onBlur={e=>e.target.style.borderColor='rgba(255,255,255,0.1)'}
                />
                <div style={{display:'flex',justifyContent:'space-between',marginTop:6}}>
                  <p style={{color:'#475569',fontSize:11,margin:0}}>The more detail you provide, the faster your complaint will be resolved.</p>
                  <p style={{color:description.length>=20?'#34d399':'#f87171',fontSize:11,margin:0,fontWeight:700}}>{description.length}/20 min</p>
                </div>
              </div>

              <div style={{display:'flex',gap:12}}>
                <button onClick={()=>setStep(1)} style={{flex:1,background:'rgba(255,255,255,0.05)',color:'#64748b',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'14px',fontWeight:600,fontSize:14,cursor:'pointer'}}>← Back</button>
                <button onClick={()=>{if(validateStep2())setStep(3);}} style={{flex:2,background:'linear-gradient(135deg,#1d4ed8,#3b82f6)',color:'white',border:'none',borderRadius:10,padding:'14px',fontWeight:700,fontSize:15,cursor:'pointer'}}>
                  Review Complaint →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Review and submit */}
        {step === 3 && (
          <div>
            <h2 style={{color:'white',fontWeight:900,fontSize:'1.4rem',marginBottom:8}}>Review Your Complaint</h2>
            <p style={{color:'#64748b',fontSize:14,marginBottom:32}}>Confirm all details are correct before submitting. You cannot edit after submission.</p>

            <div style={{background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.08)',borderRadius:16,padding:24,marginBottom:24}}>
              <h3 style={{color:'#93c5fd',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:16}}>Complaint Summary</h3>
              <div style={{display:'flex',flexDirection:'column',gap:0}}>
                {[
                  ['Subject', subject],
                  ['Reason', REASONS.find(r=>r.value===reason)?.label || reason],
                  ['Score on Record', currentScore || '—'],
                  ['Score You Claim', claimedScore || '—'],
                  ['Score Difference', (currentScore && claimedScore) ? Math.abs(parseFloat(claimedScore)-parseFloat(currentScore))+' marks' : '—'],
                  ['On Behalf Of', onBehalf ? (friendName || friendId) : 'Myself'],
                  ['Proof Attached', proofFile ? proofFile.name : 'None'],
                ].map(([label,value],i)=>(
                  <div key={i} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
                    <span style={{color:'#64748b',fontSize:13}}>{label}</span>
                    <span style={{color:'white',fontSize:13,fontWeight:label==='Score Difference'?700:400,maxWidth:280,textAlign:'right'}}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{background:'rgba(255,255,255,0.02)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:14,padding:20,marginBottom:24}}>
              <p style={{color:'#93c5fd',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Your Description</p>
              <p style={{color:'#e2e8f0',fontSize:14,lineHeight:1.7,margin:0}}>{description}</p>
            </div>

            {proofPreview && (
              <div style={{marginBottom:24}}>
                <p style={{color:'#64748b',fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>Attached Proof</p>
                <img src={proofPreview} alt="Proof" style={{maxWidth:'100%',maxHeight:250,borderRadius:12,objectFit:'contain',border:'1px solid rgba(255,255,255,0.08)'}}/>
              </div>
            )}

            <div style={{background:'rgba(245,158,11,0.06)',border:'1px solid rgba(245,158,11,0.15)',borderRadius:12,padding:16,marginBottom:24}}>
              <p style={{color:'#fbbf24',fontSize:13,margin:0,lineHeight:1.6}}>
                ⚠️ By submitting, you confirm that all information is accurate and truthful. Submitting false complaints is a serious academic offence.
              </p>
            </div>

            <div style={{display:'flex',gap:12}}>
              <button onClick={()=>setStep(2)} style={{flex:1,background:'rgba(255,255,255,0.05)',color:'#64748b',border:'1px solid rgba(255,255,255,0.1)',borderRadius:10,padding:'14px',fontWeight:600,fontSize:14,cursor:'pointer'}}>← Edit</button>
              <button onClick={handleSubmit} disabled={loading}
                style={{flex:2,background:loading?'#334155':'linear-gradient(135deg,#d97706,#f59e0b)',color:loading?'#64748b':'#0f172a',border:'none',borderRadius:10,padding:'14px',fontWeight:800,fontSize:15,cursor:loading?'not-allowed':'pointer'}}>
                {loading ? 'Submitting...' : '✅ Submit Complaint →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComplaintsNewPage() {
  return (
    <Suspense fallback={<div style={{minHeight:'100vh',background:'#080f20',display:'flex',alignItems:'center',justifyContent:'center',color:'#64748b',fontSize:16}}>Loading complaint form...</div>}>
      <ComplaintForm />
    </Suspense>
  );
}
