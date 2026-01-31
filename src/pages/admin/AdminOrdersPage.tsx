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

interface Refund {
  id: number;
  amount_cents: number;
  amount_formatted: string;
  status: string;
  reason: string | null;
  stripe_refund_id: string | null;
  created_at: string;
  admin_user: string | null;
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
  // Shipping fields (for retail)
  shipping_address_line1?: string;
  shipping_address_line2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  tracking_number?: string;
  // Acai fields
  acai_pickup_date?: string;
  acai_pickup_time?: string;
  acai_crust_type?: string;
  acai_include_placard?: boolean;
  acai_placard_text?: string;
  pickup_location?: string;
  // Common
  admin_notes?: string;
  notes?: string;
  created_at: string;
  updated_at?: string;
  order_items: OrderItem[];
  item_count: number;
  refunds?: Refund[];
  total_refunded_cents?: number;
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
  const [orderTypeFilter, setOrderTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editTracking, setEditTracking] = useState('');
  const [editAdminNotes, setEditAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Ship Order modal state
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipOrderId, setShipOrderId] = useState<number | null>(null);
  const [shipTrackingNumber, setShipTrackingNumber] = useState('');
  const [shipCarrier, setShipCarrier] = useState('');

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundType, setRefundType] = useState<'full' | 'partial'>('full');
  const [processingRefund, setProcessingRefund] = useState(false);

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      
      const params: any = { page, per_page: 25 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (orderTypeFilter !== 'all') params.order_type = orderTypeFilter;
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
  }, [page, statusFilter, orderTypeFilter]);

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
      confirmed: 'bg-indigo-100 text-indigo-800',
      processing: 'bg-blue-100 text-blue-800',
      ready: 'bg-emerald-100 text-emerald-800',
      shipped: 'bg-purple-100 text-purple-800',
      picked_up: 'bg-green-100 text-green-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  // Quick status update function
  const quickUpdateStatus = async (orderId: number, newStatus: string) => {
    // If marking as shipped, show the ship modal instead
    if (newStatus === 'shipped') {
      setShipOrderId(orderId);
      setShipTrackingNumber('');
      setShipCarrier('');
      setShowShipModal(true);
      return;
    }

    try {
      const token = await getToken();
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/v1/admin/orders/${orderId}`,
        { order: { status: newStatus } },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the order in the list
      setOrders(orders.map(o => o.id === orderId ? response.data.order : o));
      
      // If modal is open for this order, update it too
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(response.data.order);
        setEditStatus(response.data.order.status);
      }
      
      toast.success(`Order marked as ${formatStatus(newStatus)}!`);
    } catch (err: any) {
      console.error('Failed to update order status:', err);
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  // Ship order with tracking number
  const shipOrder = async () => {
    if (!shipOrderId) return;
    
    try {
      setSaving(true);
      const token = await getToken();
      
      const trackingInfo = shipCarrier && shipTrackingNumber 
        ? `${shipCarrier}: ${shipTrackingNumber}`
        : shipTrackingNumber;
      
      const response = await axios.patch(
        `${API_BASE_URL}/api/v1/admin/orders/${shipOrderId}`,
        { 
          order: { 
            status: 'shipped',
            tracking_number: trackingInfo || null
          } 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the order in the list
      setOrders(orders.map(o => o.id === shipOrderId ? response.data.order : o));
      
      // If modal is open for this order, update it too
      if (selectedOrder?.id === shipOrderId) {
        setSelectedOrder(response.data.order);
        setEditStatus(response.data.order.status);
        setEditTracking(response.data.order.tracking_number || '');
      }
      
      setShowShipModal(false);
      setShipOrderId(null);
      setShipTrackingNumber('');
      setShipCarrier('');
      
      toast.success('Order shipped! Customer will receive a notification email.');
    } catch (err: any) {
      console.error('Failed to ship order:', err);
      toast.error(err.response?.data?.error || 'Failed to ship order');
    } finally {
      setSaving(false);
    }
  };

  // Process refund
  const processRefund = async () => {
    if (!selectedOrder) return;

    try {
      setProcessingRefund(true);
      const token = await getToken();

      const amountCents = refundType === 'full'
        ? selectedOrder.total_cents - (selectedOrder.total_refunded_cents || 0)
        : Math.round(parseFloat(refundAmount) * 100);

      if (amountCents <= 0) {
        toast.error('Invalid refund amount');
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/orders/${selectedOrder.id}/refund`,
        { amount_cents: amountCents, reason: refundReason || undefined },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message || 'Refund processed successfully');

      // Update the order in state with the response data
      const updatedOrder = response.data.order;
      setSelectedOrder(updatedOrder);
      setOrders(orders.map(o => o.id === updatedOrder.id ? updatedOrder : o));

      // Close modal and reset
      setShowRefundModal(false);
      setRefundAmount('');
      setRefundReason('');
      setRefundType('full');
    } catch (err: any) {
      const message = err.response?.data?.error || err.response?.data?.details || 'Failed to process refund';
      toast.error(message);
    } finally {
      setProcessingRefund(false);
    }
  };

  // Get next status action based on order type and current status
  const getNextStatusAction = (order: Order): { label: string; status: string; color: string } | null => {
    if (order.order_type === 'retail') {
      // Retail workflow: pending → processing → shipped → delivered
      switch (order.status) {
        case 'pending':
          return { label: 'Process', status: 'processing', color: 'bg-blue-600 hover:bg-blue-700' };
        case 'processing':
          return { label: 'Ship', status: 'shipped', color: 'bg-purple-600 hover:bg-purple-700' };
        case 'shipped':
          return { label: 'Delivered', status: 'delivered', color: 'bg-green-600 hover:bg-green-700' };
        default:
          return null;
      }
    } else {
      // Acai/Wholesale workflow: pending → confirmed → ready → picked_up
      // Also handle legacy "processing" status for Acai orders
      switch (order.status) {
        case 'pending':
          return { label: 'Confirm', status: 'confirmed', color: 'bg-indigo-600 hover:bg-indigo-700' };
        case 'confirmed':
        case 'processing': // Handle legacy status - treat as confirmed
          return { label: 'Ready', status: 'ready', color: 'bg-emerald-600 hover:bg-emerald-700' };
        case 'ready':
          return { label: 'Picked Up', status: 'picked_up', color: 'bg-green-600 hover:bg-green-700' };
        default:
          return null;
      }
    }
  };

  // Resend notification email (for orders that are ready/shipped)
  const resendNotification = async (orderId: number, _orderType: string, _status: string) => {
    try {
      const token = await getToken();
      
      await axios.post(
        `${API_BASE_URL}/api/v1/admin/orders/${orderId}/notify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Notification email sent to customer!');
    } catch (err: any) {
      console.error('Failed to send notification:', err);
      toast.error(err.response?.data?.error || 'Failed to send notification');
    }
  };

  // Format status for display
  const formatStatus = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      ready: 'Ready',
      shipped: 'Shipped',
      picked_up: 'Picked Up',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className="font-semibold text-gray-700">{totalCount}</span> total orders
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search by order #, email, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent focus:bg-white transition text-sm"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button
                onClick={handleSearch}
                className="btn-primary px-6 py-2.5 text-sm"
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
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent hover:border-gray-300 transition text-sm"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed (Pickup)</option>
            <option value="processing">Processing (Retail)</option>
            <option value="ready">Ready (Pickup)</option>
            <option value="shipped">Shipped (Retail)</option>
            <option value="picked_up">Picked Up</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Order Type Filter */}
        <div className="flex gap-2">
          <select
            value={orderTypeFilter}
            onChange={(e) => {
              setOrderTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent hover:border-gray-300 transition text-sm"
          >
            <option value="all">All Types</option>
            <option value="retail">🛍️ Retail</option>
            <option value="acai">🍰 Acai Cakes</option>
            <option value="wholesale">📦 Wholesale</option>
          </select>
        </div>
      </div>

      {/* Orders Table/List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hafalohaRed mx-auto mb-4"></div>
            <p className="text-gray-500">Loading orders...</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500">Orders will appear here once customers start placing them.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table - Scrollable on medium screens */}
          <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50/80">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[180px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{order.order_number}</div>
                      <div className="mt-1">
                        {order.order_type === 'acai' ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">🍰 Acai</span>
                        ) : order.order_type === 'wholesale' ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded">📦 Wholesale</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">🛍️ Retail</span>
                        )}
                      </div>
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
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {/* Quick Action Button */}
                        {(() => {
                          const nextAction = getNextStatusAction(order);
                          if (nextAction) {
                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  quickUpdateStatus(order.id, nextAction.status);
                                }}
                                className={`inline-flex items-center px-3 py-1.5 text-white text-xs font-semibold rounded-md shadow-sm transition-colors ${nextAction.color}`}
                              >
                                {nextAction.label}
                              </button>
                            );
                          }
                          return null;
                        })()}
                        {/* View Button */}
                        <button
                          onClick={() => fetchOrderDetails(order.id)}
                          className="inline-flex items-center px-3 py-1.5 text-gray-700 text-xs font-semibold bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {orders.map((order) => {
              const nextAction = getNextStatusAction(order);
              return (
                <div key={order.id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-gray-900">{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.customer_name}</p>
                      <div className="mt-1">
                        {order.order_type === 'acai' ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">🍰 Acai</span>
                        ) : order.order_type === 'wholesale' ? (
                          <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-800 rounded">📦 Wholesale</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">🛍️ Retail</span>
                        )}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                      {formatStatus(order.status)}
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

                  <div className="mt-4 flex gap-3">
                    {/* Quick Action Button */}
                    {nextAction && (
                      <button
                        onClick={() => quickUpdateStatus(order.id, nextAction.status)}
                        className={`flex-1 px-4 py-2.5 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors ${nextAction.color}`}
                      >
                        {nextAction.label}
                      </button>
                    )}
                    {/* View Button */}
                    <button
                      onClick={() => fetchOrderDetails(order.id)}
                      className={`${nextAction ? 'flex-1' : 'w-full'} px-4 py-2.5 text-sm font-semibold rounded-lg transition-colors ${
                        nextAction 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                          : 'bg-hafalohaRed text-white hover:bg-red-700'
                      }`}
                    >
                      {nextAction ? 'Details' : 'View Details'}
                    </button>
                  </div>
                </div>
              );
            })}
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-white/30 print:bg-white print:p-0 print:block" 
          onClick={() => {
            setSelectedOrder(null);
            setIsEditing(false);
          }}
        >
          {/* Print Styles */}
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .print-content, .print-content * { visibility: visible; }
              .print-content { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
              .print-hide { display: none !important; }
              @page { margin: 0.5in; }
            }
          `}</style>
          <div 
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl print:shadow-none print:max-h-none print:overflow-visible print-content" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10 print:static print:border-b-2 print:border-gray-400">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  <span className="print:hidden">Order #</span>
                  <span className="hidden print:inline text-3xl">HAFALOHA - PACKING SLIP<br /></span>
                  {selectedOrder.order_number}
                </h2>
                <p className="text-sm text-gray-500 mt-1">{formatDate(selectedOrder.created_at)}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedOrder(null);
                  setIsEditing(false);
                }}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none print-hide"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Management Section - Hidden in print */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 print-hide">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h3 className="font-semibold text-gray-900">Order Management</h3>
                  <div className="flex gap-2 w-full sm:w-auto">
                    {/* Quick Action Button */}
                    {!isEditing && (() => {
                      const nextAction = getNextStatusAction(selectedOrder);
                      if (nextAction) {
                        return (
                          <button
                            type="button"
                            onClick={() => quickUpdateStatus(selectedOrder.id, nextAction.status)}
                            className={`flex-1 sm:flex-none px-4 py-2 text-white rounded-lg transition text-sm font-medium ${nextAction.color}`}
                          >
                            {nextAction.label}
                          </button>
                        );
                      }
                      return null;
                    })()}
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="flex-1 sm:flex-none px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-medium"
                      >
                        Edit Details
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    {/* Status Dropdown - Contextual based on order type */}
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
                        {selectedOrder.order_type === 'retail' ? (
                          <>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                          </>
                        ) : (
                          <>
                            <option value="confirmed">Confirmed</option>
                            <option value="ready">Ready for Pickup</option>
                            <option value="picked_up">Picked Up</option>
                          </>
                        )}
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
                        {formatStatus(selectedOrder.status)}
                      </span>
                    </div>
                    {selectedOrder.order_type === 'retail' && (
                      <div>
                        <p className="text-gray-600 mb-1">Tracking Number</p>
                        <p className="font-medium">{selectedOrder.tracking_number || 'Not added yet'}</p>
                      </div>
                    )}
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
                    <p className={`font-medium ${selectedOrder.payment_status === 'refunded' ? 'text-red-600' : selectedOrder.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                      {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                    </p>
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

              {/* Acai Pickup Info (for acai orders) */}
              {selectedOrder.order_type === 'acai' && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">🍰 Acai Cake Details</h3>
                  <div className="text-sm bg-purple-50 border border-purple-200 p-4 rounded-lg space-y-2">
                    {selectedOrder.acai_pickup_date && (
                      <p>
                        <span className="text-purple-600 font-medium">Pickup Date:</span> 
                        <span className="font-medium ml-1">
                          {new Date(selectedOrder.acai_pickup_date + 'T00:00:00').toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </p>
                    )}
                    {selectedOrder.acai_pickup_time && (
                      <p>
                        <span className="text-purple-600 font-medium">Pickup Time:</span> 
                        <span className="font-medium ml-1">{selectedOrder.acai_pickup_time}</span>
                      </p>
                    )}
                    {selectedOrder.acai_crust_type && (
                      <p>
                        <span className="text-purple-600 font-medium">Base/Crust:</span> 
                        <span className="font-medium ml-1">{selectedOrder.acai_crust_type}</span>
                      </p>
                    )}
                    {selectedOrder.acai_include_placard && selectedOrder.acai_placard_text && (
                      <p>
                        <span className="text-purple-600 font-medium">Placard Message:</span> 
                        <span className="font-medium ml-1 italic">"{selectedOrder.acai_placard_text}"</span>
                      </p>
                    )}
                    {selectedOrder.pickup_location && (
                      <p className="mt-3 pt-3 border-t border-purple-200">
                        <span className="text-purple-600 font-medium">Pickup Location:</span> 
                        <span className="font-medium ml-1">{selectedOrder.pickup_location}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Shipping Address (for retail orders) */}
              {selectedOrder.order_type === 'retail' && selectedOrder.shipping_address_line1 && (
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
              )}

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
                    <span className="text-hafalohaRed print:text-black">{formatCurrency(selectedOrder.total_cents)}</span>
                  </div>
                </div>
              </div>

              {/* Refund History */}
              {selectedOrder.refunds && selectedOrder.refunds.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">💰 Refund History</h3>
                  <div className="space-y-3">
                    {selectedOrder.refunds.map((refund) => (
                      <div key={refund.id} className="flex justify-between items-start p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                              refund.status === 'succeeded' ? 'bg-green-100 text-green-700' :
                              refund.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {refund.status}
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(refund.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                            </span>
                          </div>
                          {refund.reason && <p className="text-sm text-gray-600 mt-1">{refund.reason}</p>}
                          {refund.admin_user && <p className="text-xs text-gray-500 mt-1">By: {refund.admin_user}</p>}
                        </div>
                        <p className="font-semibold text-red-600 text-lg">{refund.amount_formatted}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Print-only thank you message */}
              <div className="hidden print:block text-center pt-8 border-t border-gray-300 mt-4">
                <p className="text-lg font-semibold text-gray-800">Thank you for your order!</p>
                <p className="text-sm text-gray-600 mt-2">Hafaloha - Chamorro Pride. Island Style.</p>
                <p className="text-xs text-gray-500 mt-1">Questions? Contact us at info@hafaloha.com</p>
              </div>

              {/* Action Buttons (bottom) - Hidden in print */}
              <div className="flex flex-wrap gap-3 pt-4 border-t print-hide">
                {/* Notify Customer button for ready/shipped orders */}
                {(selectedOrder.status === 'ready' || selectedOrder.status === 'shipped') && (
                  <button
                    type="button"
                    onClick={() => resendNotification(selectedOrder.id, selectedOrder.order_type, selectedOrder.status)}
                    className="flex-1 min-w-[140px] px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    🔔 Notify Customer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                >
                  🖨️ Print Packing Slip
                </button>
                <button
                  type="button"
                  onClick={() => window.open(`mailto:${selectedOrder.customer_email}`, '_blank')}
                  className="flex-1 min-w-[140px] px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  ✉️ Email Customer
                </button>
                {selectedOrder.payment_status === 'paid' && (
                  <button
                    type="button"
                    onClick={() => {
                      setRefundType('full');
                      setRefundAmount('');
                      setRefundReason('');
                      setShowRefundModal(true);
                    }}
                    className="flex-1 min-w-[140px] px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                  >
                    💰 Refund Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ship Order Modal */}
      {showShipModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/30"
          onClick={() => {
            setShowShipModal(false);
            setShipOrderId(null);
          }}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">📦 Ship Order</h2>
              <p className="text-sm text-gray-500 mt-1">
                Add tracking information and mark as shipped
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Carrier Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Shipping Carrier
                </label>
                <select
                  value={shipCarrier}
                  onChange={(e) => setShipCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                >
                  <option value="">Select carrier...</option>
                  <option value="USPS">USPS</option>
                  <option value="UPS">UPS</option>
                  <option value="FedEx">FedEx</option>
                  <option value="DHL">DHL</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Tracking Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={shipTrackingNumber}
                  onChange={(e) => setShipTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                />
              </div>

              <p className="text-sm text-gray-500">
                💡 The customer will receive an email notification with the tracking information.
              </p>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={shipOrder}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Shipping...' : '📦 Mark as Shipped'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowShipModal(false);
                  setShipOrderId(null);
                }}
                disabled={saving}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md bg-black/30"
          onClick={() => setShowRefundModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">💰 Refund Order</h2>
              <p className="text-sm text-gray-500 mt-1">
                Order {selectedOrder.order_number} &mdash; {formatCurrency(selectedOrder.total_cents)}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Refund Type Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Refund Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      value="full"
                      checked={refundType === 'full'}
                      onChange={() => setRefundType('full')}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium">Full Refund</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="refundType"
                      value="partial"
                      checked={refundType === 'partial'}
                      onChange={() => setRefundType('partial')}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm font-medium">Partial Refund</span>
                  </label>
                </div>
              </div>

              {/* Refund Amount */}
              {refundType === 'full' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Refund amount:</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(selectedOrder.total_cents - (selectedOrder.total_refunded_cents || 0))}
                  </p>
                  {(selectedOrder.total_refunded_cents || 0) > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      Previously refunded: {formatCurrency(selectedOrder.total_refunded_cents || 0)}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={((selectedOrder.total_cents - (selectedOrder.total_refunded_cents || 0)) / 100).toFixed(2)}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Max refundable: {formatCurrency(selectedOrder.total_cents - (selectedOrder.total_refunded_cents || 0))}
                  </p>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter reason for refund..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800 font-medium">⚠️ This action cannot be undone.</p>
                <p className="text-xs text-yellow-700 mt-1">The refund will be processed through Stripe immediately.</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={processRefund}
                disabled={processingRefund || (refundType === 'partial' && (!refundAmount || parseFloat(refundAmount) <= 0))}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processingRefund ? 'Processing...' : '💰 Process Refund'}
              </button>
              <button
                type="button"
                onClick={() => setShowRefundModal(false)}
                disabled={processingRefund}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

