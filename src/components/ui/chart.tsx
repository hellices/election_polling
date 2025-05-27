import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

interface ChartProps {
  data: {
    date: string;
    agency: string;
    [key: string]: string | number;
  }[];
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

export function PollChart({ data }: ChartProps) {
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

  // 데이터가 없거나 첫 번째 데이터가 null/undefined일 때 처리
  if (!data || data.length === 0 || !data[0]) {
    return <div className="text-center text-gray-400">데이터가 없습니다.</div>;
  }

  // Get all candidate names from the first data point, excluding date and agency
  const candidateNames = Object.keys(data[0]).filter(key => key !== 'date' && key !== 'agency');

  return (
    <div className="w-full h-[600px] p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
