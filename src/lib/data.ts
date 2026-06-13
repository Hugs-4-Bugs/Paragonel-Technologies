
import type { Job, BlogPost } from '@/types';

export const baseServices = [
  {
    id: 'base-ai',
    title: 'AI Solutions',
    description: 'Unlock the power of Artificial Intelligence with our custom machine learning models, natural language processing, and computer vision solutions tailored to your business needs.',
    iconName: 'Brain',
    slug: 'ai-solutions',
    imageUrl: 'https://picsum.photos/seed/ai-service/600/400',
    isActive: true,
    order: 1
  },
  {
    id: 'base-cloud',
    title: 'Cloud Infrastructure',
    description: 'Optimize your operations with our secure, scalable, and cost-effective cloud infrastructure services, including migration, management, and cloud-native development.',
    iconName: 'Cloud',
    slug: 'cloud-infrastructure',
    imageUrl: 'https://picsum.photos/seed/cloud-service/600/400',
    isActive: true,
    order: 2
  },
  {
    id: 'base-devops',
    title: 'DevOps Automation',
    description: 'Accelerate your software delivery lifecycle with our comprehensive DevOps automation services, including CI/CD pipelines, infrastructure as code, and automated testing.',
    iconName: 'GitFork',
    slug: 'devops-automation',
    imageUrl: 'https://picsum.photos/seed/devops-service/600/400',
    isActive: true,
    order: 3
  },
  {
    id: 'base-saas',
    title: 'SaaS Platforms',
    description: 'Develop and launch robust, scalable, and user-friendly SaaS platforms with our end-to-end development services, from ideation and design to deployment and maintenance.',
    iconName: 'Layers',
    slug: 'saas-platforms',
    imageUrl: 'https://picsum.photos/seed/saas-service/600/400',
    isActive: true,
    order: 4
  }
];

export const basePortfolio = [
  {
    id: 'p-1',
    name: 'AcquisitionOS',
    category: 'Talent Acquisition',
    imageUrl: 'https://picsum.photos/seed/p1/600/400',
    description: 'Developed a cutting-edge platform that reduced hiring time by 40% using AI matchmaking and automated workflows.',
    status: 'Live',
    techs: ['React', 'Java', 'Python', 'AWS'],
    link: '#',
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'p-2',
    name: 'SystemFoundry',
    category: 'Architecture',
    imageUrl: 'https://picsum.photos/seed/p2/600/400',
    description: 'Created an interactive tool helping students visualize and plan their career paths based on skills and interests.',
    status: 'Live',
    techs: ['Next.js', 'Firebase', 'D3.js'],
    link: '#',
    createdAt: new Date('2024-01-05').toISOString()
  },
  {
    id: 'p-3',
    name: 'CodeGuard AI',
    category: 'Dev Intelligence',
    imageUrl: 'https://picsum.photos/seed/p3/600/400',
    description: 'Built a SaaS platform offering personalized learning journeys and skill assessments for professionals.',
    status: 'Published',
    techs: ['VS Code API', 'Node.js', 'LLMs'],
    link: '#',
    createdAt: new Date('2024-01-10').toISOString()
  },
  {
    id: 'p-4',
    name: 'AaharAI',
    category: 'Health Tech',
    imageUrl: 'https://picsum.photos/seed/p4/600/400',
    description: 'Designed and launched a comprehensive suite of tools for enhancing remote team productivity and communication.',
    status: 'Development',
    techs: ['Flutter', 'Spring Boot', 'GCP'],
    link: '#',
    createdAt: new Date('2024-01-15').toISOString()
  }
];

export const baseTestimonials = [
  {
    id: 'base-t-1',
    name: 'Rajesh Kumar',
    role: 'CEO',
    company: 'TechIndia Corp',
    content: 'QuantumFusion transformed our legacy infrastructure into a high-performance cloud environment. Their AI expertise is world-class.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-2',
    name: 'Sarah Chen',
    role: 'Product Lead',
    company: 'Innovate Global',
    content: 'The SaaS platform built by QuantumFusion has allowed us to scale from 100 to 50,000 users without a single hitch.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-3',
    name: 'Amit Sharma',
    role: 'Founder',
    company: 'StartScale AI',
    content: 'Their Fractional CTO services provided the technical leadership we needed during our critical seed-round growth.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-4',
    name: 'Dr. Anita Desai',
    role: 'MD',
    company: 'Maa-Aarogyam Centre',
    content: 'The AI-native health platform developed for our centre is revolutionizing patient data processing and diagnostics.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-5',
    name: 'Kevin Wright',
    role: 'Operations Director',
    company: 'SkyLogistics',
    content: 'QuantumFusion is simply the best when it comes to DevOps automation and cloud-native solutions.',
    rating: 5,
    avatarUrl: ''
  }
];

