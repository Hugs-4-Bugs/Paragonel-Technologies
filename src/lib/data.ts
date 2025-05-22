import type { Job } from '@/types';

export const dummyJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Software Engineer (Frontend)',
    company: 'Innovatech Solutions',
    location: 'San Francisco, CA',
    department: 'Engineering',
    description: 'Join our dynamic team to build next-generation web applications using modern frontend technologies. Lead frontend development projects and mentor junior engineers.',
    employmentType: 'Full-time',
    salaryRange: '$150,000 - $180,000',
    postedDate: '2024-07-20T10:00:00Z',
    companyLogoUrl: 'https://placehold.co/100x100/3498DB/FFFFFF.png?text=IS',
  },
  {
    id: '2',
    title: 'Product Manager, AI Platforms',
    company: 'FutureAI Corp',
    location: 'New York, NY',
    department: 'Product',
    description: 'Define and drive the product strategy for our cutting-edge AI platforms. Work closely with engineering, design, and marketing teams to deliver innovative solutions.',
    employmentType: 'Full-time',
    postedDate: '2024-07-18T14:30:00Z',
    companyLogoUrl: 'https://placehold.co/100x100/663399/FFFFFF.png?text=FAI',
  },
  {
    id: '3',
    title: 'UX/UI Designer',
    company: 'Creative Spark Inc.',
    location: 'Remote',
    department: 'Design',
    description: 'Craft intuitive and visually appealing user experiences for our suite of creative tools. Collaborate with product managers and developers to bring ideas to life.',
    employmentType: 'Full-time',
    salaryRange: '$90,000 - $120,000',
    postedDate: '2024-07-22T09:00:00Z',
  },
  {
    id: '4',
    title: 'Data Scientist',
    company: 'Quantum Dynamics',
    location: 'Boston, MA',
    department: 'Engineering',
    description: 'Analyze large datasets to extract meaningful insights and build predictive models. Apply machine learning techniques to solve complex business problems.',
    employmentType: 'Full-time',
    postedDate: '2024-07-15T11:00:00Z',
    companyLogoUrl: 'https://placehold.co/100x100/1A237E/FFFFFF.png?text=QD',
  },
  {
    id: '5',
    title: 'Marketing Specialist (Digital)',
    company: 'Innovatech Solutions',
    location: 'San Francisco, CA',
    department: 'Marketing',
    description: 'Develop and execute digital marketing campaigns to drive brand awareness and lead generation. Manage SEO/SEM, social media, and email marketing efforts.',
    employmentType: 'Part-time',
    postedDate: '2024-07-25T16:00:00Z',
  },
  {
    id: '6',
    title: 'Backend Developer (Node.js)',
    company: 'FutureAI Corp',
    location: 'Remote',
    department: 'Engineering',
    description: 'Design and implement scalable backend services and APIs. Work with Node.js, microservices architecture, and cloud platforms like AWS or Google Cloud.',
    employmentType: 'Full-time',
    salaryRange: '$130,000 - $160,000',
    postedDate: '2024-07-19T08:00:00Z',
  },
];

export const locations = [
  'All Locations',
  ...new Set(dummyJobs.map(job => job.location).sort())
];
export const departments = [
  'All Departments',
  ...new Set(dummyJobs.map(job => job.department).sort())
];
