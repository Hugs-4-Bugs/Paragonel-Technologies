export interface Job {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  department: string;
  description: string;
  employmentType: 'Full Time' | 'Part Time' | 'Contract' | 'Internship';
  workArrangement: 'Remote' | 'Onsite' | 'Hybrid';
  experienceRequired: string;
  salaryRange?: string;
  skills: string[];
  status: 'Active' | 'Draft' | 'Archived';
  isActive: boolean;
  postedDate: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: any;
}

export interface JobApplication {
  id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  resumeUrl: string;
  matchScore: number;
  aiReasoning?: string;
  status: 'New' | 'Reviewing' | 'Shortlisted' | 'Interview Scheduled' | 'Rejected' | 'Hired';
  appliedAt: any;
  appliedVia: 'form' | 'ai_agent';
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  author: string;
  thumbnailUrl?: string;
  excerpt: string;
  body: string;
  tags: string[];
  status: 'Published' | 'Draft' | 'Scheduled';
  metaTitle?: string;
  metaDescription?: string;
  publishAt?: any;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  skills?: string[];
  resumeUrl?: string;
  resumeDataUri?: string;
}

export interface ApplicationFormValues {
  fullName: string;
  email: string;
  phone: string;
  resume: FileList;
  highestQualification: string;
  specialization: string;
  university: string;
  passingYear: string;
  marks: string;
  primarySkills: string;
  secondarySkills?: string;
  isFresher: boolean;
  acceptTerms: boolean;
  notifySimilarJobs: boolean;
  jobId: string;
  jobTitle: string;
}
