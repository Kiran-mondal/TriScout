// ==========================================
// 파일: web_dashboard/views/ui.js
// (সমস্ত UI/UX ডিজাইন এখানে থাকবে - server.js এ হাত না দিয়েই এখান থেকে ডিজাইন আপডেট করা যাবে)
// ==========================================

function generateLayout(pageTitle, content) {
    const activeLink = "flex items-center gap-3 px-4 py-3 rounded-xl text-cyan-400 font-bold bg-gradient-to-r from-cyan-500/20 to-transparent border-l-4 border-cyan-400 shadow-sm";
    const normalLink = "flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 font-medium hover:bg-slate-800/60 hover:text-slate-200 transition-all";

    return `
    <!DOCTYPE html>
    <html class="dark" lang="en">
    <head>
        <meta charset="utf-8"/>
        <meta content="width=device-width, initial-scale=1.0" name="viewport"/>
        <title>TriScout SOC // ${pageTitle}</title>
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        
        <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
        <script>
            tailwind.config = {
                darkMode: "class",
                theme: {
                    extend: {
                        fontFamily: {
                            "sans": ["Inter", "sans-serif"],
                            "mono": ["JetBrains Mono", "monospace"]
                        }
                    }
                }
            }
        </script>
        <style>
            body { background-color: #090d16; color: #e2e8f0; }
            .soc-card {
                background: linear-gradient(145deg, rgba(19, 26, 42, 0.9), rgba(13, 18, 30, 0.95));
                border: 1px solid rgba(255, 255, 255, 0.07);
                box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(12px);
            }
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        </style>
    </head>
    <body class="font-sans min-h-screen selection:bg-cyan-500 selection:text-black">
        
        <!-- Left Sidebar (SOC.AI Style) -->
        <aside id="mobileSidebar" class="bg-[#0c111d] h-screen w-64 flex flex-col border-r border-slate-800/80 fixed left-0 top-0 z-50 transform -translate-x-full md:translate-x-0 transition-transform duration-300">
            <div class="p-6 flex justify-between items-center border-b border-slate-800/60">
                <div class="flex items-center gap-3">
                    <img src="/logo.svg" alt="TriScout" class="w-9 h-9 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                    <div>
                        <span class="text-xl font-extrabold tracking-wider text-white">TRI<span class="text-cyan-400">SCOUT</span></span>
                        <span class="block text-[10px] font-mono text-emerald-400 uppercase tracking-widest">SOC Engine v2.0</span>
                    </div>
                </div>
                <button onclick="toggleMenu()" class="md:hidden text-slate-400 p-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
            
            <div class="flex-1 overflow-y-auto py-6 flex flex-col gap-1.5 px-3">
                <a href="/dashboard" class="${pageTitle === 'COMMAND CENTER' ? activeLink : normalLink}">
                    <span class="material-symbols-outlined">dashboard</span><span>Dashboard</span>
                </a>
                <a href="/reports" class="${pageTitle === 'REPORTS' ? activeLink : normalLink}">
                    <span class="material-symbols-outlined">description</span><span>Reports</span>
                </a>
                <a href="/cli" class="${pageTitle === 'CLI TOOL' ? activeLink : normalLink}">
                    <span class="material-symbols-outlined">terminal</span><span>CLI Tool</span>
                </a>
                <a href="/about" class="${pageTitle === 'ABOUT TRISCOUT' ? activeLink : normalLink}">
                    <span class="material-symbols-outlined">shield_lock</span><span>Architecture</span>
                </a>
                <a href="/project" class="${pageTitle === 'MY PROJECTS' ? activeLink : normalLink}">
                    <span class="material-symbols-outlined">folder_special</span><span>My Projects</span>
                </a>
                <a href="/profile" class="${pageTitle === 'USER PROFILE' ? activeLink : normalLink}">
                    <span class="material-symbols-outlined">settings</span><span>Settings</span>
                </a>
                
                <button onclick="localStorage.removeItem('token'); window.location.href='/'" class="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 font-medium hover:bg-rose-500/10 transition-colors mt-auto w-full text-left">
                    <span class="material-symbols-outlined">logout</span><span>Disconnect</span>
                </button>
            </div>
        </aside>

        <div id="sidebarOverlay" onclick="toggleMenu()" class="fixed inset-0 bg-black/60 z-40 hidden md:hidden"></div>

        <!-- Top Navigation Header -->
        <header class="bg-[#0c111d]/90 backdrop-blur-xl h-16 flex items-center justify-between px-4 md:px-8 z-40 border-b border-slate-800/80 fixed top-0 right-0 left-0 md:left-64">
            <div class="flex items-center gap-3">
                <button onclick="toggleMenu()" class="md:hidden text-slate-200 p-2 rounded-lg hover:bg-slate-800">
                    <span class="material-symbols-outlined">menu</span>
                </button>
                <div class="flex items-center gap-2 text-xs font-mono">
                    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span class="text-slate-400">STATUS:</span>
                    <span class="text-emerald-400 font-bold">DEFENSE GRID ONLINE</span>
                </div>
            </div>
            
            <div class="relative"> 
                <button onclick="toggleDropdown()" class="flex items-center gap-2.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/60 py-1.5 px-3 rounded-xl transition-all">
                    <div id="navProfileAvatar" class="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-bold overflow-hidden text-xs">
                        <span class="material-symbols-outlined text-sm">person</span>
                    </div>
                    <div class="hidden sm:block text-left">
                        <div id="navProfileName" class="text-xs font-bold text-slate-200 leading-none">Operator</div>
                        <div class="text-[10px] text-slate-400 font-mono mt-0.5">Authorized</div>
                    </div>
                    <span class="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                </button>
                
                <div id="profileDropdown" class="hidden absolute right-0 top-[calc(100%+8px)] w-52 soc-card rounded-xl shadow-2xl overflow-hidden z-50 border border-slate-700">
                    <div class="px-4 py-3 border-b border-slate-800">
                        <p class="text-[11px] text-slate-400">Signed in as</p>
                        <p class="text-sm font-bold text-white truncate" id="dropdownUserName">Operator</p>
                    </div>
                    <a href="/profile" class="flex items-center gap-2.5 px-4 py-2.5 text-xs text-slate-200 hover:bg-slate-800 transition-colors">
                        <span class="material-symbols-outlined text-base text-cyan-400">manage_accounts</span> Profile Settings
                    </a>
                    <button onclick="localStorage.removeItem('token'); window.location.href='/'" class="w-full text-left flex items-center gap-2.5 px-4 py-2.5 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors border-t border-slate-800">
                        <span class="material-symbols-outlined text-base">logout</span> Sign Out
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Workspace -->
        <main class="pt-20 md:ml-64 p-4 md:p-8 min-h-screen">
            ${content}
        </main>

        <script>
            function toggleMenu() {
                document.getElementById('mobileSidebar').classList.toggle('-translate-x-full');
                document.getElementById('sidebarOverlay').classList.toggle('hidden');
            }
            function toggleDropdown() {
                document.getElementById('profileDropdown').classList.toggle('hidden');
            }
            document.addEventListener("DOMContentLoaded", () => {
                const token = localStorage.getItem('token');
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                        if(payload.user) {
                            document.getElementById('dropdownUserName').innerText = payload.user;
                            document.getElementById('navProfileName').innerText = payload.user;
                        }
                    } catch(e) {}
                }
            });
        </script>
    </body>
    </html>
    `;
}

