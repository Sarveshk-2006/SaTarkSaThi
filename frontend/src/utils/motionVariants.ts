/**
 * Satark Saathi Shared Motion Variants
 * Built on Motion for React (`motion/react`)
 *
 * Provides restrained, accessible, high-performance animation presets
 * designed specifically for a trusted cybersecurity platform.
 */

import { Variants } from 'motion/react';

/** Subtle page fade-and-slide entrance */
export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

/** Staggered container for dashboard metrics, feature tiles, and incident lists */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

/** Restrained child reveal item */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.16, 1, 0.3, 1] },
  },
};

/** Tactile card hover without excessive displacement */
export const cardHoverMotion = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.995 },
  transition: { duration: 0.18, ease: 'easeOut' },
};

/** Button micro-interaction */
export const buttonMotion = {
  whileHover: { scale: 1.015 },
  whileTap: { scale: 0.975 },
  transition: { type: 'spring', stiffness: 450, damping: 20 },
};

/** Smooth accordion / explanation height transitions */
export const expandableVariants: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.26, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

/** Status badge pop-in */
export const badgePopIn: Variants = {
  initial: { scale: 0.94, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.22, ease: 'easeOut' },
  },
};
