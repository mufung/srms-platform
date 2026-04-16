// SRMS-4-CALC-001: Grade Calculation Engine
// Owner: MUFUNG ANGELBELL MBUYEH
// This is the brain of the result system.
// It takes raw scores and produces grades, positions, averages, GPA

// SRMS-4-CALC-002: Default grading scales
// Schools can override these in their settings
const DEFAULT_GRADING_SCALE = [
  { min: 80, max: 100, grade: 'A', points: 4.0, label: 'Excellent', color: '#10b981' },
  { min: 70, max: 79,  grade: 'B', points: 3.0, label: 'Very Good', color: '#3b82f6' },
  { min: 60, max: 69,  grade: 'C', points: 2.0, label: 'Good',      color: '#8b5cf6' },
  { min: 50, max: 59,  grade: 'D', points: 1.0, label: 'Pass',      color: '#f59e0b' },
  { min: 0,  max: 49,  grade: 'F', points: 0.0, label: 'Fail',      color: '#ef4444' },
];

// SRMS-4-CALC-003: Get grade from score
const getGrade = (score, scale = DEFAULT_GRADING_SCALE) => {
  const numScore = parseFloat(score);
  if (isNaN(numScore) || numScore < 0) return { grade: 'F', points: 0.0, label: 'Fail', color: '#ef4444' };
  if (numScore > 100) return { grade: 'A', points: 4.0, label: 'Excellent', color: '#10b981' };

  for (const band of scale) {
    if (numScore >= band.min && numScore <= band.max) {
      return { grade: band.grade, points: band.points, label: band.label, color: band.color };
    }
  }
  return { grade: 'F', points: 0.0, label: 'Fail', color: '#ef4444' };
};

// SRMS-4-CALC-004: Calculate percentage
const getPercentage = (score, maxScore = 100) => {
  return Math.round((parseFloat(score) / parseFloat(maxScore)) * 100);
};

// SRMS-4-CALC-005: Get remarks based on grade
const getRemarks = (grade, score) => {
  const remarksMap = {
    A: ['Outstanding performance', 'Exceptional work', 'Excellent achievement', 'Superb result'],
    B: ['Very good performance', 'Well done', 'Good effort shown', 'Commendable work'],
    C: ['Good performance', 'Satisfactory work', 'Keep improving', 'Decent effort'],
    D: ['Passed — needs more effort', 'Borderline pass', 'More study required', 'Just passed'],
    F: ['Did not pass', 'Requires significant improvement', 'Must repeat', 'More effort needed'],
  };
  const options = remarksMap[grade] || remarksMap['F'];
  return options[Math.floor(Math.random() * options.length)];
};

// SRMS-4-CALC-006: Main calculation function
// Takes an array of student results and computes everything
const calculateClassResults = (students, gradingScale = DEFAULT_GRADING_SCALE) => {
  if (!students || students.length === 0) return [];

  // SRMS-4-CALC-007: Step 1 — Calculate grade and points for each student-subject combo
  const studentsWithGrades = students.map(student => {
    const subjects = (student.subjects || []).map(subject => {
      const score = parseFloat(subject.score) || 0;
      const maxScore = parseFloat(subject.maxScore) || 100;
      const gradeInfo = getGrade((score / maxScore) * 100, gradingScale);
      const percentage = getPercentage(score, maxScore);

      return {
        ...subject,
        score,
        maxScore,
        percentage,
        grade: gradeInfo.grade,
        gradePoints: gradeInfo.points,
        gradeLabel: gradeInfo.label,
        gradeColor: gradeInfo.color,
        remarks: subject.remarks || getRemarks(gradeInfo.grade, score),
        passed: gradeInfo.grade !== 'F',
      };
    });

    // SRMS-4-CALC-008: Calculate student totals
    const totalScore = subjects.reduce((sum, s) => sum + s.score, 0);
    const totalMaxScore = subjects.reduce((sum, s) => sum + s.maxScore, 0);
    const totalPercentage = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0;
    const totalPoints = subjects.reduce((sum, s) => sum + s.gradePoints, 0);
    const gpa = subjects.length > 0 ? Math.round((totalPoints / subjects.length) * 100) / 100 : 0;
    const overallGradeInfo = getGrade(totalPercentage, gradingScale);
    const passedSubjects = subjects.filter(s => s.passed).length;
    const failedSubjects = subjects.filter(s => !s.passed).length;

    return {
      ...student,
      subjects,
      totalScore: Math.round(totalScore * 100) / 100,
      totalMaxScore,
      totalPercentage,
      gpa,
      overallGrade: overallGradeInfo.grade,
      overallGradeColor: overallGradeInfo.color,
      overallGradeLabel: overallGradeInfo.label,
      passedSubjects,
      failedSubjects,
      promoted: failedSubjects === 0,
    };
  });

  // SRMS-4-CALC-009: Step 2 — Assign class positions by total percentage
  const sorted = [...studentsWithGrades].sort((a, b) => b.totalPercentage - a.totalPercentage);
  let currentPosition = 1;
  let previousScore = null;
  let sameScoreCount = 0;

  const withPositions = sorted.map((student, index) => {
    if (student.totalPercentage === previousScore) {
      sameScoreCount++;
    } else {
      currentPosition = index + 1;
      sameScoreCount = 0;
    }
    previousScore = student.totalPercentage;
    return { ...student, classPosition: currentPosition, outOf: sorted.length };
  });

  // SRMS-4-CALC-010: Step 3 — Calculate per-subject class statistics
  const allSubjectNames = withPositions[0]?.subjects?.map(s => s.subjectName) || [];

  const subjectStats = allSubjectNames.map(subjectName => {
    const subjectScores = withPositions
      .map(s => s.subjects.find(sub => sub.subjectName === subjectName))
      .filter(Boolean)
      .map(s => s.percentage);

    const avg = subjectScores.length > 0
      ? Math.round(subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length)
      : 0;
    const highest = Math.max(...subjectScores);
    const lowest = Math.min(...subjectScores);
    const passed = subjectScores.filter(s => s >= 50).length;
    const failed = subjectScores.filter(s => s < 50).length;

    return { subjectName, average: avg, highest, lowest, passed, failed, total: subjectScores.length };
  });

  // SRMS-4-CALC-011: Step 4 — Assign per-subject positions
  const withSubjectPositions = withPositions.map(student => {
    const subjects = student.subjects.map(subject => {
      const subjectScores = withPositions
        .map(s => s.subjects.find(sub => sub.subjectName === subject.subjectName)?.percentage || 0)
        .sort((a, b) => b - a);
      const subjectPosition = subjectScores.indexOf(subject.percentage) + 1;
      return { ...subject, subjectPosition };
    });
    return { ...student, subjects };
  });

  return { students: withSubjectPositions, subjectStats, classSize: students.length };
};

