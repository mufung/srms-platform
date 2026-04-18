   'use client';
export default function RegisterPage() {
  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#f093fb 0%,#f5576c 100%)'}}>
      <div style={{background:'white',padding:'48px',borderRadius:'16px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',maxWidth:'400px',width:'100%'}}>
        <h1 style={{fontSize:'32px',fontWeight:'800',marginBottom:'8px',color:'#1a202c'}}>Register School</h1>
        <p style={{color:'#64748b',marginBottom:'32px'}}>Create your SRMS account</p>
        <input type="text" placeholder="School Name" style={{width:'100%',padding:'14px',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'15px',marginBottom:'16px'}} />
        <input type="email" placeholder="Admin Email" style={{width:'100%',padding:'14px',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'15px',marginBottom:'16px'}} />
        <input type="text" placeholder="School Short Code (e.g. GBHS)" style={{width:'100%',padding:'14px',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'15px',marginBottom:'16px'}} />
        <button style={{width:'100%',background:'#f5576c',color:'white',padding:'14px',borderRadius:'8px',fontSize:'16px',fontWeight:'700',border:'none',cursor:'pointer'}}>Register School →</button>
        <p style={{textAlign:'center',marginTop:'24px',color:'#64748b',fontSize:'14px'}}>
          Already have an account? <a href="/login" style={{color:'#f5576c',fontWeight:'600'}}>Sign In</a>
        </p>
      </div>
    </div>
  );
}