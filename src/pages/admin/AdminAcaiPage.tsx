import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Save, Plus, Trash2, Edit2, X } from 'lucide-react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface AcaiSettings {
  id: number;
  name: string;
  description: string;
  base_price_cents: number;
  formatted_price: string;
  image_url: string | null;
  pickup_location: string;
  pickup_instructions: string | null;
  pickup_phone: string;
  advance_hours: number;
  max_per_slot: number;
  active: boolean;
  placard_enabled: boolean;
  placard_price_cents: number;
  toppings_info: string | null;
}

interface CrustOption {
  id: number;
  name: string;
  description: string | null;
  price_cents: number;
  available: boolean;
  position: number;
}

interface PlacardOption {
  id: number;
  name: string;
  description: string | null;
  price_cents: number;
  available: boolean;
  position: number;
}

interface PickupWindow {
  id: number;
  day_of_week: number;
  day_name: string;
  start_time: string;
  end_time: string;
  capacity: number;
  active: boolean;
  display_name: string;
}

interface BlockedSlot {
  id: number;
  blocked_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  display_name: string;
}

type TabType = 'settings' | 'crust' | 'placards' | 'windows' | 'blocked';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Generate 30-minute time slots from 6:00 AM to 11:30 PM
const TIME_OPTIONS = Array.from({ length: 36 }, (_, i) => {
  const hour = Math.floor(i / 2) + 6; // Start at 6 AM
  const minute = (i % 2) * 30;
  const value = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const label = `${hour12}:${minute.toString().padStart(2, '0')} ${ampm}`;
  return { value, label };
});

