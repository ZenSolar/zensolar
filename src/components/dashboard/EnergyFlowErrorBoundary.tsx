import { Component, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  /** Optional extra UI (e.g. provider reconnect callouts) rendered inside the fallback */
  fallbackExtras?: ReactNode;
}

interface State {
  hasError: boolean;
  remountKey: number;
}

/**
 * Catches runtime errors in the live energy flow subtree so a failed OEM
 * fetch (e.g. expired Tesla token whose downstream consumer throws) never
 * blank-screens the whole dashboard. Shows a small recovery card with a
 * "Reload section" button that re-mounts the children.
 */
export class EnergyFlowErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, remountKey: 0 };

  static getDerivedStateFromError(): State {
    return { hasError: true, remountKey: 0 };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('[EnergyFlowErrorBoundary]', error, info);
  }

  private handleReload = () => {
    this.setState((s) => ({ hasError: false, remountKey: s.remountKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Live energy flow temporarily unavailable
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                One of your connected energy devices failed to refresh. Reconnect it
                below or reload this section.
              </p>
            </div>
          </div>
          {this.props.fallbackExtras}
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={this.handleReload} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Reload section
            </Button>
          </div>
        </div>
      );
    }

    // key bump forces children to re-mount on retry
    return <div key={this.state.remountKey}>{this.props.children}</div>;
  }
}
