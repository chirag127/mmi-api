"use client";

import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { MOOD_LABELS, ZONE_COLORS } from "@/lib/queries";

interface Reading {
  timestamp: Date;
  value: number;
  mood: keyof typeof MOOD_LABELS;
  nifty: number | null;
  fma: number | null;
  sma: number | null;
}

interface ReadingsTableProps {
  readings: Reading[];
  isLoading?: boolean;
}

export default function ReadingsTable({ 
  readings, 
  isLoading = false 
}: ReadingsTableProps) {
  if (isLoading) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        Loading readings...
      </div>
    );
  }

  if (!readings || readings.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground">
        No readings available
      </div>
    );
  }

  // Show last 50 readings by default
  const displayReadings = readings.slice(-50).reverse();

  return (
    <Table className="w-full">
      <TableHeader>
        <TableRow>
          <TableHead className="text-left text-xs font-medium text-muted-foreground w-[20%]">
            Timestamp
          </TableHead>
          <TableHead className="text-left text-xs font-medium text-muted-foreground w-[15%]">
            MMI Value
          </TableHead>
          <TableHead className="text-left text-xs font-medium text-muted-foreground w-[15%]">
            Mood
          </TableHead>
          <TableHead className="text-left text-xs font-medium text-muted-foreground w-[15%]">
            Nifty
          </TableHead>
          <TableHead className="text-left text-xs font-medium text-muted-foreground w-[15%]">
            FMA
          </TableHead>
          <TableHead className="text-left text-xs font-medium text-muted-foreground w-[15%]">
            SMA
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {displayReadings.map((reading, index) => (
          <TableRow 
            key={`reading-${index}`} 
            className={cn(
              index % 2 === 0 && "bg-white",
              index % 2 === 1 && "bg-gray-50"
            )}
          >
            <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
              {reading.timestamp.toLocaleString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </TableCell>
            <TableCell className="text-xs font-mono text-right">
              {reading.value.toFixed(2)}
            </TableCell>
            <TableCell className="text-xs flex items-center space-x-2">
              <span 
                className={`text-xs font-medium px-2 py-0.5 rounded 
                          bg-${ZONE_COLORS[reading.mood as keyof typeof ZONE_COLORS]}/20 
                          text-${ZONE_COLORS[reading.mood as keyof typeof ZONE_COLORS]}/80`}
              >
                {MOOD_LABELS[reading.mood]}
              </span>
            </TableCell>
            <TableCell className="text-xs text-right text-muted-foreground">
              {reading.nifty !== null ? reading.nifty.toFixed(0) : '--'}
            </TableCell>
            <TableCell className="text-xs text-right text-muted-foreground">
              {reading.fma !== null ? reading.fma.toFixed(2) : '--'}
            </TableCell>
            <TableCell className="text-xs text-right text-muted-foreground">
              {reading.sma !== null ? reading.sma.toFixed(2) : '--'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}