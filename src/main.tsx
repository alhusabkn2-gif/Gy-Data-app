import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

(async () => {
  try {
    const { default: App } = await import('./App');

    const root = document.getElementById('root');

    if (!root) {
      throw new Error('Element with id="root" was not found.');
    }

    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (e) {
    const error =
      e instanceof Error
        ? `${e.message}\n\n${e.stack}`
        : JSON.stringify(e, null, 2);

    document.body.innerHTML = `
      <pre style="
        color:red;
        padding:20px;
        white-space:pre-wrap;
        font-size:14px;
      ">${error}</pre>
    `;
  }
})();
