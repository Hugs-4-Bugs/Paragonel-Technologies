
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ScrollFadeIn } from '@/components/ui/scroll-fade-in';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Linkedin, Twitter, Github, UserCircle } from 'lucide-react'; // Added UserCircle

const teamMembers = [
  {
    id: '1',
    name: 'Dr. Evelyn Reed',
    title: 'Founder & CEO',
    imageUrl: 'https://placehold.co/300x300/3498DB/FFFFFF.png?text=ER',
    aiHint: 'professional portrait',
    bio: 'Visionary leader with 20+ years in AI and tech innovation. Passionate about transforming the future of work.',
    socials: {
      linkedin: '#',
      twitter: '#',
    },
  },
  {
    id: '2',
    name: 'Marcus Chen',
    title: 'CTO',
    imageUrl: 'https://placehold.co/300x300/663399/FFFFFF.png?text=MC',
    aiHint: 'professional portrait',
    bio: 'Expert technologist driving QuantumLeap\'s platform architecture and AI development.',
    socials: {
      linkedin: '#',
      github: '#',
    },
  },
  {
    id: '3',
    name: 'Aisha Khan',
    title: 'Head of Product',
    // No image, fallback will be used
    aiHint: 'professional portrait',
    bio: 'Strategic product leader focused on user-centric design and impactful solutions.',
    socials: {
      linkedin: '#',
    },
  },
  {
    id: '4',
    name: 'David Miller',
    title: 'Lead Data Scientist',
    imageUrl: 'https://placehold.co/300x300/1A237E/FFFFFF.png?text=DM',
    aiHint: 'professional portrait',
    bio: 'Specializes in machine learning models that power our personalized recommendation engines.',
    socials: {
      linkedin: '#',
      twitter: '#',
      github: '#',
    },
  },
];

export function TeamSection() {
  return (
    <section className="section-padding bg-secondary/30 dark:bg-secondary/10">
      <div className="container px-4 md:px-6">
        <ScrollFadeIn className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Meet Our <span className="text-primary">Team</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            The passionate minds behind QuantumLeap, dedicated to innovation and excellence in shaping the future of careers.
          </p>
        </ScrollFadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <ScrollFadeIn key={member.id} delay={`${index * 100}ms`}>
              <Card className="h-full flex flex-col text-center shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="items-center pt-8">
                  {member.imageUrl ? (
                    <Image
                      src={member.imageUrl}
                      alt={member.name}
                      width={120}
                      height={120}
                      className="rounded-full border-4 border-primary/50 object-cover mb-4"
                      data-ai-hint={member.aiHint}
                    />
                  ) : (
                     <div className="w-[120px] h-[120px] bg-muted rounded-full flex items-center justify-center mb-4 border-4 border-primary/50">
                        <UserCircle className="w-20 h-20 text-muted-foreground" />
                    </div>
                  )}
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <p className="text-sm text-primary font-medium">{member.title}</p>
                </CardHeader>
                <CardContent className="flex-grow px-6 py-4">
                  <p className="text-sm text-muted-foreground line-clamp-3">{member.bio}</p>
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
