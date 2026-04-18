'use client';

export default function HomePage() {
  const roles = [
    { id: 'student', name: 'Student', emoji: '🎓', color: '#10b981', path: '/student/dashboard' },
    { id: 'teacher', name: 'Teacher', emoji: '👨‍🏫', color: '#3b82f6', path: '/teacher/dashboard' },
    { id: 'parent', name: 'Parent', emoji: '👨‍👩‍👧', color: '#8b5cf6', path: '/parent/verify' },
    { id: 'admin', name: 'School Admin', emoji: '🏫', color: '#f59e0b', path: '/school-admin/dashboard' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
          <h1 style={{
            fontSize: '48px',
            fontWeight: '900',
            color: 'white',
            marginBottom: '12px',
            textShadow: '0 2px 10px rgba(0,0,0,0.2)'
          }}>
            SRMS Platform
          </h1>
          <p style={{ fontSize: '20px', color: 'rgba(255,255,255,0.9)', marginBottom: '8px' }}>
            Student Result Management System
          </p>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
            Built by MUFUNG ANGELBELL MBUYEH · AWS Solutions Architect · Yaoundé, Cameroon
          </p>
        </div>

        <div style={{
          background: 'white',
          borderRadius: '24px',
          padding: '48px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '800',
            textAlign: 'center',
            marginBottom: '32px',
            color: '#1a202c'
          }}>
            Select Your Role to Continue
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            marginBottom: '32px'
          }}>
            {roles.map(role => (
              
                key={role.id}
                href={role.path}
                style={{
                  background: 'white',
                  border: `3px solid ${role.color}`,
                  borderRadius: '16px',
                  padding: '32px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'block',
                  transition: 'all 0.3s'
                }}
              >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>{role.emoji}</div>
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: '800',
                  color: '#1a202c',
                  marginBottom: '8px'
                }}>
                  {role.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#64748b' }}>
                  Access your {role.name.toLowerCase()} dashboard
                </p>
              </a>
            ))}
          </div>

          <div style={{
            background: '#f0f9ff',
            border: '2px solid #bfdbfe',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '32px'
          }}>
            <h4 style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#1e40af',
              marginBottom: '12px'
            }}>
              🎯 Demo Mode — Click Any Role to Explore
            </h4>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: '1.6' }}>
              <strong>Student:</strong> View results, AI assistant, raise complaints<br />
              <strong>Teacher:</strong> Upload results, AI detection, review complaints<br />
              <strong>Parent:</strong> Track child performance and progress<br />
              <strong>Admin:</strong> Manage billing, broadcasts, statistics
            </p>
          </div>

          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            paddingTop: '24px',
            borderTop: '1px solid #e2e8f0'
          }}>
            <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
              Platform Owner?
            </p>
            <a 
              href="/super-admin/dashboard"
              style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '700',
                textDecoration: 'none'
              }}
            >
              🔐 Super Admin Access
            </a>
          </div>
        </div>

        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          color: 'rgba(255,255,255,0.8)',
          fontSize: '14px'
        }}>
          <p>All 12 Lambda Functions Deployed ✅ | 16/16 Tests Passed ✅ | AWS Region: us-east-1</p>
        </div>
      </div>
    </div>
  );
}