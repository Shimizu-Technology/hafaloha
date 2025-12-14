import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface OrderItem {
  id: number;
  product_name: string;
  variant_name: string;
  product_sku: string;
  quantity: number;
  unit_price_cents: number;
  total_price_cents: number;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_status: string;
  order_type: string;
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
  tracking_number?: string;
  admin_notes?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  item_count: number;
}

export default function AdminOrdersPage() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editTracking, setEditTracking] = useState('');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const params: any = { page, per_page: 25 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      
      const response = await axios.get(`${API_BASE_URL}/api/v1/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setOrders(response.data.orders);
      setTotalPages(response.data.pagination.total_pages);
      setTotalCount(response.data.pagination.total_count);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  // Fetch single order with full details
  const fetchOrderDetails = async (orderId: number) => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSelectedOrder(response.data.order);
      setEditStatus(response.data.order.status);
      setEditTracking(response.data.order.tracking_number || '');
      setEditAdminNotes(response.data.order.admin_notes || '');
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      toast.error('Failed to load order details');
    }
  };

  // Update order (status, tracking, notes)
  const updateOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setSaving(true);
      const token = await getToken();
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/v1/admin/orders/${selectedOrder.id}`,
        {
          order: {
            status: editStatus,
            tracking_number: editTracking || null,
            admin_notes: editAdminNotes || null
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the order in the list
      setOrders(orders.map(o => o.id === selectedOrder.id ? response.data.order : o));
      setSelectedOrder(response.data.order);
      setIsEditing(false);
      
      toast.success('Order updated successfully!');
    } catch (err: any) {
      console.error('Failed to update order:', err);
      toast.error(err.response?.data?.error || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600 mt-1">{totalCount} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search by order #, email, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              />
              <button
                onClick={handleSearch}
                className="px-6 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition"
              >
                Search
              </button>
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600">Orders will appear here once customers start placing them.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                      <div className="text-xs text-gray-500">{order.order_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.customer_name}</div>
                      <div className="text-xs text-gray-500">{order.customer_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(order.total_cents)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => fetchOrderDetails(order.id)}
                        className="text-hafalohaRed hover:text-red-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-600">{order.customer_name}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">{order.item_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-semibold">{formatCurrency(order.total_cents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span>{formatDate(order.created_at)}</span>
                  </div>
                </div>

                <button
                  onClick={() => fetchOrderDetails(order.id)}
                  className="mt-4 w-full px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-gray-700">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-white/30" 
          onClick={() => {
            setSelectedOrder(null);
            setIsEditing(false);
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Order #{selectedOrder.order_number}</h2>
                <p className="text-sm text-gray-500 mt-1">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setIsEditing(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Management Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Order Management</h3>
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                    >
                      Edit Order
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    {/* Status Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order Status *
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>

                    {/* Tracking Number */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tracking Number
                      </label>
                      <input
                        type="text"
                        value={editTracking}
                        onChange={(e) => setEditTracking(e.target.value)}
                        placeholder="Enter tracking number..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                      />
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Admin Notes (Internal)
                      </label>
                      <textarea
                        value={editAdminNotes}
                        onChange={(e) => setEditAdminNotes(e.target.value)}
                        placeholder="Add internal notes about this order..."
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent resize-none"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={updateOrder}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditing(false);
                          setEditStatus(selectedOrder.status);
                          setEditTracking(selectedOrder.tracking_number || '');
                          setEditAdminNotes(selectedOrder.admin_notes || '');
                        }}
                        disabled={saving}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Status</p>
                      <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full ${getStatusBadge(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Tracking Number</p>
                      <p className="font-medium">{selectedOrder.tracking_number || 'Not added yet'}</p>
                    </div>
                    {selectedOrder.admin_notes && (
                      <div className="md:col-span-2">
                        <p className="text-gray-600 mb-1">Admin Notes</p>
                        <p className="font-medium text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedOrder.admin_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Order Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Payment Status</p>
                    <p className="font-medium">{selectedOrder.payment_status}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Order Type</p>
                    <p className="font-medium capitalize">{selectedOrder.order_type}</p>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Customer</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="text-gray-600">Name:</span> <span className="font-medium">{selectedOrder.customer_name}</span></p>
                  <p>
                    <span className="text-gray-600">Email:</span> 
                    <a href={`mailto:${selectedOrder.customer_email}`} className="font-medium text-hafalohaRed hover:underline ml-1">
                      {selectedOrder.customer_email}
                    </a>
                  </p>
                  <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{selectedOrder.customer_phone}</span></p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Shipping Address</h3>
                <div className="text-sm text-gray-700 bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium">{selectedOrder.shipping_address_line1}</p>
                  {selectedOrder.shipping_address_line2 && <p>{selectedOrder.shipping_address_line2}</p>}
                  <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_state} {selectedOrder.shipping_zip}</p>
                  <p>{selectedOrder.shipping_country}</p>
                  <p className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-gray-600">Shipping Method:</span> 
                    <span className="font-medium ml-1">{selectedOrder.shipping_method}</span>
                  </p>
                </div>
              </div>

              {/* Customer Notes */}
              {selectedOrder.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Customer Notes</h3>
                  <div className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <p>{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{item.product_name}</p>
                        <p className="text-sm text-gray-600 mt-1">{item.variant_name}</p>
                        <p className="text-xs text-gray-500 mt-1">SKU: {item.product_sku}</p>
                        <p className="text-sm text-gray-600 mt-2">
                          {formatCurrency(item.unit_price_cents)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-lg">{formatCurrency(item.total_price_cents)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.subtotal_cents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.shipping_cost_cents)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-medium">{formatCurrency(selectedOrder.tax_cents)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-3 border-t border-gray-300">
                    <span>Total:</span>
                    <span className="text-hafalohaRed">{formatCurrency(selectedOrder.total_cents)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons (bottom) */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                >
                  🖨️ Print Packing Slip
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`mailto:${selectedOrder.customer_email}`, '_blank')}
                  className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  ✉️ Email Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

