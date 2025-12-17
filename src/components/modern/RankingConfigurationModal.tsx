import { useState, useEffect, useMemo } from 'react';
import { X, Check, RotateCcw, ChevronDown, ChevronUp, Plus, Trash2, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import type { SortField } from '../../types/ag';
import { STATE_TO_FIPS } from '../../utils/dataUtils';
import { getCountyRegion } from './MapView';

import type { EnhancedCountyData } from '../../types/ag';
import type { PapeDataMap } from '../../hooks/usePapeData';

interface RankingConfigurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableStates: string[];
    allCounties: EnhancedCountyData[];
    papeData: PapeDataMap;
}

type MetricCategory = 'Generals' | 'Farm Demographics' | 'Financials' | 'Crops' | 'Livestock' | 'Internal Data';

const METRIC_CATEGORIES: Record<MetricCategory, SortField[]> = {
    'Generals': ['croplandAcres', 'irrigatedAcres', 'harvestedCroplandAcres'],
    'Farm Demographics': ['farms', 'farms1to9Acres', 'farms10to49Acres', 'farms50to69Acres', 'farms70to99Acres', 'farms100to139Acres', 'farms140to179Acres', 'farms180to499Acres', 'farms500to999Acres', 'farms1000to1999Acres', 'farms2000PlusAcres'],
    'Financials': ['marketValueTotalDollars', 'cropsSalesDollars', 'livestockSalesDollars'],
    'Crops': ['applesAcres', 'wheatAcres', 'riceAcres', 'hazelnutsAcres', 'grassSeedAcres', 'cornAcres', 'cornSilageAcres', 'hayAcres', 'haylageAcres'],
    'Livestock': ['beefCattleHead', 'dairyCattleHead'],
    'Internal Data': [] // Special case handled with drill-down
};

// Metric Groups
const INTERNAL_METRIC_GROUPS = {
    DEFAULT: ['IND', 'DLR', 'Market Share'],
    PAES: ['PAES %', 'EA Breadth', 'HEA Depth', 'Tech Adoption']
};

const PREFERRED_CATEGORY_ORDER = [
    '< 50 EHP',
    '50 < 100 EHP',
    'MID HAY',
    'LARGE AG',
    'CCE',
    'PAES'
];

// Start of Metric Category
interface MetricOption {
    value: SortField;
    label: string;
    category: MetricCategory;
}

export const METRIC_OPTIONS: MetricOption[] = [
    { value: 'farms1to9Acres', label: 'Farms 1-9 Acres', category: 'Farm Demographics' },
    { value: 'farms10to49Acres', label: 'Farms 10-49 Acres', category: 'Farm Demographics' },
    { value: 'farms50to69Acres', label: 'Farms 50-69 Acres', category: 'Farm Demographics' },
    { value: 'farms70to99Acres', label: 'Farms 70-99 Acres', category: 'Farm Demographics' },
    { value: 'farms100to139Acres', label: 'Farms 100-139 Acres', category: 'Farm Demographics' },
    { value: 'farms140to179Acres', label: 'Farms 140-179 Acres', category: 'Farm Demographics' },
    { value: 'farms180to499Acres', label: 'Farms 180-499 Acres', category: 'Farm Demographics' },
    { value: 'farms500to999Acres', label: 'Farms 500-999 Acres', category: 'Farm Demographics' },
    { value: 'farms1000to1999Acres', label: 'Farms 1,000-1,999 Acres', category: 'Farm Demographics' },
    { value: 'farms2000PlusAcres', label: 'Farms 2,000+ Acres', category: 'Farm Demographics' },
    { value: 'farms', label: 'Total Number of Farms', category: 'Farm Demographics' },
    { value: 'croplandAcres', label: 'Cropland Acres', category: 'Generals' },
    { value: 'irrigatedAcres', label: 'Irrigated Acres', category: 'Generals' },
    { value: 'harvestedCroplandAcres', label: 'Harvested Cropland', category: 'Generals' },

    { value: 'marketValueTotalDollars', label: 'Total Sales', category: 'Financials' },
    { value: 'cropsSalesDollars', label: 'Crop Sales', category: 'Financials' },
    { value: 'livestockSalesDollars', label: 'Livestock Sales', category: 'Financials' },

    { value: 'applesAcres', label: 'Apples', category: 'Crops' },
    { value: 'wheatAcres', label: 'Wheat', category: 'Crops' },
    { value: 'riceAcres', label: 'Rice', category: 'Crops' },
    { value: 'hazelnutsAcres', label: 'Hazelnuts', category: 'Crops' },
    { value: 'grassSeedAcres', label: 'Grass Seed', category: 'Crops' },
    { value: 'cornAcres', label: 'Corn', category: 'Crops' },
    { value: 'cornSilageAcres', label: 'Corn Silage', category: 'Crops' },
    { value: 'hayAcres', label: 'Hay', category: 'Crops' },
    { value: 'haylageAcres', label: 'Haylage', category: 'Crops' },

    { value: 'beefCattleHead', label: 'Beef Cattle', category: 'Livestock' },
    { value: 'dairyCattleHead', label: 'Dairy Cattle', category: 'Livestock' },
];

