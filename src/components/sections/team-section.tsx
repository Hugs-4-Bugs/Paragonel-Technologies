
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Linkedin, Twitter, Github, UserCircle, Brain, CloudCog, Layers2 } from 'lucide-react';

const teamMembers = [
  {
    id: '1',
    name: 'Prabhat Kumar',
    title: 'Founder & CEO',
    imageUrl: 'https://placehold.co/300x300.png', // Replace with actual image path in public/
    aiHint: 'professional photo ceo prabhat kumar',
    bio: 'Prabhat Kumar, with a Bachelor of Engineering in Computer Science, is the visionary Founder & CEO of QuantumFusion Solutions. He leads the company with a passion for innovation, driving its mission to deliver cutting-edge AI, Cloud, DevOps, and SaaS solutions that shape the future of technology.',
    socials: { linkedin: '#', twitter: '#' },
    icon: Brain,
  },
  {
    id: '2',
    name: 'Zara Kael',
    title: 'CTO, Cloud & DevOps Architect',
    imageUrl: 'https://placehold.co/300x300.png',
    aiHint: 'professional photo cto',
    bio: 'Zara is the driving force behind our robust cloud infrastructures and streamlined DevOps practices, ensuring scalability and resilience.',
    socials: { linkedin: '#', github: '#' },
    icon: CloudCog,
  },
  {
    id: '3',
    name: 'Liam Vance',
    title: 'Head of SaaS Platforms',
    imageUrl: 'https://placehold.co/300x300.png', 
    aiHint: 'professional photo manager',
    bio: 'Liam orchestrates the development of innovative SaaS solutions, focusing on user experience and market impact.',
    socials: { linkedin: '#' },
    icon: Layers2,
  },
  {
    id: '4',
    name: 'Dr. Lena Petrova',
    title: 'Principal AI Researcher',
    imageUrl: 'https://placehold.co/300x300.png',
    aiHint: 'professional photo researcher',
    bio: 'Dr. Petrova leads our R&D in machine learning, pushing the boundaries of what AI can achieve for businesses.',
    socials: { linkedin: '#', github: '#' },
    icon: Brain,
  },
];

export function TeamSection() {
  return (
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
              <Card className="h-full flex flex-col text-center shadow-lg hover:shadow-xl transition-shadow duration-300 group">
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
                    <Link href={member.socials.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} LinkedIn Profile`}>
                      <Linkedin className="h-5 w-5 text-muted-foreground hover:text-primary neon-icon transition-colors" />
                    </Link>
                  )}
                  {member.socials?.twitter && (
                    <Link href={member.socials.twitter} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} Twitter Profile`}>
                      <Twitter className="h-5 w-5 text-muted-foreground hover:text-primary neon-icon transition-colors" />
                    </Link>
                  )}
                  {member.socials?.github && (
                    <Link href={member.socials.github} target="_blank" rel="noopener noreferrer" aria-label={`${member.name} GitHub Profile`}>
                      <Github className="h-5 w-5 text-muted-foreground hover:text-primary neon-icon transition-colors" />
                    </Link>
                  )}
                </CardFooter>
              </Card>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
