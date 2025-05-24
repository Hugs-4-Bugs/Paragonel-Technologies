
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
  requiredSkills: string[]; // Added for job matching
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

// New type for User Profile data in Firestore
export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  phone?: string;
  skills?: string[]; // Stored as an array of strings
  resumeUrl?: string; // URL to a resume, not the file itself
  appliedJobs?: string[]; // Array of job IDs
  updatedAt?: any; // Firestore Timestamp type, use 'any' for client-side flexibility initially
}
