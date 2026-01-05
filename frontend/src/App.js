import React, { useState, useEffect, useMemo } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList,
  BarChart, Bar, Legend
} from 'recharts';
import './App.css';

function App() {
  // --- Global State ---
  const [semesters, setSemesters] = useState([]);
  const [activeSemesterId, setActiveSemesterId] = useState(null);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [viewingArchived, setViewingArchived] = useState(false);
  const [openTabMenu, setOpenTabMenu] = useState(null);

  // --- View State ---
  const [activeView, setActiveView] = useState('tracker'); 

  // --- Editing State ---
  const [editingSemesterId, setEditingSemesterId] = useState(null);
  const [tempSemesterName, setTempSemesterName] = useState("");

  // --- Timer & Session State ---
  const [isStudying, setIsStudying] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  // --- Selection State ---
  const [selectedSubject, setSelectedSubject] = useState(""); 
  const [selectedSubjectId, setSelectedSubjectId] = useState(""); 
  const [currentSubjectObj, setCurrentSubjectObj] = useState(null);
  
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showManageClasses, setShowManageClasses] = useState(false);

  // --- Assessments State ---
  const [assessments, setAssessments] = useState([]);
  const [newAssessment, setNewAssessment] = useState({ name: "", type: "", date: "", grade: "" });
  const [showAddAssessment, setShowAddAssessment] = useState(false);
  const [editingAssessmentId, setEditingAssessmentId] = useState(null);
  const [editAssessmentData, setEditAssessmentData] = useState({ name: "", type: "", date: "", grade: "" });
  const [openAssessmentMenu, setOpenAssessmentMenu] = useState(null);

  // --- Grade Calculator & Custom Types State ---
  const [gradeEntries, setGradeEntries] = useState([]);
  const [assignmentTypes, setAssignmentTypes] = useState([]); 
  const [weights, setWeights] = useState({});
  const [newGradeEntry, setNewGradeEntry] = useState({ name: "", score: "", totalPoints: "100", category: "" });
  const [targetGrade, setTargetGrade] = useState(90);
  const [newTypeName, setNewTypeName] = useState("");
  const [totalExams, setTotalExams] = useState(2);
  const [showAbsolute, setShowAbsolute] = useState(false); 

  // --- Filter & Manager Visibility State (Tracker) ---
  const [visibleTypes, setVisibleTypes] = useState({});
  const [showTypeManager, setShowTypeManager] = useState(false);

  // --- Editing State for Calculator List ---
  const [editingGradeId, setEditingGradeId] = useState(null);
  const [editingGradeType, setEditingGradeType] = useState(null); 
  const [editGradeData, setEditGradeData] = useState({ name: "", score: "", totalPoints: "", category: "" });

  // --- Type Renaming State ---
  const [openTypeMenu, setOpenTypeMenu] = useState(null);
  const [renamingType, setRenamingType] = useState(null);
  const [tempRenamingName, setTempRenamingName] = useState("");


  // --- Derived Logic ---

  const displayedSemesters = useMemo(() => {
    return semesters.filter(s => !!s.archived === viewingArchived);
  }, [semesters, viewingArchived]);

  const subjectSummaries = useMemo(() => {
    const summary = {};
    sessions.forEach(session => {
      if (!summary[session.subject]) summary[session.subject] = 0;
      summary[session.subject] += session.durationSeconds;
    });
    return Object.entries(summary)
      .map(([name, totalSeconds]) => ({ name, totalSeconds }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [sessions]);

  const assessmentStats = useMemo(() => {
    if (!assessments.length) return [];
    const subjectSessions = sessions.filter(s => s.subject === selectedSubject);
    
    const processedAssessments = [];
    assignmentTypes.forEach(type => {
        const typeAssessments = assessments
            .filter(a => a.type === type)
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        typeAssessments.forEach((assessment, index) => {
            const prevDate = index === 0 ? 0 : new Date(typeAssessments[index - 1].date).setHours(23, 59, 59, 999);
            const cutoffDate = new Date(assessment.date).setHours(23, 59, 59, 999);

            const timeForAssigment = subjectSessions.reduce((total, session) => {
                const sessionTime = new Date(session.startTime).getTime();
                if (sessionTime > prevDate && sessionTime <= cutoffDate) {
                    return total + session.durationSeconds;
                }
                return total;
            }, 0);

            const hrs = parseFloat((timeForAssigment / 3600).toFixed(1));
            const gradeVal = parseFloat(assessment.grade) || 0;

            processedAssessments.push({ 
                ...assessment, 
                calculatedTime: timeForAssigment,
                hours: hrs, 
                numericGrade: gradeVal,
                efficiency: hrs > 0 ? parseFloat((gradeVal / hrs).toFixed(1)) : 0
            });
        });
    });
    return processedAssessments.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [assessments, sessions, selectedSubject, assignmentTypes]);

  // --- FILTER Logic ---
  const filteredAssessments = useMemo(() => {
      return assessmentStats.filter(a => visibleTypes[a.type]);
  }, [assessmentStats, visibleTypes]);

  // Analytics
  const scatterData = useMemo(() => {
    return assessmentStats.filter(a => a.numericGrade > 0).map(a => ({
      x: a.hours,
      y: a.numericGrade,
      name: `${a.name} (${a.type})`
    }));
  }, [assessmentStats]);

  const efficiencyData = useMemo(() => {
    return assessmentStats.filter(a => a.numericGrade > 0).map(a => ({
      name: a.name,
      efficiency: a.efficiency
    }));
  }, [assessmentStats]);

  const avgEfficiency = useMemo(() => {
    const graded = assessmentStats.filter(a => a.numericGrade > 0);
    if (graded.length === 0) return 0;
    const totalEff = graded.reduce((sum, item) => sum + item.efficiency, 0);
    return (totalEff / graded.length).toFixed(1);
  }, [assessmentStats]);

  const prediction = useMemo(() => {
    const points = assessmentStats.filter(a => a.numericGrade > 0 && a.hours > 0);
    if (points.length < 2) return null;
    const n = points.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    points.forEach(p => {
      sumX += p.hours;
      sumY += p.numericGrade;
      sumXY += (p.hours * p.numericGrade);
      sumXX += (p.hours * p.hours);
    });
    const denominator = (n * sumXX - sumX * sumX);
    if (denominator === 0) return null;
    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;
    return { slope, intercept };
  }, [assessmentStats]);

  // --- Grade Calculation Logic ---
  const calculationResult = useMemo(() => {
    if (!gradeEntries.length && !assessments.length && assignmentTypes.length === 0) return null;

    const categoryData = {}; 
    assignmentTypes.forEach(t => categoryData[t] = { items: [] });

    gradeEntries.forEach(g => {
        if(categoryData[g.category]) categoryData[g.category].items.push({ score: g.score, total: g.totalPoints });
    });
    assessments.forEach(a => {
        if(categoryData[a.type]) categoryData[a.type].items.push({ score: parseFloat(a.grade||0), total: 100 });
    });

    let pointsLockedIn = 0;
    let totalWeightUsedInCalc = 0;
    let absoluteScore = 0;

    Object.keys(categoryData).forEach(cat => {
        const data = categoryData[cat];
        const weight = weights[cat] || 0;
        
        if (data.items.length > 0) {
            const sumPercentages = data.items.reduce((acc, i) => acc + (i.score / i.total), 0);
            const average = sumPercentages / data.items.length;
            
            const weightedPoints = average * weight;
            
            pointsLockedIn += weightedPoints;
            absoluteScore += weightedPoints;
            totalWeightUsedInCalc += weight;
        } 
    });

    const currentGrade = totalWeightUsedInCalc > 0 ? (pointsLockedIn / totalWeightUsedInCalc) * 100 : 0;

    const remainingWeight = 100 - totalWeightUsedInCalc;
    let requiredScore = 0;

    if (remainingWeight > 0) {
        requiredScore = (targetGrade - pointsLockedIn) / (remainingWeight / 100);
    }

    let predictedHours = 0;
    if (prediction && prediction.slope !== 0) {
      predictedHours = (requiredScore - prediction.intercept) / prediction.slope;
    }

    return {
      currentGrade: currentGrade.toFixed(2),
      absoluteAverage: absoluteScore.toFixed(2),
      requiredScore: requiredScore.toFixed(2),
      remainingWeight: remainingWeight.toFixed(0),
      predictedHours: predictedHours > 0 ? predictedHours.toFixed(1) : 0,
      hasRegression: !!prediction
    };
  }, [gradeEntries, assessments, weights, targetGrade, prediction, assignmentTypes]);

  // --- Effects ---
  useEffect(() => { fetchSemesters(); }, []);

  useEffect(() => {
    if (activeSemesterId) {
      fetchSubjects(activeSemesterId);
      fetchSessions(activeSemesterId);
      setSelectedSubject("");
      setSelectedSubjectId("");
      setAssessments([]);
      setActiveView('tracker');
    }
  }, [activeSemesterId]);

  useEffect(() => {
    if (selectedSubjectId) {
      const sub = subjects.find(s => s.id === selectedSubjectId);
      setCurrentSubjectObj(sub);
      
      let loadedTypes = [];
      if (sub && sub.assignmentTypes && sub.assignmentTypes.length > 0) {
          loadedTypes = sub.assignmentTypes;
      } else {
          loadedTypes = [];
      }
      setAssignmentTypes(loadedTypes);
      
      const initialVisibility = {};
      loadedTypes.forEach(t => initialVisibility[t] = true);
      setVisibleTypes(initialVisibility);

      if (loadedTypes.length > 0) {
          setNewAssessment(prev => ({ ...prev, type: loadedTypes[0] }));
          setNewGradeEntry(prev => ({ ...prev, category: loadedTypes[0] }));
      } else {
          setNewAssessment(prev => ({ ...prev, type: "" }));
          setNewGradeEntry(prev => ({ ...prev, category: "" }));
      }

      if (sub && sub.gradeWeights) setWeights(sub.gradeWeights);
      else setWeights({});

      fetchAssessments(selectedSubjectId);
      fetchGrades(selectedSubjectId);
    } else {
      setAssessments([]);
      setGradeEntries([]);
      setAssignmentTypes([]);
    }
  }, [selectedSubjectId, subjects]);

  useEffect(() => {
    let interval = null;
    if (isStudying) {
      interval = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 1000);
    } else clearInterval(interval);
    return () => clearInterval(interval);
  }, [isStudying, startTime]);

  useEffect(() => {
    const closeMenu = () => { 
        setOpenTabMenu(null); 
        setOpenAssessmentMenu(null); 
        setOpenTypeMenu(null);
    };
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  // --- API Calls ---
  const fetchSemesters = async () => { const res = await fetch('http://localhost:8080/api/semesters'); setSemesters(await res.json()); };
  const fetchSubjects = async (semId) => { const res = await fetch(`http://localhost:8080/api/subjects?semesterId=${semId}`); setSubjects(await res.json()); };
  const fetchSessions = async (semId) => { const res = await fetch(`http://localhost:8080/api/sessions?semesterId=${semId}`); setSessions((await res.json()).reverse()); };
  const fetchAssessments = async (subId) => { const res = await fetch(`http://localhost:8080/api/assessments?subjectId=${subId}`); setAssessments(await res.json()); };
  const fetchGrades = async (subId) => { const res = await fetch(`http://localhost:8080/api/grades?subjectId=${subId}`); setGradeEntries(await res.json()); };
  const saveTypes = async (id, types) => { await fetch(`http://localhost:8080/api/subjects/${id}/types`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(types) }); };
  
  const handleAddType = async () => {
      if (!newTypeName.trim()) return;
      if (assignmentTypes.includes(newTypeName)) return alert("Type already exists");
      const updatedTypes = [...assignmentTypes, newTypeName];
      setAssignmentTypes(updatedTypes);
      setVisibleTypes(prev => ({...prev, [newTypeName]: true}));
      
      if (updatedTypes.length === 1) {
          setNewAssessment(prev => ({...prev, type: newTypeName}));
          setNewGradeEntry(prev => ({...prev, category: newTypeName}));
      }

      setNewTypeName("");
      setWeights(prev => ({...prev, [newTypeName]: 0}));
      await saveTypes(selectedSubjectId, updatedTypes);
  };

  const toggleTypeVisibility = (type) => {
      setVisibleTypes(prev => ({...prev, [type]: !prev[type]}));
  };

  const startRenamingType = (type) => {
      setRenamingType(type);
      setTempRenamingName(type);
      setOpenTypeMenu(null);
  };

  const cancelRenameType = () => {
      setRenamingType(null);
      setTempRenamingName("");
  };

  const submitRenameType = async (oldName) => {
      if (!tempRenamingName.trim()) return;
      if (assignmentTypes.includes(tempRenamingName) && tempRenamingName !== oldName) return alert("Type already exists");
      const newName = tempRenamingName.trim();
      const updatedTypes = assignmentTypes.map(t => t === oldName ? newName : t);
      setAssignmentTypes(updatedTypes);
      const newWeights = { ...weights };
      if (newWeights[oldName] !== undefined) {
          newWeights[newName] = newWeights[oldName];
          delete newWeights[oldName];
      }
      setWeights(newWeights);
      const updatedGrades = gradeEntries.map(g => {
          if (g.category === oldName) {
              const updatedG = { ...g, category: newName };
              fetch(`http://localhost:8080/api/grades/${g.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedG) });
              return updatedG;
          }
          return g;
      });
      setGradeEntries(updatedGrades);
      const updatedAssessments = assessments.map(a => {
          if (a.type === oldName) {
              const updatedA = { ...a, type: newName };
              fetch(`http://localhost:8080/api/assessments/${a.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedA) });
              return updatedA;
          }
          return a;
      });
      setAssessments(updatedAssessments);
      await saveTypes(selectedSubjectId, updatedTypes);
      await saveConfig(selectedSubjectId, newWeights);
      setRenamingType(null);
  };

  const handleDeleteType = async (typeToDelete) => {
      if (!window.confirm(`Delete "${typeToDelete}"?`)) return;
      const updatedTypes = assignmentTypes.filter(t => t !== typeToDelete);
      setAssignmentTypes(updatedTypes);
      const newWeights = { ...weights };
      delete newWeights[typeToDelete];
      setWeights(newWeights);
      await saveTypes(selectedSubjectId, updatedTypes);
      handleSaveConfig(newWeights);
  };

  // --- UPDATED: Always Add as Tracker Assessment ---
  const handleAddGrade = async () => {
    if (!newGradeEntry.name || !newGradeEntry.score || !newGradeEntry.category) return alert("Please fill all fields.");
    
    // Always convert to percentage and save as Assessment
    const scoreVal = parseFloat(newGradeEntry.score);
    const totalVal = parseFloat(newGradeEntry.totalPoints);
    const percentage = totalVal > 0 ? ((scoreVal / totalVal) * 100).toFixed(1) : 0;

    await fetch('http://localhost:8080/api/assessments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: newGradeEntry.name,
            type: newGradeEntry.category,
            date: new Date().toISOString().split('T')[0], 
            grade: percentage,
            subjectId: selectedSubjectId
        })
    });
    fetchAssessments(selectedSubjectId);
    
    setNewGradeEntry({ ...newGradeEntry, name: "", score: "" });
  };
  
  const handleDeleteGrade = async (id) => { await fetch(`http://localhost:8080/api/grades/${id}`, { method: 'DELETE' }); fetchGrades(selectedSubjectId); };
  
  const saveConfig = async (id, w) => {
      await fetch(`http://localhost:8080/api/subjects/${id}/config`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ weights: w, totalExams: 0 }) 
      });
  };

  const handleSaveConfig = async (weightsToSave = weights) => { 
      if(!selectedSubjectId) return; 
      await saveConfig(selectedSubjectId, weightsToSave);
      alert("Configuration Saved!");
  };

  // --- Grade Editing Handlers ---
  const startEditingGradeList = (item, type) => {
      setEditingGradeId(item.id);
      setEditingGradeType(type);
      if (type === 'manual') {
          setEditGradeData({ name: item.name, score: item.score, totalPoints: item.totalPoints, category: item.category });
      } else {
          setEditGradeData({ name: item.name, score: item.grade, totalPoints: "100", category: item.type });
      }
  };

  const saveEditedGradeList = async () => {
      if (editingGradeType === 'manual') {
          await fetch(`http://localhost:8080/api/grades/${editingGradeId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(editGradeData)
          });
          fetchGrades(selectedSubjectId);
      } else {
          const score = parseFloat(editGradeData.score);
          const total = parseFloat(editGradeData.totalPoints);
          const percentage = total > 0 ? ((score / total) * 100).toFixed(1) : 0;
          await fetch(`http://localhost:8080/api/assessments/${editingGradeId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: editGradeData.name, type: editGradeData.category, date: new Date().toISOString().split('T')[0], grade: percentage, subjectId: selectedSubjectId })
          });
          fetchAssessments(selectedSubjectId);
      }
      setEditingGradeId(null);
      setEditingGradeType(null);
  };

  const cancelEditGradeList = () => {
      setEditingGradeId(null);
      setEditingGradeType(null);
  };

  const handleDeleteFromEdit = async () => {
      if (!window.confirm("Delete this assignment?")) return;
      if (editingGradeType === 'manual') {
          await handleDeleteGrade(editingGradeId);
      } else {
          await handleDeleteAssessment(editingGradeId);
      }
      setEditingGradeId(null);
      setEditingGradeType(null);
  };

