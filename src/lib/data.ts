
import type { Job, BlogPost } from '@/types';

export const dummyJobs: Job[] = [
 {
    id: 'A1B2C3',
    title: 'Senior Software Engineer (Frontend)',
    company: 'QuantumFusion Solutions',
    location: 'San Francisco, CA',
    department: 'Engineering',
    description: 'Join our dynamic team to build next-generation web applications using modern frontend technologies. Lead frontend development projects and mentor junior engineers.',
    employmentType: 'Full-Time',
    salaryRange: '$150,000 - $180,000',
    postedDate: '2024-07-20T10:00:00Z',
    companyLogoUrl: 'https://placehold.co/100x100.png',
    requiredSkills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS', 'GraphQL'],
  },
  {
    id: 'D4E5F6',
    title: 'Product Manager, AI Platforms',
    company: 'QuantumFusion Solutions',
    location: 'New York, NY',
    department: 'Product',
    description: 'Define and drive the product strategy for our cutting-edge AI platforms. Work closely with engineering, design, and marketing teams to deliver innovative solutions.',
    employmentType: 'Full-Time',
    postedDate: '2024-07-18T14:30:00Z',
    companyLogoUrl: 'https://placehold.co/100x100.png',
    requiredSkills: ['Product Management', 'AI/ML Fundamentals', 'Agile Methodologies', 'Roadmapping', 'Market Analysis'],
  },
  {
    id: 'G7H8I9',
    title: 'UX/UI Designer',
    company: 'QuantumFusion Solutions',
    location: 'Remote',
    department: 'Design',
    description: 'Craft intuitive and visually appealing user experiences for our suite of creative tools. Collaborate with product managers and developers to bring ideas to life.',
    employmentType: 'Full-Time',
    salaryRange: '$90,000 - $120,000',
    postedDate: '2024-07-22T09:00:00Z',
    requiredSkills: ['UX Design', 'UI Design', 'Figma', 'Prototyping', 'User Research'],
  },
  {
    id: 'J0K1L2',
    title: 'Data Scientist',
    company: 'QuantumFusion Solutions',
    location: 'Boston, MA',
    department: 'Data Science',
    description: 'Analyze large datasets to extract meaningful insights and build predictive models. Apply machine learning techniques to solve complex business problems.',
    employmentType: 'Full-Time',
    postedDate: '2024-07-15T11:00:00Z',
    companyLogoUrl: 'https://placehold.co/100x100.png',
    requiredSkills: ['Python', 'Machine Learning', 'Statistical Analysis', 'SQL', 'Data Visualization'],
  },
  {
    id: 'M3N4O5',
    title: 'Marketing Specialist (Digital)',
    company: 'QuantumFusion Solutions',
    location: 'San Francisco, CA',
    department: 'Marketing',
    description: 'Develop and execute digital marketing campaigns to drive brand awareness and lead generation. Manage SEO/SEM, social media, and email marketing efforts.',
    employmentType: 'Part-Time',
    postedDate: '2024-07-25T16:00:00Z',
    requiredSkills: ['Digital Marketing', 'SEO', 'SEM', 'Social Media Marketing', 'Content Creation'],
  },
  {
    id: 'P6Q7R8',
    title: 'Backend Developer (Node.js)',
    company: 'QuantumFusion Solutions',
    location: 'Remote',
    department: 'Engineering',
    description: 'Design and implement scalable backend services and APIs. Work with Node.js, microservices architecture, and cloud platforms like AWS or Google Cloud.',
    employmentType: 'Full-Time',
    salaryRange: '$130,000 - $160,000',
    postedDate: '2024-07-19T08:00:00Z',
    requiredSkills: ['Node.js', 'Express.js', 'Microservices', 'AWS', 'Databases (SQL/NoSQL)'],
  },
];

// Function to generate a unique ID (simple incrementing string for demo)
// This function is no longer used with the fixed dummy data, but kept for potential future dynamic job additions

