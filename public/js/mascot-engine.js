/* ============================================================================
   TriScout Blueprint Mascot Engine
   - Random initial box perch inside dashboard
   - Wall-sitting pose (legs gently swinging, hands resting proportionally, no walking)
   - Real-time opposite-direction inertia/wind physics for arms, legs & body while dragging
   - Drag-synced eye tracking & natural blinks
   - Terminal code-line traversal & vertical scrolling during scans
   ============================================================================ */
(function () {
    const LEDGE_SELECTOR = '[data-mascot-ledge], .bp-panel, .bp-frame, .sidebar-item, #terminal-card';
    const SEAT_OFFSET_Y = 76; // Aligns mascot bottom/hips cleanly onto a box's top border

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
    const tag = document.getElementById('dash-mascot-step-tag');
    const placeBtn = document.getElementById('dash-mascot-place-btn');

    if (!wrap || !svg) return;

    const state = {
        mode: 'sitting',       // 'sitting' | 'dragging' | 'inspecting'
        isDragging: false,
        movedDuringDrag: false,
        isPlaceMode: false,
        activePointerId: null,
        startX: 0,
        startY: 0,
        origLeft: 24,
        origTop: 120,
        currLeft: 24,
        currTop: 120,
        prevPointerX: 0,
        prevPointerY: 0,
        velX: 0,
        velY: 0,
        // Spring-smoothed limb angles during drag
        sTorso: 0,
        sArmL: 0,
        sArmR: 0,
        sLegL: 0,
        sLegR: 0,
        // Docked box/tab reference
        dockedEl: null,
        dockedRelX: 0.78, // Relative horizontal position along the box's top edge (0..1)
        highlightedEl: null,
        rafId: null
    };

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function setTag(text) {
        if (tag) tag.textContent = text;
    }

    function applyPosition(leftPx, topPx) {
        const w = wrap.offsetWidth || 92;
        const h = wrap.offsetHeight || 114;
        state.currLeft = clamp(leftPx, 4, Math.max(4, window.innerWidth - w - 4));
        state.currTop = clamp(topPx, 4, Math.max(4, window.innerHeight - h - 4));
        wrap.style.left = state.currLeft.toFixed(1) + 'px';
        wrap.style.top = state.currTop.toFixed(1) + 'px';
        wrap.style.right = 'auto';
        wrap.style.bottom = 'auto';
    }

    function clearInlinePhysicsTransforms() {
        [body, legL, legR, armL, armR].forEach(el => {
            if (el) el.style.transform = '';
        });
    }

    function setMode(nextMode, labelText) {
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
        if (labelText) setTag(labelText);
    }

    function playHop() {
        if (!body || state.isDragging) return;
        body.classList.remove('dash-hop-active');
        void body.offsetWidth;
        body.classList.add('dash-hop-active');
        setTimeout(() => body.classList.remove('dash-hop-active'), 440);
    }

    // Eye Tracking (Synced with both hover/touch & drag vector)
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
        const tx = Math.cos(ang) * dist;
        const ty = Math.sin(ang) * dist;

        pupil.style.transform = `translate(${tx.toFixed(1)}px, ${ty.toFixed(1)}px)`;
        if (iris) {
            iris.style.transform = `rotate(${Math.round((ang * 180) / Math.PI) + 90}deg)`;
        }
        if (pupilCore) {
            pupilCore.setAttribute('r', boostScale ? '6.2' : '5');
            pupilCore.setAttribute('fill', boostScale ? '#39ff88' : '#00d9ff');
        }
    }

    // Find nearest visible box/panel/tab ledge for wall-sitting
    function getVisibleLedges() {
        return Array.from(document.querySelectorAll(LEDGE_SELECTOR)).filter(el => {
            if (el.closest('#dash-mini-mascot')) return false;
            const rect = el.getBoundingClientRect();
            return (
                rect.width >= 90 &&
                rect.height >= 28 &&
                rect.bottom > 64 &&
                rect.top < window.innerHeight - 20 &&
                rect.right > 20 &&
                rect.left < window.innerWidth - 20
            );
        });
    }

    function findNearestLedge(centerX, seatY, snapRadius = 56) {
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
        if (state.highlightedEl) {
            state.highlightedEl.classList.remove('mascot-ledge-highlight');
        }
        state.highlightedEl = el;
        if (el) el.classList.add('mascot-ledge-highlight');
    }

    function sitOnElementLedge(el, preferredCenterX, glide = true) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;

        const w = wrap.offsetWidth || 92;
        const minCenter = rect.left + Math.min(44, rect.width * 0.25);
        const maxCenter = rect.right - Math.min(44, rect.width * 0.25);
        const centerX = preferredCenterX != null
            ? clamp(preferredCenterX, minCenter, maxCenter)
            : rect.left + rect.width * (0.25 + Math.random() * 0.55);

        state.dockedEl = el;
        state.dockedRelX = rect.width > 0 ? clamp((centerX - rect.left) / rect.width, 0.12, 0.88) : 0.5;

        if (glide) wrap.classList.add('mascot-glide');
        applyPosition(centerX - w / 2, rect.top - SEAT_OFFSET_Y);
        setMode('sitting', 'PERCHED // SIT');

        if (glide) {
            setTimeout(() => {
                wrap.classList.remove('mascot-glide');
                playHop();
            }, 340);
        }
        return true;
    }

    // Keep mascot seated cleanly on its chosen box when scrolling or resizing
    function syncDockedPosition() {
        if (state.isDragging || state.mode === 'inspecting' || !state.dockedEl) return;
        const rect = state.dockedEl.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > window.innerHeight + 60) {
            // If docked box scrolled far out or tab changed, stay safely visible
            return;
        }
        const w = wrap.offsetWidth || 92;
        const targetLeft = rect.left + rect.width * state.dockedRelX - w / 2;
        const targetTop = rect.top - SEAT_OFFSET_Y;
        applyPosition(targetLeft, targetTop);
    }

    // Pick a random visible box inside the dashboard on initial load
    function perchOnRandomBox(glide = false) {
        const candidates = getVisibleLedges().filter(el => !el.classList.contains('sidebar-item'));
        const pool = candidates.length > 0 ? candidates : getVisibleLedges();
        if (pool.length === 0) {
            applyPosition(window.innerWidth - 116, window.innerHeight - 134);
            setMode('sitting', 'CHILL // DRAG');
            return;
        }
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        sitOnElementLedge(chosen, null, glide);
    }

    // =========================================================================
    // REAL-TIME OPPOSITE-DIRECTION WIND/INERTIA PHYSICS LOOP DURING DRAG
    // Moving Right (velX > 0) => Limbs & lower body trail LEFT (+angle in SVG)
    // Moving Left  (velX < 0) => Limbs & lower body trail RIGHT (-angle in SVG)
    // Moving Down  (velY > 0) => Arms flare UPWARD/OUTWARD opposite gravity
    // =========================================================================
    function stepDragPhysics() {
        if (!state.isDragging) {
            state.rafId = null;
            return;
        }

        // Decay velocity smoothly when finger/mouse pauses mid-drag
        state.velX *= 0.82;
        state.velY *= 0.82;

        // Horizontal opposite-direction wind trail (proportional between arms & legs)
        const windTrail = clamp(state.velX * 2.1, -50, 50);
        // Vertical opposite-direction flare (dragging down lifts arms up; dragging up streamlines down)
        const verticalFlare = clamp(state.velY * 1.25, -16, 36);

        const targetTorso = clamp(state.velX * 0.72, -20, 20);
        const targetArmL = clamp(windTrail * 0.92 + verticalFlare, -54, 62);
        const targetArmR = clamp(windTrail * 0.92 - verticalFlare, -62, 54);
        const targetLegL = clamp(windTrail * 1.12 + verticalFlare * 0.28, -56, 56);
        const targetLegR = clamp(windTrail * 1.06 - verticalFlare * 0.28, -56, 56);

        // Smooth spring interpolation for natural, coordinated limb motion
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

        // Sync eye direction with drag motion (looks excitedly ahead of drag vector)
        const speed = Math.hypot(state.velX, state.velY);
        const rect = svg.getBoundingClientRect();
        const eyeX = rect.left + rect.width * 0.5;
        const eyeY = rect.top + rect.height * 0.28;
        trackEyeTo(eyeX + state.velX * 8, eyeY + state.velY * 8, speed > 6);

        state.rafId = requestAnimationFrame(stepDragPhysics);
    }

    // =========================================================================
    // POINTER DRAG & DROP HANDLERS (MOUSE & MOBILE TOUCH)
    // =========================================================================
    wrap.addEventListener('pointerdown', (e) => {
        if (e.target && e.target.closest('button')) return;
        if (state.isPlaceMode) exitPlaceMode();

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
        state.origLeft = rect.left;
        state.origTop = rect.top;
        state.velX = 0;
        state.velY = 0;

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
            setMode('dragging', 'FLYING...');
            if (!state.rafId) state.rafId = requestAnimationFrame(stepDragPhysics);
        }

        if (state.movedDuringDrag) {
            state.velX = lerp(state.velX, stepX, 0.6);
            state.velY = lerp(state.velY, stepY, 0.6);
            applyPosition(state.origLeft + dx, state.origTop + dy);

            const w = wrap.offsetWidth || 92;
            const nearest = findNearestLedge(state.currLeft + w / 2, state.currTop + SEAT_OFFSET_Y, 56);
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

        if (state.movedDuringDrag) {
            const w = wrap.offsetWidth || 92;
            if (hoveredLedge) {
                sitOnElementLedge(hoveredLedge, state.currLeft + w / 2, true);
            } else {
                state.dockedEl = null;
                setMode('sitting', 'FLOATING // SIT');
                playHop();
            }
        } else {
            // Simple tap/click on mascot => playful hop & blink
            setMode(state.mode === 'inspecting' ? 'inspecting' : 'sitting');
            playHop();
            svg.classList.add('mascot-blink');
            setTimeout(() => svg.classList.remove('mascot-blink'), 170);
        }
    }

    wrap.addEventListener('pointerup', finishDrag);
    wrap.addEventListener('pointercancel', finishDrag);

    // =========================================================================
    // TAP-ANYWHERE PLACEMENT MODE (For Quick Mobile Perching)
    // =========================================================================
    function handleTapToPlace(e) {
        if (!state.isPlaceMode) return;
        if (e.target && e.target.closest('#dash-mini-mascot')) return;
        e.preventDefault();
        e.stopPropagation();

        const w = wrap.offsetWidth || 92;
        const nearest = findNearestLedge(e.clientX, e.clientY, 64);
        if (nearest) {
            sitOnElementLedge(nearest.el, e.clientX, true);
        } else {
            state.dockedEl = null;
            wrap.classList.add('mascot-glide');
            applyPosition(e.clientX - w / 2, e.clientY - SEAT_OFFSET_Y);
            setMode('sitting', 'FLOATING // SIT');
            setTimeout(() => {
                wrap.classList.remove('mascot-glide');
                playHop();
            }, 340);
        }
        exitPlaceMode();
    }

    function exitPlaceMode() {
        state.isPlaceMode = false;
        document.removeEventListener('pointerdown', handleTapToPlace, true);
        if (placeBtn) placeBtn.classList.remove('text-[#39ff88]');
        document.body.style.cursor = '';
        if (state.mode === 'sitting') setTag(state.dockedEl ? 'PERCHED // SIT' : 'FLOATING // SIT');
    }

    window.toggleMascotPlaceMode = function () {
        if (state.isPlaceMode) {
            exitPlaceMode();
            return;
        }
        state.isPlaceMode = true;
        if (placeBtn) placeBtn.classList.add('text-[#39ff88]');
        setTag('TAP ANY BOX');
        document.body.style.cursor = 'crosshair';
        setTimeout(() => {
            document.addEventListener('pointerdown', handleTapToPlace, true);
        }, 0);
    };

    window.toggleMiniMascot = function (show) {
        const restore = document.getElementById('dash-mascot-restore');
        if (!restore) return;
        if (show) {
            wrap.classList.remove('hidden');
            restore.classList.add('hidden');
        } else {
            wrap.classList.add('hidden');
            restore.classList.remove('hidden');
        }
    };

    // =========================================================================
    // SCAN-LINE TRAVERSAL & TERMINAL SCROLLING API
    // Mascot glides beside streaming terminal lines & scrolls code up/down
    // =========================================================================
    let prevActiveLine = null;

    function highlightTerminalLine(lineEl) {
        if (prevActiveLine) prevActiveLine.classList.remove('term-line-active');
        prevActiveLine = lineEl;
        if (lineEl) lineEl.classList.add('term-line-active');
    }

    function inspectTerminalLine(lineEl, labelText) {
        if (!lineEl || state.isDragging || wrap.classList.contains('hidden')) return;
        const termBody = document.getElementById('terminal-body');
        if (!termBody) return;

        state.dockedEl = null;
        highlightTerminalLine(lineEl);

        // Smoothly scroll terminal so the line stays comfortably in view as mascot rides along it
        const targetScroll = Math.max(0, lineEl.offsetTop - termBody.clientHeight * 0.55);
        termBody.scrollTo({ top: targetScroll, behavior: 'smooth' });

        const bodyRect = termBody.getBoundingClientRect();
        const lineRect = lineEl.getBoundingClientRect();
        const clampedLineY = clamp(lineRect.top + lineRect.height / 2, bodyRect.top + 24, bodyRect.bottom - 24);
        const w = wrap.offsetWidth || 92;

        // Place mascot right next to the code line inside the right edge of the terminal
        wrap.classList.add('mascot-glide');
        applyPosition(bodyRect.right - w - 10, clampedLineY - 56);
        setMode('inspecting', labelText || 'READING CODE');

        // Focus eye directly on the left-side text of the code line
        trackEyeTo(bodyRect.left + 80, clampedLineY, true);
    }

    async function sweepTerminalScrollReview() {
        const termBody = document.getElementById('terminal-body');
        const termCard = document.getElementById('terminal-card');
        if (!termBody || state.isDragging || wrap.classList.contains('hidden')) return;

        const lines = Array.from(termBody.querySelectorAll('.term-log-line'));
        if (lines.length >= 4) {
            // Pull terminal slightly back up to review top findings, then scroll back down
            setTag('SCROLLING UP');
            const topSample = lines[Math.min(1, lines.length - 1)];
            inspectTerminalLine(topSample, 'REVIEW TOP');
            await new Promise(r => setTimeout(r, 420));

            setTag('SCROLLING DOWN');
            const bottomSample = lines[lines.length - 1];
            inspectTerminalLine(bottomSample, 'REVIEW END');
            await new Promise(r => setTimeout(r, 420));
        }
        highlightTerminalLine(null);
        if (termCard) {
            sitOnElementLedge(termCard, termCard.getBoundingClientRect().right - 80, true);
            setTag('SCAN DONE // SIT');
        } else {
            setMode('sitting', 'SCAN DONE // SIT');
            playHop();
        }
    }

    // Global Pointer & Touch Eye Tracking (When Not Dragging or Inspecting)
    window.addEventListener('pointermove', (e) => {
        if (state.isDragging || state.mode === 'inspecting') return;
        trackEyeTo(e.clientX, e.clientY, false);
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (state.isDragging || state.mode === 'inspecting') return;
        if (e.touches && e.touches[0]) trackEyeTo(e.touches[0].clientX, e.touches[0].clientY, false);
    }, { passive: true });

    // Occasional Natural Idle Blink
    setInterval(() => {
        if (state.isDragging || wrap.classList.contains('hidden')) return;
        if (Math.random() < 0.35) {
            svg.classList.add('mascot-blink');
            setTimeout(() => svg.classList.remove('mascot-blink'), 150);
        }
    }, 2600);

    // Sync Position on Scroll & Resize
    window.addEventListener('scroll', syncDockedPosition, { passive: true });
    window.addEventListener('resize', () => {
        if (state.dockedEl) syncDockedPosition();
        else applyPosition(state.currLeft, state.currTop);
    }, { passive: true });

    // Public API for dashboard.js
    window.TriScoutMascot = {
        perchOnRandomBox,
        sitOnElementLedge,
        inspectTerminalLine,
        sweepTerminalScrollReview,
        onTabChange: function () {
            if (state.isDragging || state.mode === 'inspecting') return;
            // If previously docked box is now hidden in another tab, gracefully perch on a visible box in the new tab
            if (state.dockedEl) {
                const rect = state.dockedEl.getBoundingClientRect();
                if (!rect.width || !rect.height) {
                    setTimeout(() => perchOnRandomBox(true), 80);
                }
            }
        }
    };

    // Initial random box placement after layout settles
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => perchOnRandomBox(false), 120);
    });
})();
