
const fs = require('fs');
const path = require('path');

const readJson = (name) => {
    const p = path.join(process.cwd(), 'src/data', name);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
};

const nh = readJson('new-holland-locations.json');
const caseIh = readJson('case-ih-locations.json');
const pape = readJson('pape-locations.json');
const kubota = readJson('kubota-locations.json');
const kioti = readJson('kioti-locations.json');

const getCoords = (f) => f.geometry.coordinates.join(',');

const sets = {
    nh: new Set(nh.features.map(getCoords)),
    caseIh: new Set(caseIh.features.map(getCoords)),
    pape: new Set(pape.features.map(getCoords)),
    kubota: new Set(kubota.features.map(getCoords)),
    kioti: new Set(kioti.features.map(getCoords))
};

console.log('Overlaps:');
let totalOverlaps = 0;

// Check Case IH against New Holland
caseIh.features.forEach(f => {
    const c = getCoords(f);
    if (sets.nh.has(c)) {
        console.log(`Case IH overlaps NH at ${c} - ${f.properties.name}`);
        totalOverlaps++;
    }
});

// Check Case IH against Pape
caseIh.features.forEach(f => {
    const c = getCoords(f);
    if (sets.pape.has(c)) {
        console.log(`Case IH overlaps Pape at ${c} - ${f.properties.name}`);
        totalOverlaps++;
    }
});

// Check NH against Pape
nh.features.forEach(f => {
    const c = getCoords(f);
    if (sets.pape.has(c)) {
        console.log(`NH overlaps Pape at ${c} - ${f.properties.name}`);
        totalOverlaps++;
    }
});

console.log(`Total overlaps found: ${totalOverlaps}`);
