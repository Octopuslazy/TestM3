const fs = require('fs');
const path = require('path');

const DIST = path.resolve(__dirname, '..', 'dist');
const ASSETS_DIR = path.join(DIST, 'assets');

function inlineAssets() {
  if (!fs.existsSync(DIST)) {
    console.error('dist folder not found');
    process.exit(1);
  }

  const files = fs.readdirSync(DIST).filter(f => f.endsWith('.html'));
  if (files.length === 0) {
    console.log('No HTML files in dist to process');
    return;
  }

  for (const file of files) {
    const fp = path.join(DIST, file);
    let html = fs.readFileSync(fp, 'utf8');

    // Inline <script src="assets/..."> references
    html = html.replace(/<script\s+[^>]*src=["'](assets\/[^"]+)["'][^>]*><\/script>/gi, (m, src) => {
      const assetPath = path.join(DIST, src.replace(/\//g, path.sep));
      if (fs.existsSync(assetPath)) {
        const code = fs.readFileSync(assetPath, 'utf8');
        return `<script>${code}</script>`;
      }
      return m;
    });

    // Inline <link rel="stylesheet" href="assets/..."> (if any)
    html = html.replace(/<link\s+[^>]*href=["'](assets\/[^"]+\.css)["'][^>]*>/gi, (m, href) => {
      const assetPath = path.join(DIST, href.replace(/\//g, path.sep));
      if (fs.existsSync(assetPath)) {
        const css = fs.readFileSync(assetPath, 'utf8');
        return `<style>${css}</style>`;
      }
      return m;
    });

    // Remove any module script tags that reference source .ts files (e.g. ./main.ts)
    html = html.replace(/<script[^>]*type=["']module["'][^>]*src=["']([^"']+\.ts)["'][^>]*>\s*<\/script>/gi, '');

    // Remove any remaining script tags referencing .ts files
    html = html.replace(/<script[^>]*src=["']([^"']+\.ts)["'][^>]*>\s*<\/script>/gi, '');

    fs.writeFileSync(fp, html, 'utf8');
    console.log('Inlined assets into', fp);
  }

  // Remove assets directory if exists
  if (fs.existsSync(ASSETS_DIR)) {
    // remove recursively
    fs.rmSync(ASSETS_DIR, { recursive: true, force: true });
    console.log('Removed', ASSETS_DIR);
  }
}

inlineAssets();
