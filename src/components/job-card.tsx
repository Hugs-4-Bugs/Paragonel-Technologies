
import type { Job } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, MapPin, Users, CalendarDays, DollarSign } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
  onApplyNowClick: (job: Job) => void; // Callback to open modal
}

export function JobCard({ job, onApplyNowClick }: JobCardProps) {
  const postedDate = new Date(job.postedDate);
  const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });

  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
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
  );
}
