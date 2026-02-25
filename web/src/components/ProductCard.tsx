import { Link } from 'react-router-dom';
import type { Product } from '../services/api';
import { formatPrice } from '../services/api';
import ProductBadge from './ProductBadge';
import PlaceholderImage from './ui/PlaceholderImage';
import OptimizedImage from './ui/OptimizedImage';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-[#f8f8f8] overflow-hidden flex flex-col h-full border border-gray-200 rounded-lg transition-colors hover:border-gray-300"
    >
      <div className="p-2.5 flex flex-col h-full">
        {/* Image */}
        <div className="relative bg-white border border-gray-200 rounded-md overflow-hidden" style={{ aspectRatio: '1/1' }}>
          {product.primary_image_url ? (
            <OptimizedImage
              src={product.primary_image_url}
              alt={product.name}
              context="card"
              className="w-full h-full object-contain p-1 transition-transform duration-300 group-hover:scale-[1.01]"
            />
          ) : (
            <PlaceholderImage variant="card" />
          )}
          
          {/* Badges - Only essential ones */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
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
          </div>
        </div>

        {/* Content - minimal and clean */}
        <div className="pt-2 px-1 flex flex-col grow">
          {/* Product Name */}
          <h3 className="text-[15px] leading-5 font-semibold text-gray-900 truncate">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-1">
            {product.sale_price_cents && product.sale_price_cents < product.base_price_cents ? (
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-[15px] font-medium text-gray-900">
                  {formatPrice(product.sale_price_cents)}
                </span>
                <span className="text-[13px] text-gray-400 line-through">
                  {formatPrice(product.base_price_cents)}
                </span>
              </div>
            ) : (
              <span className="text-[15px] font-medium text-gray-900">
                {formatPrice(product.base_price_cents)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
