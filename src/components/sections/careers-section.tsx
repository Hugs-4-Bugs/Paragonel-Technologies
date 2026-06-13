"use client";

import React, { useState, useMemo } from 'react';
import type { Job } from '@/types';
import { JobCard } from '@/components/job-card';
import { ApplyJobModal } from '@/components/apply-job-modal';
import { JobDescriptionModal } from '@/components/job-description-modal';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Briefcase, ChevronDown, ChevronUp, Laptop, Building } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

interface CareersSectionProps {
  initialJobs: any[];
}

const employmentTypes = ['All Types', 'Full Time', 'Part Time', 'Contract', 'Internship'];
const workArrangements = ['Any', 'Remote', 'Onsite'];

export function CareersSection({ initialJobs }: CareersSectionProps) { 
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('All Types');
  const [dateFilter, setDateFilter] = useState('Any time');
  const [workArrangementFilter, setWorkArrangementFilter] = useState('Any');
  const [showOpenRoles, setShowOpenRoles] = useState(true); 

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<Job | null>(null);

  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [selectedJobForDescription, setSelectedJobForDescription] = useState<Job | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const departments = useMemo(() => {
    const depts = new Set(initialJobs.map(j => j.department));
    return ['All Departments', ...Array.from(depts)].sort();
  }, [initialJobs]);

  const locations = useMemo(() => {
    const locs = new Set(initialJobs.map(j => j.location));
    return ['All Locations', ...Array.from(locs)].sort();
  }, [initialJobs]);

  const handleApplyNowClick = (job: Job) => {
    if (authLoading) return; 

    if (!isAuthenticated) {
      localStorage.setItem('pendingApplyJobId', job.id); 
      localStorage.setItem('actionAfterLogin', 'applyJobModalOpen'); 
      router.push('/auth/login');
    } else {
      setSelectedJobForApplication(job);
      setIsApplyModalOpen(true);
    }
  };

  const handleViewDetailsClick = (job: Job) => {
    setSelectedJobForDescription(job);
    setIsDescriptionModalOpen(true);
  };

  const filteredJobs = useMemo(() => {
    if (!showOpenRoles) return [];

    let filtered = initialJobs.filter(job => {
      const matchesSearchTerm = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = locationFilter === 'All Locations' || job.location === locationFilter;
      const matchesDepartment = departmentFilter === 'All Departments' || job.department === departmentFilter;
      const matchesEmploymentType = employmentTypeFilter === 'All Types' || job.employmentType === employmentTypeFilter;

      let matchesWorkArrangement = true;
      if (workArrangementFilter === 'Remote') {
        matchesWorkArrangement = job.location.toLowerCase().includes('remote');
      } else if (workArrangementFilter === 'Onsite') {
        matchesWorkArrangement = !job.location.toLowerCase().includes('remote');
      }

      return matchesSearchTerm && matchesLocation && matchesDepartment && matchesEmploymentType && matchesWorkArrangement;
    });

    if (dateFilter !== 'Any time') {
      const now = new Date();
      let cutoffDate = new Date(now);
      if (dateFilter === 'Past month') cutoffDate.setMonth(now.getMonth() - 1);
      if (dateFilter === 'Past week') cutoffDate.setDate(now.getDate() - 7);
      if (dateFilter === 'Past 24 hours') cutoffDate.setDate(now.getDate() - 1);
      
      filtered = filtered.filter(job => new Date(job.createdAt) >= cutoffDate);
    }
    return filtered;
  }, [initialJobs, searchTerm, locationFilter, departmentFilter, employmentTypeFilter, workArrangementFilter, dateFilter, showOpenRoles]);

  return (
    <section id="careers-section" className="section-padding bg-zinc-50/50 dark:bg-zinc-900/10">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
            Join <span className="text-primary">QuantumFusion</span>
          </h1>
          <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium">
            Explore exciting opportunities and build the future of AI with our elite team.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn className="text-center mb-16">
            <Button 
                onClick={() => setShowOpenRoles(!showOpenRoles)} 
                size="lg" 
                className="rounded-full px-10 py-7 text-xl font-bold shadow-2xl hover:scale-105 transition-transform"
            >
                {showOpenRoles ? <ChevronUp className="mr-2 h-6 w-6" /> : <ChevronDown className="mr-2 h-6 w-6" />}
                {showOpenRoles ? 'Hide Vacancies' : 'See Open Vacancies'}
                <Briefcase className="ml-2 h-6 w-6" />
            </Button>
        </ScrollFadeIn>

        {showOpenRoles && (
          <>
            <ScrollFadeIn delay="100ms" className="mb-12 p-8 bg-white dark:bg-zinc-900 border rounded-2xl shadow-xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <div className="space-y-2">
                <Label htmlFor="search">Search Keywords</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                  <Input
                    id="search"
                    placeholder="e.g. React, Manager"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger id="location" className="h-11">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger id="department" className="h-11">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Employment Type</Label>
                <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                  <SelectTrigger id="type" className="h-11">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="lg:col-span-2 xl:col-span-2 space-y-4">
                <Label>Work Arrangement</Label>
                <RadioGroup
                    defaultValue="Any"
                    onValueChange={setWorkArrangementFilter}
                    className="flex space-x-6 h-11 items-center"
                  >
                    {workArrangements.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={`arr-${type}`} />
                        <Label htmlFor={`arr-${type}`} className="font-bold flex items-center cursor-pointer">
                          {type === 'Remote' && <Laptop className="mr-2 h-4 w-4" />}
                          {type === 'Onsite' && <Building className="mr-2 h-4 w-4" />}
                          {type}
                        </Label>
                      </div>
                    ))}
                </RadioGroup>
              </div>

              <div className="lg:col-span-2 xl:col-span-2 space-y-4">
                <Label>Posted Date</Label>
                <RadioGroup
                  value={dateFilter}
                  onValueChange={setDateFilter}
                  className="flex space-x-6 h-11 items-center"
                >
                  {['Any time', 'Past week', 'Past month'].map((opt) => (
                    <div key={opt} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt} id={`date-${opt}`} />
                      <Label htmlFor={`date-${opt}`} className="font-bold cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </ScrollFadeIn>

            {filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredJobs.map((job, index) => (
                  <ScrollFadeIn key={job.id} delay={`${index * 100}ms`}>
                    <JobCard 
                        job={job} 
                        onApplyNowClick={handleApplyNowClick}
                        onViewDetailsClick={handleViewDetailsClick}
                    />
                  </ScrollFadeIn>
                ))}
              </div>
            ) : (
              <ScrollFadeIn className="text-center py-24 bg-white dark:bg-zinc-900 border rounded-2xl">
                <Filter className="mx-auto h-16 w-16 text-zinc-200 mb-6" />
                <h3 className="text-2xl font-bold mb-2">No Matching Roles Found</h3>
                <p className="text-zinc-500 mb-8 max-w-sm mx-auto text-lg">Try adjusting your filters or search terms.</p>
                 <Button variant="outline" size="lg" onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('All Locations');
                    setDepartmentFilter('All Departments');
                    setEmploymentTypeFilter('All Types');
                    setWorkArrangementFilter('Any');
                    setDateFilter('Any time');
                 }}>
                    Reset All Filters
                </Button>
              </ScrollFadeIn>
            )}
          </>
        )}
      </div>
      <ApplyJobModal isOpen={isApplyModalOpen} onOpenChange={setIsApplyModalOpen} job={selectedJobForApplication} />
      <JobDescriptionModal isOpen={isDescriptionModalOpen} onOpenChange={setIsDescriptionModalOpen} job={selectedJobForDescription} />
    </section>
  );
}
