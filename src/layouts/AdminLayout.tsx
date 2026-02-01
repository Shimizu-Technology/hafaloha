import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface NavItem {
  name: string;
  path: string;
  icon: string;
}

export default function AdminLayout() {
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  // Check admin status from API
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isLoaded) {
        return;
      }

      if (!user) {
        setCheckingAdmin(false);
        setIsAdmin(false);
        return;
      }

      try {
        const token = await getToken();
        const response = await axios.get(`${API_BASE_URL}/api/v1/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setIsAdmin(response.data.admin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isLoaded, user, getToken]);

  // Redirect if not admin
  useEffect(() => {
    if (!checkingAdmin && isAdmin === false) {
      navigate('/');
    }
  }, [checkingAdmin, isAdmin, navigate]);

  // Show loading while checking admin status
  if (!isLoaded || checkingAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render admin content if not admin
  if (!isAdmin) {
    return null;
  }

  // Group navigation items
  const mainNavigation: NavItem[] = [
    { name: 'Dashboard', path: '/admin', icon: 'dashboard' },
    { name: 'Orders', path: '/admin/orders', icon: 'orders' },
    { name: 'Products', path: '/admin/products', icon: 'products' },
    { name: 'Collections', path: '/admin/collections', icon: '' },
    { name: 'Inventory', path: '/admin/inventory', icon: '' },
  ];
  
  const specialNavigation: NavItem[] = [
    { name: 'Fundraisers', path: '/admin/fundraisers', icon: 'fundraisers' },
    { name: 'Açaí Cakes', path: '/admin/acai', icon: 'acai' },
  ];
  
  const systemNavigation: NavItem[] = [
    { name: 'Users', path: '/admin/users', icon: 'users' },
    { name: 'Import', path: '/admin/import', icon: 'import' },
    { name: 'Settings', path: '/admin/settings', icon: 'settings' },
    { name: 'Variant Presets', path: '/admin/settings/variant-presets', icon: 'presets' },
  ];

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="mb-6">
      <p className="px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
      <div className="space-y-1">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                isActive
                  ? 'bg-hafalohaRed text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium text-sm">{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-black/20 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 bg-gradient-to-r from-hafalohaRed to-hafalohaRed/90">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">Håfaloha Admin</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-white/80 hover:text-white p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 overflow-y-auto" style={{ height: 'calc(100% - 140px)' }}>
          <NavSection title="Main" items={mainNavigation} />
          <NavSection title="Special" items={specialNavigation} />
          <NavSection title="System" items={systemNavigation} />
        </nav>

        {/* Admin info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-hafalohaRed to-hafalohaRed/80 flex items-center justify-center text-white font-bold shadow-md">
              {user?.firstName?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {user?.firstName || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 truncate">Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-gray-200 shadow-sm flex items-center justify-between px-4 lg:px-8">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Page title - dynamic based on path */}
          <h1 className="text-lg font-semibold text-gray-900 hidden md:block">
            {location.pathname === '/admin' && 'Dashboard'}
            {location.pathname === '/admin/orders' && 'Orders'}
            {location.pathname === '/admin/products' && 'Products'}
            {location.pathname.includes('/admin/products/') && 'Product Details'}
            {location.pathname === '/admin/collections' && 'Collections'}
            {location.pathname === '/admin/fundraisers' && 'Fundraisers'}
            {location.pathname === '/admin/acai' && 'Açaí Cakes Settings'}
            {location.pathname === '/admin/users' && 'User Management'}
            {location.pathname === '/admin/import' && 'CSV Import'}
            {location.pathname === '/admin/settings' && 'Settings'}
            {location.pathname === '/admin/settings/variant-presets' && 'Variant Presets'}
          </h1>

          {/* Quick actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-hafalohaRed bg-gray-50 hover:bg-gray-100 rounded-lg transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View Store
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

