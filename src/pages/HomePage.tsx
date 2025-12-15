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
        className="relative bg-cover bg-center text-white"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('${heroContent.background_image_url || defaultHero.background_image_url}')` 
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 text-center">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 sm:p-12 inline-block max-w-3xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 text-gray-900">
              {heroContent.title || defaultHero.title}
            </h1>
            {heroContent.subtitle && (
              <p className="text-lg mb-6 sm:mb-8 text-gray-700">
                {heroContent.subtitle}
              </p>
            )}
            <Link
              to={heroContent.button_link || "/products"}
              className="inline-block bg-hafalohaRed text-white font-bold px-10 py-4 rounded-lg hover:bg-red-700 transition text-lg shadow-lg hover:shadow-xl"
            >
              {heroContent.button_text || "Shop Now"} →
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Products Section */}
      <div className="bg-gray-50">
        <FeaturedProducts />
      </div>

      {/* Founder Teaser Section */}
      <div className="bg-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6 text-gray-900">The Hafaloha Story</h2>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 sm:p-12">
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              Håfa Adai! We're Leonard and Tara Kaae, the founders of Hafaloha. What started as just 
              a few designs and a dream has grown into something we're incredibly proud of. From merch 
              to shave ice, we're celebrating Chamorro culture and island life through everything we create.
            </p>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed italic">
              "Hafaloha is more than just products or a brand—it's a lifestyle and a way of life."
            </p>
            <Link
              to="/about"
              className="inline-block mt-6 bg-hafalohaRed text-white px-8 py-3 rounded-lg hover:bg-red-700 transition font-semibold shadow-md hover:shadow-lg"
            >
              Read Our Full Story →
            </Link>
          </div>
        </div>
      </div>

      {/* Shop by Category - Dynamic Cards */}
      {!loading && cardsContent.length > 0 && (
        <div className="bg-gradient-to-b from-gray-50 to-white py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 sm:mb-12 text-gray-900">
              Shop by Category
            </h2>
            <div className={`grid grid-cols-1 ${cardsContent.length >= 2 ? 'md:grid-cols-2' : ''} ${cardsContent.length >= 3 ? 'lg:grid-cols-3' : ''} gap-6 sm:gap-8`}>
              {cardsContent.map((card, index) => (
                <Link 
                  key={card.id || index}
                  to={card.button_link || "/products"}
                  className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition"
                >
                  <div 
                    className="aspect-[4/3] bg-cover bg-center"
                    style={{ 
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url('${card.image_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"}')` 
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
                      <h3 className="text-3xl font-bold mb-2">{card.title}</h3>
                      {card.subtitle && <p className="text-lg mb-4">{card.subtitle}</p>}
                      <span className="inline-block bg-hafalohaRed px-6 py-2 rounded-lg group-hover:bg-red-700 transition font-semibold">
                        {card.button_text || "Shop Now"} →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
