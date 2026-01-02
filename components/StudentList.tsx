
import React, { useState, useRef, useEffect } from 'react';
import { Student, MasterData } from '../types';
import { Search, Edit, Trash2, Key, BookOpen, ChevronDown, Filter, X, Check } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  masterData: MasterData;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, masterData, onEdit, onDelete }) => {
  const [search, setSearch] = useState('');
  const [showCredentials, setShowCredentials] = useState<{[key: string]: boolean}>({});
  
  // Multi-select Class Filter
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  
  // Multi-select Section Filter (Progressive)
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);

  const classRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classRef.current && !classRef.current.contains(event.target as Node)) {
        setIsClassDropdownOpen(false);
      }
      if (sectionRef.current && !sectionRef.current.contains(event.target as Node)) {
        setIsSectionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCredentials = (id: string) => {
    setShowCredentials(prev => ({...prev, [id]: !prev[id]}));
  };

  const handleClassToggle = (className: string) => {
    setSelectedClasses(prev => 
      prev.includes(className) ? prev.filter(c => c !== className) : [...prev, className]
    );
  };

  const handleSectionToggle = (sectionName: string) => {
    setSelectedSections(prev => 
      prev.includes(sectionName) ? prev.filter(s => s !== sectionName) : [...prev, sectionName]
    );
  };

  const selectAllClasses = () => setSelectedClasses([...masterData.classes]);
  const unselectAllClasses = () => {
    setSelectedClasses([]);
    setSelectedSections([]); // Clear sections too
  };

  // Sections logic: Get unique sections belonging to the selected classes
  const getAvailableSections = () => {
    if (selectedClasses.length === 0) return [];
    const sectionsSet = new Set<string>();
    selectedClasses.forEach(cls => {
      const classSecs = masterData.classSections[cls] || [];
      classSecs.forEach(s => sectionsSet.add(s));
    });
    return Array.from(sectionsSet).sort();
  };

  const availableSections = getAvailableSections();
  const hasSectionsForSelectedClasses = availableSections.length > 0;

  const selectAllSections = () => setSelectedSections([...availableSections]);
  const unselectAllSections = () => setSelectedSections([]);

  const filteredStudents = students.filter(s => {
    const term = search.toLowerCase();
    
    // Text search filter
    const matchesText = (
      s.firstName.toLowerCase().includes(term) ||
      s.lastName.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      s.rollNo.toLowerCase().includes(term) ||
      s.class.toLowerCase().includes(term)
    );

    // Class filter
    const matchesClass = selectedClasses.length === 0 || selectedClasses.includes(s.class);

    // Section filter - If class has no section, the student's section might be empty string.
    // Logic: if any sections are selected, student must match one. If none selected, all match.
    const matchesSection = selectedSections.length === 0 || selectedSections.includes(s.section);

    return matchesText && matchesClass && matchesSection;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
         <h2 className="text-xl font-bold text-slate-800">Search Student</h2>
         
         <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
           {/* Class Multi-select Dropdown with Select All / Unselect All */}
           <div className="relative" ref={classRef}>
             <button 
               type="button"
               onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
               className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium transition-all ${selectedClasses.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-slate-300 text-slate-600 hover:border-blue-400'}`}
             >
               <Filter size={16} />
               {selectedClasses.length === 0 ? 'Select Class(es)' : `${selectedClasses.length} Class(es)`}
               <ChevronDown size={14} className={`transition-transform ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
             </button>

             {isClassDropdownOpen && (
               <div className="absolute top-full left-0 mt-2 w-56 bg-white border rounded-xl shadow-xl z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                 <div className="p-2 border-b flex justify-between gap-2">
                   <button onClick={selectAllClasses} className="text-[10px] font-bold text-blue-600 uppercase hover:underline">Select All</button>
                   <button onClick={unselectAllClasses} className="text-[10px] font-bold text-slate-400 uppercase hover:underline">Unselect All</button>
                 </div>
                 <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin">
                   {masterData.classes.map(cls => (
                     <label key={cls} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer transition">
                       <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedClasses.includes(cls) ? 'bg-blue-600 border-blue-600' : 'bg-white border-slate-300'}`}>
                         {selectedClasses.includes(cls) && <Check size={12} className="text-white" />}
                         <input 
                           type="checkbox" 
                           className="hidden" 
                           checked={selectedClasses.includes(cls)}
                           onChange={() => handleClassToggle(cls)}
                         />
                       </div>
                       <span className="text-sm text-slate-700">{cls}</span>
                     </label>
                   ))}
                 </div>
               </div>
             )}
           </div>

           {/* Section Multi-select Dropdown (Progressive Disclosure) */}
           {hasSectionsForSelectedClasses && (
             <div className="relative animate-in zoom-in duration-200" ref={sectionRef}>
               <button 
                 type="button"
                 onClick={() => setIsSectionDropdownOpen(!isSectionDropdownOpen)}
                 className={`flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-medium transition-all ${selectedSections.length > 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-slate-300 text-slate-600 hover:border-green-400'}`}
               >
                 <Filter size={16} />
                 {selectedSections.length === 0 ? 'Select Section(s)' : `${selectedSections.length} Section(s)`}
                 <ChevronDown size={14} className={`transition-transform ${isSectionDropdownOpen ? 'rotate-180' : ''}`} />
               </button>

               {isSectionDropdownOpen && (
                 <div className="absolute top-full left-0 mt-2 w-56 bg-white border rounded-xl shadow-xl z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                   <div className="p-2 border-b flex justify-between gap-2">
                     <button onClick={selectAllSections} className="text-[10px] font-bold text-green-600 uppercase hover:underline">Select All</button>
                     <button onClick={unselectAllSections} className="text-[10px] font-bold text-slate-400 uppercase hover:underline">Unselect All</button>
                   </div>
                   <div className="max-h-60 overflow-y-auto p-1 scrollbar-thin">
                     {availableSections.map(sec => (
                       <label key={sec} className="flex items-center gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer transition">
                         <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedSections.includes(sec) ? 'bg-green-600 border-green-600' : 'bg-white border-slate-300'}`}>
                           {selectedSections.includes(sec) && <Check size={12} className="text-white" />}
                           <input 
                             type="checkbox" 
                             className="hidden" 
                             checked={selectedSections.includes(sec)}
                             onChange={() => handleSectionToggle(sec)}
                           />
                         </div>
                         <span className="text-sm text-slate-700">Section {sec}</span>
                       </label>
                     ))}
                   </div>
                 </div>
               )}
             </div>
           )}

           {/* Text Search */}
           <div className="relative flex-1 lg:flex-none">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <input 
               type="text" 
               placeholder="Search by Name, ID, Roll No..." 
               value={search}
               onChange={e => setSearch(e.target.value)}
               className="pl-10 pr-4 py-2 border rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full lg:w-72 shadow-sm"
             />
           </div>

           {/* Clear All Filters */}
           {(selectedClasses.length > 0 || selectedSections.length > 0 || search) && (
             <button 
               onClick={() => {
                 setSearch('');
                 unselectAllClasses();
               }}
               className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1"
             >
               <X size={14} /> Clear All
             </button>
           )}
         </div>
       </div>

       {filteredStudents.length === 0 ? (
         <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed">
           <Search size={48} className="mx-auto mb-4 opacity-10" />
           <p className="text-lg font-medium">No students found.</p>
           <p className="text-sm mt-1">Try adjusting your search filters or add a new admission.</p>
         </div>
       ) : (
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider border-b">
                 <th className="p-4 font-bold">ID</th>
                 <th className="p-4 font-bold">Name</th>
                 <th className="p-4 font-bold">Class/Sec</th>
                 <th className="p-4 font-bold">Roll No</th>
                 <th className="p-4 font-bold">Subjects</th>
                 <th className="p-4 font-bold">Parent Info</th>
                 <th className="p-4 font-bold text-center">Login</th>
                 <th className="p-4 font-bold text-right">Action</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
               {filteredStudents.map(student => (
                 <tr key={student.id} className="hover:bg-blue-50/30 transition text-sm group">
                   <td className="p-4 font-mono text-xs text-slate-500">{student.id}</td>
                   <td className="p-4 font-medium text-slate-800">
                     <div className="flex items-center gap-3">
                       {student.photoUrl ? (
                          <img src={student.photoUrl} alt="S" className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm" />
                       ) : (
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                            {student.firstName[0]}
                          </div>
                       )}
                       <div>
                         <div className="font-bold">{student.firstName} {student.lastName}</div>
                         <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{student.gender}</div>
                       </div>
                     </div>
                   </td>
                   <td className="p-4">
                     <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                       {student.class} - {student.section}
                     </span>
                   </td>
                   <td className="p-4 font-bold text-slate-600">{student.rollNo}</td>
                   <td className="p-4">
                     {student.subjects && student.subjects.length > 0 ? (
                       <div className="group relative inline-block">
                         <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-help border border-blue-100">
                           <BookOpen size={10} /> {student.subjects.length} Subjects
                         </span>
                         <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-[11px] p-3 rounded-xl z-20 shadow-xl animate-in fade-in zoom-in duration-150">
                           <ul className="space-y-1">
                             {student.subjects.slice(0, 8).map(s => <li key={s} className="flex items-center gap-1.5"><Check size={10} className="text-green-400" /> {s}</li>)}
                             {student.subjects.length > 8 && <li className="text-slate-400 pt-1 border-t border-slate-700">+{student.subjects.length - 8} more...</li>}
                           </ul>
                         </div>
                       </div>
                     ) : (
                       <span className="text-slate-300 text-xs italic">N/A</span>
                     )}
                   </td>
                   <td className="p-4">
                     <div className="text-[11px] leading-tight">
                       {student.guardianType === 'Father' && (
                         <>
                           <div className="font-bold text-slate-700">{student.father.name}</div>
                           <div className="text-slate-500">{student.father.phone}</div>
                         </>
                       )}
                       {student.guardianType === 'Mother' && (
                         <>
                           <div className="font-bold text-slate-700">{student.mother.name}</div>
                           <div className="text-slate-500">{student.mother.phone}</div>
                         </>
                       )}
                       {student.guardianType === 'Other' && (
                         <>
                           <div className="font-bold text-slate-700">{student.otherGuardian?.name} <span className="text-[9px] bg-slate-200 px-1 rounded">({student.otherGuardian?.relation})</span></div>
                           <div className="text-slate-500">{student.otherGuardian?.phone}</div>
                         </>
                       )}
                     </div>
                   </td>
                   <td className="p-4 text-center">
                      <div className="flex items-center justify-center relative">
                         <button onClick={() => toggleCredentials(student.id)} className="text-slate-400 hover:text-blue-600 transition" title="View Credentials">
                           <Key size={18} />
                         </button>
                         {showCredentials[student.id] && (
                           <div className="text-[10px] bg-slate-800 text-white p-3 rounded-xl border border-slate-700 absolute right-full mr-2 z-40 shadow-2xl animate-in fade-in slide-in-from-right-2 duration-200 min-w-[120px]">
                             <div className="mb-1"><span className="text-slate-400 font-bold uppercase tracking-tighter">Login ID:</span> <div className="font-mono text-blue-400">{student.parentLoginId}</div></div>
                             <div><span className="text-slate-400 font-bold uppercase tracking-tighter">Password:</span> <div className="font-mono text-blue-400">{student.parentLoginPassword}</div></div>
                             <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-slate-800 rotate-45 border-t border-r border-slate-700"></div>
                           </div>
                         )}
                      </div>
                   </td>
                   <td className="p-4 text-right">
                     <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => onEdit(student)}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" 
                          title="Edit Student"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => onDelete(student.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" 
                          title="Delete Student"
                        >
                          <Trash2 size={18} />
                        </button>
                     </div>
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
         </div>
       )}
    </div>
  );
};

export default StudentList;
