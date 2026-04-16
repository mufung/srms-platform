import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity,
  ScrollView, TextInput, ActivityIndicator,
  Alert, SafeAreaView, Platform, Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const API = 'https://8nzu8lm0ia.execute-api.us-east-1.amazonaws.com';

const C = {
  bg: '#080f20',
  card: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.1)',
  text: '#e2e8f0',
  muted: '#64748b',
  blue: '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  purple: '#8b5cf6',
  indigo: '#6366f1',
};

const gradeColor = (g) => {
  if (g === 'A') return C.green;
  if (g === 'B') return C.blue;
  if (g === 'C') return C.purple;
  if (g === 'D') return C.amber;
  return C.red;
};

// ============================================================
// HEADER COMPONENT — Fixed so Sign Out never overlaps
// ============================================================
function Header({ emoji, title, subtitle, subtitleColor, onLogout }) {
  return (
    <View style={{
      backgroundColor: 'rgba(8,15,32,0.99)',
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      paddingTop: Platform.OS === 'android' ? 40 : 16,
      paddingHorizontal: 20,
      paddingBottom: 14,
    }}>
      {/* Top row: icon + title + sign out */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{
          width: 38, height: 38, borderRadius: 10,
          backgroundColor: subtitleColor + '22',
          alignItems: 'center', justifyContent: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 20 }}>{emoji}</Text>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 16 }}>{title}</Text>
          <Text style={{
            color: subtitleColor || C.blue,
            fontSize: 11, marginTop: 1,
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          }}>{subtitle}</Text>
        </View>

        <TouchableOpacity
          onPress={onLogout}
          style={{
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 8, paddingHorizontal: 14,
            paddingVertical: 8,
            borderWidth: 1, borderColor: C.border,
            marginLeft: 12,
          }}>
          <Text style={{ color: C.muted, fontSize: 13, fontWeight: '600' }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// TAB BAR
// ============================================================
function TabBar({ tabs, active, onSelect }) {
  return (
    <View style={{
      flexDirection: 'row',
      paddingHorizontal: 16, paddingVertical: 10,
      gap: 8,
      backgroundColor: 'rgba(8,15,32,0.95)',
      borderBottomWidth: 1, borderBottomColor: C.border,
    }}>
      {tabs.map(t => (
        <TouchableOpacity
          key={t}
          onPress={() => onSelect(t)}
          style={{
            flex: 1, paddingVertical: 10, borderRadius: 10,
            alignItems: 'center', borderWidth: 1,
            backgroundColor: active === t ? C.blue : C.card,
            borderColor: active === t ? C.blue : C.border,
          }}>
          <Text style={{
            fontWeight: '700', fontSize: 12,
            color: active === t ? 'white' : C.muted,
            textTransform: 'capitalize',
          }}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ============================================================
// STAT ROW
// ============================================================
function StatRow({ items }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
      {items.map((item, i) => (
        <View key={i} style={{
          flex: 1, backgroundColor: C.card, borderRadius: 14,
          padding: 14, alignItems: 'center',
          borderWidth: 1, borderColor: C.border,
        }}>
          {item.icon ? <Text style={{ fontSize: 22, marginBottom: 4 }}>{item.icon}</Text> : null}
          <Text style={{ color: item.color || 'white', fontWeight: '900', fontSize: 20 }}>{item.value}</Text>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 3, textAlign: 'center' }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

function SLabel({ text }) {
  return (
    <Text style={{
      color: C.muted, fontSize: 11, fontWeight: '700',
      letterSpacing: 1, marginBottom: 12,
      textTransform: 'uppercase',
    }}>{text}</Text>
  );
}

function Card({ children, style }) {
  return (
    <View style={[{
      backgroundColor: C.card, borderRadius: 14,
      padding: 16, marginBottom: 12,
      borderWidth: 1, borderColor: C.border,
    }, style]}>
      {children}
    </View>
  );
}

// ============================================================
// LOGIN SCREEN
// ============================================================
function LoginScreen({ onLogin }) {
  const [role, setRole] = useState('student');
  const [srmsId, setSrmsId] = useState('CM-GBHS-2026-STU-0042');
  const [loading, setLoading] = useState(false);

  const ROLES = [
    { id: 'student', emoji: '🎓', label: 'Student', color: C.green, prefix: 'STU' },
    { id: 'teacher', emoji: '👨‍🏫', label: 'Teacher', color: C.blue, prefix: 'TCH' },
    { id: 'parent', emoji: '👨‍👩‍👧', label: 'Parent', color: C.purple, prefix: 'PAR' },
    { id: 'admin', emoji: '🏫', label: 'Admin', color: C.amber, prefix: 'ADM' },
  ];

  const handleLogin = async () => {
    if (!srmsId.trim()) { Alert.alert('Error', 'Enter your SRMS ID'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 900));
    setLoading(false);
    onLogin({ role, srmsId, name: 'Tabe Collins Mbuye' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}
        showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={{ alignItems: 'center', marginBottom: 44 }}>
          <View style={{
            width: 88, height: 88, borderRadius: 26,
            backgroundColor: C.blue, alignItems: 'center',
            justifyContent: 'center', marginBottom: 20,
          }}>
            <Text style={{ fontSize: 44 }}>📊</Text>
          </View>
          <Text style={{ color: 'white', fontSize: 30, fontWeight: '900', marginBottom: 6 }}>SRMS Platform</Text>
          <Text style={{ color: C.muted, fontSize: 14, marginBottom: 12 }}>Student Result Management System</Text>
          <View style={{
            backgroundColor: 'rgba(59,130,246,0.15)', borderRadius: 100,
            paddingHorizontal: 16, paddingVertical: 6,
            borderWidth: 1, borderColor: 'rgba(59,130,246,0.3)',
          }}>
            <Text style={{ color: C.blue, fontSize: 12, fontWeight: '600' }}>
              MUFUNG ANGELBELL MBUYEH · AWS
            </Text>
          </View>
        </View>

        {/* Role picker */}
        <SLabel text="Select Your Role" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 }}>
          {ROLES.map(r => (
            <TouchableOpacity
              key={r.id}
              onPress={() => {
                setRole(r.id);
                setSrmsId(`CM-GBHS-2026-${r.prefix}-0042`);
              }}
              style={{
                width: (width - 60) / 2,
                paddingVertical: 20, paddingHorizontal: 12,
                borderRadius: 16, borderWidth: 2,
                borderColor: role === r.id ? r.color : C.border,
                backgroundColor: role === r.id ? r.color + '18' : C.card,
                alignItems: 'center',
              }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>{r.emoji}</Text>
              <Text style={{
                color: role === r.id ? r.color : C.text,
                fontWeight: '800', fontSize: 15,
              }}>{r.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ID Input */}
        <SLabel text="Your SRMS ID" />
        <TextInput
          value={srmsId}
          onChangeText={setSrmsId}
          placeholder="CM-SCHOOLCODE-YEAR-ROLE-XXXX"
          placeholderTextColor={C.muted}
          autoCapitalize="characters"
          style={{
            backgroundColor: C.card, borderWidth: 1.5,
            borderColor: C.border, borderRadius: 14,
            paddingHorizontal: 18, paddingVertical: 18,
            color: 'white', fontSize: 15,
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
            marginBottom: 20, letterSpacing: 1,
          }}
        />

        {/* Login button */}
        <TouchableOpacity
          onPress={handleLogin}
          disabled={loading}
          style={{
            backgroundColor: C.blue, borderRadius: 14,
            paddingVertical: 18, alignItems: 'center',
          }}>
          {loading
            ? <ActivityIndicator color="white" size="small" />
            : <Text style={{ color: 'white', fontWeight: '900', fontSize: 17 }}>Sign In →</Text>
          }
        </TouchableOpacity>

        <Text style={{
          color: C.muted, fontSize: 12, textAlign: 'center',
          marginTop: 24, lineHeight: 20,
        }}>
          Demo mode · Use any SRMS ID format{'\n'}
          Built on Amazon Web Services · Yaoundé, Cameroon
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// STUDENT DASHBOARD
// ============================================================
function StudentDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('results');

  const RESULTS = [
    { subject: 'Mathematics', score: 78, grade: 'B', position: 5, remarks: 'Very good performance' },
    { subject: 'English Language', score: 85, grade: 'A', position: 2, remarks: 'Outstanding work!' },
    { subject: 'Physics', score: 45, grade: 'F', position: 38, remarks: 'Needs improvement' },
    { subject: 'Chemistry', score: 62, grade: 'C', position: 14, remarks: 'Satisfactory' },
    { subject: 'Biology', score: 71, grade: 'B', position: 8, remarks: 'Good understanding' },
    { subject: 'History', score: 88, grade: 'A', position: 1, remarks: 'Top of the class!' },
    { subject: 'Computer Science', score: 92, grade: 'A', position: 1, remarks: 'Exceptional skills!' },
    { subject: 'Geography', score: 55, grade: 'D', position: 22, remarks: 'Borderline pass' },
  ];

  const NOTIFS = [
    { icon: '📊', title: 'Results Published — Mathematics', time: '30 min ago', read: false },
    { icon: '✅', title: 'Complaint Resolved — Physics', time: '2 hours ago', read: false },
    { icon: '📢', title: 'End of Term Announcement', time: '5 hours ago', read: true },
    { icon: '📊', title: 'Results Published — English', time: '2 days ago', read: true },
    { icon: '📢', title: 'Welcome to SRMS Platform', time: '14 days ago', read: true },
  ];

  const avg = Math.round(RESULTS.reduce((s, r) => s + r.score, 0) / RESULTS.length);
  const ogGrade = avg >= 80 ? 'A' : avg >= 70 ? 'B' : avg >= 60 ? 'C' : avg >= 50 ? 'D' : 'F';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <Header
        emoji="🎓" title="Student Portal"
        subtitle={user.srmsId} subtitleColor={C.green}
        onLogout={onLogout}
      />
      <TabBar tabs={['results', 'notifications', 'complaints']} active={tab} onSelect={setTab} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* RESULTS TAB */}
        {tab === 'results' && (
          <>
            <StatRow items={[
              { label: 'Overall', value: ogGrade, color: gradeColor(ogGrade) },
              { label: 'Average', value: avg + '%', color: gradeColor(ogGrade) },
              { label: 'Subjects', value: '8', color: C.blue },
            ]} />

            <View style={{
              backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 12,
              padding: 14, marginBottom: 20,
              borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
            }}>
              <Text style={{ color: C.blue, fontSize: 13, lineHeight: 20 }}>
                ℹ️ Demo Mode — First Term 2026 · GBHS Bamenda
              </Text>
            </View>

            <SLabel text="First Term 2026 — All Subjects" />

            {RESULTS.map((r, i) => (
              <View key={i} style={{
                backgroundColor: C.card, borderRadius: 14,
                padding: 16, marginBottom: 12,
                borderWidth: 1, borderColor: C.border,
                borderLeftWidth: 4, borderLeftColor: gradeColor(r.grade),
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 15, flex: 1, marginRight: 8 }}>{r.subject}</Text>
                  <Text style={{ color: gradeColor(r.grade), fontWeight: '900', fontSize: 28, marginRight: 8 }}>{r.grade}</Text>
                  <Text style={{ color: gradeColor(r.grade), fontWeight: '700', fontSize: 16 }}>{r.score}%</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 100, height: 6, marginBottom: 8 }}>
                  <View style={{ backgroundColor: gradeColor(r.grade), borderRadius: 100, height: '100%', width: r.score + '%' }} />
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: C.muted, fontSize: 12 }}>Position #{r.position}</Text>
                  <Text style={{ color: C.muted, fontSize: 12, fontStyle: 'italic' }}>{r.remarks}</Text>
                </View>
              </View>
            ))}

            <View style={{
              backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: 14,
              padding: 16, borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.25)', marginTop: 4,
            }}>
              <Text style={{ color: C.red, fontWeight: '800', fontSize: 14, marginBottom: 6 }}>⚠️ Action Required — Physics</Text>
              <Text style={{ color: C.muted, fontSize: 13, lineHeight: 20 }}>
                Your Physics score of 45% is grade F. If you believe this is wrong, go to the Complaints tab to raise a dispute.
              </Text>
            </View>
          </>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === 'notifications' && (
          <>
            <StatRow items={[
              { label: 'Total', value: String(NOTIFS.length), icon: '🔔', color: C.blue },
              { label: 'Unread', value: String(NOTIFS.filter(n => !n.read).length), icon: '📬', color: C.amber },
            ]} />
            <SLabel text="Recent Notifications" />
            {NOTIFS.map((n, i) => (
              <View key={i} style={{
                backgroundColor: n.read ? C.card : 'rgba(59,130,246,0.1)',
                borderRadius: 14, padding: 16, marginBottom: 12,
                borderWidth: 1,
                borderColor: n.read ? C.border : 'rgba(59,130,246,0.3)',
                flexDirection: 'row', alignItems: 'flex-start', gap: 14,
              }}>
                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Text style={{ fontSize: 22 }}>{n.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{
                    color: n.read ? C.muted : 'white',
                    fontWeight: n.read ? '400' : '700',
                    fontSize: 14, lineHeight: 20, marginBottom: 4,
                  }}>{n.title}</Text>
                  <Text style={{ color: C.muted, fontSize: 12 }}>{n.time}</Text>
                </View>
                {!n.read && (
                  <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.blue, marginTop: 6, flexShrink: 0 }} />
                )}
              </View>
            ))}
          </>
        )}

        {/* COMPLAINTS TAB */}
        {tab === 'complaints' && (
          <>
            <Card style={{ backgroundColor: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.25)', marginBottom: 20 }}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginBottom: 10 }}>⚖️ How to Raise a Complaint</Text>
              {[
                'Select the subject with a wrong score',
                'Enter the score you believe is correct',
                'Upload a photo of your exam paper as proof',
                'Write a clear description of the error',
                'Submit — receive a Complaint ID',
                'Teacher reviews within 2-5 business days',
              ].map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.indigo, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 12 }}>{i + 1}</Text>
                  </View>
                  <Text style={{ color: C.text, fontSize: 14, flex: 1, lineHeight: 22, paddingTop: 3 }}>{step}</Text>
                </View>
              ))}
            </Card>

            <SLabel text="Subjects You Can Dispute" />
            {[
              { subject: 'Physics', score: 45, grade: 'F', note: 'Score looks unusually low' },
              { subject: 'Geography', score: 55, grade: 'D', note: 'Borderline — verify marks' },
              { subject: 'Chemistry', score: 62, grade: 'C', note: 'Check your calculation marks' },
            ].map((item, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => Alert.alert(
                  'Raise Complaint',
                  `To dispute your ${item.subject} score of ${item.score}%, use the web platform at:\n\nlocalhost:3000/student/complaints/new\n\nFull photo upload and submission available there.`
                )}
                style={{
                  backgroundColor: C.card, borderRadius: 14,
                  padding: 16, marginBottom: 12,
                  borderWidth: 1, borderColor: C.border,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>{item.subject}</Text>
                  <Text style={{ color: gradeColor(item.grade), fontWeight: '700', fontSize: 13, marginTop: 4 }}>
                    Score: {item.score}% — Grade {item.grade}
                  </Text>
                  <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{item.note}</Text>
                </View>
                <Text style={{ fontSize: 28 }}>⚖️</Text>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// TEACHER DASHBOARD
// ============================================================
function TeacherDashboard({ user, onLogout }) {
  const [tab, setTab] = useState('classes');

  const CLASSES = [
    { name: 'Form 5 Science A', subject: 'Mathematics', students: 42, published: true, avg: 71 },
    { name: 'Form 4 Arts B', subject: 'History', students: 38, published: false, avg: 68 },
    { name: 'Form 3 General', subject: 'Mathematics', students: 45, published: true, avg: 65 },
  ];

  const COMPLAINTS = [
    { id: 'CMP-SRMS-ABC123', student: 'Tabe Collins Mbuye', subject: 'Physics', status: 'pending', time: '2 hours ago', desc: 'Claims score should be 72 not 45' },
    { id: 'CMP-SRMS-DEF456', student: 'Alice Bih Nkeng', subject: 'Mathematics', status: 'reviewing', time: '1 day ago', desc: 'Claims calculation error on Q3' },
    { id: 'CMP-SRMS-GHI789', student: 'Bob Ngwa Tangem', subject: 'Chemistry', status: 'pending', time: '2 days ago', desc: 'Missing marks for practical section' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <Header
        emoji="👨‍🏫" title="Teacher Portal"
        subtitle={user.srmsId} subtitleColor={C.blue}
        onLogout={onLogout}
      />
      <TabBar tabs={['classes', 'complaints', 'ai']} active={tab} onSelect={setTab} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* CLASSES */}
        {tab === 'classes' && (
          <>
            <StatRow items={[
              { label: 'My Classes', value: String(CLASSES.length), icon: '📚', color: C.blue },
              { label: 'Published', value: String(CLASSES.filter(c => c.published).length), icon: '✅', color: C.green },
              { label: 'Draft', value: String(CLASSES.filter(c => !c.published).length), icon: '⏳', color: C.amber },
            ]} />
            <SLabel text="My Classes — First Term 2026" />
            {CLASSES.map((cls, i) => (
              <Card key={i} style={{ borderLeftWidth: 4, borderLeftColor: cls.published ? C.green : C.amber }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 16, marginBottom: 4 }}>{cls.name}</Text>
                    <Text style={{ color: C.muted, fontSize: 13 }}>{cls.subject} · {cls.students} students</Text>
                  </View>
                  <View style={{
                    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                    backgroundColor: cls.published ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                  }}>
                    <Text style={{ color: cls.published ? C.green : C.amber, fontSize: 12, fontWeight: '700' }}>
                      {cls.published ? '✅ Published' : '⏳ Draft'}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 100, height: 6, marginBottom: 6 }}>
                  <View style={{ backgroundColor: cls.avg >= 70 ? C.green : C.amber, borderRadius: 100, height: '100%', width: cls.avg + '%' }} />
                </View>
                <Text style={{ color: C.muted, fontSize: 12, marginBottom: cls.published ? 0 : 14 }}>
                  Class average: {cls.avg}% · {cls.avg >= 70 ? 'Good performance' : 'Needs attention'}
                </Text>
                {!cls.published && (
                  <TouchableOpacity
                    onPress={() => Alert.alert('AI Check', 'Before publishing, run AI Anomaly Detection on the web platform:\n\nlocalhost:3000/teacher/ai\n\nThis catches data entry errors before students see results.')}
                    style={{ backgroundColor: C.blue, borderRadius: 10, paddingVertical: 14, alignItems: 'center' }}>
                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 14 }}>🤖 Run AI Check & Publish →</Text>
                  </TouchableOpacity>
                )}
              </Card>
            ))}
          </>
        )}

        {/* COMPLAINTS */}
        {tab === 'complaints' && (
          <>
            <StatRow items={[
              { label: 'Total', value: String(COMPLAINTS.length), icon: '⚖️', color: C.amber },
              { label: 'Pending', value: String(COMPLAINTS.filter(c => c.status === 'pending').length), icon: '⏳', color: C.red },
              { label: 'Reviewing', value: String(COMPLAINTS.filter(c => c.status === 'reviewing').length), icon: '🔵', color: C.blue },
            ]} />
            <SLabel text="Complaint Inbox" />
            {COMPLAINTS.map((c, i) => (
              <Card key={i}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ color: 'white', fontWeight: '800', fontSize: 15, flex: 1, marginRight: 10 }}>{c.student}</Text>
                  <View style={{
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                    backgroundColor: c.status === 'pending' ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                  }}>
                    <Text style={{ color: c.status === 'pending' ? C.amber : C.blue, fontSize: 12, fontWeight: '700' }}>
                      {c.status === 'pending' ? '⏳ Pending' : '🔵 Reviewing'}
                    </Text>
                  </View>
                </View>
                <Text style={{ color: C.muted, fontSize: 13, marginBottom: 6 }}>📚 Subject: {c.subject}</Text>
                <Text style={{ color: C.text, fontSize: 14, marginBottom: 8, lineHeight: 20 }}>{c.desc}</Text>
                <Text style={{
                  color: C.muted, fontSize: 11, marginBottom: 14,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                }}>{c.id} · {c.time}</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Resolve Complaint', 'Use the web platform to review evidence and respond:\n\nlocalhost:3000/teacher/complaints/inbox')}
                    style={{
                      flex: 1, backgroundColor: 'rgba(16,185,129,0.15)',
                      borderRadius: 10, paddingVertical: 12, alignItems: 'center',
                      borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
                    }}>
                    <Text style={{ color: C.green, fontWeight: '700' }}>✅ Resolve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => Alert.alert('Reject Complaint', 'Use the web platform to reject with a written reason:\n\nlocalhost:3000/teacher/complaints/inbox')}
                    style={{
                      flex: 1, backgroundColor: 'rgba(239,68,68,0.15)',
                      borderRadius: 10, paddingVertical: 12, alignItems: 'center',
                      borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
                    }}>
                    <Text style={{ color: C.red, fontWeight: '700' }}>❌ Reject</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* AI TAB */}
        {tab === 'ai' && (
          <>
            <Card style={{ backgroundColor: 'rgba(99,102,241,0.08)', borderColor: 'rgba(99,102,241,0.25)', marginBottom: 20 }}>
              <Text style={{ color: '#a5b4fc', fontWeight: '800', fontSize: 17, marginBottom: 8 }}>🤖 AI Anomaly Detector</Text>
              <Text style={{ color: C.muted, fontSize: 14, lineHeight: 22, marginBottom: 18 }}>
                Before publishing results, run AI analysis to catch data entry errors. Powered by Amazon Bedrock Claude.
              </Text>
              <TouchableOpacity
                onPress={() => Alert.alert('AI Anomaly Detector', 'Full AI tool available at:\n\nlocalhost:3000/teacher/ai\n\nEnter all student scores and Amazon Bedrock will analyse for suspicious patterns before you publish.')}
                style={{ backgroundColor: C.indigo, borderRadius: 12, paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ color: 'white', fontWeight: '800', fontSize: 15 }}>🤖 Open AI Detector on Web →</Text>
              </TouchableOpacity>
            </Card>

            <SLabel text="How AI Helps Teachers" />
            {[
              { icon: '🔍', title: 'Anomaly Detection', desc: 'AI flags scores unusually far below class average — likely data entry errors' },
              { icon: '📊', title: 'Class Analysis', desc: 'Full performance report with recommendations before publishing' },
              { icon: '⚠️', title: 'Error Prevention', desc: 'Catch mistakes before students see wrong results' },
              { icon: '✅', title: 'Safe to Publish', desc: 'AI confirms when all scores look normal and results are ready' },
            ].map((item, i) => (
              <Card key={i} style={{ flexDirection: 'row', gap: 14 }}>
                <Text style={{ fontSize: 30 }}>{item.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: '700', fontSize: 15, marginBottom: 4 }}>{item.title}</Text>
                  <Text style={{ color: C.muted, fontSize: 13, lineHeight: 20 }}>{item.desc}</Text>
                </View>
              </Card>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// PARENT DASHBOARD
// ============================================================
function ParentDashboard({ user, onLogout }) {
  const CHILD = {
    name: 'Tabe Collins Mbuye',
    studentId: 'CM-GBHS-2026-STU-0042',
    class: 'Form 5 Science A',
    school: 'GBHS Bamenda',
    avg: 74, grade: 'B', position: 5, total: 42,
  };

  const RESULTS = [
    { subject: 'Mathematics', grade: 'B', score: 78 },
    { subject: 'English Language', grade: 'A', score: 85 },
    { subject: 'Physics', grade: 'F', score: 45 },
    { subject: 'Chemistry', grade: 'C', score: 62 },
    { subject: 'Biology', grade: 'B', score: 71 },
    { subject: 'History', grade: 'A', score: 88 },
    { subject: 'Computer Science', grade: 'A', score: 92 },
    { subject: 'Geography', grade: 'D', score: 55 },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <Header
        emoji="👨‍👩‍👧" title="Parent Portal"
        subtitle={user.srmsId} subtitleColor={C.purple}
        onLogout={onLogout}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Child card */}
        <View style={{
          backgroundColor: 'rgba(139,92,246,0.1)', borderRadius: 18,
          padding: 20, borderWidth: 1.5,
          borderColor: 'rgba(139,92,246,0.3)', marginBottom: 24,
        }}>
          <Text style={{ color: C.purple, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Your Child</Text>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 22, marginBottom: 4 }}>{CHILD.name}</Text>
          <Text style={{ color: C.muted, fontSize: 14, marginBottom: 4 }}>{CHILD.class} · {CHILD.school}</Text>
          <Text style={{
            color: C.muted, fontSize: 11, marginBottom: 20,
            fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
          }}>{CHILD.studentId}</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              { label: 'Grade', value: CHILD.grade, color: gradeColor(CHILD.grade) },
              { label: 'Average', value: CHILD.avg + '%', color: gradeColor(CHILD.grade) },
              { label: 'Position', value: '#' + CHILD.position + '/' + CHILD.total, color: C.amber },
            ].map((stat, i) => (
              <View key={i} style={{
                flex: 1, backgroundColor: 'rgba(255,255,255,0.07)',
                borderRadius: 12, padding: 12, alignItems: 'center',
              }}>
                <Text style={{ color: stat.color, fontWeight: '900', fontSize: 20 }}>{stat.value}</Text>
                <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Alert */}
        <View style={{
          backgroundColor: 'rgba(239,68,68,0.09)', borderRadius: 14,
          padding: 16, borderWidth: 1,
          borderColor: 'rgba(239,68,68,0.3)', marginBottom: 24,
        }}>
          <Text style={{ color: C.red, fontWeight: '800', fontSize: 15, marginBottom: 6 }}>⚠️ Physics Score Alert</Text>
          <Text style={{ color: C.muted, fontSize: 14, lineHeight: 22 }}>
            Your child scored F (45%) in Physics — well below the class average of 71%. Please encourage them to seek extra help or verify if the score was recorded correctly.
          </Text>
        </View>

        {/* Results */}
        <SLabel text="First Term 2026 — All Subjects" />
        {RESULTS.map((r, i) => (
          <View key={i} style={{
            backgroundColor: C.card, borderRadius: 14,
            padding: 16, marginBottom: 10,
            borderWidth: 1, borderColor: C.border,
            flexDirection: 'row', alignItems: 'center',
          }}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 15, flex: 1 }}>{r.subject}</Text>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 100, height: 5, width: 80, marginRight: 14 }}>
              <View style={{ backgroundColor: gradeColor(r.grade), borderRadius: 100, height: '100%', width: r.score + '%' }} />
            </View>
            <Text style={{ color: gradeColor(r.grade), fontWeight: '900', fontSize: 22, marginRight: 10 }}>{r.grade}</Text>
            <Text style={{ color: gradeColor(r.grade), fontWeight: '700', fontSize: 15, width: 38, textAlign: 'right' }}>{r.score}%</Text>
          </View>
        ))}

        {/* Grade guide */}
        <Card style={{ marginTop: 8 }}>
          <SLabel text="SRMS Grading Scale" />
          {[
            { grade: 'A', range: '80-100%', label: 'Excellent' },
            { grade: 'B', range: '70-79%', label: 'Very Good' },
            { grade: 'C', range: '60-69%', label: 'Good' },
            { grade: 'D', range: '50-59%', label: 'Pass' },
            { grade: 'F', range: '0-49%', label: 'Fail' },
          ].map((g, i) => (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: 10,
              borderBottomWidth: i < 4 ? 1 : 0,
              borderBottomColor: C.border,
            }}>
              <Text style={{ color: gradeColor(g.grade), fontWeight: '900', fontSize: 20, width: 32 }}>{g.grade}</Text>
              <Text style={{ color: C.text, fontSize: 14, flex: 1 }}>{g.label}</Text>
              <Text style={{ color: C.muted, fontSize: 13 }}>{g.range}</Text>
            </View>
          ))}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// ADMIN DASHBOARD
// ============================================================
function AdminDashboard({ user, onLogout }) {
  const STATS = [
    { label: 'Students', value: '128', icon: '🎓', color: C.blue },
    { label: 'Teachers', value: '22', icon: '👨‍🏫', color: C.green },
    { label: 'Parents', value: '35', icon: '👨‍👩‍👧', color: C.purple },
    { label: 'Bill', value: '$62.65', icon: '💳', color: C.amber },
    { label: 'Complaints', value: '3', icon: '⚖️', color: C.red },
    { label: 'Published', value: '6', icon: '📊', color: C.green },
  ];

  const ACTIONS = [
    { icon: '📢', label: 'Send Broadcast', desc: 'Announce to all users', color: C.blue },
    { icon: '💳', label: 'View Billing', desc: 'March 2026 — $62.65 due', color: C.amber },
    { icon: '📊', label: 'Results Overview', desc: 'All published results', color: C.green },
    { icon: '⚖️', label: 'View Complaints', desc: '3 open complaints', color: C.red },
    { icon: '🤖', label: 'AI Tools', desc: 'Bedrock AI features', color: C.indigo },
    { icon: '⚙️', label: 'School Settings', desc: 'Profile and branding', color: C.purple },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="light" />
      <Header
        emoji="🏫" title="Admin Portal"
        subtitle={user.srmsId} subtitleColor={C.amber}
        onLogout={onLogout}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* School card */}
        <View style={{
          backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 18,
          padding: 20, borderWidth: 1.5,
          borderColor: 'rgba(245,158,11,0.3)', marginBottom: 24,
        }}>
          <Text style={{ color: C.amber, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Your School</Text>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 18, marginBottom: 4 }}>Govt Bilingual High School Bamenda</Text>
          <Text style={{ color: C.muted, fontSize: 13 }}>North West Region, Cameroon · Standard Plan</Text>
        </View>

        {/* Stats grid — 3 columns */}
        <SLabel text="Platform Statistics" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {STATS.map((stat, i) => (
            <View key={i} style={{
              width: (width - 52) / 3,
              backgroundColor: C.card, borderRadius: 14,
              padding: 16, borderWidth: 1, borderColor: C.border,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 26, marginBottom: 8 }}>{stat.icon}</Text>
              <Text style={{ color: stat.color, fontWeight: '900', fontSize: 18 }}>{stat.value}</Text>
              <Text style={{ color: C.muted, fontSize: 11, marginTop: 4, textAlign: 'center' }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick actions */}
        <SLabel text="Quick Actions" />
        {ACTIONS.map((action, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => Alert.alert(
              action.label,
              `Full ${action.label} functionality is on the web platform:\n\nlocalhost:3000/school-admin`
            )}
            style={{
              backgroundColor: C.card, borderRadius: 14,
              padding: 16, marginBottom: 10,
              borderWidth: 1, borderColor: C.border,
              flexDirection: 'row', alignItems: 'center', gap: 16,
            }}>
            <View style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: action.color + '20',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Text style={{ fontSize: 24 }}>{action.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>{action.label}</Text>
              <Text style={{ color: C.muted, fontSize: 13, marginTop: 2 }}>{action.desc}</Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 24 }}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={{
          backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 14,
          padding: 16, marginTop: 8,
          borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
        }}>
          <Text style={{ color: C.blue, fontSize: 13, lineHeight: 20, textAlign: 'center' }}>
            💡 For full functionality including broadcasts, billing, and settings — use the web platform at localhost:3000
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [user, setUser] = useState(null);

  if (!user) return <LoginScreen onLogin={setUser} />;
  if (user.role === 'student') return <StudentDashboard user={user} onLogout={() => setUser(null)} />;
  if (user.role === 'teacher') return <TeacherDashboard user={user} onLogout={() => setUser(null)} />;
  if (user.role === 'parent') return <ParentDashboard user={user} onLogout={() => setUser(null)} />;
  return <AdminDashboard user={user} onLogout={() => setUser(null)} />;
}