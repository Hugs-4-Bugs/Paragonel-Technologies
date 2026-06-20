
"use client";

import React, { useState, useMemo } from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  ChevronUp, 
  ChevronDown,
  Filter,
  Search,
  MapPin,
  Clock,
  Building,
  Hash,
  Monitor,
  Laptop,
  ArrowRight,
  Sparkles,
  Trophy,
  Globe,
  GraduationCap,
  Heart
} from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { JobCard } from '@/components/job-card';
import { ApplyJobModal } from '@/components/apply-job-modal';
import { JobDescriptionModal } from '@/components/job-description-modal';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { dummyJobs } from '@/lib/data';

const employmentTypes = ['All Types', 'Full Time', 'Part Time', 'Contract', 'Internship'];
const workArrangements = ['Any', 'Remote', 'Onsite'];

export default function CareersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobIdSearch, setJobIdSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('All Types');
  const [dateFilter, setDateFilter] = useState('Any time');
  const [workArrangementFilter, setWorkArrangementFilter] = useState('Any');
  const [showOpenRoles, setShowOpenRoles] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<any>(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [selectedJobForDescription, setSelectedJobForDescription] = useState<any>(null);

  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const jobsQuery = useMemo(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'jobs'), 
      where('isActive', '==', true),
      where('deletedAt', '==', null),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: dynamicJobs, loading } = useCollection(jobsQuery);

  const allJobs = useMemo(() => {
    const combined = [...dummyJobs, ...(dynamicJobs || [])];
    const unique = Array.from(new Map(combined.map(item => [item.jobId || item.id, item])).values());
    return unique;
  }, [dynamicJobs]);

  const departments = useMemo(() => {
    const depts = new Set(allJobs.map(j => j.department));
    return ['All Departments', ...Array.from(depts)].sort();
  }, [allJobs]);

  const locations = useMemo(() => {
    const locs = new Set(allJobs.map(j => j.location));
    return ['All Locations', ...Array.from(locs)].sort();
  }, [allJobs]);

  const filteredJobs = useMemo(() => {
    if (!showOpenRoles) return [];

    let filtered = allJobs.filter(job => {
      const matchesSearchTerm = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills?.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesJobId = jobIdSearch === '' || (job.jobId || job.id).toLowerCase().includes(jobIdSearch.toLowerCase());
      
      const matchesLocation = locationFilter === 'All Locations' || job.location === locationFilter;
      const matchesDepartment = departmentFilter === 'All Departments' || job.department === departmentFilter;
      const matchesEmploymentType = employmentTypeFilter === 'All Types' || job.employmentType === employmentTypeFilter;

      let matchesWorkArrangement = true;
      if (workArrangementFilter === 'Remote') {
        matchesWorkArrangement = job.location.toLowerCase().includes('remote') || job.workArrangement === 'Remote';
      } else if (workArrangementFilter === 'Onsite') {
        matchesWorkArrangement = !job.location.toLowerCase().includes('remote') && job.workArrangement !== 'Remote';
      }

      return matchesSearchTerm && matchesJobId && matchesLocation && matchesDepartment && matchesEmploymentType && matchesWorkArrangement;
    });

    if (dateFilter !== 'Any time') {
      const now = new Date();
      let cutoffDate = new Date(now);
      if (dateFilter === 'Past month') cutoffDate.setMonth(now.getMonth() - 1);
      if (dateFilter === 'Past week') cutoffDate.setDate(now.getDate() - 7);
      if (dateFilter === 'Past 24 hours') cutoffDate.setHours(now.getHours() - 24);
      
      filtered = filtered.filter(job => new Date(job.createdAt || job.postedDate) >= cutoffDate);
    }
    return filtered;
  }, [allJobs, searchTerm, jobIdSearch, locationFilter, departmentFilter, employmentTypeFilter, workArrangementFilter, dateFilter, showOpenRoles]);

  const handleApply = (job: any) => {
    if (!isAuthenticated) {
      localStorage.setItem('pendingApplyJobId', job.id);
      localStorage.setItem('actionAfterLogin', 'applyJobModalOpen');
      router.push('/auth/login?redirect=/careers');
    } else {
      setSelectedJobForApplication(job);
      setIsApplyModalOpen(true);
    }
  };

  const handleView = (job: any) => {
    setSelectedJobForDescription(job);
    setIsDescriptionModalOpen(true);
  };

  return (
    <div className="bg-[#1a1b3a] min-h-screen text-white">
      <section className="pt-20 pb-12 text-center px-4">
        <ScrollFadeIn>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight">
            Join <span className="text-[#4da3ff]">QuantumFusion Solutions</span>
          </h1>
          <p className="text-zinc-300 text-lg md:text-xl max-w-2xl mx-auto mb-10">
            We are pioneering the future of technology. Explore exciting opportunities and grow with our innovative team.
          </p>
          <div className="flex items-center justify-center flex-wrap gap-4">
            <Button 
              onClick={() => setShowOpenRoles(!showOpenRoles)}
              className="rounded-full bg-[#8e44ad] hover:bg-[#7d3c98] px-8 h-14 text-lg font-bold gap-3"
            >
              {showOpenRoles ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              {showOpenRoles ? 'Hide Open Roles' : 'See Open Roles'}
              <Briefcase className="h-5 w-5" />
            </Button>
            
            {showOpenRoles && (
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline"
                className="rounded-full border-[#4da3ff]/50 text-[#4da3ff] hover:bg-[#4da3ff]/10 px-8 h-14 text-lg font-bold gap-3"
              >
                <Filter className="h-5 w-5" />
                {showFilters ? 'Hide Filters' : 'Filter Roles'}
              </Button>
            )}
          </div>
        </ScrollFadeIn>
      </section>

      {showOpenRoles && showFilters && (
        <section className="container mx-auto px-4 md:px-6 mb-16 animate-in slide-in-from-top duration-500">
          <ScrollFadeIn className="bg-[#2a2b5a] p-8 rounded-[2rem] shadow-2xl border border-white/5 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Search Jobs</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input 
                    placeholder="Keywords (e.g., AI, Python)" 
                    className="pl-10 bg-[#1a1b3a] border-none h-12 rounded-xl text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-[#4da3ff]" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Filter by Job ID</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input 
                    placeholder="Enter Job ID (e.g., ABC123)" 
                    className="pl-10 bg-[#1a1b3a] border-none h-12 rounded-xl text-white placeholder:text-zinc-600 uppercase font-mono" 
                    value={jobIdSearch}
                    onChange={(e) => setJobIdSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="bg-[#1a1b3a] border-none h-12 rounded-xl text-white">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2b5a] text-white border-zinc-700">
                    {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="bg-[#1a1b3a] border-none h-12 rounded-xl text-white">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2b5a] text-white border-zinc-700">
                    {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8 border-t border-white/5">
              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Filter by Date</Label>
                <RadioGroup value={dateFilter} onValueChange={setDateFilter} className="flex flex-wrap gap-x-6 gap-y-3">
                  {['Any time', 'Past month', 'Past week', 'Past 24 hours'].map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`date-${opt}`} className="border-zinc-600 text-[#4da3ff]" />
                      <Label htmlFor={`date-${opt}`} className="text-sm font-bold text-zinc-300 cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Employment Type</Label>
                <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                  <SelectTrigger className="bg-[#1a1b3a] border-none h-12 rounded-xl text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2b5a] text-white border-zinc-700">
                    {employmentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Work Arrangement</Label>
                <RadioGroup value={workArrangementFilter} onValueChange={setWorkArrangementFilter} className="flex gap-8">
                  {workArrangements.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem value={type} id={`arr-${type}`} className="border-zinc-600 text-[#4da3ff]" />
                      <Label htmlFor={`arr-${type}`} className="text-sm font-bold text-zinc-300 flex items-center cursor-pointer gap-2">
                        {type === 'Remote' && <Laptop className="h-4 w-4 text-[#4da3ff]" />}
                        {type === 'Onsite' && <Building className="h-4 w-4 text-[#4da3ff]" />}
                        {type}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </ScrollFadeIn>
        </section>
      )}

      {showOpenRoles && (
        <section className="container mx-auto px-4 md:px-6 pb-24">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-64 rounded-[2rem] bg-[#2a2b5a]" />)}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredJobs.map((job: any) => (
                <JobCard 
                  key={job.jobId || job.id} 
                  job={job} 
                  onApplyNowClick={() => handleApply(job)} 
                  onViewDetailsClick={() => handleView(job)} 
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#2a2b5a]/50 rounded-[3rem] border-2 border-dashed border-white/5">
              <Filter className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
              <p className="text-xl font-bold text-zinc-400">No matching roles found.</p>
              <Button variant="link" onClick={() => {
                setSearchTerm(''); setJobIdSearch(''); setLocationFilter('All Locations'); 
                setDepartmentFilter('All Departments'); setEmploymentTypeFilter('All Types');
                setWorkArrangementFilter('Any'); setDateFilter('Any time');
              }} className="text-[#4da3ff]">Reset all filters</Button>
            </div>
          )}
        </section>
      )}

      <section className="py-24 bg-[#14152e] border-y border-white/5">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Why Join QuantumFusion?</h2>
            <p className="text-zinc-400">We aren't just another IT firm. We are a product-first AI company building the future of work.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Interesting Problems", text: "Work on cutting-edge AI, cloud, and real client challenges.", icon: Sparkles },
              { title: "Remote-First", text: "Work from anywhere in India with our Bangalore hub.", icon: Laptop },
              { title: "Learn by Shipping", text: "We build real products, not just maintenance code.", icon: Briefcase },
              { title: "Zero Bureaucracy", text: "Direct access to founders and rapid execution.", icon: Globe }
            ].map((item, i) => (
              <div key={i} className="p-8 rounded-[2rem] bg-[#1a1b3a] border border-white/5 hover:border-[#4da3ff]/30 transition-colors">
                <item.icon className="h-10 w-10 text-[#4da3ff] mb-6" />
                <h4 className="text-xl font-bold mb-3">{item.title}</h4>
                <p className="text-sm text-zinc-500 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black mb-4">Benefits & Perks</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { title: "Health Insurance", text: "Comprehensive family health plans.", icon: Heart },
              { title: "Learning Budget", text: "Annual stipend for courses and conferences.", icon: GraduationCap },
              { title: "Flexible Leave", text: "Generous PTO and wellness breaks.", icon: Clock },
              { title: "Equity Options", text: "Be a real owner of QuantumFusion.", icon: Trophy },
              { title: "Annual Offsites", text: "Meet the team in exotic locations.", icon: Monitor },
              { title: "Gadget Stipend", text: "Get the latest tech to do your best work.", icon: Building }
            ].map((perk, i) => (
              <div key={i} className="flex items-start gap-5">
                <div className="h-12 w-12 bg-[#4da3ff]/10 rounded-2xl flex items-center justify-center shrink-0">
                  <perk.icon className="h-6 w-6 text-[#4da3ff]" />
                </div>
                <div>
                  <h4 className="text-lg font-bold mb-1">{perk.title}</h4>
                  <p className="text-zinc-500 text-sm">{perk.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ApplyJobModal isOpen={isApplyModalOpen} onOpenChange={setIsApplyModalOpen} job={selectedJobForApplication} />
      <JobDescriptionModal isOpen={isDescriptionModalOpen} onOpenChange={setIsDescriptionModalOpen} job={selectedJobForDescription} />
    </div>
  );
}
