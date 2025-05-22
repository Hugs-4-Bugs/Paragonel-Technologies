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
