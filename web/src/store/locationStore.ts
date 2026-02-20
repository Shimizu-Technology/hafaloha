import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface LocationInfo {
  id: number;
  name: string;
  slug: string;
  address?: string | null;
  phone?: string | null;
  hours_json?: Record<string, string>;
  location_type?: 'permanent' | 'popup' | 'event';
  starts_at?: string | null;
  ends_at?: string | null;
  description?: string | null;
  qr_code_url?: string | null;
}

interface LocationStore {
  selectedLocation: LocationInfo | null;
  locations: LocationInfo[];

  setSelectedLocation: (location: LocationInfo | null) => void;
  setLocations: (locations: LocationInfo[]) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationStore>()(
  persist(
    (set) => ({
      selectedLocation: null,
      locations: [],

      setSelectedLocation: (location) => set({ selectedLocation: location }),
      setLocations: (locations) => set({ locations }),
      clearLocation: () => set({ selectedLocation: null }),
    }),
    {
      name: 'hafaloha-location',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedLocation: state.selectedLocation }),
    }
  )
);
