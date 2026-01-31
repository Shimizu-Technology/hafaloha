import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  immediate?: boolean;
}

export function StaggerContainer({ children, className = '', staggerDelay = 0.08, immediate = false }: StaggerContainerProps) {
  const ref = useRef(null);
  const inViewResult = useInView(ref, { once: true, margin: "-80px" });
  const isInView = immediate || inViewResult;

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { 
          opacity: 1, 
          y: 0, 
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
