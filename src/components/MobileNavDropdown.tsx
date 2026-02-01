import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionsApi, type Collection } from '../services/api';

interface MobileNavDropdownProps {
  onItemClick: () => void;
  darkMode?: boolean;
}

// Featured categories
const featuredCategories = [
  {
    name: "Women's",
    image: '/images/hafaloha-womens-img.webp',
    link: '/products?collection=womens',
  },
  {
    name: "Men's",
    image: '/images/hafaloha-mens-img.webp',
    link: '/products?collection=mens',
  },
  {
    name: "Kids",
    image: '/images/hafaloha-mens-img.webp',
    link: '/products?collection=kids',
  }
];

export default function MobileNavDropdown({ onItemClick, darkMode = false }: MobileNavDropdownProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch collections on mount
  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await collectionsApi.getCollections({ per_page: 10 });
        setCollections(response.collections);
      } catch (error) {
        console.error('Failed to fetch collections:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  return (
    <div className="space-y-1">
      {/* Shop Header with Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between font-semibold py-2 ${
          darkMode 
            ? 'text-white hover:text-hafalohaGold' 
            : 'text-warm-700 hover:text-hafalohaRed'
        }`}
      >
        <span>Shop</span>
        <svg
          className={`w-5 h-5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable Sub-menu */}
      {isExpanded && (
        <div className="animate-slide-down">
          {/* Featured Categories with Images */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {featuredCategories.map((category) => (
              <Link
                key={category.name}
                to={category.link}
                className="group relative overflow-hidden rounded-lg"
                onClick={onItemClick}
              >
                <div className="aspect-square bg-warm-100 overflow-hidden">
                  <img 
                    src={category.image} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <span className="font-semibold text-sm">Shop {category.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Collections List */}
          <div className={`pl-3 space-y-1 ml-1 ${darkMode ? 'border-l-2 border-white/20' : 'border-l-2 border-hafalohaRed/30'}`}>
            {/* All Products */}
            <Link
              to="/products"
              className={`flex items-center gap-2 py-2 font-medium ${
                darkMode 
                  ? 'text-white/90 hover:text-hafalohaGold' 
                  : 'text-warm-700 hover:text-hafalohaRed'
              }`}
              onClick={onItemClick}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              All Products
            </Link>

            {/* Collections */}
            {loading ? (
              <div className={`text-sm py-2 ${darkMode ? 'text-white/50' : 'text-warm-400'}`}>Loading collections...</div>
            ) : (
              collections.slice(0, 6).map((collection) => (
                <Link
                  key={collection.id}
                  to={`/collections/${collection.slug}`}
                  className={`flex items-center gap-2 py-2 ${
                    darkMode 
                      ? 'text-white/70 hover:text-hafalohaGold' 
                      : 'text-warm-600 hover:text-hafalohaRed'
                  }`}
                  onClick={onItemClick}
                >
                  <span className="text-hafalohaGold text-xs">●</span>
                  {collection.name}
                  {collection.product_count > 0 && (
                    <span className={`ml-auto text-xs ${darkMode ? 'text-white/40' : 'text-warm-400'}`}>
                      {collection.product_count}
                    </span>
                  )}
                </Link>
              ))
            )}

            {/* View All Collections */}
            {collections.length > 0 && (
              <Link
                to="/collections"
                className={`block py-2 font-medium hover:underline ${
                  darkMode ? 'text-hafalohaGold' : 'text-hafalohaRed'
                }`}
                onClick={onItemClick}
              >
                View All Collections →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
