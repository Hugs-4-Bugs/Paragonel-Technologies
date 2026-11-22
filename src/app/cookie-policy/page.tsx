import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | Paragonel',
  description: 'How Paragonel Technologies uses cookies and similar technologies, and how to manage your preferences.',
  alternates: { canonical: '/cookie-policy' },
};

/**
 * /cookie-policy — Cookie Policy (Prompt 05F Contact consent work).
 *
 * Accurately reflects ACTUAL cookie/tracker usage. Paragonel uses ONLY
 * strictly-necessary cookies (auth/session/theme/consent-record). No analytics,
 * marketing, advertising or performance-tracking scripts are loaded by the
 * website. No fabricated categories or trackers. Preference controls + version
 * recording described honestly.
 */
export default function CookiePolicyPage() {
  return (
    <section className="pt-hero-backdrop">
      <div className="pt-shell pt-section" style={{ paddingTop: 'clamp(5rem, 9vw, 7rem)', paddingBottom: 'clamp(3rem, 6vw, 5rem)' }}>
        <div className="mx-auto max-w-3xl">
          <span className="pt-eyebrow">Legal</span>
          <h1 className="pt-display mt-5 text-foreground">Cookie Policy</h1>
          <p className="pt-lead mt-5 text-muted-foreground">
            Last updated: November 21, 2026. This policy explains the cookies and similar
            technologies Paragonel Technologies Pvt. Ltd. uses on this website, and how you can
            manage your preferences. It complements our{' '}
            <Link href="/privacy-policy" className="text-primary underline underline-offset-2">Privacy Policy</Link>.
          </p>

          <div className="mt-10 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">What we actually use</h2>
              <p className="text-muted-foreground leading-relaxed">
                Paragonel uses <strong className="text-foreground">only strictly-necessary</strong>{' '}
                cookies and local storage. These enable core functionality: authentication and secure
                sessions, protecting the site against abuse (such as rate limiting and CSRF defence),
                remembering your light/dark theme preference, and recording your cookie-consent
                decision. The site does <strong className="text-foreground">not</strong> load Google
                Analytics, Meta Pixel, advertising networks, or any other analytics, marketing or
                tracking scripts. We do not sell personal data to advertisers.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Categories shown in the preference panel</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                The cookie preference panel lists categories so you can record your preference for any
                future use. Today, only the first category is actually in use:
              </p>
              <ul className="space-y-2 text-muted-foreground list-disc pl-6">
                <li>
                  <strong className="text-foreground">Strictly Necessary — used.</strong>{' '}
                  Always on; cannot be disabled because the site cannot function without them.
                </li>
                <li>
                  <strong className="text-foreground">Functional — not currently used.</strong>{' '}
                  No functional cookies or scripts are loaded. Your preference is recorded for if/when
                  such a feature is added.
                </li>
                <li>
                  <strong className="text-foreground">Performance — not currently used.</strong>{' '}
                  No performance / real-user-monitoring scripts are loaded.
                </li>
                <li>
                  <strong className="text-foreground">Analytics — not currently used.</strong>{' '}
                  No analytics scripts (e.g. Google Analytics) are loaded.
                </li>
                <li>
                  <strong className="text-foreground">Marketing &amp; Advertising — not currently used.</strong>{' '}
                  No marketing or advertising scripts (e.g. Meta Pixel) are loaded.
                </li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                We will not claim to use a category that is not actually in use. If a real tracker is
                ever added, it will be gated on the corresponding preference, disclosed here, and the
                category description updated before it loads.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Managing your preferences</h2>
              <p className="text-muted-foreground leading-relaxed">
                The consent banner offers <strong className="text-foreground">Accept All</strong>,{' '}
                <strong className="text-foreground">Reject Non-Essential</strong>, and{' '}
                <strong className="text-foreground">Customize</strong>. Optional categories are never
                pre-selected. You can change or withdraw your preferences at any time via the{' '}
                <strong className="text-foreground">Cookie Settings</strong> link in the site footer.
                Because Paragonel loads no non-essential scripts today, rejecting non-essential
                cookies changes nothing about your browsing experience.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">How preferences are recorded</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your preference and a consent record (the notice version and an UTC timestamp) are
                stored in your browser&apos;s local storage. Browser storage alone is not proof of
                consent for regulated processing; for the contact form, separate server-side consent
                evidence (acknowledgement state, notice version, privacy-policy version and a server
                timestamp) is recorded with each submission as described in the{' '}
                <Link href="/privacy-policy" className="text-primary underline underline-offset-2">Privacy Policy</Link>.
              </p>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                For questions about cookies or to request erasure of stored preferences, contact{' '}
                <a href="mailto:contact@paragonel.com" className="text-primary underline underline-offset-2">contact@paragonel.com</a>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
