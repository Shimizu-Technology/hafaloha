import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect to home after 2 seconds
    const timer = setTimeout(() => {
      navigate('/');
    }, 2000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mb-6">
          <span className="text-6xl">🏝️</span>
        </div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-3">
          Taking you back to the shop...
        </h2>
        <p className="text-gray-600 mb-6">
          This page doesn't exist, but we've got plenty of awesome Chamorro pride gear waiting for you!
        </p>
        <div className="flex items-center justify-center gap-2 text-hafalohaRed">
          <div className="animate-bounce">🛍️</div>
          <div className="animate-bounce delay-100">🛍️</div>
          <div className="animate-bounce delay-200">🛍️</div>
        </div>
      </div>
    </div>
  );
}

