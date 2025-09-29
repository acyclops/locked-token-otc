import '@rainbow-me/rainbowkit/styles.css';
import { WagmiProvider, http, createConfig } from 'wagmi';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { arbitrum, polygonAmoy } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from '@wagmi/connectors';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

const config = createConfig({
  chains: [arbitrum, polygonAmoy],
  transports: {
    [arbitrum.id]: http(),
    [polygonAmoy.id]: http(),
  },
  // NOTE: no MetaMask SDK connector here
  connectors: [
    injected({ target: 'metaMask' }),
    walletConnect({ projectId, showQrModal: true }),
    coinbaseWallet({ appName: 'CRX OTC' }),
  ],
  ssr: true,
});

const qc = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
