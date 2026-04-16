'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Result {
  subject: string; score: number; maxScore: number;
  grade: string; gradeColor: string; percentage: number;
  position: number; classSize: number; remarks: string;
  confirmed: boolean; resultSetId: string;
}

const DEMO: Result[] = [
  { subject: 'Mathematics', score: 78, maxScore: 100, grade: 'B', gradeColor: '#3b82f6', percentage: 78, position: 5, classSize: 42, remarks: 'Very good performance. Keep it up.', confirmed: false, resultSetId: 'r1' },
  { subject: 'English Language', score: 85, maxScore: 100, grade: 'A', gradeColor: '#10b981', percentage: 85, position: 2, classSize: 42, remarks: 'Outstanding work! Excellent writing skills.', confirmed: true, resultSetId: 'r2' },
  { subject: 'Physics', score: 45, maxScore: 100, grade: 'F', gradeColor: '#ef4444', percentage: 45, position: 38, classSize: 42, remarks: 'Requires significant improvement. Seek extra help.', confirmed: false, resultSetId: 'r3' },
  { subject: 'Chemistry', score: 62, maxScore: 100, grade: 'C', gradeColor: '#8b5cf6', percentage: 62, position: 14, classSize: 42, remarks: 'Satisfactory. More practice needed.', confirmed: false, resultSetId: 'r4' },
  { subject: 'Biology', score: 71, maxScore: 100, grade: 'B', gradeColor: '#3b82f6', percentage: 71, position: 8, classSize: 42, remarks: 'Good understanding of concepts.', confirmed: false, resultSetId: 'r5' },
  { subject: 'History', score: 88, maxScore: 100, grade: 'A', gradeColor: '#10b981', percentage: 88, position: 1, classSize: 42, remarks: 'Top of the class! Exceptional analysis.', confirmed: true, resultSetId: 'r6' },
  { subject: 'Geography', score: 55, maxScore: 100, grade: 'D', gradeColor: '#f59e0b', percentage: 55, position: 22, classSize: 42, remarks: 'Borderline pass. More study needed.', confirmed: false, resultSetId: 'r7' },
  { subject: 'Computer Science', score: 92, maxScore: 100, grade: 'A', gradeColor: '#10b981', percentage: 92, position: 1, classSize: 42, remarks: 'Exceptional programming skills.', confirmed: true, resultSetId: 'r8' },
];

const getOG = (pct: number) =>
  pct >= 80 ? { g: 'A', c: '#10b981', l: 'Excellent' } :
  pct >= 70 ? { g: 'B', c: '#3b82f6', l: 'Very Good' } :
  pct >= 60 ? { g: 'C', c: '#8b5cf6', l: 'Good' } :
  pct >= 50 ? { g: 'D', c: '#f59e0b', l: 'Pass' } :
  { g: 'F', c: '#ef4444', l: 'Fail' };

