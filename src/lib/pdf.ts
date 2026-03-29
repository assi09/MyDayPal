/**
 * Export report as an HTML file that auto-opens the browser's print dialog.
 * The user can then "Save as PDF" from the print dialog for a perfect result.
 */
export function printHTML(html: string) {
  const filename = `mydaypal-report-${Date.now()}.html`;

  // Inject a print trigger + print-optimized styles into the HTML
  const printReady = html.replace(
    '</head>',
    `<style>
      @media print {
        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      }
    </style>
    <script>window.onload = function() { setTimeout(function() { window.print(); }, 400); }<\/script>
    </head>`
  );

  const blob = new Blob([printReady], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}
