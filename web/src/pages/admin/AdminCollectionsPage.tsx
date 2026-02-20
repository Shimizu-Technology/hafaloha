import { useRef, useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, Package, Calendar, Star, Clock, Tag } from 'lucide-react';
import useLockBodyScroll from '../../hooks/useLockBodyScroll';
import { authDelete, authGet, authPatch, authPost } from '../../services/authApi';

const COLLECTION_TYPES = [
  { value: 'standard', label: 'Standard' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'event', label: 'Event' },
  { value: 'limited_time', label: 'Limited Time' },
];

interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  published: boolean;
  featured: boolean;
  sort_order: number;
  product_count: number;
  collection_type: string;
  starts_at: string | null;
  ends_at: string | null;
  is_featured: boolean;
  auto_hide: boolean;
  banner_text: string | null;
  active_now: boolean;
  expired: boolean;
  upcoming: boolean;
  created_at: string;
  updated_at: string;
}

interface CollectionsResponse {
  data: Collection[];
}

function formatDateForInput(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toISOString().slice(0, 16);
}

function collectionTypeIcon(type: string) {
  switch (type) {
    case 'seasonal': return <Calendar className="w-3.5 h-3.5" />;
    case 'event': return <Tag className="w-3.5 h-3.5" />;
    case 'limited_time': return <Clock className="w-3.5 h-3.5" />;
    default: return null;
  }
}