// ==========================================
// ১. ড্যাশবোর্ড পেজ UI (SOC.AI Inspired)
// ==========================================
function getDashboardPage() {
    const content = `
        <!-- Top Target Bar (Matches Reference Image) -->
        <div class="soc-card rounded-2xl p-4 md:p-5 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 border border-slate-800">
            <div class="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div class="relative flex-1">
                    <span class="text-[10px] font-mono uppercase text-slate-400 block mb-1">Target Domain / URL:</span>
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 text-lg">public</span>
                        <input type="text" id="targetInput" class="w-full bg-[#070a12] border border-slate-700/80 text-white placeholder:text-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-400" placeholder="https://vulnerable-test-bank.com">
                    </div>
                </div>
                <button id="scanBtn" onclick="startScan()" class="sm:mt-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold px-6 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer text-sm">
                    <span class="material-symbols-outlined text-lg">radar</span> SCAN TARGET
                </button>
            </div>

            <div class="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 lg:border-l border-slate-800 lg:pl-6">
                <div>
                    <span class="text-[11px] text-slate-400 block">Overall Risk Score</span>
                    <span class="text-xl font-extrabold font-mono text-white" id="topScoreText">-- / 100</span>
                </div>
                <div>
                    <span class="text-[11px] text-slate-400 block">Active Status</span>
                    <span class="text-sm font-bold text-emerald-400 flex items-center gap-1.5" id="scanStatusText">
                        <span class="w-2 h-2 rounded-full bg-emerald-400"></span> Ready
                    </span>
                </div>
            </div>
        </div>

        <!-- Security Threat Score Banner (Matches Center Arc & 4 Counters in Image) -->
        <div class="soc-card rounded-2xl p-6 mb-6 relative overflow-hidden">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-base font-bold text-white flex items-center gap-2">
                    <span class="material-symbols-outlined text-cyan-400">shield_with_heart</span>
                    Security Threat Score & Posture
                </h2>
                <span id="gradeBadge" class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    STANDBY
                </span>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                <!-- Left Counters: Critical & High -->
                <div class="lg:col-span-4 grid grid-cols-2 gap-4">
                    <div class="bg-gradient-to-br from-rose-950/50 to-slate-900/60 border border-rose-500/30 rounded-2xl p-4 text-center">
                        <div class="text-4xl font-extrabold font-mono text-rose-500" id="countCrit">0</div>
                        <div class="text-xs font-semibold text-slate-300 mt-1">Critical</div>
                        <div class="text-[10px] text-rose-400/80 font-mono mt-0.5">Severe Leaks</div>
                    </div>
                    <div class="bg-gradient-to-br from-orange-950/50 to-slate-900/60 border border-orange-500/30 rounded-2xl p-4 text-center">
                        <div class="text-4xl font-extrabold font-mono text-orange-400" id="countHigh">0</div>
                        <div class="text-xs font-semibold text-slate-300 mt-1">High / Missing</div>
                        <div class="text-[10px] text-orange-400/80 font-mono mt-0.5">Missing Headers</div>
                    </div>
                </div>

                <!-- Center Neon Gauge Circle -->
                <div class="lg:col-span-4 flex flex-col items-center justify-center py-2">
                    <div id="scoreCircle" class="w-36 h-36 rounded-full border-8 border-slate-800 flex flex-col items-center justify-center shadow-[0_0_35px_rgba(0,0,0,0.6)] transition-all duration-500">
                        <span class="text-3xl font-extrabold font-mono text-white" id="scoreValue">--</span>
                        <span class="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1" id="postureLabel">AWAITING</span>
                    </div>
                </div>

                <!-- Right Counters: Medium & Secure -->
                <div class="lg:col-span-4 grid grid-cols-2 gap-4">
                    <div class="bg-gradient-to-br from-amber-950/50 to-slate-900/60 border border-amber-500/30 rounded-2xl p-4 text-center">
                        <div class="text-4xl font-extrabold font-mono text-amber-400" id="countMed">0</div>
                        <div class="text-xs font-semibold text-slate-300 mt-1">Medium</div>
                        <div class="text-[10px] text-amber-400/80 font-mono mt-0.5">Notices</div>
                    </div>
                    <div class="bg-gradient-to-br from-emerald-950/50 to-slate-900/60 border border-emerald-500/30 rounded-2xl p-4 text-center">
                        <div class="text-4xl font-extrabold font-mono text-emerald-400" id="countLow">0</div>
                        <div class="text-xs font-semibold text-slate-300 mt-1">Low / Secure</div>
                        <div class="text-[10px] text-emerald-400/80 font-mono mt-0.5">Protected</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bottom Grid: Findings Table + Live Console -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <!-- Recent Findings / Vulnerabilities Detected Table -->
            <div class="lg:col-span-7 soc-card rounded-2xl p-6 flex flex-col">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span class="material-symbols-outlined text-cyan-400 text-lg">fact_check</span>
                        Detected Findings & Header Controls
                    </h3>
                    <span class="text-xs font-mono text-slate-400" id="findingsCountLabel">0 Checks</span>
                </div>

                <div class="overflow-x-auto flex-1">
                    <table class="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr class="border-b border-slate-800 text-slate-400 font-mono uppercase">
                                <th class="py-3 px-3">Finding / Control</th>
                                <th class="py-3 px-3">Category</th>
                                <th class="py-3 px-3">Status</th>
                                <th class="py-3 px-3 text-right">Impact</th>
                            </tr>
                        </thead>
                        <tbody id="findingsTableBody" class="divide-y divide-slate-800/60">
                            <tr>
                                <td colspan="4" class="py-10 text-center text-slate-500 font-mono">
                                    Run a target scan above to populate security findings...
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Live Scan Terminal & Metrics -->
            <div class="lg:col-span-5 soc-card rounded-2xl p-6 flex flex-col justify-between">
                <div>
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span class="material-symbols-outlined text-emerald-400 text-lg">terminal</span>
                            Live Recon Stream
                        </h3>
                        <a href="/reports" class="text-xs font-bold text-cyan-400 hover:underline">Dispatch Email &rarr;</a>
                    </div>
                    <div id="terminalOutput" class="bg-[#05070c] border border-slate-800 rounded-xl p-4 h-72 overflow-y-auto font-mono text-xs leading-relaxed hide-scrollbar text-slate-300">
                        <span class="text-emerald-400">> TriScout SOC Engine Ready...</span><br>
                        <span class="text-slate-500">> Passive Ethical Guardrail Enforced.</span>
                    </div>
                </div>
            </div>
        </div>

         <script>
            function renderFindingsTable(checks) {
                const tbody = document.getElementById('findingsTableBody');
                if (!checks || !checks.length) return;
                tbody.innerHTML = '';

                let crit = 0, high = 0, med = 0, low = 0;

                checks.forEach(item => {
                    let badge = '';
                    if (item.status === 'SECURE') {
                        low++;
                        badge = '<span class="px-2.5 py-1 rounded-md font-mono font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">SECURE</span>';
                    } else if (item.status === 'CRITICAL') {
                        crit++;
                        badge = '<span class="px-2.5 py-1 rounded-md font-mono font-bold text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/40">CRITICAL</span>';
                    } else if (item.status === 'MISSING' || item.status === 'WARNING') {
                        high++;
                        badge = '<span class="px-2.5 py-1 rounded-md font-mono font-bold text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/40">' + item.status + '</span>';
                    } else {
                        med++;
                        badge = '<span class="px-2.5 py-1 rounded-md font-mono font-bold text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">NOTICE</span>';
                    }

                    const tr = document.createElement('tr');
                    tr.className = "hover:bg-slate-800/40 transition-colors";
                    tr.innerHTML = \`
                        <td class="py-3 px-3">
                            <div class="font-bold text-slate-200">\${item.name}</div>
                            <div class="text-[11px] text-slate-400 mt-0.5">\${item.detail}</div>
                        </td>
                        <td class="py-3 px-3 font-mono text-slate-400">\${item.category}</td>
                        <td class="py-3 px-3">\${badge}</td>
                        <td class="py-3 px-3 text-right font-mono text-slate-300">\${item.impact}</td>
                    \`;
                    tbody.appendChild(tr);
                });

                document.getElementById('countCrit').innerText = crit;
                document.getElementById('countHigh').innerText = high;
                document.getElementById('countMed').innerText = med;
                document.getElementById('countLow').innerText = low;
                document.getElementById('findingsCountLabel').innerText = checks.length + ' Controls Tested';
            }

            function updateGauge(score) {
                const circle = document.getElementById('scoreCircle');
                const val = document.getElementById('scoreValue');
                const label = document.getElementById('postureLabel');
                const badge = document.getElementById('gradeBadge');
                
                val.innerText = score;
                document.getElementById('topScoreText').innerText = score + ' / 100';

                circle.className = "w-36 h-36 rounded-full border-8 flex flex-col items-center justify-center transition-all duration-500 ";
                if (score >= 85) {
                    circle.classList.add('border-emerald-400', 'shadow-[0_0_35px_rgba(16,185,129,0.35)]');
                    label.innerText = "SECURE";
                    label.className = "text-xs font-bold uppercase tracking-widest text-emerald-400 mt-1";
                    badge.innerText = "GRADE A+";
                    badge.className = "px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40";
                } else if (score >= 60) {
                    circle.classList.add('border-amber-400', 'shadow-[0_0_35px_rgba(245,158,11,0.35)]');
                    label.innerText = "MODERATE";
                    label.className = "text-xs font-bold uppercase tracking-widest text-amber-400 mt-1";
                    badge.innerText = "GRADE B";
                    badge.className = "px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40";
                } else {
                    circle.classList.add('border-rose-500', 'shadow-[0_0_35px_rgba(244,63,94,0.4)]');
                    label.innerText = "CRITICAL";
                    label.className = "text-xs font-bold uppercase tracking-widest text-rose-400 mt-1";
                    badge.innerText = "AT RISK";
                    badge.className = "px-3 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40";
                }
            }

            async function startScan() {
                const target = document.getElementById('targetInput').value.trim();
                const terminal = document.getElementById('terminalOutput');
                const btn = document.getElementById('scanBtn');
                const statusTxt = document.getElementById('scanStatusText');

                if(!target) return alert('Please enter a target domain!');
                
                btn.disabled = true;
                statusTxt.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Scanning...';
                terminal.innerHTML = "<span class='text-cyan-400'>> Target locked: " + target.replace(/</g, "&lt;") + "</span><br>> Analyzing HTTP security headers & leaks...<br><br>";

                try {
                    const response = await fetch('/api/scan-headers', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + localStorage.getItem('token')
                        },
                        body: JSON.stringify({ target })
                    });
                    const data = await response.json();

                    if (data.success) {
                        terminal.innerHTML += data.report.replace(/\\n/g, '<br>');
                        localStorage.setItem('triscout_target', target);
                        localStorage.setItem('triscout_report', data.report);
                        
                        updateGauge(typeof data.score === 'number' ? data.score : 50);
                        if (data.checks) renderFindingsTable(data.checks);
                        statusTxt.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> Complete';
                    } else {
                        terminal.innerHTML += "<br><span class='text-rose-400 font-bold'>[!] ERROR: " + data.error + "</span>";
                        statusTxt.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500"></span> Failed';
                    }
                } catch (err) {
                    terminal.innerHTML += "<br><span class='text-rose-400 font-bold'>[!] Network error reaching scanner API.</span>";
                } finally {
                    btn.disabled = false;
                }
            }
        </script>
    `;
    return generateLayout('COMMAND CENTER', content);
}

