import { getLatestReading, getReadings, getStats } from "@/lib/queries";
import SiteHeader from "@/components/site-header";
import HeroCard from "@/components/dashboard/hero-card";
import MmiChart from "@/components/dashboard/mmi-chart";
import StatCard from "@/components/dashboard/stat-card";
import ZoneDonut from "@/components/dashboard/zone-donut";
import ReadingsTable from "@/components/dashboard/readings-table";
import { MOOD_LABELS } from "@/lib/queries";

export const revalidate = 3600; // Revalidate every hour

export default async function Home() {
  // Fetch data
  const [latestReading, stats] = await Promise.all([
    getLatestReading(),
    getStats()
  ]);

  // Fetch readings for chart (last 30 days)
  const readings = await getReadings(30);

  // Calculate delta from yesterday
  let delta = 0;
  if (readings.length >= 2) {
    const yesterday = readings[readings.length - 2];
    const today = readings[readings.length - 1];
    delta = today.value - yesterday.value;
  }

  return (
    <main className="min-h-screen bg-background">
      <SiteHeader />
      
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading states */}
        {!latestReading && !stats && (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              Loading market data...
            </p>
          </div>
        )}
        
        {/* Error state */}
        {!latestReading && stats === null && (
          <div className="text-center py-12">
            <p className="text-lg text-destructive">
              Failed to load market data. Please try again later.
            </p>
          </div>
        )}
        
        {/* Main dashboard content */}
        {latestReading && stats !== null && (
          <>
            {/* Hero Card */}
            <HeroCard 
              value={latestReading.value} 
              mood={latestReading.mood as keyof typeof MOOD_LABELS} 
              delta={delta} 
            />
            
            {/* Stats and Charts Grid */}
            <div className="grid gap-6 md:grid-cols-[1fr_1fr] lg:grid-cols-[1fr_1fr] mt-8">
              {/* Left Column: Stats and Zone Donut */}
              <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <StatCard 
                    title="7-Day Average" 
                    value={stats.sevenDayAvg} 
                    subtitle="Average MMI value"
                    trend={ 
                      stats.sevenDayAvg > stats.thirtyDayAvg 
                        ? { direction: 'up', value: ((stats.sevenDayAvg - stats.thirtyDayAvg) / stats.thirtyDayAvg * 100) } 
                        : { direction: 'down', value: ((stats.thirtyDayAvg - stats.sevenDayAvg) / stats.thirtyDayAvg * 100) } 
                    } 
                  />
                  
                  <StatCard 
                    title="30-Day High" 
                    value={stats.thirtyDayHigh} 
                    subtitle="Highest MMI value"
                  />
                  
                  <StatCard 
                    title="30-Day Low" 
                    value={stats.thirtyDayLow} 
                    subtitle="Lowest MMI value"
                  />
                  
                  <StatCard 
                    title="Today's Value" 
                    value={stats.latest.value} 
                    subtitle="Current MMI reading"
                    trend={ 
                      delta >= 0 
                        ? { direction: 'up', value: Math.abs(delta) } 
                        : { direction: 'down', value: Math.abs(delta) } 
                    } 
                  />
                </div>
                
                {/* Zone Donut Chart */}
                <ZoneDonut 
                  zonePercentages={stats.zonePercentages} 
                />
              </div>
              
              {/* Right Column: MMI Chart */}
              <div>
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">MMI Trend (Last 30 Days)</h2>
                  <MmiChart 
                    data={readings.map(r => ({
                      timestamp: r.timestamp,
                      value: r.value,
                      mood: r.mood as keyof typeof MOOD_LABELS,
                      nifty: r.nifty
                    }))} 
                  />
                  
                  <div className="text-xs text-muted-foreground flex justify-between mt-2">
                    <span>MMI Line: Purple</span>
                    <span>Nifty Overlay: Blue (dashed)</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Readings Table */}
            <div className="mt-10">
              <h2 className="text-lg font-semibold mb-4">Recent Readings</h2>
              <ReadingsTable 
                readings={readings.map(r => ({
                  timestamp: r.timestamp,
                  value: r.value,
                  mood: r.mood as keyof typeof MOOD_LABELS,
                  nifty: r.nifty,
                  fma: r.fma,
                  sma: r.sma
                }))} 
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}