// SRMS-4-CALC-012: Detect anomalies (big score drops)
const detectAnomalies = (currentResults, previousResults) => {
  const anomalies = [];
  if (!previousResults || previousResults.length === 0) return anomalies;

  currentResults.forEach(currentStudent => {
    const prevStudent = previousResults.find(p => p.studentId === currentStudent.studentId);
    if (!prevStudent) return;

    const drop = prevStudent.totalPercentage - currentStudent.totalPercentage;
    if (drop >= 20) {
      anomalies.push({
        studentId: currentStudent.studentId,
        studentName: currentStudent.studentName,
        previousScore: prevStudent.totalPercentage,
        currentScore: currentStudent.totalPercentage,
        drop,
        severity: drop >= 30 ? 'high' : 'medium',
        message: `Score dropped ${drop}% from last term (${prevStudent.totalPercentage}% → ${currentStudent.totalPercentage}%)`,
      });
    }
  });

  return anomalies;
};

// SRMS-4-CALC-013: Parse uploaded file data into standard format
const parseUploadedData = (rawData) => {
  if (!Array.isArray(rawData)) return [];

  return rawData.map((row, index) => ({
    studentId: row.studentId || row['Student ID'] || row['ID'] || `TEMP-${index + 1}`,
    studentName: row.studentName || row['Student Name'] || row['Name'] || `Student ${index + 1}`,
    subjects: Object.keys(row)
      .filter(key => !['studentId', 'studentName', 'Student ID', 'Student Name', 'Name', 'ID'].includes(key))
      .map(subjectName => ({
        subjectName,
        score: parseFloat(row[subjectName]) || 0,
        maxScore: 100,
      }))
      .filter(s => !isNaN(parseFloat(s.score))),
  })).filter(s => s.studentId && s.subjects.length > 0);
};

// SRMS-4-CALC-014: Generate class summary statistics
const generateClassSummary = (calculatedResults) => {
  const { students, subjectStats, classSize } = calculatedResults;

  const avgPercentage = Math.round(students.reduce((sum, s) => sum + s.totalPercentage, 0) / students.length);
  const highest = students.reduce((best, s) => s.totalPercentage > best.totalPercentage ? s : best, students[0]);
  const lowest = students.reduce((worst, s) => s.totalPercentage < worst.totalPercentage ? s : worst, students[0]);
  const promoted = students.filter(s => s.promoted).length;
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  students.forEach(s => { gradeDistribution[s.overallGrade] = (gradeDistribution[s.overallGrade] || 0) + 1; });

  return {
    classSize,
    averageScore: avgPercentage,
    highestStudent: { name: highest?.studentName, score: highest?.totalPercentage },
    lowestStudent: { name: lowest?.studentName, score: lowest?.totalPercentage },
    promoted,
    failed: classSize - promoted,
    promotionRate: Math.round((promoted / classSize) * 100),
    gradeDistribution,
    subjectStats,
  };
};

module.exports = {
  calculateClassResults,
  getGrade,
  getPercentage,
  getRemarks,
  detectAnomalies,
  parseUploadedData,
  generateClassSummary,
  DEFAULT_GRADING_SCALE,
};