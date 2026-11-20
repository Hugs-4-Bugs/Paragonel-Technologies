import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Paragonel',
  description:
    'How Paragonel Technologies collects, uses, and protects your information.',
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
            Last updated: November 20, 2026. This policy explains how Paragonel
            Technologies (&ldquo;Paragonel&rdquo;, &ldquo;we&rdquo;) handles the
            personal information you share with us through this website.
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
              <h2 className="text-2xl font-bold mb-3">Your rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may request access to, correction of, or deletion of your
                personal data, or unsubscribe from the newsletter at any time
                using the link in any newsletter email. To exercise these rights
                or ask questions about this policy, contact us through the contact
                form on this site.
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
