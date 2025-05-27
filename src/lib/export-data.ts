import { getDb } from './db.js';
import path from 'node:path';
import fs from 'node:fs';

const db = getDb();

// Ensure public/data directory exists
const publicDir = path.join(process.cwd(), 'public', 'data');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

try {
    // Fetch party support data
    const partySupportRaw = db.prepare(
        'SELECT agency, date, partyName, supportPercentage FROM PartySupport ORDER BY date DESC, agency'
    ).all();

    // Process party support data
    const partySupportProcessed: { agency: string; date: string; support: { [key: string]: number } }[] = [];
    const tempPartyDataHolder: { [key: string]: { agency: string; date: string; support: { [key: string]: number } } } = {};

    interface PartySupportRow {
    agency: string;
    date: string;
    partyName: string;
    supportPercentage: number;
}

for (const row of partySupportRaw as PartySupportRow[]) {
        const key = `${row.agency}-${row.date}`;
        if (!tempPartyDataHolder[key]) {
            tempPartyDataHolder[key] = {
                agency: row.agency,
                date: row.date,
                support: {},
            };
        }
        const cleanPartyName = row.partyName.replace(/\n/g, ' ').trim();
        tempPartyDataHolder[key].support[cleanPartyName] = row.supportPercentage;
    }

    for (const key in tempPartyDataHolder) {
        partySupportProcessed.push(tempPartyDataHolder[key]);
    }

    // Sort by date descending
    partySupportProcessed.sort((a, b) => {
        const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
        if (dateComparison !== 0) return dateComparison;
        return a.agency.localeCompare(b.agency);
    });

    // Prepare data for chart
    const formattedForChart = partySupportProcessed
        .map((poll) => ({
            date: poll.date,
            agency: poll.agency,
            ...poll.support,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Process data and write to public/data directory
    fs.writeFileSync(
        path.join(publicDir, 'party-support.json'),
        JSON.stringify({ partySupport: partySupportProcessed })
    );

    console.log('Data exported successfully to public/data/party-support.json');
} catch (error) {
    console.error('Error exporting data:', error);
    process.exit(1);
}
