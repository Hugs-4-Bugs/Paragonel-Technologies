
"use client";

import Link from 'next/link';
import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Users, CalendarDays, DollarSign, Info, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import React from 'react';

interface JobCardProps {
  job: Job;
  onApplyNowClick?: (job: Job) => void;
  onViewDetailsClick?: (job: Job) => void;
}

export function JobCard({ job, onApplyNowClick, onViewDetailsClick }: JobCardProps) {
  const postedDate = new Date(job.postedDate);
  const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent triggering card click if the "Apply Now" button or a link inside was clicked.
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
      return;
    }
    onViewDetailsClick?.(job);
  };
  
  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
       // Prevent triggering card click if the "Apply Now" button or a link inside was focused.
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a')) {
        return;
      }
      onViewDetailsClick?.(job);
    }
  };


  return (
    <Card 
      className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${job.title}`}
    >
      <CardHeader>
        <div className="flex items-start space-x-4">
          {job.companyLogoUrl ? (
            <Image
              src={job.companyLogoUrl}
              alt={`${job.company} logo`}
              width={50}
              height={50}
              className="rounded-md border object-contain"
              data-ai-hint="company logo minimal"
            />
          ) : (
            <div className="w-[50px] h-[50px] bg-muted rounded-md flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <div>
            <CardTitle className="text-xl mb-1 group-hover:text-primary transition-colors">{job.title}</CardTitle>
            <CardDescription className="text-sm">{job.company}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm">
        <div className="flex items-center text-muted-foreground">
          <MapPin className="w-4 h-4 mr-2 neon-icon" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Users className="w-4 h-4 mr-2 neon-icon" />
          <span>{job.department}</span>
        </div>
        <div className="flex items-center text-muted-foreground">
          <Briefcase className="w-4 h-4 mr-2 neon-icon" />
          <span>{job.employmentType}</span>
        </div>
        {job.salaryRange && (
          <div className="flex items-center text-muted-foreground">
            <DollarSign className="w-4 h-4 mr-2 neon-icon" />
            <span>{job.salaryRange}</span>
          </div>
        )}
        <p className="text-foreground/90 line-clamp-3 pt-2">
          {job.description}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t">
        <div className="flex items-center text-xs text-muted-foreground mb-3 sm:mb-0">
          <CalendarDays className="w-3 h-3 mr-1.5 neon-icon" />
          Posted {timeAgo}
        </div>
        <Button
          variant="default"
          size="sm"
          className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-2 shadow-md hover:shadow-lg transition-shadow"
          onClick={(e) => {
            e.stopPropagation(); // Prevent card click from firing
            onApplyNowClick?.(job);
          }}
          onKeyDown={(e) => {
             if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation(); 
             }
          }}
        >
          Apply Now
        </Button>
      </CardFooter>
       <Link
         href={`/careers/${job.id}`}
         className="p-2 text-xs text-primary/70 flex items-center justify-center hover:text-primary transition-colors"
         onClick={(e) => e.stopPropagation()}
         aria-label={`View full details page for ${job.title}`}
       >
         View full details <ChevronRight className="w-3 h-3 ml-1" />
       </Link>
    </Card>
  );
}