function collectionTypeBadge(type: string) {
  const colors: Record<string, string> = {
    standard: 'bg-gray-100 text-gray-700',
    seasonal: 'bg-green-100 text-green-700',
    event: 'bg-purple-100 text-purple-700',
    limited_time: 'bg-orange-100 text-orange-700',
  };
  const label = COLLECTION_TYPES.find(t => t.value === type)?.label || type;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${colors[type] || colors.standard}`}>
      {collectionTypeIcon(type)}
      {label}
    </span>
  );
}

export default function AdminCollectionsPage() {
  const { getToken } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const editModalContentRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    published: true,
    featured: false,
    sort_order: 0,
    collection_type: 'standard',
    starts_at: '',
    ends_at: '',
    is_featured: false,
    auto_hide: true,
    banner_text: '',
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      setLoading(true);
      const response = await authGet<CollectionsResponse>('/admin/collections', getToken);
      setCollections(response.data.data || []);
    } catch (err: unknown) {
      console.error('Failed to fetch collections:', err);
      toast.error('Failed to load collections');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (collection: Collection) => {
    setSelectedCollection(collection);
    setFormData({
      name: collection.name,
      description: collection.description || '',
      published: collection.published,
      featured: collection.featured,
      sort_order: collection.sort_order ?? 0,
      collection_type: collection.collection_type || 'standard',
      starts_at: formatDateForInput(collection.starts_at),
      ends_at: formatDateForInput(collection.ends_at),
      is_featured: collection.is_featured || false,
      auto_hide: collection.auto_hide ?? true,
      banner_text: collection.banner_text || '',
    });
    setShowEditModal(true);
  };

  const handleCreate = () => {
    setSelectedCollection(null);
    setFormData({
      name: '',
      description: '',
      published: true,
      featured: false,
      sort_order: 0,
      collection_type: 'standard',
      starts_at: '',
      ends_at: '',
      is_featured: false,
      auto_hide: true,
      banner_text: '',
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error('Collection name is required');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        collection: {
          name: formData.name,
          description: formData.description,
          published: formData.published,
          featured: formData.featured,
          sort_order: formData.sort_order,
          collection_type: formData.collection_type,
          starts_at: formData.starts_at || null,
          ends_at: formData.ends_at || null,
          is_featured: formData.is_featured,
          auto_hide: formData.auto_hide,
          banner_text: formData.banner_text || null,
          slug: formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        },
      };

      if (selectedCollection) {
        await authPatch(`/admin/collections/${selectedCollection.id}`, payload, getToken);
        toast.success('Collection updated successfully');
      } else {
        await authPost('/admin/collections', payload, getToken);
        toast.success('Collection created successfully');
      }

      setShowEditModal(false);
      fetchCollections();
    } catch (err: unknown) {
      console.error('Failed to save collection:', err);
      const message = err instanceof Error ? err.message : 'Failed to save collection';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCollection) return;

    try {
      setDeleting(true);
      await authDelete(`/admin/collections/${selectedCollection.id}`, getToken);
      toast.success('Collection deleted successfully');
      setShowDeleteModal(false);
      setSelectedCollection(null);
      fetchCollections();
    } catch (err: unknown) {
      console.error('Failed to delete collection:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete collection';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const showDateFields = formData.collection_type !== 'standard';

  useLockBodyScroll(showEditModal || showDeleteModal);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hafalohaRed"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
          <p className="text-gray-600 mt-1">Manage your product collections</p>
        </div>
        <button
          onClick={handleCreate}
          className="btn-primary flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Collection
        </button>
      </div>

      {/* Collections Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Collection
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Dates
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {collections.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  No collections found. Create your first collection!
                </td>
              </tr>
            ) : (
              collections.map((collection) => (
                <tr key={collection.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium text-gray-900">{collection.name}</div>
                      {collection.description && (
                        <div className="text-sm text-gray-500 line-clamp-1">{collection.description}</div>
                      )}
                      <div className="flex gap-1 mt-1">
                        {collection.featured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-hafalohaGold text-gray-900">
                            Featured
                          </span>
                        )}
                        {collection.is_featured && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="w-3 h-3" />
                            Homepage
                          </span>
                        )}
                        {collection.banner_text && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                            Banner
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {collectionTypeBadge(collection.collection_type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Package className="w-4 h-4 mr-1 text-gray-400" />
                      {collection.product_count}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          collection.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {collection.published ? 'Published' : 'Draft'}
                      </span>
                      {collection.expired && (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Expired
                        </span>
                      )}
                      {collection.upcoming && (
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          Upcoming
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {collection.starts_at || collection.ends_at ? (
                      <div className="flex flex-col gap-0.5">
                        {collection.starts_at && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(collection.starts_at).toLocaleDateString()}
                          </span>
                        )}
                        {collection.ends_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(collection.ends_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/collections/${collection.slug}`}
                        target="_blank"
                        className="btn-icon text-blue-600 hover:text-blue-900"
                        title="View"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleEdit(collection)}
                        className="btn-icon text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedCollection(collection);
                          setShowDeleteModal(true);
                        }}
                        className="btn-icon text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit/Create Modal */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col min-h-0">
            <div className="p-6 border-b border-gray-200 shrink-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedCollection ? 'Edit Collection' : 'Create Collection'}
              </h2>
            </div>

            <div
              ref={editModalContentRef}
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 overscroll-contain"
              onWheel={(event) => {
                if (editModalContentRef.current) {
                  editModalContentRef.current.scrollTop += event.deltaY;
                }
                event.stopPropagation();
                event.preventDefault();
              }}
            >
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="e.g., Summer Collection"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="Brief description of this collection"
                />
              </div>

              {/* Collection Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Collection Type
                </label>
                <select
                  value={formData.collection_type}
                  onChange={(e) => setFormData({ ...formData, collection_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                >
                  {COLLECTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Seasonal, event, and limited-time collections support date ranges
                </p>
              </div>

              {/* Date pickers (shown for non-standard types) */}
              {showDateFields && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Starts At
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.starts_at}
                      onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Ends At
                      </span>
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.ends_at}
                      onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Banner Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Banner Text
                </label>
                <input
                  type="text"
                  value={formData.banner_text}
                  onChange={(e) => setFormData({ ...formData, banner_text: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="e.g., Limited time only! Ends Dec 31st"
                />
                <p className="text-xs text-gray-500 mt-1">Promotional text displayed on the collection page</p>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={formData.sort_order ?? 0}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                    className="rounded border-gray-300 text-hafalohaRed focus:ring-hafalohaRed"
                  />
                  <span className="ml-2 text-sm text-gray-700">Published (visible to customers)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="rounded border-gray-300 text-hafalohaRed focus:ring-hafalohaRed"
                  />
                  <span className="ml-2 text-sm text-gray-700">Featured</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="rounded border-gray-300 text-hafalohaRed focus:ring-hafalohaRed"
                  />
                  <span className="ml-2 text-sm text-gray-700 flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    Show in Featured Collections section (homepage)
                  </span>
                </label>
                {showDateFields && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.auto_hide}
                      onChange={(e) => setFormData({ ...formData, auto_hide: e.target.checked })}
                      className="rounded border-gray-300 text-hafalohaRed focus:ring-hafalohaRed"
                    />
                    <span className="ml-2 text-sm text-gray-700">Auto-hide when end date passes</span>
                  </label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 shrink-0">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                disabled={saving}
              >
                {saving ? 'Saving...' : selectedCollection ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCollection && (
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Collection?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>{selectedCollection.name}</strong>? This action cannot be undone.
            </p>
            {selectedCollection.product_count > 0 && (
              <p className="text-sm text-amber-600 mb-4">
                This collection has {selectedCollection.product_count} product{selectedCollection.product_count !== 1 ? 's' : ''}. They will not be deleted, but will be removed from this collection.
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedCollection(null);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
