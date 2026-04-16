'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  time: string;
  fromBedrock?: boolean;
}

const SUGGESTIONS = [
  'What is SRMS and how does it work?',
  'What does my grade B mean?',
  'How do I raise a complaint about a wrong score?',
  'How do I download my report card as PDF?',
  'What is a class position?',
  'How do I get a Parent ID for my guardian?',
  'How do I track my complaint status?',
  'What payment methods does SRMS accept?',
];

function getLocalDemo(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('hello') || m.includes('hi') || m.includes('help')) return 'Hello! I am the SRMS AI Assistant. I can help you with:\n\n📊 Your grades and what they mean\n⚖️ Raising a complaint about wrong scores\n🖨️ Downloading your report card\n📋 Tracking complaint status\n🔔 Notification preferences\n\nWhat would you like to know?';
  if (m.includes('srms') || m.includes('system') || m.includes('platform')) return 'SRMS (Student Result Management System) is a secure AWS-powered academic platform.\n\n📊 Results — Teachers upload scores, SRMS auto-calculates grades and report cards\n⚖️ Complaints — Dispute wrong scores with exam paper proof\n📋 Tracking — Monitor complaints in real-time\n🔔 Notifications — SMS and email alerts\n\nBuilt by MUFUNG ANGELBELL MBUYEH, AWS Solutions Architect, Yaoundé, Cameroon.';
  if (m.includes('grade') || m.includes('score') || m.includes('fail') || m.includes('pass')) return 'SRMS Grading Scale:\n\nA (80-100%) = Excellent 🟢\nB (70-79%) = Very Good 🔵\nC (60-69%) = Good 🟣\nD (50-59%) = Pass 🟡\nF (0-49%) = Fail 🔴\n\nGrades are color-coded in your results table for easy reading.';
  if (m.includes('complaint') || m.includes('wrong') || m.includes('dispute')) return 'To raise a complaint:\n\n1. Go to /student/results\n2. Click ⚖️ Dispute on the subject with wrong score\n3. Select the reason\n4. Upload photo of your exam paper (required)\n5. Write a description\n6. Submit\n\nTrack at /student/complaints/track. Teacher responds in 2-5 business days.';
  if (m.includes('report') || m.includes('print') || m.includes('pdf')) return 'Report Card steps:\n\n1. Go to /student/results\n2. Scroll to bottom — white report card appears\n3. Click "🖨️ Print Report Card / Save as PDF"\n4. In print dialog: change Destination to "Save as PDF"\n5. Click Save\n\nThe PDF is your official academic document.';
  if (m.includes('parent') || m.includes('parent id')) return 'Parent IDs link to Student IDs:\nCM-GBHS-2026-STU-0042 → CM-GBHS-2026-PAR-0042\n(Replace STU with PAR)\n\nTo get a Parent ID: Go to /parent/verify — the AI asks 5 verification questions.';
  if (m.includes('position') || m.includes('rank')) return 'Class positions:\n\n1. All students are ranked by total percentage\n2. Position 1 = highest overall average in your class\n3. Each subject also shows your position in that subject\n\nSee your position on your Results page and Report Card.';
  if (m.includes('notification') || m.includes('sms') || m.includes('email')) return 'SRMS notifications:\n\n📱 SMS — Text to your phone\n✉️ Email — To your inbox\n🔔 In-App — Bell icon in SRMS\n\nControl settings at /student/notifications/preferences\nIn-App cannot be disabled.';
  return 'I am the SRMS AI Assistant. Ask me about:\n- Your grades and results\n- How to raise a complaint\n- Downloading your report card\n- Tracking complaints\n- Parent IDs\n- Notifications\n\nWhat would you like to know?';
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export default function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your SRMS AI Assistant, powered by Amazon Bedrock.\n\nI can help you understand your grades, navigate the complaint process, download your report card, and answer any questions about SRMS.\n\nWhat would you like to know?',
      time: new Date().toISOString(),
      fromBedrock: false,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'ready' | 'bedrock' | 'demo'>('ready');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (content: string) => {
    if (!content.trim() || loading) return;

    const userMsg: Message = {
      role: 'user',
      content: content.trim(),
      time: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const allMessages = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const api = process.env.NEXT_PUBLIC_TENANT_API_URL || '';
      const token = localStorage.getItem('srms_access_token') || '';

      const res = await fetch(`${api}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: allMessages,
          studentId: localStorage.getItem('srms_user_id') || 'CM-GBHS-2026-STU-0042',
          studentName: localStorage.getItem('srms_user_name') || 'Student',
        }),
      });

      if (!res.ok) throw new Error('API ' + res.status);
      const data = await res.json();

      if (data.success && data.data?.reply) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.data.reply,
          time: new Date().toISOString(),
          fromBedrock: true,
        }]);
        setStatus('bedrock');
      } else {
        throw new Error('No reply');
      }
    } catch {
      setStatus('demo');
      await new Promise(r => setTimeout(r, 600));
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: getLocalDemo(content),
        time: new Date().toISOString(),
        fromBedrock: false,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0', display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,15,32,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/student/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>← Dashboard</Link>
          <span style={{ color: '#334155' }}>|</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
            <div>
              <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>SRMS AI Assistant</p>
              <p style={{ color: '#6366f1', fontSize: 11, margin: 0 }}>Amazon Bedrock · Claude Haiku 4.5</p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {status === 'bedrock' && <span style={{ fontSize: 11, color: '#34d399', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', padding: '3px 10px', borderRadius: 100 }}>⚡ Bedrock Active</span>}
          {status === 'demo' && <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', padding: '3px 10px', borderRadius: 100 }}>💡 Smart Mode</span>}
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>Online</span>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', maxWidth: 1000, width: '100%', margin: '0 auto', padding: '24px', gap: 24 }}>

        {/* Sidebar */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 14 }}>
            <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 10 }}>Suggested Questions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SUGGESTIONS.map((s, i) => (
                <button key={i} onClick={() => send(s)}
                  style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, padding: '8px 10px', cursor: 'pointer', textAlign: 'left' as const, color: '#a5b4fc', fontSize: 11, lineHeight: 1.4 }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 12 }}>
            <p style={{ color: '#475569', fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 }}>Quick Links</p>
            {[
              { label: '📊 My Results', href: '/student/results' },
              { label: '⚖️ Raise Complaint', href: '/student/complaints/new' },
              { label: '📋 Track Complaints', href: '/student/complaints/track' },
              { label: '🔔 Notifications', href: '/student/notifications' },
              { label: '👨‍👩‍👧 Parent Verify', href: '/parent/verify' },
            ].map((link, i) => (
              <Link key={i} href={link.href} style={{ display: 'block', color: '#64748b', textDecoration: 'none', fontSize: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, overflowY: 'auto', maxHeight: 'calc(100vh - 230px)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 10 }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
                )}
                <div style={{ maxWidth: '78%' }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    background: msg.role === 'user' ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'rgba(255,255,255,0.06)',
                    border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    color: '#e2e8f0', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' as const,
                  }}>
                    {msg.content}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <p style={{ color: '#334155', fontSize: 10, margin: 0 }}>{formatTime(msg.time)}</p>
                    {msg.role === 'assistant' && msg.fromBedrock && (
                      <span style={{ color: '#34d399', fontSize: 9, fontWeight: 700 }}>⚡ Bedrock</span>
                    )}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🎓</div>
                )}
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
                <div style={{ padding: '14px 18px', borderRadius: '4px 18px 18px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: 6 }}>
                  {[0,1,2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1', animation: `bounce 1.2s ${j*0.2}s infinite` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'flex-end', gap: 12 }}>
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask me anything about your results, grades, complaints... (Enter to send)"
              rows={2}
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, resize: 'none', fontFamily: 'inherit' }}
            />
            <button onClick={() => send(input)} disabled={!input.trim() || loading}
              style={{ width: 42, height: 42, borderRadius: '50%', border: 'none', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer', background: (!input.trim() || loading) ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              ↑
            </button>
          </div>
          <p style={{ color: '#334155', fontSize: 11, marginTop: 8, textAlign: 'center' as const }}>
            AI responses are for guidance only. For official decisions, consult your teacher or school admin.
          </p>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}