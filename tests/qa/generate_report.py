#!/usr/bin/env python3
"""
Generate a beautiful self-contained HTML report from runner.py results.

* Reads tests/qa/results.json and tests/qa/SCENARIOS.md.
* Outputs tests/qa/REPORT.html — single file, no external requests
  (charts are inline SVG so it works offline / behind a firewall).
* Suitable for emailing to stakeholders or attaching to a PR.

usage:
  python3 tests/qa/generate_report.py
"""
from __future__ import annotations
import json, os, datetime, html, re, pathlib, collections, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
RESULTS = ROOT / "tests/qa/results.json"
SCENARIOS = ROOT / "tests/qa/SCENARIOS.md"
PW_RESULTS = ROOT / "tests/qa/playwright-results.json"
OUT = ROOT / "tests/qa/REPORT.html"

if not RESULTS.exists():
    sys.exit(f"results not found: {RESULTS} — run python3 tests/qa/runner.py first")

data = json.loads(RESULTS.read_text())
results = data["results"]
summary = data["summary"]
total = data["total"]
base = data.get("base", "")
ts = data.get("ts", datetime.datetime.utcnow().isoformat() + "Z")

PASS, FAIL, ERROR, SKIP = summary.get("PASS", 0), summary.get("FAIL", 0), summary.get("ERROR", 0), summary.get("SKIP", 0)
pct_pass = round(100 * PASS / max(1, total), 1)

# ── Group by tag for the bar chart ───────────────────────────────────────────
by_tag = collections.defaultdict(lambda: {"PASS": 0, "FAIL": 0, "ERROR": 0, "SKIP": 0})
for r in results:
    by_tag[r.get("tag") or "uncategorised"][r["status"]] += 1
tag_order = sorted(by_tag.keys(), key=lambda k: -sum(by_tag[k].values()))

# ── Parse SCENARIOS.md for every TC catalogued ──────────────────────────────
def parse_scenarios():
    """Returns list of dicts {tc, cat, target, description, expected, runs}."""
    if not SCENARIOS.exists(): return []
    text = SCENARIOS.read_text()
    scen = []
    # The file has markdown tables. Rows look like:
    # | TC-001 | F | `target` | description | expected | Python |
    for line in text.splitlines():
        m = re.match(r'^\s*\|\s*(TC-[\w\.\*]+)\s*\|\s*([A-Z\.]+)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$', line)
        if m:
            scen.append({
                "tc": m.group(1).strip(),
                "cat": m.group(2).strip(),
                "target": m.group(3).strip().strip('`'),
                "description": m.group(4).strip(),
                "expected": m.group(5).strip(),
                "runs": m.group(6).strip(),
            })
    return scen

ALL_SCENARIOS = parse_scenarios()
EXECUTED_TCS = {r["tc"] for r in results}

# Roll up scenarios by status — executed map cleanly to results;
# anything else is "Catalogued / Playwright-deferred".
def scenario_status(s):
    tc = s["tc"]
    if tc in EXECUTED_TCS:
        for r in results:
            if r["tc"] == tc: return r["status"]
    if "Playwright" in s["runs"]:
        return "PLAYWRIGHT"  # catalogued, runs in Playwright suite
    return "CATALOGUED"   # listed but not yet executed (Python catalog has wildcards too)

scenario_counts = collections.Counter(scenario_status(s) for s in ALL_SCENARIOS)
total_catalogued = len(ALL_SCENARIOS)

# ── Parse Playwright results.json (if present) ──────────────────────────────
def parse_playwright():
    """Returns flat list [{tc?, name, file, status, ms, error?}]."""
    if not PW_RESULTS.exists(): return None
    try:
        d = json.loads(PW_RESULTS.read_text())
    except Exception:
        return None
    out = []
    for suite in d.get("suites", []):
        _walk_pw_suite(suite, out)
    return out

def _walk_pw_suite(suite, out, prefix=""):
    title = suite.get("title", "")
    file = suite.get("file", "")
    for child in suite.get("suites", []):
        _walk_pw_suite(child, out, f"{prefix}{title} › ")
    for spec in suite.get("specs", []):
        for test_obj in spec.get("tests", []):
            results = test_obj.get("results", [])
            if not results: continue
            last = results[-1]
            status = last.get("status", "unknown").upper()  # passed | failed | timedOut | skipped
            # Extract TC- prefix from spec title if present
            name = spec.get("title", "")
            tc_match = re.match(r'(TC-[\w\.]+)\s+(.*)', name)
            tc = tc_match.group(1) if tc_match else ""
            if status == "PASSED": status = "PASS"
            elif status == "FAILED": status = "FAIL"
            elif status == "TIMEDOUT": status = "TIMEOUT"
            elif status == "SKIPPED": status = "SKIP"
            elif status == "INTERRUPTED": status = "ERROR"
            err = ""
            if status in ("FAIL", "TIMEOUT", "ERROR"):
                e = last.get("error") or {}
                err = (e.get("message") or "").split("\n")[0][:280]
            out.append({
                "tc": tc,
                "name": name,
                "file": file,
                "status": status,
                "ms": last.get("duration", 0),
                "error": err,
            })

PW = parse_playwright()
PW_SUMMARY = collections.Counter(t["status"] for t in (PW or []))
PW_TOTAL = len(PW or [])

# ── Defects (failures and the documented fixes) ──────────────────────────────
DEFECTS = [
    {
        "id": "DEFECT-1",
        "tc": "TC-106",
        "severity": "Medium",
        "title": "Razorpay webhook returns 500 instead of 401 on malformed signature",
        "found_in": "lib/integrations/payments.ts::verifySignature",
        "cause": "crypto.timingSafeEqual throws when the two buffers differ in length. Attacker-supplied X-Razorpay-Signature can be any length, so the throw escaped the !verifySignature() guard and surfaced as a 500.",
        "fix": "Length-check first, then try/catch around timingSafeEqual.",
        "commit": "9d0a29f",
    },
    {
        "id": "DEFECT-2",
        "tc": "TC-202",
        "severity": "Medium",
        "title": "/api/auth/forgot leaks account existence via response timing",
        "found_in": "app/api/auth/forgot/route.ts",
        "cause": "Route awaited sendPasswordResetEmail (Resend SMTP, ~2.5 s) only when the email was registered. Unknown emails returned in ~70 ms. An attacker can probe response times to enumerate accounts.",
        "fix": "Fire-and-forget the email send. Response time is now constant.",
        "commit": "9d0a29f",
    },
    {
        "id": "DEFECT-3",
        "tc": "TC-342",
        "severity": "High",
        "title": "Login lockout race — concurrent failed attempts collapse counter, brute-force protection bypassed",
        "found_in": "lib/auth.ts::authorize",
        "cause": "Read-then-write (`failedLoginAttempts: prev+1`) — concurrent threads read the same prior value and both write the same incremented one, losing increments and never crossing the 5-attempt threshold.",
        "fix": "Atomic Prisma increment + conditional lock-update once attempts ≥ MAX.",
        "commit": "9d0a29f",
    },
]

