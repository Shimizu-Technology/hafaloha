import { Link } from 'react-router-dom';
import FadeIn from '../components/animations/FadeIn';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <FadeIn direction="none">
          <div className="mb-8">
            <h1 className="text-8xl sm:text-9xl font-bold text-gray-200 tracking-tight select-none">
              404
            </h1>
            <div className="-mt-6 sm:-mt-8">
              <span className="text-4xl">🌴</span>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 tracking-tight">
            Looks like you've drifted off the island
          </h2>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p className="text-lg text-gray-600 mb-10 leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
            No worries — let's get you back to the good stuff!
          </p>
        </FadeIn>

        <FadeIn delay={0.35}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </Link>
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Browse Products
            </Link>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
