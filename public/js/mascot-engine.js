/* ============================================================================
   TriScout High-FPS 2-Bone Articulated Wall-Sitting Mascot Engine
   - GPU-composited translate3d positioning (zero layout thrashing on mobile)
   - Analytical 2-Bone Arm IK keeping both palms braced flat on the box edge
   - 3D depth-foreshortened swinging shins & shoes from box-edge knees
   - Soft spring squash-and-stretch landing, lerped eye tracking & idle glances
   - Pauses rAF automatically when backgrounded to save CPU/battery
   ============================================================================ */
(function () {
    const LEDGE_SELECTOR = '[data-mascot-ledge], .bp-panel, .bp-frame, .sidebar-item, #terminal-card';

    const wrap = document.getElementById('dash-mini-mascot');
    const svg = document.getElementById('dash-mascot-svg');
    const torsoGroup = document.getElementById('dash-torso-group');
    const shadowEl = document.getElementById('dash-ledge-shadow');

    const armLOuter = document.getElementById('dash-arm-l-outer');
    const armLInner = document.getElementById('dash-arm-l-inner');
    const handL = document.getElementById('dash-hand-l');
    const armROuter = document.getElementById('dash-arm-r-outer');
    const armRInner = document.getElementById('dash-arm-r-inner');
    const handR = document.getElementById('dash-hand-r');

    const thighLOuter = document.getElementById('dash-thigh-l-outer');
    const thighLInner = document.getElementById('dash-thigh-l-inner');
    const shinLOuter = document.getElementById('dash-shin-l-outer');
    const shinLInner = document.getElementById('dash-shin-l-inner');
    const kneeL = document.getElementById('dash-knee-l');
    const shoeL = document.getElementById('dash-shoe-l');

    const thighROuter = document.getElementById('dash-thigh-r-outer');
    const thighRInner = document.getElementById('dash-thigh-r-inner');
    const shinROuter = document.getElementById('dash-shin-r-outer');
    const shinRInner = document.getElementById('dash-shin-r-inner');
    const kneeR = document.getElementById('dash-knee-r');
    const shoeR = document.getElementById('dash-shoe-r');

    const pupil = document.getElementById('dash-pupil-group');
    const iris = document.getElementById('dash-iris-ring');
    const pupilCore = document.getElementById('dash-pupil-core');

    if (!wrap || !svg || !armLOuter || !shinLOuter) return;

    const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const state = {
        mode: 'sitting',         // 'sitting' | 'dragging' | 'inspecting'
        anchorSpace: 'page',     // 'page' (absolute) | 'fixed'
        isDragging: false,
        movedDuringDrag: false,
        activePointerId: null,
        startX: 0,
        startY: 0,
        origViewX: 24,
        origViewY: 120,
        currViewX: 24,
        currViewY: 120,
        prevPointerX: 0,
        prevPointerY: 0,
        velX: 0,
        velY: 0,
        sVelX: 0,
        sVelY: 0,
        sLagX: 0,
        sLagY: 0,
        sitBlend: 1,
        hopEnergy: 0,
        landSquash: 0,
        targetLookX: window.innerWidth * 0.5,
        targetLookY: window.innerHeight * 0.4,
        eyeOffsetX: 0,
        eyeOffsetY: 0,
        eyeAngleDeg: 0,
        eyeBoost: false,
        lastPointerTime: performance.now(),
        inspectPointY: 132,
        dockedEl: null,
        dockedRelX: 0.78,
        highlightedEl: null,
        t: 0,
        lastFrameTime: performance.now(),
        rafId: null
    };

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function getSeatOffsetY() {
        const h = svg.getBoundingClientRect().height || 80;
        return h * ((184 - 20) / 250); // 52.48px at 80px height — locks torso & palms flush on box top edge
    }

    // 2-Bone Analytical Inverse Kinematics Solver
    function solveIK2Bone(sx, sy, tx, ty, L1, L2, bendDir) {
        const dx = tx - sx;
        const dy = ty - sy;
        const rawD = Math.hypot(dx, dy) || 0.001;
        const d = clamp(rawD, Math.abs(L1 - L2) + 0.1, L1 + L2 - 0.1);
        const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d);
        const h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
        const mx = sx + (a * dx) / d;
        const my = sy + (a * dy) / d;
        return {
            ex: mx + bendDir * h * (-dy / d),
            ey: my + bendDir * h * (dx / d)
        };
    }

    function setArmPose(outerEl, innerEl, handEl, sx, sy, ex, ey, hx, hy, handRx, handRy, handRot) {
        const d = `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${ex.toFixed(1)} ${ey.toFixed(1)} ${hx.toFixed(1)} ${hy.toFixed(1)}`;
        outerEl.setAttribute('d', d);
        innerEl.setAttribute('d', d);
        handEl.setAttribute('cx', hx.toFixed(1));
        handEl.setAttribute('cy', hy.toFixed(1));
        handEl.setAttribute('rx', handRx.toFixed(1));
        handEl.setAttribute('ry', handRy.toFixed(1));
        handEl.setAttribute('transform', `rotate(${handRot.toFixed(1)} ${hx.toFixed(1)} ${hy.toFixed(1)})`);
    }

    function setLegPose(tOut, tIn, sOut, sIn, kneeEl, shoeEl, hx, hy, kx, ky, fx, fy, shoeScale, shoeRot) {
        const thighD = `M ${hx.toFixed(1)} ${hy.toFixed(1)} Q ${((hx + kx) * 0.5).toFixed(1)} ${(hy + 5).toFixed(1)} ${kx.toFixed(1)} ${ky.toFixed(1)}`;
        const shinCtrlX = (kx + fx) * 0.5 + (fx - kx) * 0.15;
        const shinCtrlY = (ky + fy) * 0.5;
        const shinD = `M ${kx.toFixed(1)} ${ky.toFixed(1)} Q ${shinCtrlX.toFixed(1)} ${shinCtrlY.toFixed(1)} ${fx.toFixed(1)} ${fy.toFixed(1)}`;

        tOut.setAttribute('d', thighD);
        tIn.setAttribute('d', thighD);
        sOut.setAttribute('d', shinD);
        sIn.setAttribute('d', shinD);

        kneeEl.setAttribute('cx', kx.toFixed(1));
        kneeEl.setAttribute('cy', ky.toFixed(1));
        shoeEl.setAttribute('transform', `translate(${fx.toFixed(1)}, ${(fy + 5).toFixed(1)}) rotate(${shoeRot.toFixed(1)}) scale(${shoeScale.toFixed(2)})`);
    }

    function updateSmoothedEye(dt) {
        if (!pupil) return;
        const eyeScreenX = state.currViewX + 48;
        const eyeScreenY = state.currViewY + 22;

        let txTarget = state.targetLookX;
        let tyTarget = state.targetLookY;
        let boost = state.eyeBoost;

        if (state.isDragging && state.movedDuringDrag) {
            txTarget = eyeScreenX + state.sVelX * 14;
            tyTarget = eyeScreenY + state.sVelY * 14;
            boost = Math.hypot(state.sVelX, state.sVelY) > 4.5;
        }

        const dx = txTarget - eyeScreenX;
        const dy = tyTarget - eyeScreenY;
        const ang = Math.atan2(dy, dx);
        const dist = Math.min(8.8, Math.hypot(dx, dy) / 16);

        const desiredX = Math.cos(ang) * dist;
        const desiredY = Math.sin(ang) * dist;
        const smooth = 1 - Math.exp(-18 * dt);

        state.eyeOffsetX = lerp(state.eyeOffsetX, desiredX, smooth);
        state.eyeOffsetY = lerp(state.eyeOffsetY, desiredY, smooth);
        state.eyeAngleDeg = Math.round((ang * 180) / Math.PI) + 90;

        pupil.style.transform = `translate3d(${state.eyeOffsetX.toFixed(2)}px, ${state.eyeOffsetY.toFixed(2)}px, 0)`;
        if (iris) iris.style.transform = `rotate(${state.eyeAngleDeg}deg)`;
        if (pupilCore) {
            pupilCore.setAttribute('r', boost ? '6.1' : '5');
            pupilCore.setAttribute('fill', boost ? '#39ff88' : '#00d9ff');
        }
    }

    // =========================================================================
    // 60/120 FPS KINEMATIC LOOP (Frame-rate independent exponential smoothing)
    // =========================================================================
    function renderRigFrame(now) {
        if (document.hidden || wrap.classList.contains('hidden')) {
            state.rafId = null;
            return;
        }

        const dt = Math.min(0.05, Math.max(0.001, (now - state.lastFrameTime) / 1000));
        state.lastFrameTime = now;

        const speedBoost = 1 + state.hopEnergy * 1.5;
        if (!prefersReducedMotion) state.t += dt * speedBoost;
        state.hopEnergy = Math.max(0, state.hopEnergy - dt * 1.9);
        state.landSquash = Math.max(0, state.landSquash - dt * 3.4);

        const damp = Math.exp(-11 * dt);
        state.velX *= damp;
        state.velY *= damp;
        state.sVelX = lerp(state.sVelX, state.velX, 1 - Math.exp(-16 * dt));
        state.sVelY = lerp(state.sVelY, state.velY, 1 - Math.exp(-16 * dt));
        state.sLagX = lerp(state.sLagX, state.sVelX, 1 - Math.exp(-8 * dt));
        state.sLagY = lerp(state.sLagY, state.sVelY, 1 - Math.exp(-8 * dt));

        const targetBlend = state.mode === 'dragging' ? 0 : 1;
        state.sitBlend = lerp(state.sitBlend, targetBlend, 1 - Math.exp(-12 * dt));

        // 1. Torso Posture + Landing Squash & Stretch
        const hopY = -Math.sin(state.hopEnergy * Math.PI) * 14;
        const squashWave = Math.sin(state.landSquash * Math.PI);
        const scaleX = 1 + squashWave * 0.08;
        const scaleY = 1 - squashWave * 0.08;

        const sitBreathY = Math.sin(state.t * 1.8) * 1.8;
        const sitLeanRot = Math.sin(state.t * 0.9) * 2.4;
        const sitLeanX = Math.sin(state.t * 0.9) * 2.2;

        const dragTilt = clamp(state.sVelX * 0.85, -24, 24);
        const torsoRot = lerp(dragTilt, state.mode === 'inspecting' ? -4.5 : sitLeanRot, state.sitBlend);
        const torsoShiftY = lerp(0, sitBreathY + hopY, state.sitBlend);
        const torsoShiftX = lerp(0, sitLeanX, state.sitBlend);

        if (torsoGroup) {
            torsoGroup.setAttribute(
                'transform',
                `translate(${torsoShiftX.toFixed(1)}, ${torsoShiftY.toFixed(1)}) translate(190, 180) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}) rotate(${torsoRot.toFixed(2)}) translate(-190, -180)`
            );
        }

        if (shadowEl) {
            const shadowOp = state.sitBlend * (state.mode === 'sitting' ? 0.62 : 0.35) * (1 - Math.abs(hopY) / 28);
            shadowEl.setAttribute('opacity', Math.max(0, shadowOp).toFixed(2));
        }

        const slx = 136 + torsoShiftX;
        const sly = 118 + torsoShiftY;
        const srx = 244 + torsoShiftX;
        const sry = 118 + torsoShiftY;

        const hlx = 164 + torsoShiftX * 0.4;
        const hly = 176 + torsoShiftY * 0.5;
        const hrx = 216 + torsoShiftX * 0.4;
        const hry = 176 + torsoShiftY * 0.5;

        // 2. ARMS (2-Bone IK Braced on Box Ledge vs Opposite-Wind Drag Trail)
        const sitHandLX = 104, sitHandLY = 183;
        const sitHandRX = 276, sitHandRY = 183;

        const windX = clamp(-state.sVelX * 2.8, -68, 68);
        const lagWindX = clamp(-state.sLagX * 3.6, -82, 82);
        const windY = clamp(-state.sVelY * 1.9, -46, 36);

        const ikL = solveIK2Bone(slx, sly, sitHandLX, sitHandLY, 41, 39, +1);
        const ikR = solveIK2Bone(srx, sry, sitHandRX, sitHandRY, 41, 39, -1);

        let elx, ely, pxL, pyL, erx, ery, pxR, pyR;
        const handRx = lerp(8.5, 10.5, state.sitBlend);
        const handRy = lerp(8.5, 6.2, state.sitBlend);

        if (state.mode === 'inspecting') {
            const ptX = 72;
            const ptY = state.inspectPointY + Math.sin(state.t * 4) * 4;
            const ikPoint = solveIK2Bone(slx, sly, ptX, ptY, 41, 39, -1);
            elx = ikPoint.ex; ely = ikPoint.ey; pxL = ptX; pyL = ptY;
            erx = ikR.ex; ery = ikR.ey; pxR = sitHandRX; pyR = sitHandRY;
        } else {
            elx = lerp(slx - 16 + windX * 0.55, ikL.ex, state.sitBlend);
            ely = lerp(sly + 30 + windY * 0.45, ikL.ey, state.sitBlend);
            pxL = lerp(slx - 26 + lagWindX * 0.95, sitHandLX, state.sitBlend);
            pyL = lerp(sly + 62 + windY * 0.9, sitHandLY, state.sitBlend);

            erx = lerp(srx + 16 + windX * 0.55, ikR.ex, state.sitBlend);
            ery = lerp(sry + 30 + windY * 0.45, ikR.ey, state.sitBlend);
            pxR = lerp(srx + 26 + lagWindX * 0.95, sitHandRX, state.sitBlend);
            pyR = lerp(sry + 62 + windY * 0.9, sitHandRY, state.sitBlend);
        }

        setArmPose(armLOuter, armLInner, handL, slx, sly, elx, ely, pxL, pyL, handRx, handRy, lerp(-20, -6, state.sitBlend));
        setArmPose(armROuter, armRInner, handR, srx, sry, erx, ery, pxR, pyR, handRx, handRy, lerp(20, 6, state.sitBlend));

        // 3. LEGS (Wall-Sitting 3D Depth Kick vs Double-Pendulum Drag Trail)
        const kickPhaseL = Math.sin(state.t * 2.5);
        const kickPhaseR = Math.sin(state.t * 2.5 + Math.PI);

        const sitKneeLX = 156 + torsoShiftX * 0.25;
        const sitKneeLY = 191 - Math.max(0, kickPhaseL) * 3 + hopY * 0.5;
        const sitKneeRX = 224 + torsoShiftX * 0.25;
        const sitKneeRY = 191 - Math.max(0, kickPhaseR) * 3 + hopY * 0.5;

        const sitFootLX = sitKneeLX - 3 - kickPhaseL * 9;
        const sitFootLY = 236 - kickPhaseL * 17 + hopY * 0.6;
        const sitFootRX = sitKneeRX + 3 + kickPhaseR * 9;
        const sitFootRY = 236 - kickPhaseR * 17 + hopY * 0.6;

        const klx = lerp(hlx - 4 + windX * 0.55, sitKneeLX, state.sitBlend);
        const kly = lerp(hly + 32 + Math.min(10, windY * 0.3), sitKneeLY, state.sitBlend);
        const flx = lerp(hlx - 8 + lagWindX * 1.05, sitFootLX, state.sitBlend);
        const fly = lerp(hly + 68 + Math.min(18, windY * 0.5), sitFootLY, state.sitBlend);

        const krx = lerp(hrx + 4 + windX * 0.55, sitKneeRX, state.sitBlend);
        const kry = lerp(hry + 32 + Math.min(10, windY * 0.3), sitKneeRY, state.sitBlend);
        const frx = lerp(hrx + 8 + lagWindX * 1.05, sitFootRX, state.sitBlend);
        const fry = lerp(hry + 68 + Math.min(18, windY * 0.5), sitFootRY, state.sitBlend);

        const scaleL = lerp(0.98, 1.0 + kickPhaseL * 0.13, state.sitBlend);
        const scaleR = lerp(0.98, 1.0 + kickPhaseR * 0.13, state.sitBlend);
        const rotL = lerp(clamp(-state.sLagX * 1.4, -35, 35), -kickPhaseL * 14 - 4, state.sitBlend);
        const rotR = lerp(clamp(-state.sLagX * 1.4, -35, 35), kickPhaseR * 14 + 4, state.sitBlend);

        setLegPose(thighLOuter, thighLInner, shinLOuter, shinLInner, kneeL, shoeL, hlx, hly, klx, kly, flx, fly, scaleL, rotL);
        setLegPose(thighROuter, thighRInner, shinROuter, shinRInner, kneeR, shoeR, hrx, hry, krx, kry, frx, fry, scaleR, rotR);

        updateSmoothedEye(dt);
        state.rafId = requestAnimationFrame(renderRigFrame);
    }

    function ensureLoopRunning() {
        if (!state.rafId && !document.hidden && !wrap.classList.contains('hidden')) {
            state.lastFrameTime = performance.now();
            state.rafId = requestAnimationFrame(renderRigFrame);
        }
    }

    // =========================================================================
    // GPU-COMPOSITED POSITIONING & PROPER Z-INDEX LAYERING
    // =========================================================================
    function isInsideFixedContainer(el) {
        let curr = el;
        while (curr && curr !== document.body && curr !== document.documentElement) {
            if (window.getComputedStyle(curr).position === 'fixed') return true;
            curr = curr.parentElement;
        }
        return false;
    }

    function applyViewportPosition(xPx, yPx) {
        const w = wrap.offsetWidth || 96;
        const h = wrap.offsetHeight || 80;
        state.anchorSpace = 'fixed';
        wrap.style.position = 'fixed';
        wrap.style.zIndex = state.isDragging ? '60' : '55';
        state.currViewX = clamp(xPx, 4, Math.max(4, window.innerWidth - w - 4));
        state.currViewY = clamp(yPx, 4, Math.max(4, window.innerHeight - h - 4));
        wrap.style.transform = `translate3d(${state.currViewX.toFixed(1)}px, ${state.currViewY.toFixed(1)}px, 0)`;
    }

    function applyDocumentPosition(docX, docY) {
        const w = wrap.offsetWidth || 96;
        const docW = Math.max(document.documentElement.scrollWidth, window.innerWidth);
        const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
        state.anchorSpace = 'page';
        wrap.style.position = 'absolute';
        wrap.style.zIndex = '25'; // Above page cards, cleanly behind header (z-30) & mobile sidebar (z-50)
        const safeX = clamp(docX, 4, Math.max(4, docW - w - 4));
        const safeY = clamp(docY, 4, Math.max(4, docH - 40));
        wrap.style.transform = `translate3d(${safeX.toFixed(1)}px, ${safeY.toFixed(1)}px, 0)`;
        state.currViewX = safeX - window.scrollX;
        state.currViewY = safeY - window.scrollY;
    }

    function getVisibleLedges() {
        return Array.from(document.querySelectorAll(LEDGE_SELECTOR)).filter(el => {
            if (el.closest('#dash-mini-mascot')) return false;
            if (el.classList.contains('sidebar-item') && window.innerWidth < 1024) return false;
            const rect = el.getBoundingClientRect();
            return (
                rect.width >= 100 &&
                rect.height >= 28 &&
                rect.bottom > 40 &&
                rect.top < window.innerHeight - 10 &&
                rect.right > 20 &&
                rect.left < window.innerWidth - 20
            );
        });
    }

    function findNearestLedge(centerX, seatY, snapRadius = 64) {
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

        const w = wrap.offsetWidth || 96;
        const seatOffset = getSeatOffsetY();
        const minCenter = rect.left + Math.min(48, rect.width * 0.25);
        const maxCenter = rect.right - Math.min(48, rect.width * 0.25);
        // Default perch stays neatly toward the right side so centered titles & buttons remain clear
        const centerX = preferredCenterX != null
            ? clamp(preferredCenterX, minCenter, maxCenter)
            : rect.left + rect.width * (0.74 + Math.random() * 0.12);

        state.dockedEl = el;
        state.dockedRelX = rect.width > 0 ? clamp((centerX - rect.left) / rect.width, 0.12, 0.88) : 0.78;

        const targetIsFixed = isInsideFixedContainer(el);
        const switchingSpace = (targetIsFixed && state.anchorSpace !== 'fixed') || (!targetIsFixed && state.anchorSpace !== 'page');

        // Convert coordinate space seamlessly before gliding so there is no scroll jump
        if (glide && switchingSpace) {
            wrap.classList.remove('mascot-glide');
            const currRect = wrap.getBoundingClientRect();
            if (targetIsFixed) {
                applyViewportPosition(currRect.left, currRect.top);
            } else {
                applyDocumentPosition(currRect.left + window.scrollX, currRect.top + window.scrollY);
            }
            void wrap.offsetWidth;
        }

        if (glide) wrap.classList.add('mascot-glide');
        else wrap.classList.remove('mascot-glide');

        if (targetIsFixed) {
            applyViewportPosition(centerX - w / 2, rect.top - seatOffset);
        } else {
            applyDocumentPosition(centerX + window.scrollX - w / 2, rect.top + window.scrollY - seatOffset);
        }

        state.mode = 'sitting';
        if (glide) {
            setTimeout(() => {
                wrap.classList.remove('mascot-glide');
                state.landSquash = 1.0;
            }, 320);
        }
        return true;
    }

    function syncDockedOnResize() {
        if (state.isDragging || state.mode === 'inspecting' || !state.dockedEl) return;
        const rect = state.dockedEl.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        const w = wrap.offsetWidth || 96;
        const seatOffset = getSeatOffsetY();
        const centerX = rect.left + rect.width * state.dockedRelX;
        if (isInsideFixedContainer(state.dockedEl)) {
            applyViewportPosition(centerX - w / 2, rect.top - seatOffset);
        } else {
            applyDocumentPosition(centerX + window.scrollX - w / 2, rect.top + window.scrollY - seatOffset);
        }
    }

    function perchOnRandomBox(glide = false) {
        const candidates = getVisibleLedges().filter(el => !isInsideFixedContainer(el));
        const pool = candidates.length > 0 ? candidates : getVisibleLedges();
        if (pool.length === 0) {
            applyDocumentPosition(window.innerWidth - 116, window.scrollY + 100);
            state.mode = 'sitting';
            return;
        }
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        sitOnElementLedge(chosen, null, glide);
    }

    // =========================================================================
    // DRAG & DROP POINTER HANDLERS
    // =========================================================================
    wrap.addEventListener('pointerdown', (e) => {
        state.isDragging = true;
        state.movedDuringDrag = false;
        state.activePointerId = e.pointerId;
        state.dockedEl = null;
        wrap.classList.remove('mascot-glide');
        wrap.classList.add('is-grabbing');
        wrap.style.pointerEvents = 'auto';

        const rect = wrap.getBoundingClientRect();
        state.startX = e.clientX;
        state.startY = e.clientY;
        state.prevPointerX = e.clientX;
        state.prevPointerY = e.clientY;
        state.origViewX = rect.left;
        state.origViewY = rect.top;
        state.velX = 0;
        state.velY = 0;

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
            state.mode = 'dragging';
        }

        if (state.movedDuringDrag) {
            state.velX = lerp(state.velX, stepX, 0.65);
            state.velY = lerp(state.velY, stepY, 0.65);
            applyViewportPosition(state.origViewX + dx, state.origViewY + dy);

            const w = wrap.offsetWidth || 96;
            const nearest = findNearestLedge(state.currViewX + w / 2, state.currViewY + getSeatOffsetY(), 64);
            setLedgeHighlight(nearest ? nearest.el : null);
        }
    });

    function finishDrag(e) {
        if (!state.isDragging || (e && e.pointerId !== state.activePointerId)) return;
        state.isDragging = false;
        wrap.classList.remove('is-grabbing');
        wrap.style.pointerEvents = '';
        if (wrap.releasePointerCapture && state.activePointerId != null) {
            try { wrap.releasePointerCapture(state.activePointerId); } catch (err) {}
        }
        state.activePointerId = null;

        const hoveredLedge = state.highlightedEl;
        setLedgeHighlight(null);

        const w = wrap.offsetWidth || 96;
        if (state.movedDuringDrag) {
            if (hoveredLedge) {
                sitOnElementLedge(hoveredLedge, state.currViewX + w / 2, true);
            } else {
                state.dockedEl = null;
                applyDocumentPosition(state.currViewX + window.scrollX, state.currViewY + window.scrollY);
                state.mode = 'sitting';
                state.landSquash = 1.0;
            }
        } else {
            applyDocumentPosition(state.currViewX + window.scrollX, state.currViewY + window.scrollY);
            state.mode = 'sitting';
            state.hopEnergy = 1.0;
            svg.classList.add('mascot-blink');
            setTimeout(() => svg.classList.remove('mascot-blink'), 160);
        }
    }

    wrap.addEventListener('pointerup', finishDrag);
    wrap.addEventListener('pointercancel', finishDrag);

    // =========================================================================
    // TERMINAL CODE-LINE TRAVERSAL & SCROLL REVIEW
    // =========================================================================
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
        const w = wrap.offsetWidth || 96;

        wrap.classList.add('mascot-glide');
        applyDocumentPosition(bodyRect.right + window.scrollX - w - 6, clampedLineY + window.scrollY - 42);
        state.mode = 'inspecting';
        state.inspectPointY = 132;
        state.targetLookX = bodyRect.left + 80;
        state.targetLookY = clampedLineY;
        state.eyeBoost = true;
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
        state.eyeBoost = false;
        if (termCard) {
            sitOnElementLedge(termCard, termCard.getBoundingClientRect().right - 72, true);
            state.hopEnergy = 1.0;
        } else {
            state.mode = 'sitting';
            state.hopEnergy = 1.0;
        }
    }

    // Passive Pointer & Touch Look Targets (Zero DOM writes inside event handlers)
    window.addEventListener('pointermove', (e) => {
        if (state.isDragging || state.mode === 'inspecting') return;
        state.targetLookX = e.clientX;
        state.targetLookY = e.clientY;
        state.eyeBoost = false;
        state.lastPointerTime = performance.now();
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
        if (state.isDragging || state.mode === 'inspecting') return;
        if (e.touches && e.touches[0]) {
            state.targetLookX = e.touches[0].clientX;
            state.targetLookY = e.touches[0].clientY;
            state.eyeBoost = false;
            state.lastPointerTime = performance.now();
        }
    }, { passive: true });

    // Keep cached viewport coordinates synced on scroll so eye tracking stays accurate
    window.addEventListener('scroll', () => {
        if (state.anchorSpace === 'page') {
            const rect = wrap.getBoundingClientRect();
            state.currViewX = rect.left;
            state.currViewY = rect.top;
        }
    }, { passive: true });

    // Curious Idle Glances & Natural Blinks when pointer is idle
    setInterval(() => {
        if (document.hidden || state.isDragging || state.mode === 'inspecting' || wrap.classList.contains('hidden')) return;
        if (performance.now() - state.lastPointerTime > 2600) {
            state.targetLookX = Math.random() * window.innerWidth;
            state.targetLookY = Math.random() * window.innerHeight * 0.85;
            state.eyeBoost = Math.random() < 0.25;
        }
        if (Math.random() < 0.35) {
            svg.classList.add('mascot-blink');
            setTimeout(() => svg.classList.remove('mascot-blink'), 145);
        }
    }, 2400);

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) ensureLoopRunning();
    });

    window.addEventListener('resize', syncDockedOnResize, { passive: true });

    window.TriScoutMascot = {
        perchOnRandomBox,
        sitOnElementLedge,
        inspectTerminalLine,
        sweepTerminalScrollReview,
        celebrate: function () {
            state.hopEnergy = 1.0;
            state.landSquash = 0.8;
        },
        onTabChange: function () {
            if (state.isDragging || state.mode === 'inspecting') return;
            if (state.dockedEl) {
                const rect = state.dockedEl.getBoundingClientRect();
                if (!rect.width || !rect.height) setTimeout(() => perchOnRandomBox(true), 80);
            } else {
                setTimeout(() => perchOnRandomBox(true), 80);
            }
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            perchOnRandomBox(false);
            ensureLoopRunning();
        }, 120);
    });
})();
