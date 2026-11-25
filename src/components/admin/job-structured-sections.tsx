'use client';
/**
 * JobStructuredSections — the structured job-posting sections (Task 2/3).
 *
 * Shared by the admin job create (/admin/jobs/new) + edit (/admin/jobs/[id]/edit)
 * pages. Renders the structured fields the previous form lacked: summary,
 * responsibilities, qualifications, preferred qualifications, benefits,
 * certifications, reporting manager, shift/travel, about team, company culture,
 * additional notes, screening questions, + the application-requirement toggles
 * (resumeRequired / linkedinRequired / portfolioRequired).
 *
 * All fields are OPTIONAL — they never block save/publish + the public detail
 * page renders a section ONLY when the field is non-empty (no empty sections,
 * no fabricated content). Mandatory fields stay in the parent pages (Job
 * Overview: title, department, type, arrangement, location, experience, skills,
 * description).
 */
import { FormField, FormControl, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * `form` is typed loosely (the react-hook-form control is invariant in its
 * generic, so Control<JobFormValues> from the two pages is not assignable to a
 * shared Control<any>). The pages enforce their own schema via zodResolver;
 * this shared component is presentational only — it binds FormField to the
 * control by name, which react-hook-form validates against the page's schema.
 */
export function JobStructuredSections({ form }: { form: { control: any } }) {
  return (
    <>
      {/* Role Description */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="border-b bg-zinc-50/50">
          <CardTitle className="text-lg font-bold">Role Description</CardTitle>
          <CardDescription>A short summary + the full role context.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <FormField
            control={form.control}
            name="summary"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Short summary <span className="text-zinc-400 font-normal">(optional)</span></FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="A one-line pitch for the role (shown on the job card + detail page)." {...field} />
                </FormControl>
                <FormDescription>Max 500 characters.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Responsibilities */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="border-b bg-zinc-50/50">
          <CardTitle className="text-lg font-bold">Key Responsibilities</CardTitle>
          <CardDescription>One per line, or a structured list.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <FormField
            control={form.control}
            name="responsibilities"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea rows={6} placeholder={"Own the frontend architecture for AcquisitionOS\nCollaborate with design + backend\nMentor junior engineers"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Required Qualifications */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="border-b bg-zinc-50/50">
          <CardTitle className="text-lg font-bold">Required Qualifications</CardTitle>
          <CardDescription>What the candidate MUST have.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <FormField
            control={form.control}
            name="qualifications"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea rows={6} placeholder={"5+ years building production React apps\nStrong TypeScript\nExperience with Next.js"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Preferred Qualifications */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="border-b bg-zinc-50/50">
          <CardTitle className="text-lg font-bold">Preferred Qualifications <span className="text-zinc-400 font-normal text-sm">(optional)</span></CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <FormField
            control={form.control}
            name="preferredQualifications"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea rows={5} placeholder={"Experience with Genkit / AI flows\nOpen-source contributions"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Compensation + Benefits */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="border-b bg-zinc-50/50">
          <CardTitle className="text-lg font-bold">Compensation & Benefits <span className="text-zinc-400 font-normal text-sm">(optional)</span></CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <FormField
            control={form.control}
            name="benefits"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Benefits</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder={"Health insurance\nRemote-first\nLearning budget"} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="certifications"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certifications (if any)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. AWS Certified Solutions Architect" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Employment Details */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="border-b bg-zinc-50/50">
          <CardTitle className="text-lg font-bold">Employment Details <span className="text-zinc-400 font-normal text-sm">(optional)</span></CardTitle>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="reportingManager"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reporting manager</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. VP Engineering" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shiftHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Shift / working hours</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 10:00–19:00 IST" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="travelRequired"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Travel requirements</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. None / Occasional" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="educationRequired"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Education requirements</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. B.Tech in CS or equivalent" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Team + Culture */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="border-b bg-zinc-50/50">
          <CardTitle className="text-lg font-bold">Team & Culture <span className="text-zinc-400 font-normal text-sm">(optional)</span></CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <FormField
            control={form.control}
            name="aboutTeam"
            render={({ field }) => (
              <FormItem>
                <FormLabel>About the team</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="A short note about the team the candidate would join." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyCulture"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company culture</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="What it's like to work at Paragonel." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Application Requirements */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="border-b bg-zinc-50/50">
          <CardTitle className="text-lg font-bold">Application Requirements <span className="text-zinc-400 font-normal text-sm">(optional)</span></CardTitle>
          <CardDescription>What a candidate must submit for THIS role.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <FormField
            control={form.control}
            name="resumeRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Resume required</FormLabel>
                  <FormDescription>If on, the application form rejects submission without a resume.</FormDescription>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="linkedinRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>LinkedIn profile required</FormLabel>
                  <FormDescription>Shown as a requirement on the job detail page (advisory; not yet hard-validated).</FormDescription>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="portfolioRequired"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox checked={!!field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Portfolio / GitHub required</FormLabel>
                  <FormDescription>Shown as a requirement on the job detail page (advisory; not yet hard-validated).</FormDescription>
                </div>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="screeningQuestions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Screening questions (optional)</FormLabel>
                <FormControl>
                  <Textarea rows={4} placeholder={"Describe your most complex React architecture decision.\nLink to a PR you're proud of."} {...field} />
                </FormControl>
                <FormDescription>Shown on the job detail page; not yet auto-enforced in the application form.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="border-b bg-zinc-50/50">
          <CardTitle className="text-lg font-bold">Additional Notes <span className="text-zinc-400 font-normal text-sm">(optional)</span></CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <FormField
            control={form.control}
            name="additionalNotes"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea rows={3} placeholder="Anything else relevant to the role." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </>
  );
}
