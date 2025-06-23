import React from 'react';
import { createRoot } from 'react-dom/client';
import '@assets/styles/tailwind.css';
import Popup from './Popup';

// Create root container
const rootContainer = document.getElementById('app-container');
if (!rootContainer) throw new Error("Can't find Popup root element");
const root = createRoot(rootContainer);

// Render the Popup component
root.render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