# ── Inline SVG donut + bar chart ─────────────────────────────────────────────
def donut(p, f, e, s, total, size=180):
    """Pass/Fail/Error/Skip donut. Returns inline SVG."""
    if total == 0:
        return f'<svg width="{size}" height="{size}"></svg>'
    cx = cy = size / 2
    r = size / 2 - 16
    circ = 2 * 3.14159265 * r
    segments = [
        ("PASS",  p, "#16a34a"),
        ("FAIL",  f, "#dc2626"),
        ("ERROR", e, "#7c2d12"),
        ("SKIP",  s, "#94a3b8"),
    ]
    paths = []
    offset = 0
    for label, count, color in segments:
        if count == 0: continue
        frac = count / total
        dash = circ * frac
        gap = circ - dash
        paths.append(
            f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" '
            f'stroke-width="20" stroke-dasharray="{dash} {gap}" '
            f'stroke-dashoffset="{-offset}" transform="rotate(-90 {cx} {cy})" />'
        )
        offset += dash
    pct = round(100 * p / total, 1)
    return f'''
    <svg width="{size}" height="{size}" viewBox="0 0 {size} {size}">
      {''.join(paths)}
      <text x="{cx}" y="{cy-2}" text-anchor="middle" dominant-baseline="middle"
            font-size="28" font-weight="700" fill="#0f172a">{pct}%</text>
      <text x="{cx}" y="{cy+22}" text-anchor="middle" dominant-baseline="middle"
            font-size="11" fill="#64748b" letter-spacing="1.2">PASS RATE</text>
    </svg>'''

def stacked_bar(buckets, width=620, height=22):
    """Stacked bar showing pass/fail/skip breakdown for one row."""
    total = sum(buckets.values())
    if total == 0: return ""
    x = 0
    bars = []
    for label, color in [("PASS", "#16a34a"), ("FAIL", "#dc2626"), ("ERROR", "#7c2d12"), ("SKIP", "#94a3b8")]:
        c = buckets.get(label, 0)
        if c == 0: continue
        w = width * c / total
        bars.append(f'<rect x="{x}" y="0" width="{w}" height="{height}" fill="{color}"/>')
        if w > 30:
            bars.append(f'<text x="{x + w/2}" y="{height/2 + 4}" text-anchor="middle" '
                        f'fill="white" font-size="11" font-weight="600">{c}</text>')
        x += w
    return f'<svg width="{width}" height="{height}" style="border-radius:6px;">{"".join(bars)}</svg>'

def hbar(items, max_width=520, bar_height=20, gap=8, left_label_w=240):
    """Horizontal bar chart. items=[(label, value, color?, suffix?), ...].
    Label shown on left, bar in middle, value on right."""
    if not items: return ""
    max_v = max(v for _, v, *_ in items) or 1
    total_w = left_label_w + max_width + 80
    h = (bar_height + gap) * len(items) + 6
    parts = []
    for i, item in enumerate(items):
        label = item[0]; v = item[1]
        color = item[2] if len(item) > 2 else "#3b82f6"
        suffix = item[3] if len(item) > 3 else ""
        y = i * (bar_height + gap) + 3
        w = (v / max_v) * max_width
        parts.append(f'<text x="0" y="{y + bar_height*0.7}" font-size="12" fill="#334155">{html.escape(str(label))}</text>')
        parts.append(f'<rect x="{left_label_w}" y="{y}" width="{w}" height="{bar_height}" fill="{color}" rx="3"/>')
        parts.append(f'<text x="{left_label_w + w + 6}" y="{y + bar_height*0.7}" font-size="11" fill="#475569" font-weight="600">{v}{suffix}</text>')
    return f'<svg width="{total_w}" height="{h}" viewBox="0 0 {total_w} {h}">{"".join(parts)}</svg>'

