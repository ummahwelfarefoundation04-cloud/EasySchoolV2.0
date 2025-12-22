
import React, { useState, useEffect } from 'react';
import { MasterData, Student, SchoolProfile, ClassExamSchedule, ExamScheduleItem } from '../types';
import { FileText, ClipboardList, Printer, Calendar, Save, Filter, Search, Award, Plus, Trash2, Edit2, BookOpen, Medal, X, Clock, Copy, Settings, ShieldCheck, CheckSquare, CheckCircle, ChevronDown, ChevronUp, Users, Square, PieChart, School } from 'lucide-react';

interface ExamModuleProps {
  students: Student[];
  masterData: MasterData;
  schoolProfile: SchoolProfile;
  onUpdateStudents: (students: Student[]) => void;
  onUpdateMasterData: (masterData: MasterData) => void;
}

const ExamModule: React.FC<ExamModuleProps> = ({ students, masterData, schoolProfile, onUpdateStudents, onUpdateMasterData }) => {
  const [activeTab, setActiveTab] = useState<'config' | 'coScholastic' | 'schedule' | 'admitCard' | 'marks' | 'result'>('config');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Common Filters
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  // ------------------------------------------------------------------------------------------
  // CONFIGURATION STATE (Exams)
  // ------------------------------------------------------------------------------------------
  const [newTermName, setNewTermName] = useState('');
  const [selectedTermForExam, setSelectedTermForExam] = useState('');
  const [newExamName, setNewExamName] = useState('');
  const [newExamMarks, setNewExamMarks] = useState('');
  const [selectedExamSubjects, setSelectedExamSubjects] = useState<string[]>([]);
  const [editingExamName, setEditingExamName] = useState<string | null>(null);

  // ------------------------------------------------------------------------------------------
  // CO-SCHOLASTIC STATE
  // ------------------------------------------------------------------------------------------
  const [selectedCoScholasticArea, setSelectedCoScholasticArea] = useState<string>('General');
  const [newCoScholasticArea, setNewCoScholasticArea] = useState('');
  const [newCoScholasticSubject, setNewCoScholasticSubject] = useState('');
  const [selectedClassForCoScholastic, setSelectedClassForCoScholastic] = useState('');
  const [selectedAreasToAdd, setSelectedAreasToAdd] = useState<string[]>([]);

  // ------------------------------------------------------------------------------------------
  // SCHEDULER STATE
  // ------------------------------------------------------------------------------------------
  const [schedulerClass, setSchedulerClass] = useState('');
  const [schedulerTerm, setSchedulerTerm] = useState('');
  const [schedulerExam, setSchedulerExam] = useState('');
  const [schedulerEntries, setSchedulerEntries] = useState<Record<string, {date: string, startTime: string, endTime: string}>>({});
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);

  // Marks Entry State
  const [marksSortBy, setMarksSortBy] = useState<'rollNo' | 'name'>('rollNo');

  // Admit Card Config State
  const [admitCardConfig, setAdmitCardConfig] = useState({
    showStudentId: true,
    showDob: true,
    showGender: true,
    showPhoto: true,
    showFatherName: true,
    showMotherName: false,
    showAddress: false,
    showSchoolHeader: true,
    showNote: true,
  });
  const [admitCardNote, setAdmitCardNote] = useState(
    "Important Instructions:\n1. Report to the examination hall 15 minutes before the scheduled time.\n2. Do not carry mobile phones or any electronic devices.\n3. Keep this admit card safe for future reference."
  );

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  // ------------------------------------------------------------------------------------------
  // HELPER FUNCTIONS
  // ------------------------------------------------------------------------------------------
  
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getFilteredStudents = () => {
    let filtered = students.filter(
      (s) => s.class === selectedClass && (selectedSection ? s.section === selectedSection : true)
    );
    // Sort
    return filtered.sort((a, b) => {
      if (marksSortBy === 'name') return a.firstName.localeCompare(b.firstName);
      // For Roll No, try numeric sort if possible
      const rollA = parseInt(a.rollNo) || 0;
      const rollB = parseInt(b.rollNo) || 0;
      if (rollA && rollB) return rollA - rollB;
      return a.rollNo.localeCompare(b.rollNo);
    });
  };

  const filteredStudents = getFilteredStudents();

  // Reset selected students when filters change
  useEffect(() => {
    if (activeTab === 'admitCard' || activeTab === 'result') {
        setSelectedStudentIds(filteredStudents.map(s => s.id));
    }
  }, [selectedClass, selectedSection, activeTab]); // Dependencies trigger reset

  const getExamDefinition = () => {
    return masterData.termExams[selectedTerm]?.find((e) => e.name === selectedExam);
  };

  const getExamSchedule = (): ClassExamSchedule | undefined => {
    return masterData.examSchedules?.find(
      (s) => s.className === selectedClass && s.term === selectedTerm && s.examName === selectedExam
    );
  };

  const calculateGrade = (percentage: number) => {
    if (percentage >= 91) return 'A1';
    if (percentage >= 81) return 'A2';
    if (percentage >= 71) return 'B1';
    if (percentage >= 61) return 'B2';
    if (percentage >= 51) return 'C1';
    if (percentage >= 41) return 'C2';
    if (percentage >= 33) return 'D';
    return 'E'; // Needs Improvement
  };

  // ------------------------------------------------------------------------------------------
  // CONFIGURATION LOGIC (Handlers)
  // ------------------------------------------------------------------------------------------
  
  const handleAddExamTerm = () => {
    if (!newTermName) return;
    if (masterData.examTerms.includes(newTermName)) {
      alert('Term already exists');
      return;
    }
    
    onUpdateMasterData({
      ...masterData,
      examTerms: [...masterData.examTerms, newTermName],
      termExams: {
        ...masterData.termExams,
        [newTermName]: [] // Initialize empty exams for new term
      },
      termCoScholasticAreas: {
        ...masterData.termCoScholasticAreas,
        [newTermName]: [] // Initialize empty co-scholastic for new term
      }
    });
    setNewTermName('');
    setSelectedTermForExam(newTermName);
    showNotification('Term added successfully!');
  };

  const handleDeleteExamTerm = (term: string) => {
    if (masterData.examTerms.length <= 1) {
      alert('At least one term is required.');
      return;
    }
    if (window.confirm(`Delete "${term}" and all its defined exams?`)) {
      const newTerms = masterData.examTerms.filter(t => t !== term);
      const newTermExams = { ...masterData.termExams };
      delete newTermExams[term];
      
      const newTermCoScholastic = { ...masterData.termCoScholasticAreas };
      delete newTermCoScholastic[term];

      onUpdateMasterData({
        ...masterData,
        examTerms: newTerms,
        termExams: newTermExams,
        termCoScholasticAreas: newTermCoScholastic
      });
      
      if (selectedTermForExam === term) {
        setSelectedTermForExam(newTerms[0]);
      }
      showNotification('Term deleted successfully!');
    }
  };

  const handleSaveExamToTerm = () => {
    if (!selectedTermForExam || !newExamName || !newExamMarks) return;
    
    const marks = parseInt(newExamMarks);
    if (isNaN(marks) || marks <= 0) {
      alert('Please enter valid max marks');
      return;
    }

    const currentExams = masterData.termExams[selectedTermForExam] || [];
    
    // Check for duplicates (excluding itself if editing)
    const isDuplicate = currentExams.some(e => e.name === newExamName && e.name !== editingExamName);
    if (isDuplicate) {
      alert('Exam name already exists in this term');
      return;
    }

    const newExamDef = { 
        name: newExamName, 
        maxMarks: marks,
        subjects: selectedExamSubjects 
    };

    let updatedExams;
    if (editingExamName) {
        // Update
        updatedExams = currentExams.map(e => 
            e.name === editingExamName ? newExamDef : e
        );
    } else {
        // Add new
        updatedExams = [...currentExams, newExamDef];
    }

    onUpdateMasterData({
      ...masterData,
      termExams: {
        ...masterData.termExams,
        [selectedTermForExam]: updatedExams
      }
    });
    
    // Reset
    setNewExamName('');
    setNewExamMarks('');
    setSelectedExamSubjects([]);
    setEditingExamName(null);
    showNotification('Exam saved successfully!');
  };

  const handleEditExamClick = (exam: { name: string, maxMarks: number, subjects: string[] }) => {
    setNewExamName(exam.name);
    setNewExamMarks(exam.maxMarks.toString());
    setSelectedExamSubjects(exam.subjects || []);
    setEditingExamName(exam.name);
  };

  const handleCancelEditExam = () => {
    setNewExamName('');
    setNewExamMarks('');
    setSelectedExamSubjects([]);
    setEditingExamName(null);
  };

  const handleDeleteExamFromTerm = (examName: string) => {
    if (!selectedTermForExam) return;
    if (editingExamName === examName) handleCancelEditExam();

    const currentExams = masterData.termExams[selectedTermForExam] || [];
    
    onUpdateMasterData({
      ...masterData,
      termExams: {
        ...masterData.termExams,
        [selectedTermForExam]: currentExams.filter(e => e.name !== examName)
      }
    });
    showNotification('Exam deleted successfully!');
  };

  const toggleExamSubject = (subject: string) => {
      setSelectedExamSubjects(prev => 
          prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
      );
  };

  const selectAllExamSubjects = () => {
      setSelectedExamSubjects(masterData.subjects);
  };
  
  const handleAddCoScholasticToTerm = (area: string) => {
      if (!selectedTermForExam) return;
      const current = masterData.termCoScholasticAreas?.[selectedTermForExam] || [];
      if (!current.includes(area)) {
          onUpdateMasterData({
              ...masterData,
              termCoScholasticAreas: {
                  ...masterData.termCoScholasticAreas,
                  [selectedTermForExam]: [...current, area]
              }
          });
          showNotification('Area assigned to term!');
      }
  };

  const handleRemoveCoScholasticFromTerm = (area: string) => {
      if (!selectedTermForExam) return;
      const current = masterData.termCoScholasticAreas?.[selectedTermForExam] || [];
      onUpdateMasterData({
          ...masterData,
          termCoScholasticAreas: {
              ...masterData.termCoScholasticAreas,
              [selectedTermForExam]: current.filter(a => a !== area)
          }
      });
      showNotification('Area removed from term!');
  };

  // ------------------------------------------------------------------------------------------
  // CO-SCHOLASTIC MANAGEMENT HANDLERS
  // ------------------------------------------------------------------------------------------
  
  const handleAddCoScholasticArea = () => {
    if(!newCoScholasticArea) return;
    if(masterData.coScholasticSubjects[newCoScholasticArea]) {
      alert('Area already exists');
      return;
    }
    onUpdateMasterData({
      ...masterData,
      coScholasticSubjects: {
        ...masterData.coScholasticSubjects,
        [newCoScholasticArea]: []
      }
    });
    setSelectedCoScholasticArea(newCoScholasticArea);
    setNewCoScholasticArea('');
    showNotification('New Area created successfully!');
  };

  const handleDeleteCoScholasticArea = (area: string) => {
    if(Object.keys(masterData.coScholasticSubjects).length <= 1) {
      alert('At least one area is required.');
      return;
    }
    if(window.confirm(`Delete area "${area}" and all its subjects?`)) {
      const newMap = { ...masterData.coScholasticSubjects };
      delete newMap[area];
      
      const newClassMap = { ...masterData.classCoScholasticAreas };
      Object.keys(newClassMap).forEach(cls => {
        newClassMap[cls] = newClassMap[cls].filter(a => a !== area);
      });

      const newTermMap = { ...masterData.termCoScholasticAreas };
      Object.keys(newTermMap).forEach(term => {
         if (newTermMap[term]) {
            newTermMap[term] = newTermMap[term].filter(a => a !== area);
         }
      });
      
      onUpdateMasterData({
        ...masterData,
        coScholasticSubjects: newMap,
        classCoScholasticAreas: newClassMap,
        termCoScholasticAreas: newTermMap
      });
      setSelectedCoScholasticArea(Object.keys(newMap)[0]);
      showNotification('Area deleted successfully!');
    }
  };

  const handleAddCoScholasticSubject = () => {
    if(!newCoScholasticSubject || !selectedCoScholasticArea) return;
    
    const currentSubjects = masterData.coScholasticSubjects[selectedCoScholasticArea] || [];
    if(currentSubjects.includes(newCoScholasticSubject)) {
      alert('Subject already exists in this area');
      return;
    }

    onUpdateMasterData({
      ...masterData,
      coScholasticSubjects: {
        ...masterData.coScholasticSubjects,
        [selectedCoScholasticArea]: [...currentSubjects, newCoScholasticSubject]
      }
    });
    setNewCoScholasticSubject('');
    showNotification('Subject added to area!');
  };

  const handleDeleteCoScholasticSubject = (subject: string) => {
    if(!selectedCoScholasticArea) return;
    const currentSubjects = masterData.coScholasticSubjects[selectedCoScholasticArea] || [];
    onUpdateMasterData({
      ...masterData,
      coScholasticSubjects: {
        ...masterData.coScholasticSubjects,
        [selectedCoScholasticArea]: currentSubjects.filter(s => s !== subject)
      }
    });
    showNotification('Subject deleted!');
  };

  const handleAddAreasToClass = () => {
    if (!selectedClassForCoScholastic || selectedAreasToAdd.length === 0) return;
    
    const currentAreas = masterData.classCoScholasticAreas?.[selectedClassForCoScholastic] || [];
    const newAreas = selectedAreasToAdd.filter(area => !currentAreas.includes(area));
    
    if (newAreas.length === 0) {
      alert('Selected areas are already assigned to this class.');
      return;
    }

    onUpdateMasterData({
      ...masterData,
      classCoScholasticAreas: {
        ...masterData.classCoScholasticAreas,
        [selectedClassForCoScholastic]: [...currentAreas, ...newAreas]
      }
    });
    
    setSelectedAreasToAdd([]);
    showNotification('Areas assigned to class successfully!');
  };

  const handleRemoveAreaFromClass = (className: string, area: string) => {
    const currentAreas = masterData.classCoScholasticAreas?.[className] || [];
    onUpdateMasterData({
      ...masterData,
      classCoScholasticAreas: {
        ...masterData.classCoScholasticAreas,
        [className]: currentAreas.filter(a => a !== area)
      }
    });
    showNotification('Area removed from class!');
  };

  const toggleAreaSelection = (area: string) => {
    setSelectedAreasToAdd(prev => 
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  // ------------------------------------------------------------------------------------------
  // SCHEDULER LOGIC (Handlers)
  // ------------------------------------------------------------------------------------------

  const getApplicableSubjectsForSchedule = () => {
    if (!schedulerClass || !schedulerTerm || !schedulerExam) return [];
    
    const examDef = masterData.termExams[schedulerTerm]?.find(e => e.name === schedulerExam);
    const classSubjects = masterData.classSubjects[schedulerClass]?.map(s => s.name) || [];
    
    if (!examDef || !examDef.subjects) return [];

    return examDef.subjects.filter(s => classSubjects.includes(s));
  };

  useEffect(() => {
    if (activeTab === 'schedule' && schedulerClass && schedulerTerm && schedulerExam) {
       const existing = masterData.examSchedules?.find(s => 
          s.className === schedulerClass && 
          s.term === schedulerTerm && 
          s.examName === schedulerExam
       );
       
       if (existing) {
          setActiveScheduleId(existing.id);
          const map: any = {};
          existing.schedule.forEach(item => {
             map[item.subject] = { date: item.date, startTime: item.startTime, endTime: item.endTime };
          });
          setSchedulerEntries(map);
       } else {
          setActiveScheduleId(null);
          const subjects = getApplicableSubjectsForSchedule();
          const map: any = {};
          subjects.forEach(sub => {
             map[sub] = { date: '', startTime: '', endTime: '' };
          });
          setSchedulerEntries(map);
       }
    }
  }, [schedulerClass, schedulerTerm, schedulerExam, masterData, activeTab]);

  const handleScheduleEntryChange = (subject: string, field: 'date' | 'startTime' | 'endTime', value: string) => {
    setSchedulerEntries(prev => ({
      ...prev,
      [subject]: { ...prev[subject], [field]: value }
    }));
  };

  const handleCopyStartTimeToAll = () => {
    const subjects = Object.keys(schedulerEntries);
    if (subjects.length === 0) return;
    const firstSubject = subjects[0];
    const { startTime } = schedulerEntries[firstSubject];
    if (!startTime) return;

    setSchedulerEntries(prev => {
       const next = { ...prev };
       subjects.forEach(sub => {
          next[sub] = { ...next[sub], startTime };
       });
       return next;
    });
    showNotification('Start time copied!');
  };

  const handleCopyEndTimeToAll = () => {
    const subjects = Object.keys(schedulerEntries);
    if (subjects.length === 0) return;
    const firstSubject = subjects[0];
    const { endTime } = schedulerEntries[firstSubject];
    if (!endTime) return;

    setSchedulerEntries(prev => {
       const next = { ...prev };
       subjects.forEach(sub => {
          next[sub] = { ...next[sub], endTime };
       });
       return next;
    });
    showNotification('End time copied!');
  };

  const handleSaveSchedule = () => {
    if (!schedulerClass || !schedulerTerm || !schedulerExam) return;
    
    const scheduleItems: ExamScheduleItem[] = Object.keys(schedulerEntries).map(subject => ({
       subject,
       ...schedulerEntries[subject]
    })).filter(item => item.date); 

    if (scheduleItems.length === 0) {
      alert("Please enter dates for at least one subject.");
      return;
    }

    const newSchedule: ClassExamSchedule = {
       id: activeScheduleId || Date.now().toString(),
       className: schedulerClass,
       term: schedulerTerm,
       examName: schedulerExam,
       schedule: scheduleItems
    };

    const currentSchedules = masterData.examSchedules || [];
    const updatedSchedules = activeScheduleId 
       ? currentSchedules.map(s => s.id === activeScheduleId ? newSchedule : s)
       : [...currentSchedules, newSchedule];

    onUpdateMasterData({
      ...masterData,
      examSchedules: updatedSchedules
    });
    
    showNotification('Exam Schedule Saved Successfully!');
  };
  
  const handleDeleteSchedule = (id: string) => {
    if (window.confirm("Are you sure you want to delete this schedule?")) {
       onUpdateMasterData({
         ...masterData,
         examSchedules: (masterData.examSchedules || []).filter(s => s.id !== id)
       });
       if (activeScheduleId === id) {
          setSchedulerEntries({});
          setActiveScheduleId(null);
       }
       showNotification('Schedule deleted!');
    }
  };


  // ------------------------------------------------------------------------------------------
  // VIEWS
  // ------------------------------------------------------------------------------------------

  // View: Configuration
  const ConfigurationView = () => (
      <div className="bg-white p-6 rounded-lg shadow border">
         <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
           <Settings className="text-blue-600" /> Exam Configuration
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Term Manager (Left) */}
            <div className="space-y-4 border-r pr-0 md:pr-8">
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-2">Terms</label>
                 <div className="space-y-1">
                   {masterData.examTerms.map(term => (
                     <div 
                       key={term}
                       onClick={() => {
                         setSelectedTermForExam(term);
                         handleCancelEditExam(); // Reset any active edit when switching terms
                       }}
                       className={`flex justify-between items-center p-3 rounded cursor-pointer transition ${
                         selectedTermForExam === term 
                         ? 'bg-blue-50 border border-blue-200 text-blue-800' 
                         : 'hover:bg-slate-50 border border-transparent'
                       }`}
                     >
                        <span className="font-medium">{term}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                             {masterData.termExams?.[term]?.length || 0} Exams
                           </span>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDeleteExamTerm(term); }}
                             className="text-slate-400 hover:text-red-500 p-1"
                             title="Delete Term"
                           >
                             <Trash2 size={14} />
                           </button>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div className="pt-4 border-t mt-4">
                 <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Add New Term</label>
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newTermName}
                      onChange={(e) => setNewTermName(e.target.value)}
                      placeholder="e.g. Mid Term"
                      className="flex-1 border rounded p-2 text-sm"
                    />
                    <button onClick={handleAddExamTerm} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700">
                      <Plus size={18} />
                    </button>
                 </div>
               </div>
            </div>

            {/* Exam Manager (Right) */}
            <div className="md:col-span-2 space-y-8">
               
               {selectedTermForExam ? (
                 <>
                   {/* Scholastic Assessments */}
                   <div className="bg-slate-50 p-4 rounded-lg border">
                      <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
                         <span>Scholastic Assessments ({selectedTermForExam})</span>
                         <span className="text-xs font-normal bg-indigo-100 text-indigo-800 px-2 py-1 rounded border border-indigo-200 flex items-center gap-1">
                           <ClipboardList size={12}/> Configure Marks & Subjects
                         </span>
                      </h3>
                      
                      {/* Exam Input Area */}
                      <div className={`mb-4 p-3 rounded border shadow-sm transition-colors ${editingExamName ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                        <div className="flex gap-2 mb-2">
                            <input 
                              type="text" 
                              value={newExamName}
                              onChange={(e) => setNewExamName(e.target.value)}
                              placeholder="Exam Name (e.g. Unit Test 1)"
                              className="flex-[2] border rounded p-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                            <input 
                              type="number" 
                              value={newExamMarks}
                              onChange={(e) => setNewExamMarks(e.target.value)}
                              placeholder="Max Marks"
                              className="flex-1 border rounded p-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                            />
                        </div>
                        
                        {/* Subject Selector for Exam */}
                        <div className="mb-3">
                           <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-semibold text-slate-600">Applicable Subjects:</label>
                              <div className="flex gap-2">
                                <button onClick={selectAllExamSubjects} className="text-xs text-blue-600 hover:underline">Select All</button>
                                <button onClick={() => setSelectedExamSubjects([])} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
                              </div>
                           </div>
                           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-32 overflow-y-auto bg-white border rounded p-2">
                              {masterData.subjects.map(subj => (
                                <label key={subj} className="flex items-center gap-1.5 cursor-pointer">
                                  <input 
                                    type="checkbox" 
                                    checked={selectedExamSubjects.includes(subj)}
                                    onChange={() => toggleExamSubject(subj)}
                                    className="w-3 h-3 text-indigo-600 rounded focus:ring-indigo-500"
                                  />
                                  <span className="text-xs text-slate-700 truncate" title={subj}>{subj}</span>
                                </label>
                              ))}
                           </div>
                        </div>

                        <div className="flex justify-end gap-2">
                            {editingExamName ? (
                              <>
                                <button 
                                  onClick={handleCancelEditExam}
                                  className="bg-slate-300 text-slate-700 px-3 py-1.5 rounded hover:bg-slate-400 text-sm"
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={handleSaveExamToTerm}
                                  className="bg-indigo-600 text-white px-4 py-1.5 rounded hover:bg-indigo-700 flex items-center gap-1 text-sm font-medium"
                                >
                                  <Save size={16} /> Update Exam
                                </button>
                              </>
                            ) : (
                              <button 
                                onClick={handleSaveExamToTerm}
                                className="bg-slate-700 text-white px-4 py-1.5 rounded hover:bg-slate-800 flex items-center gap-1 text-sm font-medium"
                              >
                                <Plus size={16} /> Add Exam
                              </button>
                            )}
                        </div>
                      </div>

                      {/* Exam List */}
                      <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                         {masterData.termExams?.[selectedTermForExam]?.length > 0 ? (
                            masterData.termExams[selectedTermForExam].map((exam, idx) => (
                              <div key={idx} className={`flex justify-between items-center p-3 rounded border shadow-sm transition ${editingExamName === exam.name ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-200'}`}>
                                 <div className="flex flex-col gap-1 overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <div className="min-w-[2rem] h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold px-1">
                                          {exam.maxMarks}
                                        </div>
                                        <span className="text-slate-700 font-medium truncate">{exam.name}</span>
                                    </div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1 ml-10">
                                      <BookOpen size={10} />
                                      {exam.subjects && exam.subjects.length > 0 ? (
                                        <span>{exam.subjects.length} subjects assigned</span>
                                      ) : (
                                        <span className="text-red-400">No subjects assigned</span>
                                      )}
                                    </div>
                                 </div>
                                 <div className="flex gap-2 shrink-0">
                                   <button 
                                     onClick={() => handleEditExamClick(exam)}
                                     className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition"
                                     title="Edit Exam"
                                   >
                                     <Edit2 size={16} />
                                   </button>
                                   <button 
                                     // Fix: Use 'exam.name' from the iterator as 'examName' was undefined
                                     onClick={() => handleDeleteExamFromTerm(exam.name)}
                                     className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition"
                                     title="Delete Exam"
                                   >
                                     <Trash2 size={16} />
                                   </button>
                                 </div>
                              </div>
                            ))
                         ) : (
                            <div className="text-center py-8 text-slate-400 italic">
                              No exams defined for this term. Add one above.
                            </div>
                         )}
                      </div>
                   </div>

                   {/* Co-Scholastic to Term Mapping */}
                   <div className="bg-slate-50 p-4 rounded-lg border">
                      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                        <Medal size={16} className="text-blue-600" /> Co-Scholastic Areas ({selectedTermForExam})
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                             <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Available Areas</p>
                             <div className="space-y-1">
                               {Object.keys(masterData.coScholasticSubjects).map(area => {
                                 const isAssigned = masterData.termCoScholasticAreas?.[selectedTermForExam]?.includes(area);
                                 if (isAssigned) return null;
                                 return (
                                   <div key={area} className="flex justify-between items-center p-2 bg-white border rounded text-sm group">
                                     <span>{area}</span>
                                     <button 
                                       onClick={() => handleAddCoScholasticToTerm(area)}
                                       className="text-blue-600 opacity-0 group-hover:opacity-100 hover:bg-blue-50 p-1 rounded"
                                     >
                                       <Plus size={14} />
                                     </button>
                                   </div>
                                 );
                               })}
                             </div>
                          </div>
                          <div>
                             <p className="text-xs font-semibold text-slate-500 mb-2 uppercase">Assigned to Term</p>
                             <div className="space-y-1">
                               {(masterData.termCoScholasticAreas?.[selectedTermForExam] || []).map(area => (
                                 <div key={area} className="flex justify-between items-center p-2 bg-blue-50 border border-blue-200 text-blue-800 rounded text-sm">
                                     <span>{area}</span>
                                     <button 
                                       onClick={() => handleRemoveCoScholasticFromTerm(area)}
                                       className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1 rounded"
                                     >
                                       <X size={14} />
                                     </button>
                                 </div>
                               ))}
                             </div>
                          </div>
                      </div>
                   </div>
                 </>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed rounded-lg bg-slate-50 min-h-[300px]">
                   <ClipboardList size={40} className="mb-2 opacity-20" />
                   <p>Select a term from the left list to configure exams & co-scholastic areas.</p>
                 </div>
               )}
            </div>
         </div>
      </div>
  );

  // View: Co-Scholastic Management
  const CoScholasticView = () => (
      <div className="space-y-6">
        {/* Definition Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
           <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Medal className="text-blue-600" /> Define Co-Scholastic Areas & Subjects
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Area Selector / Creator */}
              <div className="space-y-4 border-r pr-0 md:pr-6">
                 <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">Select Area</label>
                   <div className="space-y-1">
                     {Object.keys(masterData.coScholasticSubjects).map(area => (
                       <div 
                         key={area} 
                         onClick={() => setSelectedCoScholasticArea(area)}
                         className={`flex justify-between items-center p-3 rounded cursor-pointer transition ${
                           selectedCoScholasticArea === area 
                           ? 'bg-blue-50 border border-blue-200 text-blue-800' 
                           : 'hover:bg-slate-50 border border-transparent'
                         }`}
                       >
                          <span className="font-medium">{area}</span>
                          <div className="flex items-center gap-2">
                             <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
                               {masterData.coScholasticSubjects[area]?.length || 0}
                             </span>
                             <button 
                               onClick={(e) => { e.stopPropagation(); handleDeleteCoScholasticArea(area); }}
                               className="text-slate-400 hover:text-red-500 p-1"
                             >
                               <Trash2 size={14} />
                             </button>
                          </div>
                       </div>
                     ))}
                   </div>
                 </div>
                 
                 <div className="pt-4 border-t mt-4">
                   <label className="block text-xs font-medium text-slate-500 mb-1 uppercase tracking-wide">Add New Area</label>
                   <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={newCoScholasticArea} 
                        onChange={(e) => setNewCoScholasticArea(e.target.value)}
                        placeholder="e.g. Life Skills"
                        className="flex-1 border rounded p-2 text-sm"
                      />
                      <button 
                        onClick={handleAddCoScholasticArea}
                        className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"
                      >
                        <Plus size={18} />
                      </button>
                   </div>
                 </div>
              </div>
              
              {/* Subject List for Selected Area */}
              <div className="md:col-span-2">
                <div className="bg-slate-50 p-4 rounded-lg border h-full">
                   <h3 className="font-bold text-slate-700 mb-4 flex items-center justify-between">
                      <span>Subjects under "{selectedCoScholasticArea}"</span>
                      <span className="text-xs font-normal bg-blue-100 text-blue-800 px-2 py-1 rounded border border-blue-200">
                        Evaluated via Grades
                      </span>
                   </h3>
                   
                   <div className="flex gap-2 mb-4">
                     <input 
                       type="text" 
                       value={newCoScholasticSubject}
                       onChange={(e) => setNewCoScholasticSubject(e.target.value)}
                       placeholder={`Add new subject to ${selectedCoScholasticArea}`}
                       className="flex-1 border rounded p-2 text-sm focus:ring-2 focus:ring-blue-200 outline-none"
                     />
                     <button 
                       onClick={handleAddCoScholasticSubject}
                       className="bg-slate-700 text-white px-4 py-2 rounded hover:bg-slate-800 flex items-center gap-1"
                     >
                       <Plus size={16} /> Add
                     </button>
                   </div>

                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                      {masterData.coScholasticSubjects[selectedCoScholasticArea]?.length > 0 ? (
                         masterData.coScholasticSubjects[selectedCoScholasticArea].map((subject, idx) => (
                           <div key={idx} className="flex justify-between items-center p-3 bg-white rounded border border-slate-200 shadow-sm">
                              <div className="flex items-center gap-2">
                                 <Award size={14} className="text-blue-400" />
                                 <span className="text-slate-700 font-medium">{subject}</span>
                              </div>
                              <button 
                                onClick={() => handleDeleteCoScholasticSubject(subject)}
                                className="text-slate-400 hover:text-red-500"
                              >
                                <Trash2 size={14} />
                              </button>
                           </div>
                         ))
                      ) : (
                         <div className="col-span-full text-center py-8 text-slate-400 italic">
                           No subjects defined for this area.
                         </div>
                      )}
                   </div>
                </div>
              </div>
           </div>
        </div>

        {/* Assign Co-Scholastic Areas to Classes */}
        <div className="bg-white p-6 rounded-lg shadow-md">
           <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <ShieldCheck className="text-blue-600" /> Assign Co-Scholastic Areas to Classes
           </h2>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Assignment Controls */}
              <div className="space-y-4 border-r pr-0 md:pr-8">
                <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">Select Class</label>
                   <select 
                     value={selectedClassForCoScholastic} 
                     onChange={(e) => {
                       setSelectedClassForCoScholastic(e.target.value);
                       setSelectedAreasToAdd([]);
                     }}
                     className="w-full border rounded p-2"
                   >
                     <option value="">-- Select Class --</option>
                     {masterData.classes.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                
                {selectedClassForCoScholastic && (
                  <>
                    <div>
                       <label className="block text-sm font-medium text-slate-600 mb-2">Select Areas to Add</label>
                       <div className="border rounded p-2 max-h-56 overflow-y-auto bg-slate-50 space-y-1">
                         {Object.keys(masterData.coScholasticSubjects).length > 0 ? (
                           Object.keys(masterData.coScholasticSubjects).map(area => {
                              const isAssigned = masterData.classCoScholasticAreas?.[selectedClassForCoScholastic]?.includes(area);
                              return (
                                <label key={area} className={`flex items-center gap-2 p-2 rounded hover:bg-slate-100 transition select-none ${isAssigned ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer bg-white border border-slate-100'}`}>
                                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedAreasToAdd.includes(area) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                     {selectedAreasToAdd.includes(area) && <CheckSquare size={12} className="text-white" />}
                                     <input 
                                       type="checkbox"
                                       checked={selectedAreasToAdd.includes(area)}
                                       onChange={() => !isAssigned && toggleAreaSelection(area)}
                                       disabled={isAssigned}
                                       className="hidden"
                                     />
                                  </div>
                                  <span className="text-sm flex-1 text-slate-700">{area}</span>
                                  {isAssigned && <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">Assigned</span>}
                                </label>
                              );
                           })
                         ) : (
                           <p className="text-xs text-slate-400 text-center py-4">No Co-Scholastic Areas defined.</p>
                         )}
                       </div>
                    </div>

                    <button 
                     onClick={handleAddAreasToClass}
                     disabled={selectedAreasToAdd.length === 0}
                     className={`px-4 py-2 rounded w-full flex items-center justify-center gap-2 transition ${
                       selectedAreasToAdd.length === 0 
                       ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                       : 'bg-blue-600 text-white hover:bg-blue-700 shadow'
                     }`}
                    >
                      <Plus size={18} /> Assign Areas
                    </button>
                  </>
                )}
              </div>

              {/* Current Assignments List */}
              <div>
                 <h4 className="font-semibold text-slate-700 mb-3">
                   {selectedClassForCoScholastic ? `Co-Scholastic Areas for Class ${selectedClassForCoScholastic}` : 'Select a class to view assignments'}
                 </h4>
                 
                 {selectedClassForCoScholastic && masterData.classCoScholasticAreas?.[selectedClassForCoScholastic]?.length > 0 ? (
                   <div className="space-y-2">
                      {masterData.classCoScholasticAreas[selectedClassForCoScholastic].map((area, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded shadow-sm">
                           <div className="flex items-center gap-2">
                             <Medal size={16} className="text-blue-400" />
                             <div>
                               <span className="font-medium text-slate-800">{area}</span>
                               <span className="text-xs text-slate-400 block">
                                 {masterData.coScholasticSubjects[area]?.length || 0} subjects included
                               </span>
                             </div>
                           </div>
                           <button 
                             onClick={() => handleRemoveAreaFromClass(selectedClassForCoScholastic, area)}
                             className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition"
                             title="Remove Area"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                      ))}
                   </div>
                 ) : (
                   <div className="text-slate-400 text-sm italic border-2 border-dashed rounded p-8 text-center bg-slate-50">
                     <ShieldCheck size={24} className="mx-auto mb-2 opacity-50" />
                     No Co-Scholastic areas assigned to this class.
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
  );

  // View: Scheduler
  const SchedulerView = () => (
      <div className="bg-white p-6 rounded-lg shadow-md border-t-4 border-teal-500">
         <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="text-teal-600" /> Exam Scheduler (Class-Wise)
         </h2>
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Select Class</label>
                  <select 
                     value={schedulerClass} 
                     onChange={(e) => setSchedulerClass(e.target.value)}
                     className="w-full border rounded p-2"
                  >
                     <option value="">-- Select Class --</option>
                     {masterData.classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Select Term</label>
                  <select 
                     value={schedulerTerm} 
                     onChange={(e) => {
                       setSchedulerTerm(e.target.value);
                       setSchedulerExam(''); 
                     }}
                     className="w-full border rounded p-2"
                  >
                     <option value="">-- Select Term --</option>
                     {masterData.examTerms.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Select Exam</label>
                  <select 
                     value={schedulerExam} 
                     onChange={(e) => setSchedulerExam(e.target.value)}
                     disabled={!schedulerTerm}
                     className="w-full border rounded p-2 disabled:bg-slate-100 disabled:text-slate-400"
                  >
                     <option value="">-- Select Exam --</option>
                     {masterData.termExams[schedulerTerm]?.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                  </select>
               </div>

               {/* Existing Schedules List */}
               <div className="mt-8 border-t pt-4">
                  <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase">Created Schedules</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {masterData.examSchedules && masterData.examSchedules.length > 0 ? (
                       masterData.examSchedules.map(sch => (
                         <div key={sch.id} className="p-3 border rounded text-sm bg-slate-50 flex justify-between items-start">
                           <div>
                             <div className="font-bold text-slate-700">{sch.className} - {sch.examName}</div>
                             <div className="text-xs text-slate-500">{sch.term}</div>
                           </div>
                           <button onClick={() => handleDeleteSchedule(sch.id)} className="text-red-400 hover:text-red-600">
                             <Trash2 size={14} />
                           </button>
                         </div>
                       ))
                    ) : (
                       <p className="text-xs text-slate-400 italic">No schedules created yet.</p>
                    )}
                  </div>
               </div>
            </div>

            <div className="lg:col-span-2">
               {schedulerClass && schedulerTerm && schedulerExam ? (
                 <div className="bg-slate-50 p-6 rounded-lg border">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-slate-700">Schedule Details</h3>
                       <div className="flex items-center gap-2">
                          {activeScheduleId && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Editing Existing Schedule</span>}
                       </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                       <table className="w-full text-sm">
                          <thead>
                             <tr className="bg-slate-200 text-slate-600">
                                <th className="p-3 text-left rounded-l">Subject</th>
                                <th className="p-3 text-left">Date</th>
                                <th className="p-3 text-left">
                                   <div className="flex items-center gap-2">
                                      Start Time
                                      <button 
                                         type="button"
                                         onClick={handleCopyStartTimeToAll}
                                         className="text-slate-400 hover:text-teal-600 transition"
                                         title="Copy first row start time to all"
                                      >
                                         <Copy size={14} />
                                      </button>
                                   </div>
                                </th>
                                <th className="p-3 text-left rounded-r">
                                   <div className="flex items-center gap-2">
                                      End Time
                                      <button 
                                         type="button"
                                         onClick={handleCopyEndTimeToAll}
                                         className="text-slate-400 hover:text-teal-600 transition"
                                         title="Copy first row end time to all"
                                      >
                                         <Copy size={14} />
                                      </button>
                                   </div>
                                </th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                             {Object.keys(schedulerEntries).length > 0 ? (
                               Object.keys(schedulerEntries).map(subject => (
                                 <tr key={subject} className="bg-white">
                                    <td className="p-3 font-medium text-slate-700">{subject}</td>
                                    <td className="p-3">
                                       <input 
                                         type="date" 
                                         value={schedulerEntries[subject].date} 
                                         onChange={(e) => handleScheduleEntryChange(subject, 'date', e.target.value)}
                                         className="border rounded p-1.5 w-full focus:ring-1 focus:ring-teal-500 outline-none" 
                                       />
                                    </td>
                                    <td className="p-3">
                                       <input 
                                         type="time" 
                                         value={schedulerEntries[subject].startTime} 
                                         onChange={(e) => handleScheduleEntryChange(subject, 'startTime', e.target.value)}
                                         className="border rounded p-1.5 w-full focus:ring-1 focus:ring-teal-500 outline-none" 
                                       />
                                    </td>
                                    <td className="p-3">
                                       <input 
                                         type="time" 
                                         value={schedulerEntries[subject].endTime} 
                                         onChange={(e) => handleScheduleEntryChange(subject, 'endTime', e.target.value)}
                                         className="border rounded p-1.5 w-full focus:ring-1 focus:ring-teal-500 outline-none" 
                                       />
                                    </td>
                                 </tr>
                               ))
                             ) : (
                               <tr>
                                  <td colSpan={4} className="p-6 text-center text-slate-400 italic">
                                     No common subjects found between Exam Definition and Class Subjects.
                                  </td>
                               </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                       <button 
                         onClick={handleSaveSchedule}
                         disabled={Object.keys(schedulerEntries).length === 0}
                         className={`px-6 py-2 rounded font-medium flex items-center gap-2 ${
                           Object.keys(schedulerEntries).length === 0 
                           ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                           : 'bg-teal-600 text-white hover:bg-teal-700 shadow-md'
                         }`}
                       >
                          <Save size={18} /> Save Schedule
                       </button>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 border-2 border-dashed rounded-lg bg-slate-50 min-h-[300px]">
                    <Clock size={48} className="mb-2 opacity-20 text-teal-500" />
                    <p>Select Class, Term and Exam to create or edit schedule.</p>
                 </div>
               )}
            </div>
         </div>
      </div>
  );

  // View: Marks Entry
  const MarksEntryView = () => {
    const examDef = getExamDefinition();

    if (!selectedClass || !selectedTerm || !selectedExam) {
      return (
        <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-lg bg-slate-50">
           <Filter size={48} className="mx-auto mb-2 opacity-20" />
           <p>Please select Class, Term, and Exam to enter marks.</p>
        </div>
      );
    }

    if (!examDef) {
       return <div className="text-center py-4 text-red-500">Exam configuration not found for this selection.</div>;
    }

    const subjects = examDef.subjects || [];

    return (
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
           <div>
             <h3 className="font-bold text-slate-700">Marks Entry Sheet</h3>
             <p className="text-xs text-slate-500">Max Marks: <span className="font-semibold text-blue-600">{examDef.maxMarks}</span></p>
           </div>
           <div className="flex items-center gap-2 text-sm">
             <span className="text-slate-500">Sort By:</span>
             <select 
               value={marksSortBy} 
               onChange={(e) => setMarksSortBy(e.target.value as 'name' | 'rollNo')}
               className="border rounded p-1"
             >
               <option value="rollNo">Roll No</option>
               <option value="name">Name</option>
             </select>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-100 border-b">
              <tr>
                <th className="px-4 py-3 w-16">Roll No</th>
                <th className="px-4 py-3 min-w-[150px]">Student Name</th>
                {subjects.map(subj => (
                  <th key={subj} className="px-4 py-3 text-center min-w-[100px]">{subj}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <tr key={student.id} className="bg-white hover:bg-blue-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{student.rollNo}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {student.firstName} {student.lastName}
                    </td>
                    {subjects.map(subj => {
                      const score = student.marks?.[selectedTerm]?.[selectedExam]?.[subj] ?? '';
                      const isInvalid = score !== '' && parseFloat(score) > examDef.maxMarks;
                      return (
                        <td key={subj} className="px-2 py-2">
                           <input 
                             type="number" 
                             min="0"
                             max={examDef.maxMarks}
                             value={score}
                             onChange={(e) => {
                               const value = e.target.value;
                               const updatedStudents = students.map((s) => {
                                  if (s.id === student.id) {
                                    const newMarks = { ...s.marks };
                                    if (!newMarks[selectedTerm]) newMarks[selectedTerm] = {};
                                    if (!newMarks[selectedTerm][selectedExam]) newMarks[selectedTerm][selectedExam] = {};
                                    newMarks[selectedTerm][selectedExam][subj] = value;
                                    return { ...s, marks: newMarks };
                                  }
                                  return s;
                                });
                                onUpdateStudents(updatedStudents);
                             }}
                             className={`w-full text-center border rounded py-1 focus:ring-1 focus:outline-none ${isInvalid ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-300 focus:ring-blue-500'}`}
                             placeholder="-"
                           />
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                   <td colSpan={subjects.length + 2} className="px-4 py-8 text-center text-slate-400 italic">
                      No students found in this Class/Section.
                   </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 bg-yellow-50 text-xs text-yellow-800 border-t border-yellow-100 flex justify-between items-center">
           <span>* Marks are saved automatically as you type.</span>
           <span className="font-semibold">{filteredStudents.length} Students</span>
        </div>
      </div>
    );
  };

  // View: Results Generation (Report Card)
  const ResultGenerationView = () => {
    if (!selectedClass || !selectedTerm) {
       return (
         <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-lg bg-slate-50">
            <PieChart size={48} className="mx-auto mb-2 opacity-20" />
            <p>Please select Class and Term to generate results.</p>
         </div>
       );
    }

    const termExams = masterData.termExams[selectedTerm] || [];
    const termCoScholastic = masterData.termCoScholasticAreas?.[selectedTerm] || [];
    const classAssignedAreas = masterData.classCoScholasticAreas?.[selectedClass] || [];
    // Intersection of term co-scholastic and class co-scholastic
    const applicableCoScholastic = termCoScholastic.filter(area => classAssignedAreas.includes(area));

    const toggleStudentSelection = (id: string) => {
       setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    const toggleAllStudents = () => {
       setSelectedStudentIds(selectedStudentIds.length === filteredStudents.length ? [] : filteredStudents.map(s => s.id));
    };

    const studentsToPrint = filteredStudents.filter(s => selectedStudentIds.includes(s.id));

    return (
      <div className="flex gap-6 items-start">
         {/* Sidebar Config (Hidden on Print) */}
         <div className="w-64 shrink-0 space-y-4 print:hidden">
            <div className="bg-white p-4 rounded-lg shadow-sm border max-h-[70vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                   <h3 className="font-bold text-slate-700 flex items-center gap-2">
                       <Users size={16} /> Students ({selectedStudentIds.length})
                   </h3>
                   <button onClick={toggleAllStudents} className="text-xs text-blue-600 hover:underline">
                      {selectedStudentIds.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                   </button>
                </div>
                <div className="space-y-1">
                    {filteredStudents.map(student => (
                        <div key={student.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded">
                            <input 
                              type="checkbox" 
                              checked={selectedStudentIds.includes(student.id)} 
                              onChange={() => toggleStudentSelection(student.id)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <div className="text-sm truncate">
                                <span className="font-medium text-slate-700">{student.firstName} {student.lastName}</span>
                                <span className="text-xs text-slate-500 block">Roll: {student.rollNo}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         </div>

         {/* Preview Area */}
         <div className="flex-1">
             <div className="mb-4 flex justify-between items-center print:hidden">
                <h3 className="font-bold text-slate-700">Report Card Preview</h3>
                <button 
                  onClick={() => window.print()} 
                  disabled={studentsToPrint.length === 0}
                  className={`px-4 py-2 rounded flex items-center gap-2 shadow-sm ${studentsToPrint.length === 0 ? 'bg-slate-300 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  <Printer size={18} /> Print {studentsToPrint.length} Report Cards
                </button>
             </div>

             <div className="print:block">
                {studentsToPrint.map((student) => {
                   // Calculate Marks
                   const reportData: any = {};
                   let grandTotalObtained = 0;
                   let grandTotalMax = 0;

                   // Gather all subjects assigned to student/class
                   const allSubjects = student.subjects || [];

                   return (
                     <div key={student.id} className="border-2 border-slate-800 p-8 bg-white relative mb-8 shadow-sm print:mb-0 print:border-2 print:border-black print:p-6 print:h-screen print:break-after-page print:w-full">
                        {/* School Header */}
                        <div className="flex gap-4 border-b-2 border-slate-800 pb-4 mb-6 items-center">
                           <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                              {schoolProfile.logoUrl ? <img src={schoolProfile.logoUrl} className="max-w-full max-h-full object-contain" /> : <School size={40} />}
                           </div>
                           <div className="flex-1 text-center">
                              <h1 className="text-3xl font-bold uppercase tracking-wide text-slate-900 leading-tight">{schoolProfile.name}</h1>
                              <p className="text-sm text-slate-600 mt-1 whitespace-pre-line">{schoolProfile.address}</p>
                              <div className="mt-2 inline-block bg-slate-900 text-white px-4 py-1 text-sm font-bold uppercase tracking-wider rounded-sm">
                                  Report Card - {selectedTerm}
                              </div>
                           </div>
                           <div className="w-24 h-24 shrink-0 flex items-center justify-center">
                              {schoolProfile.boardLogoUrl ? <img src={schoolProfile.boardLogoUrl} className="max-w-full max-h-full object-contain" /> : null}
                           </div>
                        </div>

                        {/* Student Details */}
                        <div className="flex gap-6 mb-6">
                           <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                              <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-32 text-slate-700">Student Name:</span> <span>{student.firstName} {student.lastName}</span></div>
                              <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-32 text-slate-700">Class & Section:</span> <span>{student.class} - {student.section}</span></div>
                              <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-32 text-slate-700">Roll No:</span> <span>{student.rollNo}</span></div>
                              <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-32 text-slate-700">Admission No:</span> <span>{student.admissionNumber}</span></div>
                              <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-32 text-slate-700">Date of Birth:</span> <span>{student.dob}</span></div>
                              <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-32 text-slate-700">Father's Name:</span> <span>{student.father.name}</span></div>
                              <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-32 text-slate-700">Mother's Name:</span> <span>{student.mother.name}</span></div>
                              <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-32 text-slate-700">Attendance:</span> <span>____ / ____</span></div>
                           </div>
                           <div className="w-28 h-36 border border-slate-300 bg-slate-50 flex items-center justify-center shrink-0">
                                {student.photoUrl ? <img src={student.photoUrl} className="w-full h-full object-cover" /> : <span className="text-xs text-slate-400">Photo</span>}
                           </div>
                        </div>

                        {/* Scholastic Table */}
                        <div className="mb-6">
                           <h3 className="font-bold text-slate-800 mb-2 uppercase text-sm border-l-4 border-slate-800 pl-2">Part 1: Scholastic Areas</h3>
                           <table className="w-full text-sm border-collapse border border-slate-800">
                              <thead>
                                 <tr className="bg-slate-100 text-slate-900 font-bold">
                                    <th className="border border-slate-800 px-3 py-2 text-left">Subjects</th>
                                    {termExams.map(exam => (
                                       <th key={exam.name} className="border border-slate-800 px-3 py-2 text-center w-20">
                                          {exam.name}<br/><span className="text-[10px] font-normal">({exam.maxMarks})</span>
                                       </th>
                                    ))}
                                    <th className="border border-slate-800 px-3 py-2 text-center w-24">Total<br/><span className="text-[10px] font-normal">(100)</span></th>
                                    <th className="border border-slate-800 px-3 py-2 text-center w-20">Grade</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {allSubjects.map(subject => {
                                    let subjectTotalObtained = 0;
                                    let subjectTotalMax = 0;
                                    
                                    return (
                                       <tr key={subject}>
                                          <td className="border border-slate-800 px-3 py-2 font-medium">{subject}</td>
                                          {termExams.map(exam => {
                                             const score = student.marks?.[selectedTerm]?.[exam.name]?.[subject] || '-';
                                             const scoreVal = parseFloat(score) || 0;
                                             
                                             // Only add to total if exam includes this subject
                                             if (exam.subjects?.includes(subject)) {
                                                if (score !== '-') subjectTotalObtained += scoreVal;
                                                subjectTotalMax += exam.maxMarks;
                                             }

                                             return (
                                                <td key={exam.name} className="border border-slate-800 px-3 py-2 text-center">
                                                   {exam.subjects?.includes(subject) ? score : <span className="text-slate-300">N/A</span>}
                                                </td>
                                             );
                                          })}
                                          {/* Calculations */}
                                          {(() => {
                                             const percentage = subjectTotalMax > 0 ? (subjectTotalObtained / subjectTotalMax) * 100 : 0;
                                             grandTotalObtained += subjectTotalObtained;
                                             grandTotalMax += subjectTotalMax;

                                             return (
                                                <>
                                                   <td className="border border-slate-800 px-3 py-2 text-center font-bold">
                                                      {subjectTotalMax > 0 ? Math.round(percentage) : '-'}
                                                   </td>
                                                   <td className="border border-slate-800 px-3 py-2 text-center">
                                                      {subjectTotalMax > 0 ? calculateGrade(percentage) : '-'}
                                                   </td>
                                                </>
                                             );
                                          })()}
                                       </tr>
                                    );
                                 })}
                                 {/* Total Row */}
                                 <tr className="bg-slate-50 font-bold">
                                    <td className="border border-slate-800 px-3 py-2 text-right">Grand Total</td>
                                    <td colSpan={termExams.length} className="border border-slate-800 px-3 py-2 text-right">
                                       {grandTotalObtained} / {grandTotalMax}
                                    </td>
                                    <td className="border border-slate-800 px-3 py-2 text-center">
                                       {grandTotalMax > 0 ? ((grandTotalObtained / grandTotalMax) * 100).toFixed(1) + '%' : '-'}
                                    </td>
                                    <td className="border border-slate-800 px-3 py-2 text-center">
                                        {grandTotalMax > 0 ? calculateGrade((grandTotalObtained / grandTotalMax) * 100) : '-'}
                                    </td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>

                        {/* Co-Scholastic Table */}
                        {applicableCoScholastic.length > 0 && (
                           <div className="mb-6">
                              <h3 className="font-bold text-slate-800 mb-2 uppercase text-sm border-l-4 border-slate-800 pl-2">Part 2: Co-Scholastic Areas</h3>
                              <table className="w-full text-sm border-collapse border border-slate-800">
                                 <thead>
                                    <tr className="bg-slate-100 text-slate-900 font-bold">
                                       <th className="border border-slate-800 px-3 py-2 text-left w-1/4">Area</th>
                                       <th className="border border-slate-800 px-3 py-2 text-left">Activities / Subjects</th>
                                       <th className="border border-slate-800 px-3 py-2 text-center w-24">Grade</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {applicableCoScholastic.map(area => (
                                       <tr key={area}>
                                          <td className="border border-slate-800 px-3 py-2 font-medium">{area}</td>
                                          <td className="border border-slate-800 px-3 py-2">
                                             {masterData.coScholasticSubjects[area]?.join(', ') || '-'}
                                          </td>
                                          <td className="border border-slate-800 px-3 py-2 text-center">
                                             {/* Placeholder for now as Co-Scholastic entry isn't built yet */}
                                             A
                                          </td>
                                       </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        )}
                        
                        {/* Footer Section */}
                        <div className="mt-auto">
                            <div className="border border-slate-800 p-3 mb-6 min-h-[80px]">
                               <span className="font-bold text-sm text-slate-700 block mb-1">Remarks:</span>
                               <p className="text-sm italic">Excellent performance. Keep it up!</p>
                            </div>
                            
                            <div className="flex justify-between items-end px-4 mb-4">
                               <div className="text-center">
                                  <div className="w-40 border-b border-slate-800 mb-1"></div>
                                  <p className="text-xs font-bold text-slate-700 uppercase">Class Teacher</p>
                               </div>
                               <div className="text-center">
                                  <div className="w-40 border-b border-slate-800 mb-1"></div>
                                  <p className="text-xs font-bold text-slate-700 uppercase">Parent</p>
                               </div>
                               <div className="text-center">
                                  <div className="w-40 border-b border-slate-800 mb-1"></div>
                                  <p className="text-xs font-bold text-slate-700 uppercase">Principal</p>
                               </div>
                            </div>
                            
                            {/* Grading Scale Key */}
                            <div className="text-[10px] text-slate-500 text-center border-t border-slate-300 pt-2">
                               Grading Scale: A1 (91-100) | A2 (81-90) | B1 (71-80) | B2 (61-70) | C1 (51-60) | C2 (41-50) | D (33-40) | E (Needs Improvement)
                            </div>
                        </div>
                     </div>
                   );
                })}
             </div>
             
             {studentsToPrint.length === 0 && (
                <div className="text-center py-20 text-slate-400 border-2 border-dashed bg-slate-50 rounded print:hidden">
                   <p>No students selected for report generation.</p>
                </div>
             )}
         </div>
      </div>
    );
  };

  // View: Admit Card
  const AdmitCardView = () => {
    const schedule = getExamSchedule();
    
    if (!selectedClass || !selectedTerm || !selectedExam) {
      return (
        <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-lg bg-slate-50">
           <Search size={48} className="mx-auto mb-2 opacity-20" />
           <p>Please select Class, Term, and Exam to generate admit cards.</p>
        </div>
      );
    }

    if (!schedule || !schedule.schedule || schedule.schedule.length === 0) {
       return (
         <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg">
            <Calendar size={48} className="mx-auto mb-2 opacity-20 text-red-400" />
            <p>No Schedule Found for this Exam.</p>
            <p className="text-xs mt-1">Please configure the Date Sheet in the "Scheduler" tab.</p>
         </div>
       );
    }

    const sortedSchedule = [...schedule.schedule].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const toggleStudentSelection = (id: string) => {
        setSelectedStudentIds(prev => 
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const toggleAllStudents = () => {
        if (selectedStudentIds.length === filteredStudents.length) {
            setSelectedStudentIds([]);
        } else {
            setSelectedStudentIds(filteredStudents.map(s => s.id));
        }
    };

    const studentsToPrint = filteredStudents.filter(s => selectedStudentIds.includes(s.id));

    return (
      <div className="flex gap-6 items-start">
         
         {/* Sidebar Configuration (Hidden when printing) */}
         <div className="w-64 shrink-0 space-y-4 print:hidden">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
               <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => setIsConfigOpen(!isConfigOpen)}>
                   <h3 className="font-bold text-slate-700 flex items-center gap-2">
                       <Settings size={16} /> Configuration
                   </h3>
                   {isConfigOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
               </div>
               
               {isConfigOpen && (
                   <div className="space-y-2">
                       <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                           <input type="checkbox" checked={admitCardConfig.showSchoolHeader} onChange={() => setAdmitCardConfig({...admitCardConfig, showSchoolHeader: !admitCardConfig.showSchoolHeader})} className="rounded text-blue-600 focus:ring-blue-500" />
                           <span className="text-slate-700">School Header</span>
                       </label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                           <input type="checkbox" checked={admitCardConfig.showPhoto} onChange={() => setAdmitCardConfig({...admitCardConfig, showPhoto: !admitCardConfig.showPhoto})} className="rounded text-blue-600 focus:ring-blue-500" />
                           <span className="text-slate-700">Student Photo</span>
                       </label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                           <input type="checkbox" checked={admitCardConfig.showStudentId} onChange={() => setAdmitCardConfig({...admitCardConfig, showStudentId: !admitCardConfig.showStudentId})} className="rounded text-blue-600 focus:ring-blue-500" />
                           <span className="text-slate-700">Student ID</span>
                       </label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                           <input type="checkbox" checked={admitCardConfig.showDob} onChange={() => setAdmitCardConfig({...admitCardConfig, showDob: !admitCardConfig.showDob})} className="rounded text-blue-600 focus:ring-blue-500" />
                           <span className="text-slate-700">Date of Birth</span>
                       </label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                           <input type="checkbox" checked={admitCardConfig.showGender} onChange={() => setAdmitCardConfig({...admitCardConfig, showGender: !admitCardConfig.showGender})} className="rounded text-blue-600 focus:ring-blue-500" />
                           <span className="text-slate-700">Gender</span>
                       </label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                           <input type="checkbox" checked={admitCardConfig.showFatherName} onChange={() => setAdmitCardConfig({...admitCardConfig, showFatherName: !admitCardConfig.showFatherName})} className="rounded text-blue-600 focus:ring-blue-500" />
                           <span className="text-slate-700">Father's Name</span>
                       </label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                           <input type="checkbox" checked={admitCardConfig.showMotherName} onChange={() => setAdmitCardConfig({...admitCardConfig, showMotherName: !admitCardConfig.showMotherName})} className="rounded text-blue-600 focus:ring-blue-500" />
                           <span className="text-slate-700">Mother's Name</span>
                       </label>
                       <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                           <input type="checkbox" checked={admitCardConfig.showAddress} onChange={() => setAdmitCardConfig({...admitCardConfig, showAddress: !admitCardConfig.showAddress})} className="rounded text-blue-600 focus:ring-blue-500" />
                           <span className="text-slate-700">Address</span>
                       </label>
                       
                       <div className="border-t pt-2 mt-2">
                          <label className="flex items-center gap-2 text-sm cursor-pointer select-none mb-2">
                             <input type="checkbox" checked={admitCardConfig.showNote} onChange={() => setAdmitCardConfig({...admitCardConfig, showNote: !admitCardConfig.showNote})} className="rounded text-blue-600 focus:ring-blue-500" />
                             <span className="text-slate-700 font-medium">Show Note / Instructions</span>
                          </label>
                          {admitCardConfig.showNote && (
                            <textarea 
                              value={admitCardNote}
                              onChange={(e) => setAdmitCardNote(e.target.value)}
                              className="w-full border rounded p-2 text-xs"
                              rows={4}
                              placeholder="Enter exam instructions here..."
                            />
                          )}
                       </div>
                   </div>
               )}
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border max-h-[50vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-3">
                   <h3 className="font-bold text-slate-700 flex items-center gap-2">
                       <Users size={16} /> Students ({selectedStudentIds.length})
                   </h3>
                   <button onClick={toggleAllStudents} className="text-xs text-blue-600 hover:underline">
                      {selectedStudentIds.length === filteredStudents.length ? 'Deselect All' : 'Select All'}
                   </button>
                </div>
                <div className="space-y-1">
                    {filteredStudents.map(student => (
                        <div key={student.id} className="flex items-center gap-2 p-1 hover:bg-slate-50 rounded">
                            <input 
                              type="checkbox" 
                              checked={selectedStudentIds.includes(student.id)} 
                              onChange={() => toggleStudentSelection(student.id)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <div className="text-sm truncate">
                                <span className="font-medium text-slate-700">{student.firstName} {student.lastName}</span>
                                <span className="text-xs text-slate-500 block">Roll: {student.rollNo}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
         </div>

         {/* Preview Area */}
         <div className="flex-1">
             <div className="mb-4 flex justify-between items-center print:hidden">
                <h3 className="font-bold text-slate-700">Print Preview</h3>
                <button 
                  onClick={() => window.print()} 
                  disabled={studentsToPrint.length === 0}
                  className={`px-4 py-2 rounded flex items-center gap-2 shadow-sm ${studentsToPrint.length === 0 ? 'bg-slate-300 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  <Printer size={18} /> Print {studentsToPrint.length} Admit Cards
                </button>
             </div>

             <div className="grid grid-cols-1 gap-8 print:block">
                {studentsToPrint.map((student) => (
                   <div key={student.id} className="border-2 border-slate-800 p-6 bg-white relative mb-8 shadow-sm print:mb-2 print:border-2 print:border-black print:break-inside-avoid print:p-4">
                      {admitCardConfig.showSchoolHeader && (
                          <div className="flex gap-4 border-b-2 border-slate-800 pb-2 mb-3 items-center">
                             <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                                {schoolProfile.logoUrl ? (
                                   <img src={schoolProfile.logoUrl} className="max-w-full max-h-full object-contain" alt="Logo" />
                                ) : (
                                   /* Spacer to maintain center alignment if only Board Logo exists, or collapsed if neither */
                                   schoolProfile.boardLogoUrl && <div /> 
                                )}
                             </div>
                             <div className="flex-1 text-center">
                                <h1 className="text-2xl font-bold uppercase tracking-wide text-slate-900 leading-tight">{schoolProfile.name}</h1>
                                <p className="text-xs text-slate-600 mt-0.5 whitespace-pre-line">{schoolProfile.address}</p>
                                <div className="mt-2 inline-block border-2 border-slate-900 px-3 py-0.5 text-xs font-bold uppercase tracking-wider">
                                    Admit Card - {selectedTerm}
                                </div>
                             </div>
                             <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                                {schoolProfile.boardLogoUrl ? (
                                   <img src={schoolProfile.boardLogoUrl} className="max-w-full max-h-full object-contain" alt="Board" />
                                ) : (
                                   /* Spacer to maintain center alignment if only School Logo exists */
                                   schoolProfile.logoUrl && <div />
                                )}
                             </div>
                          </div>
                      )}

                      <div className="flex gap-4 mb-4 mt-2">
                         <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                            <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-24 text-slate-700">Name:</span> <span>{student.firstName} {student.lastName}</span></div>
                            <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-24 text-slate-700">Class/Sec:</span> <span>{student.class} - {student.section}</span></div>
                            <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-24 text-slate-700">Roll No:</span> <span>{student.rollNo}</span></div>
                            <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-24 text-slate-700">Exam:</span> <span>{selectedExam}</span></div>
                            
                            {admitCardConfig.showStudentId && (
                                <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-24 text-slate-700">Student ID:</span> <span>{student.id}</span></div>
                            )}
                            {admitCardConfig.showDob && (
                                <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-24 text-slate-700">DOB:</span> <span>{student.dob}</span></div>
                            )}
                            {admitCardConfig.showGender && (
                                <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-24 text-slate-700">Gender:</span> <span>{student.gender}</span></div>
                            )}
                            {admitCardConfig.showFatherName && (
                                <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-24 text-slate-700">Father:</span> <span>{student.father.name}</span></div>
                            )}
                            {admitCardConfig.showMotherName && (
                                <div className="flex border-b border-slate-200 pb-1"><span className="font-bold w-24 text-slate-700">Mother:</span> <span>{student.mother.name}</span></div>
                            )}
                            {admitCardConfig.showAddress && (
                                <div className="col-span-2 flex border-b border-slate-200 pb-1"><span className="font-bold w-24 shrink-0 text-slate-700">Address:</span> <span className="truncate">{student.currentAddress}</span></div>
                            )}
                         </div>
                         
                         {admitCardConfig.showPhoto && (
                             <div className="w-28 h-36 border-2 border-slate-300 bg-slate-50 flex items-center justify-center shrink-0 shadow-sm">
                                {student.photoUrl ? (
                                   <img src={student.photoUrl} className="w-full h-full object-cover" alt="Student" />
                                ) : (
                                   <div className="text-center">
                                     <div className="w-12 h-12 bg-slate-200 rounded-full mx-auto mb-2"></div>
                                     <span className="text-[10px] text-slate-400">Affix Photo</span>
                                   </div>
                                )}
                             </div>
                         )}
                      </div>

                      <div className="mb-4">
                         <h4 className="font-bold text-slate-800 mb-1 uppercase text-xs border-b border-slate-800 inline-block pb-0.5">Examination Schedule</h4>
                         <table className="w-full text-xs border-collapse border border-slate-800">
                            <thead>
                               <tr className="bg-slate-100 text-slate-900">
                                  <th className="border border-slate-800 px-2 py-1 text-left w-1/3">Subject</th>
                                  <th className="border border-slate-800 px-2 py-1 text-left">Date</th>
                                  <th className="border border-slate-800 px-2 py-1 text-left">Time</th>
                                  <th className="border border-slate-800 px-2 py-1 text-left w-24">Sign</th>
                               </tr>
                            </thead>
                            <tbody>
                               {sortedSchedule.map((item, idx) => (
                                  <tr key={idx}>
                                     <td className="border border-slate-800 px-2 py-1 font-medium">{item.subject}</td>
                                     <td className="border border-slate-800 px-2 py-1">{new Date(item.date).toLocaleDateString()}</td>
                                     <td className="border border-slate-800 px-2 py-1">{item.startTime} - {item.endTime}</td>
                                     <td className="border border-slate-800 px-2 py-1"></td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>

                      {/* Optional Note Section */}
                      {admitCardConfig.showNote && admitCardNote && (
                        <div className="mb-4 border border-slate-200 bg-slate-50 p-2 text-[10px] text-slate-700">
                           <p className="whitespace-pre-line leading-relaxed">{admitCardNote}</p>
                        </div>
                      )}

                      <div className="flex justify-between items-end mt-6 px-4">
                         <div className="text-center">
                            <div className="w-32 border-b border-slate-800 mb-1"></div>
                            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Class Teacher</p>
                         </div>
                         <div className="text-center">
                            <div className="w-32 border-b border-slate-800 mb-1"></div>
                            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Principal</p>
                         </div>
                      </div>
                   </div>
                ))}
                
                {studentsToPrint.length === 0 && (
                   <div className="text-center py-20 text-slate-400 border-2 border-dashed bg-slate-50 rounded">
                      <p>No students selected for printing.</p>
                   </div>
                )}
             </div>
         </div>
      </div>
    );
  };


  return (
    <div className="space-y-6 pb-12 relative">
       
       {/* Toast Notification */}
       {notification && (
         <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in transition-all ${
           notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
         }`}>
           {notification.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
           <span className="font-medium">{notification.message}</span>
         </div>
       )}

       {/* Top Navigation Bar */}
       <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-200 flex flex-wrap gap-2 print:hidden">
          <button 
             onClick={() => setActiveTab('config')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'config' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
             <Settings size={18} /> Terms & Assessments
          </button>
          <button 
             onClick={() => setActiveTab('coScholastic')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'coScholastic' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
             <Medal size={18} /> Co-Scholastic
          </button>
          <button 
             onClick={() => setActiveTab('schedule')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'schedule' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
             <Calendar size={18} /> Scheduler
          </button>
          <div className="w-px bg-slate-300 mx-2"></div>
          <button 
             onClick={() => setActiveTab('admitCard')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'admitCard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
             <FileText size={18} /> Admit Cards
          </button>
          <button 
             onClick={() => setActiveTab('marks')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'marks' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
             <Award size={18} /> Marks Entry
          </button>
          <button 
             onClick={() => setActiveTab('result')}
             className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${activeTab === 'result' ? 'bg-blue-600 text-white' : 'hover:bg-slate-100 text-slate-600'}`}
          >
             <PieChart size={18} /> Results
          </button>
       </div>

       {/* Sub-Filters (Only for Ops) */}
       {activeTab !== 'config' && activeTab !== 'coScholastic' && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 print:hidden">
            <h2 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide flex items-center gap-1">
               <Filter size={14} /> Criteria
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
               <div>
                  <select value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setSelectedSection(''); }} className="w-full border rounded p-2 text-sm">
                     <option value="">-- Select Class --</option>
                     {masterData.classes.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div>
                  <select value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)} className="w-full border rounded p-2 text-sm">
                     <option value="">{selectedClass ? 'All Allowed Sections' : 'All Sections'}</option>
                     {(selectedClass ? (masterData.classSections[selectedClass] || masterData.sections) : masterData.sections).map(s => (
                        <option key={s} value={s}>{s}</option>
                     ))}
                  </select>
               </div>
               <div>
                  <select value={selectedTerm} onChange={(e) => { setSelectedTerm(e.target.value); setSelectedExam(''); }} className="w-full border rounded p-2 text-sm">
                     <option value="">-- Select Term --</option>
                     {masterData.examTerms.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
               </div>
               <div>
                  <select value={selectedExam} onChange={(e) => setSelectedExam(e.target.value)} className="w-full border rounded p-2 text-sm" disabled={!selectedTerm || activeTab === 'result'}>
                     <option value="">{activeTab === 'result' ? 'All Exams in Term' : '-- Select Exam --'}</option>
                     {masterData.termExams[selectedTerm]?.map(e => <option key={e.name} value={e.name}>{e.name}</option>)}
                  </select>
               </div>
            </div>
         </div>
       )}

       {/* Content Area */}
       <div className="min-h-[400px]">
          {activeTab === 'config' && <ConfigurationView />}
          {activeTab === 'coScholastic' && <CoScholasticView />}
          {activeTab === 'schedule' && <SchedulerView />}
          {activeTab === 'admitCard' && <AdmitCardView />}
          {activeTab === 'marks' && <MarksEntryView />}
          {activeTab === 'result' && <ResultGenerationView />}
       </div>

    </div>
  );
};

export default ExamModule;
