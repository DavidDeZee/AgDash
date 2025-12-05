import { X, MapPin, TrendingUp, Sprout, DollarSign, Beef, Milk, Tractor } from 'lucide-react';
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
        const sorted = [...stateCounties].sort((a, b) => (b[key] as number) - (a[key] as number));
        return sorted.findIndex(c => c.id === county.id) + 1;
    };
    //test
    const rankings = {
        farms: getRank('farms'),
        marketValue: getRank('marketValueTotalDollars'),
        cropland: getRank('croplandAcres'),
        irrigated: getRank('irrigatedAcres'),
        cropSales: getRank('cropsSalesDollars'),
        livestockSales: getRank('livestockSalesDollars'),
        cattle: getRank('cattleHead'),
        milkCows: getRank('milkCowsHead'),
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
                        <div className="p-4 bg-secondary/50 rounded-lg space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Farms</p>
                            <p className="text-xl font-bold">{formatNumber(county.farms)}</p>
                            <p className="text-xs text-primary font-medium">#{rankings.farms} in {county.stateName}</p>
                        </div>
                        <div className="p-4 bg-secondary/50 rounded-lg space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Market Value</p>
                            <p className="text-xl font-bold text-yellow-500">{formatCurrencyMillions(county.marketValueTotalDollars)}</p>
                            <p className="text-xs text-primary font-medium">#{rankings.marketValue} in {county.stateName}</p>
                        </div>
                        {/*  MAKE THE UI CHANGE HERE MAKE IT AGGREGATED IN MILLIONS RATHER THAN WHAT IT IS RIGHT NOW. ALSO HAVE THE COUNTIES BOARDER HIGHLIGHT WHEN YOU HOVER OVER IT RATHER THEN IT BEING YELLOW. - MIGUEL  */}

                        <div className="p-4 bg-secondary/50 rounded-lg space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Cropland</p>
                            <p className="text-xl font-bold text-emerald-500">{formatAcres(county.croplandAcres)}</p>
                            <p className="text-xs text-primary font-medium">#{rankings.cropland} in {county.stateName}</p>
                        </div>
                        <div className="p-4 bg-secondary/50 rounded-lg space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">Irrigated</p>
                            <p className="text-xl font-bold text-cyan-500">{formatAcres(county.irrigatedAcres)}</p>
                            <p className="text-xs text-primary font-medium">#{rankings.irrigated} in {county.stateName}</p>
                        </div>
                    </div>

                    {/* Financials Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-yellow-500" />
                            Financial Overview
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border border-border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Crop Sales</span>
                                    <Sprout className="h-4 w-4 text-lime-500" />
                                </div>
                                <p className="text-2xl font-bold">{formatCurrency(county.cropsSalesDollars)}</p>
                                <p className="text-xs text-muted-foreground mt-1">#{rankings.cropSales} in {county.stateName}</p>
                            </div>
                            <div className="border border-border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Livestock Sales</span>
                                    <Beef className="h-4 w-4 text-orange-500" />
                                </div>
                                <p className="text-2xl font-bold">{formatCurrency(county.livestockSalesDollars)}</p>
                                <p className="text-xs text-muted-foreground mt-1">#{rankings.livestockSales} in {county.stateName}</p>
                            </div>
                            <div className="border border-border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Net Cash Income</span>
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                </div>
                                <p className="text-2xl font-bold">{formatCurrency(county.netCashIncomeDollars)}</p>
                            </div>
                            <div className="border border-border rounded-lg p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-muted-foreground">Govt Payments</span>
                                    <DollarSign className="h-4 w-4 text-blue-500" />
                                </div>
                                <p className="text-2xl font-bold">{formatCurrency(county.govPaymentsDollars)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Land Use Section */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-emerald-500" />
                            Land Use
                        </h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-secondary/30 rounded-lg flex justify-between items-center">
                                <span className="text-sm font-medium">Owned Land</span>
                                <span className="text-lg font-bold">{formatAcres(county.landOwnedAcres)}</span>
                            </div>
                            <div className="p-4 bg-secondary/30 rounded-lg flex justify-between items-center">
                                <span className="text-sm font-medium">Rented Land</span>
                                <span className="text-lg font-bold">{formatAcres(county.landRentedAcres)}</span>
                            </div>
                            <div className="pt-2 border-t border-border flex justify-between font-medium">
                                <span>Total Land in Farms</span>
                                <span>{formatAcres(county.landInFarmsAcres)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Livestock & Operations */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Tractor className="h-5 w-5 text-orange-500" />
                            Operations & Livestock
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-secondary/30 rounded-lg p-4 text-center">
                                <Beef className="h-6 w-6 mx-auto mb-2 text-red-500" />
                                <p className="text-sm text-muted-foreground">Cattle Head</p>
                                <p className="text-lg font-bold">{formatNumber(county.cattleHead)}</p>
                                <p className="text-xs text-muted-foreground mt-1">#{rankings.cattle} in {county.stateName}</p>
                            </div>
                            <div className="bg-secondary/30 rounded-lg p-4 text-center">
                                <Milk className="h-6 w-6 mx-auto mb-2 text-pink-500" />
                                <p className="text-sm text-muted-foreground">Milk Cows</p>
                                <p className="text-lg font-bold">{formatNumber(county.milkCowsHead)}</p>
                                <p className="text-xs text-muted-foreground mt-1">#{rankings.milkCows} in {county.stateName}</p>
                            </div>
                            <div className="bg-secondary/30 rounded-lg p-4 text-center">
                                <Sprout className="h-6 w-6 mx-auto mb-2 text-green-500" />
                                <p className="text-sm text-muted-foreground">Veg Harvest Ops</p>
                                <p className="text-lg font-bold">{formatNumber(county.vegHarvestOps)}</p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
