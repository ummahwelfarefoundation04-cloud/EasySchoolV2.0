import React, { useState } from 'react';
import { Student } from '../types';
import { Search, Edit, Trash2, Key, BookOpen } from 'lucide-react';

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: string) => void;
}

const StudentList: React.FC<StudentListProps> = ({ students, onEdit, onDelete }) => {
  const [search, setSearch] = useState('');
  const [showCredentials, setShowCredentials] = useState<{[key: string]: boolean}>({});

  const toggleCredentials = (id: string) => {
    setShowCredentials(prev => ({...prev, [id]: !prev[id]}));
  };

  const filteredStudents = students.filter(s => {
    const term = search.toLowerCase();
    return (
      s.firstName.toLowerCase().includes(term) ||
      s.lastName.toLowerCase().includes(term) ||
      s.id.toLowerCase().includes(term) ||
      s.rollNo.toLowerCase().includes(term) ||
      s.class.toLowerCase().includes(term)
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
       <div className="flex justify-between items-center mb-6">
         <h2 className="text-xl font-bold text-slate-800">Search Student</h2>
         <div className="relative">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
           <input 
             type="text" 
             placeholder="Search by Name, ID, Class, Roll No..." 
             value={search}
             onChange={e => setSearch(e.target.value)}
             className="pl-10 pr-4 py-2 border rounded-full text-sm focus:ring-2 focus:ring-blue-500 outline-none w-72"
           />
         </div>
       </div>

       {filteredStudents.length === 0 ? (
         <div className="text-center py-10 text-slate-400">
           {search ? 'No students found matching your search.' : 'No students found. Add a new admission to see records here.'}
         </div>
       ) : (
         <div className="overflow-x-auto">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-slate-50 text-slate-600 text-sm border-b">
                 <th className="p-3 font-semibold">ID</th>
                 <th className="p-3 font-semibold">Name</th>
                 <th className="p-3 font-semibold">Class/Sec</th>
                 <th className="p-3 font-semibold">Roll No</th>
                 <th className="p-3 font-semibold">Subjects</th>
                 <th className="p-3 font-semibold">Parent Info</th>
                 <th className="p-3 font-semibold">Parent Login</th>
                 <th className="p-3 font-semibold">Action</th>
               </tr>
             </thead>
             <tbody>
               {filteredStudents.map(student => (
                 <tr key={student.id} className="border-b hover:bg-slate-50 transition text-sm">
                   <td className="p-3 font-mono text-slate-500">{student.id}</td>
                   <td className="p-3 font-medium text-slate-800">
                     <div className="flex items-center gap-2">
                       {student.photoUrl ? (
                          <img src={student.photoUrl} alt="S" className="w-8 h-8 rounded-full object-cover" />
                       ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                            {student.firstName[0]}
                          </div>
                       )}
                       <div>
                         {student.firstName} {student.lastName}
                       </div>
                     </div>
                   </td>
                   <td className="p-3">{student.class} - {student.section}</td>
                   <td className="p-3">{student.rollNo}</td>
                   <td className="p-3">
                     {student.subjects && student.subjects.length > 0 ? (
                       <div className="group relative">
                         <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs cursor-help">
                           <BookOpen size={12} /> {student.subjects.length} Subjects
                         </span>
                         {/* Tooltip */}
                         <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-48 bg-slate-800 text-white text-xs p-2 rounded z-20 shadow-lg">
                           <ul className="list-disc pl-3">
                             {student.subjects.slice(0, 8).map(s => <li key={s}>{s}</li>)}
                             {student.subjects.length > 8 && <li>+{student.subjects.length - 8} more...</li>}
                           </ul>
                         </div>
                       </div>
                     ) : (
                       <span className="text-slate-400 text-xs">-</span>
                     )}
                   </td>
                   <td className="p-3">
                     <div className="text-xs">
                       {student.guardianType === 'Father' && (
                         <>
                           <span className="font-semibold text-slate-700">Father: {student.father.name}</span><br/>
                           <span className="text-slate-500">{student.father.phone}</span>
                         </>
                       )}
                       {student.guardianType === 'Mother' && (
                         <>
                           <span className="font-semibold text-slate-700">Mother: {student.mother.name}</span><br/>
                           <span className="text-slate-500">{student.mother.phone}</span>
                         </>
                       )}
                       {student.guardianType === 'Other' && (
                         <>
                           <span className="font-semibold text-slate-700">{student.otherGuardian?.relation || 'Guardian'}: {student.otherGuardian?.name}</span><br/>
                           <span className="text-slate-500">{student.otherGuardian?.phone}</span>
                         </>
                       )}
                     </div>
                   </td>
                   <td className="p-3">
                      <div className="flex items-center gap-2">
                         <button onClick={() => toggleCredentials(student.id)} className="text-slate-500 hover:text-blue-600" title="View Credentials">
                           <Key size={16} />
                         </button>
                         {showCredentials[student.id] && (
                           <div className="text-xs bg-slate-100 p-2 rounded border absolute right-0 z-10 shadow-lg mt-8 w-40">
                             <div><span className="font-semibold">ID:</span> {student.parentLoginId}</div>
                             <div><span className="font-semibold">Pass:</span> {student.parentLoginPassword}</div>
                           </div>
                         )}
                      </div>
                   </td>
                   <td className="p-3 flex gap-2">
                     <button 
                       onClick={() => onEdit(student)}
                       className="p-1.5 text-blue-600 hover:bg-blue-100 rounded" 
                       title="Edit"
                     >
                       <Edit size={16} />
                     </button>
                      <button 
                        onClick={() => onDelete(student.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 rounded" 
                        title="Delete"
                      >
                       <Trash2 size={16} />
                     </button>
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