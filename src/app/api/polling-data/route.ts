import { getDb } from '@/lib/db'; // Adjusted import path
import { NextResponse } from 'next/server';

export async function GET() {
  const db = getDb();
  try {
    // Fetch candidate polling data (existing logic)
    const candidatePolls = db.prepare(
      'SELECT c.name as candidateName, c.party, pd.date, pd.percentage FROM Candidate c JOIN PollingData pd ON c.id = pd.candidateId ORDER BY pd.date, c.name'
    ).all();

    // Fetch party support data
    const partySupportRaw = db.prepare(
      'SELECT agency, date, partyName, supportPercentage FROM PartySupport ORDER BY date DESC, agency'
    ).all();

    // Process party support data into the desired format for the frontend
    const partySupportProcessed: { agency: string; date: string; support: { [key: string]: number } }[] = [];
    const tempPartyDataHolder: { [key: string]: { agency: string; date: string; support: { [key: string]: number } } } = {};

    interface PartySupport {
      agency: string;
      date: string;
      partyName: string;
      supportPercentage: number;
    }

    for (const row of partySupportRaw as PartySupport[]) {
      const key = `${row.agency}-${row.date}`;
      if (!tempPartyDataHolder[key]) {
        tempPartyDataHolder[key] = {
          agency: row.agency,
          date: row.date,
          support: {},
        };
      }
      // 정당 이름에서 개행 문자를 공백으로 변환
      const cleanPartyName = row.partyName.replace(/\n/g, ' ').trim();
      tempPartyDataHolder[key].support[cleanPartyName] = row.supportPercentage;
    }
    for (const key in tempPartyDataHolder) {
      partySupportProcessed.push(tempPartyDataHolder[key]);
    }
    // Sort by date descending, then by agency for consistent ordering
    partySupportProcessed.sort((a, b) => {
      const dateComparison = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateComparison !== 0) return dateComparison;
      return a.agency.localeCompare(b.agency);
    });

    // Prepare data for party support chart (needs date as x-axis and each party as a series)
    const formattedForChart = partySupportProcessed.map((poll) => ({
      date: poll.date,
      agency: poll.agency, // Add agency information
      ...poll.support
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({ candidatePolls, partySupport: partySupportProcessed, formattedForChart });
  } catch (error) {
    console.error('Error fetching polling data:', error);
    return NextResponse.json({ error: 'Failed to fetch polling data' }, { status: 500 });
  }
}
