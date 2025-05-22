
"use client";

import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Users, CalendarDays, DollarSign, Info, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import React, { useState } from 'react';
import { summarizeJobDescription, type SummarizeJobDescriptionOutput } from '@/ai/flows/summarize-job-description';

interface JobCardProps {
  job: Job;
  onApplyNowClick: (job: Job) => void;
}

export function JobCard({ job, onApplyNowClick }: JobCardProps) {
  const postedDate = new Date(job.postedDate);
  const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });

  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [hasHovered, setHasHovered] = useState(false);

  const handleMouseEnter = async () => {
    if (!hasHovered && !summary && !isSummaryLoading) {
      setHasHovered(true);
      setIsSummaryLoading(true);
      setSummaryError(null);
      try {
        const result: SummarizeJobDescriptionOutput = await summarizeJobDescription({ jobDescription: job.description });
        setSummary(result.summary);
      } catch (error) {
        console.error("Failed to fetch summary:", error);
        setSummaryError("Could not load summary.");
      } finally {
        setIsSummaryLoading(false);
      }
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div onMouseEnter={handleMouseEnter} className="h-full">
            <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-default">
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
                    <CardTitle className="text-xl mb-1">{job.title}</CardTitle>
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
                <div className="text-xs text-primary/80 pt-1 flex items-center">
                   <Info className="w-3 h-3 mr-1" /> Hover for AI summary
                </div>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t">
                <div className="flex items-center text-xs text-muted-foreground mb-2 sm:mb-0">
                  <CalendarDays className="w-3 h-3 mr-1.5 neon-icon" />
                  Posted {timeAgo}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 py-2 shadow-md hover:shadow-lg transition-shadow"
                  onClick={() => onApplyNowClick(job)}
                >
                  Apply Now
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-sm bg-popover text-popover-foreground shadow-lg rounded-md p-3 border">
          {isSummaryLoading && (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading summary...</span>
            </div>
          )}
          {summaryError && <p className="text-destructive">{summaryError}</p>}
          {summary && !isSummaryLoading && <p className="text-sm">{summary}</p>}
          {!summary && !isSummaryLoading && !summaryError && <p className="text-sm text-muted-foreground">Hover over card to load AI summary.</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
