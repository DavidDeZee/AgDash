import { useState, useEffect } from 'react';
import { fetchMarketData } from '../lib/fetchBlobData';

export interface PapeData {
    category: string;
    indDollars?: string;
    dlrDollars?: string;
    sharePercentage?: string;
    eaBreadth?: string;
    heaDepth?: string;
    techAdoption?: string;
    paesPercent?: string;
}

// Map "STATENAME-COUNTYNAME" -> List of Pape data entries
export type PapeDataMap = Record<string, PapeData[]>;

export function usePapeData() {
    const [data, setData] = useState<PapeDataMap>({});
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadAllData() {
            try {
                setLoading(true);
                const { data: rawData, lastModified } = await fetchMarketData();
                const newData: PapeDataMap = {};

                if (lastModified) {
                    // Format date nicely
                    try {
                        const date = new Date(lastModified);
                        const now = new Date();
                        const isToday = date.getDate() === now.getDate() &&
                            date.getMonth() === now.getMonth() &&
                            date.getFullYear() === now.getFullYear();

                        if (isToday) {
                            setLastUpdated(date.toLocaleString('en-US', {
                                hour: 'numeric',
                                minute: 'numeric',
                                hour12: true
                            }));
                        } else {
                            setLastUpdated(date.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                            }));
                        }
                    } catch (e) {
                        setLastUpdated(lastModified);
                    }
                }

                // Convert MarketDataRow[] to PapeDataMap
                // Check if rawData is empty? If fetch fails, it returns [].
                if (rawData.length === 0) {
                    // Maybe fallback to CSV if empty? 
                    // User said "Replace the CSV data loading".
                    // So we accept empty if blob is empty.
                }

                const fmt = (val: number | string | null | undefined) => {
                    if (val === null || val === undefined) return 'N/A';
                    if (typeof val === 'string') {
                        // If it's already a formatted string or "N/A" (though we caught N/A above if null)
                        const parsed = parseFloat(val);
                        if (isNaN(parsed)) return val; // Return original string if not number
                        val = parsed;
                    }
                    // User wants specific rounding.
                    // toLocaleString with maxFractionDigits: 4 handles rounding and commas.
                    return val.toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 4
                    });
                };

                rawData.forEach(row => {
                    const fullState = STATE_MAP[row.State.toUpperCase()];
                    if (!fullState) return;

                    const id = `${fullState}-${row.County.toUpperCase()}`;
                    if (!newData[id]) {
                        newData[id] = [];
                    }

                    newData[id].push({
                        category: row.Category,
                        indDollars: fmt(row.IND_Value),
                        dlrDollars: fmt(row.DLR_Value),
                        sharePercentage: fmt(row.Market_Share_Percent),
                        eaBreadth: fmt(row.EA_Breadth_Percent),
                        heaDepth: fmt(row.HEA_Depth_Percent),
                        techAdoption: fmt(row.Tech_Adoption_Percent),
                        paesPercent: fmt(row.PAES_Percent)
                    });
                });

                setData(newData);
            } catch (err) {
                console.error('Error loading Pape data:', err);
                setError(err instanceof Error ? err.message : 'Unknown error');
            } finally {
                setLoading(false);
            }
        }

        loadAllData();
    }, []);

    return { papeData: data, loading, error, lastUpdated };
}

// State abbreviations mapping
const STATE_MAP: Record<string, string> = {
    'OR': 'OREGON',
    'WA': 'WASHINGTON',
    'ID': 'IDAHO',
    'CA': 'CALIFORNIA',
    'NV': 'NEVADA',
    'MT': 'MONTANA',
};

