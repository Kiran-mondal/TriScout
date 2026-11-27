/* ============================================================================
   TriScout 2-Bone Articulated Mascot Engine
   - Bulletproof mobile & desktop drag-and-drop with box-ledge snapping
   - 360° opposite-direction flying animation (arms, legs, torso lean & wind
     streaks trail opposite to movement during BOTH user drag & auto-flight)
   - True wall-sitting pose (both palms braced via 2-Bone IK, swinging knees)
   - GPU translate3d positioning + automatic background rAF pause
   ============================================================================ */
(function () {
    const LEDGE_SELECTOR = '[data-mascot-ledge], .bp-panel, .bp-frame, .sidebar-item, #terminal-card';

    const wrap = document.getElementById('dash-mini-mascot');
    const svg = document.getElementById('dash-mascot-svg');
    const torsoGroup = document.getElementById('dash-torso-group');
    const shadowEl = document.getElementById('dash-ledge-shadow');
    const windGroup = document.getElementById('dash-wind-lines');

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
        mode: 'sitting',         // 'sitting' | 'flying' | 'inspecting'
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
        currDocX: 24,
        currDocY: 120,
        prevPointerX: 0,
        prevPointerY: 0,
        // Flight velocity (px per 16ms frame)
        velX: 0,
        velY: 0,
        sVelX: 0,
        sVelY: 0,
        sLagX: 0,
        sLagY: 0,
        // Autonomous JS flight target (drives real flying animation between boxes/lines)
        autoFlight: null,
        sitBlend: 1,             // 1 = seated on ledge, 0 = airborne/flying
        hopEnergy: 0,
        landSquash: 0,
        // Smooth lerped eye tracking
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
        return h * ((184 - 20) / 250);
    }

    // 2-Bone Analytical Inverse Kinematics Solver (locks palms onto box ledge while seated)
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

    // Compute 360° opposite-side flying limb joints (handles Left, Right, Up, Down & Diagonals)
    function computeFlyingLimb(sx, sy, side, vx, vy, lagVx, lagVy, L1, L2, phaseOffset) {
        const spd = Math.hypot(vx, vy);
        const intensity = clamp(spd / 11, 0, 1);

        // Resting hover dangle (down and slightly outward)
        const bx = side * 0.26;
        const by = 0.96;

        // Opposite direction of travel (wind vector)
        const ux = spd > 0.25 ? -vx / spd : bx;
        const uy = spd > 0.25 ? -vy / spd : by;

        // Outward splay prevents left/right limbs collapsing onto torso when moving straight down
        const splayX = side * (0.24 + 0.34 * Math.max(0, -uy) * intensity);
        const blend = intensity * 0.92;

        let dx1 = bx * (1 - blend) + (ux + splayX) * blend;
        let dy1 = by * (1 - blend) + uy * blend;
        const mag1 = Math.hypot(dx1, dy1) || 1;
        dx1 /= mag1;
        dy1 /= mag1;

        // Secondary segment follows lagged velocity for whip/stream effect
        const lagSpd = Math.hypot(lagVx, lagVy);
        const lux = lagSpd > 0.25 ? -lagVx / lagSpd : ux;
        const luy = lagSpd > 0.25 ? -lagVy / lagSpd : uy;
        let dx2 = bx * (1 - blend) + (lux + splayX * 0.7) * blend;
        let dy2 = by * (1 - blend) + luy * blend;
        const mag2 = Math.hypot(dx2, dy2) || 1;
        dx2 /= mag2;
        dy2 /= mag2;

        // Perpendicular wind ripple flutter at speed
        const perpX = -dy2;
        const perpY = dx2;
        const flutter = Math.sin(state.t * 16 + phaseOffset) * (5.2 * intensity);

        const midX = sx + dx1 * L1 + perpX * (flutter * 0.45);
        const midY = sy + dy1 * L1 + perpY * (flutter * 0.45);
        const endX = midX + dx2 * L2 + perpX * flutter;
        const endY = midY + dy2 * L2 + perpY * flutter;
        const tipRot = (Math.atan2(dy2, dx2) * 180) / Math.PI - 90;

        return { midX, midY, endX, endY, tipRot, intensity };
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
        const thighD = `M ${hx.toFixed(1)} ${hy.toFixed(1)} Q ${((hx + kx) * 0.5).toFixed(1)} ${((hy + ky) * 0.5 + 3).toFixed(1)} ${kx.toFixed(1)} ${ky.toFixed(1)}`;
        const shinCtrlX = (kx + fx) * 0.5 + (fx - kx) * 0.14;
        const shinCtrlY = (ky + fy) * 0.5;
        const shinD = `M ${kx.toFixed(1)} ${ky.toFixed(1)} Q ${shinCtrlX.toFixed(1)} ${shinCtrlY.toFixed(1)} ${fx.toFixed(1)} ${fy.toFixed(1)}`;

        tOut.setAttribute('d', thighD);
        tIn.setAttribute('d', thighD);
        sOut.setAttribute('d', shinD);
        sIn.setAttribute('d', shinD);

        kneeEl.setAttribute('cx', kx.toFixed(1));
        kneeEl.setAttribute('cy', ky.toFixed(1));
        shoeEl.setAttribute('transform', `translate(${fx.toFixed(1)}, ${(fy + 4).toFixed(1)}) rotate(${shoeRot.toFixed(1)}) scale(${shoeScale.toFixed(2)})`);
    }

    function updateWindStreaks() {
        if (!windGroup) return;
        const spd = Math.hypot(state.sVelX, state.sVelY);
        const airFactor = 1 - state.sitBlend;
        const alpha = clamp((spd - 2.5) / 10, 0, 0.85) * airFactor;
        windGroup.setAttribute('opacity', alpha.toFixed(2));
        if (alpha > 0.02) {
            const oppAngle = (Math.atan2(-state.sVelY, -state.sVelX) * 180) / Math.PI;
            windGroup.setAttribute('transform', `rotate(${oppAngle.toFixed(1)} 190 120)`);
        }
    }

    function updateSmoothedEye(dt) {
        if (!pupil) return;
        const eyeScreenX = state.currViewX + 48;
        const eyeScreenY = state.currViewY + 22;

        let txTarget = state.targetLookX;
        let tyTarget = state.targetLookY;
        let boost = state.eyeBoost;

        if ((state.isDragging && state.movedDuringDrag) || state.autoFlight) {
            txTarget = eyeScreenX + state.sVelX * 16;
            tyTarget = eyeScreenY + state.sVelY * 16;
            boost = Math.hypot(state.sVelX, state.sVelY) > 4;
        }

        const dx = txTarget - eyeScreenX;
        const dy = tyTarget - eyeScreenY;
        const ang = Math.atan2(dy, dx);
        const dist = Math.min(8.8, Math.hypot(dx, dy) / 16);

        const smooth = 1 - Math.exp(-18 * dt);
        state.eyeOffsetX = lerp(state.eyeOffsetX, Math.cos(ang) * dist, smooth);
        state.eyeOffsetY = lerp(state.eyeOffsetY, Math.sin(ang) * dist, smooth);
        state.eyeAngleDeg = Math.round((ang * 180) / Math.PI) + 90;

        pupil.style.transform = `translate3d(${state.eyeOffsetX.toFixed(2)}px, ${state.eyeOffsetY.toFixed(2)}px, 0)`;
        if (iris) iris.style.transform = `rotate(${state.eyeAngleDeg}deg)`;
        if (pupilCore) {
            pupilCore.setAttribute('r', boost ? '6.2' : '5');
            pupilCore.setAttribute('fill', boost ? '#39ff88' : '#00d9ff');
        }
    }

    // =========================================================================
    // AUTONOMOUS JS FLIGHT STEPPER (Generates Real Opposite-Wind Velocity)
    // =========================================================================
    function stepAutoFlight(dt) {
        const f = state.autoFlight;
        if (!f) return;

        const currX = f.space === 'fixed' ? state.currViewX : state.currDocX;
        const currY = f.space === 'fixed' ? state.currViewY : state.currDocY;
        const dx = f.targetX - currX;
        const dy = f.targetY - currY;
        const dist = Math.hypot(dx, dy);

        if (dist < 1.5 || prefersReducedMotion) {
            if (f.space === 'fixed') applyViewportPosition(f.targetX, f.targetY);
            else applyDocumentPosition(f.targetX, f.targetY);
            state.autoFlight = null;
            state.mode = f.endMode || 'sitting';
            if (state.mode === 'sitting') state.landSquash = 1.0;
            if (typeof f.onArrive === 'function') f.onArrive();
            return;
        }

        const stepFactor = 1 - Math.exp(-9.5 * dt);
        const stepX = dx * stepFactor;
        const stepY = dy * stepFactor;

        // Feed normalized 60fps velocity into opposite-side flying physics
        const normScale = (1 / 60) / dt;
        state.velX = clamp(stepX * normScale * 1.45, -28, 28);
        state.velY = clamp(stepY * normScale * 1.45, -28, 28);
        state.mode = 'flying';

        if (f.space === 'fixed') applyViewportPosition(currX + stepX, currY + stepY);
        else applyDocumentPosition(currX + stepX, currY + stepY);
    }

    // =========================================================================
    // 60/120 FPS KINEMATIC RIG LOOP
    // =========================================================================
    function renderRigFrame(now) {
        if (document.hidden || wrap.classList.contains('hidden')) {
            state.rafId = null;
            return;
        }

        const dt = Math.min(0.05, Math.max(0.001, (now - state.lastFrameTime) / 1000));
        state.lastFrameTime = now;

        stepAutoFlight(dt);

        const speedBoost = 1 + state.hopEnergy * 1.5;
        if (!prefersReducedMotion) state.t += dt * speedBoost;
        state.hopEnergy = Math.max(0, state.hopEnergy - dt * 1.9);
        state.landSquash = Math.max(0, state.landSquash - dt * 3.4);

        const damp = Math.exp(-9.5 * dt);
        if (!state.autoFlight) {
            state.velX *= damp;
            state.velY *= damp;
        }
        state.sVelX = lerp(state.sVelX, state.velX, 1 - Math.exp(-16 * dt));
        state.sVelY = lerp(state.sVelY, state.velY, 1 - Math.exp(-16 * dt));
        state.sLagX = lerp(state.sLagX, state.sVelX, 1 - Math.exp(-7.5 * dt));
        state.sLagY = lerp(state.sLagY, state.sVelY, 1 - Math.exp(-7.5 * dt));

        const targetBlend = state.mode === 'flying' ? 0 : 1;
        state.sitBlend = lerp(state.sitBlend, targetBlend, 1 - Math.exp(-13 * dt));

        // 1. Torso Lean: While flying, bottom swings opposite to travel direction around top pivot
        const hopY = -Math.sin(state.hopEnergy * Math.PI) * 14;
        const squashWave = Math.sin(state.landSquash * Math.PI);
        const scaleX = 1 + squashWave * 0.08;
        const scaleY = 1 - squashWave * 0.08;

        const sitBreathY = Math.sin(state.t * 1.8) * 1.8;
        const sitLeanRot = Math.sin(state.t * 0.9) * 2.4;
        const sitLeanX = Math.sin(state.t * 0.9) * 2.2;

        // Moving RIGHT (sVelX > 0) => positive rotation around head (190, 62) swings torso bottom LEFT!
        const flyTilt = clamp(state.sVelX * 1.65, -28, 28);
        const torsoRot = lerp(flyTilt, state.mode === 'inspecting' ? -4.5 : sitLeanRot, state.sitBlend);
        const torsoPivotY = lerp(64, 180, state.sitBlend);
        const torsoShiftY = lerp(0, sitBreathY + hopY, state.sitBlend);
        const torsoShiftX = lerp(0, sitLeanX, state.sitBlend);

        if (torsoGroup) {
            torsoGroup.setAttribute(
                'transform',
                `translate(${torsoShiftX.toFixed(1)}, ${torsoShiftY.toFixed(1)}) translate(190, ${torsoPivotY.toFixed(1)}) scale(${scaleX.toFixed(3)}, ${scaleY.toFixed(3)}) rotate(${torsoRot.toFixed(2)}) translate(-190, ${(-torsoPivotY).toFixed(1)})`
            );
        }

        if (shadowEl) {
            const shadowOp = state.sitBlend * (state.mode === 'sitting' ? 0.62 : 0.3) * (1 - Math.abs(hopY) / 28);
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

        // 2. ARMS: Seated (2-Bone IK Braced on Box Edge) vs Flying (360° Opposite-Side Wind Stream)
        const sitHandLX = 104, sitHandLY = 183;
        const sitHandRX = 276, sitHandRY = 183;
        const ikL = solveIK2Bone(slx, sly, sitHandLX, sitHandLY, 41, 39, +1);
        const ikR = solveIK2Bone(srx, sry, sitHandRX, sitHandRY, 41, 39, -1);

        const flyArmL = computeFlyingLimb(slx, sly, -1, state.sVelX, state.sVelY, state.sLagX, state.sLagY, 38, 36, 0.0);
        const flyArmR = computeFlyingLimb(srx, sry, +1, state.sVelX, state.sVelY, state.sLagX, state.sLagY, 38, 36, 2.2);

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
            elx = lerp(flyArmL.midX, ikL.ex, state.sitBlend);
            ely = lerp(flyArmL.midY, ikL.ey, state.sitBlend);
            pxL = lerp(flyArmL.endX, sitHandLX, state.sitBlend);
            pyL = lerp(flyArmL.endY, sitHandLY, state.sitBlend);

            erx = lerp(flyArmR.midX, ikR.ex, state.sitBlend);
            ery = lerp(flyArmR.midY, ikR.ey, state.sitBlend);
            pxR = lerp(flyArmR.endX, sitHandRX, state.sitBlend);
            pyR = lerp(flyArmR.endY, sitHandRY, state.sitBlend);
        }

        setArmPose(armLOuter, armLInner, handL, slx, sly, elx, ely, pxL, pyL, handRx, handRy, lerp(flyArmL.tipRot, -6, state.sitBlend));
        setArmPose(armROuter, armRInner, handR, srx, sry, erx, ery, pxR, pyR, handRx, handRy, lerp(flyArmR.tipRot, 6, state.sitBlend));

        // 3. LEGS: Seated (Box-Edge Knees + 3D Depth Kick) vs Flying (360° Opposite-Side Wind Stream)
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

        const flyLegL = computeFlyingLimb(hlx, hly, -1, state.sVelX, state.sVelY, state.sLagX, state.sLagY, 34, 38, 1.1);
        const flyLegR = computeFlyingLimb(hrx, hry, +1, state.sVelX, state.sVelY, state.sLagX, state.sLagY, 34, 38, 3.6);

        const klx = lerp(flyLegL.midX, sitKneeLX, state.sitBlend);
        const kly = lerp(flyLegL.midY, sitKneeLY, state.sitBlend);
        const flx = lerp(flyLegL.endX, sitFootLX, state.sitBlend);
        const fly = lerp(flyLegL.endY, sitFootLY, state.sitBlend);

        const krx = lerp(flyLegR.midX, sitKneeRX, state.sitBlend);
        const kry = lerp(flyLegR.midY, sitKneeRY, state.sitBlend);
        const frx = lerp(flyLegR.endX, sitFootRX, state.sitBlend);
        const fry = lerp(flyLegR.endY, sitFootRY, state.sitBlend);

        const scaleL = lerp(0.98, 1.0 + kickPhaseL * 0.13, state.sitBlend);
        const scaleR = lerp(0.98, 1.0 + kickPhaseR * 0.13, state.sitBlend);
        const rotL = lerp(flyLegL.tipRot, -kickPhaseL * 14 - 4, state.sitBlend);
        const rotR = lerp(flyLegR.tipRot, kickPhaseR * 14 + 4, state.sitBlend);

        setLegPose(thighLOuter, thighLInner, shinLOuter, shinLInner, kneeL, shoeL, hlx, hly, klx, kly, flx, fly, scaleL, rotL);
        setLegPose(thighROuter, thighRInner, shinROuter, shinRInner, kneeR, shoeR, hrx, hry, krx, kry, frx, fry, scaleR, rotR);

        updateWindStreaks();
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
        state.currDocX = state.currViewX + window.scrollX;
        state.currDocY = state.currViewY + window.scrollY;
        wrap.style.transform = `translate3d(${state.currViewX.toFixed(1)}px, ${state.currViewY.toFixed(1)}px, 0)`;
    }

    function applyDocumentPosition(docX, docY) {
        const w = wrap.offsetWidth || 96;
        const docW = Math.max(document.documentElement.scrollWidth, window.innerWidth);
        const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
        state.anchorSpace = 'page';
        wrap.style.position = 'absolute';
        wrap.style.zIndex = '25';
        state.currDocX = clamp(docX, 4, Math.max(4, docW - w - 4));
        state.currDocY = clamp(docY, 4, Math.max(4, docH - 40));
        wrap.style.transform = `translate3d(${state.currDocX.toFixed(1)}px, ${state.currDocY.toFixed(1)}px, 0)`;
        state.currViewX = state.currDocX - window.scrollX;
        state.currViewY = state.currDocY - window.scrollY;
    }

    function flyToPosition(space, targetX, targetY, endMode = 'sitting', onArrive = null) {
        wrap.classList.remove('mascot-glide');
        if (space === 'fixed' && state.anchorSpace !== 'fixed') {
            applyViewportPosition(state.currViewX, state.currViewY);
        } else if (space === 'page' && state.anchorSpace !== 'page') {
            applyDocumentPosition(state.currViewX + window.scrollX, state.currViewY + window.scrollY);
        }
        state.autoFlight = { space, targetX, targetY, endMode, onArrive };
        state.mode = 'flying';
        ensureLoopRunning();
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

    function sitOnElementLedge(el, preferredCenterX, fly = true) {
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;

        const w = wrap.offsetWidth || 96;
        const seatOffset = getSeatOffsetY();
        const minCenter = rect.left + Math.min(48, rect.width * 0.25);
        const maxCenter = rect.right - Math.min(48, rect.width * 0.25);
        const centerX = preferredCenterX != null
            ? clamp(preferredCenterX, minCenter, maxCenter)
            : rect.left + rect.width * (0.74 + Math.random() * 0.12);

        state.dockedEl = el;
        state.dockedRelX = rect.width > 0 ? clamp((centerX - rect.left) / rect.width, 0.12, 0.88) : 0.78;

        const targetIsFixed = isInsideFixedContainer(el);
        const targetX = targetIsFixed ? (centerX - w / 2) : (centerX + window.scrollX - w / 2);
        const targetY = targetIsFixed ? (rect.top - seatOffset) : (rect.top + window.scrollY - seatOffset);

        if (fly) {
            flyToPosition(targetIsFixed ? 'fixed' : 'page', targetX, targetY, 'sitting');
        } else {
            state.autoFlight = null;
            if (targetIsFixed) applyViewportPosition(targetX, targetY);
            else applyDocumentPosition(targetX, targetY);
            state.mode = 'sitting';
        }
        return true;
    }

    function syncDockedOnResize() {
        if (state.isDragging || state.autoFlight || state.mode === 'inspecting' || !state.dockedEl) return;
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

    function perchOnRandomBox(fly = false) {
        const candidates = getVisibleLedges().filter(el => !isInsideFixedContainer(el));
        const pool = candidates.length > 0 ? candidates : getVisibleLedges();
        if (pool.length === 0) {
            applyDocumentPosition(window.innerWidth - 116, window.scrollY + 100);
            state.mode = 'sitting';
            return;
        }
        const chosen = pool[Math.floor(Math.random() * pool.length)];
        sitOnElementLedge(chosen, null, fly);
    }

    // =========================================================================
    // DRAG & DROP POINTER + TOUCH HANDLERS (Never Hijacked by Mobile Scroll)
    // =========================================================================
    svg.addEventListener('touchstart', (e) => {
        if (e.cancelable) e.preventDefault();
    }, { passive: false });

    wrap.addEventListener('pointerdown', (e) => {
        if (e.button != null && e.button !== 0 && e.pointerType === 'mouse') return;
        e.preventDefault();
        state.autoFlight = null;
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
        ensureLoopRunning();
    });

    wrap.addEventListener('pointermove', (e) => {
        if (!state.isDragging || e.pointerId !== state.activePointerId) return;

        const dx = e.clientX - state.startX;
        const dy = e.clientY - state.startY;
        const stepX = e.clientX - state.prevPointerX;
        const stepY = e.clientY - state.prevPointerY;
        state.prevPointerX = e.clientX;
        state.prevPointerY = e.clientY;

        if (!state.movedDuringDrag && Math.hypot(dx, dy) > 4) {
            state.movedDuringDrag = true;
            state.mode = 'flying';
        }

        if (state.movedDuringDrag) {
            state.velX = lerp(state.velX, clamp(stepX * 1.4, -32, 32), 0.72);
            state.velY = lerp(state.velY, clamp(stepY * 1.4, -32, 32), 0.72);
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
    // TERMINAL CODE-LINE TRAVERSAL & SCROLL REVIEW (With Opposite-Side Flight)
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

        state.inspectPointY = 132;
        state.targetLookX = bodyRect.left + 80;
        state.targetLookY = clampedLineY;
        state.eyeBoost = true;
        flyToPosition('page', bodyRect.right + window.scrollX - w - 6, clampedLineY + window.scrollY - 42, 'inspecting');
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
        } else {
            state.mode = 'sitting';
            state.hopEnergy = 1.0;
        }
    }

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

    window.addEventListener('scroll', () => {
        if (state.anchorSpace === 'page') {
            const rect = wrap.getBoundingClientRect();
            state.currViewX = rect.left;
            state.currViewY = rect.top;
        }
    }, { passive: true });

    setInterval(() => {
        if (document.hidden || state.isDragging || state.autoFlight || state.mode === 'inspecting' || wrap.classList.contains('hidden')) return;
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
