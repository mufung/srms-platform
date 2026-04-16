'use client';

import { useState } from 'react';
import Link from 'next/link';

interface Notif {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
  channels: string[];
}

const ICONS: Record<string, string> = {
  results_published: '📊',
  complaint_resolved: '✅',
  complaint_rejected: '❌',
  broadcast: '📢',
  urgent_broadcast: '🚨',
  general: '🔔',
};

const COLORS: Record<string, string> = {
  results_published: '#3b82f6',
  complaint_resolved: '#10b981',
  complaint_rejected: '#ef4444',
  broadcast: '#8b5cf6',
  urgent_broadcast: '#ef4444',
  general: '#64748b',
};

const DEMO: Notif[] = [
  { id:'n1', type:'results_published', title:'Results Published — Mathematics', message:'Your Mathematics results for First Term 2026 have been published by Mr. Fon Emmanuel. Your grade is B (78%). You ranked 5th in your class of 42 students.', read:false, time:'30 min ago', channels:['sms','email','inapp'] },
  { id:'n2', type:'complaint_resolved', title:'Complaint Resolved — Physics', message:'Your Physics complaint (CMP-SRMS-ABC123-XY12) has been reviewed and resolved. Your score was corrected from 45 to 72. Your grade is now C. Teacher note: After reviewing your exam paper, I confirmed the marking error. Thank you.', read:false, time:'2 hours ago', channels:['sms','email','inapp'] },
  { id:'n3', type:'broadcast', title:'End of Term Announcement', message:'End of term examinations begin Monday 20th April 2026. All students must confirm their results before Friday 18th April. Contact your class teacher if you have any concerns about your grades.', read:false, time:'5 hours ago', channels:['email','inapp'] },
  { id:'n4', type:'results_published', title:'Results Published — English Language', message:'English Language results for First Term 2026 are now available. Your grade is A (85%). You ranked 2nd in your class. Excellent work!', read:true, time:'2 days ago', channels:['sms','email','inapp'] },
  { id:'n5', type:'results_published', title:'Results Published — Biology', message:'Biology results for First Term 2026 have been published. Your grade is B (71%). Class position: 8th of 42 students.', read:true, time:'3 days ago', channels:['sms','inapp'] },
  { id:'n6', type:'complaint_resolved', title:'Complaint Submitted — Geography', message:'Your Geography complaint (CMP-SRMS-DEF456-MN34) has been received and sent to the teacher for review. Expected response: 2-5 business days. You will be notified when there is an update.', read:true, time:'4 days ago', channels:['inapp'] },
  { id:'n7', type:'results_published', title:'Results Published — Computer Science', message:'Computer Science results for First Term 2026 are available. Outstanding performance! Your grade is A (92%). You ranked 1st in your class. Keep it up.', read:true, time:'5 days ago', channels:['sms','email','inapp'] },
  { id:'n8', type:'broadcast', title:'Welcome to SRMS Platform', message:'Welcome to the SRMS Student Result Management System. You can now view your results, raise complaints, and track your academic progress all in one place. Contact your school admin if you need help.', read:true, time:'14 days ago', channels:['email','inapp'] },
];

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<Notif[]>(DEMO);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<Notif | null>(null);

  const filtered = filter === 'all' ? notifs
    : filter === 'unread' ? notifs.filter(n => !n.read)
    : notifs.filter(n => n.type === filter);

  const unread = notifs.filter(n => !n.read).length;

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  const CHANNEL_LABELS: Record<string, string> = {
    sms: '📱 SMS',
    email: '✉️ Email',
    inapp: '🔔 In-App',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,15,32,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/student/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>← Dashboard</Link>
          <span style={{ color: '#334155' }}>|</span>
          <span style={{ color: 'white', fontWeight: 700 }}>Notifications</span>
          {unread > 0 && (
            <span style={{ background: '#ef4444', color: 'white', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100 }}>
              {unread} new
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              ✓ Mark All Read
            </button>
          )}
          <Link href="/student/notifications/preferences" style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 14px', textDecoration: 'none', fontSize: 13 }}>
            ⚙️ Preferences
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label:'Total', value: notifs.length, color:'#3b82f6', icon:'🔔' },
            { label:'Unread', value: unread, color:'#f59e0b', icon:'📬' },
            { label:'Results', value: notifs.filter(n=>n.type==='results_published').length, color:'#10b981', icon:'📊' },
            { label:'Complaints', value: notifs.filter(n=>n.type.includes('complaint')).length, color:'#8b5cf6', icon:'⚖️' },
            { label:'Broadcasts', value: notifs.filter(n=>n.type==='broadcast').length, color:'#64748b', icon:'📢' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: 6 }}>{c.icon}</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: c.color }}>{c.value}</div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 4 }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, flexWrap: 'wrap', marginBottom: 24 }}>
          {[
            { val:'all', label:'🔔 All' },
            { val:'unread', label:'📬 Unread' },
            { val:'results_published', label:'📊 Results' },
            { val:'broadcast', label:'📢 Broadcasts' },
            { val:'complaint_resolved', label:'⚖️ Complaints' },
          ].map(({ val, label }) => (
            <button key={val} onClick={() => setFilter(val)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, background: filter === val ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'transparent', color: filter === val ? 'white' : '#64748b' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 20 }}>
          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.length === 0 && (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 48, textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 12 }}>📭</div>
                <p style={{ color: '#64748b', fontSize: 14 }}>No notifications here.</p>
              </div>
            )}
            {filtered.map((n, i) => {
              const col = COLORS[n.type] || '#64748b';
              const icon = ICONS[n.type] || '🔔';
              const isSelected = selected?.id === n.id;
              return (
                <div
                  key={i}
                  onClick={() => { setSelected(isSelected ? null : n); markRead(n.id); }}
                  style={{
                    background: isSelected ? 'rgba(59,130,246,0.08)' : n.read ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid ' + (isSelected ? 'rgba(59,130,246,0.4)' : n.read ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.1)'),
                    borderRadius: 14, padding: '16px 20px', cursor: 'pointer',
                    display: 'flex', alignItems: 'flex-start', gap: 14, transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: col + '15', border: '1px solid ' + col + '30', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>
                    {icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <p style={{ color: n.read ? '#94a3b8' : 'white', fontWeight: n.read ? 500 : 700, fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '85%' }}>
                        {n.title}
                      </p>
                      {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />}
                    </div>
                    <p style={{ color: '#64748b', fontSize: 13, margin: 0, lineHeight: 1.5, display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {n.message}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
                      <span style={{ color: '#334155', fontSize: 11 }}>{n.time}</span>
                      {n.channels.map(ch => (
                        <span key={ch} style={{ color: '#334155', fontSize: 10, background: 'rgba(255,255,255,0.04)', padding: '2px 7px', borderRadius: 4 }}>
                          {CHANNEL_LABELS[ch] || ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24, position: 'sticky', top: 80, maxHeight: 'calc(100vh - 120px)', overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Notification Detail</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#64748b', cursor: 'pointer', borderRadius: 6, padding: '4px 10px', fontSize: 12 }}>✕</button>
              </div>

              <div style={{ width: 56, height: 56, borderRadius: '50%', background: (COLORS[selected.type] || '#64748b') + '18', border: '2px solid ' + (COLORS[selected.type] || '#64748b') + '40', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 16 }}>
                {ICONS[selected.type] || '🔔'}
              </div>

              <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem', marginBottom: 12, lineHeight: 1.4 }}>{selected.title}</h2>
              <p style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>{selected.message}</p>

              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                {[
                  ['Received', selected.time],
                  ['Type', selected.type.replace(/_/g, ' ')],
                  ['Status', selected.read ? 'Read' : 'Unread'],
                  ['Delivered via', selected.channels.map(c => c.toUpperCase()).join(', ')],
                ].map(([label, value], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
                    <span style={{ color: label === 'Status' ? (selected.read ? '#64748b' : '#34d399') : 'white', fontSize: 12, fontWeight: 500 }}>{value}</span>
                  </div>
                ))}
              </div>

              {selected.type === 'results_published' && (
                <Link href="/student/results" style={{ display: 'block', textAlign: 'center', marginBottom: 10, background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: 'white', textDecoration: 'none', borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 13 }}>
                  📊 View My Results →
                </Link>
              )}
              {selected.type.includes('complaint') && (
                <Link href="/student/complaints/track" style={{ display: 'block', textAlign: 'center', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', textDecoration: 'none', borderRadius: 10, padding: 12, fontWeight: 700, fontSize: 13 }}>
                  ⚖️ Track My Complaints →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}