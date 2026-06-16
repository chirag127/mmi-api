import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MOOD_LABELS, ZONE_COLORS } from "@/lib/queries";

interface HeroCardProps {
  value: number;
  mood: keyof typeof MOOD_LABELS;
  delta: number; // Change from previous day
  isLoading?: boolean;
}

export default function HeroCard({ 
  value, 
  mood, 
  delta, 
  isLoading = false 
}: HeroCardProps) {
  const moodLabel = MOOD_LABELS[mood];
  const zoneColor = ZONE_COLORS[mood as keyof typeof ZONE_COLORS];
  const deltaPositive = delta >= 0;
  const deltaColor = deltaPositive ? "text-green-500" : "text-red-500";
  const deltaIcon = deltaPositive ? "▲" : "▼";
  
  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl md:text-3xl font-bold">
          Market Mood Index (MMI)
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Current market sentiment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-4xl md:text-5xl font-bold tracking-tighter">
            {isLoading ? "--" : value.toFixed(2)}
          </div>
          <div className="flex items-center space-x-2">
            <Badge 
              variant="outline"
              className={`border-${zoneColor}/50 bg-${zoneColor}/20 text-${zoneColor}`}
            >
              {moodLabel}
            </Badge>
            <div className={cn("text-sm font-medium", deltaColor)}>
              {deltaIcon} {Math.abs(delta).toFixed(2)}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </CardContent>
    </Card>
  );
}