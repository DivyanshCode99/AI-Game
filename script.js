"use strict";

// ─── CONFIG ────────────────────────────────────────────────────────────────────
const DEFAULT_MODEL_URL = "https://teachablemachine.withgoogle.com/models/pchlNha2j/";
const MODEL_URL_KEY     = "poseRunnerModelURL";
const CONFIDENCE        = 0.6;

const CW = 400, CH = 600;
const LANE_X   = [100, 200, 300];
const GNDLINE  = 552;           // y of ground line (player feet)
const PLR_H    = 70;            // player height in pixels
const PLR_W    = 36;            // player width
const PLR_STND = GNDLINE - PLR_H; // player top-y when standing = 482

// timing in frames @ 60fps
const RAGE_DURATION  = 240;  // 4s
const RAGE_COOLDOWN  = 600;  // 10s
const INV_DURATION   = 90;   // 1.5s

// debounce in ms (wall clock)
const MOVE_DB = 600;
const JUMP_DB = 500;
const RAGE_DB = 500;

// ─── DOM ───────────────────────────────────────────────────────────────────────
const canvas   = document.getElementById("game");
const ctx      = canvas.getContext("2d");
const flashEl  = document.getElementById("hitFlash");

// ─── STATE ─────────────────────────────────────────────────────────────────────
let gs;

function makeState() {
  return {
    screen:   "start",   // "start" | "playing" | "gameover"
    tick:     0,

    lane:     1,         // 0=left, 1=center, 2=right
    playerY:  PLR_STND,  // top-y of player sprite
    isJumping: false,
    jumpVel:  0,

    lives:    3,
    score:    0,
    highScore: parseInt(localStorage.getItem("poseRunnerHigh") || "0"),

    speed:        2.7,
    baseSpeed:    2.7,
    spawnClock:   0,
    spawnInterval: 130,  // frames between spawns (shrinks as score rises)

    invincible: false,
    invTimer:   0,

    combo:    0,         // consecutive obstacles cleared without a hit

    rageActive:   false,
    rageTimer:    0,
    rageCooldown: 0,

    obstacles: [],
    particles: [],
    streaks:   [],       // background speed streaks

    lastMove: 0,
    lastJump: 0,
    lastRage: 0,
  };
}

function initStreaks() {
  gs.streaks = [];
  for (let i = 0; i < 20; i++) {
    gs.streaks.push({
      x:   Math.random() * CW,
      y:   Math.random() * CH,
      len: 12 + Math.random() * 28,
      spd: 3 + Math.random() * 3,
    });
  }
}

// ─── MODEL URL HELPERS (preserved) ────────────────────────────────────────────
let currentModelURL = getInitialModelURL();
let model, webcam, modelReady = false;

function normalizeModelURL(url) {
  const v = (url || "").trim();
  if (!v) return DEFAULT_MODEL_URL;
  return v.endsWith("/") ? v : v + "/";
}

function getInitialModelURL() {
  const p = new URLSearchParams(window.location.search);
  return normalizeModelURL(
    p.get("model") || localStorage.getItem(MODEL_URL_KEY) || DEFAULT_MODEL_URL
  );
}

function setupModelControls() {
  const input = document.getElementById("modelUrlInput");
  const btn   = document.getElementById("loadModelBtn");
  input.value = currentModelURL;
  const go = () => {
    currentModelURL = normalizeModelURL(input.value);
    localStorage.setItem(MODEL_URL_KEY, currentModelURL);
    location.reload();
  };
  btn.addEventListener("click", go);
  input.addEventListener("keydown", e => { if (e.key === "Enter") go(); });
}

// ─── POSE CLASS → ACTION ───────────────────────────────────────────────────────
function mapAction(name) {
  const n = String(name || "").toLowerCase().replace(/[^a-z0-9 ]+/g, " ").trim();
  if (/\bleft\b/.test(n))                        return "left";
  if (/\bright\b/.test(n))                       return "right";
  if (/\b(jump|arms?\s*up|up)\b/.test(n))        return "jump";
  if (/\b(cross|rage)/.test(n))  return "rage";   // no trailing \b — matches "crossed"
  return "idle";
}

