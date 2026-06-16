import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: number;
  };
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  trend 
}: StatCardProps) {
  const trendClass = cn(
    trend?.direction === 'up' && 'text-green-500',
    trend?.direction === 'down' && 'text-red-500',
    trend?.direction === 'neutral' && 'text-muted-foreground'
  );
  
  const trendIcon = trend?.direction === 'up' ? '▲' : 
                   trend?.direction === 'down' ? '▼' : 
                   '→';

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">
          {typeof value === 'number' ? value.toFixed(2) : value}
        </div>
        {subtitle && (
          <p className="text-sm text-muted-foreground">
            {subtitle}
          </p>
        )}
        {trend && (
          <div className={cn("text-xs font-medium", trendClass)}>
            {trendIcon} {trend.value.toFixed(1)}%
          </div>
        )}
      </CardContent>
    </Card>
  );
}