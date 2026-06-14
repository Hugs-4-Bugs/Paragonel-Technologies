
import type { Job, BlogPost } from '@/types';

/**
 * @fileOverview Base foundation data for QuantumFusion Solutions.
 * These items are permanent and represent the core identity of the brand.
 * CMS items added via Firestore will be appended to these lists.
 */

export const baseServices = [
  {
    id: 'base-ai',
    title: 'AI Solutions',
    description: 'Unlock the power of Artificial Intelligence with our custom machine learning models, natural language processing, and computer vision solutions tailored to your business needs.',
    iconName: 'Brain',
    slug: 'ai-solutions',
    imageUrl: 'https://picsum.photos/seed/qfs-ai/800/600',
    isActive: true,
    order: 1
  },
  {
    id: 'base-cloud',
    title: 'Cloud Infrastructure',
    description: 'Optimize your operations with our secure, scalable, and cost-effective cloud infrastructure services, including migration, management, and cloud-native development on AWS, GCP, and Azure.',
    iconName: 'Cloud',
    slug: 'cloud-infrastructure',
    imageUrl: 'https://picsum.photos/seed/qfs-cloud/800/600',
    isActive: true,
    order: 2
  },
  {
    id: 'base-devops',
    title: 'DevOps Automation',
    description: 'Accelerate your software delivery lifecycle with our comprehensive DevOps automation services, including CI/CD pipelines, infrastructure as code (IaC), and automated testing.',
    iconName: 'GitFork',
    slug: 'devops-automation',
    imageUrl: 'https://picsum.photos/seed/qfs-devops/800/600',
    isActive: true,
    order: 3
  },
  {
    id: 'base-saas',
    title: 'SaaS Platforms',
    description: 'Develop and launch robust, scalable, and user-friendly SaaS platforms with our end-to-end development services, from ideation and architectural design to deployment and maintenance.',
    iconName: 'Layers',
    slug: 'saas-platforms',
    imageUrl: 'https://picsum.photos/seed/qfs-saas/800/600',
    isActive: true,
    order: 4
  }
];

export const basePortfolio = [
  {
    id: 'p-1',
    name: 'AcquisitionOS',
    category: 'Sales Tech',
    imageUrl: 'https://picsum.photos/seed/acq-os-v2/800/600',
    description: 'AI-powered lead acquisition and CRM platform. Replaces 3–4 separate sales tools. Reduces customer acquisition costs with automated outreach and campaign intelligence.',
    status: 'Live',
    techs: ['React', 'Java', 'Python', 'AWS'],
    link: 'https://acquisitionos.vercel.app',
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'p-2',
    name: 'SystemFoundry',
    category: 'Architecture',
    imageUrl: 'https://picsum.photos/seed/sys-foundry-v2/800/600',
    description: 'Created an interactive tool helping engineers visualize and simulate system architectures in real-time with AI guidance.',
    status: 'Live',
    techs: ['Next.js', 'Firebase', 'D3.js'],
    link: 'https://systemfoundry.vercel.app',
    createdAt: new Date('2024-01-05').toISOString()
  },
  {
    id: 'p-3',
    name: 'CodeGuard AI',
    category: 'Dev Intelligence',
    imageUrl: 'https://picsum.photos/seed/cg-ai-v2/800/600',
    description: 'Built a specialized developer tool that provides real-time security and cost intelligence for cloud infrastructure code.',
    status: 'Published',
    techs: ['VS Code API', 'Node.js', 'LLMs'],
    link: 'https://marketplace.visualstudio.com/items?itemName=QuantumFusion.codeguard-ai',
    createdAt: new Date('2024-01-10').toISOString()
  },
  {
    id: 'p-4',
    name: 'AaharAI',
    category: 'Health Tech',
    imageUrl: 'https://picsum.photos/seed/aahar-ai-v2/800/600',
    description: 'An India-first intelligent health companion focusing on personalized nutrition and dietary insights.',
    status: 'Development',
    techs: ['Flutter', 'Spring Boot', 'GCP'],
    link: '#',
    createdAt: new Date('2024-01-15').toISOString()
  }
];

