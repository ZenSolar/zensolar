import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config, CHAIN_ID } from '@/lib/wagmi';
import { ReactNode } from 'react';
import { useTheme } from 'next-themes';

const queryClient = new QueryClient();

interface Web3ProviderProps {
  children: ReactNode;
}

function RainbowKitWrapper({ children }: { children: ReactNode }) {
  const { resolvedTheme } = useTheme();
  
  return (
    <RainbowKitProvider
      theme={resolvedTheme === 'dark' ? darkTheme({
        accentColor: '#22c55e', // ZenSolar green
        accentColorForeground: 'white',
        borderRadius: 'medium',
      }) : lightTheme({
        accentColor: '#16a34a', // ZenSolar green
        accentColorForeground: 'white',
        borderRadius: 'medium',
      })}
      modalSize="compact"
      initialChain={CHAIN_ID}
    >
      {children}
    </RainbowKitProvider>
  );
}

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitWrapper>
          {children}
        </RainbowKitWrapper>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
