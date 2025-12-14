import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useAuth } from '@clerk/clerk-react';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import CollectionsPage from './pages/CollectionsPage';
import CollectionDetailPage from './pages/CollectionDetailPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import AdminLayout from './layouts/AdminLayout';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCollectionsPage from './pages/admin/AdminCollectionsPage';
import AdminImportPage from './pages/admin/AdminImportPage';
import AdminHomepagePage from './pages/admin/AdminHomepagePage';
import ProductFormPage from './pages/admin/ProductFormPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';
import NotFoundPage from './pages/NotFoundPage';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
import CartIcon from './components/CartIcon'; // Import CartIcon
import CartDrawer from './components/CartDrawer'; // Import CartDrawer
import ScrollToTop from './components/ScrollToTop'; // Import ScrollToTop
import { useCartStore } from './store/cartStore'; // Import cart store

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// Custom UserButton with Admin Dashboard Link
function CustomUserButton({ isAdmin }: { isAdmin: boolean }) {
  const navigate = useNavigate();

  return (
    <UserButton afterSignOutUrl="/">
      {isAdmin && (
        <UserButton.MenuItems>
          <UserButton.Action
            label="Admin Dashboard"
            labelIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            onClick={() => navigate('/admin')}
          />
        </UserButton.MenuItems>
      )}
    </UserButton>
  );
}

