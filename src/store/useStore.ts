import { create } from 'zustand';
import type { EnhancedCountyData, SortField } from '../types/ag';

interface DashboardState {
  // Selected counties
  selectedCounty: EnhancedCountyData | null;
  comparisonCounties: EnhancedCountyData[];

  // Filters
  selectedStates: string[];
  selectedLocations: string[];
  croplandRange: [number | null, number | null];
  farmsRange: [number | null, number | null];

  // Sort
  sortField: SortField;
  sortDirection: 'asc' | 'desc';

  // Query
  searchQuery: string;

  // Actions
  setSelectedCounty: (county: EnhancedCountyData | null) => void;
  addToComparison: (county: EnhancedCountyData) => void;
  removeFromComparison: (countyId: string) => void;
  clearComparison: () => void;

  setSelectedStates: (states: string[]) => void;
  setSelectedLocations: (locations: string[]) => void;
  setCroplandRange: (range: [number | null, number | null]) => void;
  setFarmsRange: (range: [number | null, number | null]) => void;

  setSortField: (field: DashboardState['sortField']) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;

  setSearchQuery: (query: string) => void;

  resetFilters: () => void;
}

export const useStore = create<DashboardState>((set) => ({
  // Initial state
  selectedCounty: null,
  comparisonCounties: [],
  selectedStates: [],
  selectedLocations: [],
  croplandRange: [null, null],
  farmsRange: [null, null],
  sortField: 'croplandAcres',
  sortDirection: 'desc',
  searchQuery: '',

  // Actions
  setSelectedCounty: (county) => set({ selectedCounty: county }),

  addToComparison: (county) =>
    set((state) => {
      if (state.comparisonCounties.length >= 3) return state;
      if (state.comparisonCounties.some((c) => c.id === county.id)) return state;
      return { comparisonCounties: [...state.comparisonCounties, county] };
    }),

  removeFromComparison: (countyId) =>
    set((state) => ({
      comparisonCounties: state.comparisonCounties.filter((c) => c.id !== countyId),
    })),

  clearComparison: () => set({ comparisonCounties: [] }),

  setSelectedStates: (states) => set({ selectedStates: states }),
  setSelectedLocations: (locations) => set({ selectedLocations: locations }),
  setCroplandRange: (range) => set({ croplandRange: range }),
  setFarmsRange: (range) => set({ farmsRange: range }),

  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  resetFilters: () =>
    set({
      selectedStates: [],
      selectedLocations: [],
      croplandRange: [null, null],
      farmsRange: [null, null],
      searchQuery: '',
    }),
}));