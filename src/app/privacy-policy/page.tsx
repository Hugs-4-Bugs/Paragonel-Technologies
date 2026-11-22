import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Paragonel',
  description:
    'How Paragonel Technologies collects, uses, and protects your information.',
  alternates: { canonical: '/privacy-policy' },
};

/**
 * Privacy Policy (Phase 1B).
 *
 * Reflects the current submission architecture: contact, newsletter, and job
 * application data is submitted through server-side API routes and stored in
 * the Paragonel CRM (Firestore). Principles are stated accurately and no
 * certifications or compliance frameworks are claimed that have not been
 * established.
 */
export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="py-20 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-black tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-12">
            Last updated: November 21, 2026. This policy explains how Paragonel
            Technologies (&ldquo;Paragonel&rdquo;, &ldquo;we&rdquo;) handles the
            personal information you share with us through this website, including
            the consent choices on the contact form.
          </p>

          <div className="prose prose-zinc dark:prose-invert max-w-none space-y-10">
            <div>
              <h2 className="text-2xl font-bold mb-3">Information we collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect only the information you voluntarily provide through
                our forms: your name, email address, company (optional), and
                message when you contact us; your email address when you
                subscribe to our newsletter; and your name, contact details,
                skills, and resume when you apply for a role. Submissions are
                sent to our server over HTTPS and stored in our customer
                relationship management system. We do not use tracking pixels or
                third-party advertising networks on this site.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">How we use your information</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use the information you submit to respond to your enquiry,
                deliver the newsletter you signed up for, evaluate your job
                application, and operate our business. When you contact us, an
                acknowledgement is sent to the email address you provided and a
                copy of your enquiry is routed to our internal team.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Consent + your choices</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Paragonel keeps consents separate, and never bundles unrelated
                purposes into a single compulsory checkbox. Under India&apos;s
                Digital Personal Data Protection Act, 2023 (DPDP Act), consent
                must be free, specific, informed and unambiguous; we apply that
                standard to the contact form:
              </p>
              <ul className="space-y-2 text-muted-foreground list-disc pl-6">
                <li>
                  <strong className="text-foreground">Inquiry processing (required).</strong>{' '}
                  To submit a contact inquiry you must acknowledge that you have read this Privacy
                  Notice and understand Paragonel will use the information to respond to and manage
                  your inquiry. This is unchecked by default and enforced on the server — a direct
                  API request cannot bypass it.
                </li>
                <li>
                  <strong className="text-foreground">Marketing communications (optional, separate).</strong>{' '}
                  A separate, optional checkbox records whether you would like occasional product
                  updates and engineering insights. It is never a condition of submitting an
                  inquiry, and we do not send marketing messages merely because an inquiry was
                  submitted. You can withdraw at any time by emailing{' '}
                  <a href="mailto:contact@paragonel.com" className="text-primary underline underline-offset-2">contact@paragonel.com</a>.
                </li>
                <li>
                  <strong className="text-foreground">Cookies (separate).</strong>{' '}
                  Cookie preferences are managed separately from contact-form submission and never
                  block an inquiry. See the{' '}
                  <Link href="/cookie-policy" className="text-primary underline underline-offset-2">Cookie Policy</Link>.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                You may withdraw consent or request erasure at any time; withdrawal does not affect
                the lawfulness of processing carried out before withdrawal. Website use is also
                subject to our{' '}
                <Link href="/terms" className="text-primary underline underline-offset-2">Terms &amp; Conditions</Link>.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Our privacy principles</h2>
              <ul className="space-y-3 text-muted-foreground">
                <li>
                  <strong className="text-foreground">1. We do not sell your information.</strong>{' '}
                  Your personal data is never sold to anyone.
                </li>
                <li>
                  <strong className="text-foreground">
                    2. We do not use your information for AI model training.
                  </strong>{' '}
                  Submitted data is not used to train artificial intelligence or
                  machine-learning models.
                </li>
                <li>
                  <strong className="text-foreground">
                    3. We do not share your information with unrelated third
                    parties.
                  </strong>{' '}
                  Data is shared only with the infrastructure providers below,
                  strictly as needed to operate the service.
                </li>
                <li>
                  <strong className="text-foreground">
                    4. Infrastructure providers are disclosed accurately.
                  </strong>{' '}
                  See the section below.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">
                Infrastructure providers
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                To operate this website we rely on the following service
                providers, who process data only as necessary to provide the
                service described:
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <strong className="text-foreground">Google / Firebase.</strong>{' '}
                  Web hosting, application platform, and the database and file
                  storage used for the CRM and submitted documents (resume
                  uploads). Operated under Google&apos;s infrastructure.
                </li>
                <li>
                  <strong className="text-foreground">Email delivery provider.</strong>{' '}
                  Outbound acknowledgement and notification email is sent through
                  our configured SMTP provider. The provider processes email
                  metadata as needed for delivery.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                We do not knowingly share your data with any other third party.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Data retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                CRM records (enquiries, subscriptions, applications) are retained
                for as long as needed to respond to you and operate our business,
                and are deleted when no longer required or upon your request.
                Records can be soft-deleted (archived) by our team and permanently
                removed on request. Job application resumes are stored in our file
                storage and accessible only to authorised Paragonel personnel.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Your rights + grievances</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may request access to, correction of, or deletion of your
                personal data, withdraw consent, or unsubscribe from the
                newsletter at any time using the link in any newsletter email.
                Under the DPDP Act, 2023, you also have the right to grievance
                redressal. To exercise any of these rights or raise a privacy
                complaint, contact us at{' '}
                <a href="mailto:contact@paragonel.com" className="text-primary underline underline-offset-2">contact@paragonel.com</a>{' '}
                or through the contact form on this site; enquiries are routed to
                our internal team at Paragonel Technologies Pvt. Ltd., HSR Layout,
                Bangalore 560102, India.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                The DPDP Rules, 2025 (notified 14 November 2025) are being
                brought into force in phases. Certain data-principal rights and
                grievance-officer obligations under the Rules take effect on a
                phased schedule; where a formal designated grievance officer
                becomes legally required, Paragonel will publish those contact
                details here. Until then, privacy complaints are handled through
                the contact channel above. We do not claim a certification,
                Data Protection Officer, or compliance status that has not been
                formally established.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                Public form submissions are validated and written to the CRM only
                by our server-side application logic; the browser cannot write to
                our database directly. Administrative access to CRM data is
                protected by authenticated, role-limited sessions. We do not
                claim certifications or compliance frameworks that have not been
                formally established.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-3">Changes to this policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this policy as our practices evolve. Material
                changes will be reflected by the &ldquo;last updated&rdquo; date
                above.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
