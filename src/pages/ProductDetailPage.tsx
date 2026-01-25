import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { ProductFull, ProductVariant } from '../services/api';
import { productsApi, formatPrice } from '../services/api';
import { useCartStore } from '../store/cartStore';
import Breadcrumbs from '../components/Breadcrumbs';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<ProductFull | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  
  const { addItem } = useCartStore();
  
  // Extract size chart image URL from product description
  const getSizeChartUrl = (): string | null => {
    if (!product?.description) return null;
    const imgMatch = product.description.match(/<img[^>]+src=["']([^"']+)["']/i);
    return imgMatch ? imgMatch[1] : null;
  };
  
  const sizeChartUrl = getSizeChartUrl();

  useEffect(() => {
    if (slug) {
      fetchProduct(slug);
    }
  }, [slug]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (showSizeGuide) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showSizeGuide]);

  const fetchProduct = async (productSlug: string) => {
    try {
      setLoading(true);
      const data = await productsApi.getProduct(productSlug);
      console.log('🔍 Product Data:', {
        name: data.name,
        inventory_level: data.inventory_level,
        product_stock_quantity: data.product_stock_quantity,
        in_stock: data.in_stock,
        actually_available: data.actually_available,
        published: data.published,
        variants: data.variants?.map(v => ({
          id: v.id,
          display_name: v.display_name,
          in_stock: v.in_stock,
          actually_available: v.actually_available,
          stock_quantity: v.stock_quantity
        }))
      });
      setProduct(data);
      
      // For products with variants, select the first one
      // For products without variants (product-level inventory), we don't need a variant
      if (data.variants && data.variants.length > 0) {
        setSelectedVariant(data.variants[0]);
      } else {
        // No variants - product-level or no-tracking inventory
        setSelectedVariant(null);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to load product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
          <Link to="/products" className="text-hafalohaRed hover:underline">
            Back to products
          </Link>
        </div>
      </div>
    );
  }

  const displayPrice = selectedVariant ? selectedVariant.price_cents : product.base_price_cents;
  const displayImages = product.images.length > 0 ? product.images : [{ id: 0, url: '', alt_text: product.name, position: 0, primary: true }];
  
  // Determine if product is actually available based on inventory level
  const isProductAvailable = product.actually_available !== false && product.in_stock;
  
  // Determine variant availability (only if variants exist)
  const hasVariants = product.variants && product.variants.length > 0;
  const isVariantAvailable = hasVariants && selectedVariant ? 
    (selectedVariant.actually_available !== false) : 
    true; // No variants needed = always "available" from variant perspective
  
  // Determine max quantity based on inventory level
  const getMaxQuantity = () => {
    if (!product.inventory_level || product.inventory_level === 'none') {
      return 999; // No limit for non-tracked inventory
    }
    if (product.inventory_level === 'product') {
      return product.product_stock_quantity || 0;
    }
    if (product.inventory_level === 'variant' && selectedVariant) {
      return selectedVariant.stock_quantity || 0;
    }
    return 0;
  };
  
  const maxQuantity = getMaxQuantity();
  
  // For products WITH variants: require selectedVariant
  // For products WITHOUT variants (product-level inventory): no variant needed
  const canAddToCart = hasVariants 
    ? (isProductAvailable && isVariantAvailable && selectedVariant && quantity > 0 && quantity <= maxQuantity)
    : (isProductAvailable && quantity > 0 && quantity <= maxQuantity);
  
  console.log('🔍 Availability Check:', {
    hasVariants,
    isProductAvailable,
    isVariantAvailable,
    maxQuantity,
    canAddToCart,
    inventory_level: product.inventory_level,
    product_stock_quantity: product.product_stock_quantity,
    selectedVariant: selectedVariant ? {
      id: selectedVariant.id,
      display_name: selectedVariant.display_name,
      actually_available: selectedVariant.actually_available,
      stock_quantity: selectedVariant.stock_quantity
    } : null
  });

  const handleAddToCart = async () => {
    console.log('🔵 handleAddToCart called');
    console.log('  - selectedVariant:', selectedVariant?.id);
    console.log('  - quantity:', quantity);
    console.log('  - canAddToCart:', canAddToCart);
    console.log('  - isAdding:', isAdding);
    
    if (!selectedVariant || !canAddToCart) {
      console.log('❌ Blocked: Missing variant or cannot add');
      return;
    }
    
    if (isAdding) {
      console.log('❌ Blocked: Already adding');
      return;
    }
    
    console.log('✅ Proceeding with addItem');
    setIsAdding(true);
    try {
      await addItem(selectedVariant.id, quantity);
      console.log('✅ addItem completed successfully');
      // Reset quantity after successful add
      setQuantity(1);
    } catch (error) {
      // Error is handled in the store
      console.error('❌ Add to cart error:', error);
    } finally {
      setIsAdding(false);
      console.log('🔵 handleAddToCart finished');
    }
  };
  
  const handleVariantChange = (variant: ProductVariant) => {
    setSelectedVariant(variant);
    // Reset quantity to 1 when switching variants
    setQuantity(1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={
            product.collections && product.collections.length > 0
              ? [
                  { label: 'Home', path: '/' },
                  { label: product.collections[0].name, path: `/collections/${product.collections[0].slug}` },
                  { label: product.name }
                ]
              : [
                  { label: 'Home', path: '/' },
                  { label: 'Products', path: '/products' },
                  { label: product.name }
                ]
          }
        />

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Images */}
            <div className="p-6 sm:p-8 lg:p-10 bg-gray-50/50">
              {/* Main Image */}
              <div className="bg-white rounded-xl overflow-hidden mb-4 shadow-sm border border-gray-100" style={{ aspectRatio: '1/1' }}>
                {displayImages[selectedImageIndex].url ? (
                  <img
                    src={displayImages[selectedImageIndex].url}
                    alt={displayImages[selectedImageIndex].alt_text}
                    className="w-full h-full hover:scale-105 transition-transform duration-500"
                    style={{
                      objectFit: 'contain',
                      backgroundColor: 'white'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                    <img 
                      src="/images/hafaloha-logo.png" 
                      alt="Hafaloha" 
                      className="w-32 opacity-20 mb-4"
                      style={{ objectFit: 'contain', maxHeight: '8rem' }}
                    />
                    <span className="text-gray-400 text-lg font-medium">No Image Available</span>
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`bg-white rounded-lg overflow-hidden border-2 transition-all hover:scale-105 shadow-sm ${
                        selectedImageIndex === index ? 'border-hafalohaRed ring-2 ring-hafalohaRed/20' : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ aspectRatio: '1/1' }}
                    >
                      <img
                        src={image.url}
                        alt={image.alt_text}
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

            {/* Product Info */}
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
              {/* Collections */}
              {product.collections.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {product.collections.map((collection) => (
                      <Link
                        key={collection.id}
                        to={`/collections/${collection.slug}`}
                        className="inline-flex items-center text-xs font-semibold bg-hafalohaCream text-gray-700 px-3 py-1 rounded-full hover:bg-hafalohaGold/30 transition"
                      >
                        {collection.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Name & Price */}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3">{product.name}</h1>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-3xl sm:text-4xl font-bold text-hafalohaRed">
                  {formatPrice(displayPrice)}
                </span>
                {product.sale_price_cents && product.sale_price_cents < product.base_price_cents && (
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.base_price_cents)}
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="mb-8">
                <div 
                  className="prose prose-sm text-gray-700 mb-4"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
                
                {/* Size Guide Button */}
                {sizeChartUrl && (
                  <button
                    type="button"
                    onClick={() => setShowSizeGuide(true)}
                    className="inline-flex items-center px-4 py-2 border-2 border-hafalohaRed text-hafalohaRed hover:bg-hafalohaRed hover:text-white font-semibold rounded-lg transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Size Guide
                  </button>
                )}
              </div>

              {/* Variants */}
              {product.variants.length > 0 && (
                <div className="mb-8">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Select Option:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {product.variants.map((variant) => {
                      const variantAvailable = variant.actually_available !== false;
                      const showStockWarning = product.inventory_level === 'variant' && 
                                             variant.stock_quantity !== undefined && 
                                             variant.stock_quantity > 0 && 
                                             variant.stock_quantity <= 5;
                      
                      return (
                        <button
                          key={variant.id}
                          onClick={() => handleVariantChange(variant)}
                          disabled={!variantAvailable}
                          className={`px-4 py-3 rounded-lg border-2 transition-all ${
                            selectedVariant?.id === variant.id
                              ? 'border-hafalohaRed bg-red-50 text-hafalohaRed'
                              : variantAvailable
                              ? 'border-gray-300 hover:border-hafalohaRed'
                              : 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-sm font-medium">{variant.display_name}</div>
                          {!variantAvailable && (
                            <div className="text-xs">Out of Stock</div>
                          )}
                          {variantAvailable && showStockWarning && (
                            <div className="text-xs text-orange-600">Only {variant.stock_quantity} left</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Selector */}
              {isVariantAvailable && selectedVariant && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Quantity:
                  </label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-hafalohaRed transition"
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        setQuantity(Math.min(Math.max(1, val), maxQuantity));
                      }}
                      className="w-20 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg py-2"
                      style={{ textAlign: 'center' }}
                      min={1}
                      max={maxQuantity}
                    />
                    <button
                      onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                      className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-hafalohaRed transition"
                      disabled={quantity >= maxQuantity}
                    >
                      +
                    </button>
                    {product.inventory_level !== 'none' && maxQuantity > 0 && (
                      <span className="text-sm text-gray-600">
                        {maxQuantity} available
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Add to Cart Button */}
              <div className="mt-auto pt-6">
                <button
                  onClick={handleAddToCart}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
                    canAddToCart && !isAdding
                      ? 'btn-primary shadow-lg hover:shadow-xl'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!canAddToCart || isAdding}
                >
                  {isAdding ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Adding to Cart...
                    </>
                  ) : !product.in_stock || !selectedVariant?.in_stock ? (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Out of Stock
                    </>
                  ) : !selectedVariant ? (
                    'Select an Option'
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Add to Cart
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Secure Checkout
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Fast Shipping
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="mt-8 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Product Details</h3>
                <dl className="space-y-3">
                  {product.vendor && (
                    <div className="flex items-center">
                      <dt className="text-gray-500 w-28 text-sm">Vendor</dt>
                      <dd className="text-gray-900 font-medium text-sm">{product.vendor}</dd>
                    </div>
                  )}
                  {selectedVariant && (
                    <>
                      <div className="flex items-center">
                        <dt className="text-gray-500 w-28 text-sm">SKU</dt>
                        <dd className="text-gray-900 font-mono text-sm bg-gray-50 px-2 py-0.5 rounded">{selectedVariant.sku}</dd>
                      </div>
                      {selectedVariant.weight_oz && (
                        <div className="flex items-center">
                          <dt className="text-gray-500 w-28 text-sm">Weight</dt>
                          <dd className="text-gray-900 text-sm">{selectedVariant.weight_oz} oz</dd>
                        </div>
                      )}
                    </>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
        
        {/* Size Guide Modal */}
        {showSizeGuide && sizeChartUrl && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)' }}
            onClick={() => setShowSizeGuide(false)}
          >
            <div 
              className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-xl font-bold text-gray-900">Size Guide</h3>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Image Content */}
              <div className="p-6">
                <img
                  src={sizeChartUrl}
                  alt="Size Chart"
                  className="w-full h-auto"
                  style={{ maxHeight: '70vh', objectFit: 'contain' }}
                />
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Click outside to close
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