export const baseTestimonials = [
  {
    id: 'base-t-1',
    name: 'Dr. Anita Desai',
    role: 'Medical Director',
    company: 'Maa-Aarogyam Health Centre',
    content: 'The AI-native health platform developed for our centre is revolutionizing patient data processing. Their ability to deliver high-quality custom software within a strict ₹1.75L scope was exceptional.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-2',
    name: 'Rajesh Kumar',
    role: 'CEO',
    company: 'TechIndia Corp',
    content: 'QuantumFusion transformed our legacy infrastructure into a high-performance cloud environment. Their work on AcquisitionOS proves they are leaders in AI-driven SaaS.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-3',
    name: 'Amit Sharma',
    role: 'Founder',
    company: 'StartScale AI',
    content: 'Their Fractional CTO services provided the technical leadership we needed during our critical seed-round growth. They understand the speed required for modern startups.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-4',
    name: 'Sarah Chen',
    role: 'Product Lead',
    company: 'Innovate Global',
    content: 'The SaaS platform (SystemFoundry) built by QuantumFusion has allowed us to scale architecture simulations globally. Their engineering quality is unmatched.',
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
  }
];

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'The Engineering Logic Behind AcquisitionOS',
    date: 'February 15, 2025',
    author: 'Prabhat Sharma',
    excerpt: 'Why we decided to build a lead acquisition engine from scratch and how AI-driven campaign intelligence outperforms manual outreach.',
    body: 'Building a CRM in 2025 requires more than just database tables. It requires a reasoning engine. In this post, we explore how we integrated LLMs to automate high-intent outreach...',
    thumbnailUrl: 'https://picsum.photos/seed/qfs-blog-p1/800/600',
    category: 'Product Engineering',
    tags: ['AI', 'CRM', 'SaaS'],
    status: 'Published',
    slug: 'engineering-logic-acquisition-os',
    createdAt: new Date('2025-02-15').toISOString(),
    updatedAt: new Date('2025-02-15').toISOString()
  },
  {
    id: '2',
    title: 'How CodeGuard AI Saves AWS Bills for DevOps Teams',
    date: 'March 02, 2025',
    author: 'QuantumFusion Team',
    excerpt: 'A deep dive into our VS Code extension that identifies cost-inefficient IaC patterns before they hit production.',
    body: 'Cloud bills are the silent killer of startups. CodeGuard AI was born out of a simple need: knowing exactly how much a Terraform change will cost before running apply...',
    thumbnailUrl: 'https://picsum.photos/seed/qfs-blog-p2/800/600',
    category: 'Cloud Intelligence',
    tags: ['DevOps', 'AWS', 'Cost Management'],
    status: 'Published',
    slug: 'how-codeguard-saves-aws-bills',
    createdAt: new Date('2025-03-02').toISOString(),
    updatedAt: new Date('2025-03-02').toISOString()
  },
  {
    id: '3',
    title: 'Transitioning from Engineer to Solo Founder',
    date: 'April 10, 2025',
    author: 'Prabhat Sharma',
    excerpt: 'The story of QuantumFusion Solutions: Moving from Netcore Cloud to building a portfolio of AI-native products.',
    body: 'Building a services company while shipping internal products is a balancing act. This article shares the milestones of our journey from HSR Layout to global deployments...',
    thumbnailUrl: 'https://picsum.photos/seed/qfs-blog-p3/800/600',
    category: 'Founders Journal',
    tags: ['Entrepreneurship', 'Growth', 'Story'],
    status: 'Published',
    slug: 'engineer-to-solo-founder-story',
    createdAt: new Date('2025-04-10').toISOString(),
    updatedAt: new Date('2025-04-10').toISOString()
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
