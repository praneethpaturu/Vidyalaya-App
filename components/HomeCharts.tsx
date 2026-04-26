"use client";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";

const COLORS = ["#1a73e8","#34a853","#fbbc04","#ea4335","#a142f4","#137333","#e8710a","#ad1457"];

export function FeesTrend({ data }: { data: { month: string; collected: number; billed: number }[] }) {
  return (
    <div className="card">
      <div className="p-4 border-b border-slate-100">
        <h3 className="h-section">Fees collected vs billed</h3>
        <p className="text-xs text-slate-500 mt-0.5">Last 12 months · ₹ in thousands</p>
      </div>
      <div className="p-4 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gCollected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34a853" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#34a853" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gBilled" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a73e8" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#1a73e8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip wrapperStyle={{ fontSize: 12 }} formatter={(v: any) => `₹${(v).toLocaleString("en-IN")}k`} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Area type="monotone" dataKey="billed" stroke="#1a73e8" fill="url(#gBilled)" name="Billed" />
            <Area type="monotone" dataKey="collected" stroke="#34a853" fill="url(#gCollected)" name="Collected" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AttendanceTrend({ data }: { data: { day: string; pct: number }[] }) {
  return (
    <div className="card">
      <div className="p-4 border-b border-slate-100">
        <h3 className="h-section">Attendance %</h3>
        <p className="text-xs text-slate-500 mt-0.5">Last 14 school days</p>
      </div>
      <div className="p-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#64748b" }} />
            <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip wrapperStyle={{ fontSize: 12 }} formatter={(v: any) => `${v}%`} />
            <Line type="monotone" dataKey="pct" stroke="#1a73e8" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function PayrollMix({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="card">
      <div className="p-4 border-b border-slate-100">
        <h3 className="h-section">Payroll mix (current month)</h3>
        <p className="text-xs text-slate-500 mt-0.5">By component</p>
      </div>
      <div className="p-4 h-56 flex items-center">
        <div className="w-1/2 h-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2}>
                {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: any) => `₹${Math.round(Number(v) / 100).toLocaleString("en-IN")}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="w-1/2 space-y-1.5 text-sm">
          {data.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: COLORS[i % COLORS.length] }} />
              <span className="text-slate-700 flex-1">{d.name}</span>
              <span className="text-slate-500 text-xs">{((d.value / total) * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BusUtilisation({ data }: { data: { route: string; capacity: number; assigned: number }[] }) {
  return (
    <div className="card">
      <div className="p-4 border-b border-slate-100">
        <h3 className="h-section">Bus utilisation</h3>
        <p className="text-xs text-slate-500 mt-0.5">Assigned students vs capacity</p>
      </div>
      <div className="p-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="route" tick={{ fontSize: 10, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} />
            <Tooltip wrapperStyle={{ fontSize: 12 }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="capacity" fill="#cbd5e1" name="Capacity" />
            <Bar dataKey="assigned" fill="#1a73e8" name="Assigned" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
