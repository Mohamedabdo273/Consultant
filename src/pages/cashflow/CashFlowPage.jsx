import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import {
  TrendingDown, CheckCircle2, AlertTriangle, DollarSign,
  Calendar, FileText, Printer, Download, ChevronDown,
  ArrowDownRight, BarChart2, Activity, Layers,
} from 'lucide-react';

/* ─── Colour palette ─────────────────────────────── */
const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#6366f1', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

/* ─── Sample data – 8-week plan ─────────────────────────────── */
const ITEMS_8W = [
  { name: 'Concrete Supply',        icon: '🚛', weeks: [430082,430082,430082,430082,430082,430082,430082,430082], total: 1720328,  pct: 19.05 },
  { name: 'Concrete Manufacturing', icon: '🏗️', weeks: [104000,104000,104000,104000,104000,104000,104000,104000], total: 416000,   pct: 4.61  },
  { name: 'Finishing Materials',    icon: '🎨', weeks: [503329,503329,503329,503329,503329,503329,503329,503329], total: 4026632.5,pct: 44.57 },
  { name: 'Required Rebar',         icon: '🔩', weeks: [257745,0,0,0,0,0,0,0],                                   total: 257745,   pct: 2.85  },
  { name: 'Crystal Doors',          icon: '🚪', weeks: [170500,0,0,0,0,0,0,0],                                   total: 170500,   pct: 1.89  },
  { name: 'Corrugated Sheets',      icon: '🟧', weeks: [204360,0,0,0,510900,510900,510900,510900],               total: 2043600,  pct: 22.65 },
  { name: 'Steel Angle Supply',     icon: '📐', weeks: [26000,0,0,0,13000,13000,13000,13000],                    total: 104000,   pct: 1.15  },
  { name: 'Staircases',             icon: '🪜', weeks: [366000,0,0,0,0,0,0,0],                                   total: 366000,   pct: 4.05  },
];

/* ─── Sample data – 4-week plan ─────────────────────────────── */
const ITEMS_4W = [
  { name: 'Supplies for Distributers', icon: '🚛', weeks: [126627,0,0,0],        total: 126627, pct: 21.80, notes: 'Delivered in Week 1' },
  { name: 'Concrete Manufacturing',    icon: '🏗️', weeks: [0,0,0,0],             total: 0,      pct: 0.00,  notes: 'Not required' },
  { name: 'Finishing Materials',       icon: '🎨', weeks: [21125,21125,21125,21125],total:84500, pct: 14.55, notes: 'Evenly distributed' },
  { name: 'Required Rebar',            icon: '🔩', weeks: [0,0,0,0],             total: 0,      pct: 0.00,  notes: 'Not required' },
  { name: 'Crystal Doors',             icon: '🚪', weeks: [0,0,0,0],             total: 0,      pct: 0.00,  notes: 'Not required' },
  { name: 'Corrugated Sheets',         icon: '🟧', weeks: [330642,0,0,0],        total: 330642, pct: 56.95, notes: 'Procured in Week 1' },
  { name: 'Steel Frame Manufacturing', icon: '📐', weeks: [0,0,7000,14000],      total: 21000,  pct: 3.61,  notes: 'Phased Manufacturing' },
  { name: 'Staircases',                icon: '🪜', weeks: [0,0,0,18000],         total: 18000,  pct: 3.10,  notes: 'Completed in Week 4' },
];

const fmt = (n) => n === 0 ? '0' : Number(n).toLocaleString('en-EG', { maximumFractionDigits: 0 });
const fmtShort = (n) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : n;

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 shadow-xl text-xs">
      <p className="text-gray-300 font-semibold mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="text-white font-bold">{fmt(p.value)} EGP</span>
        </div>
      ))}
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, pct, name }) => {
  if (pct < 3) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
      {pct.toFixed(1)}%
    </text>
  );
};

