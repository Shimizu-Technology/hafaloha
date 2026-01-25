import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import FeaturedProducts from '../components/FeaturedProducts';
import { homepageApi, type HomepageSection } from '../services/api';

// Default fallback content
const defaultHero = {
  title: "Island Living Apparel for All 🌺",
  subtitle: "Premium Chamorro pride merchandise celebrating island culture and heritage",
  button_text: "Shop Now",
  button_link: "/products",
  background_image_url: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920"
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

export default function HomePage() {
  const [hero, setHero] = useState<HomepageSection | null>(null);
  const [categoryCards, setCategoryCards] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const data = await homepageApi.getSections();
        
        // Get hero section
        if (data.grouped.hero && data.grouped.hero.length > 0) {
          setHero(data.grouped.hero[0]);
        }
        
        // Get category cards
        if (data.grouped.category_card && data.grouped.category_card.length > 0) {
          setCategoryCards(data.grouped.category_card);
        }
      } catch (error) {
        console.error('Failed to load homepage sections:', error);
        // Will use default fallbacks
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, []);

  // Use dynamic or fallback content
  const heroContent = hero || defaultHero;
  const cardsContent = categoryCards.length > 0 ? categoryCards : defaultCategoryCards;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Island Living theme */}
      <div 
        className="relative bg-cover bg-center text-white min-h-[70vh] flex items-center"
        style={{ 
          backgroundImage: `linear-gradient(135deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3)), url('${heroContent.background_image_url || defaultHero.background_image_url}')` 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center w-full">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 sm:p-12 lg:p-16 inline-block max-w-3xl shadow-xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-gray-900 leading-tight">
              {heroContent.title || defaultHero.title}
            </h1>
            {heroContent.subtitle && (
              <p className="text-base sm:text-lg mb-8 text-gray-600 max-w-xl mx-auto leading-relaxed">
                {heroContent.subtitle}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to={heroContent.button_link || "/products"}
                className="btn-primary text-lg px-10 py-4 inline-flex items-center justify-center gap-2"
              >
                {heroContent.button_text || "Shop Now"}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                to="/collections"
                className="btn-secondary text-lg px-8 py-4 inline-flex items-center justify-center"
              >
                Browse Collections
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="bg-white">
        <FeaturedProducts />
      </div>

      {/* Shop by Category - Dynamic Cards */}
      {!loading && cardsContent.length > 0 && (
        <div className="py-16 sm:py-20" style={{ backgroundColor: '#FDFBF7' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10 sm:mb-14">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Shop by Category
              </h2>
            </div>
            <div className={`grid grid-cols-1 ${cardsContent.length >= 2 ? 'md:grid-cols-2' : ''} ${cardsContent.length >= 3 ? 'lg:grid-cols-3' : ''} gap-6 sm:gap-8`}>
              {cardsContent.map((card, index) => (
                <Link 
                  key={card.id || index}
                  to={card.button_link || "/products"}
                  className="group relative overflow-hidden rounded-lg"
                >
                  <div 
                    className="aspect-4/3 bg-cover bg-center"
                    style={{ 
                      backgroundImage: `url('${card.image_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"}')` 
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-all duration-300"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <h3 className="text-2xl sm:text-3xl font-bold text-white text-center drop-shadow-lg">{card.title}</h3>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Founder Teaser Section */}
      <div className="bg-white py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Image */}
            <div>
              <img 
                src="/images/len_and_tara_hafaloha.webp" 
                alt="Leonard and Tara Kaae - Hafaloha Founders"
                className="w-full rounded-lg"
              />
            </div>
            
            {/* Content */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-gray-900">
                The Hafaloha Story
              </h2>
              <p className="text-gray-600 mb-4 leading-relaxed">
                Håfa Adai! We're Leonard and Tara Kaae, the founders of Hafaloha. What started as just 
                a few designs and a dream has grown into something we're incredibly proud of.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed italic border-l-2 border-gray-200 pl-4">
                "Hafaloha is more than just products or a brand—it's a lifestyle and a way of life."
              </p>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-gray-900 font-medium hover:text-hafalohaRed transition"
              >
                Read Our Full Story
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter / Call to Action */}
      <div className="py-16 sm:py-20" style={{ backgroundColor: '#FDFBF7' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-gray-900">
            Stay Connected
          </h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            Follow us on social media for new drops and community updates.
          </p>
          <div className="flex justify-center gap-4">
            <a 
              href="https://www.facebook.com/hafaloha" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white border border-gray-200 hover:border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all"
              aria-label="Facebook"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
              </svg>
            </a>
            <a 
              href="https://www.instagram.com/hafaloha" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-10 h-10 bg-white border border-gray-200 hover:border-gray-300 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all"
              aria-label="Instagram"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
