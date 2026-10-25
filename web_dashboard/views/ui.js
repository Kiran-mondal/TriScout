function generateLayout(pageTitle, content) {
  const isDashboard = pageTitle === 'COMMAND CENTER';
  const activeCls = 'bg-surface-container-high text-on-surface border-l-2 border-primary shadow-[inset_0_0_12px_rgba(57,255,136,0.15)]';
  const normalCls = 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface';

  return `<!DOCTYPE html>
<html class="dark" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="shell-type" content="web_dashboard" />
    <title>TriScout :: ${pageTitle}</title>
    <link rel="icon" type="image/svg+xml" href="/logo.svg" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=JetBrains+Mono:wght@100..900&display=swap" rel="stylesheet" />
    <style>
      html, body { margin: 0; padding: 0; background: #10131b; color: #e0e2ed; }
      body { overflow-x: hidden; }
      * { box-sizing: border-box; }
      ::-webkit-scrollbar { display: none; }
      .app-shell { display: flex; min-height: 100vh; }
      .sidebar { width: 290px; background: #181b23; border-right: 1px solid rgba(132,149,132,0.25); position: sticky; top: 0; height: 100vh; }
      .sidebar-header { height: 72px; border-bottom: 1px solid rgba(132,149,132,0.2); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; }
      .nav-item { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; margin: 6px 10px; text-decoration: none; font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 600; transition: all 0.2s ease; }
      .nav-item.active { background: rgba(39, 42, 50, 0.9); color: #e0e2ed; border-left: 2px solid #39ff88; }
      .nav-item:hover { background: rgba(39, 42, 50, 0.7); color: #e0e2ed; }
      .main-panel { flex: 1; min-width: 0; }
      .topbar { height: 72px; border-bottom: 1px solid rgba(132,149,132,0.2); display: flex; align-items: center; justify-content: space-between; padding: 0 28px; }
      .content { padding: 24px 28px 40px; }
      .card { background: #1d2027; border: 1px solid rgba(132,149,132,0.18); border-radius: 16px; box-shadow: inset 0 1px 0 rgba(255,255,255,.02); }
      .dashboard-grid { display: grid; grid-template-columns: 1.1fr 1.9fr; gap: 24px; }
      .tab-buttons { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px; }
      .tab-btn { border: 1px solid rgba(132,149,132,0.2); background: rgba(39,42,50,0.55); color: #bacbb9; padding: 10px 16px; border-radius: 10px; font-weight: 600; cursor: pointer; transition: 0.2s; }
      .tab-btn.active { background: #2d3038; color: #e0e2ed; border-color: rgba(57,255,136,0.5); box-shadow: inset 0 0 0 1px rgba(57,255,136,0.28); }
      .tab-panel { display: none; }
      .tab-panel.active { display: block; }
      .metric { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 14px; }
      .metric-box { background: rgba(39,42,50,0.5); border: 1px solid rgba(132,149,132,0.16); border-radius: 12px; padding: 14px; }
      .status-pill { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; }
      .status-live { background: rgba(57,255,136,0.12); color: #63ff95; border: 1px solid rgba(57,255,136,0.3); }
      .status-warn { background: rgba(255,183,71,0.12); color: #ffca64; border: 1px solid rgba(255,183,71,0.3); }
      .status-bad { background: rgba(255,180,171,0.1); color: #ffb4ab; border: 1px solid rgba(255,180,171,0.25); }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 10px 12px; border-bottom: 1px solid rgba(132,149,132,0.12); text-align: left; }
      th { color: #bacbb9; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
      @media (max-width: 980px) { .sidebar { position: fixed; left: -290px; height: 100vh; z-index: 50; } .sidebar.mobile-open { left: 0; } .main-panel { width: 100%; } .dashboard-grid { grid-template-columns: 1fr; } }
    </style>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              background: '#10131b',
              surface: '#10131b',
              'surface-container': '#1d2027',
              'surface-container-low': '#181b23',
              'surface-container-high': '#272a32',
              'surface-variant': '#32353d',
              'on-surface': '#e0e2ed',
              'on-surface-variant': '#bacbb9',
              'primary': '#39ff88',
              'primary-container': '#39ff88',
              'outline': '#849584',
              'on-primary': '#003918',
              'secondary': '#aeecff',
              'secondary-fixed': '#aeecff',
              'tertiary': '#fffbff'
            }
          }
        }
      };
    </script>
  </head>
  <body class="bg-background text-on-surface antialiased selection:bg-primary-container selection:text-on-primary">
    <div class="app-shell">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
          <div class="flex items-center gap-2">
            <span class="relative flex h-2.5 w-2.5">
              <span class="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping"></span>
              <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
            </span>
            <span class="font-bold uppercase tracking-[0.2em] text-[11px] text-on-surface">OP-CONSOLE</span>
          </div>
          <span class="status-pill status-live">Active</span>
        </div>
        <div class="px-4 py-5">
          <nav class="flex flex-col gap-1">
            <a href="/dashboard" class="nav-item ${pageTitle === 'COMMAND CENTER' ? 'active' : normalCls}">
              <span class="material-symbols-outlined text-base">dashboard</span>
              Dashboard
            </a>
            <a href="/reports" class="nav-item ${pageTitle === 'REPORTS' ? 'active' : normalCls}">
              <span class="material-symbols-outlined text-base">assessment</span>
              Reports
            </a>
            <a href="/cli" class="nav-item ${pageTitle === 'CLI' ? 'active' : normalCls}">
              <span class="material-symbols-outlined text-base">terminal</span>
              CLI
            </a>
            <a href="/project" class="nav-item ${pageTitle === 'PROJECT' ? 'active' : normalCls}">
              <span class="material-symbols-outlined text-base">folder_open</span>
              Project
            </a>
            <a href="/about" class="nav-item ${pageTitle === 'ABOUT' ? 'active' : normalCls}">
              <span class="material-symbols-outlined text-base">info</span>
              About
            </a>
            <a href="/profile" class="nav-item ${pageTitle === 'PROFILE' ? 'active' : normalCls}">
              <span class="material-symbols-outlined text-base">account_circle</span>
              Profile
            </a>
          </nav>
        </div>
      </aside>

      <main class="main-panel">
        <header class="topbar">
          <div class="flex items-center gap-3">
            <button id="sidebarToggle" class="rounded-lg border border-outline/40 bg-surface-container px-2 py-2 text-on-surface md:hidden">☰</button>
            <div>
              <div class="text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">TriScout</div>
              <div class="text-xl font-semibold text-on-surface">${pageTitle}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <span class="status-pill status-live">Live</span>
            <span class="rounded-full border border-outline/40 bg-surface-container px-3 py-2 text-sm text-on-surface-variant">v2.4</span>
          </div>
        </header>

        <div class="content">
          ${content}
        </div>
      </main>
    </div>

    <script>
      const updateSidebar = () => {
        const currentPath = window.location.pathname;
        const links = document.querySelectorAll('.nav-item');
        links.forEach(link => {
          const isMatch = (link.getAttribute('href') === currentPath);
          link.classList.toggle('active', isMatch);
        });
      };

      const toggleSidebar = () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('mobile-open');
      };

      const tabButtons = document.querySelectorAll('.tab-btn');
      const tabPanels = document.querySelectorAll('.tab-panel');

      function activateTab(name) {
        tabButtons.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.tab === name);
        });
        tabPanels.forEach(panel => {
          panel.classList.toggle('active', panel.dataset.tab === name);
        });

        const query = new URLSearchParams(window.location.search);
        query.set('tab', name);
        const url = `${window.location.pathname}?${query.toString()}`;
        history.replaceState(null, '', url);
      }

      tabButtons.forEach(btn => {
        btn.addEventListener('click', () => activateTab(btn.dataset.tab));
      });

      const initialTab = new URLSearchParams(window.location.search).get('tab') || 'overview';
      if (document.querySelector('.tab-btn')) activateTab(initialTab);
      updateSidebar();

      const sidebarToggle = document.getElementById('sidebarToggle');
      if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    </script>
  </body>
</html>`;
}

