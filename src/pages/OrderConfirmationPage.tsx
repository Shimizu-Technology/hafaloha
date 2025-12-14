import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

interface OrderItem {
  id: number;
  product_name: string;
  variant_name: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
  product_sku: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal_cents: number;
  shipping_cost_cents: number;
  tax_cents: number;
  total_cents: number;
  shipping_method: string;
  shipping_address_line1: string;
  shipping_address_line2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_country: string;
  order_items: OrderItem[];
  created_at: string;
}

export default function OrderConfirmationPage() {
  const { id: orderId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('Order ID is missing');
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/orders/${orderId}`);
        setOrder(response.data.order);
      } catch (err: any) {
        console.error('Failed to fetch order:', err);
        setError(err.response?.data?.error || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-hafalohaRed border-t-transparent mb-4"></div>
          <p className="text-gray-600">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'Unable to load order details'}</p>
          <button
            onClick={() => navigate('/products')}
            className="bg-hafalohaRed text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you for your order, {order.customer_name}!
          </p>
          <div className="bg-gray-100 rounded-lg p-4 inline-block">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <p className="text-xl font-bold text-hafalohaRed">{order.order_number}</p>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            A confirmation email has been sent to <span className="font-semibold">{order.customer_email}</span>
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Order Details</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600">Order Date</p>
              <p className="font-semibold">{formatDate(order.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Status</p>
              <p className="font-semibold capitalize">
                {order.payment_status === 'paid' ? (
                  <span className="text-green-600">✓ Paid</span>
                ) : (
                  order.payment_status
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Order Status</p>
              <p className="font-semibold capitalize">{order.status}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Shipping Method</p>
              <p className="font-semibold">{order.shipping_method}</p>
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Items Ordered</h3>
            <div className="border rounded-lg overflow-hidden">
              {order.order_items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-4 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.product_name}</p>
                    {item.variant_name && (
                      <p className="text-sm text-gray-600">{item.variant_name}</p>
                    )}
                    <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    <p className="font-semibold text-gray-900">{formatPrice(item.total_price_cents)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">{formatPrice(order.subtotal_cents)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Shipping</span>
              <span className="font-semibold">{formatPrice(order.shipping_cost_cents)}</span>
            </div>
            {order.tax_cents > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Tax</span>
                <span className="font-semibold">{formatPrice(order.tax_cents)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2">
              <span>Total</span>
              <span className="text-hafalohaRed">{formatPrice(order.total_cents)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2">Shipping Address</h2>
          <div className="text-gray-700">
            <p className="font-semibold">{order.customer_name}</p>
            <p>{order.shipping_address_line1}</p>
            {order.shipping_address_line2 && <p>{order.shipping_address_line2}</p>}
            <p>
              {order.shipping_city}, {order.shipping_state} {order.shipping_zip}
            </p>
            <p>{order.shipping_country}</p>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>Phone: {order.customer_phone}</p>
            <p>Email: {order.customer_email}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => navigate('/products')}
            className="flex-1 bg-hafalohaRed text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition text-center"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
          >
            Print Order
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Questions about your order? Contact us at{' '}
            <a href="tel:671-989-3444" className="text-hafalohaRed hover:underline">
              (671) 989-3444
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
