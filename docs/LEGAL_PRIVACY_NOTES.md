# Legal & Privacy Implementation Notes — Paragonel Technologies

**Status:** Internal implementation record (Prompt 05F additional — Contact form
consent, privacy & legal compliance). **Date:** 2026-11-21.
**NOT a legal certification.** This records what was implemented, the legal
sources consulted, and the outstanding dependencies. The implementation reflects
Paragonel's actual data practices and must be reviewed by qualified legal
counsel before being represented as legally compliant.

---

## 1. Applicable legal sources consulted

Research via official + reputable sources (web search, Nov 2026). Distilled
below; full snippets in the research working file.

### In force
- **Digital Personal Data Protection Act, 2023 (DPDP Act).** Enacted August
  2023; in force. Consent must be free, specific, informed, unambiguous, and
  capable of being withdrawn. Data principals have rights (access, correction,
  erasure, grievance redressal, nomination) and the right to readily available
  means of grievance redressal. Sources: India Code DPDP Act 2023; MEITY;
  explainer analyses (Aug 2023).
- **Information Technology Act, 2000** + **SPDI Rules, 2011** (Sensitive
  Personal Data or Information). Remain applicable to the extent relevant to
  the actual data and processing (e.g. sensitive personal data handling,
  reasonable security practices), alongside the DPDP Act during transition.
- **Indian Contract Act / consumer protection** fundamentals apply to Terms.

### Notified, phased commencement
- **Digital Personal Data Protection Rules, 2025.** Notified by MEITY on
  **14 November 2025**, brought into force in **phases**. Certain data-principal
  rights enforcement provisions and the grievance-officer obligation schedule
  take effect on a phased timeline (not all fully in force as of the
  implementation date 2026-11-21). Sources: MEITY notification 14 Nov 2025;
  MEITY phase-wise implementation note (Nov 2025).

### Conditional (jurisdictional)
- **GDPR (EU) / ePrivacy (cookie) requirements** apply only if Paragonel
  targets or processes personal data of people in the EU/EEA. Paragonel is an
  India-based company; the contact form is not deliberately targeted at EU/EEA
  data subjects. The consent + cookie-preference implementation is broadly
  aligned with GDPR/ePrivacy principles (opt-in, separate consents, withdrawable,
  essential vs non-essential cookies) as a privacy best practice, but Paragonel
  does not claim GDPR compliance absent a determination that it is in scope.

### Recommended best practice (not strict statutory obligation)
- Separating consents by purpose; no pre-ticked optional consents; recording
  consent version + timestamp; providing withdrawal mechanisms; distinguishing
  strictly-necessary from optional cookies.

**No statutory obligation was invented.** Where a checkbox is mandatory, it
reflects the DPDP consent standard for processing the inquiry, not a generic
"legal compliance" claim.

---

## 2. Consent purposes + exact wording (as implemented)

### A. Inquiry processing — MANDATORY (acknowledgement of the processing notice)
- **Wording:** "I have read the Privacy Notice and understand that Paragonel
  Technologies Pvt. Ltd. will use the information I provide to respond to and
  manage my inquiry, as explained in the Privacy Policy."
- **Lawful basis:** the DPDP Act consent standard for processing personal data
  to respond to the inquiry. This is an **acknowledgement of the processing
  notice**, accurately labelled — it is NOT described as "consent" for an
  unrelated purpose.
- **Default:** unchecked. **Enforcement:** client-side (submit disabled until
  checked + inline validation) AND server-side (`contactSchema.consentAcknowledged`
  zod `.refine(v => v === true)` — a direct API call without it returns 400).

### B. Marketing communications — OPTIONAL, SEPARATE
- **Wording:** "I would like to receive occasional product updates, engineering
  insights and relevant communications from Paragonel."
- **Default:** unchecked. **Not** a condition of inquiry submission. Recorded
  separately (`marketingConsent`) on the lead. Withdrawal via contact email.
  Marketing messages are never sent merely because an inquiry was submitted.

### C. Cookies — SEPARATE from contact submission
- Cookie consent is handled by the existing banner/settings modal, independent
  of the contact form. Cookie preferences never block inquiry submission.
- The site loads **NO** analytics, marketing, advertising or performance
  scripts. Only strictly-necessary cookies are used (auth/session/theme/consent).
- The preference panel lists categories (Functional/Performance/Analytics/
  Marketing) honestly labelled "not currently used by Paragonel" so visitors can
  record preferences for future use without the site claiming trackers that do
  not exist.

---

## 3. Actual cookie / tracker behavior (verified)

- **No** Google Analytics, GTM, Meta Pixel, advertising networks, Hotjar,
  Mixpanel, Segment, Amplitude, Plausible, Matomo, Clarity, or any other
  analytics/marketing/tracking script is loaded by the website (grep across
  layout/navbar/footer/page confirmed empty).
