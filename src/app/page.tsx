import { Hero } from '@/components/sections/hero';
import { JobListings } from '@/components/sections/job-listings';
import { AiContent } from '@/components/sections/ai-content';
import { Separator } from '@/components/ui/separator';

export default function HomePage() {
  return (
    <>
      <Hero />
      <JobListings />
      <Separator className="my-8 md:my-12 container max-w-4xl" />
      <AiContent />
    </>
  );
}
