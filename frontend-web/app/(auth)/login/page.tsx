'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

type LoginRole = 'student' | 'teacher' | 'parent' | 'admin';
type LoginStep = 'role-select' | 'credentials' | 'mfa' | 'parent-ai';

const ROLE_CONFIG = {
  student: {
    label: 'Student',
    icon: '🎓',
    accentColor: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    glowColor: 'rgba(16, 185, 129, 0.15)',
    idPlaceholder: 'Student SRMS ID  e.g. CM-GBHS-2026-STU-0042',
    hasMFA: false,
    description: 'View your results and raise complaints',
  },
  teacher: {
    label: 'Teacher',
    icon: '👨‍🏫',
    accentColor: '#3b82f6',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    glowColor: 'rgba(59, 130, 246, 0.15)',
    idPlaceholder: 'Teacher SRMS ID  e.g. CM-GBHS-2026-TCH-0007',
    hasMFA: true,
    description: 'Upload results and manage your class',
  },
  parent: {
    label: 'Parent / Guardian',
    icon: '👨‍👩‍👧',
    accentColor: '#f59e0b',
    borderColor: 'rgba(245, 158, 11, 0.4)',
    glowColor: 'rgba(245, 158, 11, 0.15)',
    idPlaceholder: 'Parent SRMS ID or your child\'s Student ID',
    hasMFA: false,
    description: "View your child's results and send feedback",
  },
  admin: {
    label: 'School Admin',
    icon: '🏫',
    accentColor: '#8b5cf6',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    glowColor: 'rgba(139, 92, 246, 0.15)',
    idPlaceholder: 'Admin SRMS ID',
    hasMFA: true,
    description: 'Manage your school, users, and billing',
  },
};

const AI_QUESTIONS = [
  "Hello! I am the SRMS verification assistant. To create your Parent account, I need to verify you are the guardian of a student here. What is your child's full name?",
  "Thank you. What class or form is your child currently in?",
  "Please provide your child's Student ID number. It looks like this: CM-SCHOOLCODE-YEAR-STU-XXXX",
  "What is your relationship to this student? (Mother, Father, Guardian, etc.)",
  "Last question: What is your own full name as the parent or guardian?",
];

