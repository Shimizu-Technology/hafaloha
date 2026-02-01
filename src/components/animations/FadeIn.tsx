import { motion } from 'framer-motion';
import { useRef } from 'react';
import { useInView } from 'framer-motion';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  className?: string;
  immediate?: boolean;
}

export default function FadeIn({ 
  children, 
  delay = 0, 
  direction = 'up', 
  duration = 0.6,
  className = '',
  immediate = false
}: FadeInProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: "-40px" });
  const isInView = immediate || inViewResult;
  const prefersReduced = useReducedMotion();

  // If user prefers reduced motion, render children directly
  if (prefersReduced) {
    return <div className={className}>{children}</div>;
  }

  const directions = {
    up: { y: 30 },
    down: { y: -30 },
    left: { x: 30 },
    right: { x: -30 },
    none: {},
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
