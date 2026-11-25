import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { DesktopWidgetView } from './components/DesktopWidgetView.tsx';
import './index.css';

const params = new URLSearchParams(window.location.search);
const isWidgetView = params.get('view') === 'widget';

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isWidgetView ? <DesktopWidgetView /> : <App />}</StrictMode>,
);
