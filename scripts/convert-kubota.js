import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INPUT_FILE = path.join(__dirname, '../kubota_dealers_geocoded.csv');
const OUTPUT_FILE = path.join(__dirname, '../src/data/kubota-locations.json');

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const obj = {};
        let currentLine = line;
        let fieldIndex = 0;

        while (currentLine.length > 0 && fieldIndex < headers.length) {
            let value;
            if (currentLine.startsWith('"')) {
                // Quoted field
                const nextQuote = currentLine.indexOf('"', 1);
                if (nextQuote === -1) {
                    // Broken CSV line?
                    value = currentLine;
                    currentLine = "";
                } else {
                    value = currentLine.substring(1, nextQuote);
                    currentLine = currentLine.substring(nextQuote + 1);
                    if (currentLine.startsWith(',')) {
                        currentLine = currentLine.substring(1);
                    }
                }
            } else {
                // Unquoted field
                const nextComma = currentLine.indexOf(',');
                if (nextComma === -1) {
                    value = currentLine;
                    currentLine = "";
                } else {
                    value = currentLine.substring(0, nextComma);
                    currentLine = currentLine.substring(nextComma + 1);
                }
            }
            obj[headers[fieldIndex]] = value.trim();
            fieldIndex++;
        }
        result.push(obj);
    }
    return result;
}

try {
    const csvData = fs.readFileSync(INPUT_FILE, 'utf8');
    const records = parseCSV(csvData);

    const features = records.filter(r => r.Latitude && r.Longitude).map(record => {
        return {
            type: "Feature",
            properties: {
                name: record["Dealer Name"],
                address: `${record["Street Address"]}, ${record["City"]}, ${record["State/Province"]} ${record["ZIP/Postal Code"]}`,
                type: "Kubota Dealer",
                phone: "(555) 000-0000" // Placeholder as not in CSV
            },
            geometry: {
                type: "Point",
                coordinates: [
                    parseFloat(record.Longitude),
                    parseFloat(record.Latitude)
                ]
            }
        };
    });

    const geojson = {
        type: "FeatureCollection",
        features: features
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(geojson, null, 4));
    console.log(`Successfully converted ${features.length} locations to ${OUTPUT_FILE}`);

} catch (err) {
    console.error('Error converting file:', err);
    process.exit(1);
}
