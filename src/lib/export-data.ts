import path from 'node:path';
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';

// Ensure public/data directory exists
const publicDir = path.join(process.cwd(), 'public', 'data');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// CSV 파일의 실제 컬럼명과 표시용 정당 이름 매핑
const partyData = [
  { csvName: '더불어민주당', displayName: '더불어민주당' },
  { csvName: '국민의힘', displayName: '국민의힘' },
  { csvName: '조국혁신당', displayName: '조국혁신당' },
  { csvName: '개혁신당', displayName: '개혁신당' },
  { csvName: '진보당', displayName: '진보당' },
  { csvName: '기타정당', displayName: '기타정당' },
  { csvName: '지지정당\n없음', displayName: '지지정당 없음' },
  { csvName: '모름/\n무응답', displayName: '모름/무응답' }
];

try {
    // Read and parse the CSV file
    const csvFilePath = 'data/party.csv';
    const fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' });
    
    const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    // Process party support data
    const partySupportProcessed: { agency: string; date: string; support: { [key: string]: number } }[] = [];
    const tempPartyDataHolder: { [key: string]: { agency: string; date: string; support: { [key: string]: number } } } = {};

    for (const record of records) {
        const agency = record['조사기관'];
        let rawDate = record['조사일자'];

        if (!agency || !rawDate) {
            console.warn('Skipping record due to missing agency or date:', record);
            continue;
        }

        // 날짜 형식 변환 (YY.MM.DD.~DD. 또는 YY.MM.DD. -> YYYY-MM-DD)
        let formattedDate = '';
        try {
            rawDate = String(rawDate).trim();
            const yearPrefix = '20';
            let yearStr, monthStr, dayStr;

            if (rawDate.includes('~')) {
                const parts = rawDate.split('~');
                const startDatePart = parts[0]; // e.g., '25.05.16.'
                const endDatePart = parts[1];   // e.g., '18.' or '05.18.'

                const startDateDetails = startDatePart.split('.').filter(Boolean);
                yearStr = startDateDetails[0];
                monthStr = startDateDetails[1];

                const endDateDetails = endDatePart.split('.').filter(Boolean);
                if (endDateDetails.length === 1) { // e.g., '18'
                    dayStr = endDateDetails[0];
                } else if (endDateDetails.length >= 2) { // e.g., '05.18' (월.일) - 월은 시작일의 월을 따름
                    dayStr = endDateDetails[1]; // 일
                }
            } else {
                const dateParts = rawDate.split('.').filter(Boolean);
                yearStr = dateParts[0];
                monthStr = dateParts[1];
                dayStr = dateParts[2];
            }
            
            if (yearStr && monthStr && dayStr) {
                formattedDate = `${yearPrefix}${yearStr}-${monthStr.padStart(2, '0')}-${dayStr.padStart(2, '0')}`;
            } else {
                throw new Error('Could not parse all date components');
            }
        } catch (e) {
            if (e instanceof Error) {
                console.warn(`Skipping record due to date parsing error (rawDate: "${rawDate}"):`, e.message, record);
            } else {
                console.warn(`Skipping record due to unknown error (rawDate: "${rawDate}")`, record);
            }
            continue;
        }

        const key = `${agency}-${formattedDate}`;
        if (!tempPartyDataHolder[key]) {
            tempPartyDataHolder[key] = {
                agency: agency,
                date: formattedDate,
                support: {},
            };
        }

        for (const party of partyData) {
            const supportPercentageString = record[party.csvName];
            if (supportPercentageString !== undefined && supportPercentageString !== null && supportPercentageString.trim() !== '') {
                const supportPercentage = parseFloat(supportPercentageString.replace('%', ''));
                if (!isNaN(supportPercentage)) {
                    tempPartyDataHolder[key].support[party.displayName] = supportPercentage;
                }
            }
        }
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
