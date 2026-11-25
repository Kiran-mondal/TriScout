/* ============================================================================
   TriScout Blueprint Mascot Engine (No Top Box, Document-Anchored Scroll Sitting)
   - Sits physically on any page box (position: absolute -> scrolls naturally with box)
   - Sits on fixed sidebar tabs (position: fixed) when dropped there
   - Opposite-direction wind/inertia physics while dragging + synced eye tracking
   - Rides along terminal code lines & scrolls review during scans
   ============================================================================ */
(function () {
    const LEDGE_SELECTOR = '[data-mascot-ledge], .bp-panel, .bp-frame, .sidebar-item, #terminal-card';
    const SEAT_OFFSET_Y = 58; // Aligns bottom of torso directly onto the box's top edge

    const wrap = document.getElementById('dash-mini-mascot');
    const svg = document.getElementById('dash-mascot-svg');
    const body = document.getElementById('dash-mascot-body');
    const legL = document.getElementById('dash-leg-l');
    const legR = document.getElementById('dash-leg-r');
    const armL = document.getElementById('dash-arm-l');
    const armR = document.getElementById('dash-arm-r');
    const pupil = document.getElementById('dash-pupil-group');
    const iris = document.getElementById('dash-iris-ring');
    const pupilCore = document.getElementById('dash-pupil-core');

    if (!wrap || !svg) return;

    const state = {
        mode: 'sitting',       // 'sitting' | 'dragging' | 'inspecting'
        anchorSpace: 'page',   // 'page' (absolute, scrolls with page) | 'fixed' (fixed sidebar/header or dragging)
        isDragging: false,
        movedDuringDrag: false,
        activePointerId: null,
        startX: 0,
        startY: 0,
        origViewLeft: 24,
        origViewTop: 120,
        currViewLeft: 24,
        currViewTop: 120,
        prevPointerX: 0,
        prevPointerY: 0,
        velX: 0,
        velY: 0,
        sTorso: 0,
        sArmL: 0,
        sArmR: 0,
        sLegL: 0,
        sLegR: 0,
        dockedEl: null,
        dockedRelX: 0.78,
        highlightedEl: null,
        rafId: null
    };

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function isInsideFixedContainer(el) {
        let curr = el;
        while (curr && curr !== document.body && curr !== document.documentElement) {
            if (window.getComputedStyle(curr).position === 'fixed') return true;
            curr = curr.parentElement;
        }
        return false;
    }

    // Position in viewport space (used while dragging or sitting on fixed sidebar/header)
    function applyViewportPosition(leftPx, topPx) {
        const w = wrap.offsetWidth || 88;
        const h = wrap.offsetHeight || 90;
        state.anchorSpace = 'fixed';
        wrap.style.position = 'fixed';
        state.currViewLeft = clamp(leftPx, 4, Math.max(4, window.innerWidth - w - 4));
        state.currViewTop = clamp(topPx, 4, Math.max(4, window.innerHeight - h - 4));
        wrap.style.left = state.currViewLeft.toFixed(1) + 'px';
        wrap.style.top = state.currViewTop.toFixed(1) + 'px';
    }

    // Position in document space (used when sitting on any page box -> scrolls naturally with box!)
    function applyDocumentPosition(docLeftPx, docTopPx) {
        const w = wrap.offsetWidth || 88;
        const docW = Math.max(document.documentElement.scrollWidth, window.innerWidth);
        const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
        state.anchorSpace = 'page';
        wrap.style.position = 'absolute';
        const safeLeft = clamp(docLeftPx, 4, Math.max(4, docW - w - 4));
        const safeTop = clamp(docTopPx, 4, Math.max(4, docH - 40));
        wrap.style.left = safeLeft.toFixed(1) + 'px';
        wrap.style.top = safeTop.toFixed(1) + 'px';
        state.currViewLeft = safeLeft - window.scrollX;
        state.currViewTop = safeTop - window.scrollY;
    }

    function clearInlinePhysicsTransforms() {
        [body, legL, legR, armL, armR].forEach(el => {
            if (el) el.style.transform = '';
        });
    }

    function setMode(nextMode) {
        state.mode = nextMode;
        wrap.classList.remove('mascot-sitting', 'mascot-dragging', 'mascot-inspecting');
        if (nextMode === 'sitting') {
            clearInlinePhysicsTransforms();
            wrap.classList.add('mascot-sitting');
        } else if (nextMode === 'dragging') {
            wrap.classList.add('mascot-dragging');
        } else if (nextMode === 'inspecting') {
            clearInlinePhysicsTransforms();
            wrap.classList.add('mascot-inspecting');
        }
    }

    function playHop() {
        if (!body || state.isDragging) return;
        body.classList.remove('dash-hop-active');
        void body.offsetWidth;
        body.classList.add('dash-hop-active');
        setTimeout(() => body.classList.remove('dash-hop-active'), 440);
    }

    function trackEyeTo(clientX, clientY, boostScale = false) {
        if (!pupil) return;
        const r = svg.getBoundingClientRect();
        if (!r.width) return;
        const ex = r.left + r.width * 0.5;
        const ey = r.top + r.height * 0.28;
        const dx = clientX - ex;
        const dy = clientY - ey;
        const ang = Math.atan2(dy, dx);
        const dist = Math.min(9, Math.hypot(dx, dy) / 16);

        pupil.style.transform = `translate(${(Math.cos(ang) * dist).toFixed(1)}px, ${(Math.sin(ang) * dist).toFixed(1)}px)`;
        if (iris) iris.style.transform = `rotate(${Math.round((ang * 180) / Math.PI) + 90}deg)`;
        if (pupilCore) {
            pupilCore.setAttribute('r', boostScale ? '6.2' : '5');
            pupilCore.setAttribute('fill', boostScale ? '#39ff88' : '#00d9ff');
        }
    }

    function getVisibleLedges() {
        return Array.from(document.querySelectorAll(LEDGE_SELECTOR)).filter(el => {
            if (el.closest('#dash-mini-mascot')) return false;
            const rect = el.getBoundingClientRect();
            return (
                rect.width >= 90 &&
                rect.height >= 28 &&
                rect.bottom > 40 &&
                rect.top < window.innerHeight - 10 &&
                rect.right > 20 &&
                rect.left < window.innerWidth - 20
            );
        });
    }

    function findNearestLedge(centerX, seatY, snapRadius = 60) {
        let best = null;
        let bestDist = snapRadius;
        for (const el of getVisibleLedges()) {
            const rect = el.getBoundingClientRect();
            if (centerX < rect.left - 18 || centerX > rect.right + 18) continue;
            const distY = Math.abs(seatY - rect.top);
            if (distY < bestDist) {
                bestDist = distY;
                best = { el, rect };
            }
        }
        return best;
    }

    function setLedgeHighlight(el) {
        if (state.highlightedEl === el) return;
        if (state.highlightedEl) state.highlightedEl.classList.remove('mascot-ledge-highlight');
        state.highlightedEl = el;
        if (el) el.classList.add('mascot-ledge-highlight');
    }

    function sitOnElementLedge(el, preferredCenterX, glide = true) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;

        const w = wrap.offsetWidth || 88;
        const minCenter = rect.left + Math.min(44, rect.width * 0.25);
        const maxCenter = rect.right - Math.min(44, rect.width * 0.25);
        const centerX = preferredCenterX != null
            ? clamp(preferredCenterX, minCenter, maxCenter)
            : rect.left + rect.width * (0.25 + Math.random() * 0.55);

        state.dockedEl = el;
        state.dockedRelX = rect.width > 0 ? clamp((centerX - rect.left) / rect.width, 0.12, 0.88) : 0.5;

        const targetIsFixed = isInsideFixedContainer(el);
        const switchingSpace = (targetIsFixed && state.anchorSpace !== 'fixed') || (!targetIsFixed && state.anchorSpace !== 'page');

        if (glide && !switchingSpace) wrap.classList.add('mascot-glide');
        else wrap.classList.remove('mascot-glide');

        if (targetIsFixed) {
            applyViewportPosition(centerX - w / 2, rect.top - SEAT_OFFSET_Y);
        } else {
            applyDocumentPosition(centerX + window.scrollX - w / 2, rect.top + window.scrollY - SEAT_OFFSET_Y);
        }

        setMode('sitting');

        if (glide) {
            setTimeout(() => {
                wrap.classList.remove('mascot-glide');
                playHop();
            }, switchingSpace ? 60 : 300);
        }
        return true;
    }

    function syncDockedOnResize() {
        if (state.isDragging || state.mode === 'inspecting' || !state.dockedEl) return;
        const rect = state.dockedEl.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const w = wrap.offsetWidth || 88;
        const centerX = rect.left + rect.width * state.dockedRelX;
        if (isInsideFixedContainer(state.dockedEl)) {
            applyViewportPosition(centerX - w / 2, rect.top - SEAT_OFFSET_Y);
        } else {
            applyDocumentPosition(centerX + window.scrollX - w / 2, rect.top + window.scrollY - SEAT_OFFSET_Y);
        }
    }

    function perchOnRandomBox(glide = false) {
        const candidates = getVisibleLedges().filter(el => !isInsideFixedContainer(el));
        const pool = candidates.length > 0 ? candidates : getVisibleLedges();
        if (pool.length === 0) {
            applyDocumentPosition(window.innerWidth - 116, window.scrollY + 120);
            setMode('sitting');
            return;
        }
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        sitOnElementLedge(chosen, null, glide);
    }

    // Opposite-Direction Wind/Inertia Physics Loop While Dragging
    function stepDragPhysics() {
        if (!state.isDragging) {
            state.rafId = null;
            return;
        }

        state.velX *= 0.82;
        state.velY *= 0.82;

        const windTrail = clamp(state.velX * 2.15, -52, 52);
        const verticalFlare = clamp(state.velY * 1.25, -16, 36);

        const targetTorso = clamp(state.velX * 0.72, -20, 20);
        const targetArmL = clamp(windTrail * 0.92 + verticalFlare, -54, 62);
        const targetArmR = clamp(windTrail * 0.92 - verticalFlare, -62, 54);
        const targetLegL = clamp(windTrail * 1.12 + verticalFlare * 0.28, -56, 56);
        const targetLegR = clamp(windTrail * 1.06 - verticalFlare * 0.28, -56, 56);

        state.sTorso = lerp(state.sTorso, targetTorso, 0.26);
        state.sArmL = lerp(state.sArmL, targetArmL, 0.24);
        state.sArmR = lerp(state.sArmR, targetArmR, 0.24);
        state.sLegL = lerp(state.sLegL, targetLegL, 0.22);
        state.sLegR = lerp(state.sLegR, targetLegR, 0.22);

        if (body) body.style.transform = `rotate(${state.sTorso.toFixed(2)}deg) scale(1.03)`;
        if (armL) armL.style.transform = `rotate(${state.sArmL.toFixed(2)}deg)`;
        if (armR) armR.style.transform = `rotate(${state.sArmR.toFixed(2)}deg)`;
        if (legL) legL.style.transform = `rotate(${state.sLegL.toFixed(2)}deg)`;
        if (legR) legR.style.transform = `rotate(${state.sLegR.toFixed(2)}deg)`;

        const speed = Math.hypot(state.velX, state.velY);
        const rect = svg.getBoundingClientRect();
        trackEyeTo(rect.left + rect.width * 0.5 + state.velX * 8, rect.top + rect.height * 0.28 + state.velY * 8, speed > 6);

        state.rafId = requestAnimationFrame(stepDragPhysics);
    }

    // Drag & Drop Pointer Handlers
    wrap.addEventListener('pointerdown', (e) => {
        state.isDragging = true;
        state.movedDuringDrag = false;
        state.activePointerId = e.pointerId;
        state.dockedEl = null;
        wrap.classList.remove('mascot-glide');

        const rect = wrap.getBoundingClientRect();
        state.startX = e.clientX;
        state.startY = e.clientY;
        state.prevPointerX = e.clientX;
        state.prevPointerY = e.clientY;
        state.origViewLeft = rect.left;
        state.origViewTop = rect.top;
        state.velX = 0;
        state.velY = 0;

        // Convert smoothly to viewport-fixed while actively dragging
        applyViewportPosition(rect.left, rect.top);

        if (wrap.setPointerCapture) {
            try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
        }
    });

    wrap.addEventListener('pointermove', (e) => {
        if (!state.isDragging || e.pointerId !== state.activePointerId) return;

        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        const stepX = e.clientX - state.prevPointerX;
        const stepY = e.clientY - state.prevPointerY;
        state.prevPointerX = e.clientX;
        state.prevPointerY = e.clientY;

        if (!state.movedDuringDrag && Math.hypot(dx, dy) > 5) {
            state.movedDuringDrag = true;
            setMode('dragging');
            if (!state.rafId) state.rafId = requestAnimationFrame(stepDragPhysics);
        }

        if (state.movedDuringDrag) {
            state.velX = lerp(state.velX, stepX, 0.6);
            state.velY = lerp(state.velY, stepY, 0.6);
            applyViewportPosition(state.origViewLeft + dx, state.origViewTop + dy);

            const w = wrap.offsetWidth || 88;
            const nearest = findNearestLedge(state.currViewLeft + w / 2, state.currViewTop + SEAT_OFFSET_Y, 62);
            setLedgeHighlight(nearest ? nearest.el : null);
        }
    });

    function finishDrag(e) {
        if (!state.isDragging || (e && e.pointerId !== state.activePointerId)) return;
        state.isDragging = false;
        if (state.rafId) {
            cancelAnimationFrame(state.rafId);
            state.rafId = null;
        }
        if (wrap.releasePointerCapture && state.activePointerId != null) {
            try { wrap.releasePointerCapture(state.activePointerId); } catch (err) {}
        }
        state.activePointerId = null;

        const hoveredLedge = state.highlightedEl;
        setLedgeHighlight(null);

        const w = wrap.offsetWidth || 88;
        if (state.movedDuringDrag) {
            if (hoveredLedge) {
                sitOnElementLedge(hoveredLedge, state.currViewLeft + w / 2, true);
            } else {
                // Anchor right where dropped in document space so it scrolls naturally with the page
                state.dockedEl = null;
                applyDocumentPosition(state.currViewLeft + window.scrollX, state.currViewTop + window.scrollY);
                setMode('sitting');
                playHop();
            }
        } else {
            // Re-anchor in page space if not on a fixed container, then hop & blink
            applyDocumentPosition(state.currViewLeft + window.scrollX, state.currViewTop + window.scrollY);
            setMode('sitting');
            playHop();
            svg.classList.add('mascot-blink');
            setTimeout(() => svg.classList.remove('mascot-blink'), 170);
        }
    }

    wrap.addEventListener('pointerup', finishDrag);
    wrap.addEventListener('pointercancel', finishDrag);

    // Toggle Mascot Visibility from Top Bar
    window.toggleMiniMascot = function () {
        const isHidden = wrap.classList.toggle('hidden');
        const btn = document.getElementById('header-mascot-toggle');
        if (btn) btn.setAttribute('aria-pressed', String(!isHidden));
        if (!isHidden) {
            setTimeout(() => perchOnRandomBox(true), 40);
        }
    };

    // Terminal Code-Line Inspection & Scroll Review During Scans
    let prevActiveLine = null;

    function highlightTerminalLine(lineEl) {
        if (prevActiveLine) prevActiveLine.classList.remove('term-line-active');
        prevActiveLine = lineEl;
        if (lineEl) lineEl.classList.add('term-line-active');
    }

    function inspectTerminalLine(lineEl) {
        if (!lineEl || state.isDragging || wrap.classList.contains('hidden')) return;
        const termBody = document.getElementById('terminal-body');
        if (!termBody) return;

        state.dockedEl = null;
        highlightTerminalLine(lineEl);

        const targetScroll = Math.max(0, lineEl.offsetTop - termBody.clientHeight * 0.55);
        termBody.scrollTo({ top: targetScroll, behavior: 'smooth' });

        const bodyRect = termBody.getBoundingClientRect();
        const lineRect = lineEl.getBoundingClientRect();
        const clampedLineY = clamp(lineRect.top + lineRect.height / 2, bodyRect.top + 22, bodyRect.bottom - 22);
        const w = wrap.offsetWidth || 88;

        wrap.classList.add('mascot-glide');
        applyDocumentPosition(bodyRect.right + window.scrollX - w - 10, clampedLineY + window.scrollY - 46);
        setMode('inspecting');
        trackEyeTo(bodyRect.left + 80, clampedLineY, true);
    }

    async function sweepTerminalScrollReview() {
        const termBody = document.getElementById('terminal-body');
        const termCard = document.getElementById('terminal-card');
        if (!termBody || state.isDragging || wrap.classList.contains('hidden')) return;

        const lines = Array.from(termBody.querySelectorAll('.term-log-line'));
        if (lines.length >= 4) {
            inspectTerminalLine(lines[Math.min(1, lines.length - 1)]);
            await new Promise(r => setTimeout(r, 420));
            inspectTerminalLine(lines[lines.length - 1]);
            await new Promise(r => setTimeout(r, 420));
        }

        highlightTerminalLine(null);
        if (termCard) {
            sitOnElementLedge(termCard, termCard.getBoundingClientRect().right - 80, true);
        } else {
            setMode('sitting');
            playHop();
        }
    }

    // Eye Tracking (Mouse & Mobile Touch)
    window.addEventListener('pointermove', (e) => {
        if (state.isDragging || state.mode === 'inspecting') return;
        trackEyeTo(e.clientX, e.clientY, false);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (state.isDragging || state.mode === 'inspecting') return;
        if (e.touches && e.touches[0]) trackEyeTo(e.touches[0].clientX, e.touches[0].clientY, false);
    }, { passive: true });

    setInterval(() => {
        if (state.isDragging || wrap.classList.contains('hidden')) return;
        if (Math.random() < 0.35) {
            svg.classList.add('mascot-blink');
            setTimeout(() => svg.classList.remove('mascot-blink'), 150);
        }
    }, 2600);

    window.addEventListener('resize', syncDockedOnResize, { passive: true });

    window.TriScoutMascot = {
        perchOnRandomBox,
        sitOnElementLedge,
        inspectTerminalLine,
        sweepTerminalScrollReview,
        onTabChange: function () {
            if (state.isDragging || state.mode === 'inspecting') return;
            if (state.dockedEl) {
                const rect = state.dockedEl.getBoundingClientRect();
                if (!rect.width || !rect.height) {
                    setTimeout(() => perchOnRandomBox(true), 80);
                }
            } else {
                setTimeout(() => perchOnRandomBox(true), 80);
            }
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => perchOnRandomBox(false), 120);
    });
})();
       
