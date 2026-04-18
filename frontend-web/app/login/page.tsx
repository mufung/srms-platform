'use client';
export default function LoginPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)'}}>
      <div style={{background:'white',padding:'48px',borderRadius:'16px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',maxWidth:'400px',width:'100%'}}>
        <h1 style={{fontSize:'32px',fontWeight:'800',marginBottom:'8px',color:'#1a202c'}}>Welcome Back</h1>
        <p style={{color:'#64748b',marginBottom:'32px'}}>Sign in to SRMS Platform</p>
        <input type="text" placeholder="SRMS ID (e.g. CM-GBHS-2026-STU-0042)" style={{width:'100%',padding:'14px',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'15px',marginBottom:'16px'}} />
        <input type="password" placeholder="Password" style={{width:'100%',padding:'14px',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'15px',marginBottom:'24px'}} />
        <button style={{width:'100%',background:'#667eea',color:'white',padding:'14px',borderRadius:'8px',fontSize:'16px',fontWeight:'700',border:'none',cursor:'pointer'}}>Sign In →</button>
        <p style={{textAlign:'center',marginTop:'24px',color:'#64748b',fontSize:'14px'}}>
          Don't have an account? <a href="/register" style={{color:'#667eea',fontWeight:'600'}}>Register</a>
        </p>
      </div>
    </div>
  );
}