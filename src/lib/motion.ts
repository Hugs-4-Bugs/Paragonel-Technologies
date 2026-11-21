import { type Variants } from 'framer-motion';

/**
 * Motion primitives for the Paragonel visual transformation (Prompt 05A).
 *
 * Design intent: motion must feel intentional + premium, not bouncy or
 * decorative. Reveals are slow, eased, and staggered subtly. Every motion
 * component consults `useReducedMotion()` (Framer Motion) so reduced-motion
 * users get the final state immediately with no transform/opacity animation.
 *
 * These variants are the canonical entrance animations. Sections that need
 * richer scroll storytelling use GSAP ScrollTrigger directly (see
 * smooth-scroll.tsx + the hero/approach sections).
 */

const EASE = [0.22, 1, 0.36, 1] as const; // expo-out, calm + premium

export const EASE_OUT = EASE;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8, ease: EASE } },
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: EASE } },
};

// Stagger container — children reveal in sequence. `staggerChildren` is small
// so groups feel connected, not slow.
export const staggerContainer = (stagger = 0.08, delay = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

// Shared viewport config — reveal once, slight margin so it triggers just
// before the element is fully in view (feels more alive).
export const viewportOnce = { once: true, margin: '-8% 0px -8% 0px' };

// Long-form horizontal line draw (for the approach/engagement connectors).
export const drawLine: Variants = {
  hidden: { scaleX: 0 },
  visible: { scaleX: 1, transition: { duration: 1.1, ease: EASE } },
};

// ── Interaction feedback (Prompt 05H) ──────────────────────────────────────
// Subtle, transform-only hover + tap feedback for cards + interactive surfaces.
// These are intentionally small (a 2px lift, a 1% press) so motion feels
// premium, not bouncy. `useReducedMotion()` consumers should skip applying
// these (render the rest state) — see MotionCard.

/** Hover state for cards: a tiny upward lift + faint border emphasis. */
export const hoverLift = {
  y: -2,
  transition: { duration: 0.25, ease: EASE },
} as const;

/** Tap/press state: a small settle back toward the rest position. */
export const tapPress = {
  y: 0,
  scale: 0.99,
  transition: { duration: 0.12, ease: EASE },
} as const;

/** Default (rest) state for a motion card — explicit so it can be a variant target. */
export const cardRest = {
  y: 0,
  scale: 1,
} as const;
