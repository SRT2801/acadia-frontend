export interface Post {
  id: number;
  courseCode: string;
  courseName: string;
  author: string;
  handle: string;
  isVerified: boolean;
  timeAgo: string;
  content: string;
  attachments: { name: string; size: string; type: string }[];
  likes: number;
  comments: number;
  edits: number;
  views: string;
}

export interface Course {
  code: string;
  name: string;
  status: string;
}

export interface Message {
  author: string;
  time: string;
  preview: string;
}

export interface NetworkUser {
  name: string;
  role: string;
}

export interface CalendarEvent {
  date: string;
  title: string;
  subtitle: string;
}

export const MOCK_POSTS: Post[] = [
  {
    id: 1,
    courseCode: 'PHYS-402',
    courseName: 'Advanced Physics III',
    author: 'Dr. Elena Vance',
    handle: '@evance',
    isVerified: true,
    timeAgo: '2h',
    content:
      'Essential reading for the Quantum Entanglement lecture. Please review these notes before the seminar on Thursday. We\'ll be addressing the EPR paradox in-depth.',
    attachments: [
      { name: 'Quantum_Entanglement_Suppl.pdf', size: '4.2 MB', type: 'pdf' },
    ],
    likes: 156,
    comments: 24,
    edits: 8,
    views: '12k',
  },
  {
    id: 2,
    courseCode: 'CS-308',
    courseName: 'Computational Theory',
    author: 'CS Lab News',
    handle: '@CSDept',
    isVerified: false,
    timeAgo: '5h',
    content:
      'The new high-performance computing cluster is live! Graduate students can now request compute cycles through the portal. ⚡',
    attachments: [],
    likes: 892,
    comments: 12,
    edits: 45,
    views: '45k',
  },
  {
    id: 3,
    courseCode: 'MATH-201',
    courseName: 'Linear Algebra II',
    author: 'Prof. Sarah Miller',
    handle: '@smiller',
    isVerified: true,
    timeAgo: '1d',
    content:
      'Office hours have been moved to Thursday this week. We will be covering eigenvectors and diagonalization. Bring your problem sets for review.',
    attachments: [
      { name: 'LA_Week8_Exercises.pdf', size: '1.8 MB', type: 'pdf' },
    ],
    likes: 43,
    comments: 8,
    edits: 3,
    views: '2.1k',
  },
];

export const MOCK_COURSES: Course[] = [
  { code: 'PHYS-402', name: 'Advanced Physics III', status: '3 Live • Lab Today' },
  { code: 'CS-308', name: 'Computational Theory', status: 'Next: Tomorrow @ 10AM' },
  { code: 'MATH-201', name: 'Linear Algebra II', status: 'Assignment Due Friday' },
];

export const MOCK_MESSAGES: Message[] = [
  { author: 'Dr. Elena Vance', time: '12m', preview: "I've uploaded the seminar notes..." },
  { author: 'James K.', time: '2h', preview: 'Are we meeting at the lab later?' },
  { author: 'Maria G.', time: '3h', preview: 'The group project draft is ready.' },
];

export const MOCK_NETWORK: NetworkUser[] = [
  { name: 'Dr. Sarah Miller', role: 'Faculty' },
  { name: 'Prof. James Wilson', role: 'Faculty' },
  { name: 'Ana Torres', role: 'Research Assistant' },
];

export const MOCK_CALENDAR: CalendarEvent[] = [
  {
    date: 'Oct 24',
    title: 'Advanced Physics Lecture',
    subtitle: '10:00 AM - Science Hall B',
  },
  {
    date: 'Oct 25',
    title: 'Computational Theory Submission',
    subtitle: '11:59 PM - Online Portal',
  },
  {
    date: 'Oct 27',
    title: 'Linear Algebra Midterm',
    subtitle: '2:00 PM - Auditorium A',
  },
];