export const dummyJobs: Job[] = [
  {
    id: 'ENG-001',
    jobId: 'ENG001',
    title: 'Senior Frontend Engineer (React/Next.js)',
    company: 'QuantumFusion Solutions',
    location: 'Bangalore / Remote',
    department: 'Engineering',
    description: 'We are looking for a Senior Frontend Engineer to lead the development of our AI-native CRM, AcquisitionOS. You will be responsible for building high-performance, responsive UIs and mentoring junior developers.',
    employmentType: 'Full Time',
    workArrangement: 'Remote',
    experienceRequired: '5+ Years',
    salaryRange: '₹18L - ₹28L',
    skills: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'Redux'],
    isActive: true,
    status: 'Active',
    postedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ENG-002',
    jobId: 'ENG002',
    title: 'Backend Developer (Java/Spring Boot)',
    company: 'QuantumFusion Solutions',
    location: 'Bangalore',
    department: 'Engineering',
    description: 'Join our core engineering team to build scalable microservices for SystemFoundry. Experience with Java, Spring Boot, and cloud-native architectures is essential.',
    employmentType: 'Full Time',
    workArrangement: 'Hybrid',
    experienceRequired: '3-6 Years',
    salaryRange: '₹15L - ₹25L',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'AWS', 'Docker'],
    isActive: true,
    status: 'Active',
    postedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'AI-001',
    jobId: 'AI001',
    title: 'AI Research Engineer',
    company: 'QuantumFusion Solutions',
    location: 'Remote',
    department: 'Engineering',
    description: 'Develop and fine-tune LLM models and RAG pipelines for our internal and client projects. Expertise in Python and vector databases is a must.',
    employmentType: 'Full Time',
    workArrangement: 'Remote',
    experienceRequired: '2-4 Years',
    salaryRange: '₹20L - ₹35L',
    skills: ['Python', 'PyTorch', 'LangChain', 'Pinecone', 'OpenAI'],
    isActive: true,
    status: 'Active',
    postedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'DES-001',
    jobId: 'DES001',
    title: 'Lead UI/UX Designer',
    company: 'QuantumFusion Solutions',
    location: 'Remote',
    department: 'Design',
    description: 'Lead the design language of QuantumFusion. You will create intuitive interfaces for complex AI-driven dashboards and mobile applications.',
    employmentType: 'Full Time',
    workArrangement: 'Remote',
    experienceRequired: '4+ Years',
    salaryRange: '₹12L - ₹22L',
    skills: ['Figma', 'Adobe XD', 'Prototyping', 'User Research', 'Design Systems'],
    isActive: true,
    status: 'Active',
    postedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'MKT-001',
    jobId: 'MKT001',
    title: 'Growth Marketing Manager',
    company: 'QuantumFusion Solutions',
    location: 'Remote',
    department: 'Marketing',
    description: 'Drive user acquisition for our SaaS products. Manage SEO, SEM, and social media campaigns with a focus on product-led growth.',
    employmentType: 'Full Time',
    workArrangement: 'Remote',
    experienceRequired: '3-5 Years',
    salaryRange: '₹10L - ₹18L',
    skills: ['SEO', 'Google Ads', 'Content Strategy', 'HubSpot', 'Analytics'],
    isActive: true,
    status: 'Active',
    postedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Future of AI in Talent Acquisition',
    date: 'August 5, 2024',
    author: 'Prabhat Sharma',
    excerpt: 'Exploring how artificial intelligence is revolutionizing the recruitment landscape, from automated screening to predictive hiring.',
    body: 'The full article delves deeper into AI-driven candidate sourcing, bias mitigation techniques using AI, and the ethical considerations of AI in recruitment.',
    thumbnailUrl: 'https://picsum.photos/seed/b1/800/600',
    category: 'AI & Recruitment',
    tags: ['AI', 'Recruitment', 'HR Tech'],
    status: 'Published',
    slug: 'future-of-ai-talent-acquisition',
    createdAt: new Date('2024-08-05').toISOString()
  },
  {
    id: '2',
    title: 'Maximizing ROI with AI-Driven Automation',
    date: 'August 12, 2024',
    author: 'QuantumFusion Team',
    excerpt: 'How businesses are saving thousands of hours by integrating intelligent automation into their daily workflows.',
    body: 'Automation is no longer just about scripts. With LLMs, we can now automate decision-making processes that previously required human intervention...',
    thumbnailUrl: 'https://picsum.photos/seed/b2/800/600',
    category: 'AI Solutions',
    tags: ['Automation', 'ROI', 'Efficiency'],
    status: 'Published',
    slug: 'maximizing-roi-ai-automation',
    createdAt: new Date('2024-08-12').toISOString()
  },
  {
    id: '3',
    title: 'Why Hybrid Cloud is the Future for SMBs',
    date: 'August 18, 2024',
    author: 'Vivek Sharma',
    excerpt: 'Navigating the balance between security, cost, and scalability with a hybrid cloud approach.',
    body: 'Small and medium businesses often struggle with the "all-in" cloud transition. Hybrid cloud offers a middle ground that provides the best of both worlds...',
    thumbnailUrl: 'https://picsum.photos/seed/b3/800/600',
    category: 'Cloud Infrastructure',
    tags: ['Cloud', 'Hybrid', 'SMB'],
    status: 'Published',
    slug: 'why-hybrid-cloud-future-smbs',
    createdAt: new Date('2024-08-18').toISOString()
  }
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

export const locations = [
  'All Locations', 'Remote', 'Bangalore', 'Mumbai', 'Pune', 'Hyderabad', 'Chennai', 'Delhi NCR', 'Ahmedabad', 'Kolkata'
];

export const departments = [
  'All Departments', 'Engineering', 'Design', 'Marketing', 'Operations', 'HR', 'Sales', 'Product', 'Data Science'
];
