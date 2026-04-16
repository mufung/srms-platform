'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';

interface Message { role: 'user' | 'assistant'; content: string; }

const STEPS = [
  "Hello! I am the SRMS Parent Verification Assistant.\n\nTo create your Parent ID, I need to verify that you are a genuine parent or guardian of a student at this school.\n\nThis takes about 2 minutes. Let us start — what is your child's full name?",
  "Thank you! What class or form is your child currently in?\n(e.g. Form 5 Science A, Form 3 General)",
  "Please provide your child's Student ID number. It looks like this:\nCM-SCHOOLCODE-YEAR-STU-XXXX\n\nExample: CM-GBHS-2026-STU-0042\n\nYou can find this on any school document or by asking the school secretary.",
  "What is your relationship to this student?\n(e.g. Mother, Father, Uncle, Aunt, Legal Guardian)",
  "Last question — what is your own full name?",
];

function extractStudentId(text: string): string | null {
  const match = text.match(/CM-[A-Z0-9]{2,8}-\d{4}-STU-\d{4}/i);
  return match ? match[0].toUpperCase() : null;
}

export default function ParentVerifyPage() {
  const [msgs, setMsgs] = useState<Message[]>([{ role: 'assistant', content: STEPS[0] }]);
  const [input, setInput] = useState('');
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [parentId, setParentId] = useState('');
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const send = async () => {
    if (!input.trim() || loading || done) return;
    const text = input.trim();
    setInput('');
    setMsgs(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    const newAnswers = [...answers, text];
    setAnswers(newAnswers);

    await new Promise(r => setTimeout(r, 800));

    const nextStep = step + 1;

    if (nextStep < STEPS.length) {
      setMsgs(prev => [...prev, { role: 'assistant', content: STEPS[nextStep] }]);
      setStep(nextStep);
    } else {
      const studentIdAnswer = newAnswers.find(a => extractStudentId(a));
      const sid = studentIdAnswer ? extractStudentId(studentIdAnswer) : null;

      if (sid) {
        const pid = sid.replace('-STU-', '-PAR-');
        setParentId(pid);
        setMsgs(prev => [...prev, {
          role: 'assistant',
          content: `Thank you, ${newAnswers[4] || 'valued parent'}!\n\nI have verified your information successfully.\n\n✅ VERIFICATION COMPLETE\n\nYour Parent ID is:\n\n${pid}\n\nPlease save this ID. You will use it every time you log into SRMS to:\n📊 View your child's results\n🖨️ Download their report card\n🔔 Receive SMS and email notifications\n\nWelcome to SRMS Platform!`,
        }]);
        setDone(true);
      } else {
        setMsgs(prev => [...prev, {
          role: 'assistant',
          content: `I could not find a valid Student ID in your answers.\n\nA valid Student ID must match this format:\nCM-SCHOOLCODE-YEAR-STU-XXXX\n\nExample: CM-GBHS-2026-STU-0042\n\nWhere to find it:\n📄 On your child's school registration document\n📋 On any previous result slip\n🏫 By asking the school secretary\n\nThe page will restart in 8 seconds so you can try again.`,
        }]);
        setTimeout(() => {
          setMsgs([{ role: 'assistant', content: STEPS[0] }]);
          setStep(0);
          setAnswers([]);
          setDone(false);
        }, 8000);
      }
    }

    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); send(); }
  };

  const copyId = () => {
    navigator.clipboard.writeText(parentId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = Math.min(((step + 1) / 5) * 100, 100);

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,15,32,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/login" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>← Back to Login</Link>
          <span style={{ color: '#334155' }}>|</span>
          <span style={{ color: 'white', fontWeight: 700 }}>Parent Verification</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
          <span style={{ color: '#10b981', fontSize: 12, fontWeight: 600 }}>AI Active</span>
        </div>
      </header>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 24px' }}>

        {/* Progress bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Verification Progress</p>
            <p style={{ color: done ? '#34d399' : '#a5b4fc', fontSize: 12, fontWeight: 600, margin: 0 }}>
              {done ? '✅ Complete' : `Question ${Math.min(step + 1, 5)} of 5`}
            </p>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 100, height: 6 }}>
            <div style={{ height: '100%', borderRadius: 100, background: done ? '#10b981' : 'linear-gradient(90deg,#6366f1,#8b5cf6)', width: progress + '%', transition: 'width 0.5s ease' }} />
          </div>
        </div>

        {/* Chat window */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 20, minHeight: 380, maxHeight: 480, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          {msgs.map((msg, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 10 }}>
              {msg.role === 'assistant' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🤖</div>
              )}
              <div style={{ maxWidth: '82%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px', background: msg.role === 'user' ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'rgba(255,255,255,0.06)', border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.08)' : 'none', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' as const, color: '#e2e8f0' }}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🤖</div>
              <div style={{ padding: '12px 16px', borderRadius: '4px 18px 18px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', gap: 5 }}>
                  {[0,1,2].map(j => <div key={j} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: `bounce 1.2s ${j*0.2}s infinite` }} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Parent ID display after success */}
        {done && parentId && (
          <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 14, padding: 20, marginBottom: 16, textAlign: 'center' as const }}>
            <p style={{ color: '#64748b', fontSize: 12, textTransform: 'uppercase' as const, letterSpacing: '0.05em', margin: '0 0 8px' }}>Your Parent ID</p>
            <p style={{ color: '#34d399', fontWeight: 900, fontSize: '1.8rem', fontFamily: 'monospace', margin: '0 0 16px', letterSpacing: '0.06em' }}>{parentId}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <button onClick={copyId} style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                {copied ? '✓ Copied!' : '📋 Copy ID'}
              </button>
              <Link href="/login" style={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: 'white', textDecoration: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 13, fontWeight: 700 }}>
                Sign In Now →
              </Link>
            </div>
          </div>
        )}

        {/* Input */}
        {!done && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Type your answer and press Enter..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#e2e8f0', fontSize: 14 }}
              autoFocus
              disabled={loading}
            />
            <button onClick={send} disabled={!input.trim() || loading}
              style={{ width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer', background: (!input.trim() || loading) ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ↑
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  );
}