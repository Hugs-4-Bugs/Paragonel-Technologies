
import type { Job, BlogPost } from '@/types';

/**
 * @fileOverview Base foundation data for QuantumFusion Solutions.
 * These items are permanent and represent the core identity of the brand.
 * CMS items added via Firestore will be appended to these lists.
 */

export const baseServices = [
  {
    id: 'base-ai',
    title: 'AI Solutions & LLM Ops',
    description: 'We don\'t just plug in APIs. We build custom RAG pipelines, fine-tuned models, and agentic workflows that live within your secure cloud boundary. Our solutions focus on automating the "thinking" tasks of your business.',
    iconName: 'Brain',
    slug: 'ai-solutions',
    imageUrl: '/images/ai-abstract.png',
    isActive: true,
    order: 1
  },
  {
    id: 'base-cloud',
    title: 'Enterprise Cloud Strategy',
    description: 'Architecting for the next million users. We specialize in high-availability, multi-region AWS and GCP setups that prioritize security and cost-efficiency. Our cloud foundations are built to be unshakeable.',
    iconName: 'Cloud',
    slug: 'cloud-infrastructure',
    imageUrl: '/images/cloud-abstract.png',
    isActive: true,
    order: 2
  },
  {
    id: 'base-devops',
    title: 'DevOps & Reliability',
    description: 'Transforming release cycles from weeks to minutes. We implement Infrastructure as Code (IaC) and automated CI/CD pipelines that enable your engineering team to ship with total confidence and zero downtime.',
    iconName: 'GitFork',
    slug: 'devops-automation',
    imageUrl: '/images/devops-pipeline.png',
    isActive: true,
    order: 3
  },
  {
    id: 'base-saas',
    title: 'Custom SaaS Platforms',
    description: 'Turning vision into market-ready products. From initial wireframing to scaling a global backend, we handle the full technical lifecycle of your platform so you can focus on user growth.',
    iconName: 'Layers',
    slug: 'saas-platforms',
    imageUrl: '/images/saas-platform-dashboard.png',
    isActive: true,
    order: 4
  }
];

export const basePortfolio = [
  {
    id: 'p-1',
    name: 'AcquisitionOS: AI-Native Client Acquisition Platform',
    category: 'Sales Technology',
    imageUrl: '/images/AI-Driven-Recruitment.png',
    description: 'AcquisitionOS is our flagship AI-native client acquisition platform, built to take businesses from prospect discovery to qualified pipeline. **The Problem:** Sales teams spend significant time manually researching companies, identifying opportunities, finding business gaps, personalizing outreach, and managing follow-ups across disconnected tools. **The Solution:** We built an end-to-end acquisition workflow covering prospect discovery, multi-source company research, signal interpretation, opportunity and gap detection, AI-generated opportunity reports, lead scoring, personalized outreach, reply and conversation analysis, meeting workflows, pipeline management, proposal generation, and closing, with LLM-powered reasoning turning fragmented business signals into actionable prospect context and next-best actions. **The Result:** AcquisitionOS is currently in private beta, where real-user feedback is driving product refinement and workflow validation as we prepare for broader customer adoption.',
    status: 'Live',
    techs: ['Spring Boot', 'Next.js', 'Python', 'Vector DB', 'AWS'],
    link: 'https://acquisitionosbeta.vercel.app/',
    createdAt: new Date('2024-01-01').toISOString()
  },
  {
    id: 'p-2',
    name: 'SystemFoundry: Infrastructure Simulator',
    category: 'Cloud Engineering',
    imageUrl: '/images/Career-Path-Visualization.png',
    description: 'A visual architecture simulator for complex cloud systems.\n\n**The Problem:** Architectural mistakes are expensive. Testing infrastructure changes often requires deploying them, leading to technical debt and wasted budget.\n\n**The Solution:** SystemFoundry allows engineers to "drag-and-drop" infrastructure components. The AI engine then simulates real-world load, calculates projected monthly costs, and identifies potential bottlenecks or security risks before a single line of Terraform is written.\n\n**The Result:** Used internally for all client engagements, reducing post-deployment configuration errors by 75% and optimizing initial cloud costs by an average of 20%.',
    status: 'Live',
    techs: ['D3.js', 'React', 'Firebase', 'Serverless'],
    link: 'https://systemfoundry.vercel.app',
    createdAt: new Date('2024-01-05').toISOString()
  },
  {
    id: 'p-3',
    name: 'CodeGuard AI: Cost Intelligence',
    category: 'Developer Tools',
    imageUrl: '/images/Personalized-Learning.png',
    description: 'A VS Code extension providing real-time cost feedback for cloud infrastructure.\n\n**The Problem:** Developers often don\'t realize the cost implications of the resources they provision via IaC until the monthly bill arrives.\n\n**The Solution:** CodeGuard AI performs static analysis on Terraform and CloudFormation files as they are written. It queries a global pricing engine to show exactly how much each line of code will cost per month, highlighting over-provisioned instances and suggesting cheaper alternatives.',
    status: 'Published',
    techs: ['VS Code API', 'TypeScript', 'Node.js', 'LLM'],
    link: 'https://marketplace.visualstudio.com/items?itemName=QuantumFusion.codeguard-ai',
    createdAt: new Date('2024-01-10').toISOString()
  }
];

