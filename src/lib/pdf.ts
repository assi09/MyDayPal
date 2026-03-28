export function printHTML(html: string) {
  // Create a Blob URL — works inside Tauri's webview (CSP is null)
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  // Hidden iframe so we stay in the same window (window.open is blocked in Tauri)
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  iframe.addEventListener('load', () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // ignore
    }
    // Clean up after print dialog closes
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(url);
    }, 3000);
  });

  iframe.src = url;
}
