// SRMS-3-REGISTER-PAGE-001: School Registration Page
// Owner: MUFUNG ANGELBELL MBUYEH

'use client';

import { useState } from 'react';
import Link from 'next/link';

const SECTIONS_CONFIG = [
  { id: 'section1', name: 'Result Publishing', price: 'Included', desc: 'Upload results, students view, PDF export', required: true },
  { id: 'section2', name: 'Complaint Engine', price: '+$10/month', desc: 'Students raise errors with proof, teacher corrects', required: false },
  { id: 'section3', name: 'Grade Calculator', price: '+$15/month', desc: 'Auto-calculate grades by your school formula', required: false },
  { id: 'section4', name: 'AI Assistant', price: '+$20/month', desc: 'Voice and text AI guidance for all users', required: false },
  { id: 'section5', name: 'Notifications', price: '+$10/month', desc: 'SMS and email alerts for all events', required: false },
  { id: 'section6', name: 'Analytics', price: '+$15/month', desc: 'Performance trends and class insights', required: false },
  { id: 'section7', name: 'Parent Portal', price: '+$10/month', desc: 'Parents access child results via AI verification', required: false },
];

const PLANS = [
  { id: 'starter', name: 'Starter', price: '$15/month', students: 300 },
  { id: 'standard', name: 'Standard', price: '$40/month', students: 1000 },
  { id: 'professional', name: 'Professional', price: '$100/month', students: 5000 },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', students: 'Unlimited' },
];

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState({
    schoolName: '',
    adminEmail: '',
    adminPhone: '',
    country: 'Cameroon',
    plan: 'standard',
    enabledSections: ['section1'],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [tenantId, setTenantId] = useState('');

  const toggleSection = (sectionId: string) => {
    if (sectionId === 'section1') return;
    setForm(prev => ({
      ...prev,
      enabledSections: prev.enabledSections.includes(sectionId)
        ? prev.enabledSections.filter(s => s !== sectionId)
        : [...prev.enabledSections, sectionId],
    }));
  };

  const handleSubmit = async () => {
    setError('');
    if (!form.schoolName || !form.adminEmail || !form.adminPhone) {
      setError('School name, admin email, and phone are required');
      return;
    }

    setLoading(true);
    try {
      const apiBase = process.env.NEXT_PUBLIC_MASTER_API_URL || '';
      const res = await fetch(`${apiBase}/admin/tenants/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error?.message || 'Registration failed. Please try again.');
        return;
      }

      setTenantId(data.data.tenantId);
      setSuccess(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="glass-card p-12 text-center max-w-lg w-full">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="font-heading text-3xl font-bold text-white mb-4">Registration Successful!</h1>
          <p className="text-slate-400 mb-6">
            Your school environment is being set up. This takes about 5-10 minutes.
            Check your email at <strong className="text-white">{form.adminEmail}</strong> for updates.
          </p>
          <div className="glass-card p-4 rounded-xl mb-8">
            <p className="text-slate-500 text-xs mb-1">Your Tenant ID</p>
            <p className="font-mono text-blue-400 text-sm">{tenantId}</p>
          </div>
          <p className="text-slate-500 text-sm">
            Questions? Contact MUFUNG ANGELBELL MBUYEH<br/>
            <a href="mailto:mufungangelbellmbuyeh@gmail.com" className="text-blue-400">mufungangelbellmbuyeh@gmail.com</a><br/>
            <a href="https://wa.me/237671534067" target="_blank" rel="noopener noreferrer" className="text-emerald-400">WhatsApp: +237 671 534 067</a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="p-6 border-b border-white/5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-800 flex items-center justify-center font-bold text-white">S</div>
          <span className="font-heading font-bold text-white">SRMS Platform</span>
        </Link>
        <Link href="/login" className="text-slate-400 hover:text-white text-sm transition-colors">Already have an account?</Link>
      </header>

      <div className="max-w-2xl mx-auto p-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-10">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s ? 'bg-blue-600 text-white' :
                step > s ? 'bg-emerald-500 text-white' :
                'bg-white/10 text-slate-400'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-emerald-500' : 'bg-white/10'}`} style={{ width: '60px' }} />}
            </div>
          ))}
          <div className="ml-4 text-slate-400 text-sm">
            {step === 1 ? 'School Information' : step === 2 ? 'Choose Plan' : 'Choose Sections'}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Step 1 - School Info */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h1 className="font-heading text-3xl font-bold text-white mb-8">Register Your School</h1>

            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">School Name *</label>
              <input className="srms-input" placeholder="e.g. Government Bilingual High School Bamenda"
                value={form.schoolName} onChange={e => setForm(p => ({ ...p, schoolName: e.target.value }))} />
            </div>

            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">Admin Email *</label>
              <input className="srms-input" type="email" placeholder="principal@yourschool.cm"
                value={form.adminEmail} onChange={e => setForm(p => ({ ...p, adminEmail: e.target.value }))} />
            </div>

            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">Admin Phone (with country code) *</label>
              <input className="srms-input" placeholder="+237 671 000 000"
                value={form.adminPhone} onChange={e => setForm(p => ({ ...p, adminPhone: e.target.value }))} />
            </div>

            <div>
              <label className="text-slate-400 text-xs font-medium mb-2 block">Country</label>
              <select className="srms-input" value={form.country}
                onChange={e => setForm(p => ({ ...p, country: e.target.value }))}>
                {['Cameroon', 'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Ethiopia', 'Uganda', 'Senegal', 'Other'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <button className="btn-primary w-full py-4 rounded-xl font-bold mt-6"
              onClick={() => { if (!form.schoolName || !form.adminEmail || !form.adminPhone) { setError('Please fill all required fields'); return; } setError(''); setStep(2); }}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 - Plan */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h1 className="font-heading text-3xl font-bold text-white mb-8">Choose Your Plan</h1>
            <div className="space-y-4">
              {PLANS.map(plan => (
                <button key={plan.id}
                  onClick={() => setForm(p => ({ ...p, plan: plan.id }))}
                  className={`w-full glass-card p-5 text-left border-2 transition-all ${
                    form.plan === plan.id ? 'border-blue-500' : 'border-transparent'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-heading font-bold text-white">{plan.name}</div>
                      <div className="text-slate-400 text-sm">Up to {plan.students} students</div>
                    </div>
                    <div className="text-right">
                      <div className="font-heading text-xl font-black text-amber-400">{plan.price}</div>
                      {form.plan === plan.id && <div className="text-emerald-400 text-xs">✓ Selected</div>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-4 mt-8">
              <button className="flex-1 py-4 rounded-xl border border-white/10 text-slate-300" onClick={() => setStep(1)}>← Back</button>
              <button className="flex-1 btn-primary py-4 rounded-xl font-bold" onClick={() => setStep(3)}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 3 - Sections */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h1 className="font-heading text-3xl font-bold text-white mb-4">Choose Your Modules</h1>
            <p className="text-slate-400 mb-8">Section 1 is always included. Add more sections to unlock more features.</p>

            <div className="space-y-3">
              {SECTIONS_CONFIG.map(section => (
                <button key={section.id}
                  onClick={() => toggleSection(section.id)}
                  className={`w-full glass-card p-5 text-left border transition-all ${
                    form.enabledSections.includes(section.id)
                      ? 'border-blue-500'
                      : 'border-transparent'
                  } ${section.required ? 'opacity-80 cursor-default' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        form.enabledSections.includes(section.id)
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-white/20'
                      }`}>
                        {form.enabledSections.includes(section.id) && <span className="text-white text-xs">✓</span>}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{section.name}</div>
                        <div className="text-slate-500 text-xs">{section.desc}</div>
                      </div>
                    </div>
                    <div className="text-amber-400 text-sm font-medium">{section.price}</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <button className="flex-1 py-4 rounded-xl border border-white/10 text-slate-300" onClick={() => setStep(2)}>← Back</button>
              <button className="flex-1 btn-gold py-4 rounded-xl font-bold"
                onClick={handleSubmit}
                disabled={loading}>
                {loading ? 'Registering...' : 'Register School — 14-Day Free Trial →'}
              </button>
            </div>

            <p className="text-center text-slate-600 text-xs mt-4">
              No credit card required for the free trial. Cancel anytime.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}