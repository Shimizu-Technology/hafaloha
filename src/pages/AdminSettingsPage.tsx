import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface SiteSettings {
  payment_test_mode: boolean;
  payment_processor: string;
  send_customer_emails: boolean;
  store_name: string;
  store_email: string;
  store_phone: string;
  order_notification_emails: string[];
  shipping_origin_address: {
    company: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
}

export default function AdminSettingsPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/v1/admin/site_settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings(response.data);
    } catch (err: any) {
      console.error('Failed to load settings:', err);
      toast.error('Failed to load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTestMode = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      const token = await getToken();
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/admin/site_settings`,
        {
          site_setting: {
            payment_test_mode: !settings.payment_test_mode
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSettings(response.data);
      const message = settings.payment_test_mode 
        ? 'Production mode enabled - Real payments will be processed' 
        : 'Test mode enabled - Payments will be simulated';
      
      toast.success(message, { 
        duration: 4000,
      });
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      toast.error(err.response?.data?.error || 'Failed to update payment mode');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCustomerEmails = async () => {
    if (!settings) return;

    try {
      setSaving(true);

      const token = await getToken();
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/admin/settings`,
        {
          settings: {
            send_customer_emails: !settings.send_customer_emails
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSettings({ ...settings, ...response.data.settings });
      const message = settings.send_customer_emails 
        ? 'Customer emails disabled - No confirmation emails will be sent' 
        : 'Customer emails enabled - Customers will receive order confirmations';
      
      toast.success(message, { 
        duration: 4000,
      });
    } catch (err: any) {
      console.error('Failed to toggle customer emails:', err);
      toast.error('Failed to update setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStoreInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      setSaving(true);

      const token = await getToken();
      const response = await axios.put(
        `${API_BASE_URL}/api/v1/admin/site_settings`,
        {
          site_setting: {
            store_name: settings.store_name,
            store_email: settings.store_email,
            store_phone: settings.store_phone,
            shipping_origin_address: settings.shipping_origin_address
          }
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSettings(response.data);
      toast.success('Store information updated successfully!', { 
        duration: 3000,
      });
    } catch (err: any) {
      console.error('Failed to update settings:', err);
      const errorMsg = err.response?.data?.errors?.join(', ') || err.response?.data?.error || 'Failed to update store information';
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<SiteSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, ...updates });
  };

  const updateShippingAddress = (updates: Partial<SiteSettings['shipping_origin_address']>) => {
    if (!settings) return;
    setSettings({
      ...settings,
      shipping_origin_address: {
        ...settings.shipping_origin_address,
        ...updates
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load settings</p>
          <button
            onClick={fetchSettings}
            className="bg-hafalohaRed text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin')}
            className="text-hafalohaRed hover:underline mb-4 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Admin Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600 mt-2">Manage global settings for your Hafaloha store</p>
        </div>

        {/* Payment Settings Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Settings</h2>

          {/* Test Mode Toggle */}
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-grow">
                <h3 className="font-medium text-gray-900">Payment Test Mode</h3>
                <p className="text-sm text-gray-600 mt-1">
                  When enabled, all payments are simulated without charging customers.
                  Turn this off to process real payments via Stripe.
                </p>
              </div>
              <button
                onClick={handleToggleTestMode}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-hafalohaRed focus:ring-offset-2 ml-4 ${
                  settings.payment_test_mode ? 'bg-hafalohaRed' : 'bg-gray-200'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.payment_test_mode ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                {settings.payment_test_mode ? (
                  <>
                    <span className="text-2xl mr-2">⚙️</span>
                    <div>
                      <p className="font-medium text-gray-900">Test Mode Active</p>
                      <p className="text-sm text-gray-600">
                        Orders will be created but no actual charges will be made.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-2xl mr-2">💳</span>
                    <div>
                      <p className="font-medium text-gray-900">Production Mode Active</p>
                      <p className="text-sm text-gray-600">
                        Real payments will be processed via Stripe.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Customer Emails Toggle */}
          <div className="border-b border-gray-200 pb-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex-grow">
                <h3 className="font-medium text-gray-900">Customer Confirmation Emails</h3>
                <p className="text-sm text-gray-600 mt-1">
                  When enabled, customers will receive order confirmation emails after purchase.
                  Disable this during development to avoid email errors.
                </p>
              </div>
              <button
                onClick={handleToggleCustomerEmails}
                disabled={saving}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-hafalohaRed focus:ring-offset-2 ml-4 ${
                  settings.send_customer_emails ? 'bg-green-500' : 'bg-gray-200'
                } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <span
                  className={`inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.send_customer_emails ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                {settings.send_customer_emails ? (
                  <>
                    <span className="text-2xl mr-2">✉️</span>
                    <div>
                      <p className="font-medium text-gray-900">Customer Emails Enabled</p>
                      <p className="text-sm text-gray-600">
                        Customers will receive order confirmations via email.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-2xl mr-2">🔕</span>
                    <div>
                      <p className="font-medium text-gray-900">Customer Emails Disabled</p>
                      <p className="text-sm text-gray-600">
                        No confirmation emails will be sent to customers.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Payment Processor */}
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Payment Processor</h3>
            <div className="flex items-center">
              <img
                src="https://stripe.com/img/v3/home/social.png"
                alt="Stripe"
                className="h-8 w-auto mr-3"
              />
              <span className="text-gray-700 font-medium">Stripe</span>
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Store Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Store Information</h2>

          <form onSubmit={handleSaveStoreInfo} className="space-y-6">
            {/* Store Name */}
            <div>
              <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 mb-2">
                Store Name
              </label>
              <input
                type="text"
                id="store_name"
                value={settings.store_name}
                onChange={(e) => updateSettings({ store_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                required
              />
            </div>

            {/* Store Email */}
            <div>
              <label htmlFor="store_email" className="block text-sm font-medium text-gray-700 mb-2">
                Store Email
              </label>
              <input
                type="email"
                id="store_email"
                value={settings.store_email}
                onChange={(e) => updateSettings({ store_email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Used for order notifications and customer communications
              </p>
            </div>

            {/* Store Phone */}
            <div>
              <label htmlFor="store_phone" className="block text-sm font-medium text-gray-700 mb-2">
                Store Phone
              </label>
              <input
                type="tel"
                id="store_phone"
                value={settings.store_phone}
                onChange={(e) => updateSettings({ store_phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                required
              />
            </div>

            {/* Shipping Origin Address */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Origin Address</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company Name
                  </label>
                  <input
                    type="text"
                    id="company"
                    value={settings.shipping_origin_address.company}
                    onChange={(e) => updateShippingAddress({ company: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="street1" className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  <input
                    type="text"
                    id="street1"
                    value={settings.shipping_origin_address.street1}
                    onChange={(e) => updateShippingAddress({ street1: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="street2" className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address Line 2 (Optional)
                  </label>
                  <input
                    type="text"
                    id="street2"
                    value={settings.shipping_origin_address.street2 || ''}
                    onChange={(e) => updateShippingAddress({ street2: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={settings.shipping_origin_address.city}
                      onChange={(e) => updateShippingAddress({ city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      id="state"
                      value={settings.shipping_origin_address.state}
                      onChange={(e) => updateShippingAddress({ state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      id="zip"
                      value={settings.shipping_origin_address.zip}
                      onChange={(e) => updateShippingAddress({ zip: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      id="country"
                      value={settings.shipping_origin_address.country}
                      onChange={(e) => updateShippingAddress({ country: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address_phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Phone
                  </label>
                  <input
                    type="tel"
                    id="address_phone"
                    value={settings.shipping_origin_address.phone}
                    onChange={(e) => updateShippingAddress({ phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className={`w-full bg-hafalohaRed text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition ${
                  saving ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {saving ? 'Saving...' : 'Save Store Information'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

