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
  order_type: 'retail' | 'acai' | 'wholesale';
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  subtotal_cents: number;
  shipping_cost_cents: number;
  tax_cents: number;
  total_cents: number;
  shipping_method: string;
  // Retail/Shipping fields
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  // Acai-specific fields
  acai_pickup_date?: string;
  acai_pickup_time?: string;
  acai_crust_type?: string;
  acai_include_placard?: boolean;
  acai_placard_text?: string;
  pickup_location?: string;
  pickup_phone?: string;
  // Common
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

  const formatPickupDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPickupTime = (timeString: string) => {
    if (!timeString) return 'Time not specified';
    
    // Handle ISO datetime format (e.g., "2000-01-01T13:30:00.000Z")
    if (timeString.includes('T')) {
      try {
        const date = new Date(timeString);
        // Get the hours and minutes from the UTC time (since time-only is stored as UTC)
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        const period = hours >= 12 ? 'PM' : 'AM';
        const hour12 = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${hour12}:${minutes.toString().padStart(2, '0')} ${period}`;
      } catch {
        return timeString;
      }
    }
    
    // Handle "HH:MM-HH:MM" format (slot range)
    if (timeString.includes('-') && timeString.includes(':')) {
      const parts = timeString.split('-');
      return parts.map(part => {
        const [hours, minutes] = part.trim().split(':');
        const hour = parseInt(hours);
        if (isNaN(hour)) return part;
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${hour12}:${minutes} ${period}`;
      }).join(' - ');
    }
    
    // Handle simple "HH:MM" format
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours);
      if (isNaN(hour)) return timeString;
      const period = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      return `${hour12}:${minutes} ${period}`;
    }
    
    return timeString;
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

  const isAcaiOrder = order.order_type === 'acai';
  const isPickupOrder = order.shipping_method === 'pickup' || isAcaiOrder;

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          .print\\:border {
            border: 1px solid #e5e7eb !important;
          }
          .print\\:p-4 {
            padding: 1rem !important;
          }
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          .print\\:text-sm {
            font-size: 0.875rem !important;
          }
          @page {
            margin: 0.75in;
            size: letter;
          }
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 print:bg-white print:py-0">
        <div className="max-w-3xl mx-auto">
          {/* Success Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6 text-center print:shadow-none print:border print:p-4 print:mb-4 print:break-inside-avoid">
          <div className="text-6xl mb-4">{isAcaiOrder ? '🍰' : '🎉'}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {isAcaiOrder ? 'Acai Cake Order Confirmed!' : 'Order Confirmed!'}
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

        {/* Acai Pickup Details */}
        {isAcaiOrder && order.acai_pickup_date && (
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6 print:shadow-none print:border print:p-4 print:mb-4 print:break-inside-avoid">
            <h2 className="text-xl font-bold text-gray-900 mb-4 border-b pb-2 flex items-center">
              <span className="text-2xl mr-2">📍</span> Pickup Details
            </h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">Pickup Date</p>
                  <p className="text-lg font-bold text-gray-900">
                    📅 {formatPickupDate(order.acai_pickup_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-600 font-medium mb-1">Pickup Time</p>
                  <p className="text-lg font-bold text-gray-900">
                    🕐 {order.acai_pickup_time && formatPickupTime(order.acai_pickup_time)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 font-medium mb-1">Location</p>
                <p className="font-semibold text-gray-900">{order.pickup_location}</p>
              </div>
              
              {order.pickup_phone && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Phone</p>
                  <a href={`tel:${order.pickup_phone}`} className="font-semibold text-hafalohaRed hover:underline">
                    {order.pickup_phone}
                  </a>
                </div>
              )}

              {order.acai_crust_type && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Base/Crust</p>
                  <p className="font-semibold text-gray-900">{order.acai_crust_type}</p>
                </div>
              )}

              {order.acai_include_placard && order.acai_placard_text && (
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">Message Placard</p>
                  <p className="font-semibold text-gray-900 italic">"{order.acai_placard_text}"</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6 print:shadow-none print:border print:p-4 print:mb-4 print:break-inside-avoid">
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
              <p className="text-sm text-gray-600">
                {isPickupOrder ? 'Fulfillment' : 'Shipping Method'}
              </p>
              <p className="font-semibold">
                {isPickupOrder ? '📍 Pickup' : order.shipping_method}
              </p>
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
            {!isPickupOrder && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">{formatPrice(order.shipping_cost_cents)}</span>
              </div>
            )}
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

        {/* Shipping Address - Only for non-pickup orders */}
        {!isPickupOrder && order.shipping_address_line1 && (
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 mb-6 print:shadow-none print:border print:p-4 print:mb-4 print:break-inside-avoid">
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
        )}

        {/* Actions - Hidden when printing */}
        <div className="flex flex-col sm:flex-row gap-4 print:hidden">
          <button
            onClick={() => navigate(isAcaiOrder ? '/acai-cakes' : '/products')}
            className="flex-1 bg-hafalohaRed text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition text-center"
          >
            {isAcaiOrder ? 'Order Another Cake' : 'Continue Shopping'}
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 bg-white text-gray-700 border-2 border-gray-300 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition text-center"
          >
            Print Order
          </button>
        </div>

        {/* Help Text - Hidden when printing */}
        <div className="mt-8 text-center text-sm text-gray-600 print:hidden">
          <p>
            Questions about your order? Contact us at{' '}
            <a href="tel:671-989-3444" className="text-hafalohaRed hover:underline">
              (671) 989-3444
            </a>
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
