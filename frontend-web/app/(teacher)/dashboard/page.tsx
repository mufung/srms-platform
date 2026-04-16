// SRMS-2-TEACHER-001: Teacher Dashboard Page
// Owner: MUFUNG ANGELBELL MBUYEH

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TeacherDashboard() {
  const [teacherName, setTeacherName] = useState('');
  const [srmsId, setSrmsId] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'complaints'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('srms_access_token');
    if (!token) { window.location.href = '/login'; return; }

    const load = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_TENANT_API_URL || '';
        const res = await fetch(`${apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setTeacherName(data.data.email || 'Teacher');
          setSrmsId(data.data.srmsId || '');
        }
      } catch {}
      setLoading(false);
    };
    load();
  }, []);

  const mockStats = [
    { label: 'Total Students', value: '128', icon: '🎓', color: 'text-blue-400' },
    { label: 'Results Uploaded', value: '6', icon: '📊', color: 'text-emerald-400' },
    { label: 'Open Complaints', value: '3', icon: '⚖️', color: 'text-amber-400' },
    { label: 'Results Published', value: '4', icon: '✅', color: 'text-purple-400' },
  ];

  const mockClasses = [
    { name: 'Form 5 Science', students: 42, resultsStatus: 'published', complaints: 2 },
    { name: 'Form 4 Science', students: 38, resultsStatus: 'draft', complaints: 1 },
    { name: 'Form 3 General', students: 48, resultsStatus: 'not-uploaded', complaints: 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center font-bold text-white">
              👨‍🏫
            </div>
            <div>
              <p className="font-heading font-bold text-white text-sm">Teacher Portal</p>
              <p className="text-blue-400 text-xs">{srmsId}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm hidden md:block">{teacherName}</span>
            <button onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
              className="text-slate-500 hover:text-red-400 text-sm transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockStats.map((stat, i) => (
            <div key={i} className="glass-card p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`font-heading text-3xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-slate-500 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold text-white">My Classes</h2>
          <Link href="/teacher/results/upload"
            className="btn-primary text-sm px-5 py-2.5 rounded-xl">
            + Upload New Results
          </Link>
        </div>

        <div className="space-y-4">
          {mockClasses.map((cls, i) => (
            <div key={i} className="glass-card p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h3 className="font-heading font-bold text-white text-lg">{cls.name}</h3>
                <p className="text-slate-400 text-sm">{cls.students} students enrolled</p>
              </div>
              <div className="flex items-center gap-4">
                <span className={`badge text-xs ${
                  cls.resultsStatus === 'published' ? 'badge-active' :
                  cls.resultsStatus === 'draft' ? 'badge-pending' : 'badge-suspended'
                }`}>
                  {cls.resultsStatus === 'not-uploaded' ? 'Not Uploaded' :
                   cls.resultsStatus === 'draft' ? 'Draft' : 'Published'}
                </span>
                {cls.complaints > 0 && (
                  <span className="badge badge-suspended text-xs">
                    {cls.complaints} complaint{cls.complaints > 1 ? 's' : ''}
                  </span>
                )}
                <div className="flex gap-2">
                  <Link href={`/teacher/results/upload?class=${cls.name}`}
                    className="text-blue-400 hover:text-blue-300 text-xs transition-colors">
                    Upload
                  </Link>
                  <Link href={`/teacher/complaints/inbox`}
                    className="text-amber-400 hover:text-amber-300 text-xs transition-colors">
                    Complaints
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}