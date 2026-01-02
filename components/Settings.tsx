
import React, { useState } from 'react';
import { Settings as SettingsType, Session, MasterData, ClassSubject, SubjectType, SchoolProfile } from '../types';
import { Save, Plus, List, Check, X, School, Upload, Calendar, Building2, Trash2, Edit2, Info, Fingerprint, Search, Settings2, FileCode, ShieldCheck } from 'lucide-react';
import { MONTHS } from '../constants';

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
  onFactoryReset
}) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [localProfile, setLocalProfile] = useState(schoolProfile);
  const [newSessionName, setNewSessionName] = useState('');

  const [newInputs, setNewInputs] = useState({
    classes: '',
    sections: '',
    categories: '',
    houses: '',
    religions: '',
    subjects: ''
  });

  const [editingKey, setEditingKey] = useState<keyof MasterData | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleSaveSettings = () => {
    onUpdateSettings(localSettings);
  };
  
  const handleSaveProfile = () => {
    onUpdateSchoolProfile(localProfile);
  };

  const handleAddSession = () => {
    const trimmed = newSessionName.trim();
    if (!trimmed) return;
    if (sessions.some(s => s.name === trimmed)) return alert('Session exists.');
    onUpdateSessions([...sessions, { id: Date.now().toString(), name: trimmed, isCurrent: false }]);
    setNewSessionName('');
  };

  const handleSetCurrentSession = (id: string) => {
    onUpdateSessions(sessions.map(s => ({ ...s, isCurrent: s.id === id })));
  };

  const handleDeleteSession = (id: string) => {
    if (sessions.length <= 1) return alert("Cannot delete the only session.");
    if (window.confirm("Delete this session?")) {
      onUpdateSessions(sessions.filter(s => s.id !== id));
    }
  };

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setLocalProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'boardLogoUrl') => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setLocalProfile(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const addItemToMaster = (key: keyof MasterData) => {
    const value = newInputs[key as keyof typeof newInputs].trim();
    if (!value) return;
    const currentList = masterData[key] as string[];
    
    if (editingIndex !== null && editingKey === key) {
      const updated = [...currentList];
      updated[editingIndex] = value;
      onUpdateMasterData({ ...masterData, [key]: updated } as any);
      setEditingIndex(null); setEditingKey(null);
    } else {
      if (currentList.includes(value)) return alert('Exists.');
      onUpdateMasterData({ ...masterData, [key]: [...currentList, value] } as any);
    }
    setNewInputs(prev => ({ ...prev, [key]: '' }));
  };

  const deleteItemFromMaster = (key: keyof MasterData, value: string) => {
    if (window.confirm(`Delete ${value}?`)) {
      onUpdateMasterData({ ...masterData, [key]: (masterData[key] as string[]).filter(i => i !== value) } as any);
    }
  };

  const renderListManager = (title: string, list: string[], key: keyof MasterData) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <h3 className="font-black text-slate-800 mb-4 text-[10px] uppercase tracking-widest">{title}</h3>
      <div className="flex gap-2 mb-4">
        <input 
          type="text" 
          value={newInputs[key as keyof typeof newInputs]} 
          onChange={(e) => setNewInputs(prev => ({ ...prev, [key]: e.target.value }))} 
          placeholder={`Add ${title}...`} 
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500"
        />
        <button onClick={() => addItemToMaster(key)} className="bg-slate-900 text-white px-3 rounded-xl hover:bg-black transition-colors">
          <Plus size={18} />
        </button>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-2 no-scrollbar">
        {list.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-sm px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 group">
            <span className="font-bold text-slate-700">{item}</span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => {setEditingIndex(idx); setEditingKey(key); setNewInputs(p => ({...p, [key]: item}))}} className="text-blue-600 p-1.5 hover:bg-blue-100 rounded-lg"><Edit2 size={14}/></button>
              <button onClick={() => deleteItemFromMaster(key, item)} className="text-red-600 p-1.5 hover:bg-red-100 rounded-lg"><Trash2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const currentSessionName = sessions.find(s => s.isCurrent)?.name || '2025-2026';

  const previewId = () => {
    const serial = String(localSettings.idStartNumber).padStart(localSettings.idPadding, '0');
    const year = new Date().getFullYear().toString();
    
    if (localSettings.idType === 'Numeric') {
      let parts = [];
      if (localSettings.idPrefix) parts.push(localSettings.idPrefix);
      if (localSettings.includeDateInId) parts.push(year);
      if (localSettings.includeClassInId) parts.push('10');
      parts.push(serial);
      return parts.join(localSettings.idSeparator || '');
    } else {
      return localSettings.idPattern
        .replace('[PREFIX]', localSettings.idPrefix)
        .replace('[SEP]', localSettings.idSeparator)
        .replace('[YEAR]', year)
        .replace('[SESSION]', currentSessionName)
        .replace('[CLASS]', '10')
        .replace('[SECTION]', 'A')
        .replace('[SERIAL]', serial);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-in fade-in duration-500">
      
      {/* SCHOOL DETAILS */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
            <Building2 className="text-blue-600" /> School Profile
          </h2>
          <button onClick={handleSaveProfile} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition active:scale-95">
            <Save size={18} /> Update Profile
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* LOGO UPLOAD SECTION */}
          <div className="flex flex-col gap-10">
            <div className="text-center">
              <div className="w-40 h-40 mx-auto bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group hover:border-blue-400 transition-all shadow-inner">
                {localProfile.logoUrl ? (
                  <img src={localProfile.logoUrl} className="w-full h-full object-contain p-2" alt="School Logo" />
                ) : (
                  <School className="text-slate-300" size={40} />
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleLogoUpload(e, 'logoUrl')} title="Upload School Logo" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest pointer-events-none transition-all">Change Logo</div>
              </div>
              <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.2em]">Institutional Logo</p>
            </div>

            <div className="text-center">
              <div className="w-40 h-40 mx-auto bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden relative group hover:border-emerald-400 transition-all shadow-inner">
                {localProfile.boardLogoUrl ? (
                  <img src={localProfile.boardLogoUrl} className="w-full h-full object-contain p-2" alt="Board Logo" />
                ) : (
                  <ShieldCheck className="text-slate-300" size={40} />
                )}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleLogoUpload(e, 'boardLogoUrl')} title="Upload Board/Affiliation Logo" />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest pointer-events-none transition-all">Change Board</div>
              </div>
              <p className="text-[10px] font-black text-slate-400 mt-4 uppercase tracking-[0.2em]">Board / Affiliation</p>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Official Institution Name</label>
              <input type="text" name="name" value={localProfile.name} onChange={handleProfileChange} className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-xl text-slate-800 transition-all" placeholder="Enter school name" />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Primary Contact Number</label>
              <input type="text" name="phone1" value={localProfile.phone1} onChange={handleProfileChange} className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" placeholder="+1..." />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Administrative Email</label>
              <input type="email" name="email" value={localProfile.email} onChange={handleProfileChange} className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold transition-all" placeholder="admin@..." />
            </div>
            <div className="md:col-span-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Campus Address</label>
              <textarea name="address" value={localProfile.address} onChange={handleProfileChange} className="w-full p-4 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 h-32 text-sm font-medium transition-all resize-none"></textarea>
            </div>
          </div>
        </div>
      </div>

      {/* STUDENT ID PATTERN */}
      <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-800">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-black flex items-center gap-4 uppercase tracking-tight"><Fingerprint className="text-blue-400" /> Enrollment Numbering</h2>
          <button onClick={handleSaveSettings} className="bg-white text-slate-900 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-50 transition-all active:scale-95">
            Commit Changes
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-10">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Select Logic Engine</label>
              <div className="flex p-1.5 bg-slate-800/50 rounded-2xl border border-slate-800">
                 <button onClick={() => setLocalSettings({...localSettings, idType: 'Numeric'})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 transition-all ${localSettings.idType === 'Numeric' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Settings2 size={16} /> Standard
                 </button>
                 <button onClick={() => setLocalSettings({...localSettings, idType: 'Pattern'})} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-3 transition-all ${localSettings.idType === 'Pattern' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>
                    <FileCode size={16} /> Custom Mask
                 </button>
              </div>
            </div>

            {localSettings.idType === 'Pattern' ? (
              <div className="animate-in slide-in-from-left-4 duration-300">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block">Sequence Mask Definition</label>
                <input type="text" value={localSettings.idPattern} onChange={e => setLocalSettings({...localSettings, idPattern: e.target.value})} className="w-full p-5 border border-slate-700 bg-slate-800/80 rounded-2xl outline-none font-mono text-blue-400 focus:ring-2 focus:ring-blue-500 transition-all" />
                <div className="mt-5 flex flex-wrap gap-2.5">
                  {['[PREFIX]', '[SEP]', '[YEAR]', '[SESSION]', '[CLASS]', '[SECTION]', '[SERIAL]'].map(t => (
                    <span key={t} className="text-[9px] bg-slate-800/50 px-3 py-1.5 rounded-lg text-slate-400 border border-slate-700 font-mono select-none">{t}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 animate-in slide-in-from-left-4 duration-300">
                <div className="flex items-center gap-4 bg-slate-800/50 p-5 rounded-2xl border border-slate-800">
                   <input type="checkbox" checked={localSettings.includeDateInId} onChange={e => setLocalSettings({...localSettings, includeDateInId: e.target.checked})} className="w-5 h-5 rounded accent-blue-600" />
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Add Year</span>
                </div>
                <div className="flex items-center gap-4 bg-slate-800/50 p-5 rounded-2xl border border-slate-800">
                   <input type="checkbox" checked={localSettings.includeClassInId} onChange={e => setLocalSettings({...localSettings, includeClassInId: e.target.checked})} className="w-5 h-5 rounded accent-blue-600" />
                   <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Add Class</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-5">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Prefix</label>
                <input type="text" value={localSettings.idPrefix} onChange={e => setLocalSettings({...localSettings, idPrefix: e.target.value})} className="w-full p-4 border border-slate-700 bg-slate-800/80 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-center" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Separator</label>
                <input type="text" value={localSettings.idSeparator} onChange={e => setLocalSettings({...localSettings, idSeparator: e.target.value})} className="w-full p-4 border border-slate-700 bg-slate-800/80 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-center" />
              </div>
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3 block">Start From</label>
                <input type="number" value={localSettings.idStartNumber} onChange={e => setLocalSettings({...localSettings, idStartNumber: parseInt(e.target.value) || 0})} className="w-full p-4 border border-slate-700 bg-slate-800/80 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black text-center" />
              </div>
            </div>
          </div>

          <div className="bg-white/5 p-12 rounded-[3.5rem] border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group min-h-[350px]">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000"><Fingerprint size={200} /></div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-[0.3em] mb-6">Generated ID Preview</span>
            <span className="text-5xl font-mono font-black tracking-tighter text-white group-hover:text-blue-400 transition-colors text-center break-all selection:bg-blue-500">
              {previewId()}
            </span>
            <p className="mt-8 text-center text-slate-500 text-[10px] font-black uppercase tracking-widest leading-loose max-w-[240px] opacity-60">
              {localSettings.idType === 'Numeric' ? 'Sequential numeric IDs with fixed formatting.' : 'Dynamic mask-based generation with class & session logic.'}
            </p>
          </div>
        </div>
      </div>

      {/* SESSION MANAGER */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
        <h2 className="text-xl font-black text-slate-800 mb-10 flex items-center gap-4 uppercase tracking-tight">
            <Calendar className="text-blue-500" /> Academic Sessions
        </h2>
        <div className="flex gap-4 mb-10">
          <input type="text" value={newSessionName} onChange={e => setNewSessionName(e.target.value)} placeholder="Enter New Year Range (e.g. 2027-2028)" className="flex-1 p-4.5 border border-slate-100 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-black transition-all" />
          <button onClick={handleAddSession} className="bg-slate-900 text-white px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-black transition-all active:scale-95 shadow-xl shadow-slate-900/10">Add Session</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {sessions.map(s => (
            <div key={s.id} className={`p-6 rounded-3xl border-2 flex justify-between items-center transition-all duration-300 ${s.isCurrent ? 'border-blue-500 bg-blue-50/50 shadow-2xl shadow-blue-500/10' : 'bg-white border-slate-50 shadow-sm hover:border-slate-200'}`}>
              <div className="flex flex-col">
                <span className={`font-black tracking-tighter text-2xl ${s.isCurrent ? 'text-blue-700' : 'text-slate-800'}`}>{s.name}</span>
                {s.isCurrent && <span className="text-[9px] font-black uppercase text-blue-500 tracking-[0.2em] mt-1.5 flex items-center gap-2"><Check size={12} /> Currently Active</span>}
              </div>
              <div className="flex gap-3">
                {!s.isCurrent && <button onClick={() => handleSetCurrentSession(s.id)} className="text-[9px] font-black bg-white text-blue-600 border border-blue-100 px-4 py-2.5 rounded-xl uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm">Activate</button>}
                <button onClick={() => handleDeleteSession(s.id)} className="text-red-500 p-3 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {['classes', 'sections', 'categories', 'houses', 'religions', 'subjects'].map(k => renderListManager(k, (masterData as any)[k], k as any))}
      </div>

      <div className="pt-16 pb-10 flex flex-col items-center gap-4">
        <button onClick={onFactoryReset} className="text-red-500 text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-red-50 hover:text-red-700 hover:border-red-200 transition-all pb-1.5">Destroy Local Database</button>
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Version 2.0.1 Stable</p>
      </div>
    </div>
  );
};

export default Settings;
