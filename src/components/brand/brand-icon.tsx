import type { SVGProps } from 'react';

/**
 * SimpleIconSlim — the minimal shape of a `simple-icons` entry we use.
 * Keeps this file free of a build-time import of the (large) simple-icons
 * package; callers pass the icon object they imported at the call site, so
 * bundlers tree-shake to only the brand icons actually rendered.
 */
export interface SimpleIconSlim {
  readonly title: string;
  readonly hex: string;
  readonly path: string;
}

interface BrandIconProps extends Omit<SVGProps<SVGSVGElement>, 'title'> {
  /** A simple-icons entry ({ title, hex, path }). */
  icon: SimpleIconSlim;
  /** When true, render the brand's official hex colour; otherwise currentColor (monochrome, theme-aware). */
  colored?: boolean;
}

/**
 * BrandIcon — renders a brand logo from a `simple-icons` entry as an inline
 * `<svg>`. Real, recognizable brand logos (no invented paths). Monochrome by
 * default (`currentColor`) so the mark inherits the surrounding text colour and
 * reads correctly in both light and dark themes — the restrained, enterprise
 * presentation the research recommended (avoid a noisy multi-colour logo wall).
 *
 * The mark is used to identify a technology/platform Paragonel works with or can
 * integrate with. simple-icons paths are MIT-licensed; displaying a brand mark
 * for identification does not imply an official partnership or endorsement.
 */
export function BrandIcon({ icon, colored = false, className, ...props }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      role="img"
      aria-label={icon.title}
      focusable="false"
      className={className}
      {...props}
    >
      <title>{icon.title}</title>
      <path
        fill={colored ? `#${icon.hex}` : 'currentColor'}
        d={icon.path}
      />
    </svg>
  );
}
