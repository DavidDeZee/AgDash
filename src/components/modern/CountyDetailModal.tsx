import { X, MapPin, Sprout, DollarSign, Beef } from 'lucide-react';
import type { EnhancedCountyData } from '../../types/ag';
import { formatNumber, formatAcres, formatCurrency, formatCurrencyMillions } from '../../lib/format';

interface CountyDetailModalProps {
    county: EnhancedCountyData | null;
    allCounties: EnhancedCountyData[];
    onClose: () => void;
}

export function CountyDetailModal({ county, allCounties, onClose }: CountyDetailModalProps) {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-card border-b border-border p-6 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-lg">
                            <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{county.countyName}</h2>
                            <p className="text-muted-foreground">{county.stateName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-8">

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

                </div>
            </div>
        </div>
    );
}
