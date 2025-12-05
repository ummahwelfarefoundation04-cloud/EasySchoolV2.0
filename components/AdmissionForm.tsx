
import React, { useState, useEffect } from 'react';
import { Settings, Session, Student, Document, GuardianType, Gender, MasterData, ClassSubject } from '../types';
import { BLOOD_GROUPS, INITIAL_STUDENT_FORM } from '../constants';
import { generateStudentSummary } from '../services/geminiService';
import { Upload, FileText, User, Sparkles, Save, X, Camera, BookOpen, HelpCircle, RefreshCw, Lock, Unlock, Search } from 'lucide-react';
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
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-xs p-2 rounded z-20 shadow-lg pointer-events-none">
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
  const [subjectSearch, setSubjectSearch] = useState('');
  
  // Cropper State
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const [croppingField, setCroppingField] = useState<string | null>(null);

  // Function to generate ID based on settings
  const generateId = () => {
    const pad = (num: number, size: number) => {
      let s = num + "";
      while (s.length < size) s = "0" + s;
      return s;
    };
    return `${settings.idPrefix}${settings.idSeparator}${pad(settings.idStartNumber, settings.idPadding)}`;
  };

  // Initialize form with existing data if available (Edit Mode)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setGeneratedId(initialData.id);
      setIsIdManual(true); // Treat existing IDs as manual so they don't get overwritten
    } else {
      if (!isIdManual) {
        setGeneratedId(generateId());
      }
      
      // Reset form to initial state but preserve the generated ID
      setFormData((prev: any) => ({
        ...INITIAL_STUDENT_FORM,
        admissionSessionId: sessions.find(s => s.isCurrent)?.id || ''
      }));
    }
  }, [settings, sessions, initialData]);

  // Regenerate ID if settings change and not in manual mode
  useEffect(() => {
    if (!initialData && !isIdManual) {
      setGeneratedId(generateId());
    }
  }, [settings, isIdManual]);

  // Update available subjects when Class changes
  useEffect(() => {
    if (formData.class) {
      const classSubjects = masterData.classSubjects?.[formData.class] || [];
      setAvailableSubjects(classSubjects);
      setSubjectSearch('');
      
      // If NOT editing existing student (or if subject list is empty), auto-select mandatory subjects
      if (!initialData || formData.subjects.length === 0) {
        const mandatorySubjects = classSubjects
          .filter(s => s.type === 'Mandatory')
          .map(s => s.name);
          
        setFormData((prev: any) => ({
          ...prev,
          subjects: [...new Set([...(prev.subjects || []), ...mandatorySubjects])]
        }));
      }
    } else {
      setAvailableSubjects([]);
      setSubjectSearch('');
    }
  }, [formData.class, masterData.classSubjects, initialData]);

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

      // Auto-populate Parent Login ID from Mobile
      // If Login ID is empty OR matches the previous mobile (indicating they are synced), update it.
      if (name === 'mobile') {
        if (!prev.parentLoginId || prev.parentLoginId === prev.mobile) {
          newData.parentLoginId = value;
        }
      }

      return newData;
    });
  };

  const handleSubjectToggle = (subjectName: string) => {
    setFormData((prev: any) => {
      const currentSubjects = prev.subjects || [];
      if (currentSubjects.includes(subjectName)) {
        return { ...prev, subjects: currentSubjects.filter((s: string) => s !== subjectName) };
      } else {
        return { ...prev, subjects: [...currentSubjects, subjectName] };
      }
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        // Open Cropper
        setCroppingImage(reader.result as string);
        setCroppingField(field);
        
        // Reset input so same file can be selected again
        e.target.value = '';
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = (croppedDataUrl: string) => {
    if (!croppingField) return;

    if (croppingField.includes('.')) {
       const [parent, child] = croppingField.split('.');
       setFormData((prev: any) => ({
         ...prev,
         [parent]: { ...prev[parent], [child]: croppedDataUrl }
       }));
    } else {
       setFormData((prev: any) => ({ ...prev, [croppingField]: croppedDataUrl }));
    }
    setCroppingImage(null);
    setCroppingField(null);
  };

  const handleCropCancel = () => {
    setCroppingImage(null);
    setCroppingField(null);
  };

  const handleDocumentChange = (index: number, file: File | null) => {
    const updatedDocs = [...formData.documents];
    updatedDocs[index] = { ...updatedDocs[index], file: file || undefined, fileName: file?.name };
    setFormData((prev: any) => ({ ...prev, documents: updatedDocs }));
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingNote(true);
    const summary = await generateStudentSummary(formData);
    setFormData((prev: any) => ({ ...prev, note: summary }));
    setIsGeneratingNote(false);
  };

  const generateCredentials = () => {
     // Generate Login ID if empty: Use Mobile or Father's Phone
     let loginId = formData.parentLoginId;
     if (!loginId) {
        loginId = formData.mobile || formData.father.phone || `P${generatedId}`;
     }
     
     // Generate Password if empty: Random 6 char string
     let password = formData.parentLoginPassword;
     if (!password) {
        password = Math.random().toString(36).slice(-8);
     }
     
     return { loginId, password };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { loginId, password } = generateCredentials();

    const studentData: Student = {
      ...formData,
      id: generatedId,
      admissionNumber: generatedId,
      parentLoginId: loginId,
      parentLoginPassword: password,
    };
    onSave(studentData);
  };

  const toggleIdMode = () => {
    if (isIdManual) {
      // Switching to Auto: Regenerate
      setIsIdManual(false);
      setGeneratedId(generateId());
    } else {
      // Switching to Manual: Keep current value but make editable
      setIsIdManual(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
      
      {/* Cropper Modal */}
      {croppingImage && (
        <ImageCropper 
          imageSrc={croppingImage} 
          onCrop={handleCropSave} 
          onCancel={handleCropCancel} 
        />
      )}

      <div className="bg-slate-800 text-white p-4 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold">{initialData ? 'Edit Student Record' : 'New Student Admission'}</h2>
          <p className="text-sm text-slate-400">Session: {sessions.find(s => s.id === formData.admissionSessionId)?.name || 'Select Session'}</p>
        </div>
        <div className="flex gap-2">
           <button type="button" onClick={onCancel} className="px-4 py-2 rounded bg-slate-600 hover:bg-slate-700 transition">Cancel</button>
           <button form="admissionForm" type="submit" className="px-4 py-2 rounded bg-primary hover:bg-blue-600 transition flex items-center gap-2">
             <Save size={18} /> {initialData ? 'Update Record' : 'Save Record'}
           </button>
        </div>
      </div>

      <form id="admissionForm" onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* Academic Details */}
        <section>
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4 flex items-center gap-2">
            <FileText size={20} /> Academic Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
             <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-600 mb-1">Admission Session</label>
                <select 
                  name="admissionSessionId" 
                  value={formData.admissionSessionId} 
                  onChange={handleChange}
                  className="w-full border rounded p-2 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select Session</option>
                  {sessions.map(s => <option key={s.id} value={s.id}>{s.name} {s.isCurrent ? '(Current)' : ''}</option>)}
                </select>
             </div>
             <div className="col-span-1">
               <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-600">Unique ID</label>
                  <button 
                    type="button" 
                    onClick={toggleIdMode}
                    className="text-[10px] flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200"
                  >
                    {isIdManual ? <><RefreshCw size={10} /> Reset Auto</> : <><Unlock size={10} /> Edit ID</>}
                  </button>
               </div>
               <div className="relative">
                 <input 
                   type="text" 
                   value={generatedId} 
                   onChange={(e) => setGeneratedId(e.target.value)}
                   readOnly={!isIdManual}
                   className={`w-full border rounded p-2 font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none ${!isIdManual ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white text-slate-800 border-blue-300'}`}
                 />
                 {!isIdManual && <Lock size={14} className="absolute right-3 top-3 text-slate-400" />}
               </div>
             </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Roll No</label>
               <input type="text" name="rollNo" value={formData.rollNo} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
             </div>
             <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-600 mb-1">Class</label>
                <select name="class" value={formData.class} onChange={handleChange} className="w-full border rounded p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">Select Class</option>
                  {masterData.classes.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-600 mb-1">Section</label>
                <select name="section" value={formData.section} onChange={handleChange} className="w-full border rounded p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none" required>
                  <option value="">Select Section</option>
                  {masterData.sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
             </div>
             <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center">
                  Category <Tooltip text="Student's social category (e.g., General, OBC, SC/ST)" />
                </label>
                <select name="category" value={formData.category} onChange={handleChange} className="w-full border rounded p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select Category</option>
                  {masterData.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center">
                  House <Tooltip text="Assigned School House (e.g. Red, Blue, Green)" />
                </label>
                <select name="house" value={formData.house} onChange={handleChange} className="w-full border rounded p-2 bg-white focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Select House</option>
                  {masterData.houses.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
             </div>
              <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Admission Date</label>
               <input type="date" name="admissionDate" value={formData.admissionDate} onChange={handleChange} className="w-full border rounded p-2 focus:ring-2 focus:ring-blue-500 outline-none" required />
             </div>
          </div>
        </section>

        {/* Subjects Section - Shows only if class is selected */}
        {formData.class && (
          <section className="bg-slate-50 p-4 rounded border border-slate-200">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
               <h3 className="text-lg font-semibold text-slate-700 flex items-center gap-2">
                 <BookOpen size={20} /> Subjects ({formData.class})
               </h3>
               <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search subjects..." 
                    value={subjectSearch}
                    onChange={(e) => setSubjectSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-full focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                  />
               </div>
             </div>
             
             {availableSubjects.length > 0 ? (
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                 {availableSubjects
                   .filter(sub => sub.name.toLowerCase().includes(subjectSearch.toLowerCase()))
                   .map(sub => {
                   const isMandatory = sub.type === 'Mandatory';
                   const isSelected = formData.subjects?.includes(sub.name);
                   
                   return (
                     <label 
                      key={sub.name} 
                      className={`relative flex flex-col p-3 rounded-lg border transition-all ${
                        isMandatory 
                          ? 'bg-slate-100 border-slate-200 opacity-90' 
                          : isSelected 
                            ? 'bg-blue-50 border-blue-400 shadow-sm cursor-pointer' 
                            : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm cursor-pointer'
                      }`}
                    >
                       <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full tracking-wider ${
                            isMandatory 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {isMandatory ? 'Compulsory' : 'Optional'}
                          </span>
                          {isMandatory ? (
                            <Lock size={14} className="text-slate-400" />
                          ) : (
                             <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                                <input 
                                 type="checkbox" 
                                 checked={isSelected}
                                 onChange={() => handleSubjectToggle(sub.name)}
                                 className="hidden"
                               />
                               {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>}
                             </div>
                          )}
                       </div>
                       
                       <span className={`text-sm font-semibold ${isMandatory || isSelected ? 'text-slate-800' : 'text-slate-600'}`}>
                         {sub.name}
                       </span>
                     </label>
                   );
                 })}
                 
                 {availableSubjects.filter(sub => sub.name.toLowerCase().includes(subjectSearch.toLowerCase())).length === 0 && (
                   <div className="col-span-full text-center py-6 text-slate-400 text-sm">
                     No subjects found matching "{subjectSearch}"
                   </div>
                 )}
               </div>
             ) : (
               <p className="text-slate-500 text-sm italic">No subjects configured for this class. Please go to Settings to assign subjects.</p>
             )}
          </section>
        )}

        {/* Student Profile */}
        <section>
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4 flex items-center gap-2">
            <User size={20} /> Student Personal Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">First Name</label>
               <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className="w-full border rounded p-2" required />
            </div>
            <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Middle Name</label>
               <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Last Name</label>
               <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className="w-full border rounded p-2" required />
            </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Gender</label>
               <select name="gender" value={formData.gender} onChange={handleChange} className="w-full border rounded p-2" required>
                 <option value={Gender.Male}>Male</option>
                 <option value={Gender.Female}>Female</option>
               </select>
            </div>
            <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Date of Birth</label>
               <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full border rounded p-2" required />
            </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Blood Group</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="w-full border rounded p-2">
                  <option value="">Select</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
            </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Religion</label>
                <select name="religion" value={formData.religion} onChange={handleChange} className="w-full border rounded p-2">
                  <option value="">Select</option>
                  {masterData.religions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
            </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center">
                 Caste <Tooltip text="Specify caste or community details if applicable" />
               </label>
               <input type="text" name="caste" value={formData.caste} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Mobile No</label>
               <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full border rounded p-2" required />
            </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">WhatsApp No</label>
               <input type="tel" name="whatsapp" value={formData.whatsapp} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Email ID</label>
               <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full border rounded p-2" />
            </div>
             <div className="col-span-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded p-2 bg-slate-50">
               <div className="w-24 h-24 rounded-full bg-slate-200 mb-2 overflow-hidden flex items-center justify-center relative shadow-sm">
                 {formData.photoUrl ? (
                   <img src={formData.photoUrl} alt="Student" className="w-full h-full object-cover" />
                 ) : (
                   <div className="flex flex-col items-center justify-center text-slate-400">
                      <User size={40} />
                   </div>
                 )}
               </div>
               <label className="cursor-pointer text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded hover:bg-blue-200 flex items-center gap-1 transition">
                 <Camera size={14} /> Upload Photo
                 <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'photoUrl')} className="hidden" />
               </label>
            </div>
          </div>
        </section>

        {/* Parent Details */}
        <section>
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Parent / Guardian Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-50 p-4 rounded border">
              <div className="flex justify-between items-start mb-3">
                 <h4 className="font-semibold text-slate-600">Father's Details</h4>
                 <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border">
                   {formData.father.photoUrl && <img src={formData.father.photoUrl} alt="Father" className="w-full h-full object-cover" />}
                 </div>
              </div>
              <div className="space-y-3">
                 <input type="text" name="father.name" placeholder="Name" value={formData.father.name} onChange={handleChange} className="w-full border rounded p-2" />
                 <input type="text" name="father.phone" placeholder="Phone" value={formData.father.phone} onChange={handleChange} className="w-full border rounded p-2" />
                 <input type="text" name="father.occupation" placeholder="Occupation" value={formData.father.occupation} onChange={handleChange} className="w-full border rounded p-2" />
                 <label className="block text-xs text-slate-500 mt-1 cursor-pointer">
                    <span className="bg-slate-200 px-2 py-1 rounded mr-2 hover:bg-slate-300">Upload Photo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'father.photoUrl')} />
                 </label>
              </div>
            </div>
             <div className="bg-slate-50 p-4 rounded border">
              <div className="flex justify-between items-start mb-3">
                 <h4 className="font-semibold text-slate-600">Mother's Details</h4>
                 <div className="w-12 h-12 rounded-full bg-slate-200 overflow-hidden border">
                   {formData.mother.photoUrl && <img src={formData.mother.photoUrl} alt="Mother" className="w-full h-full object-cover" />}
                 </div>
              </div>
              <div className="space-y-3">
                 <input type="text" name="mother.name" placeholder="Name" value={formData.mother.name} onChange={handleChange} className="w-full border rounded p-2" />
                 <input type="text" name="mother.phone" placeholder="Phone" value={formData.mother.phone} onChange={handleChange} className="w-full border rounded p-2" />
                 <input type="text" name="mother.occupation" placeholder="Occupation" value={formData.mother.occupation} onChange={handleChange} className="w-full border rounded p-2" />
                  <label className="block text-xs text-slate-500 mt-1 cursor-pointer">
                    <span className="bg-slate-200 px-2 py-1 rounded mr-2 hover:bg-slate-300">Upload Photo</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'mother.photoUrl')} />
                 </label>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-600 mb-2">Guardian Relation</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="guardianType" value={GuardianType.Father} checked={formData.guardianType === GuardianType.Father} onChange={handleChange} /> Father
              </label>
               <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="guardianType" value={GuardianType.Mother} checked={formData.guardianType === GuardianType.Mother} onChange={handleChange} /> Mother
              </label>
               <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="guardianType" value={GuardianType.Other} checked={formData.guardianType === GuardianType.Other} onChange={handleChange} /> Other
              </label>
            </div>
          </div>

          {formData.guardianType === GuardianType.Other && (
             <div className="bg-orange-50 p-4 rounded border mt-4 border-orange-200">
              <div className="flex justify-between items-start mb-3">
                 <h4 className="font-semibold text-orange-800">Other Guardian Details</h4>
                 <div className="w-12 h-12 rounded-full bg-orange-200 overflow-hidden border border-orange-300">
                   {formData.otherGuardian.photoUrl && <img src={formData.otherGuardian.photoUrl} alt="Guardian" className="w-full h-full object-cover" />}
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="col-span-1">
                    <label className="block text-xs font-medium text-orange-800 mb-1">Name</label>
                    <input type="text" name="otherGuardian.name" placeholder="Guardian Name" value={formData.otherGuardian.name} onChange={handleChange} className="w-full border rounded p-2" required />
                 </div>
                 <div className="col-span-1">
                    <label className="block text-xs font-medium text-orange-800 mb-1">Phone</label>
                    <input type="text" name="otherGuardian.phone" placeholder="Phone Number" value={formData.otherGuardian.phone} onChange={handleChange} className="w-full border rounded p-2" required />
                 </div>
                 <div className="col-span-1">
                    <label className="block text-xs font-medium text-orange-800 mb-1">Occupation</label>
                    <input type="text" name="otherGuardian.occupation" placeholder="Occupation" value={formData.otherGuardian.occupation} onChange={handleChange} className="w-full border rounded p-2" />
                 </div>
                 <div className="col-span-1">
                    <label className="block text-xs font-medium text-orange-800 mb-1">Relation with Student <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      name="otherGuardian.relation" 
                      placeholder="e.g. Uncle, Grandparent" 
                      value={formData.otherGuardian.relation} 
                      onChange={handleChange} 
                      className="w-full border rounded p-2" 
                      required 
                    />
                 </div>
                 <div className="col-span-1 md:col-span-2">
                   <label className="block text-xs text-orange-700 mt-1 cursor-pointer">
                      <span className="bg-orange-200 px-2 py-1 rounded mr-2 hover:bg-orange-300 border border-orange-300 transition">Upload Guardian Photo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'otherGuardian.photoUrl')} />
                   </label>
                 </div>
              </div>
            </div>
          )}
        </section>

        {/* Addresses & IDs */}
        <section>
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Address & Identification</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Current Address</label>
               <textarea name="currentAddress" value={formData.currentAddress} onChange={handleChange} className="w-full border rounded p-2 h-24" required></textarea>
             </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Permanent Address</label>
               <textarea name="permanentAddress" value={formData.permanentAddress} onChange={handleChange} className="w-full border rounded p-2 h-24"></textarea>
             </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">National ID (Aadhar/SSN)</label>
               <input type="text" name="nationalId" value={formData.nationalId} onChange={handleChange} className="w-full border rounded p-2" />
             </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1">Local ID / Other ID</label>
               <input type="text" name="localId" value={formData.localId} onChange={handleChange} className="w-full border rounded p-2" />
             </div>
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center">
                 RTE (Right To Education) <Tooltip text="Is this student admitted under the RTE Act quota?" />
               </label>
               <select name="rte" value={formData.rte} onChange={handleChange} className="w-full border rounded p-2">
                 <option value="No">No</option>
                 <option value="Yes">Yes</option>
               </select>
             </div>
          </div>
        </section>

        {/* Previous School */}
        <section>
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Previous School Record</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-600 mb-1">School Name</label>
                <input type="text" name="previousSchoolName" value={formData.previousSchoolName} onChange={handleChange} className="w-full border rounded p-2" />
              </div>
               <div className="col-span-1">
                <label className="block text-sm font-medium text-slate-600 mb-1">Record/Details</label>
                <input type="text" name="previousSchoolRecord" value={formData.previousSchoolRecord} onChange={handleChange} className="w-full border rounded p-2" />
              </div>
           </div>
        </section>

        {/* Note & Documents */}
        <section>
          <h3 className="text-lg font-semibold text-slate-700 border-b pb-2 mb-4">Notes & Documents</h3>
          <div className="grid grid-cols-1 gap-4">
             <div className="col-span-1 relative">
               <label className="block text-sm font-medium text-slate-600 mb-1 flex justify-between">
                 <span>Admission Note</span>
                 <button type="button" onClick={handleGenerateSummary} disabled={isGeneratingNote} className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1">
                   <Sparkles size={14} /> {isGeneratingNote ? 'Generating...' : 'Auto-Generate with AI'}
                 </button>
               </label>
               <textarea name="note" value={formData.note} onChange={handleChange} className="w-full border rounded p-2 h-24" placeholder="Enter special notes..."></textarea>
             </div>
             
             <div className="col-span-1">
               <label className="block text-sm font-medium text-slate-600 mb-2">Upload Documents (Max 4)</label>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {formData.documents.map((doc: Document, idx: number) => (
                   <div key={idx} className="border p-3 rounded bg-slate-50">
                     <input 
                       type="text" 
                       value={doc.title} 
                       onChange={(e) => {
                         const newDocs = [...formData.documents];
                         newDocs[idx].title = e.target.value;
                         setFormData({...formData, documents: newDocs});
                       }}
                       className="w-full mb-2 text-sm border-b bg-transparent outline-none font-semibold text-slate-700" 
                       placeholder="Document Title" 
                     />
                     <input 
                       type="file" 
                       onChange={(e) => handleDocumentChange(idx, e.target.files ? e.target.files[0] : null)}
                       className="w-full text-xs text-slate-500"
                     />
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </section>

        {/* Parent Login */}
        <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
           <h3 className="text-lg font-semibold text-blue-800 mb-4">Parent Login Credentials</h3>
           <p className="text-xs text-blue-600 mb-4">These credentials will be auto-generated if left blank. Admins can view these in the Student List.</p>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Login ID (Username)</label>
                <input 
                  type="text" 
                  name="parentLoginId" 
                  value={formData.parentLoginId}
                  onChange={handleChange}
                  placeholder="Auto-generates from Mobile"
                  className="w-full border border-blue-300 rounded p-2 bg-white" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-1">Password</label>
                <input 
                  type="text" 
                  name="parentLoginPassword"
                  value={formData.parentLoginPassword}
                  placeholder="Leave empty to auto-generate"
                  onChange={handleChange}
                  className="w-full border border-blue-300 rounded p-2 bg-white" 
                />
              </div>
           </div>
        </section>

      </form>
    </div>
  );
};

export default AdmissionForm;