const handleAddAssessment = async () => { 
      if (!newAssessment.name || !newAssessment.date || !selectedSubjectId || !newAssessment.type) return alert("Please select a Type."); 
      
      // FIX: Parse and format grade to 1 decimal place to match Calculator behavior
      const gradeVal = parseFloat(newAssessment.grade);
      const formattedGrade = !isNaN(gradeVal) ? gradeVal.toFixed(1) : "0.0";

      await fetch('http://localhost:8080/api/assessments', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          // Use formattedGrade instead of raw newAssessment.grade
          body: JSON.stringify({ ...newAssessment, grade: formattedGrade, subjectId: selectedSubjectId }), 
      }); 
      
      setNewAssessment({ name: "", type: assignmentTypes[0] || "", date: "", grade: "" }); 
      fetchAssessments(selectedSubjectId); 
      setShowAddAssessment(false); 
  };
  const startEditingAssessment = (assess) => { setEditingAssessmentId(assess.id); setEditAssessmentData({ name: assess.name, type: assess.type, date: assess.date, grade: assess.grade }); setOpenAssessmentMenu(null); };
  const saveAssessment = async () => { if (!editingAssessmentId) return; await fetch(`http://localhost:8080/api/assessments/${editingAssessmentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editAssessmentData), }); setEditingAssessmentId(null); fetchAssessments(selectedSubjectId); };
  const handleDeleteAssessment = async (id) => { await fetch(`http://localhost:8080/api/assessments/${id}`, { method: 'DELETE' }); fetchAssessments(selectedSubjectId); };

  // Standard Handlers
  const handleSubjectChange = (e) => { const subName = e.target.value; setSelectedSubject(subName); const subObj = subjects.find(s => s.name === subName); setSelectedSubjectId(subObj ? subObj.id : ""); };
  const handleStart = () => { if (!selectedSubject) return alert("Select a class!"); setStartTime(Date.now()); setIsStudying(true); setElapsed(0); };
  const handleStop = async () => { setIsStudying(false); const endTime = Date.now(); const sessionData = { startTime: new Date(startTime).toISOString(), endTime: new Date(endTime).toISOString(), durationSeconds: Math.floor((endTime - startTime) / 1000), subject: selectedSubject, semesterId: activeSemesterId }; await fetch('http://localhost:8080/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sessionData) }); fetchSessions(activeSemesterId); };
  const formatTime = (seconds) => { const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = Math.floor(seconds % 60); return `${h}h ${m}m ${s}s`; };
  const handleAddSemester = async () => { if (!newSemesterName.trim()) return; const res = await fetch('http://localhost:8080/api/semesters', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSemesterName, archived: false }), }); const newSem = await res.json(); setNewSemesterName(""); setSemesters([...semesters, newSem]); if (!viewingArchived) setActiveSemesterId(newSem.id); };
  const saveSemesterName = async (id, currentArchivedStatus) => { if (!tempSemesterName.trim()) return; await fetch(`http://localhost:8080/api/semesters/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: tempSemesterName, archived: currentArchivedStatus }), }); const updated = semesters.map(s => s.id === id ? { ...s, name: tempSemesterName } : s); setSemesters(updated); setEditingSemesterId(null); };
  const startEditingSemester = (sem) => { setEditingSemesterId(sem.id); setTempSemesterName(sem.name); setOpenTabMenu(null); };
  const handleArchiveSemester = async (id, currentStatus) => { const response = await fetch(`http://localhost:8080/api/semesters/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ archived: !currentStatus }), }); const updated = await response.json(); const updatedSemesters = semesters.map(s => s.id === id ? updated : s); setSemesters(updatedSemesters); if (activeSemesterId === id) setActiveSemesterId(null); };
  const handleDeleteSemester = async (id) => { if (!window.confirm("Permanently delete this semester?")) return; await fetch(`http://localhost:8080/api/semesters/${id}`, { method: 'DELETE' }); const updatedSemesters = semesters.filter(s => s.id !== id); setSemesters(updatedSemesters); if (activeSemesterId === id) setActiveSemesterId(null); };
  const handleAddSubject = async () => { if (!newSubjectName.trim() || !activeSemesterId) return; await fetch('http://localhost:8080/api/subjects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newSubjectName, semesterId: activeSemesterId }), }); setNewSubjectName(""); fetchSubjects(activeSemesterId); };
  const handleDeleteSubject = async (id) => { await fetch(`http://localhost:8080/api/subjects/${id}`, { method: 'DELETE' }); fetchSubjects(activeSemesterId); };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📚 Study Tracker</h1>
        
        <div className="view-toggle">
           <button className={`toggle-btn ${!viewingArchived ? 'active' : ''}`} onClick={() => { setViewingArchived(false); setActiveSemesterId(null); }}>Current</button>
           <button className={`toggle-btn ${viewingArchived ? 'active' : ''}`} onClick={() => { setViewingArchived(true); setActiveSemesterId(null); }}>Archived</button>
        </div>
        <div className="tabs-container">
          {displayedSemesters.map(sem => (
            <div key={sem.id} className={`tab ${activeSemesterId === sem.id ? 'active-tab' : ''}`} onClick={() => setActiveSemesterId(sem.id)}>
              {editingSemesterId === sem.id ? (
                <input type="text" value={tempSemesterName} onChange={(e) => setTempSemesterName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveSemesterName(sem.id, sem.archived); e.stopPropagation(); }} onClick={(e) => e.stopPropagation()} onBlur={() => saveSemesterName(sem.id, sem.archived)} autoFocus className="tab-edit-input" />
              ) : <span>{sem.name}</span>}
              <div className="tab-menu-trigger" onClick={(e) => { e.stopPropagation(); setOpenTabMenu(openTabMenu === sem.id ? null : sem.id); }}>⋮</div>
              {openTabMenu === sem.id && (<div className="tab-dropdown"><div onClick={() => startEditingSemester(sem)}>Rename</div><div onClick={() => handleArchiveSemester(sem.id, sem.archived)}>{sem.archived ? "Unarchive" : "Archive"}</div><div onClick={() => handleDeleteSemester(sem.id)} className="delete-option">Delete</div></div>)}
            </div>
          ))}
          {!viewingArchived && (<div className="add-tab-container"><input value={newSemesterName} onChange={(e) => setNewSemesterName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSemester()} placeholder="New..." /><button onClick={handleAddSemester}>+</button></div>)}
        </div>

        {activeSemesterId && (
          <>
            <div className="sub-nav">
              <span className={`sub-nav-item ${activeView === 'tracker' ? 'active' : ''}`} onClick={() => setActiveView('tracker')}>📝 Tracker</span>
              <span className={`sub-nav-item ${activeView === 'analytics' ? 'active' : ''}`} onClick={() => setActiveView('analytics')}>📊 Analytics</span>
              <span className={`sub-nav-item ${activeView === 'calculator' ? 'active' : ''}`} onClick={() => setActiveView('calculator')}>🧮 Calculator</span>
            </div>

            <div className="main-layout">
              {/* --- TRACKER --- */}
              {activeView === 'tracker' && (
                  <>
                    <div className="content-area">
                        <div className="timer-container">
                            <select value={selectedSubject} onChange={handleSubjectChange} className="subject-select"><option value="" disabled>Select a Class</option>{subjects.map(sub => <option key={sub.id} value={sub.name}>{sub.name}</option>)}</select>
                            <h2>{formatTime(elapsed)}</h2>
                            {!isStudying ? <button className="btn start" onClick={handleStart}>Start Studying</button> : <button className="btn stop" onClick={handleStop}>Stop</button>}
                        </div>
                        <div className="history-container">
                          <h3>Session History</h3>
                          <table><thead><tr><th>Date</th><th>Class</th><th>Duration</th></tr></thead><tbody>{sessions.map(s => <tr key={s.id}><td>{new Date(s.startTime).toLocaleDateString()}</td><td>{s.subject}</td><td>{formatTime(s.durationSeconds)}</td></tr>)}</tbody></table>
                        </div>
                    </div>
                    <div className="right-column">
                      <div className="summary-sidebar">
                        <h3>Subject Totals</h3>
                        <div className="summary-list">{subjectSummaries.map((item, i) => (<div key={i} className={`summary-card ${selectedSubject === item.name ? 'highlight-card' : ''}`}><span className="summary-name">{item.name}</span><span className="summary-time">{formatTime(item.totalSeconds)}</span></div>))}</div>
                        {selectedSubjectId && !viewingArchived && (
                          <div className="sidebar-assessments">
                            
                            <div className="type-manager-header" onClick={() => setShowTypeManager(!showTypeManager)}>
                                <h4>Categories & Filters</h4>
                                <span className="toggle-icon">{showTypeManager ? "▲" : "▼"}</span>
                            </div>
                            
                            {showTypeManager && (
                                <div className="type-manager">
                                    <div className="add-type-row-small">
                                        <input placeholder="New Category (e.g. Quiz)" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} />
                                        <button onClick={handleAddType} className="btn-small">+</button>
                                    </div>
                                    <div className="filter-row">
                                        <small>Show:</small>
                                        {assignmentTypes.map(t => (
                                            <span key={t} className={`filter-badge ${visibleTypes[t] ? 'active-filter' : ''}`} onClick={() => toggleTypeVisibility(t)}>
                                                {t}
                                            </span>
                                        ))}
                                        {assignmentTypes.length === 0 && <small style={{fontStyle:'italic', opacity:0.6}}>None</small>}
                                    </div>
                                </div>
                            )}

                            <div className="sidebar-header-row"><h4>Assessments</h4><button className="toggle-add-btn" onClick={() => setShowAddAssessment(!showAddAssessment)}>{showAddAssessment ? "Cancel" : "+ Add"}</button></div>
                            {showAddAssessment && (
                              <div className="sidebar-form">
                                {assignmentTypes.length === 0 ? (
                                    <p style={{color:'#aaa', fontSize:'0.9rem', fontStyle:'italic', textAlign:'center'}}>Add a Category above to start!</p>
                                ) : (
                                    <>
                                        <input type="text" placeholder="Name" value={newAssessment.name} onChange={e => setNewAssessment({...newAssessment, name: e.target.value})} />
                                        <select value={newAssessment.type} onChange={e => setNewAssessment({...newAssessment, type: e.target.value})}>
                                            <option value="" disabled>Select Type...</option>
                                            {assignmentTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <input type="date" value={newAssessment.date} onChange={e => setNewAssessment({...newAssessment, date: e.target.value})} />
                                        <input type="text" placeholder="Grade" value={newAssessment.grade} onChange={e => setNewAssessment({...newAssessment, grade: e.target.value})} />
                                        <button onClick={handleAddAssessment} className="btn-full">Save</button>
                                    </>
                                )}
                              </div>
                            )}
                            <div className="assessment-list">
                              {filteredAssessments.length === 0 && assessmentStats.length > 0 && <p style={{fontSize:'0.8rem', color:'#777', textAlign:'center'}}>Items hidden by filter.</p>}
                              {filteredAssessments.map(assess => (
                                <div key={assess.id} className="assessment-card-wrapper">
                                  {editingAssessmentId === assess.id ? (
                                    <div className="sidebar-form edit-mode"><input type="text" value={editAssessmentData.name} onChange={e => setEditAssessmentData({...editAssessmentData, name: e.target.value})} /><input type="date" value={editAssessmentData.date} onChange={e => setEditAssessmentData({...editAssessmentData, date: e.target.value})} /><div style={{display:'flex', gap:'5px', marginTop:'5px'}}><button onClick={saveAssessment} className="btn-full" style={{background:'#4CAF50'}}>Save</button></div></div>
                                  ) : (
                                    <div className="assessment-card">
                                      <div className="assess-top"><span className="assess-name">{assess.name} <small style={{fontWeight:'normal', opacity:0.7, fontSize:'0.7rem'}}>({assess.type})</small></span><div style={{display:'flex', alignItems:'center', gap:'8px'}}><span className="assess-grade">{assess.grade}</span><div className="assess-menu-trigger" onClick={(e) => { e.stopPropagation(); setOpenAssessmentMenu(openAssessmentMenu === assess.id ? null : assess.id); }}>⋮</div></div></div>
                                      <div className="assess-date">{assess.date}</div>
                                      <div className="assess-time">Studied: {formatTime(assess.calculatedTime || 0)}</div>
                                      {openAssessmentMenu === assess.id && (<div className="assess-dropdown"><div onClick={() => startEditingAssessment(assess)}>Edit</div><div onClick={() => handleDeleteAssessment(assess.id)} className="delete-option">Delete</div></div>)}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="management-container sidebar-style">
                        <div className="management-header" onClick={() => setShowManageClasses(!showManageClasses)}><h3>Manage Classes</h3><span className="toggle-icon">{showManageClasses ? "▲" : "▼"}</span></div>
                        {showManageClasses && (<div className="management-content">{!viewingArchived && (<div className="add-subject-col"><input type="text" placeholder="New Class Name" value={newSubjectName} onChange={e => setNewSubjectName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()} /><button onClick={handleAddSubject} className="btn-full-width">Add Class</button></div>)}<div className="subject-list">{subjects.map(sub => <span key={sub.id} className="subject-tag">{sub.name} {!viewingArchived && <button onClick={() => handleDeleteSubject(sub.id)} className="x-btn">x</button>}</span>)}</div></div>)}
                      </div>
                    </div>
                  </>
              )}

              {/* --- ANALYTICS --- */}
              {activeView === 'analytics' && (
                  <div className="analytics-container-col">
                      {!selectedSubjectId ? <div className="empty-chart-msg">Please select a class.</div> : (
                          <>
                            <div className="metrics-row"><div className="metric-card"><h4>Avg. Efficiency</h4><p>{avgEfficiency} <span style={{fontSize:'1rem'}}>pts/hr</span></p></div></div>
                            <div className="chart-wrapper"><h3>Correlation</h3><ResponsiveContainer width="100%" height={250}><ScatterChart margin={{top:20,right:20,bottom:20,left:20}}><CartesianGrid strokeDasharray="3 3"/><XAxis type="number" dataKey="x" name="Hours"/><YAxis type="number" dataKey="y" name="Grade"/><Tooltip cursor={{strokeDasharray:'3 3'}}/><Scatter name="Assignments" data={scatterData} fill="#61dafb"/></ScatterChart></ResponsiveContainer></div>
                            <div className="chart-wrapper"><h3>Efficiency</h3><ResponsiveContainer width="100%" height={250}><BarChart data={efficiencyData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Legend/><Bar dataKey="efficiency" fill="#82ca9d"/></BarChart></ResponsiveContainer></div>
                          </>
                      )}
                  </div>
              )}

              {/* --- CALCULATOR --- */}
              {activeView === 'calculator' && (
                  <div className="calculator-container">
                      {!selectedSubjectId ? <div className="empty-chart-msg">Please select a class.</div> : (
                          <>
                            {/* 1. CONFIGURATION */}
                            <div className="calc-card">
                                <h3>Assignment Types & Weights</h3>
                                <div className="add-type-row"><input placeholder="New Category (e.g. Lab)" value={newTypeName} onChange={e => setNewTypeName(e.target.value)} /><button onClick={handleAddType} className="btn-small">Add</button></div>
                                <div className="weights-grid">
                                    {assignmentTypes.map(type => (
                                        <div key={type} className="weight-input-group">
                                            {renamingType === type ? (
                                                <div style={{display:'flex', alignItems:'center', marginBottom:'5px', gap:'5px'}}>
                                                    <input value={tempRenamingName} onChange={(e) => setTempRenamingName(e.target.value)} className="rename-input" autoFocus />
                                                    <button onClick={() => submitRenameType(type)} className="btn-small" style={{background:'#4CAF50', padding:'2px 8px'}}>✓</button>
                                                    <button onClick={cancelRenameType} className="btn-small" style={{background:'#f44336', padding:'2px 8px'}}>✕</button>
                                                </div>
                                            ) : (
                                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', position:'relative'}}>
                                                    <label>{type}</label>
                                                    <div className="type-menu-trigger" onClick={(e) => { e.stopPropagation(); setOpenTypeMenu(openTypeMenu === type ? null : type); }}>⋮</div>
                                                    {openTypeMenu === type && (
                                                        <div className="type-dropdown">
                                                            <div onClick={() => startRenamingType(type)}>Rename</div>
                                                            <div onClick={() => handleDeleteType(type)} className="delete-option">Delete</div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            <input type="number" placeholder="%" value={weights[type] || ""} onChange={(e) => setWeights({...weights, [type]: parseFloat(e.target.value)})} />
                                        </div>
                                    ))}
                                </div>
                                <button className="btn-small" onClick={() => handleSaveConfig()}>Save Configuration</button>
                            </div>

                            {/* 2. ENTER GRADES */}
                            <div className="calc-card">
                                <h3>Grades</h3>
                                <div className="sidebar-form row-form">
                                    <input placeholder="Name" value={newGradeEntry.name} onChange={e => setNewGradeEntry({...newGradeEntry, name: e.target.value})} />
                                    <input placeholder="Score" type="number" style={{width:'60px'}} value={newGradeEntry.score} onChange={e => setNewGradeEntry({...newGradeEntry, score: e.target.value})} />
                                    <span style={{color:'white'}}>/</span>
                                    <input placeholder="Total" type="number" style={{width:'60px'}} value={newGradeEntry.totalPoints} onChange={e => setNewGradeEntry({...newGradeEntry, totalPoints: e.target.value})} />
                                    <select value={newGradeEntry.category} onChange={e => setNewGradeEntry({...newGradeEntry, category: e.target.value})}>{assignmentTypes.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                    <button onClick={handleAddGrade} className="btn-small">Add</button>
                                </div>
                                
                                <div className="grades-list">
                                    {/* Manual Entries List */}
                                    {gradeEntries.map(g => (
                                        editingGradeId === g.id ? (
                                            <div key={g.id} className="grade-item editing-row">
                                                <div style={{display:'flex', gap:'5px', width:'100%', minWidth: 0}}>
                                                    <select 
                                                        value={editGradeData.category} 
                                                        onChange={e=>setEditGradeData({...editGradeData, category:e.target.value})} 
                                                        style={{width:'100px', flexShrink:0, padding:'2px'}}
                                                    >
                                                        {assignmentTypes.map(t=><option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                    <input 
                                                        value={editGradeData.name} 
                                                        onChange={e=>setEditGradeData({...editGradeData, name:e.target.value})} 
                                                        placeholder="Name" 
                                                        style={{flexGrow:1, minWidth:'80px', padding:'4px'}}
                                                    />
                                                </div>
                                                
                                                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'2px'}}>
                                                    <input 
                                                        value={editGradeData.score} 
                                                        onChange={e=>setEditGradeData({...editGradeData, score:e.target.value})} 
                                                        style={{width:'35px', textAlign:'center', padding:'4px'}}
                                                    /> 
                                                    <span style={{opacity:0.5}}>/</span> 
                                                    <input 
                                                        value={editGradeData.totalPoints} 
                                                        onChange={e=>setEditGradeData({...editGradeData, totalPoints:e.target.value})} 
                                                        style={{width:'35px', textAlign:'center', padding:'4px', marginRight:'15px'}} 
                                                    />
                                                </div>

                                                <div style={{display:'flex', gap:'4px', justifyContent:'end'}}>
                                                    <button onClick={saveEditedGradeList} className="btn-small" style={{background:'#4CAF50', padding:'4px 8px', minWidth:'25px'}}>✓</button>
                                                    <button onClick={cancelEditGradeList} className="btn-small" style={{background:'#f44336', padding:'4px 8px', minWidth:'25px'}}>✕</button>
                                                    <button onClick={handleDeleteFromEdit} className="btn-small" style={{background:'#ff4d4d', padding:'4px 8px', minWidth:'25px'}}>🗑</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={g.id} className="grade-item">
                                                <span>{g.category}: {g.name}</span>
                                                <span>{g.score}/{g.totalPoints}</span>
                                                <button onClick={()=>startEditingGradeList(g, 'manual')} className="x-btn" style={{color:'#aaa', justifySelf:'end'}}>⋮</button>
                                            </div>
                                        )
                                    ))}

                                    {/* Tracker Entries List */}
                                    {assessments.map(assess => (
                                        editingGradeId === assess.id ? (
                                            <div key={`tracker-edit-${assess.id}`} className="grade-item editing-row">
                                                <div style={{display:'flex', gap:'5px', width:'100%', minWidth: 0}}>
                                                    <select 
                                                        value={editGradeData.category} 
                                                        onChange={e=>setEditGradeData({...editGradeData, category:e.target.value})} 
                                                        style={{width:'100px', flexShrink:0, padding:'2px'}}
                                                    >
                                                        {assignmentTypes.map(t=><option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                    <input 
                                                        value={editGradeData.name} 
                                                        onChange={e=>setEditGradeData({...editGradeData, name:e.target.value})} 
                                                        style={{flexGrow:1, minWidth:'80px', padding:'4px'}}
                                                    />
                                                </div>

                                                <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:'2px'}}>
                                                    <input 
                                                        value={editGradeData.score} 
                                                        onChange={e=>setEditGradeData({...editGradeData, score:e.target.value})} 
                                                        style={{width:'35px', textAlign:'center', padding:'4px'}}
                                                    /> 
                                                    <span style={{opacity:0.5}}>/</span> 
                                                    <input 
                                                        value={editGradeData.totalPoints} 
                                                        onChange={e=>setEditGradeData({...editGradeData, totalPoints:e.target.value})} 
                                                        style={{width:'35px', textAlign:'center', padding:'4px', marginRight:'15px'}} 
                                                    />
                                                </div>

                                                <div style={{display:'flex', gap:'4px', justifyContent:'end'}}>
                                                    <button onClick={saveEditedGradeList} className="btn-small" style={{background:'#4CAF50', padding:'4px 8px', minWidth:'25px'}}>✓</button>
                                                    <button onClick={cancelEditGradeList} className="btn-small" style={{background:'#f44336', padding:'4px 8px', minWidth:'25px'}}>✕</button>
                                                    <button onClick={handleDeleteFromEdit} className="btn-small" style={{background:'#ff4d4d', padding:'4px 8px', minWidth:'25px'}}>🗑</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div key={`tracker-${assess.id}`} className="grade-item tracker-grade">
                                                <span>{assess.name} <span style={{fontSize:'0.8rem', opacity:0.7}}>({assess.type})</span></span>
                                                <span>{assess.grade || 0}/100</span>
                                                <button onClick={()=>startEditingGradeList(assess, 'tracker')} className="x-btn" style={{color:'#aaa', justifySelf:'end'}}>⋮</button>
                                            </div>
                                        )
                                    ))}
                                </div>
                            </div>

                            {/* 3. RESULTS */}
                            <div className="calc-card result-card">
                                <h3>Predictive Engine</h3>
                                <div className="prediction-input"><label>Desired Grade:</label><input type="number" value={targetGrade} onChange={e => setTargetGrade(e.target.value)} /><span>%</span></div>
                                {calculationResult && (
                                    <div className="results-display">
                                        <div className="res-row"><span>Current Grade (Normalized):</span><span className="highlight">{calculationResult.currentGrade}%</span></div>
                                        <div className="results-actions" style={{textAlign: 'right', marginBottom: '5px'}}>
                                            <small style={{cursor:'pointer', color:'#aaa'}} onClick={()=>setShowAbsolute(!showAbsolute)}>{showAbsolute ? 'Hide' : 'Show'} Absolute Avg</small>
                                        </div>
                                        {showAbsolute && (
                                            <div className="res-row"><span>Current Average (Absolute):</span><span className="highlight" style={{color:'#ddd'}}>{calculationResult.absoluteAverage}%</span></div>
                                        )}
                                        <div style={{margin:'15px 0', borderTop:'1px solid rgba(255,255,255,0.1)'}}></div>
                                        <div className="res-row"><span>Required Score (Remaining {calculationResult.remainingWeight}%):</span><span className="highlight" style={{color: calculationResult.requiredScore > 100 ? '#ff4d4d' : '#61dafb'}}>{calculationResult.requiredScore}%</span></div>
                                        <div className="study-prediction"><h4>Time Prediction</h4>{calculationResult.hasRegression ? (<p>Estimated study time needed:<br/><span className="giant-text">{calculationResult.predictedHours} Hours</span></p>) : (<p style={{opacity:0.7}}>Not enough data to predict time.</p>)}</div>
                                    </div>
                                )}
                            </div>
                          </>
                      )}
                  </div>
              )}
            </div>
          </>
        )}
      </header>
    </div>
  );
}

export default App;