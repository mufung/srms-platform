'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SentBroadcast {
  id: string;
  title: string;
  message: string;
  targetRoles: string[];
  channels: string[];
  recipientCount: number;
  sentAt: string;
  urgent: boolean;
}

const DEMO_HISTORY: SentBroadcast[] = [
  {
    id: 'BC-001', title: 'End of Term Notice',
    message: 'End of term examinations begin Monday 20th April 2026. All students must confirm results before Friday 18th April.',
    targetRoles: ['student','parent'], channels: ['email','inapp'],
    recipientCount: 163, sentAt: '5 hours ago', urgent: false,
  },
  {
    id: 'BC-002', title: 'URGENT: System Maintenance Tonight',
    message: 'SRMS will be unavailable from 2am to 6am on 13th April. Please complete pending actions before midnight.',
    targetRoles: ['student','teacher','parent'], channels: ['sms','email','inapp'],
    recipientCount: 185, sentAt: '2 days ago', urgent: true,
  },
  {
    id: 'BC-003', title: 'Welcome to First Term 2026',
    message: 'Welcome to the new academic term. Teachers will upload results from 15th February. Students will be notified when results are available.',
    targetRoles: ['student','parent'], channels: ['email','inapp'],
    recipientCount: 163, sentAt: '30 days ago', urgent: false,
  },
];

const ROLE_COUNTS: Record<string, number> = { student: 128, teacher: 22, parent: 35 };

