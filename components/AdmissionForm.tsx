
import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Session, Student, Document, GuardianType, Gender, MasterData, ClassSubject } from '../types';
import { BLOOD_GROUPS, INITIAL_STUDENT_FORM } from '../constants';
import { generateStudentSummary } from '../services/geminiService';
import { Upload, FileText, User, Sparkles, Save, Camera, BookOpen, HelpCircle, RefreshCw, Lock, Unlock, Search, Loader2 } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface AdmissionFormProps {
  settings: Settings;
  sessions: Session[];
  masterData: MasterData;
  initialData?: Student;
  onSave: (student: Student) => void;
  onCancel: () => void;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <div className="group relative inline-block ml-1">
    <HelpCircle size={14} className="text-slate-400 cursor-help hover:text-blue-500 transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-xs p-2 rounded z-20 shadow-lg pointer-events-none text-center">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

const AdmissionForm: React.FC<AdmissionFormProps> = ({ settings, sessions, masterData, initialData, onSave, onCancel }) => {
  const [formData, setFormData] = useState<any>(INITIAL_STUDENT_FORM);
  const [generatedId, setGeneratedId] = useState('');
  const [isIdManual, setIsIdManual] = useState(false);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<ClassSubject[]>([]);
  const [allowedSections, setAllowedSections] = useState<string[]>([]);
  
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [croppingField, setCroppingField] = useState<string | null>(null);

  const getDynamicId = useCallback((className: string, admissionDate: string, section: string, sessionId: string) => {
    const serial = String(settings.idStartNumber).padStart(settings.idPadding, '0');
    const date = new Date(admissionDate);
    const year = isNaN(date.getTime()) ? new Date().getFullYear().toString() : date.getFullYear().toString();
    const sessionObj = sessions.find(s => s.id === sessionId);
    const sessionName = sessionObj ? sessionObj.name : '';
    
    if (settings.idType === 'Numeric') {
      // Simple Rules logic
      let parts = [];
      if (settings.idPrefix) parts.push(settings.idPrefix);
      if (settings.includeDateInId) parts.push(year);
      if (settings.includeClassInId && className) parts.push(className);
      parts.push(serial);
      return parts.join(settings.idSeparator || '');
    } else {
      // Advanced Pattern Rule
      return settings.idPattern
        .replace('[PREFIX]', settings.idPrefix || '')
        .replace('[SEP]', settings.idSeparator || '')
        .replace('[YEAR]', year)
        .replace('[SESSION]', sessionName)
        .replace('[CLASS]', className || '')
        .replace('[SECTION]', section || '')
        .replace('[SERIAL]', serial);
    }
  }, [settings, sessions]);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setGeneratedId(initialData.id);
      setIsIdManual(true);
    } else {
      setFormData((prev: any) => ({
        ...INITIAL_STUDENT_FORM,
        admissionSessionId: sessions.find(s => s.isCurrent)?.id || ''
      }));
    }
  }, [sessions, initialData]);

  useEffect(() => {
    if (!initialData && !isIdManual) {
      const newId = getDynamicId(formData.class, formData.admissionDate, formData.section, formData.admissionSessionId);
      setGeneratedId(newId);
    }
  }, [formData.class, formData.admissionDate, formData.section, formData.admissionSessionId, getDynamicId, initialData, isIdManual]);

  useEffect(() => {
    if (formData.class) {
      const classSubjects = masterData.classSubjects?.[formData.class] || [];
      setAvailableSubjects(classSubjects);
      const sections = [...(masterData.classSections?.[formData.class] || masterData.sections || [])].sort();
      setAllowedSections(sections);
    }
  }, [formData.class, masterData.classSubjects, masterData.classSections, masterData.sections]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => {
      let newData = { ...prev };
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        newData[parent] = { ...prev[parent], [child]: value };
      } else {
        newData[name] = value;
      }
      if (name === 'mobile' && (!prev.parentLoginId || prev.parentLoginId === prev.mobile)) {
        newData.parentLoginId = value;
      }
      return newData;
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCroppingImage(reader.result as string);
        setCroppingField(field);
        e.target.value = '';
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCropSave = (croppedDataUrl: string) => {
    if (!croppingField) return;
    if (croppingField.includes('.')) {
       const [parent, child] = croppingField.split('.');
       setFormData((prev: any) => ({ ...prev, [parent]: { ...prev[parent], [child]: croppedDataUrl } }));
    } else {
       setFormData((prev: any) => ({ ...prev, [croppingField]: croppedDataUrl }));
    }
    setCroppingImage(null);
    setCroppingField(null);
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingNote(true);
    const summary = await generateStudentSummary(formData);
    setFormData((prev: any) => ({ ...prev, note: summary }));
    setIsGeneratingNote(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const loginId = formData.parentLoginId || formData.mobile || `P${generatedId}`;
    const password = formData.parentLoginPassword || Math.random().toString(36).slice(-8);
    
    onSave({
      ...formData,
      id: generatedId,
      admissionNumber: generatedId,
      parentLoginId: loginId,
      parentLoginPassword: password,
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden relative border border-slate-100 animate-in fade-in zoom-in-95 duration-300">
      {croppingImage && <ImageCropper imageSrc={croppingImage} onCrop={handleCropSave} onCancel={() => setCroppingImage(null)} />}
      <div className="bg-slate-900 text-white p-5 flex justify-between items-center sticky top-0 z-10 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-black tracking-tight uppercase">{initialData ? 'Edit Record' : 'Admission'}</h2>
          <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-widest">System ID: {generatedId}</p>
        </div>
        <div className="flex gap-2">
           <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition font-bold text-[10px] uppercase tracking-wider border border-slate-700">Cancel</button>
           <button form="admissionForm" type="submit" className="px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 transition flex items-center gap-2 font-bold text-[10px] uppercase tracking-wider shadow-lg shadow-blue-900/40">
             <Save size={16} /> {initialData ? 'Update' : 'Save Admission'}
           </button>
        </div>
      </div>

      <form id="admissionForm" onSubmit={handleSubmit} className="p-8 space-y-10 pb-24">
        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600"><BookOpen size={18} /></div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Academic Info</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Academic Session</label>
                <select name="admissionSessionId" value={formData.admissionSessionId} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3.5 bg-slate-50 font-black text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all" required>
                  <option value="">Select Session</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
             </div>
             <div>
               <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Admission Number</label>
                  <button type="button" onClick={() => setIsIdManual(!isIdManual)} className="text-[9px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-tighter underline">{isIdManual ? 'Switch to Auto' : 'Manual Edit'}</button>
               </div>
               <div className="relative group">
                 <input type="text" value={generatedId} onChange={(e) => setGeneratedId(e.target.value)} readOnly={!isIdManual} className={`w-full border rounded-xl p-3.5 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all ${!isIdManual ? 'bg-slate-100 text-slate-500 border-slate-200' : 'bg-white text-slate-900 border-blue-400 font-bold'}`} />
                 {!isIdManual ? <Lock size={14} className="absolute right-4 top-4 text-slate-300" /> : <Unlock size={14} className="absolute right-4 top-4 text-blue-500" />}
               </div>
             </div>
             <div>
               <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Roll Number</label>
               <input type="text" name="rollNo" value={formData.rollNo} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white font-bold" placeholder="e.g. 01" required />
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Target Class</label>
                <select name="class" value={formData.class} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-800" required>
                  <option value="">Select Class</option>
                  {masterData.classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Section</label>
                <select name="section" value={formData.section} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none font-black text-slate-800" required>
                  <option value="">Select Section</option>
                  {allowedSections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Admission Date</label>
                <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white font-bold" required />
             </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-3">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600"><User size={18} /></div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Personal Details</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             <div className="md:col-span-1 flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 group hover:border-blue-400 transition-colors">
               <div className="w-32 h-32 rounded-3xl bg-white mb-4 overflow-hidden border-4 border-white shadow-xl relative">
                 {formData.photoUrl ? <img src={formData.photoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300"><User size={48} /></div>}
               </div>
               <label className="cursor-pointer text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white px-5 py-2.5 rounded-xl shadow-lg hover:bg-blue-600 transition-all active:scale-95">
                 {formData.photoUrl ? 'Update Photo' : 'Upload Photo'}
                 <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photoUrl')} className="hidden" />
               </label>
             </div>
             <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">First Name</label>
                   <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold" required />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Middle Name</label>
                   <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Last Name</label>
                   <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold" required />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Date of Birth</label>
                   <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3.5 outline-none focus:ring-2 focus:ring-blue-500 font-bold" required />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Gender</label>
                   <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3.5 outline-none font-black text-slate-700">
                     <option value={Gender.Male}>Male</option>
                     <option value={Gender.Female}>Female</option>
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">Religion</label>
                    <select name="religion" value={formData.religion} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3.5 outline-none font-bold text-slate-700">
                      {masterData.religions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
             </div>
          </div>
        </section>

        <section className="bg-slate-900 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 text-white/5 pointer-events-none group-hover:scale-110 transition-transform duration-700"><Sparkles size={160} /></div>
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-3">
                <Sparkles className="text-blue-400" size={24} /> AI Assistant Note
              </h3>
              <button type="button" onClick={handleGenerateSummary} disabled={isGeneratingNote} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50">
                {isGeneratingNote ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                {isGeneratingNote ? 'Generating...' : 'Auto-Compose Note'}
              </button>
           </div>
           <div className="relative">
             <textarea 
               name="note" 
               value={formData.note} 
               onChange={handleChange} 
               className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500 min-h-[140px] text-sm leading-relaxed" 
               placeholder="System notes or special admission remarks..."
             ></textarea>
           </div>
        </section>

        <section className="pt-6">
           <div className="flex gap-4">
              <button type="submit" className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-black transition-all active:scale-[0.98] border border-slate-800">
                Finalize Enrollment
              </button>
           </div>
        </section>
      </form>
    </div>
  );
};

export default AdmissionForm;
