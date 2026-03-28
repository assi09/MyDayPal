export function printHTML(html: string) {
  // Parse the generated HTML to extract body content + styles
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Collect all <style> tags from the template's <head>
  const styles = Array.from(doc.head.querySelectorAll('style'))
    .map(s => s.textContent ?? '')
    .join('\n');

  // Build a print overlay div in the CURRENT window (avoids iframe/window.open restrictions in Tauri)
  const OVERLAY_ID = '__mdp_print__';
  const STYLE_ID   = '__mdp_print_style__';

  // Remove any leftover from a previous call
  document.getElementById(OVERLAY_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();

  // Inject the template body content
  const overlay = document.createElement('div');
  overlay.id = OVERLAY_ID;
  overlay.innerHTML = doc.body.innerHTML;
  overlay.style.cssText = 'display:none;';
  document.body.appendChild(overlay);

  // Inject print styles:
  // 1. Template's own styles (scoped inside #__mdp_print__)
  // 2. Print media rule that hides the app and shows only the overlay
  const styleEl = document.createElement('style');
  styleEl.id = STYLE_ID;
  styleEl.textContent = `
    /* Template styles */
    #${OVERLAY_ID} { ${styles} }

    /* Print-only: hide app, show overlay */
    @media print {
      body > *:not(#${OVERLAY_ID}) { display: none !important; visibility: hidden !important; }
      #${OVERLAY_ID} {
        display: block !important;
        position: fixed !important;
        inset: 0 !important;
        width: 100% !important;
        background: #fff !important;
        color: #1E293B !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        font-size: 13px !important;
        padding: 40px 48px 56px !important;
        z-index: 999999 !important;
        overflow: visible !important;
      }
    }
  `;
  document.head.appendChild(styleEl);

  // Trigger print
  window.print();

  // Clean up after the print dialog closes
  const cleanup = () => {
    document.getElementById(OVERLAY_ID)?.remove();
    document.getElementById(STYLE_ID)?.remove();
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  // Fallback cleanup in case afterprint doesn't fire
  setTimeout(cleanup, 30_000);
}
