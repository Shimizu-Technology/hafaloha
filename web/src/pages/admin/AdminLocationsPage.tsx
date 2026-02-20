import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import {
  MapPin, Building2, Tent, Calendar, Plus, Power, Pencil, Trash2, X,
  QrCode, Clock, Package, Download, Copy, Check,
} from 'lucide-react';
import { API_BASE_URL } from '../../config';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Location {
  id: number;
  name: string;
  slug: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  location_type: string;
  active: boolean;
  hours_json: Record<string, string>;
  admin_email: string | null;
  admin_sms_phones: string[];
  starts_at: string | null;
  ends_at: string | null;
  auto_deactivate: boolean;
  menu_collection_id: number | null;
  menu_collection_name: string | null;
  product_count: number;

const EMPTY_FORM: LocationFormData = {
  name: '',
  slug: '',
  address: '',
  phone: '',
  description: '',
  location_type: 'permanent',
  active: true,
  hours_json: {},
  admin_email: '',
  admin_sms_phones: [],
  starts_at: null,
  ends_at: null,
  auto_deactivate: false,
  menu_collection_id: null,
  qr_code_url: null,
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<LocationFormData>({ ...EMPTY_FORM });
  const [hoursText, setHoursText] = useState('{}');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrLocation, setQrLocation] = useState<Location | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setHoursText('{}');
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (loc: Location) => {
    setEditingId(loc.id);
    setForm({
      name: loc.name,
      slug: loc.slug,
      address: loc.address || '',
      phone: loc.phone || '',
      description: loc.description || '',
      location_type: loc.location_type,
      active: loc.active,
      hours_json: loc.hours_json,
      admin_email: loc.admin_email || '',
      admin_sms_phones: loc.admin_sms_phones || [],
      starts_at: loc.starts_at,
      ends_at: loc.ends_at,
      auto_deactivate: loc.auto_deactivate,
      menu_collection_id: loc.menu_collection_id,
      qr_code_url: loc.qr_code_url,
    });
    setHoursText(JSON.stringify(loc.hours_json, null, 2));
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    let parsedHours: Record<string, string>;
    try {
      parsedHours = JSON.parse(hoursText);
    } catch {
      setError('Invalid JSON in hours field');
      setSaving(false);
      return;
    }

    const payload = { location: { ...form, hours_json: parsedHours } };
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      if (editingId) {
        await axios.patch(`${API_BASE_URL}/api/v1/admin/locations/${editingId}`, payload, { headers });
      } else {
        await axios.post(`${API_BASE_URL}/api/v1/admin/locations`, payload, { headers });
      }
      setModalOpen(false);
      fetchLocations();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { errors?: string[] } } };
      setError(axiosErr.response?.data?.errors?.join(', ') || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (loc: Location) => {
    try {
      const token = await getToken();
      await axios.post(`${API_BASE_URL}/api/v1/admin/locations/${loc.id}/toggle_active`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLocations();
    } catch {
      setError('Failed to toggle location');
    }
  };

  const handleDelete = async (loc: Location) => {
    if (!confirm(`Delete "${loc.name}"? This cannot be undone.`)) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_BASE_URL}/api/v1/admin/locations/${loc.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchLocations();
    } catch {
      setError('Failed to delete location');
    }
  };

=======
  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

>>>>>>> main
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-hafalohaRed" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="w-7 h-7 text-hafalohaRed" />
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <span className="bg-gray-100 text-gray-600 text-sm font-medium px-2.5 py-0.5 rounded-full">
            {locations.length}
          </span>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-hafalohaRed/90 transition font-medium text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Location
        </button>
      </div>

<<<<<<< HEAD
      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        {['all', 'permanent', 'popup', 'event'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition ${
              filterType === type
                ? 'bg-hafalohaRed text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

          return (
            <div
              key={loc.id}
              className={`bg-white rounded-xl shadow-sm border p-5 transition hover:shadow-md ${
                !loc.active ? 'opacity-60' : ''
              }`}
            >
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <TypeIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  <h3 className="font-semibold text-gray-900 truncate">{loc.name}</h3>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[loc.location_type]}`}
                  >
                    {loc.location_type}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      loc.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {loc.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Time-based status badge */}
              {status && (
                <div className="mb-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                    <Clock className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>
              )}

              {/* Details */}
              {/* Hours preview */}
              {Object.keys(loc.hours_json || {}).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-400 uppercase mb-1">Hours</p>
                  {Object.entries(loc.hours_json).slice(0, 3).map(([day, hours]) => (
                    <p key={day} className="text-xs text-gray-500">
                      <span className="font-medium">{day}:</span> {hours}
                    </p>
                  ))}
                  {Object.keys(loc.hours_json).length > 3 && (
                    <p className="text-xs text-gray-400">
                      +{Object.keys(loc.hours_json).length - 3} more
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEdit(loc)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  onClick={() => handleToggle(loc)}
                  className={`flex items-center gap-1 text-xs transition ${
                    loc.active ? 'text-amber-600 hover:text-amber-700' : 'text-green-600 hover:text-green-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  {loc.active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  onClick={() => setQrLocation(loc)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  QR
                </button>
                <button
          <div className="col-span-full text-center py-12 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No locations yet</p>
            <p className="text-sm mt-1">Add your first location to get started.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? 'Edit Location' : 'New Location'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setForm((f) => ({
                      ...f,
                      name,
                      ...(!editingId ? { slug: generateSlug(name) } : {}),
                    }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent text-sm"
                  placeholder="Location name"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent text-sm"
                  placeholder="location-slug"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={form.location_type}
                  onChange={(e) => setForm((f) => ({ ...f, location_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent text-sm"
                >
                  <option value="permanent">Permanent</option>
                  <option value="popup">Popup</option>
                  <option value="event">Event</option>
                </select>
              </div>

              {/* Address & Phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={form.address || ''}
                    onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={form.phone || ''}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent text-sm"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={form.description || ''}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent text-sm"
                />
              </div>

              {/* Admin Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                <input
                  type="email"
                  value={form.admin_email || ''}
                  onChange={(e) => setForm((f) => ({ ...f, admin_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent text-sm"
                />
              </div>

              {/* Menu Collection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Featured Menu Collection</label>
                <select
                  value={form.menu_collection_id ?? ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      menu_collection_id: e.target.value ? Number(e.target.value) : null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent text-sm"
                >
                  <option value="">None</option>
                  {collections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

    </div>
  );
}
