import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (e) {
  document.body.innerHTML =
    '<pre style="padding:20px;color:red">' +
    String(e) +
    '</pre>';
}
