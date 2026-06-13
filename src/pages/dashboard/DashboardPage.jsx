import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  FolderOpen, CheckSquare, AlertCircle, DollarSign, FileText,
  TrendingUp, Clock, Activity, ChevronRight, ChevronLeft,
  Sparkles, AlertTriangle, Warehouse, ShoppingCart,
  ClipboardList, PackageCheck, ArrowUpFromLine, RefreshCw,
  Zap, BarChart3,
} from 'lucide-react';
import { dashboardApi, qualityReportApi } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { StatCard, PageLoader, ErrorMsg } from '../../components/common/index';
import toast from 'react-hot-toast';

function fmt(value) {
  if (value == null) return '—';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}
function fmtCurrency(value) {
  if (value == null) return '—';
  return fmt(value);
}
function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
function getGreeting(lang) {
  const hour = new Date().getHours();
  if (lang === 'ar') {
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء النور';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AlertBar({ anomalies, overview, ar }) {
  const highAnoms  = anomalies?.anomalies?.filter(a => a.severity === 'HIGH') ?? [];
  const emptyStock = overview?.emptyStockCount ?? 0;
  const lowStock   = overview?.lowStockCount   ?? 0;

  const alerts = [];
  if (emptyStock > 0)
    alerts.push({ type: 'danger', icon: <Warehouse size={14}/>, text: ar ? `${emptyStock} أصناف نفد رصيدها في المستودع` : `${emptyStock} items out of stock`, to: '/warehouse/items' });
  if (highAnoms.length > 0)
    alerts.push({ type: 'danger', icon: <AlertCircle size={14}/>, text: ar ? `${highAnoms.length} شذوذ حرج مكتشف` : `${highAnoms.length} critical anomalies detected`, to: '/quality/reports' });
  if (lowStock > 0)
    alerts.push({ type: 'warning', icon: <AlertTriangle size={14}/>, text: ar ? `${lowStock} أصناف منخفضة الرصيد` : `${lowStock} low stock items`, to: '/warehouse/items' });
  if ((anomalies?.mediumCount ?? 0) > 0)
    alerts.push({ type: 'warning', icon: <AlertTriangle size={14}/>, text: ar ? `${anomalies.mediumCount} تحذير في النظام` : `${anomalies.mediumCount} system warnings`, to: '/quality/reports' });

  if (alerts.length === 0) return null;

  const colors = {
    danger:  'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100',
  };

  return (
    <div className="space-y-2">
      {alerts.slice(0, 3).map((a, i) => (
        <Link key={i} to={a.to}
          className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${colors[a.type]}`}>
          <span className="flex-shrink-0">{a.icon}</span>
          <span className="flex-1">{a.text}</span>
          <ChevronLeft size={14} className="flex-shrink-0 opacity-50" />
        </Link>
      ))}
    </div>
  );
}

function QuickActions({ ar, navigate }) {
  const actions = [
    { label: ar ? 'طلب احتياج جديد' : 'New Requisition',  icon: <ClipboardList size={15}/>, to: '/procurement/requisitions', color: 'text-blue-600   bg-blue-50   hover:bg-blue-100'   },
    { label: ar ? 'إذن صرف جديد'    : 'New Disbursement', icon: <ArrowUpFromLine size={15}/>, to: '/warehouse/disbursements', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100' },
    { label: ar ? 'مستخلص جديد'     : 'New Certificate',  icon: <FileText size={15}/>,       to: '/quality/certificates',    color: 'text-green-600  bg-green-50  hover:bg-green-100'  },
    { label: ar ? 'تقرير ISO'        : 'ISO Report',       icon: <Sparkles size={15}/>,       to: '/quality/reports',         color: 'text-purple-600 bg-purple-50 hover:bg-purple-100' },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(a => (
        <button key={a.to} onClick={() => navigate(a.to)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${a.color}`}>
          {a.icon} {a.label}
        </button>
      ))}
    </div>
  );
}

