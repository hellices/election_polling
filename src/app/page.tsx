"use client";

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { PollChart } from '@/components/ui/chart';

const partyNames = [
  "더불어민주당", "국민의힘", "조국혁신당", "개혁신당",
  "진보당", "기타정당", "지지정당 없음", "모름/무응답"
];

export default function HomePage() {
  const [candidatePollData, setCandidatePollData] = useState<any[]>([]);
  const [partySupportUiData, setPartySupportUiData] = useState<any[]>([]); // For table display
  const [partyChartData, setPartyChartData] = useState<any[]>([]); // For chart display
  const [allAgencies, setAllAgencies] = useState<string[]>([]); // 모든 조사기관 목록
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]); // 선택된 조사기관들

  // 필터링된 데이터를 반환하는 함수
  const getFilteredData = (data: any[]) => {
    if (selectedAgencies.length === 0) return []; // 아무것도 선택되지 않았으면 빈 배열 반환
    return data.filter(item => selectedAgencies.includes(item.agency));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/polling-data');
        const jsonData = await response.json();
        setCandidatePollData(jsonData.candidatePolls || []);
        
        const partySupport = jsonData.partySupport || [];
        setPartySupportUiData(partySupport);

        // 조사기관 목록 추출 및 타입 캐스팅
        const agencies = [...new Set(partySupport.map((poll: any) => poll.agency))] as string[];
        setAllAgencies(agencies);
        setSelectedAgencies(agencies); // 초기에는 모든 기관 선택

        // 차트 데이터 준비
        if (jsonData.partySupport) {
          const formattedForChart = jsonData.partySupport.map((poll: any) => ({
            date: poll.date,
            agency: poll.agency,
            ...poll.support
          })).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setPartyChartData(formattedForChart);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  // 기관 선택 핸들러
  const handleAgencyChange = (agency: string) => {
    setSelectedAgencies(prev => {
      if (prev.includes(agency)) {
        return prev.filter(a => a !== agency);
      } else {
        return [...prev, agency];
      }
    });
  };

  // 전체 선택/해제 핸들러
  const handleSelectAllAgencies = () => {
    if (selectedAgencies.length === allAgencies.length) {
      setSelectedAgencies([]);
    } else {
      setSelectedAgencies([...allAgencies]);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24 space-y-12">
      <h1 className="text-2xl font-bold mb-4">대한민국 선거 지지율 추이</h1>
      
      {/* Candidate Polling Chart Section */}
      <section className="w-full max-w-5xl">
        <h2 className="text-2xl font-semibold mb-6 text-center">대선 후보 지지율</h2>
        <div className="w-full max-w-4xl mx-auto mb-8 p-4 border rounded-lg shadow">
          <PollChart data={candidatePollData} />
        </div>
      </section>

      {/* Party Support Section */}
      <section className="w-full max-w-5xl">
        <h2 className="text-2xl font-semibold mb-6 text-center">정당 지지율 현황</h2>
        
        {/* 조사기관 필터 */}
        <div className="mb-6 p-4 border rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium">조사기관 필터</h3>
            <button
              onClick={handleSelectAllAgencies}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedAgencies.length === allAgencies.length ? '전체 해제' : '전체 선택'}
            </button>
          </div>
          <div className="flex flex-wrap gap-4">
            {allAgencies.map(agency => (
              <label key={agency} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedAgencies.includes(agency)}
                  onChange={() => handleAgencyChange(agency)}
                  className="form-checkbox h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm">{agency}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="mb-8 p-4 border rounded-lg shadow">
          <PollChart data={getFilteredData(partyChartData)} />
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-4">정당 지지율 상세 데이터</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border shadow-sm rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조사기관</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">조사 종료일</th>
                  {partyNames.map(partyName => (
                    <th key={partyName} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{partyName}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredData(partySupportUiData).map((dataEntry: any, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dataEntry.agency}</td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{dataEntry.date}</td>
                    {partyNames.map(partyName => (
                      <td key={partyName} className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {dataEntry.support[partyName] !== undefined ? `${dataEntry.support[partyName]}%` : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            표의 내용이 많을 경우 좌우로 스크롤하여 모든 정당의 지지율을 확인할 수 있습니다.
          </p>
        </div>
      </section>
    </main>
  );
}
