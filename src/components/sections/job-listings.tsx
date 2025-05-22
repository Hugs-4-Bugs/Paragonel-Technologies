"use client";

import React, { useState, useMemo } from 'react';
import type { Job } from '@/types';
import { dummyJobs, locations as allLocations, departments as allDepartments } from '@/lib/data';
import { JobCard } from '@/components/job-card';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';
import { Button } from '../ui/button';

export function JobListings() {
  const [jobs, setJobs] = useState<Job[]>(dummyJobs);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('All Locations');
  const [departmentFilter, setDepartmentFilter] = useState('All Departments');

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearchTerm = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                job.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLocation = locationFilter === 'All Locations' || job.location === locationFilter;
      const matchesDepartment = departmentFilter === 'All Departments' || job.department === departmentFilter;
      return matchesSearchTerm && matchesLocation && matchesDepartment;
    });
  }, [jobs, searchTerm, locationFilter, departmentFilter]);

  return (
    <section id="job-listings" className="section-padding bg-secondary/30 dark:bg-secondary/10">
      <div className="container px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Find Your Next <span className="text-primary">Quantum Leap</span></h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse through a curated list of opportunities from innovative companies.
            Use the filters to narrow down your search.
          </p>
        </ScrollFadeIn>

        <ScrollFadeIn delay="200ms" className="mb-8 p-6 bg-card rounded-xl shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
            <div className="relative">
              <label htmlFor="search" className="block text-sm font-medium text-foreground mb-1">Search Jobs</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 transform mt-3 h-5 w-5 text-muted-foreground neon-icon" />
              <Input
                id="search"
                type="text"
                placeholder="Keywords, company, etc."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full"
              />
            </div>
            
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-foreground mb-1">Location</label>
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
              <label htmlFor="department" className="block text-sm font-medium text-foreground mb-1">Department</label>
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
          </div>
        </ScrollFadeIn>

        {filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredJobs.map((job, index) => (
              <ScrollFadeIn key={job.id} delay={`${index * 100}ms`}>
                <JobCard job={job} />
              </ScrollFadeIn>
            ))}
          </div>
        ) : (
          <ScrollFadeIn className="text-center py-12">
            <Filter className="mx-auto h-16 w-16 text-muted-foreground mb-4 neon-icon" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Jobs Found</h3>
            <p className="text-muted-foreground">Try adjusting your search filters or check back later for new opportunities.</p>
             <Button variant="outline" className="mt-6" onClick={() => {
                setSearchTerm('');
                setLocationFilter('All Locations');
                setDepartmentFilter('All Departments');
             }}>
                Clear Filters
            </Button>
          </ScrollFadeIn>
        )}
      </div>
    </section>
  );
}