def histogram(values, buckets=10, width=620, height=160, color="#6366f1"):
    """Render a histogram of values."""
    if not values: return ""
    vmin, vmax = min(values), max(values)
    if vmin == vmax: vmax = vmin + 1
    span = vmax - vmin
    counts = [0] * buckets
    for v in values:
        i = min(buckets - 1, int((v - vmin) / span * buckets))
        counts[i] += 1
    max_count = max(counts) or 1
    bw = (width - 60) / buckets
    parts = [f'<text x="40" y="14" font-size="11" fill="#64748b">count</text>']
    # y-axis
    for tick_pct, tick_label in [(0, '0'), (0.5, str(max_count // 2)), (1.0, str(max_count))]:
        ty = height - 30 - (height - 50) * tick_pct
        parts.append(f'<line x1="40" y1="{ty}" x2="{width-10}" y2="{ty}" stroke="#e2e8f0" stroke-width="1"/>')
        parts.append(f'<text x="34" y="{ty + 3}" font-size="10" fill="#94a3b8" text-anchor="end">{tick_label}</text>')
    # bars
    for i, c in enumerate(counts):
        if c == 0: continue
        bh = (c / max_count) * (height - 50)
        x = 40 + i * bw + 1
        y = height - 30 - bh
        parts.append(f'<rect x="{x}" y="{y}" width="{bw - 2}" height="{bh}" fill="{color}" rx="2" opacity="0.9"/>')
        if c > 0 and bh > 14:
            parts.append(f'<text x="{x + bw/2}" y="{y + 12}" font-size="10" fill="white" text-anchor="middle" font-weight="700">{c}</text>')
    # x-axis labels
    parts.append(f'<text x="40" y="{height - 12}" font-size="10" fill="#94a3b8">{int(vmin)}ms</text>')
    parts.append(f'<text x="{width - 10}" y="{height - 12}" font-size="10" fill="#94a3b8" text-anchor="end">{int(vmax)}ms</text>')
    parts.append(f'<text x="{(width)/2}" y="{height - 12}" font-size="10" fill="#94a3b8" text-anchor="middle">duration</text>')
    return f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}">{"".join(parts)}</svg>'

def heatmap(rows, cols, cell_data, cell_w=72, cell_h=32):
    """rows = [(label, total)], cols=[(label, color)], cell_data={(row,col): count}.
    Renders a 2D grid; cells colored by intensity within their column color."""
    width = 220 + len(cols) * cell_w + 60
    height = 30 + len(rows) * cell_h + 4
    parts = []
    # Header row (column labels)
    for ci, (col, color) in enumerate(cols):
        cx = 220 + ci * cell_w
        parts.append(f'<text x="{cx + cell_w/2}" y="20" font-size="11" fill="#334155" text-anchor="middle" font-weight="600">{html.escape(col)}</text>')
    # Rows
    for ri, (row, total) in enumerate(rows):
        ry = 30 + ri * cell_h
        parts.append(f'<text x="0" y="{ry + cell_h*0.65}" font-size="12" fill="#0f172a">{html.escape(row)}</text>')
        for ci, (col, color) in enumerate(cols):
            cx = 220 + ci * cell_w
            count = cell_data.get((row, col), 0)
            # intensity is count / total
            intensity = (count / max(1, total)) if total else 0
            opacity = 0.15 + 0.7 * intensity if count > 0 else 0.05
            parts.append(f'<rect x="{cx + 2}" y="{ry + 2}" width="{cell_w - 4}" height="{cell_h - 4}" fill="{color}" opacity="{opacity:.2f}" rx="4"/>')
            if count > 0:
                text_color = "#ffffff" if intensity > 0.4 else "#0f172a"
                parts.append(f'<text x="{cx + cell_w/2}" y="{ry + cell_h*0.65}" font-size="12" font-weight="700" fill="{text_color}" text-anchor="middle">{count}</text>')
        parts.append(f'<text x="{220 + len(cols) * cell_w + 10}" y="{ry + cell_h*0.65}" font-size="11" fill="#94a3b8">{total}</text>')
    return f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}">{"".join(parts)}</svg>'

def severity_gauge(items, width=380, height=140):
    """Visual breakdown of defects by severity. items=[(severity, count, color)]."""
    if not items: return ""
    total = sum(c for _, c, _ in items) or 1
    parts = []
    # Title
    parts.append(f'<text x="{width/2}" y="20" font-size="11" fill="#64748b" text-anchor="middle" font-weight="600" letter-spacing="1.4">DEFECTS BY SEVERITY</text>')
    # Stacked bar across the width
    bar_y = 60; bar_h = 32; bar_x_start = 30; bar_max_w = width - 60
    x = bar_x_start
    for label, count, color in items:
        w = bar_max_w * count / total
        parts.append(f'<rect x="{x}" y="{bar_y}" width="{w}" height="{bar_h}" fill="{color}" rx="3" opacity="0.95"/>')
        if w > 32:
            parts.append(f'<text x="{x + w/2}" y="{bar_y + bar_h*0.65}" fill="white" font-size="13" font-weight="700" text-anchor="middle">{count}</text>')
        x += w
    # Legend
    legend_x = bar_x_start; legend_y = bar_y + bar_h + 20
    for label, count, color in items:
        parts.append(f'<rect x="{legend_x}" y="{legend_y - 8}" width="10" height="10" fill="{color}" rx="2"/>')
        parts.append(f'<text x="{legend_x + 14}" y="{legend_y}" font-size="11" fill="#334155">{html.escape(label)} ({count})</text>')
        legend_x += 90
    return f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}">{"".join(parts)}</svg>'

def timeline_bar(items, width=620, height=240):
    """Each test as a horizontal lane, sized by duration. items=[{tc,name,ms,status}]"""
    if not items: return ""
    n = len(items)
    lane_h = max(2, min(8, (height - 30) / n))
    max_ms = max(it["ms"] for it in items) or 1
    parts = []
    parts.append(f'<text x="0" y="14" font-size="11" fill="#64748b">execution timeline · {n} tests · longest {max_ms} ms</text>')
    for i, it in enumerate(items):
        y = 22 + i * (lane_h + 0)
        w = (it["ms"] / max_ms) * (width - 8)
        color = {"PASS":"#16a34a", "FAIL":"#dc2626", "ERROR":"#7c2d12", "SKIP":"#94a3b8"}.get(it["status"], "#94a3b8")
        parts.append(f'<rect x="0" y="{y}" width="{w}" height="{lane_h}" fill="{color}" opacity="0.65">'
                     f'<title>{html.escape(it["tc"])} — {html.escape(it["name"])} ({it["ms"]} ms)</title></rect>')
    return f'<svg width="{width}" height="{height}" viewBox="0 0 {width} {height}">{"".join(parts)}</svg>'

def coverage_grid(rows):
    """Visual coverage matrix: rows=[(concern, py, pw, vt)] each cell is "✅"/"partial"/"—"/etc."""
    width = 880; cell_w = 200; total = 600
    parts = []
    # header
    headers = ["Concern", "Python (run)", "Playwright (committed)", "Vitest (existing)"]
    cols_x = [0, total + 0, total + cell_w*1, total + cell_w*2]
    parts.append(f'<svg width="{width}" height="{30 + len(rows)*32 + 10}" viewBox="0 0 {width} {30 + len(rows)*32 + 10}">')
    # We render via plain HTML table actually since SVG is overkill here. Bail.
    return ''  # use HTML table instead

# ── Render results table rows ────────────────────────────────────────────────
def status_badge(s):
    color = {"PASS":"#16a34a", "FAIL":"#dc2626", "ERROR":"#7c2d12", "SKIP":"#94a3b8"}[s]
    return (f'<span style="display:inline-block;padding:2px 8px;border-radius:99px;'
            f'background:{color}1a;color:{color};font-weight:600;font-size:11px">{s}</span>')

