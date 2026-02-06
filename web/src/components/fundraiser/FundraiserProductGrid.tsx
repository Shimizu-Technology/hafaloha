import { Package } from 'lucide-react';
import FundraiserProductCard from './FundraiserProductCard';
import type { FundraiserProduct } from '../../services/fundraiserPublicService';

interface FundraiserProductGridProps {
  products: FundraiserProduct[];
  fundraiserSlug: string;
  canOrder: boolean;
}

export default function FundraiserProductGrid({
  products,
  fundraiserSlug,
  canOrder,
}: FundraiserProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center text-warm-500">
        <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No products available for this fundraiser</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <FundraiserProductCard
          key={product.id}
          product={product}
          fundraiserSlug={fundraiserSlug}
          canOrder={canOrder}
        />
      ))}
    </div>
  );
}
