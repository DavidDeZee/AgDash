import { useMemo, useState } from 'react';
import { Flame, Info, RotateCcw, ChevronDown, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { useStore } from '../../store/useStore';
import type { EnhancedCountyData } from '../../types/ag';

interface HeatmapControlProps {
    availableStates: string[];
    allCounties: EnhancedCountyData[];
}

export function HeatmapControl({ availableStates, allCounties }: HeatmapControlProps) {
    const {
        heatmapMode,
        heatmapMetric,
        heatmapStateFilter,
        setHeatmapMode,
        setHeatmapMetric,
        setHeatmapStateFilter
    } = useStore();

    const handleReset = () => {
        setHeatmapMetric('croplandAcres');
        setHeatmapStateFilter(null);
    };

    // Filter states based on selected metric
    const displayedStates = useMemo(() => {
        const states = new Set<string>();
        allCounties.forEach(county => {
            const val = county[heatmapMetric as keyof EnhancedCountyData];
            if (typeof val === 'number' && val > 0) {
                states.add(county.stateName);
            }
        });
        const validStateList = Array.from(states).sort();
        return availableStates.filter(s => validStateList.includes(s));
    }, [allCounties, heatmapMetric, availableStates]);

    const metrics = [
        {
            group: 'Crops',
            items: [
                { label: 'Cropland Acres', value: 'croplandAcres' },
                { label: 'Harvested Cropland', value: 'harvestedCroplandAcres' },
                { label: 'Irrigated Acres', value: 'irrigatedAcres' },
                { label: 'Wheat Acres', value: 'wheatAcres' },
                { label: 'Corn Acres', value: 'cornAcres' },
                { label: 'Hay Acres', value: 'hayAcres' },
                { label: 'Grass Seed Acres', value: 'grassSeedAcres' },
                { label: 'Apples Acres', value: 'applesAcres' },
                { label: 'Hazelnuts Acres', value: 'hazelnutsAcres' },
                { label: 'Rice Acres', value: 'riceAcres' }
            ]
        },
        {
            group: 'Livestock',
            items: [
                { label: 'Beef Cattle', value: 'beefCattleHead' },
                { label: 'Dairy Cattle', value: 'dairyCattleHead' }
            ]
        }
    ];

    // Filter metrics based on available data in the selected state
    const availableMetrics = useMemo(() => {
        if (!heatmapStateFilter) return metrics;

        const stateCounties = (allCounties || []).filter(c => c.stateName === heatmapStateFilter);
        if (stateCounties.length === 0) return metrics;

        return metrics.map(group => ({
            ...group,
            items: group.items.filter(item => {
                // Check if ANY county in the state has a value > 0 for this metric
                return stateCounties.some(c => {
                    const val = c[item.value as keyof EnhancedCountyData];
                    return typeof val === 'number' && val > 0;
                });
            })
        })).filter(group => group.items.length > 0);

    }, [metrics, heatmapStateFilter, allCounties]);

    // Check detection for closing dropdowns could be added, but for now simple toggle.
    const [isStateOpen, setIsStateOpen] = useState(false);
    const [isMetricOpen, setIsMetricOpen] = useState(false);

    return (
        <Card className="p-4 border-l-4 border-l-orange-500 overflow-visible z-10">
            <div className="space-y-4 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Flame className={`h-5 w-5 ${heatmapMode ? 'text-orange-500' : 'text-muted-foreground'}`} />
                        <span className="font-semibold">Heatmap Mode</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Reset Button */}
                        {heatmapMode && (
                            <button
                                onClick={handleReset}
                                className="p-1.5 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-orange-500 transition-all animate-in fade-in zoom-in duration-200"
                                title="Reset Settings"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>
                        )}
                        {/* Toggle */}
                        <button
                            onClick={() => setHeatmapMode(!heatmapMode)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${heatmapMode ? 'bg-orange-500' : 'bg-input'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${heatmapMode ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </div>

                {heatmapMode && (
                    <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-200">

                        {/* Custom State Filter Dropdown */}
                        <div className="space-y-1.5 relative">
                            <label className="text-xs font-medium text-muted-foreground">
                                Filter by State
                            </label>
                            <button
                                onClick={() => { setIsStateOpen(!isStateOpen); setIsMetricOpen(false); }}
                                className="w-full flex items-center justify-between p-2 text-sm rounded-md border border-input bg-background hover:bg-secondary/50 transition-colors"
                            >
                                <span className={!heatmapStateFilter ? "text-muted-foreground" : ""}>
                                    {heatmapStateFilter || "All States"}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </button>

                            {isStateOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsStateOpen(false)} />
                                    <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-popover shadow-lg animate-in fade-in zoom-in-95 duration-100">
                                        <div className="p-1">
                                            <button
                                                onClick={() => { setHeatmapStateFilter(null); setIsStateOpen(false); }}
                                                className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-secondary ${!heatmapStateFilter ? 'bg-secondary/50 font-medium' : ''}`}
                                            >
                                                <span>All States</span>
                                                {!heatmapStateFilter && <Check className="h-3 w-3" />}
                                            </button>
                                            {displayedStates.map(state => (
                                                <button
                                                    key={state}
                                                    onClick={() => { setHeatmapStateFilter(state); setIsStateOpen(false); }}
                                                    className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-secondary ${heatmapStateFilter === state ? 'bg-secondary/50 font-medium' : ''}`}
                                                >
                                                    <span>{state}</span>
                                                    {heatmapStateFilter === state && <Check className="h-3 w-3" />}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Custom Metric Dropdown */}
                        <div className="space-y-1.5 relative">
                            <label className="text-xs font-medium text-muted-foreground">
                                Display Metric
                            </label>
                            <button
                                onClick={() => { setIsMetricOpen(!isMetricOpen); setIsStateOpen(false); }}
                                className="w-full flex items-center justify-between p-2 text-sm rounded-md border border-input bg-background hover:bg-secondary/50 transition-colors"
                            >
                                <span>
                                    {availableMetrics.flatMap(g => g.items).find(i => i.value === heatmapMetric)?.label ||
                                        metrics.flatMap(g => g.items).find(i => i.value === heatmapMetric)?.label ||
                                        heatmapMetric}
                                </span>
                                <ChevronDown className="h-4 w-4 opacity-50" />
                            </button>

                            {isMetricOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsMetricOpen(false)} />
                                    <div className="absolute z-20 top-full left-0 right-0 mt-1 max-h-[300px] overflow-y-auto rounded-md border border-border bg-popover shadow-lg animate-in fade-in zoom-in-95 duration-100">
                                        <div className="p-1 space-y-1">
                                            {availableMetrics.map(group => (
                                                <div key={group.group}>
                                                    <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted/30">
                                                        {group.group}
                                                    </div>
                                                    {group.items.map(item => (
                                                        <button
                                                            key={item.value}
                                                            onClick={() => { setHeatmapMetric(item.value); setIsMetricOpen(false); }}
                                                            className={`w-full flex items-center justify-between px-2 py-1.5 text-sm rounded-sm cursor-pointer hover:bg-secondary hover:text-accent-foreground ${heatmapMetric === item.value ? 'bg-primary/10 text-primary font-medium' : ''}`}
                                                        >
                                                            <span>{item.label}</span>
                                                            {heatmapMetric === item.value && <Check className="h-3 w-3" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-2 p-2 bg-primary/5 rounded-md text-xs text-muted-foreground border border-primary/10">
                            <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary/60" />
                            <p>
                                Map shows density of <span className="font-medium text-foreground">{metrics.find(g => g.items.some(i => i.value === heatmapMetric))?.items.find(i => i.value === heatmapMetric)?.label}</span>.
                                Darker colors indicate higher values.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
