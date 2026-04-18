'use client';
import { useState } from 'react';

export default function LoginPage() {
  const [srmsId, setSrmsId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Demo login - in production this would call your Cognito API
      await new Promise(r => setTimeout(r, 1000));
      
      // Determine role from SRMS ID
      const role = srmsId.includes('STU') ? 'student' 
                 : srmsId.includes('TCH') ? 'teacher'
                 : srmsId.includes('PAR') ? 'parent'
                 : srmsId.includes('ADM') ? 'school-admin'
                 : srmsId.includes('SAP') ? 'super-admin' : '';

      if (!role) {
        setError('Invalid SRMS ID format');
        setLoading(false);
        return;
      }

      // Redirect to dashboard
      window.location.href = `/${role}/dashboard`;
    } catch (err) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'}}>
      <div style={{background:'white',padding:'48px',borderRadius:'16px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',maxWidth:'400px',width:'100%'}}>
        <h1 style={{fontSize:'32px',fontWeight:'800',marginBottom:'8px',color:'#1a202c'}}>Welcome Back</h1>
        <p style={{color:'#64748b',marginBottom:'32px'}}>Sign in to SRMS Platform</p>
        
        {error && (
          <div style={{background:'#fee2e2',border:'1px solid #fecaca',color:'#dc2626',padding:'12px',borderRadius:'8px',marginBottom:'16px',fontSize:'14px'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="SRMS ID (e.g. CM-GBHS-2026-STU-0042)" 
            value={srmsId}
            onChange={(e) => setSrmsId(e.target.value)}
            required
            style={{width:'100%',padding:'14px',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'15px',marginBottom:'16px'}} 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{width:'100%',padding:'14px',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'15px',marginBottom:'24px'}} 
          />
          <button 
            type="submit"
            disabled={loading}
            style={{width:'100%',background:loading?'#9ca3af':'#667eea',color:'white',padding:'14px',borderRadius:'8px',fontSize:'16px',fontWeight:'700',border:'none',cursor:loading?'not-allowed':'pointer'}}>
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div style={{marginTop:'24px',padding:'12px',background:'#f0f9ff',border:'1px solid #bfdbfe',borderRadius:'8px'}}>
          <p style={{fontSize:'13px',color:'#1e40af',fontWeight:'600',marginBottom:'8px'}}>Demo Credentials:</p>
          <p style={{fontSize:'12px',color:'#3b82f6',fontFamily:'monospace'}}>Student: CM-GBHS-2026-STU-0042</p>
          <p style={{fontSize:'12px',color:'#3b82f6',fontFamily:'monospace'}}>Teacher: CM-GBHS-2026-TCH-0001</p>
          <p style={{fontSize:'12px',color:'#3b82f6',fontFamily:'monospace'}}>Admin: CM-GBHS-2026-ADM-0001</p>
          <p style={{fontSize:'12px',color:'#64748b',marginTop:'8px'}}>Password: any text</p>
        </div>

        <p style={{textAlign:'center',marginTop:'24px',color:'#64748b',fontSize:'14px'}}>
          Don't have an account? <a href="/register" style={{color:'#667eea',fontWeight:'600'}}>Register</a>
        </p>
      </div>
    </div>
  );
}