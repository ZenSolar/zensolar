import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';

interface OnboardingAnimatedContentProps {
  children: ReactNode;
  delay?: number;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: { duration: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/**
 * Wrapper component that adds subtle entrance animations to onboarding screen content.
 * Wrap each screen's main content container with this for consistent polish.
 */
export function OnboardingAnimatedContent({ children, delay = 0 }: OnboardingAnimatedContentProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Individual animated item - use inside OnboardingAnimatedContent for staggered children
 */
export function OnboardingAnimatedItem({ children }: { children: ReactNode }) {
  return (
    <motion.div variants={itemVariants}>
      {children}
    </motion.div>
  );
}
