'use client';
import { useState } from 'react';

export default function RegisterPage() {
  const [schoolName, setSchoolName] = useState('');
  const [email, setEmail] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise(r => setTimeout(r, 1500));
      setSuccess(true);
    } catch (err) {
      alert('Registration failed');
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)'}}>
        <div style={{background:'white',padding:'48px',borderRadius:'16px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',maxWidth:'500px',width:'100%',textAlign:'center'}}>
          <div style={{fontSize:'64px',marginBottom:'16px'}}>✅</div>
          <h1 style={{fontSize:'28px',fontWeight:'800',marginBottom:'16px',color:'#1a202c'}}>Registration Successful!</h1>
          <p style={{color:'#64748b',marginBottom:'24px',lineHeight:'1.6'}}>
            Your school <strong>{schoolName}</strong> has been registered successfully. 
            Check your email at <strong>{email}</strong> for your admin credentials.
          </p>
          <a href="/login" style={{display:'inline-block',background:'#f5576c',color:'white',padding:'14px 32px',borderRadius:'8px',fontSize:'16px',fontWeight:'700',textDecoration:'none'}}>
            Go to Login →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)'}}>
      <div style={{background:'white',padding:'48px',borderRadius:'16px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',maxWidth:'400px',width:'100%'}}>
        <h1 style={{fontSize:'32px',fontWeight:'800',marginBottom:'8px',color:'#1a202c'}}>Register School</h1>
        <p style={{color:'#64748b',marginBottom:'32px'}}>Create your SRMS account</p>
        
        <form onSubmit={handleRegister}>
          <input 
            type="text" 
            placeholder="School Name (e.g. GBHS Bamenda)" 
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
            style={{width:'100%',padding:'14px',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'15px',marginBottom:'16px'}} 
          />
          <input 
            type="email" 
            placeholder="Admin Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{width:'100%',padding:'14px',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'15px',marginBottom:'16px'}} 
          />
          <input 
            type="text" 
            placeholder="School Short Code (e.g. GBHS)" 
            value={shortCode}
            onChange={(e) => setShortCode(e.target.value.toUpperCase())}
            required
            maxLength={8}
            style={{width:'100%',padding:'14px',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'15px',marginBottom:'24px',textTransform:'uppercase'}} 
          />
          <button 
            type="submit"
            disabled={loading}
            style={{width:'100%',background:loading?'#9ca3af':'#f5576c',color:'white',padding:'14px',borderRadius:'8px',fontSize:'16px',fontWeight:'700',border:'none',cursor:loading?'not-allowed':'pointer'}}>
            {loading ? 'Registering...' : 'Register School →'}
          </button>
        </form>

        <p style={{textAlign:'center',marginTop:'24px',color:'#64748b',fontSize:'14px'}}>
          Already have an account? <a href="/login" style={{color:'#f5576c',fontWeight:'600'}}>Sign In</a>
        </p>
      </div>
    </div>
  );
}