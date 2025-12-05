import React, { useState } from 'react';
import { Settings as SettingsType, Session, MasterData, ClassSubject, SubjectType, SchoolProfile } from '../types';
import { Save, Plus, Trash2, List, BookOpen, CheckSquare, Check, X, School, Upload, FileSpreadsheet, Download, FileUp } from 'lucide-react';
import { MONTHS, DATE_FORMATS } from '../constants';

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
  onImportStudents
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [localProfile, setLocalProfile] = useState(schoolProfile);
  const [newSessionName, setNewSessionName] = useState('');

  // States for Master Data Inputs
  const [newClass, setNewClass] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newHouse, setNewHouse] = useState('');
  const [newReligion, setNewReligion] = useState('');
  const [newSubject, setNewSubject] = useState('');

  // State for Class-Subject Mapping
  const [selectedClassForSubject, setSelectedClassForSubject] = useState('');
  const [selectedSubjectsToAdd, setSelectedSubjectsToAdd] = useState<string[]>([]);
  const [selectedSubjectType, setSelectedSubjectType] = useState<SubjectType>('Mandatory');

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
    alert('ID Configuration Saved!');
  };
  
  const handleSaveProfile = () => {
    onUpdateSchoolProfile(localProfile);
    alert('School Profile Saved!');
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

  // Generic List Handler
  const addItemToMaster = (key: keyof MasterData, value: string, setValue: (v: string) => void) => {
    if (!value) return;
    // @ts-ignore - dynamic key access for string arrays
    const currentList = masterData[key] as string[];
    onUpdateMasterData({
      ...masterData,
      [key]: [...currentList, value]
    });
    setValue('');
  };

  const removeItemFromMaster = (key: keyof MasterData, index: number) => {
    // @ts-ignore - dynamic key access for string arrays
    const updatedList = [...(masterData[key] as string[])];
    updatedList.splice(index, 1);
    onUpdateMasterData({
      ...masterData,
      [key]: updatedList
    });
  };

  // Class Subject Mapping Handlers
  const handleAddSubjectsToClass = () => {
    if (!selectedClassForSubject || selectedSubjectsToAdd.length === 0) return;

    const currentSubjects = masterData.classSubjects[selectedClassForSubject] || [];
    
    // Create new entries for selected subjects
    const newSubjects: ClassSubject[] = selectedSubjectsToAdd
      .filter(subName => !currentSubjects.some(s => s.name === subName)) // Double check duplicates
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
    
    // Reset selection
    setSelectedSubjectsToAdd([]);
  };

  const toggleSubjectSelection = (subject: string) => {
    setSelectedSubjectsToAdd(prev => 
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleSelectAllSubjects = () => {
    if (!selectedClassForSubject) return;
    const assigned = (masterData.classSubjects[selectedClassForSubject] || []).map(s => s.name);
    const available = masterData.subjects.filter(s => !assigned.includes(s));
    setSelectedSubjectsToAdd(available);
  };

  const handleClearSelection = () => {
    setSelectedSubjectsToAdd([]);
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

  // CSV Import/Export
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
      // Simple CSV parser
      const headers = lines[0].split(',').map(h => h.trim());
      const result = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Split by comma, handling potential quotes if simple
        const values: string[] = [];
        let inQuote = false;
        let currentValue = '';
        
        for(let char of line) {
            if(char === '"') {
                inQuote = !inQuote;
            } else if(char === ',' && !inQuote) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim()); // Push last value

        const obj: any = {};
        headers.forEach((header, index) => {
          obj[header] = values[index]?.replace(/^"|"$/g, '') || ''; // Remove surrounding quotes
        });
        
        // Basic validation: skip empty rows that might occur
        if (obj.FirstName && obj.Class) {
            result.push(obj);
        }
      }
      
      onImportStudents(result);
      
      // Reset input
      e.target.value = '';
    };
    reader.readAsText(file);
  };


  const renderListManager = (
    title: string, 
    list: string[], 
    value: string, 
    setValue: (v: string) => void, 
    key: keyof MasterData
  ) => (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <List size={18} /> {title}
      </h3>
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={value} 
          onChange={(e) => setValue(e.target.value)} 
          placeholder={`Add ${title}`} 
          className="flex-1 border rounded p-2 text-sm"
        />
        <button 
          onClick={() => addItemToMaster(key, value, setValue)}
          className="bg-blue-600 text-white px-3 rounded hover:bg-blue-700"
        >
          <Plus size={18} />
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1 border-t pt-2">
        {list.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm p-2 bg-slate-50 rounded group">
            <span>{item}</span>
            <button 
              onClick={() => removeItemFromMaster(key, idx)}
              className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      
      {/* School Profile Section */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <School className="text-blue-600" /> School Profile Configuration
          </h2>
          <button onClick={handleSaveProfile} className="bg-primary text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2">
            <Save size={18} /> Save Profile
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo Uploads */}
          <div className="space-y-6">
            <div className="flex flex-col items-center p-4 border-2 border-dashed rounded bg-slate-50">
               <span className="text-sm font-semibold text-slate-600 mb-2">School Logo</span>
               <div className="w-24 h-24 bg-white rounded-full border shadow-sm flex items-center justify-center overflow-hidden mb-2">
                 {localProfile.logoUrl ? <img src={localProfile.logoUrl} alt="School Logo" className="w-full h-full object-contain" /> : <School className="text-slate-300" size={40} />}
               </div>
               <label className="cursor-pointer text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 flex items-center gap-1">
                 <Upload size={12} /> Upload
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'logoUrl')} />
               </label>
            </div>
            <div className="flex flex-col items-center p-4 border-2 border-dashed rounded bg-slate-50">
               <span className="text-sm font-semibold text-slate-600 mb-2">Board / Affiliate Logo</span>
               <div className="w-24 h-24 bg-white rounded border shadow-sm flex items-center justify-center overflow-hidden mb-2">
                 {localProfile.boardLogoUrl ? <img src={localProfile.boardLogoUrl} alt="Board Logo" className="w-full h-full object-contain" /> : <span className="text-slate-300 text-xs">No Logo</span>}
               </div>
               <label className="cursor-pointer text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 flex items-center gap-1">
                 <Upload size={12} /> Upload
                 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleLogoUpload(e, 'boardLogoUrl')} />
               </label>
            </div>
          </div>

          {/* School Details Form */}
          <div className="md:col-span-2 space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-slate-600 mb-1">School Name</label>
                 <input type="text" name="name" value={localProfile.name} onChange={handleProfileChange} className="w-full border rounded p-2" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">School Code</label>
                 <input type="text" name="code" value={localProfile.code} onChange={handleProfileChange} className="w-full border rounded p-2" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
                 <input type="email" name="email" value={localProfile.email} onChange={handleProfileChange} className="w-full border rounded p-2" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Phone 1</label>
                 <input type="tel" name="phone1" value={localProfile.phone1} onChange={handleProfileChange} className="w-full border rounded p-2" />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Phone 2</label>
                 <input type="tel" name="phone2" value={localProfile.phone2} onChange={handleProfileChange} className="w-full border rounded p-2" />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-slate-600 mb-1">Address</label>
                 <textarea name="address" value={localProfile.address} onChange={handleProfileChange} className="w-full border rounded p-2 h-20"></textarea>
               </div>
             </div>

             <h3 className="font-semibold text-slate-700 pt-2 border-t">Configuration</h3>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Session Start Month</label>
                 <select name="sessionStartMonth" value={localProfile.sessionStartMonth} onChange={handleProfileChange} className="w-full border rounded p-2">
                   {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Date Format</label>
                 <select name="dateFormat" value={localProfile.dateFormat} onChange={handleProfileChange} className="w-full border rounded p-2">
                   {DATE_FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-600 mb-1">Currency</label>
                 <select name="currency" value={localProfile.currency} onChange={handleProfileChange} className="w-full border rounded p-2">
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

      
      {/* Import / Export Section */}
      <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-indigo-500">
         <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <FileSpreadsheet className="text-indigo-600" /> Data Import / Export
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-2">
               <h3 className="font-semibold text-slate-700">Bulk Student Import</h3>
               <p className="text-sm text-slate-500">
                  Import multiple student records using a CSV file. 
                  Download the template first to ensure correct formatting.
               </p>
               <div className="flex gap-4 mt-4">
                  <button onClick={downloadTemplate} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded transition border border-slate-300">
                     <Download size={18} /> Download Template
                  </button>
                  <label className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded cursor-pointer transition shadow">
                     <FileUp size={18} /> Upload CSV
                     <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                  </label>
               </div>
            </div>
            <div className="bg-indigo-50 p-4 rounded text-sm text-indigo-800">
               <strong className="block mb-1">Note:</strong>
               IDs will be auto-generated for new records. 
               Ensure "Class" and "Section" match existing Master Data values to avoid inconsistencies.
            </div>
         </div>
      </div>

      {/* Settings & Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ID Generation Settings */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Unique ID Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Prefix</label>
              <input 
                type="text" 
                value={localSettings.idPrefix} 
                onChange={e => setLocalSettings({...localSettings, idPrefix: e.target.value})}
                className="w-full border rounded p-2"
                placeholder="e.g. google_studio_3"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Separator</label>
              <select 
                value={localSettings.idSeparator} 
                onChange={e => setLocalSettings({...localSettings, idSeparator: e.target.value})}
                className="w-full border rounded p-2"
              >
                <option value="-">- (Dash)</option>
                <option value="/">/ (Slash)</option>
                <option value="_">_ (Underscore)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Start From Number</label>
              <input 
                type="number" 
                value={localSettings.idStartNumber} 
                onChange={e => setLocalSettings({...localSettings, idStartNumber: parseInt(e.target.value) || 0})}
                className="w-full border rounded p-2"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Number Padding (Zeros)</label>
              <input 
                type="number" 
                value={localSettings.idPadding} 
                onChange={e => setLocalSettings({...localSettings, idPadding: parseInt(e.target.value) || 0})}
                className="w-full border rounded p-2"
                placeholder="e.g. 3 for 001"
              />
            </div>
            
            <div className="pt-4 border-t">
               <div className="bg-blue-50 p-3 rounded mb-4 text-center">
                 <p className="text-xs text-blue-600 uppercase font-semibold">Preview ID</p>
                 <p className="text-xl font-mono text-blue-900 font-bold">
                   {localSettings.idPrefix}{localSettings.idSeparator}{String(localSettings.idStartNumber).padStart(localSettings.idPadding, '0')}
                 </p>
               </div>
               <button onClick={handleSaveSettings} className="w-full bg-slate-700 text-white py-2 rounded hover:bg-slate-800 flex justify-center items-center gap-2">
                 <Save size={18} /> Save ID Config
               </button>
            </div>
          </div>
        </div>

        {/* Session Management */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold text-slate-800 mb-4">Academic Sessions</h2>
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newSessionName}
              onChange={e => setNewSessionName(e.target.value)}
              placeholder="e.g. 2027-2028" 
              className="flex-1 border rounded p-2"
            />
            <button onClick={handleAddSession} className="bg-green-600 text-white px-4 rounded hover:bg-green-700">
              <Plus size={20} />
            </button>
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sessions.map(session => (
              <div key={session.id} className={`flex justify-between items-center p-3 rounded border ${session.isCurrent ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
                <div>
                  <span className="font-semibold text-slate-700">{session.name}</span>
                  {session.isCurrent && <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">Current</span>}
                </div>
                <div className="flex gap-2">
                  {!session.isCurrent && (
                     <button onClick={() => handleSetCurrentSession(session.id)} className="text-xs text-blue-600 hover:underline">Set Current</button>
                  )}
                  <button onClick={() => handleDeleteSession(session.id)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Subject Mapping Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <BookOpen className="text-blue-600" /> Class Wise Subject Configuration
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Assignment Form */}
           <div className="space-y-4 border-r pr-0 md:pr-8">
             <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Select Class</label>
                <select 
                  value={selectedClassForSubject} 
                  onChange={(e) => {
                    setSelectedClassForSubject(e.target.value);
                    setSelectedSubjectsToAdd([]); // Clear selection when class changes
                  }}
                  className="w-full border rounded p-2"
                >
                  <option value="">-- Select Class --</option>
                  {masterData.classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             
             {selectedClassForSubject && (
               <>
                 <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-slate-600 flex justify-between">
                        <span>Select Subjects (Multi-select)</span>
                      </label>
                      <div className="flex gap-2 text-xs">
                        <button type="button" onClick={handleSelectAllSubjects} className="text-blue-600 hover:underline flex items-center gap-1"><Check size={12}/> Select All</button>
                        <span className="text-slate-300">|</span>
                        <button type="button" onClick={handleClearSelection} className="text-slate-500 hover:underline flex items-center gap-1"><X size={12}/> Clear</button>
                      </div>
                    </div>
                    
                    <div className="text-xs text-blue-600 font-medium mb-1 text-right">{selectedSubjectsToAdd.length} selected</div>

                    <div className="border rounded p-2 max-h-56 overflow-y-auto bg-slate-50 space-y-1">
                      {masterData.subjects.length > 0 ? (
                        masterData.subjects.map(subject => {
                           const isAssigned = masterData.classSubjects[selectedClassForSubject]?.some(s => s.name === subject);
                           return (
                             <label key={subject} className={`flex items-center gap-2 p-1.5 rounded hover:bg-slate-100 transition select-none ${isAssigned ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer bg-white border border-slate-100'}`}>
                               <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedSubjectsToAdd.includes(subject) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                  {selectedSubjectsToAdd.includes(subject) && <CheckSquare size={12} className="text-white" />}
                                  {/* Hidden actual checkbox for accessibility logic, though UI is custom */}
                                  <input 
                                    type="checkbox"
                                    checked={selectedSubjectsToAdd.includes(subject)}
                                    onChange={() => !isAssigned && toggleSubjectSelection(subject)}
                                    disabled={isAssigned}
                                    className="hidden"
                                  />
                               </div>
                               <span className={`text-sm flex-1 ${isAssigned ? 'text-slate-500 italic' : 'text-slate-700'}`}>
                                 {subject}
                               </span>
                               {isAssigned && <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded">Assigned</span>}
                             </label>
                           );
                        })
                      ) : (
                        <p className="text-xs text-slate-400 text-center py-4">No subjects in master list. Add them below.</p>
                      )}
                    </div>
                 </div>
                 
                 <div>
                   <label className="block text-sm font-medium text-slate-600 mb-1">Subject Type</label>
                   <div className="flex gap-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input 
                         type="radio" 
                         checked={selectedSubjectType === 'Mandatory'} 
                         onChange={() => setSelectedSubjectType('Mandatory')}
                         className="text-blue-600"
                       />
                       <span className="text-sm">Mandatory</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                       <input 
                         type="radio" 
                         checked={selectedSubjectType === 'Optional'} 
                         onChange={() => setSelectedSubjectType('Optional')}
                         className="text-blue-600"
                       />
                       <span className="text-sm">Optional / Elective</span>
                     </label>
                   </div>
                 </div>

                 <button 
                  onClick={handleAddSubjectsToClass}
                  disabled={selectedSubjectsToAdd.length === 0}
                  className={`px-4 py-2 rounded w-full flex items-center justify-center gap-2 transition ${
                    selectedSubjectsToAdd.length === 0 
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow'
                  }`}
                 >
                   <Plus size={18} /> Add Selected {selectedSubjectsToAdd.length > 0 ? `(${selectedSubjectsToAdd.length})` : ''}
                 </button>
               </>
             )}
           </div>

           {/* Current List */}
           <div>
              <h4 className="font-semibold text-slate-700 mb-3">
                {selectedClassForSubject ? `Subjects for Class ${selectedClassForSubject}` : 'Select a class to view subjects'}
              </h4>
              
              {selectedClassForSubject && masterData.classSubjects[selectedClassForSubject]?.length > 0 ? (
                <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
                   {masterData.classSubjects[selectedClassForSubject].map((sub, idx) => (
                     <div key={idx} className="flex justify-between items-center p-2.5 bg-white border border-slate-200 rounded shadow-sm hover:shadow-md transition">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-8 rounded-full ${sub.type === 'Mandatory' ? 'bg-red-400' : 'bg-green-400'}`}></div>
                          <div>
                            <span className="font-medium text-slate-800 block">{sub.name}</span>
                            <span className={`text-[10px] uppercase font-bold tracking-wider ${sub.type === 'Mandatory' ? 'text-red-600' : 'text-green-600'}`}>
                              {sub.type}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleRemoveSubjectFromClass(selectedClassForSubject, sub.name)}
                          className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition"
                          title="Remove Subject"
                        >
                          <Trash2 size={16} />
                        </button>
                     </div>
                   ))}
                </div>
              ) : (
                <div className="text-slate-400 text-sm italic border-2 border-dashed rounded p-8 text-center bg-slate-50">
                  <BookOpen size={24} className="mx-auto mb-2 opacity-50" />
                  No subjects assigned to this class yet.
                </div>
              )}
           </div>
        </div>
      </div>
      
      {/* Master Data Management */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Master Data Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {renderListManager("Classes", masterData.classes, newClass, setNewClass, "classes")}
          {renderListManager("Sections", masterData.sections, newSection, setNewSection, "sections")}
          {renderListManager("Categories", masterData.categories, newCategory, setNewCategory, "categories")}
          {renderListManager("Houses", masterData.houses, newHouse, setNewHouse, "houses")}
          {renderListManager("Religions", masterData.religions, newReligion, setNewReligion, "religions")}
          {renderListManager("Subjects (Pool)", masterData.subjects, newSubject, setNewSubject, "subjects")}
        </div>
      </div>

    </div>
  );
};

export default Settings;