// ─── PREDICTION DISPLAY (preserved) ───────────────────────────────────────────
function updatePredictionDisplay(preds, best, msg) {
  const label = document.getElementById("predictionLabel");
  const bars  = document.getElementById("predictionBars");
  const hint  = document.getElementById("detectionHint");

  if (!best) {
    label.innerText = "Detection: —";
    bars.innerHTML  = "";
    hint.innerText  = msg || "No pose detected.";
    return;
  }

  const pct    = Math.round(best.probability * 100);
  const action = mapAction(best.className);
  label.innerText = `${best.className} (${pct}%)`;
  hint.innerText  = best.probability < CONFIDENCE
    ? `Below ${Math.round(CONFIDENCE * 100)}% threshold.`
    : `→ ${action.toUpperCase()}`;

  bars.innerHTML = "";
  preds.forEach(p => {
    const w = Math.max(0, Math.min(100, Math.round(p.probability * 100)));
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `
      <div class="bar-name" title="${p.className}">${p.className}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${w}%"></div></div>
      <div>${w}%</div>`;
    bars.appendChild(row);
  });
}

// ─── INIT (preserved structure) ────────────────────────────────────────────────
async function init() {
  setupModelControls();
  updatePredictionDisplay([], null, "Loading model…");
  gs = makeState();
  initStreaks();

  try {
    if (typeof tmPose === "undefined") throw new Error("TM pose library not loaded.");
    model  = await tmPose.load(currentModelURL + "model.json", currentModelURL + "metadata.json");
    webcam = new tmPose.Webcam(320, 320, true);
    await webcam.setup();
    await webcam.play();
    document.getElementById("webcamContainer").appendChild(webcam.canvas);
    updatePredictionDisplay([], null, "Camera running. Step into frame.");
    modelReady = true;
  } catch (err) {
    console.error(err);
    updatePredictionDisplay([], null, err.message || "Failed to load model.");
  }

  // Button: START → enter "ready" state (player can now trigger game via pose)
  document.getElementById("startBtn").addEventListener("click", () => {
    if (modelReady) gs.screen = "ready";
  });

  // Button: PLAY AGAIN → back to start screen
  document.getElementById("playAgainBtn").addEventListener("click", () => {
    gs = makeState();
    initStreaks();
    gs.screen = "start";
  });

  requestAnimationFrame(renderLoop);
  poseLoop();
}

// ─── POSE LOOP — decoupled from render (~12 fps) ───────────────────────────────
async function poseLoop() {
  while (true) {
    if (model && webcam && webcam.canvas) {
      try {
        const pose = await model.estimatePose(webcam.canvas);
        if (pose && pose.posenetOutput) {
          const preds = await model.predict(pose.posenetOutput);
          if (Array.isArray(preds) && preds.length) {
            let best = preds[0];
            for (let i = 1; i < preds.length; i++) {
              if (preds[i].probability > best.probability) best = preds[i];
            }
            updatePredictionDisplay(preds, best);
            if (best.probability >= CONFIDENCE) {
              handleAction(mapAction(best.className));
            }
          }
        } else {
          updatePredictionDisplay([], null, "No pose in frame.");
        }
      } catch (err) {
        console.error("Pose error:", err);
      }
    }
    await new Promise(r => setTimeout(r, 82));
  }
}

// ─── ACTION HANDLER ────────────────────────────────────────────────────────────
function handleAction(action) {
  // Poses are completely ignored on start and gameover — only button clicks drive those
  if (gs.screen === "start" || gs.screen === "gameover") return;

  // "ready": player clicked START, now waiting for any pose to kick off spawning
  if (gs.screen === "ready") {
    if (action !== "idle") gs.screen = "playing";
    return;
  }

  const now = Date.now();

  if (action === "left" && now - gs.lastMove > MOVE_DB) {
    gs.lastMove = now;                  // always reset, even at lane edge
    if (gs.lane > 0) gs.lane--;
  } else if (action === "right" && now - gs.lastMove > MOVE_DB) {
    gs.lastMove = now;
    if (gs.lane < 2) gs.lane++;
  } else if (action === "jump" && !gs.isJumping && now - gs.lastJump > JUMP_DB) {
    gs.isJumping = true;
    gs.jumpVel   = -20;
    gs.lastJump  = now;
  } else if (action === "rage" && !gs.rageActive && gs.rageCooldown <= 0 && now - gs.lastRage > RAGE_DB) {
    gs.rageActive = true;
    gs.rageTimer  = RAGE_DURATION;
    gs.lastRage   = now;
  }
}

