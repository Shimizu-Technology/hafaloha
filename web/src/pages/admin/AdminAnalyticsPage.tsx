import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  TrendingUp, TrendingDown, Minus, BarChart3, DollarSign, Download,
  ShoppingCart, Users, MapPin,
} from 'lucide-react';
import { SkeletonBar, SkeletonStatCard } from '../../components/admin';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import { authGet } from '../../services/authApi';

// --- Types ---

interface SummaryData {
  total_revenue: number;
  total_orders: number;
  average_order_value: number;
  total_customers: number;
}

interface LocationData {
  location_id: number | null;
  location_name: string;
  revenue: number;
  orders: number;
  average_order_value: number;
}

interface BreakdownEntry {
  count: number;
  revenue: number;
}

interface TrendPoint {
  date: string;
  label: string;
  revenue: number;
  orders: number;
}

interface TopProduct {
  id: number;
  name: string;
  quantity_sold: number;
  revenue: number;
}

interface RecentOrder {
  id: number;
  order_number: string;
  total: number;
  status: string;
  location_name: string;
  created_at: string;
}

interface DashboardData {
  summary: SummaryData;
  by_location: LocationData[];
  by_order_type: Record<string, BreakdownEntry>;
  by_source: Record<string, BreakdownEntry>;
  by_payment_method: Record<string, BreakdownEntry>;
  revenue_trend: TrendPoint[];
  top_products: TopProduct[];
  recent_orders: RecentOrder[];
}

// --- Helpers ---

