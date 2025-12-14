import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionsApi } from '../services/api';

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  product_count: number;
  thumbnail_url: string | null;
  featured: boolean;
}

interface Meta {
  page: number;
  per_page: number;
  total: number;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // For controlled input

  useEffect(() => {
    fetchCollections();
  }, [currentPage, searchQuery]);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await collectionsApi.getCollections({
        page: currentPage,
        per_page: 12,
        search: searchQuery || undefined,
      });
      setCollections(data.collections);
      setMeta(data.meta);
    } catch (err: any) {
      console.error('Failed to fetch collections:', err);
      setError(err.response?.data?.error || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1); // Reset to page 1 on new search
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-hafalohaRed mx-auto mb-4"></div>
          <p className="text-gray-600">Loading collections...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchCollections}
            className="px-6 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (collections.length === 0 && !searchQuery) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No collections available yet.</p>
          <Link
            to="/products"
            className="px-6 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition inline-block"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Collections</h1>
          <p className="text-lg text-gray-600">
            Shop our curated collections of Chamorro pride apparel and merchandise
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search collections..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Clear
              </button>
            )}
          </form>
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-3">
              Showing {meta?.total || 0} result{meta?.total !== 1 ? 's' : ''} for "{searchQuery}"
            </p>
          )}
        </div>
      </div>

      {/* Collections Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">
              {searchQuery ? `No collections found for "${searchQuery}"` : 'No collections found'}
            </p>
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="px-6 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  to={`/collections/${collection.slug}`}
                  className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {collection.thumbnail_url ? (
                      <img
                        src={collection.thumbnail_url}
                        alt={collection.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        style={{ objectFit: 'contain' }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        <svg
                          className="w-24 h-24 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                      </div>
                    )}
                    {collection.featured && (
                      <div className="absolute top-3 right-3 bg-hafalohaGold text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                        Featured
                      </div>
                    )}
                  </div>

                  {/* Collection Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-hafalohaRed transition-colors">
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {collection.product_count} {collection.product_count === 1 ? 'product' : 'products'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 sm:gap-2 flex-wrap">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <span className="hidden sm:inline">Previous</span>
                  <span className="sm:hidden">Prev</span>
                </button>
                
                <div className="flex gap-1 sm:gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-hafalohaRed text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

