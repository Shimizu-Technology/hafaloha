import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import { Clock, ShoppingBag, RefreshCw, Filter } from 'lucide-react';
import { authGet, authPatch } from '../../services/authApi';
import type { Order } from '../../components/admin/orders/orderUtils';
import {
  formatCurrency,
  getStatusBadge,
  formatStatus,
} from '../../components/admin/orders/orderUtils';
import AdminPageHeader from '../../components/admin/AdminPageHeader';

const POLL_INTERVAL = 15_000;

type StatusFilter = 'all' | 'pending' | 'confirmed' | 'ready';

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
  if (diff >= 20 * 60_000) return 'text-red-600 font-bold';
  if (diff >= 10 * 60_000) return 'text-amber-600 font-semibold';
  return 'text-gray-500';
}

interface QueueResponse {
  orders: Order[];
  counts: { pending: number; confirmed: number; ready: number };
}

export default function AdminPickupQueuePage() {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState({ pending: 0, confirmed: 0, ready: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const res = await authGet<QueueResponse>(
        `/admin/orders/pickup_queue${params}`,
        getToken
      );
      setOrders(res.data.orders);
      setCounts(res.data.counts);
    } catch {
      toast.error('Failed to load pickup queue');
    } finally {
      setLoading(false);
    }
  }, [getToken, filter]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateStatus = async (order: Order, newStatus: string) => {
    setUpdatingId(order.id);
    try {
      await authPatch(
        `/admin/orders/${order.id}`,
        { order: { status: newStatus } },
        getToken
      );
      toast.success(`Order ${order.order_number} updated to ${formatStatus(newStatus)}`);
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

  const getActions = (order: Order) => {
    const actions: { label: string; status: string; color: string }[] = [];
    switch (order.status) {
      case 'pending':
        actions.push({ label: 'Confirm', status: 'confirmed', color: 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white' });
        break;
      case 'confirmed':
        actions.push({ label: 'Mark Ready', status: 'ready', color: 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white' });
        break;
      case 'ready':
        actions.push({ label: 'Picked Up', status: 'picked_up', color: 'bg-green-600 hover:bg-green-700 active:bg-green-800 text-white' });
        break;
    }
    if (['pending', 'confirmed', 'ready'].includes(order.status)) {
      actions.push({ label: 'Cancel', status: 'cancelled', color: 'bg-red-100 hover:bg-red-200 active:bg-red-300 text-red-700' });
    }
    return actions;
  };

  const totalActive = counts.pending + counts.confirmed + counts.ready;

  const filterButtons: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalActive },
    { key: 'pending', label: 'Pending', count: counts.pending },
    { key: 'confirmed', label: 'Confirmed', count: counts.confirmed },
    { key: 'ready', label: 'Ready', count: counts.ready },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Pickup Queue"
        subtitle="Manage pickup orders for acai and wholesale"
      />

      {/* Filter bar */}
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

      {/* Orders grid */}
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
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-lg font-medium">No pickup orders</p>
          <p className="text-gray-400 text-sm mt-1">Orders will appear here when they come in</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {orders.map((order) => {
            const actions = getActions(order);
            const isUpdating = updatingId === order.id;
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
                        onClick={() => updateStatus(order, action.status)}
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
