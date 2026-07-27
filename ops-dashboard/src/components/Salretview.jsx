import { useEffect, useMemo, useRef, useState } from "react";
import {
  Lock, Unlock, Upload, Search, ChevronDown, Users, Target, Percent,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
} from "recharts";
import * as api from "../api/salretApi";

const SR_TARGET = 0.46;
const pct = (p) => (p == null ? "—" : (p * 100).toFixed(1) + "%");
const monthLabel = (mk) => {
  const m = /^(\d{4})-(\d{2})$/.exec(mk || "");
  if (!m) return mk || "—";
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });
};
const inr = (n) => "₹" + Math.round(n || 0).toLocaleString("en-IN");
const inrShort = (n) => {
  n = Number(n) || 0;
  if (Math.abs(n) >= 1e7) return "₹" + (n / 1e7).toFixed(2) + "Cr";
  if (Math.abs(n) >= 1e5) return "₹" + (n / 1e5).toFixed(2) + "L";
  return inr(n);
};
// If your project already has these in a shared UI kit, delete this block and
// import from there instead — they're only here so this file runs standalone.
const inputCls =
  "w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-red-500";
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  );
}
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SalRetView() {
  const [loaded, setLoaded] = useState(false);
  const [months, setMonths] = useState([]); // [{month_key, grand_salary, total_retainer, overall_pct}]
  const [detail, setDetail] = useState(null); // GET /api/months/:key result
  const [selected, setSelected] = useState("");
  const [hasPin, setHasPin] = useState(false);
  const [unlocked, setUnlocked] = useState(true);
  const [pinInput, setPinInput] = useState("");
  const [pinErr, setPinErr] = useState(false);
  const [showPinMgr, setShowPinMgr] = useState(false);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [note, setNote] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const refreshMonths = async () => {
    const list = await api.getMonths();
    setMonths(list);
    return list;
  };

  // initial load: month list + pin lock status
  useEffect(() => {
    (async () => {
      try {
        const [list, pinStatus] = await Promise.all([api.getMonths(), api.getPinStatus()]);
        setMonths(list);
        setSelected(list.length ? list[list.length - 1].month_key : "");
        setHasPin(pinStatus.hasPin);
        setUnlocked(!pinStatus.hasPin);
      } catch {
        setNote("Couldn't reach the server. Is the API running?");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // fetch the selected month's detail whenever it changes (and once unlocked)
  useEffect(() => {
    if (!selected || !unlocked) return;
    api.getMonthDetail(selected).then(setDetail).catch(() => setDetail(null));
  }, [selected, unlocked]);

  const onFile = async (file) => {
    if (!file) return;
    setImporting(true);
    try {
      const result = await api.importMonth(file);
      await refreshMonths();
      setSelected(result.monthKey);
      setNote(`Imported ${monthLabel(result.monthKey)} — ${result.employees} people across ${result.brands} brands.`);
    } catch (e) {
      setNote(e.message || "That file couldn't be read.");
    } finally {
      setImporting(false);
      setTimeout(() => setNote(""), 5000);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const updateRev = async (brand, value) => {
    const v = Number(String(value).replace(/[^0-9.]/g, "")) || 0;
    // optimistic UI update so the input feels instant
    setDetail((d) =>
      d && {
        ...d,
        brands: d.brands.map((b) =>
          b.brand === brand ? { ...b, retainer: v, pct: v > 0 ? b.salaryCost / v : null } : b,
        ),
      },
    );
    try {
      await api.setBrandRetainer(selected, brand, v);
      refreshMonths(); // YTD totals shift too
    } catch {
      setNote("Couldn't save that retainer value.");
    }
  };

  const tryUnlock = async () => {
    try {
      const { ok } = await api.verifyPin(pinInput);
      if (ok) {
        setUnlocked(true);
        setPinInput("");
        setPinErr(false);
      } else setPinErr(true);
    } catch {
      setPinErr(true);
    }
  };

  const series = months.map((m) => ({
    key: m.month_key,
    label: monthLabel(m.month_key),
    pct: m.overall_pct != null ? +(m.overall_pct * 100).toFixed(1) : null,
    sal: m.grand_salary,
    rev: m.total_retainer,
    overall: m.overall_pct,
  }));
  const ytdSal = series.reduce((s, x) => s + (x.overall != null ? x.sal : 0), 0);
  const ytdRev = series.reduce((s, x) => s + (x.overall != null ? x.rev : 0), 0);
  const ytdOverall = ytdRev > 0 ? ytdSal / ytdRev : null;

  const rows = useMemo(() => {
    if (!detail) return [];
    return detail.brands
      .map((b) => ({ brand: b.brand, sal: b.salaryCost, revenue: b.retainer, pct: b.pct, people: b.people }))
      .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));
  }, [detail]);

  const withPct = rows.filter((r) => r.pct != null);
  const avg = withPct.length ? withPct.reduce((s, r) => s + r.pct, 0) / withPct.length : null;
  const best = withPct.length ? withPct.reduce((a, b) => (b.pct < a.pct ? b : a)) : null;
  const worst = withPct.length ? withPct.reduce((a, b) => (b.pct > a.pct ? b : a)) : null;
  const central = detail ? detail.centralSalary || 0 : 0;
  const currentMonthRow = months.find((m) => m.month_key === selected);
  const sel = detail
    ? {
        sal: detail.grandSalary,
        rev: detail.brands.reduce((s, b) => s + (b.retainer || 0), 0),
        overall: currentMonthRow ? currentMonthRow.overall_pct : null,
      }
    : { sal: 0, rev: 0, overall: null };
  const rampups = rows.filter((r) => r.revenue <= 0 && r.sal > 0).length;

  const filtered = search.trim()
    ? rows.filter((r) => r.brand.toLowerCase().includes(search.trim().toLowerCase()))
    : rows;

  const monthKeys = months.map((m) => m.month_key);

  /* ---- locked state ---- */
  if (!loaded) return <div className="py-16 text-center text-sm text-zinc-500">Loading…</div>;

  if (hasPin && !unlocked) {
    return (
      <div className="mx-auto mt-12 max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
          <Lock size={18} className="text-zinc-300" />
        </div>
        <h3 className="text-sm font-semibold text-zinc-100">This section is locked</h3>
        <p className="mt-1 text-xs text-zinc-500">Salary data is private. Enter your PIN to view.</p>
        <input
          type="password"
          autoFocus
          value={pinInput}
          onChange={(e) => {
            setPinInput(e.target.value);
            setPinErr(false);
          }}
          onKeyDown={(e) => e.key === "Enter" && tryUnlock()}
          className={`${inputCls} mt-4 text-center tracking-widest`}
          placeholder="••••"
        />
        {pinErr && <p className="mt-2 text-xs text-red-400">Wrong PIN.</p>}
        <button
          onClick={tryUnlock}
          className="mt-3 w-full rounded-md btn-primary px-4 py-2 text-xs font-medium text-white hover:bg-red-500"
        >
          Unlock
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            Salary-to-Retainer{" "}
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">PRIVATE</span>
          </h2>
          <p className="text-xs text-zinc-500">
            {monthKeys.length
              ? `${monthKeys.length} month${monthKeys.length > 1 ? "s" : ""} tracked toward the 46% goal`
              : "Import the monthly Finance sheet to begin."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {monthKeys.length > 0 && (
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className={inputCls + " w-auto"}
            >
              {monthKeys.map((mk) => (
                <option key={mk} value={mk}>
                  {monthLabel(mk)}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={() => setShowPinMgr(true)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
          >
            {hasPin ? <Lock size={14} /> : <Unlock size={14} />} {hasPin ? "PIN set" : "Set PIN"}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            className="flex items-center gap-1.5 rounded-md btn-primary px-3 py-2 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
          >
            <Upload size={14} /> {importing ? "Importing…" : "Import month"}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
      </div>

      {note && (
        <div className="mb-3 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-300">
          {note}
        </div>
      )}

      {!detail ? (
        <EmptyState
          icon={Percent}
          title="No salary data yet"
          hint="Import your monthly 'Sal to Ret' sheet. Each month is kept, so you can switch between them and watch the year-to-date number track against your 46% target."
        />
      ) : (
        <>
          <YtdPanel
            series={series.filter((s) => s.overall != null)}
            ytdOverall={ytdOverall}
            ytdSal={ytdSal}
            ytdRev={ytdRev}
            selected={selected}
            onPick={setSelected}
          />

          <div className="mb-2 mt-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "#7c63ff" }} /> {monthLabel(selected)} · detail
          </div>
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi
              label="Overall Sal/Ret %"
              value={pct(sel.overall)}
              sub={`vs 46% target · avg ${pct(avg)}`}
              accent={sel.overall != null && sel.overall > SR_TARGET}
            />
            <Kpi
              label="Brands tracked"
              value={String(rows.length)}
              sub={`${detail.brands.reduce((s, b) => s + b.people.length, 0)} people · ${inrShort(central)} central${rampups ? ` · ${rampups} ramp-up` : ""}`}
            />
            <Kpi label="Best brand (lowest)" value={best ? pct(best.pct) : "—"} sub={best ? best.brand : ""} />
            <Kpi
              label="Worst brand (highest)"
              value={worst ? pct(worst.pct) : "—"}
              sub={worst ? worst.brand : ""}
              accent={worst != null && worst.pct > SR_TARGET}
            />
          </div>

          {sel.overall != null && (
            <Insight overall={sel.overall} totalSal={sel.sal} totalRev={sel.rev} central={central} rows={withPct} />
          )}

          <div className="relative mb-3">
            <Search size={15} className="pointer-events-none absolute left-3 top-2.5 text-zinc-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter brands… (e.g. JIO, Tata, ACKO)"
              className={inputCls + " pl-9"}
            />
          </div>

          <div className="space-y-2">
            {filtered.map((r) => (
              <BrandRow
                key={r.brand}
                r={r}
                expanded={!!expanded[r.brand]}
                onToggle={() => setExpanded((p) => ({ ...p, [r.brand]: !p[r.brand] }))}
                onRev={(v) => updateRev(r.brand, v)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="rounded-lg border border-dashed border-zinc-800 py-8 text-center text-xs text-zinc-500">
                No brands match "{search}".
              </div>
            )}
          </div>
        </>
      )}

      {showPinMgr && (
        <PinManager
          hasPin={hasPin}
          onClose={() => setShowPinMgr(false)}
          onSave={async (p) => {
            await api.setPin(p);
            setHasPin(!!p);
            setUnlocked(true);
            setShowPinMgr(false);
          }}
        />
      )}
    </div>
  );
}

function YtdPanel({ series, ytdOverall, ytdSal, ytdRev, selected, onPick }) {
  const over = ytdOverall != null && ytdOverall > SR_TARGET;
  const latest = series.length ? series[series.length - 1] : null;
  const prev = series.length > 1 ? series[series.length - 2] : null;
  const delta = latest && prev ? latest.pct - prev.pct : null;

  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
      <div
        className="relative overflow-hidden rounded-2xl border p-5"
        style={{
          borderColor: over ? "rgba(245,158,11,.4)" : "rgba(16,185,129,.4)",
          background: over
            ? "linear-gradient(165deg, rgba(245,158,11,.08), rgba(24,24,27,.5))"
            : "linear-gradient(165deg, rgba(16,185,129,.08), rgba(24,24,27,.5))",
        }}
      >
        <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
          <Target size={14} /> Goal till now (YTD)
        </div>
        <div className={`mt-2 text-[40px] font-semibold leading-none tracking-tight ${over ? "text-amber-200" : "text-emerald-200"}`}>
          {pct(ytdOverall)}
        </div>
        <div className="mt-2 text-xs text-zinc-400">
          {over
            ? `${((ytdOverall - SR_TARGET) * 100).toFixed(1)} pts over the 46% target`
            : `${((SR_TARGET - ytdOverall) * 100).toFixed(1)} pts under the 46% target`}
        </div>
        <div className="mt-3 border-t border-zinc-800 pt-3 text-[11px] text-zinc-500">
          {series.length} month{series.length > 1 ? "s" : ""} · salaries {inrShort(ytdSal)} ÷ retainers {inrShort(ytdRev)}
          {delta != null && (
            <span className={delta <= 0 ? "text-emerald-400" : "text-amber-400"}>
              {"  ·  "}
              {delta <= 0 ? "▼" : "▲"} {Math.abs(delta).toFixed(1)} pts vs prev month
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 lg:col-span-2">
        <div className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
          Monthly overall % vs target
        </div>
        <div style={{ width: "100%", height: 188 }}>
          <ResponsiveContainer>
            <LineChart
              data={series}
              margin={{ top: 10, right: 14, bottom: 6, left: -18 }}
              onClick={(e) => e?.activeLabel && onPick(series.find((s) => s.label === e.activeLabel)?.key || selected)}
            >
              <XAxis dataKey="label" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={{ stroke: "#3f3f46" }} tickLine={false} />
              <YAxis
                tick={{ fill: "#a1a1aa", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                domain={[0, (m) => Math.max(60, Math.ceil(m / 10) * 10)]}
                tickFormatter={(v) => v + "%"}
              />
              <Tooltip
                cursor={{ stroke: "#3f3f46" }}
                contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [v + "%", "Overall"]}
              />
              <ReferenceLine
                y={46}
                stroke="#10b981"
                strokeDasharray="5 4"
                label={{ value: "46% target", fill: "#10b981", fontSize: 10, position: "insideTopRight" }}
              />
              <Line type="monotone" dataKey="pct" stroke="#7c63ff" strokeWidth={2.5} dot={{ r: 3.5, fill: "#7c63ff", strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {series.length > 1 && (
          <div className="mt-1 text-center text-[10px] text-zinc-600">Tip: click a point to open that month below.</div>
        )}
      </div>
    </div>
  );
}

function Insight({ overall, totalSal, totalRev, central, rows }) {
  const over = overall > SR_TARGET;
  const dpts = Math.abs(overall - SR_TARGET) * 100;
  const buffer = SR_TARGET * totalRev - totalSal;
  const needRev = totalSal / SR_TARGET - totalRev;
  const cutSal = totalSal - SR_TARGET * totalRev;
  const drags = [...rows]
    .filter((r) => r.pct > SR_TARGET)
    .sort((a, b) => b.sal * (b.pct - SR_TARGET) - a.sal * (a.pct - SR_TARGET))
    .slice(0, 3);

  return (
    <div className={`mb-5 rounded-xl border p-4 ${over ? "border-amber-500/40 bg-amber-500/[0.04]" : "border-emerald-500/40 bg-emerald-500/[0.04]"}`}>
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400">
        <Target size={14} /> Insight · target 46% overall by 31 Mar 2027
      </div>
      <p className="mt-2 text-sm text-zinc-200">
        You're at <span className={`font-semibold ${over ? "text-amber-300" : "text-emerald-300"}`}>{pct(overall)}</span> overall,{" "}
        {dpts.toFixed(1)} pts {over ? "above" : "under"} the 46% target.{" "}
        {over ? (
          <>
            To get back to 46% you'd need roughly <span className="font-medium text-zinc-100">{inrShort(needRev)}</span> more monthly
            retainer, or <span className="font-medium text-zinc-100">{inrShort(cutSal)}</span> less monthly salary cost.
          </>
        ) : (
          <>
            You have about <span className="font-medium text-zinc-100">{inrShort(buffer)}</span> of monthly salary headroom before
            you cross 46%.
          </>
        )}
      </p>
      <p className="mt-2 text-xs text-zinc-500">
        Total salaries {inrShort(totalSal)} (incl. {inrShort(central)} central) ÷ retainers {inrShort(totalRev)}. Central and
        ramp-up salaries count here even though they sit outside the per-brand percentages.
      </p>
      {over && drags.length > 0 && (
        <p className="mt-2 text-xs text-zinc-400">
          Biggest drags:{" "}
          {drags.map((d, i) => (
            <span key={d.brand}>
              {i > 0 ? ", " : ""}
              <span className="text-zinc-200">{d.brand}</span> ({pct(d.pct)})
            </span>
          ))}
          . Fixing these moves the overall number most, since they combine a high % with a large salary base.
        </p>
      )}
    </div>
  );
}

function BrandRow({ r, expanded, onToggle, onRev }) {
  const rampup = r.revenue <= 0 && r.sal > 0;
  const band = rampup
    ? "bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40"
    : r.pct == null
      ? "bg-zinc-700 text-zinc-300"
      : r.pct <= SR_TARGET
        ? "bg-emerald-600/20 text-emerald-300 ring-1 ring-emerald-500/40"
        : r.pct <= 0.6
          ? "bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/40"
          : "btn-primary/20 text-red-300 ring-1 ring-red-500/40";
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3">
        <button onClick={onToggle} className="flex flex-1 items-center gap-2 text-left">
          <ChevronDown size={15} className={`text-zinc-500 transition ${expanded ? "rotate-180" : ""}`} />
          <span className="font-medium text-zinc-100">{r.brand}</span>
          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
            <Users size={11} />
            {r.people.length}
          </span>
        </button>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-zinc-600">Salary / mo</div>
          <div className="font-mono text-sm text-zinc-200">{inr(Math.round(r.sal))}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-zinc-600">Retainer / mo</div>
          <input
            value={r.revenue || ""}
            onChange={(e) => onRev(e.target.value)}
            placeholder="set ₹"
            className="w-28 rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-right font-mono text-sm text-zinc-200 outline-none focus:border-red-500"
          />
        </div>
        <span
          title={rampup ? "Salary with no retainer yet — counted in the overall total, not in the brand %" : ""}
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${band}`}
        >
          {rampup ? "Ramp-up" : pct(r.pct)}
        </span>
      </div>

      {expanded && (
        <div className="border-t border-zinc-800 bg-zinc-950/50">
          {r.people.length === 0 ? (
            <div className="px-4 py-3 text-xs text-zinc-500">No one is allocated to this brand in the sheet.</div>
          ) : (
            <table className="w-full text-xs">
              <thead className="text-left text-[10px] uppercase tracking-wider text-zinc-600">
                <tr>
                  <th className="px-4 py-2 font-medium">Person</th>
                  <th className="px-4 py-2 font-medium">Designation</th>
                  <th className="px-4 py-2 text-right font-medium">Salary</th>
                  <th className="px-4 py-2 text-right font-medium">% on brand</th>
                  <th className="px-4 py-2 text-right font-medium">Cost to brand</th>
                </tr>
              </thead>
              <tbody>
                {r.people.map((p, i) => (
                  <tr key={i} className="border-t border-zinc-800/60">
                    <td className="px-4 py-2 text-zinc-200">{p.name}</td>
                    <td className="px-4 py-2 text-zinc-500">{p.designation || "—"}</td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-400">{inr(p.salary)}</td>
                    <td className="px-4 py-2 text-right text-zinc-300">{Math.round(p.alloc * 100)}%</td>
                    <td className="px-4 py-2 text-right font-mono text-zinc-200">{inr(Math.round(p.contrib))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function PinManager({ hasPin, onClose, onSave }) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (a.length < 4) return setErr("Use at least 4 digits.");
    if (a !== b) return setErr("PINs don't match.");
    onSave(a);
  };
  return (
    <Modal title={hasPin ? "Change PIN" : "Set a PIN"} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-xs text-zinc-500">
          A light lock to keep this tab private on a shared screen. It isn't bank-grade security.
        </p>
        <Field label="New PIN">
          <input
            type="password"
            className={inputCls}
            value={a}
            onChange={(e) => {
              setA(e.target.value.replace(/\D/g, ""));
              setErr("");
            }}
            placeholder="4+ digits"
          />
        </Field>
        <Field label="Confirm PIN">
          <input
            type="password"
            className={inputCls}
            value={b}
            onChange={(e) => {
              setB(e.target.value.replace(/\D/g, ""));
              setErr("");
            }}
          />
        </Field>
        {err && <p className="text-xs text-red-400">{err}</p>}
        <div className="flex justify-between gap-2 pt-1">
          {hasPin ? (
            <button onClick={() => onSave("")} className="rounded-md px-3 py-2 text-xs text-zinc-500 hover:text-red-300">
              Remove lock
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-md px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200">
              Cancel
            </button>
            <button onClick={submit} className="rounded-md btn-primary px-4 py-2 text-xs font-medium text-white hover:bg-red-500">
              Save PIN
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Kpi({ label, value, sub, accent }) {
  return (
    <div
      className="group relative overflow-hidden rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5"
      style={
        accent
          ? { borderColor: "rgba(245,158,11,.4)", background: "linear-gradient(165deg, rgba(245,158,11,.08), rgba(24,24,27,.5))" }
          : { borderColor: "#27272a", background: "rgba(24,24,27,.5)" }
      }
    >
      {accent && (
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl"
          style={{ background: "radial-gradient(circle, rgba(245,158,11,.30), transparent 70%)" }}
        />
      )}
      <div className="relative text-[11px] font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className={`relative mt-2 text-[27px] font-semibold leading-none tracking-tight ${accent ? "text-amber-200" : "text-zinc-50"}`}>
        {value}
      </div>
      {sub && <div className="relative mt-2 text-[11px] text-zinc-500">{sub}</div>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 py-16 text-center">
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-800"
        style={{ background: "radial-gradient(circle, rgba(124,99,255,.14), transparent 70%)" }}
      >
        <Icon size={22} className="text-zinc-400" />
      </div>
      <p className="text-sm font-medium text-zinc-300">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-zinc-500">{hint}</p>
    </div>
  );
}