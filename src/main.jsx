import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { CatalogProvider, StoreProvider } from './store.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CatalogProvider>
      <StoreProvider>
        <App />
      </StoreProvider>
    </CatalogProvider>
  </StrictMode>
);
