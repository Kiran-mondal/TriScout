/* ============================================================================
   TriScout Synchronized Collapsible Tree Topology Engine
   - Strictly data-driven: shows ONLY components actually present on target site
   - Clean Left-to-Right Tree Layout with clickable parent dots
   - Smooth SVG stroke-dashoffset line-drawing animation when opening branches
   - Simple interactive Demo Tree before first scan
   ============================================================================ */
(function () {
    const SVG_NS = 'http://www.w3.org/2000/svg';

    const STATUS_STYLES = {
        root:    { stroke: '#39ff88', fill: '#174786', text: '#ffffff', glow: '#39ff88' },
        folder:  { stroke: '#7ce0ff', fill: '#113466', text: '#e6f3ff', glow: '#7ce0ff' },
        secure:  { stroke: '#39ff88', fill: '#0b2f24', text: '#39ff88', glow: '#39ff88' },
        info:    { stroke: '#bae0ff', fill: '#113466', text: '#e6f3ff', glow: '#7ce0ff' },
        warning: { stroke: '#fcd34d', fill: '#451a03', text: '#fcd34d', glow: '#fcd34d' },
        critical:{ stroke: '#ffb4ab', fill: '#450a0a', text: '#ffb4ab', glow: '#ffb4ab' }
    };

    let treeRoot = null;
    let selectedNodeId = null;
    let lastExpandedParentId = null;
    let currentScale = 1;
    let isDemoMode = true;

    function createSvgEl(tag, attrs = {}) {
        const el = document.createElementNS(SVG_NS, tag);
        for (const [k, v] of Object.entries(attrs)) {
            el.setAttribute(k, String(v));
        }
        return el;
    }

    // Minimal, easy-to-understand Demo Tree shown before any real scan
    function buildDemoTree() {
        isDemoMode = true;
        return {
            id: 'root-demo',
            label: 'target.demo',
            sublabel: 'Click dot to expand',
            status: 'root',
            detail: 'Demo preview tree. Run a real website scan in Target Scanner to replace this with live components detected on your target.',
            expanded: true,
            children: [
                {
                    id: 'demo-net',
                    label: 'Network & DNS',
                    sublabel: '2 items',
                    status: 'folder',
                    detail: 'Shows resolved IPv4 and HTTP response status once a real target is scanned.',
                    expanded: true,
                    children: [
                        { id: 'demo-ip', label: 'IPv4 Address', sublabel: 'Google DoH', status: 'info', detail: 'Resolved public IPv4 address of the scanned host.' },
                        { id: 'demo-http', label: 'HTTP Response', sublabel: 'Status Code', status: 'secure', detail: 'Observed live HTTP status code from passive probe.' }
                    ]
                },
                {
                    id: 'demo-hdr',
                    label: 'Active Headers',
                    sublabel: 'Click to open',
                    status: 'folder',
                    detail: 'Only HTTP security headers actually present on the scanned site will appear here.',
                    expanded: false,
                    children: [
                        { id: 'demo-hsts', label: 'HSTS', sublabel: 'Present', status: 'secure', detail: 'Displayed only when Strict-Transport-Security is active on target.' },
                        { id: 'demo-csp', label: 'CSP', sublabel: 'Present', status: 'secure', detail: 'Displayed only when Content-Security-Policy is active on target.' },
                        { id: 'demo-mime', label: 'X-Content-Type', sublabel: 'nosniff', status: 'secure', detail: 'Displayed only when X-Content-Type-Options is present.' }
                    ]
                },
                {
                    id: 'demo-dom',
                    label: 'DOM & Assets',
                    sublabel: 'Click to open',
                    status: 'folder',
                    detail: 'Displays detected scripts, forms, and page surface elements found on target.',
                    expanded: false,
                    children: [
                        { id: 'demo-js', label: 'Script Tags', sublabel: 'JS Surface', status: 'info', detail: 'Count of <script> elements present in scraped HTML.' },
                        { id: 'demo-form', label: 'Form Nodes', sublabel: 'Input Surface', status: 'info', detail: 'Count of <form> elements detected on the target page.' }
                    ]
                }
            ]
        };
    }

    // Build synchronized tree STRICTLY from elements physically present in scan data
    function buildTreeFromScan(scan) {
        isDemoMode = false;
        const checks = Array.isArray(scan.checks) ? scan.checks : [];
        const report = String(scan.report || '');

        const statusMatch = report.match(/HTTP Status\s+(\d{3})/i);
        const domMatch = report.match(/DOM Surface:\s+(\d+)\s+Script\(s\),\s+(\d+)\s+Form\(s\)/i);
        const titleMatch = report.match(/Scraped Page Title:\s+([^\n]+)/i);

        const httpStatus = statusMatch ? statusMatch[1] : null;
        const scriptCount = domMatch ? parseInt(domMatch[1], 10) : 0;
        const formCount = domMatch ? parseInt(domMatch[2], 10) : 0;
        const pageTitle = titleMatch ? titleMatch[1].trim() : null;

        const findCheck = (needle) => checks.find(c => String(c.name || '').toLowerCase().includes(needle));
        const branches = [];

        // 1. Network & Transport (Only include real resolved/returned attributes)
        const netChildren = [];
        if (scan.ip && scan.ip !== 'Resolved via Backend') {
            netChildren.push({
                id: 'net-ip',
                label: scan.ip,
                sublabel: 'Resolved IPv4',
                status: 'info',
                detail: `Public IPv4 address ${scan.ip} resolved for ${scan.host} via Google DoH.`
            });
        }
        if (httpStatus) {
            netChildren.push({
                id: 'net-http',
                label: `HTTP ${httpStatus}`,
                sublabel: `${scan.latency} ms`,
                status: Number(httpStatus) < 400 ? 'secure' : 'warning',
                detail: `Target responded with HTTP status ${httpStatus} in ${scan.latency} ms.`
            });
        }
        const rateCheck = findCheck('rate limiting');
        if (rateCheck && rateCheck.status === 'SECURE') {
            netChildren.push({
                id: 'net-waf',
                label: 'WAF / Rate Limit',
                sublabel: 'Active',
                status: 'secure',
                detail: rateCheck.detail
            });
        }
        if (netChildren.length > 0) {
            branches.push({
                id: 'branch-net',
                label: 'Network & Edge',
                sublabel: `${netChildren.length} detected`,
                status: 'folder',
                detail: `Live network and edge telemetry detected on ${scan.host}.`,
                expanded: true,
                children: netChildren
            });
        }

        // 2. Active Security Headers (ONLY headers actually PRESENT on the target site)
        const activeHeaders = [];
        const headerMappings = [
            { needle: 'hsts', id: 'hdr-hsts', label: 'HSTS Policy', sub: 'HTTPS Strict' },
            { needle: 'csp', id: 'hdr-csp', label: 'CSP Header', sub: 'XSS Policy' },
            { needle: 'mime', id: 'hdr-mime', label: 'MIME nosniff', sub: 'Content-Type' },
            { needle: 'isolation', id: 'hdr-iso', label: 'Frame / COOP', sub: 'Isolated' },
            { needle: 'cors', id: 'hdr-cors', label: 'Origin Locked', sub: 'CORS Strict' }
        ];
        for (const hm of headerMappings) {
            const c = findCheck(hm.needle);
            if (c && c.status === 'SECURE') {
                activeHeaders.push({
                    id: hm.id,
                    label: hm.label,
                    sublabel: hm.sub,
                    status: 'secure',
                    detail: c.detail
                });
            }
        }
        if (activeHeaders.length > 0) {
            branches.push({
                id: 'branch-headers',
                label: 'Active Headers',
                sublabel: `${activeHeaders.length} present`,
                status: 'folder',
                detail: `Security headers verified as present in ${scan.host}'s HTTP response. Absent headers are omitted from the tree.`,
                expanded: true,
                children: activeHeaders
            });
        }

        // 3. DOM & Surface Assets (ONLY present scripts, forms, cookies, title)
        const domChildren = [];
        if (pageTitle && pageTitle !== 'Untitled Document') {
            domChildren.push({
                id: 'dom-title',
                label: pageTitle.length > 18 ? pageTitle.slice(0, 17) + '…' : pageTitle,
                sublabel: 'HTML <title>',
                status: 'info',
                detail: `Document title parsed from HTML: "${pageTitle}".`
            });
        }
        if (scriptCount > 0) {
            domChildren.push({
                id: 'dom-scripts',
                label: `${scriptCount} Script(s)`,
                sublabel: '<script> tags',
                status: 'info',
                detail: `Detected ${scriptCount} <script> element(s) in the public HTML surface.`
            });
        }
        if (formCount > 0) {
            const formCheck = findCheck('clean input');
            domChildren.push({
                id: 'dom-forms',
                label: `${formCount} Form(s)`,
                sublabel: '<form> tags',
                status: formCheck && formCheck.status === 'CRITICAL' ? 'critical' : 'info',
                detail: formCheck ? formCheck.detail : `Detected ${formCount} <form> element(s) on the page.`
            });
        }
        const cookieCheck = findCheck('session expiry');
        if (cookieCheck && !String(cookieCheck.detail || '').toLowerCase().includes('stateless')) {
            domChildren.push({
                id: 'dom-cookies',
                label: 'Set-Cookie',
                sublabel: cookieCheck.status === 'SECURE' ? 'Hardened' : 'Weak Flags',
                status: cookieCheck.status === 'SECURE' ? 'secure' : 'warning',
                detail: cookieCheck.detail
            });
        }
        if (domChildren.length > 0) {
            branches.push({
                id: 'branch-dom',
                label: 'DOM & Surface',
                sublabel: `${domChildren.length} found`,
                status: 'folder',
                detail: `Public HTML elements and session cookies detected on ${scan.host}.`,
                expanded: false,
                children: domChildren
            });
        }

        // 4. Detected Risks / Leaks (ONLY if the target actually leaked/exposed something)
        const riskChildren = [];
        const leakCheck = findCheck('leaked keys');
        if (leakCheck && leakCheck.status === 'CRITICAL') {
            riskChildren.push({ id: 'risk-keys', label: 'Exposed Keys', sublabel: 'CRITICAL', status: 'critical', detail: leakCheck.detail });
        }
        const errCheck = findCheck('safe error');
        if (errCheck && errCheck.status === 'CRITICAL') {
            riskChildren.push({ id: 'risk-err', label: 'Stack / SQL Leak', sublabel: 'CRITICAL', status: 'critical', detail: errCheck.detail });
        }
        const fpCheck = findCheck('fingerprint');
        if (fpCheck && fpCheck.status === 'WARNING') {
            riskChildren.push({ id: 'risk-fp', label: 'X-Powered-By', sublabel: 'Exposed', status: 'warning', detail: fpCheck.detail });
        }
        const dbgCheck = findCheck('log flowing');
        if (dbgCheck && dbgCheck.status === 'WARNING') {
            riskChildren.push({ id: 'risk-dbg', label: 'Debug / .map', sublabel: 'Exposed', status: 'warning', detail: dbgCheck.detail });
        }
        const corsCheck = findCheck('cors');
        if (corsCheck && corsCheck.status === 'WARNING') {
            riskChildren.push({ id: 'risk-cors', label: 'Open CORS', sublabel: 'Wildcard', status: 'warning', detail: corsCheck.detail });
        }
        if (riskChildren.length > 0) {
            branches.push({
                id: 'branch-risks',
                label: 'Active Exposures',
                sublabel: `${riskChildren.length} alert(s)`,
                status: 'warning',
                detail: `Active exposures detected in ${scan.host}'s response headers or source.`,
                expanded: true,
                children: riskChildren
            });
        }

        return {
            id: 'root-live',
            label: scan.host.length > 20 ? scan.host.slice(0, 19) + '…' : scan.host,
            sublabel: `Score ${scan.score}/100`,
            status: scan.score >= 80 ? 'root' : (scan.score >= 50 ? 'warning' : 'critical'),
            detail: `Live synchronized tree for ${scan.target} (${scan.ip}). Only components actually detected in the response are mapped (${branches.length} active branch(es)).`,
            expanded: true,
            children: branches
        };
    }

    // Compute clean balanced tree coordinates
    function computeTreeLayout(root) {
        const COL_X = [110, 390, 690];
        const ROW_GAP = 64;
        const TOP_PAD = 54;
        const nodes = [];
        const edges = [];
        let leafIndex = 0;

        function traverse(node, depth, parent) {
            const hasChildren = Array.isArray(node.children) && node.children.length > 0;
            const visibleChildren = hasChildren && node.expanded ? node.children : [];
            const x = COL_X[Math.min(depth, COL_X.length - 1)];
            let y = TOP_PAD;

            if (visibleChildren.length === 0) {
                y = TOP_PAD + leafIndex * ROW_GAP;
                leafIndex++;
            } else {
                const childLayouts = visibleChildren.map(child => traverse(child, depth + 1, node));
                const firstY = childLayouts[0].y;
                const lastY = childLayouts[childLayouts.length - 1].y;
                y = (firstY + lastY) / 2;
            }

            const placed = { node, depth, x, y, parent };
            nodes.push(placed);
            if (parent) {
                edges.push({ parentNode: parent, childPlaced: placed });
            }
            return placed;
        }

        traverse(root, 0, null);

        // Map parent positions for edges
        const posById = new Map(nodes.map(n => [n.node.id, n]));
        const resolvedEdges = edges.map(e => ({
            from: posById.get(e.parentNode.id),
            to: e.childPlaced
        }));

        const totalHeight = Math.max(260, TOP_PAD * 2 + Math.max(1, leafIndex - 1) * ROW_GAP);
        return { nodes, edges: resolvedEdges, width: 880, height: totalHeight };
    }

    function updateNodeInspector(node) {
        selectedNodeId = node.id;
        const detailEl = document.getElementById('tele-inspector-detail');
        if (detailEl) {
            detailEl.textContent = `[${node.label}] ${node.detail || ''}`;
        }
    }

    function renderTree(animateParentId = null) {
        const svg = document.getElementById('topology-svg');
        if (!svg || !treeRoot) return;

        const layout = computeTreeLayout(treeRoot);
        svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);
        svg.style.height = Math.min(540, Math.max(290, layout.height)) + 'px';

        // Clear previous SVG content safely
        while (svg.firstChild) svg.removeChild(svg.firstChild);

        // Blueprint grid pattern background
        const defs = createSvgEl('defs');
        const pattern = createSvgEl('pattern', { id: 'tree-bp-grid', width: 24, height: 24, patternUnits: 'userSpaceOnUse' });
        pattern.appendChild(createSvgEl('path', { d: 'M 24 0 L 0 0 0 24', fill: 'none', stroke: '#bae0ff', 'stroke-opacity': '0.09', 'stroke-width': '0.8' }));
        defs.appendChild(pattern);
        svg.appendChild(defs);
        svg.appendChild(createSvgEl('rect', { width: '100%', height: '100%', fill: 'url(#tree-bp-grid)' }));

        // Layer 1: Smooth Curved Connector Lines (with stroke-dashoffset drawing animation)
        const edgeLayer = createSvgEl('g');
        for (const edge of layout.edges) {
            const x1 = edge.from.x + 16;
            const y1 = edge.from.y;
            const x2 = edge.to.x - 16;
            const y2 = edge.to.y;
            const midX = (x1 + x2) / 2;
            const style = STATUS_STYLES[edge.to.node.status] || STATUS_STYLES.info;

            const path = createSvgEl('path', {
                d: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`,
                fill: 'none',
                stroke: style.stroke,
                'stroke-width': edge.to.node.status === 'critical' ? '2.4' : '1.9',
                'stroke-opacity': '0.85'
            });
            edgeLayer.appendChild(path);

            const shouldAnimate = animateParentId === 'ALL' || animateParentId === edge.from.node.id;
            if (shouldAnimate) {
                requestAnimationFrame(() => {
                    try {
                        const len = path.getTotalLength();
                        path.style.strokeDasharray = `${len}`;
                        path.style.strokeDashoffset = `${len}`;
                        path.getBoundingClientRect();
                        path.style.transition = 'stroke-dashoffset 0.42s cubic-bezier(0.22, 1, 0.36, 1)';
                        path.style.strokeDashoffset = '0';
                    } catch (err) {}
                });
            }
        }
        svg.appendChild(edgeLayer);

        // Layer 2: Clickable Tree Nodes / Dots
        const nodeLayer = createSvgEl('g');
        for (const item of layout.nodes) {
            const { node, x, y, parent } = item;
            const hasChildren = Array.isArray(node.children) && node.children.length > 0;
            const style = STATUS_STYLES[node.status] || STATUS_STYLES.info;
            const isSelected = selectedNodeId === node.id;

            const g = createSvgEl('g', {
                class: 'tree-node-group',
                transform: `translate(${x}, ${y})`
            });

            const inner = createSvgEl('g');
            if (animateParentId === 'ALL' || (parent && parent.id === animateParentId)) {
                inner.setAttribute('class', 'tree-node-enter');
            }

            // Outer soft halo for selected or root dot
            if (isSelected || node.status === 'root') {
                inner.appendChild(createSvgEl('circle', {
                    r: hasChildren ? 21 : 16,
                    fill: style.glow,
                    'fill-opacity': isSelected ? '0.24' : '0.12'
                }));
            }

            // Clickable Dot Circle
            const dotRadius = node.status === 'root' ? 16 : (hasChildren ? 14 : 10);
            inner.appendChild(createSvgEl('circle', {
                class: 'tree-dot-ring',
                r: dotRadius,
                fill: style.fill,
                stroke: style.stroke,
                'stroke-width': isSelected ? '3' : '2'
            }));

            // Plus / Minus symbol inside expandable dots, or core dot for leaves
            if (hasChildren) {
                const sym = createSvgEl('text', {
                    fill: style.stroke,
                    'font-family': 'JetBrains Mono',
                    'font-size': '13',
                    'font-weight': 'bold',
                    'text-anchor': 'middle',
                    y: '4.5'
                });
                sym.textContent = node.expanded ? '−' : '+';
                inner.appendChild(sym);
            } else {
                inner.appendChild(createSvgEl('circle', { r: 3.5, fill: style.stroke }));
            }

            // Label pill positioned cleanly beside or below the dot
            const labelOffsetX = hasChildren && node.depth === 0 ? 0 : (hasChildren ? 0 : 18);
            const labelOffsetY = hasChildren ? -22 : -3;
            const anchor = hasChildren ? 'middle' : 'start';

            const labelText = createSvgEl('text', {
                x: labelOffsetX,
                y: labelOffsetY,
                fill: '#ffffff',
                'font-family': 'JetBrains Mono',
                'font-size': '11',
                'font-weight': 'bold',
                'text-anchor': anchor
            });
            labelText.textContent = node.label;
            inner.appendChild(labelText);

            if (node.sublabel) {
                const subText = createSvgEl('text', {
                    x: labelOffsetX,
                    y: hasChildren ? 27 : 11,
                    fill: style.text,
                    'font-family': 'JetBrains Mono',
                    'font-size': '9',
                    'text-anchor': anchor,
                    opacity: '0.9'
                });
                subText.textContent = node.sublabel;
                inner.appendChild(subText);
            }

            g.appendChild(inner);

            g.addEventListener('click', (e) => {
                e.stopPropagation();
                updateNodeInspector(node);
                if (hasChildren) {
                    node.expanded = !node.expanded;
                    lastExpandedParentId = node.expanded ? node.id : null;
                    renderTree(lastExpandedParentId);
                } else {
                    renderTree(null);
                }
            });

            nodeLayer.appendChild(g);
        }

        svg.appendChild(nodeLayer);

        // Update node count badge
        const countBadge = document.getElementById('topo-probe-count');
        if (countBadge) {
            countBadge.textContent = isDemoMode
                ? `DEMO TREE // ${layout.nodes.length} VISIBLE`
                : `SYNCED // ${layout.nodes.length} ACTIVE NODE(S)`;
        }
        const footerSummary = document.getElementById('topo-footer-summary');
        if (footerSummary) {
            footerSummary.textContent = isDemoMode
                ? 'DEMO MODE // CLICK ANY + DOT TO EXPAND'
                : `LIVE SYNCED TREE // ${layout.nodes.length} DETECTED NODE(S)`;
        }
    }

    function setAllExpanded(node, expanded) {
        if (Array.isArray(node.children) && node.children.length > 0) {
            node.expanded = expanded;
            node.children.forEach(c => setAllExpanded(c, expanded));
        }
    }

    // Global Controls exposed for HTML buttons & dashboard.js
    window.zoomTopology = function (delta) {
        const svg = document.getElementById('topology-svg');
        const label = document.getElementById('topo-zoom-level');
        if (!svg) return;
        currentScale = delta === 0 ? 1 : Math.max(0.75, Math.min(1.4, +(currentScale + delta).toFixed(2)));
        svg.style.transform = `scale(${currentScale})`;
        if (label) label.textContent = Math.round(currentScale * 100) + '%';
    };

    window.toggleAllTopologyBranches = function (expand) {
        if (!treeRoot) return;
        setAllExpanded(treeRoot, expand);
        treeRoot.expanded = true; // Keep root open when collapsing sub-branches
        renderTree(expand ? 'ALL' : null);
    };

    window.TriScoutTopology = {
        syncFromScan: function (scan) {
            treeRoot = buildTreeFromScan(scan);
            selectedNodeId = treeRoot.id;
            updateNodeInspector(treeRoot);
            renderTree('ALL');
        },
        resetDemo: function () {
            treeRoot = buildDemoTree();
            selectedNodeId = treeRoot.id;
            updateNodeInspector(treeRoot);
            renderTree('ALL');
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        window.TriScoutTopology.resetDemo();
    });
})();
