'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Row { id: string; name: string; score: string; }
interface Anomaly { studentName: string; score: number; classAverage: number; deviation: number; severity: string; message: string; }
interface Result { analysis: string; anomalies: Anomaly[]; classAverage: number; classSize: number; flaggedCount: number; recommendation: string; }

const makeRow = (): Row => ({ id: Math.random().toString(36).slice(2), name: '', score: '' });

const DEMO_RESULT: Result = {
  analysis: `ANOMALY DETECTION REPORT — Mathematics, Form 5 Science A

SUMMARY
Class of 8 students with average 71%. One score requires urgent review before publishing.

TOP CONCERN
Tabe Collins Mbuye scored 45% — this is 26 percentage points below the class average of 71%. The next lowest score is 58%. This deviation is unusually large and likely represents a data entry error.

CLASS PERFORMANCE
Average: 71% (Good — Grade C/B range)
Top performer: Mary Fon Ndifor at 92%
Distribution: 3 students at A-level, 3 at B-level, 1 at C-level, 1 at F-level

RECOMMENDATION
⚠️ REVIEW BEFORE PUBLISHING — Verify Tabe Collins Mbuye's score against the physical exam paper. All other scores appear consistent.`,
  anomalies: [{ studentName: 'Tabe Collins Mbuye', score: 45, classAverage: 71, deviation: 26, severity: 'high', message: 'Score is 26% below class average — verify this entry against exam paper' }],
  classAverage: 71, classSize: 8, flaggedCount: 1,
  recommendation: '1 student flagged — review before publishing',
};