export default function AdminAcaiPage() {
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('settings');
  const [loading, setLoading] = useState(true);

  // Settings state
  const [settings, setSettings] = useState<AcaiSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  // Crust options state
  const [crustOptions, setCrustOptions] = useState<CrustOption[]>([]);
  const [editingCrust, setEditingCrust] = useState<CrustOption | null>(null);
  const [showCrustModal, setShowCrustModal] = useState(false);

  // Placard options state
  const [placardOptions, setPlacardOptions] = useState<PlacardOption[]>([]);
  const [editingPlacard, setEditingPlacard] = useState<PlacardOption | null>(null);
  const [showPlacardModal, setShowPlacardModal] = useState(false);

  // Pickup windows state
  const [pickupWindows, setPickupWindows] = useState<PickupWindow[]>([]);
  const [editingWindow, setEditingWindow] = useState<PickupWindow | null>(null);
  const [showWindowModal, setShowWindowModal] = useState(false);

  // Blocked slots state
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [editingBlocked, setEditingBlocked] = useState<BlockedSlot | null>(null);
  const [showBlockedModal, setShowBlockedModal] = useState(false);
  const crustModalContentRef = useRef<HTMLDivElement | null>(null);
  const placardModalContentRef = useRef<HTMLDivElement | null>(null);
  const windowModalContentRef = useRef<HTMLDivElement | null>(null);
  const blockedModalContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [settingsRes, crustRes, placardRes, windowsRes, blockedRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/v1/admin/acai/settings`, { headers }),
        axios.get(`${API_BASE_URL}/api/v1/admin/acai/crust_options`, { headers }),
        axios.get(`${API_BASE_URL}/api/v1/admin/acai/placard_options`, { headers }),
        axios.get(`${API_BASE_URL}/api/v1/admin/acai/pickup_windows`, { headers }),
        axios.get(`${API_BASE_URL}/api/v1/admin/acai/blocked_slots`, { headers }),
      ]);

      setSettings(settingsRes.data.data);
      setCrustOptions(crustRes.data.data || []);
      setPlacardOptions(placardRes.data.data || []);
      setPickupWindows(windowsRes.data.data || []);
      setBlockedSlots(blockedRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch Acai data:', err);
      toast.error('Failed to load Acai settings');
    } finally {
      setLoading(false);
    }
  };

  // Settings handlers
  const handleSettingsChange = (field: keyof AcaiSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [field]: value });
  };

  const saveSettings = async () => {
    if (!settings) return;
    
    setSavingSettings(true);
    try {
      const token = await getToken();
      await axios.put(
        `${API_BASE_URL}/api/v1/admin/acai/settings`,
        { settings },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Settings saved!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      toast.error('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  // Crust option handlers
  const saveCrustOption = async () => {
    if (!editingCrust) return;
    
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      if (editingCrust.id) {
        await axios.put(
          `${API_BASE_URL}/api/v1/admin/acai/crust_options/${editingCrust.id}`,
          { crust_option: editingCrust },
          { headers }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/api/v1/admin/acai/crust_options`,
          { crust_option: editingCrust },
          { headers }
        );
      }
      
      toast.success('Crust option saved!');
      setShowCrustModal(false);
      setEditingCrust(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save crust option:', err);
      toast.error('Failed to save crust option');
    }
  };

  const deleteCrustOption = async (id: number) => {
    if (!confirm('Delete this crust option?')) return;
    
    try {
      const token = await getToken();
      await axios.delete(
        `${API_BASE_URL}/api/v1/admin/acai/crust_options/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Crust option deleted');
      fetchData();
    } catch (err) {
      console.error('Failed to delete crust option:', err);
      toast.error('Failed to delete crust option');
    }
  };

  // Placard option handlers
  const savePlacardOption = async () => {
    if (!editingPlacard) return;
    
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      if (editingPlacard.id) {
        await axios.put(
          `${API_BASE_URL}/api/v1/admin/acai/placard_options/${editingPlacard.id}`,
          { placard_option: editingPlacard },
          { headers }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/api/v1/admin/acai/placard_options`,
          { placard_option: editingPlacard },
          { headers }
        );
      }
      
      toast.success('Placard option saved!');
      setShowPlacardModal(false);
      setEditingPlacard(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save placard option:', err);
      toast.error('Failed to save placard option');
    }
  };

  const deletePlacardOption = async (id: number) => {
    if (!confirm('Delete this placard option?')) return;
    
    try {
      const token = await getToken();
      await axios.delete(
        `${API_BASE_URL}/api/v1/admin/acai/placard_options/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Placard option deleted');
      fetchData();
    } catch (err) {
      console.error('Failed to delete placard option:', err);
      toast.error('Failed to delete placard option');
    }
  };

  // Pickup window handlers
  const savePickupWindow = async () => {
    if (!editingWindow) return;
    
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      if (editingWindow.id) {
        await axios.put(
          `${API_BASE_URL}/api/v1/admin/acai/pickup_windows/${editingWindow.id}`,
          { pickup_window: editingWindow },
          { headers }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/api/v1/admin/acai/pickup_windows`,
          { pickup_window: editingWindow },
          { headers }
        );
      }
      
      toast.success('Pickup window saved!');
      setShowWindowModal(false);
      setEditingWindow(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save pickup window:', err);
      toast.error('Failed to save pickup window');
    }
  };

  const deletePickupWindow = async (id: number) => {
    if (!confirm('Delete this pickup window?')) return;
    
    try {
      const token = await getToken();
      await axios.delete(
        `${API_BASE_URL}/api/v1/admin/acai/pickup_windows/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Pickup window deleted');
      fetchData();
    } catch (err) {
      console.error('Failed to delete pickup window:', err);
      toast.error('Failed to delete pickup window');
    }
  };

  // Blocked slot handlers
  const saveBlockedSlot = async () => {
    if (!editingBlocked) return;
    
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      if (editingBlocked.id) {
        await axios.put(
          `${API_BASE_URL}/api/v1/admin/acai/blocked_slots/${editingBlocked.id}`,
          { blocked_slot: editingBlocked },
          { headers }
        );
      } else {
        await axios.post(
          `${API_BASE_URL}/api/v1/admin/acai/blocked_slots`,
          { blocked_slot: editingBlocked },
          { headers }
        );
      }
      
      toast.success('Blocked date saved!');
      setShowBlockedModal(false);
      setEditingBlocked(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save blocked date:', err);
      toast.error('Failed to save blocked date');
    }
  };

  const deleteBlockedSlot = async (id: number) => {
    if (!confirm('Delete this blocked date?')) return;
    
    try {
      const token = await getToken();
      await axios.delete(
        `${API_BASE_URL}/api/v1/admin/acai/blocked_slots/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Blocked date deleted');
      fetchData();
    } catch (err) {
      console.error('Failed to delete blocked date:', err);
      toast.error('Failed to delete blocked date');
    }
  };

  useLockBodyScroll(showCrustModal || showPlacardModal || showWindowModal || showBlockedModal);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Acai Cakes Management</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4 overflow-x-auto">
          {[
            { id: 'settings', label: 'Settings' },
            { id: 'crust', label: 'Crust Options' },
            { id: 'placards', label: 'Placard Options' },
            { id: 'windows', label: 'Pickup Windows' },
            { id: 'blocked', label: 'Blocked Dates' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-3 px-4 border-b-2 font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-hafalohaRed text-hafalohaRed'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && settings && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">General Settings</h2>
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.active}
                onChange={(e) => handleSettingsChange('active', e.target.checked)}
                className="w-5 h-5 text-hafalohaRed border-gray-300 rounded focus:ring-hafalohaRed"
              />
              <span className="ml-2 font-medium text-gray-700">
                {settings.active ? 'Ordering Enabled' : 'Ordering Disabled'}
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => handleSettingsChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={(settings.base_price_cents / 100).toFixed(2)}
                onChange={(e) => handleSettingsChange('base_price_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={settings.description || ''}
                onChange={(e) => handleSettingsChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <input
                type="text"
                value={settings.pickup_location || ''}
                onChange={(e) => handleSettingsChange('pickup_location', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Phone</label>
              <input
                type="tel"
                value={settings.pickup_phone || ''}
                onChange={(e) => handleSettingsChange('pickup_phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Advance Notice (hours)</label>
              <input
                type="number"
                value={settings.advance_hours}
                onChange={(e) => handleSettingsChange('advance_hours', parseInt(e.target.value) || 24)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Customers must order this many hours in advance</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Orders Per Slot</label>
              <input
                type="number"
                value={settings.max_per_slot}
                onChange={(e) => handleSettingsChange('max_per_slot', parseInt(e.target.value) || 5)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="placard_enabled"
                checked={settings.placard_enabled}
                onChange={(e) => handleSettingsChange('placard_enabled', e.target.checked)}
                className="w-5 h-5 text-hafalohaRed border-gray-300 rounded focus:ring-hafalohaRed"
              />
              <label htmlFor="placard_enabled" className="ml-2 text-sm font-medium text-gray-700">
                Enable Message Placards
              </label>
            </div>
          </div>

          <div className="pt-4 border-t">
            <button
              onClick={saveSettings}
              disabled={savingSettings}
              className="bg-hafalohaRed text-white px-6 py-2 rounded-lg hover:bg-red-700 transition flex items-center disabled:opacity-50"
            >
              <Save className="w-5 h-5 mr-2" />
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Crust Options Tab */}
      {activeTab === 'crust' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Crust/Base Options</h2>
            <button
              onClick={() => {
                setEditingCrust({ id: 0, name: '', description: '', price_cents: 0, available: true, position: crustOptions.length });
                setShowCrustModal(true);
              }}
              className="bg-hafalohaRed text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Option
            </button>
          </div>

          <div className="divide-y">
            {crustOptions.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">No crust options yet. Add one above!</p>
            ) : (
              crustOptions.map((crust) => (
                <div key={crust.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{crust.name}</div>
                    {crust.description && <div className="text-sm text-gray-500">{crust.description}</div>}
                    <div className="text-sm text-gray-600 mt-1">
                      {crust.price_cents > 0 ? `+$${(crust.price_cents / 100).toFixed(2)}` : 'Included'}
                      {!crust.available && <span className="ml-2 text-red-500">(Unavailable)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingCrust(crust);
                        setShowCrustModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteCrustOption(crust.id)}
                      className="btn-icon text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Placard Options Tab */}
      {activeTab === 'placards' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Placard Options</h2>
              <p className="text-sm text-gray-500 mt-1">Message placard options for customers to choose from</p>
            </div>
            <button
              onClick={() => {
                setEditingPlacard({ id: 0, name: '', description: '', price_cents: 0, available: true, position: placardOptions.length });
                setShowPlacardModal(true);
              }}
              className="bg-hafalohaRed text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Placard
            </button>
          </div>

          <div className="divide-y">
            {placardOptions.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">No placard options yet. Add one above!</p>
            ) : (
              placardOptions.map((placard) => (
                <div key={placard.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{placard.name}</div>
                    {placard.description && <div className="text-sm text-gray-500">{placard.description}</div>}
                    <div className="text-sm text-gray-600 mt-1">
                      {placard.price_cents > 0 ? `+$${(placard.price_cents / 100).toFixed(2)}` : 'Included'}
                      {!placard.available && <span className="ml-2 text-red-500">(Unavailable)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingPlacard(placard);
                        setShowPlacardModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deletePlacardOption(placard.id)}
                      className="btn-icon text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Pickup Windows Tab */}
      {activeTab === 'windows' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-lg font-semibold">Pickup Windows</h2>
            <button
              onClick={() => {
                setEditingWindow({ id: 0, day_of_week: 6, day_name: 'Saturday', start_time: '13:30', end_time: '15:30', capacity: 5, active: true, display_name: '' });
                setShowWindowModal(true);
              }}
              className="bg-hafalohaRed text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Add Window
            </button>
          </div>

          <div className="divide-y">
            {pickupWindows.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">No pickup windows yet. Add one above!</p>
            ) : (
              pickupWindows.map((window) => (
                <div key={window.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{window.display_name}</div>
                    <div className="text-sm text-gray-500">
                      Max {window.capacity} orders per slot
                      {!window.active && <span className="ml-2 text-red-500">(Inactive)</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingWindow(window);
                        setShowWindowModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deletePickupWindow(window.id)}
                      className="btn-icon text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Blocked Dates Tab */}
      {activeTab === 'blocked' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Blocked Dates</h2>
              <p className="text-sm text-gray-500 mt-1">Block specific dates or times when orders cannot be placed</p>
            </div>
            <button
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setEditingBlocked({ 
                  id: 0, 
                  blocked_date: tomorrow.toISOString().split('T')[0], 
                  start_time: '00:00', 
                  end_time: '23:59', 
                  reason: '', 
                  display_name: '' 
                });
                setShowBlockedModal(true);
              }}
              className="bg-hafalohaRed text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              Block Date
            </button>
          </div>

          <div className="divide-y">
            {blockedSlots.length === 0 ? (
              <p className="p-6 text-gray-500 text-center">No blocked dates. All configured pickup windows are available.</p>
            ) : (
              blockedSlots.map((slot) => (
                <div key={slot.id} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {new Date(slot.blocked_date + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        month: 'long', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {slot.start_time === '00:00' && slot.end_time === '23:59' 
                        ? 'Full day blocked' 
                        : `${slot.start_time} - ${slot.end_time}`}
                      {slot.reason && <span className="ml-2">- {slot.reason}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingBlocked(slot);
                        setShowBlockedModal(true);
                      }}
                      className="p-2 text-gray-500 hover:text-gray-700"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => deleteBlockedSlot(slot.id)}
                      className="btn-icon text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Crust Option Modal */}
      {showCrustModal && editingCrust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCrustModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[85vh] flex flex-col min-h-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-lg font-semibold">{editingCrust.id ? 'Edit' : 'Add'} Crust Option</h3>
              <button onClick={() => setShowCrustModal(false)} className="btn-icon text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div
              ref={crustModalContentRef}
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 overscroll-contain"
              onWheel={(event) => {
                if (crustModalContentRef.current) {
                  crustModalContentRef.current.scrollTop += event.deltaY;
                }
                event.stopPropagation();
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={editingCrust.name}
                  onChange={(e) => setEditingCrust({ ...editingCrust, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="e.g., Peanut Butter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editingCrust.description || ''}
                  onChange={(e) => setEditingCrust({ ...editingCrust, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={(editingCrust.price_cents / 100).toFixed(2)}
                  onChange={(e) => setEditingCrust({ ...editingCrust, price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Use 0 for "included" options</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="crust_available"
                  checked={editingCrust.available}
                  onChange={(e) => setEditingCrust({ ...editingCrust, available: e.target.checked })}
                  className="w-5 h-5 text-hafalohaRed border-gray-300 rounded focus:ring-hafalohaRed"
                />
                <label htmlFor="crust_available" className="ml-2 text-sm font-medium text-gray-700">
                  Available for ordering
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
              <button
                onClick={() => setShowCrustModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveCrustOption}
                className="px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Placard Option Modal */}
      {showPlacardModal && editingPlacard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPlacardModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[85vh] flex flex-col min-h-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-lg font-semibold">{editingPlacard.id ? 'Edit' : 'Add'} Placard Option</h3>
              <button onClick={() => setShowPlacardModal(false)} className="btn-icon text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div
              ref={placardModalContentRef}
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 overscroll-contain"
              onWheel={(event) => {
                if (placardModalContentRef.current) {
                  placardModalContentRef.current.scrollTop += event.deltaY;
                }
                event.stopPropagation();
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={editingPlacard.name}
                  onChange={(e) => setEditingPlacard({ ...editingPlacard, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="e.g., Happy Birthday"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={editingPlacard.description || ''}
                  onChange={(e) => setEditingPlacard({ ...editingPlacard, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="Optional description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={(editingPlacard.price_cents / 100).toFixed(2)}
                  onChange={(e) => setEditingPlacard({ ...editingPlacard, price_cents: Math.round(parseFloat(e.target.value || '0') * 100) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Use 0 for "included" options</p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="placard_available"
                  checked={editingPlacard.available}
                  onChange={(e) => setEditingPlacard({ ...editingPlacard, available: e.target.checked })}
                  className="w-5 h-5 text-hafalohaRed border-gray-300 rounded focus:ring-hafalohaRed"
                />
                <label htmlFor="placard_available" className="ml-2 text-sm font-medium text-gray-700">
                  Available for ordering
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
              <button
                onClick={() => setShowPlacardModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={savePlacardOption}
                className="px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pickup Window Modal */}
      {showWindowModal && editingWindow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowWindowModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[85vh] flex flex-col min-h-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-lg font-semibold">{editingWindow.id ? 'Edit' : 'Add'} Pickup Window</h3>
              <button onClick={() => setShowWindowModal(false)} className="btn-icon text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div
              ref={windowModalContentRef}
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 overscroll-contain"
              onWheel={(event) => {
                if (windowModalContentRef.current) {
                  windowModalContentRef.current.scrollTop += event.deltaY;
                }
                event.stopPropagation();
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week *</label>
                <select
                  value={editingWindow.day_of_week}
                  onChange={(e) => setEditingWindow({ ...editingWindow, day_of_week: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                >
                  {DAYS.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                  <select
                    value={editingWindow.start_time}
                    onChange={(e) => setEditingWindow({ ...editingWindow, start_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  >
                    {TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                  <select
                    value={editingWindow.end_time}
                    onChange={(e) => setEditingWindow({ ...editingWindow, end_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  >
                    {TIME_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Orders Per Slot</label>
                <input
                  type="number"
                  value={editingWindow.capacity}
                  onChange={(e) => setEditingWindow({ ...editingWindow, capacity: parseInt(e.target.value) || 5 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="window_active"
                  checked={editingWindow.active}
                  onChange={(e) => setEditingWindow({ ...editingWindow, active: e.target.checked })}
                  className="w-5 h-5 text-hafalohaRed border-gray-300 rounded focus:ring-hafalohaRed"
                />
                <label htmlFor="window_active" className="ml-2 text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
              <button
                onClick={() => setShowWindowModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={savePickupWindow}
                className="px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blocked Date Modal */}
      {showBlockedModal && editingBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowBlockedModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full max-h-[85vh] flex flex-col min-h-0" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 shrink-0">
              <h3 className="text-lg font-semibold">{editingBlocked.id ? 'Edit' : 'Block'} Date</h3>
              <button onClick={() => setShowBlockedModal(false)} className="btn-icon text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div
              ref={blockedModalContentRef}
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 overscroll-contain"
              onWheel={(event) => {
                if (blockedModalContentRef.current) {
                  blockedModalContentRef.current.scrollTop += event.deltaY;
                }
                event.stopPropagation();
              }}
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  value={editingBlocked.blocked_date}
                  onChange={(e) => setEditingBlocked({ ...editingBlocked, blocked_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                />
              </div>

              <div className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id="block_all_day"
                  checked={editingBlocked.start_time === '00:00' && editingBlocked.end_time === '23:59'}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setEditingBlocked({ ...editingBlocked, start_time: '00:00', end_time: '23:59' });
                    } else {
                      setEditingBlocked({ ...editingBlocked, start_time: '09:00', end_time: '17:00' });
                    }
                  }}
                  className="w-5 h-5 text-hafalohaRed border-gray-300 rounded focus:ring-hafalohaRed"
                />
                <label htmlFor="block_all_day" className="ml-2 text-sm font-medium text-gray-700">
                  Block entire day
                </label>
              </div>

              {!(editingBlocked.start_time === '00:00' && editingBlocked.end_time === '23:59') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                    <select
                      value={editingBlocked.start_time || '09:00'}
                      onChange={(e) => setEditingBlocked({ ...editingBlocked, start_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                    >
                      {TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                    <select
                      value={editingBlocked.end_time || '17:00'}
                      onChange={(e) => setEditingBlocked({ ...editingBlocked, end_time: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                    >
                      {TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <input
                  type="text"
                  value={editingBlocked.reason || ''}
                  onChange={(e) => setEditingBlocked({ ...editingBlocked, reason: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="e.g., Holiday, Fully booked"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 shrink-0">
              <button
                onClick={() => setShowBlockedModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveBlockedSlot}
                className="px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