function CheckBox({ checked, onClick, label, desc }: { checked: boolean; onClick: () => void; label: string; desc: string }) {
  return (
    <button onClick={onClick}
      style={{ padding: '12px 16px', borderRadius: 10, border: '1px solid ' + (checked ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)'), background: checked ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, border: '2px solid ' + (checked ? '#3b82f6' : 'rgba(255,255,255,0.2)'), background: checked ? '#3b82f6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {checked && <span style={{ color: 'white', fontSize: 11, fontWeight: 900 }}>✓</span>}
        </div>
        <div>
          <p style={{ color: checked ? 'white' : '#94a3b8', fontWeight: 600, fontSize: 13, margin: 0 }}>{label}</p>
          <p style={{ color: '#475569', fontSize: 11, margin: '2px 0 0' }}>{desc}</p>
        </div>
      </div>
    </button>
  );
}

export default function BroadcastPage() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [targetRoles, setTargetRoles] = useState<string[]>(['student', 'teacher', 'parent']);
  const [channels, setChannels] = useState<string[]>(['email', 'inapp']);
  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState<SentBroadcast | null>(null);
  const [history, setHistory] = useState<SentBroadcast[]>(DEMO_HISTORY);
  const [err, setErr] = useState('');

  const toggleRole = (role: string) => setTargetRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  const toggleChannel = (ch: string) => setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]);

  const totalRecipients = targetRoles.reduce((sum, r) => sum + (ROLE_COUNTS[r] || 0), 0);

  const handleSend = async () => {
    setErr('');
    if (!title.trim()) { setErr('Enter a broadcast title'); return; }
    if (!message.trim() || message.trim().length < 10) { setErr('Enter a message with at least 10 characters'); return; }
    if (targetRoles.length === 0) { setErr('Select at least one group to send to'); return; }
    if (channels.length === 0) { setErr('Select at least one delivery channel'); return; }

    setSending(true);
    await new Promise(r => setTimeout(r, 1600));

    const newBroadcast: SentBroadcast = {
      id: 'BC-' + Date.now().toString(36).toUpperCase().slice(-5),
      title, message, targetRoles, channels,
      recipientCount: totalRecipients,
      sentAt: 'Just now',
      urgent,
    };
    setHistory(prev => [newBroadcast, ...prev]);
    setSentResult(newBroadcast);
    setSending(false);
  };

  const reset = () => {
    setTitle(''); setMessage(''); setUrgent(false);
    setTargetRoles(['student','teacher','parent']);
    setChannels(['email','inapp']);
    setSentResult(null); setErr('');
  };

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', fontSize: 14,
    width: '100%', outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,15,32,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/school-admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>← Dashboard</Link>
          <span style={{ color: '#334155' }}>|</span>
          <span style={{ color: 'white', fontWeight: 700 }}>Send Announcement</span>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 28, alignItems: 'start' }}>

          {/* Compose or success */}
          {sentResult ? (
            <div style={{ background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 20, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
              <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.4rem', marginBottom: 8 }}>Broadcast Sent!</h2>
              <p style={{ color: '#64748b', fontSize: 14, marginBottom: 28 }}>
                Your message was sent to {sentResult.recipientCount} recipients via {sentResult.channels.join(' + ')}.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
                {[
                  ['Broadcast ID', sentResult.id],
                  ['Title', sentResult.title],
                  ['Total Recipients', String(sentResult.recipientCount)],
                  ['Delivery Channels', sentResult.channels.join(', ')],
                  ['Target Groups', sentResult.targetRoles.join(', ')],
                  ['Status', 'Delivered'],
                ].map(([label, value], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
                    <span style={{ color: label === 'Broadcast ID' ? '#60a5fa' : label === 'Status' ? '#34d399' : 'white', fontSize: 12, fontFamily: label === 'Broadcast ID' ? 'monospace' : 'inherit', fontWeight: label === 'Status' ? 700 : 400 }}>{value}</span>
                  </div>
                ))}
              </div>
              <button onClick={reset} style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: 'white', border: 'none', borderRadius: 10, padding: '12px 32px', cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                Send Another Broadcast →
              </button>
            </div>
          ) : (
            <div>
              <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', marginBottom: 24 }}>📢 Compose Announcement</h2>

              {err && (
                <div style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 14 }}>
                  ⚠️ {err}
                </div>
              )}

              {/* Urgent toggle */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: urgent ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.02)', border: '1px solid ' + (urgent ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.07)'), borderRadius: 12, marginBottom: 20 }}>
                <div>
                  <p style={{ color: urgent ? '#f87171' : 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>🚨 Mark as Urgent</p>
                  <p style={{ color: '#475569', fontSize: 12, margin: '2px 0 0' }}>Urgent messages force SMS delivery to all recipients</p>
                </div>
                <button onClick={() => setUrgent(!urgent)}
                  style={{ width: 44, height: 24, borderRadius: 100, background: urgent ? '#ef4444' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: urgent ? 23 : 3, transition: 'left 0.2s' }} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Title *</label>
                  <input style={inp} placeholder="e.g. End of Term Notice" value={title} onChange={e => setTitle(e.target.value)} onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                    Message * <span style={{ color: '#334155', textTransform: 'none' as const, fontWeight: 400 }}>({message.length} characters)</span>
                  </label>
                  <textarea style={{ ...inp, minHeight: 130, resize: 'vertical', lineHeight: 1.6 }} placeholder="Write your announcement clearly and concisely..." value={message} onChange={e => setMessage(e.target.value)} onFocus={e => e.target.style.borderColor = 'rgba(59,130,246,0.6)'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>

                <div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Send To *</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                    <CheckBox checked={targetRoles.includes('student')} onClick={() => toggleRole('student')} label={'🎓 Students (128)'} desc="All enrolled students" />
                    <CheckBox checked={targetRoles.includes('teacher')} onClick={() => toggleRole('teacher')} label={'👨‍🏫 Teachers (22)'} desc="All teaching staff" />
                    <CheckBox checked={targetRoles.includes('parent')} onClick={() => toggleRole('parent')} label={'👨‍👩‍👧 Parents (35)'} desc="All registered parents" />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Deliver Via *</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' as const }}>
                    <CheckBox checked={channels.includes('sms')} onClick={() => toggleChannel('sms')} label="📱 SMS" desc="Text message to phone" />
                    <CheckBox checked={channels.includes('email')} onClick={() => toggleChannel('email')} label="✉️ Email" desc="To email inbox" />
                    <CheckBox checked={channels.includes('inapp')} onClick={() => toggleChannel('inapp')} label="🔔 In-App" desc="Notification bell" />
                  </div>
                </div>

                {/* Preview row */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' as const, fontSize: 13 }}>
                    <span style={{ color: '#94a3b8' }}>Recipients: <strong style={{ color: 'white' }}>{totalRecipients}</strong></span>
                    <span style={{ color: '#94a3b8' }}>Via: <strong style={{ color: 'white' }}>{channels.length > 0 ? channels.join(' + ') : 'none selected'}</strong></span>
                    {urgent && <span style={{ color: '#f87171', fontWeight: 700 }}>🚨 URGENT</span>}
                  </div>
                </div>

                <button onClick={handleSend} disabled={sending}
                  style={{ background: sending ? '#334155' : urgent ? 'linear-gradient(135deg,#dc2626,#ef4444)' : 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: 'white', border: 'none', borderRadius: 10, padding: 16, cursor: sending ? 'not-allowed' : 'pointer', fontWeight: 800, fontSize: 15 }}>
                  {sending ? 'Sending...' : urgent ? '🚨 Send Urgent Broadcast' : `📢 Send to ${totalRecipients} Recipients →`}
                </button>
              </div>
            </div>
          )}

          {/* Broadcast history */}
          <div>
            <h2 style={{ color: 'white', fontWeight: 800, fontSize: '1rem', marginBottom: 16 }}>📋 Broadcast History</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {history.map((bc, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid ' + (bc.urgent ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'), borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0, flex: 1 }}>
                      {bc.urgent && '🚨 '}{bc.title}
                    </p>
                    <span style={{ color: '#334155', fontSize: 11, flexShrink: 0, marginLeft: 8 }}>{bc.sentAt}</span>
                  </div>
                  <p style={{ color: '#64748b', fontSize: 12, margin: '0 0 10px', lineHeight: 1.5, display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {bc.message}
                  </p>
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, flexWrap: 'wrap' as const }}>
                    <span style={{ color: '#60a5fa' }}>👥 {bc.recipientCount} recipients</span>
                    <span style={{ color: '#475569' }}>via {bc.channels.join(', ')}</span>
                    <span style={{ color: '#334155', fontFamily: 'monospace' }}>{bc.id}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}