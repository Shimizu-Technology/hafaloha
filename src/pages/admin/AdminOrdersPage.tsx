import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Order,
  OrderFilters,
  OrdersTable,
  OrderDetailModal,
  ShipOrderModal,
  RefundModal,
  formatStatus,
} from '../../components/admin/orders';
import { SkeletonListPage } from '../../components/admin';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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

  // Selected order
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [saving, setSaving] = useState(false);

  // Ship modal
  const [showShipModal, setShowShipModal] = useState(false);
  const [shipOrderId, setShipOrderId] = useState<number | null>(null);
  const [shipTrackingNumber, setShipTrackingNumber] = useState('');
  const [shipCarrier, setShipCarrier] = useState('');

  // Refund modal
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [processingRefund, setProcessingRefund] = useState(false);

  // ── Fetch orders ──────────────────────────────────────────────
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const params: Record<string, unknown> = { page, per_page: 25 };
      if (statusFilter !== 'all') params.status = statusFilter;
      if (orderTypeFilter !== 'all') params.order_type = orderTypeFilter;
      if (searchQuery) params.search = searchQuery;

      const response = await axios.get(`${API_BASE_URL}/api/v1/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
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

  // ── Fetch single order details ────────────────────────────────
  const fetchOrderDetails = async (orderId: number) => {
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedOrder(response.data.order);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      toast.error('Failed to load order details');
    }
  };

  // ── Update order (from detail modal edit form) ────────────────
  const updateOrder = async (updates: {
    status: string;
    tracking_number: string | null;
    admin_notes: string | null;
  }) => {
    if (!selectedOrder) return;
    try {
      setSaving(true);
      const token = await getToken();
      const response = await axios.patch(
        `${API_BASE_URL}/api/v1/admin/orders/${selectedOrder.id}`,
        { order: updates },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setOrders(orders.map((o) => (o.id === selectedOrder.id ? response.data.order : o)));
      setSelectedOrder(response.data.order);
      toast.success('Order updated successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  // ── Quick status update ───────────────────────────────────────
  const quickUpdateStatus = async (orderId: number, newStatus: string) => {
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
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setOrders(orders.map((o) => (o.id === orderId ? response.data.order : o)));
      if (selectedOrder?.id === orderId) setSelectedOrder(response.data.order);
      toast.success(`Order marked as ${formatStatus(newStatus)}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  // ── Ship order ────────────────────────────────────────────────
  const shipOrder = async () => {
    if (!shipOrderId) return;
    try {
      setSaving(true);
      const token = await getToken();
      const trackingInfo =
        shipCarrier && shipTrackingNumber
          ? `${shipCarrier}: ${shipTrackingNumber}`
          : shipTrackingNumber;

      const response = await axios.patch(
        `${API_BASE_URL}/api/v1/admin/orders/${shipOrderId}`,
        { order: { status: 'shipped', tracking_number: trackingInfo || null } },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setOrders(orders.map((o) => (o.id === shipOrderId ? response.data.order : o)));
      if (selectedOrder?.id === shipOrderId) setSelectedOrder(response.data.order);
      setShowShipModal(false);
      setShipOrderId(null);
      toast.success('Order shipped! Customer will receive a notification email.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to ship order');
    } finally {
      setSaving(false);
    }
  };

  // ── Process refund ────────────────────────────────────────────
  const processRefund = async (amountCents: number, reason: string) => {
    if (!selectedOrder || amountCents <= 0) {
      toast.error('Invalid refund amount');
      return;
    }
    try {
      setProcessingRefund(true);
      const token = await getToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/orders/${selectedOrder.id}/refund`,
        { amount_cents: amountCents, reason: reason || undefined },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success(response.data.message || 'Refund processed successfully');
      const updatedOrder = response.data.order;
      setSelectedOrder(updatedOrder);
      setOrders(orders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      setShowRefundModal(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.response?.data?.details || 'Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  // ── Resend notification ───────────────────────────────────────
  const resendNotification = async (orderId: number) => {
    try {
      const token = await getToken();
      await axios.post(
        `${API_BASE_URL}/api/v1/admin/orders/${orderId}/notify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success('Notification email sent to customer!');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to send notification');
    }
  };

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  // ── Render ────────────────────────────────────────────────────
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
      <OrderFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={handleSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => { setStatusFilter(v); setPage(1); }}
        orderTypeFilter={orderTypeFilter}
        onOrderTypeFilterChange={(v) => { setOrderTypeFilter(v); setPage(1); }}
      />

      {/* Orders List */}
      {loading ? (
        <SkeletonListPage />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-500">Orders will appear here once customers start placing them.</p>
        </div>
      ) : (
        <OrdersTable
          orders={orders}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          onQuickUpdateStatus={quickUpdateStatus}
          onViewDetails={fetchOrderDetails}
        />
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          saving={saving}
          onClose={() => setSelectedOrder(null)}
          onUpdateOrder={updateOrder}
          onQuickUpdateStatus={quickUpdateStatus}
          onResendNotification={resendNotification}
          onOpenRefundModal={() => setShowRefundModal(true)}
        />
      )}

      {/* Ship Order Modal */}
      {showShipModal && (
        <ShipOrderModal
          saving={saving}
          carrier={shipCarrier}
          trackingNumber={shipTrackingNumber}
          onCarrierChange={setShipCarrier}
          onTrackingChange={setShipTrackingNumber}
          onShip={shipOrder}
          onClose={() => { setShowShipModal(false); setShipOrderId(null); }}
        />
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedOrder && (
        <RefundModal
          order={selectedOrder}
          processing={processingRefund}
          onProcess={processRefund}
          onClose={() => setShowRefundModal(false)}
        />
      )}
    </div>
  );
}
