import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi, formatPrice } from '../services/api';
import type { Product } from '../services/api';
import ProductBadge from './ProductBadge';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setIsLoading(true);
        // Fetch featured products, limit to 8 for homepage
        const response = await productsApi.getProducts({ 
          featured: true, 
          per_page: 8 
        });
        
        let featuredProducts = response.products;
        
        // If we have fewer than 6 featured products, fetch newest to fill the gap
        if (featuredProducts.length < 6) {
          const newestResponse = await productsApi.getProducts({ 
            per_page: 8 - featuredProducts.length,
            sort: 'newest'
          });
          
          // Combine featured + newest, remove duplicates
          const allProducts = [...featuredProducts, ...newestResponse.products];
          const uniqueProducts = allProducts.filter((product, index, self) => 
            index === self.findIndex((p) => p.id === product.id)
          );
          
          featuredProducts = uniqueProducts.slice(0, 8);
        }
        
        setProducts(featuredProducts);
      } catch (err) {
        console.error('Failed to fetch featured products:', err);
        setError('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <h2 className="text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-900">
          Featured Products
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-gray-200 rounded-lg animate-pulse" style={{ aspectRatio: '1/1.3' }}></div>
          ))}
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null; // Don't show section if no products
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="text-center mb-10 sm:mb-14">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
          Featured Products
        </h2>
        <p className="text-base text-gray-500 max-w-2xl mx-auto">
          Discover our hand-picked selection of premium island living apparel
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12">
        {products.map((product) => {
          const isOnSale = product.sale_price_cents && product.sale_price_cents < product.base_price_cents;

          return (
            <Link
              key={product.id}
              to={`/products/${product.slug}`}
              className="group flex flex-col"
            >
              {/* Image */}
              <div className="relative bg-gray-50 overflow-hidden rounded-lg" style={{ aspectRatio: '1/1' }}>
                {product.primary_image_url ? (
                  <img
                    src={product.primary_image_url}
                    alt={product.name}
                    className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                    style={{ objectFit: 'contain' }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <img
                      src="/images/hafaloha-logo.png"
                      alt="Hafaloha"
                      className="w-1/3 opacity-20"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                )}

                {/* Badges - Only essential ones */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {!product.actually_available && <ProductBadge type="sold-out" />}
                  {isOnSale && <ProductBadge type="sale" />}
                </div>
              </div>

              {/* Content */}
              <div className="pt-4 flex flex-col grow">
                {/* Product Name */}
                <h3 className="font-medium text-sm sm:text-base text-gray-900 mb-2 line-clamp-2 group-hover:text-hafalohaRed transition">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="mt-auto">
                  {isOnSale ? (
                    <div className="flex items-center gap-2">
                      <span className="text-base font-medium text-gray-900">
                        {formatPrice(product.sale_price_cents!)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        {formatPrice(product.base_price_cents)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-base font-medium text-gray-900">
                      {formatPrice(product.base_price_cents)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* View All Button */}
      <div className="text-center">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 text-base px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
        >
          View All Products
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}

