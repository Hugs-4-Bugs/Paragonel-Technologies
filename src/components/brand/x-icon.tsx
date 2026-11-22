import type { SVGProps } from 'react';

/**
 * XIcon — the official X (formerly Twitter) brand mark.
 *
 * Used for the founder's personal X profile link (https://x.com/PrabhatKumarHQ).
 * Renders the X wordless logo (the brand's current mark), NOT the legacy Twitter
 * bird, so the link is visually identifiable as an X profile. Monochrome via
 * `currentColor` so it inherits the surrounding text colour in both themes.
 *
 * The path is the brand's published wordless mark, used here solely to identify
 * a link to an X profile (nominative/identification use). No affiliation or
 * endorsement is implied.
 */
export function XIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path
        fill="currentColor"
        d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.926l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      />
    </svg>
  );
}
