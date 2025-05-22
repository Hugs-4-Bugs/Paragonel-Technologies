
import { BlogSection } from '@/components/sections/blog-section';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | QuantumLeap',
  description: 'Insights, articles, and news from the QuantumLeap team.',
};

export default function BlogPage() {
  return (
    <>
      <BlogSection />
    </>
  );
}
