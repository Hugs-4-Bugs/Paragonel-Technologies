
export interface Job {
  id: string; // Firestore Doc ID
  jobId: string; // Custom Unique ID (e.g., ABC123)
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
  postedDate: string; // ISO String
  createdAt: string;
  updatedAt: string;
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
  status: 'Published' | 'Draft';
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
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
