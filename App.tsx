
import React, { useState, useEffect, useCallback } from 'react';
import { DEFAULT_SESSIONS, DEFAULT_SETTINGS, INITIAL_MASTER_DATA, INITIAL_SCHOOL_PROFILE, INITIAL_STUDENT_FORM, DEMO_STUDENTS } from './constants';
import { Student, Session, Settings as SettingsType, MasterData, SchoolProfile } from './types';
import AdmissionForm from './components/AdmissionForm';
import Settings from './components/Settings';
import StudentList from './components/StudentList';
import ExamModule from './components/ExamModule';
import LiveAssistant from './components/LiveAssistant';
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Settings as SettingsIcon, 
  GraduationCap, 
  Calendar, 
  ArrowRight, 
  ClipboardList, 
  Mic, 
  ChevronDown, 
  ChevronRight, 
  UserCheck, 
  Globe,
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';

// Keys for LocalStorage
const STORAGE_KEYS = {
  STUDENTS: 'es_students',
  SESSIONS: 'es_sessions',
  SETTINGS: 'es_settings',
  PROFILE: 'es_profile',
  MASTER_DATA: 'es_master_data'
};

// Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl border animate-in slide-in-from-right-10 duration-300 ${
      type === 'success' ? 'bg-white border-emerald-100 text-emerald-800' : 'bg-white border-rose-100 text-rose-800'
    }`}>
      {type === 'success' ? <CheckCircle className="text-emerald-500" size={20} /> : <AlertCircle className="text-rose-500" size={20} />}
      <span className="font-semibold text-sm">{message}</span>
      <button onClick={onClose} className="ml-2 p-1 hover:bg-slate-100 rounded-full transition-colors">
        <X size={14} className="text-slate-400" />
      </button>
    </div>
  );
};

// Helper to load data or fallback to default
const loadState = (key: string, fallback: any) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error(`Error loading ${key}`, e);
    return fallback;
  }
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'student-admission' | 'search-student' | 'exams' | 'settings' | 'live'>('dashboard');
  const [isStudentMenuOpen, setIsStudentMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // App State with Persistence
  const [sessions, setSessions] = useState<Session[]>(() => loadState(STORAGE_KEYS.SESSIONS, DEFAULT_SESSIONS));
  const [settings, setSettings] = useState<SettingsType>(() => loadState(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => loadState(STORAGE_KEYS.PROFILE, INITIAL_SCHOOL_PROFILE));
  const [masterData, setMasterData] = useState<MasterData>(() => loadState(STORAGE_KEYS.MASTER_DATA, INITIAL_MASTER_DATA));
  const [students, setStudents] = useState<Student[]>(() => loadState(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS));
  
  // Edit State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Persistence Effects
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(schoolProfile)); }, [schoolProfile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MASTER_DATA, JSON.stringify(masterData)); }, [masterData]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students)); }, [students]);

  // Keep student menu open if we are on a student related tab
  useEffect(() => {
    if (activeTab === 'search-student' || activeTab === 'student-admission') {
      setIsStudentMenuOpen(true);
    }
  }, [activeTab]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const handleSaveStudent = (student: Student) => {
    if (editingStudent) {
      setStudents(prev => prev.map(s => s.id === student.id ? student : s));
      setEditingStudent(null);
      showToast(`Record for ${student.firstName} updated.`);
    } else {
      setStudents([...students, student]);
      setSettings(prev => ({ ...prev, idStartNumber: prev.idStartNumber + 1 }));
      showToast(`New admission for ${student.firstName} saved.`);
    }
    setActiveTab('search-student');
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setActiveTab('student-admission');
  };

  const handleDeleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    const name = student ? `${student.firstName} ${student.lastName}` : id;
    if (window.confirm(`⚠️ ATTENTION: Are you sure you want to PERMANENTLY DELETE the student record for "${name}"?\n\nThis action cannot be undone.`)) {
      setStudents(prev => prev.filter(s => s.id !== id));
      if (editingStudent?.id === id) setEditingStudent(null);
      showToast(`Record for "${name}" deleted.`, 'success');
    }
  };

  const handleCancelAdmission = () => {
    setEditingStudent(null);
    setActiveTab('search-student');
  };

  const handleFactoryReset = () => {
    if (window.confirm("🚨 Delete ALL stored data? Type 'RESET' to confirm:")) {
      const confirmation = window.prompt("Type 'RESET' to confirm factory reset:");
      if (confirmation === 'RESET') {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const handleImportStudents = (importedData: any[]) => {
    let nextIdNumber = settings.idStartNumber;
    const currentSession = sessions.find(s => s.isCurrent);
    
    const newStudents: Student[] = importedData.map(data => {
       const serial = String(nextIdNumber).padStart(settings.idPadding, '0');
       const year = new Date().getFullYear().toString();
       
       let id = '';
       if (settings.idType === 'Numeric') {
          let parts = [];
          if (settings.idPrefix) parts.push(settings.idPrefix);
          if (settings.includeDateInId) parts.push(year);
          if (settings.includeClassInId && data.Class) parts.push(data.Class);
          parts.push(serial);
          id = parts.join(settings.idSeparator || '');
       } else {
          id = settings.idPattern
             .replace('[PREFIX]', settings.idPrefix || '')
             .replace('[SEP]', settings.idSeparator || '')
             .replace('[YEAR]', year)
             .replace('[SESSION]', currentSession?.name || '')
             .replace('[CLASS]', data.Class || 'CLS')
             .replace('[SECTION]', data.Section || 'SEC')
             .replace('[SERIAL]', serial);
       }

       nextIdNumber++;
       return {
         ...INITIAL_STUDENT_FORM,
         id: id,
         admissionNumber: id,
         admissionSessionId: currentSession?.id || '',
         firstName: data.FirstName || '',
         lastName: data.LastName || '',
         class: data.Class || '',
         section: data.Section || '',
         rollNo: data.RollNo || '',
         gender: data.Gender || 'Male',
         mobile: data.Mobile || '',
         admissionDate: data.AdmissionDate || new Date().toISOString().split('T')[0],
         parentLoginId: data.Mobile || `P${id}`,
         parentLoginPassword: Math.random().toString(36).slice(-8),
         documents: []
       } as Student;
    });
    setStudents(prev => [...prev, ...newStudents]);
    setSettings(prev => ({ ...prev, idStartNumber: nextIdNumber }));
    showToast(`Successfully imported ${newStudents.length} students.`);
  };

  const handleSwitchSession = (sessionId: string) => {
    const targetSession = sessions.find(s => s.id === sessionId);
    setSessions(prev => prev.map(s => ({
      ...s,
      isCurrent: s.id === sessionId
    })));
    showToast(`Switched to session ${targetSession?.name}`);
  };

  const currentSession = sessions.find(s => s.isCurrent);

  const renderContent = () => {
    switch (activeTab) {
      case 'student-admission':
        return <AdmissionForm settings={settings} sessions={sessions} masterData={masterData} initialData={editingStudent || undefined} onSave={handleSaveStudent} onCancel={handleCancelAdmission} />;
      case 'exams':
        return <ExamModule students={students} masterData={masterData} schoolProfile={schoolProfile} onUpdateStudents={setStudents} onUpdateMasterData={setMasterData} />;
      case 'live':
        return <LiveAssistant schoolProfile={schoolProfile} />;
      case 'settings':
        return <Settings settings={settings} schoolProfile={schoolProfile} sessions={sessions} masterData={masterData} onUpdateSettings={setSettings} onUpdateSchoolProfile={setSchoolProfile} onUpdateSessions={setSessions} onUpdateMasterData={setMasterData} onImportStudents={handleImportStudents} onFactoryReset={handleFactoryReset} />;
      case 'search-student':
        return <StudentList students={students} masterData={masterData} onEdit={handleEditStudent} onDelete={handleDeleteStudent} />;
      case 'dashboard':
      default:
        return (
           <div className="space-y-8 animate-fade-in">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
               <div>
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Dashboard</h2>
                 <p className="text-slate-500 text-xs mt-1 font-bold uppercase tracking-widest">{schoolProfile.name} Management Console</p>
               </div>
               <div className="flex flex-col md:flex-row gap-2">
                 <div className="flex items-center gap-3 bg-blue-50 px-5 py-2.5 rounded-2xl border border-blue-100 text-blue-700">
                   <Calendar size={18} />
                   <span className="font-black text-xs uppercase tracking-widest">Session: {currentSession?.name}</span>
                 </div>
                 <div className="flex items-center gap-3 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-200 text-slate-600">
                   <Globe size={18} />
                   <span className="font-bold text-xs uppercase tracking-widest">
                     {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                   </span>
                 </div>
               </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] shadow-xl p-8 text-white relative overflow-hidden group transition-all hover:shadow-2xl hover:-translate-y-1">
                 <div className="relative z-10 flex flex-col h-full justify-between">
                   <div className="flex justify-between items-start">
                     <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/10">
                       <Users size={28} className="text-white" />
                     </div>
                     <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full text-blue-50 border border-white/10 uppercase tracking-widest">Current</span>
                   </div>
                   <div className="mt-6">
                     <h3 className="text-5xl font-black tracking-tighter">{students.length}</h3>
                     <p className="text-blue-100 text-[10px] font-black uppercase tracking-widest opacity-90 mt-1">Total Directory</p>
                   </div>
                 </div>
               </div>

               <div className="bg-white rounded-[2rem] shadow-lg p-8 border border-slate-100 relative overflow-hidden group transition-all hover:shadow-xl hover:border-blue-200">
                 <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                 <div className="flex flex-col h-full justify-between relative z-10">
                   <div className="flex justify-between items-start">
                     <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><GraduationCap size={28} /></div>
                   </div>
                   <div className="mt-6">
                     <h3 className="text-3xl font-black text-slate-800 tracking-tight">{currentSession?.name || '---'}</h3>
                     <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Academic Year</p>
                   </div>
                 </div>
               </div>

               <div className="bg-white rounded-[2rem] shadow-lg p-8 border border-slate-100 relative overflow-hidden group transition-all hover:shadow-xl hover:border-purple-200">
                 <div className="absolute top-0 left-0 w-2 h-full bg-purple-500"></div>
                 <div className="flex flex-col h-full justify-between relative z-10">
                   <div className="flex justify-between items-start">
                     <div className="p-3 bg-purple-50 rounded-2xl text-purple-600"><UserPlus size={28} /></div>
                   </div>
                   <div className="mt-6">
                     <h3 className="text-4xl font-black text-slate-800 tracking-tighter">
                       {students.filter(s => s.admissionSessionId === currentSession?.id).length}
                     </h3>
                     <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Session Enrolls</p>
                   </div>
                 </div>
               </div>

               <div onClick={() => { setActiveTab('live'); }} className="bg-slate-900 rounded-[2rem] shadow-xl p-8 border border-slate-800 relative overflow-hidden group cursor-pointer hover:bg-black transition-all hover:shadow-2xl hover:-translate-y-1">
                 <div className="flex flex-col h-full justify-between relative z-10">
                   <div className="flex justify-between items-start">
                     <div className="p-3 bg-blue-600 rounded-2xl group-hover:bg-blue-500 transition-colors"><Mic size={28} className="text-white" /></div>
                     <ArrowRight size={20} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                   </div>
                   <div className="mt-6">
                     <h3 className="text-xl font-black text-white uppercase tracking-tight">AI Assistant</h3>
                     <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1 group-hover:text-slate-300">Live Voice Consulting</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        );
    }
  };

  const isStudentTab = activeTab === 'search-student' || activeTab === 'student-admission';

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 overflow-y-auto shadow-2xl">
        <div className="p-6 flex items-center gap-4 border-b border-slate-800">
          <div className="w-11 h-11 bg-white rounded-2xl shadow-xl flex items-center justify-center overflow-hidden shrink-0">
             {schoolProfile.logoUrl ? <img src={schoolProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <GraduationCap size={22} className="text-blue-600" />}
          </div>
          <h1 className="text-xs font-black leading-tight line-clamp-2 uppercase tracking-widest">{schoolProfile.name || 'Easy School'}</h1>
        </div>
        
        <nav className="flex-1 p-5 space-y-1.5">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} /> <span className="text-sm font-bold uppercase tracking-widest">Dashboard</span>
          </button>

          <div className="space-y-1.5">
            <button 
              onClick={() => {
                setIsStudentMenuOpen(!isStudentMenuOpen);
                if (!isStudentMenuOpen && activeTab !== 'student-admission') {
                  setActiveTab('search-student');
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ${isStudentTab ? 'bg-slate-800 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
              <div className="flex items-center gap-4">
                <Users size={20} /> <span className="text-sm font-bold uppercase tracking-widest">Students</span>
              </div>
              {isStudentMenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {isStudentMenuOpen && (
              <div className="pl-8 space-y-1 animate-in slide-in-from-top-2 duration-300">
                <button 
                  onClick={() => setActiveTab('search-student')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${activeTab === 'search-student' ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}
                >
                  Directory
                </button>
                <button 
                  onClick={() => {
                    setEditingStudent(null);
                    setActiveTab('student-admission');
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-200 ${activeTab === 'student-admission' ? 'text-blue-400' : 'text-slate-500 hover:text-white'}`}
                >
                  Admission
                </button>
              </div>
            )}
          </div>

          <button 
            onClick={() => setActiveTab('exams')} 
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'exams' ? 'bg-blue-600 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <ClipboardList size={20} /> <span className="text-sm font-bold uppercase tracking-widest">Exams</span>
          </button>

          <button 
            onClick={() => setActiveTab('live')} 
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'live' ? 'bg-blue-600 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Mic size={20} /> <span className="text-sm font-bold uppercase tracking-widest">AI Live</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')} 
            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <SettingsIcon size={20} /> <span className="text-sm font-bold uppercase tracking-widest">Settings</span>
          </button>
        </nav>

        <div className="p-5 bg-slate-800/40 m-5 rounded-[1.5rem] border border-slate-800/60 shadow-inner">
          <p className="text-[9px] text-slate-500 mb-1 font-black uppercase tracking-[0.2em]">Active Session</p>
          <p className="font-black text-blue-400 text-xl tracking-tighter">{currentSession?.name}</p>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-10">
        <header className="flex justify-between items-center mb-10 print:hidden">
          <h2 className="text-3xl font-black text-slate-900 capitalize tracking-tighter">
            {activeTab.replace('-', ' ')}
          </h2>
          <div className="flex items-center gap-5">
            <div className="relative group">
              <button className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-100 text-xs font-black uppercase tracking-widest text-slate-700 hover:bg-slate-50 transition-all active:scale-95">
                <Calendar size={18} className="text-blue-600" />
                Session: {currentSession?.name}
                <ChevronDown size={14} className="text-slate-400" />
              </button>
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 py-4 hidden group-hover:block z-50 animate-in fade-in zoom-in-95 duration-300">
                <div className="px-6 py-2 border-b border-slate-50 mb-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Academic Year</p>
                </div>
                {sessions.map(s => (
                  <button 
                    key={s.id} 
                    onClick={() => handleSwitchSession(s.id)}
                    className={`w-full text-left px-6 py-3.5 text-xs font-bold hover:bg-blue-50 transition-all flex items-center justify-between ${s.isCurrent ? 'text-blue-600 bg-blue-50/50' : 'text-slate-600'}`}
                  >
                    {s.name}
                    {s.isCurrent && <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>}
                  </button>
                ))}
                <div className="border-t border-slate-50 mt-2 pt-3 px-6">
                   <button onClick={() => setActiveTab('settings')} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Settings &raquo;</button>
                </div>
              </div>
            </div>
            <div className="w-12 h-12 rounded-[1.25rem] bg-white flex items-center justify-center text-blue-600 font-bold border border-slate-100 shadow-lg shadow-blue-500/5 overflow-hidden ring-4 ring-slate-50">
              {schoolProfile.logoUrl ? <img src={schoolProfile.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : "ES"}
            </div>
          </div>
        </header>
        {renderContent()}
      </main>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

export default App;
