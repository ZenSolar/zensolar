import { motion } from "framer-motion";
import { ReactNode } from "react";

/**
 * Lightweight page transition for route-level content.
 * Subtle fade + 6px lift; <250ms so navigation never feels sluggish.
 * Drop in at the top of a page component:
 *   <PageTransition>...</PageTransition>
 */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
