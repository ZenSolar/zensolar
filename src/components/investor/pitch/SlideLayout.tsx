import { ReactNode } from 'react';

interface SlideLayoutProps {
  children: ReactNode;
  className?: string;
  variant?: 'dark' | 'light' | 'gradient' | 'accent';
}

const variantStyles: Record<string, string> = {
  dark: 'bg-[hsl(220,20%,8%)] text-white',
  light: 'bg-white text-[hsl(220,20%,14%)]',
  gradient: 'bg-gradient-to-br from-[hsl(220,20%,8%)] via-[hsl(220,20%,12%)] to-[hsl(207,90%,15%)] text-white',
  accent: 'bg-gradient-to-br from-[hsl(207,90%,12%)] via-[hsl(220,20%,10%)] to-[hsl(142,76%,10%)] text-white',
};

export function SlideLayout({ children, className = '', variant = 'dark' }: SlideLayoutProps) {
  return (
    <div className={`slide-content w-[1920px] h-[1080px] relative overflow-hidden ${variantStyles[variant]} ${className}`}>
      {children}
    </div>
  );
}

export function SlideHeader({ label, number }: { label: string; number: number }) {
  return (
    <div className="absolute top-10 left-16 flex items-center gap-4">
      <span className="text-[13px] font-mono tracking-[0.2em] uppercase text-white/30">
        {String(number).padStart(2, '0')}
      </span>
      <span className="text-[13px] font-mono tracking-[0.2em] uppercase text-white/50">
        {label}
      </span>
    </div>
  );
}

export function SlideFooter() {
  return (
    <div className="absolute bottom-8 left-16 right-16 flex items-center justify-between">
      <span className="text-[13px] font-medium tracking-wider text-white/25">ZENSOLAR</span>
      <span className="text-[13px] text-white/20">CONFIDENTIAL</span>
    </div>
  );
}
