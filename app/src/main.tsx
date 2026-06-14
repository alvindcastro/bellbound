import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { seed } from './data/seed.js';

seed();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