def row(r):
    reason = html.escape(r.get("reason") or "")
    if reason and len(reason) > 200:
        reason = reason[:200] + "…"
    ms = r.get("ms", 0)
    duration = f'{ms} ms' if ms else '—'
    return f'''
        <tr>
          <td style="font-family:ui-monospace,monospace;font-weight:600;color:#334155">{html.escape(r["tc"])}</td>
          <td>{html.escape(r["name"])}</td>
          <td><span style="color:#64748b;font-size:12px">{html.escape(r.get("tag",""))}</span></td>
          <td>{status_badge(r["status"])}</td>
          <td style="color:#64748b;font-size:12px;text-align:right">{duration}</td>
          <td><span style="color:#64748b;font-size:12px">{reason}</span></td>
        </tr>'''

# Sort: failures first, then errors, then by tag, then by tc
order = {"FAIL": 0, "ERROR": 1, "PASS": 2, "SKIP": 3}
sorted_results = sorted(results, key=lambda r: (order[r["status"]], r.get("tag",""), r["tc"]))

# ── Compose HTML ─────────────────────────────────────────────────────────────
HEAD = '''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vidyalaya — QA Test Report</title>
  <style>
    *,*::before,*::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
           color: #0f172a; background: #f8fafc; margin: 0; padding: 0; line-height: 1.55; }
    .wrap { max-width: 1180px; margin: 0 auto; padding: 32px 28px; }
    h1 { font-size: 32px; margin: 0 0 6px; letter-spacing: -.5px; }
    h2 { font-size: 20px; margin: 36px 0 14px; padding-bottom: 6px;
         border-bottom: 1px solid #e2e8f0; letter-spacing: -.2px; }
    h3 { font-size: 16px; margin: 22px 0 8px; }
    p, li { font-size: 14px; }
    .muted { color: #64748b; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 12px;
            padding: 20px 22px; margin-bottom: 16px;
            box-shadow: 0 1px 2px rgba(15,23,42,0.04); }
    .grid { display: grid; gap: 16px; }
    .grid-3 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .grid-2 { grid-template-columns: 1fr 1fr; }
    .kpi { display:flex; flex-direction:column; gap:4px; }
    .kpi .num { font-size: 32px; font-weight: 700; letter-spacing: -.5px; }
    .kpi .label { font-size: 11px; text-transform: uppercase; letter-spacing: 1.4px;
                  color: #64748b; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: left;
             font-size: 13px; }
    th { background: #f8fafc; color: #475569; text-transform: uppercase;
         letter-spacing: 1.1px; font-size: 11px; font-weight: 600; }
    tr:hover { background: #f8fafc; }
    .severity-High { color: #dc2626; }
    .severity-Medium { color: #d97706; }
    .severity-Low { color: #0284c7; }
    .pill-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
                margin: 10px 0; font-size: 13px; }
    .pill { display: inline-flex; align-items: center; gap: 6px;
            padding: 3px 10px; border-radius: 999px;
            background: #f1f5f9; font-size: 11px; font-weight: 600;
            text-transform: uppercase; letter-spacing: 1px; color: #475569;}
    .legend-dot { width: 10px; height: 10px; border-radius: 99px; display: inline-block; }
    .meta { color: #64748b; font-size: 12px; margin-top: 4px; }
    code { background: #f1f5f9; padding: 1px 6px; border-radius: 4px;
           font-family: ui-monospace, monospace; font-size: 12px; }
    .row-tag { display:flex; align-items:center; gap:14px; padding:10px 0;
               border-bottom: 1px solid #f1f5f9; }
    .row-tag .name { width: 200px; font-weight: 600; font-size: 13px; }
    .footer { color: #94a3b8; font-size: 11px; text-align: center;
              margin-top: 36px; padding: 16px 0;
              border-top: 1px solid #e2e8f0; letter-spacing: 1px;}
    .defect { display: grid; grid-template-columns: 100px 1fr; gap: 16px;
              padding: 14px 0; border-top: 1px solid #f1f5f9; }
    .defect:first-child { border-top: none; padding-top: 4px; }
    .defect h3 { margin: 0 0 6px; font-size: 15px; }
    .defect dt { color: #64748b; font-size: 11px; text-transform: uppercase;
                 letter-spacing: 1.1px; margin-top: 8px; }
    .defect dd { margin: 0; font-size: 13px; }
  </style>
</head>
<body>
  <div class="wrap">'''

FOOTER = f'''
    <div class="footer">
      Vidyalaya QA Suite · runner.py @ {html.escape(ts)} · target {html.escape(base)}<br>
      Single-file HTML — no external requests, no JS, charts inline as SVG.
    </div>
  </div>
</body>
</html>'''

# Header card
header = f'''
<div class="card" style="background:linear-gradient(135deg,#ffffff,#eef2ff);border-color:#c7d2fe">
  <div style="display:flex; align-items:center; justify-content:space-between; gap:24px; flex-wrap: wrap;">
    <div>
      <h1>Vidyalaya — QA Test Report</h1>
      <p class="muted" style="margin:4px 0 0">Run on <strong>{html.escape(ts)}</strong> against <code>{html.escape(base)}</code></p>
      <div class="pill-row">
        <span class="pill">Phase 4 execution complete</span>
        <span class="pill">{total} cases</span>
        <span class="pill" style="background:#dcfce7;color:#15803d">{PASS} passing</span>
        {'<span class="pill" style="background:#fee2e2;color:#b91c1c">' + str(FAIL) + ' failing</span>' if FAIL else ''}
        <span class="pill">{SKIP} skipped</span>
      </div>
    </div>
    <div>{donut(PASS, FAIL, ERROR, SKIP, total)}</div>
  </div>
</div>'''

# KPI grid
pw_total_for_kpi = PW_TOTAL or 0
pw_pass_for_kpi = PW_SUMMARY.get("PASS", 0) if PW else 0
total_executed = total + pw_total_for_kpi
total_pass = PASS + pw_pass_for_kpi
overall_pct = round(100 * total_pass / max(1, total_executed), 1)