const fmt = (v: number) => `$${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PERIODS = [
  { value: 'week', label: '7d' },
  { value: 'month', label: '30d' },
  { value: 'year', label: '1y' },
  { value: 'all', label: 'All' },
] as const;

function exportToCsv(data: DashboardData) {
  const rows = [
    ['Metric', 'Value'],
    ['Total Revenue', fmt(data.summary.total_revenue)],
    ['Total Orders', String(data.summary.total_orders)],
    ['Average Order Value', fmt(data.summary.average_order_value)],
    ['Total Customers', String(data.summary.total_customers)],
    [],
    ['Top Products', 'Qty Sold', 'Revenue'],
    ...data.top_products.map(p => [p.name, String(p.quantity_sold), fmt(p.revenue)]),
    [],
    ['Location', 'Orders', 'Revenue', 'AOV'],
    ...data.by_location.map(l => [l.location_name, String(l.orders), fmt(l.revenue), fmt(l.average_order_value)]),
    [],
    ['Order Type', 'Count', 'Revenue'],
    ...Object.entries(data.by_order_type).map(([k, v]) => [k, String(v.count), fmt(v.revenue)]),
    [],
    ['Payment Method', 'Count', 'Revenue'],
    ...Object.entries(data.by_payment_method).map(([k, v]) => [k, String(v.count), fmt(v.revenue)]),
  ];
  const csv = rows.map(r => (r as string[]).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Components ---

function StatCard({ label, value, icon: Icon, subtext }: {
  label: string; value: string; icon: React.ElementType; subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
    </div>
  );
}

function BreakdownTable({ title, data }: { title: string; data: Record<string, BreakdownEntry> }) {
  const entries = Object.entries(data).sort((a, b) => b[1].revenue - a[1].revenue);
  if (entries.length === 0) return null;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {entries.map(([key, val]) => (
          <div key={key} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
            <div className="flex items-center gap-4">
              <span className="text-gray-400">{val.count} orders</span>
              <span className="font-medium text-gray-900">{fmt(val.revenue)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---

export default function AdminAnalyticsPage() {
  const { getToken } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('month');
  const [chartMode, setChartMode] = useState<'revenue' | 'orders'>('revenue');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [locationId, setLocationId] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { period };
      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      if (locationId) params.location_id = locationId;
      const res = await authGet<DashboardData>('/admin/analytics/dashboard', getToken, { params });
      setData(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [period, startDate, endDate, locationId, getToken]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between">
          <SkeletonBar className="h-7 w-32" />
          <SkeletonBar className="h-8 w-28 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard /><SkeletonStatCard />
        </div>
        <SkeletonBar className="h-96 rounded-xl" />
      </div>
    );
  }

  if (!data) return <p className="text-gray-500">Failed to load analytics data.</p>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Revenue, orders, and product insights</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportToCsv(data)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => { setPeriod(p.value); setStartDate(''); setEndDate(''); }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                  period === p.value && !startDate
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Date Range Picker */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-500">Custom range:</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
        />
        <span className="text-gray-400">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
        />
        {data.by_location.length > 1 && (
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">All Locations</option>
            {data.by_location.map((loc) => (
              <option key={loc.location_id ?? 'none'} value={String(loc.location_id ?? '')}>
                {loc.location_name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Revenue" value={fmt(data.summary.total_revenue)} icon={DollarSign} />
        <StatCard label="Total Orders" value={String(data.summary.total_orders)} icon={ShoppingCart} />
        <StatCard label="Avg Order Value" value={fmt(data.summary.average_order_value)} icon={BarChart3} />
        <StatCard label="Customers" value={String(data.summary.total_customers)} icon={Users} />
      </div>

      {/* Revenue Trend Chart */}
      {data.revenue_trend.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Revenue Trend</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {(['revenue', 'orders'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setChartMode(mode)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${
                    chartMode === mode
                      ? 'bg-white shadow-sm text-gray-900'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={360}>
            {data.revenue_trend.length <= 31 ? (
              <BarChart data={data.revenue_trend} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={chartMode === 'revenue' ? (v) => `$${v.toFixed(0)}` : undefined}
                />
                <Tooltip
                  formatter={(value) => {
                    const v = Number(value);
                    return chartMode === 'revenue' ? [fmt(v), 'Revenue'] : [v, 'Orders'];
                  }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey={chartMode} fill={chartMode === 'revenue' ? '#16a34a' : '#6366f1'} radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={data.revenue_trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false}
                  tickFormatter={chartMode === 'revenue' ? (v) => `$${v.toFixed(0)}` : undefined}
                />
                <Tooltip
                  formatter={(value) => {
                    const v = Number(value);
                    return chartMode === 'revenue' ? [fmt(v), 'Revenue'] : [v, 'Orders'];
                  }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey={chartMode} stroke={chartMode === 'revenue' ? '#16a34a' : '#6366f1'} strokeWidth={2} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      )}

      {/* Breakdowns Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <BreakdownTable title="By Order Type" data={data.by_order_type} />
        <BreakdownTable title="By Payment Method" data={data.by_payment_method} />
        <BreakdownTable title="By Source" data={data.by_source} />
      </div>

      {/* Location Comparison */}
      {data.by_location.length > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">By Location</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Location</th>
                  <th className="pb-3 font-medium text-right">Orders</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                  <th className="pb-3 font-medium text-right">AOV</th>
                </tr>
              </thead>
              <tbody>
                {data.by_location.map((loc) => (
                  <tr key={loc.location_id ?? 'none'} className="border-b border-gray-50">
                    <td className="py-3 text-gray-900">{loc.location_name}</td>
                    <td className="py-3 text-right text-gray-600">{loc.orders}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{fmt(loc.revenue)}</td>
                    <td className="py-3 text-right text-gray-600">{fmt(loc.average_order_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Products */}
      {data.top_products.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">Top Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">#</th>
                  <th className="pb-3 font-medium">Product</th>
                  <th className="pb-3 font-medium text-right">Qty Sold</th>
                  <th className="pb-3 font-medium text-right">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {data.top_products.map((product, i) => (
                  <tr key={product.id} className="border-b border-gray-50">
                    <td className="py-3 text-gray-400">{i + 1}</td>
                    <td className="py-3 text-gray-900">{product.name}</td>
                    <td className="py-3 text-right text-gray-600">{product.quantity_sold}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{fmt(product.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
