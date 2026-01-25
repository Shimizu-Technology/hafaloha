import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Calendar, Users, ArrowRight } from 'lucide-react';
import api from '../services/api';

interface Fundraiser {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  goal_amount_cents: number | null;
  raised_amount_cents: number | null;
  progress_percentage: number;
  is_active: boolean;
  is_ended: boolean;
  product_count: number;
  participant_count: number;
}

export default function FundraisersListPage() {
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFundraisers();
  }, []);

  const loadFundraisers = async () => {
    try {
      const response = await api.get('/fundraisers');
      setFundraisers(response.data.fundraisers || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load fundraisers');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fundraisers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadFundraisers}
            className="text-hafalohaRed hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const activeFundraisers = fundraisers.filter(f => f.is_active && !f.is_ended);
  const endedFundraisers = fundraisers.filter(f => f.is_ended);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-hafalohaRed/10 mb-6">
              <Heart className="w-8 h-8 text-hafalohaRed" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Support Our Fundraisers
            </h1>
            <p className="text-lg text-gray-600">
              Help support local teams, schools, and organizations by purchasing 
              Hafaloha merchandise. A portion of every sale goes directly to the cause.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Active Fundraisers */}
        {activeFundraisers.length > 0 ? (
          <section className="mb-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></span>
              Active Fundraisers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeFundraisers.map((fundraiser) => (
                <Link
                  key={fundraiser.id}
                  to={`/fundraisers/${fundraiser.slug}`}
                  className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-hafalohaRed/30 transition-all duration-300"
                >
                  {/* Image or Placeholder */}
                  <div className="aspect-video bg-linear-to-br from-hafalohaRed/10 to-hafalohaRed/5 relative overflow-hidden">
                    {fundraiser.image_url ? (
                      <img
                        src={fundraiser.image_url}
                        alt={fundraiser.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Heart className="w-16 h-16 text-hafalohaRed/30" />
                      </div>
                    )}
                    {/* Active Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-hafalohaRed transition-colors mb-2">
                      {fundraiser.name}
                    </h3>
                    
                    {fundraiser.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {fundraiser.description}
                      </p>
                    )}

                    {/* Progress Bar (if goal exists) */}
                    {fundraiser.goal_amount_cents && fundraiser.goal_amount_cents > 0 && (
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">
                            {formatPrice(fundraiser.raised_amount_cents || 0)} raised
                          </span>
                          <span className="text-gray-500">
                            {formatPrice(fundraiser.goal_amount_cents)} goal
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-hafalohaRed rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(fundraiser.progress_percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {fundraiser.end_date && (
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Ends {formatDate(fundraiser.end_date)}
                          </span>
                        )}
                      </div>
                      <ArrowRight className="w-4 h-4 text-hafalohaRed opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : (
          <section className="mb-16">
            <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                No Active Fundraisers
              </h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Check back soon! New fundraisers are added regularly to support 
                local teams and organizations.
              </p>
            </div>
          </section>
        )}

        {/* Ended Fundraisers */}
        {endedFundraisers.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">
              Past Fundraisers
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {endedFundraisers.map((fundraiser) => (
                <div
                  key={fundraiser.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 opacity-75"
                >
                  <h3 className="font-medium text-gray-700 mb-1">{fundraiser.name}</h3>
                  <p className="text-sm text-gray-500">
                    Ended {formatDate(fundraiser.end_date)}
                  </p>
                  {fundraiser.goal_amount_cents && fundraiser.raised_amount_cents && (
                    <p className="text-sm text-green-600 mt-2">
                      Raised {formatPrice(fundraiser.raised_amount_cents)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA for Organizations */}
        <section className="mt-16">
          <div className="bg-linear-to-r from-hafalohaRed to-hafalohaRed/90 rounded-2xl p-8 sm:p-12 text-center text-white">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Want to Start a Fundraiser?
            </h2>
            <p className="text-white/90 max-w-2xl mx-auto mb-6">
              Partner with Hafaloha to raise funds for your team, school, or organization. 
              We'll help you set up a custom fundraising page with exclusive merchandise.
            </p>
            <a
              href="mailto:info@hafaloha.com?subject=Fundraiser Inquiry"
              className="inline-flex items-center px-6 py-3 bg-white text-hafalohaRed font-semibold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Contact Us
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
