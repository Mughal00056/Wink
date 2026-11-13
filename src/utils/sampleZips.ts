import JSZip from 'jszip';
import type { SampleTemplateMeta } from '../types/converter';

export const SAMPLE_TEMPLATES: SampleTemplateMeta[] = [
  {
    id: 'studio-landing',
    name: 'Editorial Studio Site',
    archiveName: 'studio-landing.zip',
    summary: 'Multi-page HTML site with shared navigation, styles, SVG mark, and script.',
    fileCountHint: '6 files',
  },
  {
    id: 'analytics-portal',
    name: 'Analytics Dashboard Template',
    archiveName: 'analytics-portal.zip',
    summary: 'Metrics layout with inline styles, data tables, and SVG icon assets.',
    fileCountHint: '4 files',
  },
  {
    id: 'ui-components-kit',
    name: 'SVG Icon & Card Pack',
    archiveName: 'ui-components-kit.zip',
    summary: 'Component showcase paired with standalone SVG icons for React extraction.',
    fileCountHint: '5 files',
  },
];

export async function createSampleZipBuffer(templateId: string): Promise<{ buffer: ArrayBuffer; fileName: string }> {
  const zip = new JSZip();

  if (templateId === 'analytics-portal') {
    zip.file(
      'index.html',
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Meridian Operations Console</title>
  <link rel="stylesheet" href="styles/dashboard.css" />
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <img src="icons/chart.svg" alt="Meridian logo" width="24" height="24" />
      <span>Meridian Ops</span>
    </div>
    <nav class="nav-links">
      <a href="#overview">Overview</a>
      <a href="#clusters">Clusters</a>
      <a href="#audit">Audit Log</a>
    </nav>
    <button type="button" class="primary-btn" onclick="handleExport()">Export Report</button>
  </header>

  <main class="container">
    <section id="overview" class="kpi-grid">
      <article class="kpi-card">
        <span class="kpi-label">Monthly Active Workspaces</span>
        <strong class="kpi-value">14,820</strong>
        <span class="kpi-delta">+12.4% vs prior 30 days</span>
      </article>
      <article class="kpi-card">
        <span class="kpi-label">Median Request Latency</span>
        <strong class="kpi-value">38 ms</strong>
        <span class="kpi-delta">Within 50 ms SLA target</span>
      </article>
      <article class="kpi-card">
        <span class="kpi-label">Queue Throughput</span>
        <strong class="kpi-value">2,940 / sec</strong>
        <span class="kpi-delta">Zero dropped batches</span>
      </article>
    </section>

    <section id="clusters" class="table-section">
      <h2>Regional Cluster Inventory</h2>
      <table class="data-table">
        <thead>
          <tr>
            <th>Region</th>
            <th>Nodes</th>
            <th>Utilization</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>us-west-2</td>
            <td>24</td>
            <td>61.4%</td>
            <td>Healthy</td>
          </tr>
          <tr>
            <td>eu-central-1</td>
            <td>18</td>
            <td>54.2%</td>
            <td>Healthy</td>
          </tr>
          <tr>
            <td>ap-southeast-1</td>
            <td>12</td>
            <td>72.8%</td>
            <td>Elevated</td>
          </tr>
        </tbody>
      </table>
    </section>
  </main>

  <footer class="footer">
    <p>Meridian Operations Suite · Updated November 2026</p>
  </footer>
</body>
</html>`
    );

    zip.file(
      'styles/dashboard.css',
      `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; color: #0f172a; line-height: 1.5; }
.topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; background: #ffffff; border-bottom: 1px solid #e2e8f0; }
.brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 16px; }
.nav-links { display: flex; gap: 24px; }
.nav-links a { color: #475569; text-decoration: none; font-size: 14px; font-weight: 500; }
.nav-links a:hover { color: #0f172a; }
.primary-btn { background: #2563eb; color: #ffffff; border: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; }
.container { max-width: 1120px; margin: 0 auto; padding: 32px 24px; }
.kpi-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-bottom: 32px; }
.kpi-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; display: flex; flex-direction: column; gap: 6px; }
.kpi-label { font-size: 12px; color: #64748b; font-weight: 500; }
.kpi-value { font-size: 28px; font-weight: 700; color: #0f172a; font-variant-numeric: tabular-nums; }
.kpi-delta { font-size: 12px; color: #059669; }
.table-section { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; }
.table-section h2 { font-size: 16px; font-weight: 600; margin-bottom: 16px; }
.data-table { width: 100%; border-collapse: collapse; font-size: 14px; }
.data-table th, .data-table td { text-align: left; padding: 12px 8px; border-bottom: 1px solid #f1f5f9; }
.data-table th { color: #64748b; font-weight: 500; font-size: 12px; }
.footer { max-width: 1120px; margin: 24px auto 40px; padding: 0 24px; font-size: 12px; color: #64748b; }`
    );

    zip.file(
      'icons/chart.svg',
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 3v18h18" />
  <path d="M18 9l-5 5-4-4-3 3" />
</svg>`
    );

    zip.file(
      'icons/shield.svg',
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  <path d="M9 12l2 2 4-4" />
</svg>`
    );

    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    return { buffer, fileName: 'analytics-portal.zip' };
  }

  if (templateId === 'ui-components-kit') {
    zip.file(
      'index.html',
      `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Foundry UI Pattern Library</title>
  <link rel="stylesheet" href="styles/kit.css" />
</head>
<body>
  <header class="kit-header">
    <h1>Foundry UI Patterns</h1>
    <p>Reusable HTML blocks and vector icons ready for React extraction.</p>
  </header>

  <main class="kit-grid">
    <section id="card-primitives" class="kit-card">
      <div class="icon-wrap">
        <img src="icons/layers.svg" alt="Layers" width="28" height="28" />
      </div>
      <h2>Composable Layout Primitives</h2>
      <p>Clean grid containers with hairline borders and balanced whitespace rhythm.</p>
      <a href="#docs" class="text-link">Inspect specification</a>
    </section>

    <section id="cli-workflows" class="kit-card">
      <div class="icon-wrap">
        <img src="icons/terminal.svg" alt="Terminal" width="28" height="28" />
      </div>
      <h2>Automated Build Scripts</h2>
      <p>Zero-config Vite compilation pipelines with TypeScript strict mode enabled.</p>
      <a href="#scripts" class="text-link">View package scripts</a>
    </section>

    <section id="asset-bundling" class="kit-card">
      <div class="icon-wrap">
        <img src="icons/download.svg" alt="Download" width="28" height="28" />
      </div>
      <h2>Portable Asset Bundles</h2>
      <p>Every SVG icon becomes a typed React component accepting standard SVGProps.</p>
      <a href="#assets" class="text-link">Browse exported icons</a>
    </section>
  </main>
</body>
</html>`
    );

    zip.file(
      'styles/kit.css',
      `body { font-family: system-ui, sans-serif; background: #ffffff; color: #111827; margin: 0; padding: 48px 24px; }
.kit-header { max-width: 960px; margin: 0 auto 40px; border-bottom: 1px solid #e5e7eb; padding-bottom: 24px; }
.kit-header h1 { font-size: 30px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.02em; }
.kit-header p { font-size: 16px; color: #4b5563; margin: 0; }
.kit-grid { max-width: 960px; margin: 0 auto; display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px; }
.kit-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; display: flex; flex-direction: column; gap: 12px; }
.icon-wrap { width: 44px; height: 44px; border-radius: 8px; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
.kit-card h2 { font-size: 17px; font-weight: 600; margin: 0; }
.kit-card p { font-size: 14px; color: #4b5563; line-height: 1.6; margin: 0; }
.text-link { font-size: 13px; font-weight: 600; color: #2563eb; text-decoration: none; margin-top: auto; }`
    );

    zip.file(
      'icons/layers.svg',
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="12 2 2 7 12 12 22 7 12 2" />
  <polyline points="2 17 12 22 22 17" />
  <polyline points="2 12 12 17 22 12" />
</svg>`
    );

    zip.file(
      'icons/terminal.svg',
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <polyline points="4 17 10 11 4 5" />
  <line x1="12" y1="19" x2="20" y2="19" />
</svg>`
    );

    zip.file(
      'icons/download.svg',
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#111827" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
  <polyline points="7 10 12 15 17 10" />
  <line x1="12" y1="15" x2="12" y2="3" />
</svg>`
    );

    const buffer = await zip.generateAsync({ type: 'arraybuffer' });
    return { buffer, fileName: 'ui-components-kit.zip' };
  }

  // Default: studio-landing
  zip.file(
    'index.html',
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Northbridge Architecture Studio</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <header class="site-header">
    <a href="index.html" class="wordmark">
      <img src="assets/logo.svg" alt="Northbridge emblem" width="28" height="28" />
      <span>Northbridge</span>
    </a>
    <nav class="main-nav">
      <a href="index.html">Practice</a>
      <a href="about.html">About</a>
      <a href="#projects">Projects</a>
      <a href="#contact">Contact</a>
    </nav>
    <a href="#contact" class="cta-link">Schedule Consultation</a>
  </header>

  <main>
    <section id="hero" class="hero-section">
      <p class="eyebrow">Civic &amp; Timber Architecture · Portland &amp; Zurich</p>
      <h1>Spatial structures built for generational permanence.</h1>
      <p class="lead">
        We design public libraries, cultural pavilions, and mass-timber workplaces calibrated to natural daylight and local craftsmanship.
      </p>
      <div class="hero-actions">
        <a href="about.html" class="btn-solid">Explore Our Practice</a>
        <a href="#projects" class="btn-outline">Selected Commissions</a>
      </div>
    </section>

    <section id="projects" class="projects-section">
      <h2>Selected Commissions</h2>
      <div class="project-grid">
        <article class="project-card">
          <span class="meta">Civic · Completed 2025</span>
          <h3>Willamette Timber Pavilion</h3>
          <p>Cross-laminated Douglas fir roof canopy spanning 42 meters without interior columns.</p>
        </article>
        <article class="project-card">
          <span class="meta">Cultural · In Construction</span>
          <h3>Limmat River Reading Hall</h3>
          <p>North-facing clerestory glazing engineered for glare-free archival reading rooms.</p>
        </article>
      </div>
    </section>
  </main>

  <footer id="contact" class="site-footer">
    <p>Northbridge Architecture Practice · studio@northbridge.example</p>
    <p>412 NW Couch Street, Portland, OR</p>
  </footer>
  <script src="js/main.js"></script>
</body>
</html>`
  );

  zip.file(
    'about.html',
    `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>About — Northbridge Architecture Studio</title>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body>
  <header class="site-header">
    <a href="index.html" class="wordmark">
      <img src="assets/logo.svg" alt="Northbridge emblem" width="28" height="28" />
      <span>Northbridge</span>
    </a>
    <nav class="main-nav">
      <a href="index.html">Practice</a>
      <a href="about.html">About</a>
      <a href="index.html#projects">Projects</a>
      <a href="index.html#contact">Contact</a>
    </nav>
    <a href="index.html#contact" class="cta-link">Schedule Consultation</a>
  </header>

  <main>
    <section id="methodology" class="hero-section">
      <p class="eyebrow">Practice Methodology</p>
      <h1>Material honesty before surface ornament.</h1>
      <p class="lead">
        Founded in 2016, Northbridge brings structural engineers and architectural fabricators into the studio from schematic day one.
      </p>
      <div style="margin-top: 24px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <strong>Studio Disciplines</strong>
        <p style="margin-top: 8px; color: #475569;">Mass Timber Detailing · Passive Solar Envelope · Acoustic Modeling</p>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <p>Northbridge Architecture Practice · studio@northbridge.example</p>
  </footer>
</body>
</html>`
  );

  zip.file(
    'css/styles.css',
    `* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, -apple-system, sans-serif; background: #fafaf9; color: #1c1917; line-height: 1.6; }
.site-header { max-width: 1120px; margin: 0 auto; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e7e5e4; }
.wordmark { display: inline-flex; align-items: center; gap: 10px; font-weight: 700; font-size: 18px; color: #1c1917; text-decoration: none; }
.main-nav { display: flex; gap: 28px; }
.main-nav a { color: #57534e; text-decoration: none; font-size: 14px; font-weight: 500; }
.main-nav a:hover { color: #1c1917; }
.cta-link { background: #1c1917; color: #fafaf9; padding: 9px 16px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none; }
.hero-section { max-width: 1120px; margin: 0 auto; padding: 64px 24px 48px; }
.eyebrow { font-size: 13px; color: #78716c; margin-bottom: 12px; }
.hero-section h1 { font-size: 42px; line-height: 1.15; max-width: 720px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 18px; }
.lead { font-size: 17px; color: #44403c; max-width: 620px; margin-bottom: 28px; }
.hero-actions { display: flex; gap: 12px; }
.btn-solid { background: #1c1917; color: #ffffff; padding: 11px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; }
.btn-outline { border: 1px solid #d6d3d1; color: #1c1917; padding: 11px 20px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none; }
.projects-section { max-width: 1120px; margin: 0 auto; padding: 40px 24px 64px; border-top: 1px solid #e7e5e4; }
.projects-section h2 { font-size: 22px; margin-bottom: 24px; }
.project-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.project-card { background: #ffffff; border: 1px solid #e7e5e4; border-radius: 8px; padding: 24px; }
.meta { display: block; font-size: 12px; color: #78716c; margin-bottom: 8px; }
.project-card h3 { font-size: 18px; margin-bottom: 8px; }
.project-card p { font-size: 14px; color: #57534e; }
.site-footer { max-width: 1120px; margin: 0 auto; padding: 28px 24px 48px; border-top: 1px solid #e7e5e4; display: flex; justify-content: space-between; font-size: 13px; color: #78716c; }`
  );

  zip.file(
    'js/main.js',
    `document.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('a[href^="#"]');
  links.forEach((link) => {
    link.addEventListener('click', (event) => {
      const targetId = link.getAttribute('href')?.slice(1);
      const target = targetId ? document.getElementById(targetId) : null;
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});`
  );

  zip.file(
    'assets/logo.svg',
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none">
  <rect x="2" y="2" width="24" height="24" rx="5" stroke="#1c1917" stroke-width="2" />
  <path d="M9 20V8L19 20V8" stroke="#1c1917" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
</svg>`
  );

  const buffer = await zip.generateAsync({ type: 'arraybuffer' });
  return { buffer, fileName: 'studio-landing.zip' };
}