// keyboard fallback for dev testing
window.addEventListener("keydown", e => {
  const map = { ArrowLeft:"left", ArrowRight:"right", ArrowUp:"jump", Space:"jump", KeyR:"rage" };
  const a = map[e.code];
  if (a) { e.preventDefault(); handleAction(a); }
});

// ─── SPAWN ─────────────────────────────────────────────────────────────────────
function spawnObstacle() {
  // don't pile up at the top
  if (gs.obstacles.some(o => !o.passed && o.y < 90)) return;

  const type = Math.random() > 0.42 ? "boulder" : "laser";
  gs.obstacles.push({
    type,
    lane: Math.floor(Math.random() * 3), // laser: lane unused for collision, used for visual position
    y: -70,
    passed:    false,
    destroyed: false,
  });
}

// ─── PARTICLES ─────────────────────────────────────────────────────────────────
function spawnParticles(x, y, color) {
  for (let i = 0; i < 14; i++) {
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
    const spd   = 2.5 + Math.random() * 4;
    gs.particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd - 2,
      life: 36, maxLife: 36,
      color,
      r: 2.2 + Math.random() * 3,
    });
  }
}

// ─── COLLISION ─────────────────────────────────────────────────────────────────
function checkCollision(o) {
  if (o.type === "boulder") {
    // Dodge by lane-switching only. Boulders are ground-level — jumping doesn't help.
    if (o.lane !== gs.lane) return false;
    // Dangerous when boulder body overlaps the player's vertical zone
    const bTop = o.y, bBot = o.y + 44;
    return bBot > PLR_STND && bTop < GNDLINE;
  }

  if (o.type === "laser") {
    // Dodge by jumping — any active jump clears it
    if (gs.isJumping) return false;
    // Laser beam visual starts at o.y + 22
    const beamTop = o.y + 22, beamBot = beamTop + 16;
    const pBot = gs.playerY + PLR_H;
    return pBot > beamTop && gs.playerY < beamBot;
  }

  return false;
}

// ─── HIT FLASH ─────────────────────────────────────────────────────────────────
function triggerFlash() {
  flashEl.style.opacity = "1";
  setTimeout(() => { flashEl.style.opacity = "0"; }, 130);
}

// ─── UPDATE ────────────────────────────────────────────────────────────────────
function update() {
  gs.tick++;

  // Streaks move at all times (ambient motion on non-playing screens too)
  const streakSpd = gs.screen === "playing" ? (gs.rageActive ? 2.4 : 1) : 0.4;
  gs.streaks.forEach(s => {
    s.y += s.spd * streakSpd;
    if (s.y > CH) { s.y = -s.len; s.x = Math.random() * CW; }
  });

  if (gs.screen !== "playing") return;

  const effSpeed = gs.rageActive ? gs.speed * 2 : gs.speed;

  // Rage timer
  if (gs.rageActive) {
    gs.rageTimer--;
    if (gs.rageTimer <= 0) {
      gs.rageActive   = false;
      gs.rageCooldown = RAGE_COOLDOWN;
    }
  }
  if (gs.rageCooldown > 0) gs.rageCooldown--;

  // Invincibility
  if (gs.invincible && --gs.invTimer <= 0) gs.invincible = false;

  // Jump physics
  if (gs.isJumping) {
    gs.playerY += gs.jumpVel;
    gs.jumpVel  += 0.88;
    if (gs.playerY >= PLR_STND) {
      gs.playerY  = PLR_STND;
      gs.isJumping = false;
      gs.jumpVel  = 0;
    }
  }

  // Spawn
  if (++gs.spawnClock >= gs.spawnInterval) {
    spawnObstacle();
    gs.spawnClock = 0;
  }

  // Obstacles
  for (let i = gs.obstacles.length - 1; i >= 0; i--) {
    const o = gs.obstacles[i];
    if (o.destroyed) { gs.obstacles.splice(i, 1); continue; }

    o.y += effSpeed;

    // Passed the player safely
    if (!o.passed && o.y > GNDLINE + 5) {
      o.passed = true;
      gs.combo++;
      const pts = (gs.combo > 5 ? 2 : 1) * (gs.rageActive ? 2 : 1);
      gs.score += pts;
      // Speed up every 15 points
      const lvl = Math.floor(gs.score / 15);
      gs.speed         = gs.baseSpeed + lvl * 0.45;
      gs.spawnInterval = Math.max(45, 130 - lvl * 5);
    }

    if (o.y > CH + 120) { gs.obstacles.splice(i, 1); continue; }

    // Collision check
    if (!o.passed && !gs.invincible && checkCollision(o)) {
      if (gs.rageActive) {
        // Rage destroys the obstacle — particles + bonus point
        const cx = o.type === "laser" ? LANE_X[gs.lane] : LANE_X[o.lane];
        spawnParticles(cx, o.y + 22, o.type === "boulder" ? "#ff5500" : "#0099ff");
        o.destroyed = true;
        gs.combo++;
        gs.score += (gs.combo > 5 ? 2 : 1) * 2;
      } else {
        gs.lives--;
        gs.combo      = 0;
        gs.invincible = true;
        gs.invTimer   = INV_DURATION;
        triggerFlash();
        gs.obstacles.splice(i, 1);
        if (gs.lives <= 0) {
          gs.screen    = "gameover";
          gs.highScore = Math.max(gs.score, gs.highScore);
          localStorage.setItem("poseRunnerHigh", gs.highScore);
        }
      }
    }
  }

  // Particles
  for (let i = gs.particles.length - 1; i >= 0; i--) {
    const p = gs.particles[i];
    p.x += p.vx; p.y += p.vy; p.vy += 0.22;
    if (--p.life <= 0) gs.particles.splice(i, 1);
  }
}

