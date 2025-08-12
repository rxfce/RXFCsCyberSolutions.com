// ========= Config =========
const GITHUB_USER = "rxfce";
const REPO_LIMIT = 6;
const REPO_EXCLUDE_FORKS = true;

// RNG range (inclusive)
const RNG_MIN = 0;
const RNG_MAX = 999;

// Crisp chat site ID (optional)
const CRISP_WEBSITE_ID = "3557aaf9-12c9-44d9-8584-27b2dfdbc830";

// Maximum number of character replacements allowed in leetify
const maxLetterChanges = 5;

// ========= Helpers =========
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

// ========= App init =========
document.addEventListener("DOMContentLoaded", () => {
  // Year stamp
  const yearElement = $("#year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}

  // Mobile nav toggle
  const toggle = $(".nav-toggle");
  const nav = $("#site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    // Close nav when clicking a link (mobile)
    nav.addEventListener("click", (e) => {
      const link = e.target.closest("a");
      if (!link) return;
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  }

  // Smooth in-page navigation with focus handoff
  $$("#site-nav a, .top-link, .cta-row a").forEach(a => {
    if (a.hash && a.hash.startsWith("#")) {
      a.addEventListener("click", e => {
        const target = document.querySelector(a.hash);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          target.setAttribute("tabindex", "-1");
          target.focus({ preventScroll: true });
        }, 400);
      });
    }
  });

  // Header shadow on scroll
  const header = $(".site-header");
  const shadower = () => {
    const s = window.scrollY;
    header && header.style.setProperty("box-shadow", s > 8 ? "0 10px 24px -20px rgba(0,0,0,.8)" : "none");
  };
  shadower();
  window.addEventListener("scroll", shadower, { passive: true });

  // Reveal animations
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("reveal-visible");
        io.unobserve(e.target);
      }
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => io.observe(el));

  // Magnetic buttons
  initMagnetics();

  // RNG
  initRng();

  // GitHub loader
  if (GITHUB_USER) {
    loadRepos(GITHUB_USER).catch(err => {
      console.error(err);
      setRepoStatus("Could not load repositories. Try again later.");
    });
  } else {
    setRepoStatus("Set your GitHub username in script.js to load projects.");
  }

  // Crisp chat
  initCrisp();

  // Dynamic background on scroll (rAF)
  initScrollBackground();
});

// ========= Magnetic buttons =========
function initMagnetics() {
  const strength = 22; // max px movement
  const radius = 120;  // hover influence in px

  $$(".magnet-wrap").forEach(wrap => {
    const btn = $("[data-magnet]", wrap);
    if (!btn) return;

    const onMove = (e) => {
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        btn.style.transform = "translate3d(0,0,0)";
        return;
      }
      const mag = (1 - dist / radius);
      const tx = clamp(dx * mag, -strength, strength);
      const ty = clamp(dy * mag, -strength, strength);
      btn.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    };

    const reset = () => { btn.style.transform = "translate3d(0,0,0)"; };

    wrap.addEventListener("mousemove", onMove);
    wrap.addEventListener("mouseleave", reset);
    wrap.addEventListener("touchend", reset, { passive: true });
  });
}

// ========= RNG =========
function initRng() {
  const out = $("#rng-value");
  const spinBtn = $("#rng-spin");
  const copyBtn = $("#rng-copy");
  const note = $("#rng-note");

  if (!out || !spinBtn || !copyBtn) return;

  // Validate range
  const min = Number.isFinite(RNG_MIN) ? RNG_MIN : 0;
  const max = Number.isFinite(RNG_MAX) ? RNG_MAX : 999;
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);

  if (note) note.textContent = `Default range ${lo}–${hi}. Customize in script.js.`;

  let spinning = false;
  let raf = 0;
  let startTime = 0;
  const duration = 1500; // ms

  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
  const randInRange = () => Math.floor(lo + Math.random() * (hi - lo + 1));

  function format(n) {
    const width = String(hi).length;
    return String(n).padStart(width, "0");
  }

  function animate() {
    const now = performance.now();
    const t = clamp((now - startTime) / duration, 0, 1);
    const current = randInRange();
    out.textContent = format(current);

    if (t < 1) {
      raf = requestAnimationFrame(animate);
    } else {
      const final = randInRange();
      out.textContent = format(final);
      spinning = false;
      out.classList.remove("pulse");
    }
  }

  spinBtn.addEventListener("click", () => {
    if (spinning) return;
    spinning = true;
    out.classList.add("pulse");
    startTime = performance.now();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(animate);
  });

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(out.textContent.trim());
      toast("Copied!");
    } catch {
      // Fallback for older browsers
      const tmp = document.createElement("textarea");
      tmp.value = out.textContent.trim();
      document.body.appendChild(tmp);
      tmp.select();
      try {
        document.execCommand("copy");
        toast("Copied!");
      } catch {
        toast("Copy failed");
      }
      tmp.remove();
    }
  });

  // Username generator wiring
  initUsernameTool();
}

