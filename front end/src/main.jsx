import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import ThemeController from './controllers/ThemeController';
import App from './App.jsx';

// Apply theme before first render so CSS variables are available immediately
ThemeController.applyTheme();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
