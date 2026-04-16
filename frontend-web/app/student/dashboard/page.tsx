'use client';

import { useState } from 'react';
import Link from 'next/link';
import NotificationBell from '../../../components/notifications/NotificationBell';

const RESULTS = [
  { subject:'Mathematics', score:78, maxScore:100, grade:'B', color:'#3b82f6', position:5, remarks:'Very good performance.' },
  { subject:'English Language', score:85, maxScore:100, grade:'A', color:'#10b981', position:2, remarks:'Outstanding work!' },
  { subject:'Physics', score:45, maxScore:100, grade:'F', color:'#ef4444', position:38, remarks:'Needs significant improvement.' },
  { subject:'Chemistry', score:62, maxScore:100, grade:'C', color:'#8b5cf6', position:14, remarks:'Satisfactory. More practice needed.' },
  { subject:'Biology', score:71, maxScore:100, grade:'B', color:'#3b82f6', position:8, remarks:'Good understanding of concepts.' },
  { subject:'History', score:88, maxScore:100, grade:'A', color:'#10b981', position:1, remarks:'Top of the class!' },
  { subject:'Geography', score:55, maxScore:100, grade:'D', color:'#f59e0b', position:22, remarks:'Borderline pass.' },
  { subject:'Computer Science', score:92, maxScore:100, grade:'A', color:'#10b981', position:1, remarks:'Exceptional skills.' },
];

const name = 'Tabe Collins Mbuye';
const srmsId = 'CM-GBHS-2026-STU-0042';

export default function StudentDashboard() {
  const [tab, setTab] = useState<'results'|'complaints'|'notifications'>('results');

  const avg = Math.round(RESULTS.reduce((s, r) => s + r.score, 0) / RESULTS.length);
  const ogGrade = avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';
  const ogColor = ogGrade === 'A' ? '#10b981' : ogGrade === 'B' ? '#3b82f6' : ogGrade === 'C' ? '#8b5cf6' : ogGrade === 'D' ? '#f59e0b' : '#ef4444';

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,15,32,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎓</div>
          <div>
            <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>Student Portal</p>
            <p style={{ color: '#34d399', fontSize: 11, margin: 0, fontFamily: 'monospace' }}>{srmsId}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NotificationBell />
          <Link href="/student/notifications/preferences" style={{ color: '#475569', textDecoration: 'none', fontSize: 18, padding: '6px 8px', borderRadius: 8 }} title="Notification preferences">⚙️</Link>
          <span style={{ color: '#475569', fontSize: 13 }}>{name}</span>
          <Link href="/login" style={{ color: '#475569', fontSize: 13, textDecoration: 'none', padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>Sign Out</Link>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

        {/* Demo banner */}
        <div style={{ marginBottom: 24, padding: '12px 18px', borderRadius: 10, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>ℹ️</span>
          <span style={{ color: '#60a5fa', fontSize: 13 }}>Demo Mode — sample data shown. Real students log in with their SRMS ID to see live results.</span>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label:'Overall Grade', value: ogGrade, color: ogColor, icon:'🏆' },
            { label:'Average Score', value: avg+'%', color: ogColor, icon:'📊' },
            { label:'Subjects', value: String(RESULTS.length), color:'#3b82f6', icon:'📚' },
            { label:'Open Complaints', value:'0', color:'#64748b', icon:'⚖️' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20 }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: c.color }}>{c.value}</div>
              <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* AI Assistant banner */}
        <div style={{ marginBottom: 24, background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🤖</div>
            <div>
              <p style={{ color: '#a5b4fc', fontWeight: 700, fontSize: 14, margin: 0 }}>SRMS AI Assistant</p>
              <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>Ask me about your grades, complaints, or anything SRMS</p>
            </div>
          </div>
          <Link href="/student/ai-assistant" style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', textDecoration: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
            Chat with AI →
          </Link>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 24 }}>
          {(['results', 'complaints', 'notifications'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize', background: tab === t ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'transparent', color: tab === t ? 'white' : '#64748b' }}>
              {t}
            </button>
          ))}
        </div>

        {/* Results tab */}
        {tab === 'results' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Academic Results — First Term 2026</h2>
              <Link href="/student/results" style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: 'white', textDecoration: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 700 }}>
                View Full Results + Report Card →
              </Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'rgba(30,58,138,0.3)' }}>
                    {['Subject','Score','Grade','Progress','Position','Remarks'].map((h, i) => (
                      <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RESULTS.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'white' }}>{r.subject}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 900, color: r.color }}>{r.score}</span>
                        <span style={{ color: '#334155', fontSize: 12 }}>/{r.maxScore}</span>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: r.color }}>{r.grade}</span>
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: 120 }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 100, height: 6, width: 100, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 100, background: r.color, width: Math.round((r.score/r.maxScore)*100)+'%' }} />
                        </div>
                        <span style={{ color: '#475569', fontSize: 11 }}>{Math.round((r.score/r.maxScore)*100)}%</span>
                      </td>
                      <td style={{ padding: '12px 16px', color: r.position <= 3 ? '#f59e0b' : '#64748b', fontWeight: r.position <= 3 ? 700 : 400, fontSize: 13 }}>
                        {r.position <= 3 ? '🏆' : ''}#{r.position}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', fontSize: 12, fontStyle: 'italic' }}>{r.remarks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Complaints tab */}
        {tab === 'complaints' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>⚖️</div>
            <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 8 }}>No Open Complaints</h3>
            <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>To dispute a result, go to your results page and click Dispute on the subject.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/student/results" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 20px', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Go to My Results →
              </Link>
              <Link href="/student/complaints/track" style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '10px 20px', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                Track Complaints →
              </Link>
            </div>
          </div>
        )}

        {/* Notifications tab */}
        {tab === 'notifications' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Recent Notifications</h2>
              <div style={{ display: 'flex', gap: 10 }}>
                <Link href="/student/notifications" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>View All →</Link>
                <Link href="/student/notifications/preferences" style={{ color: '#475569', textDecoration: 'none', fontSize: 13 }}>⚙️ Preferences</Link>
              </div>
            </div>
            {[
              { icon:'📊', title:'Results Published — Mathematics', time:'30 min ago', color:'#3b82f6', read:false },
              { icon:'✅', title:'Complaint Resolved — Physics', time:'2 hours ago', color:'#10b981', read:false },
              { icon:'📢', title:'End of Term Notice', time:'5 hours ago', color:'#8b5cf6', read:true },
              { icon:'📊', title:'Results Published — English Language', time:'2 days ago', color:'#3b82f6', read:true },
            ].map((n, i) => (
              <div key={i} style={{ padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 14, background: n.read ? 'transparent' : 'rgba(59,130,246,0.03)' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: n.color+'15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>{n.icon}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: n.read ? '#94a3b8' : 'white', fontWeight: n.read ? 400 : 600, fontSize: 13, margin: 0 }}>{n.title}</p>
                  <p style={{ color: '#334155', fontSize: 11, margin: '3px 0 0' }}>{n.time}</p>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />}
              </div>
            ))}
            <div style={{ padding: '14px 24px' }}>
              <Link href="/student/notifications" style={{ display: 'block', textAlign: 'center', padding: 11, borderRadius: 8, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                View All Notifications →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}