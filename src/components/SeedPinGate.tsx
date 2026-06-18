import { useState, useEffect, FormEvent, ReactNode } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const STORAGE_KEY = 'seed_pin_ok';
const PIN = '0423';

interface Props {
  children: ReactNode;
}

export default function SeedPinGate({ children }: Props) {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setUnlocked(true);
    } catch {}
  }, []);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value.trim() === PIN) {
      try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch {}
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setValue('');
    }
  };

  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-xl font-semibold">Private — Enter Access PIN</h1>
          <p className="text-sm text-muted-foreground">
            This page is restricted. Please enter the 4-digit PIN to continue.
          </p>
        </div>
        <Input
          type="password"
          inputMode="numeric"
          autoFocus
          autoComplete="off"
          maxLength={8}
          placeholder="••••"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(false); }}
          className="text-center text-lg tracking-[0.5em]"
          aria-label="Access PIN"
        />
        {error && (
          <p className="text-sm text-destructive mt-2 text-center">Incorrect PIN. Try again.</p>
        )}
        <Button type="submit" className="w-full mt-4">Unlock</Button>
      </form>
    </div>
  );
}
