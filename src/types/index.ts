
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
