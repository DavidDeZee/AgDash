import { Flame, Info, Filter } from 'lucide-react';
import { Card } from '../ui/Card';
import { useStore } from '../../store/useStore';
import type { EnhancedCountyData, SortField } from '../../types/ag';

interface HeatmapControlProps {
    availableStates: string[];
    allCounties: EnhancedCountyData[];
    onOpenRankingModal: () => void;
}

export function HeatmapControl({ onOpenRankingModal }: HeatmapControlProps) {
    const {
        heatmapMode,
        setHeatmapMode,
        sortField,
        selectedStates,
        selectedLocations,
        metricRanges,
        // resetFilters, // resetFilters not currently used in this component, removing if unused or keeping if needed later? 
        // actually resetFilters IS used effectively if we had a reset button, but we removed it.
        // Wait, I added resetFilters in step 68. But handleReset uses it. And handleReset is unused.
        // So I should remove resetFilters from destructuring too if I remove handleReset.
    } = useStore();

    // Metric Label Lookup
    const getMetricLabel = (field: SortField) => {
        const labels: Record<string, string> = {
            farms: 'Number of Farms',
            croplandAcres: 'Cropland Acres',
            irrigatedAcres: 'Irrigated Acres',
            harvestedCroplandAcres: 'Harvested Cropland',
            marketValueTotalDollars: 'Total Sales',
            cropsSalesDollars: 'Crop Sales',
            livestockSalesDollars: 'Livestock Sales',
            applesAcres: 'Apples',
            wheatAcres: 'Wheat',
            riceAcres: 'Rice',
            hazelnutsAcres: 'Hazelnuts',
            grassSeedAcres: 'Grass Seed',
            cornAcres: 'Corn',
            cornSilageAcres: 'Corn Silage',
            hayAcres: 'Hay',
            haylageAcres: 'Haylage',
            beefCattleHead: 'Beef Cattle',
            dairyCattleHead: 'Dairy Cattle',
            countyName: 'County Name'
        };
        return labels[field] || field;
    };

    const regionNames = {
        'PUGET_SOUND': 'Puget Sound',
        'INLAND_NW': 'Inland NW',
        'NORTHERN_OREGON': 'Northern Oregon',
        'SOUTHERN_OREGON': 'Southern Oregon',
        'SUTTER_BUTTE': 'Sutter Butte',
        'SACRAMENTO': 'Sacramento',
    };

    return (
        <Card className="p-4 border-l-4 border-l-yellow-500 overflow-visible z-10 transition-all duration-300">
            <div className="space-y-4 relative">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Flame className={`h-5 w-5 ${heatmapMode ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                        <span className="font-semibold">Heatmap Mode</span>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Toggle */}
                        <button
                            onClick={() => setHeatmapMode(!heatmapMode)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${heatmapMode ? 'bg-yellow-500' : 'bg-input'
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

                        {/* Filter Button */}
                        <button
                            onClick={onOpenRankingModal}
                            className="w-full flex items-center justify-center gap-2 p-2.5 text-sm font-medium rounded-md border border-input bg-background hover:bg-secondary transition-all hover:border-primary/50 group"
                        >
                            <Filter className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                            <span>Configure Heatmap</span>
                        </button>

                        {/* Detailed Info Tooltip */}
                        <div className="flex gap-2 p-3 bg-primary/5 rounded-md text-xs text-muted-foreground border border-primary/10">
                            <Info className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary/60" />
                            <div className="space-y-1.5 flex-1">
                                <p className="leading-relaxed">
                                    Visualizing <span className="font-semibold text-foreground">{getMetricLabel(sortField)}</span> density across
                                    <span className="font-semibold text-foreground">
                                        {selectedStates.length > 0
                                            ? ` ${selectedStates.length === 1 ? selectedStates[0] : `${selectedStates.length} states`}`
                                            : selectedLocations.length > 0
                                                ? ` ${selectedLocations.map(l => regionNames[l as keyof typeof regionNames]).slice(0, 2).join(' & ')}${selectedLocations.length > 2 ? '...' : ''}`
                                                : " all states"}
                                    </span>.
                                    {Object.keys(metricRanges).length > 0 && " Additional value filters are active."}
                                    {" Darker areas represent higher concentrations."}
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
