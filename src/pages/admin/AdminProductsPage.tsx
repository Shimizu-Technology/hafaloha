import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Eye, Edit, X } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  base_price_cents: number;
  published: boolean;
  featured: boolean;
  archived: boolean;
  product_type: string;
  primary_image_url: string | null;
  variant_count: number;
  total_stock: number; // Deprecated, replaced by inventory fields
  inventory_level: 'none' | 'product' | 'variant';
  product_stock_quantity: number | null;
  total_variant_stock: number | null;
  in_stock: boolean;
  actually_available: boolean; // Computed: respects published + inventory
}

interface ProductVariant {
  id: number;
  size: string;
  color: string;
  variant_name: string;
  display_name: string;
  sku: string;
  price_cents: number;
  stock_quantity: number;
  available: boolean;
  actually_available: boolean;
  low_stock: boolean;
}

interface DetailedProduct extends Product {
  product_type: string;
  vendor: string;
  weight_oz: number;
  sku_prefix: string;
  variants: ProductVariant[];
  images: Array<{
    id: number;
    url: string;
    alt_text: string;
    primary: boolean;
    position: number;
  }>;
  collections: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
}

export default function AdminProductsPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<DetailedProduct | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Pagination & Filters
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPublished, setFilterPublished] = useState<'all' | 'true' | 'false' | 'archived'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [productTypes, setProductTypes] = useState<string[]>([]);
  const itemsPerPage = 25;

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProduct]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      // Add show_archived=true to fetch all products (including archived)
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/products?show_archived=true`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const allProducts = response.data.data;
      setProducts(allProducts);
      
      // Extract unique product types for filter
      const types = [...new Set(allProducts.map((p: Product) => p.product_type).filter(Boolean))];
      setProductTypes(types as string[]);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search products
  const filteredProducts = products.filter(product => {
    // Search filter
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Published/Archived filter
    if (filterPublished === 'archived') {
      // Show only archived products
      if (!product.archived) return false;
    } else if (filterPublished !== 'all') {
      // Show only non-archived products with matching published status
      if (product.archived) return false;
      if (product.published.toString() !== filterPublished) return false;
    } else {
      // "All Products" - show only non-archived
      if (product.archived) return false;
    }
    
    // Type filter
    if (filterType !== 'all' && product.product_type !== filterType) {
      return false;
    }
    
    return true;
  });

  // Paginate products
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterPublished, filterType]);

  const fetchProductDetails = async (slug: string) => {
    try {
      setLoadingDetails(true);
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/products/${slug}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedProduct(response.data.data);
    } catch (err) {
      console.error('Failed to fetch product details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewProduct = (product: Product) => {
    setSelectedImageIndex(0); // Reset image index when opening new product
    fetchProductDetails(product.slug);
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getStockDisplay = (product: Product) => {
    if (product.inventory_level === 'none') {
      return { value: '--', color: 'text-gray-500', tooltip: 'No tracking', outOfStock: false };
    }
    if (product.inventory_level === 'product') {
      const stock = product.product_stock_quantity || 0;
      return {
        value: `${stock} 📦`,
        color: stock > 10 ? 'text-green-600' : stock > 0 ? 'text-amber-600' : 'text-red-600',
        tooltip: 'Product-level tracking',
        outOfStock: stock === 0
      };
    }
    if (product.inventory_level === 'variant') {
      const stock = product.total_variant_stock || 0;
      return {
        value: `${stock} 🎨`,
        color: stock > 10 ? 'text-green-600' : stock > 0 ? 'text-amber-600' : 'text-red-600',
        tooltip: 'Variant-level tracking (total of all variants)',
        outOfStock: stock === 0
      };
    }
    return { value: '--', color: 'text-gray-500', tooltip: '', outOfStock: false };
  };

  const getVariantStatus = (variant: ProductVariant, inventoryLevel: string) => {
    // Use the computed actually_available field for display
    // This respects both manual 'available' flag AND stock levels
    if (!variant.actually_available) {
      // Check why it's unavailable
      if (inventoryLevel === 'variant' && variant.stock_quantity <= 0) {
        return {
          label: 'Out of Stock',
          className: 'bg-red-100 text-red-800'
        };
      }
      // Manually disabled
      return {
        label: 'Disabled',
        className: 'bg-gray-100 text-gray-800'
      };
    }
    
    // Actually available (both enabled AND has stock if tracked)
    return {
      label: 'Available',
      className: 'bg-green-100 text-green-800'
    };
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">
            {filteredProducts.length} of {products.length} products
          </p>
        </div>
        <button 
          onClick={() => navigate('/admin/products/new')}
          className="px-6 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition"
        >
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
            />
          </div>

          {/* Published Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterPublished}
              onChange={(e) => setFilterPublished(e.target.value as 'all' | 'true' | 'false' | 'archived')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
            >
              <option value="all">All Products</option>
              <option value="true">Published</option>
              <option value="false">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
            >
              <option value="all">All Types</option>
              {productTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterPublished('all');
                setFilterType('all');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed"></div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.primary_image_url ? (
                          <img
                            src={product.primary_image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 border border-gray-300 rounded flex items-center justify-center">
                            <img 
                              src="/images/hafaloha-logo.png" 
                              alt="Placeholder" 
                              className="w-8 opacity-40"
                              style={{ objectFit: 'contain', maxHeight: '2rem' }}
                            />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.featured && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.base_price_cents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.variant_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const stockDisplay = getStockDisplay(product);
                        return (
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium ${stockDisplay.color}`}
                              title={stockDisplay.tooltip}
                            >
                              {stockDisplay.value}
                            </span>
                            {stockDisplay.outOfStock && (
                              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Out
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.archived 
                          ? 'bg-orange-100 text-orange-800'
                          : product.published 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {product.archived ? 'Archived' : product.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="text-hafalohaRed hover:text-red-700 font-medium inline-flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" /> View
                      </button>
                      <button 
                        onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                        className="text-blue-600 hover:text-blue-900 font-medium inline-flex items-center"
                      >
                        <Edit className="w-4 h-4 mr-1" /> Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {paginatedProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex gap-3 mb-3">
                  {product.primary_image_url ? (
                    <img
                      src={product.primary_image_url}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 border-2 border-gray-300 rounded flex items-center justify-center">
                      <img 
                        src="/images/hafaloha-logo.png" 
                        alt="Placeholder" 
                        className="w-10 opacity-40"
                        style={{ objectFit: 'contain', maxHeight: '2.5rem' }}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">{formatCurrency(product.base_price_cents)}</p>
                  </div>
                  <span className={`px-2 py-1 h-fit text-xs font-semibold rounded-full ${
                    product.archived 
                      ? 'bg-orange-100 text-orange-800'
                      : product.published 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {product.archived ? 'Archived' : product.published ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <span className="text-gray-600">Variants:</span>
                    <span className="ml-1 font-medium">{product.variant_count}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Stock:</span>
                    {(() => {
                      const stockDisplay = getStockDisplay(product);
                      return (
                        <span className="inline-flex items-center gap-2">
                          <span className={`ml-1 font-medium ${stockDisplay.color}`} title={stockDisplay.tooltip}>
                            {stockDisplay.value}
                          </span>
                          {stockDisplay.outOfStock && (
                            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              Out
                            </span>
                          )}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewProduct(product)}
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-center inline-flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-1" /> View
                  </button>
                  <button 
                    onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                    className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition inline-flex items-center justify-center"
                  >
                    <Edit className="w-4 h-4 mr-1" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-6 py-4 rounded-lg shadow">
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                <span className="font-medium">
                  {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                </span>{' '}
                of <span className="font-medium">{filteredProducts.length}</span> results
              </p>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Show first, last, current, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg transition ${
                            currentPage === page
                              ? 'bg-hafalohaRed text-white'
                              : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2 py-2">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/10" 
          onClick={() => setSelectedProduct(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            {loadingDetails ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading product details...</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h2>
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="text-gray-400 hover:text-gray-600 transition"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Product Info Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Images */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Images</h3>
                      {selectedProduct.images && selectedProduct.images.length > 0 ? (
                        <div className="space-y-3">
                          {/* Main Image */}
                          <div className="bg-white rounded-lg overflow-hidden border border-gray-200" style={{ aspectRatio: '1/1' }}>
                            <img
                              src={selectedProduct.images[selectedImageIndex]?.url || selectedProduct.images[0]?.url}
                              alt={selectedProduct.images[selectedImageIndex]?.alt_text || selectedProduct.name}
                              className="w-full h-full"
                              style={{
                                objectFit: 'contain',
                                backgroundColor: 'white'
                              }}
                            />
                          </div>
                          
                          {/* Thumbnail Gallery */}
                          {selectedProduct.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                              {selectedProduct.images.map((image, index) => (
                                <button
                                  key={image.id}
                                  onClick={() => setSelectedImageIndex(index)}
                                  className={`bg-white rounded-lg overflow-hidden border-2 transition ${
                                    selectedImageIndex === index ? 'border-hafalohaRed' : 'border-gray-200 hover:border-gray-300'
                                  }`}
                                  style={{ aspectRatio: '1/1' }}
                                >
                                  <img
                                    src={image.url}
                                    alt={image.alt_text || selectedProduct.name}
                                    className="w-full h-full"
                                    style={{
                                      objectFit: 'contain',
                                      backgroundColor: 'white'
                                    }}
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center text-gray-400 text-4xl">
                          📦
                        </div>
                      )}
                    </div>

                    {/* Basic Info */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Product Details</h3>
                      <dl className="space-y-2 text-sm">
                        <div>
                          <dt className="text-gray-600">Base Price:</dt>
                          <dd className="text-gray-900 font-semibold text-lg">{formatCurrency(selectedProduct.base_price_cents)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Status:</dt>
                          <dd>
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              selectedProduct.archived
                                ? 'bg-orange-100 text-orange-800'
                                : selectedProduct.published 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {selectedProduct.archived ? 'Archived' : selectedProduct.published ? 'Published' : 'Draft'}
                            </span>
                            {selectedProduct.featured && (
                              <span className="ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                Featured
                              </span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Type:</dt>
                          <dd className="text-gray-900">{selectedProduct.product_type || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Vendor:</dt>
                          <dd className="text-gray-900">{selectedProduct.vendor || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Weight:</dt>
                          <dd className="text-gray-900">{selectedProduct.weight_oz} oz</dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">In Stock:</dt>
                          <dd className={`font-semibold ${selectedProduct.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                            {selectedProduct.in_stock ? 'Yes' : 'No'}
                            {selectedProduct.inventory_level === 'product' && selectedProduct.product_stock_quantity != null && (
                              <span className="ml-2 text-sm font-normal">
                                ({selectedProduct.product_stock_quantity} available)
                              </span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-600">Inventory Tracking:</dt>
                          <dd className="flex items-center gap-2">
                            {selectedProduct.inventory_level === 'none' && (
                              <span className="text-sm px-2 py-1 bg-gray-100 text-gray-700 rounded">
                                ❌ None
                              </span>
                            )}
                            {selectedProduct.inventory_level === 'product' && (
                              <>
                                <span className="text-sm px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                                  📦 Product Level
                                </span>
                                <span className="text-sm text-gray-600">
                                  ({selectedProduct.product_stock_quantity || 0} total)
                                </span>
                              </>
                            )}
                            {selectedProduct.inventory_level === 'variant' && (
                              <>
                                <span className="text-sm px-2 py-1 bg-purple-100 text-purple-700 rounded font-medium">
                                  🎨 Variant Level
                                </span>
                                <span className="text-sm text-gray-600">
                                  ({selectedProduct.total_variant_stock || 0} total across variants)
                                </span>
                              </>
                            )}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    {selectedProduct.description ? (
                      <div 
                        className="text-gray-700 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
                      />
                    ) : (
                      <p className="text-gray-500 italic">No description available.</p>
                    )}
                  </div>

                  {/* Collections */}
                  {selectedProduct.collections.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Collections</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedProduct.collections.map((collection) => (
                          <span
                            key={collection.id}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                          >
                            {collection.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Variants - Only show if variants exist */}
                  {selectedProduct.variants && selectedProduct.variants.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Variants ({selectedProduct.variants.length})</h3>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Option</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                              {/* Always show stock column now, but will show "--" for non-variant tracking */}
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {selectedProduct.variants.map((variant) => (
                              <tr key={variant.id}>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{variant.sku}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{variant.display_name}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(variant.price_cents)}</td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  {selectedProduct.inventory_level === 'variant' ? (
                                    <span className={`font-medium ${
                                      variant.stock_quantity > 10 ? 'text-green-600' : 
                                      variant.stock_quantity > 0 ? 'text-amber-600' : 
                                      'text-red-600'
                                    }`}>
                                      {variant.stock_quantity}
                                      {variant.stock_quantity === 0 && (
                                        <span className="ml-1 text-xs px-1.5 py-0.5 bg-red-100 text-red-800 rounded">
                                          Out
                                        </span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">--</span>
                                  )}
                                </td>
                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                  {(() => {
                                    const status = getVariantStatus(variant, selectedProduct.inventory_level);
                                    return (
                                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${status.className}`}>
                                        {status.label}
                                      </span>
                                    );
                                  })()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setSelectedProduct(null);
                        navigate(`/admin/products/${selectedProduct.id}/edit`);
                      }}
                      className="flex-1 px-6 py-3 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 font-medium inline-flex items-center justify-center"
                    >
                      <Edit className="w-5 h-5 mr-2" /> Edit Product
                    </button>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
