import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';

const Providers = dynamic(() => import('../src/providers').then(m => m.Providers), { ssr: false });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <Component {...pageProps} />
    </Providers>
  );
}
