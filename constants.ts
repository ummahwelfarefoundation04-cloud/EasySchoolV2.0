







export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const CO_SCHOLASTIC_AREAS = ['General', 'Affective Traits', 'Psychomotor Skills'];

export const INITIAL_MASTER_DATA = {
  classes: ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
  sections: ['A', 'B', 'C', 'D'],
  categories: ['General', 'OBC', 'SC', 'ST', 'EWS'],
  houses: ['Red House', 'Blue House', 'Green House', 'Yellow House'],
  religions: ['Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Judaism', 'Sikhism', 'Other'],
  subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies', 'Computer Science', 'Art', 'Music', 'Physics', 'Chemistry', 'Biology', 'Physical Education', 'Environmental Studies'],
  examTerms: ['Term 1', 'Term 2'],
  termExams: {
    'Term 1': [
      { name: 'Unit Test 1', maxMarks: 20, subjects: ['Mathematics', 'Science', 'English'] },
      { name: 'Subject Enrichment', maxMarks: 5, subjects: ['Mathematics', 'Science'] },
      { name: 'Half Yearly Exam', maxMarks: 80, subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'] }
    ],
    'Term 2': [
      { name: 'Unit Test 2', maxMarks: 20, subjects: ['Mathematics', 'Science', 'English'] },
      { name: 'Annual Exam', maxMarks: 80, subjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'] }
    ]
  } as Record<string, any[]>,
  termCoScholasticAreas: {
    'Term 1': ['General', 'Affective Traits'],
    'Term 2': ['General', 'Affective Traits', 'Psychomotor Skills']
  } as Record<string, string[]>,
  classSubjects: {
    '10': [
      { name: 'Mathematics', type: 'Mandatory' },
      { name: 'English', type: 'Mandatory' },
      { name: 'Science', type: 'Mandatory' },
      { name: 'Social Studies', type: 'Mandatory' },
      { name: 'Hindi', type: 'Optional' },
      { name: 'Computer Science', type: 'Optional' }
    ],
    '5': [
       { name: 'Mathematics', type: 'Mandatory' },
       { name: 'English', type: 'Mandatory' },
       { name: 'Hindi', type: 'Mandatory' },
       { name: 'Environmental Studies', type: 'Mandatory' },
       { name: 'Computer Science', type: 'Optional' },
       { name: 'Art', type: 'Optional' }
    ]
  } as Record<string, any[]>,
  coScholasticSubjects: {
    'General': ['Work Education', 'Art Education', 'Health & Physical Education'],
    'Affective Traits': ['Discipline', 'Cleanliness', 'Respect', 'Punctuality'],
    'Psychomotor Skills': ['Yoga', 'Sports', 'Gardening', 'NCC']
  } as Record<string, string[]>,
  classCoScholasticAreas: {
    '10': ['General', 'Affective Traits'],
    '5': ['General', 'Psychomotor Skills']
  } as Record<string, string[]>,
  examSchedules: [] as any[] // Initialized as empty array
};

export const DEFAULT_SETTINGS = {
  idPrefix: 'google_studio_3',
  idSeparator: '-',
  idStartNumber: 104, // Started from 104 as 101-103 are demo
  idPadding: 3,
};

export const INITIAL_SCHOOL_PROFILE = {
  name: 'Easy School',
  code: 'ES001',
  address: '123 Education Lane, Knowledge City',
  email: 'admin@easyschool.com',
  phone1: '',
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

export const DATE_FORMATS = ['dd-mm-yyyy', 'mm-dd-yyyy', 'yyyy-mm-dd'];

export const DEFAULT_SESSIONS = [
  { id: '1', name: '2024-2025', isCurrent: false },
  { id: '2', name: '2025-2026', isCurrent: true },
  { id: '3', name: '2026-2027', isCurrent: false },
];

export const INITIAL_STUDENT_FORM = {
  admissionDate: new Date().toISOString().split('T')[0],
  admissionSessionId: '',
  rollNo: '',
  class: '',
  section: '',
  category: '',
  house: '',
  subjects: [],
  firstName: '',
  middleName: '',
  lastName: '',
  gender: 'Male',
  dob: '',
  religion: '',
  caste: '',
  bloodGroup: '',
  mobile: '',
  whatsapp: '',
  email: '',
  currentAddress: '',
  permanentAddress: '',
  nationalId: '',
  localId: '',
  rte: 'No',
  father: { name: '', phone: '', occupation: '', photoUrl: '' },
  mother: { name: '', phone: '', occupation: '', photoUrl: '' },
  guardianType: 'Father',
  otherGuardian: { name: '', phone: '', occupation: '', photoUrl: '', relation: '' },
  parentLoginId: '',
  parentLoginPassword: '',
  documents: [
    { title: 'Transfer Certificate' },
    { title: 'Birth Certificate' },
    { title: 'Aadhar Card' },
    { title: 'Photo' },
  ],
};

export const DEMO_STUDENTS = [
  {
    id: 'google_studio_3-101',
    admissionNumber: 'google_studio_3-101',
    admissionDate: '2025-04-01',
    admissionSessionId: '2',
    rollNo: '01',
    class: '10',
    section: 'A',
    category: 'General',
    house: 'Red House',
    subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
    firstName: 'Aarav',
    middleName: '',
    lastName: 'Patel',
    gender: 'Male',
    dob: '2009-08-15',
    religion: 'Hinduism',
    caste: '',
    bloodGroup: 'O+',
    mobile: '9876543210',
    whatsapp: '9876543210',
    email: 'aarav.p@example.com',
    currentAddress: '42, Sunset Boulevard, West Zone',
    permanentAddress: '42, Sunset Boulevard, West Zone',
    nationalId: '1234-5678-9012',
    localId: '',
    rte: 'No',
    father: {
      name: 'Vikram Patel',
      phone: '9876543210',
      occupation: 'Business',
      photoUrl: ''
    },
    mother: {
      name: 'Anjali Patel',
      phone: '9876543211',
      occupation: 'Teacher',
      photoUrl: ''
    },
    guardianType: 'Father',
    otherGuardian: { name: '', phone: '', occupation: '', photoUrl: '', relation: '' },
    parentLoginId: '9876543210',
    parentLoginPassword: 'password123',
    documents: [],
    marks: {
      'Term 1': {
        'Unit Test 1': {
          'Mathematics': '18',
          'Science': '19',
          'English': '17'
        }
      }
    }
  },
  {
    id: 'google_studio_3-102',
    admissionNumber: 'google_studio_3-102',
    admissionDate: '2025-04-02',
    admissionSessionId: '2',
    rollNo: '02',
    class: '10',
    section: 'A',
    category: 'OBC',
    house: 'Blue House',
    subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science'],
    firstName: 'Isha',
    middleName: '',
    lastName: 'Sharma',
    gender: 'Female',
    dob: '2009-11-20',
    religion: 'Hinduism',
    caste: 'Brahmin',
    bloodGroup: 'B+',
    mobile: '9876543212',
    whatsapp: '',
    email: 'isha.s@example.com',
    currentAddress: '15, Green Park, North Zone',
    permanentAddress: 'Village Ratpur, Dist. XYZ',
    nationalId: '',
    localId: '',
    rte: 'No',
    father: {
      name: 'Suresh Sharma',
      phone: '9876543212',
      occupation: 'Service',
      photoUrl: ''
    },
    mother: {
      name: 'Meena Sharma',
      phone: '9876543213',
      occupation: 'Homemaker',
      photoUrl: ''
    },
    guardianType: 'Father',
    otherGuardian: { name: '', phone: '', occupation: '', photoUrl: '', relation: '' },
    parentLoginId: '9876543212',
    parentLoginPassword: 'securepass',
    documents: [],
    marks: {
        'Term 1': {
            'Unit Test 1': {
              'Mathematics': '15',
              'Science': '20',
              'English': '18'
            }
        }
    }
  },
  {
    id: 'google_studio_3-103',
    admissionNumber: 'google_studio_3-103',
    admissionDate: '2025-04-05',
    admissionSessionId: '2',
    rollNo: '01',
    class: '5',
    section: 'B',
    category: 'General',
    house: 'Green House',
    subjects: ['Mathematics', 'English', 'Hindi', 'Environmental Studies'],
    firstName: 'Rohan',
    middleName: '',
    lastName: 'Verma',
    gender: 'Male',
    dob: '2014-03-10',
    religion: 'Hinduism',
    caste: '',
    bloodGroup: 'A+',
    mobile: '9876543214',
    whatsapp: '',
    email: '',
    currentAddress: 'Flat 303, Sky Towers',
    permanentAddress: 'Flat 303, Sky Towers',
    nationalId: '',
    localId: '',
    rte: 'No',
    father: {
      name: 'Amit Verma',
      phone: '9876543214',
      occupation: 'Architect',
      photoUrl: ''
    },
    mother: {
      name: 'Sunita Verma',
      phone: '9876543215',
      occupation: 'Artist',
      photoUrl: ''
    },
    guardianType: 'Mother',
    otherGuardian: { name: '', phone: '', occupation: '', photoUrl: '', relation: '' },
    parentLoginId: '9876543214',
    parentLoginPassword: 'rohanpass',
    documents: [],
    marks: {}
  }
];