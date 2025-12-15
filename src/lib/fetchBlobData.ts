import * as XLSX from 'xlsx';

export interface MarketDataRow {
    State: string;
    County: string;
    Category: string;
    IND_Value?: number | string | null;
    // Previous logic in my script was careful about quotes.
    // The logic requested in prompt:
    // "Clean numeric values... remove $ , space... convert missing to 0"
    // "Output format matches combined_agricultural_data.csv"
    // I will follow the user's provided snippet logic but ensure it matches the robustness of my previous script (stripping quotes).
    DLR_Value?: number | null;
    Market_Share_Percent?: number | null;
    EA_Breadth_Percent?: number | null;
    HEA_Depth_Percent?: number | null;
    Tech_Adoption_Percent?: number | null;
    PAES_Percent?: number | null;
}

export async function fetchMarketData(): Promise<{ data: MarketDataRow[], lastModified: string | null }> {
    try {
        // Using the user-provided Blob URL
        // Using the user-provided Blob URL with cache-busting timestamp and no-store
        const response = await fetch(`https://pcbbs7db0jxhf6ac.public.blob.vercel-storage.com/market-data-v2.xlsx?t=${Date.now()}`, {
            cache: 'no-store'
        });

        if (!response.ok) {
            console.log('No data file found in blob storage yet');
            return { data: [], lastModified: null };
        }

        const lastModified = response.headers.get('Last-Modified');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);

        const allData: MarketDataRow[] = [];

        // Process market share sheets
        const marketShareSheets = ['< 50 EHP', '50 < 100 EHP', 'MID HAY', 'LARGE AG', 'CCE'];

        for (const sheetName of marketShareSheets) {
            if (!workbook.SheetNames.includes(sheetName)) continue;

            // Use raw: false to get formatted strings (catch dashes that are really 0s in Excel)
            const sheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

            // Headers are expected in Row 2 (Index 1) based on user spec
            // But we should verify. 
            const headerRowIndex = 1;
            const headerRow = rawData[headerRowIndex] as any[];

            if (!headerRow) continue;

            // Dynamic Column Finding
            const findIdx = (keywords: string[]) =>
                headerRow.findIndex((h: any) => h && keywords.some(k => String(h).toUpperCase().includes(k)));

            // Fallbacks: If header search fails, default to 1 and 2 (standard template)
            let indIdx = findIdx(['IND', 'INDUSTRY']);
            let dlrIdx = findIdx(['DLR', 'DEALER']);

            if (indIdx === -1) indIdx = 1;
            if (dlrIdx === -1) dlrIdx = 2;

            // Skip first 2 rows (title and headers), process from row 3
            // Check validation: User says "Row 2 has headers". Index 0=Row1, Index 1=Row2. Data starts Index 2 (Row 3).
            for (let i = 2; i < rawData.length; i++) {
                const row = rawData[i] as any[];
                if (!row || !row[0]) continue;

                // Split "STATE, County" into separate fields
                const location = String(row[0]).trim().replace(/^"|"$/g, '');

                if (location.includes('Total')) continue;

                let state = '';
                let county = '';

                if (location.includes(',')) {
                    const parts = location.split(',');
                    if (parts.length >= 2) {
                        state = parts[0].trim();
                        county = parts[1].trim();
                    }
                }

                if (!state && !county) continue;

                // Clean numeric values
                const cleanNum = (val: any): number | null => {
                    if (val === undefined || val === null) return null;
                    // With raw: false, val is likely string. But if number checks slip through:
                    if (typeof val === 'number') return val;

                    let s = String(val).trim();

                    // Explicit dash check (Excel accounting format often uses "-")
                    if (s === '-' || s === '–' || s === '—') return null;

                    // Now strip non-numeric chars (except dot and minus)
                    s = s.replace(/[$,\s]/g, '');

                    // Check again for empty or just dash after stripping
                    if (!s || s === '-' || s === '–') return null;

                    const n = parseFloat(s);
                    // If it's NaN, it's truly garbage or text -> return null? 
                    // Previously we returned 0. 
                    // User wants "Data Not Available" for dashes. 
                    // If it's "abc", effectively "Data Not Available" is better than 0.
                    if (isNaN(n)) return null;

                    // Round to 4 decimals for currency/values
                    return Math.round((n + Number.EPSILON) * 10000) / 10000;
                };

                const indValue = cleanNum(row[indIdx]);
                const dlrValue = cleanNum(row[dlrIdx]);

                // Calculate market share percentage
                let marketShare: number | null = 0;
                if (dlrValue !== null && indValue !== null && indValue !== 0) {
                    const rawShare = (dlrValue / indValue) * 100;
                    marketShare = Math.round((rawShare + Number.EPSILON) * 10000) / 10000;
                } else if (dlrValue === null || indValue === null) {
                    marketShare = null;
                }

                // Debug logging for Wheeler
                if (county.toUpperCase() === 'WHEELER' && state.toUpperCase() === 'OR') {
                    console.log(`[DEBUG] Found Wheeler (OR) in ${sheetName}:`, {
                        indRaw: row[indIdx],
                        dlrRaw: row[dlrIdx],
                        indClean: indValue,
                        dlrClean: dlrValue
                    });
                }

                allData.push({
                    State: state,
                    County: county,
                    Category: sheetName,
                    IND_Value: indValue,
                    DLR_Value: dlrValue,
                    Market_Share_Percent: marketShare !== null ? marketShare : undefined
                });
            }
        }

        // Process PAES sheet (different format)
        if (workbook.SheetNames.includes('PAES')) {
            const sheet = workbook.Sheets['PAES'];
            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

            // Skip title row, process from row 2 (PAES has headers in row 2)? 
            // Wait, User instructions Step 4: "PAES sheet ... Output format ... "
            // User snippet for PAES: `for (let i = 2; i < rawData.length; i++)`
            // This implies skipping 2 rows (Title, Headers).
            // But standard PAES usually has headers in Row 2.
            // So data starts Row 3 (Index 2). This matches loop `let i = 2`.

            for (let i = 2; i < rawData.length; i++) {
                const row = rawData[i] as any[];
                if (!row || !row[0]) continue;

                // PAES Sheet cols: State, County, EA%, HEA%, Tech%, PAES%
                const state = String(row[0]).trim().replace(/^"|"$/g, '');
                const county = String(row[1]).trim().replace(/^"|"$/g, '');

                if (state.includes('Total') || county.includes('Total')) continue;

                // For percentages, user said "Remove percentage symbols".
                // If they are raw numbers from Excel (0.XX), we might need * 100 if we want 0-100 scale.
                // My previous verified logic was: Trust the value if it looks like 203.88.
                // If it looks like 0.5, it's ambiguous.
                // The user snippet `parseFloat(row[2])` just reads it.
                // I will stick to simple read, but maybe apply `cleanNum`.

                // NOTE: User's provided snippet used `parseFloat(row[2])`.
                // I will use that but add safety against non-numbers.

                // Need to define cleanNum here or reuse? 
                // Copy-paste cleaner for safety within scope or move out. 
                // Moving cleaner out is better but strict single-file edit rules...
                // I'll redefine it briefly to be safe.
                const cleanPaes = (val: any): number | null => {
                    if (val === undefined || val === null) return null;
                    let s = String(val).trim();
                    if (s === '-' || s === '–') return null;
                    s = s.replace(/[$,\s%]/g, ''); // Remove % too for PAES
                    if (!s || s === '-') return null;
                    const n = parseFloat(s);
                    if (isNaN(n)) return null;
                    return Math.round((n + Number.EPSILON) * 10000) / 10000;
                };

                // NOTE: User's provided snippet used `parseFloat(row[2])`.
                // I will use cleanPaes to handle dashes.

                allData.push({
                    State: state,
                    County: county,
                    Category: 'PAES',
                    EA_Breadth_Percent: cleanPaes(row[2]) ?? undefined,
                    HEA_Depth_Percent: cleanPaes(row[3]) ?? undefined,
                    Tech_Adoption_Percent: cleanPaes(row[4]) ?? undefined,
                    PAES_Percent: cleanPaes(row[5]) ?? undefined
                });
            }
        }

        return { data: allData, lastModified };
    } catch (error) {
        console.error('Error fetching blob data:', error);
        return { data: [], lastModified: null };
    }
}
