import { useState, useEffect } from 'react';
import { X, Check, ArrowUpAZ, ArrowDownAZ, RotateCcw } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';
import type { SortField } from '../../types/ag';

interface RankingConfigurationModalProps {
    isOpen: boolean;
    onClose: () => void;
    availableStates: string[];
}

const METRIC_OPTIONS: { value: SortField; label: string }[] = [
    { value: 'farms', label: 'Number of Farms' },
    { value: 'croplandAcres', label: 'Cropland Acres' },
    { value: 'irrigatedAcres', label: 'Irrigated Acres' },
    { value: 'landInFarmsAcres', label: 'Total Land in Farms' },
    { value: 'harvestedCroplandAcres', label: 'Harvested Cropland' },
    { value: 'marketValueTotalDollars', label: 'Total Sales' },
    { value: 'cropsSalesDollars', label: 'Crop Sales' },

    // Adding these even though they might not be in SortField yet, 
    // we might need to extend SortField if we want to rank by them.
    // For now, sticking to what's in SortField type.
];

export function RankingConfigurationModal({
    isOpen,
    onClose,
    availableStates,
}: RankingConfigurationModalProps) {
    const {
        sortField,
        sortDirection,
        selectedStates,
        selectedLocations,
        setSortField,
        setSortDirection,
        setSelectedStates,
        setSelectedLocations,
    } = useStore();

    // Local state for the modal
    const [localSortField, setLocalSortField] = useState<SortField>(sortField);
    const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>(sortDirection);
    const [localSelectedStates, setLocalSelectedStates] = useState<string[]>(selectedStates);
    const [localSelectedLocations, setLocalSelectedLocations] = useState<string[]>(selectedLocations);

    const availableLocations = [
        { key: 'PUGET_SOUND', name: 'Puget Sound', color: 'hsl(270, 70%, 50%)' },
        { key: 'INLAND_NW', name: 'Inland NW', color: 'hsl(217, 91%, 60%)' },
        { key: 'NORTHERN_OREGON', name: 'Northern Oregon', color: 'hsl(48, 96%, 53%)' },
        { key: 'SOUTHERN_OREGON', name: 'Southern Oregon', color: 'hsl(142, 76%, 36%)' },
        { key: 'SUTTER_BUTTE', name: 'Sutter Butte', color: 'hsl(25, 95%, 53%)' },
        { key: 'SACRAMENTO', name: 'Sacramento', color: 'hsl(195, 70%, 60%)' },
    ];

    // Sync local state with store when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalSortField(sortField);
            setLocalSortDirection(sortDirection);
            setLocalSelectedStates(selectedStates);
            setLocalSelectedLocations(selectedLocations);
        }
    }, [isOpen, sortField, sortDirection, selectedStates, selectedLocations]);

    if (!isOpen) return null;

    const handleApply = () => {
        setSortField(localSortField);
        setSortDirection(localSortDirection);
        setSelectedStates(localSelectedStates);
        setSelectedLocations(localSelectedLocations);
        onClose();
    };

    const handleReset = () => {
        setLocalSelectedStates([]);
        setLocalSelectedLocations([]);
        setLocalSortField('croplandAcres');
        setLocalSortDirection('desc');

        // Apply to store immediately
        setSelectedStates([]);
        setSelectedLocations([]);
        setSortField('croplandAcres');
        setSortDirection('desc');
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-card border-b border-border p-4 flex items-center justify-between">
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
                            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {METRIC_OPTIONS.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${localSortField === option.value
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                            : 'border-border hover:bg-secondary/50'
                                            }`}
                                        onClick={() => setLocalSortField(option.value)}
                                    >
                                        <span className="font-medium">{option.label}</span>
                                        {localSortField === option.value && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sort Direction */}
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                Sort Order
                            </label>
                            <div className="flex bg-secondary/30 p-1 rounded-lg">
                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${localSortDirection === 'desc'
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    onClick={() => setLocalSortDirection('desc')}
                                >
                                    <ArrowDownAZ className="h-4 w-4" />
                                    Highest First
                                </button>
                                <button
                                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${localSortDirection === 'asc'
                                        ? 'bg-background shadow-sm text-foreground'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    onClick={() => setLocalSortDirection('asc')}
                                >
                                    <ArrowUpAZ className="h-4 w-4" />
                                    Lowest First
                                </button>
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
                                        Clear regions to enable
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {availableStates.map((state) => {
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
                                {localSelectedStates.length === 0 ? "Showing all states" : `Showing ${localSelectedStates.length} state(s)`}
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

                {/* Footer */}
                <div className="bg-secondary/20 border-t border-border p-4 flex justify-between items-center gap-3">
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
