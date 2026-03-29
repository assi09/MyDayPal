import { writeTextFile } from '@tauri-apps/plugin-fs';
import { tempDir } from '@tauri-apps/api/path';
import { openUrl } from '@tauri-apps/plugin-opener';

export async function printHTML(html: string) {
  try {
    // Write HTML to a temp file
    const tmp = await tempDir();
    const filename = `mydaypal-report-${Date.now()}.html`;
    const filepath = `${tmp}${filename}`;
    await writeTextFile(filepath, html);

    // Open in system default browser where the user can print / Save as PDF
    await openUrl(`file://${filepath}`);
  } catch {
    // Fallback: try opening as data URI
    try {
      const encoded = encodeURIComponent(html);
      await openUrl(`data:text/html;charset=utf-8,${encoded}`);
    } catch {
      // Last resort: inject into current page
      alert('Could not open report. Check your permissions.');
    }
  }
}
