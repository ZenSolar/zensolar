import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import teslaLogo from '@/assets/logos/tesla-logo.png';
import enphaseLogo from '@/assets/logos/enphase-logo.png';
import solaredgeLogo from '@/assets/logos/solaredge-logo.svg';
import wallboxLogo from '@/assets/logos/wallbox-icon.svg';

const partners = [
  { name: 'Tesla', logo: teslaLogo, color: '#E82127', connected: true },
  { name: 'Enphase', logo: enphaseLogo, color: '#F59E0B', connected: true },
  { name: 'SolarEdge', logo: solaredgeLogo, color: '#E8453C', connected: true, invert: true },
  { name: 'Wallbox', logo: wallboxLogo, color: '#00B140', connected: true, invert: true },
];

export function ApiPartnersCard() {
  return (
    <Card className="relative overflow-hidden border-border/40 bg-card/30 backdrop-blur-sm">
      {/* Shimmer overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(105deg, transparent 40%, hsla(0,0%,100%,0.06) 45%, hsla(0,0%,100%,0.12) 50%, hsla(0,0%,100%,0.06) 55%, transparent 60%)',
          backgroundSize: '250% 100%',
          animation: 'shimmerSlide 4s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes shimmerSlide {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -50% 0; }
        }
      `}</style>

      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
              Live API Connections
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-emerald-500/30 text-emerald-400 bg-emerald-500/5">
            4 Active
          </Badge>
        </div>

        {/* Logo grid */}
        <div className="grid grid-cols-4 gap-2">
          {partners.map((p) => (
            <div
              key={p.name}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border/30 bg-background/20 hover:bg-background/40 transition-colors"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-background/30">
                <img
                  src={p.logo}
                  alt={`${p.name} logo`}
                  className={`w-6 h-6 object-contain ${p.invert ? 'dark:brightness-0 dark:invert' : ''}`}
                  loading="lazy"
                  width={24}
                  height={24}
                />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground leading-none">{p.name}</span>
              <div className="h-1 w-1 rounded-full bg-emerald-500" />
            </div>
          ))}
        </div>

        {/* Coming soon */}
        <p className="text-[10px] text-center text-muted-foreground/60">
          <span className="text-muted-foreground/80 font-medium">More partners coming</span> — ChargePoint, Span, Emporia & others in the pipeline
        </p>
      </CardContent>
    </Card>
  );
}
