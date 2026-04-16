'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface BillLine { label: string; count: number; unitCost: number; total: number; color: string; }
interface HistoryItem { month: string; status: string; totalUSD: string; totalXAF: number; paidAt: string | null; provider: string; paymentMethod: string; }

const BILL_LINES: BillLine[] = [
  { label: 'Student IDs', count: 128, unitCost: 0.10, total: 12.80, color: '#3b82f6' },
  { label: 'Teacher IDs', count: 22, unitCost: 0.30, total: 6.60, color: '#10b981' },
  { label: 'Parent IDs', count: 35, unitCost: 0.05, total: 1.75, color: '#8b5cf6' },
  { label: 'Admin IDs', count: 3, unitCost: 0.50, total: 1.50, color: '#f59e0b' },
];

const HISTORY: HistoryItem[] = [
  { month: 'March 2026', status: 'pending', totalUSD: '62.65', totalXAF: 40723, paidAt: null, provider: '—', paymentMethod: '—' },
  { month: 'February 2026', status: 'paid', totalUSD: '58.90', totalXAF: 38285, paidAt: '2026-02-01', provider: 'Flutterwave', paymentMethod: 'MTN MoMo' },
  { month: 'January 2026', status: 'paid', totalUSD: '60.20', totalXAF: 39130, paidAt: '2026-01-02', provider: 'Flutterwave', paymentMethod: 'Orange Money' },
  { month: 'December 2025', status: 'paid', totalUSD: '55.40', totalXAF: 36010, paidAt: '2025-12-01', provider: 'Stripe', paymentMethod: 'Visa Card' },
  { month: 'November 2025', status: 'paid', totalUSD: '52.70', totalXAF: 34255, paidAt: '2025-11-02', provider: 'Flutterwave', paymentMethod: 'MTN MoMo' },
];

const basePlan = 40.00;
const idTotal = BILL_LINES.reduce((s, l) => s + l.total, 0);
const totalUSD = basePlan + idTotal;
const totalXAF = Math.round(totalUSD * 650);

const STATUS_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  paid: { color: '#34d399', bg: 'rgba(16,185,129,0.15)', label: '✅ Paid' },
  pending: { color: '#fbbf24', bg: 'rgba(245,158,11,0.15)', label: '⏳ Due Now' },
  failed: { color: '#f87171', bg: 'rgba(239,68,68,0.15)', label: '❌ Failed' },
};