- Strictly-necessary only: authentication + secure sessions, abuse protection
  (rate-limiting/CSRF), theme preference, cookie-consent record.
- The previous `CookieConsentManager` SIMULATED loading trackers
  (`console.log "Mock Google Analytics initialized"`, `"Mock Facebook Pixel
  initialized"`). That simulation was **removed** — it falsely claimed trackers
  were active.
- Cookie-consent record (notice version + UTC timestamp) stored in local
  storage alongside preferences.

---

## 4. Server-side enforcement + consent evidence

- `contactSchema` (zod) requires `consentAcknowledged === true` (refine). A
  direct API call without it returns 400 with the message. Verified:
  - no-consent field → 400 "Required".
  - `consentAcknowledged: false` → 400 "Please acknowledge the Privacy Notice
    to submit your inquiry."
- Consent evidence is attached to the stored lead **server-side** (not from
  the client body, so it cannot be forged):
  ```
  consent: {
    acknowledged: true,                      // guaranteed by schema refine
    marketingConsent: <boolean>,             // separate
    consentNoticeVersion: '2026-11-21-v1',   // server constant
    privacyPolicyVersion: '2026-11-21-v1',   // server constant
    termsVersion: '2026-11-21-v1',           // server constant
    timestampUtc: <ISO server timestamp>,
  }
  ```
- No raw IP address, fingerprint, or tracking identifier is stored as PII for
  consent evidence. The `dedupeFingerprint` is a non-crypto hash used only for
  dedupe, not personal data.
- Consent records are not silently overwritten by later submissions (each lead
  is a separate document with its own consent evidence).

---

## 5. Security + data handling (existing, preserved)

- Input validation + sanitization (zod length/shape caps).
- Honeypot field; rate limiting (5 / 10 min / client); dedupe.
- Server-side Firestore write via Admin SDK only; browser never writes to DB.
- Lead stored BEFORE email send (notification failure cannot discard the CRM
  record); notification status recorded on the lead.
- Admin CRM access behind authenticated, role-limited sessions.
- No private data leaked through logs (notification detail codes only; no
  message contents/passwords/tokens logged).

---

## 6. Tests completed

- Contact submission rejected when mandatory consent missing (client + server).
- Contact submission succeeds when consent valid (201 path preserved).
- Direct API calls cannot bypass consent (both no-field and false cases → 400).
- Marketing consent optional + independent (not required for 201).
- Cookie preferences do not block inquiry submission.
- No optional cookies/scripts load before consent (none load at all).
- Privacy Policy + Terms + Cookie Policy links resolve (200).
- Consent version + timestamp recorded (server-side on lead; client-side for
  cookie consent).
- Existing email-delivery + inquiry workflow preserved (notificationStatus on
  lead unchanged).
- Rate limiting + validation still work.
- 0 `.net`; 0 visible beta URL; Private Beta throughout; 0 fabricated content.
- tsc 0; clean build 0 (with Firestore emulator up — the designed build path).
- Responsive: 0 overflow at 1440/1366/1280/390/375 for blog + contact + terms +
  cookie-policy. (Pre-existing site-wide 768px navbar mega-menu overflow is
  documented for the pending polish task — not a 05F regression.)

---

## 7. Outstanding legal / founder-provided dependencies

1. **Grievance officer designation.** Under the DPDP Rules 2025 (phased), a
   formal designated grievance officer may become legally required. Paragonel
   has not designated one; until then, privacy complaints route to
   contact@paragonel.com. **Founder dependency:** publish designated grievance
   officer contact details when the applicable DPDP Rules phase requires it.
2. **Terms governing-law + liability clauses.** Stated as India / Bengaluru
   courts + standard liability limitations subject to legal review. **Founder
   dependency:** qualified legal counsel review before relying on these clauses.
3. **Retention-period specificity.** The Privacy Policy states records are
   retained "as long as needed… deleted when no longer required or on request."
   A specific retention period (e.g. X months after inquiry resolution) would
   strengthen the DPDP data-retention posture. **Founder dependency:** confirm
   the retention period to publish.
4. **GDPR scope determination.** If Paragonel begins deliberately targeting
   EU/EEA visitors, a formal GDPR scope assessment is needed. Not currently in
   scope.
5. **Cookie consent re-prompt on version change.** The notice version is
   recorded; a strict re-prompt-on-version-mismatch flow is not yet wired into
   the read path (preferences persist). Low priority; current behavior is
   defensible.

---

## 8. Final principle (restated)

This is a real privacy-respecting inquiry experience, not a checkbox designed to
make the company appear legally immune. The wording reflects the actual
lawful basis (inquiry-processing acknowledgement), consents are separated by
purpose, cookie claims match the actual (non-)use of trackers, and consent
evidence is captured server-side. **The implementation must be reviewed by
qualified legal counsel before being represented as legally compliant.**
