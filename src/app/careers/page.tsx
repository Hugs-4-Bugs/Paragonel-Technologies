
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
  Briefcase, 
  Heart, 
  Award, 
  Users, 
  Gem, 
  ChevronUp, 
  Filter 
} from 'lucide-react';
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
import { dummyJobs as baseJobs } from '@/lib/data';

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

  const jobsQuery = useMemo(() => query(
    collection(db, 'jobs'), 
    where('isActive', '==', true),
    orderBy('createdAt', 'desc')
  ), []);
  const { data: dynamicJobs, loading: jobsLoading } = useCollection(jobsQuery);

  const allJobs = useMemo(() => {
    return [...baseJobs, ...(dynamicJobs || [])];
  }, [dynamicJobs]);

  const filteredJobs = useMemo(() => {
    return allJobs.filter((job: any) => {
      const matchesSearch = searchTerm === '' || 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.skills.some((s: string) => s.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesJobId = jobIdSearch === '' || (job.jobId || job.id).toLowerCase().includes(jobIdSearch.toLowerCase());
      const matchesLocation = locationFilter === 'All Locations' || job.location === locationFilter;
      const matchesDept = departmentFilter === 'All Departments' || job.department === departmentFilter;
      const matchesType = employmentTypeFilter === 'All Types' || job.employmentType === employmentTypeFilter;
      
      let matchesArrangement = true;
      if (workArrangementFilter !== 'Any') {
        matchesArrangement = job.workArrangement === workArrangementFilter;
      }

      return matchesSearch && matchesJobId && matchesLocation && matchesDept && matchesType && matchesArrangement;
    });
  }, [allJobs, searchTerm, jobIdSearch, locationFilter, departmentFilter, employmentTypeFilter, workArrangementFilter]);

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

  return (
    <>
      <title>Careers | QuantumFusion Solutions</title>
      <meta name="description" content="Join QuantumFusion Solutions. Build AI-native products and solve real challenges in cloud and automation." />
      <div className="bg-background min-h-screen">
        <section className="relative h-[300px] md:h-[400px] flex items-center justify-center overflow-hidden animated-gradient-background text-white">
          <div className="absolute inset-0 bg-black/40 z-0"></div>
          <div className="container relative z-10 px-4 md:px-6 text-center">
            <ScrollFadeIn>
              <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">Careers at <br/>QuantumFusion Solutions</h1>
              <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 font-medium">Build AI-native products. Solve real challenges. No bureaucracy.</p>
            </ScrollFadeIn>
          </div>
        </section>

        <section className="bg-zinc-50 dark:bg-zinc-900/40 border-b sticky top-20 z-20 shadow-sm">
          <div className="container mx-auto px-4 md:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Briefcase className="h-6 w-6 text-primary" />
              Open Positions
              <Badge variant="secondary" className="ml-2 bg-primary/10 text-primary border-none">
                {filteredJobs.length}
              </Badge>
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowOpenRoles(!showOpenRoles)}
              className={cn("rounded-full px-5 font-bold transition-all", showOpenRoles && "bg-primary text-white border-primary")}
            >
              {showOpenRoles ? <ChevronUp className="mr-2 h-4 w-4" /> : <Filter className="mr-2 h-4 w-4" />}
              {showOpenRoles ? 'Hide Roles' : 'See Roles'}
            </Button>
          </div>
        </section>

        {showOpenRoles && (
          <section className="section-padding bg-background">
            <div className="container mx-auto px-4 md:px-6">
              {jobsLoading && !allJobs.length ? (
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
                <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900 border rounded-[2.5rem]">
                  <Rocket className="h-16 w-16 text-primary/20 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold mb-2">No active openings right now</h3>
                  <p className="text-muted-foreground">Drop your resume at careers@quantumfusion.in</p>
                </div>
              )}
            </div>
          </section>
        )}

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

        <section className="section-padding bg-background">
          <div className="container mx-auto px-4 md:px-6">
             <ScrollFadeIn className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-black">Benefits & Perks</h2>
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

        <ApplyJobModal isOpen={isApplyModalOpen} onOpenChange={setIsApplyModalOpen} job={selectedJobForApplication} />
        <JobDescriptionModal isOpen={isDescriptionModalOpen} onOpenChange={setIsDescriptionModalOpen} job={selectedJobForDescription} />
      </div>
    </>
  );
}
