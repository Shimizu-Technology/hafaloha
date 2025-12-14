import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X, Plus, RefreshCw, Trash2, Edit2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface Variant {
  id: number;
  size: string | null;
  color: string | null;
  sku: string;
  variant_name: string;
  price_cents: number;
  stock_quantity: number;
  low_stock_threshold: number;
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'not_tracked';
  low_stock: boolean;
  available: boolean; // Manual admin control
  actually_available: boolean; // Computed: respects available + stock
}

interface VariantManagerProps {
  productId: number;
  basePriceCents: number;
  inventoryLevel: 'none' | 'product' | 'variant';
}

export default function VariantManager({ productId, basePriceCents, inventoryLevel }: VariantManagerProps) {
  const { getToken } = useAuth();
  
  // Options state
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [newSize, setNewSize] = useState('');
  const [newColor, setNewColor] = useState('');
  
  // Variants state
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // Edit state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editLowStockThreshold, setEditLowStockThreshold] = useState('');
  const [editAvailable, setEditAvailable] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);

  // Fetch existing variants on mount
  useEffect(() => {
    fetchVariants();
  }, [productId]);

  const fetchVariants = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const response = await axios.get(
        `${API_BASE_URL}/api/v1/admin/products/${productId}/variants`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Backend wraps response in { success: true, data: [...] }
      let fetchedVariants = response.data.data || response.data;
      
      // Ensure it's an array
      if (!Array.isArray(fetchedVariants)) {
        console.warn('Variants response is not an array:', fetchedVariants);
        fetchedVariants = [];
      }
      
      setVariants(fetchedVariants);
      
      // Extract unique sizes and colors from existing variants
      const uniqueSizes = [...new Set(fetchedVariants.map((v: Variant) => v.size).filter(Boolean))] as string[];
      const uniqueColors = [...new Set(fetchedVariants.map((v: Variant) => v.color).filter(Boolean))] as string[];
      setSizes(uniqueSizes);
      setColors(uniqueColors);
    } catch (err: any) {
      console.error('Failed to fetch variants:', err);
      // Don't show error toast if it's just an empty product
      if (err.response?.status !== 404) {
        toast.error('Failed to load variants');
      }
      setVariants([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const addSize = () => {
    if (newSize.trim() && !sizes.includes(newSize.trim())) {
      setSizes([...sizes, newSize.trim()]);
      setNewSize('');
    }
  };

  const removeSize = (size: string) => {
    setSizes(sizes.filter(s => s !== size));
  };

  const addColor = () => {
    if (newColor.trim() && !colors.includes(newColor.trim())) {
      setColors([...colors, newColor.trim()]);
      setNewColor('');
    }
  };

  const removeColor = (color: string) => {
    setColors(colors.filter(c => c !== color));
  };

  const generateVariants = async () => {
    if (sizes.length === 0 && colors.length === 0) {
      toast.error('Please add at least one size or color');
      return;
    }

    // Show confirmation if variants already exist
    if (variants.length > 0) {
      const confirmMsg = `You have ${variants.length} existing variants. This will add new combinations only. Continue?`;
      if (!window.confirm(confirmMsg)) {
        return;
      }
    }

    try {
      setGenerating(true);
      const token = await getToken();
      const response = await axios.post(
        `${API_BASE_URL}/api/v1/admin/products/${productId}/variants/generate`,
        { sizes, colors },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const result = response.data.data;
      toast.success(response.data.message || `Generated ${result.created} variants`);
      
      // Refresh variants
      await fetchVariants();
    } catch (err: any) {
      console.error('Failed to generate variants:', err);
      toast.error(err.response?.data?.error || 'Failed to generate variants');
    } finally {
      setGenerating(false);
    }
  };

  const startEdit = (variant: Variant) => {
    setEditingVariant(variant);
    setEditPrice((variant.price_cents / 100).toFixed(2));
    setEditStock(variant.stock_quantity.toString());
    setEditLowStockThreshold(variant.low_stock_threshold.toString());
    setEditAvailable(variant.available);
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setShowEditModal(false);
    setEditingVariant(null);
    setEditPrice('');
    setEditStock('');
    setEditLowStockThreshold('');
    setEditAvailable(true);
  };

  const saveEdit = async () => {
    if (!editingVariant) return;
    
    try {
      const token = await getToken();
      const priceCents = Math.round(parseFloat(editPrice) * 100);
      const stockQty = parseInt(editStock);
      const lowStockThreshold = parseInt(editLowStockThreshold);

      if (isNaN(priceCents) || priceCents < 0) {
        toast.error('Invalid price');
        return;
      }
      if (isNaN(stockQty) || stockQty < 0) {
        toast.error('Invalid stock quantity');
        return;
      }
      if (isNaN(lowStockThreshold) || lowStockThreshold < 0) {
        toast.error('Invalid low stock threshold');
        return;
      }

      await axios.patch(
        `${API_BASE_URL}/api/v1/admin/products/${productId}/variants/${editingVariant.id}`,
        {
          product_variant: {
            price_cents: priceCents,
            stock_quantity: stockQty,
            low_stock_threshold: lowStockThreshold,
            available: editAvailable,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state instead of refetching everything
      setVariants(variants.map(v => 
        v.id === editingVariant.id 
          ? { 
              ...v, 
              price_cents: priceCents, 
              stock_quantity: stockQty, 
              low_stock_threshold: lowStockThreshold,
              available: editAvailable,
              // Recalculate stock status
              stock_status: stockQty <= 0 ? 'out_of_stock' : stockQty <= lowStockThreshold ? 'low_stock' : 'in_stock',
              low_stock: stockQty > 0 && stockQty <= lowStockThreshold
            }
          : v
      ));
      
      toast.success('Variant updated successfully!');
      cancelEdit();
    } catch (err: any) {
      console.error('Failed to update variant:', err);
      toast.error(err.response?.data?.error || 'Failed to update variant');
    }
  };

  const toggleAvailability = async (variantId: number, currentStatus: boolean) => {
    try {
      const token = await getToken();
      await axios.patch(
        `${API_BASE_URL}/api/v1/admin/products/${productId}/variants/${variantId}`,
        {
          product_variant: {
            available: !currentStatus,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state instead of refetching
      setVariants(variants.map(v => 
        v.id === variantId 
          ? { ...v, available: !currentStatus }
          : v
      ));
      
      toast.success(currentStatus ? 'Variant disabled' : 'Variant enabled');
    } catch (err: any) {
      console.error('Failed to toggle availability:', err);
      toast.error(err.response?.data?.error || 'Failed to toggle availability');
    }
  };

  const deleteVariant = async (variantId: number, variantName: string) => {
    if (!window.confirm(`Delete variant "${variantName}"? This cannot be undone.`)) {
      return;
    }

    try {
      const token = await getToken();
      await axios.delete(
        `${API_BASE_URL}/api/v1/admin/products/${productId}/variants/${variantId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local state by filtering out deleted variant
      setVariants(variants.filter(v => v.id !== variantId));
      
      toast.success('Variant deleted');
    } catch (err: any) {
      console.error('Failed to delete variant:', err);
      toast.error(err.response?.data?.error || 'Failed to delete variant');
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  // Preset options
  const SIZE_PRESETS = {
    'Standard': ['Small', 'Medium', 'Large', 'XL'],
    'Extended': ['XS', 'Small', 'Medium', 'Large', 'XL', 'XXL', 'XXXL'],
    'Kids': ['2T', '3T', '4T', 'Youth S', 'Youth M', 'Youth L'],
    'One Size': ['One Size']
  };

  const COLOR_PRESETS = {
    'Basic': ['Black', 'White', 'Red'],
    'Extended': ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow'],
    'Hafaloha': ['Hafaloha Red', 'Gold', 'Black', 'White'],
    'Neutrals': ['Black', 'White', 'Gray', 'Beige', 'Navy']
  };

  const applySizePreset = (presetName: string) => {
    const presetSizes = SIZE_PRESETS[presetName as keyof typeof SIZE_PRESETS];
    if (presetSizes) {
      // Add new sizes that aren't already in the list
      const newSizes = presetSizes.filter(size => !sizes.includes(size));
      if (newSizes.length > 0) {
        setSizes([...sizes, ...newSizes]);
        toast.success(`Added ${newSizes.length} size(s) from ${presetName} preset`);
      } else {
        toast('All sizes from this preset are already added', { icon: 'ℹ️' });
      }
    }
  };

  const applyColorPreset = (presetName: string) => {
    const presetColors = COLOR_PRESETS[presetName as keyof typeof COLOR_PRESETS];
    if (presetColors) {
      // Add new colors that aren't already in the list
      const newColors = presetColors.filter(color => !colors.includes(color));
      if (newColors.length > 0) {
        setColors([...colors, ...newColors]);
        toast.success(`Added ${newColors.length} color(s) from ${presetName} preset`);
      } else {
        toast('All colors from this preset are already added', { icon: 'ℹ️' });
      }
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading variants...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Variant Options Builder */}
      <div className="border-2 border-gray-200 rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🎨 Variant Options
        </h3>

        {/* Sizes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sizes
          </label>
          
          {/* Size Presets Dropdown */}
          <div className="mb-3">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  applySizePreset(e.target.value);
                  e.target.value = ''; // Reset dropdown
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-hafalohaRed text-sm bg-white"
            >
              <option value="">Choose a size preset...</option>
              <option value="Standard">Standard (S/M/L/XL)</option>
              <option value="Extended">Extended (XS-XXXL)</option>
              <option value="Kids">Kids (2T-Youth L)</option>
              <option value="One Size">One Size</option>
            </select>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {sizes.map((size) => (
              <span
                key={size}
                className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {size}
                <button
                  type="button"
                  onClick={() => removeSize(size)}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSize()}
              placeholder="e.g., Small, Medium, Large"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-hafalohaRed text-sm"
            />
            <button
              type="button"
              onClick={addSize}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Size
            </button>
          </div>
        </div>

        {/* Colors */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Colors
          </label>
          
          {/* Color Presets Dropdown */}
          <div className="mb-3">
            <select
              onChange={(e) => {
                if (e.target.value) {
                  applyColorPreset(e.target.value);
                  e.target.value = ''; // Reset dropdown
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-hafalohaRed text-sm bg-white"
            >
              <option value="">Choose a color preset...</option>
              <option value="Basic">Basic (Black/White/Red)</option>
              <option value="Extended">Extended (6 colors)</option>
              <option value="Hafaloha">Hafaloha (Red/Gold/Black/White)</option>
              <option value="Neutrals">Neutrals (Black/White/Gray/Beige/Navy)</option>
            </select>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-3">
            {colors.map((color) => (
              <span
                key={color}
                className="inline-flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium"
              >
                {color}
                <button
                  type="button"
                  onClick={() => removeColor(color)}
                  className="hover:bg-green-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addColor()}
              placeholder="e.g., Red, Black, White"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-hafalohaRed text-sm"
            />
            <button
              type="button"
              onClick={addColor}
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Color
            </button>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={generateVariants}
          disabled={generating || (sizes.length === 0 && colors.length === 0)}
          className={`w-full py-3 rounded-lg font-semibold text-white flex items-center justify-center gap-2 transition ${
            generating || (sizes.length === 0 && colors.length === 0)
              ? 'bg-gray-300 cursor-not-allowed'
              : 'bg-hafalohaRed hover:bg-red-700'
          }`}
        >
          <RefreshCw className={`w-5 h-5 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Generate Variants'}
        </button>

        {variants.length > 0 && (
          <p className="text-xs text-gray-600 mt-2 text-center">
            💡 This will only add new combinations. Existing variants won't be changed.
          </p>
        )}
      </div>

      {/* Variants Table */}
      {variants.length > 0 && (
        <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              📦 Variants ({variants.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Variant
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Price
                  </th>
                  {inventoryLevel === 'variant' && (
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Stock
                    </th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {variants.map((variant) => (
                  <tr key={variant.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900 font-mono">
                      {variant.sku}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-medium">
                      {variant.variant_name}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <span className="text-gray-900 font-semibold">
                        {formatPrice(variant.price_cents)}
                      </span>
                    </td>
                    {inventoryLevel === 'variant' && (
                      <td className="px-4 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <span className={
                            variant.stock_status === 'out_of_stock' 
                              ? 'text-red-600 font-semibold' 
                              : variant.stock_status === 'low_stock'
                              ? 'text-amber-600 font-semibold'
                              : 'text-gray-900'
                          }>
                            {variant.stock_quantity}
                          </span>
                          {variant.stock_status === 'low_stock' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800" title={`Low stock (threshold: ${variant.low_stock_threshold})`}>
                              ⚠️ Low
                            </span>
                          )}
                          {variant.stock_status === 'out_of_stock' && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Out
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                    <td className="px-4 py-4 text-sm">
                      <button
                        type="button"
                        onClick={() => toggleAvailability(variant.id, variant.available)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition cursor-pointer hover:opacity-80 ${
                          variant.actually_available 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                        title={variant.available ? 'Click to disable' : 'Click to enable'}
                      >
                        {variant.actually_available ? '✓ Available' : (
                          inventoryLevel === 'variant' && variant.stock_quantity === 0 
                            ? '⚠️ Out of Stock' 
                            : '✗ Disabled'
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(variant)}
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-xs font-medium"
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteVariant(variant.id, variant.variant_name)}
                          className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition text-xs font-medium"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {variants.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No variants yet</p>
          <p className="text-sm">Add sizes and/or colors above, then click "Generate Variants"</p>
        </div>
      )}

      {/* Edit Variant Modal */}
      {showEditModal && editingVariant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 backdrop-blur-md"
            onClick={cancelEdit}
          />
          
          {/* Modal */}
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Variant
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {editingVariant.variant_name}
                </p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  SKU: {editingVariant.sku}
                </p>
              </div>
              <button
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Stock Quantity - Only show if inventory_level is 'variant' */}
              {inventoryLevel === 'variant' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editStock}
                      onChange={(e) => setEditStock(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                      placeholder="0"
                    />
                  </div>

                  {/* Low Stock Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editLowStockThreshold}
                      onChange={(e) => setEditLowStockThreshold(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-hafalohaRed focus:border-transparent"
                      placeholder="5"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get a warning when stock falls to or below this number
                    </p>
                  </div>
                </>
              )}

              {/* Helper text when inventory tracking is not at variant level */}
              {inventoryLevel !== 'variant' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Stock tracking is {inventoryLevel === 'none' ? 'disabled' : 'at product level'}.</strong> Individual variant stock is not tracked.
                  </p>
                </div>
              )}

              {/* Availability Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <button
                  type="button"
                  onClick={() => setEditAvailable(!editAvailable)}
                  className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                    editAvailable 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {editAvailable ? '✓ Available (Click to disable)' : '✗ Unavailable (Click to enable)'}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={cancelEdit}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="flex-1 px-4 py-2 bg-hafalohaRed text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