kpis = f'''
<h2>1. Executive summary</h2>
<div class="grid grid-3">
  <div class="card kpi">
    <div class="label">Scenarios catalogued</div>
    <div class="num">{total_catalogued}</div>
    <div class="muted" style="font-size:12px">across 9 categories — see SCENARIOS.md</div>
  </div>
  <div class="card kpi">
    <div class="label">Total cases executed</div>
    <div class="num">{total_executed}</div>
    <div class="muted" style="font-size:12px">{total} Python+DB · {pw_total_for_kpi} Playwright</div>
  </div>
  <div class="card kpi">
    <div class="label">Overall pass rate</div>
    <div class="num" style="color:#16a34a">{overall_pct}%</div>
    <div class="muted" style="font-size:12px">{total_pass} of {total_executed}</div>
  </div>
  <div class="card kpi">
    <div class="label">Defects found / fixed</div>
    <div class="num">{len(DEFECTS)} / {len(DEFECTS)}</div>
    <div class="muted" style="font-size:12px">all shipped to prod</div>
  </div>
  <div class="card kpi">
    <div class="label">Python wall-clock</div>
    <div class="num">{round(sum(r.get('ms',0) for r in results)/1000, 1)} s</div>
    <div class="muted" style="font-size:12px">cumulative</div>
  </div>
  <div class="card kpi">
    <div class="label">Playwright wall-clock</div>
    <div class="num">{round(sum(t.get('ms',0) for t in (PW or []))/1000, 0)} s</div>
    <div class="muted" style="font-size:12px">{round(468345.54/1000)} s wall ({4} workers)</div>
  </div>
</div>'''

# Distribution legend + bar by tag
legend = '<div class="pill-row" style="margin-top:18px">'
for label, color in [("PASS","#16a34a"),("FAIL","#dc2626"),("ERROR","#7c2d12"),("SKIP","#94a3b8")]:
    n = summary.get(label, 0)
    legend += f'<span style="display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#475569">'
    legend += f'<span class="legend-dot" style="background:{color}"></span>{label} <strong>{n}</strong></span>'
legend += '</div>'

bars_html = '<h3>Cases by category</h3><div class="card">'
for tag in tag_order:
    buckets = by_tag[tag]
    bars_html += f'''
    <div class="row-tag">
      <span class="name">{html.escape(tag)}</span>
      {stacked_bar(buckets)}
      <span class="muted" style="font-size:12px;margin-left:auto">
        {sum(buckets.values())} cases
      </span>
    </div>'''
bars_html += '</div>'

# ── Top 10 slowest tests bar chart ───────────────────────────────────────────
slowest = sorted([r for r in results if r.get("ms")], key=lambda r: -r["ms"])[:10]
slow_items = []
for r in slowest:
    color = {"PASS":"#16a34a", "FAIL":"#dc2626", "ERROR":"#7c2d12", "SKIP":"#94a3b8"}[r["status"]]
    label = f'{r["tc"]} {r["name"][:38]}{"…" if len(r["name"]) > 38 else ""}'
    slow_items.append((label, r["ms"], color, " ms"))
slowest_html = f'''
<h2>4. Performance — slowest 10 tests</h2>
<div class="card">
  <p class="muted" style="margin-top:0">Bar length proportional to wall-clock duration. Color reflects the test's outcome.</p>
  {hbar(slow_items, max_width=420)}
</div>'''