// ========= Username tool =========
function initUsernameTool() {
  const input = $("#username-input");
  const genBtn = $("#generate-username");
  const copyBtn = $("#copy-username");
  const clearBtn = $("#clear-username");
  const outWrap = $("#generated-username-container");
  const out = $("#generated-username");

  if (!input || !genBtn || !copyBtn || !clearBtn || !outWrap || !out) return;

  function sanitizeBase(s) {
    return s.toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._-]/g, "")
      .replace(/^[._-]+|[._-]+$/g, "")
      .slice(0, 20);
  }

  async function mapToRussian(input) {
    const russianMappings = await loadMappings();
    return input.split('').map(char => russianMappings[char] || char).join('');
  }

  async function loadMappings() {
    const response = await fetch('RtE.csv');
    const text = await response.text();
    const lines = text.split('\n').slice(1); // Skip header
    const mappings = {};
    for (const line of lines) {
      const [english, russian] = line.split(',');
      if (english && russian) {
        mappings[english.trim()] = russian.trim();
      }
    }
    return mappings;
  }

  const adjectives = ["stealth", "quantum", "crimson", "arctic", "neon", "silent", "cyber", "lunar"];
  const nouns = ["raven", "nova", "byte", "shadow", "flux", "cipher", "echo", "matrix"];

  function randomUsername(base) {
    const b = sanitizeBase(base);
    const seed = b || `${adjectives[rand(adjectives.length)]}${nouns[rand(nouns.length)]}`;
    const parts = [
      seed,
      rand(2) ? leetify(seed) : seed,
      rand(2) ? `${seed}${rand(9999).toString().padStart(2, "0")}` : seed,
      rand(2) ? `${seed}_${rand(999)}` : seed,
      rand(2) ? `${seed}.${rand(99)}` : seed
    ];
    let pick = parts[rand(parts.length)];
    pick = pick.replace(/[_.-]{2,}/g, ".").slice(0, 24);
    return pick;
  }

  function rand(n) { return Math.floor(Math.random() * n); }

  async function generate() {
    const candidate = await mapToRussian(input.value);
    const containsRussian = /[а-яА-Я]/.test(candidate); // Check for Russian characters

    if (!containsRussian) {
      out.textContent = "Error: No Russian characters found in the generated username.";
      outWrap.hidden = false;
      return;
    }

    out.textContent = candidate;
    outWrap.hidden = false;
  }

  function copy() {
    const text = out.textContent.trim();
    if (!text) return;
    navigator.clipboard.writeText(text).then(
      () => toast("Username copied!"),
      () => toast("Copy failed")
    );
  }

  function clearAll() {
    input.value = "";
    out.textContent = "";
    outWrap.hidden = true;
    input.focus();
  }

  genBtn.addEventListener("click", generate);
  copyBtn.addEventListener("click", copy);
  clearBtn.addEventListener("click", clearAll);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      generate();
    }
  });
}

// ========= GitHub repos =========
async function loadRepos(user) {
  setRepoStatus("Loading projects…");
  const grid = $("#repo-grid");
  if (!grid) return;

  const url = new URL(`https://api.github.com/users/${encodeURIComponent(user)}/repos`);
  url.searchParams.set("sort", "updated");
  url.searchParams.set("per_page", String(REPO_LIMIT * 2)); // fetch extra to filter forks

  let repos = [];
  try {
    const res = await fetch(url.toString(), {
      headers: { "Accept": "application/vnd.github+json" }
    });
    if (!res.ok) throw new Error("GitHub API error");
    repos = await res.json();
  } catch (e) {
    console.error(e);
    setRepoStatus("GitHub API error. You may be rate limited.");
    return;
  }

  if (REPO_EXCLUDE_FORKS) repos = repos.filter(r => !r.fork);

  repos = repos
    .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
    .slice(0, REPO_LIMIT);

  grid.innerHTML = "";
  if (repos.length === 0) {
    setRepoStatus("No repositories to display.");
    return;
  }

  for (const r of repos) {
    const el = document.createElement("article");
    el.className = "repo-card";
    el.setAttribute("role", "listitem");
    el.innerHTML = `
      <a class="repo-title repo-link" href="${r.html_url}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.name)}</a>
      ${r.description ? `<p class="repo-desc">${escapeHtml(r.description)}</p>` : ""}
      <div class="repo-meta">
        <span>${r.language ? `● ${escapeHtml(r.language)}` : "●"}</span>
        <span>⭐ ${r.stargazers_count}</span>
        <span>Updated ${formatDate(r.pushed_at)}</span>
      </div>
    `;
    grid.appendChild(el);
  }
  setRepoStatus("");
}

function setRepoStatus(msg) {
  const status = $("#repo-status");
  const grid = $("#repo-grid");
  if (status) status.textContent = msg || "";
  if (grid) grid.setAttribute("aria-busy", msg ? "true" : "false");
}

// ========= Crisp =========
function initCrisp() {
  const status = $("#chat-status");
  if (!CRISP_WEBSITE_ID) {
    status && (status.textContent = "Set CRISP_WEBSITE_ID in script.js to enable live chat.");
    return;
  }
  status && (status.textContent = "Live chat loaded.");
  window.$crisp = [];
  window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID;
  const s = document.createElement("script");
  s.src = "https://client.crisp.chat/l.js";
  s.async = true;
  document.head.appendChild(s);
}

// ========= Tiny toast =========
let toastTimeout;
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    Object.assign(el.style, {
      position: "fixed", left: "50%", bottom: "24px", transform: "translateX(-50%)",
      background: "#111224", color: "#fff", padding: "8px 12px", borderRadius: "8px",
      border: "1px solid rgba(255,255,255,.12)", boxShadow: "0 10px 30px rgba(0,0,0,.35)",
      zIndex: "1000", fontSize: "14px", opacity: "0", transition: "opacity .2s ease"
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = "1";
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => { el.style.opacity = "0"; }, 1200);
}

// ========= Scroll background (rAF) =========
function initScrollBackground() {
  let ticking = false;
  const update = () => {
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const docHeight = document.body.scrollHeight;
    const denom = Math.max(1, (docHeight - windowHeight));
    const scrollPercent = scrollY / denom;
    const topStop = Math.max(0, 50 - scrollPercent * 100);
    const bottomStop = Math.min(100, 50 + scrollPercent * 100);
    document.body.style.background = `linear-gradient(to bottom, #1e1e2f ${topStop}%, #2a2a3f ${bottomStop}%)`;
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  update();
}
// ========= End of script =========