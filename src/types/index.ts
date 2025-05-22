
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  department: string;
  description: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Internship';
  salaryRange?: string;
  postedDate: string; // ISO string format for date
  companyLogoUrl?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  content?: string; // Full content for detail page
  imageUrl: string;
  aiHint: string;
  category: string;
  comments: number;
  slug: string;
}

export interface ApplicationFormValues {
  fullName: string;
  email: string;
  phone: string;
  resume: FileList;
  linkedinProfile?: string;
  portfolioWebsite?: string;

  highestQualification: string;
  specialization: string;
  university: string;
  passingYear: string;
  marks: string;

  primarySkills: string;
  secondarySkills?: string;

  isFresher: boolean;
  // For simplicity, capturing one work experience block. Can be array for multiple.
  companyName?: string;
  jobTitleExperience?: string; // Renamed to avoid conflict with job.title
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

  // Hidden fields
  jobId: string;
  jobTitle: string; // Job title being applied for
}