// ─── DRAW HELPERS ──────────────────────────────────────────────────────────────
function glow(color, blur)  { ctx.shadowColor = color; ctx.shadowBlur = blur; }
function noGlow()           { ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; }

// ─── BACKGROUND ────────────────────────────────────────────────────────────────
function drawBg() {
  ctx.fillStyle = "#06061a";
  ctx.fillRect(0, 0, CW, CH);

  // Scanlines
  ctx.fillStyle = "rgba(0,0,40,0.22)";
  for (let y = 0; y < CH; y += 4) ctx.fillRect(0, y, CW, 2);

  // Speed streaks
  ctx.strokeStyle = "rgba(0,200,255,0.07)";
  ctx.lineWidth = 1;
  gs.streaks.forEach(s => {
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x, s.y + s.len);
    ctx.stroke();
  });
}

// ─── LANE LINES ────────────────────────────────────────────────────────────────
function drawLanes() {
  // Ground line
  glow("#00eeff", 12);
  ctx.strokeStyle = "rgba(0,238,255,0.6)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GNDLINE); ctx.lineTo(CW, GNDLINE);
  ctx.stroke();
  noGlow();

  // Dashed lane dividers
  ctx.setLineDash([16, 14]);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(0,238,255,0.15)";
  [150, 250].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(x, 72); ctx.lineTo(x, GNDLINE);
    ctx.stroke();
  });
  ctx.setLineDash([]);
}

// ─── BOULDER ───────────────────────────────────────────────────────────────────
function drawBoulder(o) {
  const cx = LANE_X[o.lane], y = o.y;
  ctx.save();
  glow("#ff5500", 22);

  // Dark base rock
  ctx.fillStyle = "#7a2200";
  ctx.beginPath();
  ctx.moveTo(cx - 15, y + 44);
  ctx.lineTo(cx - 22, y + 26);
  ctx.lineTo(cx - 14, y + 4);
  ctx.lineTo(cx + 8,  y);
  ctx.lineTo(cx + 22, y + 18);
  ctx.lineTo(cx + 16, y + 44);
  ctx.closePath();
  ctx.fill();

  // Mid tone
  ctx.fillStyle = "#bb3300";
  ctx.beginPath();
  ctx.moveTo(cx - 10, y + 38);
  ctx.lineTo(cx - 16, y + 22);
  ctx.lineTo(cx - 6,  y + 8);
  ctx.lineTo(cx + 10, y + 5);
  ctx.lineTo(cx + 18, y + 20);
  ctx.lineTo(cx + 12, y + 38);
  ctx.closePath();
  ctx.fill();

  // Bright highlight
  glow("#ff6600", 14);
  ctx.fillStyle = "#ff5500";
  ctx.beginPath();
  ctx.moveTo(cx - 4, y + 14);
  ctx.lineTo(cx + 8, y + 10);
  ctx.lineTo(cx + 14, y + 22);
  ctx.lineTo(cx + 4, y + 26);
  ctx.lineTo(cx - 6, y + 20);
  ctx.closePath();
  ctx.fill();

  noGlow();
  ctx.restore();
}

