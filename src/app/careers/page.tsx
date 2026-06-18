
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Laptop, 
  Zap, 
  Rocket, 
  Briefcase, 
  Heart, 
  Award, 
  Users, 
  Gem, 
  ChevronUp, 
  Filter,
  Search,
  MapPin,
  Clock,
  Building,
  Hash,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Trophy,
  Globe,
  Monitor
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
    // Filter out duplicates if a dummy job was seeded to Firestore
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
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[300px] md:h-[450px] flex items-center justify-center overflow-hidden animated-gradient-background text-white">
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="container relative z-10 px-4 md:px-6 text-center">
          <ScrollFadeIn>
            <h1 className="text-4xl md:text-7xl font-black mb-4 tracking-tighter">Careers at <span className="text-primary">QuantumFusion</span></h1>
            <p className="text-lg md:text-2xl max-w-3xl mx-auto opacity-90 font-medium leading-relaxed">
              We're looking for first-principles thinkers who want to build the future of AI-native software.
            </p>
          </ScrollFadeIn>
        </div>
      </section>

      {/* Advanced Filter Section */}
      <section className="bg-zinc-50 dark:bg-zinc-900/40 border-b sticky top-20 z-20 shadow-sm backdrop-blur-md">
        <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 flex-1">
              <div className="space-y-2">
                <Label htmlFor="search" className="text-xs font-black uppercase tracking-widest text-zinc-400">Search Roles</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input 
                    id="search"
                    placeholder="Keywords (e.g. AI, Python)" 
                    className="pl-10 h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-background"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobId" className="text-xs font-black uppercase tracking-widest text-zinc-400">Job ID</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input 
                    id="jobId"
                    placeholder="ABC123" 
                    className="pl-10 h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-background uppercase font-mono"
                    value={jobIdSearch}
                    onChange={(e) => setJobIdSearch(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs font-black uppercase tracking-widest text-zinc-400">Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger id="location" className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-background">
                    <SelectValue placeholder="All Locations" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department" className="text-xs font-black uppercase tracking-widest text-zinc-400">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger id="department" className="h-12 rounded-xl border-zinc-200 dark:border-zinc-800 bg-background">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              variant="outline" 
              size="lg" 
              onClick={() => setShowOpenRoles(!showOpenRoles)}
              className={cn("h-12 rounded-xl px-8 font-black transition-all border-2", showOpenRoles && "bg-primary text-white border-primary")}
            >
              {showOpenRoles ? <ChevronUp className="mr-2 h-5 w-5" /> : <Filter className="mr-2 h-5 w-5" />}
              {showOpenRoles ? 'Hide Roles' : 'Explore Open Roles'}
            </Button>
          </div>

          {showOpenRoles && (
            <ScrollFadeIn className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Employment Type</Label>
                <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                  <SelectTrigger className="h-10 rounded-lg border-zinc-200 dark:border-zinc-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Date Posted</Label>
                <RadioGroup value={dateFilter} onValueChange={setDateFilter} className="flex flex-wrap gap-4">
                  {['Any time', 'Past month', 'Past week', 'Past 24 hours'].map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`date-${opt}`} />
                      <Label htmlFor={`date-${opt}`} className="font-bold text-sm cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-zinc-400">Work Arrangement</Label>
                <RadioGroup value={workArrangementFilter} onValueChange={setWorkArrangementFilter} className="flex gap-4">
                  {workArrangements.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem value={type} id={`arr-${type}`} />
                      <Label htmlFor={`arr-${type}`} className="font-bold text-sm flex items-center cursor-pointer">
                        {type === 'Remote' && <Laptop className="mr-1.5 h-3.5 w-3.5 text-primary" />}
                        {type === 'Onsite' && <Building className="mr-1.5 h-3.5 w-3.5 text-primary" />}
                        {type}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </ScrollFadeIn>
          )}
        </div>
      </section>

      {/* Open Roles Listing */}
      {showOpenRoles && (
        <section className="section-padding bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <ScrollFadeIn className="mb-10 flex items-center justify-between">
               <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                 <Briefcase className="h-6 w-6 text-primary" />
                 Found {filteredJobs.length} Opportunities
               </h2>
               {filteredJobs.length > 0 && (
                 <Button variant="ghost" onClick={() => {
                   setSearchTerm(''); setJobIdSearch(''); setLocationFilter('All Locations'); setDepartmentFilter('All Departments'); setEmploymentTypeFilter('All Types'); setWorkArrangementFilter('Any'); setDateFilter('Any time');
                 }} className="text-primary font-bold text-xs uppercase tracking-widest">
                   Reset Filters
                 </Button>
               )}
            </ScrollFadeIn>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-3xl" />)}
              </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
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
              <div className="text-center py-32 bg-zinc-50 dark:bg-zinc-900 border rounded-[3rem] shadow-inner max-w-4xl mx-auto">
                <Rocket className="h-20 w-20 text-primary/20 mx-auto mb-8 animate-pulse" />
                <h3 className="text-3xl font-black mb-4">No matching roles right now</h3>
                <p className="text-zinc-500 text-lg max-w-md mx-auto mb-10">We update our roles daily. Drop your resume anyway at <span className="text-primary font-bold">careers@quantumfusion.in</span></p>
                <Button variant="outline" className="rounded-full px-8 h-12 font-bold" onClick={() => setSearchTerm('')}>Browse All Roles</Button>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Why Join Section */}
      <section className="section-padding bg-zinc-50 dark:bg-zinc-900/20 border-y relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-5 pointer-events-none"><Sparkles className="h-64 w-64 text-primary" /></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <ScrollFadeIn className="text-center mb-20">
             <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">The Mission</span>
             <h2 className="text-4xl md:text-6xl font-black tracking-tight">Why Join <span className="text-primary">QuantumFusion?</span></h2>
             <p className="text-zinc-500 text-xl mt-6 max-w-3xl mx-auto leading-relaxed font-medium">
               We aren't just another IT firm. We are a product-first AI company building the future of work.
             </p>
          </ScrollFadeIn>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {[
              { title: "Interesting Problems", text: "Work on cutting-edge AI, cloud, and real client challenges that actually matter.", icon: Brain },
              { title: "Remote-First", text: "Work from anywhere in India with our Bangalore hub as your engineering anchor.", icon: Laptop },
              { title: "Learn by Shipping", text: "We build real products, not just maintenance code. Ship features every single week.", icon: Zap },
              { title: "Zero Bureaucracy", text: "Direct access to founders and rapid execution cycles. Your voice is always heard.", icon: Rocket }
            ].map((card, i) => (
              <ScrollFadeIn key={i} delay={`${i * 100}ms`} className="p-10 rounded-[3rem] border border-zinc-200 dark:border-zinc-800 bg-card hover:shadow-2xl transition-all duration-500 group relative">
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity"><ArrowRight className="h-6 w-6 text-primary/20" /></div>
                <div className="h-16 w-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary transition-all duration-500">
                  <card.icon className="h-8 w-8 text-primary group-hover:text-white transition-colors" />
                </div>
                <h4 className="font-black text-2xl mb-4 tracking-tight">{card.title}</h4>
                <p className="text-zinc-500 leading-relaxed font-medium">{card.text}</p>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits & Perks */}
      <section className="section-padding bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-20">
             <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">The Value</span>
             <h2 className="text-4xl md:text-6xl font-black tracking-tight">Benefits & <span className="text-primary">Perks</span></h2>
             <p className="text-zinc-500 text-xl mt-6 max-w-2xl mx-auto font-medium leading-relaxed">
               We take care of our innovators. Competitive compensation is just the beginning.
             </p>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
             {[
               { title: "Health Insurance", text: "Comprehensive family health plans covering you and your loved ones.", icon: Heart },
               { title: "Learning Budget", text: "Annual stipend for courses, certifications, and international conferences.", icon: GraduationCap },
               { title: "Flexible Leave", text: "Generous PTO and mental wellness breaks to ensure you stay sharp.", icon: Clock },
               { title: "Equity Options", text: "Be a real owner of QuantumFusion and share in our collective success.", icon: Trophy },
               { title: "Annual Offsites", text: "Meet the entire team in exotic locations to bond and brainstorm.", icon: Globe },
               { title: "Gadget Stipend", text: "Get the latest Apple/Windows tech to do your absolute best work.", icon: Monitor }
             ].map((perk, i) => (
               <ScrollFadeIn key={i} delay={`${i * 100}ms`} className="flex items-start gap-6 p-8 rounded-[2rem] hover:bg-secondary/10 transition-colors border border-transparent hover:border-primary/10">
                  <div className="h-12 w-12 bg-primary/5 rounded-2xl flex items-center justify-center shrink-0">
                    <perk.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-black text-lg mb-1 tracking-tight">{perk.title}</h4>
                    <p className="text-zinc-500 text-sm leading-relaxed font-medium">{perk.text}</p>
                  </div>
               </ScrollFadeIn>
             ))}
          </div>
        </div>
      </section>

      {/* Culture CTA */}
      <section className="section-padding bg-secondary/10 mb-20 rounded-[4rem] container mx-auto max-w-6xl relative overflow-hidden group">
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 bg-primary/5 rounded-full blur-[100px]"></div>
        <ScrollFadeIn className="text-center relative z-10 p-10 md:p-20">
          <Trophy className="h-20 w-20 text-primary/20 mx-auto mb-10" />
          <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">Build the Future With Us</h2>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            We are a lean, focused group of high-performance engineers. If you are a first-principles thinker, we want to talk.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
             <Button size="lg" className="rounded-full px-12 h-16 text-lg font-black shadow-2xl hover:scale-105 transition-transform" onClick={() => setShowOpenRoles(true)}>
               See Open Positions
             </Button>
             <Button variant="outline" size="lg" className="rounded-full px-12 h-16 text-lg font-black border-2" asChild>
                <a href="mailto:careers@quantumfusion.in">Talk to Founders</a>
             </Button>
          </div>
        </ScrollFadeIn>
      </section>

      <ApplyJobModal isOpen={isApplyModalOpen} onOpenChange={setIsApplyModalOpen} job={selectedJobForApplication} />
      <JobDescriptionModal isOpen={isDescriptionModalOpen} onOpenChange={setIsDescriptionModalOpen} job={selectedJobForDescription} />
    </div>
  );
}