// ==========================================
// ২. অন্যান্য পেজগুলোর ফাংশন (Reports, CLI, About, Projects, Profile)
// ==========================================
function getReportsPage() {
    const content = `
        <div class="soc-card rounded-2xl p-6 max-w-4xl mx-auto">
            <h3 class="text-xl font-bold text-cyan-400 mb-2">Dispatch Security Report</h3>
            <p class="text-xs text-slate-400 mb-4">Send the last generated security report directly via Gmail.</p>
            <div id="reportPreview" class="bg-[#05070c] text-slate-300 p-4 mb-4 font-mono text-xs border border-slate-800 h-64 overflow-y-auto rounded-xl"></div>
            <div class="flex flex-col sm:flex-row gap-3">
                <input type="email" id="emailInput" class="flex-1 bg-[#070a12] border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm" placeholder="Enter recipient email address">
                <button id="reportBtn" onclick="sendReport()" class="bg-cyan-500 hover:bg-cyan-400 text-black font-bold px-6 py-2.5 rounded-xl">SEND REPORT</button>
            </div>
        </div>
        <script>
            document.addEventListener("DOMContentLoaded", () => {
                const r = localStorage.getItem('triscout_report');
                const t = localStorage.getItem('triscout_target');
                document.getElementById('reportPreview').innerText = (r && t) ? ("TARGET: " + t + "\\n\\n" + r) : "No recent scan found. Run a scan first.";
            });
            async function sendReport() {
                const emailTo = document.getElementById('emailInput').value;
                const target = localStorage.getItem('triscout_target');
                const reportData = localStorage.getItem('triscout_report');
                if(!emailTo || !reportData) return alert('Missing email or scan data!');
                const res = await fetch('/api/send-report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('token') },
                    body: JSON.stringify({ target, reportData, emailTo })
                });
                const d = await res.json();
                alert(d.success ? 'Report Sent!' : ('Failed: ' + d.error));
            }
        </script>
    `;
    return generateLayout('REPORTS', content);
}

