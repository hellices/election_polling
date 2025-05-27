// filepath: c:\\Users\\inhwanhwang\\vscode\\election\\src\\lib\\seed.ts
import { getDb, closeDb } from './db.js';
import fs from 'node:fs';
import { parse } from 'csv-parse/sync';
interface RunResult {
  changes: number;
  lastInsertRowid: number | bigint;
}

async function seedPartySupportData() {
  const db = getDb();

  // Clear existing party support data
  try {
    db.exec('DELETE FROM PartySupport');
    console.log('Successfully deleted existing data from PartySupport table.');  } catch (error) {
    console.error('Error deleting data from PartySupport:', error);
    if (error instanceof Error && !error.message.includes('no such table')) {
      throw error;
    }
  }

  // Read and parse the CSV file, assuming it is now UTF-8 encoded
  const csvFilePath = 'data/party.csv'; // Relative path from project root
  let fileContent;
  try {
    // const buffer = fs.readFileSync(csvFilePath);
    // fileContent = iconv.decode(buffer, 'euc-kr'); // Removed iconv-lite decoding
    fileContent = fs.readFileSync(csvFilePath, { encoding: 'utf-8' }); // Explicitly read as UTF-8
  } catch (error) {
    console.error(`Error reading CSV file at ${csvFilePath}:`, error);
    throw error;
  }

  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  // Prepare statement for inserting data
  const stmt = db.prepare('INSERT INTO PartySupport (agency, date, partyName, supportPercentage) VALUES (?, ?, ?, ?)');

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

  // Debug: CSV 헤더 확인
  console.log('CSV Headers:', Object.keys(records[0]));

  for (const record of records) {
    const agency = record['조사기관'];
    let rawDate = record['조사일자'];

    if (!agency || !rawDate) {
      console.warn('Skipping record due to missing agency or date:', record);
      continue;
    }

    // Debug: 각 레코드의 정당 지지율 데이터 출력
    console.log('Processing record:', {
      agency,
      date: rawDate,
      supportData: Object.fromEntries(
        partyData.map(party => [party.csvName, record[party.csvName]])
      )
    });

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
          // monthStr = endDateDetails[0]; // 월을 이걸로 덮어쓸 수도 있으나, 보통 시작일의 월을 따름
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
      }    } catch (e) {
      if (e instanceof Error) {
        console.warn(`Skipping record due to date parsing error (rawDate: "${rawDate}"):`, e.message, record);
      } else {
        console.warn(`Skipping record due to unknown error (rawDate: "${rawDate}")`, record);
      }
      continue;
    }

    for (const party of partyData) {
      const supportPercentageString = record[party.csvName];
      if (supportPercentageString !== undefined && supportPercentageString !== null && supportPercentageString.trim() !== '') {
        const supportPercentage = parseFloat(supportPercentageString.replace('%', ''));
        if (!isNaN(supportPercentage)) {
          try {
            stmt.run(agency, formattedDate, party.displayName, supportPercentage);
          } catch (error) {
            console.error(`Error inserting party support data for ${party.displayName}:`, error, record);
          }
        } else {
          try {
            stmt.run(agency, formattedDate, party.displayName, null);
          } catch (error) {
            console.error(`Error inserting null party support data for ${party.displayName}:`, error, record);
          }
        }
      } else {
        try {
          stmt.run(agency, formattedDate, party.displayName, null);
        } catch (error) {
          console.error(`Error inserting null party support data for ${party.displayName} (empty value):`, error, record);
        }
      }
    }
  }
  console.log('Successfully seeded PartySupport data from CSV.');
}

async function main() {
  const db = getDb();
  // Clear existing polling data first, then candidates
  try {
    // Delete from PollingData first to respect foreign key constraints
    db.exec('DELETE FROM PollingData');
    // Then delete from Candidate
    db.exec('DELETE FROM Candidate');
    console.log('Successfully deleted existing data from PollingData and Candidate tables.');
  } catch (error) {
    console.error('Error deleting data from PollingData/Candidate:', error);
    if (error instanceof Error && !error.message.includes('no such table')) {
      throw error; // Rethrow if it's not a "no such table" error
    }
    // If tables don't exist, it's fine for the first run
  }

  // Sample Candidate Data (keeping this part as is, or you can modify/remove)
  const candidates = [
    { name: 'Candidate A', party: 'Party X' },
    { name: 'Candidate B', party: 'Party Y' },
    { name: 'Candidate C', party: 'Party Z' },
  ];

  const candidateIds: number[] = [];
  for (const candidate of candidates) {
    const stmt = db.prepare('INSERT INTO Candidate (name, party) VALUES (?, ?)');
    const result = stmt.run(candidate.name, candidate.party) as RunResult;
    candidateIds.push(Number(result.lastInsertRowid));
    console.log(`Inserted candidate: ${candidate.name} with ID: ${result.lastInsertRowid}`);
  }

  // Sample Polling Data (keeping this part as is, or you can modify/remove)
  const pollingEntries = [
    { date: '2025-05-01', percentage: 45.5, candidateId: candidateIds[0] },
    { date: '2025-05-08', percentage: 47.2, candidateId: candidateIds[0] },
    { date: '2025-05-15', percentage: 46.8, candidateId: candidateIds[0] },
    { date: '2025-05-22', percentage: 48.1, candidateId: candidateIds[0] },
    { date: '2025-05-01', percentage: 30.0, candidateId: candidateIds[1] },
    { date: '2025-05-08', percentage: 29.5, candidateId: candidateIds[1] },
    { date: '2025-05-15', percentage: 31.2, candidateId: candidateIds[1] },
    { date: '2025-05-22', percentage: 30.8, candidateId: candidateIds[1] },
    { date: '2025-05-01', percentage: 24.5, candidateId: candidateIds[2] },
    { date: '2025-05-08', percentage: 23.3, candidateId: candidateIds[2] },
    { date: '2025-05-15', percentage: 22.0, candidateId: candidateIds[2] },
    { date: '2025-05-22', percentage: 21.1, candidateId: candidateIds[2] },
  ];

  const pollStmt = db.prepare('INSERT INTO PollingData (date, percentage, candidateId) VALUES (?, ?, ?)');
  for (const entry of pollingEntries) {
    if (entry.candidateId !== undefined && entry.candidateId !== null) {
      pollStmt.run(entry.date, entry.percentage, entry.candidateId);
      console.log(`Inserted polling data for candidate ID ${entry.candidateId} on ${entry.date}`);
    } else {
      console.warn(`Skipping polling entry due to invalid candidateId: ${JSON.stringify(entry)}`);
    }
  }

  // Seed party support data from CSV
  await seedPartySupportData();

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    closeDb();
  });