function ProcurementPipeline({ overview, ar }) {
  if (!overview) return null;
  const steps = [
    { label: ar ? 'طلبات احتياج'  : 'Requisitions',   count: overview.requisitionCount ?? 0, color: 'bg-blue-100 text-blue-700',   to: '/procurement/requisitions'  },
    { label: ar ? 'طلبات شراء'    : 'Purchase Orders', count: overview.purchaseCount     ?? 0, color: 'bg-yellow-100 text-yellow-700', to: '/procurement/purchases'   },
    { label: ar ? 'أذونات إضافة'  : 'GRN',            count: overview.grnCount          ?? 0, color: 'bg-green-100 text-green-700',  to: '/procurement/permits'       },
    { label: ar ? 'أصناف مستودع'  : 'Stock Items',     count: overview.warehouseItemCount ?? 0, color: 'bg-gray-100 text-gray-600',  to: '/warehouse/items'           },
    { label: ar ? 'نفد الرصيد'    : 'Out of Stock',    count: overview.emptyStockCount   ?? 0, color: 'bg-red-100 text-red-700',    to: '/warehouse/items'           },
  ];
  return (
    <div className="card">
      <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <ShoppingCart size={17} className="text-primary-600" />
        {ar ? 'مسار المشتريات والمستودعات' : 'Procurement & Warehouse Pipeline'}
      </h2>
      <div className="flex items-start justify-between gap-1">
        {steps.map((s, i) => (
          <div key={i} className="flex items-start gap-1 flex-1 min-w-0">
            <Link to={s.to} className="flex flex-col items-center gap-1 flex-1 text-center group">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base font-bold transition-opacity group-hover:opacity-80 ${s.color}`}>
                {s.count}
              </div>
              <span className="text-[11px] text-gray-500 leading-tight">{s.label}</span>
            </Link>
            {i < steps.length - 1 && (
              <div className="text-gray-300 text-lg pt-2 flex-shrink-0">←</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function BoqProgress({ overview, ar }) {
  if (!overview || !overview.boqTotalValue) return null;
  const pct = Math.min(100, Math.round((overview.ownerCertTotal / overview.boqTotalValue) * 100));
  const barColor = pct >= 90 ? '#16a34a' : pct >= 60 ? '#2563eb' : pct >= 30 ? '#d97706' : '#dc2626';
  return (
    <div className="card">
      <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
        <BarChart3 size={17} className="text-primary-600" />
        {ar ? 'نسبة تنفيذ الحصر' : 'BOQ Execution Progress'}
      </h2>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{ar ? 'المستخلصات المعتمدة' : 'Certified'}: {fmt(overview.ownerCertTotal)}</span>
        <span>{ar ? 'إجمالي الحصر' : 'BOQ Total'}: {fmt(overview.boqTotalValue)}</span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
      </div>
      <div className="flex justify-between items-center mt-1.5">
        <span className="text-xs text-gray-400">{ar ? 'نسبة الإنجاز' : 'Completion'}</span>
        <span className="text-sm font-bold" style={{ color: barColor }}>{pct}%</span>
      </div>
    </div>
  );
}

function WarehouseHealth({ overview, ar }) {
  if (!overview) return null;
  const total = overview.warehouseItemCount ?? 0;
  const empty = overview.emptyStockCount    ?? 0;
  const low   = overview.lowStockCount      ?? 0;
  const ok    = Math.max(0, total - empty - low);
  return (
    <div className="card">
      <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
        <Warehouse size={17} className="text-primary-600" />
        {ar ? 'صحة المستودع' : 'Warehouse Health'}
      </h2>
      <div className="grid grid-cols-3 gap-2 text-center">
        <Link to="/warehouse/items" className="bg-green-50 rounded-xl p-3 hover:bg-green-100 transition-colors">
          <div className="text-xl font-bold text-green-700">{ok}</div>
          <div className="text-xs text-green-600 mt-1">{ar ? 'طبيعي' : 'OK'}</div>
        </Link>
        <Link to="/warehouse/items" className="bg-yellow-50 rounded-xl p-3 hover:bg-yellow-100 transition-colors">
          <div className="text-xl font-bold text-yellow-700">{low}</div>
          <div className="text-xs text-yellow-600 mt-1">{ar ? 'منخفض' : 'Low'}</div>
        </Link>
        <Link to="/warehouse/items" className="bg-red-50 rounded-xl p-3 hover:bg-red-100 transition-colors">
          <div className="text-xl font-bold text-red-700">{empty}</div>
          <div className="text-xs text-red-600 mt-1">{ar ? 'نفد' : 'Empty'}</div>
        </Link>
      </div>
      {total === 0 && (
        <p className="text-xs text-gray-400 text-center mt-3">{ar ? 'لا توجد أصناف في المستودع بعد' : 'No warehouse items yet'}</p>
      )}
    </div>
  );
}

function AiSummaryWidget({ ar }) {
  const [summary, setSummary] = useState('');
  const mut = useMutation({
    mutationFn: () => qualityReportApi.getDailySummary(),
    onSuccess: (res) => {
      setSummary(res.data?.data ?? '');
      toast.success(ar ? 'تم توليد الملخص' : 'Summary generated');
    },
    onError: () => toast.error(ar ? 'فشل التوليد' : 'Generation failed'),
  });

  return (
    <div className="card border border-purple-100 bg-gradient-to-br from-purple-50/60 to-blue-50/40">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles size={17} className="text-purple-600" />
          {ar ? 'ملخص يومي بالذكاء الاصطناعي' : 'AI Daily Summary'}
        </h2>
        <button onClick={() => mut.mutate()} disabled={mut.isPending}
          className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-100 hover:bg-purple-200 px-3 py-1.5 rounded-lg disabled:opacity-60 transition-colors">
          {mut.isPending
            ? <><RefreshCw size={12} className="animate-spin" /> {ar ? 'جاري التوليد...' : 'Generating...'}</>
            : <><Zap size={12} /> {ar ? 'توليد الملخص' : 'Generate'}</>}
        </button>
      </div>
      {summary ? (
        <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
      ) : (
        <p className="text-sm text-gray-400 text-center py-4">
          {ar ? 'اضغط "توليد الملخص" للحصول على تحليل يومي بالذكاء الاصطناعي' : 'Click "Generate" to get an AI-powered daily analysis'}
        </p>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user }          = useAuth();
  const { t, lang, isRTL } = useLang();
  const navigate            = useNavigate();
  const ar                  = lang === 'ar';
  const ArrowIcon           = isRTL ? ChevronLeft : ChevronRight;

  const { data: dashData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dashboard', 'consulting'],
    queryFn:  () => dashboardApi.getConsulting().then(r => r.data?.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: overview } = useQuery({
    queryKey: ['quality-overview'],
    queryFn:  () => qualityReportApi.getOverview().then(r => r.data?.data),
    staleTime: 3 * 60 * 1000,
  });

  const { data: anomalies } = useQuery({
    queryKey: ['quality-anomalies'],
    queryFn:  () => qualityReportApi.getAnomalies().then(r => r.data?.data),
    staleTime: 3 * 60 * 1000,
  });

  if (isLoading) return <PageLoader />;
  if (isError) return (
    <div className="p-6">
      <ErrorMsg message={error?.response?.data?.message || (ar ? 'فشل تحميل لوحة التحكم' : 'Failed to load dashboard')} />
      <button onClick={refetch} className="btn-primary mt-4 text-sm px-4 py-2">{ar ? 'إعادة المحاولة' : 'Retry'}</button>
    </div>
  );

  const stats           = dashData?.stats || dashData || {};
  const recentActivity  = dashData?.recentActivity  || [];
  const overdueProjects = dashData?.overdueProjects || [];

  return (
    <div className="space-y-5 p-1">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting(lang)},{' '}
            <span className="text-primary-600">{user?.fullName?.split(' ')[0] || t('name')}</span> 👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {ar ? 'إليك نظرة عامة على مشاريعك' : "Here's an overview of your projects"}
          </p>
        </div>
        <span className="text-xs text-gray-400">{formatDate(new Date().toISOString())}</span>
      </div>

      {/* ── 1. Alert Bar ───────────────────────────────────────────────────── */}
      {(anomalies || overview) && (
        <AlertBar anomalies={anomalies} overview={overview} ar={ar} />
      )}

      {/* ── 2. Quick Actions ───────────────────────────────────────────────── */}
      <div className="card py-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          {ar ? 'إجراءات سريعة' : 'Quick Actions'}
        </p>
        <QuickActions ar={ar} navigate={navigate} />
      </div>

      {/* ── 3. Stat Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={ar ? 'إجمالي المشاريع' : 'Total Projects'}   value={stats.totalProjects    ?? stats.TotalProjects}    icon={FolderOpen}   color="primary" />
        <StatCard title={ar ? 'المشاريع النشطة' : 'Active Projects'}  value={stats.activeProjects   ?? stats.ActiveProjects}   icon={Activity}     color="blue"    />
        <StatCard title={ar ? 'إجمالي المهام'   : 'Total Tasks'}      value={stats.totalTasks       ?? stats.TotalTasks}       icon={CheckSquare}  color="green"   />
        <StatCard title={ar ? 'المهام المتأخرة' : 'Overdue Tasks'}    value={stats.overdueTasks     ?? stats.OverdueTasks}     icon={AlertCircle}  color="red"     />
        <StatCard title={ar ? 'إجمالي الفواتير' : 'Total Invoiced'}   value={fmtCurrency(stats.totalInvoiced  ?? stats.TotalInvoiced)}  icon={DollarSign}   color="purple"  />
        <StatCard title={ar ? 'المبالغ المحصلة' : 'Total Paid'}       value={fmtCurrency(stats.totalPaid      ?? stats.TotalPaid)}      icon={TrendingUp}   color="green"   />
        <StatCard title={ar ? 'إجمالي العقود'   : 'Total Contracts'}  value={stats.totalContracts   ?? stats.TotalContracts}   icon={FileText}     color="blue"    />
        <StatCard title={ar ? 'العقود الموقعة'  : 'Signed Contracts'} value={stats.signedContracts  ?? stats.SignedContracts}  icon={CheckSquare}  color="primary" />
      </div>

      {/* ── 4. Procurement Pipeline ────────────────────────────────────────── */}
      <ProcurementPipeline overview={overview} ar={ar} />

      {/* ── 5. BOQ Progress + Warehouse Health ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BoqProgress    overview={overview} ar={ar} />
        <WarehouseHealth overview={overview} ar={ar} />
      </div>

      {/* ── 6. Recent Activity + Overdue Projects ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity size={18} className="text-primary-600" />
              {ar ? 'النشاط الأخير' : 'Recent Activity'}
            </h2>
          </div>
          {recentActivity.length === 0 ? (
            <div className="text-center py-10">
              <Clock size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{ar ? 'لا يوجد نشاط حديث' : 'No recent activity'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((item, idx) => (
                <div key={item.id ?? idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">{item.description || item.message || item.title || '—'}</p>
                    {item.createdAt && <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.createdAt)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              {ar ? 'المشاريع المتأخرة' : 'Overdue Projects'}
            </h2>
            <Link to="/projects?status=Overdue" className="text-xs text-primary-600 hover:underline flex items-center gap-0.5">
              {ar ? 'عرض الكل' : 'View all'}<ArrowIcon size={14} />
            </Link>
          </div>
          {overdueProjects.length === 0 ? (
            <div className="text-center py-10">
              <CheckSquare size={36} className="text-green-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">{ar ? 'لا توجد مشاريع متأخرة 🎉' : 'No overdue projects 🎉'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueProjects.slice(0, 6).map((project, idx) => (
                <Link key={project.id ?? idx} to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-red-50 transition-colors group border border-transparent hover:border-red-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{project.name || project.title || '—'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {project.endDate && <span className="text-xs text-red-500">{ar ? 'انتهت:' : 'Due:'} {formatDate(project.endDate)}</span>}
                      {project.clientName && <span className="text-xs text-gray-400 truncate">· {project.clientName}</span>}
                    </div>
                  </div>
                  <ArrowIcon size={16} className="text-gray-300 group-hover:text-red-400 flex-shrink-0 ms-2" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 7. AI Daily Summary ────────────────────────────────────────────── */}
      <AiSummaryWidget ar={ar} />

    </div>
  );
}
