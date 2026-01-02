
export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const CO_SCHOLASTIC_AREAS = ['General', 'Affective Traits', 'Psychomotor Skills'];

export const GRADE_ORDER = ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export const INITIAL_MASTER_DATA = {
  classes: ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  sections: ['A', 'B', 'C'],
  categories: ['General', 'OBC', 'SC', 'ST'],
  houses: ['Red', 'Blue', 'Green', 'Yellow'],
  religions: ['Hinduism', 'Islam', 'Christianity', 'Sikhism', 'Buddhism', 'Other'],
  subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science'],
  examTerms: ['Term 1', 'Term 2'],
  termExams: {} as Record<string, any[]>,
  termCoScholasticAreas: {} as Record<string, string[]>,
  classSubjects: {} as Record<string, any[]>,
  classSections: {} as Record<string, string[]>,
  coScholasticSubjects: {} as Record<string, string[]>,
  classCoScholasticAreas: {} as Record<string, string[]>,
  examSchedules: [] as any[]
};

export const DEFAULT_SETTINGS = {
  idType: 'Pattern' as const,
  idPrefix: 'ES',
  idSeparator: '/',
  idStartNumber: 1001,
  idPadding: 4,
  idPattern: '[PREFIX]/[YEAR]/[SERIAL]',
  includeClassInId: false,
  includeDateInId: false
};

export const INITIAL_SCHOOL_PROFILE = {
  name: 'Easy School',
  code: 'ES-2025',
  address: '123 Education Lane, Learning City',
  email: 'admin@easyschool.com',
  phone1: '+1 234 567 890',
  phone2: '',
  sessionStartMonth: 'April',
  dateFormat: 'dd-mm-yyyy',
  currency: 'INR',
  logoUrl: '',
  boardLogoUrl: '' 
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DEFAULT_SESSIONS = [
  { id: '1', name: '2025-2026', isCurrent: true },
  { id: '2', name: '2026-2027', isCurrent: false }
];

export const INITIAL_STUDENT_FORM = {
  admissionDate: new Date().toISOString().split('T')[0],
  admissionSessionId: '',
  rollNo: '',
  class: '',
  section: '',
  category: 'General',
  house: '',
  subjects: [],
  firstName: '',
  middleName: '',
  lastName: '',
  gender: 'Male',
  dob: '',
  religion: 'Hinduism',
  bloodGroup: 'O+',
  mobile: '',
  email: '',
  currentAddress: '',
  permanentAddress: '',
  nationalId: '',
  rte: 'No',
  father: { name: '', phone: '', occupation: '' },
  mother: { name: '', phone: '', occupation: '' },
  guardianType: 'Father',
  documents: [],
};

export const DEMO_STUDENTS = [
  {
    id: 'ES/2025/1001',
    admissionNumber: 'ES/2025/1001',
    admissionDate: '2025-04-10',
    admissionSessionId: '1',
    rollNo: '01',
    class: '10',
    section: 'A',
    category: 'General',
    firstName: 'Arjun',
    lastName: 'Sharma',
    gender: 'Male',
    dob: '2010-05-15',
    religion: 'Hinduism',
    bloodGroup: 'B+',
    mobile: '9876543210',
    currentAddress: 'New Delhi, India',
    permanentAddress: 'New Delhi, India',
    rte: 'No',
    father: { name: 'Rajesh Sharma', phone: '9876543211', occupation: 'Engineer' },
    mother: { name: 'Suman Sharma', phone: '9876543212', occupation: 'Teacher' },
    guardianType: 'Father',
    parentLoginId: '9876543210',
    documents: []
  },
  {
    id: 'ES/2025/1002',
    admissionNumber: 'ES/2025/1002',
    admissionDate: '2025-04-12',
    admissionSessionId: '1',
    rollNo: '02',
    class: '9',
    section: 'B',
    category: 'OBC',
    firstName: 'Priya',
    lastName: 'Patel',
    gender: 'Female',
    dob: '2011-08-22',
    religion: 'Hinduism',
    bloodGroup: 'A+',
    mobile: '9123456789',
    currentAddress: 'Ahmedabad, India',
    permanentAddress: 'Ahmedabad, India',
    rte: 'Yes',
    father: { name: 'Vikram Patel', phone: '9123456780', occupation: 'Business' },
    mother: { name: 'Meena Patel', phone: '9123456781', occupation: 'Homemaker' },
    guardianType: 'Father',
    parentLoginId: '9123456789',
    documents: []
  }
];
