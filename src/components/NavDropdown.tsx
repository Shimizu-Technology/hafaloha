import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collectionsApi, type Collection } from '../services/api';

interface NavDropdownProps {
  onItemClick: () => void;
}

export default function NavDropdown({ onItemClick }: NavDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    }, 150);
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
        className="flex items-center text-gray-700 hover:text-hafalohaRed font-medium transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        Shop
        <svg
          className={`ml-1 w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-100 py-2 z-50">
          {/* All Products */}
          <Link
            to="/products"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-hafalohaRed transition font-medium"
            onClick={handleItemClick}
          >
            All Products
          </Link>

          {/* Divider */}
          {collections.length > 0 && (
            <div className="border-t border-gray-100 my-2"></div>
          )}

          {/* Collections */}
          {loading ? (
            <div className="px-4 py-2 text-gray-400 text-sm">Loading...</div>
          ) : (
            collections.map((collection) => (
              <Link
                key={collection.id}
                to={`/collections/${collection.slug}`}
                className="block px-4 py-2 text-gray-700 hover:bg-gray-50 hover:text-hafalohaRed transition"
                onClick={handleItemClick}
              >
                {collection.name}
                {collection.product_count > 0 && (
                  <span className="ml-2 text-xs text-gray-400">
                    ({collection.product_count})
                  </span>
                )}
              </Link>
            ))
          )}

          {/* View All Collections */}
          {collections.length > 0 && (
            <>
              <div className="border-t border-gray-100 my-2"></div>
              <Link
                to="/collections"
                className="block px-4 py-2 text-hafalohaRed hover:bg-gray-50 transition font-medium"
                onClick={handleItemClick}
              >
                View All Collections →
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
