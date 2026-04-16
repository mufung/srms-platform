// SRMS-2-STUDENT-001: Student Dashboard Page
// Owner: MUFUNG ANGELBELL MBUYEH

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface StudentResult {
  subject: string;
  score: number;
  grade: string;
  position: number;
  remarks: string;
  teacherName: string;
  maxScore: number;
}

const getGradeColor = (grade: string) => {
  const colors: Record<string, string> = {
    A: 'text-emerald-400', B: 'text-blue-400',
    C: 'text-purple-400', D: 'text-amber-400', F: 'text-red-400',
  };
  return colors[grade] || 'text-slate-400';
};

const getScoreBackground = (score: number, max: number) => {
  const pct = (score / max) * 100;
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 70) return 'bg-blue-500';
  if (pct >= 60) return 'bg-purple-500';
  if (pct >= 50) return 'bg-amber-500';
  return 'bg-red-500';
};

export default function StudentDashboard() {
  const [studentName, setStudentName] = useState('');
  const [srmsId, setSrmsId] = useState('');
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'results' | 'complaints' | 'notifications'>('results');

  useEffect(() => {
    const token = localStorage.getItem('srms_access_token');
    if (!token) { window.location.href = '/login'; return; }
    loadStudentData(token);
  }, []);

  const loadStudentData = async (token: string) => {
    try {
      const apiBase = process.env.NEXT_PUBLIC_TENANT_API_URL || '';
      const res = await fetch(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setStudentName(data.data.email || 'Student');
        setSrmsId(data.data.srmsId || '');
      }

      // Load mock results for Phase 2
      setResults([
        { subject: 'Mathematics', score: 78, grade: 'B', position: 5, remarks: 'Good performance', teacherName: 'Mr. Fon', maxScore: 100 },
        { subject: 'English Language', score: 85, grade: 'A', position: 2, remarks: 'Excellent work', teacherName: 'Mrs. Bah', maxScore: 100 },
        { subject: 'Physics', score: 45, grade: 'F', position: 28, remarks: 'Needs improvement', teacherName: 'Mr. Tanyi', maxScore: 100 },
        { subject: 'Chemistry', score: 62, grade: 'C', position: 14, remarks: 'Satisfactory', teacherName: 'Mrs. Ngwa', maxScore: 100 },
        { subject: 'Biology', score: 71, grade: 'B', position: 8, remarks: 'Very good', teacherName: 'Mr. Ache', maxScore: 100 },
        { subject: 'History', score: 88, grade: 'A', position: 1, remarks: 'Outstanding', teacherName: 'Mr. Ndi', maxScore: 100 },
        { subject: 'Geography', score: 55, grade: 'D', position: 22, remarks: 'Needs more effort', teacherName: 'Mrs. Tita', maxScore: 100 },
        { subject: 'Computer Science', score: 92, grade: 'A', position: 1, remarks: 'Exceptional', teacherName: 'Mr. AWS', maxScore: 100 },
      ]);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalScore = results.reduce((s, r) => s + r.score, 0);
  const average = results.length > 0 ? (totalScore / results.length).toFixed(1) : '0';
  const overallGrade = parseFloat(average) >= 80 ? 'A' : parseFloat(average) >= 70 ? 'B' : parseFloat(average) >= 60 ? 'C' : parseFloat(average) >= 50 ? 'D' : 'F';

  return (
    <div className="min-h-screen bg-slate-950">
      {/* SRMS-2-STUDENT-002: Top navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-800 flex items-center justify-center font-bold text-white text-sm">
              🎓
            </div>
            <div>
              <p className="font-heading font-bold text-white text-sm">Student Portal</p>
              <p className="text-emerald-400 text-xs">{srmsId}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden md:block">{studentName}</span>
            <button
              onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
              className="text-slate-500 hover:text-red-400 text-sm transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* SRMS-2-STUDENT-003: Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Overall Average', value: average + '%', icon: '📊', color: 'text-blue-400' },
            { label: 'Overall Grade', value: overallGrade, icon: '🏆', color: `${getGradeColor(overallGrade)}` },
            { label: 'Subjects', value: results.length.toString(), icon: '📚', color: 'text-purple-400' },
            { label: 'Complaints Open', value: '0', icon: '⚖️', color: 'text-amber-400' },
          ].map((card, i) => (
            <div key={i} className="glass-card p-5">
              <div className="text-2xl mb-2">{card.icon}</div>
              <div className={`font-heading text-3xl font-black ${card.color}`}>{card.value}</div>
              <div className="text-slate-500 text-xs mt-1">{card.label}</div>
            </div>
          ))}
        </div>

        {/* SRMS-2-STUDENT-004: Tab navigation */}
        <div className="flex gap-1 p-1 glass-card rounded-xl w-fit">
          {(['results', 'complaints', 'notifications'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* SRMS-2-STUDENT-005: Results table */}
        {activeTab === 'results' && (
  <div className="glass-card overflow-hidden" style={{ borderRadius: '16px', overflow: 'hidden' }}>
    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <h2 style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem', margin: 0 }}>
        Academic Results — First Term 2026
      </h2>
      <Link href="/student/results"
        style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: 'white', textDecoration: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: '600' }}>
        View Full Results + Report Card →
      </Link>
    </div>
    {loading ? (
      <div style={{ padding: '48px', textAlign: 'center', color: '#475569' }}>Loading...</div>
    ) : (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(30,58,138,0.3)' }}>
              {['Subject', 'Score', 'Grade', 'Progress', 'Position', 'Remarks'].map((h, i) => (
                <th key={i} style={{ padding: '12px 16px', textAlign: 'left', color: '#93c5fd', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid rgba(59,130,246,0.2)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map((result, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '14px 16px', fontWeight: '600', color: 'white' }}>{result.subject}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: '900', color: result.grade === 'A' ? '#10b981' : result.grade === 'B' ? '#3b82f6' : result.grade === 'C' ? '#8b5cf6' : result.grade === 'D' ? '#f59e0b' : '#ef4444' }}>
                    {result.score}
                  </span>
                  <span style={{ color: '#334155', fontSize: '12px' }}>/{result.maxScore}</span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '900', color: result.grade === 'A' ? '#10b981' : result.grade === 'B' ? '#3b82f6' : result.grade === 'C' ? '#8b5cf6' : result.grade === 'D' ? '#f59e0b' : '#ef4444' }}>
                    {result.grade}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', minWidth: '120px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '100px', height: '6px', overflow: 'hidden', width: '100px' }}>
                    <div style={{ height: '100%', borderRadius: '100px', background: result.grade === 'A' ? '#10b981' : result.grade === 'B' ? '#3b82f6' : result.grade === 'C' ? '#8b5cf6' : result.grade === 'D' ? '#f59e0b' : '#ef4444', width: `${result.score}%` }} />
                  </div>
                </td>
                <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                  #{result.position}
                </td>
                <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px', fontStyle: 'italic' }}>
                  {result.remarks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

        {activeTab === 'complaints' && (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">⚖️</div>
            <h3 className="font-heading text-xl font-bold text-white mb-3">No Open Complaints</h3>
            <p className="text-slate-400 mb-6">If you believe any of your results are incorrect, raise a complaint with photo proof from your results table above.</p>
            <div className="text-slate-600 text-sm">Complaint Engine — Section 2</div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">🔔</div>
            <h3 className="font-heading text-xl font-bold text-white mb-3">No New Notifications</h3>
            <p className="text-slate-400">Notifications will appear here when results are updated, complaints are resolved, or your school sends announcements.</p>
          </div>
        )}
      </div>
    </div>
  );
}