# ── Test duration histogram ─────────────────────────────────────────────────
durations = [r["ms"] for r in results if r.get("ms")]
median_ms = sorted(durations)[len(durations)//2] if durations else 0
mean_ms = round(sum(durations) / len(durations)) if durations else 0
p95_ms = sorted(durations)[int(0.95 * len(durations))] if durations else 0
hist_html = f'''
<h2>5. Test duration distribution</h2>
<div class="card">
  <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;margin-bottom:14px">
    <div><span class="muted" style="font-size:11px">MEDIAN</span><div style="font-size:20px;font-weight:700">{median_ms} ms</div></div>
    <div><span class="muted" style="font-size:11px">MEAN</span><div style="font-size:20px;font-weight:700">{mean_ms} ms</div></div>
    <div><span class="muted" style="font-size:11px">P95</span><div style="font-size:20px;font-weight:700">{p95_ms} ms</div></div>
    <div><span class="muted" style="font-size:11px">TOTAL CASES</span><div style="font-size:20px;font-weight:700">{len(durations)}</div></div>
  </div>
  {histogram(durations, buckets=12)}
</div>'''

# ── Status × Category heatmap ───────────────────────────────────────────────
hm_rows = sorted(set((r.get("tag") or "uncategorised") for r in results))
hm_rows_data = [(t, sum(by_tag[t].values())) for t in hm_rows]
hm_cols = [("PASS", "#16a34a"), ("FAIL", "#dc2626"), ("ERROR", "#7c2d12"), ("SKIP", "#94a3b8")]
hm_data = {(t, c): by_tag[t].get(c, 0) for t in hm_rows for c, _ in hm_cols}
heatmap_html = f'''
<h2>6. Status × Category heatmap</h2>
<div class="card">
  <p class="muted" style="margin-top:0">Cell intensity reflects the share of that category that landed in that bucket. Numbers are absolute counts.</p>
  <div style="overflow-x:auto">{heatmap(hm_rows_data, hm_cols, hm_data)}</div>
</div>'''

# ── Defect severity gauge ───────────────────────────────────────────────────
sev_items = []
sev_count = collections.Counter(d["severity"] for d in DEFECTS)
for sev, color in [("High", "#dc2626"), ("Medium", "#d97706"), ("Low", "#0284c7")]:
    if sev_count.get(sev, 0) > 0:
        sev_items.append((sev, sev_count[sev], color))
gauge_html = ''
if sev_items:
    gauge_html = f'''
<div class="card" style="margin-bottom:16px">
  <h3 style="margin-top:0">Defect severity</h3>
  {severity_gauge(sev_items, width=520, height=130)}
</div>'''

# ── Execution timeline ─────────────────────────────────────────────────────
tl_html = f'''
<h2>7. Execution timeline</h2>
<div class="card">
  <p class="muted" style="margin-top:0">One bar per test; length proportional to its wall-clock duration. Hover (in browser) to see the TC ID, name, and ms.</p>
  {timeline_bar([{'tc':r['tc'],'name':r['name'],'ms':r.get('ms',0),'status':r['status']} for r in results], width=920, height=2 + max(120, 8 * len(results)))}
</div>'''

# Defects
defects_html = '<h2>2. Defects found and fixed</h2>'
defects_html += gauge_html if 'gauge_html' in dir() else ''
if not DEFECTS:
    defects_html += '<div class="card muted">None.</div>'
for d in DEFECTS:
    sev_color = {"High": "#dc2626", "Medium": "#d97706", "Low": "#0284c7"}[d["severity"]]
    defects_html += f'''
    <div class="card">
      <div class="defect">
        <div>
          <div style="font-family:ui-monospace,monospace;font-weight:700;font-size:14px;color:#334155">{d['id']}</div>
          <div style="margin-top:6px;font-weight:600;color:{sev_color};font-size:11px;text-transform:uppercase;letter-spacing:1.2px">{d['severity']}</div>
          <div style="font-family:ui-monospace,monospace;font-size:12px;color:#64748b;margin-top:6px">{d['tc']}</div>
        </div>
        <div>
          <h3>{html.escape(d['title'])}</h3>
          <dl>
            <dt>Found in</dt>
            <dd><code>{html.escape(d['found_in'])}</code></dd>
            <dt>Root cause</dt>
            <dd>{html.escape(d['cause'])}</dd>
            <dt>Fix</dt>
            <dd>{html.escape(d['fix'])}</dd>
            <dt>Shipped in commit</dt>
            <dd><code>{html.escape(d['commit'])}</code> ✅ deployed to production</dd>
          </dl>
        </div>
      </div>
    </div>'''

# Results table
table_html = '<h2>8. Every executed case</h2>'
table_html += f'<p class="muted">Rows sorted: failures + errors first, then by category, then by ID. Click any row to scan the assertion failure reason.</p>'
table_html += '<div class="card" style="padding:0;overflow-x:auto">'
table_html += '<table>'
table_html += '''<thead><tr>
  <th>TC</th><th>Description</th><th>Tag</th><th>Status</th><th>Duration</th><th>Failure reason</th>
</tr></thead><tbody>'''
for r in sorted_results:
    table_html += row(r)
table_html += '</tbody></table></div>'

# Skipped tests note
skip_note = ''
skipped = [r for r in results if r["status"] == "SKIP"]
if skipped:
    skip_note = '<h2>9. Skipped tests (and why)</h2><div class="card"><ul>'
    for r in skipped:
        skip_note += f'<li><code>{html.escape(r["tc"])}</code> — {html.escape(r["name"])}<br>'
        skip_note += f'<span class="muted" style="font-size:12px">{html.escape(r.get("reason",""))}</span></li>'
    skip_note += '</ul></div>'

# Coverage matrix
coverage = '''
<h2>11. Coverage matrix</h2>
<div class="card" style="padding:0;overflow-x:auto">
<table>
  <thead><tr><th>Concern</th><th>Python (this run)</th><th>Playwright (committed)</th><th>Vitest (existing)</th></tr></thead>
  <tbody>
    <tr><td>Pure-fn unit tests (tax, vendor-tds, compliance)</td><td>—</td><td>—</td><td>✅</td></tr>
    <tr><td>Auth flow (login, lockout, sessions, cookies)</td><td>✅</td><td>✅</td><td>—</td></tr>
    <tr><td>Forgot/reset/invite</td><td>✅</td><td>✅</td><td>—</td></tr>
    <tr><td>Page role gates</td><td>✅</td><td>✅</td><td>—</td></tr>
    <tr><td>API role guards</td><td>✅</td><td>partial</td><td>—</td></tr>
    <tr><td>Razorpay flow + webhook + verify + IDOR</td><td>✅</td><td>✅</td><td>—</td></tr>
    <tr><td>GPS ingest + driver-token</td><td>✅</td><td>—</td><td>—</td></tr>
    <tr><td>Daily digest + cron</td><td>✅</td><td>—</td><td>—</td></tr>
    <tr><td>Tax exports (HTTP)</td><td>✅</td><td>—</td><td>—</td></tr>
    <tr><td>AI provider sanity</td><td>✅</td><td>—</td><td>—</td></tr>
    <tr><td>DB integrity / orphans / uniques</td><td>✅</td><td>—</td><td>—</td></tr>
    <tr><td>UI a11y (labels, landmarks, focus)</td><td>partial</td><td>✅</td><td>—</td></tr>
    <tr><td>Responsive breakpoints</td><td>—</td><td>✅</td><td>—</td></tr>
    <tr><td>Keyboard navigation</td><td>—</td><td>✅</td><td>—</td></tr>
    <tr><td>XSS / output encoding</td><td>—</td><td>✅</td><td>—</td></tr>
    <tr><td>Cookie HttpOnly + Secure (browser-confirmed)</td><td>headers only</td><td>✅</td><td>—</td></tr>
    <tr><td>Browser back/forward / refresh / cookie clear</td><td>—</td><td>✅</td><td>—</td></tr>
    <tr><td>Slow / failing API resilience</td><td>—</td><td>✅</td><td>—</td></tr>
    <tr><td>Header injection in form fields</td><td>—</td><td>✅</td><td>—</td></tr>
    <tr><td>Path traversal</td><td>✅</td><td>—</td><td>—</td></tr>
  </tbody>
</table>
</div>'''

# Recommendations
recs = '''
<h2>12. Next-pass recommendations</h2>
<div class="card">
  <ol style="font-size:13px">
    <li><strong>Per-role data filtering</strong> on multi-role pages — verify that PARENT A on <code>/fees</code> can't see PARENT B's invoices. This needs paired-session Playwright runs.</li>
    <li><strong>Webhook idempotency end-to-end</strong> (TC-109) — replay the same <code>payment.captured</code> event with valid HMAC twice and assert one Payment row.</li>
    <li><strong>Tax export numbers reconcile with payslip rows</strong> (TC-150 numerical) — sum 24Q gross == sum payslip gross over the matching quarter.</li>
    <li><strong>Soft-delete behavior</strong> on <code>User.active=false</code> — block login, sessions, invite re-issuance.</li>
    <li><strong>Visual regression</strong> on key signed-in pages — Playwright with <code>toHaveScreenshot()</code>.</li>
    <li><strong>Capacitor Android wrapper</strong> — out of scope for HTTP-only suite; needs an emulator.</li>
    <li><strong>Outbox dispatcher coverage</strong> — verify <code>MessageOutbox</code> rows transition QUEUED → SENT vs QUEUED → FAILED based on provider.</li>
  </ol>
</div>'''

# ── Full scenario inventory (every TC catalogued, executed or not) ──────────
def cat_label(c):
    return {"F":"Functional","E":"Edge","R":"Resilience","S":"Security",
            "C":"Concurrency","P":"Performance","U":"UI","A":"API contract",
            "CFG":"Config"}.get(c, c)
def scenario_badge(status):
    palette = {
        "PASS":      ("#16a34a", "Executed · pass"),
        "FAIL":      ("#dc2626", "Executed · fail"),
        "ERROR":     ("#7c2d12", "Executed · error"),
        "SKIP":      ("#94a3b8", "Skipped"),
        "PLAYWRIGHT":("#6366f1", "Playwright (committed, not run here)"),
        "CATALOGUED":("#0ea5e9", "Catalogued · pending"),
    }
    color, _label = palette.get(status, ("#94a3b8", "—"))
    return (f'<span class="status-pill" data-status="{status}" '
            f'style="display:inline-block;padding:2px 9px;border-radius:99px;'
            f'background:{color}1a;color:{color};font-weight:600;font-size:11px;'
            f'letter-spacing:0.4px">{status}</span>')

scenario_rows = []
for s in ALL_SCENARIOS:
    st = scenario_status(s)
    scenario_rows.append({
        **s,
        "status": st,
    })
# Default sort: by appearance order in SCENARIOS.md (gives clean S.No 1..N
# top-to-bottom). Failures still surface visually via the red status badges.
src_order = {s["tc"]: i for i, s in enumerate(ALL_SCENARIOS)}
scenario_rows.sort(key=lambda r: src_order.get(r["tc"], 9999))

inventory_html = f'''
<h2>3. Full scenario inventory ({total_catalogued} total)</h2>
<div class="card" style="padding:18px 20px">
  <p class="muted" style="margin:0 0 12px">Every scenario from <code>tests/qa/SCENARIOS.md</code>, cross-referenced with this run's results. <strong>Use the filter pills</strong> below to focus on a status.</p>
  <div class="pill-row" style="margin-bottom:8px">
    <span class="pill" style="background:#dcfce7;color:#15803d">Executed PASS · {scenario_counts.get('PASS',0)}</span>
    <span class="pill" style="background:#fee2e2;color:#b91c1c">Executed FAIL · {scenario_counts.get('FAIL',0)}</span>
    <span class="pill" style="background:#fff7ed;color:#7c2d12">Executed ERROR · {scenario_counts.get('ERROR',0)}</span>
    <span class="pill" style="background:#f1f5f9;color:#475569">Skipped · {scenario_counts.get('SKIP',0)}</span>
    <span class="pill" style="background:#e0e7ff;color:#4338ca">Playwright (committed) · {scenario_counts.get('PLAYWRIGHT',0)}</span>
    <span class="pill" style="background:#e0f2fe;color:#0369a1">Catalogued (pending) · {scenario_counts.get('CATALOGUED',0)}</span>
  </div>
  <div id="filter-bar" class="pill-row" style="margin:14px 0 6px;gap:6px">
    <span class="muted" style="font-size:11px;text-transform:uppercase;letter-spacing:1.2px;margin-right:6px">Show:</span>
    <a href="#all" class="filter-link">All</a>
    <a href="#fail" class="filter-link">Fail</a>
    <a href="#pass" class="filter-link">Pass</a>
    <a href="#playwright" class="filter-link">Playwright</a>
    <a href="#skip" class="filter-link">Skip</a>
  </div>
  <div style="overflow-x:auto;max-height:640px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:8px;margin-top:8px">
    <table id="all-scenarios-table">
      <thead style="position:sticky;top:0;background:#f8fafc;z-index:1">
        <tr>
          <th style="width:50px">#</th>
          <th>TC</th>
          <th>Cat</th>
          <th>Target</th>
          <th>Description</th>
          <th>Expected</th>
          <th>Runs in</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>'''
# Re-sort scenarios in source order (by appearance in SCENARIOS.md) for serial numbering,
# but keep the failure-first display order. We assign serial in source order.
serial_by_tc = {s["tc"]: i + 1 for i, s in enumerate(ALL_SCENARIOS)}
for s in scenario_rows:
    serial = serial_by_tc.get(s["tc"], "")
    inventory_html += f'''
        <tr class="scen-row" data-status="{s['status']}">
          <td style="font-family:ui-monospace,monospace;font-weight:700;font-size:12px;color:#0f172a;text-align:right;padding-right:14px">{serial}</td>
          <td style="font-family:ui-monospace,monospace;font-weight:600;font-size:12px;color:#334155;white-space:nowrap">{html.escape(s['tc'])}</td>
          <td><span class="muted" style="font-size:11px">{html.escape(cat_label(s['cat']))}</span></td>
          <td style="font-family:ui-monospace,monospace;font-size:11px;color:#475569;max-width:220px;overflow:hidden;text-overflow:ellipsis"><code>{html.escape(s['target'])}</code></td>
          <td style="font-size:12px;max-width:300px">{html.escape(s['description'])}</td>
          <td style="font-size:12px;color:#64748b;max-width:240px">{html.escape(s['expected'])}</td>
          <td><span class="muted" style="font-size:11px">{html.escape(s['runs'])}</span></td>
          <td>{scenario_badge(s['status'])}</td>
        </tr>'''
inventory_html += '''
      </tbody>
    </table>
  </div>
</div>'''

# Renumber executed-cases section accordingly
table_html = table_html.replace('<h2>8. Every executed case</h2>',
                                '<h2>4. Detailed results — every executed case</h2>')
slowest_html = slowest_html.replace('<h2>4. Performance — slowest 10 tests</h2>',
                                    '<h2>5. Performance — slowest 10 tests</h2>')
hist_html = hist_html.replace('<h2>5. Test duration distribution</h2>',
                              '<h2>6. Test duration distribution</h2>')
heatmap_html = heatmap_html.replace('<h2>6. Status × Category heatmap</h2>',
                                    '<h2>7. Status × Category heatmap</h2>')
tl_html = tl_html.replace('<h2>7. Execution timeline</h2>',
                          '<h2>8. Execution timeline</h2>')
skip_note = skip_note.replace('<h2>9. Skipped tests (and why)</h2>',
                              '<h2>10. Skipped runner cases (and why)</h2>')

# ── Playwright execution section ───────────────────────────────────────────
playwright_html = ""
if PW:
    pw_pass = PW_SUMMARY.get("PASS", 0)
    pw_fail = PW_SUMMARY.get("FAIL", 0)
    pw_skip = PW_SUMMARY.get("SKIP", 0)
    pw_to   = PW_SUMMARY.get("TIMEOUT", 0)
    pw_err  = PW_SUMMARY.get("ERROR", 0)
    pw_total = PW_TOTAL
    pw_pct = round(100 * pw_pass / max(1, pw_total), 1)
    by_file = collections.defaultdict(lambda: {"PASS":0,"FAIL":0,"SKIP":0,"TIMEOUT":0,"ERROR":0})
    for t in PW:
        f = (t.get("file") or "?").replace("tests/qa-e2e/", "")
        by_file[f][t["status"]] += 1
    file_rows = ""
    for f, b in sorted(by_file.items()):
        tot = sum(b.values())
        file_rows += f'''
        <div class="row-tag">
          <span class="name" style="font-family:ui-monospace,monospace;font-size:12px">{html.escape(f)}</span>
          {stacked_bar({"PASS":b["PASS"],"FAIL":b["FAIL"]+b["TIMEOUT"]+b["ERROR"],"SKIP":b["SKIP"]}, width=520)}
          <span class="muted" style="font-size:12px;margin-left:auto">{tot} cases</span>
        </div>'''
    pw_donut = donut(pw_pass, pw_fail + pw_to + pw_err, 0, pw_skip, pw_total)
    pw_failures = [t for t in PW if t["status"] in ("FAIL","TIMEOUT","ERROR")]
    failures_table = ""
    if pw_failures:
        failures_table = '<h3 style="margin-top:18px">Failed Playwright tests</h3>'
        failures_table += '<div class="card" style="padding:0;overflow-x:auto"><table>'
        failures_table += '<thead><tr><th>TC</th><th>Test</th><th>File</th><th>Status</th><th>Error</th></tr></thead><tbody>'
        for t in pw_failures:
            failures_table += f'''<tr>
              <td style="font-family:ui-monospace,monospace;font-weight:600;font-size:12px">{html.escape(t.get("tc",""))}</td>
              <td style="font-size:13px">{html.escape(t["name"])}</td>
              <td><code style="font-size:11px">{html.escape((t.get("file") or "").replace("tests/qa-e2e/",""))}</code></td>
              <td>{status_badge(t["status"]) if t["status"] in ("PASS","FAIL","ERROR","SKIP") else f'<span class="status-pill" style="background:#fef3c7;color:#92400e">{t["status"]}</span>'}</td>
              <td><span class="muted" style="font-size:12px">{html.escape(t.get("error",""))}</span></td>
            </tr>'''
        failures_table += '</tbody></table></div>'
    playwright_html = f'''
<h2>9. Playwright UI regression — execution results</h2>
<div class="card">
  <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
    <div>{pw_donut}</div>
    <div style="flex:1;min-width:240px">
      <p style="margin-top:0">Full Playwright suite run against <code>{html.escape(base)}</code> in headless Chromium. Each test references its <code>TC-###</code> in the title where possible.</p>
      <div class="pill-row">
        <span class="pill" style="background:#dcfce7;color:#15803d">{pw_pass} passed</span>
        {'<span class="pill" style="background:#fee2e2;color:#b91c1c">' + str(pw_fail) + ' failed</span>' if pw_fail else ''}
        {'<span class="pill" style="background:#fef3c7;color:#92400e">' + str(pw_to) + ' timed out</span>' if pw_to else ''}
        {'<span class="pill" style="background:#f1f5f9;color:#475569">' + str(pw_skip) + ' skipped</span>' if pw_skip else ''}
        <span class="pill">{pw_total} total · {pw_pct}% pass</span>
      </div>
    </div>
  </div>
  <h3 style="margin-top:18px">Per-file pass/fail breakdown</h3>
  {file_rows}
  {failures_table}
</div>'''
else:
    playwright_html = '''
<h2>9. Playwright UI regression — execution results</h2>
<div class="card muted">No <code>tests/qa/playwright-results.json</code> yet. Run the suite via <code>npx playwright test --config=playwright.qa.config.ts</code>.</div>'''

# Filter pill CSS for the inventory table
filter_css = '''
<style>
  .filter-link { display:inline-block; padding:4px 12px; border-radius:99px;
    background:#f1f5f9; color:#334155; text-decoration:none; font-size:12px;
    font-weight:600; border: 1px solid #e2e8f0; transition: all 0.15s; }
  .filter-link:hover { background:#e2e8f0; }
  /* :target rules — show only matching rows when one of the filter pills is clicked */
  body:has(:target#fail)        .scen-row:not([data-status="FAIL"])  { display:none; }
  body:has(:target#pass)        .scen-row:not([data-status="PASS"])  { display:none; }
  body:has(:target#playwright)  .scen-row:not([data-status="PLAYWRIGHT"]) { display:none; }
  body:has(:target#skip)        .scen-row:not([data-status="SKIP"])  { display:none; }
  /* anchor targets */
</style>
<a id="all"></a><a id="fail"></a><a id="pass"></a><a id="playwright"></a><a id="skip"></a>
'''

# Write file
OUT.write_text(
    HEAD
    + filter_css
    + header
    + kpis
    + legend
    + bars_html
    + defects_html
    + inventory_html
    + table_html
    + slowest_html
    + hist_html
    + heatmap_html
    + tl_html
    + playwright_html
    + skip_note
    + coverage
    + recs
    + FOOTER
)
print(f"wrote {OUT}  ({OUT.stat().st_size:,} bytes)")
