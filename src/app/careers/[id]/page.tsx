import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Briefcase, Users, Clock, DollarSign, CalendarDays, Laptop } from 'lucide-react';
import { getPublicJobs, getPublicJobById } from '@/lib/public-data';
import { JobApplyCta } from '@/components/careers/job-apply-cta';
import type { Job } from '@/types';

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://paragonel.vercel.app';

// Revalidate so admin publish/activate/deactivate reflects on the detail page
// without a full rebuild (the admin mutation also purges /careers/[id] via
// revalidatePublicContent).
export const revalidate = 60;

/** Map UI employment type → Schema.org employmentType code. */
function employmentTypeCode(t: string): string {
  switch (t) {
    case 'Full Time':
      return 'FULL_TIME';
    case 'Part Time':
      return 'PART_TIME';
    case 'Contract':
      return 'CONTRACTOR';
    case 'Internship':
      return 'INTERN';
    default:
      return 'FULL_TIME';
  }
}

/**
 * /careers/[id] — public job detail page (Prompt 05J §4).
 *
 * Server-rendered. Fetches the published job by its stable Firestore id via
 * getPublicJobById (filters isActive && !deletedAt server-side). Draft / closed
 * / archived / soft-deleted jobs return null → notFound() (404), so they can
 * never be read publicly. Each job has a unique title, description, canonical
 * URL, OG/Twitter metadata, and JobPosting JSON-LD built from accurate
 * published fields only (no fabricated salary/qualifications/ratings).
 */
export async function generateStaticParams() {
  const jobs = await getPublicJobs(100);
  return jobs.map((j) => ({ id: String(j.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const job = await getPublicJobById(id);
  if (!job) {
    // 404 page — do not index.
    return { title: 'Job not found — Paragonel', robots: { index: false, follow: false } };
  }
  const title = `${job.title} — Careers`;
  const description =
    (typeof job.description === 'string' ? job.description.slice(0, 155) : '') ||
    `Open role: ${job.title} at Paragonel Technologies.`;
  const url = `/careers/${job.id}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: 'article', url },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const job = await getPublicJobById(id);
  if (!job) notFound();

  const company = job.company || 'Paragonel Technologies';
  const jobForApply = { ...job, company } as Job;

  // Related jobs: other active, non-deleted jobs, preferring the same department.
  // No fabricated content — only real published jobs. Limit 3.
  let relatedJobs: Job[] = [];
  try {
    const all = await getPublicJobs(100);
    relatedJobs = (all as Job[])
      .filter((j) => j.id !== job.id && j.isActive && j.deletedAt == null)
      .sort((a, b) => {
        const aMatch = a.department === job.department ? 0 : 1;
        const bMatch = b.department === job.department ? 0 : 1;
        return aMatch - bMatch;
      })
      .slice(0, 3);
  } catch {
    // Non-fatal — the related section is omitted if the fetch fails.
  }

  // JobPosting JSON-LD — accurate published fields only. salaryRange is free
  // text (e.g. "₹8-12 LPA"), not a parseable number, so it is omitted from
  // baseSalary to keep the structured data valid (it is still shown in the UI).
  // No invented qualifications, ratings, reviewCounts, or interactions.
  const jobPostingLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    hiringOrganization: { '@type': 'Organization', name: company, sameAs: siteUrl },
    jobLocation: {
      '@type': 'Place',
      address: { '@type': 'PostalAddress', addressLocality: job.location },
    },
    employmentType: employmentTypeCode(job.employmentType),
    datePosted: job.postedDate || job.createdAt,
    ...(job.deadline ? { validThrough: job.deadline } : {}),
    ...(Array.isArray(job.skills) && job.skills.length ? { skills: job.skills } : {}),
    ...(job.experienceRequired ? { experienceRequirements: job.experienceRequired } : {}),
  };

  // BreadcrumbList JSON-LD (Batch 3 Task 4): Home > Careers > role. Helps search
  // engines show the page's position in the site hierarchy.
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Careers', item: `${siteUrl}/careers` },
      { '@type': 'ListItem', position: 3, name: job.title, item: `${siteUrl}/careers/${job.id}` },
    ],
  };

  return (
    <div className="bg-background min-h-screen">
      <article className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <Link
          href="/careers"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> All open roles
        </Link>

        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {job.title}
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">{company}</p>
          <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center text-muted-foreground">
              <MapPin className="w-4 h-4 mr-2 text-primary" />
              <dt className="sr-only">Location</dt>
              <dd>{job.location}</dd>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="w-4 h-4 mr-2 text-primary" />
              <dt className="sr-only">Department</dt>
              <dd>{job.department}</dd>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Briefcase className="w-4 h-4 mr-2 text-primary" />
              <dt className="sr-only">Employment type</dt>
              <dd>{job.employmentType}</dd>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Laptop className="w-4 h-4 mr-2 text-primary" />
              <dt className="sr-only">Work arrangement</dt>
              <dd>{job.workArrangement}</dd>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Clock className="w-4 h-4 mr-2 text-primary" />
              <dt className="sr-only">Experience</dt>
              <dd>{job.experienceRequired}</dd>
            </div>
            {job.salaryRange ? (
              <div className="flex items-center text-muted-foreground">
                <DollarSign className="w-4 h-4 mr-2 text-primary" />
                <dt className="sr-only">Salary</dt>
                <dd>{job.salaryRange}</dd>
              </div>
            ) : null}
            {job.deadline ? (
              <div className="flex items-center text-muted-foreground">
                <CalendarDays className="w-4 h-4 mr-2 text-primary" />
                <dt className="sr-only">Application deadline</dt>
                <dd>{job.deadline}</dd>
              </div>
            ) : null}
          </dl>
        </header>

        <section className="mt-8">
          <h2 className="text-xl font-semibold text-foreground mb-3">About the role</h2>
          <p className="whitespace-pre-line text-foreground/90 leading-relaxed text-base">
            {job.description}
          </p>
        </section>

        {Array.isArray(job.skills) && job.skills.length > 0 ? (
          <section className="mt-8">
            <h2 className="text-xl font-semibold text-foreground mb-3">Skills</h2>
            <ul className="flex flex-wrap gap-2">
              {job.skills.map((s: string) => (
                <li
                  key={s}
                  className="rounded-full border border-border bg-secondary/40 px-3 py-1 text-sm text-foreground"
                >
                  {s}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-10 border-t border-border pt-8 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Interested in this role?</p>
            <p className="text-sm text-muted-foreground">
              Apply with your resume — we review every application.
            </p>
          </div>
          <JobApplyCta job={jobForApply} />
        </section>

        {relatedJobs.length > 0 ? (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="text-xl font-semibold text-foreground mb-4">Related open roles</h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {relatedJobs.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/careers/${r.id}`}
                    className="block rounded-lg border border-border p-4 hover:border-primary/40 transition-colors"
                  >
                    <p className="font-medium text-foreground">{r.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{r.company || company}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {r.location}{r.employmentType ? ` · ${r.employmentType}` : ''}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
        />
      </article>
    </div>
  );
}
