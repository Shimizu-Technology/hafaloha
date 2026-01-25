import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collectionsApi, type Collection } from '../services/api';

interface NavDropdownProps {
  onItemClick: () => void;
  darkMode?: boolean;
}

// Featured categories with images
const featuredCategories = [
  {
    name: "Women's",
    image: '/images/hafaloha-womens-img.webp',
    link: '/products?collection=womens',
    description: 'Vibrant styles for island living'
  },
  {
    name: "Men's",
    image: '/images/hafaloha-mens-img.webp',
    link: '/products?collection=mens',
    description: 'Bold designs with island pride'
  }
];

export default function NavDropdown({ onItemClick, darkMode = false }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle mouse enter with delay
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsOpen(true);
  };

  // Handle mouse leave with delay
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const handleItemClick = () => {
    setIsOpen(false);
    onItemClick();
  };

  return (
    <div 
      ref={dropdownRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <button
        className={`flex items-center font-semibold transition py-2 ${
          darkMode 
            ? 'text-white hover:text-hafalohaGold' 
            : 'text-gray-700 hover:text-hafalohaRed nav-link-hover'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        Shop
        <svg
          className={`ml-1 w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Mega Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 animate-slide-down overflow-hidden"
             style={{ width: '580px' }}>
          <div className="p-6">
            {/* Featured Categories with Images */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {featuredCategories.map((category) => (
                <Link
                  key={category.name}
                  to={category.link}
                  className="group relative overflow-hidden rounded-lg"
                  onClick={handleItemClick}
                >
                  <div className="aspect-4/3 bg-gray-100 overflow-hidden">
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <h3 className="font-bold text-lg mb-1">Shop {category.name}</h3>
                      <p className="text-sm text-white/80">{category.description}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Collections Grid */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Collections</h4>
                <Link
                  to="/collections"
                  className="text-xs font-medium text-hafalohaRed hover:underline"
                  onClick={handleItemClick}
                >
                  View All →
                </Link>
              </div>
              
              {loading ? (
                <div className="text-gray-400 text-sm py-2">Loading...</div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {collections.slice(0, 6).map((collection) => (
                    <Link
                      key={collection.id}
                      to={`/collections/${collection.slug}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-hafalohaCream hover:text-hafalohaRed transition text-sm font-medium"
                      onClick={handleItemClick}
                    >
                      <span className="text-hafalohaGold">●</span>
                      {collection.name}
                      {collection.product_count > 0 && (
                        <span className="ml-auto text-xs text-gray-400">
                          {collection.product_count}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between">
              <Link
                to="/products"
                className="flex items-center gap-2 text-gray-700 hover:text-hafalohaRed transition font-semibold"
                onClick={handleItemClick}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                All Products
              </Link>
              <Link
                to="/products?sale=true"
                className="flex items-center gap-2 text-hafalohaRed font-semibold hover:underline"
                onClick={handleItemClick}
              >
                <span className="bg-hafalohaRed text-white text-xs px-2 py-0.5 rounded-full">SALE</span>
                Shop Sale Items
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
