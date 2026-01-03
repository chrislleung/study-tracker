import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

function App() {
  // Global State
  const [semesters, setSemesters] = useState([]);
  const [activeSemesterId, setActiveSemesterId] = useState(null);
  const [newSemesterName, setNewSemesterName] = useState("");
  const [viewingArchived, setViewingArchived] = useState(false); // Toggle between Active/Archived

  // UI State
  const [openTabMenu, setOpenTabMenu] = useState(null); // Tracks which tab dropdown is open

  // Tab-Specific State
  const [isStudying, setIsStudying] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [newSubjectName, setNewSubjectName] = useState("");
  const [showManageClasses, setShowManageClasses] = useState(false);

  // Filter Semesters based on view mode
  const displayedSemesters = useMemo(() => {
    return semesters.filter(s => !!s.archived === viewingArchived);
  }, [semesters, viewingArchived]);

  // Calculate Summary Stats (Right Column)
  const subjectSummaries = useMemo(() => {
    const summary = {};
    sessions.forEach(session => {
      if (!summary[session.subject]) {
        summary[session.subject] = 0;
      }
      summary[session.subject] += session.durationSeconds;
    });
    // Convert to array for sorting
    return Object.entries(summary)
      .map(([name, totalSeconds]) => ({ name, totalSeconds }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [sessions]);

  // Initial Fetch
  useEffect(() => {
    fetchSemesters();
  }, []);

  // Fetch Data when Semester Changes
  useEffect(() => {
    if (activeSemesterId) {
      fetchSubjects(activeSemesterId);
      fetchSessions(activeSemesterId);
      setSelectedSubject("");
      setIsStudying(false);
      setElapsed(0);
    } else {
      setSubjects([]);
      setSessions([]);
    }
  }, [activeSemesterId]);

  // Timer logic
  useEffect(() => {
    let interval = null;
    if (isStudying) {
      interval = setInterval(() => {
        setElapsed((Date.now() - startTime) / 1000);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isStudying, startTime]);

  // Close dropdowns if clicking elsewhere
  useEffect(() => {
    const closeMenu = () => setOpenTabMenu(null);
    document.addEventListener('click', closeMenu);
    return () => document.removeEventListener('click', closeMenu);
  }, []);

  // --- API Calls ---

  const fetchSemesters = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/semesters');
      const data = await response.json();
      setSemesters(data);
      
      // If we have active semesters and no active ID, select the first one
      const actives = data.filter(s => !s.archived);
      if (actives.length > 0 && !activeSemesterId) {
        setActiveSemesterId(actives[0].id);
      }
    } catch (error) {
      console.error("Error fetching semesters:", error);
    }
  };

  const fetchSubjects = async (semesterId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/subjects?semesterId=${semesterId}`);
      const data = await response.json();
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
    }
  };

  const fetchSessions = async (semesterId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/sessions?semesterId=${semesterId}`);
      const data = await response.json();
      setSessions(data.reverse());
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  // --- Handlers ---

  const handleAddSemester = async () => {
    if (!newSemesterName.trim()) return;
    try {
      const response = await fetch('http://localhost:8080/api/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSemesterName, archived: false }),
      });
      const newSem = await response.json();
      setNewSemesterName("");
      setSemesters([...semesters, newSem]);
      if (!viewingArchived) setActiveSemesterId(newSem.id);
    } catch (error) {
      console.error("Error adding semester:", error);
    }
  };

  const handleArchiveSemester = async (id, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:8080/api/semesters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: !currentStatus }), // Toggle status
      });
      const updated = await response.json();
      
      // Update local state
      const updatedSemesters = semesters.map(s => s.id === id ? updated : s);
      setSemesters(updatedSemesters);

      // If we just archived the active one, switch tabs
      if (activeSemesterId === id) {
        setActiveSemesterId(null);
      }
    } catch (error) {
      console.error("Error updating semester:", error);
    }
  };

  const handleDeleteSemester = async (id) => {
    if (!window.confirm("Permanently delete this semester?")) return;
    try {
      await fetch(`http://localhost:8080/api/semesters/${id}`, { method: 'DELETE' });
      const updatedSemesters = semesters.filter(s => s.id !== id);
      setSemesters(updatedSemesters);
      if (activeSemesterId === id) setActiveSemesterId(null);
    } catch (error) {
      console.error("Error deleting semester:", error);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim() || !activeSemesterId) return;
    try {
      await fetch('http://localhost:8080/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newSubjectName, semesterId: activeSemesterId }),
      });
      setNewSubjectName("");
      fetchSubjects(activeSemesterId);
    } catch (error) {
      console.error("Error adding subject:", error);
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/subjects/${id}`, { method: 'DELETE' });
      fetchSubjects(activeSemesterId);
    } catch (error) {
      console.error("Error deleting subject:", error);
    }
  };

  const handleStart = () => {
    if (!selectedSubject) return alert("Please select a class first!");
    setStartTime(Date.now());
    setIsStudying(true);
    setElapsed(0);
  };

  const handleStop = async () => {
    setIsStudying(false);
    const endTime = Date.now();
    const sessionData = {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationSeconds: Math.floor((endTime - startTime) / 1000),
      subject: selectedSubject,
      semesterId: activeSemesterId
    };
    try {
      await fetch('http://localhost:8080/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
      });
      fetchSessions(activeSemesterId);
    } catch (error) {
      console.error("Error saving session:", error);
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📚 Study Tracker</h1>

        {/* --- Archive Toggle --- */}
        <div className="view-toggle">
          <button 
            className={`toggle-btn ${!viewingArchived ? 'active' : ''}`} 
            onClick={() => { setViewingArchived(false); setActiveSemesterId(null); }}
          >
            Current Semesters
          </button>
          <button 
            className={`toggle-btn ${viewingArchived ? 'active' : ''}`} 
            onClick={() => { setViewingArchived(true); setActiveSemesterId(null); }}
          >
            Archived Semesters
          </button>
        </div>

        {/* --- TABS --- */}
        <div className="tabs-container">
          {displayedSemesters.length === 0 && <div className="no-semesters-msg">No {viewingArchived ? 'archived' : 'active'} semesters found.</div>}
          
          {displayedSemesters.map(sem => (
            <div 
              key={sem.id} 
              className={`tab ${activeSemesterId === sem.id ? 'active-tab' : ''}`}
              onClick={() => setActiveSemesterId(sem.id)}
            >
              {sem.name}
              
              {/* Dropdown Menu Trigger */}
              <div 
                className="tab-menu-trigger" 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenTabMenu(openTabMenu === sem.id ? null : sem.id);
                }}
              >
                ⋮
              </div>

              {/* Dropdown Menu */}
              {openTabMenu === sem.id && (
                <div className="tab-dropdown">
                  <div onClick={() => handleArchiveSemester(sem.id, sem.archived)}>
                    {sem.archived ? "Unarchive" : "Archive"}
                  </div>
                  <div onClick={() => handleDeleteSemester(sem.id)} className="delete-option">
                    Delete
                  </div>
                </div>
              )}
            </div>
          ))}

          {!viewingArchived && (
            <div className="add-tab-container">
              <input 
                type="text" 
                placeholder="New Semester..."
                value={newSemesterName}
                onChange={(e) => setNewSemesterName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSemester()}
              />
              <button onClick={handleAddSemester}>+</button>
            </div>
          )}
        </div>

        {/* --- MAIN SPLIT LAYOUT --- */}
        {activeSemesterId && (
          <div className="main-layout">
            
            {/* LEFT COLUMN: Controls & History */}
            <div className="content-area">
              
              {/* Timer */}
              <div className="timer-container">
                <select 
                  value={selectedSubject} 
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  disabled={isStudying}
                  className="subject-select"
                >
                  <option value="" disabled>Select a Class</option>
                  {subjects.map(sub => (
                    <option key={sub.id} value={sub.name}>{sub.name}</option>
                  ))}
                </select>

                <h2>{formatTime(elapsed)}</h2>
                {!isStudying ? (
                  <button className="btn start" onClick={handleStart} disabled={viewingArchived}>Start Studying</button>
                ) : (
                  <button className="btn stop" onClick={handleStop}>Stop & Save</button>
                )}
              </div>

              {/* Class Manager */}
              <div className="management-container">
                <div className="management-header" onClick={() => setShowManageClasses(!showManageClasses)}>
                  <h3>Manage Classes</h3>
                  <span className="toggle-icon">{showManageClasses ? "▲" : "▼"}</span>
                </div>
                {showManageClasses && (
                  <div className="management-content">
                    {!viewingArchived && (
                      <div className="add-subject-row">
                        <input 
                          type="text" 
                          placeholder="New Class Name" 
                          value={newSubjectName}
                          onChange={(e) => setNewSubjectName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
                        />
                        <button onClick={handleAddSubject} className="btn-small">Add</button>
                      </div>
                    )}
                    <div className="subject-list">
                      {subjects.map(sub => (
                        <span key={sub.id} className="subject-tag">
                          {sub.name} 
                          {!viewingArchived && <button onClick={() => handleDeleteSubject(sub.id)} className="x-btn">x</button>}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* History Table */}
              <div className="history-container">
                <h3>Session History</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Class</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.length === 0 ? (
                      <tr><td colSpan="3" style={{textAlign:'center'}}>No study sessions yet.</td></tr>
                    ) : (
                      sessions.map((session) => (
                        <tr key={session.id}>
                          <td>{new Date(session.startTime).toLocaleDateString()}</td>
                          <td>{session.subject}</td>
                          <td>{formatTime(session.durationSeconds)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT COLUMN: Statistics */}
            <div className="summary-sidebar">
              <h3>Subject Totals</h3>
              <div className="summary-list">
                {subjectSummaries.length === 0 ? (
                  <p>No study data recorded.</p>
                ) : (
                  subjectSummaries.map((item, index) => (
                    <div key={index} className="summary-card">
                      <span className="summary-name">{item.name}</span>
                      <span className="summary-time">{formatTime(item.totalSeconds)}</span>
                    </div>
                  ))
                )}
              </div>
              <div className="total-semester-time">
                <h4>Total Semester Time</h4>
                <p>{formatTime(subjectSummaries.reduce((acc, curr) => acc + curr.totalSeconds, 0))}</p>
              </div>
            </div>

          </div>
        )}
      </header>
    </div>
  );
}

export default App;