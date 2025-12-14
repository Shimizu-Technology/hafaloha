import { useEffect } from 'react';
import { useCartStore } from '../store/cartStore';

export default function CartIcon() {
  const { itemCount, toggleCart, fetchCart } = useCartStore();
  const count = itemCount();

  // Fetch cart on mount to ensure sync
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  return (
    <button
      onClick={toggleCart}
      className="relative p-2 text-gray-700 hover:text-hafalohaRed transition"
      aria-label={`Shopping cart with ${count} item${count !== 1 ? 's' : ''}`}
    >
      {/* Cart Icon SVG */}
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>

      {/* Badge with item count */}
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-hafalohaRed text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}

