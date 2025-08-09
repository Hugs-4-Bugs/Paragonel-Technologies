
"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button'; // Added this import
import { Linkedin, Twitter, Github, Instagram, Globe, UserCircle, Brain, CloudCog, Layers2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

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
    globe?: string; // Changed from 'profile' to 'globe' for clarity
  };
  icon: LucideIcon;
}

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Prabhat Kumar',
    title: 'Founder & CEO',
    imageUrl: '/images/Prabhat.png',
    aiHint: 'Prabhat Kumar Founder CEO QuantumFusion Solutions',
    bio: 'Prabhat Kumar, with a Bachelor of Engineering in Computer Science, is the visionary Founder & CEO of QuantumFusion Solutions. He leads the company with a passion for innovation, driving its mission to deliver cutting-edge AI, Cloud, DevOps, and SaaS solutions that shape the future of technology.',
    socials: { linkedin: 'https://www.linkedin.com/in/prabhat-kumar-6963661a4/', github: 'https://github.com/Hugs-4-Bugs', instagram: 'https://www.instagram.com/_s_4_sharma/', globe: 'https://prabhatkr.vercel.app/' },
    icon: Brain,
  },
  {
    id: '2',
    name: 'Vivek Sharma',
    title: 'CTO, Cloud & DevOps Architect',
    imageUrl: '/images/Vivek.png',
    aiHint: 'professional photo cto tech executive',
    bio: 'Zara is the driving force behind our robust cloud infrastructures and streamlined DevOps practices, ensuring scalability and resilience for all client projects. She has over 15 years of experience in enterprise IT and cloud architecture, specializing in AWS and Azure.',
    socials: { linkedin: '', instagram: 'https://www.instagram.com/viveksharma75_/' },
    icon: CloudCog,
  },
  {
    id: '3',
    name: 'Ajay Pal',
    title: 'Head of SaaS Platforms',
    imageUrl: '/images/Ajay.png',
    aiHint: 'professional photo manager saas product',
    bio: 'Liam orchestrates the development of innovative SaaS solutions, focusing on user experience and market impact. He is passionate about building products that solve real-world problems and achieve commercial success. Liam champions agile methodologies and user-centric design.',
    socials: { linkedin: 'https://www.linkedin.com/in/ajay-pal-21b8ab269/', instagram: 'https://www.instagram.com/6549ima_j_a_y_p_a_l/' },
    icon: Layers2,
  },
  {
    id: '4',
    name: 'Dr. Lena Petrova',
    title: 'Principal AI Researcher',
    imageUrl: '/images/Lena.png',
    aiHint: 'professional photo researcher ai scientist',
    bio: 'Dr. Petrova leads our R&D in machine learning and natural language processing, pushing the boundaries of what AI can achieve for businesses. She holds a PhD in Artificial Intelligence and has published numerous papers in leading AI journals.',
    socials: { linkedin: '#', github: '#' },
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
      <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
        <div className="container mx-auto px-4 md:px-6">
          <ScrollFadeIn className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Meet Our <span className="text-primary">Innovators</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              The visionary minds at QuantumFusion Solutions, driving technological advancements and client success.
            </p>
          </ScrollFadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, index) => (
              <ScrollFadeIn key={member.id} delay={`${index * 100}ms`}>
                <Card 
                  className="h-full flex flex-col text-center shadow-lg hover:shadow-xl transition-shadow duration-300 group cursor-pointer"
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
                          alt={member.name}
                          width={120}
                          height={120}
                          className="rounded-full border-4 border-primary/30 group-hover:border-primary/70 object-cover transition-all"
                          data-ai-hint={member.aiHint}
                          />
                      ) : (
                          <div className="w-[120px] h-[120px] bg-muted rounded-full flex items-center justify-center border-4 border-primary/30 group-hover:border-primary/70 transition-all">
                              <UserCircle className="w-20 h-20 text-muted-foreground" />
                          </div>
                      )}
                      {member.icon && <member.icon className="absolute bottom-0 right-0 h-8 w-8 p-1.5 bg-primary text-primary-foreground rounded-full shadow-md border-2 border-background neon-icon group-hover:scale-110 transition-transform" />}
                    </div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{member.name}</CardTitle>
                    <p className="text-sm text-muted-foreground font-medium">{member.title}</p>
                  </CardHeader>
                  <CardContent className="flex-grow px-6 py-4">
                    <p className="text-sm text-muted-foreground line-clamp-4">{member.bio}</p>
                  </CardContent>
                  <CardFooter className="justify-center space-x-3 pb-8">
                    {member.socials?.linkedin && (
                      <Link href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} LinkedIn Profile`} onClick={(e) => e.stopPropagation()}>
                        <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary neon-icon transition-colors" />
                      </Link>
                    )}
                    {member.socials?.twitter && (
                      <Link href={member.socials.twitter} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} Twitter Profile`} onClick={(e) => e.stopPropagation()}>
                        <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary neon-icon transition-colors" />
                      </Link>
                    )}
                    {member.socials?.github && (
                      <Link href={member.socials.github} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} GitHub Profile`} onClick={(e) => e.stopPropagation()}>
                        <Github className="h-5 w-5 text-muted-foreground hover:text-primary neon-icon transition-colors" />
                      </Link>
                    )}
                    {member.socials?.instagram && (
                      <Link href={member.socials.instagram} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} Instagram Profile`} onClick={(e) => e.stopPropagation()}>
                        <Instagram className="h-5 w-5 text-muted-foreground hover:text-primary neon-icon transition-colors" />
                      </Link>
                    )}
                    {member.socials?.globe && (
                      <Link href={member.socials.globe} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} Instagram Profile`} onClick={(e) => e.stopPropagation()}>
                        <Globe className="h-5 w-5 text-muted-foreground hover:text-primary neon-icon transition-colors" />
                      </Link>
                    )}
                  </CardFooter>
                </Card>
              </ScrollFadeIn>
            ))}
          </div>
        </div>
      </section>

      {selectedMember && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-lg md:max-w-xl lg:max-w-2xl bg-card text-card-foreground rounded-lg shadow-2xl border-primary/20">
            <DialogHeader className="p-6 border-b">
              <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-6">
                <div className="relative mb-4 sm:mb-0">
                  <Image
                    src={selectedMember.imageUrl}
                    alt={selectedMember.name}
                    width={150}
                    height={150}
                    className="rounded-full border-4 border-primary object-cover shadow-lg"
                    data-ai-hint={selectedMember.aiHint}
                  />
                  {selectedMember.icon && <selectedMember.icon className="absolute bottom-1 right-1 h-10 w-10 p-2 bg-primary text-primary-foreground rounded-full shadow-md border-2 border-background neon-icon" />}
                </div>
                <div className="text-center sm:text-left">
                  <DialogTitle className="text-3xl font-bold text-primary">{selectedMember.name}</DialogTitle>
                  <DialogDescription className="text-lg text-muted-foreground mt-1">{selectedMember.title}</DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-foreground mb-2">About {selectedMember.name.split(' ')[0]}</h3>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{selectedMember.bio}</p>
              
              {(selectedMember.socials?.linkedin || selectedMember.socials?.twitter || selectedMember.socials?.github) && (
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-md font-semibold text-foreground mb-3">Connect:</h4>
                  <div className="flex space-x-4">
                    {selectedMember.socials?.linkedin && (
                      <Button variant="outline" asChild size="sm">
                        <Link href={selectedMember.socials.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          <Linkedin className="mr-2 h-4 w-4 text-[#0077B5]" /> LinkedIn
                        </Link>
                      </Button>
                    )}
                    {selectedMember.socials?.twitter && (
                      <Button variant="outline" asChild size="sm">
                        <Link href={selectedMember.socials.twitter} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          <Twitter className="mr-2 h-4 w-4 text-[#1DA1F2]" /> Twitter
                        </Link>
                      </Button>
                    )}
                    {selectedMember.socials?.github && (
                      <Button variant="outline" asChild size="sm">
                        <Link href={selectedMember.socials.github} target="_blank" rel="noopener noreferrer" className="flex items-center">
                          <Github className="mr-2 h-4 w-4" /> GitHub
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
