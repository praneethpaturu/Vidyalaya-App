// All additional module pages live here. app.js routes to them via
// window.LAKSHYA_PAGES.<name>(params). Helpers (state, escapeHtml, inr,
// initials, fmtDate, shell, navigate) are exposed by app.js on window.

(function () {
  const P = (window.LAKSHYA_PAGES = window.LAKSHYA_PAGES || {});

  // ─── App Launcher ────────────────────────────────────────────────
  P.renderLauncher = function () {
    const groups = window.LAKSHYA_MODULES;
    const body = `
      <div class="page">
        <h2>App launcher</h2>
        <p class="muted">All modules. Items marked “Server” need an active connection to your school's hosted server.</p>
        ${groups.map((g) => `
          <div style="margin-top:16px">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.6px;color:#94a3b8;margin-bottom:8px">${g.group}</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
              ${g.items.map((m) => {
                const dest = m.route ? `onclick="navigate('${m.route}')"` : `onclick="needsServer('${escapeHtml(m.label)}')"`;
                const dim = m.needsServer ? "opacity:0.6" : "";
                return `
                  <button class="card card-pad" style="text-align:center;padding:14px 6px;border-radius:14px;${dim}" ${dest}>
                    <div style="font-size:28px;line-height:1">${m.icon}</div>
                    <div style="font-size:11px;margin-top:6px;line-height:1.3">${escapeHtml(m.label)}</div>
                    ${m.needsServer ? '<div style="font-size:9px;color:#94a3b8;margin-top:2px">Server</div>' : ''}
                  </button>`;
              }).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Admissions ──────────────────────────────────────────────────
  P.renderAdmissions = function () {
    const list = window.state.enquiries;
    const stages = ["ENQUIRY", "CONTACTED", "VISITED", "OFFERED", "ENROLLED"];
    const counts = stages.map((s) => list.filter((e) => e.status === s).length);
    const body = `
      <div class="page">
        <h2>Admissions</h2>
        <p class="muted">${list.length} enquiries this month</p>
        <div class="kpi-grid">
          ${stages.map((s, i) => `
            <div class="kpi"><div class="kpi-label">${s}</div><div class="kpi-value">${counts[i]}</div></div>
          `).slice(0, 4).join("")}
        </div>
        <div class="section-h"><h3>Pipeline</h3></div>
        <div class="list">
          ${list.map((e) => {
            const cls = e.status === "ENROLLED" ? "badge-green" :
                        e.status === "OFFERED"  ? "badge-amber" :
                        e.status === "ENQUIRY"  ? "badge-slate" : "badge-amber";
            return `
              <div class="item">
                <div class="avatar" style="background:#dcfce7;color:#15803d">${initials(e.childName)}</div>
                <div class="meta">
                  <div class="name">${escapeHtml(e.childName)}</div>
                  <div class="sub">${escapeHtml(e.grade)} · ${escapeHtml(e.parent)} · ${escapeHtml(e.source)}</div>
                </div>
                <div class="right">
                  <span class="badge ${cls}">${e.status}</span>
                  ${e.followUp ? `<div class="muted" style="font-size:10px;margin-top:3px">${fmtDate(e.followUp)}</div>` : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
      <button class="fab" onclick="alert('New enquiry — full form available in next release.')">+</button>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── HR / Staff ──────────────────────────────────────────────────
  P.renderStaff = function () {
    const staff = window.state.staff;
    const teaching    = staff.filter((s) => s.department === "Academics").length;
    const nonTeaching = staff.length - teaching;
    const body = `
      <div class="page">
        <h2>HR — Staff</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Total staff</div><div class="kpi-value">${staff.length}</div></div>
          <div class="kpi"><div class="kpi-label">Teaching</div><div class="kpi-value">${teaching}</div></div>
          <div class="kpi"><div class="kpi-label">Non-teaching</div><div class="kpi-value">${nonTeaching}</div></div>
          <div class="kpi"><div class="kpi-label">On leave today</div><div class="kpi-value">2</div></div>
        </div>
        <div class="section-h"><h3>Directory</h3></div>
        <div class="list">
          ${staff.map((s) => `
            <div class="item">
              <div class="avatar" style="background:#ede9fe;color:#6d28d9">${initials(s.name)}</div>
              <div class="meta">
                <div class="name">${escapeHtml(s.name)}</div>
                <div class="sub">${escapeHtml(s.designation)} · ${escapeHtml(s.department)}</div>
              </div>
              <div class="right" style="font-size:11px">${escapeHtml(s.empId)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Transport ───────────────────────────────────────────────────
  P.renderTransport = function () {
    const buses = window.state.buses;
    const enRoute = buses.filter((b) => b.status === "EN_ROUTE").length;
    const body = `
      <div class="page">
        <h2>Transport</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Fleet</div><div class="kpi-value">${buses.length}</div></div>
          <div class="kpi"><div class="kpi-label">En route</div><div class="kpi-value">${enRoute}</div></div>
        </div>
        <div class="section-h"><h3>Live status</h3></div>
        <div class="list">
          ${buses.map((b) => {
            const cls = b.status === "EN_ROUTE" ? "badge-amber" : b.status === "AT_SCHOOL" ? "badge-green" : "badge-slate";
            return `
              <div class="item">
                <div class="avatar" style="background:#fee2e2;color:#b91c1c">🚌</div>
                <div class="meta">
                  <div class="name">${escapeHtml(b.number)}</div>
                  <div class="sub">${escapeHtml(b.route)} · driver: ${escapeHtml(b.driver)}</div>
                </div>
                <div class="right">
                  <span class="badge ${cls}">${b.status.replace("_", " ")}</span>
                  <div class="muted" style="font-size:11px;margin-top:3px">${b.onboard}/${b.capacity}</div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Library ─────────────────────────────────────────────────────
  P.renderLibrary = function (params) {
    const q = (params && params.q || "").toLowerCase();
    const all = window.state.books;
    const filtered = q ? all.filter((b) =>
      (b.title + " " + b.author + " " + b.category).toLowerCase().includes(q)
    ) : all;
    const body = `
      <div class="page">
        <h2>Library</h2>
        <p class="muted">${all.length} titles · ${all.reduce((a,b) => a + b.available, 0)} available</p>
        <div class="field" style="margin-bottom:12px">
          <input id="lib-q" placeholder="Search title, author, category" value="${escapeHtml(q)}"/>
        </div>
        <div class="list">
          ${filtered.length === 0 ? `<div class="empty">No matches.</div>` : ""}
          ${filtered.map((b) => `
            <div class="item">
              <div class="avatar" style="background:#e0e7ff;color:#3730a3">📕</div>
              <div class="meta">
                <div class="name">${escapeHtml(b.title)}</div>
                <div class="sub">${escapeHtml(b.author || "—")} · ${escapeHtml(b.category || "—")}</div>
              </div>
              <div class="right">
                <span class="badge ${b.available > 0 ? "badge-green" : "badge-red"}">${b.available}/${b.total}</span>
                <div class="muted" style="font-size:11px;margin-top:3px">${escapeHtml(b.shelf)}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
    const inp = document.getElementById("lib-q");
    if (inp) inp.addEventListener("input", (e) => {
      window.location.hash = "#/library?q=" + encodeURIComponent(e.target.value);
    });
  };

  // ─── Hostel ──────────────────────────────────────────────────────
  P.renderHostel = function () {
    const h = window.state.hostel;
    const totalCap = h.buildings.reduce((a, b) => a + b.capacity, 0);
    const totalOcc = h.buildings.reduce((a, b) => a + b.occupied, 0);
    const body = `
      <div class="page">
        <h2>Hostel</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Capacity</div><div class="kpi-value">${totalCap}</div></div>
          <div class="kpi"><div class="kpi-label">Occupied</div><div class="kpi-value">${totalOcc}</div><div class="kpi-sub">${Math.round(totalOcc/totalCap*100)}%</div></div>
        </div>
        <div class="section-h"><h3>Buildings</h3></div>
        <div class="list">
          ${h.buildings.map((b) => `
            <div class="item">
              <div class="avatar" style="background:#fef3c7;color:#b45309">🏢</div>
              <div class="meta">
                <div class="name">${escapeHtml(b.name)}</div>
                <div class="sub">${b.floors} floors · ${b.rooms} rooms</div>
              </div>
              <div class="right">${b.occupied}/${b.capacity}</div>
            </div>
          `).join("")}
        </div>
        <div class="section-h"><h3>Rooms</h3></div>
        <div class="list">
          ${h.rooms.map((r) => {
            const cls = r.status === "VACANT" ? "badge-green" : r.status === "OCCUPIED" ? "badge-slate" : "badge-amber";
            return `
              <div class="item">
                <div class="avatar" style="background:#e0e7ff;color:#3730a3">${escapeHtml(r.number)}</div>
                <div class="meta">
                  <div class="name">${escapeHtml(r.building)}</div>
                  <div class="sub">${r.occupied}/${r.capacity} occupied</div>
                </div>
                <div class="right"><span class="badge ${cls}">${r.status}</span></div>
              </div>
            `;
          }).join("")}
        </div>
        <div class="section-h"><h3>Mess menu</h3></div>
        <div class="list">
          ${h.meals.map((m) => `
            <div class="item" style="cursor:default">
              <div class="avatar" style="background:#fee2e2;color:#b91c1c">${m.day}</div>
              <div class="meta">
                <div class="name">B: ${escapeHtml(m.breakfast)}</div>
                <div class="sub" style="white-space:normal">L: ${escapeHtml(m.lunch)} · D: ${escapeHtml(m.dinner)}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Online Exams ────────────────────────────────────────────────
  P.renderExams = function () {
    const list = window.state.exams;
    const body = `
      <div class="page">
        <h2>Online Exams</h2>
        <p class="muted">${list.length} scheduled · ${list.filter((e) => e.status === "LIVE").length} live now</p>
        <div class="list">
          ${list.map((e) => {
            const cls = e.status === "LIVE" ? "badge-red" : e.status === "PUBLISHED" ? "badge-green" : e.status === "DRAFT" ? "badge-slate" : "badge-amber";
            return `
              <div class="item">
                <div class="avatar" style="background:#dbeafe;color:#1e40af">📝</div>
                <div class="meta">
                  <div class="name">${escapeHtml(e.title)}</div>
                  <div class="sub">${escapeHtml(e.class)} · ${e.duration} min · ${escapeHtml(e.type)}</div>
                </div>
                <div class="right">
                  <span class="badge ${cls}">${e.status}</span>
                  <div class="muted" style="font-size:11px;margin-top:3px">${fmtDate(e.date)}</div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Announcements ───────────────────────────────────────────────
  P.renderAnnouncements = function () {
    const list = window.state.announcements;
    const body = `
      <div class="page">
        <h2>Announcements</h2>
        <p class="muted">${list.length} this fortnight</p>
        <div>
          ${list.map((a) => `
            <div class="card">
              <div class="row">
                <h3 style="margin:0;font-size:14px">${escapeHtml(a.title)}</h3>
                <span class="muted" style="font-size:11px">${fmtDate(a.date)}</span>
              </div>
              <p class="muted" style="margin:6px 0 0;font-size:13px;line-height:1.5">${escapeHtml(a.body)}</p>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── School Calendar ─────────────────────────────────────────────
  P.renderCalendar = function () {
    const list = [...window.state.events].sort((a, b) => a.date.localeCompare(b.date));
    const body = `
      <div class="page">
        <h2>School Calendar</h2>
        <p class="muted">Upcoming events</p>
        <div class="list">
          ${list.map((e) => {
            const tone = e.type === "HOLIDAY" ? "badge-red" : e.type === "EXAM" ? "badge-amber" : e.type === "PTM" ? "badge-amber" : "badge-slate";
            return `
              <div class="item">
                <div class="avatar" style="background:#fef3c7;color:#b45309">📅</div>
                <div class="meta">
                  <div class="name">${escapeHtml(e.title)}</div>
                  <div class="sub">${fmtDate(e.date)} · ${escapeHtml(e.audience)}</div>
                </div>
                <div class="right"><span class="badge ${tone}">${e.type}</span></div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Inventory ───────────────────────────────────────────────────
  P.renderInventory = function () {
    const list = window.state.inventory;
    const lowStock = list.filter((x) => x.qty <= x.reorder).length;
    const body = `
      <div class="page">
        <h2>Inventory</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Items</div><div class="kpi-value">${list.length}</div></div>
          <div class="kpi"><div class="kpi-label">Low stock</div><div class="kpi-value" style="color:${lowStock?'#b91c1c':'#15803d'}">${lowStock}</div></div>
        </div>
        <div class="list">
          ${list.map((x) => {
            const low = x.qty <= x.reorder;
            return `
              <div class="item">
                <div class="avatar" style="background:#f1f5f9;color:#475569">📦</div>
                <div class="meta">
                  <div class="name">${escapeHtml(x.name)}</div>
                  <div class="sub">${escapeHtml(x.category)} · reorder at ${x.reorder}</div>
                </div>
                <div class="right">
                  <div style="font-weight:500">${x.qty}</div>
                  <div class="muted" style="font-size:11px">${escapeHtml(x.unit)}</div>
                  ${low ? '<span class="badge badge-red" style="margin-top:4px">LOW</span>' : ""}
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Visitor entry ───────────────────────────────────────────────
  P.renderVisitor = function () {
    const list = window.state.visitors;
    const inside = list.filter((v) => v.status === "INSIDE").length;
    const body = `
      <div class="page">
        <h2>Visitor Mgmt</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Inside now</div><div class="kpi-value">${inside}</div></div>
          <div class="kpi"><div class="kpi-label">Today</div><div class="kpi-value">${list.length}</div></div>
        </div>
        <button class="btn btn-primary btn-block" onclick="openVisitorModal()">+ New visitor entry</button>
        <div class="section-h" style="margin-top:14px"><h3>Today's log</h3></div>
        <div class="list">
          ${list.map((v) => {
            const cls = v.status === "INSIDE" ? "badge-amber" : "badge-slate";
            return `
              <div class="item">
                <div class="avatar" style="background:#dcfce7;color:#15803d">${initials(v.name)}</div>
                <div class="meta">
                  <div class="name">${escapeHtml(v.name)}</div>
                  <div class="sub">${escapeHtml(v.purpose)} · host: ${escapeHtml(v.hostName)}</div>
                </div>
                <div class="right">
                  <span class="badge ${cls}">${v.status}</span>
                  <div class="muted" style="font-size:10px;margin-top:3px">${escapeHtml(v.inAt.split(" ")[1])}${v.outAt ? "→" + v.outAt.split(" ")[1] : ""}</div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };
  window.openVisitorModal = function () {
    const m = document.createElement("div");
    m.className = "modal-back";
    m.innerHTML = `
      <div class="modal" onclick="event.stopPropagation()">
        <h3>Visitor entry</h3>
        <form onsubmit="submitVisitor(event)">
          <div class="field"><label>Visitor name</label><input id="v-name" required/></div>
          <div class="field"><label>Purpose</label>
            <select id="v-purpose">
              <option>Parent Visit</option><option>Vendor</option>
              <option>Admission Enquiry</option><option>Audit</option>
              <option>Maintenance</option><option>Other</option>
            </select>
          </div>
          <div class="field"><label>Host</label><input id="v-host" required/></div>
          <button class="btn btn-primary btn-block" type="submit">Issue badge</button>
          <button class="btn btn-secondary btn-block" type="button" style="margin-top:8px" onclick="closeModal()">Cancel</button>
        </form>
      </div>
    `;
    m.onclick = closeModal;
    document.body.appendChild(m);
  };
  window.submitVisitor = function (e) {
    e.preventDefault();
    const v = {
      id: "v" + Date.now(),
      name:     document.getElementById("v-name").value,
      purpose:  document.getElementById("v-purpose").value,
      hostName: document.getElementById("v-host").value,
      inAt: new Date().toISOString().replace("T", " ").slice(0, 16),
      outAt: null,
      status: "INSIDE",
    };
    window.state.visitors.unshift(v);
    window.saveState(window.state);
    closeModal();
    alert("Badge #" + v.id.slice(-4).toUpperCase() + " issued to " + v.name);
    P.renderVisitor();
  };

  // ─── Payments ────────────────────────────────────────────────────
  P.renderPayments = function () {
    const list = window.state.payments;
    const total = list.reduce((a, b) => a + b.amountPaise, 0);
    const body = `
      <div class="page">
        <h2>Payments</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Receipts (recent)</div><div class="kpi-value">${list.length}</div></div>
          <div class="kpi"><div class="kpi-label">Total</div><div class="kpi-value" style="font-size:18px">${inr(total)}</div></div>
        </div>
        <div class="list">
          ${list.map((p) => `
            <div class="item">
              <div class="avatar" style="background:#dcfce7;color:#15803d">₹</div>
              <div class="meta">
                <div class="name">${escapeHtml(p.studentName)}</div>
                <div class="sub">${escapeHtml(p.receipt)} · ${escapeHtml(p.method)}</div>
              </div>
              <div class="right">
                <div style="font-weight:500">${inr(p.amountPaise)}</div>
                <div class="muted" style="font-size:11px;margin-top:3px">${fmtDate(p.paidAt)}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Concessions ─────────────────────────────────────────────────
  P.renderConcessions = function () {
    const list = window.state.concessions;
    const body = `
      <div class="page">
        <h2>Concessions</h2>
        <p class="muted">${list.length} active</p>
        <div class="list">
          ${list.map((c) => `
            <div class="item">
              <div class="avatar" style="background:#fef3c7;color:#b45309">${c.pct}%</div>
              <div class="meta">
                <div class="name">${escapeHtml(c.studentName)}</div>
                <div class="sub">${escapeHtml(c.type)}</div>
              </div>
              <div class="right"><span class="badge badge-amber">${c.pct}%</span></div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Scholarship ─────────────────────────────────────────────────
  P.renderScholarship = function () {
    const list = window.state.scholarships;
    const body = `
      <div class="page">
        <h2>Scholarship</h2>
        <p class="muted">${list.length} awards this year</p>
        <div class="list">
          ${list.map((s) => `
            <div class="item">
              <div class="avatar" style="background:#fee2e2;color:#b91c1c">🥇</div>
              <div class="meta">
                <div class="name">${escapeHtml(s.studentName)}</div>
                <div class="sub">${escapeHtml(s.scheme)}</div>
              </div>
              <div class="right" style="font-weight:500">${inr(s.awardPaise)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Due reports ─────────────────────────────────────────────────
  P.renderDues = function () {
    const due = window.state.invoices.filter((i) => i.status !== "PAID");
    const total = due.reduce((a, b) => a + (b.amountPaise - b.paidPaise), 0);
    const body = `
      <div class="page">
        <h2>Due Reports</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Outstanding invoices</div><div class="kpi-value">${due.length}</div></div>
          <div class="kpi"><div class="kpi-label">Outstanding amount</div><div class="kpi-value" style="font-size:18px;color:#b91c1c">${inr(total)}</div></div>
        </div>
        <div class="list">
          ${due.map((i) => {
            const s = window.state.students.find((x) => x.id === i.studentId);
            return `
              <div class="item">
                <div class="avatar" style="background:#fee2e2;color:#b91c1c">!</div>
                <div class="meta">
                  <div class="name">${escapeHtml(s?.name || "?")}</div>
                  <div class="sub">${escapeHtml(i.number)} · due ${fmtDate(i.dueDate)}</div>
                </div>
                <div class="right">${inr(i.amountPaise - i.paidPaise)}</div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Payroll ─────────────────────────────────────────────────────
  P.renderPayroll = function () {
    const list = window.state.payroll;
    const total = list.reduce((a, b) => a + b.netPaise, 0);
    const body = `
      <div class="page">
        <h2>Payroll</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Slips this month</div><div class="kpi-value">${list.length}</div></div>
          <div class="kpi"><div class="kpi-label">Net paid</div><div class="kpi-value" style="font-size:18px">${inr(total)}</div></div>
        </div>
        <div class="list">
          ${list.map((p) => `
            <div class="item">
              <div class="avatar" style="background:#ede9fe;color:#6d28d9">${initials(p.staffName)}</div>
              <div class="meta">
                <div class="name">${escapeHtml(p.staffName)}</div>
                <div class="sub">${escapeHtml(p.month)} · gross ${inr(p.grossPaise)} − ded ${inr(p.deductionsPaise)}</div>
              </div>
              <div class="right">
                <div style="font-weight:500">${inr(p.netPaise)}</div>
                <span class="badge badge-green" style="margin-top:4px">${p.status}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Achievements ────────────────────────────────────────────────
  P.renderAchievements = function () {
    const list = window.state.achievements;
    const body = `
      <div class="page">
        <h2>Achievements</h2>
        <p class="muted">${list.length} this academic year</p>
        <div class="list">
          ${list.map((a) => `
            <div class="item">
              <div class="avatar" style="background:#fef3c7;color:#b45309">🏆</div>
              <div class="meta">
                <div class="name">${escapeHtml(a.title)}</div>
                <div class="sub">${escapeHtml(a.studentName)} · ${escapeHtml(a.level)}</div>
              </div>
              <div class="right" style="font-size:11px">${fmtDate(a.date)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Certificates ────────────────────────────────────────────────
  P.renderCertificates = function () {
    const list = window.state.certificates;
    const body = `
      <div class="page">
        <h2>Certificates</h2>
        <p class="muted">${list.length} issued recently</p>
        <div class="list">
          ${list.map((c) => `
            <div class="item">
              <div class="avatar" style="background:#dbeafe;color:#1e40af">📜</div>
              <div class="meta">
                <div class="name">${escapeHtml(c.student)}</div>
                <div class="sub">${escapeHtml(c.type)}</div>
              </div>
              <div class="right" style="font-size:11px">${fmtDate(c.issuedAt)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Classes ─────────────────────────────────────────────────────
  P.renderClasses = function () {
    const list = window.state.classes;
    const body = `
      <div class="page">
        <h2>Classes</h2>
        <p class="muted">${list.length} active classes · ${list.reduce((a,b)=>a+b.strength,0)} students</p>
        <div class="list">
          ${list.map((c) => `
            <div class="item">
              <div class="avatar" style="background:#dbeafe;color:#1e40af">${c.name.match(/\d+/)?.[0] || "?"}</div>
              <div class="meta">
                <div class="name">${escapeHtml(c.name)}</div>
                <div class="sub">CT: ${escapeHtml(c.teacher)}</div>
              </div>
              <div class="right">${c.strength} students</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Expenses ────────────────────────────────────────────────────
  P.renderExpenses = function () {
    // Reuse inventory items as a stand-in for "expense lines" so the page
    // has something tangible without new seed data.
    const list = window.state.inventory.slice(0, 6).map((x, i) => ({
      head:  x.category,
      desc:  x.name + " — restock",
      amount: (x.qty * 50 + i * 1200) * 100,
      date:  "2026-04-" + (10 + i),
    }));
    const total = list.reduce((a, b) => a + b.amount, 0);
    const body = `
      <div class="page">
        <h2>Expenses</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Recent vouchers</div><div class="kpi-value">${list.length}</div></div>
          <div class="kpi"><div class="kpi-label">Total</div><div class="kpi-value" style="font-size:18px">${inr(total)}</div></div>
        </div>
        <div class="list">
          ${list.map((x) => `
            <div class="item">
              <div class="avatar" style="background:#fee2e2;color:#b91c1c">₹</div>
              <div class="meta">
                <div class="name">${escapeHtml(x.desc)}</div>
                <div class="sub">${escapeHtml(x.head)}</div>
              </div>
              <div class="right">
                <div style="font-weight:500">${inr(x.amount)}</div>
                <div class="muted" style="font-size:11px">${fmtDate(x.date)}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── Connect → SMS ───────────────────────────────────────────────
  P.renderSMS = function () {
    const k = window.state.kpis;
    const list = window.state.connect.smsHistory;
    const body = `
      <div class="page">
        <h2>SMS</h2>
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">SMS credits</div><div class="kpi-value">${k.smsCredits.toLocaleString()}</div></div>
          <div class="kpi"><div class="kpi-label">WhatsApp credits</div><div class="kpi-value">${k.whatsappCredits.toLocaleString()}</div></div>
        </div>
        <div class="section-h"><h3>Recent campaigns</h3></div>
        <div class="list">
          ${list.map((m) => `
            <div class="item">
              <div class="avatar" style="background:#ccfbf1;color:#0f766e">💬</div>
              <div class="meta">
                <div class="name">${escapeHtml(m.template)}</div>
                <div class="sub">${escapeHtml(m.to)}</div>
              </div>
              <div class="right">
                <div style="font-weight:500">${m.recipients}</div>
                <div class="muted" style="font-size:11px">${escapeHtml(m.sentAt)}</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── AI Insights — overview ──────────────────────────────────────
  P.renderAI = function () {
    const groups = ["Admissions", "SIS", "Finance", "Transport", "HR", "LMS", "Connect", "Library", "Hostel", "Cross"];
    const body = `
      <div class="page">
        <h2>✨ AI Insights</h2>
        <p class="muted">${window.LAKSHYA_AI_FEATURES.length} features. Some run fully on-device; others (LLM-powered) need a connection to your school's hosted server.</p>
        ${groups.map((g) => {
          const items = window.LAKSHYA_AI_FEATURES.filter((f) => f.group === g);
          if (items.length === 0) return "";
          return `
            <div class="section-h"><h3>${g}</h3></div>
            <div class="list">
              ${items.map((f) => {
                const dest = f.route ? `onclick="navigate('${f.route}')"` : `onclick="needsServer('${escapeHtml(f.label)}')"`;
                return `
                  <div class="item" ${dest}>
                    <div class="avatar" style="background:#fde68a;color:#b45309">✨</div>
                    <div class="meta">
                      <div class="name">${escapeHtml(f.label)}</div>
                      <div class="sub">${escapeHtml(f.desc)}</div>
                    </div>
                    <div class="right">${f.needsServer ? '<span class="badge badge-slate">Server</span>' : '<span class="badge badge-green">Local</span>'}</div>
                  </div>
                `;
              }).join("")}
            </div>
          `;
        }).join("")}
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  P.renderAILeadScoring = function () {
    const list = window.state.ai.leadScores;
    const body = `
      <div class="page">
        <h2>AI · Lead Scoring</h2>
        <p class="muted">Conversion probability per enquiry — re-rank only, counsellors keep their workflow.</p>
        <div class="list">
          ${list.map((l) => {
            const cls = l.band === "HIGH" ? "badge-green" : l.band === "MEDIUM" ? "badge-amber" : "badge-slate";
            return `
              <div class="item">
                <div class="avatar" style="background:#fde68a;color:#b45309">${Math.round(l.score*100)}</div>
                <div class="meta">
                  <div class="name">${escapeHtml(l.name)}</div>
                  <div class="sub">${escapeHtml(l.grade)} · ${escapeHtml(l.reason)}</div>
                </div>
                <div class="right"><span class="badge ${cls}">${l.band}</span></div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  P.renderAIAtRisk = function () {
    const list = window.state.ai.atRisk;
    const body = `
      <div class="page">
        <h2>AI · At-risk Students</h2>
        <p class="muted">Attendance, grades and concerns combined into a risk signal. Mentor still owns the action.</p>
        <div class="list">
          ${list.map((s) => `
            <div class="item">
              <div class="avatar" style="background:#fee2e2;color:#b91c1c">${Math.round(s.risk*100)}</div>
              <div class="meta">
                <div class="name">${escapeHtml(s.name)}</div>
                <div class="sub">${escapeHtml(s.class)} · ${escapeHtml(s.reason)}</div>
              </div>
              <div class="right"><span class="badge badge-red">HIGH</span></div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  P.renderAIDelinquency = function () {
    const list = window.state.ai.delinquency;
    const body = `
      <div class="page">
        <h2>AI · Fee Delinquency</h2>
        <p class="muted">Risk score per outstanding invoice. Suggested action — never automatic.</p>
        <div class="list">
          ${list.map((d) => {
            const cls = d.risk >= 0.66 ? "badge-red" : d.risk >= 0.33 ? "badge-amber" : "badge-slate";
            const action = d.risk >= 0.66 ? "Counsellor call + plan"
                      : d.risk >= 0.33 ? "Reminder on parent's preferred channel"
                      : "Standard reminder";
            return `
              <div class="item">
                <div class="avatar" style="background:#fee2e2;color:#b91c1c">${Math.round(d.risk*100)}</div>
                <div class="meta">
                  <div class="name">${escapeHtml(d.student)}</div>
                  <div class="sub">${inr(d.outstanding)} · ${d.overdue}d overdue · ${escapeHtml(action)}</div>
                </div>
                <div class="right"><span class="badge ${cls}">${d.risk >= 0.66 ? "HIGH" : d.risk >= 0.33 ? "MED" : "LOW"}</span></div>
              </div>
            `;
          }).join("")}
        </div>
      </div>
    `;
    document.getElementById("app").innerHTML = window.shell("/launcher", body);
  };

  // ─── "Needs server" prompt (used by launcher and AI catalog) ─────
  window.needsServer = function (featureName) {
    const url = (localStorage.getItem("lakshya_server_url") || "").trim();
    const m = document.createElement("div");
    m.className = "modal-back";
    m.innerHTML = `
      <div class="modal" onclick="event.stopPropagation()">
        <h3>${escapeHtml(featureName)} — connect first</h3>
        <p class="muted" style="font-size:13px;line-height:1.5">
          This module needs a connection to your school's hosted server.
          ${url ? `<br/>Configured server: <strong>${escapeHtml(url)}</strong>` : ""}
        </p>
        ${url ? `
          <button class="btn btn-primary btn-block" onclick="goToServer()">Open in school server</button>
          <button class="btn btn-secondary btn-block" style="margin-top:8px" onclick="closeModal()">Stay offline</button>
        ` : `
          <p class="muted" style="font-size:12px;margin:8px 0 12px">
            Set a server URL in Settings (Profile → School server URL) to enable this.
          </p>
          <button class="btn btn-primary btn-block" onclick="closeModal();navigate('#/profile')">Open Settings</button>
        `}
      </div>
    `;
    m.onclick = closeModal;
    document.body.appendChild(m);
  };
  window.goToServer = function () {
    const url = (localStorage.getItem("lakshya_server_url") || "").trim();
    if (!url) return;
    window.location.href = url;
  };
})();
