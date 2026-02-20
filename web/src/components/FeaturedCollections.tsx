import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star } from 'lucide-react';
import { collectionsApi } from '../services/api';
import type { Collection } from '../services/api';
import FadeIn from './animations/FadeIn';
import OptimizedImage from './ui/OptimizedImage';

function useCountdown(endDate: string | null | undefined) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!endDate) return;

    const update = () => {
      const now = new Date().getTime();
      const end = new Date(endDate).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${minutes}m remaining`);
      }
    };

    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [endDate]);

  return timeLeft;
}

function FeaturedCollectionCard({ collection }: { collection: Collection }) {
  const countdown = useCountdown(collection.ends_at);
  const isLimited = collection.collection_type === 'limited_time';

  return (
    <Link
      to={`/collections/${collection.slug}`}
      className="group bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 block border border-warm-100"
    >
      {collection.banner_text && (
        <div className="bg-hafalohaRed text-white text-center py-1.5 px-4 text-sm font-medium">
          {collection.banner_text}
        </div>
      )}

      <div className="aspect-4/3 bg-warm-100 relative overflow-hidden">
        {collection.thumbnail_url ? (
          <OptimizedImage
            src={collection.thumbnail_url}
            alt={collection.name}
            context="card"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-20 h-20 text-warm-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}

        <div className="absolute top-3 right-3 inline-flex items-center gap-1 bg-hafalohaGold text-gray-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          <Star className="w-3 h-3" />
          Featured
        </div>

        {isLimited && countdown && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-black/70 text-white px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-sm">
            <Clock className="w-3.5 h-3.5" />
            {countdown}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-hafalohaRed transition-colors">
          {collection.name}
        </h3>
        {collection.description && (
          <p className="text-sm text-warm-500 mb-3 line-clamp-2">{collection.description}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-sm text-warm-400">
            {collection.product_count} {collection.product_count === 1 ? 'product' : 'products'}
          </p>
          <span className="text-hafalohaRed opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium flex items-center gap-1">
            Shop Now
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const data = await collectionsApi.getFeaturedCollections(6);
        setCollections(data.collections || []);
      } catch (err) {
        console.error('Failed to fetch featured collections:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  if (loading || collections.length === 0) return null;

  return (
    <section className="py-16 bg-warm-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mb-3">
              Featured Collections
            </h2>
            <p className="text-warm-500 max-w-2xl mx-auto">
              Shop our curated seasonal and special collections
            </p>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {collections.map((collection) => (
            <FadeIn key={collection.id} delay={0.1}>
              <FeaturedCollectionCard collection={collection} />
            </FadeIn>
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 px-6 py-3 border-2 border-hafalohaRed text-hafalohaRed rounded-lg hover:bg-hafalohaRed hover:text-white transition font-semibold"
          >
            View All Collections
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
