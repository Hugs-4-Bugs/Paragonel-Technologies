
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Linkedin, Github, Instagram, Globe, UserCircle, Brain } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { XIcon } from '@/components/brand/x-icon';

interface TeamMember {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  aiHint: string;
  bio: string;
  socials: {
    linkedin?: string;
    twitter?: string;
    github?: string;
    instagram?: string;
    globe?: string;
  };
  icon: LucideIcon;
}

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Prabhat Kumar',
    title: 'Founder & CEO',
    imageUrl: '/images/Prabhat.png',
    aiHint: 'Prabhat Kumar Founder CEO Paragonel',
    bio: 'Prabhat Kumar is the Founder & CEO of Paragonel Technologies Pvt. Ltd. He holds a Bachelor of Engineering in Computer Science, with a foundation in Java backend engineering — Spring Boot, REST APIs, SQL and application architecture — and works across Next.js, React, TypeScript, cloud infrastructure, Docker, CI/CD and AI-enabled application workflows.\n\nParagonel\u2019s engineering philosophy — small, named, verifiable systems built to behave exactly as specified — is the stance behind every product and engagement.\n\nToday, Prabhat leads Paragonel as the architect behind its product portfolio — including AcquisitionOS, an AI-native client acquisition platform now in private beta — while overseeing the engineering services the company delivers.',
    socials: {
      linkedin: 'https://www.linkedin.com/in/prabhat-kumar-6963661a4/',
      twitter: 'https://x.com/PrabhatKumarHQ',
      github: 'https://github.com/Hugs-4-Bugs',
      globe: 'https://www.prabhat.online/'
    },
    icon: Brain,
  },
];

export function TeamSection() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCardClick = (member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {teamMembers.map((member, index) => (
          <ScrollFadeIn key={member.id} delay={`${index * 100}ms`}>
            <Card 
              className="h-full flex flex-col text-center shadow-lg hover:shadow-xl transition-shadow duration-300 group cursor-pointer border-zinc-100 dark:border-zinc-800 bg-card"
              onClick={() => handleCardClick(member)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(member); }}
              aria-label={`View details for ${member.name}`}
            >
              <CardHeader className="items-center pt-8">
                <div className="relative mb-4">
                  {member.imageUrl ? (
                      <Image
                        src={member.imageUrl}
                        alt={`${member.name}, ${member.title}, Paragonel Technologies`}
                        width={140}
                        height={140}
                        className="rounded-full border-4 border-primary/30 group-hover:border-primary/70 object-cover transition-all h-[140px] w-[140px]"
                        data-ai-hint={member.aiHint}
                      />
                  ) : (
                      <div className="w-[140px] h-[140px] bg-muted rounded-full flex items-center justify-center border-4 border-primary/30 group-hover:border-primary/70 transition-all">
                          <UserCircle className="w-20 h-20 text-muted-foreground" />
                      </div>
                  )}
                  {member.icon && <member.icon className="absolute bottom-0 right-0 h-10 w-10 p-2 bg-primary text-primary-foreground rounded-full shadow-md border-2 border-background neon-icon group-hover:scale-110 transition-transform" />}
                </div>
                <CardTitle className="text-xl font-black group-hover:text-primary transition-colors">{member.name}</CardTitle>
                <p className="text-sm text-primary font-bold">{member.title}</p>
              </CardHeader>
              <CardContent className="flex-grow px-6 py-4">
                <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">{member.bio}</p>
              </CardContent>
              <CardFooter className="justify-center space-x-4 pb-8">
                {member.socials?.linkedin && (
                  <Link href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Link>
                )}
                {member.socials?.twitter && (
                  <Link href={member.socials.twitter} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label={`${member.name} on X (opens in a new tab)`}>
                    <XIcon className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Link>
                )}
                {member.socials?.instagram && (
                  <Link href={member.socials.instagram} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Link>
                )}
                {member.socials?.globe && (
                  <Link href={member.socials.globe} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                    <Globe className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                  </Link>
                )}
              </CardFooter>
            </Card>
          </ScrollFadeIn>
        ))}
      </div>

      {selectedMember && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-card text-card-foreground rounded-[2.5rem] shadow-2xl border-primary/20">
            <DialogHeader className="p-6 border-b">
              <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-8">
                <div className="relative mb-6 sm:mb-0">
                  <Image
                    src={selectedMember.imageUrl}
                    alt={`${selectedMember.name}, ${selectedMember.title}, Paragonel Technologies`}
                    width={160}
                    height={160}
                    className="rounded-full border-4 border-primary object-cover shadow-xl h-[160px] w-[160px]"
                    data-ai-hint={selectedMember.aiHint}
                  />
                  {selectedMember.icon && <selectedMember.icon className="absolute bottom-2 right-2 h-10 w-10 p-2 bg-primary text-primary-foreground rounded-full shadow-md border-2 border-background neon-icon" />}
                </div>
                <div className="text-center sm:text-left">
                  <DialogTitle className="text-4xl font-black text-foreground tracking-tight">{selectedMember.name}</DialogTitle>
                  <DialogDescription className="text-xl font-bold text-primary mt-1">{selectedMember.title}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <h3 className="text-xl font-black text-foreground mb-4 uppercase tracking-widest text-xs">About the Innovator</h3>
              <p className="text-muted-foreground leading-relaxed text-lg whitespace-pre-line">{selectedMember.bio}</p>
              
              <div className="mt-10 pt-6 border-t border-zinc-100 dark:border-zinc-800">
                <h4 className="text-sm font-black text-foreground mb-4 uppercase tracking-widest">Connect Directly</h4>
                <div className="flex flex-wrap gap-4">
                  {selectedMember.socials?.linkedin && (
                    <Button variant="outline" asChild size="lg" className="rounded-full font-bold border-2">
                      <Link href={selectedMember.socials.linkedin} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="mr-2 h-5 w-5 text-[#0077B5]" /> LinkedIn
                      </Link>
                    </Button>
                  )}
                  {selectedMember.socials?.twitter && (
                    <Button variant="outline" asChild size="lg" className="rounded-full font-bold border-2">
                      <Link href={selectedMember.socials.twitter} target="_blank" rel="noopener noreferrer">
                        <XIcon className="mr-2 h-5 w-5" /> X
                      </Link>
                    </Button>
                  )}
                  {selectedMember.socials?.instagram && (
                    <Button variant="outline" asChild size="lg" className="rounded-full font-bold border-2">
                      <Link href={selectedMember.socials.instagram} target="_blank" rel="noopener noreferrer">
                        <Instagram className="mr-2 h-5 w-5 text-[#E4405F]" /> Instagram
                      </Link>
                    </Button>
                  )}
                  {selectedMember.socials?.github && (
                    <Button variant="outline" asChild size="lg" className="rounded-full font-bold border-2">
                      <Link href={selectedMember.socials.github} target="_blank" rel="noopener noreferrer">
                        <Github className="mr-2 h-5 w-5" /> GitHub
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
