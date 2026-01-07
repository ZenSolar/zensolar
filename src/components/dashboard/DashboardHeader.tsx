import { Sun } from 'lucide-react';

export function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 items-center justify-center">
        <div className="flex items-center gap-2">
          <Sun className="h-6 w-6 text-solar" />
          <h1 className="text-xl font-bold text-foreground">ZenSolar Dashboard</h1>
        </div>
      </div>
    </header>
  );
}
