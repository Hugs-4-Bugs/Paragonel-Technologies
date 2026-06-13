
"use client";

import React, { useState, useMemo } from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Laptop, 
  Zap, 
  Rocket, 
  Search, 
  Hash, 
  Briefcase, 
  Heart, 
  Award, 
  Users, 
  Gem, 
  ChevronDown, 
  ChevronUp, 
  Filter, 
  Loader2 
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from '@/components/ui/label';
import { useCollection } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { JobCard } from '@/components/job-card';
import { ApplyJobModal } from '@/components/apply-job-modal';
import { JobDescriptionModal } from '@/components/job-description-modal';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function CareersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobIdSearch, setJobIdSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('All Types');
  const [dateFilter, setDateFilter] = useState('Any time');
  const [workArrangementFilter, setWorkArrangementFilter] = useState('Any');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<any>(null);
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [selectedJobForDescription, setSelectedJobForDescription] = useState<any>(null);

  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const jobsQuery = useMemo(() => query(
    collection(db, 'jobs'), 
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  ), []);
  const { data: jobs, loading: jobsLoading } = useCollection(jobsQuery);

  const departments = useMemo(() => {
    if (!jobs) return ['All Departments'];
    const depts = new Set(jobs.map((j: any) => j.department));
    return ['All Departments', ...Array.from(depts)].sort();
  }, [jobs]);

  const locations = useMemo(() => {
    if (!jobs) return ['All Locations'];
    const locs = new Set(jobs.map((j: any) => j.location));
    return ['All Locations', ...Array.from(locs)].sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    if (!jobs) return [];
    
    return jobs.filter((job: any) => {
      const matchesSearch = searchTerm === '' || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesJobId = jobIdSearch === '' || job.jobId.toLowerCase().includes(jobIdSearch.toLowerCase());
      const matchesLocation = locationFilter === 'All Locations' || job.location === locationFilter;
      const matchesDept = departmentFilter === 'All Departments' || job.department === departmentFilter;
      const matchesType = employmentTypeFilter === 'All Types' || job.employmentType === employmentTypeFilter;
      
      let matchesArrangement = true;
      if (workArrangementFilter !== 'Any') {
        matchesArrangement = job.workArrangement === workArrangementFilter;
      }

      let matchesDate = true;
      if (dateFilter !== 'Any time') {
        const jobDate = new Date(job.postedDate || job.createdAt);
        const now = new Date();
        const diffHours = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60);
        if (dateFilter === 'Past 24 hours' && diffHours > 24) matchesDate = false;
        if (dateFilter === 'Past week' && diffHours > 168) matchesDate = false;
        if (dateFilter === 'Past month' && diffHours > 720) matchesDate = false;
      }

      return matchesSearch && matchesJobId && matchesLocation && matchesDept && matchesType && matchesArrangement && matchesDate;
    });
  }, [jobs, searchTerm, jobIdSearch, locationFilter, departmentFilter, employmentTypeFilter, dateFilter, workArrangementFilter]);

  const handleApply = (job: any) => {
    if (!isAuthenticated) {
      localStorage.setItem('pendingApplyJobId', job.id);
      router.push('/auth/login');
    } else {
      setSelectedJobForApplication(job);
      setIsApplyModalOpen(true);
    }
  };

  const handleView = (job: any) => {
    setSelectedJobForDescription(job);
    setIsDescriptionModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setJobIdSearch('');
    setLocationFilter('All Locations');
    setDepartmentFilter('All Departments');
    setEmploymentTypeFilter('All Types');
    setDateFilter('Any time');
    setWorkArrangementFilter('Any');
  };

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden animated-gradient-background text-white">
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="container relative z-10 px-4 md:px-6 text-center">
          <ScrollFadeIn>
            <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Careers at <br/>QuantumFusion</h1>
            <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 font-medium">Build AI-native products. Solve real challenges. No bureaucracy.</p>
          </ScrollFadeIn>
        </div>
      </section>

      {/* Dynamic Roles Header & Filter Toggle */}
      <section className="bg-zinc-50 dark:bg-zinc-900/40 border-b sticky top-20 z-20 shadow-sm" id="open-roles">
        <div className="container mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            Open Roles 
            <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none">
              {jobsLoading ? '...' : filteredJobs.length}
            </Badge>
          </h2>
          <div className="flex items-center gap-3">
            {(searchTerm || jobIdSearch || locationFilter !== 'All Locations' || departmentFilter !== 'All Departments') && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs font-bold text-muted-foreground hover:text-primary">
                Clear All
              </Button>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={cn("rounded-full px-5 font-bold transition-all", isFilterOpen && "bg-primary text-white border-primary")}
            >
              {isFilterOpen ? <ChevronUp className="mr-2 h-4 w-4" /> : <Filter className="mr-2 h-4 w-4" />}
              {isFilterOpen ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </div>

        {/* Collapsible Filter Panel */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out bg-white dark:bg-zinc-900 border-b",
          isFilterOpen ? "max-h-[800px] opacity-100 py-8" : "max-h-0 opacity-0 py-0"
        )}>
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Search Jobs</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input placeholder="Keywords (e.g., AI, Python)" className="pl-9 h-11 rounded-xl bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Filter by Job ID</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input placeholder="Job ID (e.g., ABC123)" className="pl-9 h-11 rounded-xl bg-background" value={jobIdSearch} onChange={(e) => setJobIdSearch(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="h-11 rounded-xl bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {locations.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="h-11 rounded-xl bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Filter by Date</Label>
                <RadioGroup value={dateFilter} onValueChange={setDateFilter} className="flex flex-wrap gap-x-6 gap-y-2">
                  {['Any time', 'Past month', 'Past week', 'Past 24 hours'].map(opt => (
                    <div key={opt} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`date-${opt}`} />
                      <Label htmlFor={`date-${opt}`} className="text-xs font-medium cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Employment Type</Label>
                <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                  <SelectTrigger className="h-10 rounded-xl bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['All Types', 'Full Time', 'Part Time', 'Contract', 'Internship'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Work Arrangement</Label>
                <RadioGroup value={workArrangementFilter} onValueChange={setWorkArrangementFilter} className="flex space-x-6">
                   {['Any', 'Remote', 'Onsite'].map(opt => (
                    <div key={opt} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`arr-${opt}`} />
                      <Label htmlFor={`arr-${opt}`} className="text-xs font-medium cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Jobs Listing Section */}
      <section className="section-padding bg-background min-h-[500px]">
        <div className="container mx-auto px-4 md:px-6">
          {jobsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-2xl" />)}
            </div>
          ) : filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredJobs.map((job: any) => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onApplyNowClick={() => handleApply(job)} 
                  onViewDetailsClick={() => handleView(job)} 
                />
              ))}
            </div>
          ) : (
            <ScrollFadeIn className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 border rounded-[2.5rem]">
              <Rocket className="h-16 w-16 text-primary/20 mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-2">No matching openings right now</h3>
              <p className="text-muted-foreground mb-8">Adjust your filters or drop your resume at careers@quantumfusion.in</p>
              <Button variant="outline" className="rounded-full px-8" onClick={clearFilters}>Clear All Filters</Button>
            </ScrollFadeIn>
          )}
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="section-padding bg-zinc-50 dark:bg-zinc-900/20 border-y">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
             <h2 className="text-3xl md:text-4xl font-black">Why Join QuantumFusion?</h2>
             <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">We aren't just another IT firm. We are a product-first AI company building the future of work.</p>
          </ScrollFadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Interesting Problems", text: "Work on cutting-edge AI, cloud, and real client challenges.", icon: Brain },
              { title: "Remote-First", text: "Work from anywhere in India with our Bangalore hub.", icon: Laptop },
              { title: "Learn by Shipping", text: "We build real products, not just maintenance code.", icon: Zap },
              { title: "Zero Bureaucracy", text: "Direct access to founders and rapid execution.", icon: Rocket }
            ].map((card, i) => (
              <div key={i} className="p-8 rounded-3xl border bg-card hover:shadow-xl transition-all group">
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <card.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-bold text-lg mb-2">{card.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits & Perks Section */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6">
           <ScrollFadeIn className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-black">Benefits & Perks</h2>
              <p className="text-muted-foreground mt-4">We take care of our own. More than just a paycheck.</p>
           </ScrollFadeIn>
           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Health Insurance", icon: Heart, text: "Comprehensive family health plans." },
                { title: "Learning Budget", icon: Award, text: "Annual stipend for courses and conferences." },
                { title: "Flexible Leave", icon: Zap, text: "Generous PTO and wellness breaks." },
                { title: "Equity Options", icon: Gem, text: "Be a real owner of QuantumFusion." },
                { title: "Annual Offsites", icon: Users, text: "Meet the team in exotic locations." },
                { title: "Gadget Stipend", icon: Laptop, text: "Get the latest tech to do your best work." }
              ].map((perk, i) => (
                <div key={i} className="flex gap-4 p-6 bg-background rounded-3xl border shadow-sm hover:border-primary/50 transition-colors">
                   <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <perk.icon className="h-5 w-5 text-primary" />
                   </div>
                   <div>
                      <h5 className="font-bold mb-1">{perk.title}</h5>
                      <p className="text-xs text-muted-foreground">{perk.text}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="section-padding bg-zinc-50 dark:bg-zinc-900/40 border-t">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black">Our Application Process</h2>
          </ScrollFadeIn>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: "Apply Online", text: "Submit your details via form or QuantumAI." },
              { title: "Review", text: "Resume screening within 48 hours." },
              { title: "Practical", text: "A real-world technical discussion." },
              { title: "Onboarding", text: "Offer and welcome to the team." }
            ].map((step, i) => (
              <div key={i} className="p-8 bg-background rounded-3xl border border-dashed border-primary/20 hover:border-primary transition-colors">
                <span className="text-primary font-black text-3xl mb-4 block opacity-50">0{i+1}</span>
                <h4 className="font-bold text-lg mb-2">{step.title}</h4>
                <p className="text-sm text-muted-foreground">{step.text}</p>
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
