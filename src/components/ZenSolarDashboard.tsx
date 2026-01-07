import { useDashboardData } from '@/hooks/useDashboardData';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { ConnectAccounts } from './dashboard/ConnectAccounts';
import { ActivityMetrics } from './dashboard/ActivityMetrics';
import { RewardActions } from './dashboard/RewardActions';

export function ZenSolarDashboard() {
  const { activityData, connectedAccounts, isLoading, connectAccount, refreshDashboard } = useDashboardData();

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container max-w-lg mx-auto px-4 py-6 space-y-6">
        <ConnectAccounts 
          accounts={connectedAccounts} 
          onConnect={connectAccount} 
        />
        
        <ActivityMetrics data={activityData} />
        
        <RewardActions 
          onRefresh={refreshDashboard} 
          isLoading={isLoading} 
        />
      </main>
    </div>
  );
}
