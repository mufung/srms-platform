'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const SECTIONS = [
  { id: 'section1', number: '01', title: 'Result Publishing', description: 'Teachers upload results in any format. Auto-calculated grades with color-coded display and PDF export.', icon: '📊', features: ['Upload any file format', 'Auto grade calculation', 'Color-coded results', 'PDF export', 'Class rankings'] },
  { id: 'section2', number: '02', title: 'Complaint Engine', description: 'Students raise result errors with photo proof. Teachers review, correct, and resolve with full audit trail.', icon: '⚖️', features: ['Photo proof upload', 'Document evidence', 'Complaint tracking', 'Teacher review system', 'Audit trail'] },
  { id: 'section3', number: '03', title: 'Smart Calculator', description: 'Enter raw scores. System applies your school grading formula and calculates everything automatically.', icon: '🧮', features: ['Custom grade formulas', 'GPA calculation', 'Class positions', 'Subject averages', 'Term summaries'] },
  { id: 'section4', number: '04', title: 'AI Assistant', description: 'Voice and text AI guides users through the system. Verifies parents. Detects result anomalies.', icon: '🤖', features: ['Voice guidance', 'Parent verification', 'Anomaly detection', 'School chatbot setup', 'Onboarding assistant'] },
  { id: 'section5', number: '05', title: 'Notifications', description: 'Automated SMS, email, and push notifications for every important event in the system.', icon: '🔔', features: ['SMS notifications', 'Email alerts', 'Push notifications', 'School broadcasts', 'Payment reminders'] },
  { id: 'section6', number: '06', title: 'Analytics', description: 'Deep insights into academic performance trends, subject analysis, and class progression over time.', icon: '📈', features: ['Performance trends', 'Subject analysis', 'Class comparison', 'Term progression', 'Export reports'] },
  { id: 'section7', number: '07', title: 'Parent Portal', description: 'Parents verify identity via AI, receive their Parent ID, and access their child results and progress.', icon: '👨‍👩‍👧', features: ['AI parent verification', 'Auto Parent ID', 'Child result access', 'Feedback submission', 'Progress insights'] },
];