export const baseTestimonials = [
  {
    id: 'base-t-1',
    name: 'Dr. Anita Desai',
    role: 'Medical Director',
    company: 'Maa-Aarogyam Health Centre',
    content: 'QuantumFusion transformed our health data processing. Their AI platform didn\'t just automate tasks; it redesigned how we interact with patient history. We\'ve seen a massive reduction in paperwork and much faster diagnosis cycles. Their engineering precision is truly world-class.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-2',
    name: 'Rajesh Kumar',
    role: 'CEO',
    company: 'TechIndia Corp',
    content: 'The migration to the cloud was daunting for our legacy systems. QuantumFusion handled it with surgical precision. Their work on AcquisitionOS proved to us they understand SaaS better than anyone in the market. A stellar technical partner.',
    rating: 5,
    avatarUrl: ''
  },
  {
    id: 'base-t-3',
    name: 'Amit Sharma',
    role: 'Founder',
    company: 'StartScale AI',
    content: 'As a startup, you need to move fast without breaking things. Their Fractional CTO service saved us from making critical architectural mistakes in our first six months. They built our MVP to enterprise standards, allowing us to scale without a rewrite.',
    rating: 5,
    avatarUrl: ''
  },
  {
  id: 'base-t-4',
  name: 'Dhiraj Singh',
  role: 'Founder',
  company: 'Maa Arogyam',
  content: 'They transformed our vision into a professional and modern website that represents Maa Arogyam exactly the way we wanted. The website has helped us present our services more clearly and build greater trust with our customers.',
  rating: 5,
  avatarUrl: ''
}
];

