import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

(async () => {
  try {
    const { default: App } = await import('./App');

    createRoot(document.getElementById('root')!).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (e) {
    document.body.innerHTML = `
<pre style="padding:20px;color:red;white-space:pre-wrap">
${e instanceof Error ? e.stack : String(e)}
</pre>`;
  }
})();
