
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import type { Job } from '@/types';
import { dummyJobs, locations as allLocations, departments as allDepartments } from '@/lib/data';
import { JobCard } from '@/components/job-card';
import { ApplyJobModal } from '@/components/apply-job-modal';
import { JobDescriptionModal } from '@/components/job-description-modal';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Briefcase, ChevronDown, ChevronUp, Laptop, Building, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

const employmentTypes = ['All Types', 'Full-time', 'Part-time', 'Contract', 'Internship'];
const workArrangements = ['Any', 'Remote', 'Onsite'];

export function CareersSection() { 
  const [jobs, setJobs] = useState<Job[]>([]); // Initialize with empty array
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [jobIdFilter, setJobIdFilter] = useState('');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('All Types');
  const [dateFilter, setDateFilter] = useState('Any time');
  const [workArrangementFilter, setWorkArrangementFilter] = useState('Any');
  const [showOpenRoles, setShowOpenRoles] = useState(false); 

  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<Job | null>(null);

  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [selectedJobForDescription, setSelectedJobForDescription] = useState<Job | null>(null);

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Effect to initialize jobs from dummyJobs on mount
  useEffect(() => {
    const initialJobs = dummyJobs.map(job => ({
      ...job,
      postedDate: job.postedDate || new Date().toISOString(), // Ensure postedDate exists
    }));
    setJobs(initialJobs);
  }, []); // Empty dependency array ensures this runs only once on mount

  // Effect to handle opening the apply modal after login
  useEffect(() => {
    // Ensure jobs have been loaded and user is authenticated before proceeding
    if (jobs.length === 0 || !isAuthenticated) return;

    const actionAfterLogin = localStorage.getItem('actionAfterLogin');
    if (actionAfterLogin === 'applyJobModalOpen') {
        const pendingJobId = localStorage.getItem('pendingApplyJobId');
        if (pendingJobId) {
            const jobToApply = jobs.find(j => j.id === pendingJobId);
            if (jobToApply) {
                setSelectedJobForApplication(jobToApply);
                setIsApplyModalOpen(true);
            }
        }
        localStorage.removeItem('actionAfterLogin');
        localStorage.removeItem('pendingApplyJobId');
    }
  // Listen to changes in isAuthenticated and ensure jobs are loaded
  }, [isAuthenticated, jobs, router]);


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

    let filtered = jobs;
    if (jobIdFilter) {
      filtered = filtered.filter(job => job.id === jobIdFilter);
    } else {
      filtered = filtered.filter(job => {
        const matchesSearchTerm = 
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLocation = locationFilter === 'All Locations' || job.location === locationFilter;
        const matchesDepartment = departmentFilter === 'All Departments' || job.department === departmentFilter;
        const matchesEmploymentType = employmentTypeFilter === 'All Types' || job.employmentType === employmentTypeFilter;

        const jobLocationLower = job.location.toLowerCase();
        const jobTitleLower = job.title.toLowerCase();
        const jobDescriptionLower = job.description.toLowerCase();

        let matchesWorkArrangement = true;
        if (workArrangementFilter === 'Remote') {
          matchesWorkArrangement = jobLocationLower.includes('remote') || jobTitleLower.includes('remote') || jobDescriptionLower.includes('remote');
        } else if (workArrangementFilter === 'Onsite') {
          matchesWorkArrangement = !jobLocationLower.includes('remote') && !jobTitleLower.includes('remote') && !jobDescriptionLower.includes('remote');
        }

        return matchesSearchTerm && matchesLocation && matchesDepartment && matchesEmploymentType && matchesWorkArrangement;
      });
    }

    if (dateFilter !== 'Any time') {
      const now = new Date();
      let cutoffDate = new Date(now);

      switch (dateFilter) {
        case 'Past month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'Past week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'Past 24 hours':
          cutoffDate.setDate(now.getDate() - 1);
          break;
      }
      filtered = filtered.filter(job => new Date(job.postedDate) >= cutoffDate);
    }
    return filtered;
  }, [jobs, searchTerm, locationFilter, departmentFilter, jobIdFilter, employmentTypeFilter, workArrangementFilter, dateFilter, showOpenRoles]);

  return (
    <section id="careers-section" className="section-padding bg-secondary/30 dark:bg-secondary/10">
      <div className="container mx-auto px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Join <span className="text-primary">QuantumFusion Solutions</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We are pioneering the future of technology. Explore exciting opportunities and grow with our innovative team.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn className="text-center mb-10">
            <Button 
                onClick={() => setShowOpenRoles(!showOpenRoles)} 
                size="lg" 
                variant="default"
                className="rounded-full px-8 py-3 text-lg bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
                {showOpenRoles ? <ChevronUp className="mr-2 h-5 w-5" /> : <ChevronDown className="mr-2 h-5 w-5" />}
                {showOpenRoles ? 'Hide Open Roles' : 'View Open Roles'}
                <Briefcase className="ml-2 h-5 w-5" />
            </Button>
        </ScrollFadeIn>

        {showOpenRoles && (
          <>
            <ScrollFadeIn delay="100ms" className="mb-8 p-6 bg-card rounded-xl shadow-lg grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
              <div className="relative lg:col-span-2 xl:col-span-1">
                <Label htmlFor="search" className="block text-sm font-medium text-foreground mb-1">Search Jobs</Label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform mt-3 h-5 w-5 text-muted-foreground neon-icon" />
                <Input
                  id="search"
                  type="text"
                  placeholder="Keywords (e.g., AI, Python)"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full" />
              </div>
              <div className="relative">
                <Label htmlFor="jobId" className="block text-sm font-medium text-foreground mb-1">Filter by Job ID</Label>
                <Input
                  id="jobId"
                  type="text"
                  placeholder="Enter Job ID (e.g., ABC123)"
                  value={jobIdFilter}
                  onChange={(e) => setJobIdFilter(e.target.value)}
                  className="pl-3 pr-4 py-2 w-full" />
              </div>
              <div>
                <Label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger id="location" className="w-full">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {allLocations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department" className="block text-sm font-medium text-foreground mb-1">Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger id="department" className="w-full">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {allDepartments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="block text-sm font-medium text-foreground mb-1">Filter by Date</Label>
                <RadioGroup
                  value={dateFilter}
                  onValueChange={setDateFilter}
                  className="flex flex-wrap gap-x-4 gap-y-2"
                >
                  {['Any time', 'Past month', 'Past week', 'Past 24 hours'].map((dateOption) => (
                    <div key={dateOption} className="flex items-center space-x-2">
                      <RadioGroupItem value={dateOption} id={`date-${dateOption.toLowerCase().replace(/\s/g, '-')}`} />
                      <Label
                        htmlFor={`date-${dateOption.toLowerCase().replace(/\s/g, '-')}`}
                        className="font-normal cursor-pointer"
                      >
                        {dateOption}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              <div className="flex flex-col lg:flex-row lg:col-span-2 gap-6 items-start w-full">
                <div className="flex-1">
                  <Label htmlFor="employmentType" className="block text-sm font-medium text-foreground mb-1">Employment Type</Label>
                  <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                    <SelectTrigger id="employmentType" className="w-full">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label className="block text-sm font-medium text-foreground mb-1">Work Arrangement</Label>
                  <RadioGroup
                    defaultValue="Any"
                    onValueChange={setWorkArrangementFilter}
                    className="flex space-x-4 items-center h-[38px]"
                  >
                    {workArrangements.map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <RadioGroupItem value={type} id={`work-${type.toLowerCase()}`} />
                        <Label htmlFor={`work-${type.toLowerCase()}`} className="font-normal cursor-pointer flex items-center">
                          {type === 'Remote' && <Laptop className="inline-block h-4 w-4 mr-1 -mt-0.5 text-muted-foreground" />}
                          {type === 'Onsite' && <Building className="inline-block h-4 w-4 mr-1 -mt-0.5 text-muted-foreground" />}
                          {type}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>
            </ScrollFadeIn>

            {authLoading ? (
                 <div className="text-center py-12">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground mt-4">Loading job opportunities...</p>
                </div>
            ) : filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredJobs.map((job, index) => (
                  <ScrollFadeIn key={job.id} delay={`${index * 100}ms`}>
                    <JobCard 
                        job={{...job, company: job.company === 'Innovatech Solutions' || job.company === 'FutureAI Corp' ? 'QuantumFusion Solutions' : job.company }} 
                        onApplyNowClick={handleApplyNowClick}
                        onViewDetailsClick={handleViewDetailsClick}
                    />
                  </ScrollFadeIn>
                ))}
              </div>
            ) : (
              <ScrollFadeIn className="text-center py-12">
                <Filter className="mx-auto h-16 w-16 text-muted-foreground mb-4 neon-icon" />
                <h3 className="text-xl font-semibold text-foreground mb-2">No Matching Positions Found</h3>
                <p className="text-muted-foreground">Try adjusting your search filters or check back later for new opportunities at QuantumFusion Solutions.</p>
                 <Button variant="outline" className="mt-6" onClick={() => {
                    setSearchTerm('');
                    setLocationFilter('All Locations');
                    setDepartmentFilter('All Departments');
                    setEmploymentTypeFilter('All Types');
                    setWorkArrangementFilter('Any');
                    setDateFilter('Any time');
                    setJobIdFilter('');
                 }}>
                    Clear All Filters
                </Button>
              </ScrollFadeIn>
            )}
          </>
        )}
      </div>
      <ApplyJobModal 
        isOpen={isApplyModalOpen} 
        onOpenChange={setIsApplyModalOpen} 
        job={selectedJobForApplication} 
      />
      <JobDescriptionModal
        isOpen={isDescriptionModalOpen}
        onOpenChange={setIsDescriptionModalOpen}
        job={selectedJobForDescription}
      />
    </section>
  );
}
