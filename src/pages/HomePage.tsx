import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import FeaturedProducts from '../components/FeaturedProducts';
import FadeIn from '../components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '../components/animations/StaggerContainer';
import { homepageApi, type HomepageSection } from '../services/api';

// Default fallback content
const defaultHero = {
  title: "Island Living Apparel for All 🌺",
  subtitle: "Premium Chamorro pride merchandise celebrating island culture and heritage",
  button_text: "Shop Now",
  button_link: "/products",
  background_image_url: null as string | null,
};

const defaultCategoryCards: Array<{
  id?: number;
  title: string;
  subtitle: string;
  button_text: string;
  button_link: string;
  image_url: string;
}> = [
  {
    title: "Shop Women's",
    subtitle: "Vibrant styles for island living",
    button_text: "Shop Now",
    button_link: "/products?collection=womens",
    image_url: "/images/hafaloha-womens-img.webp"
  },
  {
    title: "Shop Men's",
    subtitle: "Bold designs with island pride",
    button_text: "Shop Now",
    button_link: "/products?collection=mens",
    image_url: "/images/hafaloha-mens-img.webp"
  }
];

const heroEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function HomePage() {
  const [hero, setHero] = useState<HomepageSection | null>(null);
  const [categoryCards, setCategoryCards] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const data = await homepageApi.getSections();

        if (data.grouped.hero && data.grouped.hero.length > 0) {
          setHero(data.grouped.hero[0]);
        }

        if (data.grouped.category_card && data.grouped.category_card.length > 0) {
          setCategoryCards(data.grouped.category_card);
        }
      } catch {
        // Silently fall back to defaults
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  // Use dynamic or fallback content
  const heroContent = hero || defaultHero;
  const cardsContent = categoryCards.length > 0 ? categoryCards : defaultCategoryCards;
  // Animation helper — skip motion when user prefers reduced motion
  const heroMotion = (delay: number) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, y: 30 } as const,
          animate: { opacity: 1, y: 0 } as const,
          transition: { duration: 0.8, delay, ease: heroEase },
        };

  return (
    <div className="min-h-screen">
      {/* ============================================================ */}
      {/* HERO SECTION                                                 */}
      {/* Near full-viewport, gradient orb background, staggered entry */}
      {/* ============================================================ */}
      <section className="relative bg-gradient-to-br from-warm-900 via-warm-800 to-warm-900 text-white min-h-[85vh] flex items-center overflow-hidden">
        {/* Gradient orbs — atmospheric depth */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl" />
          <div className="absolute -bottom-1/4 left-1/3 w-80 h-80 bg-red-400/10 rounded-full blur-3xl" />
        </div>

        {/* Clean gradient background — no competing imagery */}

        {/* Content — always text-on-dark, no white card */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 w-full text-center">
          {/* Badge — appears first */}
          <motion.div {...heroMotion(0)}>
            <span className="inline-block px-4 py-1.5 bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-medium rounded-full mb-8 text-warm-200">
              Håfa Adai 🌺 Island Living Apparel
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            {...heroMotion(0.15)}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-[1.1] tracking-tight"
          >
            {heroContent.title || defaultHero.title}
          </motion.h1>

          {/* Subtitle */}
          {heroContent.subtitle && (
            <motion.p
              {...heroMotion(0.3)}
              className="text-lg sm:text-xl mb-12 text-warm-300 max-w-2xl mx-auto leading-relaxed"
            >
              {heroContent.subtitle}
            </motion.p>
          )}

          {/* CTA Buttons */}
          <motion.div
            {...heroMotion(0.45)}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to={heroContent.button_link || "/products"}
              className="group btn-primary text-lg px-10 py-4 inline-flex items-center justify-center gap-2"
            >
              {heroContent.button_text || "Shop Now"}
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              to="/collections"
              className="border-2 border-white/30 text-white hover:bg-white/10 rounded-xl text-lg px-8 py-4 inline-flex items-center justify-center transition-all duration-200 hover:-translate-y-0.5"
            >
              Browse Collections
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* SHOP BY CATEGORY — bento grid                                */}
      {/* ============================================================ */}
      {!loading && cardsContent.length > 0 && (
        <section className="py-20 sm:py-28 bg-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeIn>
              <div className="text-center mb-12 sm:mb-16">
                <h2 className="text-3xl sm:text-4xl font-bold text-warm-900 tracking-tight">
                  Shop by Category
                </h2>
                <div className="w-12 h-1 bg-hafalohaGold rounded-full mx-auto mt-4" />
              </div>
            </FadeIn>

            {/* Bento grid — layout adapts to number of cards */}
            {cardsContent.length === 1 && (
              <FadeIn>
                <CategoryCard card={cardsContent[0]} className="aspect-[16/9] md:aspect-[21/9]" />
              </FadeIn>
            )}

            {cardsContent.length === 2 && (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <StaggerItem className="md:col-span-7">
                  <CategoryCard card={cardsContent[0]} className="aspect-[4/3] md:aspect-auto md:h-full min-h-[280px]" />
                </StaggerItem>
                <StaggerItem className="md:col-span-5">
                  <CategoryCard card={cardsContent[1]} className="aspect-[4/3]" />
                </StaggerItem>
              </StaggerContainer>
            )}

            {cardsContent.length >= 3 && (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <StaggerItem className="md:col-span-7 md:row-span-2">
                  <CategoryCard card={cardsContent[0]} className="aspect-[4/3] md:aspect-auto md:h-full min-h-[280px]" />
                </StaggerItem>
                <StaggerItem className="md:col-span-5">
                  <CategoryCard card={cardsContent[1]} className="aspect-[4/3]" />
                </StaggerItem>
                <StaggerItem className="md:col-span-5">
                  <CategoryCard card={cardsContent[2]} className="aspect-[4/3]" />
                </StaggerItem>
                {cardsContent.slice(3).map((card, i) => (
                  <StaggerItem key={card.id || i + 3} className="md:col-span-4">
                    <CategoryCard card={card} className="aspect-[4/3]" />
                  </StaggerItem>
                ))}
              </StaggerContainer>
            )}
          </div>
        </section>
      )}

      {/* ============================================================ */}
      {/* FEATURED PRODUCTS                                            */}
      {/* ============================================================ */}
      <section className="bg-white">
        <FeaturedProducts />
      </section>

      {/* ============================================================ */}
      {/* FOUNDER / STORY SECTION — asymmetric editorial split         */}
      {/* ============================================================ */}
      <section className="bg-white py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Image — 7 columns with decorative offset */}
            <FadeIn direction="left" className="md:col-span-7">
              <div className="relative">
                <img
                  src="/images/len_and_tara_hafaloha.webp"
                  alt="Leonard and Tara Kaae - Hafaloha Founders"
                  className="w-full rounded-2xl relative z-10"
                  loading="lazy"
                />
                {/* Decorative offset rectangle */}
                <div className="absolute -z-0 -bottom-4 -right-4 w-full h-full bg-warm rounded-2xl" />
              </div>
            </FadeIn>

            {/* Text — 5 columns */}
            <FadeIn direction="right" delay={0.1} className="md:col-span-5">
              <div>
                <span className="text-sm font-medium text-hafalohaRed mb-3 block uppercase tracking-wider">
                  Our Story
                </span>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-6 text-warm-900 tracking-tight">
                  The Hafaloha Story
                </h2>
                <p className="text-warm-600 mb-6 leading-relaxed">
                  Håfa Adai! We&apos;re Leonard and Tara Kaae, the founders of Hafaloha. What started as just
                  a few designs and a dream has grown into something we&apos;re incredibly proud of.
                </p>
                <blockquote className="mb-8 pl-5 border-l-4 border-hafalohaGold">
                  <p className="text-lg sm:text-xl font-medium text-warm-800 italic leading-relaxed">
                    &ldquo;Hafaloha is more than just products or a brand—it&apos;s a lifestyle and a way of life.&rdquo;
                  </p>
                </blockquote>
                <Link
                  to="/about"
                  className="group inline-flex items-center gap-2 text-warm-900 font-semibold hover:text-hafalohaRed transition-colors"
                >
                  Read Our Full Story
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ================================================================== */
/* CategoryCard — reusable bento card for Shop by Category            */
/* ================================================================== */
interface CategoryCardProps {
  card: {
    id?: number;
    title: string | null;
    subtitle?: string | null;
    button_text?: string | null;
    button_link?: string | null;
    image_url?: string | null;
  };
  className?: string;
}

function CategoryCard({ card, className = '' }: CategoryCardProps) {
  return (
    <Link
      to={card.button_link || "/products"}
      className={`group relative overflow-hidden rounded-2xl block ${className}`}
    >
      <img
        src={card.image_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"}
        alt={card.title || "Category"}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        loading="lazy"
      />
      {/* Dark overlay — deepens on hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition-all duration-500" />
      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8">
        <h3 className="text-xl sm:text-2xl font-bold text-white drop-shadow-lg mb-1">
          {card.title}
        </h3>
        <span className="text-white/0 group-hover:text-white/90 text-sm font-medium transition-all duration-500 translate-y-2 group-hover:translate-y-0 inline-flex items-center gap-1">
          Shop Now
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