export function RankingConfigurationModal({
    isOpen,
    onClose,
    availableStates,
    allCounties,
    papeData
}: RankingConfigurationModalProps) {
    const {
        sortField,
        selectedStates,
        selectedLocations,
        metricRanges,
        setSortField,
        setSelectedStates,
        setSelectedLocations,
        setMetricRange,
        removeMetricRange,
    } = useStore();

    // Determine initial category based on sortField
    const getCategoryForField = (field: SortField): MetricCategory => {
        const option = METRIC_OPTIONS.find(opt => opt.value === field);
        if (field.startsWith('internal|')) return 'Internal Data' as any;
        return option ? option.category : 'Generals';
    };

    // Local state for the modal
    const [localSortField, setLocalSortField] = useState<SortField>(sortField);
    const [localSelectedStates, setLocalSelectedStates] = useState<string[]>(selectedStates);
    const [localSelectedLocations, setLocalSelectedLocations] = useState<string[]>(selectedLocations);
    const [localMetricRanges, setLocalMetricRanges] = useState<Record<string, [number | null, number | null]>>(metricRanges);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
    const [selectedMetricToAdd, setSelectedMetricToAdd] = useState<string>('');

    // Derive available internal categories from data
    const internalCategories = useMemo(() => {
        const cats = new Set<string>();
        Object.values(papeData).forEach(items => {
            if (Array.isArray(items)) {
                items.forEach(item => {
                    if (item.category) cats.add(item.category);
                });
            }
        });

        // Sort based on preferred order, then alphabetical
        return Array.from(cats).sort((a, b) => {
            const idxA = PREFERRED_CATEGORY_ORDER.findIndex(p => a.includes(p) || p.includes(a)); // Fuzzy match for ordering
            const idxB = PREFERRED_CATEGORY_ORDER.findIndex(p => b.includes(p) || p.includes(b));

            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });
    }, [papeData]);

    // Helper to get metrics for a category
    const getMetricsForCategory = (category: string) => {
        if (category && category.toUpperCase().includes('PAES')) {
            return INTERNAL_METRIC_GROUPS.PAES;
        }
        return INTERNAL_METRIC_GROUPS.DEFAULT;
    };

    // Compute valid states for the current metric
    const validStates = useMemo(() => {
        const states = new Set<string>();
        allCounties.forEach(county => {
            let val: number | null | undefined;

            if (localSortField.startsWith('internal|') && papeData) {
                // Handle internal data lookup
                const parts = localSortField.split('|');
                if (parts.length >= 3) {
                    const category = parts[1];
                    const key = parts[2];
                    const countyData = papeData[county.id];

                    if (countyData) {
                        const item = countyData.find(d => d.category === category);
                        if (item) {
                            const rawVal = item[key as keyof typeof item];
                            // Parse value if string (remove $, %, etc)
                            if (typeof rawVal === 'number') {
                                val = rawVal;
                            } else if (typeof rawVal === 'string' && rawVal !== 'N/A') {
                                val = parseFloat(rawVal.replace(/[$,%]/g, ''));
                            }
                        }
                    }
                }
            } else {
                val = county[localSortField as keyof EnhancedCountyData] as number;
            }

            if (typeof val === 'number' && !isNaN(val) && val > 0) {
                states.add(county.stateName);
            }
        });
        return Array.from(states).sort();
    }, [allCounties, localSortField, papeData]);

    // Determines which states to show: intersection of availableStates and validStates
    // (availableStates usually has all of them, but good to be safe if parent passes a subset)
    const displayedStates = useMemo(() => {
        return availableStates.filter(s => validStates.includes(s));
    }, [availableStates, validStates]);

    // Category selection state
    const [selectedCategory, setSelectedCategory] = useState<MetricCategory>(getCategoryForField(sortField));
    const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
    const [isAddMetricDropdownOpen, setIsAddMetricDropdownOpen] = useState(false);

    const availableLocations = [
        { key: 'PUGET_SOUND', name: 'Puget Sound', color: 'hsl(270, 70%, 50%)' },
        { key: 'INLAND_NW', name: 'Inland NW', color: 'hsl(217, 91%, 60%)' },
        { key: 'NORTHERN_OREGON', name: 'Northern Oregon', color: 'hsl(48, 96%, 53%)' },
        { key: 'SOUTHERN_OREGON', name: 'Southern Oregon', color: 'hsl(142, 76%, 36%)' },
        { key: 'SUTTER_BUTTE', name: 'Sutter Butte', color: 'hsl(25, 95%, 53%)' },
        { key: 'SACRAMENTO', name: 'Sacramento', color: 'hsl(195, 70%, 60%)' },
    ];

    // Compute available metrics based on filtered counties
    const availableMetrics = useMemo(() => {
        // 1. Filter counties based on geographic selection
        const geofilteredCounties = allCounties.filter(county => {
            // State filter
            if (localSelectedStates.length > 0 && !localSelectedStates.includes(county.stateName)) {
                return false;
            }
            // Region filter
            if (localSelectedLocations.length > 0) {
                const stateFips = STATE_TO_FIPS[county.stateName.toUpperCase()];
                if (!stateFips) return false;
                const region = getCountyRegion(county.countyName, stateFips);
                if (!region || !localSelectedLocations.includes(region)) {
                    return false;
                }
            }
            return true;
        });

        // 2. Check which metrics have data (value > 0) in the filtered set
        const metrics = new Set<string>();

        // Always enable internal metrics if internal data is selected? 
        // Or checking availability would be expensive. Let's enable them by default for now.
        // We will just process public metrics here.
        METRIC_OPTIONS.forEach(metric => {
            // Always include Generals category metrics
            if (metric.category === 'Generals') {
                metrics.add(metric.value);
                return;
            }

            const hasData = geofilteredCounties.some(c => {
                const val = c[metric.value];
                return typeof val === 'number' && val > 0;
            });
            if (hasData) {
                metrics.add(metric.value);
            }
        });
        return metrics;
    }, [allCounties, localSelectedStates, localSelectedLocations]);

    // Internal Data Navigation State
    const [internalView, setInternalView] = useState<'categories' | 'metrics'>('categories');
    const [selectedInternalCategory, setSelectedInternalCategory] = useState<string | null>(null);

    // Determines if we are in the "drill-down" mode for Internal Data
    const isInternalDataMode = selectedCategory === 'Internal Data';

    // Helper to select an internal metric
    const handleInternalMetricSelect = (metric: string) => {
        // Construct composite key: internal|CATEGORY|METRIC_KEY
        // We need to map the readable label back to a key if needed, or just use the label as key for now since they match in the source code generally?
        // In MapView we handle "indDollars", "sharePercentage". 
        // Let's map the label to the likely key.
        let key = '';
        switch (metric) {
            case 'IND': key = 'indDollars'; break;
            case 'DLR': key = 'dlrDollars'; break;
            case 'Market Share': key = 'sharePercentage'; break;
            case 'PAES %': key = 'paesPercent'; break;
            case 'EA Breadth': key = 'eaBreadth'; break;
            case 'HEA Depth': key = 'heaDepth'; break;
            case 'Tech Adoption': key = 'techAdoption'; break;
            default: key = metric.replace(/ /g, '');
        }

        const compositeKey = `internal|${selectedInternalCategory}|${key}`;
        setLocalSortField(compositeKey as SortField);
    };

    // Sync local state with store when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalSortField(sortField);
            setLocalSelectedStates(selectedStates);
            setLocalSelectedLocations(selectedLocations);
            setLocalMetricRanges(metricRanges);
            setLocalMetricRanges(metricRanges);
            const cat = getCategoryForField(sortField);
            setSelectedCategory(cat);
            if (cat === 'Internal Data') {
                // If opening with existing internal metric, try to restore state
                // sortField format: internal|CATEGORY|KEY
                if (sortField.startsWith('internal|')) {
                    const parts = sortField.split('|');
                    if (parts.length >= 3) {
                        setSelectedInternalCategory(parts[1]);
                        setInternalView('metrics');
                    }
                }
            }
        }
    }, [isOpen, sortField, selectedStates, selectedLocations, metricRanges]);

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    // Update category if the local sort field changes externally (though in this UI flow it's driven by category first)
    // But importantly, if the user picks a category, we might want to default to the first metric or just wait for them to pick.
    // Current design: User picks category -> User picks metric.

    if (!isOpen) return null;

    const handleApply = () => {
        setSortField(localSortField);
        setSelectedStates(localSelectedStates);
        setSelectedLocations(localSelectedLocations);

        // Sync metric ranges
        // First remove any that are no longer present
        Object.keys(metricRanges).forEach(metric => {
            if (!localMetricRanges[metric]) {
                removeMetricRange(metric);
            }
        });
        // Then set all current ones
        Object.entries(localMetricRanges).forEach(([metric, range]) => {
            setMetricRange(metric, range);
        });

        onClose();
    };

    const handleReset = () => {
        setLocalSelectedStates([]);
        setLocalSelectedLocations([]);
        setLocalSortField('croplandAcres');
        setLocalMetricRanges({});
        setSelectedCategory('Generals');

        // Apply to store immediately
        setSelectedStates([]);
        setSelectedLocations([]);
        setSortField('croplandAcres');
        // Clear all metric ranges
        Object.keys(metricRanges).forEach(metric => removeMetricRange(metric));
    };

    const toggleState = (state: string) => {
        if (localSelectedStates.includes(state)) {
            setLocalSelectedStates(localSelectedStates.filter((s) => s !== state));
        } else {
            setLocalSelectedStates([...localSelectedStates, state]);
        }
    };

    const toggleLocation = (location: string) => {
        if (localSelectedLocations.includes(location)) {
            setLocalSelectedLocations(localSelectedLocations.filter((l) => l !== location));
        } else {
            setLocalSelectedLocations([...localSelectedLocations, location]);
        }
    };

    const addMetricFilter = () => {
        if (selectedMetricToAdd && !localMetricRanges[selectedMetricToAdd]) {
            setLocalMetricRanges({
                ...localMetricRanges,
                [selectedMetricToAdd]: [null, null]
            });
            setSelectedMetricToAdd('');
        }
    };

    const removeMetricFilter = (metric: string) => {
        const newRanges = { ...localMetricRanges };
        delete newRanges[metric];
        setLocalMetricRanges(newRanges);
    };

    const updateMetricRange = (metric: string, index: 0 | 1, value: string) => {
        const numValue = value === '' ? null : Number(value);
        const currentRange = localMetricRanges[metric] || [null, null];
        const newRange: [number | null, number | null] = [...currentRange];
        newRange[index] = numValue;
        setLocalMetricRanges({
            ...localMetricRanges,
            [metric]: newRange
        });
    };

    // Filter metrics based on selected category AND availability
    const filteredMetrics = METRIC_OPTIONS.filter(opt =>
        opt.category === selectedCategory && availableMetrics.has(opt.value)
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-card border-b border-border rounded-t-xl p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Filter Configuration</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column: Metrics & Sort */}
                    <div className="space-y-6">
                        {/* Metric Selector */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Rank By Metric
                            </label>

                            <div className="space-y-2">
                                {/* Category Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                                        className="w-full flex items-center justify-between p-3 rounded-lg border border-input bg-background hover:bg-secondary/50 transition-colors"
                                    >
                                        <span className="font-medium">
                                            {selectedCategory}
                                        </span>
                                        {isCategoryDropdownOpen ? (
                                            <ChevronUp className="h-4 w-4 opacity-50" />
                                        ) : (
                                            <ChevronDown className="h-4 w-4 opacity-50" />
                                        )}
                                    </button>

                                    <AnimatePresence>
                                        {isCategoryDropdownOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setIsCategoryDropdownOpen(false)}
                                                />
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: -10 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute z-20 top-full left-0 right-0 mt-2 rounded-lg border border-border bg-popover shadow-lg"
                                                >
                                                    <div className="p-1">
                                                        {Object.keys(METRIC_CATEGORIES).map((category) => (
                                                            <div
                                                                key={category}
                                                                className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors ${selectedCategory === category
                                                                    ? 'bg-primary/10 text-primary'
                                                                    : 'hover:bg-secondary'
                                                                    }`}
                                                                onClick={() => {
                                                                    setSelectedCategory(category as MetricCategory);
                                                                    setIsCategoryDropdownOpen(false);
                                                                    if (category === 'Internal Data') {
                                                                        setInternalView('categories');
                                                                    }
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium text-sm">{category}</span>
                                                                </div>
                                                                {selectedCategory === category && (
                                                                    <Check className="h-4 w-4" />
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            </>
                                        )}
                                    </AnimatePresence>
                                </div>


                                {/* Metric List / Drill-down Area */}
                                <div className="border border-border rounded-lg bg-card overflow-hidden flex flex-col relative h-[350px]">

                                    {/* Standard Public Metrics View */}
                                    {!isInternalDataMode && (
                                        <div className="absolute inset-0 p-1 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-left-4 duration-300">
                                            {filteredMetrics.map((option) => (
                                                <div
                                                    key={option.value}
                                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors mb-1 last:mb-0 ${localSortField === option.value
                                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                                        : 'hover:bg-secondary border border-transparent'
                                                        }`}
                                                    onClick={() => setLocalSortField(option.value)}
                                                >
                                                    <span className="font-medium text-sm">{option.label}</span>
                                                    {localSortField === option.value && (
                                                        <Check className="h-4 w-4" />
                                                    )}
                                                </div>
                                            ))}
                                            {filteredMetrics.length === 0 && (
                                                <div className="p-4 text-sm text-muted-foreground text-center">
                                                    No metrics available in this category
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Internal Data Drill-down View */}
                                    {isInternalDataMode && (
                                        <div className="absolute inset-0 flex flex-col">
                                            {/* Drill-down Header - Only show when a category is selected (drill down active) */}
                                            {internalView === 'metrics' && (
                                                <div className="flex items-center gap-2 p-3 border-b border-border bg-secondary/10 shrink-0">
                                                    <button
                                                        onClick={() => setInternalView('categories')}
                                                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                                                    >
                                                        <ArrowLeft className="h-3 w-3" /> Back
                                                    </button>
                                                    <span className="text-sm font-semibold flex-1 text-center truncate">
                                                        {selectedInternalCategory}
                                                    </span>
                                                    <div className="w-10" /> {/* Spacer to balance Back button approx width */}
                                                </div>
                                            )}

                                            {/* Sub-categories List */}
                                            <AnimatePresence mode="wait">
                                                {internalView === 'categories' && (
                                                    <motion.div
                                                        key="categories"
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: -20 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="flex-1 p-1 overflow-y-auto custom-scrollbar"
                                                    >
                                                        {internalCategories.length > 0 ? (
                                                            internalCategories.map((subCat) => (
                                                                <div
                                                                    key={subCat}
                                                                    className="flex items-center justify-between p-3 rounded-md cursor-pointer hover:bg-secondary mb-1 transition-colors group"
                                                                    onClick={() => {
                                                                        setSelectedInternalCategory(subCat);
                                                                        setInternalView('metrics');
                                                                    }}
                                                                >
                                                                    <span className="font-medium text-sm">{subCat}</span>
                                                                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className="p-4 text-center text-muted-foreground text-sm">
                                                                No internal data loaded.
                                                            </div>
                                                        )}
                                                    </motion.div>
                                                )}

                                                {/* Final Metrics List */}
                                                {internalView === 'metrics' && selectedInternalCategory && (
                                                    <motion.div
                                                        key="metrics"
                                                        initial={{ opacity: 0, x: 20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="flex-1 p-1 overflow-y-auto custom-scrollbar"
                                                    >
                                                        {getMetricsForCategory(selectedInternalCategory).map((metric) => {
                                                            // Check if this specific internal metric is selected
                                                            // Key construction logic must match
                                                            let key = '';
                                                            switch (metric) {
                                                                case 'IND': key = 'indDollars'; break;
                                                                case 'DLR': key = 'dlrDollars'; break;
                                                                case 'Market Share': key = 'sharePercentage'; break;
                                                                case 'PAES %': key = 'paesPercent'; break;
                                                                case 'EA Breadth': key = 'eaBreadth'; break;
                                                                case 'HEA Depth': key = 'heaDepth'; break;
                                                                case 'Tech Adoption': key = 'techAdoption'; break;
                                                                default: key = metric.replace(/ /g, '');
                                                            }
                                                            const compositeKey = `internal|${selectedInternalCategory}|${key}`;
                                                            const isSelected = localSortField === compositeKey;

                                                            return (
                                                                <div
                                                                    key={metric}
                                                                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors mb-1 last:mb-0 ${isSelected
                                                                        ? 'bg-primary/10 text-primary border border-primary/20'
                                                                        : 'hover:bg-secondary border border-transparent'
                                                                        }`}
                                                                    onClick={() => handleInternalMetricSelect(metric)}
                                                                >
                                                                    <span className="font-medium text-sm">{metric}</span>
                                                                    {isSelected && (
                                                                        <Check className="h-4 w-4" />
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}

                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Filters */}
                    <div className="space-y-6">
                        {/* State Filter */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    Filter States
                                </label>
                                {localSelectedLocations.length > 0 && localSelectedLocations.length < availableLocations.length && (
                                    <span className="text-xs text-muted-foreground italic">
                                        Clear states to enable
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {displayedStates.map((state) => {
                                    const isSelected = localSelectedStates.length === 0 || localSelectedStates.includes(state);
                                    const isRegionFilterActive = localSelectedLocations.length > 0 && localSelectedLocations.length < availableLocations.length;
                                    const isDisabled = isRegionFilterActive;

                                    return (
                                        <button
                                            key={state}
                                            onClick={() => !isDisabled && toggleState(state)}
                                            disabled={isDisabled}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${isDisabled
                                                ? 'opacity-50 cursor-not-allowed bg-secondary text-muted-foreground border-transparent'
                                                : isSelected
                                                    ? 'bg-primary text-primary-foreground border-primary'
                                                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                                                }`}
                                        >
                                            {state}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {localSelectedStates.length === 0 ? "Showing all applicable states" : `Showing ${localSelectedStates.length} state(s)`}
                            </p>
                        </div>

                        {/* Region Filter */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                    Filter Regions
                                </label>
                                {localSelectedStates.length > 0 && localSelectedStates.length < availableStates.length && (
                                    <span className="text-xs text-muted-foreground italic">
                                        Clear states to enable
                                    </span>
                                )}
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {availableLocations.map((location) => {
                                    const isSelected = localSelectedLocations.length === 0 || localSelectedLocations.includes(location.key);
                                    const isStateFilterActive = localSelectedStates.length > 0 && localSelectedStates.length < availableStates.length;
                                    const isDisabled = isStateFilterActive;

                                    return (
                                        <button
                                            key={location.key}
                                            onClick={() => !isDisabled && toggleLocation(location.key)}
                                            disabled={isDisabled}
                                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border flex items-center gap-3 ${isDisabled
                                                ? 'opacity-50 cursor-not-allowed bg-secondary text-muted-foreground border-transparent'
                                                : isSelected
                                                    ? 'bg-primary/10 border-primary text-foreground'
                                                    : 'bg-background text-muted-foreground border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <div
                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                style={{
                                                    backgroundColor: location.color,
                                                    opacity: isSelected && !isDisabled ? 1 : 0.5,
                                                }}
                                            />
                                            <span>{location.name}</span>
                                            {isSelected && !isDisabled && <Check className="h-3.5 w-3.5 ml-auto text-primary" />}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {localSelectedLocations.length === 0 ? "Showing all regions" : `Showing ${localSelectedLocations.length} region(s)`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Advanced Filtering Section */}
                <div className="border-t border-border">
                    <button
                        onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                        className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">Advanced Filtering</span>
                            {Object.keys(localMetricRanges).length > 0 && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                    {Object.keys(localMetricRanges).length} active
                                </span>
                            )}
                        </div>
                        {isAdvancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    <AnimatePresence>
                        {isAdvancedOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0, overflow: 'hidden' }}
                                animate={{
                                    height: 'auto',
                                    opacity: 1,
                                    transitionEnd: {
                                        overflow: 'visible'
                                    }
                                }}
                                exit={{ height: 0, opacity: 0, overflow: 'hidden' }}
                                transition={{ duration: 0.2 }}
                            >
                                <div className="p-4 bg-secondary/5 space-y-4 border-t border-border">
                                    {/* Add new filter */}
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <button
                                                onClick={() => setIsAddMetricDropdownOpen(!isAddMetricDropdownOpen)}
                                                className="w-full flex items-center justify-between h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            >
                                                <span className={!selectedMetricToAdd ? "text-muted-foreground" : ""}>
                                                    {selectedMetricToAdd
                                                        ? (selectedMetricToAdd.startsWith('internal|')
                                                            ? (() => {
                                                                const parts = selectedMetricToAdd.split('|');
                                                                if (parts.length < 3) return selectedMetricToAdd;
                                                                const key = parts[2];
                                                                const friendlyMap: Record<string, string> = {
                                                                    'indDollars': 'IND',
                                                                    'dlrDollars': 'DLR',
                                                                    'sharePercentage': 'Market Share',
                                                                    'paesPercent': 'PAES %',
                                                                    'eaBreadth': 'EA Breadth',
                                                                    'heaDepth': 'HEA Depth',
                                                                    'techAdoption': 'Tech Adoption'
                                                                };
                                                                const friendlyKey = friendlyMap[key] || key;
                                                                return `${parts[1]} - ${friendlyKey}`;
                                                            })()
                                                            : METRIC_OPTIONS.find(o => o.value === selectedMetricToAdd)?.label)
                                                        : "Select a metric to filter..."}
                                                </span>
                                                {isAddMetricDropdownOpen ? (
                                                    <ChevronUp className="h-4 w-4 opacity-50" />
                                                ) : (
                                                    <ChevronDown className="h-4 w-4 opacity-50" />
                                                )}
                                            </button>

                                            <AnimatePresence>
                                                {isAddMetricDropdownOpen && (
                                                    <>
                                                        <div
                                                            className="fixed inset-0 z-10"
                                                            onClick={() => setIsAddMetricDropdownOpen(false)}
                                                        />
                                                        <motion.div
                                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                            transition={{ duration: 0.2 }}
                                                            className="absolute z-20 bottom-full left-0 right-0 mb-1 max-h-[300px] overflow-y-auto rounded-md border border-border bg-popover shadow-md"
                                                        >
                                                            <div className="p-1">
                                                                {Object.keys(METRIC_CATEGORIES).map((category) => {
                                                                    if (category === 'Internal Data') return null;
                                                                    return (
                                                                        <div key={category}>
                                                                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground sticky top-0 bg-popover/95 backdrop-blur-sm">
                                                                                {category}
                                                                            </div>
                                                                            {METRIC_OPTIONS
                                                                                .filter(opt => opt.category === category && !localMetricRanges[opt.value] && availableMetrics.has(opt.value))
                                                                                .map((option) => (
                                                                                    <div
                                                                                        key={option.value}
                                                                                        className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${selectedMetricToAdd === option.value ? "bg-accent text-accent-foreground" : ""
                                                                                            }`}
                                                                                        onClick={() => {
                                                                                            setSelectedMetricToAdd(option.value);
                                                                                            setIsAddMetricDropdownOpen(false);
                                                                                        }}
                                                                                    >
                                                                                        {option.label}
                                                                                        {selectedMetricToAdd === option.value && (
                                                                                            <Check className="ml-auto h-4 w-4" />
                                                                                        )}
                                                                                    </div>
                                                                                ))}
                                                                        </div>
                                                                    );
                                                                })}

                                                                {internalCategories.length > 0 && (
                                                                    <div key="Internal Data">
                                                                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground sticky top-0 bg-popover/95 backdrop-blur-sm">
                                                                            Internal Data
                                                                        </div>
                                                                        {internalCategories.map(cat => {
                                                                            const metrics = getMetricsForCategory(cat);
                                                                            return metrics.map(metric => {
                                                                                let key = '';
                                                                                switch (metric) {
                                                                                    case 'IND': key = 'indDollars'; break;
                                                                                    case 'DLR': key = 'dlrDollars'; break;
                                                                                    case 'Market Share': key = 'sharePercentage'; break;
                                                                                    case 'PAES %': key = 'paesPercent'; break;
                                                                                    case 'EA Breadth': key = 'eaBreadth'; break;
                                                                                    case 'HEA Depth': key = 'heaDepth'; break;
                                                                                    case 'Tech Adoption': key = 'techAdoption'; break;
                                                                                    default: key = metric.replace(/ /g, '');
                                                                                }
                                                                                const compositeKey = `internal|${cat}|${key}`;
                                                                                if (localMetricRanges[compositeKey]) return null;

                                                                                return (
                                                                                    <div
                                                                                        key={compositeKey}
                                                                                        className={`relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground ${selectedMetricToAdd === compositeKey ? "bg-accent text-accent-foreground" : ""
                                                                                            }`}
                                                                                        onClick={() => {
                                                                                            setSelectedMetricToAdd(compositeKey);
                                                                                            setIsAddMetricDropdownOpen(false);
                                                                                        }}
                                                                                    >
                                                                                        {cat} - {metric}
                                                                                        {selectedMetricToAdd === compositeKey && (
                                                                                            <Check className="ml-auto h-4 w-4" />
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            });
                                                                        })}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    </>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={addMetricFilter}
                                            disabled={!selectedMetricToAdd}
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add
                                        </Button>
                                    </div>

                                    {/* Active filters list */}
                                    <div className="space-y-3">
                                        {Object.entries(localMetricRanges).map(([metric, range]) => {
                                            let label = METRIC_OPTIONS.find(opt => opt.value === metric)?.label || metric;
                                            if (metric.startsWith('internal|')) {
                                                const parts = metric.split('|');
                                                if (parts.length >= 3) {
                                                    const key = parts[2];
                                                    const friendlyMap: Record<string, string> = {
                                                        'indDollars': 'IND',
                                                        'dlrDollars': 'DLR',
                                                        'sharePercentage': 'Market Share',
                                                        'paesPercent': 'PAES %',
                                                        'eaBreadth': 'EA Breadth',
                                                        'heaDepth': 'HEA Depth',
                                                        'techAdoption': 'Tech Adoption'
                                                    };
                                                    const friendlyKey = friendlyMap[key] || key;
                                                    label = `${parts[1]} - ${friendlyKey}`;
                                                }
                                            }
                                            return (
                                                <div key={metric} className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
                                                    <div className="flex-1">
                                                        <div className="text-sm font-medium mb-2">{label}</div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="Min"
                                                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                                value={range[0] ?? ''}
                                                                onChange={(e) => updateMetricRange(metric, 0, e.target.value)}
                                                            />
                                                            <span className="text-muted-foreground text-xs">to</span>
                                                            <input
                                                                type="number"
                                                                placeholder="Max"
                                                                className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                                                value={range[1] ?? ''}
                                                                onChange={(e) => updateMetricRange(metric, 1, e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeMetricFilter(metric)}
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                        {Object.keys(localMetricRanges).length === 0 && (
                                            <p className="text-sm text-muted-foreground text-center py-2">
                                                No active filters. Add a metric above to start filtering.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="bg-secondary/20 border-t border-border rounded-b-xl p-4 flex justify-between items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Filters
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button onClick={handleApply}>
                            Apply Changes
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
