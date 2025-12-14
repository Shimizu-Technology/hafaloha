import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import api from '../../services/api';

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

const SECTION_TYPES = [
  { value: 'hero', label: 'Hero Banner', description: 'Main banner at top of homepage' },
  { value: 'category_card', label: 'Category Card', description: 'Shop by category cards' },
  { value: 'promo_banner', label: 'Promo Banner', description: 'Promotional announcement' },
  { value: 'text_block', label: 'Text Block', description: 'Text content section' },
];

export default function AdminHomepagePage() {
  const { getToken } = useAuth();
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);

  const fetchSections = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await api.get('/admin/homepage_sections', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSections(response.data.sections);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch sections:', err);
      setError('Failed to load homepage sections');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  const handleSave = async (section: Partial<HomepageSection>) => {
    try {
      setSaving(true);
      const token = await getToken();
      
      if (section.id) {
        // Update existing
        await api.put(`/admin/homepage_sections/${section.id}`, { section }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Create new
        await api.post('/admin/homepage_sections', { section }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      await fetchSections();
      setEditingSection(null);
      setShowNewForm(false);
    } catch (err) {
      console.error('Failed to save section:', err);
      setError('Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    
    try {
      const token = await getToken();
      await api.delete(`/admin/homepage_sections/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchSections();
    } catch (err) {
      console.error('Failed to delete section:', err);
      setError('Failed to delete section');
    }
  };

  const handleToggleActive = async (section: HomepageSection) => {
    await handleSave({ ...section, active: !section.active });
  };

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Homepage Management</h1>
          <p className="text-gray-600">Customize your homepage sections and content</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition"
        >
          + Add Section
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* New Section Form */}
      {showNewForm && (
        <SectionForm
          onSave={handleSave}
          onCancel={() => setShowNewForm(false)}
          saving={saving}
        />
      )}

      {/* Edit Section Form */}
      {editingSection && (
        <SectionForm
          section={editingSection}
          onSave={handleSave}
          onCancel={() => setEditingSection(null)}
          saving={saving}
        />
      )}

      {/* Sections by Type */}
      {sections.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-500 mb-4">No homepage sections yet. Add your first section to customize the homepage.</p>
          <button
            onClick={() => setShowNewForm(true)}
            className="px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition"
          >
            Add First Section
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSections).map(([type, typeSections]) => (
            <div key={type} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900 capitalize">
                  {type.replace('_', ' ')} Sections
                </h2>
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
                        <h3 className="font-medium text-gray-900 truncate">
                          {section.title || 'Untitled Section'}
                        </h3>
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
                        onClick={() => handleToggleActive(section)}
                        className={`px-3 py-1 text-sm rounded ${
                          section.active 
                            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                            : 'bg-green-100 text-green-600 hover:bg-green-200'
                        }`}
                      >
                        {section.active ? 'Hide' : 'Show'}
                      </button>
                      <button
                        onClick={() => setEditingSection(section)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(section.id)}
                        className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded hover:bg-red-200"
                      >
                        Delete
                      </button>
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

// Section Form Component
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
      <h2 className="text-xl font-bold mb-4">
        {section ? 'Edit Section' : 'New Section'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Section Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Section Type
          </label>
          <select
            value={formData.section_type}
            onChange={(e) => setFormData({ ...formData, section_type: e.target.value })}
            disabled={!!section}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent disabled:bg-gray-100"
          >
            {SECTION_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} - {type.description}
              </option>
            ))}
          </select>
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

        {/* Image URLs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              placeholder="https://..."
            />
            {formData.image_url && (
              <img src={formData.image_url} alt="" className="mt-2 h-20 rounded object-cover" />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Background Image URL (for Hero)
            </label>
            <input
              type="url"
              value={formData.background_image_url || ''}
              onChange={(e) => setFormData({ ...formData, background_image_url: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
              placeholder="https://..."
            />
            {formData.background_image_url && (
              <img src={formData.background_image_url} alt="" className="mt-2 h-20 rounded object-cover" />
            )}
          </div>
        </div>

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

        {/* Position */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Position (lower = appears first)
          </label>
          <input
            type="number"
            value={formData.position || 0}
            onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) })}
            className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
            min="0"
          />
        </div>

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

