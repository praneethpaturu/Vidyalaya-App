// Lakshya MCB — standalone SPA. Single-file vanilla JS, no framework.
// Hash routing, localStorage persistence, seeded demo data.
//
// pages.js extends this with module pages via window.LAKSHYA_PAGES.*

const $app = document.getElementById("app");
const STORAGE_KEY = "lakshya_state_v2";
const SESSION_KEY = "lakshya_session_v1";

// ─── State ────────────────────────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  // First launch — seed.
  const seeded = JSON.parse(JSON.stringify(window.LAKSHYA_SEED));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}
function saveState(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || "null"); } catch { return null; }
}
function setSession(v) {
  if (v) localStorage.setItem(SESSION_KEY, JSON.stringify(v));
  else localStorage.removeItem(SESSION_KEY);
}

let state = loadState();
window.state = state;
window.saveState = saveState;

// ─── Server-URL switch ────────────────────────────────────────────────
// If a school server URL is configured AND reachable, redirect the WebView
// to it on launch — gives the full web app. Otherwise stay on the bundled
// SPA (everything still works offline).
async function maybeRedirectToServer() {
  const url = (localStorage.getItem("lakshya_server_url") || "").trim();
  if (!url) return false;
  // Avoid redirect loops: if we're already on the configured origin we're done.
  try {
    const target = new URL(url);
    if (location.origin === target.origin) return false;
  } catch { return false; }
  try {
    // 3-second reachability probe.
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 3000);
    await fetch(url, { mode: "no-cors", cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
    window.location.href = url;
    return true;
  } catch { return false; }
}

// ─── Helpers ──────────────────────────────────────────────────────────
const inr = (paise) =>
  "₹" + Math.round(paise / 100).toLocaleString("en-IN");
const initials = (name) =>
  name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || "").join("");
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return d; }
};
window.escapeHtml = escapeHtml;
window.initials = initials;
window.inr = inr;
window.fmtDate = fmtDate;

// ─── Crest SVG ────────────────────────────────────────────────────────
const crestSVG = (size = 32, withText = true) => `
<svg viewBox="0 0 56 56" width="${size}" height="${size}" class="crest" aria-hidden="true">
  <defs>
    <linearGradient id="crestG_${size}" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0" stop-color="#1d4ed8"/>
      <stop offset="1" stop-color="#0f2d5e"/>
    </linearGradient>
  </defs>
  <path d="M8 6 h40 v32 c0 9 -8 14 -20 18 c-12 -4 -20 -9 -20 -18 z" fill="url(#crestG_${size})"/>
  <path d="M8 6 h40 v32 c0 9 -8 14 -20 18 c-12 -4 -20 -9 -20 -18 z" fill="none" stroke="#facc15" stroke-width="1.5"/>
  ${withText ? '<text x="28" y="32" text-anchor="middle" fill="#fff" font-size="8" font-weight="700">LAKSHYA</text>' : ""}
  <circle cx="28" cy="18" r="3" fill="#facc15"/>
</svg>`;

// ─── Routing ──────────────────────────────────────────────────────────
const routes = {
  "/login":              () => renderLogin(),
  "/dashboard":          () => renderDashboard(),
  "/students":           () => renderStudents(),
  "/students/:id":       (p) => renderStudentDetail(p),
  "/fees":               () => renderFees(),
  "/concerns":           () => renderConcerns(),
  "/profile":            () => renderProfile(),
  "/launcher":           () => window.LAKSHYA_PAGES.renderLauncher(),
  "/admissions":         () => window.LAKSHYA_PAGES.renderAdmissions(),
  "/staff":              () => window.LAKSHYA_PAGES.renderStaff(),
  "/transport":          () => window.LAKSHYA_PAGES.renderTransport(),
  "/library":            (p) => window.LAKSHYA_PAGES.renderLibrary(p),
  "/hostel":             () => window.LAKSHYA_PAGES.renderHostel(),
  "/exams":              () => window.LAKSHYA_PAGES.renderExams(),
  "/announcements":      () => window.LAKSHYA_PAGES.renderAnnouncements(),
  "/calendar":           () => window.LAKSHYA_PAGES.renderCalendar(),
  "/inventory":          () => window.LAKSHYA_PAGES.renderInventory(),
  "/visitor":            () => window.LAKSHYA_PAGES.renderVisitor(),
  "/payments":           () => window.LAKSHYA_PAGES.renderPayments(),
  "/concessions":        () => window.LAKSHYA_PAGES.renderConcessions(),
  "/scholarship":        () => window.LAKSHYA_PAGES.renderScholarship(),
  "/dues":               () => window.LAKSHYA_PAGES.renderDues(),
  "/payroll":            () => window.LAKSHYA_PAGES.renderPayroll(),
  "/achievements":       () => window.LAKSHYA_PAGES.renderAchievements(),
  "/certificates":       () => window.LAKSHYA_PAGES.renderCertificates(),
  "/classes":            () => window.LAKSHYA_PAGES.renderClasses(),
  "/expenses":           () => window.LAKSHYA_PAGES.renderExpenses(),
  "/connect/sms":        () => window.LAKSHYA_PAGES.renderSMS(),
  "/ai":                 () => window.LAKSHYA_PAGES.renderAI(),
  "/ai/lead-scoring":    () => window.LAKSHYA_PAGES.renderAILeadScoring(),
  "/ai/at-risk":         () => window.LAKSHYA_PAGES.renderAIAtRisk(),
  "/ai/fee-delinquency": () => window.LAKSHYA_PAGES.renderAIDelinquency(),
};

