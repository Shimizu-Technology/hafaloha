import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collectionsApi } from '../services/api';
import ProductCard from '../components/ProductCard';
import type { Product } from '../services/api';
import { ProductGridSkeleton, PageHeaderSkeleton } from '../components/Skeleton';
import FadeIn from '../components/animations/FadeIn';
import { StaggerContainer, StaggerItem } from '../components/animations/StaggerContainer';
import Breadcrumbs from '../components/Breadcrumbs';

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  product_count: number;
}

interface Meta {
  page: number;
  per_page: number;
  total: number;
}

export default function CollectionDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [productType, setProductType] = useState('');

  useEffect(() => {
    if (slug) {
      fetchCollectionData();
    }
  }, [slug, currentPage, searchQuery, productType]);

  const fetchCollectionData = async () => {
    if (!slug) return;

    try {
      setLoading(true);
      setError(null);
      const data = await collectionsApi.getCollectionBySlug(slug, {
        page: currentPage,
        per_page: 12,
        search: searchQuery || undefined,
        product_type: productType || undefined,
      });
      setCollection(data.collection);
      setProducts(data.products);
      setMeta(data.meta);
    } catch (err: any) {
      console.error('Failed to fetch collection:', err);
      setError(err.response?.data?.error || 'Failed to load collection');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCollectionData();
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setProductType('');
    setCurrentPage(1);
  };

  if (loading && !collection) {
    return (
      <div className="min-h-screen bg-warm-50">
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <PageHeaderSkeleton />
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-warm-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Collection not found'}</p>
          <Link
            to="/collections"
            className="px-6 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition inline-block"
          >
            Back to Collections
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = meta ? Math.ceil(meta.total / meta.per_page) : 1;

  return (
    <div className="min-h-screen bg-warm-50">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs items={[
            { label: 'Home', path: '/' },
            { label: 'Collections', path: '/collections' },
            { label: collection.name }
          ]} />
        </div>
      </div>

      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <FadeIn>
            <h1 className="text-4xl font-bold text-warm-900 mb-4">{collection.name}</h1>
            {collection.description && (
              <p className="text-lg text-warm-500 mb-4">{collection.description}</p>
            )}
            <p className="text-sm text-warm-500">
              {meta?.total || 0} {meta?.total === 1 ? 'product' : 'products'}
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              />
            </form>

            {/* Product Type Filter */}
            <select
              value={productType}
              onChange={(e) => {
                setProductType(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-warm-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Apparel">Apparel</option>
              <option value="Hats">Hats</option>
              <option value="Bags">Bags</option>
              <option value="Accessories">Accessories</option>
            </select>

            {/* Clear Filters */}
            {(searchQuery || productType) && (
              <button
                onClick={handleClearFilters}
                className="px-6 py-2 bg-warm-200 text-warm-700 rounded-lg hover:bg-warm-300 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="py-6">
            <ProductGridSkeleton count={8} />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-warm-600 mb-4">No products found in this collection.</p>
            <button
              onClick={handleClearFilters}
              className="px-6 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Product Grid */}
            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8" staggerDelay={0.05}>
              {products.map((product) => (
                <StaggerItem key={product.id}>
                  <ProductCard product={product} />
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-white border border-warm-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-warm-50 transition"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-warm-700">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-white border border-warm-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-warm-50 transition"
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

