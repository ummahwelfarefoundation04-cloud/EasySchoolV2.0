
import React, { useState, useEffect } from 'react';
import { MasterData, Student, SchoolProfile, ClassExamSchedule, ExamScheduleItem } from '../types';
import { FileText, ClipboardList, Printer, Calendar, Save, Filter, Search, Award, Plus, Edit2, BookOpen, Medal, X, Clock, Copy, Settings, ShieldCheck, CheckSquare, CheckCircle, ChevronDown, ChevronUp, Users, Square, PieChart, School } from 'lucide-react';

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

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedExam, setSelectedExam] = useState('');

  const [newTermName, setNewTermName] = useState('');
  const [selectedTermForExam, setSelectedTermForExam] = useState('');
  const [newExamName, setNewExamName] = useState('');
  const [newExamMarks, setNewExamMarks] = useState('');
  const [selectedExamSubjects, setSelectedExamSubjects] = useState<string[]>([]);
  const [editingExamName, setEditingExamName] = useState<string | null>(null);

  const [selectedCoScholasticArea, setSelectedCoScholasticArea] = useState<string>('General');
  const [newCoScholasticArea, setNewCoScholasticArea] = useState('');
  const [newCoScholasticSubject, setNewCoScholasticSubject] = useState('');
  const [selectedClassForCoScholastic, setSelectedClassForCoScholastic] = useState('');
  const [selectedAreasToAdd, setSelectedAreasToAdd] = useState<string[]>([]);

  const [schedulerClass, setSchedulerClass] = useState('');
  const [schedulerTerm, setSchedulerTerm] = useState('');
  const [schedulerExam, setSchedulerExam] = useState('');
  const [schedulerEntries, setSchedulerEntries] = useState<Record<string, {date: string, startTime: string, endTime: string}>>({});
  const [activeScheduleId, setActiveScheduleId] = useState<string | null>(null);

  const [marksSortBy, setMarksSortBy] = useState<'rollNo' | 'name'>('rollNo');

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddExamTerm = () => {
    if (!newTermName) return;
    if (masterData.examTerms.includes(newTermName)) {
      alert('Term already exists');
      return;
    }
    onUpdateMasterData({
      ...masterData,
      examTerms: [...masterData.examTerms, newTermName],
      termExams: { ...masterData.termExams, [newTermName]: [] },
      termCoScholasticAreas: { ...masterData.termCoScholasticAreas, [newTermName]: [] }
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
    if (window.confirm(`🚨 Are you sure you want to delete term "${term}"?`)) {
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
      showNotification('Term deleted successfully!');
    }
  };

  const handleSaveExamToTerm = () => {
    if (!selectedTermForExam || !newExamName || !newExamMarks) return;
    const currentExams = masterData.termExams[selectedTermForExam] || [];
    const newExamDef = { name: newExamName, maxMarks: parseInt(newExamMarks) || 0, subjects: selectedExamSubjects };
    let updatedExams;
    if (editingExamName) {
      updatedExams = currentExams.map(e => e.name === editingExamName ? newExamDef : e);
    } else {
      updatedExams = [...currentExams, newExamDef];
    }
    onUpdateMasterData({ ...masterData, termExams: { ...masterData.termExams, [selectedTermForExam]: updatedExams } });
    setNewExamName(''); setNewExamMarks(''); setSelectedExamSubjects([]); setEditingExamName(null);
    showNotification('Exam saved!');
  };

  const handleDeleteExamFromTerm = (examName: string) => {
    if (!selectedTermForExam) return;
    if (window.confirm(`Delete exam "${examName}"?`)) {
      const currentExams = masterData.termExams[selectedTermForExam] || [];
      onUpdateMasterData({
        ...masterData,
        termExams: { ...masterData.termExams, [selectedTermForExam]: currentExams.filter(e => e.name !== examName) }
      });
      showNotification('Exam deleted!');
    }
  };

  const handleAddCoScholasticArea = () => {
    if(!newCoScholasticArea) return;
    onUpdateMasterData({ ...masterData, coScholasticSubjects: { ...masterData.coScholasticSubjects, [newCoScholasticArea]: [] } });
    setSelectedCoScholasticArea(newCoScholasticArea); setNewCoScholasticArea('');
    showNotification('Area created!');
  };

  const handleDeleteCoScholasticArea = (area: string) => {
    if(Object.keys(masterData.coScholasticSubjects).length <= 1) return;
    if(window.confirm(`Delete co-scholastic area "${area}"?`)) {
      const newMap = { ...masterData.coScholasticSubjects };
      delete newMap[area];
      onUpdateMasterData({ ...masterData, coScholasticSubjects: newMap });
      showNotification('Area deleted!');
    }
  };

  const handleAddCoScholasticSubject = () => {
    if(!newCoScholasticSubject || !selectedCoScholasticArea) return;
    const current = masterData.coScholasticSubjects[selectedCoScholasticArea] || [];
    onUpdateMasterData({ ...masterData, coScholasticSubjects: { ...masterData.coScholasticSubjects, [selectedCoScholasticArea]: [...current, newCoScholasticSubject] } });
    setNewCoScholasticSubject('');
    showNotification('Subject added!');
  };

  const handleDeleteCoScholasticSubject = (subject: string) => {
    const current = masterData.coScholasticSubjects[selectedCoScholasticArea] || [];
    onUpdateMasterData({ ...masterData, coScholasticSubjects: { ...masterData.coScholasticSubjects, [selectedCoScholasticArea]: current.filter(s => s !== subject) } });
    showNotification('Subject deleted!');
  };

  const handleRemoveAreaFromClass = (className: string, area: string) => {
    const current = masterData.classCoScholasticAreas?.[className] || [];
    onUpdateMasterData({ ...masterData, classCoScholasticAreas: { ...masterData.classCoScholasticAreas, [className]: current.filter(a => a !== area) } });
    showNotification('Removed from class!');
  };

  const ConfigurationView = () => (
    <div className="bg-white p-6 rounded-lg shadow border">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <Settings className="text-blue-600" /> Exam Configuration
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-4 border-r pr-0 md:pr-8">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Terms</label>
            <div className="space-y-1">
              {masterData.examTerms.map(term => (
                <div key={term} onClick={() => setSelectedTermForExam(term)} className={`flex justify-between items-center p-3 rounded cursor-pointer transition ${selectedTermForExam === term ? 'bg-blue-50 border border-blue-200 text-blue-800' : 'hover:bg-slate-50 border border-transparent'}`}>
                  <span className="font-medium">{term}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteExamTerm(term); }} className="text-white bg-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-red-700">Delete</button>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t mt-4 flex gap-2">
            <input type="text" value={newTermName} onChange={e => setNewTermName(e.target.value)} placeholder="Add Term..." className="flex-1 border rounded p-2 text-sm" />
            <button onClick={handleAddExamTerm} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"><Plus size={18} /></button>
          </div>
        </div>
        <div className="md:col-span-2 space-y-8">
          {selectedTermForExam ? (
            <div className="bg-slate-50 p-4 rounded-lg border">
              <h3 className="font-bold text-slate-700 mb-4">Assessments in {selectedTermForExam}</h3>
              <div className="bg-white p-3 rounded border mb-4">
                <div className="flex gap-2 mb-2">
                  <input type="text" value={newExamName} onChange={e => setNewExamName(e.target.value)} placeholder="Exam Name" className="flex-[2] border rounded p-2 text-sm" />
                  <input type="number" value={newExamMarks} onChange={e => setNewExamMarks(e.target.value)} placeholder="Marks" className="flex-1 border rounded p-2 text-sm" />
                  <button onClick={handleSaveExamToTerm} className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 text-sm font-bold uppercase">Save</button>
                </div>
              </div>
              <div className="space-y-2">
                {masterData.termExams[selectedTermForExam]?.map((exam, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white rounded border shadow-sm">
                    <span className="font-bold text-slate-700">{exam.name} ({exam.maxMarks}M)</span>
                    <button onClick={() => handleDeleteExamFromTerm(exam.name)} className="text-white bg-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-red-700">Delete</button>
                  </div>
                ))}
              </div>
            </div>
          ) : <div className="text-center p-12 text-slate-400 italic">Select a term to continue</div>}
        </div>
      </div>
    </div>
  );

  const CoScholasticView = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Medal className="text-blue-600" /> Co-Scholastic Management</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4 border-r pr-6">
            <label className="block text-sm font-medium text-slate-600">Areas</label>
            <div className="space-y-1">
              {Object.keys(masterData.coScholasticSubjects).map(area => (
                <div key={area} onClick={() => setSelectedCoScholasticArea(area)} className={`flex justify-between items-center p-3 rounded cursor-pointer ${selectedCoScholasticArea === area ? 'bg-blue-50 border-blue-200 text-blue-800' : 'hover:bg-slate-50'}`}>
                  <span className="font-medium">{area}</span>
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteCoScholasticArea(area); }} className="text-white bg-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-red-700">Delete</button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <input type="text" value={newCoScholasticArea} onChange={e => setNewCoScholasticArea(e.target.value)} placeholder="New Area..." className="flex-1 border rounded p-2 text-sm" />
              <button onClick={handleAddCoScholasticArea} className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"><Plus size={18} /></button>
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="bg-slate-50 p-4 rounded-lg border h-full">
              <h3 className="font-bold text-slate-700 mb-4">Activities for {selectedCoScholasticArea}</h3>
              <div className="flex gap-2 mb-4">
                <input type="text" value={newCoScholasticSubject} onChange={e => setNewCoScholasticSubject(e.target.value)} placeholder="Add activity..." className="flex-1 border rounded p-2 text-sm" />
                <button onClick={handleAddCoScholasticSubject} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold uppercase">Add</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {masterData.coScholasticSubjects[selectedCoScholasticArea]?.map((subject, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-white rounded border">
                    <span className="text-slate-700 font-medium">{subject}</span>
                    <button onClick={() => handleDeleteCoScholasticSubject(subject)} className="text-white bg-red-600 px-2 py-1 rounded text-[10px] font-bold uppercase hover:bg-red-700">Delete</button>
                  </div>
                ))}
              </div>
            </div>
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
