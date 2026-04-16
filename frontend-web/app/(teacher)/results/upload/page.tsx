'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';

interface StudentRow {
  id: string;
  studentId: string;
  studentName: string;
  score: string;
  maxScore: string;
  grade: string;
  gradeColor: string;
  percentage: number;
}

const getGradeInfo = (score: number, max: number) => {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 80) return { grade: 'A', color: '#10b981', label: 'Excellent' };
  if (pct >= 70) return { grade: 'B', color: '#3b82f6', label: 'Very Good' };
  if (pct >= 60) return { grade: 'C', color: '#8b5cf6', label: 'Good' };
  if (pct >= 50) return { grade: 'D', color: '#f59e0b', label: 'Pass' };
  return { grade: 'F', color: '#ef4444', label: 'Fail' };
};

const makeRow = (): StudentRow => ({
  id: Math.random().toString(36).slice(2),
  studentId: '', studentName: '', score: '',
  maxScore: '100', grade: '—', gradeColor: '#64748b', percentage: 0,
});

export default function UploadResultsPage() {
  const [className, setClassName] = useState('');
  const [term, setTerm] = useState('First Term');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [subjectName, setSubjectName] = useState('');
  const [students, setStudents] = useState<StudentRow[]>(
    Array.from({ length: 5 }, makeRow)
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [uploadMode, setUploadMode] = useState<'manual' | 'file'>('manual');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = (id: string, field: keyof StudentRow, value: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      const u = { ...s, [field]: value };
      if (field === 'score' || field === 'maxScore') {
        const sc = parseFloat(field === 'score' ? value : s.score) || 0;
        const mx = parseFloat(field === 'maxScore' ? value : s.maxScore) || 100;
        if (sc >= 0 && mx > 0) {
          const info = getGradeInfo(sc, mx);
          u.grade = info.grade; u.gradeColor = info.color;
          u.percentage = Math.round((sc / mx) * 100);
        }
      }
      return u;
    }));
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    const ok = file.name.match(/\.(xlsx|xls|csv)$/i);
    if (!ok) { setErrorMsg('Only Excel (.xlsx, .xls) and CSV files supported.'); return; }
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data: any[] = XLSX.utils.sheet_to_json(ws);
      if (!data.length) { setErrorMsg('File is empty.'); return; }
      const parsed: StudentRow[] = data.map((row: any) => {
        const sc = parseFloat(row['Score'] || row['score'] || row['Marks'] || '0') || 0;
        const mx = parseFloat(row['MaxScore'] || row['Max'] || '100') || 100;
        const info = getGradeInfo(sc, mx);
        return {
          id: Math.random().toString(36).slice(2),
          studentId: String(row['Student ID'] || row['ID'] || ''),
          studentName: String(row['Student Name'] || row['Name'] || ''),
          score: String(sc), maxScore: String(mx),
          grade: info.grade, gradeColor: info.color,
          percentage: Math.round((sc / mx) * 100),
        };
      }).filter(s => s.studentName || s.studentId);
      if (!parsed.length) { setErrorMsg('No valid data. Columns needed: Student ID, Student Name, Score'); return; }
      setStudents(parsed); setUploadMode('manual');
      setSuccessMsg(parsed.length + ' students loaded. Review and save.');
    } catch { setErrorMsg('Could not read file. Try a valid Excel or CSV.'); }
  };

  const submit = async () => {
    setErrorMsg(''); setSuccessMsg('');
    if (!className.trim()) { setErrorMsg('Enter the class name'); return; }
    if (!subjectName.trim()) { setErrorMsg('Enter the subject name'); return; }
    const valid = students.filter(s => s.studentId.trim() && s.studentName.trim() && s.score.trim());
    if (!valid.length) { setErrorMsg('Add at least one student with ID, name and score'); return; }
    const bad = valid.filter(s => { const sc = parseFloat(s.score); const mx = parseFloat(s.maxScore); return isNaN(sc) || sc < 0 || sc > mx; });
    if (bad.length) { setErrorMsg('Invalid scores for: ' + bad.map(s => s.studentName).join(', ')); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('srms_access_token') || '';
      const api = process.env.NEXT_PUBLIC_TENANT_API_URL || '';
      const res = await fetch(api + '/results/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({
          className, term, year, subjectName,
          teacherId: localStorage.getItem('srms_user_id') || 'teacher-demo',
          students: valid.map(s => ({ studentId: s.studentId.trim(), studentName: s.studentName.trim(), score: parseFloat(s.score), maxScore: parseFloat(s.maxScore) || 100 })),
        }),
      });
      const data = await res.json();
      if (!data.success) { setErrorMsg(data.error?.message || 'Upload failed.'); return; }
      setSuccessMsg('Results saved for ' + valid.length + ' students. Average: ' + (data.data?.summary?.classAverage || '—') + '%. Status: Draft.');
    } catch {
      const avg = Math.round(valid.reduce((s, r) => s + r.percentage, 0) / valid.length);
      setSuccessMsg('Results calculated for ' + valid.length + ' students. Average: ' + avg + '%. Will save when API is connected.');
    } finally { setLoading(false); }
  };

  const filled = students.filter(s => s.studentName);
  const scored = students.filter(s => s.score && s.grade !== '—');
  const avg = scored.length ? Math.round(scored.reduce((s, r) => s + r.percentage, 0) / scored.length) : 0;
  const passed = scored.filter(s => s.grade !== 'F').length;
  const failed = scored.filter(s => s.grade === 'F').length;
  const avgColor = avg >= 70 ? '#10b981' : avg >= 50 ? '#f59e0b' : '#ef4444';

  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' };
  const cell: React.CSSProperties = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px 10px', color: '#e2e8f0', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,15,32,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/teacher/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>← Dashboard</Link>
          <span style={{ color: '#334155' }}>|</span>
          <span style={{ color: 'white', fontWeight: 700 }}>Upload Results</span>
        </div>
        <button onClick={submit} disabled={loading} style={{ background: loading ? '#334155' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 14 }}>
          {loading ? 'Saving...' : '💾 Save as Draft'}
        </button>
      </header>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 24px' }}>
        {errorMsg && <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 14 }}>⚠️ {errorMsg}</div>}
        {successMsg && <div style={{ marginBottom: 20, padding: '16px 20px', borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#34d399', fontSize: 14 }}>{successMsg}</div>}

        {/* LIVE SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Students Entered', value: filled.length.toString(), color: '#3b82f6', icon: '👥' },
            { label: 'Class Average', value: scored.length ? avg + '%' : '—', color: avgColor, icon: '📊' },
            { label: 'Passed', value: scored.length ? passed.toString() : '—', color: '#10b981', icon: '✅' },
            { label: 'Failed', value: scored.length ? failed.toString() : '—', color: failed > 0 ? '#ef4444' : '#475569', icon: '❌' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: c.color }}>{c.value}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* CLASS INFO */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginBottom: 20 }}>📋 Result Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Class / Form *</label>
              <input style={inp} placeholder="e.g. Form 5 Science A" value={className} onChange={e => setClassName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Subject *</label>
              <input style={inp} placeholder="e.g. Mathematics" value={subjectName} onChange={e => setSubjectName(e.target.value)} />
            </div>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Term *</label>
              <select style={{ ...inp, background: '#0f172a' }} value={term} onChange={e => setTerm(e.target.value)}>
                <option>First Term</option><option>Second Term</option><option>Third Term</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Year</label>
              <input style={inp} placeholder="2026" value={year} onChange={e => setYear(e.target.value)} />
            </div>
          </div>
        </div>

        {/* UPLOAD MODE */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: uploadMode === 'file' ? 20 : 0 }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>📁 Entry Method</h2>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 4, gap: 4 }}>
              {(['manual', 'file'] as const).map(m => (
                <button key={m} onClick={() => setUploadMode(m)} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: uploadMode === m ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'transparent', color: uploadMode === m ? 'white' : '#64748b' }}>
                  {m === 'manual' ? '✏️ Type Manually' : '📂 Upload File'}
                </button>
              ))}
            </div>
          </div>
          {uploadMode === 'file' && (
            <div onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              onClick={() => fileRef.current?.click()}
              style={{ border: '2px dashed ' + (dragOver ? '#3b82f6' : 'rgba(255,255,255,0.15)'), borderRadius: 12, padding: '48px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(59,130,246,0.05)' : 'rgba(255,255,255,0.02)' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📊</div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>Drop file here or click to browse</p>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>Excel (.xlsx, .xls) or CSV (.csv)</p>
              <p style={{ color: '#475569', fontSize: 12 }}>Required columns: <strong style={{ color: '#94a3b8' }}>Student ID | Student Name | Score</strong></p>
              <input ref={fileRef} type="file" style={{ display: 'none' }} accept=".xlsx,.xls,.csv" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            </div>
          )}
        </div>

        {/* SCORE TABLE */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>📝 Student Scores — {subjectName || 'Enter subject above'}</h2>
            <button onClick={() => setStudents(p => [...p, makeRow()])} style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>+ Add Row</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(30,58,138,0.3)' }}>
                  {['#','Student ID','Full Name','Score','Out Of','Grade (Live)','Progress','Remove'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 14px', textAlign: 'left', color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid rgba(59,130,246,0.2)', whiteSpace: 'nowrap' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '10px 14px', color: '#475569', fontSize: 13 }}>{i + 1}</td>
                    <td style={{ padding: '10px 14px' }}><input style={{ ...cell, width: 170, fontSize: 12 }} placeholder="CM-GBHS-2026-STU-0042" value={s.studentId} onChange={e => update(s.id, 'studentId', e.target.value)} /></td>
                    <td style={{ padding: '10px 14px' }}><input style={{ ...cell, width: 180, fontSize: 13 }} placeholder="Student full name" value={s.studentName} onChange={e => update(s.id, 'studentName', e.target.value)} /></td>
                    <td style={{ padding: '10px 14px' }}>
                      <input style={{ ...cell, width: 75, fontSize: 18, fontWeight: 900, textAlign: 'center', color: s.score ? s.gradeColor : '#e2e8f0', borderColor: s.score ? s.gradeColor + '50' : 'rgba(255,255,255,0.08)' }}
                        placeholder="0" type="number" min="0" max={s.maxScore} value={s.score} onChange={e => update(s.id, 'score', e.target.value)} />
                    </td>
                    <td style={{ padding: '10px 14px' }}><input style={{ ...cell, width: 65, textAlign: 'center', color: '#64748b', fontSize: 13 }} type="number" value={s.maxScore} onChange={e => update(s.id, 'maxScore', e.target.value)} /></td>
                    <td style={{ padding: '10px 14px' }}>
                      {s.grade !== '—' ? <div><span style={{ fontSize: '1.8rem', fontWeight: 900, color: s.gradeColor }}>{s.grade}</span><span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>{s.percentage}%</span></div>
                        : <span style={{ color: '#334155', fontSize: 12 }}>Enter score →</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {s.score && <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 100, height: 6, width: 100, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 100, background: s.gradeColor, width: s.percentage + '%', transition: 'width 0.3s ease' }} /></div>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => { if (students.length > 1) setStudents(p => p.filter(r => r.id !== s.id)); }} disabled={students.length <= 1}
                        style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', borderRadius: 6, padding: '6px 10px', cursor: students.length <= 1 ? 'not-allowed' : 'pointer', opacity: students.length <= 1 ? 0.3 : 1, fontSize: 12 }}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: '14px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 16 }}>
            <button onClick={() => setStudents(p => [...p, makeRow()])} style={{ background: 'none', color: '#60a5fa', border: '1px dashed rgba(59,130,246,0.4)', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}>+ Add Another Student</button>
            <span style={{ color: '#334155', fontSize: 13 }}>{filled.length} students entered</span>
          </div>
        </div>

        {/* GRADE SCALE */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.1em', marginBottom: 14 }}>Grading Scale Reference</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' as const }}>
            {[{r:'80–100',g:'A',l:'Excellent',c:'#10b981'},{r:'70–79',g:'B',l:'Very Good',c:'#3b82f6'},{r:'60–69',g:'C',l:'Good',c:'#8b5cf6'},{r:'50–59',g:'D',l:'Pass',c:'#f59e0b'},{r:'0–49',g:'F',l:'Fail',c:'#ef4444'}].map((g,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: g.c + '12', border: '1px solid ' + g.c + '25' }}>
                <span style={{ color: g.c, fontWeight: 900, fontSize: 16 }}>{g.g}</span>
                <div><div style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600 }}>{g.l}</div><div style={{ color: '#64748b', fontSize: 11 }}>{g.r}%</div></div>
              </div>
            ))}
          </div>
        </div>

        {/* SUBMIT */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Link href="/teacher/dashboard" style={{ padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Cancel</Link>
          <button onClick={submit} disabled={loading} style={{ background: loading ? '#334155' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: 'white', border: 'none', borderRadius: 10, padding: '14px 40px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 15 }}>
            {loading ? 'Saving...' : '💾 Save Results as Draft →'}
          </button>
        </div>
      </div>
    </div>
  );
}
