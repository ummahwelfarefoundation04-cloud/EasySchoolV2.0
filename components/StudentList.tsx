
import React, { useState, useRef, useEffect } from 'react';
import { Student, MasterData } from '../types';
import { Search, Edit, Key, BookOpen, ChevronDown, Filter, X, Check } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  masterData: MasterData;
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, masterData, onEdit, onDelete }) => {
  const [search, setSearch] = useState('');
  const [showCredentials, setShowCredentials] = useState<{[key: string]: boolean}>({});
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);

  const classRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (classRef.current && !classRef.current.contains(event.target as Node)) setIsClassDropdownOpen(false);
      if (sectionRef.current && !sectionRef.current.contains(event.target as Node)) setIsSectionDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCredentials = (id: string) => {
    setShowCredentials(prev => ({...prev, [id]: !prev[id]}));
  };

  const filteredStudents = students.filter(s => {
    const term = search.toLowerCase();
    const matchesText = (s.firstName.toLowerCase().includes(term) || s.lastName.toLowerCase().includes(term) || s.id.toLowerCase().includes(term));
    const matchesClass = selectedClasses.length === 0 || selectedClasses.includes(s.class);
    const matchesSection = selectedSections.length === 0 || selectedSections.includes(s.section);
    return matchesText && matchesClass && matchesSection;
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
       <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
         <h2 className="text-xl font-bold text-slate-800">Student Directory</h2>
         <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 lg:flex-none">
             <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
             <input type="text" placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 pr-4 py-2 border rounded-full text-sm outline-none w-full lg:w-72 shadow-sm" />
           </div>
         </div>
       </div>

       {filteredStudents.length === 0 ? (
         <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed">
           <Search size={48} className="mx-auto mb-4 opacity-10" />
           <p className="text-lg font-medium">No students found.</p>
         </div>
       ) : (
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider border-b">
                 <th className="p-4 font-bold">ID</th>
                 <th className="p-4 font-bold">Name</th>
                 <th className="p-4 font-bold">Class/Sec</th>
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
                       <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold border-2 border-white shadow-sm">
                         {student.firstName[0]}
                       </div>
                       <div>{student.firstName} {student.lastName}</div>
                     </div>
                   </td>
                   <td className="p-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">{student.class} - {student.section}</span></td>
                   <td className="p-4 text-center">
                      <button onClick={() => toggleCredentials(student.id)} className="text-slate-400 hover:text-blue-600 transition" title="View Credentials"><Key size={18} /></button>
                   </td>
                   <td className="p-4 text-right">
                     <div className="flex justify-end gap-2">
                        <button onClick={() => onEdit(student)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"><Edit size={18} /></button>
                        <button onClick={() => onDelete(student.id)} className="text-white bg-red-600 px-3 py-1.5 rounded text-[10px] font-bold uppercase hover:bg-red-700 transition-all shadow-sm">Delete</button>
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
