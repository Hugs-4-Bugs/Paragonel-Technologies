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
    description: 'A sophisticated AI-powered lead acquisition and CRM platform designed to replace fragmented sales tools. It features automated cold outreach, intent-based lead scoring using custom LLMs, and real-time campaign analytics. Built with a Spring Boot backend and Next.js frontend to handle millions of data points with sub-second latency.',
    status: 'Live',
    techs: ['React', 'Java', 'Python', 'AWS', 'Gemini AI'],
    link: 'https://acquisitionos.vercel.app',
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'p-2',
    name: 'SystemFoundry',
    category: 'Architecture',
    imageUrl: 'https://picsum.photos/seed/sys-foundry-v2/800/600',
    description: 'A visual AI-powered system architecture simulator that allows engineers to drag-and-drop infrastructure components and simulate load, cost, and failure scenarios. It uses an intelligent reasoning engine to suggest optimizations for AWS/GCP deployments, helping teams reduce technical debt before writing a single line of code.',
    status: 'Live',
    techs: ['Next.js', 'Firebase', 'D3.js', 'Tailwind CSS'],
    link: 'https://systemfoundry.vercel.app',
    createdAt: new Date('2024-01-05').toISOString()
  },
  {
    id: 'p-3',
    name: 'CodeGuard AI',
    category: 'Dev Intelligence',
    imageUrl: 'https://picsum.photos/seed/cg-ai-v2/800/600',
    description: 'A specialized VS Code extension that provides real-time cloud cost intelligence. As developers write Infrastructure as Code (Terraform, Pulumi), CodeGuard AI analyzes the plan and highlights potential "cost bombs" and security vulnerabilities directly in the IDE. It has helped early adopters reduce their monthly AWS bills by an average of 22%.',
    status: 'Published',
    techs: ['VS Code API', 'Node.js', 'LLMs', 'Terraform'],
    link: 'https://marketplace.visualstudio.com/items?itemName=QuantumFusion.codeguard-ai',
    createdAt: new Date('2024-01-10').toISOString()
  },
  {
    id: 'p-4',
    name: 'AaharAI',
    category: 'Health Tech',
    imageUrl: 'https://picsum.photos/seed/aahar-ai-v2/800/600',
    description: 'An India-first intelligent health companion focusing on personalized nutrition. By analyzing Indian dietary patterns and local ingredients, AaharAI provides micro-targeted nutritional advice. It integrates with wearable health data to offer a 360-degree view of user wellness, moving beyond generic calorie counting.',
    status: 'Development',
    techs: ['Flutter', 'Spring Boot', 'GCP', 'PostgreSQL'],
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
    content: 'The AI-native health platform developed for our centre is revolutionizing patient data processing. Their ability to deliver high-quality custom software while maintaining strict adherence to our technical requirements was exceptional. We have seen a 30% reduction in administrative overhead since launch.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-2',
    name: 'Rajesh Kumar',
    role: 'CEO',
    company: 'TechIndia Corp',
    content: 'QuantumFusion transformed our legacy infrastructure into a high-performance cloud environment. Their work on AcquisitionOS proves they are leaders in AI-driven SaaS. The transition was seamless, and the technical support has been world-class.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-3',
    name: 'Amit Sharma',
    role: 'Founder',
    company: 'StartScale AI',
    content: 'Their Fractional CTO services provided the technical leadership we needed during our critical seed-round growth. They understand the speed required for modern startups and saved us from making several expensive architectural mistakes early on.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-4',
    name: 'Sarah Chen',
    role: 'Product Lead',
    company: 'Innovate Global',
    content: 'The SaaS platform (SystemFoundry) built by QuantumFusion has allowed us to scale architecture simulations globally. Their engineering quality is unmatched, and their focus on user-centric design makes complex tools feel intuitive.',
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
    excerpt: 'A deep dive into why we built a custom lead acquisition engine and how our RAG pipeline outperforms traditional CRM manual outreach.',
    body: `
Building a CRM in 2025 requires more than just database tables. It requires a reasoning engine. When we started building AcquisitionOS, we realized that the biggest bottleneck for sales teams wasn't storing data—it was knowing who to talk to and what to say.

### The Problem with Traditional CRMs
Most CRMs are glorified spreadsheets. They wait for a human to input data, and then they wait for a human to act on it. In a world of high-velocity sales, this delay is lethal. We wanted to build a system that acts as a technical co-pilot for the sales team.

### Our Solution: The RAG Pipeline
We integrated a Retrieval Augmented Generation (RAG) pipeline into the core of AcquisitionOS. Here's how it works:
1. **Data Ingestion**: We aggregate signals from various public and private data sources.
2. **Contextual Indexing**: Instead of basic keyword matching, we use vector embeddings to understand the "intent" behind a company's recent activities.
3. **Reasoning Layer**: Our custom LLM scoring engine analyzes these embeddings to prioritize leads that are most likely to convert right now.

### Technology Choice: Why Java & Spring Boot?
While Python is the king of AI, we chose Java with Spring Boot for the backend of AcquisitionOS. Why? Scale and predictability. For a platform that needs to handle high-concurrency data ingestion and mission-critical sales workflows, the strong typing and robust ecosystem of JVM provided the reliability our enterprise clients demand. We use Python as a microservice for the heavy-lifting AI tasks, connected via secure internal APIs.

The result is a platform that doesn't just store your leads—it finds them, scores them, and helps you close them.
    `,
    thumbnailUrl: 'https://picsum.photos/seed/qfs-blog-p1/800/600',
    category: 'Product Engineering',
    tags: ['AI', 'CRM', 'SaaS', 'Spring Boot'],
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
    excerpt: 'An technical exploration of our VS Code extension that identifies cost-inefficient Infrastructure as Code patterns before they are deployed.',
    body: `
Cloud bills are the silent killer of startups. CodeGuard AI was born out of a simple need: knowing exactly how much a Terraform change will cost before running \`terraform apply\`.

### Shift-Left Cost Intelligence
Most companies find out about cloud cost spikes when they receive their monthly invoice. That is too late. CodeGuard AI implements a "Shift-Left" strategy by bringing cost intelligence directly into the developer's IDE.

### How it Works Under the Hood
The extension performs a static analysis of the Infrastructure as Code (IaC) files. When it detects a resource creation or modification, it queries our global pricing engine (which stays updated with the latest AWS/GCP/Azure rates). 

Key features include:
- **Cost Differential Analysis**: It doesn't just show the cost; it shows the *change* in cost relative to the current state.
- **Resource Recommendations**: If a developer chooses an over-provisioned instance type, the AI suggests a more cost-effective alternative that meets the performance requirements.
- **Security Checkpoints**: Along with cost, it scans for open S3 buckets, permissive security groups, and unencrypted volumes.

### The Impact
By catching these issues in the editor, teams are reducing their infrastructure costs by 15-25% without sacrificing performance. It turns cost management from a finance problem into an engineering habit.
    `,
    thumbnailUrl: 'https://picsum.photos/seed/qfs-blog-p2/800/600',
    category: 'Cloud Intelligence',
    tags: ['DevOps', 'AWS', 'Cost Management', 'VS Code'],
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
    excerpt: 'The story of QuantumFusion Solutions: Moving from a high-growth engineering role at Netcore Cloud to building a portfolio of AI-native products.',
    body: `
Transitioning from a secure engineering job to building your own company is both the most terrifying and rewarding experience of my career. 

### The Catalyst
My time at Netcore Cloud was invaluable. I learned how to build systems that operate at massive scale. However, I kept seeing the same pattern: companies were struggling to bridge the gap between their business problems and the complex technical solutions being sold to them. I wanted to build a lean agency that prioritized precision engineering over bureaucratic processes.

### Milestones of the Journey
1. **The Product Pivot**: We didn't just want to be a services firm. We started by building our own products like AcquisitionOS. This gave us "skin in the game" and forced us to master the very technologies we were recommending to clients.
2. **The First Engagement**: Our work with Maa-Aarogyam Health Centre was a turning point. It proved that a lean team could deliver a high-impact AI platform that solved real-world health data challenges in record time.
3. **Scaling with AI**: 2024 saw the explosion of Generative AI. We doubled down on AI-native thinking, ensuring every solution we build is designed for an AI-first world.

### The Vision Ahead
QuantumFusion is still in its early chapters. Our mission remains clear: to eliminate the gap between problem and solution. Whether we are building a custom platform for a client or scaling our own SaaS products, we lead with code, not slides.

This journey from HSR Layout to global deployments is just beginning, and I couldn't be more excited about what we're building next.
    `,
    thumbnailUrl: 'https://picsum.photos/seed/qfs-blog-p3/800/600',
    category: 'Founders Journal',
    tags: ['Entrepreneurship', 'Growth', 'Story', 'Netcore'],
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