function navigate(hash) {
  if (location.hash !== hash) location.hash = hash;
  else handleRouteChange();
}
function parseHash() {
  // "#/path?key=val&..." → { path, params }
  const raw = (location.hash || "").replace(/^#/, "") || "/dashboard";
  const [path, qs] = raw.split("?");
  const params = {};
  if (qs) {
    for (const kv of qs.split("&")) {
      const [k, v] = kv.split("=");
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || "");
    }
  }
  return { path, params };
}
function handleRouteChange() {
  const session = getSession();
  const { path, params } = parseHash();
  if (!session && path !== "/login") {
    location.hash = "/login";
    return;
  }
  if (session && path === "/login") {
    location.hash = "/dashboard";
    return;
  }
  // Match dynamic routes.
  let matched = null;
  let pathParams = {};
  for (const pattern in routes) {
    const m = matchRoute(pattern, path);
    if (m) { matched = pattern; pathParams = m; break; }
  }
  const handler = routes[matched] || routes["/dashboard"];
  $app.innerHTML = "";
  handler({ ...pathParams, ...params });
  window.scrollTo(0, 0);
}
function matchRoute(pattern, path) {
  const ps = pattern.split("/").filter(Boolean);
  const xs = path.split("/").filter(Boolean);
  if (ps.length !== xs.length) return null;
  const params = {};
  for (let i = 0; i < ps.length; i++) {
    if (ps[i].startsWith(":")) params[ps[i].slice(1)] = decodeURIComponent(xs[i]);
    else if (ps[i] !== xs[i]) return null;
  }
  return params;
}
window.addEventListener("hashchange", handleRouteChange);
window.addEventListener("DOMContentLoaded", async () => {
  // Optional server redirect first; if it doesn't redirect we render the SPA.
  const redirected = await maybeRedirectToServer();
  if (!redirected) handleRouteChange();
});

// ─── Shell (appbar + tabbar) ──────────────────────────────────────────
function shell(active, body) {
  return `
    <div class="appbar">
      <a href="#/dashboard" style="text-decoration:none;display:flex;align-items:center;gap:10px;flex:1;color:inherit">
        ${crestSVG(32, false)}
        <div style="min-width:0;flex:1">
          <h1 style="margin:0;line-height:1.1">${escapeHtml(state.school.name)}</h1>
          <div class="school-sub">MyClassBoard · ${escapeHtml(state.school.academicYear)}</div>
        </div>
      </a>
      <button onclick="navigate('#/launcher')" aria-label="Apps" title="App launcher">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/>
          <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          <circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/>
        </svg>
      </button>
      <button onclick="navigate('#/profile')" aria-label="Profile">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
      </button>
    </div>
    ${body}
    <nav class="tabbar">
      ${tab("/dashboard", "Home", active, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z"/></svg>')}
      ${tab("/students", "Students", active, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M3 21c0-4 3-7 6-7s6 3 6 7"/><circle cx="17" cy="7" r="3"/><path d="M14 21c0-3 2-5 4-5s4 2 4 5"/></svg>')}
      ${tab("/launcher", "Apps", active, '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="5" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="12" cy="19" r="2"/><circle cx="19" cy="19" r="2"/></svg>')}
      ${tab("/concerns", "Concerns", active, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4"/><circle cx="12" cy="17" r="0.6" fill="currentColor"/><path d="M10.3 3.5L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.5a2 2 0 0 0-3.4 0z"/></svg>')}
      ${tab("/profile", "Me", active, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>')}
    </nav>
  `;
}
function tab(href, label, active, svg) {
  return `<a href="#${href}" class="${active === href ? "active" : ""}">
    ${svg}<span>${label}</span>
  </a>`;
}
window.shell = shell;