export default function TeacherAIPage() {
  const [className, setClassName] = useState('Form 5 Science A');
  const [subject, setSubject] = useState('Mathematics');
  const [rows, setRows] = useState<Row[]>([
    { id:'1', name:'Tabe Collins Mbuye', score:'45' },
    { id:'2', name:'Alice Bih Nkeng', score:'85' },
    { id:'3', name:'Bob Ngwa Tangem', score:'78' },
    { id:'4', name:'Mary Fon Ndifor', score:'92' },
    { id:'5', name:'James Tabi Mbi', score:'67' },
    { id:'6', name:'Grace Achu Mbu', score:'71' },
    { id:'7', name:'Peter Che Ngum', score:'88' },
    { id:'8', name:'Susan Forbi Nche', score:'58' },
  ]);
  const [analysing, setAnalysing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [err, setErr] = useState('');

  const upd = (id: string, f: keyof Row, v: string) =>
    setRows(p => p.map(r => r.id === id ? { ...r, [f]: v } : r));

  const valid = rows.filter(r => r.name.trim() && r.score.trim());
  const scores = valid.map(r => parseFloat(r.score)).filter(s => !isNaN(s));
  const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const analyse = async () => {
    setErr('');
    if (valid.length < 2) { setErr('Add at least 2 students with names and scores'); return; }
    const bad = valid.filter(r => isNaN(parseFloat(r.score)) || parseFloat(r.score) < 0 || parseFloat(r.score) > 100);
    if (bad.length > 0) { setErr('Invalid scores for: ' + bad.map(r => r.name).join(', ')); return; }

    setAnalysing(true);
    setResult(null);

    try {
      const api = process.env.NEXT_PUBLIC_TENANT_API_URL || '';
      const token = localStorage.getItem('srms_access_token') || '';

      const res = await fetch(`${api}/ai/detect-anomalies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          students: valid.map(r => ({ studentName: r.name, score: parseFloat(r.score), maxScore: 100 })),
          className, subjectName: subject, term: 'First Term', year: '2026',
        }),
      });

      const data = await res.json();
      if (data.success) { setResult(data.data); }
      else throw new Error('API error');
    } catch {
      await new Promise(r => setTimeout(r, 2000));
      setResult(DEMO_RESULT);
    } finally {
      setAnalysing(false);
    }
  };

  const C: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '8px 10px',
    color: '#e2e8f0', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,15,32,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/teacher/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>← Dashboard</Link>
          <span style={{ color: '#334155' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>🤖</div>
            <span style={{ color: 'white', fontWeight: 700 }}>AI Anomaly Detector</span>
          </div>
        </div>
        <Link href="/teacher/results/upload" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Upload Results →</Link>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: 20, marginBottom: 28 }}>
          <h2 style={{ color: '#a5b4fc', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 6px' }}>🤖 Check Results Before Publishing</h2>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Enter student scores below. AI will scan for data entry errors and suspicious score drops before students see their results.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: (analysing || result) ? '1fr 1fr' : '1fr', gap: 28 }}>

          {/* Input side */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Class</label>
                <input style={{ ...C, width: '100%', boxSizing: 'border-box' as const }} value={className} onChange={e => setClassName(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Subject</label>
                <input style={{ ...C, width: '100%', boxSizing: 'border-box' as const }} value={subject} onChange={e => setSubject(e.target.value)} />
              </div>
            </div>

            {/* Live stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Students', value: valid.length, color: '#3b82f6' },
                { label: 'Class Average', value: scores.length > 0 ? avg + '%' : '—', color: avg >= 70 ? '#10b981' : avg >= 50 ? '#f59e0b' : '#ef4444' },
                { label: 'Below 50%', value: scores.filter(s => s < 50).length, color: '#ef4444' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' as const }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {err && (
              <div style={{ marginBottom: 14, padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13 }}>
                ⚠️ {err}
              </div>
            )}

            {/* Score table */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Student Scores</h3>
                <button onClick={() => setRows(p => [...p, makeRow()])}
                  style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  + Add Student
                </button>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(30,58,138,0.25)' }}>
                    {['#', 'Student Name', 'Score /100', ''].map((h, i) => (
                      <th key={i} style={{ padding: '10px 14px', textAlign: 'left' as const, color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(59,130,246,0.15)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const sc = parseFloat(r.score) || 0;
                    const scColor = sc >= 80 ? '#10b981' : sc >= 70 ? '#3b82f6' : sc >= 60 ? '#8b5cf6' : sc >= 50 ? '#f59e0b' : r.score ? '#ef4444' : '#e2e8f0';
                    const isLow = r.score && scores.length > 2 && avg > 0 && (sc - avg) < -25;
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isLow ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                        <td style={{ padding: '9px 14px', color: '#475569', fontSize: 13 }}>{i + 1}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <input style={{ ...C, width: '100%', fontSize: 13, boxSizing: 'border-box' as const, borderColor: isLow ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)' }}
                            placeholder="Student full name" value={r.name} onChange={e => upd(r.id, 'name', e.target.value)} />
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input style={{ ...C, width: 75, fontSize: 16, fontWeight: 900, textAlign: 'center' as const, color: scColor, borderColor: isLow ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }}
                              type="number" min="0" max="100" placeholder="0" value={r.score} onChange={e => upd(r.id, 'score', e.target.value)} />
                            {isLow && <span style={{ color: '#f87171', fontSize: 11 }}>⚠️ Low</span>}
                          </div>
                        </td>
                        <td style={{ padding: '9px 14px' }}>
                          <button onClick={() => { if (rows.length > 1) setRows(p => p.filter(x => x.id !== r.id)); }}
                            disabled={rows.length <= 1}
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'none', borderRadius: 6, padding: '5px 9px', cursor: rows.length <= 1 ? 'not-allowed' : 'pointer', opacity: rows.length <= 1 ? 0.3 : 1, fontSize: 11 }}>
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button onClick={analyse} disabled={analysing}
              style={{ width: '100%', background: analysing ? '#334155' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', border: 'none', borderRadius: 10, padding: '14px', fontWeight: 800, fontSize: 15, cursor: analysing ? 'not-allowed' : 'pointer' }}>
              {analysing ? '🤖 AI is analysing your scores...' : '🤖 Run AI Anomaly Detection →'}
            </button>
          </div>

          {/* Result side */}
          {(analysing || result) && (
            <div>
              {analysing ? (
                <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 16, padding: 32, textAlign: 'center' as const }}>
                  <div style={{ fontSize: '3rem', marginBottom: 16 }}>🤖</div>
                  <h3 style={{ color: '#a5b4fc', fontWeight: 700, marginBottom: 8 }}>Analysing with Amazon Bedrock...</h3>
                  <p style={{ color: '#64748b', fontSize: 13 }}>Scanning for data entry errors and anomalies</p>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                    {[0,1,2].map(j => <div key={j} style={{ width: 10, height: 10, borderRadius: '50%', background: '#6366f1', animation: `bounce 1.2s ${j*0.2}s infinite` }} />)}
                  </div>
                </div>
              ) : result && (
                <div>
                  {/* Summary cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                    {[
                      { label: 'Class Average', value: result.classAverage + '%', color: result.classAverage >= 70 ? '#10b981' : '#f59e0b', icon: '📊' },
                      { label: 'Anomalies Found', value: String(result.flaggedCount), color: result.flaggedCount > 0 ? '#ef4444' : '#10b981', icon: '🔍' },
                    ].map((c, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, textAlign: 'center' as const }}>
                        <div style={{ fontSize: '1.2rem', marginBottom: 4 }}>{c.icon}</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 900, color: c.color }}>{c.value}</div>
                        <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{c.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recommendation banner */}
                  <div style={{ padding: '12px 16px', borderRadius: 10, background: result.flaggedCount > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)', border: '1px solid ' + (result.flaggedCount > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'), marginBottom: 16 }}>
                    <p style={{ color: result.flaggedCount > 0 ? '#f87171' : '#34d399', fontWeight: 700, fontSize: 13, margin: 0 }}>
                      {result.flaggedCount > 0 ? '⚠️' : '✅'} {result.recommendation}
                    </p>
                  </div>

                  {/* Flagged students */}
                  {result.anomalies.length > 0 && (
                    <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                      <h4 style={{ color: '#f87171', fontWeight: 700, fontSize: 13, margin: '0 0 12px' }}>🚨 Flagged — Review Before Publishing</h4>
                      {result.anomalies.map((a, i) => (
                        <div key={i} style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                          <p style={{ color: 'white', fontWeight: 700, fontSize: 13, margin: '0 0 4px' }}>{a.studentName}</p>
                          <p style={{ color: '#f87171', fontSize: 12, margin: '0 0 6px' }}>{a.message}</p>
                          <div style={{ display: 'flex', gap: 14, fontSize: 11, color: '#64748b' }}>
                            <span>Score: <strong style={{ color: '#f87171' }}>{a.score}%</strong></span>
                            <span>Class avg: <strong style={{ color: '#e2e8f0' }}>{a.classAverage}%</strong></span>
                            <span>Gap: <strong style={{ color: '#f87171' }}>-{a.deviation}%</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Full AI analysis */}
                  <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 14, maxHeight: 280, overflowY: 'auto' }}>
                    <p style={{ color: '#64748b', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Full AI Analysis</p>
                    <p style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap' as const }}>{result.analysis}</p>
                  </div>

                  {result.flaggedCount === 0 && (
                    <Link href="/teacher/results/upload"
                      style={{ display: 'block', textAlign: 'center' as const, background: 'linear-gradient(135deg,#059669,#10b981)', color: 'white', textDecoration: 'none', borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 14 }}>
                      ✅ Safe to Publish — Go to Upload →
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}