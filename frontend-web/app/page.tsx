export default function Home() {
  return (
    <main style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ maxWidth: '1000px', width: '100%', background: 'white', borderRadius: '24px', padding: '48px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📊</h1>
          <h2 style={{ fontSize: '36px', fontWeight: '800', margin: '0 0 8px 0', color: '#1a202c' }}>SRMS Platform</h2>
          <p style={{ fontSize: '16px', color: '#64748b', margin: 0 }}>Student Result Management System</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '8px' }}>Built by MUFUNG ANGELBELL MBUYEH · AWS Solutions Architect</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <a href="/student/dashboard" style={{ textDecoration: 'none', background: 'white', border: '3px solid #10b981', borderRadius: '16px', padding: '24px', textAlign: 'center', display: 'block' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎓</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1a202c', margin: '0 0 8px 0' }}>Student</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>View results and grades</p>
          </a>

          <a href="/teacher/dashboard" style={{ textDecoration: 'none', background: 'white', border: '3px solid #3b82f6', borderRadius: '16px', padding: '24px', textAlign: 'center', display: 'block' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👨‍🏫</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1a202c', margin: '0 0 8px 0' }}>Teacher</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Upload and manage results</p>
          </a>

          <a href="/parent/verify" style={{ textDecoration: 'none', background: 'white', border: '3px solid #8b5cf6', borderRadius: '16px', padding: '24px', textAlign: 'center', display: 'block' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👨‍👩‍👧</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1a202c', margin: '0 0 8px 0' }}>Parent</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Track child performance</p>
          </a>

          <a href="/school-admin/dashboard" style={{ textDecoration: 'none', background: 'white', border: '3px solid #f59e0b', borderRadius: '16px', padding: '24px', textAlign: 'center', display: 'block' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏫</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1a202c', margin: '0 0 8px 0' }}>School Admin</h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Manage school platform</p>
          </a>
        </div>

        <div style={{ textAlign: 'center', paddingTop: '24px', borderTop: '1px solid #e2e8f0' }}>
          <a href="/super-admin/dashboard" style={{ display: 'inline-block', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: '700', textDecoration: 'none' }}>
            🔐 Super Admin Access
          </a>
        </div>

        <div style={{ marginTop: '32px', background: '#f0f9ff', border: '2px solid #bfdbfe', borderRadius: '12px', padding: '16px' }}>
          <p style={{ fontSize: '13px', color: '#1e40af', margin: '0', textAlign: 'center', fontWeight: '600' }}>
            ✅ All 12 Lambda Functions Deployed | 16/16 Tests Passed | AWS us-east-1
          </p>
        </div>
      </div>
    </main>
  );
}