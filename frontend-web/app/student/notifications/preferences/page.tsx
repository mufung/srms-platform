'use client';

import { useState } from 'react';
import Link from 'next/link';

interface PrefRow {
  key: string;
  label: string;
  description: string;
  icon: string;
  sms: boolean;
  email: boolean;
  inapp: boolean;
}

const DEFAULT: PrefRow[] = [
  { key:'results_published', label:'Results Published', description:'When a teacher publishes your results for any subject', icon:'📊', sms:true, email:true, inapp:true },
  { key:'complaint_submitted', label:'Complaint Submitted', description:'Confirmation when you submit a new complaint', icon:'⚖️', sms:false, email:true, inapp:true },
  { key:'complaint_resolved', label:'Complaint Resolved', description:'When a teacher resolves or responds to your complaint', icon:'✅', sms:true, email:true, inapp:true },
  { key:'complaint_rejected', label:'Complaint Rejected', description:'When a teacher rejects your complaint with a reason', icon:'❌', sms:false, email:true, inapp:true },
  { key:'broadcast', label:'School Announcements', description:'General announcements from school administration', icon:'📢', sms:false, email:true, inapp:true },
  { key:'urgent', label:'Urgent Announcements', description:'Urgent messages — exam notices, school closures, emergencies', icon:'🚨', sms:true, email:true, inapp:true },
  { key:'system', label:'System Updates', description:'SRMS Platform updates and maintenance notices', icon:'ℹ️', sms:false, email:false, inapp:true },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 42, height: 23, borderRadius: 100,
        background: on ? '#3b82f6' : 'rgba(255,255,255,0.08)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.25s', flexShrink: 0,
      }}
    >
      <div style={{
        width: 17, height: 17, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3, left: on ? 22 : 3,
        transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
      }} />
    </button>
  );
}

export default function NotificationPreferences() {
  const [prefs, setPrefs] = useState<PrefRow[]>(DEFAULT);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: string, channel: 'sms' | 'email' | 'inapp') => {
    if (channel === 'inapp') return; // In-app cannot be disabled
    setPrefs(prev => prev.map(p => p.key === key ? { ...p, [channel]: !p[channel] } : p));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise(r => setTimeout(r, 900));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const btnStyle: React.CSSProperties = {
    background: saving ? '#334155' : saved
      ? 'linear-gradient(135deg,#059669,#10b981)'
      : 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
    color: 'white', border: 'none', borderRadius: 8,
    padding: '10px 22px', cursor: saving ? 'not-allowed' : 'pointer',
    fontWeight: 700, fontSize: 13,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,15,32,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/student/notifications" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>← Notifications</Link>
          <span style={{ color: '#334155' }}>|</span>
          <span style={{ color: 'white', fontWeight: 700 }}>Notification Preferences</span>
        </div>
        <button onClick={handleSave} disabled={saving} style={btnStyle}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Preferences'}
        </button>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
          Control exactly how you receive notifications. SMS requires your phone number to be on file with your school. In-app notifications cannot be disabled — they keep you informed when you are logged in.
        </p>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 24, padding: '14px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, marginBottom: 24 }}>
          {[{ icon:'📱', label:'SMS', desc:'Text to your phone' }, { icon:'✉️', label:'Email', desc:'To your email inbox' }, { icon:'🔔', label:'In-App', desc:'Bell in SRMS (always on)' }].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
              <div>
                <p style={{ color: 'white', fontWeight: 600, fontSize: 12, margin: 0 }}>{item.label}</p>
                <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 70px 80px', gap: 8, padding: '0 20px 10px', alignItems: 'center' }}>
          <div />
          {['📱 SMS', '✉️ Email', '🔔 In-App'].map((h, i) => (
            <div key={i} style={{ textAlign: 'center', color: '#475569', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.04em' }}>{h}</div>
          ))}
        </div>

        {/* Preference rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {prefs.map((pref, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 70px 70px 80px', gap: 8, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: '1.4rem' }}>{pref.icon}</span>
                <div>
                  <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>{pref.label}</p>
                  <p style={{ color: '#64748b', fontSize: 12, margin: '3px 0 0' }}>{pref.description}</p>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Toggle on={pref.sms} onClick={() => toggle(pref.key, 'sms')} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <Toggle on={pref.email} onClick={() => toggle(pref.key, 'email')} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', opacity: 0.4 }}>
                <Toggle on={true} onClick={() => {}} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: '14px 18px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 12 }}>
          <p style={{ color: '#60a5fa', fontSize: 13, margin: 0, lineHeight: 1.6 }}>
            ℹ️ In-App notifications are always on and cannot be turned off. This ensures you always receive critical information when you are logged into SRMS.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <Link href="/student/notifications" style={{ flex: 1, textAlign: 'center', padding: 13, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            ← Back
          </Link>
          <button onClick={handleSave} disabled={saving} style={{ ...btnStyle, flex: 2, padding: 13, borderRadius: 10, fontSize: 14 }}>
            {saving ? 'Saving...' : saved ? '✓ Preferences Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
}