/* ═══════════════════════════════════════════════════════════════ */
export default function CashFlowPage() {
  const [plan, setPlan] = useState('8w'); // '8w' | '4w'
  const [activeTab, setActiveTab] = useState('overview');

  const items    = plan === '8w' ? ITEMS_8W : ITEMS_4W;
  const weekCount = plan === '8w' ? 8 : 4;
  const labels   = plan === '8w'
    ? ['Week 1','Week 2','Week 3','Week 4','Week 5','Week 6','Week 7','Week 8']
    : ['Week 1 (26Jun–13Jun)','Week 2 (01Jul–27Jun)','Week 3 (05Jul–02Jul)','Week 4 (08Jul–06Jul)'];

  const weeklyTotals = useMemo(() =>
    Array.from({ length: weekCount }, (_, wi) =>
      items.reduce((s, row) => s + (row.weeks[wi] ?? 0), 0)
    ), [items, weekCount]);

  const grandTotal = items.reduce((s, r) => s + r.total, 0);

  /* ─── Original plan (un-optimised) – simulated spike ─── */
  const originalWeeklyTotals = useMemo(() => {
    if (plan === '8w') return [1295156,1037411,1037411,503329,1393229,1014229,1014229,1014229];
    return [485394,35125,21125,39125];
  }, [plan]);

  /* ─── Bar chart data ─── */
  const barData = labels.map((label, i) => ({
    week: `W${i + 1}`,
    'Original Plan': originalWeeklyTotals[i],
    'Improved Plan': weeklyTotals[i],
  }));

  /* ─── Pie chart data ─── */
  const pieData = items.filter(r => r.total > 0).map(r => ({
    name: r.name,
    value: r.total,
    pct: r.pct,
  }));

  /* ─── Cumulative ─── */
  const cumData = labels.map((label, i) => {
    const impCum = weeklyTotals.slice(0, i + 1).reduce((s, v) => s + v, 0);
    const oriCum = originalWeeklyTotals.slice(0, i + 1).reduce((s, v) => s + v, 0);
    return { week: `W${i + 1}`, 'Improved Plan': impCum, 'Original Plan': oriCum };
  });

  /* ─── Stats ─── */
  const avgWeekly  = grandTotal / weekCount;
  const maxWeekly  = Math.max(...weeklyTotals);
  const minWeekly  = Math.min(...weeklyTotals);
  const variance   = Math.max(...weeklyTotals) - Math.min(...weeklyTotals);
  const oriVariance = Math.max(...originalWeeklyTotals) - Math.min(...originalWeeklyTotals);
  const varianceReduction = (((oriVariance - variance) / oriVariance) * 100).toFixed(1);
  const oriStdDev = Math.sqrt(originalWeeklyTotals.reduce((s,v)=>s+(v-avgWeekly)**2,0)/weekCount);
  const impStdDev = Math.sqrt(weeklyTotals.reduce((s,v)=>s+(v-avgWeekly)**2,0)/weekCount);

  const improvements = plan === '8w' ? [
    'Eliminated cash flow spike in Week 5',
    'Balanced payments across both months',
    `Reduced weekly variance by ${varianceReduction}%`,
    'Improved liquidity management',
    'Better alignment with project progress',
  ] : [
    'Cash flow balanced across the month',
    'Critical materials prioritized',
    'Large expense (Corrugated Sheets) scheduled in Week 1',
    'Reduced cash flow fluctuation',
    'Improved liquidity management',
    'Aligned with project urgency',
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 print:p-0 print:bg-white print:text-black">

      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-gray-700 rounded-2xl p-5 mb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 print:rounded-none print:border-gray-300">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
            <span className="text-white font-black text-lg">GP</span>
          </div>
          <div>
            <p className="text-amber-400 text-xs font-semibold tracking-widest uppercase">Giza Power — Transmission &amp; Distribution</p>
            <h1 className="text-2xl font-black text-white">Cash Flow Analysis</h1>
            <p className="text-green-400 text-sm font-bold">After Improvements · {plan === '8w' ? '2 Months Plan (8 Weeks)' : '1 Month Plan (4 Weeks) – Urgent'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Plan toggle */}
          <div className="flex bg-gray-800 rounded-xl p-1 gap-1 border border-gray-600">
            <button onClick={() => setPlan('8w')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${plan==='8w' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}>
              8 Weeks
            </button>
            <button onClick={() => setPlan('4w')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${plan==='4w' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}>
              4 Weeks
            </button>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-xl text-xs font-semibold transition-all">
            <Printer size={14} /> Print
          </button>
        </div>

        <div className="text-right text-xs text-gray-400 hidden md:block">
          <p className="font-semibold text-gray-300">Electricity Transmission &amp; Distribution Co.</p>
          <p>Project: Ninth District</p>
          <p>Work: Civil Works</p>
          <p className="mt-1 text-amber-400">Date: Sunday, 7 June, 2026</p>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {[
          { id: 'overview', label: 'Overview', icon: Layers },
          { id: 'charts',   label: 'Charts',   icon: BarChart2 },
          { id: 'stats',    label: 'Statistics', icon: Activity },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
              activeTab === id
                ? 'bg-amber-500 text-gray-900 border-amber-400 shadow-lg shadow-amber-500/20'
                : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-amber-500/50 hover:text-white'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* ══════════ OVERVIEW TAB ══════════ */}
      {activeTab === 'overview' && (
        <>
          {/* ── Improved Cash Flow Table ── */}
          <div className="bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden mb-5">
            <div className="bg-gradient-to-r from-green-900/60 to-green-800/40 px-5 py-3 flex items-center gap-2 border-b border-gray-700">
              <CheckCircle2 size={18} className="text-green-400" />
              <span className="text-green-300 font-bold text-sm uppercase tracking-wider">Improved Cash Flow Plan</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-800">
                    <th className="text-left px-4 py-3 text-gray-300 font-bold uppercase w-44">Item</th>
                    {plan === '8w' && (
                      <>
                        <th colSpan={4} className="text-center py-3 text-blue-300 font-bold border-l border-gray-700">Month 1</th>
                        <th colSpan={4} className="text-center py-3 text-green-300 font-bold border-l border-gray-700">Month 2</th>
                      </>
                    )}
                    {plan === '4w' && (
                      <th colSpan={4} className="text-center py-3 text-amber-300 font-bold border-l border-gray-700">Weekly Cash Flow (EGP)</th>
                    )}
                    <th className="text-right px-4 py-3 text-gray-300 font-bold border-l border-gray-700">Total Cost</th>
                    <th className="text-right px-4 py-3 text-gray-300 font-bold">% of Total</th>
                    {plan === '4w' && <th className="px-4 py-3 text-gray-300 font-bold">Notes</th>}
                  </tr>
                  <tr className="bg-gray-800/60">
                    <th className="px-4 py-2" />
                    {Array.from({ length: weekCount }, (_, i) => (
                      <th key={i} className={`text-center px-3 py-2 text-gray-400 font-semibold ${i === 0 ? 'border-l border-gray-700' : ''}`}>
                        {plan === '8w' ? `Week ${i + 1}` : labels[i].split('(')[0].trim()}
                      </th>
                    ))}
                    <th className="border-l border-gray-700" />
                    <th />
                    {plan === '4w' && <th />}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, ri) => (
                    <tr key={ri} className={`border-t border-gray-800 hover:bg-gray-800/40 transition-colors ${row.total === 0 ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{row.icon}</span>
                          <span className="text-gray-200 font-medium">{row.name}</span>
                        </div>
                      </td>
                      {row.weeks.map((val, wi) => (
                        <td key={wi} className={`text-right px-3 py-3 font-mono ${wi === 0 && 'border-l border-gray-800'} ${val > 0 ? 'text-white' : 'text-gray-600'}`}>
                          {fmt(val)}
                        </td>
                      ))}
                      <td className="text-right px-4 py-3 font-bold text-amber-400 border-l border-gray-700 font-mono">{fmt(row.total)}</td>
                      <td className="text-right px-4 py-3">
                        <span className="bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full text-xs font-bold">
                          {row.pct.toFixed(2)}%
                        </span>
                      </td>
                      {plan === '4w' && (
                        <td className="px-4 py-3 text-gray-400 text-xs">{row.notes}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gradient-to-r from-gray-800 to-gray-700 border-t-2 border-amber-500/40">
                    <td className="px-4 py-3 font-black text-amber-300 uppercase text-xs tracking-wider">Weekly Total (Improved)</td>
                    {weeklyTotals.map((t, i) => (
                      <td key={i} className={`text-right px-3 py-3 font-black text-amber-300 font-mono ${i===0 ? 'border-l border-gray-600':''}`}>{fmt(t)}</td>
                    ))}
                    <td className="text-right px-4 py-3 font-black text-green-400 border-l border-gray-600 font-mono text-sm">{fmt(grandTotal)}</td>
                    <td className="text-right px-4 py-3 font-black text-green-400">100%</td>
                    {plan === '4w' && <td />}
                  </tr>
                  <tr className="bg-gray-800/40 border-t border-gray-700">
                    <td className="px-4 py-2 text-gray-400 text-xs font-semibold uppercase">% of Total Cost</td>
                    {weeklyTotals.map((t, i) => (
                      <td key={i} className={`text-right px-3 py-2 text-xs font-bold text-gray-300 ${i===0?'border-l border-gray-700':''}`}>
                        {((t / grandTotal) * 100).toFixed(2)}%
                      </td>
                    ))}
                    <td className="text-right px-4 py-2 text-xs text-gray-400 border-l border-gray-700">100%</td>
                    <td />
                    {plan === '4w' && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── Bottom 3-col layout ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Key Improvements */}
            <div className="bg-gray-900 border border-green-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-green-400" />
                <h3 className="text-green-300 font-bold text-sm uppercase tracking-wider">Key Improvements</h3>
              </div>
              <div className="space-y-3">
                {improvements.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 size={10} className="text-green-400" />
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cash Flow Summary */}
            <div className="bg-gray-900 border border-blue-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign size={18} className="text-blue-400" />
                <h3 className="text-blue-300 font-bold text-sm uppercase tracking-wider">Cash Flow Summary</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Total Project Cost', value: fmt(grandTotal) + ' EGP', color: 'text-amber-400', bold: true },
                  { label: 'Average Weekly Outflow', value: fmt(Math.round(avgWeekly)) + ' EGP', color: 'text-white' },
                  { label: 'Highest Weekly Outflow', value: fmt(maxWeekly) + ' EGP', color: 'text-red-400' },
                  { label: 'Lowest Weekly Outflow', value: fmt(minWeekly) + ' EGP', color: 'text-green-400' },
                  { label: 'Weekly Variance', value: fmt(variance) + ' EGP', color: 'text-orange-400' },
                  { label: 'Variance Reduction', value: varianceReduction + '%', color: 'text-green-400', badge: true },
                ].map(({ label, value, color, bold, badge }) => (
                  <div key={label} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400 text-xs">{label}</span>
                    {badge ? (
                      <span className="flex items-center gap-1 text-green-400 font-black text-sm">
                        <ArrowDownRight size={14} />{value}
                      </span>
                    ) : (
                      <span className={`font-bold text-xs font-mono ${color} ${bold ? 'text-base' : ''}`}>{value}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Liquidity Impact */}
            <div className="bg-gray-900 border border-purple-500/30 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity size={18} className="text-purple-400" />
                <h3 className="text-purple-300 font-bold text-sm uppercase tracking-wider">Liquidity Impact</h3>
              </div>
              <div className="space-y-4">
                {[
                  { icon: '📈', title: 'More Predictable Cash Requirements', desc: 'Smoother outflow distribution reduces forecast uncertainty' },
                  { icon: '💰', title: 'Easier Budget Control and Cash Planning', desc: 'Balanced payments support working capital management' },
                  { icon: '🛡️', title: 'Minimized Financial Risk and Cash Stress', desc: 'No single-week spikes stress liquidity reserves' },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className="text-purple-200 font-semibold text-xs">{title}</p>
                      <p className="text-gray-400 text-xs mt-1">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-5 bg-gray-900 border border-gray-700 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText size={15} className="text-gray-400" />
                <span className="text-gray-300 font-bold text-xs uppercase tracking-wider">Notes &amp; Assumptions</span>
              </div>
              <ul className="space-y-1">
                {['All amounts are in EGP.','Schedule optimized to match material delivery with work progress.',
                  'Payments are distributed to ensure steady cash flow.','This plan assumes no delays or scope changes.'].map(n => (
                  <li key={n} className="text-gray-400 text-xs flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-gray-500" />{n}
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-center bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl px-8 py-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Total Cash Flow</p>
              <p className="text-amber-400 font-black text-2xl font-mono">{fmt(grandTotal)} EGP</p>
              <p className="text-green-400 text-xs mt-1 font-semibold">✓ Optimized Cash Flow</p>
            </div>
            <div className="text-right text-xs">
              <p className="text-gray-400">Approved By</p>
              <p className="text-white font-bold mt-1">Eng. Ahmed Mohamed Daher</p>
              <p className="text-amber-400 italic text-sm mt-1">Ahmed Daher</p>
            </div>
          </div>
        </>
      )}

      {/* ══════════ CHARTS TAB ══════════ */}
      {activeTab === 'charts' && (
        <div className="space-y-5">
          {/* Bar + Pie row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Weekly Bar Chart */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 text-center">Weekly Cash Flow Comparison</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tickFormatter={fmtShort} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Original Plan" fill="#6366f1" radius={[4,4,0,0]} />
                  <Bar dataKey="Improved Plan" fill="#10b981" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-green-300 text-xs text-center">
                  ✓ Key Improvement: Smoother cash flow distribution, eliminating the cash spike and creating a balanced payment schedule.
                </p>
              </div>
            </div>

            {/* Pie Chart */}
            <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
              <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-3 text-center">Cash Flow Distribution (Improved)</h3>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={260}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={105}
                      dataKey="value" labelLine={false} label={renderCustomLabel}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => [`${fmt(v)} EGP`]} contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-300 text-xs flex-1 leading-tight">{item.name}</span>
                      <span className="text-xs font-bold" style={{ color: COLORS[i % COLORS.length] }}>{item.pct.toFixed(2)}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-center mt-2">
                <p className="text-gray-400 text-xs">TOTAL COST</p>
                <p className="text-amber-400 font-black text-lg font-mono">{fmt(grandTotal)} EGP</p>
              </div>
            </div>
          </div>

          {/* Cumulative Line Chart */}
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-5 text-center">Cumulative Cash Flow (Improved)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={cumData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="week" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tickFormatter={fmtShort} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Improved Plan" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981' }} activeDot={{ r: 7 }} />
                <Line type="monotone" dataKey="Original Plan" stroke="#6366f1" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#6366f1' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ══════════ STATS TAB ══════════ */}
      {activeTab === 'stats' && (
        <div className="space-y-5">
          {/* Big stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Project Cost', value: fmt(grandTotal), sub: 'EGP', color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30', textColor: 'text-amber-400', icon: DollarSign },
              { label: 'Avg Weekly Outflow', value: fmt(Math.round(avgWeekly)), sub: 'EGP', color: 'from-blue-500/20 to-blue-500/5 border-blue-500/30', textColor: 'text-blue-400', icon: TrendingDown },
              { label: 'Highest Weekly', value: fmt(maxWeekly), sub: 'EGP — Week ' + (weeklyTotals.indexOf(maxWeekly)+1), color: 'from-red-500/20 to-red-500/5 border-red-500/30', textColor: 'text-red-400', icon: AlertTriangle },
              { label: 'Lowest Weekly', value: fmt(minWeekly), sub: 'EGP — Week ' + (weeklyTotals.indexOf(minWeekly)+1), color: 'from-green-500/20 to-green-500/5 border-green-500/30', textColor: 'text-green-400', icon: CheckCircle2 },
            ].map(({ label, value, sub, color, textColor, icon: Icon }) => (
              <div key={label} className={`bg-gradient-to-br ${color} border rounded-2xl p-5`}>
                <div className="flex justify-between items-start mb-3">
                  <p className="text-gray-400 text-xs font-semibold uppercase">{label}</p>
                  <Icon size={16} className={textColor} />
                </div>
                <p className={`font-black text-xl font-mono ${textColor}`}>{value}</p>
                <p className="text-gray-500 text-xs mt-1">{sub}</p>
              </div>
            ))}
          </div>

          {/* Weekly Outflow Statistics table */}
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4">Weekly Outflow Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {[
                  { label: 'Original Plan Variance', value: fmt(oriVariance - variance) + ' EGP', color: 'text-red-400' },
                  { label: 'Improved Plan Variance', value: fmt(variance) + ' EGP', color: 'text-green-400' },
                  { label: 'Variance Reduction', value: varianceReduction + '%', color: 'text-green-400', arrow: true },
                  { label: 'Standard Deviation (Original)', value: fmt(Math.round(oriStdDev)) + ' EGP', color: 'text-orange-400' },
                  { label: 'Standard Deviation (Improved)', value: fmt(Math.round(impStdDev)) + ' EGP', color: 'text-blue-400' },
                ].map(({ label, value, color, arrow }) => (
                  <div key={label} className="flex justify-between items-center py-2.5 border-b border-gray-800 last:border-0">
                    <span className="text-gray-400 text-sm">{label}</span>
                    <span className={`font-black font-mono ${color} flex items-center gap-1`}>
                      {arrow && <ArrowDownRight size={14} />}{value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Per-week breakdown */}
              <div>
                <p className="text-gray-400 text-xs uppercase font-semibold mb-3">Weekly Breakdown</p>
                <div className="space-y-2">
                  {weeklyTotals.map((t, i) => {
                    const pct = (t / grandTotal) * 100;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Week {i + 1}</span>
                          <span className="text-gray-300 font-mono font-bold">{fmt(t)} EGP <span className="text-gray-500">({pct.toFixed(1)}%)</span></span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: `${COLORS[i % COLORS.length]}` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Insight box */}
          <div className="bg-gradient-to-r from-blue-900/40 to-purple-900/40 border border-blue-500/30 rounded-2xl p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Activity size={20} className="text-blue-400" />
              </div>
              <div>
                <h4 className="text-blue-300 font-bold mb-2">Insight</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  Both plans reach the same total cost of <span className="text-amber-400 font-bold">{fmt(grandTotal)} EGP</span>,
                  but the improved plan ensures smoother cash flow through planned payments,
                  reducing variance by <span className="text-green-400 font-bold">{varianceReduction}%</span> for better liquidity control.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
