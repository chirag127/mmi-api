"use client";

import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend,
  ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";
import { MOOD_LABELS, ZONE_COLORS } from "@/lib/queries";

interface ZoneDonutProps {
  zonePercentages: {
    [MOOD_LABELS.EXTREME_FEAR]: number;
    [MOOD_LABELS.FEAR]: number;
    [MOOD_LABELS.GREED]: number;
    [MOOD_LABELS.EXTREME_GREED]: number;
  };
  isLoading?: boolean;
}

export default function ZoneDonut({ 
  zonePercentages, 
  isLoading = false 
}: ZoneDonutProps) {
  if (isLoading) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">
        Loading zone data...
      </div>
    );
  }

  const data = [
    { name: MOOD_LABELS.EXTREME_FEAR, value: zonePercentages[MOOD_LABELS.EXTREME_FEAR], color: ZONE_COLORS[MOOD_LABELS.EXTREME_FEAR] },
    { name: MOOD_LABELS.FEAR, value: zonePercentages[MOOD_LABELS.FEAR], color: ZONE_COLORS[MOOD_LABELS.FEAR] },
    { name: MOOD_LABELS.GREED, value: zonePercentages[MOOD_LABELS.GREED], color: ZONE_COLORS[MOOD_LABELS.GREED] },
    { name: MOOD_LABELS.EXTREME_GREED, value: zonePercentages[MOOD_LABELS.EXTREME_GREED], color: ZONE_COLORS[MOOD_LABELS.EXTREME_GREED] }
  ].filter(item => item.value > 0); // Only show zones with data

  if (data.length === 0) {
    return (
      <div className="h-[250px] w-full flex items-center justify-center text-muted-foreground">
        No zone data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie 
          data={data} 
          dataKey="value" 
          nameKey="name" 
          cx="50%" 
          cy="50%" 
          innerRadius={60} 
          outerRadius={100}
          fill="#fff"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={entry.color} 
            />
          ))}
        </Pie>
        
        <Tooltip 
          separator=": "
          formatter={(value) => `${value.toFixed(1)}%`}
          contentStyle={{ backgroundColor: '#fff', borderRadius: '4px', padding: '8px' }}
          containerStyle={{ pointerEvents: 'none' }}
        />
        
        <Legend 
          verticalAlign="bottom" 
          horizontalAlign="center" 
          align="center"
          iconSize={16}
          itemGap={12}
          contentStyle={{ 
            fontSize: 12,
            color: '#64748b' 
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}