function getCliPage() {
    return generateLayout('CLI TOOL', `
        <div class="soc-card rounded-2xl p-6 max-w-3xl mx-auto">
            <h3 class="text-xl font-bold text-cyan-400 mb-3">TriScout CLI Edition</h3>
            <div class="bg-[#05070c] p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-400 mb-4">
                $ npm install -g @kiran-mondal/triscout<br>
                $ triscout example.com
            </div>
        </div>
    `);
}

function getAboutPage() {
    return generateLayout('ABOUT TRISCOUT', `
        <div class="soc-card rounded-2xl p-6 max-w-3xl mx-auto">
            <h3 class="text-xl font-bold text-cyan-400 mb-2">About TriScout SOC v2.0</h3>
            <p class="text-sm text-slate-300 leading-relaxed">Developed by Kiran Mondal. TriScout is an ethical passive reconnaissance and header security analyzer.</p>
        </div>
    `);
}

function getProjectPage() {
    return generateLayout('MY PROJECTS', `
        <div class="soc-card rounded-2xl p-6 max-w-5xl mx-auto text-center">
            <img src="https://github.com/Kiran-mondal.png" class="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-cyan-400">
            <h2 class="text-2xl font-bold text-white">Kiran Mondal</h2>
            <p class="text-xs text-slate-400 font-mono mb-4">Full-Stack Developer & Cyber Security Enthusiast</p>
            <a href="https://github.com/Kiran-mondal" target="_blank" class="inline-block bg-cyan-500 text-black font-bold px-5 py-2 rounded-xl text-xs">View GitHub Portfolio</a>
        </div>
    `);
}

function getProfilePage() {
    return generateLayout('USER PROFILE', `
        <div class="soc-card rounded-2xl p-6 max-w-2xl mx-auto">
            <h3 class="text-xl font-bold text-cyan-400 mb-4">Operator Profile</h3>
            <button onclick="localStorage.removeItem('token'); window.location.href='/';" class="bg-rose-500/20 border border-rose-500/40 text-rose-300 px-5 py-2.5 rounded-xl text-xs font-bold">Sign Out</button>
        </div>
    `);
}

module.exports = {
    generateLayout,
    getDashboardPage,
    getReportsPage,
    getCliPage,
    getAboutPage,
    getProjectPage,
    getProfilePage
};
