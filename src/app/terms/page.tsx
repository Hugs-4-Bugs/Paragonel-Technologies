import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions | Paragonel',
  description: 'Terms governing use of the Paragonel Technologies website and user-submitted inquiries.',
  alternates: { canonical: '/terms' },
};

/**
 * /terms — Terms & Conditions (Prompt 05F Contact consent work).
 *
 * Accurate, plain-language terms covering website use + user-submitted inquiry
 * information. Not a substitute for the Privacy Notice (linked separately).
 * No fabricated registered office, legal representative, certifications or
 * liability waivers of statutory rights. Governing law stated subject to legal
 * review. Verified company contact details only.
 */
export default function TermsPage() {
  return (
    <section className="pt-hero-backdrop">
      <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(5rem, 9vw, 7rem)', paddingBottom: 'clamp(3rem, 6vw, 5rem)' }}>
        <div className="mx-auto max-w-3xl">
          <span className="pt-eyebrow">Legal</span>
          <h1 className="pt-display mt-5 text-foreground">Terms &amp; Conditions</h1>
          <p className="pt-lead mt-5 text-muted-foreground">
            Last updated: November 21, 2026. These terms govern your use of the Paragonel
            Technologies Pvt. Ltd. website and any information you submit to us. They are distinct
            from our{' '}
            <Link href="/privacy-policy" className="text-primary underline underline-offset-2">Privacy Policy</Link>{' '}
            and{' '}
            <Link href="/cookie-policy" className="text-primary underline underline-offset-2">Cookie Policy</Link>.
          </p>

          <div className="mt-10 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">1. Website use</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may use this website for lawful purposes, including learning about Paragonel,
                its products and services, and submitting genuine inquiries. You agree not to misuse
                the site — for example, by attempting unauthorized access, submitting malware,
                interfering with service, or using automated systems to abuse forms.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">2. User-submitted inquiry information</h2>
              <p className="text-muted-foreground leading-relaxed">
                When you submit a contact inquiry, you provide your name, email, company (optional)
                and message, along with an acknowledgement that you have read the Privacy Notice.
                You are responsible for the accuracy of the information you submit and for ensuring
                you have the right to share it. How we handle that information is described in the{' '}
                <Link href="/privacy-policy" className="text-primary underline underline-offset-2">Privacy Policy</Link>;
                these terms do not override the privacy commitments made there.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">3. Prohibited submissions</h2>
              <p className="text-muted-foreground leading-relaxed">
                You may not submit content that is unlawful, infringes others&apos; rights, contains
                malware or malicious code, harasses or defames anyone, or is otherwise abusive. We may
                decline to act on, or may delete, submissions we reasonably believe violate these terms,
                without notice.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">4. Intellectual property</h2>
              <p className="text-muted-foreground leading-relaxed">
                The website content — text, design, branding, the editorial system, and the Paragonel
                name and logos — is owned by Paragonel Technologies Pvt. Ltd. or its licensors and is
                protected by applicable intellectual-property law. You may view and share content for
                personal, non-commercial informational use. Nothing here grants you a license to
                reproduce or redistribute the site or its branding beyond that.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">5. Third-party links &amp; services</h2>
              <p className="text-muted-foreground leading-relaxed">
                This site may link to third-party services (for example, the AcquisitionOS private-beta
                application hosted on an approved external domain). Those services have their own terms
                and privacy practices; Paragonel is not responsible for the content or practices of
                third-party services beyond what is described in our Privacy Policy.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">6. Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                This website and its content are provided &ldquo;as is&rdquo;. To the extent permitted by
                law, Paragonel excludes liability for indirect or consequential loss arising from your
                use of the site. Nothing in these terms excludes or limits any liability that cannot be
                excluded under applicable law, including liability for fraud or for personal injury
                caused by negligence. These terms do not waive any statutory rights you may have.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">7. Governing law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These terms are governed by the laws of India. Subject to legal review, any dispute
                arising from these terms or your use of the website will be subject to the jurisdiction
                of the courts at Bengaluru, Karnataka, India. The applicable law includes, where
                relevant, the Digital Personal Data Protection Act, 2023 and the Information Technology
                Act, 2000.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">8. Contact + changes</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update these terms as our practices or the law changes; material changes will be
                reflected in the &ldquo;last updated&rdquo; date above. For questions about these terms,
                contact{' '}
                <a href="mailto:contact@paragonel.com" className="text-primary underline underline-offset-2">contact@paragonel.com</a>{' '}
                or write to Paragonel Technologies Pvt. Ltd., HSR Layout, Bangalore 560102, India.
              </p>
            </div>

            <p className="border-t border-border pt-6 text-xs text-muted-foreground">
              These Terms are not a substitute for the Privacy Notice. Consent for processing of inquiry
              information is given via the contact-form acknowledgement described in the{' '}
              <Link href="/privacy-policy" className="text-primary underline underline-offset-2">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
