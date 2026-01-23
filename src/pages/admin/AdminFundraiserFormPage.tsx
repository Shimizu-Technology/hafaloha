import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ArrowLeft, Save } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface FundraiserForm {
  name: string;
  slug: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  goal_amount_cents: string;
  image_url: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  pickup_location: string;
  pickup_instructions: string;
  allow_shipping: boolean;
  shipping_note: string;
  public_message: string;
  thank_you_message: string;
}

const defaultForm: FundraiserForm = {
  name: '',
  slug: '',
  description: '',
  status: 'draft',
  start_date: '',
  end_date: '',
  goal_amount_cents: '',
  image_url: '',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  pickup_location: '',
  pickup_instructions: '',
  allow_shipping: false,
  shipping_note: '',
  public_message: '',
  thank_you_message: '',
};

export default function AdminFundraiserFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const isEditing = Boolean(id);
  
  const [form, setForm] = useState<FundraiserForm>(defaultForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (isEditing && id) {
      loadFundraiser();
    }
  }, [id]);

  const loadFundraiser = async () => {
    try {
      const token = await getToken();
      const response = await api.get(`/api/v1/admin/fundraisers/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const f = response.data.fundraiser;
      setForm({
        name: f.name || '',
        slug: f.slug || '',
        description: f.description || '',
        status: f.status || 'draft',
        start_date: f.start_date || '',
        end_date: f.end_date || '',
        goal_amount_cents: f.goal_amount_cents ? (f.goal_amount_cents / 100).toString() : '',
        image_url: f.image_url || '',
        contact_name: f.contact_name || '',
        contact_email: f.contact_email || '',
        contact_phone: f.contact_phone || '',
        pickup_location: f.pickup_location || '',
        pickup_instructions: f.pickup_instructions || '',
        allow_shipping: f.allow_shipping || false,
        shipping_note: f.shipping_note || '',
        public_message: f.public_message || '',
        thank_you_message: f.thank_you_message || '',
      });
    } catch (error) {
      toast.error('Failed to load fundraiser');
      navigate('/admin/fundraisers');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors([]);

    try {
      const token = await getToken();
      const payload = {
        fundraiser: {
          name: form.name,
          slug: form.slug,
          description: form.description || null,
          status: form.status,
          start_date: form.start_date || null,
          end_date: form.end_date || null,
          goal_amount_cents: form.goal_amount_cents ? Math.round(parseFloat(form.goal_amount_cents) * 100) : null,
          image_url: form.image_url || null,
          contact_name: form.contact_name || null,
          contact_email: form.contact_email || null,
          contact_phone: form.contact_phone || null,
          pickup_location: form.pickup_location || null,
          pickup_instructions: form.pickup_instructions || null,
          allow_shipping: form.allow_shipping,
          shipping_note: form.shipping_note || null,
          public_message: form.public_message || null,
          thank_you_message: form.thank_you_message || null,
        }
      };

      if (isEditing) {
        await api.put(`/api/v1/admin/fundraisers/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Fundraiser updated');
      } else {
        const response = await api.post('/api/v1/admin/fundraisers', payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Fundraiser created');
        navigate(`/admin/fundraisers/${response.data.fundraiser.id}`);
        return;
      }
      
      navigate('/admin/fundraisers');
    } catch (error: any) {
      const errMessages = error.response?.data?.errors || ['Failed to save fundraiser'];
      setErrors(errMessages);
      toast.error(errMessages[0]);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-hafalohaRed border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/admin/fundraisers"
          className="p-2 hover:bg-gray-100 rounded-lg transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'Edit Fundraiser' : 'New Fundraiser'}
        </h1>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <ul className="list-disc list-inside text-red-600 text-sm">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
                placeholder="e.g., Soccer Team Spring Fundraiser"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
              <input
                type="text"
                required
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
                placeholder="soccer-team-spring"
              />
              <p className="text-xs text-gray-500 mt-1">
                Public URL: /fundraisers/{form.slug || 'your-slug'}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Goal Amount ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.goal_amount_cents}
                onChange={(e) => setForm({ ...form, goal_amount_cents: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
                placeholder="1000.00"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
              <input
                type="url"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
                placeholder="https://..."
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
                placeholder="Tell supporters about this fundraiser..."
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
              <input
                type="text"
                value={form.contact_name}
                onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
              />
            </div>
          </div>
        </div>

        {/* Pickup & Shipping */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Pickup & Shipping</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
              <input
                type="text"
                value={form.pickup_location}
                onChange={(e) => setForm({ ...form, pickup_location: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
                placeholder="e.g., Hafaloha Store, 123 Main St"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Instructions</label>
              <textarea
                value={form.pickup_instructions}
                onChange={(e) => setForm({ ...form, pickup_instructions: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
                placeholder="e.g., Available for pickup starting March 15th..."
              />
            </div>
            
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="allow_shipping"
                checked={form.allow_shipping}
                onChange={(e) => setForm({ ...form, allow_shipping: e.target.checked })}
                className="w-4 h-4 text-hafalohaRed rounded focus:ring-hafalohaRed"
              />
              <label htmlFor="allow_shipping" className="text-sm font-medium text-gray-700">
                Allow shipping (in addition to pickup)
              </label>
            </div>
            
            {form.allow_shipping && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Note</label>
                <input
                  type="text"
                  value={form.shipping_note}
                  onChange={(e) => setForm({ ...form, shipping_note: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
                  placeholder="e.g., Shipping rates calculated at checkout"
                />
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b pb-2">Messages</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Public Message</label>
              <textarea
                value={form.public_message}
                onChange={(e) => setForm({ ...form, public_message: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
                placeholder="Displayed on the public fundraiser page..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Thank You Message</label>
              <textarea
                value={form.thank_you_message}
                onChange={(e) => setForm({ ...form, thank_you_message: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-hafalohaRed"
                placeholder="Shown after order is placed..."
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Link
            to="/admin/fundraisers"
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Fundraiser')}
          </button>
        </div>
      </form>
    </div>
  );
}
