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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
      <div className="text-center mb-8 sm:mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-gray-900">
          Featured Products
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover our hand-picked selection of premium island living apparel
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {products.map((product) => {
          const isOnSale = product.sale_price_cents && product.sale_price_cents < product.base_price_cents;
          const saveAmount = isOnSale ? (product.base_price_cents - product.sale_price_cents!) / 100 : 0;

          return (
            <Link
              key={product.id}
              to={`/products/${product.slug}`}
              className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col"
            >
              {/* Image */}
              <div className="relative bg-white overflow-hidden" style={{ aspectRatio: '1/1' }}>
                {product.primary_image_url ? (
                  <img
                    src={product.primary_image_url}
                    alt={product.name}
                    className="w-full h-full"
                    style={{ objectFit: 'contain' }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <img
                      src="/images/hafaloha-logo.png"
                      alt="Hafaloha"
                      className="w-1/2 h-1/2"
                      style={{ objectFit: 'contain' }}
                    />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-2">
                  {!product.actually_available && <ProductBadge type="sold-out" />}
                  {product.new_product && <ProductBadge type="new" />}
                  {isOnSale && <ProductBadge type="sale" saveAmount={saveAmount} />}
                  {product.featured && (
                    <span className="bg-hafalohaGold text-black text-xs font-semibold px-2 py-1 rounded">
                      Featured
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-3 sm:p-4 flex flex-col flex-grow">
                {/* Product Name */}
                <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 line-clamp-2 group-hover:text-hafalohaRed transition">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="mt-auto">
                  {isOnSale ? (
                    <div className="flex flex-col items-start">
                      <span className="text-xs sm:text-sm text-gray-500 line-through">
                        {formatPrice(product.base_price_cents)}
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-hafalohaRed">
                        {formatPrice(product.sale_price_cents!)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg sm:text-xl font-bold text-hafalohaRed">
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
          className="inline-block bg-hafalohaRed text-white px-8 py-3 rounded-lg hover:bg-red-700 transition font-semibold text-lg shadow-lg hover:shadow-xl"
        >
          View All Products →
        </Link>
      </div>
    </div>
  );
}

