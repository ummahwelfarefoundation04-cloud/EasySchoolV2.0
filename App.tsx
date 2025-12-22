
import React, { useState, useEffect } from 'react';
import { DEFAULT_SESSIONS, DEFAULT_SETTINGS, INITIAL_MASTER_DATA, INITIAL_SCHOOL_PROFILE, INITIAL_STUDENT_FORM, DEMO_STUDENTS } from './constants';
import { Student, Session, Settings as SettingsType, MasterData, SchoolProfile } from './types';
import AdmissionForm from './components/AdmissionForm';
import Settings from './components/Settings';
import StudentList from './components/StudentList';
import ExamModule from './components/ExamModule';
import { LayoutDashboard, UserPlus, Users, Settings as SettingsIcon, GraduationCap, Calendar, ArrowRight, ClipboardList } from 'lucide-react';

// Keys for LocalStorage
const STORAGE_KEYS = {
  STUDENTS: 'es_students',
  SESSIONS: 'es_sessions',
  SETTINGS: 'es_settings',
  PROFILE: 'es_profile',
  MASTER_DATA: 'es_master_data'
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admission' | 'students' | 'exams' | 'settings'>('dashboard');
  
  // App State with Persistence
  const [sessions, setSessions] = useState<Session[]>(() => loadState(STORAGE_KEYS.SESSIONS, DEFAULT_SESSIONS));
  const [settings, setSettings] = useState<SettingsType>(() => loadState(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const [schoolProfile, setSchoolProfile] = useState<SchoolProfile>(() => loadState(STORAGE_KEYS.PROFILE, INITIAL_SCHOOL_PROFILE));
  const [masterData, setMasterData] = useState<MasterData>(() => loadState(STORAGE_KEYS.MASTER_DATA, INITIAL_MASTER_DATA));
  const [students, setStudents] = useState<Student[]>(() => loadState(STORAGE_KEYS.STUDENTS, DEMO_STUDENTS as Student[]));
  
  // Edit State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Persistence Effects
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(schoolProfile)); }, [schoolProfile]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MASTER_DATA, JSON.stringify(masterData)); }, [masterData]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students)); }, [students]);

  const handleSaveStudent = (student: Student) => {
    if (editingStudent) {
      // Update existing
      setStudents(prev => prev.map(s => s.id === student.id ? student : s));
      setEditingStudent(null);
      alert(`✅ Success: Record for ${student.firstName} ${student.lastName} has been updated.`);
    } else {
      // Create new
      setStudents([...students, student]);
      // Increment the ID counter for next time
      setSettings(prev => ({ ...prev, idStartNumber: prev.idStartNumber + 1 }));
      alert(`✅ Success: New admission for ${student.firstName} ${student.lastName} saved successfully.`);
    }
    setActiveTab('students');
  };

  const handleEditStudent = (student: Student) => {
    setEditingStudent(student);
    setActiveTab('admission');
  };

  const handleDeleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    const name = student ? `${student.firstName} ${student.lastName}` : id;
    if (window.confirm(`⚠️ WARNING: Are you absolutely sure you want to PERMANENTLY DELETE the student record for "${name}"?\n\nThis action cannot be undone and all academic history for this student will be lost.`)) {
      setStudents(prev => prev.filter(s => s.id !== id));
      alert(`🗑️ Student record for "${name}" has been deleted.`);
    }
  };

  const handleCancelAdmission = () => {
    setEditingStudent(null);
    setActiveTab('dashboard');
  };

  const handleFactoryReset = () => {
    if (window.confirm("🚨 CRITICAL WARNING: This will delete ALL stored data (Students, Exams, Settings) and reset the app to factory defaults. This cannot be undone.\n\nType 'RESET' in the next prompt if you are sure.")) {
      const confirmation = window.prompt("Type 'RESET' to confirm factory reset:");
      if (confirmation === 'RESET') {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const handleImportStudents = (importedData: any[]) => {
    let nextIdNumber = settings.idStartNumber;
    
    const newStudents: Student[] = importedData.map(data => {
       const id = `${settings.idPrefix}${settings.idSeparator}${String(nextIdNumber).padStart(settings.idPadding, '0')}`;
       nextIdNumber++;
       
       return {
         ...INITIAL_STUDENT_FORM, // Defaults
         id: id,
         admissionNumber: id,
         admissionSessionId: sessions.find(s => s.isCurrent)?.id || '',
         firstName: data.FirstName || '',
         middleName: data.MiddleName || '',
         lastName: data.LastName || '',
         class: data.Class || '',
         section: data.Section || '',
         rollNo: data.RollNo || '',
         gender: data.Gender || 'Male',
         dob: data.DOB || '',
         bloodGroup: data.BloodGroup || '',
         category: data.Category || '',
         religion: data.Religion || '',
         caste: data.Caste || '',
         mobile: data.Mobile || '',
         email: data.Email || '',
         admissionDate: data.AdmissionDate || new Date().toISOString().split('T')[0],
         currentAddress: data.CurrentAddress || '',
         permanentAddress: data.PermanentAddress || '',
         father: { ...INITIAL_STUDENT_FORM.father, name: data.FatherName || '', phone: data.FatherPhone || '' },
         mother: { ...INITIAL_STUDENT_FORM.mother, name: data.MotherName || '', phone: data.MotherPhone || '' },
         // Generate credentials
         parentLoginId: data.Mobile || data.FatherPhone || `P${id}`,
         parentLoginPassword: Math.random().toString(36).slice(-8),
         documents: []
       } as Student;
    });

    setStudents(prev => [...prev, ...newStudents]);
    setSettings(prev => ({ ...prev, idStartNumber: nextIdNumber }));
    alert(`🎉 Successfully imported ${newStudents.length} students into the system.`);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'admission':
        return (
          <AdmissionForm 
            settings={settings} 
            sessions={sessions}
            masterData={masterData}
            initialData={editingStudent || undefined}
            onSave={handleSaveStudent} 
            onCancel={handleCancelAdmission} 
          />
        );
      case 'exams':
        return (
          <ExamModule 
            students={students}
            masterData={masterData}
            schoolProfile={schoolProfile}
            onUpdateStudents={setStudents}
            onUpdateMasterData={setMasterData}
          />
        );
      case 'settings':
        return (
          <Settings 
            settings={settings} 
            schoolProfile={schoolProfile}
            sessions={sessions}
            masterData={masterData}
            onUpdateSettings={setSettings}
            onUpdateSchoolProfile={setSchoolProfile}
            onUpdateSessions={setSessions}
            onUpdateMasterData={setMasterData}
            onImportStudents={handleImportStudents}
            onFactoryReset={handleFactoryReset}
          />
        );
      case 'students':
        return (
          <StudentList 
            students={students} 
            onEdit={handleEditStudent}
            onDelete={handleDeleteStudent}
          />
        );
      case 'dashboard':
      default:
        const currentSession = sessions.find(s => s.isCurrent);
        return (
           <div className="space-y-8 animate-fade-in">
             {/* Header */}
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
               <div>
                 <h2 className="text-2xl font-bold text-slate-800">Overview</h2>
                 <p className="text-slate-500 text-sm mt-1">Welcome to {schoolProfile.name} Dashboard</p>
               </div>
               <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-slate-600">
                 <Calendar className="text-blue-500" size={20} />
                 <span className="font-medium text-sm">
                   {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                 </span>
               </div>
             </div>

             {/* Stats Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               
               {/* Total Students Card - Prominent Gradient */}
               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden group transition-all hover:shadow-xl">
                 <div className="relative z-10 flex flex-col h-full justify-between">
                   <div className="flex justify-between items-start">
                     <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
                       <Users size={24} className="text-white" />
                     </div>
                     <span className="text-xs font-semibold bg-white/20 px-2.5 py-1 rounded-full text-blue-50 border border-white/10">
                       Active
                     </span>
                   </div>
                   <div className="mt-4">
                     <h3 className="text-4xl font-bold tracking-tight">{students.length}</h3>
                     <p className="text-blue-100 text-sm font-medium opacity-90 mt-1">Total Students</p>
                   </div>
                 </div>
                 {/* Decorative background elements */}
                 <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-110 transition duration-500 blur-2xl"></div>
                 <div className="absolute right-8 top-8 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
               </div>

               {/* Current Session Card */}
               <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100 relative overflow-hidden group transition-all hover:shadow-lg hover:border-green-200">
                 <div className="absolute top-0 left-0 w-1.5 h-full bg-green-500 rounded-l-2xl"></div>
                 <div className="flex flex-col h-full justify-between relative z-10">
                   <div className="flex justify-between items-start">
                     <div className="p-2.5 bg-green-50 rounded-xl">
                       <GraduationCap size={24} className="text-green-600" />
                     </div>
                     {currentSession ? (
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">Active</span>
                     ) : (
                        <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">Not Set</span>
                     )}
                   </div>
                   <div className="mt-4">
                     <h3 className="text-2xl font-bold text-slate-800">{currentSession?.name || 'No Session'}</h3>
                     <p className="text-slate-500 text-sm font-medium mt-1">Current Academic Session</p>
                   </div>
                 </div>
               </div>

               {/* Recent Admissions Card */}
               <div className="bg-white rounded-2xl shadow-md p-6 border border-slate-100 relative overflow-hidden group transition-all hover:shadow-lg hover:border-purple-200">
                 <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500 rounded-l-2xl"></div>
                 <div className="flex flex-col h-full justify-between relative z-10">
                   <div className="flex justify-between items-start">
                     <div className="p-2.5 bg-purple-50 rounded-xl">
                       <UserPlus size={24} className="text-purple-600" />
                     </div>
                   </div>
                   <div className="mt-4">
                     <h3 className="text-3xl font-bold text-slate-800">
                       {students.filter(s => s.admissionSessionId === currentSession?.id).length}
                     </h3>
                     <p className="text-slate-500 text-sm font-medium mt-1">New Admissions (This Session)</p>
                   </div>
                 </div>
               </div>

               {/* Quick Action Card */}
               <div 
                  onClick={() => {
                    setEditingStudent(null);
                    setActiveTab('admission');
                  }}
                  className="bg-slate-800 rounded-2xl shadow-md p-6 border border-slate-700 relative overflow-hidden group cursor-pointer hover:bg-slate-750 transition-all hover:shadow-lg hover:-translate-y-1"
               >
                 <div className="flex flex-col h-full justify-between relative z-10">
                   <div className="flex justify-between items-start">
                     <div className="p-2.5 bg-slate-700 rounded-xl group-hover:bg-slate-600 transition">
                       <UserPlus size={24} className="text-white" />
                     </div>
                     <ArrowRight size={20} className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition" />
                   </div>
                   <div className="mt-4">
                     <h3 className="text-xl font-bold text-white">New Admission</h3>
                     <p className="text-slate-400 text-sm font-medium mt-1 group-hover:text-slate-300">Register a new student</p>
                   </div>
                 </div>
               </div>
             </div>
           </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20 overflow-y-auto shadow-2xl">
        <div className="p-6 flex items-center gap-3 border-b border-slate-700">
          <div className="w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center overflow-hidden shrink-0">
             {schoolProfile.logoUrl ? (
               <img src={schoolProfile.logoUrl} alt="Logo" className="w-full h-full object-contain" />
             ) : (
               <GraduationCap size={20} className="text-blue-600" />
             )}
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight line-clamp-2" title={schoolProfile.name}>{schoolProfile.name || 'Easy School'}</h1>
            <p className="text-[10px] text-slate-400">Management System</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <LayoutDashboard size={20} /> Dashboard
          </button>
          <button 
            onClick={() => {
              setEditingStudent(null);
              setActiveTab('admission');
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'admission' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <UserPlus size={20} /> Admission
          </button>
           <button 
            onClick={() => setActiveTab('students')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'students' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={20} /> Students
          </button>
          <button 
            onClick={() => setActiveTab('exams')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'exams' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <ClipboardList size={20} /> Exams
          </button>
           <button 
            onClick={() => setActiveTab('settings')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
          >
            <SettingsIcon size={20} /> Settings
          </button>
        </nav>

        <div className="p-4 bg-slate-800/50 m-4 rounded-lg border border-slate-700">
          <p className="text-xs text-slate-400 mb-1 font-medium uppercase tracking-wide">Current Session</p>
          <p className="font-bold text-blue-400 text-lg">{sessions.find(s => s.isCurrent)?.name}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8 print:hidden">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 capitalize tracking-tight">{activeTab}</h2>
            <p className="text-slate-500 text-sm">Manage your school efficiently</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-end hidden md:flex">
               <span className="text-sm font-semibold text-slate-700">Administrator</span>
               <span className="text-xs text-slate-500">Admin Role</span>
             </div>
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm overflow-hidden">
                {schoolProfile.logoUrl ? (
                   <img src={schoolProfile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                   "A"
                )}
             </div>
          </div>
        </header>
        
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
