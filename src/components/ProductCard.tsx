import { Link } from 'react-router-dom';
import type { Product } from '../services/api';
import { formatPrice } from '../services/api';
import ProductBadge from './ProductBadge';

interface ProductCardProps {
  product: Product;
}

// Helper to strip HTML tags for preview text
const stripHtml = (html: string): string => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"
    >
      {/* Image */}
      <div className="relative bg-white overflow-hidden" style={{ aspectRatio: '1/1' }}>
        {product.primary_image_url ? (
          <img
            src={product.primary_image_url}
            alt={product.name}
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
            style={{
              objectFit: 'contain',
              backgroundColor: 'white'
            }}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 border-2 border-gray-200">
            <img 
              src="/images/hafaloha-logo.png" 
              alt="Hafaloha" 
              className="w-24 opacity-30 mb-2"
              style={{ objectFit: 'contain', maxHeight: '6rem' }}
            />
            <span className="text-gray-400 text-sm font-medium">No Image Available</span>
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2">
          {/* Sold Out Badge (highest priority) */}
          {!product.actually_available && (
            <ProductBadge type="sold-out" />
          )}
          
          {/* Sale Badge */}
          {product.sale_price_cents && product.sale_price_cents < product.base_price_cents && (
            <ProductBadge 
              type="sale" 
              saveAmount={Math.round((product.base_price_cents - product.sale_price_cents) / 100)}
            />
          )}
          
          {/* New Product Badge */}
          {product.new_product && (
            <ProductBadge type="new" />
          )}
          
          {/* Featured Badge */}
          {product.featured && (
            <span className="bg-hafalohaGold text-black text-xs font-semibold px-2 py-1 rounded">
              Featured
            </span>
          )}
        </div>
      </div>

      {/* Content - flex grow to push price to bottom */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Product Name - fixed height */}
        <h3 className="font-semibold text-lg text-gray-900 group-hover:text-hafalohaRed transition-colors line-clamp-2 mb-2 min-h-[3.5rem]">
          {product.name}
        </h3>

        {/* Collections - fixed height */}
        <div className="flex flex-wrap gap-1 mb-3 min-h-[1.75rem]">
          {product.collections && product.collections.length > 0 && (
            <>
              {product.collections.slice(0, 2).map((collection) => (
                <span
                  key={collection.id}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                >
                  {collection.name}
                </span>
              ))}
            </>
          )}
        </div>

        {/* Description - fixed height with clamp */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 min-h-[2.5rem]">
          {product.description ? stripHtml(product.description) : '\u00A0'}
        </p>

        {/* Spacer to push price to bottom */}
        <div className="flex-grow"></div>

        {/* Price and Variants - always at bottom */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            {/* Show sale price if on sale */}
            {product.sale_price_cents && product.sale_price_cents < product.base_price_cents ? (
              <div className="flex flex-col">
                <span className="text-xl font-bold text-hafalohaRed">
                  {formatPrice(product.sale_price_cents)}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(product.base_price_cents)}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-hafalohaRed">
                {formatPrice(product.base_price_cents)}
              </span>
            )}
          </div>
          
          {product.variant_count > 0 && (
            <span className="text-sm text-gray-500">
              {product.variant_count} {product.variant_count === 1 ? 'option' : 'options'}
            </span>
          )}
        </div>

        {/* View Details Button */}
        <button className="mt-3 w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium group-hover:bg-hafalohaRed group-hover:text-white transition-colors">
          View Details
        </button>
      </div>
    </Link>
  );
}

