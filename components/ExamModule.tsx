
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

// Fixed ExamModule component: Added main return statement and export default to resolve TypeScript errors.
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
  }, [selectedClass, selectedSection, activeTab, filteredStudents]);

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
    if (window.confirm(`⚠️ Are you sure you want to delete term "${term}" and all its defined exams? 
    
All marks and schedules associated with this term will be permanently lost.`)) {
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
    if (window.confirm(`⚠️ Are you sure you want to delete exam "${examName}" from term "${selectedTermForExam}"? 

Any marks entered for this exam across all students will be removed.`)) {
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
    }
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
      if (window.confirm(`Remove area "${area}" from term "${selectedTermForExam}" curriculum?`)) {
        const current = masterData.termCoScholasticAreas?.[selectedTermForExam] || [];
        onUpdateMasterData({
            ...masterData,
            termCoScholasticAreas: {
                ...masterData.termCoScholasticAreas,
                [selectedTermForExam]: current.filter(a => a !== area)
            }
        });
        showNotification('Area removed from term!');
      }
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
    if(window.confirm(`⚠️ Delete area "${area}" and all its subjects? 
    
This will remove it from all class and term mappings.`)) {
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
    if (window.confirm(`Delete activity "${subject}" from area "${selectedCoScholasticArea}"?`)) {
      const currentSubjects = masterData.coScholasticSubjects[selectedCoScholasticArea] || [];
      onUpdateMasterData({
        ...masterData,
        coScholasticSubjects: {
          ...masterData.coScholasticSubjects,
          [selectedCoScholasticArea]: currentSubjects.filter(s => s !== subject)
        }
      });
      showNotification('Subject deleted!');
    }
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
    if (window.confirm(`Remove co-scholastic area "${area}" from class "${className}" curriculum?`)) {
      const currentAreas = masterData.classCoScholasticAreas?.[className] || [];
      onUpdateMasterData({
        ...masterData,
        classCoScholasticAreas: {
          ...masterData.classCoScholasticAreas,
          [className]: currentAreas.filter(a => a !== area)
        }
      });
      showNotification('Area removed from class!');
    }
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
    const schedule = masterData.examSchedules?.find(s => s.id === id);
    if (window.confirm(`⚠️ Are you sure you want to delete the schedule for "${schedule?.className} - ${schedule?.examName}"?`)) {
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
                             className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all"
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

  return (
    <div className="space-y-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-5 ${notification.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <X size={20} />}
          {notification.message}
        </div>
      )}

      <div className="bg-white p-2 rounded-lg shadow-sm border flex flex-wrap gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'config', label: 'Configuration', icon: Settings },
          { id: 'coScholastic', label: 'Co-Scholastic', icon: Medal },
          { id: 'schedule', label: 'Schedule', icon: Calendar },
          { id: 'admitCard', label: 'Admit Card', icon: Printer },
          { id: 'marks', label: 'Marks Entry', icon: ClipboardList },
          { id: 'result', label: 'Results', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'config' && <ConfigurationView />}
      {activeTab === 'coScholastic' && <CoScholasticView />}
      {!['config', 'coScholastic'].includes(activeTab) && (
        <div className="bg-white p-12 rounded-lg shadow-md border-2 border-dashed flex flex-col items-center justify-center text-slate-400">
           <Search size={48} className="mb-4 opacity-20" />
           <p className="text-lg">Module "{activeTab}" view is under implementation.</p>
        </div>
      )}
    </div>
  );
};

export default ExamModule;