export const dummyJobs: Job[] = [
  {
    id: 'ENG-001',
    jobId: 'ENG001',
    title: 'Senior AI Engineer (RAG Specialist)',
    company: 'QuantumFusion Solutions',
    location: 'Bangalore / Remote',
    department: 'Engineering',
    description: 'Lead the development of next-gen RAG pipelines for AcquisitionOS. You will optimize vector embeddings, manage LLM orchestration, and build agentic workflows that solve complex business logic.',
    employmentType: 'Full Time',
    workArrangement: 'Remote',
    experienceRequired: '5+ Years',
    salaryRange: 'Competitive',
    skills: ['Python', 'LangChain', 'Vector Databases', 'PyTorch', 'Next.js'],
    isActive: true,
    status: 'Active',
    postedDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ENG-002',
    jobId: 'ENG002',
    title: 'Backend Lead (Java/Spring Boot)',
    company: 'QuantumFusion Solutions',
    location: 'Bangalore',
    department: 'Engineering',
    description: 'Architect high-concurrency microservices for our core SaaS products. You will leverage your experience in building systems that handle millions of events per second.',
    employmentType: 'Full Time',
    workArrangement: 'Hybrid',
    experienceRequired: '6-8 Years',
    salaryRange: 'Competitive',
    skills: ['Java', 'Spring Boot', 'PostgreSQL', 'Redis', 'AWS'],
    isActive: true,
    status: 'Active',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ENG-003',
    jobId: 'ENG003',
    title: 'Cloud Architect (AWS/IaC)',
    company: 'QuantumFusion Solutions',
    location: 'Remote',
    department: 'Engineering',
    description: 'Design unshakeable cloud foundations for global clients. Focus on multi-region high-availability setups using Terraform and Kubernetes.',
    employmentType: 'Full Time',
    workArrangement: 'Remote',
    experienceRequired: '7+ Years',
    salaryRange: 'Top Tier',
    skills: ['AWS', 'Terraform', 'Kubernetes', 'Python', 'Security'],
    isActive: true,
    status: 'Active',
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'DES-001',
    jobId: 'DES001',
    title: 'Senior Product Designer',
    company: 'QuantumFusion Solutions',
    location: 'Mumbai',
    department: 'Design',
    description: 'Craft the user experience for complex AI-native platforms. You will work directly with founders to translate business pain into intuitive digital interfaces.',
    employmentType: 'Full Time',
    workArrangement: 'Onsite',
    experienceRequired: '4-6 Years',
    salaryRange: 'Competitive',
    skills: ['Figma', 'Prototyping', 'Design Systems', 'UX Research'],
    isActive: true,
    status: 'Active',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
    description: 'Drive user acquisition for our SaaS portfolio. Execute data-driven campaigns across LinkedIn, Twitter, and niche developer communities.',
    employmentType: 'Full Time',
    workArrangement: 'Remote',
    experienceRequired: '3-5 Years',
    salaryRange: 'Competitive',
    skills: ['Performance Marketing', 'SEO', 'Content Strategy', 'Analytics'],
    isActive: true,
    status: 'Active',
    postedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'OPS-001',
    jobId: 'OPS001',
    title: 'Technical Project Manager',
    company: 'QuantumFusion Solutions',
    location: 'Bangalore',
    department: 'Operations',
    description: 'Bridge the gap between client vision and engineering execution. Manage agile sprints and ensure milestone-based delivery for high-impact projects.',
    employmentType: 'Full Time',
    workArrangement: 'Hybrid',
    experienceRequired: '5+ Years',
    salaryRange: 'Competitive',
    skills: ['Agile', 'Jira', 'Stakeholder Management', 'SDLC'],
    isActive: true,
    status: 'Active',
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ENG-004',
    jobId: 'ENG004',
    title: 'Frontend Engineer (React/Next.js)',
    company: 'QuantumFusion Solutions',
    location: 'Remote',
    department: 'Engineering',
    description: 'Build responsive, high-performance web applications using the latest Next.js features. Focus on building clean, accessible, and fast user interfaces.',
    employmentType: 'Full Time',
    workArrangement: 'Remote',
    experienceRequired: '2-4 Years',
    salaryRange: 'Competitive',
    skills: ['React', 'Next.js', 'Tailwind', 'TypeScript'],
    isActive: true,
    status: 'Active',
    postedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ENG-005',
    jobId: 'ENG005',
    title: 'DevOps Engineer (Junior-Mid)',
    company: 'QuantumFusion Solutions',
    location: 'Pune',
    department: 'Engineering',
    description: 'Support our core infrastructure team in managing CI/CD pipelines and monitoring production health. Great opportunity to learn advanced IaC.',
    employmentType: 'Full Time',
    workArrangement: 'Hybrid',
    experienceRequired: '1-3 Years',
    salaryRange: 'Competitive',
    skills: ['Docker', 'Jenkins', 'Linux', 'AWS Basics', 'Shell Scripting'],
    isActive: true,
    status: 'Active',
    postedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'SAL-001',
    jobId: 'SAL001',
    title: 'Enterprise Account Executive',
    company: 'QuantumFusion Solutions',
    location: 'Bangalore',
    department: 'Sales',
    description: 'Scale our client base by selling custom AI and Cloud transformation solutions to mid-market and enterprise organizations.',
    employmentType: 'Full Time',
    workArrangement: 'Onsite',
    experienceRequired: '5+ Years',
    salaryRange: 'Competitive + Commission',
    skills: ['B2B Sales', 'Tech Solutions', 'Negotiation', 'CRM'],
    isActive: true,
    status: 'Active',
    postedDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ENG-006',
    jobId: 'ENG006',
    title: 'Software Engineer Intern',
    company: 'QuantumFusion Solutions',
    location: 'Remote',
    department: 'Engineering',
    description: 'Learn from high-performance engineers by assisting in the development of our internal AI tools. Requires strong first-principles thinking.',
    employmentType: 'Internship',
    workArrangement: 'Remote',
    experienceRequired: 'Student / Fresher',
    salaryRange: 'Stipend',
    skills: ['DSA', 'Web Basics', 'Problem Solving', 'Curiosity'],
    isActive: true,
    status: 'Active',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
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
We integrated a Retrieval Augmented Generation (RAG) pipeline into the core of AcquisitionOS. This isn't just about indexing text; it's about indexing "intent."

**How it works under the hood:**
1. **Multi-Source Ingestion**: We aggregate signals from various public and private data sources, including social movements, company filings, and news events.
2. **Contextual Indexing**: Instead of basic keyword matching, we use vector embeddings (via Pinecone and OpenAI/Gemini) to understand the "meaning" behind a company's recent activities.
3. **LLM Scoring Engine**: Our custom model analyzes these embeddings to prioritize leads that are most likely to convert *right now*.

### Technology Choice: Why Java & Spring Boot?
While Python is the king of AI, we chose Java with Spring Boot for the backend of AcquisitionOS. 

**Why? Scale and Predictability.**
For a platform that needs to handle high-concurrency data ingestion and mission-critical sales workflows, the strong typing and robust ecosystem of the JVM provided the reliability our enterprise clients demand. We use Python as a microservice for the heavy-lifting AI tasks, connected via secure internal APIs. This "Polyglot Microservices" approach gives us the best of both worlds: the raw power of Java for scaling and the agility of Python for machine learning.

The result is a platform that doesn't just store your leads—it finds them, scores them, and helps you close them.
    `,
    thumbnailUrl: '/images/AI-Driven-Recruitment.png',
    category: 'Product Engineering',
    tags: ['AI', 'CRM', 'SaaS', 'Spring Boot', 'RAG'],
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
Cloud bills are the silent killer of startups. CodeGuard AI was born out of a simple need: knowing exactly how much a Terraform change will cost *before* running \`terraform apply\`.

### Shift-Left Cost Intelligence
Most companies find out about cloud cost spikes when they receive their monthly invoice. That is 30 days too late. CodeGuard AI implements a "Shift-Left" strategy by bringing cost intelligence directly into the developer's IDE.

**Key Technical Features:**
- **Static Analysis Engine**: The extension performs a static analysis of the Infrastructure as Code (IaC) files. It doesn't just look at the code; it parses the HCL/JSON to build a theoretical infrastructure graph.
- **Cost Differential Analysis**: It doesn't just show the cost; it shows the *change* in cost relative to the current state. This delta-based view helps engineers understand the financial impact of their specific commit.
- **Real-Time Recommendation Engine**: If a developer chooses an over-provisioned instance type (e.g., an m5.large where a t3.medium would suffice), the AI suggests a more cost-effective alternative that meets the performance requirements.

### Security Checkpoints
Along with cost, it scans for open S3 buckets, permissive security groups, and unencrypted volumes. By catching these issues in the editor, teams are reducing their infrastructure costs by 15-25% without sacrificing performance. It turns cost management from a finance problem into an engineering habit.
    `,
    thumbnailUrl: '/images/Personalized-Learning.png',
    category: 'Cloud Intelligence',
    tags: ['DevOps', 'AWS', 'Cost Management', 'VS Code', 'Terraform'],
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
My time at Netcore Cloud was invaluable. I learned how to build systems that operate at massive scale—handling millions of events per second. However, I kept seeing the same pattern: businesses were struggling to bridge the gap between their problems and the complex technical solutions being sold to them. I wanted to build a lean agency that prioritized **precision engineering** over bureaucratic processes.

### Milestones of the Journey
1. **The Product Pivot**: We didn't just want to be a services firm. We started by building our own products like AcquisitionOS. This gave us "skin in the game" and forced us to master the very technologies we were recommending to clients.
2. **The First Engagement**: Our work with Maa-Aarogyam Health Centre was a turning point. It proved that a lean, AI-focused team could deliver a high-impact platform that solved real-world health data challenges in record time.
3. **Scaling with AI**: 2024 saw the explosion of Generative AI. We doubled down on AI-native thinking, ensuring every solution we build is designed for an AI-first world.

### The Vision Ahead
QuantumFusion is still in its early chapters. Our mission remains clear: to eliminate the gap between problem and solution. Whether we are building a custom platform for a client or scaling our own SaaS products, we lead with code, not slides.

This journey from HSR Layout to global deployments is just beginning, and I couldn't be more excited about what we're building next.
    `,
    thumbnailUrl: '/images/Prabhat.png',
    category: 'Founders Journal',
    tags: ['Entrepreneurship', 'Growth', 'Story', 'Netcore', 'Bangalore'],
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
