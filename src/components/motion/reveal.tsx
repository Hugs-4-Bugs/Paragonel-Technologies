'use client';

import { motion, useReducedMotion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';
import { fadeUp, fadeIn, fadeScale, viewportOnce } from '@/lib/motion';

type RevealVariant = 'up' | 'fade' | 'scale';

interface RevealProps extends Omit<HTMLMotionProps<'div'>, 'ref'> {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  as?: keyof typeof motion;
  className?: string;
}

const variantMap = {
  up: fadeUp,
  fade: fadeIn,
  scale: fadeScale,
} as const;

/**
 * Scroll-reveal wrapper. Respects `prefers-reduced-motion` — when the user has
 * reduced motion enabled, the content is rendered in its final state with no
 * transform/opacity animation (motion's `MotionConfig` + `useReducedMotion`).
 */
export function Reveal({
  children,
  variant = 'up',
  delay = 0,
  className,
  ...rest
}: RevealProps) {
  const reduce = useReducedMotion();
  const variants = variantMap[variant];

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{ delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggered group — children that are themselves motion elements with the
 * `fadeUp`/`fadeIn` variants will reveal in sequence.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** A single staggered child — use inside <RevealGroup>. */
export function RevealItem({
  children,
  className,
  variant = 'up',
}: {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  const variants = variantMap[variant];
  return (
    <motion.div className={className} variants={variants}>
      {children}
    </motion.div>
  );
}
