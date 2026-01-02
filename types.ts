
export interface Session {
  id: string;
  name: string; // e.g., "2025-2026"
  isCurrent: boolean;
}

export interface Settings {
  idType: 'Numeric' | 'Pattern';
  idPrefix: string; // e.g., "ES"
  idSeparator: string; // e.g., "-", "/"
  idStartNumber: number; // e.g., 101
  idPadding: number; // e.g., 3 (for 001)
  idPattern: string; // e.g., "[PREFIX]/[YEAR]/[SERIAL]"
  includeClassInId: boolean;
  includeDateInId: boolean;
}

export interface SchoolProfile {
  name: string;
  code: string;
  address: string;
  email: string;
  phone1: string;
  phone2: string;
  sessionStartMonth: string;
  dateFormat: string;
  currency: string;
  logoUrl?: string;
  boardLogoUrl?: string;
}

export type SubjectType = 'Mandatory' | 'Optional';

export interface ClassSubject {
  name: string;
  type: SubjectType;
}

export type CoScholasticArea = string;

export interface ExamDefinition {
  name: string;
  maxMarks: number;
  subjects: string[]; // List of subject names included in this exam
}

export interface ExamScheduleItem {
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface ClassExamSchedule {
  id: string;
  className: string;
  term: string;
  examName: string;
  schedule: ExamScheduleItem[];
}

export interface MasterData {
  classes: string[];
  sections: string[]; // Global pool of sections (A, B, C...)
  categories: string[];
  houses: string[];
  religions: string[];
  subjects: string[]; // Global list of scholastic subject names
  examTerms: string[]; // List of Exam Terms (e.g. Mid-Term, Annual)
  termExams: Record<string, ExamDefinition[]>; // Mapping: Term Name -> List of Exams with Marks & Subjects
  termCoScholasticAreas: Record<string, string[]>; // Mapping: Term Name -> List of Co-Scholastic Areas
  classSubjects: Record<string, ClassSubject[]>; // Mapping: Class Name -> List of Subjects
  classSections: Record<string, string[]>; // New Mapping: Class Name -> List of Section Names
  coScholasticSubjects: Record<string, string[]>; // Mapping: Area Name -> List of Subjects
  classCoScholasticAreas: Record<string, string[]>; // Mapping: Class Name -> List of Assigned Areas
  examSchedules: ClassExamSchedule[]; // List of created exam schedules
}

export enum Gender {
  Male = 'Male',
  Female = 'Female',
}

export enum GuardianType {
  Father = 'Father',
  Mother = 'Mother',
  Other = 'Other',
}

export interface ParentDetails {
  name: string;
  phone: string;
  occupation: string;
  photoUrl?: string; // Data URL for preview
  relation?: string; // Specific for 'Other' guardian
}

export interface Document {
  title: string;
  file?: File;
  fileName?: string;
}

export interface Student {
  // System Fields
  id: string; // The generated Unique ID
  admissionNumber: string; // Internal tracking if needed, otherwise same as ID
  admissionDate: string;
  admissionSessionId: string;
  
  // Academic
  rollNo: string;
  class: string;
  section: string;
  category: string;
  house?: string;
  subjects: string[]; // List of selected subject names

  // Personal
  firstName: string;
  middleName?: string;
  lastName: string;
  gender: Gender;
  dob: string;
  religion: string;
  caste?: string;
  bloodGroup: string;
  photoUrl?: string; // Data URL

  // Contact
  mobile: string;
  whatsapp?: string;
  email?: string;

  // Address
  currentAddress: string;
  permanentAddress: string;

  // Identification
  nationalId?: string;
  localId?: string;
  rte: 'Yes' | 'No';

  // Family
  father: ParentDetails;
  mother: ParentDetails;
  guardianType: GuardianType;
  otherGuardian?: ParentDetails; // Only if guardianType is Other

  // Previous School
  previousSchoolName?: string;
  previousSchoolRecord?: string;

  // System Access
  parentLoginId: string;
  parentLoginPassword?: string; // stored plainly for demo, usually hashed

  // Extras
  note?: string;
  documents: Document[];

  // Academics & Marks
  // Structure: marks[termName][examName][subjectName] = "score" (string to allow flexibility)
  marks?: Record<string, Record<string, Record<string, string>>>;
}

// Form Data Interface (Matches Student mostly, but allows partials during editing)
export type StudentFormData = Omit<Student, 'id' | 'documents'> & {
  id?: string;
  documents: Document[];
};
