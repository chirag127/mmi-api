import Link from "next/link";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export default function SiteHeader() {
  return (
    <header className="border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex items-center space-x-3">
            <Link href="/" className="text-xl font-bold tracking-tight">
              Ticker Tape MMI Tracker
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <Link 
              href="/" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link 
              href="/about" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              About
            </Link>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Link 
              href="https://tickertape-mmi.vercel.app" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Live Dashboard
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}