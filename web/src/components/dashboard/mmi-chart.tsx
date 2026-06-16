"use client";

import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceArea,
  Line,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";
import { MOOD_LABELS, ZONE_COLORS } from "@/lib/queries";

interface MmiChartProps {
  data: Array<{
    timestamp: Date;
    value: number;
    mood: keyof typeof MOOD_LABELS;
    nifty: number | null;
  }>;
  isLoading?: boolean;
}

const getZoneConfig = () => {
  return [
    { 
      label: MOOD_LABELS.EXTREME_FEAR, 
      color: ZONE_COLORS[MOOD_LABELS.EXTREME_FEAR], 
      max: 25 
    },
    { 
      label: MOOD_LABELS.FEAR, 
      color: ZONE_COLORS[MOOD_LABELS.FEAR], 
      min: 25, 
      max: 50 
    },
    { 
      label: MOOD_LABELS.GREED, 
      color: ZONE_COLORS[MOOD_LABELS.GREED], 
      min: 50, 
      max: 75 
    },
    { 
      label: MOOD_LABELS.EXTREME_GREED, 
      color: ZONE_COLORS[MOOD_LABELS.EXTREME_GREED], 
      min: 75 
    }
  ];
};

export default function MmiChart({ 
  data, 
  isLoading = false 
}: MmiChartProps) {
  if (isLoading || !data || data.length === 0) {
    return (
      <div className="h-[400px] w-full flex items-center justify-center text-muted-foreground">
        Loading chart data...
      </div>
    );
  }

  // Prepare data for Recharts (format timestamps)
  const chartData = data.map(item => ({
    timestamp: item.timestamp,
    value: item.value,
    nifty: item.nifty
  }));

  // Normalize Nifty data for overlay (if available)
  const hasNiftyData = chartData.some(item => item.nifty !== null);
  const normalizedNiftyData = hasNiftyData ? 
    chartData.map(item => ({
      ...item,
      niftyNormalized: item.nifty !== null ? 
        50 + ((item.nifty as number) - 20000) * 50 / 10000 : // Simple normalization around 50
        null
    })) : 
    [];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <AreaChart 
        data={hasNiftyData ? normalizedNiftyData : chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
      >
        {/* Cartesian grid */}
        <CartesianGrid strokeDasharray="3 3" />
        
        {/* X Axis */}
        <XAxis 
          dataKey="timestamp" 
          tickFormatter={(timestamp) => {
            const date = new Date(timestamp);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          }}
          tickSize={4}
          stroke="#eee"
        />
        
        {/* Y Axis */}
        <YAxis 
          domain={[0, 100]}
          tickCount={5}
          tickFormatter={(value) => `${value}`}
          stroke="#eee"
        />
        
        {/* Tooltip */}
        <Tooltip 
          separator=" : "
          labelFormatter={(value) => new Date(value).toLocaleDateString()}
          formatter={(value) => value.toFixed(2)}
          contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', padding: '8px' }}
          containerStyle={{ pointerEvents: 'none' }}
        />
        
        {/* Legend */}
        <Legend 
          verticalAlign="top" 
          horizontalAlign="right" 
        />
        
        {/* Zone backgrounds */}
        {getZoneConfig().map((zone, index) => (
          <ReferenceArea 
            key={`zone-${index}`}
            y1={zone.min ?? 0}
            y2={zone.max ?? 100}
            fillOpacity={0.1}
            stroke={zone.color}
            fill={zone.color}
          />
        ))}
        
        {/* MMI Area Chart */}
        {hasNiftyData ? (
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#8b5cf6" 
            fillOpacity={0.1} 
            strokeWidth={2}
            dot={false}
          />
        ) : (
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#8b5cf6" 
            fillOpacity={0.1} 
            strokeWidth={2}
            dot={false}
          />
        )}
        
        {/* MMI Line (for better visibility) */}
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke="#8b5cf6" 
          strokeWidth={3}
          dot={false}
        />
        
        {/* Nifty overlay line (if available) */}
        {hasNiftyData && (
          <Line 
            type="monotone" 
            dataKey="niftyNormalized" 
            stroke="#3b82f6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        )}
        
        {/* Chart points for hover interaction */}
        {hasNiftyData ? (
          <>
            <Area 
              type="monotone" 
              dataKey="value" 
              fillOpacity={0} 
              strokeWidth={0}
              dot={false}
            />
            <Area 
              type="monotone" 
              dataKey="niftyNormalized" 
              fillOpacity={0} 
              strokeWidth={0}
              dot={false}
            />
          </>
        ) : (
          <Area 
            type="monotone" 
            dataKey="value" 
            fillOpacity={0} 
            strokeWidth={0}
            dot={false}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}