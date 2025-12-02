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
    { value: 'livestockSalesDollars', label: 'Livestock Sales' },
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
        setSortField,
        setSortDirection,
        setSelectedStates,
    } = useStore();

    // Local state for the modal
    const [localSortField, setLocalSortField] = useState<SortField>(sortField);
    const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>(sortDirection);
    const [localSelectedStates, setLocalSelectedStates] = useState<string[]>(selectedStates);

    // Sync local state with store when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalSortField(sortField);
            setLocalSortDirection(sortDirection);
            setLocalSelectedStates(selectedStates);
        }
    }, [isOpen, sortField, sortDirection, selectedStates]);

    if (!isOpen) return null;

    const handleApply = () => {
        setSortField(localSortField);
        setSortDirection(localSortDirection);
        setSelectedStates(localSelectedStates);
        onClose();
    };

    const handleReset = () => {
        setLocalSelectedStates([]);
        setLocalSortField('croplandAcres');
        setLocalSortDirection('desc');
    };

    const toggleState = (state: string) => {
        if (localSelectedStates.includes(state)) {
            setLocalSelectedStates(localSelectedStates.filter((s) => s !== state));
        } else {
            setLocalSelectedStates([...localSelectedStates, state]);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="bg-card border-b border-border p-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold">Configure Rankings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Metric Selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Rank By Metric
                        </label>
                        <div className="grid grid-cols-1 gap-2">
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

                    {/* State Filter */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                            Filter States
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {availableStates.map((state) => {
                                const isSelected = localSelectedStates.length === 0 || localSelectedStates.includes(state);
                                return (
                                    <button
                                        key={state}
                                        onClick={() => toggleState(state)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${isSelected
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
                </div>

                {/* Footer */}
                <div className="bg-secondary/20 border-t border-border p-4 flex justify-between items-center gap-3">
                    <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground hover:text-foreground">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset Defaults
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
