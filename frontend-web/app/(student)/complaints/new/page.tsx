'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function Content() {
  const p = useSearchParams();
  const subject = p.get('subject') || '';
  const score = p.get('score') || '';

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 480, width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 40 }}>
        <Link href="/student/results" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14, display: 'block', marginBottom: 24 }}>← Back to Results</Link>
        <div style={{ fontSize: '3rem', marginBottom: 16, textAlign: 'center' }}>⚖️</div>
        <h1 style={{ color: 'white', fontSize: '1.6rem', fontWeight: 900, marginBottom: 8, textAlign: 'center' }}>Raise a Complaint</h1>
        <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', marginBottom: 32 }}>
          Subject: <strong style={{ color: '#fbbf24' }}>{subject || 'Not specified'}</strong>
          {score ? ' · Score: ' + score : ''}
        </p>
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <p style={{ color: '#fbbf24', fontSize: 13, margin: 0 }}>
            Phase 5 will add full complaint submission with photo proof upload, tracking, and teacher review inbox. Coming next.
          </p>
        </div>
        <Link href="/student/results" style={{ display: 'block', textAlign: 'center', background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', color: 'white', textDecoration: 'none', borderRadius: 10, padding: 14, fontWeight: 700, fontSize: 14 }}>
          ← Return to Results
        </Link>
      </div>
    </div>
  );
}

export default function ComplaintsNewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#080f20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>Loading...</div>}>
      <Content />
    </Suspense>
  );
}
