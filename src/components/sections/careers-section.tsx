
"use client";

import React, { useState, useMemo } from 'react';
import type { Job } from '@/types';
import { dummyJobs, locations as allLocations, departments as allDepartments } from '@/lib/data'; // Ensure data matches QuantumFusion needs
import { JobCard } from '@/components/job-card';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, Briefcase, ChevronDown, ChevronUp, Laptop, Building } from 'lucide-react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"


const employmentTypes = ['All Types', 'Full-time', 'Part-time', 'Contract', 'Internship'];
const workArrangements = ['Any', 'Remote', 'Onsite'];


export function CareersSection() { 
  const [jobs, setJobs] = useState<Job[]>(dummyJobs); // Potentially update dummyJobs for QuantumFusion
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('All Types');
  const [workArrangementFilter, setWorkArrangementFilter] = useState('Any');
  const [showOpenRoles, setShowOpenRoles] = useState(false); 

  const filteredJobs = useMemo(() => {
    if (!showOpenRoles) return []; 

    return jobs.filter(job => {
      const matchesSearchTerm = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                job.company.toLowerCase().includes(searchTerm.toLowerCase()) || // Company name might be fixed for QuantumFusion
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
  }, [jobs, searchTerm, locationFilter, departmentFilter, employmentTypeFilter, workArrangementFilter, showOpenRoles]);

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
            <ScrollFadeIn delay="100ms" className="mb-8 p-6 bg-card rounded-xl shadow-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 items-start">
                <div className="relative lg:col-span-2 xl:col-span-1">
                  <Label htmlFor="search" className="block text-sm font-medium text-foreground mb-1">Search Jobs</Label>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform mt-3 h-5 w-5 text-muted-foreground neon-icon" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Keywords (e.g. AI, Cloud, Python)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full"
                  />
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
                
                <div className="flex flex-col space-y-2">
                    <div>
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
                     <div>
                        <Label className="block text-sm font-medium text-foreground mb-2">Work Arrangement</Label>
                        <RadioGroup
                            defaultValue="Any"
                            onValueChange={setWorkArrangementFilter}
                            className="flex space-x-4"
                        >
                            {workArrangements.map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                    <RadioGroupItem value={type} id={`work-${type.toLowerCase()}`} />
                                    <Label htmlFor={`work-${type.toLowerCase()}`} className="font-normal cursor-pointer">
                                        {type === 'Remote' && <Laptop className="inline-block h-4 w-4 mr-1 -mt-0.5 text-muted-foreground" />}
                                        {type === 'Onsite' && <Building className="inline-block h-4 w-4 mr-1 -mt-0.5 text-muted-foreground" />}
                                        {type}
                                    </Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                </div>
              </div>
            </ScrollFadeIn>

            {filteredJobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredJobs.map((job, index) => (
                  <ScrollFadeIn key={job.id} delay={`${index * 100}ms`}>
                    {/* Ensure JobCard uses 'QuantumFusion Solutions' or a generic placeholder if company varies */}
                    <JobCard job={{...job, company: job.company === 'Innovatech Solutions' || job.company === 'FutureAI Corp' ? 'QuantumFusion Solutions' : job.company }} />
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
                 }}>
                    Clear All Filters
                </Button>
              </ScrollFadeIn>
            )}
          </>
        )}
      </div>
    </section>
  );
}
