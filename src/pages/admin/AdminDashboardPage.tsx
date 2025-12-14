import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface DashboardStats {
  total_orders: number;
  total_revenue_cents: number;
  pending_orders: number;
  total_products: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  customer_name: string;
  total_cents: number;
  status: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total_orders: 0,
    total_revenue_cents: 0,
    pending_orders: 0,
    total_products: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      
      // Fetch stats
      const statsResponse = await axios.get(`${API_BASE_URL}/api/v1/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(statsResponse.data);

      // Fetch recent orders
      const ordersResponse = await axios.get(`${API_BASE_URL}/api/v1/admin/orders?per_page=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentOrders(ordersResponse.data.orders || []);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_orders}</p>
            </div>
            <div className="text-4xl">📦</div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.total_revenue_cents)}</p>
            </div>
            <div className="text-4xl">💰</div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Orders</p>
              <p className="text-3xl font-bold text-hafalohaRed mt-1">{stats.pending_orders}</p>
            </div>
            <div className="text-4xl">⏳</div>
          </div>
        </div>

        {/* Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total_products}</p>
            </div>
            <div className="text-4xl">🛍️</div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-hafalohaRed hover:text-red-700 text-sm font-medium">
            View All →
          </Link>
        </div>
        <div className="p-6">
          {recentOrders.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b last:border-b-0">
                  <div>
                    <p className="font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-600">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(order.total_cents)}</p>
                    <p className="text-sm text-gray-600">{formatDate(order.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