export default function StudentResultsPage() {
  const [results, setResults] = useState<Result[]>(DEMO);
  const [name, setName] = useState('Tabe Collins Mbuye');
  const [srmsId, setSrmsId] = useState('CM-GBHS-2026-STU-0042');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('srms_access_token');
    if (!token) { window.location.href = '/login'; return; }
    (async () => {
      try {
        const api = process.env.NEXT_PUBLIC_TENANT_API_URL || '';
        const res = await fetch(api + '/auth/me', { headers: { Authorization: 'Bearer ' + token } });
        if (res.ok) { const d = await res.json(); if (d.success) { setName(d.data.email || name); setSrmsId(d.data.srmsId || srmsId); } }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  const confirm = async (id: string) => {
    setConfirming(id);
    try {
      const token = localStorage.getItem('srms_access_token') || '';
      const api = process.env.NEXT_PUBLIC_TENANT_API_URL || '';
      await fetch(api + '/results/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ resultSetId: id, studentId: srmsId, confirmed: true }) });
    } catch {}
    setResults(p => p.map(r => r.resultSetId === id ? { ...r, confirmed: true } : r));
    setConfirming(null);
  };

  const total = results.reduce((s, r) => s + r.score, 0);
  const totalMax = results.reduce((s, r) => s + r.maxScore, 0);
  const pct = totalMax > 0 ? Math.round((total / totalMax) * 100) : 0;
  const og = getOG(pct);
  const passed = results.filter(r => r.grade !== 'F').length;
  const failed = results.filter(r => r.grade === 'F');
  const confirmedCt = results.filter(r => r.confirmed).length;

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0' }}>
      <style>{`@media print { body { background: white !important; color: black !important; } .np { display: none !important; } }`}</style>

      <header className="np" style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,15,32,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/student/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>← Dashboard</Link>
          <span style={{ color: '#334155' }}>|</span>
          <span style={{ color: 'white', fontWeight: 700 }}>My Results & Report Card</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => window.print()} style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>🖨️ Print / PDF</button>
          <Link href="/student/complaints/new" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '8px 16px', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>⚖️ Raise Complaint</Link>
        </div>
      </header>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '32px 24px' }}>

        {/* IDENTITY CARD */}
        <div style={{ background: 'linear-gradient(135deg,rgba(30,58,138,0.4),rgba(139,92,246,0.2))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 20, padding: 28, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 900, color: 'white' }}>{name.charAt(0).toUpperCase()}</div>
                <div><h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 900, margin: 0, marginBottom: 4 }}>{name}</h2><p style={{ color: '#60a5fa', fontSize: 13, margin: 0, fontFamily: 'monospace' }}>{srmsId}</p></div>
              </div>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 13, color: '#94a3b8' }}>
                <span>📚 Form 5 Science A</span><span>📅 First Term · 2026</span>
                <span>📋 {results.length} Subjects</span><span>✅ {confirmedCt}/{results.length} Confirmed</span>
              </div>
            </div>
            <div style={{ textAlign: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: 14, padding: '18px 28px', border: '1px solid ' + og.c + '30' }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: og.c, lineHeight: 1 }}>{og.g}</div>
              <div style={{ color: og.c, fontSize: 12, fontWeight: 700, marginTop: 4 }}>{og.l}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>Overall: {pct}%</div>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'Total Score', value: total + '/' + totalMax, color: '#3b82f6', icon: '🎯' },
            { label: 'Overall Average', value: pct + '%', color: og.c, icon: '📊' },
            { label: 'Passed', value: String(passed), color: '#10b981', icon: '✅' },
            { label: 'Failed', value: String(failed.length), color: failed.length > 0 ? '#ef4444' : '#10b981', icon: '❌' },
            { label: 'Best Position', value: '#' + Math.min(...results.map(r => r.position)), color: '#f59e0b', icon: '🏆' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: '1.4rem', marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: c.color }}>{c.value}</div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* FAILED WARNING */}
        {failed.length > 0 && (
          <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ color: '#f87171', fontWeight: 700, fontSize: 14, margin: '0 0 6px' }}>⚠️ Failed {failed.length} subject{failed.length > 1 ? 's' : ''}: {failed.map(s => s.subject).join(', ')}</p>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>If any score is incorrect, click Dispute and upload your exam paper as proof.</p>
          </div>
        )}

        {/* RESULTS TABLE */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden', marginBottom: 32 }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>📊 Academic Results — First Term 2026</h2>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(30,58,138,0.3)' }}>
                  {['Subject','Score','Grade','Performance','Position','Remarks','Status','Actions'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 14px', textAlign: 'left', color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.05em', borderBottom: '1px solid rgba(59,130,246,0.2)', whiteSpace: 'nowrap' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '14px 14px', fontWeight: 700, color: 'white', fontSize: 14 }}>{r.subject}</td>
                    <td style={{ padding: '14px 14px' }}><span style={{ fontSize: '1.3rem', fontWeight: 900, color: r.gradeColor }}>{r.score}</span><span style={{ color: '#334155', fontSize: 12 }}>/{r.maxScore}</span></td>
                    <td style={{ padding: '14px 14px' }}><span style={{ fontSize: '1.6rem', fontWeight: 900, color: r.gradeColor }}>{r.grade}</span><div style={{ color: '#64748b', fontSize: 11 }}>{r.percentage}%</div></td>
                    <td style={{ padding: '14px 14px', minWidth: 130 }}>
                      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 100, height: 7, width: 110, overflow: 'hidden', marginBottom: 4 }}>
                        <div style={{ height: '100%', borderRadius: 100, background: r.gradeColor, width: r.percentage + '%' }} />
                      </div>
                      <span style={{ color: '#475569', fontSize: 11 }}>{r.percentage}%</span>
                    </td>
                    <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: r.position <= 3 ? '#f59e0b' : 'white', fontSize: 15 }}>{r.position <= 3 ? '🏆' : ''}#{r.position}</div>
                      <div style={{ color: '#475569', fontSize: 11 }}>of {r.classSize}</div>
                    </td>
                    <td style={{ padding: '14px 14px', maxWidth: 190 }}>
                      <p style={{ color: r.grade === 'F' ? '#f87171' : r.grade === 'A' ? '#34d399' : '#94a3b8', fontSize: 12, fontStyle: 'italic', margin: 0, lineHeight: 1.4 }}>"{r.remarks}"</p>
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      {r.confirmed
                        ? <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 100, background: 'rgba(16,185,129,0.15)', color: '#34d399', fontSize: 11, fontWeight: 700 }}>✓ Confirmed</span>
                        : <span style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: 100, background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: 11, fontWeight: 700 }}>⏳ Pending</span>}
                    </td>
                    <td style={{ padding: '14px 14px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {!r.confirmed && (
                          <button onClick={() => confirm(r.resultSetId)} disabled={confirming === r.resultSetId}
                            style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 6, padding: '6px 10px', cursor: 'pointer', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' as const }}>
                            {confirming === r.resultSetId ? '...' : '✓ Confirm'}
                          </button>
                        )}
                        <Link href={'/student/complaints/new?subject=' + encodeURIComponent(r.subject) + '&score=' + r.score + '&resultSetId=' + r.resultSetId}
                          style={{ background: 'rgba(245,158,11,0.1)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 6, padding: '6px 10px', textDecoration: 'none', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' as const }}>
                          ⚖️ Dispute
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: 'rgba(30,58,138,0.2)' }}>
                  <td style={{ padding: '14px 14px', fontWeight: 700, color: '#93c5fd' }}>OVERALL TOTAL</td>
                  <td style={{ padding: '14px 14px' }}><span style={{ fontSize: '1.3rem', fontWeight: 900, color: og.c }}>{total}</span><span style={{ color: '#334155', fontSize: 12 }}>/{totalMax}</span></td>
                  <td style={{ padding: '14px 14px' }}><span style={{ fontSize: '1.8rem', fontWeight: 900, color: og.c }}>{og.g}</span></td>
                  <td style={{ padding: '14px 14px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 100, height: 7, width: 110, overflow: 'hidden' }}><div style={{ height: '100%', borderRadius: 100, background: og.c, width: pct + '%' }} /></div>
                    <span style={{ color: og.c, fontSize: 12, fontWeight: 700 }}>{pct}%</span>
                  </td>
                  <td colSpan={4} style={{ padding: '14px 14px', color: '#64748b', fontSize: 13 }}>{passed} passed · {failed.length} failed · {confirmedCt} confirmed</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* PRINTABLE REPORT CARD */}
        <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', marginBottom: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
          <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)', padding: '28px', textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 900, margin: 0, marginBottom: 6 }}>🏫 SRMS PLATFORM SCHOOL</h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: 0, marginBottom: 12 }}>Academic Result Report Card</p>
            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 20px', display: 'inline-block' }}>
              <span style={{ color: 'white', fontSize: 13 }}>First Term · 2026 · Form 5 Science A</span>
            </div>
          </div>
          <div style={{ padding: '20px 28px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <p style={{ color: '#64748b', fontSize: 11, margin: '0 0 4px', textTransform: 'uppercase' as const }}>Student</p>
              <p style={{ color: '#0f172a', fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>{name}</p>
              <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0', fontFamily: 'monospace' }}>{srmsId}</p>
            </div>
            <div style={{ textAlign: 'center', background: 'white', borderRadius: 10, padding: '14px 20px', border: '3px solid ' + og.c }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: og.c, lineHeight: 1 }}>{og.g}</div>
              <div style={{ color: og.c, fontWeight: 700, fontSize: 11 }}>{og.l}</div>
              <div style={{ color: '#64748b', fontSize: 11 }}>{pct}%</div>
            </div>
          </div>
          <div style={{ padding: '20px 28px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#1e3a8a' }}>
                  {['Subject','Score','Max','%','Grade','Position','Remarks'].map((h, i) => (
                    <th key={i} style={{ padding: '10px 12px', textAlign: 'left', color: 'white', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#f8fafc' : 'white', borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '9px 12px', fontWeight: 600, color: '#0f172a' }}>{r.subject}</td>
                    <td style={{ padding: '9px 12px', fontWeight: 700, color: r.gradeColor, fontSize: 14 }}>{r.score}</td>
                    <td style={{ padding: '9px 12px', color: '#64748b' }}>{r.maxScore}</td>
                    <td style={{ padding: '9px 12px', color: r.gradeColor, fontWeight: 600 }}>{r.percentage}%</td>
                    <td style={{ padding: '9px 12px' }}><span style={{ fontWeight: 900, fontSize: '1.1rem', color: r.gradeColor }}>{r.grade}</span></td>
                    <td style={{ padding: '9px 12px', color: '#0f172a' }}>{r.position}/{r.classSize}</td>
                    <td style={{ padding: '9px 12px', color: '#64748b', fontStyle: 'italic', fontSize: 12 }}>{r.remarks}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#1e3a8a' }}>
                  <td style={{ padding: '11px 12px', color: 'white', fontWeight: 700 }}>TOTAL</td>
                  <td style={{ padding: '11px 12px', color: 'white', fontWeight: 700, fontSize: 15 }}>{total}</td>
                  <td style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.7)' }}>{totalMax}</td>
                  <td style={{ padding: '11px 12px', color: pct >= 50 ? '#86efac' : '#fca5a5', fontWeight: 700 }}>{pct}%</td>
                  <td style={{ padding: '11px 12px', color: 'white', fontWeight: 900, fontSize: '1.2rem' }}>{og.g}</td>
                  <td colSpan={2} style={{ padding: '11px 12px', color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>{passed} passed · {failed.length} failed</td>
                </tr>
              </tfoot>
            </table>
            <div style={{ marginTop: 28, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
              {['Class Teacher Signature','Principal Signature','Parent / Guardian Signature'].map((l, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ height: 36, borderBottom: '1px solid #0f172a', marginBottom: 8 }} />
                  <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{l}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, textAlign: 'center', color: '#94a3b8', fontSize: 11 }}>
              Generated by SRMS Platform · {new Date().toLocaleDateString()} · AWS · MUFUNG ANGELBELL MBUYEH
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="np" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
          <button onClick={() => window.print()} style={{ background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', border: 'none', borderRadius: 10, padding: '14px 32px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>🖨️ Print Report Card / Save as PDF</button>
          <Link href="/student/complaints/new" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '14px 32px', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>⚖️ Raise a Complaint</Link>
          <Link href="/student/dashboard" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '14px 28px', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>← Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