const PLANS = [
  { name: 'Starter', price: '$15', period: '/month', limit: 'Up to 300 students', features: ['Section 1 included', 'Basic result publishing', '300 student IDs', '20 teacher IDs', 'Email support'], popular: false, color: 'border-blue-600' },
  { name: 'Standard', price: '$40', period: '/month', limit: 'Up to 1,000 students', features: ['Sections 1, 2, 5', 'Complaints engine', '1,000 student IDs', '50 teacher IDs', 'SMS notifications', 'Priority support'], popular: true, color: 'border-amber-500' },
  { name: 'Professional', price: '$100', period: '/month', limit: 'Up to 5,000 students', features: ['All 7 sections', 'AI assistant', '5,000 student IDs', 'Unlimited teachers', 'Parent portal', 'Analytics', 'Custom domain', '24/7 support'], popular: false, color: 'border-purple-500' },
  { name: 'Enterprise', price: 'Custom', period: '', limit: 'Unlimited', features: ['Complete platform', 'National-scale traffic', 'GCE Board ready', 'Dedicated infrastructure', 'White-label option', 'SLA guarantee', 'On-site training'], popular: false, color: 'border-emerald-500' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#080f20', color: '#e2e8f0' }}>

      {/* NAVIGATION */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? 'rgba(8, 15, 32, 0.97)' : 'transparent',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.05)' : 'none',
        transition: 'all 0.3s ease',
        padding: '0 2rem',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white', fontSize: '18px' }}>S</div>
            <div>
              <div style={{ fontWeight: 'bold', color: 'white', fontSize: '16px' }}>SRMS Platform</div>
              <div style={{ color: '#60a5fa', fontSize: '11px' }}>Student Result Management</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ display: 'flex', gap: '24px' }} className="hidden md:flex">
              {['Features', 'Sections', 'Pricing'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} style={{ color: 'rgba(148,163,184,0.8)', textDecoration: 'none', fontSize: '14px', fontWeight: '500', transition: 'color 0.2s' }}
                  onMouseEnter={e => (e.target as HTMLElement).style.color = '#60a5fa'}
                  onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(148,163,184,0.8)'}
                >
                  {item}
                </a>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', padding: '8px 16px' }}>Sign In</Link>
              <Link href="/register" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#0f172a', textDecoration: 'none', fontSize: '14px', fontWeight: '700', padding: '8px 20px', borderRadius: '8px' }}>Get Started Free →</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at 20% 50%, rgba(30,58,138,0.4) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(139,92,246,0.2) 0%, transparent 60%)',
        paddingTop: '80px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.08,
          backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 2rem', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', color: '#93c5fd', fontSize: '13px', marginBottom: '32px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa', display: 'inline-block' }} />
            Enterprise Result Management Platform — 2026
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 8vw, 5rem)', fontWeight: '900', color: 'white', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-0.02em' }}>
            The Future of<br />
            <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              School Results
            </span><br />
            Is Here
          </h1>

          <p style={{ fontSize: '1.25rem', color: '#94a3b8', maxWidth: '700px', margin: '0 auto 40px', lineHeight: 1.7 }}>
            Teachers upload. Students verify. Parents stay informed.<br />
            One platform for every school, exam board, and institution in Africa.
          </p>

          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#0f172a', textDecoration: 'none', fontWeight: '800', fontSize: '16px', padding: '16px 40px', borderRadius: '12px', display: 'inline-block' }}>
              Start 14-Day Free Trial →
            </Link>
            <Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '16px', padding: '16px 40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-block' }}>
              Sign In to Your School
            </Link>
          </div>

          <p style={{ color: '#475569', fontSize: '13px', marginTop: '24px' }}>
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </div>
      </section>

      {/* STATS */}
      <section style={{ padding: '4rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', textAlign: 'center' }}>
          {[
            { value: '99.9%', label: 'Uptime SLA', icon: '⚡' },
            { value: '< 2s', label: 'Load Time', icon: '🚀' },
            { value: '256-bit', label: 'Encryption', icon: '🔐' },
            { value: 'AWS', label: 'Powered By', icon: '☁️' },
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{stat.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: '900', background: 'linear-gradient(135deg, #f59e0b, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{stat.value}</div>
              <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="features" style={{ padding: '6rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', color: 'white', marginBottom: '16px' }}>
              Simple for Schools,{' '}
              <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Powerful for Everyone
              </span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>From result upload to verified results in minutes, not weeks</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {[
              { step: '01', title: 'Teacher Uploads Results', desc: 'Upload in any format — Excel, CSV, PDF, or type directly. System auto-calculates grades and positions.', icon: '👨‍🏫' },
              { step: '02', title: 'Students Verify Results', desc: 'Students log in with their SRMS ID, view color-coded results, and raise complaints with photo proof if there are errors.', icon: '🎓' },
              { step: '03', title: 'Finals Are Published', desc: 'After all complaints are resolved, verified results are published and downloadable as professional PDFs.', icon: '✅' },
            ].map((step, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '16px', right: '16px', fontSize: '4rem', fontWeight: '900', color: 'rgba(255,255,255,0.04)' }}>{step.step}</div>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>{step.icon}</div>
                <div style={{ color: '#60a5fa', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Step {step.step}</div>
                <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px' }}>{step.title}</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTIONS SHOWCASE */}
      <section id="sections" style={{ padding: '6rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', color: 'white', marginBottom: '16px' }}>
              Buy What You Need,{' '}
              <span style={{ background: 'linear-gradient(135deg, #f59e0b, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Scale When Ready
              </span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>7 independent sections. Each section is fully isolated and delivered automatically when purchased.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {SECTIONS.map((section, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '28px', transition: 'all 0.3s ease', cursor: 'default' }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(59,130,246,0.4)'; el.style.transform = 'translateY(-4px)'; el.style.boxShadow = '0 20px 60px rgba(59,130,246,0.15)'; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'rgba(255,255,255,0.08)'; el.style.transform = 'translateY(0)'; el.style.boxShadow = 'none'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ fontSize: '2.5rem' }}>{section.icon}</div>
                  <span style={{ fontSize: '3rem', fontWeight: '900', color: 'rgba(255,255,255,0.04)' }}>{section.number}</span>
                </div>
                <h3 style={{ color: 'white', fontSize: '1.1rem', fontWeight: '700', marginBottom: '10px' }}>{section.title}</h3>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>{section.description}</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {section.features.map((f, fi) => (
                    <li key={fi} style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#10b981', fontSize: '11px' }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* USER ROLES */}
      <section style={{ padding: '6rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900', color: 'white', marginBottom: '12px' }}>Built For Everyone</h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Every role has its own secure, purpose-built experience</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
            {[
              { role: 'Teacher', icon: '👨‍🏫', color: '#3b82f6', abilities: ['Upload results (any format)', 'Auto-calculate grades', 'Publish verified results', 'Review student complaints', 'Correct and update results', 'Export professional PDFs'] },
              { role: 'Student', icon: '🎓', color: '#10b981', abilities: ['View color-coded results', 'Confirm correct results', 'Raise error complaints', 'Upload photo evidence', 'Track complaint status', 'View result history'] },
              { role: 'Parent', icon: '👨‍👩‍👧', color: '#f59e0b', abilities: ['AI identity verification', 'Receive auto Parent ID', "View child's results", 'Monitor performance trends', 'Submit school feedback', 'Receive SMS notifications'] },
              { role: 'Admin', icon: '🏫', color: '#8b5cf6', abilities: ['Manage all school IDs', 'View school analytics', 'Control billing usage', 'Customize school branding', 'Broadcast announcements', 'Access audit logs'] },
            ].map((role, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${role.color}30`, borderRadius: '16px', padding: '28px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>{role.icon}</div>
                <h3 style={{ color: role.color, fontWeight: '700', fontSize: '1.1rem', marginBottom: '20px' }}>{role.role}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {role.abilities.map((a, ai) => (
                    <li key={ai} style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ color: role.color, flexShrink: 0 }}>→</span>{a}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: '6rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '900', color: 'white', marginBottom: '16px' }}>
              Pay Only for{' '}
              <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                What You Use
              </span>
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Base plan + per-ID pricing. 14-day free trial. Cancel anytime. 90 days data retention after cancellation.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {PLANS.map((plan, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `2px solid ${plan.popular ? '#f59e0b' : 'rgba(255,255,255,0.08)'}`, borderRadius: '16px', padding: '28px', position: 'relative', boxShadow: plan.popular ? '0 20px 60px rgba(245,158,11,0.15)' : 'none' }}>
                {plan.popular && (
                  <div style={{ position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#0f172a', fontSize: '11px', fontWeight: '800', padding: '4px 16px', borderRadius: '100px' }}>
                    MOST POPULAR
                  </div>
                )}
                <h3 style={{ color: 'white', fontWeight: '700', fontSize: '1.1rem', marginBottom: '4px' }}>{plan.name}</h3>
                <p style={{ color: '#475569', fontSize: '12px', marginBottom: '20px' }}>{plan.limit}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                  <span style={{ color: 'white', fontSize: '2.5rem', fontWeight: '900' }}>{plan.price}</span>
                  <span style={{ color: '#64748b', fontSize: '16px' }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {plan.features.map((f, fi) => (
                    <li key={fi} style={{ color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ color: '#10b981' }}>✓</span>{f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '12px', borderRadius: '10px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', background: plan.popular ? 'linear-gradient(135deg, #d97706, #f59e0b)' : 'transparent', color: plan.popular ? '#0f172a' : '#94a3b8', border: plan.popular ? 'none' : '1px solid rgba(255,255,255,0.1)' }}>
                  Start Free Trial →
                </Link>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
            <h3 style={{ color: 'white', fontWeight: '700', fontSize: '1.2rem', marginBottom: '24px' }}>Per-ID Monthly Pricing (Added to Base Plan)</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '48px', flexWrap: 'wrap' }}>
              {[
                { type: 'Student ID', price: '$0.10', icon: '🎓' },
                { type: 'Teacher ID', price: '$0.30', icon: '👨‍🏫' },
                { type: 'Parent ID', price: '$0.05', icon: '👨‍👩‍👧' },
                { type: 'Admin ID', price: '$0.50', icon: '🏫' },
              ].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{item.icon}</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '900', background: 'linear-gradient(135deg, #f59e0b, #fcd34d)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{item.price}</div>
                  <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>{item.type}/month</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '6rem 2rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', background: 'linear-gradient(135deg, rgba(30,58,138,0.4), rgba(139,92,246,0.2))', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '80px 40px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '24px' }}>🚀</div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '900', color: 'white', marginBottom: '16px' }}>
            Ready to Transform Your School Results?
          </h2>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto 40px' }}>
            Join schools across Africa using SRMS Platform. Start your free trial today — no credit card required.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', color: '#0f172a', textDecoration: 'none', fontWeight: '800', fontSize: '16px', padding: '16px 40px', borderRadius: '12px', display: 'inline-block' }}>
              Start Free Trial — 14 Days →
            </Link>
            <a href="https://wa.me/237671534067" target="_blank" rel="noopener noreferrer" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '16px', padding: '16px 40px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-block' }}>
              💬 WhatsApp Us
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '4rem 2rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '40px', marginBottom: '40px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #3b82f6, #1e3a8a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'white' }}>S</div>
                <div>
                  <div style={{ color: 'white', fontWeight: '700', fontSize: '14px' }}>SRMS Platform</div>
                  <div style={{ color: '#60a5fa', fontSize: '11px' }}>by MUFUNG ANGELBELL MBUYEH</div>
                </div>
              </div>
              <p style={{ color: '#475569', fontSize: '13px', lineHeight: 1.6, marginBottom: '16px' }}>
                Enterprise-grade student result management. Built for schools, exam boards, and educational institutions across Africa.
              </p>
            </div>

            <div>
              <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '20px', fontSize: '14px' }}>Platform</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Features', 'Sections', 'Pricing', 'Security'].map(item => (
                  <a key={item} href="#" style={{ color: '#475569', textDecoration: 'none', fontSize: '13px' }}>{item}</a>
                ))}
              </div>
            </div>

            <div>
              <h4 style={{ color: 'white', fontWeight: '700', marginBottom: '20px', fontSize: '14px' }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#475569' }}>
                <p>MUFUNG ANGELBELL MBUYEH</p>
                <p>AWS Solutions Architect</p>
                <p>Yaoundé, Cameroon Northwest</p>
                <a href="mailto:mufungangelbellmbuyeh@gmail.com" style={{ color: '#60a5fa', textDecoration: 'none' }}>mufungangelbellmbuyeh@gmail.com</a>
                <a href="https://wa.me/237671534067" target="_blank" rel="noopener noreferrer" style={{ color: '#10b981', textDecoration: 'none' }}>WhatsApp: +237 671 534 067</a>
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <p style={{ color: '#334155', fontSize: '13px' }}>© 2026 SRMS Platform. Built by MUFUNG ANGELBELL MBUYEH. All rights reserved.</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#334155', fontSize: '13px' }}>
              <span>Powered by</span>
              <span style={{ color: '#f59e0b', fontWeight: '600' }}>Amazon Web Services</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}