export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>('role-select');
  const [selectedRole, setSelectedRole] = useState<LoginRole | null>(null);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [mfaSession, setMfaSession] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ from: 'ai' | 'user'; text: string }[]>([]);
  const [aiInput, setAiInput] = useState('');
  const [aiStep, setAiStep] = useState(0);
  const [aiAnswers, setAiAnswers] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('srms_saved_ids') || '[]');
      setSavedIds(saved);
    } catch {}
  }, []);

  const suggestions = identifier.length > 2
    ? savedIds.filter(id => id.toLowerCase().includes(identifier.toLowerCase()))
    : [];

  const saveId = (id: string) => {
    try {
      const existing = JSON.parse(localStorage.getItem('srms_saved_ids') || '[]');
      const updated = [id, ...existing.filter((s: string) => s !== id)].slice(0, 5);
      localStorage.setItem('srms_saved_ids', JSON.stringify(updated));
    } catch {}
  };

  const handleRoleSelect = (role: LoginRole) => {
    setSelectedRole(role);
    setErrorMsg('');
    if (role === 'parent') {
      setStep('parent-ai');
      setAiMessages([{ from: 'ai', text: AI_QUESTIONS[0] }]);
      setAiStep(0);
      setAiAnswers([]);
    } else {
      setStep('credentials');
    }
  };

  const handleLogin = async () => {
    setErrorMsg('');
    if (!identifier.trim()) { setErrorMsg('Please enter your ID or email'); return; }
    if (!password.trim()) { setErrorMsg('Please enter your password'); return; }
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_TENANT_API_URL || '';
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), password }),
      });
      const data = await res.json();
      if (!data.success) {
        setErrorMsg(data.error?.message || 'Login failed. Please check your credentials.');
        return;
      }
      if (data.data?.requiresMFA) {
        setMfaSession(data.data.session);
        setStep('mfa');
        return;
      }
      saveId(identifier.trim());
      localStorage.setItem('srms_access_token', data.data.accessToken);
      localStorage.setItem('srms_role', selectedRole || '');
      const dashboards: Record<string, string> = {
        student: '/student/dashboard',
        teacher: '/teacher/dashboard',
        parent: '/parent/dashboard',
        admin: '/school-admin/dashboard',
      };
      window.location.href = dashboards[selectedRole || 'student'];
    } catch {
      setErrorMsg('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleMFA = async () => {
    if (mfaCode.length !== 6) { setErrorMsg('Enter the 6-digit code from your authenticator app'); return; }
    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_TENANT_API_URL || '';
      const res = await fetch(`${apiBase}/auth/verify-mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: mfaSession, mfaCode, identifier }),
      });
      const data = await res.json();
      if (!data.success) { setErrorMsg(data.error?.message || 'Invalid code'); return; }
      localStorage.setItem('srms_access_token', data.data.accessToken);
      window.location.href = selectedRole === 'teacher' ? '/teacher/dashboard' : '/school-admin/dashboard';
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAiMessage = () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput.trim();
    const newAnswers = [...aiAnswers, userMsg];
    setAiAnswers(newAnswers);
    setAiMessages(prev => [...prev, { from: 'user', text: userMsg }]);
    setAiInput('');
    const nextStep = aiStep + 1;
    if (nextStep < AI_QUESTIONS.length) {
      setTimeout(() => {
        setAiMessages(prev => [...prev, { from: 'ai', text: AI_QUESTIONS[nextStep] }]);
        setAiStep(nextStep);
      }, 800);
    } else {
      setTimeout(() => {
        const studentIdPattern = /[A-Z]{2}-[A-Z0-9]{2,6}-\d{4}-STU-\d{4}/i;
        const foundId = newAnswers.find(a => studentIdPattern.test(a));
        if (foundId) {
          const extractedId = foundId.match(studentIdPattern)?.[0]?.toUpperCase() || '';
          const parentId = extractedId.replace('-STU-', '-PAR-');
          setAiMessages(prev => [...prev,
            { from: 'ai', text: `I found the Student ID: ${extractedId}. Generating your Parent ID...` }
          ]);
          setTimeout(() => {
            setAiMessages(prev => [...prev, {
              from: 'ai',
              text: `✅ Verification complete!\n\nYour Parent ID is: ${parentId}\n\nSave this ID. You will use it to log in every time.`,
            }]);
          }, 1500);
        } else {
          setAiMessages(prev => [...prev, {
            from: 'ai',
            text: 'I could not find a valid Student ID in your responses. Please go back and try again with the correct Student ID from your child\'s school documents.',
          }]);
        }
      }, 800);
    }
  };

  const pageStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: 'radial-gradient(ellipse at 30% 40%, rgba(30, 58, 138, 0.3) 0%, transparent 60%), #080f20',
    display: 'flex',
    flexDirection: 'column',
  };

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '28px',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    textAlign: 'left' as const,
    width: '100%',
  };

  return (
    <div style={pageStyle}>
      {/* Header */}
      <header style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '16px' }}>S</div>
          <span style={{ fontWeight: 'bold', color: 'white', fontSize: '15px' }}>SRMS Platform</span>
        </Link>
        <Link href="/register" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '14px' }}>Register your school →</Link>
      </header>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: '480px' }}>

          {/* STEP 1 — ROLE SELECTION */}
          {step === 'role-select' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.2rem', fontWeight: '900', color: 'white', marginBottom: '8px' }}>Sign In to SRMS</h1>
                <p style={{ color: '#64748b', fontSize: '15px' }}>Select your role to continue</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {(Object.entries(ROLE_CONFIG) as [LoginRole, typeof ROLE_CONFIG.student][]).map(([role, config]) => (
                  <button
                    key={role}
                    onClick={() => handleRoleSelect(role)}
                    style={{ ...cardStyle, border: `1px solid ${config.borderColor.replace('0.4', '0.2')}` }}
                    onMouseEnter={e => {
                      const el = e.currentTarget;
                      el.style.borderColor = config.borderColor;
                      el.style.boxShadow = `0 10px 40px ${config.glowColor}`;
                      el.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget;
                      el.style.borderColor = config.borderColor.replace('0.4', '0.2');
                      el.style.boxShadow = 'none';
                      el.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{config.icon}</div>
                    <div style={{ fontWeight: '700', color: 'white', fontSize: '14px', marginBottom: '6px' }}>{config.label}</div>
                    <div style={{ color: '#475569', fontSize: '12px', lineHeight: 1.4 }}>{config.description}</div>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <p style={{ color: '#334155', fontSize: '12px' }}>
                  SRMS Platform — Built by MUFUNG ANGELBELL MBUYEH — AWS Solutions Architect — Yaoundé, Cameroon
                </p>
              </div>
            </div>
          )}

          {/* STEP 2 — CREDENTIALS */}
          {step === 'credentials' && selectedRole && (
            <div>
              <button
                onClick={() => { setStep('role-select'); setErrorMsg(''); setIdentifier(''); setPassword(''); }}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ← Back to role selection
              </button>

              <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <div style={{ fontSize: '3.5rem', marginBottom: '12px' }}>{ROLE_CONFIG[selectedRole].icon}</div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', marginBottom: '8px' }}>
                  Sign In as {ROLE_CONFIG[selectedRole].label}
                </h1>
                {ROLE_CONFIG[selectedRole].hasMFA && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '100px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd', fontSize: '12px', marginTop: '8px' }}>
                    🔐 MFA required for this role
                  </div>
                )}
              </div>

              {errorMsg && (
                <div style={{ marginBottom: '24px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '14px' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ position: 'relative' }}>
                  <label style={{ display: 'block', color: '#64748b', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    ID or Email
                  </label>
                  <input
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px 16px', color: '#e2e8f0', fontSize: '15px', width: '100%', outline: 'none', boxSizing: 'border-box' }}
                    placeholder={ROLE_CONFIG[selectedRole].idPlaceholder}
                    value={identifier}
                    onChange={e => { setIdentifier(e.target.value); setShowSuggestions(true); }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, marginTop: '4px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          style={{ width: '100%', padding: '12px 16px', textAlign: 'left', background: 'none', border: 'none', color: '#cbd5e1', fontSize: '14px', cursor: 'pointer' }}
                          onMouseDown={() => { setIdentifier(s); setShowSuggestions(false); }}
                          onMouseEnter={e => (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
                          onMouseLeave={e => (e.target as HTMLElement).style.background = 'none'}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', color: '#64748b', fontSize: '12px', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '14px 50px 14px 16px', color: '#e2e8f0', fontSize: '15px', width: '100%', outline: 'none', boxSizing: 'border-box' }}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      onFocus={e => { e.target.style.borderColor = 'rgba(59,130,246,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.1)'; }}
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading}
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: 'white', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: '8px' }}
                >
                  {loading ? 'Signing in...' : `Sign In as ${ROLE_CONFIG[selectedRole].label} →`}
                </button>

                <p style={{ textAlign: 'center', color: '#334155', fontSize: '13px' }}>
                  Forgot your ID or password? Contact your school administrator.
                </p>
              </div>
            </div>
          )}

          {/* STEP 3 — MFA */}
          {step === 'mfa' && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📱</div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white', marginBottom: '10px' }}>Two-Factor Authentication</h1>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>
                  Open your Google Authenticator app and enter the 6-digit code for SRMS Platform
                </p>
              </div>

              {errorMsg && (
                <div style={{ marginBottom: '24px', padding: '14px 16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: '14px' }}>
                  ⚠️ {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '16px', color: '#e2e8f0', fontSize: '2rem', width: '100%', outline: 'none', textAlign: 'center', letterSpacing: '0.3em', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  placeholder="000000"
                  maxLength={6}
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleMFA()}
                  autoFocus
                />
                <button
                  onClick={handleMFA}
                  disabled={loading || mfaCode.length !== 6}
                  style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: 'white', border: 'none', borderRadius: '10px', padding: '16px', fontSize: '15px', fontWeight: '700', cursor: (loading || mfaCode.length !== 6) ? 'not-allowed' : 'pointer', opacity: (loading || mfaCode.length !== 6) ? 0.5 : 1 }}
                >
                  {loading ? 'Verifying...' : 'Verify and Sign In →'}
                </button>
                <button
                  onClick={() => { setStep('credentials'); setMfaCode(''); setErrorMsg(''); }}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', padding: '8px' }}
                >
                  ← Go back
                </button>
              </div>
            </div>
          )}

          {/* STEP 4 — PARENT AI VERIFICATION */}
          {step === 'parent-ai' && (
            <div>
              <button
                onClick={() => setStep('role-select')}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                ← Back
              </button>

              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🤖</div>
                <h1 style={{ fontSize: '1.6rem', fontWeight: '900', color: 'white', marginBottom: '8px' }}>Parent Verification</h1>
                <p style={{ color: '#64748b', fontSize: '13px' }}>Our AI will ask a few questions to verify you are a parent or guardian</p>
              </div>

              {/* Chat window */}
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '20px', height: '280px', overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {aiMessages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div style={{
                      maxWidth: '80%',
                      padding: '10px 14px',
                      borderRadius: msg.from === 'ai' ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
                      background: msg.from === 'ai' ? 'rgba(59,130,246,0.15)' : 'rgba(245,158,11,0.15)',
                      color: msg.from === 'ai' ? '#93c5fd' : '#fcd34d',
                      fontSize: '14px',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-line',
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {aiStep < AI_QUESTIONS.length ? (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '12px 16px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                    placeholder="Type your answer..."
                    value={aiInput}
                    onChange={e => setAiInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAiMessage()}
                  />
                  <button
                    onClick={handleAiMessage}
                    disabled={!aiInput.trim()}
                    style={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', color: 'white', border: 'none', borderRadius: '10px', padding: '12px 20px', cursor: aiInput.trim() ? 'pointer' : 'not-allowed', opacity: aiInput.trim() ? 1 : 0.5, fontWeight: '600' }}
                  >
                    Send
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setStep('credentials')}
                  style={{ width: '100%', background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#0f172a', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }}
                >
                  Continue to Set Up My Account →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}