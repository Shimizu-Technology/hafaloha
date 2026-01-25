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
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hafalohaRed mx-auto mb-4"></div>
          <p className="text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="rounded-2xl p-6 sm:p-8 shadow-lg" style={{ background: 'linear-gradient(to right, #C1191F, #d63939)' }}>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: 'white' }}>Welcome back! 👋</h1>
        <p style={{ color: 'rgba(255,255,255,0.85)' }}>Here's what's happening with your store today.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Orders</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats.total_orders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">📦</div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">Revenue</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{formatCurrency(stats.total_revenue_cents)}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">💰</div>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">Pending</p>
              <p className="text-2xl sm:text-3xl font-bold text-hafalohaRed mt-2">{stats.pending_orders}</p>
            </div>
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">⏳</div>
          </div>
          {stats.pending_orders > 0 && (
            <Link to="/admin/orders?status=pending" className="inline-block mt-3 text-xs font-medium text-hafalohaRed hover:underline">
              View pending →
            </Link>
          )}
        </div>

        {/* Products */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 sm:p-6 hover:shadow-md transition">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-semibold text-gray-400 uppercase tracking-wider">Products</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats.total_products}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl">🛍️</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link to="/admin/products/new" className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-md hover:border-hafalohaRed transition group">
          <div className="w-10 h-10 bg-hafalohaCream rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-hafalohaRed/10 transition">
            <span className="text-xl">➕</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Add Product</p>
        </Link>
        <Link to="/admin/orders" className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-md hover:border-hafalohaRed transition group">
          <div className="w-10 h-10 bg-hafalohaCream rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-hafalohaRed/10 transition">
            <span className="text-xl">📋</span>
          </div>
          <p className="text-sm font-medium text-gray-700">View Orders</p>
        </Link>
        <Link to="/admin/collections" className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-md hover:border-hafalohaRed transition group">
          <div className="w-10 h-10 bg-hafalohaCream rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-hafalohaRed/10 transition">
            <span className="text-xl">📂</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Collections</p>
        </Link>
        <Link to="/admin/settings" className="bg-white rounded-xl border border-gray-100 p-4 text-center hover:shadow-md hover:border-hafalohaRed transition group">
          <div className="w-10 h-10 bg-hafalohaCream rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-hafalohaRed/10 transition">
            <span className="text-xl">⚙️</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Settings</p>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent Orders</h2>
          <Link to="/admin/orders" className="text-sm font-medium text-hafalohaRed hover:underline flex items-center gap-1">
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="p-6">
          {recentOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-gray-500">No orders yet</p>
              <p className="text-sm text-gray-400 mt-1">Orders will appear here once customers start purchasing</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <Link 
                  key={order.id} 
                  to={`/admin/orders?id=${order.id}`}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition -mx-2"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-semibold text-gray-600">
                      {order.customer_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{order.order_number}</p>
                      <p className="text-sm text-gray-500">{order.customer_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(order.total_cents)}</p>
                    <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

