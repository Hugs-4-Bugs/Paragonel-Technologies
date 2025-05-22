
"use client";

import React from "react";
import type { Job } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Briefcase, MapPin, Users, CalendarDays, DollarSign, Building } from 'lucide-react';
import Image from "next/image";
import { formatDistanceToNow } from 'date-fns';

interface JobDescriptionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
}

export function JobDescriptionModal({ isOpen, onOpenChange, job }: JobDescriptionModalProps) {
  if (!job) return null;

  const postedDate = new Date(job.postedDate);
  const timeAgo = formatDistanceToNow(postedDate, { addSuffix: true });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl lg:max-w-3xl flex flex-col h-[90svh] sm:h-[85vh] shadow-2xl p-0">
        <DialogHeader className="p-6 border-b sticky top-0 bg-background z-10">
          <div className="flex items-start space-x-4">
            {job.companyLogoUrl ? (
              <Image
                src={job.companyLogoUrl}
                alt={`${job.company} logo`}
                width={60}
                height={60}
                className="rounded-lg border object-contain"
                data-ai-hint="company logo minimal"
              />
            ) : (
              <div className="w-[60px] h-[60px] bg-muted rounded-lg flex items-center justify-center border">
                <Building className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground">
                {job.title}
              </DialogTitle>
              <DialogDescription className="text-base text-primary font-medium">
                {job.company}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-grow px-6 py-4">
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-primary">Job Overview</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 neon-icon" /> Location: {job.location}</div>
                <div className="flex items-center"><Users className="w-4 h-4 mr-2 neon-icon" /> Department: {job.department}</div>
                <div className="flex items-center"><Briefcase className="w-4 h-4 mr-2 neon-icon" /> Type: {job.employmentType}</div>
                {job.salaryRange && <div className="flex items-center"><DollarSign className="w-4 h-4 mr-2 neon-icon" /> Salary: {job.salaryRange}</div>}
                <div className="flex items-center"><CalendarDays className="w-4 h-4 mr-2 neon-icon" /> Posted: {timeAgo}</div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-primary mb-2">Full Job Description</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </section>
            
            {/* Placeholder for Key Responsibilities if available as a separate field */}
            {/* 
            <section>
              <h3 className="text-lg font-semibold text-primary mb-2">Key Responsibilities</h3>
              <ul className="list-disc list-inside space-y-1 text-foreground/90">
                <li>Responsibility 1...</li>
                <li>Responsibility 2...</li>
              </ul>
            </section>
            */}

            {/* Placeholder for Qualifications if available as a separate field */}
            {/*
            <section>
              <h3 className="text-lg font-semibold text-primary mb-2">Qualifications</h3>
              <ul className="list-disc list-inside space-y-1 text-foreground/90">
                <li>Qualification 1...</li>
                <li>Qualification 2...</li>
              </ul>
            </section>
            */}

          </div>
        </ScrollArea>
        
        <div className="p-6 border-t sticky bottom-0 bg-background z-10 flex justify-end gap-3">
          <DialogClose asChild>
            <Button variant="outline" size="lg">Close</Button>
          </DialogClose>
          {/* Removed apply button from here as it's on the card */}
        </div>
      </DialogContent>
    </Dialog>
  );
}
