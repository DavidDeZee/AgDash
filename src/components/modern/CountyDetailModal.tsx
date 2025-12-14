import { useEffect, useState } from 'react';
import { X, MapPin, Sprout, DollarSign, Beef, Plus, Minus, Building2, Table } from 'lucide-react';
import type { EnhancedCountyData } from '../../types/ag';
import type { PapeDataMap } from '../../hooks/usePapeData';
import { formatNumber, formatAcres, formatCurrency, formatCurrencyMillions } from '../../lib/format';
import { useStore } from '../../store/useStore';
import { Button } from '../ui/Button';

interface CountyDetailModalProps {
    county: EnhancedCountyData | null;
    allCounties: EnhancedCountyData[];
    papeData: PapeDataMap;
    lastUpdated?: string | null;
    onClose: () => void;
}

export function CountyDetailModal({ county, allCounties, papeData, lastUpdated, onClose }: CountyDetailModalProps) {
    const { comparisonCounties, addToComparison, removeFromComparison } = useStore();
    const [activeTab, setActiveTab] = useState<'public' | 'pape'>('public');

    // Reset tab when county changes
    useEffect(() => {
        if (county) {
            setActiveTab('public');
        }
    }, [county]);

    const isInComparison = county ? comparisonCounties.some(c => c.id === county.id) : false;
    const canAddToComparison = comparisonCounties.length < 5;

    // Handle Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (county) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [county, onClose]);

    if (!county) return null;

    // Calculate rankings and max values for the state
    const stateCounties = allCounties.filter(c => c.stateName === county.stateName);

    const getRank = (key: keyof EnhancedCountyData) => {
        // Filter out counties with null values for this key
        const validStateCounties = stateCounties.filter(c => c[key] !== null);
        const sorted = [...validStateCounties].sort((a, b) => ((b[key] as number) || 0) - ((a[key] as number) || 0));
        const index = sorted.findIndex(c => c.id === county.id);

        if (index === -1) return null; // Current county doesn't have this metric or not found
        return index + 1;
    };
    //test
    const rankings = {
        farms: getRank('farms'),
        marketValue: getRank('marketValueTotalDollars'),
        cropland: getRank('croplandAcres'),
        irrigated: getRank('irrigatedAcres'),
        cropSales: getRank('cropsSalesDollars'),
        livestockSales: getRank('livestockSalesDollars'),
        cattle: getRank('beefCattleHead'),
        milkCows: getRank('dairyCattleHead'),
        // Crop-specific rankings
        wheat: getRank('wheatAcres'),
        hay: getRank('hayAcres'),
        haylage: getRank('haylageAcres'),
        grassSeed: getRank('grassSeedAcres'),
        corn: getRank('cornAcres'),
        cornSilage: getRank('cornSilageAcres'),
        hazelnuts: getRank('hazelnutsAcres'),
        apples: getRank('applesAcres'),
        rice: getRank('riceAcres'),
    };



    const displayRank = (rank: number | null) => {
        if (rank === null || rank > 10) return null;
        return <span className="text-xs text-primary font-medium">#{rank} in {county.stateName}</span>;
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="shrink-0 bg-card border-b border-border p-6 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{county.countyName}</h2>
                            <p className="text-muted-foreground">{county.stateName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={isInComparison ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => {
                                if (isInComparison) {
                                    removeFromComparison(county.id);
                                } else if (canAddToComparison) {
                                    addToComparison(county);
                                }
                            }}
                            disabled={!isInComparison && !canAddToComparison}
                            className="flex items-center gap-1.5"
                        >
                            {isInComparison ? (
                                <>
                                    <Minus className="h-4 w-4" />
                                    <span>Remove</span>
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4" />
                                    <span>Compare</span>
                                </>
                            )}
                        </Button>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-secondary rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>


                {/* Tabs */}
                <div className="shrink-0 border-b border-border">
                    <div className="w-full relative flex bg-secondary/30 overflow-hidden">
                        {/* Background slider animation */}
                        <div
                            className="absolute inset-y-0 w-1/2 rounded-xl bg-background shadow-sm transition-all duration-300 ease-out"
                            style={{
                                left: activeTab === 'public' ? '0' : '50%',
                            }}
                        />

                        <button
                            onClick={() => setActiveTab('public')}
                            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'public' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Sprout className="h-4 w-4" />
                            Public Data
                        </button>
                        <button
                            onClick={() => setActiveTab('pape')}
                            className={`flex-1 relative z-10 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors duration-200 ${activeTab === 'pape' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <Building2 className="h-4 w-4" />
                            Papé Internal Data
                        </button>
                    </div>

                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {activeTab === 'public' ? (
                        <>
                            {/* Key Metrics Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {county.farms !== null && (
                                    <div className="p-4 bg-secondary/50 rounded-lg space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Farms</p>
                                        <p className="text-xl font-bold">{formatNumber(county.farms)}</p>
                                        {displayRank(rankings.farms)}
                                    </div>
                                )}
                                {county.marketValueTotalDollars !== null && (
                                    <div className="p-4 bg-secondary/50 rounded-lg space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Market Value</p>
                                        <p className="text-xl font-bold text-yellow-500">{formatCurrencyMillions(county.marketValueTotalDollars)}</p>
                                        {displayRank(rankings.marketValue)}
                                    </div>
                                )}
                                {county.croplandAcres !== null && (
                                    <div className="p-4 bg-secondary/50 rounded-lg space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Cropland</p>
                                        <p className="text-xl font-bold text-emerald-500">{formatAcres(county.croplandAcres)}</p>
                                        {displayRank(rankings.cropland)}
                                    </div>
                                )}
                                {county.irrigatedAcres !== null && (
                                    <div className="p-4 bg-secondary/50 rounded-lg space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Irrigated</p>
                                        <p className="text-xl font-bold text-cyan-500">{formatAcres(county.irrigatedAcres)}</p>
                                        {displayRank(rankings.irrigated)}
                                    </div>
                                )}
                            </div>


                            {/* Financials Section */}
                            {(county.cropsSalesDollars !== null || county.livestockSalesDollars !== null || county.govPaymentsDollars !== null) && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-yellow-500" />
                                        Financial Overview
                                    </h3>

                                    {/* Sales Icons */}
                                    <div className="grid grid-cols-2 gap-4 mb-6">
                                        {county.cropsSalesDollars !== null && (
                                            <div className="flex flex-col items-center justify-center p-3 bg-secondary/30 rounded-xl border border-border">
                                                <div className="p-2 bg-lime-500/10 rounded-full mb-2">
                                                    <Sprout className="h-5 w-5 text-lime-600" />
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Crop Sales</p>
                                                <p className="text-lg font-bold">{formatCurrency(county.cropsSalesDollars)}</p>
                                                {displayRank(rankings.cropSales)}
                                            </div>
                                        )}
                                        {county.livestockSalesDollars !== null && (
                                            <div className="flex flex-col items-center justify-center p-3 bg-secondary/30 rounded-xl border border-border">
                                                <div className="p-2 bg-orange-500/10 rounded-full mb-2">
                                                    <Beef className="h-5 w-5 text-orange-600" />
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Livestock Sales</p>
                                                <p className="text-lg font-bold">{formatCurrency(county.livestockSalesDollars)}</p>
                                                {displayRank(rankings.livestockSales)}
                                            </div>
                                        )}
                                    </div>

                                    {/* Other Financials List */}
                                    <div className="space-y-2">
                                        {county.govPaymentsDollars !== null && (
                                            <div className="flex justify-between items-center py-1">
                                                <div className="flex items-center gap-2">
                                                    <DollarSign className="h-4 w-4 text-blue-500" />
                                                    <span className="text-sm text-foreground">Govt Payments</span>
                                                </div>
                                                <p className="font-bold">{formatCurrency(county.govPaymentsDollars)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Split Crops and Livestock Sections */}
                            <div className="flex flex-col gap-8">
                                {/* Major Crops Section */}
                                {(county.wheatAcres !== null || county.hayAcres !== null || county.haylageAcres !== null || county.grassSeedAcres !== null || county.cornAcres !== null || county.cornSilageAcres !== null || county.hazelnutsAcres !== null || county.applesAcres !== null || county.riceAcres !== null) && (
                                    <div>
                                        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                            <Sprout className="h-6 w-6 text-green-600" />
                                            Major Crops
                                        </h3>
                                        <div className="space-y-2">
                                            {county.wheatAcres !== null && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-muted-foreground">Wheat</span>
                                                    <div className="flex items-center gap-2">
                                                        {displayRank(rankings.wheat)}
                                                        <span className="font-medium">{formatAcres(county.wheatAcres)}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {county.hayAcres !== null && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-muted-foreground">Hay</span>
                                                    <div className="flex items-center gap-2">
                                                        {displayRank(rankings.hay)}
                                                        <span className="font-medium">{formatAcres(county.hayAcres)}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {county.haylageAcres !== null && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-muted-foreground">Haylage</span>
                                                    <div className="flex items-center gap-2">
                                                        {displayRank(rankings.haylage)}
                                                        <span className="font-medium">{formatAcres(county.haylageAcres)}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {county.grassSeedAcres !== null && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-muted-foreground">Grass Seed</span>
                                                    <div className="flex items-center gap-2">
                                                        {displayRank(rankings.grassSeed)}
                                                        <span className="font-medium">{formatAcres(county.grassSeedAcres)}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {county.cornAcres !== null && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-muted-foreground">Corn (Grain)</span>
                                                    <div className="flex items-center gap-2">
                                                        {displayRank(rankings.corn)}
                                                        <span className="font-medium">{formatAcres(county.cornAcres)}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {county.cornSilageAcres !== null && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-muted-foreground">Corn (Silage)</span>
                                                    <div className="flex items-center gap-2">
                                                        {displayRank(rankings.cornSilage)}
                                                        <span className="font-medium">{formatAcres(county.cornSilageAcres)}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {county.hazelnutsAcres !== null && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-muted-foreground">Hazelnuts</span>
                                                    <div className="flex items-center gap-2">
                                                        {displayRank(rankings.hazelnuts)}
                                                        <span className="font-medium">{formatAcres(county.hazelnutsAcres)}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {county.applesAcres !== null && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-muted-foreground">Apples</span>
                                                    <div className="flex items-center gap-2">
                                                        {displayRank(rankings.apples)}
                                                        <span className="font-medium">{formatAcres(county.applesAcres)}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {county.riceAcres !== null && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-muted-foreground">Rice</span>
                                                    <div className="flex items-center gap-2">
                                                        {displayRank(rankings.rice)}
                                                        <span className="font-medium">{formatAcres(county.riceAcres)}</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Livestock Section */}
                                {(county.beefCattleHead !== null || county.dairyCattleHead !== null) && (
                                    <div>
                                        <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                                            <Beef className="h-6 w-6 text-orange-600" />
                                            Livestock
                                        </h3>
                                        <div className="space-y-2">
                                            {county.beefCattleHead !== null && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-muted-foreground">Beef Cattle</span>
                                                    <div className="flex items-center gap-2">
                                                        {displayRank(rankings.cattle)}
                                                        <span className="font-medium">{formatNumber(county.beefCattleHead)} heads</span>
                                                    </div>
                                                </div>
                                            )}
                                            {county.dairyCattleHead !== null && (
                                                <div className="flex justify-between items-center py-1">
                                                    <span className="text-sm text-muted-foreground">Dairy Cattle</span>
                                                    <div className="flex items-center gap-2">
                                                        {displayRank(rankings.milkCows)}
                                                        <span className="font-medium">{formatNumber(county.dairyCattleHead)} heads</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-300">
                            {papeData[county.id] && papeData[county.id].length > 0 ? (
                                <div className="space-y-8">
                                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                                        <Table className="h-5 w-5 text-primary" />
                                        <h3 className="text-lg font-semibold">Papé Internal Data</h3>
                                    </div>

                                    <div className="grid gap-8">
                                        {papeData[county.id].map((item, i) => (
                                            <div key={i} className="space-y-3">
                                                {/* Category Header */}
                                                <h4 className="text-md font-bold text-foreground flex items-center gap-2">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary/70"></div>
                                                    {item.category}
                                                </h4>

                                                {/* KPI List */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 pl-4">
                                                    {/* IND Value */}
                                                    {item.indDollars && item.indDollars !== 'N/A' && (
                                                        <div className="flex justify-between items-center py-1 border-b border-border/40 hover:bg-secondary/20 px-2 rounded-sm transition-colors">
                                                            <span className="text-sm text-muted-foreground">IND Value</span>
                                                            <span className="font-medium text-foreground">${item.indDollars}</span>
                                                        </div>
                                                    )}
                                                    {item.dlrDollars && item.dlrDollars !== 'N/A' && (
                                                        <div className="flex justify-between items-center py-1 border-b border-border/40 hover:bg-secondary/20 px-2 rounded-sm transition-colors">
                                                            <span className="text-sm text-muted-foreground">DLR Value</span>
                                                            <span className="font-medium text-foreground">${item.dlrDollars}</span>
                                                        </div>
                                                    )}
                                                    {/* Market Share (Prioritize explicit marketShare column if valid, but we stored it in sharePercentage fallback? No, let's use the explicit fields if we want, but sharePercentage covers it. Actually, wait. The valid columns for this category in CSV should strictly be used. 
                                                    In our parser:
                                                        indDollars = value from col 3
                                                        sharePercentage = fallback main share
                                                    We should check if marketshare was originally present.
                                                    Actually, let's use the specific fields if they exist.
                                                    If `item.sharePercentage` exists and it is NOT already covered by paesPercent, it's Market Share.
                                                     */}
                                                    {/* Market Share: show if it's generic market share */}
                                                    {item.sharePercentage && item.sharePercentage !== 'N/A' && (item.paesPercent === 'N/A' || !item.paesPercent) && (
                                                        <div className="flex justify-between items-center py-1 border-b border-border/40 hover:bg-secondary/20 px-2 rounded-sm transition-colors">
                                                            <span className="text-sm text-muted-foreground">Market Share</span>
                                                            <span className="font-bold text-primary">{item.sharePercentage}%</span>
                                                        </div>
                                                    )}

                                                    {/* PAES Specifics */}
                                                    {item.paesPercent && item.paesPercent !== 'N/A' && (
                                                        <div className="flex justify-between items-center py-1 border-b border-border/40 hover:bg-secondary/20 px-2 rounded-sm transition-colors">
                                                            <span className="text-sm text-muted-foreground">PAES %</span>
                                                            <span className="font-bold text-primary">{item.paesPercent}%</span>
                                                        </div>
                                                    )}
                                                    {item.eaBreadth && item.eaBreadth !== 'N/A' && (
                                                        <div className="flex justify-between items-center py-1 border-b border-border/40 hover:bg-secondary/20 px-2 rounded-sm transition-colors">
                                                            <span className="text-sm text-muted-foreground">EA Breadth</span>
                                                            <span className="font-medium text-foreground">{item.eaBreadth}%</span>
                                                        </div>
                                                    )}
                                                    {item.heaDepth && item.heaDepth !== 'N/A' && (
                                                        <div className="flex justify-between items-center py-1 border-b border-border/40 hover:bg-secondary/20 px-2 rounded-sm transition-colors">
                                                            <span className="text-sm text-muted-foreground">HEA Depth</span>
                                                            <span className="font-medium text-foreground">{item.heaDepth}%</span>
                                                        </div>
                                                    )}
                                                    {item.techAdoption && item.techAdoption !== 'N/A' && (
                                                        <div className="flex justify-between items-center py-1 border-b border-border/40 hover:bg-secondary/20 px-2 rounded-sm transition-colors">
                                                            <span className="text-sm text-muted-foreground">Tech Adoption</span>
                                                            <span className="font-medium text-foreground">{item.techAdoption}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="p-4 bg-muted/30 rounded-lg text-xs text-muted-foreground mt-8 flex justify-between items-center">
                                        <p>Internal data sourced from Papé Group reports.</p>
                                        {lastUpdated && <p>Last updated: {lastUpdated}</p>}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                                    <div className="p-3 bg-secondary rounded-full">
                                        <Table className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <p className="text-muted-foreground">No internal data available for {county.countyName} County.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}
