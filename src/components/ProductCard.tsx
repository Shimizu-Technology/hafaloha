import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Product } from '../services/api';
import { formatPrice } from '../services/api';
import ProductBadge from './ProductBadge';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      to={`/products/${product.slug}`}
      className="group bg-white overflow-hidden flex flex-col h-full"
    >
      <motion.div
        className="flex flex-col h-full rounded-lg"
        whileHover={{ y: -4, boxShadow: '0 12px 24px -8px rgba(0, 0, 0, 0.1)' }}
        transition={{ duration: 0.2 }}
      >
        {/* Image */}
        <div className="relative bg-warm-50 overflow-hidden rounded-lg" style={{ aspectRatio: '1/1' }}>
          {product.primary_image_url ? (
            <img
              src={product.primary_image_url}
              alt={product.name}
              className="w-full h-full object-contain bg-warm-50 group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-warm-50">
              <img 
                src="/images/hafaloha-logo.png" 
                alt="Hafaloha" 
                className="w-24 opacity-20 mb-2"
                style={{ objectFit: 'contain', maxHeight: '6rem' }}
              />
              <span className="text-warm-400 text-sm font-medium">No Image</span>
            </div>
          )}
          
          {/* Badges - Only essential ones */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
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
        <div className="pt-4 flex flex-col grow">
          {/* Product Name */}
          <h3 className="font-medium text-base text-warm-900 group-hover:text-hafalohaRed transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>

          {/* Price */}
          <div className="mt-auto">
            {product.sale_price_cents && product.sale_price_cents < product.base_price_cents ? (
              <div className="flex items-center gap-2">
                <span className="text-base font-medium text-warm-900">
                  {formatPrice(product.sale_price_cents)}
                </span>
                <span className="text-sm text-warm-400 line-through">
                  {formatPrice(product.base_price_cents)}
                </span>
              </div>
            ) : (
              <span className="text-base font-medium text-warm-900">
                {formatPrice(product.base_price_cents)}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
