import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface AdminPageTransitionProps {
  children: ReactNode;
}

/**
 * Wraps admin page content with a subtle fade + slide-up animation.
 * Use at the top level of each admin page's return JSX.
 */
export default function AdminPageTransition({ children }: AdminPageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
