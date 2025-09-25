// src/providers.tsx
'use client';

import '@rainbow-me/rainbowkit/styles.css';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arbitrum, arbitrumSepolia } from 'wagmi/chains';

const config = getDefaultConfig({
  appName: 'OTC Demo',
  projectId: import.meta.env.VITE_WC_ID as string,   // required for WC/QR wallets
  chains: [arbitrum, arbitrumSepolia],
  transports: {
    [arbitrum.id]: http(),         // or http('https://your-rpc')
    [arbitrumSepolia.id]: http(),
  },
  ssr: false,                      // Vite SPA — false is fine
});

const qc = new QueryClient();

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
