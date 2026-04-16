'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface Notif {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  time: string;
}

const ICONS: Record<string, string> = {
  results_published: '📊',
  complaint_resolved: '✅',
  complaint_rejected: '❌',
  broadcast: '📢',
  urgent_broadcast: '🚨',
  payment: '💳',
  general: '🔔',
};

const DEMO: Notif[] = [
  { id:'n1', type:'results_published', title:'Results Published — Mathematics', message:'Your Mathematics results for First Term 2026 have been published. Grade: B (78%).', read:false, time:'30 min ago' },
  { id:'n2', type:'complaint_resolved', title:'Complaint Resolved — Physics', message:'Your Physics complaint has been resolved. Score corrected from 45 to 72.', read:false, time:'2 hours ago' },
  { id:'n3', type:'broadcast', title:'End of Term Notice', message:'Examinations begin Monday 20th April. Confirm your results before Friday.', read:false, time:'5 hours ago' },
  { id:'n4', type:'results_published', title:'Results Published — English Language', message:'English Language results are now available. Grade: A (85%).', read:true, time:'2 days ago' },
  { id:'n5', type:'broadcast', title:'Welcome to SRMS Platform', message:'You can now view results, raise complaints, and track your academic progress.', read:true, time:'14 days ago' },
];

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>(DEMO);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifs.filter(n => !n.read).length;

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative', background: open ? 'rgba(255,255,255,0.08)' : 'none',
          border: 'none', cursor: 'pointer', padding: '8px 10px', borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8',
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 3, right: 3,
            width: 17, height: 17, borderRadius: '50%',
            background: '#ef4444', color: 'white', fontSize: 9,
            fontWeight: 900, display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: '2px solid #080f20',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: 360, background: '#0f172a',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)', zIndex: 1000, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'white', fontWeight: 800, fontSize: 14, margin: 0 }}>Notifications</p>
              {unread > 0 && <p style={{ color: '#f59e0b', fontSize: 11, margin: '2px 0 0', fontWeight: 600 }}>{unread} unread</p>}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  Mark all read
                </button>
              )}
              <Link href="/student/notifications" onClick={() => setOpen(false)} style={{ color: '#475569', textDecoration: 'none', fontSize: 12 }}>
                All →
              </Link>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 380, overflowY: 'auto' }}>
            {notifs.slice(0, 5).map((n, i) => (
              <div
                key={i}
                onClick={() => markRead(n.id)}
                style={{
                  padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                  display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer',
                  background: n.read ? 'transparent' : 'rgba(59,130,246,0.05)',
                }}
              >
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
                  {ICONS[n.type] || '🔔'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                    <p style={{ color: n.read ? '#94a3b8' : 'white', fontWeight: n.read ? 400 : 700, fontSize: 12, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 210 }}>
                      {n.title}
                    </p>
                    {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />}
                  </div>
                  <p style={{ color: '#64748b', fontSize: 11, margin: 0, lineHeight: 1.4, display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {n.message}
                  </p>
                  <p style={{ color: '#334155', fontSize: 10, margin: '4px 0 0' }}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 10 }}>
            <Link href="/student/notifications" onClick={() => setOpen(false)}
              style={{ flex: 1, textAlign: 'center', padding: '9px', background: 'rgba(59,130,246,0.15)', color: '#60a5fa', textDecoration: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
              View All Notifications →
            </Link>
            <Link href="/student/notifications/preferences" onClick={() => setOpen(false)}
              style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.05)', color: '#64748b', textDecoration: 'none', borderRadius: 8, fontSize: 12 }}>
              ⚙️
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}