function getOverviewTab() {
  return `
    <div class="tab-panel active" data-tab="overview">
      <div class="mb-6 card p-5">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div class="text-[11px] uppercase tracking-[0.22em] text-on-surface-variant">Overview</div>
            <h2 class="mt-2 text-2xl font-semibold text-on-surface">Target posture snapshot</h2>
          </div>
          <span class="status-pill status-live">Network ready</span>
        </div>
      </div>

      <div class="dashboard-grid">
        <div class="card p-5">
          <h3 class="text-lg font-semibold mb-4 text-on-surface">System profile</h3>
          <div class="space-y-4">
            <div>
              <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Target authority</div>
              <div class="mt-1 text-xl font-semibold text-on-surface">tri://live-target</div>
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Sync time</div>
              <div class="mt-1 text-xl font-semibold text-on-surface">2026-10-25 14:00 UTC</div>
            </div>
            <div>
              <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">System state</div>
              <div class="mt-1 text-xl font-semibold text-on-surface">Healthy</div>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-lg font-semibold mb-4 text-on-surface">Operational metrics</h3>
          <div class="metric">
            <div class="metric-box">
              <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Hosts</div>
              <div class="mt-2 text-2xl font-bold text-primary">128</div>
            </div>
            <div class="metric-box">
              <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Ports</div>
              <div class="mt-2 text-2xl font-bold text-primary">4,382</div>
            </div>
            <div class="metric-box">
              <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Services</div>
              <div class="mt-2 text-2xl font-bold text-primary">321</div>
            </div>
            <div class="metric-box">
              <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Alerts</div>
              <div class="mt-2 text-2xl font-bold text-primary">8</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getReconTab() {
  return `
    <div class="tab-panel" data-tab="recon">
      <div class="card p-5">
        <h3 class="text-lg font-semibold mb-4 text-on-surface">Reconnaissance stream</h3>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Port</th>
              <th>Risk</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>SSH</td><td>22</td><td><span class="status-pill status-live">Low</span></td><td>Open</td></tr>
            <tr><td>HTTP</td><td>80</td><td><span class="status-pill status-warn">Medium</span></td><td>Open</td></tr>
            <tr><td>HTTPS</td><td>443</td><td><span class="status-pill status-live">Low</span></td><td>Open</td></tr>
            <tr><td>MySQL</td><td>3306</td><td><span class="status-pill status-bad">High</span></td><td>Detected</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function getIntelTab() {
  return `
    <div class="tab-panel" data-tab="intel">
      <div class="card p-5">
        <h3 class="text-lg font-semibold mb-4 text-on-surface">Threat intelligence</h3>
        <div class="space-y-4">
          <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4">
            <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Observed DNA</div>
            <div class="mt-2 text-lg font-semibold text-on-surface">Nginx · OpenSSH · PostgreSQL</div>
          </div>
          <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4">
            <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Risk notes</div>
            <div class="mt-2 text-base text-on-surface">TLS is active, but certificate expiry window is narrow and several endpoints respond with default headers.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getComplianceTab() {
  return `
    <div class="tab-panel" data-tab="compliance">
      <div class="card p-5">
        <h3 class="text-lg font-semibold mb-4 text-on-surface">Compliance posture</h3>
        <div class="space-y-3">
          <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4">
            <div class="flex items-center justify-between"><span>Encryption baseline</span><span class="status-pill status-live">Pass</span></div>
          </div>
          <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4">
            <div class="flex items-center justify-between"><span>IAM boundary review</span><span class="status-pill status-warn">Review</span></div>
          </div>
          <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4">
            <div class="flex items-center justify-between"><span>Public exposure scan</span><span class="status-pill status-bad">Flagged</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function getDashboardPage() {
  const content = `
    <div class="mb-4 tab-buttons">
      <button class="tab-btn active" data-tab="overview">Overview</button>
      <button class="tab-btn" data-tab="recon">Recon</button>
      <button class="tab-btn" data-tab="intel">Intel</button>
      <button class="tab-btn" data-tab="compliance">Compliance</button>
    </div>
    ${getOverviewTab()}
    ${getReconTab()}
    ${getIntelTab()}
    ${getComplianceTab()}
  `;
  return generateLayout('COMMAND CENTER', content);
}

function getReportsPage() {
  const content = `
    <div class="card p-6">
      <h2 class="text-2xl font-semibold mb-4 text-on-surface">Reports</h2>
      <div class="grid md:grid-cols-2 gap-4">
        <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4">
          <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Security report</div>
          <div class="mt-2 text-lg font-semibold text-on-surface">Executive summary</div>
        </div>
        <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4">
          <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">Network report</div>
          <div class="mt-2 text-lg font-semibold text-on-surface">Port exposure matrix</div>
        </div>
      </div>
    </div>
  `;
  return generateLayout('REPORTS', content);
}

function getCliPage() {
  const content = `
    <div class="card p-6">
      <h2 class="text-2xl font-semibold mb-4 text-on-surface">CLI</h2>
      <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4 font-mono text-sm text-on-surface">
        $ triscout scan --target 10.0.0.15 --ports 1-65535<br>
        [OK] target validated<br>
        [OK] scan queued<br>
        [OK] report generated
      </div>
    </div>
  `;
  return generateLayout('CLI', content);
}

function getAboutPage() {
  const content = `
    <div class="card p-6">
      <h2 class="text-2xl font-semibold mb-4 text-on-surface">About TriScout</h2>
      <p class="text-on-surface-variant leading-7">
        TriScout is a modular cybersecurity and reconnaissance dashboard built to surface live service posture, intel, and compliance signals from distributed scans.
      </p>
    </div>
  `;
  return generateLayout('ABOUT', content);
}

function getProjectPage() {
  const content = `
    <div class="card p-6">
      <h2 class="text-2xl font-semibold mb-4 text-on-surface">Project</h2>
      <div class="space-y-3">
        <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4">Repository: Kiran-mondal/TriScout</div>
        <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4">Modules: Go scanner, Python enrichment, Node dashboard</div>
        <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4">Status: Active</div>
      </div>
    </div>
  `;
  return generateLayout('PROJECT', content);
}

function getProfilePage() {
  const content = `
    <div class="card p-6">
      <h2 class="text-2xl font-semibold mb-4 text-on-surface">Profile</h2>
      <div class="rounded-xl border border-outline/20 bg-surface-container-low p-4">
        <div class="text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">User</div>
        <div class="mt-2 text-xl font-semibold text-on-surface">Administrator</div>
      </div>
    </div>
  `;
  return generateLayout('PROFILE', content);
}

module.exports = {
  generateLayout,
  getDashboardPage,
  getReportsPage,
  getCliPage,
  getAboutPage,
  getProjectPage,
  getProfilePage,
  getOverviewTab
};
