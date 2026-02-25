import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { Clock, Truck, Package, RefreshCw, Filter, Printer, Tag } from 'lucide-react';
import { authGet, authPatch, authPost } from '../../services/authApi';
import type { Order } from '../../components/admin/orders/orderUtils';
import {
  formatCurrency,
  getStatusBadge,
  formatStatus,
} from '../../components/admin/orders/orderUtils';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const POLL_INTERVAL = 15_000;

type StatusFilter = 'all' | 'pending' | 'processing' | 'shipped';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function timeUrgency(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff >= 48 * 60 * 60_000) return 'text-red-600 font-bold';
  if (diff >= 24 * 60 * 60_000) return 'text-amber-600 font-semibold';
  return 'text-gray-500';
}

interface QueueResponse {
  orders: Order[];
  counts: { pending: number; processing: number; shipped: number };
}

export default function AdminShippingQueuePage() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState({ pending: 0, processing: 0, shipped: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<number, string>>({});
  const [buyingLabelId, setBuyingLabelId] = useState<number | null>(null);
  const [ratesForOrder, setRatesForOrder] = useState<Record<number, { rates: Array<{ id: string; carrier: string; service: string; rate_formatted: string; delivery_days?: number }>; shipment_id: string } | null>>({});

  const fetchOrders = useCallback(async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await authGet<QueueResponse>(
        `/admin/orders/shipping_queue${params}`,
        getToken
      );
      setOrders(res.data.orders);
      setCounts(res.data.counts);
    } catch {
      toast.error('Failed to load shipping queue');
    } finally {
      setLoading(false);
    }
  }, [getToken, filter]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (order: Order, newStatus: string, extra?: Record<string, string>) => {
    setUpdatingId(order.id);
    try {
      await authPatch(
        `/admin/orders/${order.id}`,
        { order: { status: newStatus, ...extra } },
        getToken
      );
      toast.success(`Order ${order.order_number} updated to ${formatStatus(newStatus)}`);
      setTrackingInputs((prev) => {
        const next = { ...prev };
        delete next[order.id];
        return next;
      });
      fetchOrders();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Failed to update order';
      toast.error(message);
    } finally {
      setUpdatingId(null);
    }
  };

  const fetchRates = async (orderId: number) => {
    try {
      setBuyingLabelId(orderId);
      const res = await authGet<{ rates: Array<{ id: string; carrier: string; service: string; rate_formatted: string; delivery_days?: number }>; shipment_id: string }>(
        `/admin/orders/${orderId}/shipping_rates`,
        getToken
      );
      setRatesForOrder((prev) => ({ ...prev, [orderId]: res.data }));
    } catch {
      toast.error('Failed to get shipping rates');
      setBuyingLabelId(null);
    }
  };

  const purchaseLabel = async (orderId: number, rateId: string) => {
    try {
      setBuyingLabelId(orderId);
      const res = await authPost<{ label_url: string; tracking_number: string; carrier: string; service: string }>(
        `/admin/orders/${orderId}/purchase_label`,
        { rate_id: rateId },
        getToken
      );
      toast.success(`Label purchased! Tracking: ${res.data.tracking_number}`);
      setRatesForOrder((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
      fetchOrders();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to purchase label';
      toast.error(message);
    } finally {
      setBuyingLabelId(null);
    }
  };

  const getActions = (order: Order) => {
    const actions: { label: string; status: string; color: string; needsTracking?: boolean }[] = [];
    switch (order.status) {
      case 'pending':
        actions.push({ label: 'Process', status: 'processing', color: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white' });
        break;
      case 'processing':
        actions.push({ label: 'Ship', status: 'shipped', color: 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white', needsTracking: true });
        break;
      case 'shipped':
        actions.push({ label: 'Delivered', status: 'delivered', color: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white' });
        break;
    }
    if (['pending', 'processing'].includes(order.status)) {
      actions.push({ label: 'Cancel', status: 'cancelled', color: 'bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700' });
    }
    return actions;
  };

  const formatAddress = (order: Order) => {
    return [
      order.shipping_address_line1,
      order.shipping_address_line2,
      [order.shipping_city, order.shipping_state, order.shipping_zip].filter(Boolean).join(', '),
    ].filter(Boolean);
  };

  const totalActive = counts.pending + counts.processing + counts.shipped;

  const filterButtons: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalActive },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'processing', label: 'Processing', count: counts.processing },
    { key: 'shipped', label: 'Shipped', count: counts.shipped },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Shipping Queue"
        subtitle="Manage retail orders that need shipping"
      />

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-gray-400" />
        {filterButtons.map((fb) => (
          <button
            key={fb.key}
            onClick={() => setFilter(fb.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
              filter === fb.key
                ? 'bg-hafalohaRed text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {fb.label}
            <span
              className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold ${
                filter === fb.key ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {fb.count}
            </span>
          </button>
        ))}
        <button
          onClick={() => { setLoading(true); fetchOrders(); }}
          className="ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 min-h-[44px]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && orders.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg font-medium">No shipping orders</p>
          <p className="text-gray-400 text-sm mt-1">Orders will appear here when they come in</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => {
            const actions = getActions(order);
            const isUpdating = updatingId === order.id;
            const address = formatAddress(order);
            const showTrackingInput = order.status === 'processing';
            const trackingValue = trackingInputs[order.id] ?? order.tracking_number ?? '';

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-600">{order.customer_name}</p>
                  </div>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadge(order.status)}`}>
                    {formatStatus(order.status)}
                  </span>
                </div>

                <div className="px-5 py-3">
                  <div className="space-y-1 mb-3">
                    {order.order_items.slice(0, 3).map((item) => (
                      <p key={item.id} className="text-sm text-gray-700 truncate">
                        {item.quantity}x {item.product_name}
                        {item.variant_name ? ` (${item.variant_name})` : ''}
                      </p>
                    ))}
                    {order.order_items.length > 3 && (
                      <p className="text-xs text-gray-400">
                        +{order.order_items.length - 3} more items
                      </p>
                    )}
                  </div>

                  {address.length > 0 && (
                    <div className="mb-3 p-2.5 bg-gray-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Package className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                        <div className="text-xs text-gray-600 leading-relaxed">
                          {address.map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {order.status === 'shipped' && order.tracking_number && (
                    <div className="mb-3 p-2.5 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                        <span className="text-xs text-purple-700 font-medium">
                          {order.tracking_number}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Shipping label section */}
                  {order.shipping_label_url ? (
                    <div className="mb-3">
                      <a
                        href={order.shipping_label_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm font-medium hover:bg-green-100 transition min-h-[44px]"
                      >
                        <Printer className="w-4 h-4" />
                        Print Shipping Label
                      </a>
                    </div>
                  ) : ratesForOrder[order.id] ? (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-xs font-medium text-blue-700 mb-2">Select a shipping rate:</p>
                      <div className="space-y-1.5">
                        {ratesForOrder[order.id]!.rates.map((rate) => (
                          <button
                            key={rate.id}
                            onClick={() => purchaseLabel(order.id, rate.id)}
                            disabled={buyingLabelId === order.id}
                            className="w-full flex items-center justify-between px-3 py-2 bg-white rounded-md border border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition text-sm disabled:opacity-50 min-h-[40px]"
                          >
                            <span className="text-gray-700">
                              {rate.carrier} {rate.service}
                              {rate.delivery_days && <span className="text-gray-400 ml-1">({rate.delivery_days}d)</span>}
                            </span>
                            <span className="font-semibold text-blue-700">{rate.rate_formatted}</span>
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => {
                          setRatesForOrder((prev) => { const next = { ...prev }; delete next[order.id]; return next; });
                          setBuyingLabelId(null);
                        }}
                        className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : ['pending', 'processing'].includes(order.status) ? (
                    <div className="mb-3">
                      <button
                        onClick={() => fetchRates(order.id)}
                        disabled={buyingLabelId === order.id}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition disabled:opacity-50 min-h-[44px]"
                      >
                        <Tag className="w-4 h-4" />
                        {buyingLabelId === order.id ? 'Loading rates...' : 'Buy Shipping Label'}
                      </button>
                    </div>
                  ) : null}

                  {showTrackingInput && !order.shipping_label_url && (
                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder="Tracking number (or buy label above)"
                        value={trackingValue}
                        onChange={(e) =>
                          setTrackingInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                        }
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-hafalohaRed focus:border-transparent min-h-[44px]"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(order.total_cents)}
                    </span>
                    <span className={`flex items-center gap-1 text-xs ${timeUrgency(order.created_at)}`}>
                      <Clock className="w-3.5 h-3.5" />
                      {timeAgo(order.created_at)}
                    </span>
                  </div>
                </div>

                {actions.length > 0 && (
                  <div className="px-5 py-3 border-t border-gray-100 flex flex-wrap gap-2">
                    {actions.map((action) => (
                      <button
                        key={action.status}
                        onClick={() => {
                          const extra: Record<string, string> = {};
                          if (action.needsTracking && trackingInputs[order.id]) {
                            extra.tracking_number = trackingInputs[order.id];
                          }
                          updateStatus(order, action.status, extra);
                        }}
                        disabled={isUpdating}
                        className={`flex-1 min-w-[80px] min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${action.color}`}
                      >
                        {isUpdating ? '...' : action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
