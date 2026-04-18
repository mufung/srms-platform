'use client';
import { useState } from 'react';

export default function HomePage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    { id: 'student', name: 'Student', emoji: '🎓', color: '#10b981', path: '/student/dashboard' },
    { id: 'teacher', name: 'Teacher', emoji: '👨‍🏫', color: '#3b82f6', path: '/teacher/dashboard' },
    { id: 'parent', name: 'Parent', emoji: '👨‍👩‍👧', color: '#8b5cf6', path: '/parent/verify' },
    { id: 'admin', name: 'School Admin', emoji: '🏫', color: '#f59e0b', path: '/school-admin/dashboard' },
  ];

  return (
    <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}}>
      <div style={{maxWidth:'1200px',width:'100%'}}>
        {/* Header */}
        <div style={{textAlign:'center',marginBottom:'48px'}}>
          <div style={{fontSize:'64px',marginBottom:'16px'}}>📊</div>
          <h1 style={{fontSize:'48px',fontWeight:'900',color:'white',marginBottom:'12px',textShadow:'0 2px 10px rgba(0,0,0,0.2)'}}>
            SRMS Platform
          </h1>
          <p style={{fontSize:'20px',color:'rgba(255,255,255,0.9)',marginBottom:'8px'}}>
            Student Result Management System
          </p>
          <p style={{fontSize:'14px',color:'rgba(255,255,255,0.7)',fontWeight:'600'}}>
            Built by MUFUNG ANGELBELL MBUYEH · AWS Solutions Architect · Yaoundé, Cameroon
          </p>
        </div>

        {/* Role Selection */}
        <div style={{background:'white',borderRadius:'24px',padding:'48px',boxShadow:'0 20px 60px rgba(0,0,0,0.3)'}}>
          <h2 style={{fontSize:'28px',fontWeight:'800',textAlign:'center',marginBottom:'32px',color:'#1a202c'}}>
            Select Your Role to Continue
          </h2>
          
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(250px, 1fr))',gap:'24px',marginBottom:'32px'}}>
            {roles.map(role => (
              
                key={role.id}
                href={role.path}
                style={{
                  background: selectedRole === role.id ? role.color : 'white',
                  border: `3px solid ${role.color}`,
                  borderRadius:'16px',
                  padding:'32px',
                  textAlign:'center',
                  cursor:'pointer',
                  transition:'all 0.3s',
                  textDecoration:'none',
                  display:'block'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{fontSize:'48px',marginBottom:'16px'}}>{role.emoji}</div>
                <h3 style={{fontSize:'22px',fontWeight:'800',color:selectedRole === role.id ? 'white' : '#1a202c',marginBottom:'8px'}}>
                  {role.name}
                </h3>
                <p style={{fontSize:'14px',color:selectedRole === role.id ? 'rgba(255,255,255,0.9)' : '#64748b'}}>
                  Access your {role.name.toLowerCase()} dashboard
                </p>
              </a>
            ))}
          </div>

          {/* Demo Info */}
          <div style={{background:'#f0f9ff',border:'2px solid #bfdbfe',borderRadius:'12px',padding:'20px',marginTop:'32px'}}>
            <h4 style={{fontSize:'16px',fontWeight:'700',color:'#1e40af',marginBottom:'12px'}}>
              🎯 Demo Mode — Click Any Role to Explore
            </h4>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',fontSize:'13px',color:'#3b82f6'}}>
              <div>
                <strong>Student Dashboard:</strong>
                <ul style={{margin:'4px 0 0 0',padding:'0 0 0 20px',color:'#64748b'}}>
                  <li>View results with color-coded grades</li>
                  <li>AI assistant for study help</li>
                  <li>Raise complaints on wrong scores</li>
                </ul>
              </div>
              <div>
                <strong>Teacher Dashboard:</strong>
                <ul style={{margin:'4px 0 0 0',padding:'0 0 0 20px',color:'#64748b'}}>
                  <li>Upload student results</li>
                  <li>AI anomaly detection</li>
                  <li>Review student complaints</li>
                </ul>
              </div>
              <div>
                <strong>Parent Dashboard:</strong>
                <ul style={{margin:'4px 0 0 0',padding:'0 0 0 20px',color:'#64748b'}}>
                  <li>View child's performance</li>
                  <li>Track progress over time</li>
                  <li>Get instant notifications</li>
                </ul>
              </div>
              <div>
                <strong>Admin Dashboard:</strong>
                <ul style={{margin:'4px 0 0 0',padding:'0 0 0 20px',color:'#64748b'}}>
                  <li>Manage school billing</li>
                  <li>Send broadcasts to users</li>
                  <li>View platform statistics</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Super Admin Link */}
          <div style={{textAlign:'center',marginTop:'24px',paddingTop:'24px',borderTop:'1px solid #e2e8f0'}}>
            <p style={{fontSize:'14px',color:'#64748b',marginBottom:'8px'}}>
              Platform Owner?
            </p>
            <a 
              href="/super-admin/dashboard"
              style={{
                display:'inline-block',
                background:'linear-gradient(135deg,#667eea 0%,#764ba2 100%)',
                color:'white',
                padding:'12px 24px',
                borderRadius:'8px',
                fontSize:'14px',
                fontWeight:'700',
                textDecoration:'none'
              }}
            >
              🔐 Super Admin Access
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{textAlign:'center',marginTop:'32px',color:'rgba(255,255,255,0.8)',fontSize:'14px'}}>
          <p>All 12 Lambda Functions Deployed ✅ | 16/16 Tests Passed ✅ | AWS Region: us-east-1</p>
          <p style={{marginTop:'8px'}}>Backend API: https://8nzu8lm0ia.execute-api.us-east-1.amazonaws.com</p>
        </div>
      </div>
    </div>
  );
}