import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, AlertTriangle,
  CheckCircle2, Clock, ArrowUpRight, ArrowDownRight, RefreshCw,
} from 'lucide-react';
import { invoicesApi, projectsApi } from '../../api';

/* ─── helpers ─────────────────────────────────────────────── */
const fmt   = (n) => Number(n ?? 0).toLocaleString('en-EG', { maximumFractionDigits: 0 });
const fmtK  = (n) => n >= 1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n/1_000).toFixed(0)}K` : String(n ?? 0);
const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const COLORS = ['#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6'];

const statusColor = { Paid: 'text-emerald-600 bg-emerald-50', Pending: 'text-amber-600 bg-amber-50', Overdue: 'text-red-600 bg-red-50', Draft: 'text-gray-500 bg-gray-100' };
const statusAr    = { Paid: 'مدفوعة', Pending: 'معلقة', Overdue: 'متأخرة', Draft: 'مسودة' };

/* ─── tooltip ─────────────────────────────────────────────── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold">{fmtK(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

/* ─── stat card ───────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, sub, color, trend }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
    {trend != null && (
      <div className={`flex items-center gap-1 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {Math.abs(trend)}%
      </div>
    )}
  </div>
);

export default function CashFlowPage() {
  const { data: invRes, isLoading: invLoad, refetch } = useQuery({
    queryKey: ['invoices-all'],
    queryFn: () => invoicesApi.getAll({ pageSize: 500 }),
  });
  const { data: summaryRes } = useQuery({
    queryKey: ['invoices-summary'],
    queryFn: () => invoicesApi.getSummary(),
  });
  const { data: projRes } = useQuery({
    queryKey: ['projects-all'],
    queryFn: () => projectsApi.getAll({ pageSize: 200 }),
  });

  const invoices = useMemo(() => {
    const raw = invRes?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.result)) return raw.result;
    return [];
  }, [invRes]);
  const summary  = useMemo(() => summaryRes?.data?.data ?? summaryRes?.data ?? {}, [summaryRes]);
  const projects = useMemo(() => {
    const raw = projRes?.data;
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.data)) return raw.data;
    if (Array.isArray(raw?.items)) return raw.items;
    if (Array.isArray(raw?.result)) return raw.result;
    return [];
  }, [projRes]);

  /* ── monthly cash flow from invoices ── */
  const monthlyData = useMemo(() => {
    const map = {};
    const now = new Date();
    // init last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      map[key] = { month: MONTH[d.getMonth()], inflow: 0, pending: 0, overdue: 0 };
    }
    invoices.forEach((inv) => {
      const date = new Date(inv.issueDate ?? inv.createdAt ?? inv.dueDate);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!map[key]) return;
      const amt = Number(inv.totalAmount ?? inv.amount ?? 0);
      if (inv.status === 'Paid')    map[key].inflow   += amt;
      else if (inv.status === 'Overdue') map[key].overdue += amt;
      else                               map[key].pending  += amt;
    });
    return Object.values(map);
  }, [invoices]);

  /* ── totals ── */
  const totals = useMemo(() => {
    const paid    = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + Number(i.totalAmount ?? i.amount ?? 0), 0);
    const pending = invoices.filter(i => i.status === 'Pending').reduce((s, i) => s + Number(i.totalAmount ?? i.amount ?? 0), 0);
    const overdue = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + Number(i.totalAmount ?? i.amount ?? 0), 0);
    const total   = invoices.reduce((s, i) => s + Number(i.totalAmount ?? i.amount ?? 0), 0);
    return { paid, pending, overdue, total, count: invoices.length };
  }, [invoices]);

  /* ── status pie ── */
  const pieData = useMemo(() => [
    { name: 'مدفوعة',  value: totals.paid,    color: '#10b981' },
    { name: 'معلقة',   value: totals.pending,  color: '#f59e0b' },
    { name: 'متأخرة',  value: totals.overdue,  color: '#ef4444' },
  ].filter(d => d.value > 0), [totals]);

  /* ── recent invoices ── */
  const recent = useMemo(() =>
    [...invoices].sort((a, b) => new Date(b.issueDate ?? b.createdAt) - new Date(a.issueDate ?? a.createdAt)).slice(0, 8),
  [invoices]);

  /* ── overdue invoices ── */
  const overdueList = useMemo(() => invoices.filter(i => i.status === 'Overdue'), [invoices]);

  if (invLoad) return (
    <div className="flex items-center justify-center h-64 text-gray-400 gap-3">
      <RefreshCw size={20} className="animate-spin" />
      <span>جاري تحميل بيانات التدفق النقدي...</span>
    </div>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto" dir="rtl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">تحليل التدفق النقدي</h1>
          <p className="text-sm text-gray-400 mt-1">بيانات حية من الفواتير والمشاريع</p>
        </div>
        <button onClick={() => refetch()} className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-xl transition-colors">
          <RefreshCw size={15} /> تحديث
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign}     label="إجمالي الإيرادات"  value={`${fmtK(totals.total)} ج.م`}   color="bg-blue-50 text-blue-600"    />
        <StatCard icon={CheckCircle2}   label="المبالغ المحصّلة"  value={`${fmtK(totals.paid)} ج.م`}    color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Clock}          label="في انتظار السداد"  value={`${fmtK(totals.pending)} ج.م`} color="bg-amber-50 text-amber-600"  />
        <StatCard icon={AlertTriangle}  label="فواتير متأخرة"     value={`${fmtK(totals.overdue)} ج.م`} color="bg-red-50 text-red-500"      sub={`${overdueList.length} فاتورة`} />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Monthly bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">التدفق النقدي الشهري (آخر 6 أشهر)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={fmtK} tick={{ fontSize: 11 }} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="inflow"  name="محصّل"  fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="pending" name="معلق"   fill="#f59e0b" radius={[4,4,0,0]} />
              <Bar dataKey="overdue" name="متأخر"  fill="#ef4444" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">توزيع الفواتير</h2>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `${fmtK(v)} ج.م`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {pieData.map((d) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{fmtK(d.value)} ج.م</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">لا توجد بيانات</div>
          )}
        </div>
      </div>

      {/* ── Projects Budget row ── */}
      {projects.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="font-semibold text-gray-800 mb-4">ميزانيات المشاريع</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right border-b border-gray-100">
                  <th className="pb-3 font-medium text-gray-400 pr-0">المشروع</th>
                  <th className="pb-3 font-medium text-gray-400">الحالة</th>
                  <th className="pb-3 font-medium text-gray-400">الميزانية</th>
                  <th className="pb-3 font-medium text-gray-400">المنصرف</th>
                  <th className="pb-3 font-medium text-gray-400">النسبة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {projects.slice(0, 8).map((p) => {
                  const budget  = Number(p.budget ?? p.totalBudget ?? 0);
                  const spent   = Number(p.spentAmount ?? p.actualCost ?? 0);
                  const pct     = budget > 0 ? Math.min(100, Math.round(spent / budget * 100)) : 0;
                  const barColor = pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-amber-400' : 'bg-emerald-400';
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-gray-800 max-w-[200px] truncate pr-0">{p.name}</td>
                      <td className="py-3">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">{p.status ?? '—'}</span>
                      </td>
                      <td className="py-3 text-gray-600">{budget > 0 ? `${fmtK(budget)} ج.م` : '—'}</td>
                      <td className="py-3 text-gray-600">{spent > 0 ? `${fmtK(spent)} ج.م` : '—'}</td>
                      <td className="py-3 w-36">
                        {budget > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{pct}%</span>
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Overdue alert ── */}
      {overdueList.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="font-semibold text-red-700">فواتير متأخرة تحتاج متابعة ({overdueList.length})</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {overdueList.slice(0, 6).map((inv) => (
              <div key={inv.id} className="bg-white rounded-xl border border-red-100 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-800 text-sm truncate">{inv.title ?? inv.invoiceNumber ?? `فاتورة #${inv.id?.slice(0,8)}`}</p>
                    <p className="text-xs text-gray-400 mt-0.5">استحقاق: {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('ar-EG') : '—'}</p>
                  </div>
                  <span className="text-sm font-bold text-red-600 flex-shrink-0">{fmtK(inv.totalAmount ?? inv.amount ?? 0)} ج.م</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Recent Invoices ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-800 mb-4">آخر الفواتير</h2>
        {recent.length === 0 ? (
          <div className="text-center text-gray-400 py-10 text-sm">لا توجد فواتير حتى الآن</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right border-b border-gray-100">
                  <th className="pb-3 font-medium text-gray-400 pr-0">الفاتورة</th>
                  <th className="pb-3 font-medium text-gray-400">العميل</th>
                  <th className="pb-3 font-medium text-gray-400">تاريخ الإصدار</th>
                  <th className="pb-3 font-medium text-gray-400">الاستحقاق</th>
                  <th className="pb-3 font-medium text-gray-400">المبلغ</th>
                  <th className="pb-3 font-medium text-gray-400">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recent.map((inv) => {
                  const st = inv.status ?? 'Draft';
                  return (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-medium text-gray-800 pr-0 max-w-[160px] truncate">
                        {inv.title ?? inv.invoiceNumber ?? `#${inv.id?.slice(0,8)}`}
                      </td>
                      <td className="py-3 text-gray-500">{inv.clientName ?? inv.client?.name ?? '—'}</td>
                      <td className="py-3 text-gray-500">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString('ar-EG') : '—'}</td>
                      <td className="py-3 text-gray-500">{inv.dueDate  ? new Date(inv.dueDate).toLocaleDateString('ar-EG')  : '—'}</td>
                      <td className="py-3 font-semibold text-gray-800">{fmtK(inv.totalAmount ?? inv.amount ?? 0)} ج.م</td>
                      <td className="py-3">
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${statusColor[st] ?? 'text-gray-500 bg-gray-100'}`}>
                          {statusAr[st] ?? st}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