// ─── Login ────────────────────────────────────────────────────────────
function renderLogin() {
  $app.innerHTML = `
    <div class="login">
      ${crestSVG(96, true).replace('class="crest"', 'class="crest-lg"')}
      <h2 class="school-name">${escapeHtml(state.school.name)}</h2>
      <p class="school-tag">MyClassBoard ERP</p>
      <form class="login-card" onsubmit="doLogin(event)">
        <h2>Sign in</h2>
        <div class="field">
          <label>Email</label>
          <input id="login-email" type="email" required value="${escapeHtml(state.user.email)}" autocomplete="email"/>
        </div>
        <div class="field">
          <label>Password</label>
          <input id="login-pass" type="password" required value="demo1234" autocomplete="current-password"/>
        </div>
        <button class="btn btn-primary btn-block" type="submit">Sign in</button>
        <p class="muted" style="text-align:center;font-size:11px;margin:10px 0 0">
          Offline demo · any password works
        </p>
      </form>
      <p class="login-foot">v0.2.0 · Lakshya MCB Mobile</p>
    </div>
  `;
}
window.doLogin = function (e) {
  e.preventDefault();
  setSession({ user: state.user, loggedAt: new Date().toISOString() });
  navigate("#/dashboard");
};

// ─── Dashboard ────────────────────────────────────────────────────────
function renderDashboard() {
  const k = state.kpis;
  const presentToday = Object.values(state.attendanceToday).filter((s) => s === "PRESENT").length;
  const totalToday   = Object.values(state.attendanceToday).length;
  $app.innerHTML = shell("/dashboard", `
    <div class="page">
      <h2>Hi ${escapeHtml(state.user.name.split(" ")[0])}</h2>
      <p class="muted" style="margin-bottom:12px">${escapeHtml(state.user.roleLabel)} · here's today.</p>

      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Students</div><div class="kpi-value">${k.students}</div><div class="kpi-sub">on roll</div></div>
        <div class="kpi"><div class="kpi-label">Staff</div><div class="kpi-value">${k.staff}</div><div class="kpi-sub">teaching + non-teaching</div></div>
        <div class="kpi"><div class="kpi-label">Attendance</div><div class="kpi-value">${Math.round((presentToday/Math.max(1,totalToday))*100)}%</div><div class="kpi-sub">today (${presentToday}/${totalToday})</div></div>
        <div class="kpi"><div class="kpi-label">Open concerns</div><div class="kpi-value">${state.concerns.filter(c=>c.status!=="RESOLVED").length}</div><div class="kpi-sub">need attention</div></div>
        <div class="kpi"><div class="kpi-label">Fees collected</div><div class="kpi-value" style="font-size:20px">${inr(k.feesCollectedPaise)}</div><div class="kpi-sub">this term</div></div>
        <div class="kpi"><div class="kpi-label">Due invoices</div><div class="kpi-value">${state.invoices.filter(i=>i.status!=="PAID").length}</div><div class="kpi-sub">to be collected</div></div>
      </div>

      <div class="section-h"><h3>Quick links</h3><a href="#/launcher">All apps</a></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
        ${["Admissions:#/admissions:📋","Transport:#/transport:🚌","Library:#/library:📚","Hostel:#/hostel:🏢","Exams:#/exams:📝","Calendar:#/calendar:📅","Inventory:#/inventory:📦","AI Insights:#/ai:✨"].map((s) => {
          const [label, href, icon] = s.split(":");
          return `<a href="${href}" style="display:flex;flex-direction:column;align-items:center;text-align:center;padding:10px 4px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;text-decoration:none;color:inherit"><div style="font-size:24px">${icon}</div><div style="font-size:11px;margin-top:4px">${label}</div></a>`;
        }).join("")}
      </div>

      <div class="section-h"><h3>Latest announcements</h3><a href="#/announcements">All</a></div>
      <div class="list">
        ${state.announcements.slice(0, 3).map((a) => `
          <div class="item">
            <div class="avatar" style="background:#fef3c7;color:#b45309">📣</div>
            <div class="meta">
              <div class="name">${escapeHtml(a.title)}</div>
              <div class="sub">${fmtDate(a.date)}</div>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="section-h"><h3>Today's attendance</h3><a href="#/students">Students</a></div>
      <div class="list">
        ${state.students.slice(0, 5).map((s) => {
          const st = state.attendanceToday[s.id] || "ABSENT";
          const cls = st === "PRESENT" ? "badge-green" : st === "LATE" ? "badge-amber" : "badge-red";
          return `
            <div class="item" onclick="navigate('#/students/${s.id}')">
              <div class="avatar">${initials(s.name)}</div>
              <div class="meta"><div class="name">${escapeHtml(s.name)}</div><div class="sub">${escapeHtml(s.class)} · #${s.roll}</div></div>
              <div class="right"><span class="badge ${cls}">${st}</span></div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `);
}

// ─── Students list ────────────────────────────────────────────────────
let studentFilter = "ALL";
function renderStudents() {
  const filtered = state.students.filter((s) => {
    if (studentFilter === "ALL") return true;
    return s.class.includes(studentFilter);
  });
  $app.innerHTML = shell("/students", `
    <div class="page">
      <h2>Students</h2>
      <p class="muted">${state.students.length} on roll</p>
      <div class="pills">
        ${["ALL", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10"].map((g) =>
          `<button class="pill ${studentFilter===g?"active":""}" onclick="setStudentFilter('${g}')">${g}</button>`
        ).join("")}
      </div>
      <div class="list">
        ${filtered.length === 0 ? `<div class="empty">No students in this grade.</div>` : ""}
        ${filtered.map((s) => `
          <div class="item" onclick="navigate('#/students/${s.id}')">
            <div class="avatar">${initials(s.name)}</div>
            <div class="meta">
              <div class="name">${escapeHtml(s.name)}</div>
              <div class="sub">${escapeHtml(s.class)} · ${escapeHtml(s.admNo)}</div>
            </div>
            <div class="right">›</div>
          </div>
        `).join("")}
      </div>
    </div>
  `);
}
window.setStudentFilter = function(g) { studentFilter = g; renderStudents(); };

// ─── Student detail ───────────────────────────────────────────────────
function renderStudentDetail({ id }) {
  const s = state.students.find((x) => x.id === id);
  if (!s) { $app.innerHTML = shell("/students", `<div class="page"><div class="empty">Student not found.</div></div>`); return; }
  const inv = state.invoices.filter((i) => i.studentId === id);
  const paid = inv.reduce((a, b) => a + b.paidPaise, 0);
  const due  = inv.reduce((a, b) => a + (b.amountPaise - b.paidPaise), 0);
  const att  = state.attendanceToday[s.id] ?? "—";
  const attBadge = att === "PRESENT" ? "badge-green" : att === "LATE" ? "badge-amber" : "badge-red";

  $app.innerHTML = shell("/students", `
    <div class="page">
      <a href="#/students" style="color:#1d4ed8;font-size:13px;text-decoration:none">‹ Students</a>
      <div style="display:flex;align-items:center;gap:12px;margin:12px 0">
        <div class="avatar" style="width:54px;height:54px;font-size:18px;background:#dbeafe;color:#1e40af;display:flex;align-items:center;justify-content:center;border-radius:50%;font-weight:600">
          ${initials(s.name)}
        </div>
        <div>
          <h2 style="margin:0">${escapeHtml(s.name)}</h2>
          <p class="muted" style="margin:2px 0 0">${escapeHtml(s.class)} · Roll #${s.roll} · ${escapeHtml(s.admNo)}</p>
        </div>
      </div>

      <div class="card">
        <h3>Today</h3>
        <div class="row"><span>Attendance</span><span class="badge ${attBadge}">${att}</span></div>
      </div>

      <div class="card">
        <h3>Profile</h3>
        <div class="row"><span class="muted">Gender</span><span>${s.gender === "M" ? "Male" : "Female"}</span></div>
        <div class="row" style="margin-top:6px"><span class="muted">Blood group</span><span>${escapeHtml(s.bloodGroup)}</span></div>
      </div>

      <div class="card">
        <h3>Fees</h3>
        <div class="row"><span class="muted">Paid</span><span style="color:#15803d;font-weight:500">${inr(paid)}</span></div>
        <div class="row" style="margin-top:6px"><span class="muted">Outstanding</span><span style="color:#b91c1c;font-weight:500">${inr(due)}</span></div>
        ${inv.length > 0 ? `<button class="btn btn-secondary btn-block" style="margin-top:10px" onclick="navigate('#/fees')">View invoices</button>` : ""}
      </div>

      <button class="btn btn-primary btn-block" onclick="markAttendance('${s.id}')">Mark attendance</button>
    </div>
  `);
}
window.markAttendance = function(id) {
  const cur = state.attendanceToday[id];
  const next = cur === "PRESENT" ? "ABSENT" : cur === "ABSENT" ? "LATE" : "PRESENT";
  state.attendanceToday[id] = next;
  saveState(state);
  handleRouteChange();
};

// ─── Fees ─────────────────────────────────────────────────────────────
function renderFees() {
  const total = state.invoices.reduce((a, b) => a + b.amountPaise, 0);
  const paid  = state.invoices.reduce((a, b) => a + b.paidPaise, 0);
  $app.innerHTML = shell("/launcher", `
    <div class="page">
      <h2>Fees</h2>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Collected</div><div class="kpi-value" style="font-size:18px">${inr(paid)}</div></div>
        <div class="kpi"><div class="kpi-label">Outstanding</div><div class="kpi-value" style="font-size:18px;color:#b91c1c">${inr(total-paid)}</div></div>
      </div>
      <div class="section-h"><h3>Invoices</h3><span class="muted">${state.invoices.length}</span></div>
      <div class="list">
        ${state.invoices.map((i) => {
          const s = state.students.find((x) => x.id === i.studentId);
          const cls = i.status === "PAID" ? "badge-green" : i.status === "PARTIAL" ? "badge-amber" : "badge-red";
          return `
            <div class="item" onclick="navigate('#/students/${i.studentId}')">
              <div class="avatar">${initials(s?.name || "?")}</div>
              <div class="meta">
                <div class="name">${escapeHtml(s?.name || "Unknown")}</div>
                <div class="sub">${escapeHtml(i.number)} · due ${fmtDate(i.dueDate)}</div>
              </div>
              <div class="right">
                <div style="font-weight:500">${inr(i.amountPaise)}</div>
                <span class="badge ${cls}" style="margin-top:4px">${i.status}</span>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `);
}

// ─── Concerns ─────────────────────────────────────────────────────────
function renderConcerns() {
  $app.innerHTML = shell("/concerns", `
    <div class="page">
      <h2>Concerns</h2>
      <p class="muted">${state.concerns.filter(c=>c.status!=="RESOLVED").length} open</p>
      <div class="list">
        ${state.concerns.map((c) => {
          const sevCls = c.severity === "HIGH" ? "badge-red" : c.severity === "LOW" ? "badge-slate" : "badge-amber";
          const stCls  = c.status === "OPEN" ? "badge-red" : c.status === "IN_PROGRESS" ? "badge-amber" : "badge-green";
          return `
            <div class="item">
              <div class="avatar" style="background:#fee2e2;color:#b91c1c">!</div>
              <div class="meta">
                <div class="name">${escapeHtml(c.subject)}</div>
                <div class="sub">${escapeHtml(c.category)} · ${escapeHtml(c.raisedBy)}</div>
              </div>
              <div class="right">
                <span class="badge ${sevCls}">${c.severity}</span>
                <div style="margin-top:4px"><span class="badge ${stCls}">${c.status}</span></div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
    <button class="fab" onclick="openConcernModal()" aria-label="Add concern">+</button>
  `);
}
window.openConcernModal = function() {
  const m = document.createElement("div");
  m.className = "modal-back";
  m.innerHTML = `
    <div class="modal" onclick="event.stopPropagation()">
      <h3>Raise a concern</h3>
      <form onsubmit="submitConcern(event)">
        <div class="field"><label>Subject</label><input id="cn-subject" required maxlength="80"/></div>
        <div class="field"><label>Category</label>
          <select id="cn-cat"><option>ACADEMIC</option><option>DISCIPLINE</option><option>HEALTH</option><option>IT</option><option>INFRA</option><option>TRANSPORT</option><option>HOSTEL</option><option>OTHER</option></select>
        </div>
        <div class="field"><label>Severity</label>
          <select id="cn-sev"><option>LOW</option><option selected>MEDIUM</option><option>HIGH</option></select>
        </div>
        <div class="field"><label>Details</label><textarea id="cn-body" rows="3"></textarea></div>
        <button class="btn btn-primary btn-block" type="submit">Submit</button>
        <button class="btn btn-secondary btn-block" type="button" style="margin-top:8px" onclick="closeModal()">Cancel</button>
      </form>
    </div>
  `;
  m.onclick = closeModal;
  document.body.appendChild(m);
};
window.closeModal = function() {
  document.querySelectorAll(".modal-back").forEach((n) => n.remove());
};
window.submitConcern = function(e) {
  e.preventDefault();
  const c = {
    id: "c" + (state.concerns.length + 1) + Date.now(),
    subject: document.getElementById("cn-subject").value,
    category: document.getElementById("cn-cat").value,
    severity: document.getElementById("cn-sev").value,
    raisedBy: state.user.name,
    status: "OPEN",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  state.concerns.unshift(c);
  saveState(state);
  closeModal();
  renderConcerns();
};

// ─── Profile / Settings ───────────────────────────────────────────────
function renderProfile() {
  $app.innerHTML = shell("/profile", `
    <div class="page">
      <h2>Profile</h2>
      <div class="card" style="text-align:center;padding:24px">
        <div class="avatar" style="width:64px;height:64px;font-size:22px;margin:0 auto 10px;background:#dbeafe;color:#1e40af;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:600">
          ${initials(state.user.name)}
        </div>
        <h3 style="margin:6px 0 2px;font-size:16px">${escapeHtml(state.user.name)}</h3>
        <p class="muted" style="margin:0">${escapeHtml(state.user.email)}</p>
        <p class="muted" style="margin:2px 0 0;font-size:12px">${escapeHtml(state.user.roleLabel)} · ${escapeHtml(state.school.name)}</p>
      </div>

      <div class="section-h"><h3>Connect to school</h3></div>
      <div class="card">
        <div class="field"><label>School server URL (optional)</label>
          <input id="server-url" placeholder="https://your-school.example.com" value="${escapeHtml(getServerUrl())}"/>
          <p class="muted" style="font-size:11px;margin:4px 0 0">When set, the app will load your school's hosted server on next launch — full feature set. Leave empty for offline-only mode.</p>
        </div>
        <button class="btn btn-secondary btn-block" onclick="saveServerUrl()">Save</button>
        ${getServerUrl() ? `<button class="btn btn-primary btn-block" style="margin-top:8px" onclick="goToServer()">Open in school server now</button>` : ""}
      </div>

      <div class="section-h"><h3>Announcements</h3></div>
      <div class="list">
        ${state.announcements.slice(0, 3).map((a) => `
          <div class="item" style="cursor:default">
            <div class="avatar" style="background:#fef3c7;color:#b45309">📣</div>
            <div class="meta">
              <div class="name">${escapeHtml(a.title)}</div>
              <div class="sub" style="white-space:normal">${escapeHtml(a.body).slice(0, 90)}…</div>
              <div class="sub" style="margin-top:2px">${fmtDate(a.date)}</div>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="card">
        <button class="btn btn-secondary btn-block" onclick="resetData()">Reset demo data</button>
        <button class="btn btn-danger btn-block" style="margin-top:8px" onclick="signOut()">Sign out</button>
      </div>

      <p class="muted" style="text-align:center;font-size:11px;margin-top:16px">
        Lakshya MCB Mobile · v0.2.0 · ${escapeHtml(state.school.code)}
      </p>
    </div>
  `);
}
function getServerUrl() { return localStorage.getItem("lakshya_server_url") || ""; }
window.saveServerUrl = function() {
  const v = document.getElementById("server-url").value.trim();
  if (v) localStorage.setItem("lakshya_server_url", v);
  else localStorage.removeItem("lakshya_server_url");
  alert(v ? "Saved. App will try to load this on next launch." : "Cleared. App will run fully offline.");
};
window.resetData = function() {
  if (!confirm("Reset all demo data? Your local edits will be lost.")) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  window.state = state;
  handleRouteChange();
};
window.signOut = function() {
  setSession(null);
  navigate("#/login");
};

// Expose a few helpers for inline handlers.
window.navigate = navigate;
