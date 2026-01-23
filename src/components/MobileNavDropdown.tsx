import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionsApi, type Collection } from '../services/api';

interface MobileNavDropdownProps {
  onItemClick: () => void;
}

export default function MobileNavDropdown({ onItemClick }: MobileNavDropdownProps) {
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
        className="w-full flex items-center justify-between text-gray-700 hover:text-hafalohaRed font-medium py-2"
      >
        <span>Shop</span>
        <svg
          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expandable Sub-menu */}
      {isExpanded && (
        <div className="pl-4 space-y-1 border-l-2 border-gray-200 ml-2">
          {/* All Products */}
          <Link
            to="/products"
            className="block text-gray-600 hover:text-hafalohaRed py-2"
            onClick={onItemClick}
          >
            All Products
          </Link>

          {/* Collections */}
          {loading ? (
            <div className="text-gray-400 text-sm py-2">Loading...</div>
          ) : (
            collections.map((collection) => (
              <Link
                key={collection.id}
                to={`/collections/${collection.slug}`}
                className="block text-gray-600 hover:text-hafalohaRed py-2"
                onClick={onItemClick}
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
            <Link
              to="/collections"
              className="block text-hafalohaRed hover:text-red-700 py-2 font-medium"
              onClick={onItemClick}
            >
              View All Collections →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