// AppContent component (uses useNavigate, must be inside BrowserRouter)
function AppContent() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const { closeCart } = useCartStore(); // Get closeCart function

  // Helper to close both mobile menu and cart
  const handleNavClick = () => {
    setMobileMenuOpen(false);
    closeCart();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!isLoaded) {
        return;
      }
      
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const token = await getToken();
        
        const response = await axios.get(`${API_BASE_URL}/api/v1/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        setIsAdmin(response.data.admin || false);
      } catch (error) {
        console.error('Error checking admin status:', error);
        if (axios.isAxiosError(error)) {
          console.error('Response data:', error.response?.data);
          console.error('Response status:', error.response?.status);
          console.error('Response headers:', error.response?.headers);
        }
        setIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [isLoaded, user, getToken]);

  return (
    <>
      <ScrollToTop />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: '500',
          },
          success: {
            style: {
              border: '1px solid #10B981',
            },
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            style: {
              border: '1px solid #EF4444',
            },
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <div className="min-h-screen bg-gray-50">
        {/* Cart Drawer */}
        <CartDrawer />

        {/* Navigation */}
        <nav className="bg-white shadow-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Logo */}
              <Link to="/" className="flex items-center" onClick={handleNavClick}>
                <img 
                  src="/images/hafaloha-logo.png" 
                  alt="Hafaloha" 
                  className="h-10 w-auto object-contain"
                />
              </Link>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center space-x-8">
                <Link
                  to="/products"
                  className="text-gray-700 hover:text-hafalohaRed font-medium transition"
                  onClick={handleNavClick}
                >
                  Shop
                </Link>
                <Link
                  to="/collections"
                  className="text-gray-700 hover:text-hafalohaRed font-medium transition"
                  onClick={handleNavClick}
                >
                  Collections
                </Link>
                <Link
                  to="/about"
                  className="text-gray-700 hover:text-hafalohaRed font-medium transition"
                  onClick={handleNavClick}
                >
                  Our Story
                </Link>
              </div>

              {/* Right Side: Search, Cart, Auth, Mobile Menu */}
              <div className="flex items-center space-x-4">
                {/* Search Bar - Desktop */}
                <form onSubmit={handleSearch} className="hidden md:block">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hafalohaRed focus:border-transparent w-64"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </form>

                {/* Cart Icon */}
                <CartIcon />

                    {/* Auth - Desktop */}
                    <div className="hidden md:flex items-center">
                      <SignedOut>
                        <SignInButton mode="modal">
                          <button className="bg-hafalohaRed text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium">
                            Sign In
                          </button>
                        </SignInButton>
                      </SignedOut>

                      <SignedIn>
                        <CustomUserButton isAdmin={isAdmin} />
                      </SignedIn>
                    </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 text-gray-700 hover:text-hafalohaRed transition"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 bg-white">
              <div className="px-4 py-3 space-y-3">
                {/* Mobile Search */}
                <form onSubmit={handleSearch} className="mb-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                    />
                    <svg
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </form>

                <Link
                  to="/products"
                  className="block text-gray-700 hover:text-hafalohaRed font-medium py-2"
                  onClick={handleNavClick}
                >
                  Shop
                </Link>
                <Link
                  to="/collections"
                  className="block text-gray-700 hover:text-hafalohaRed font-medium py-2"
                  onClick={handleNavClick}
                >
                  Collections
                </Link>
                <Link
                  to="/about"
                  className="block text-gray-700 hover:text-hafalohaRed font-medium py-2"
                  onClick={handleNavClick}
                >
                  Our Story
                </Link>
                <div className="pt-3 border-t border-gray-200">
                  <SignedOut>
                    <SignInButton mode="modal">
                      <button className="w-full bg-hafalohaRed text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium">
                        Sign In
                      </button>
                    </SignInButton>
                  </SignedOut>
                  <SignedIn>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-700">Account</span>
                      <CustomUserButton isAdmin={isAdmin} />
                    </div>
                  </SignedIn>
                </div>
              </div>
            </div>
          )}
        </nav>

        {/* Routes */}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:slug" element={<ProductDetailPage />} />
          <Route path="/collections" element={<CollectionsPage />} />
          <Route path="/collections/:slug" element={<CollectionDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders/:id" element={<OrderConfirmationPage />} />
          
          {/* Admin Routes with Layout */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
            <Route path="collections" element={<AdminCollectionsPage />} />
            <Route path="homepage" element={<AdminHomepagePage />} />
            <Route path="import" element={<AdminImportPage />} />
            <Route path="settings" element={<AdminSettingsPage />} />
          </Route>
          
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Footer */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
              {/* Brand */}
              <div className="sm:col-span-2 md:col-span-1">
                <img 
                  src="/images/hafaloha-logo-white-bg.png" 
                  alt="Hafaloha" 
                  className="h-12 w-auto mb-4 bg-white p-2 rounded"
                />
                <p className="text-gray-400 text-sm sm:text-base mb-4 leading-relaxed">
                  <span className="block mb-2 font-semibold text-gray-300">Island Living Apparel for All</span>
                  Uniform & Fundraiser Wholesale Apparel<br />
                  Taste of the islands: Shave Ice<br />
                  <span className="block mt-2 italic text-hafalohaGold">Håfa Adai Spirit + Essence of Aloha</span>
                </p>
                <div className="flex space-x-4">
                  <a 
                    href="https://www.facebook.com/hafaloha" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition"
                    aria-label="Facebook"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
                    </svg>
                  </a>
                  <a 
                    href="https://www.instagram.com/hafaloha" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition"
                    aria-label="Instagram"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
        </a>
      </div>
              </div>

              {/* Footer Navigation */}
              <div>
                <h4 className="font-semibold mb-3 sm:mb-4 text-hafalohaGold">Shop</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/products" className="text-gray-400 hover:text-white transition text-sm sm:text-base">
                      All Products
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?category=mens" className="text-gray-400 hover:text-white transition text-sm sm:text-base">
                      Mens
                    </Link>
                  </li>
                  <li>
                    <Link to="/products?category=womens" className="text-gray-400 hover:text-white transition text-sm sm:text-base">
                      Womens
                    </Link>
                  </li>
                  <li>
                    <Link to="/collections" className="text-gray-400 hover:text-white transition text-sm sm:text-base">
                      Collections
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 sm:mb-4 text-hafalohaGold">Info</h4>
                <ul className="space-y-2">
                  <li>
                    <Link to="/about" className="text-gray-400 hover:text-white transition text-sm sm:text-base">
                      Our Story
                    </Link>
                  </li>
                  <li>
                    <Link to="/contact" className="text-gray-400 hover:text-white transition text-sm sm:text-base">
                      Contact
                    </Link>
                  </li>
                  <li>
                    <Link to="/shipping" className="text-gray-400 hover:text-white transition text-sm sm:text-base">
                      Shipping Info
                    </Link>
                  </li>
                  <li>
                    <Link to="/returns" className="text-gray-400 hover:text-white transition text-sm sm:text-base">
                      Returns
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold mb-3 sm:mb-4 text-hafalohaGold">Location</h4>
                <address className="text-gray-400 text-sm sm:text-base not-italic">
                  121 E. Marine Corps Dr<br />
                  Suite 1-103 & Suite 1-104<br />
                  Hagåtña, Guam 96910<br />
                  <br />
                  <a href="tel:+16714727733" className="hover:text-white transition">
                    +1 (671) 472-7733
                  </a>
                </address>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-gray-400 text-sm text-center sm:text-left">
                  &copy; 2025 Hafaloha. All rights reserved.
                </p>
                <div className="flex gap-4 text-sm">
                  <Link to="/privacy" className="text-gray-400 hover:text-white transition">
                    Privacy Policy
                  </Link>
                  <Link to="/terms" className="text-gray-400 hover:text-white transition">
                    Terms of Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// Main App component (wraps AppContent with BrowserRouter)
function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
