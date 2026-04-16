import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Always log error details for debugging
    console.error("[ErrorBoundary] Caught error:", error?.message, error?.stack);
    console.error("[ErrorBoundary] Component stack:", errorInfo?.componentStack);
    
    // Auto-reload on chunk/module import failures (stale cache after rebuild)
    const msg = error?.message || '';
    if (
      msg.includes('Importing a module script failed') ||
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      msg.includes('Loading CSS chunk')
    ) {
      const reloadKey = 'chunk_error_reload';
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 30000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
        return;
      }
    }
  }

  public componentDidMount() {
    // Listen for theme changes — reset error state when theme changes
    // since the error might be theme-specific
    this._observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'class' && this.state.hasError) {
          console.log("[ErrorBoundary] Theme class changed, resetting error state");
          this.setState({ hasError: false, error: null });
        }
      }
    });
    this._observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  public componentWillUnmount() {
    this._observer?.disconnect();
  }

  private _observer: MutationObserver | null = null;

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = "/";
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const errorMsg = this.state.error?.message || 'Unknown error';

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 relative z-[9999]">
          <div className="w-full max-w-sm text-center space-y-6">
            <div className="h-20 w-20 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto">
              <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We're sorry, but something unexpected happened.
              </p>
            </div>

            {/* Always show error message (truncated) for debugging */}
            <div className="bg-muted rounded-xl p-3 text-left">
              <p className="text-[10px] font-mono text-muted-foreground break-all line-clamp-3">
                {errorMsg}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={this.handleRetry} 
                size="lg"
                variant="default"
                className="w-full h-14 text-base font-semibold gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Try Again
              </Button>
              <Button 
                onClick={this.handleReload} 
                size="lg"
                variant="outline"
                className="w-full h-14 text-base font-semibold gap-2"
              >
                <RefreshCw className="h-5 w-5" />
                Refresh Page
              </Button>
              <Button 
                variant="ghost" 
                onClick={this.handleGoHome} 
                size="lg"
                className="w-full h-12 text-sm font-medium gap-2 text-muted-foreground"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
