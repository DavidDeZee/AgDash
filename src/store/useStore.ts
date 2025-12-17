import { create } from 'zustand';
import type { EnhancedCountyData, SortField } from '../types/ag';

interface DashboardState {
  // Selected counties
  selectedCounty: EnhancedCountyData | null;
  comparisonCounties: EnhancedCountyData[];

  // Filters
  selectedStates: string[];
  selectedLocations: string[];
  metricRanges: Record<string, [number | null, number | null]>;

  // Sort
  sortField: SortField;
  sortDirection: 'asc' | 'desc';

  // Query
  searchQuery: string;

  // Heatmap
  heatmapMode: boolean;
  heatmapMetric: string;
  heatmapStateFilter: string | null;

  // Layer Visibility
  showPapeLocations: boolean;
  showNewHollandLocations: boolean;
  showCaseIHLocations: boolean;
  showKubotaLocations: boolean;
  showKiotiLocations: boolean;
  // Regions
  regionMode: boolean;

  // Actions
  setSelectedCounty: (county: EnhancedCountyData | null) => void;
  addToComparison: (county: EnhancedCountyData) => void;
  removeFromComparison: (countyId: string) => void;
  clearComparison: () => void;

  setSelectedStates: (states: string[]) => void;
  setSelectedLocations: (locations: string[]) => void;
  setMetricRange: (metric: string, range: [number | null, number | null]) => void;
  removeMetricRange: (metric: string) => void;

  setSortField: (field: DashboardState['sortField']) => void;
  setSortDirection: (direction: 'asc' | 'desc') => void;

  setSearchQuery: (query: string) => void;

  setHeatmapMode: (enabled: boolean) => void;
  setHeatmapMetric: (metric: string) => void;
  setHeatmapStateFilter: (state: string | null) => void;

  togglePapeLocations: () => void;
  toggleNewHollandLocations: () => void;
  toggleCaseIHLocations: () => void;
  toggleKubotaLocations: () => void;
  toggleKiotiLocations: () => void;

  setRegionMode: (enabled: boolean) => void;

  // Authentication
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;

  resetFilters: () => void;
}

export const useStore = create<DashboardState>((set) => ({
  // Initial state
  selectedCounty: null,
  comparisonCounties: [],
  selectedStates: [],
  selectedLocations: [],
  metricRanges: {},
  sortField: 'croplandAcres',
  sortDirection: 'desc',
  searchQuery: '',
  heatmapMode: false,
  heatmapMetric: 'croplandAcres', // Default metric
  heatmapStateFilter: null,
  showPapeLocations: false,
  showNewHollandLocations: false,
  showCaseIHLocations: false,
  showKubotaLocations: false,
  showKiotiLocations: false,
  regionMode: true,

  // Actions
  setSelectedCounty: (county) => set({ selectedCounty: county }),

  addToComparison: (county) =>
    set((state) => {
      if (state.comparisonCounties.length >= 5) return state;
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
  setMetricRange: (metric, range) =>
    set((state) => ({
      metricRanges: { ...state.metricRanges, [metric]: range },
    })),

  removeMetricRange: (metric) =>
    set((state) => {
      const newRanges = { ...state.metricRanges };
      delete newRanges[metric];
      return { metricRanges: newRanges };
    }),

  setSortField: (field) => set({ sortField: field }),
  setSortDirection: (direction) => set({ sortDirection: direction }),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setHeatmapMode: (enabled) => set({ heatmapMode: enabled }),
  setHeatmapMetric: (metric) => set({ heatmapMetric: metric }),
  setHeatmapStateFilter: (state) => set({ heatmapStateFilter: state }),
  setRegionMode: (enabled) => set({ regionMode: enabled }),

  togglePapeLocations: () => set((state) => ({ showPapeLocations: !state.showPapeLocations })),
  toggleNewHollandLocations: () => set((state) => ({ showNewHollandLocations: !state.showNewHollandLocations })),
  toggleCaseIHLocations: () => set((state) => ({ showCaseIHLocations: !state.showCaseIHLocations })),
  toggleKubotaLocations: () => set((state) => ({ showKubotaLocations: !state.showKubotaLocations })),
  toggleKiotiLocations: () => set((state) => ({ showKiotiLocations: !state.showKiotiLocations })),

  // Authentication
  isAuthenticated: !!sessionStorage.getItem('ag_auth'),

  login: async (password: string) => {
    try {
      const res = await fetch('/api/verify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        sessionStorage.setItem('ag_auth', 'true');
        sessionStorage.setItem('ag_password', password);
        set({ isAuthenticated: true });
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  },

  logout: () => {
    sessionStorage.removeItem('ag_auth');
    sessionStorage.removeItem('ag_password');
    set({ isAuthenticated: false });
  },

  resetFilters: () =>
    set({
      selectedStates: [],
      selectedLocations: [],
      metricRanges: {},
      searchQuery: '',
      heatmapMode: false,
      heatmapMetric: 'croplandAcres',
      heatmapStateFilter: null,
      regionMode: true,
    }),
}));