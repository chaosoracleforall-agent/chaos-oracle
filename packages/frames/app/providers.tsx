"use client";

import { useState, useEffect } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// THE AGENT IS HARDENING THIS CONFIG FOR META-MASK STABILITY
const config = getDefaultConfig({
  appName: 'Chaos Oracle',
  projectId: '3f2d2165c699981880497799195e8656', 
  chains: [base],
  transports: {
    [base.id]: http('https://mainnet.base.org'), 
  },
  ssr: true, 
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // AGENT FIX: Returning a fragment with only children on server to bypass localStorage crash
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({
          accentColor: '#ff4500',
          accentColorForeground: 'white',
          borderRadius: 'none',
          fontStack: 'system',
          overlayBlur: 'small',
        })} modalSize="compact">
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
