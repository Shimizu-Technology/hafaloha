import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import type { CartItem } from '../types/cart';

export default function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart,
    isOpen,
    isLoading,
    closeCart,
    fetchCart,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
  } = useCartStore();

  // Fetch cart when component mounts or when cart opens
  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen, fetchCart]);

  if (!isOpen) return null;

  const handleQuantityChange = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      await updateQuantity(cartItemId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity', error);
    }
  };

  const handleRemoveItem = async (cartItemId: number) => {
    try {
      await removeItem(cartItemId);
    } catch (error) {
      console.error('Failed to remove item', error);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      try {
        await clearCart();
      } catch (error) {
        console.error('Failed to clear cart', error);
      }
    }
  };

  return (
    <>
      {/* Overlay - semi-transparent */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Shopping Cart ({cart?.item_count || 0})
          </h2>
          <button
            onClick={closeCart}
            className="p-2 text-gray-400 hover:text-gray-600 transition"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hafalohaRed"></div>
            </div>
          ) : !cart || cart.items.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Your cart is empty</h3>
              <p className="mt-1 text-sm text-gray-500">Start adding some products!</p>
              <button
                onClick={closeCart}
                className="mt-4 bg-hafalohaRed text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item: CartItem) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3 border border-gray-200 rounded-lg"
                >
                  {/* Product Image */}
                  <img
                    src={item.product.primary_image_url || '/placeholder.png'}
                    alt={item.product.name}
                    className="w-20 h-20 object-cover rounded"
                  />

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {item.product_variant.display_name}
                    </p>
                    <p className="text-sm font-semibold text-hafalohaRed mt-1">
                      ${(item.product_variant.price_cents / 100).toFixed(2)}
                    </p>

                    {/* Availability Warning - Only show for tracked inventory */}
                    {item.product.inventory_level !== 'none' && (
                      <>
                        {!item.availability.available && (
                          <p className="text-xs text-red-600 mt-1">Out of stock</p>
                        )}
                        {item.availability.quantity_exceeds_stock && (
                          <p className="text-xs text-orange-600 mt-1">
                            Only {item.availability.available_quantity} available
                          </p>
                        )}
                      </>
                    )}

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition"
                        disabled={item.quantity <= 1 || isLoading}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 transition"
                        disabled={
                          isLoading ||
                          (item.product.inventory_level !== 'none' && 
                           item.quantity >= item.availability.available_quantity)
                        }
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="ml-auto text-xs text-red-600 hover:text-red-800 transition"
                        disabled={isLoading}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Clear Cart Button */}
              {cart.items.length > 0 && (
                <button
                  onClick={handleClearCart}
                  className="w-full text-sm text-red-600 hover:text-red-800 transition py-2"
                  disabled={isLoading}
                >
                  Clear Cart
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center">
              <span className="text-base font-medium text-gray-900">Subtotal</span>
              <span className="text-lg font-bold text-gray-900">
                ${subtotal().toFixed(2)}
              </span>
            </div>

            {/* Note about items not reserved */}
            <p className="text-xs text-gray-500 text-center">
              ⚠️ Items in cart are not reserved. Stock confirmed at checkout.
            </p>

            {/* Checkout Button */}
            <button
              onClick={() => {
                closeCart();
                navigate('/checkout');
              }}
              className="w-full bg-hafalohaRed text-white py-3 rounded-lg font-medium hover:bg-red-700 transition"
              disabled={isLoading}
            >
              Proceed to Checkout
            </button>

            {/* Continue Shopping */}
            <button
              onClick={closeCart}
              className="w-full text-sm text-gray-600 hover:text-gray-900 transition"
            >
              Continue Shopping
            </button>
          </div>
        )}
      </div>
    </>
  );
}

