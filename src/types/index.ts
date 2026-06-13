
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
  deadline?: string;
  isActive: boolean;
  status: 'Active' | 'Draft';
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
  skills?: string[];
  experienceYears?: number;
  resumeUrl: string;
  status: 'New' | 'Reviewing' | 'Shortlisted' | 'Interview Scheduled' | 'Rejected' | 'Hired';
  internalNotes?: string;
  appliedAt: any;
  appliedVia: 'form' | 'ai';
  deletedAt?: any;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  company?: string;
  message: string;
  source: string;
  status: 'New' | 'Contacted' | 'Qualified' | 'Closed';
  internalNotes?: string;
  createdAt: any;
  deletedAt?: any;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  source: string;
  subscribedAt: any;
}

export interface AuditLog {
  id: string;
  adminEmail: string;
  action: string;
  resourceType: string;
  resourceId: string;
  ipAddress?: string;
  timestamp: any;
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
  ogImageUrl?: string;
  canonicalUrl?: string;
  focusKeyword?: string;
  publishAt?: any;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: any;
}

export interface ApplicationFormValues {
  fullName: string;
  email: string;
  phone: string;
  resume: FileList;
  linkedinProfile?: string;
  portfolioWebsite?: string;
  codingProfileUrl?: string; 
  highestQualification: string;
  specialization: string;
  university: string;
  passingYear: string;
  marks: string;
  primarySkills: string;
  secondarySkills?: string;
  isFresher: boolean;
  companyName?: string;
  jobTitleExperience?: string;
  fromDate?: string;
  toDate?: string;
  isCurrentlyWorking?: boolean;
  jobDescription?: string;
  coverLetter?: string;
  preferredJobLocation: string;
  currentCTC?: string;
  expectedSalary: string;
  noticePeriod: string;
  acceptTerms: boolean;
  notifySimilarJobs: boolean;
  jobId: string;
  jobTitle: string;
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  skills?: string[];
  resumeUrl?: string;
  appliedJobs?: string[];
  updatedAt?: any;
}
