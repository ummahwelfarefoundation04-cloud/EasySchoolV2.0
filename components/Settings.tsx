
import React, { useState } from 'react';
import { Settings as SettingsType, Session, MasterData, ClassSubject, SubjectType, SchoolProfile } from '../types';
import { Save, Plus, Trash2, Edit2, List, BookOpen, Check, X, School, Upload, FileSpreadsheet, Download, FileUp, AlertTriangle, Fingerprint, Search, Lock, Unlock, BadgeCheck, Settings as SettingsIcon, Calendar } from 'lucide-react';
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
    religions: ''
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

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    showNotification('ID Configuration Saved!');
  };
  
  const handleSaveProfile = () => {
    onUpdateSchoolProfile(localProfile);
    showNotification('School Profile Saved!');
  };

  const showNotification = (msg: string) => {
      alert(msg);
  };

  const handleAddSession = () => {
    if (!newSessionName) return;
    const newSession: Session = {
      id: Date.now().toString(),
      name: newSessionName,
      isCurrent: false
    };
    onUpdateSessions([...sessions, newSession]);
    setNewSessionName('');
  };

  const handleDeleteSession = (id: string) => {
    if (sessions.length <= 1) {
      alert("Cannot delete the only session.");
      return;
    }
    onUpdateSessions(sessions.filter(s => s.id !== id));
  };

  const handleSetCurrentSession = (id: string) => {
    const updated = sessions.map(s => ({
      ...s,
      isCurrent: s.id === id
    }));
    onUpdateSessions(updated);
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

  // Robust class sorting: standard grades first, then custom alphabetically
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
    
    // Uniqueness Check
    const isDuplicate = currentList.some((item, idx) => 
      item.toLowerCase() === value.trim().toLowerCase() && (editingKey !== key || editingIndex !== idx)
    );

    if (isDuplicate) {
        alert(`"${value}" already exists in ${key}. Value must be unique.`);
        return;
    }

    if (editingIndex !== null && editingKey === key) {
        const updatedList = [...currentList];
        const oldValue = updatedList[editingIndex];
        const newValue = value.trim();
        updatedList[editingIndex] = newValue;

        let nextMaster = { ...masterData, [key]: updatedList };

        if (key === 'classes') {
            const newClassSections = { ...masterData.classSections };
            if (oldValue !== newValue) {
                if (newClassSections[oldValue]) {
                    newClassSections[newValue] = newClassSections[oldValue];
                    delete newClassSections[oldValue];
                }
                const newClassSubjects = { ...masterData.classSubjects };
                if (newClassSubjects[oldValue]) {
                    newClassSubjects[newValue] = newClassSubjects[oldValue];
                    delete newClassSubjects[oldValue];
                }
                nextMaster.classSubjects = newClassSubjects;
            }

            if (assignSectionsOnCreate === 'Yes') {
                nextMaster.classSections[newValue] = [...tempSelectedSections];
            } else if (assignSectionsOnCreate === 'No') {
                delete nextMaster.classSections[newValue];
            }
            nextMaster.classes = sortClasses(nextMaster.classes);
        }

        onUpdateMasterData(nextMaster);
        cancelEditing();
    } else {
        const newValue = value.trim();
        let nextMaster: any = { ...masterData };
        nextMaster[key] = [...currentList, newValue];

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
    }
  };

  const handleAddNextSection = () => {
    const currentSections = [...masterData.sections].sort();
    const lastChar = currentSections.length > 0 ? currentSections[currentSections.length - 1].toUpperCase() : '@';
    const nextChar = String.fromCharCode(lastChar.charCodeAt(0) + 1);
    
    if (nextChar > 'Z') {
        alert('Maximum alphabetical sections reached (Z).');
        return;
    }

    onUpdateMasterData({
        ...masterData,
        sections: [...currentSections, nextChar].sort()
    });
  };

  const removeItemByValue = (key: keyof MasterData, value: string) => {
    const currentList = [...(masterData[key] as string[])];
    
    // Strict deletion for sections to prevent sequence gaps
    if (key === 'sections') {
       const sorted = [...currentList].sort();
       const highest = sorted[sorted.length - 1];
       if (value !== highest) {
          alert(`To maintain strict sequence, you must delete the alphabetically last section ("${highest}") first.`);
          return;
       }
    }

    if (!window.confirm(`Are you sure you want to delete "${value}"? This will remove all related mappings.`)) return;
    
    const updatedList = currentList.filter(item => item !== value);
    const nextMaster = { ...masterData, [key]: updatedList };
    
    if (key === 'classes') {
      const newClassSections = { ...masterData.classSections };
      delete newClassSections[value];
      nextMaster.classSections = newClassSections;
      
      const newClassSubjects = { ...masterData.classSubjects };
      delete newClassSubjects[value];
      nextMaster.classSubjects = newClassSubjects;
    }
    
    onUpdateMasterData(nextMaster);
    if (editingKey === key && newInputs[editingKey] === value) {
      cancelEditing();
    }
  };

  const startEditing = (key: keyof MasterData, index: number) => {
    const item = (masterData[key] as string[])[index];
    setNewInputs(prev => ({ ...prev, [key]: item }));
    setEditingKey(key);
    setEditingIndex(index);
    
    if (key === 'classes') {
        const sections = masterData.classSections[item] || [];
        if (sections.length > 0) {
            setAssignSectionsOnCreate('Yes');
            setTempSelectedSections(sections);
        } else {
            setAssignSectionsOnCreate('No');
            setTempSelectedSections([]);
        }
    }
  };

  const cancelEditing = () => {
    setNewInputs({
        classes: '',
        sections: '',
        categories: '',
        houses: '',
        religions: ''
    });
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
      .map(subName => ({
        name: subName,
        type: selectedSubjectType
      }));
    if (newSubjects.length === 0) {
      alert('Selected subjects are already assigned to the class.');
      return;
    }
    onUpdateMasterData({
      ...masterData,
      classSubjects: {
        ...masterData.classSubjects,
        [selectedClassForSubject]: [...currentSubjects, ...newSubjects]
      }
    });
    setSelectedSubjectsToAdd([]);
    setSubjectPoolSearch('');
  };

  const toggleSubjectSelection = (subject: string) => {
    setSelectedSubjectsToAdd(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleRemoveSubjectFromClass = (className: string, subjectName: string) => {
    const currentSubjects = masterData.classSubjects[className] || [];
    const updatedSubjects = currentSubjects.filter(s => s.name !== subjectName);
    onUpdateMasterData({
      ...masterData,
      classSubjects: {
        ...masterData.classSubjects,
        [className]: updatedSubjects
      }
    });
  };

  // Enforce sequential section assignment logic
  const getSequentialSections = (clickedSection: string, currentSelection: string[]) => {
    const allSections = [...masterData.sections].sort();
    const clickedIndex = allSections.indexOf(clickedSection);
    const isSelected = currentSelection.includes(clickedSection);

    if (isSelected) {
      // Deselect clicked and all following (prevents gaps)
      return allSections.slice(0, clickedIndex);
    } else {
      // Select clicked and all preceding (prevents gaps)
      return allSections.slice(0, clickedIndex + 1);
    }
  };

  const handleSequentialSectionToggle = (section: string) => {
    setTempSelectedSections(prev => getSequentialSections(section, prev));
  };

  const downloadTemplate = () => {
    const headers = [
      "FirstName", "MiddleName", "LastName", "Class", "Section", "RollNo", 
      "Gender", "DOB", "BloodGroup", "Category", "Religion", "Caste",
      "Mobile", "Email", "AdmissionDate", 
      "FatherName", "FatherPhone", "MotherName", "MotherPhone",
      "CurrentAddress", "PermanentAddress"
    ];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "student_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const result = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values: string[] = [];
        let inQuote = false;
        let currentValue = '';
        for(let char of line) {
            if(char === '"') inQuote = !inQuote;
            else if(char === ',' && !inQuote) {
                values.push(currentValue.trim());
                currentValue = '';
            } else currentValue += char;
        }
        values.push(currentValue.trim());
        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index]?.replace(/^"|"$/g, '') || '';
        });
        if (obj.FirstName && obj.Class) result.push(obj);
      }
      onImportStudents(result);
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const renderListManager = (
    title: string, 
    list: string[], 
    key: keyof MasterData
  ) => {
    const isClassList = key === 'classes';
    const isSectionList = key === 'sections';
    const currentVal = newInputs[key as keyof typeof newInputs];
    const isEditingThisKey = editingKey === key;

    // Sorting the display list specifically for sections to ensure sequence visibility
    const displayList = isSectionList ? [...list].sort() : list;

    return (
      <div className="bg-white p-6 rounded-lg shadow-md h-full border border-slate-100 flex flex-col">
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
              {isEditingThisKey ? (
                <div className="flex gap-1">
                  <button 
                    onClick={() => addItemToMaster(key)}
                    className="bg-orange-500 text-white px-2 rounded hover:bg-orange-600 transition shadow-sm"
                    title="Update"
                  >
                    <Check size={18} />
                  </button>
                  <button 
                    onClick={cancelEditing}
                    className="bg-slate-200 text-slate-600 px-2 rounded hover:bg-slate-300 transition"
                    title="Cancel"
                  >
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => addItemToMaster(key)}
                  className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700 transition shadow-sm"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
          ) : (
             <button 
                onClick={handleAddNextSection}
                className="w-full bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition shadow-sm font-bold flex items-center justify-center gap-2 text-sm"
             >
                <Plus size={18} /> Add Next Section ({String.fromCharCode((list.length > 0 ? [...list].sort()[list.length - 1].toUpperCase().charCodeAt(0) : 64) + 1)})
             </button>
          )}

          {isClassList && currentVal.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-300">
               <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tight">Assign sections?</span>
                    <div className="flex items-center bg-white rounded-md border p-0.5">
                       <button 
                          onClick={() => { setAssignSectionsOnCreate('No'); setTempSelectedSections([]); }}
                          className={`px-3 py-0.5 text-[10px] font-bold rounded transition-colors ${assignSectionsOnCreate === 'No' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                         No
                       </button>
                       <button 
                          onClick={() => setAssignSectionsOnCreate('Yes')}
                          className={`px-3 py-0.5 text-[10px] font-bold rounded transition-colors ${assignSectionsOnCreate === 'Yes' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                       >
                         Yes
                       </button>
                    </div>
                  </div>
                  
                  {assignSectionsOnCreate === 'Yes' && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[...masterData.sections].sort().map(s => {
                        const isSelected = tempSelectedSections.includes(s);
                        return (
                          <button
                            key={s}
                            onClick={() => handleSequentialSectionToggle(s)}
                            className={`w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold transition-all border ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-blue-400'}`}
                            title={`Sequential Assign Section ${s}`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  )}
               </div>
            </div>
          )}
        </div>
        
        <div className="flex-1 max-h-64 overflow-y-auto space-y-1 border-t pt-2 scrollbar-thin scrollbar-thumb-slate-200">
          {displayList.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic text-center py-4">No entries yet</p>
          ) : (
            displayList.map((item, idx) => {
                const originalIndex = list.indexOf(item);
                const isItemEditing = isEditingThisKey && editingIndex === originalIndex;
                
                return (
                    <div key={idx} className={`flex justify-between items-center text-sm p-2.5 rounded group transition-all min-h-[44px] ${isItemEditing ? 'bg-orange-50 border border-orange-200 ring-1 ring-orange-100' : 'bg-slate-50 hover:bg-blue-50 border border-transparent'}`}>
                      <div className="flex flex-col flex-1 min-w-0 mr-2">
                        <span className="text-slate-700 font-bold truncate uppercase tracking-tight">{item}</span>
                        {isClassList && (masterData.classSections[item] || []).length > 0 && (
                           <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter truncate">
                             Sections: {(masterData.classSections[item] || []).join(', ')}
                           </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!isSectionList && (
                          <button 
                            onClick={() => startEditing(key, originalIndex)}
                            className="text-slate-400 hover:text-blue-600 p-1.5 rounded hover:bg-blue-100 transition"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => removeItemByValue(key, item)}
                          className={`text-slate-300 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition ${isSectionList && idx !== displayList.length - 1 ? 'hidden' : ''}`}
                          title={isSectionList ? "Delete (Only last section allowed)" : "Delete"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                );
            })
          )}
        </div>
      </div>
    );
  };

  const generatePreviewId = (sampleClass: string, sampleDate: string) => {
    const pad = (num: number, size: number) => {
      let s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    };
    
    const parts = [localSettings.idPrefix];
    const sep = localSettings.idSeparator;

    if (localSettings.idType === 'Pattern') {
       if (localSettings.includeClassInId) {
         parts.push(CLASS_SHORT_NAMES[sampleClass] || sampleClass);
       }
       if (localSettings.includeDateInId) {
         const date = new Date(sampleDate);
         const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
         parts.push(`${months[date.getMonth()]}${date.getFullYear().toString().slice(-2)}`);
       }
    }

    parts.push(pad(localSettings.idStartNumber, localSettings.idPadding));
    return parts.filter(Boolean).join(sep);
  };

  return (
    <div className="space-y-8 pb-10">
      
      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <School className="text-blue-600" /> School Profile Configuration
          </h2>
          <button onClick={handleSaveProfile} className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2 transition shadow-md">
            <Save size={18} /> Save Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-xl bg-slate-50">
               <span className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">School Logo</span>
               <div className="w-24 h-24 bg-white rounded-full border shadow-sm flex items-center justify-center overflow-hidden mb-3">
                 {localProfile.logoUrl ? <img src={localProfile.logoUrl} alt="School Logo" className="w-full h-full object-contain" /> : <School className="text-slate-200" size={40} />}
               </div>
               <label className="cursor-pointer text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 flex items-center gap-1 transition">
                 <Upload size={12} /> Upload Photo
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logoUrl')} />
               </label>
            </div>
            <div className="flex flex-col items-center p-4 border-2 border-dashed rounded-xl bg-slate-50">
               <span className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Board Logo</span>
               <div className="w-24 h-24 bg-white rounded border shadow-sm flex items-center justify-center overflow-hidden mb-3">
                 {localProfile.boardLogoUrl ? <img src={localProfile.boardLogoUrl} alt="Board Logo" className="w-full h-full object-contain" /> : <span className="text-slate-200 text-xs">No Logo</span>}
               </div>
               <label className="cursor-pointer text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 flex items-center gap-1 transition">
                 <Upload size={12} /> Upload Photo
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'boardLogoUrl')} />
               </label>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-slate-600 mb-1">School Name</label>
                 <input type="text" name="name" value={localProfile.name} onChange={handleProfileChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-100 outline-none" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">School Code</label>
                 <input type="text" name="code" value={localProfile.code} onChange={handleProfileChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-100 outline-none" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                 <input type="email" name="email" value={localProfile.email} onChange={handleProfileChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-100 outline-none" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Phone 1</label>
                 <input type="tel" name="phone1" value={localProfile.phone1} onChange={handleProfileChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-100 outline-none" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Phone 2</label>
                 <input type="tel" name="phone2" value={localProfile.phone2} onChange={handleProfileChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-100 outline-none" />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-slate-600 mb-1">Address</label>
                 <textarea name="address" value={localProfile.address} onChange={handleProfileChange} className="w-full border rounded p-2 h-20 focus:ring-2 focus:ring-blue-100 outline-none"></textarea>
               </div>
             </div>

             <h3 className="font-semibold text-slate-700 pt-2 border-t flex items-center gap-2">
               <SettingsIcon size={16} className="text-slate-400" /> Locale Settings
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Session Start</label>
                 <select name="sessionStartMonth" value={localProfile.sessionStartMonth} onChange={handleProfileChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-100 outline-none">
                   {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Date Format</label>
                 <select name="dateFormat" value={localProfile.dateFormat} onChange={handleProfileChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-100 outline-none">
                   {DATE_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Currency</label>
                 <select name="currency" value={localProfile.currency} onChange={handleProfileChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-100 outline-none">
                   <option value="INR">INR (₹)</option>
                   <option value="USD">USD ($)</option>
                   <option value="EUR">EUR (€)</option>
                   <option value="GBP">GBP (£)</option>
                 </select>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500 border-y border-r border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Fingerprint className="text-blue-600" /> Unique ID Configuration
            </h2>
            <button onClick={handleSaveSettings} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 flex items-center gap-2 text-sm transition shadow-sm">
              <Save size={18} /> Save ID Config
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Generation Strategy</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition flex-1 hover:bg-slate-50">
                    <input 
                      type="radio" 
                      name="idType" 
                      checked={localSettings.idType === 'Numeric'} 
                      onChange={() => setLocalSettings({...localSettings, idType: 'Numeric'})}
                    />
                    <div className="text-sm">
                      <span className="font-bold block text-slate-700">Numeric Only</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Prefix-Sequence</span>
                    </div>
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition flex-1 hover:bg-slate-50">
                    <input 
                      type="radio" 
                      name="idType" 
                      checked={localSettings.idType === 'Pattern'} 
                      onChange={() => setLocalSettings({...localSettings, idType: 'Pattern'})}
                    />
                    <div className="text-sm">
                      <span className="font-bold block text-slate-700">Dynamic Pattern</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-tighter">Prefix-Class-Date-Num</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">ID Prefix</label>
                   <input 
                     type="text" 
                     value={localSettings.idPrefix} 
                     onChange={e => setLocalSettings({...localSettings, idPrefix: e.target.value})}
                     className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                     placeholder="e.g. ES"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">Separator</label>
                   <select 
                     value={localSettings.idSeparator} 
                     onChange={e => setLocalSettings({...localSettings, idSeparator: e.target.value})}
                     className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                   >
                     <option value="-">- (Dash)</option>
                     <option value="/">/ (Slash)</option>
                     <option value="">None</option>
                   </select>
                 </div>
              </div>

              {localSettings.idType === 'Pattern' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Pattern Components</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-white rounded border hover:border-blue-300 transition">
                      <input 
                        type="checkbox" 
                        checked={localSettings.includeClassInId} 
                        onChange={e => setLocalSettings({...localSettings, includeClassInId: e.target.checked})}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-600">Include Class</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer p-2 bg-white rounded border hover:border-blue-300 transition">
                      <input 
                        type="checkbox" 
                        checked={localSettings.includeDateInId} 
                        onChange={e => setLocalSettings({...localSettings, includeDateInId: e.target.checked})}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-600">Include Date</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-2">
                 <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">Start From</label>
                   <input 
                     type="number" 
                     value={localSettings.idStartNumber} 
                     onChange={e => setLocalSettings({...localSettings, idStartNumber: parseInt(e.target.value) || 0})}
                     className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">Padding</label>
                   <input 
                     type="number" 
                     value={localSettings.idPadding} 
                     onChange={e => setLocalSettings({...localSettings, idPadding: parseInt(e.target.value) || 0})}
                     className="w-full border rounded p-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                     placeholder="e.g. 3 for 001"
                   />
                 </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col justify-center items-center relative overflow-hidden shadow-inner">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Fingerprint size={120} />
               </div>
               <span className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                 <BadgeCheck size={14} /> Live ID Generation Preview
               </span>
               
               <div className="space-y-4 w-full max-w-xs">
                 <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                   <p className="text-[10px] text-slate-400 mb-1 font-medium">Standard Class Preview (10th)</p>
                   <p className="text-2xl font-mono font-bold text-white tracking-wider">
                     {generatePreviewId('10', '2025-04-01')}
                   </p>
                 </div>
                 
                 <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm transition-all hover:bg-white/10">
                   <p className="text-[10px] text-slate-400 mb-1 font-medium">Early Class Preview (Nursery)</p>
                   <p className="text-2xl font-mono font-bold text-white tracking-wider">
                     {generatePreviewId('Nursery', '2025-01-15')}
                   </p>
                 </div>
               </div>
            </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
             <Calendar className="text-blue-500" /> Academic Sessions
          </h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newSessionName}
              onChange={e => setNewSessionName(e.target.value)}
              placeholder="e.g. 2027-2028" 
              className="flex-1 border rounded p-2 focus:ring-2 focus:ring-blue-100 outline-none"
            />
            <button onClick={handleAddSession} className="bg-green-600 text-white px-4 rounded hover:bg-green-700 transition shadow-sm">
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
            {sessions.map(session => (
              <div key={session.id} className={`flex justify-between items-center p-3 rounded-lg border transition ${session.isCurrent ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100' : 'bg-white border-slate-200'}`}>
                <div>
                  <span className="font-semibold text-slate-700">{session.name}</span>
                  {session.isCurrent && <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full font-bold uppercase">Current</span>}
                </div>
                <div className="flex gap-2 items-center">
                  {!session.isCurrent && (
                     <button onClick={() => handleSetCurrentSession(session.id)} className="text-xs text-blue-600 font-bold hover:underline">Mark Current</button>
                  )}
                  <button onClick={() => handleDeleteSession(session.id)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500 border-y border-r border-slate-100">
           <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileSpreadsheet className="text-indigo-600" /> Bulk Student Import
           </h2>
           <div className="space-y-4">
               <p className="text-sm text-slate-500 leading-relaxed">
                  Rapidly populate your school database by uploading a CSV file. Use the official template for accurate mapping.
               </p>
               <div className="flex flex-wrap gap-3">
                  <button onClick={downloadTemplate} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg transition border border-slate-300 text-sm font-medium shadow-sm">
                     <Download size={18} /> Template
                  </button>
                  <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg cursor-pointer transition shadow-md text-sm font-medium">
                     <FileUp size={18} /> Upload CSV
                     <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>
               </div>
           </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border border-slate-100">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <BookOpen className="text-blue-600" /> Class Wise Subject Configuration
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
           <div className="space-y-4 border-r-0 md:border-r border-slate-100 pr-0 md:pr-10">
             <div>
                <label className="block text-sm font-bold text-slate-500 mb-2 uppercase tracking-wide">Select Target Class</label>
                <select 
                  value={selectedClassForSubject} 
                  onChange={(e) => {
                    setSelectedClassForSubject(e.target.value);
                    setSelectedSubjectsToAdd([]);
                  }}
                  className="w-full border rounded-lg p-2.5 text-slate-700 bg-slate-50 focus:ring-2 focus:ring-blue-100 outline-none transition"
                >
                  <option value="">-- Choose Class --</option>
                  {masterData.classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             
             {selectedClassForSubject && (
               <>
                 <div className="space-y-3">
                    <label className="block text-sm font-bold text-slate-500 uppercase tracking-wide">Pick Subjects Pool</label>
                    <div className="relative">
                       <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                       <input 
                         type="text" 
                         placeholder="Search available subjects..." 
                         value={subjectPoolSearch}
                         onChange={(e) => setSubjectPoolSearch(e.target.value)}
                         className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 outline-none bg-white transition shadow-sm"
                       />
                    </div>
                    <div className="border rounded-xl p-3 max-h-64 overflow-y-auto bg-slate-50/50 space-y-1.5 shadow-inner">
                      {masterData.subjects.filter(s => s.toLowerCase().includes(subjectPoolSearch.toLowerCase())).map(subject => {
                        const isAssigned = (masterData.classSubjects[selectedClassForSubject] || []).some(s => s.name === subject);
                        return (
                          <label key={subject} className={`flex items-center gap-3 p-2 rounded-lg border transition-all ${isAssigned ? 'opacity-50 cursor-not-allowed bg-slate-100 border-transparent' : 'cursor-pointer bg-white border-slate-200 hover:border-blue-400'}`}>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedSubjectsToAdd.includes(subject) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                               {selectedSubjectsToAdd.includes(subject) && <Check size={14} className="text-white" />}
                               <input type="checkbox" checked={selectedSubjectsToAdd.includes(subject)} onChange={() => !isAssigned && toggleSubjectSelection(subject)} disabled={isAssigned} className="hidden" />
                            </div>
                            <span className={`text-sm font-medium flex-1 ${isAssigned ? 'text-slate-400 italic' : 'text-slate-700'}`}>{subject}</span>
                          </label>
                        );
                      })}
                    </div>
                 </div>
                 
                 <div className="flex gap-4 p-1 bg-slate-100 rounded-lg w-fit">
                   <button onClick={() => setSelectedSubjectType('Mandatory')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${selectedSubjectType === 'Mandatory' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-500'}`}>Mandatory</button>
                   <button onClick={() => setSelectedSubjectType('Optional')} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${selectedSubjectType === 'Optional' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500'}`}>Optional</button>
                 </div>

                 <button onClick={handleAddSubjectsToClass} disabled={selectedSubjectsToAdd.length === 0} className={`px-4 py-3 rounded-xl w-full font-bold flex items-center justify-center gap-2 transition ${selectedSubjectsToAdd.length === 0 ? 'bg-slate-300 text-slate-50' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'}`}>
                   <Plus size={20} /> Add to Class
                 </button>
               </>
             )}
           </div>

           <div className="space-y-4">
              <h4 className="font-bold text-slate-500 mb-3 uppercase tracking-wide flex items-center gap-2">
                <BadgeCheck size={18} className="text-slate-400" />
                {selectedClassForSubject ? `Class ${selectedClassForSubject} Curriculum` : 'Subject Preview'}
              </h4>
              {selectedClassForSubject && masterData.classSubjects[selectedClassForSubject]?.length > 0 ? (
                <div className="space-y-2 max-h-[30rem] overflow-y-auto pr-2 scrollbar-thin">
                   {masterData.classSubjects[selectedClassForSubject].map((sub, idx) => (
                     <div key={idx} className={`flex justify-between items-center p-3 rounded-xl border group transition-all ${sub.type === 'Mandatory' ? 'bg-red-50/30 border-red-100' : 'bg-green-50/30 border-green-100'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${sub.type === 'Mandatory' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            {sub.type === 'Mandatory' ? <Lock size={16} /> : <Unlock size={16} />}
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block">{sub.name}</span>
                            <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">{sub.type}</span>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveSubjectFromClass(selectedClassForSubject, sub.name)} className="text-slate-300 hover:text-red-600 p-2 rounded-full transition-all opacity-0 group-hover:opacity-100">
                          <Trash2 size={18} />
                        </button>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="text-slate-300 italic border-2 border-dashed rounded-2xl p-12 text-center bg-slate-50/50">
                  Select a class to view subjects
                </div>
              )}
           </div>
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
           <div className="w-1.5 h-8 bg-blue-600 rounded-full"></div>
           Global Master Lists
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {renderListManager("Classes", masterData.classes, "classes")}
          {renderListManager("Sections", masterData.sections, "sections")}
          {renderListManager("Categories", masterData.categories, "categories")}
          {renderListManager("Houses", masterData.houses, "houses")}
          {renderListManager("Religions", masterData.religions, "religions")}
        </div>
      </div>

      <div className="bg-red-50 p-6 rounded-2xl border border-red-100 mt-12 shadow-sm">
        <h2 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
          <AlertTriangle size={24} className="text-red-500" /> Danger Zone
        </h2>
        <p className="text-red-600/80 text-sm mb-6 max-w-2xl leading-relaxed">
          Factory resetting will permanently erase all data, including student records, customized settings, and academic results. This action cannot be reversed.
        </p>
        <button onClick={onFactoryReset} className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 font-bold shadow-lg shadow-red-100 transition-all flex items-center gap-2">
          <Trash2 size={20} /> Factory Reset Application
        </button>
      </div>

    </div>
  );
};

export default Settings;
