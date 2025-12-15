import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import api from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ============================================================================
// TYPES
// ============================================================================

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

interface HomepageSection {
  id: number;
  section_type: string;
  position: number;
  title: string | null;
  subtitle: string | null;
  button_text: string | null;
  button_link: string | null;
  image_url: string | null;
  background_image_url: string | null;
  settings: Record<string, unknown>;
  active: boolean;
}

type TabType = 'general' | 'homepage';

const TABS: { id: TabType; label: string; icon: string }[] = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'homepage', label: 'Homepage', icon: '🏠' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function AdminSettingsPage() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get active tab from URL or default to 'general'
  const activeTab = (searchParams.get('tab') as TabType) || 'general';
  
  // General settings state
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Homepage sections state
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(false);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  // Fetch general settings
  useEffect(() => {
    fetchSettings();
  }, []);

  // Fetch homepage sections when tab changes
  useEffect(() => {
    if (activeTab === 'homepage') {
      fetchSections();
    }
  }, [activeTab]);

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

  const fetchSections = useCallback(async () => {
    try {
      setSectionsLoading(true);
      const token = await getToken();
      const response = await api.get('/admin/homepage_sections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSections(response.data.sections);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
      toast.error('Failed to load homepage sections');
    } finally {
      setSectionsLoading(false);
    }
  }, [getToken]);

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ tab });
  };

  // ============================================================================
  // GENERAL SETTINGS HANDLERS
  // ============================================================================

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
      
      toast.success(message, { duration: 4000 });
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
      
      toast.success(message, { duration: 4000 });
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
      toast.success('Store information updated successfully!', { duration: 3000 });
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

  // ============================================================================
  // HOMEPAGE SECTION HANDLERS
  // ============================================================================

  const handleSaveSection = async (section: Partial<HomepageSection>) => {
    try {
      setSaving(true);
      const token = await getToken();
      
      if (section.id) {
        await api.put(`/admin/homepage_sections/${section.id}`, { section }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Section updated!');
      } else {
        await api.post('/admin/homepage_sections', { section }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Section created!');
      }
      
      await fetchSections();
      setEditingSection(null);
      setShowNewForm(false);
    } catch (err) {
      console.error('Failed to save section:', err);
      toast.error('Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    
    try {
      const token = await getToken();
      await api.delete(`/admin/homepage_sections/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Section deleted');
      await fetchSections();
    } catch (err) {
      console.error('Failed to delete section:', err);
      toast.error('Failed to delete section');
    }
  };

  const handleToggleSectionActive = async (section: HomepageSection) => {
    await handleSaveSection({ ...section, active: !section.active });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
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

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === tab.id
                    ? 'border-hafalohaRed text-hafalohaRed'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && (
          <GeneralSettingsTab
            settings={settings}
            saving={saving}
            onToggleTestMode={handleToggleTestMode}
            onToggleCustomerEmails={handleToggleCustomerEmails}
            onSaveStoreInfo={handleSaveStoreInfo}
            onUpdateSettings={updateSettings}
            onUpdateShippingAddress={updateShippingAddress}
          />
        )}

        {activeTab === 'homepage' && (
          <HomepageSettingsTab
            sections={sections}
            loading={sectionsLoading}
            saving={saving}
            editingSection={editingSection}
            showNewForm={showNewForm}
            onSetEditingSection={setEditingSection}
            onSetShowNewForm={setShowNewForm}
            onSaveSection={handleSaveSection}
            onDeleteSection={handleDeleteSection}
            onToggleSectionActive={handleToggleSectionActive}
            onRefresh={fetchSections}
          />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// GENERAL SETTINGS TAB
// ============================================================================

interface GeneralSettingsTabProps {
  settings: SiteSettings;
  saving: boolean;
  onToggleTestMode: () => void;
  onToggleCustomerEmails: () => void;
  onSaveStoreInfo: (e: React.FormEvent) => void;
  onUpdateSettings: (updates: Partial<SiteSettings>) => void;
  onUpdateShippingAddress: (updates: Partial<SiteSettings['shipping_origin_address']>) => void;
}

function GeneralSettingsTab({
  settings,
  saving,
  onToggleTestMode,
  onToggleCustomerEmails,
  onSaveStoreInfo,
  onUpdateSettings,
  onUpdateShippingAddress,
}: GeneralSettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Payment Settings Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
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
              onClick={onToggleTestMode}
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
              onClick={onToggleCustomerEmails}
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

        <form onSubmit={onSaveStoreInfo} className="space-y-6">
          {/* Store Name */}
          <div>
            <label htmlFor="store_name" className="block text-sm font-medium text-gray-700 mb-2">
              Store Name
            </label>
            <input
              type="text"
              id="store_name"
              value={settings.store_name}
              onChange={(e) => onUpdateSettings({ store_name: e.target.value })}
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
              onChange={(e) => onUpdateSettings({ store_email: e.target.value })}
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
              onChange={(e) => onUpdateSettings({ store_phone: e.target.value })}
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
                  onChange={(e) => onUpdateShippingAddress({ company: e.target.value })}
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
                  onChange={(e) => onUpdateShippingAddress({ street1: e.target.value })}
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
                  onChange={(e) => onUpdateShippingAddress({ street2: e.target.value })}
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
                    onChange={(e) => onUpdateShippingAddress({ city: e.target.value })}
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
                    onChange={(e) => onUpdateShippingAddress({ state: e.target.value })}
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
                    onChange={(e) => onUpdateShippingAddress({ zip: e.target.value })}
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
                    onChange={(e) => onUpdateShippingAddress({ country: e.target.value })}
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
                  onChange={(e) => onUpdateShippingAddress({ phone: e.target.value })}
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
  );
}

// ============================================================================
// HOMEPAGE SETTINGS TAB
// ============================================================================

// Phase 2: Section types will be used when Add Section is implemented
// const SECTION_TYPES = [
//   { value: 'hero', label: 'Hero Banner', description: 'Main banner at top of homepage' },
//   { value: 'category_card', label: 'Category Card', description: 'Shop by category cards' },
//   { value: 'promo_banner', label: 'Promo Banner', description: 'Promotional announcement' },
//   { value: 'text_block', label: 'Text Block', description: 'Text content section' },
// ];

interface HomepageSettingsTabProps {
  sections: HomepageSection[];
  loading: boolean;
  saving: boolean;
  editingSection: HomepageSection | null;
  showNewForm: boolean;
  onSetEditingSection: (section: HomepageSection | null) => void;
  onSetShowNewForm: (show: boolean) => void;
  onSaveSection: (section: Partial<HomepageSection>) => Promise<void>;
  onDeleteSection: (id: number) => Promise<void>;
  onToggleSectionActive: (section: HomepageSection) => Promise<void>;
  onRefresh: () => void;
}

function HomepageSettingsTab({
  sections,
  loading,
  saving,
  editingSection,
  showNewForm,
  onSetEditingSection,
  onSetShowNewForm,
  onSaveSection,
  onDeleteSection,
  onToggleSectionActive,
}: HomepageSettingsTabProps) {
  // Suppress unused variable warnings for Phase 2 functionality
  void onDeleteSection;
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-hafalohaRed"></div>
      </div>
    );
  }

  // Group sections by type
  const groupedSections = sections.reduce((acc, section) => {
    if (!acc[section.section_type]) {
      acc[section.section_type] = [];
    }
    acc[section.section_type].push(section);
    return acc;
  }, {} as Record<string, HomepageSection[]>);

  // Suppress unused variable warnings for Phase 2 functionality
  void showNewForm;
  void onSetShowNewForm;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Homepage Sections</h2>
        <p className="text-gray-600">Edit your homepage hero banner and category cards</p>
      </div>

      {/* Phase 2: Add Section functionality will go here */}

      {/* Edit Section Form */}
      {editingSection && (
        <SectionForm
          section={editingSection}
          onSave={onSaveSection}
          onCancel={() => onSetEditingSection(null)}
          saving={saving}
        />
      )}

      {/* Sections */}
      {sections.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500">No homepage sections configured yet. Run database seeds to set up the default hero and category cards.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSections).map(([type, typeSections]) => (
            <div key={type} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {type.replace('_', ' ')} Sections
                </h3>
              </div>
              <div className="divide-y">
                {typeSections.map((section) => (
                  <div key={section.id} className="p-6 flex items-start gap-4">
                    {/* Preview */}
                    {(section.image_url || section.background_image_url) && (
                      <div className="w-32 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img
                          src={section.image_url || section.background_image_url || ''}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900 truncate">
                          {section.title || 'Untitled Section'}
                        </h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          section.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {section.active ? 'Active' : 'Hidden'}
                        </span>
                      </div>
                      {section.subtitle && (
                        <p className="text-sm text-gray-600 truncate">{section.subtitle}</p>
                      )}
                      {section.button_link && (
                        <p className="text-xs text-gray-400 mt-1">Links to: {section.button_link}</p>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onToggleSectionActive(section)}
                        className={`px-3 py-1 text-sm rounded ${
                          section.active 
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {section.active ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => onSetEditingSection(section)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      {/* Phase 2: Delete button will be re-enabled when Add Section is implemented */}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="font-medium text-blue-900">Preview your homepage</p>
          <p className="text-sm text-blue-700">See how your changes look on the live site</p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          View Homepage
        </a>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION FORM COMPONENT
// ============================================================================

interface SectionFormProps {
  section?: HomepageSection;
  onSave: (section: Partial<HomepageSection>) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}

function SectionForm({ section, onSave, onCancel, saving }: SectionFormProps) {
  const [formData, setFormData] = useState<Partial<HomepageSection>>({
    section_type: section?.section_type || 'hero',
    title: section?.title || '',
    subtitle: section?.subtitle || '',
    button_text: section?.button_text || '',
    button_link: section?.button_link || '',
    image_url: section?.image_url || '',
    background_image_url: section?.background_image_url || '',
    position: section?.position || 0,
    active: section?.active ?? true,
    ...section,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">
        {section ? 'Edit Section' : 'New Section'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section Type - Read only display */}
        <div className="bg-gray-50 rounded-lg p-3">
          <span className="text-sm text-gray-500">Section Type: </span>
          <span className="font-medium text-gray-900">
            {formData.section_type === 'hero' ? '🖼️ Hero Banner' : 
             formData.section_type === 'category_card' ? '🏷️ Category Card' : 
             formData.section_type}
          </span>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
            placeholder="Enter section title"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtitle
          </label>
          <textarea
            value={formData.subtitle || ''}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
            placeholder="Enter subtitle or description"
          />
        </div>

        {/* Image - Show different field based on section type */}
        {formData.section_type === 'hero' ? (
          // Hero sections use background_image_url
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Image
            </label>
            <p className="text-xs text-gray-500 mb-2">
              The full-width image behind the hero text. Use a local path (e.g., /images/hero.webp) or an external URL.
            </p>
            <input
              type="text"
              value={formData.background_image_url || ''}
              onChange={(e) => setFormData({ ...formData, background_image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              placeholder="/images/hero-image.webp or https://..."
            />
            {formData.background_image_url && (
              <img src={formData.background_image_url} alt="" className="mt-2 h-24 rounded object-cover" />
            )}
            {/* Phase 2: Add S3 upload button here */}
          </div>
        ) : (
          // Category cards and other sections use image_url
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Card Image
            </label>
            <p className="text-xs text-gray-500 mb-2">
              The image shown on the card. Use a local path (e.g., /images/womens.webp) or an external URL.
            </p>
            <input
              type="text"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              placeholder="/images/category-image.webp or https://..."
            />
            {formData.image_url && (
              <img src={formData.image_url} alt="" className="mt-2 h-24 rounded object-cover" />
            )}
            {/* Phase 2: Add S3 upload button here */}
          </div>
        )}

        {/* Button */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Button Text
            </label>
            <input
              type="text"
              value={formData.button_text || ''}
              onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              placeholder="Shop Now"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Button Link
            </label>
            <input
              type="text"
              value={formData.button_link || ''}
              onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              placeholder="/products"
            />
          </div>
        </div>

        {/* Phase 2: Position field will be re-added when Add Section is implemented */}

        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active"
            checked={formData.active}
            onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
            className="w-4 h-4 text-hafalohaRed focus:ring-hafalohaRed border-gray-300 rounded"
          />
          <label htmlFor="active" className="text-sm text-gray-700">
            Active (visible on homepage)
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : section ? 'Save Changes' : 'Create Section'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
