import FadeIn from './FadeIn';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: string;
}

/**
 * Convenience wrapper that combines FadeIn with standardized section padding.
 * Use for major page sections that should animate on scroll.
 */
export default function AnimatedSection({
  children,
  className = '',
  id,
  background,
}: AnimatedSectionProps) {
  const bgClass = background || '';
  const combinedClass = `py-20 lg:py-28 ${bgClass} ${className}`.trim();

  return (
    <section id={id} className={combinedClass}>
      <FadeIn>
        {children}
      </FadeIn>
    </section>
  );
}
