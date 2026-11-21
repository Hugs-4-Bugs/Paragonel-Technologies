'use client';

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';
import { hoverLift, tapPress } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface MotionCardProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: ReactNode;
  className?: string;
  /** When true, the card shows a visible focus ring (use for cards that ARE
   *  the interactive element, e.g. a clickable card). Defaults to false. */
  focusable?: boolean;
}

/**
 * MotionCard — reusable interactive card surface (Prompt 05H).
 *
 * Provides subtle, consistent hover + tap feedback across product cards,
 * service entries, and portfolio items: a 2px upward lift on hover + a small
 * settle on press. Transform-only (no layout shift), so it is cheap + does not
 * trigger reflow.
 *
 * Accessibility:
 *  - Respects `prefers-reduced-motion`: when reduced, renders a plain div with
 *    no transform animation (the global CSS also neutralizes transitions).
 *  - When `focusable`, applies a visible focus ring for keyboard users.
 *  - Motion never communicates essential information — the card content is
 *    fully usable without the hover/tap effect.
 *
 * Usage:
 *   <MotionCard focusable className="..."><Link ...>...</Link></MotionCard>
 *   <MotionCard className="...">...static content...</MotionCard>
 */
export function MotionCard({ children, className, focusable = false, ...rest }: MotionCardProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div className={cn(focusable && 'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2', className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={hoverLift}
      whileTap={tapPress}
      className={cn(
        focusable && 'focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2',
        className,
      )}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
