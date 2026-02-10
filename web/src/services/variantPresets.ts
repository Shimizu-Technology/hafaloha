// src/services/variantPresets.ts
// API service for managing variant presets

import { authDelete, authGet, authPatch, authPost, type GetTokenFn } from './authApi';

// Types
export interface PresetValue {
  name: string;
  price_adjustment_cents: number;
}

export interface VariantPreset {
  id: number;
  name: string;
  description: string | null;
  option_type: string;
  position: number;
  values: PresetValue[];
  values_count: number;
  value_names: string[];
  created_at: string;
  updated_at: string;
}

export interface PresetsResponse {
  success: boolean;
  data: {
    presets: VariantPreset[];
    grouped_by_type: Record<string, VariantPreset[]>;
    option_types: string[];
  };
}

export interface PresetResponse {
  success: boolean;
  data: VariantPreset;
  message?: string;
}

export interface CreatePresetData {
  name: string;
  description?: string;
  option_type: string;
  position?: number;
  values: PresetValue[];
}

export interface UpdatePresetData {
  name?: string;
  description?: string;
  option_type?: string;
  position?: number;
  values?: PresetValue[];
}

// API Functions

/**
 * Get all variant presets
 */
export const getAll = async (getToken: GetTokenFn): Promise<PresetsResponse> => {
  const response = await authGet<PresetsResponse>('/admin/variant_presets', getToken);
  return response.data;
};

/**
 * Get a single preset by ID
 */
export const getById = async (id: number, getToken: GetTokenFn): Promise<PresetResponse> => {
  const response = await authGet<PresetResponse>(`/admin/variant_presets/${id}`, getToken);
  return response.data;
};

/**
 * Create a new preset
 */
export const create = async (data: CreatePresetData, getToken: GetTokenFn): Promise<PresetResponse> => {
  const response = await authPost<PresetResponse>(
    '/admin/variant_presets',
    { variant_preset: data },
    getToken
  );
  return response.data;
};

/**
 * Update an existing preset
 */
export const update = async (id: number, data: UpdatePresetData, getToken: GetTokenFn): Promise<PresetResponse> => {
  const response = await authPatch<PresetResponse>(
    `/admin/variant_presets/${id}`,
    { variant_preset: data },
    getToken
  );
  return response.data;
};

/**
 * Delete a preset
 */
export const remove = async (id: number, getToken: GetTokenFn): Promise<{ success: boolean; message: string }> => {
  const response = await authDelete<{ success: boolean; message: string }>(`/admin/variant_presets/${id}`, getToken);
  return response.data;
};

/**
 * Duplicate a preset
 */
export const duplicate = async (id: number, getToken: GetTokenFn, newName?: string): Promise<PresetResponse> => {
  const response = await authPost<PresetResponse>(
    `/admin/variant_presets/${id}/duplicate`,
    { name: newName },
    getToken
  );
  return response.data;
};

// Helper functions

/**
 * Format price adjustment for display
 */
export const formatPriceAdjustment = (cents: number): string => {
  if (cents === 0) return '';
  const dollars = cents / 100;
  return cents > 0 ? `+$${dollars.toFixed(2)}` : `-$${Math.abs(dollars).toFixed(2)}`;
};

/**
 * Get preset values as display string
 */
export const getValuesPreview = (preset: VariantPreset, maxItems = 5): string => {
  const names = preset.value_names.slice(0, maxItems);
  const remaining = preset.values_count - maxItems;
  
  if (remaining > 0) {
    return `${names.join(', ')} +${remaining} more`;
  }
  return names.join(', ');
};

export default {
  getAll,
  getById,
  create,
  update,
  remove,
  duplicate,
  formatPriceAdjustment,
  getValuesPreview
};