export default function BillingPage() {
  const [tab, setTab] = useState<'current' | 'history' | 'plan'>('current');
  const [showModal, setShowModal] = useState(false);
  const [apiData, setApiData] = useState<any>(null);

  useEffect(() => {
    const api = process.env.NEXT_PUBLIC_TENANT_API_URL || '';
    fetch(`${api}/billing/current`)
      .then(r => r.json())
      .then(d => { if (d.success) setApiData(d.data.bill); })
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#080f20', color: '#e2e8f0' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(8,15,32,0.97)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link href="/school-admin/dashboard" style={{ color: '#64748b', textDecoration: 'none', fontSize: 14 }}>← Dashboard</Link>
          <span style={{ color: '#334155' }}>|</span>
          <span style={{ color: 'white', fontWeight: 700 }}>Billing & Payments</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ padding: '5px 12px', borderRadius: 100, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>⏳ Payment Due</span>
          <button onClick={() => setShowModal(true)}
            style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#0f172a', border: 'none', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>
            💳 Pay Now
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {/* Alert */}
        <div style={{ marginBottom: 24, padding: '16px 20px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 12 }}>
          <div>
            <p style={{ color: '#fbbf24', fontWeight: 700, fontSize: 14, margin: '0 0 4px' }}>⏳ Payment Due — March 2026</p>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>Due April 1, 2026. After 7 days your account enters grace period.</p>
          </div>
          <button onClick={() => setShowModal(true)}
            style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#0f172a', border: 'none', borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>
            Pay {totalXAF.toLocaleString()} XAF →
          </button>
        </div>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { label: 'This Month', value: `$${totalUSD.toFixed(2)}`, sub: `${totalXAF.toLocaleString()} XAF`, color: '#f59e0b', icon: '💰' },
            { label: 'Base Plan', value: '$40.00', sub: 'Standard Plan', color: '#3b82f6', icon: '📦' },
            { label: 'Total IDs', value: '188', sub: `$${idTotal.toFixed(2)} ID costs`, color: '#10b981', icon: '🆔' },
            { label: 'Next Due', value: 'Apr 1', sub: '2026', color: '#64748b', icon: '📅' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{c.icon}</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 900, color: c.color }}>{c.value}</div>
              <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>{c.label}</div>
              <div style={{ color: '#475569', fontSize: 11 }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 4, width: 'fit-content', marginBottom: 24 }}>
          {[{ key:'current', label:'📋 Current Invoice' }, { key:'history', label:'🗂️ History' }, { key:'plan', label:'📦 My Plan' }].map(({ key, label }) => (
            <button key={key} onClick={() => setTab(key as any)}
              style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === key ? 'linear-gradient(135deg,#1d4ed8,#3b82f6)' : 'transparent', color: tab === key ? 'white' : '#64748b' }}>
              {label}
            </button>
          ))}
        </div>

        {/* CURRENT INVOICE */}
        {tab === 'current' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#1d4ed8)', padding: '24px 28px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' as const, gap: 16 }}>
              <div>
                <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.2rem', margin: '0 0 4px' }}>SRMS Platform Invoice</h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, margin: 0 }}>Government Bilingual High School Bamenda</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, margin: '4px 0 0', fontFamily: 'monospace' }}>INV-SRMS-2026-03-GBHS</p>
              </div>
              <div style={{ textAlign: 'right' as const }}>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '0 0 4px' }}>Billing Period</p>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>March 2026</p>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: '4px 0 0' }}>Due: April 1, 2026</p>
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Description', 'Count', 'Unit Price', 'USD', 'XAF'].map((h, i) => (
                      <th key={i} style={{ padding: '10px 0', textAlign: i === 0 ? 'left' as const : 'right' as const, color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '14px 0' }}>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: 14, margin: 0 }}>Standard Plan — Base Subscription</p>
                      <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>Up to 1,000 students · All core features</p>
                    </td>
                    <td style={{ padding: '14px 0', textAlign: 'right' as const, color: '#64748b', fontSize: 13 }}>1</td>
                    <td style={{ padding: '14px 0', textAlign: 'right' as const, color: '#64748b', fontSize: 13 }}>$40.00</td>
                    <td style={{ padding: '14px 0', textAlign: 'right' as const, color: 'white', fontWeight: 700 }}>$40.00</td>
                    <td style={{ padding: '14px 0', textAlign: 'right' as const, color: '#94a3b8', fontSize: 13 }}>26,000</td>
                  </tr>
                  {BILL_LINES.map((line, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '12px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: line.color }} />
                          <span style={{ color: '#e2e8f0', fontSize: 13 }}>{line.label}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 0', textAlign: 'right' as const, color: '#64748b', fontSize: 13 }}>{line.count}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right' as const, color: '#64748b', fontSize: 13 }}>${line.unitCost.toFixed(2)}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right' as const, color: line.color, fontWeight: 700 }}>${line.total.toFixed(2)}</td>
                      <td style={{ padding: '12px 0', textAlign: 'right' as const, color: '#64748b', fontSize: 12 }}>{Math.round(line.total * 650).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
                {[
                  ['Base Plan', `$${basePlan.toFixed(2)}`],
                  ['Per-ID Charges (188 IDs)', `$${idTotal.toFixed(2)}`],
                ].map(([l, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>{l}</span>
                    <span style={{ color: '#e2e8f0', fontSize: 13 }}>{v}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 0' }}>
                  <span style={{ color: 'white', fontWeight: 800, fontSize: 16 }}>Total Due</span>
                  <div style={{ textAlign: 'right' as const }}>
                    <p style={{ color: '#f59e0b', fontWeight: 900, fontSize: '1.5rem', margin: 0 }}>${totalUSD.toFixed(2)}</p>
                    <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>{totalXAF.toLocaleString()} XAF</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button onClick={() => window.print()} style={{ background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: 13 }}>
                  🖨️ Print Invoice
                </button>
                <button onClick={() => setShowModal(true)}
                  style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#0f172a', border: 'none', borderRadius: 8, padding: '10px 28px', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}>
                  💳 Pay {totalXAF.toLocaleString()} XAF →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY */}
        {tab === 'history' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Payment History</h2>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(30,58,138,0.25)' }}>
                  {['Month', 'Amount', 'Method', 'Provider', 'Status', 'Paid On'].map((h, i) => (
                    <th key={i} style={{ padding: '12px 16px', textAlign: 'left' as const, color: '#93c5fd', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, borderBottom: '1px solid rgba(59,130,246,0.15)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HISTORY.map((h, i) => {
                  const st = STATUS_STYLE[h.status] || STATUS_STYLE.pending;
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '14px 16px', color: 'white', fontWeight: 600 }}>{h.month}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <p style={{ color: '#f59e0b', fontWeight: 700, margin: 0 }}>${h.totalUSD}</p>
                        <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>{h.totalXAF.toLocaleString()} XAF</p>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#e2e8f0', fontSize: 13 }}>{h.paymentMethod}</td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>{h.provider}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#64748b', fontSize: 13 }}>
                        {h.paidAt ? new Date(h.paidAt).toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* PLAN */}
        {tab === 'plan' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { name:'Starter', price:'$15', xaf:'9,750 XAF', limit:'300 students', features:['Result Publishing','20 Teacher IDs','Email support'], current:false, color:'#3b82f6' },
                { name:'Standard', price:'$40', xaf:'26,000 XAF', limit:'1,000 students', features:['All core sections','50 Teacher IDs','SMS + Email','AI Assistant'], current:true, color:'#f59e0b' },
                { name:'Professional', price:'$100', xaf:'65,000 XAF', limit:'5,000 students', features:['All 7 sections','Unlimited teachers','Analytics','Custom domain'], current:false, color:'#8b5cf6' },
              ].map((plan, i) => (
                <div key={i} style={{ background: plan.current ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)', border: '2px solid ' + (plan.current ? '#f59e0b' : 'rgba(255,255,255,0.08)'), borderRadius: 16, padding: 24, position: 'relative' as const }}>
                  {plan.current && <div style={{ position: 'absolute' as const, top: -12, left: '50%', transform: 'translateX(-50%)', background: '#f59e0b', color: '#0f172a', fontSize: 10, fontWeight: 900, padding: '3px 14px', borderRadius: 100 }}>CURRENT</div>}
                  <h3 style={{ color: 'white', fontWeight: 700, margin: '0 0 4px' }}>{plan.name}</h3>
                  <p style={{ color: '#475569', fontSize: 12, margin: '0 0 16px' }}>{plan.limit}</p>
                  <p style={{ color: 'white', fontSize: '2rem', fontWeight: 900, margin: '0 0 4px' }}>{plan.price}<span style={{ color: '#64748b', fontSize: 13 }}>/mo</span></p>
                  <p style={{ color: '#475569', fontSize: 12, margin: '0 0 16px' }}>{plan.xaf}/month</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px' }}>
                    {plan.features.map((f, fi) => (
                      <li key={fi} style={{ color: '#94a3b8', fontSize: 13, padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: plan.current ? '#f59e0b' : '#10b981' }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button disabled={plan.current} style={{ width: '100%', background: plan.current ? 'rgba(255,255,255,0.05)' : `linear-gradient(135deg,${plan.color},${plan.color}cc)`, color: plan.current ? '#475569' : 'white', border: 'none', borderRadius: 8, padding: 10, cursor: plan.current ? 'not-allowed' : 'pointer', fontWeight: 700 }}>
                    {plan.current ? 'Current Plan' : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
              <h3 style={{ color: 'white', fontWeight: 700, fontSize: '1rem', margin: '0 0 16px' }}>Per-ID Monthly Charges</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12 }}>
                {[
                  { type:'Student ID', usd:'$0.10', xaf:'65 XAF', icon:'🎓', color:'#3b82f6' },
                  { type:'Teacher ID', usd:'$0.30', xaf:'195 XAF', icon:'👨‍🏫', color:'#10b981' },
                  { type:'Parent ID', usd:'$0.05', xaf:'33 XAF', icon:'👨‍👩‍👧', color:'#8b5cf6' },
                  { type:'Admin ID', usd:'$0.50', xaf:'325 XAF', icon:'🏫', color:'#f59e0b' },
                ].map((item, i) => (
                  <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 14, textAlign: 'center' as const }}>
                    <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>{item.icon}</div>
                    <p style={{ color: item.color, fontWeight: 900, fontSize: '1.1rem', margin: '0 0 2px' }}>{item.usd}</p>
                    <p style={{ color: '#475569', fontSize: 11, margin: '0 0 4px' }}>{item.xaf}/month</p>
                    <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{item.type}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && <PaymentModal totalUSD={totalUSD} totalXAF={totalXAF} onClose={() => setShowModal(false)} />}
    </div>
  );
}

function PaymentModal({ totalUSD, totalXAF, onClose }: { totalUSD: number; totalXAF: number; onClose: () => void }) {
  const [method, setMethod] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('admin@gbhs.cm');
  const [step, setStep] = useState<'select' | 'confirm' | 'processing' | 'success'>('select');
  const [txId, setTxId] = useState('');

  const METHODS = [
    { id:'mtn_momo', label:'MTN Mobile Money', icon:'📱', color:'#f59e0b', bg:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.3)', desc:'Pay with MTN MoMo wallet', popular:true, phone:true },
    { id:'orange_money', label:'Orange Money', icon:'🟠', color:'#f97316', bg:'rgba(249,115,22,0.1)', border:'rgba(249,115,22,0.3)', desc:'Pay with Orange Money wallet', popular:false, phone:true },
    { id:'wave', label:'Wave', icon:'🌊', color:'#06b6d4', bg:'rgba(6,182,212,0.1)', border:'rgba(6,182,212,0.3)', desc:'Fast transfer — 1% fee only', popular:false, phone:true },
    { id:'express_union', label:'Express Union', icon:'🏦', color:'#8b5cf6', bg:'rgba(139,92,246,0.1)', border:'rgba(139,92,246,0.3)', desc:'Express Union Mobile Money', popular:false, phone:true },
    { id:'card', label:'Visa / Mastercard', icon:'💳', color:'#3b82f6', bg:'rgba(59,130,246,0.1)', border:'rgba(59,130,246,0.3)', desc:'Debit or credit card', popular:false, phone:false },
    { id:'stripe', label:'International Card (Stripe)', icon:'🌐', color:'#6366f1', bg:'rgba(99,102,241,0.1)', border:'rgba(99,102,241,0.3)', desc:'Visa, Mastercard, Apple Pay', popular:false, phone:false },
  ];

  const selected = METHODS.find(m => m.id === method);

  const handlePay = async () => {
    if (selected?.phone && !phone.trim()) { alert('Enter your phone number'); return; }
    setStep('processing');
    await new Promise(r => setTimeout(r, 2500));
    setTxId('SRMS-' + Date.now().toString(36).toUpperCase());
    setStep('success');
  };

  const inp: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 14px', color: '#e2e8f0', fontSize: 14, width: '100%', outline: 'none', boxSizing: 'border-box' as const };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'white', fontWeight: 900, fontSize: '1.1rem', margin: 0 }}>💳 Pay Monthly Bill</h2>
            <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>SRMS Platform — March 2026</p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#94a3b8', cursor: 'pointer', borderRadius: 8, width: 32, height: 32, fontSize: 16 }}>✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          {/* Amount */}
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 14, padding: 16, textAlign: 'center' as const, marginBottom: 24 }}>
            <p style={{ color: '#fbbf24', fontWeight: 900, fontSize: '2.5rem', margin: 0, lineHeight: 1 }}>{totalXAF.toLocaleString()} XAF</p>
            <p style={{ color: '#64748b', fontSize: 13, margin: '6px 0 0' }}>≈ ${totalUSD.toFixed(2)} USD · March 2026</p>
          </div>

          {step === 'select' && (
            <>
              <p style={{ color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>🇨🇲 Cameroon Mobile Money</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {METHODS.filter(m => m.phone).map(pm => (
                  <button key={pm.id} onClick={() => setMethod(pm.id)}
                    style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid ' + (method === pm.id ? pm.border : 'rgba(255,255,255,0.08)'), background: method === pm.id ? pm.bg : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: pm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{pm.icon}</div>
                      <div style={{ textAlign: 'left' as const }}>
                        <p style={{ color: method === pm.id ? pm.color : '#e2e8f0', fontWeight: method === pm.id ? 700 : 500, fontSize: 14, margin: 0 }}>{pm.label}</p>
                        <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>{pm.desc}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {pm.popular && <span style={{ background: '#10b981', color: 'white', fontSize: 9, fontWeight: 900, padding: '2px 8px', borderRadius: 100 }}>POPULAR</span>}
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + (method === pm.id ? pm.color : 'rgba(255,255,255,0.2)'), background: method === pm.id ? pm.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {method === pm.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <p style={{ color: '#64748b', fontSize: 12, fontWeight: 700, marginBottom: 10, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>🌍 International Cards</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {METHODS.filter(m => !m.phone).map(pm => (
                  <button key={pm.id} onClick={() => setMethod(pm.id)}
                    style={{ padding: '14px 16px', borderRadius: 12, border: '1px solid ' + (method === pm.id ? pm.border : 'rgba(255,255,255,0.08)'), background: method === pm.id ? pm.bg : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: pm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>{pm.icon}</div>
                      <div style={{ textAlign: 'left' as const }}>
                        <p style={{ color: method === pm.id ? pm.color : '#e2e8f0', fontWeight: method === pm.id ? 700 : 500, fontSize: 14, margin: 0 }}>{pm.label}</p>
                        <p style={{ color: '#475569', fontSize: 11, margin: 0 }}>{pm.desc}</p>
                      </div>
                    </div>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid ' + (method === pm.id ? pm.color : 'rgba(255,255,255,0.2)'), background: method === pm.id ? pm.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {method === pm.id && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white' }} />}
                    </div>
                  </button>
                ))}
              </div>

              {method && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selected?.phone && (
                    <div>
                      <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' as const }}>Phone Number *</label>
                      <input style={inp} placeholder="+237 6XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} />
                      <p style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>You will receive a USSD prompt to confirm payment with your PIN</p>
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 6, textTransform: 'uppercase' as const }}>Email for Receipt</label>
                    <input style={inp} value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
                  <button onClick={() => setStep('confirm')}
                    style={{ background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#0f172a', border: 'none', borderRadius: 10, padding: 14, fontWeight: 800, fontSize: 15, cursor: 'pointer' }}>
                    Continue → {selected?.label}
                  </button>
                </div>
              )}

              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center', gap: 16 }}>
                {['🔐 256-bit SSL', '🛡️ Flutterwave Secured', '✅ PCI Compliant'].map((b, i) => (
                  <span key={i} style={{ color: '#334155', fontSize: 11 }}>{b}</span>
                ))}
              </div>
            </>
          )}

          {step === 'confirm' && (
            <div>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 12 }}>Confirm Payment</p>
                {[
                  ['Amount', `${totalXAF.toLocaleString()} XAF ($${totalUSD.toFixed(2)})`],
                  ['Method', `${selected?.icon} ${selected?.label}`],
                  ...(selected?.phone ? [['Phone', phone]] : []),
                  ['Receipt to', email],
                  ['Invoice', 'March 2026 — SRMS Platform'],
                ].map(([l, v], i, arr) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ color: '#64748b', fontSize: 13 }}>{l}</span>
                    <span style={{ color: 'white', fontSize: 13 }}>{v}</span>
                  </div>
                ))}
              </div>
              {selected?.phone && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: 14, marginBottom: 16 }}>
                  <p style={{ color: '#fbbf24', fontSize: 13, margin: 0 }}>📱 After clicking Pay, check your phone ({phone}) for a USSD prompt. Enter your PIN to confirm.</p>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setStep('select')} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', color: '#64748b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: 13, cursor: 'pointer', fontWeight: 600 }}>← Back</button>
                <button onClick={handlePay} style={{ flex: 2, background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#0f172a', border: 'none', borderRadius: 10, padding: 13, cursor: 'pointer', fontWeight: 800, fontSize: 15 }}>
                  ✅ Confirm & Pay {totalXAF.toLocaleString()} XAF
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div style={{ textAlign: 'center' as const, padding: '32px 0' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>{selected?.icon}</div>
              <h3 style={{ color: 'white', fontWeight: 700, marginBottom: 8 }}>Processing Payment...</h3>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 24 }}>
                {selected?.phone ? 'Check your phone for USSD prompt. Enter your PIN to confirm.' : 'Connecting to payment gateway...'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {[0,1,2].map(j => <div key={j} style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', animation: `bounce 1.2s ${j*0.2}s infinite` }} />)}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center' as const, padding: '16px 0' }}>
              <div style={{ width: 70, height: 70, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', margin: '0 auto 20px' }}>✅</div>
              <h3 style={{ color: '#34d399', fontWeight: 900, fontSize: '1.3rem', marginBottom: 8 }}>Payment Successful!</h3>
              <p style={{ color: '#64748b', fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
                {totalXAF.toLocaleString()} XAF paid via {selected?.label}. Receipt sent to {email}.
              </p>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: 14, marginBottom: 20, textAlign: 'left' as const }}>
                {[
                  ['Transaction ID', txId],
                  ['Amount Paid', `${totalXAF.toLocaleString()} XAF`],
                  ['Method', selected?.label || ''],
                  ['Status', '✅ PAID'],
                  ['Next Bill', 'April 1, 2026'],
                ].map(([l, v], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{l}</span>
                    <span style={{ color: l === 'Status' ? '#34d399' : l === 'Transaction ID' ? '#60a5fa' : 'white', fontSize: 12, fontFamily: l === 'Transaction ID' ? 'monospace' : 'inherit', fontWeight: l === 'Transaction ID' ? 700 : 400 }}>{v}</span>
                  </div>
                ))}
              </div>
              <button onClick={onClose} style={{ width: '100%', background: 'linear-gradient(135deg,#059669,#10b981)', color: 'white', border: 'none', borderRadius: 10, padding: 13, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                Done ✓
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes bounce{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-6px);opacity:1}}`}</style>
    </div>
  );
}