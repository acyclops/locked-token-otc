import React from 'react';
import ReactDOM from 'react-dom/client';
import Providers from './providers';
import App from './App';
import { ConnectButton } from '@rainbow-me/rainbowkit';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Providers>
      {/* Quick test: pretty connect button in top-right */}
      <div style={{ position: 'fixed', top: 12, right: 12, zIndex: 1000 }}>
        <ConnectButton />
      </div>

      <App />
    </Providers>
  </React.StrictMode>
);
