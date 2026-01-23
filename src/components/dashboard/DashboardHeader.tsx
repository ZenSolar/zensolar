import { LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import zenLogo from '@/assets/zen-logo-horizontal-new.png';

interface DashboardHeaderProps {
  isDemo?: boolean;
}

export function DashboardHeader({ isDemo = false }: DashboardHeaderProps) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const { error } = await signOut();
    setIsLoggingOut(false);
    
    if (error) {
      toast.error('Failed to log out');
    } else {
      navigate('/auth');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src={zenLogo} alt="ZenSolar" className="h-8 w-auto dark:drop-shadow-[0_0_8px_rgba(16,185,129,0.4)] dark:brightness-110" />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
            <span className="text-[10px] text-primary/70 font-medium hidden sm:block">✦ Patent Pending</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemo ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:block">
                Demo Mode
              </span>
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate('/auth')}
              >
                Sign Up
              </Button>
            </>
          ) : (
            <>
              {user?.email && (
                <span className="text-sm text-muted-foreground hidden sm:block">
                  {user.email}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                <span className="ml-2 hidden sm:inline">Log out</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
