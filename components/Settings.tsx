
import React, { useState } from 'react';
import { Settings as SettingsType, Session, MasterData, ClassSubject, SubjectType, SchoolProfile } from '../types';
import { Save, Plus, Trash2, Edit2, List, BookOpen, Check, X, School, Upload, FileSpreadsheet, Download, FileUp, AlertTriangle, Fingerprint, Search, Lock, Unlock, BadgeCheck, Settings as SettingsIcon, Calendar, RefreshCw, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { MONTHS, DATE_FORMATS, CLASS_SHORT_NAMES, GRADE_ORDER } from '../constants';

interface SettingsProps {
  settings: SettingsType;
  schoolProfile: SchoolProfile;
  sessions: Session[];
  masterData: MasterData;
  onUpdateSettings: (s: SettingsType) => void;
  onUpdateSchoolProfile: (p: SchoolProfile) => void;
  onUpdateSessions: (s: Session[]) => void;
  onUpdateMasterData: (m: MasterData) => void;
  onImportStudents: (data: any[]) => void;
  onFactoryReset: () => void;
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, 
  schoolProfile,
  sessions, 
  masterData, 
  onUpdateSettings, 
  onUpdateSchoolProfile,
  onUpdateSessions, 
  onUpdateMasterData,
  onImportStudents,
  onFactoryReset
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [localProfile, setLocalProfile] = useState(schoolProfile);
  const [newSessionName, setNewSessionName] = useState('');

  // Input States for Master Data
  const [newInputs, setNewInputs] = useState({
    classes: '',
    sections: '',
    categories: '',
    houses: '',
    religions: '',
    subjects: ''
  });

  // Edit States
  const [editingKey, setEditingKey] = useState<keyof MasterData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [assignSectionsOnCreate, setAssignSectionsOnCreate] = useState<'No' | 'Yes'>('No');
  const [tempSelectedSections, setTempSelectedSections] = useState<string[]>([]);

  const [selectedClassForSubject, setSelectedClassForSubject] = useState('');
  const [subjectPoolSearch, setSubjectPoolSearch] = useState('');
  const [selectedSubjectsToAdd, setSelectedSubjectsToAdd] = useState<string[]>([]);
  const [selectedSubjectType, setSelectedSubjectType] = useState<SubjectType>('Mandatory');

  // State for bulk selection in curriculum preview
  const [bulkSelectedSubjects, setBulkSelectedSubjects] = useState<string[]>([]);

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    alert('✅ ID Configuration Saved successfully.');
  };
  
  const handleSaveProfile = () => {
    onUpdateSchoolProfile(localProfile);
    alert('✅ School Profile Saved successfully.');
  };

  const handleAddSession = () => {
    const trimmedName = newSessionName.trim();
    if (!trimmedName) return;
    
    if (sessions.some(s => s.name === trimmedName)) {
      alert(`⚠️ Session "${trimmedName}" already exists.`);
      return;
    }

    const newSession: Session = {
      id: Date.now().toString(),
      name: trimmedName,
      isCurrent: false
    };
    onUpdateSessions([...sessions, newSession]);
    setNewSessionName('');
    alert(`✅ Session "${trimmedName}" added.`);
  };

  const handleDeleteSession = (id: string) => {
    if (sessions.length <= 1) {
      alert("⚠️ Cannot delete the only session available.");
      return;
    }
    const session = sessions.find(s => s.id === id);
    if (window.confirm(`🚨 WARNING: Delete session "${session?.name}"? All associated data will be permanently removed.`)) {
      onUpdateSessions(sessions.filter(s => s.id !== id));
      alert(`🗑️ Session "${session?.name}" deleted.`);
    }
  };

  const handleSetCurrentSession = (id: string) => {
    const updated = sessions.map(s => ({ ...s, isCurrent: s.id === id }));
    onUpdateSessions(updated);
    const sessionName = sessions.find(s => s.id === id)?.name;
    alert(`📅 Active session set to: ${sessionName}`);
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'boardLogoUrl') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalProfile(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = lines.slice(1).filter(l => l.trim()).map(line => {
          const values = line.split(',');
          const obj: any = {};
          headers.forEach((header, i) => {
            obj[header] = values[i]?.trim();
          });
          return obj;
        });
        onImportStudents(data);
        e.target.value = '';
      };
      reader.readAsText(file);
    }
  };

  const sortClasses = (classes: string[]) => {
    return [...classes].sort((a, b) => {
      const idxA = GRADE_ORDER.indexOf(a);
      const idxB = GRADE_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  };

  const addItemToMaster = (key: keyof MasterData) => {
    const value = newInputs[key as keyof typeof newInputs];
    if (!value && key !== 'sections') return;

    const currentList = masterData[key] as string[];
    const newValue = value.trim();
    
    const isDuplicate = currentList.some((item, idx) => 
      item.toLowerCase() === newValue.toLowerCase() && (editingKey !== key || editingIndex !== idx)
    );

    if (isDuplicate) {
        alert(`⚠️ Duplicate Error: "${newValue}" already exists in ${key}.`);
        return;
    }

    if (editingIndex !== null && editingKey === key) {
        const updatedList = [...currentList];
        const oldValue = updatedList[editingIndex];
        updatedList[editingIndex] = newValue;

        let nextMaster: MasterData = { ...masterData, [key]: updatedList } as any as MasterData;

        if (key === 'classes') {
            const newClassSections = { ...masterData.classSections };
            const newClassSubjects = { ...masterData.classSubjects };
            if (oldValue !== newValue) {
                if (newClassSections[oldValue]) {
                    newClassSections[newValue] = newClassSections[oldValue];
                    delete newClassSections[oldValue];
                }
                if (newClassSubjects[oldValue]) {
                    newClassSubjects[newValue] = newClassSubjects[oldValue];
                    delete newClassSubjects[oldValue];
                }
            }

            if (assignSectionsOnCreate === 'Yes') {
                newClassSections[newValue] = [...tempSelectedSections];
            } else if (assignSectionsOnCreate === 'No') {
                delete newClassSections[newValue];
            }
            nextMaster.classSections = newClassSections;
            nextMaster.classSubjects = newClassSubjects;
            nextMaster.classes = sortClasses(nextMaster.classes);
        }

        if (key === 'subjects' && oldValue !== newValue) {
           const nextClassSubjects = { ...masterData.classSubjects };
           Object.keys(nextClassSubjects).forEach(cls => {
             nextClassSubjects[cls] = nextClassSubjects[cls].map(sub => 
               sub.name === oldValue ? { ...sub, name: newValue } : sub
             );
           });
           nextMaster.classSubjects = nextClassSubjects;
        }

        onUpdateMasterData(nextMaster);
        alert(`✅ Updated successfully.`);
        cancelEditing();
    } else {
        let nextMaster: MasterData = { ...masterData };
        (nextMaster as any)[key] = [...currentList, newValue];

        if (key === 'classes') {
            const newClassSections = { ...masterData.classSections };
            if (assignSectionsOnCreate === 'Yes') {
                newClassSections[newValue] = [...tempSelectedSections];
            }
            nextMaster.classSections = newClassSections;
            setAssignSectionsOnCreate('No');
            setTempSelectedSections([]);
            nextMaster.classes = sortClasses(nextMaster.classes);
        }

        onUpdateMasterData(nextMaster);
        setNewInputs(prev => ({ ...prev, [key]: '' }));
        alert(`✅ "${newValue}" added.`);
    }
  };

  const handleAddNextSection = () => {
    const currentSections = [...masterData.sections].sort();
    const lastChar = currentSections.length > 0 ? currentSections[currentSections.length - 1].toUpperCase() : '@';
    const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
    
    if (nextChar > 'Z') {
        alert('⚠️ Maximum alphabetical sections reached.');
        return;
    }

    onUpdateMasterData({
        ...masterData,
        sections: [...currentSections, nextChar].sort()
    });
  };

  const removeItemByValue = (key: keyof MasterData, value: string) => {
    const currentList = masterData[key];
    if (!Array.isArray(currentList)) return;

    if (key === 'sections') {
       const sorted = [...(currentList as string[])].sort();
       const highest = sorted[sorted.length - 1];
       if (value !== highest) {
          alert(`⚠️ Sequence Lock: Delete section "${highest}" first to maintain order.`);
          return;
       }
    }

    if (!window.confirm(`🚨 CRITICAL WARNING: Are you sure you want to delete "${value}"? This action cannot be undone and will remove all associated student and curriculum mappings.`)) return;
    
    const normalizedValue = value.trim();
    const updatedList = (currentList as string[]).filter(item => item.trim() !== normalizedValue);
    
    // Explicitly update associated data
    let nextClassSections = { ...masterData.classSections };
    let nextClassSubjects = { ...masterData.classSubjects };
    
    if (key === 'classes') {
      delete nextClassSections[normalizedValue];
      delete nextClassSubjects[normalizedValue];
    }

    if (key === 'subjects') {
      // If a subject is deleted from the global list, remove it from all class curriculums
      Object.keys(nextClassSubjects).forEach(cls => {
        nextClassSubjects[cls] = nextClassSubjects[cls].filter(s => s.name !== normalizedValue);
      });
    }
    
    const updatedMasterData: MasterData = { 
        ...masterData, 
        [key]: updatedList,
        classSections: nextClassSections,
        classSubjects: nextClassSubjects
    } as any as MasterData;
    
    onUpdateMasterData(updatedMasterData);
    alert(`🗑️ "${normalizedValue}" removed from ${key}.`);
    
    if (editingKey === key && editingIndex !== null) cancelEditing();
  };

  const startEditing = (key: keyof MasterData, index: number) => {
    const item = (masterData[key] as string[])[index];
    setNewInputs(prev => ({ ...prev, [key]: item }));
    setEditingKey(key);
    setEditingIndex(index);
    if (key === 'classes') {
        const sections = masterData.classSections[item] || [];
        setAssignSectionsOnCreate(sections.length > 0 ? 'Yes' : 'No');
        setTempSelectedSections(sections);
    }
  };

  const cancelEditing = () => {
    setNewInputs({ classes: '', sections: '', categories: '', houses: '', religions: '', subjects: '' });
    setEditingIndex(null);
    setEditingKey(null);
    setAssignSectionsOnCreate('No');
    setTempSelectedSections([]);
  };

  const handleAddSubjectsToClass = () => {
    if (!selectedClassForSubject || selectedSubjectsToAdd.length === 0) return;
    const currentSubjects = masterData.classSubjects[selectedClassForSubject] || [];
    const newSubjects: ClassSubject[] = selectedSubjectsToAdd
      .filter(subName => !currentSubjects.some(s => s.name === subName))
      .map(subName => ({ name: subName, type: selectedSubjectType }));
    
    onUpdateMasterData({
      ...masterData,
      classSubjects: {
        ...masterData.classSubjects,
        [selectedClassForSubject]: [...currentSubjects, ...newSubjects]
      }
    });
    alert(`✅ ${newSubjects.length} subjects added.`);
    setSelectedSubjectsToAdd([]);
  };

  const toggleSubjectTypeInClass = (className: string, subjectName: string) => {
    const currentSubjects = masterData.classSubjects[className] || [];
    const updatedSubjects = currentSubjects.map(s => 
      s.name === subjectName 
        ? { ...s, type: (s.type === 'Mandatory' ? 'Optional' : 'Mandatory') as SubjectType } 
        : s
    );
    onUpdateMasterData({
      ...masterData,
      classSubjects: { ...masterData.classSubjects, [className]: updatedSubjects }
    });
  };

  const handleRemoveSubjectFromClass = (className: string, subjectName: string) => {
    if (window.confirm(`🚨 Are you sure you want to delete "${subjectName}" from the Class ${className} curriculum?`)) {
      const currentSubjects = masterData.classSubjects[className] || [];
      const nextSubjects = currentSubjects.filter(s => s.name !== subjectName);
      
      onUpdateMasterData({
        ...masterData,
        classSubjects: {
          ...masterData.classSubjects,
          [className]: nextSubjects
        }
      });
      
      setBulkSelectedSubjects(prev => prev.filter(s => s !== subjectName));
      alert(`🗑️ "${subjectName}" removed from Class ${className}.`);
    }
  };

  const handleBulkDeleteCurriculum = () => {
    if (bulkSelectedSubjects.length === 0) return;
    if (window.confirm(`🚨 CRITICAL WARNING: Remove ${bulkSelectedSubjects.length} selected subjects from Class ${selectedClassForSubject}?`)) {
        const currentSubjects = masterData.classSubjects[selectedClassForSubject] || [];
        const nextSubjects = currentSubjects.filter(s => !bulkSelectedSubjects.includes(s.name));
        
        onUpdateMasterData({
            ...masterData,
            classSubjects: {
                ...masterData.classSubjects,
                [selectedClassForSubject]: nextSubjects
            }
        });
        
        setBulkSelectedSubjects([]);
        alert('🗑️ Selected subjects removed successfully.');
    }
  };

  const toggleBulkSelect = (subjectName: string) => {
    setBulkSelectedSubjects(prev => 
        prev.includes(subjectName) ? prev.filter(s => s !== subjectName) : [...prev, subjectName]
    );
  };

  const selectAllInPreview = () => {
    const classSubjects = (masterData.classSubjects[selectedClassForSubject] || []).map(s => s.name);
    setBulkSelectedSubjects(classSubjects);
  };

  const handleSequentialSectionToggle = (section: string) => {
    const allSections = [...masterData.sections].sort();
    const clickedIndex = allSections.indexOf(section);
    const isSelected = tempSelectedSections.includes(section);
    setTempSelectedSections(isSelected ? allSections.slice(0, clickedIndex) : allSections.slice(0, clickedIndex + 1));
  };

  const renderListManager = (title: string, list: string[], key: keyof MasterData) => {
    const isSectionList = key === 'sections';
    const currentVal = newInputs[key as keyof typeof newInputs];
    const isEditingThisKey = editingKey === key;
    const displayList = isSectionList ? [...list].sort() : list;

    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
        <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
          <List size={18} className="text-blue-500" /> {title}
        </h3>
        <div className="space-y-3 mb-4">
          {!isSectionList ? (
            <div className="flex gap-2">
              <input 
                type="text" 
                value={currentVal} 
                onChange={(e) => setNewInputs(prev => ({ ...prev, [key]: e.target.value }))} 
                placeholder={isEditingThisKey ? `Edit ${title.slice(0, -1)}` : `Add ${title}`} 
                className={`flex-1 border rounded p-2 text-sm outline-none transition-all ${isEditingThisKey ? 'border-orange-400 ring-2 ring-orange-50' : 'focus:ring-2 focus:ring-blue-100'}`}
              />
              <button onClick={() => addItemToMaster(key)} className={`${isEditingThisKey ? 'bg-orange-500' : 'bg-blue-600'} text-white px-2 rounded hover:opacity-90 transition shadow-sm`}>
                {isEditingThisKey ? <Check size={18} /> : <Plus size={18} />}
              </button>
              {isEditingThisKey && (
                <button onClick={cancelEditing} className="bg-slate-200 text-slate-600 px-2 rounded hover:bg-slate-300">
                  <X size={18} />
                </button>
              )}
            </div>
          ) : (
             <button onClick={handleAddNextSection} className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition font-bold flex items-center justify-center gap-2 text-sm shadow-sm">
                <Plus size={18} /> Add Next Section
             </button>
          )}
        </div>
        
        <div className="flex-1 max-h-64 overflow-y-auto space-y-1 scrollbar-thin">
          {displayList.map((item, idx) => {
            const isItemEditing = isEditingThisKey && editingIndex === list.indexOf(item);
            return (
                <div key={`${key}-${item}-${idx}`} className={`flex justify-between items-center text-sm p-2.5 rounded border transition-all ${isItemEditing ? 'bg-orange-50 border-orange-200' : 'bg-slate-50 border-transparent hover:bg-blue-50'}`}>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-slate-700 font-bold truncate uppercase">{item}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isSectionList && (
                      <button onClick={() => startEditing(key, list.indexOf(item))} className="text-slate-400 hover:text-blue-600 p-1.5 transition-colors" title="Edit Item">
                        <Edit2 size={14} />
                      </button>
                    )}
                    <button onClick={() => removeItemByValue(key, item)} className={`text-slate-400 hover:text-red-600 p-1.5 rounded-lg transition-colors hover:bg-red-50 active:scale-95 ${isSectionList && idx !== displayList.length - 1 ? 'hidden' : ''}`} title="Delete Item Permanently">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Sessions Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="text-blue-500" /> Academic Sessions</h2>
          <div className="flex gap-2 mb-4">
            <input type="text" value={newSessionName} onChange={e => setNewSessionName(e.target.value)} placeholder="e.g. 2028-2029" className="flex-1 border rounded-lg p-2 outline-none focus:ring-2 focus:ring-blue-100" />
            <button onClick={handleAddSession} className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 transition shadow-sm"><Plus size={20} /></button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
            {sessions.map(s => (
              <div key={s.id} className={`flex justify-between items-center p-3 rounded-lg border transition ${s.isCurrent ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-100 hover:border-blue-100'}`}>
                <span className={`font-bold ${s.isCurrent ? 'text-blue-700' : 'text-slate-700'}`}>{s.name} {s.isCurrent && '✓'}</span>
                <div className="flex gap-3 items-center">
                  {!s.isCurrent && <button onClick={() => handleSetCurrentSession(s.id)} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Mark Current</button>}
                  <button onClick={() => handleDeleteSession(s.id)} className="text-slate-300 hover:text-red-600 transition-colors p-1.5 rounded-md hover:bg-red-50" title="Delete Session">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-fit text-center flex flex-col items-center justify-center">
           <Fingerprint size={48} className="text-blue-200 mb-3" />
           <p className="text-sm text-slate-500 mb-4">Manage school settings and identifiers from the configuration panels.</p>
           <button onClick={handleSaveProfile} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-blue-700 transition active:scale-95 flex items-center gap-2">
             <Save size={18} /> Save All Profiles
           </button>
        </div>
      </div>

      {/* Curriculum Preview Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2"><BookOpen className="text-blue-600" /> Class Wise Curriculum</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div className="space-y-6 border-r pr-0 md:pr-10">
             <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Class</label>
                <select value={selectedClassForSubject} onChange={(e) => { setSelectedClassForSubject(e.target.value); setBulkSelectedSubjects([]); }} className="w-full border rounded-xl p-3 bg-slate-50 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 transition">
                  <option value="">-- Choose Class --</option>
                  {masterData.classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             {selectedClassForSubject && (
               <div className="animate-in fade-in duration-300 space-y-4">
                 <div className="relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={16} />
                    <input type="text" placeholder="Search master subjects..." value={subjectPoolSearch} onChange={(e) => setSubjectPoolSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 text-sm border rounded-xl focus:ring-2 focus:ring-blue-100 outline-none shadow-sm" />
                 </div>
                 <div className="border rounded-2xl p-2 max-h-56 overflow-y-auto bg-slate-50/50 space-y-1 scrollbar-thin">
                    {masterData.subjects.filter(s => s.toLowerCase().includes(subjectPoolSearch.toLowerCase())).map(subject => {
                      const isAssigned = (masterData.classSubjects[selectedClassForSubject] || []).some(s => s.name === subject);
                      const isSelected = selectedSubjectsToAdd.includes(subject);
                      return (
                        <label key={subject} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isAssigned ? 'opacity-50 grayscale cursor-not-allowed bg-slate-200' : isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 hover:border-blue-300 cursor-pointer'}`}>
                          <input type="checkbox" checked={isSelected} onChange={() => !isAssigned && setSelectedSubjectsToAdd(prev => prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject])} disabled={isAssigned} className="hidden" />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-white text-blue-600 border-white' : 'border-slate-300'}`}>{isSelected && <Check size={10} />}</div>
                          <span className="text-sm font-bold truncate">{subject}</span>
                          {isAssigned && <span className="text-[9px] bg-slate-400 text-white px-1.5 rounded ml-auto uppercase font-bold tracking-tighter">Assigned</span>}
                        </label>
                      );
                    })}
                 </div>
                 <button onClick={handleAddSubjectsToClass} disabled={selectedSubjectsToAdd.length === 0} className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${selectedSubjectsToAdd.length === 0 ? 'bg-slate-300 text-slate-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                   <Plus size={20} /> Assign Subjects
                 </button>
               </div>
             )}
           </div>
           <div className="space-y-4">
              <h4 className="font-bold text-slate-500 text-xs uppercase tracking-widest">Curriculum Preview {selectedClassForSubject && `(Class ${selectedClassForSubject})`}</h4>
              <div className="space-y-2 max-h-[24rem] overflow-y-auto pr-2 scrollbar-thin">
                {selectedClassForSubject && (masterData.classSubjects[selectedClassForSubject] || []).length > 0 ? (
                  (masterData.classSubjects[selectedClassForSubject] || []).map((sub, idx) => (
                    <div key={idx} className={`flex justify-between items-center p-3.5 rounded-2xl border ${sub.type === 'Mandatory' ? 'bg-red-50/50 border-red-100' : 'bg-green-50/50 border-green-100'}`}>
                      <div className="flex items-center gap-3">
                         <span className="font-bold text-slate-800">{sub.name}</span>
                         <span className={`text-[10px] font-bold uppercase ${sub.type === 'Mandatory' ? 'text-red-500' : 'text-green-600'}`}>{sub.type}</span>
                      </div>
                      <div className="flex items-center gap-1">
                         <button onClick={() => toggleSubjectTypeInClass(selectedClassForSubject, sub.name)} className="text-slate-400 hover:text-blue-600 p-2 rounded-lg" title="Toggle Status"><Edit2 size={16} /></button>
                         <button onClick={() => handleRemoveSubjectFromClass(selectedClassForSubject, sub.name)} className="text-slate-300 hover:text-red-600 p-2 rounded-lg" title="Delete Assignment"><Trash2 size={18} /></button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="border-2 border-dashed rounded-2xl p-10 text-center text-slate-300 italic bg-slate-50/50">Select a class to manage assigned subjects</div>
                )}
              </div>
           </div>
        </div>
      </div>
      
      {/* Master Lists Section */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6 px-2 flex items-center gap-3"><div className="w-1.5 h-8 bg-blue-600 rounded-full shadow-sm"></div> Master Lists</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {['classes', 'sections', 'categories', 'houses', 'religions', 'subjects'].map(key => renderListManager(key.charAt(0).toUpperCase() + key.slice(1), (masterData as any)[key], key as any))}
        </div>
      </div>

      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mt-12 flex items-center justify-between gap-6 flex-wrap shadow-inner shadow-red-100">
        <div>
          <h2 className="text-xl font-bold text-red-800 flex items-center gap-2"><AlertTriangle size={24} className="text-red-500" /> Factory Reset Application</h2>
          <p className="text-red-600/70 text-sm mt-1">This will permanently erase all data across all sessions.</p>
        </div>
        <button onClick={onFactoryReset} className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 font-bold shadow-lg shadow-red-200 transition-all active:scale-95 flex items-center gap-2 shrink-0"><Trash2 size={20} /> Reset Everything</button>
      </div>
    </div>
  );
};

export default Settings;