// ─── LASER BEAM ────────────────────────────────────────────────────────────────
function drawLaser(o) {
  const beamY = o.y + 22, beamH = 16;
  ctx.save();

  // Wide outer glow
  glow("#0044ff", 28);
  ctx.fillStyle = "rgba(0, 80, 255, 0.18)";
  ctx.fillRect(0, beamY - 12, CW, beamH + 24);

  // Main beam
  glow("#0077ff", 16);
  ctx.fillStyle = "#0066ff";
  ctx.fillRect(0, beamY, CW, beamH);

  // Inner bright core
  noGlow();
  ctx.fillStyle = "#88ccff";
  ctx.fillRect(0, beamY + 3, CW, beamH - 6);

  // White center line
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(0, beamY + 6, CW, beamH - 12);

  // Edge emitter nodes
  glow("#00aaff", 18);
  ctx.fillStyle = "#00ddff";
  [[-4, 8], [CW - 4, 8]].forEach(([x, w]) => {
    ctx.fillRect(x, beamY - 5, w, beamH + 10);
  });

  noGlow();
  ctx.restore();
}

// ─── PLAYER CHARACTER (front-facing) ──────────────────────────────────────────
function drawPlayer() {
  const cx   = LANE_X[gs.lane];
  const py   = gs.playerY;
  const rage = gs.rageActive;

  // Blink during invincibility
  if (gs.invincible && Math.floor(gs.tick / 5) % 2 === 0) return;

  const bodyCol = rage ? "#ff00ee" : "#00ffaa";
  const eyeCol  = rage ? "#ff2222" : "#00ffff";

  ctx.save();
  glow(bodyCol, rage ? 30 : 16);

  // ── Legs ──
  const legKick = gs.isJumping ? Math.sin(gs.tick * 0.4) * 6 : 0;
  ctx.strokeStyle = bodyCol;
  ctx.lineWidth   = 5;
  ctx.lineCap     = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 7, py + PLR_H - 22);
  ctx.lineTo(cx - 10 + legKick, py + PLR_H);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 7, py + PLR_H - 22);
  ctx.lineTo(cx + 10 - legKick, py + PLR_H);
  ctx.stroke();

  // ── Body ──
  ctx.fillStyle = bodyCol;
  ctx.fillRect(cx - 12, py + 22, 24, 26);

  // ── Arms ──
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(cx - 12, py + 28);
  ctx.lineTo(cx - 25, py + 40);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx + 12, py + 28);
  ctx.lineTo(cx + 25, py + 40);
  ctx.stroke();

  // ── Head ──
  ctx.fillStyle = bodyCol;
  ctx.beginPath();
  ctx.arc(cx, py + 12, 12, 0, Math.PI * 2);
  ctx.fill();

  // ── Eyes ──
  ctx.shadowBlur = 0;
  ctx.fillStyle  = "#001a1a";
  ctx.beginPath();
  ctx.arc(cx - 4.5, py + 11, 3.2, 0, Math.PI * 2);
  ctx.arc(cx + 4.5, py + 11, 3.2, 0, Math.PI * 2);
  ctx.fill();
  glow(eyeCol, 8);
  ctx.fillStyle = eyeCol;
  ctx.beginPath();
  ctx.arc(cx - 4.5, py + 11, 1.5, 0, Math.PI * 2);
  ctx.arc(cx + 4.5, py + 11, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // ── Rage extra outline ──
  if (rage) {
    glow("#ff00ff", 32);
    ctx.strokeStyle = "#ff44ff";
    ctx.lineWidth   = 2.5;
    ctx.beginPath(); ctx.arc(cx, py + 12, 17, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.rect(cx - 16, py + 18, 32, 34); ctx.stroke();
  }

  // ── Jump trail ──
  if (gs.isJumping) {
    noGlow();
    ctx.globalAlpha = 0.35;
    ctx.fillStyle   = bodyCol;
    ctx.fillRect(cx - 8, py + PLR_H, 16, 6);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

// ─── PARTICLES ─────────────────────────────────────────────────────────────────
function drawParticles() {
  gs.particles.forEach(p => {
    const a = p.life / p.maxLife;
    ctx.save();
    ctx.globalAlpha = a;
    glow(p.color, 10);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (0.4 + a * 0.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  noGlow();
}

// ─── HUD (drawn on canvas) ─────────────────────────────────────────────────────
function drawHUD() {
  ctx.save();
  ctx.textBaseline = "top";

  // ── Score (top center) ──
  ctx.textAlign = "center";
  glow("#ffff00", 14);
  ctx.fillStyle = "#ffee00";
  ctx.font      = "bold 26px 'Courier New', monospace";
  ctx.fillText(gs.score, CW / 2, 10);
  noGlow();

  // ── Lives (top left) ──
  for (let i = 0; i < 3; i++) {
    const alive = i < gs.lives;
    if (alive) glow("#ff2255", 10);
    ctx.fillStyle = alive ? "#ff2255" : "rgba(255,34,85,0.15)";
    ctx.font      = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("♥", 10 + i * 28, 11);
    noGlow();
  }

  // ── Combo (top right, appears at combo >= 2) ──
  if (gs.combo >= 2) {
    const isDouble = gs.combo > 5;
    const comboColor = isDouble ? "#dd00ff" : "#ff8800";
    glow(comboColor, 14);
    ctx.fillStyle = comboColor;
    ctx.textAlign = "right";
    const sz = Math.min(10 + gs.combo * 0.6, 17);
    ctx.font  = `bold ${sz}px 'Courier New', monospace`;
    const label = isDouble ? `×2 COMBO [${gs.combo}]` : `COMBO [${gs.combo}]`;
    ctx.fillText(label, CW - 8, 12);
    noGlow();
  }

  // ── Rage indicator (below score) ──
  ctx.textAlign = "center";
  ctx.font      = "11px 'Courier New', monospace";

  if (gs.rageActive) {
    const pulse = 0.65 + 0.35 * Math.sin(gs.tick * 0.28);
    glow("#ff00ff", 24 * pulse);
    ctx.fillStyle = `rgba(255, 0, 255, ${0.85 + 0.15 * pulse})`;
    ctx.font      = `bold 13px 'Courier New', monospace`;
    ctx.fillText("⚡ RAGE ACTIVE ⚡", CW / 2, 44);
    noGlow();
    // Progress bar (shrinks as rage time runs out)
    const prog = gs.rageTimer / RAGE_DURATION;
    ctx.fillStyle = "rgba(255,0,255,0.18)";
    ctx.fillRect(CW / 2 - 58, 62, 116, 5);
    glow("#ff00ff", 6);
    ctx.fillStyle = "#ff00ff";
    ctx.fillRect(CW / 2 - 58, 62, 116 * prog, 5);
    noGlow();
  } else if (gs.rageCooldown > 0) {
    const secs = (gs.rageCooldown / 60).toFixed(1);
    ctx.fillStyle = "rgba(160, 0, 160, 0.6)";
    ctx.fillText(`RAGE COOLDOWN  ${secs}s`, CW / 2, 44);
    // Cooldown refill bar (grows as cooldown drains)
    const prog = 1 - gs.rageCooldown / RAGE_COOLDOWN;
    ctx.fillStyle = "rgba(80, 0, 80, 0.35)";
    ctx.fillRect(CW / 2 - 48, 59, 96, 4);
    ctx.fillStyle = "rgba(180, 0, 180, 0.7)";
    ctx.fillRect(CW / 2 - 48, 59, 96 * prog, 4);
  } else {
    ctx.fillStyle = "rgba(130, 0, 130, 0.4)";
    ctx.fillText("CROSS ARMS = RAGE", CW / 2, 44);
  }

  ctx.restore();
}

// ─── START SCREEN ──────────────────────────────────────────────────────────────
function drawStartScreen() {
  ctx.fillStyle = "rgba(6, 6, 26, 0.88)";
  ctx.fillRect(0, 0, CW, CH);

  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign    = "center";

  // Title
  glow("#00eeff", 35);
  ctx.fillStyle = "#00eeff";
  ctx.font      = "bold 60px 'Courier New', monospace";
  ctx.fillText("POSE", CW / 2, 170);
  glow("#ff00ff", 35);
  ctx.fillStyle = "#ff00ff";
  ctx.fillText("RUNNER", CW / 2, 236);
  noGlow();

  // Model status line
  const sub = modelReady ? "webcam ready — click START" : "Loading model…";
  ctx.fillStyle = modelReady ? "rgba(0,255,170,0.6)" : "rgba(255,200,0,0.6)";
  ctx.font      = "12px 'Courier New', monospace";
  ctx.fillText(sub, CW / 2, 288);

  // Controls table
  ctx.fillStyle = "rgba(0,238,255,0.28)";
  ctx.font      = "bold 9px 'Courier New', monospace";
  ctx.fillText("H O W   T O   P L A Y", CW / 2, 332);

  const controls = [
    ["LEFT ARM OUT",  "→  move left"],
    ["RIGHT ARM OUT", "→  move right"],
    ["ARMS UP",       "→  jump"],
    ["ARMS CROSSED",  "→  RAGE MODE"],
  ];
  controls.forEach(([pose, act], i) => {
    ctx.font      = "11px 'Courier New', monospace";
    ctx.textAlign = "right";
    ctx.fillStyle = "rgba(0,255,200,0.55)";
    ctx.fillText(pose, CW / 2 - 10, 360 + i * 26);
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(255,255,255,0.38)";
    ctx.fillText(act, CW / 2 + 10, 360 + i * 26);
  });

  if (gs.highScore > 0) {
    ctx.textAlign = "center";
    ctx.fillStyle = "rgba(255,220,0,0.45)";
    ctx.font      = "12px 'Courier New', monospace";
    ctx.fillText(`BEST: ${gs.highScore}`, CW / 2, 480);
  }

  ctx.restore();
}

// ─── GAME OVER SCREEN ──────────────────────────────────────────────────────────
function drawGameOver() {
  ctx.fillStyle = "rgba(6, 6, 26, 0.94)";
  ctx.fillRect(0, 0, CW, CH);

  ctx.save();
  ctx.textBaseline = "middle";
  ctx.textAlign    = "center";

  glow("#ff2255", 38);
  ctx.fillStyle = "#ff2255";
  ctx.font      = "bold 50px 'Courier New', monospace";
  ctx.fillText("GAME OVER", CW / 2, 180);
  noGlow();

  ctx.fillStyle = "#ffee00";
  ctx.font      = "bold 30px 'Courier New', monospace";
  ctx.fillText(`SCORE: ${gs.score}`, CW / 2, 252);

  ctx.fillStyle = "rgba(255,238,0,0.45)";
  ctx.font      = "16px 'Courier New', monospace";
  ctx.fillText(`BEST: ${gs.highScore}`, CW / 2, 292);

  // "play again" is handled by the DOM button — nothing extra needed here

  ctx.restore();
}

// ─── READY STATE ───────────────────────────────────────────────────────────────
function drawReady() {
  drawLanes();
  drawPlayer();

  // Pulsing prompt
  ctx.save();
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  const pulse = 0.55 + 0.45 * Math.sin(gs.tick * 0.08);
  glow("#00eeff", 18 * pulse);
  ctx.fillStyle = `rgba(0, 238, 255, ${0.65 + 0.35 * pulse})`;
  ctx.font = "bold 17px 'Courier New', monospace";
  ctx.fillText("STRIKE ANY POSE TO BEGIN", CW / 2, CH / 2 - 50);
  noGlow();
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font = "11px 'Courier New', monospace";
  ctx.fillText("step fully into camera frame first", CW / 2, CH / 2 - 24);
  ctx.restore();
}

// ─── MAIN DRAW ─────────────────────────────────────────────────────────────────
function draw() {
  drawBg();

  if (gs.screen === "start") {
    drawStartScreen();
    return;
  }

  if (gs.screen === "ready") {
    drawReady();
    return;
  }

  drawLanes();

  gs.obstacles.forEach(o => {
    if (!o.destroyed) {
      if (o.type === "boulder") drawBoulder(o);
      else                      drawLaser(o);
    }
  });

  drawParticles();
  drawPlayer();
  drawHUD();

  if (gs.screen === "gameover") drawGameOver();
}

// ─── BUTTON VISIBILITY ─────────────────────────────────────────────────────────
const startBtn     = document.getElementById("startBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

function syncButtons() {
  startBtn.style.display     = gs.screen === "start"    ? "block" : "none";
  playAgainBtn.style.display  = gs.screen === "gameover" ? "block" : "none";
}

// ─── RENDER LOOP ───────────────────────────────────────────────────────────────
function renderLoop() {
  if (webcam && webcam.canvas) webcam.update();
  update();
  draw();
  syncButtons();
  requestAnimationFrame(renderLoop);
}

// ─── GO ────────────────────────────────────────────────────────────────────────
init();