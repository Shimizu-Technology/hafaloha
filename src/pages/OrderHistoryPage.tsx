import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface OrderItem {
  product_name: string;
  variant_name: string;
  quantity: number;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  status_display: string;
  order_type: string;
  order_type_display: string;
  total_cents: number;
  total_formatted: string;
  item_count: number;
  created_at: string;
  created_at_display: string;
  tracking_number: string | null;
  shipping_method: string | null;
  can_track: boolean;
  is_delivered: boolean;
  is_cancelled: boolean;
  items_preview: OrderItem[];
}

interface Pagination {
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

export default function OrderHistoryPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchOrders();
    } else if (isLoaded && !isSignedIn) {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, statusFilter]);

  const fetchOrders = async (page = 1) => {
    try {
      setIsLoading(true);
      const token = await getToken();
      
      let url = `${API_BASE_URL}/api/v1/orders/my?page=${page}&per_page=10`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setOrders(response.data.orders);
      setPagination(response.data.pagination);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load your orders. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
      case 'picked_up':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOrderTypeIcon = (orderType: string) => {
    switch (orderType) {
      case 'retail':
        return '🛒';
      case 'acai':
        return '🍇';
      case 'wholesale':
        return '❤️';
      default:
        return '📦';
    }
  };

  // Show sign-in prompt if not authenticated
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-6">
              Please sign in to view your order history.
            </p>
            <p className="text-sm text-gray-500">
              If you placed an order as a guest, you can view it using the confirmation link in your email.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Orders</h1>
          <p className="mt-2 text-gray-600">
            View and track your order history
          </p>
        </div>

        {/* Filter */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-hafalohaRed focus:ring-hafalohaRed text-sm"
          >
            <option value="">All Orders</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-hafalohaRed border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Loading your orders...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => fetchOrders()}
              className="mt-2 text-red-600 underline hover:text-red-800"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && orders.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-gray-600 mb-6">
              {statusFilter 
                ? `You don't have any ${statusFilter} orders.`
                : "You haven't placed any orders yet. Start shopping!"}
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 bg-hafalohaRed text-white font-medium rounded-lg hover:bg-red-700 transition"
            >
              Browse Products
            </Link>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
              >
                <div className="p-4 sm:p-6">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getOrderTypeIcon(order.order_type)}</span>
                        <h3 className="font-semibold text-gray-900">
                          Order {order.order_number}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-500">
                        Placed on {order.created_at_display}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                        {order.status_display}
                      </span>
                      <p className="mt-1 text-lg font-semibold text-gray-900">
                        {order.total_formatted}
                      </p>
                    </div>
                  </div>

                  {/* Items Preview */}
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-600 mb-2">
                      {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                    </p>
                    <div className="space-y-1">
                      {order.items_preview.map((item, idx) => (
                        <p key={idx} className="text-sm text-gray-700">
                          {item.quantity}x {item.product_name}
                          {item.variant_name && ` - ${item.variant_name}`}
                        </p>
                      ))}
                      {order.item_count > 3 && (
                        <p className="text-sm text-gray-500 italic">
                          + {order.item_count - 3} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tracking Info */}
                  {order.can_track && order.tracking_number && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <span className="font-medium">Tracking:</span> {order.tracking_number}
                        {order.shipping_method && (
                          <span className="text-blue-600 ml-2">({order.shipping_method})</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition"
                    >
                      View Details
                    </Link>
                    {order.can_track && (
                      <Link
                        to={`/orders/${order.id}#tracking`}
                        className="inline-flex items-center px-4 py-2 bg-hafalohaRed text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                      >
                        Track Order
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total_pages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <button
              onClick={() => fetchOrders(pagination.current_page - 1)}
              disabled={pagination.current_page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {pagination.current_page} of {pagination.total_pages}
            </span>
            <button
              onClick={() => fetchOrders(pagination.current_page + 1)}
              disabled={pagination.current_page === pagination.total_pages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Footer Note */}
        {!isLoading && orders.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>
              Need help with an order?{' '}
              <Link to="/contact" className="text-hafalohaRed hover:underline">
                Contact us
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