// A more robust ID generation function would be needed for actual unique IDs
export const generateUniqueId = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return Array.from({ length: 6 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
};

// Function to add a new job
export const addJob = (newJob: Omit<Job, 'id' | 'postedDate'>): Job => {
  const jobWithId: Job = {
    ...newJob,
    id: generateUniqueId(),
    postedDate: new Date().toISOString(), // Add current timestamp
  };
  dummyJobs.push(jobWithId);
  return jobWithId;
};

// Function to update an existing job
export const updateJob = (updatedJob: Job): Job | undefined => {
  const index = dummyJobs.findIndex(job => job.id === updatedJob.id);
  if (index !== -1) {
    dummyJobs[index] = { ...updatedJob, postedDate: new Date().toISOString() }; // Update timestamp
    return dummyJobs[index];
  }
  return undefined; // Job not found
};

// Robust generation of unique locations for filters and dropdowns
const jobSpecificLocations = dummyJobs
  .map(job => String(job.location || "").trim()) // Ensure string, trim whitespace
  .filter(Boolean); // Remove any empty strings that might result

const baseFilterLocations = ['All Locations', 'Anywhere', 'Remote'];
const allUniqueLocations = Array.from(new Set([...baseFilterLocations, ...jobSpecificLocations]));

export const locations = allUniqueLocations.sort((a, b) => {
  const specialOrder = ['All Locations', 'Anywhere', 'Remote'];
  const aIndex = specialOrder.indexOf(a);
  const bIndex = specialOrder.indexOf(b);

  if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex; // Sort by special order
  if (aIndex !== -1) return -1; // a is special, b is not (so a comes first)
  if (bIndex !== -1) return 1;  // b is special, a is not (so b comes first)
  return a.localeCompare(b); // Alphabetical for all other locations
});


export const departments = [
  'All Departments',
  ...new Set(dummyJobs.map(job => job.department).sort())
];


export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of AI in Talent Acquisition',
    date: 'August 5, 2024',
    author: 'Dr. Evelyn Reed',
    excerpt: 'Exploring how artificial intelligence is revolutionizing the recruitment landscape, from automated screening to predictive hiring.',
    content: 'The full article delves deeper into AI-driven candidate sourcing, bias mitigation techniques using AI, and the ethical considerations of AI in recruitment. It also showcases case studies of companies successfully implementing these technologies to improve their hiring outcomes, reduce time-to-fill, and enhance candidate experience. We explore various AI tools, from resume parsers and chatbot interviewers to predictive analytics platforms that forecast hiring success. Furthermore, the post discusses the importance of human oversight in AI-driven recruitment processes to ensure fairness and maintain a personal touch.',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'AI hiring concept',
    category: 'AI & Recruitment',
    comments: 12,
    slug: 'future-of-ai-talent-acquisition',
  },
  {
    id: '2',
    title: 'Navigating Your Career Path in the Digital Age',
    date: 'July 28, 2024',
    author: 'Aisha Khan',
    excerpt: 'Tips and strategies for professionals looking to thrive and adapt in an ever-evolving digital job market.',
    content: 'This comprehensive guide provides actionable advice for career navigation. It covers topics such as continuous learning, skill development in high-demand areas like data science and cybersecurity, networking strategies both online and offline, personal branding, and adapting to remote work environments. The article emphasizes the importance of soft skills like critical thinking, creativity, and emotional intelligence in complementing technical expertise. It also includes resources for online courses, mentorship programs, and industry certifications to help professionals stay competitive.',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'digital future career',
    category: 'Career Development',
    comments: 8,
    slug: 'navigating-career-path-digital-age',
  },
  {
    id: '3',
    title: 'The Power of Personalized Learning for Skill Enhancement',
    date: 'July 15, 2024',
    author: 'Marcus Chen',
    excerpt: 'How QuantumFusion Solutions\' personalized learning modules help individuals acquire new skills and stay ahead.',
    content: 'Discover how adaptive learning technologies and personalized content curation are revolutionizing professional development. This article explains the mechanisms behind personalized learning platforms, including AI algorithms that tailor educational content to individual learning styles, paces, and career goals. It highlights the benefits of such systems, such as increased engagement, better knowledge retention, and more efficient skill acquisition. We also discuss how QuantumFusion Solutions leverages these principles in its own EdTech offerings to empower lifelong learning.',
    imageUrl: 'https://placehold.co/600x400.png',
    aiHint: 'online learning interface',
    category: 'EdTech',
    comments: 5,
    slug: 'power-of-personalized-learning',
  },
];

export const educationQualifications = [
  '10th', '12th', 'Diploma', 'Graduation', 'Post Graduation', 'PhD', 'Other'
];

export const noticePeriods = [
  'Immediately', '15 Days', '30 Days', '45 Days', '60 Days', '90 Days', 'More than 90 Days'
];

export const generateYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 1980; year--) {
    years.push(year.toString());
  }
  return years;
};

// For the preferred job location dropdown in the ApplyJobModal
// It uses the main `locations` array but filters out "All Locations" in the modal component itself.
// So no separate export needed here if `locations` is correctly deduplicated and sorted.
// If a truly different list is needed for preferred locations, it can be defined here.
// For now, `apply-job-modal.tsx` imports `locations as preferredLocations` and filters.
