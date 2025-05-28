import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps, ReferenceArea } from 'recharts';
import { useState } from 'react';

// Type for recharts mouse events
interface ChartMouseEvent {
  activeLabel?: string;
  activePayload?: Array<unknown>;
  activeCoordinate?: { x: number; y: number };
}

interface ChartProps {
  data: {
    date: string;
    agency: string;
    [key: string]: string | number;
  }[];
  onDateRangeSelect?: (startDate: Date, endDate: Date) => void;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length > 0) {
    // Get agency from the first payload item's data
    const data = payload[0]?.payload;
    const agency = data?.agency;

    return (
      <div className="bg-white p-4 border rounded-lg shadow-lg">
        <p className="font-semibold mb-2">
          {new Date(label).toLocaleDateString('ko-KR')} ({agency})
        </p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {Number(entry.value).toFixed(1)}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PollChart({ data, onDateRangeSelect }: ChartProps) {
  const colors = [
    '#2563eb', // blue
    '#dc2626', // red
    '#16a34a', // green
    '#ca8a04', // yellow
    '#9333ea', // purple
    '#475569', // slate
    '#ec4899', // pink
    '#14b8a6', // teal
  ];

  // 드래그 선택을 위한 상태
  const [refAreaLeft, setRefAreaLeft] = useState<string | null>(null);
  const [refAreaRight, setRefAreaRight] = useState<string | null>(null);

  // 데이터가 없거나 첫 번째 데이터가 null/undefined일 때 처리
  if (!data || data.length === 0 || !data[0]) {
    return <div className="text-center text-gray-400">데이터가 없습니다.</div>;
  }

  // Get all candidate names from the first data point, excluding date and agency
  const candidateNames = Object.keys(data[0]).filter(key => key !== 'date' && key !== 'agency');

  // 드래그 시작
  const handleMouseDown = (e: ChartMouseEvent) => {
    if (!e || !e.activeLabel) return;
    setRefAreaLeft(e.activeLabel);
  };

  // 드래그 중
  const handleMouseMove = (e: ChartMouseEvent) => {
    if (!e || !e.activeLabel || !refAreaLeft) return;
    setRefAreaRight(e.activeLabel);
  };

  // 드래그 종료 및 날짜 범위 적용
  const handleMouseUp = () => {
    if (!refAreaLeft || !refAreaRight || !onDateRangeSelect) {
      // 선택 초기화
      setRefAreaLeft(null);
      setRefAreaRight(null);
      return;
    }

    // 날짜 정렬 (시작일 < 종료일)
    let dateLeft = new Date(refAreaLeft);
    let dateRight = new Date(refAreaRight);

    // Fix for timezone issues - set to midnight local time
    dateLeft.setHours(0, 0, 0, 0);
    dateRight.setHours(23, 59, 59, 999);

    if (dateLeft > dateRight) {
      [dateLeft, dateRight] = [dateRight, dateLeft];
    }

    // 날짜 범위 콜백 호출
    onDateRangeSelect(dateLeft, dateRight);

    // 선택 영역 초기화
    setRefAreaLeft(null);
    setRefAreaRight(null);
  };

  return (
    <div className="w-full h-[600px] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data} 
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="date"
            tickFormatter={(value) => new Date(value).toLocaleDateString('ko-KR')}
          />
          <YAxis domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {candidateNames.map((candidate, index) => (
            <Line
              key={candidate}
              type="monotone"
              dataKey={candidate}
              name={candidate}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
          {refAreaLeft && refAreaRight && (
            <ReferenceArea 
              x1={refAreaLeft} 
              x2={refAreaRight} 
              strokeOpacity={0.3} 
              fill="#8884d8" 
              fillOpacity={0.2} 
            />
          )}
        </LineChart>
      </ResponsiveContainer>
      {onDateRangeSelect && (
        <div className="text-center text-xs text-gray-500 mt-2">
          * 차트에서 드래그하여 날짜 범위를 선택할 수 있습니다.
        </div>
      )}
    </div>
  );
}
