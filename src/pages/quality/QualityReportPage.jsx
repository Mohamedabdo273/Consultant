import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  BarChart3, AlertTriangle, AlertCircle, CheckCircle2, FileText,
  TrendingUp, TrendingDown, Package, ShoppingCart, Sparkles,
  RefreshCw, Download, ChevronDown, ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { qualityReportApi } from '../../api/index';
import { Spinner } from '../../components/common/index';
import { useLang } from '../../context/LangContext';

const SEVERITY_STYLES = {
  HIGH:   { bg: 'bg-red-50 border-red-200',    text: 'text-red-700',    badge: 'bg-red-100 text-red-700',    icon: <AlertCircle size={14} /> },
  MEDIUM: { bg: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700', badge: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle size={14} /> },
  LOW:    { bg: 'bg-blue-50 border-blue-200',   text: 'text-blue-700',   badge: 'bg-blue-100 text-blue-700',   icon: <CheckCircle2 size={14} /> },
};
const SEVERITY_AR = { HIGH: 'حرج', MEDIUM: 'تحذير', LOW: 'ملاحظة' };

const FLOW_STATUS_STYLES = {
  OK:          'bg-green-100 text-green-700',
  LOW:         'bg-yellow-100 text-yellow-700',
  EMPTY:       'bg-red-100 text-red-700',
  DISCREPANCY: 'bg-orange-100 text-orange-700',
};
const FLOW_STATUS_AR = { OK: 'طبيعي', LOW: 'منخفض', EMPTY: 'نفد', DISCREPANCY: 'فرق' };

export default function QualityReportPage() {
  const { lang } = useLang();
  const ar = lang === 'ar';
  const [tab, setTab] = useState('overview'); // overview | anomalies | flow | iso
  const [isoLang, setIsoLang] = useState(lang);
  const [reportText, setReportText] = useState('');
  const [showAllAnomalies, setShowAllAnomalies] = useState(false);

  const { data: overview, isLoading: loadOv } = useQuery({
    queryKey: ['quality-overview'],
    queryFn: () => qualityReportApi.getOverview().then(r => r.data?.data),
    staleTime: 60_000,
  });

  const { data: anomalies, isLoading: loadAn } = useQuery({
    queryKey: ['quality-anomalies'],
    queryFn: () => qualityReportApi.getAnomalies().then(r => r.data?.data),
    staleTime: 60_000,
    enabled: tab === 'anomalies' || tab === 'overview',
  });

  const { data: flow, isLoading: loadFlow } = useQuery({
    queryKey: ['quality-flow'],
    queryFn: () => qualityReportApi.getItemFlow().then(r => r.data?.data ?? []),
    staleTime: 60_000,
    enabled: tab === 'flow',
  });

  const isoMut = useMutation({
    mutationFn: (d) => qualityReportApi.generateIsoReport(d),
    onSuccess: (res) => {
      setReportText(res.data?.data?.reportText ?? '');
      toast.success(ar ? 'تم توليد التقرير' : 'Report generated');
    },
    onError: () => toast.error(ar ? 'فشل توليد التقرير' : 'Failed to generate report'),
  });

  const [fraudData, setFraudData] = useState(null);
  const fraudMut = useMutation({
    mutationFn: () => qualityReportApi.analyzeFraud(),
    onSuccess: (res) => {
      setFraudData(res.data?.data ?? null);
      toast.success(ar ? 'تم تحليل المستخلصات' : 'Analysis complete');
    },
    onError: () => toast.error(ar ? 'فشل التحليل' : 'Analysis failed'),
  });

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  const tabs = [
    { key: 'overview',  label: ar ? 'نظرة عامة'        : 'Overview'        },
    { key: 'anomalies', label: ar ? 'كشف الشذوذ'       : 'Anomalies'       },
    { key: 'flow',      label: ar ? 'حركة الأصناف'     : 'Item Flow'       },
    { key: 'iso',       label: ar ? 'تقرير ISO بالـ AI'  : 'ISO Report (AI)' },
    { key: 'fraud',     label: ar ? 'كشف التلاعب 🔍'    : 'Fraud Detection 🔍' },
  ];

  const visibleAnomalies = showAllAnomalies ? anomalies?.anomalies : anomalies?.anomalies?.slice(0, 6);

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 size={24} className="text-primary-600" />
        <div>
          <h1 className="text-xl font-bold text-gray-800">{ar ? 'تقارير الجودة والتحليل' : 'Quality Reports & Analysis'}</h1>
          <p className="text-sm text-gray-500">{ar ? 'تحليل شامل لكل وحدات النظام + تقرير ISO بالذكاء الاصطناعي' : 'Full system analysis + AI-powered ISO report'}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white shadow text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {loadOv ? <div className="flex justify-center py-16"><Spinner /></div> : (
            <>
              {/* Anomaly Alert Bar */}
              {anomalies && anomalies.totalAnomalies > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
                  <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
                  <div className="flex-1 text-sm text-red-700">
                    <span className="font-bold">{anomalies.totalAnomalies} {ar ? 'شذوذ مكتشف' : 'anomalies detected'}</span>
                    {' — '}
                    <span className="font-bold text-red-800">{anomalies.highCount} {ar ? 'حرج' : 'critical'}</span>
                    {', '}<span>{anomalies.mediumCount} {ar ? 'تحذير' : 'warning'}</span>
                    {', '}<span>{anomalies.lowCount} {ar ? 'ملاحظة' : 'notice'}</span>
                  </div>
                  <button onClick={() => setTab('anomalies')} className="text-xs text-red-600 hover:underline font-medium">
                    {ar ? 'عرض التفاصيل' : 'View Details'}
                  </button>
                </div>
              )}

              {/* 3 Sections */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* القطاع الفني */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-blue-600 px-4 py-3">
                    <h3 className="text-white font-bold text-sm">{ar ? 'القطاع الفني' : 'Technical Sector'}</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <Stat label={ar ? 'حصر (BOQ)' : 'BOQs'} value={overview?.boqCount} unit={ar ? 'حصر' : ''} />
                    <Stat label={ar ? 'قيمة الحصر' : 'BOQ Value'} value={fmt(overview?.boqTotalValue)} />
                    <Stat label={ar ? 'المستخلصات' : 'Certificates'} value={overview?.certificateCount} />
                    <Stat label={ar ? 'إجمالي المالك' : 'Owner Total'} value={fmt(overview?.ownerCertTotal)} color="green" />
                    <Stat label={ar ? 'إجمالي المقاول' : 'Contractor Total'} value={fmt(overview?.contractorCertTotal)} color="purple" />
                    <Stat label={ar ? 'الفرق' : 'Variance'} value={fmt(overview?.certVariance)}
                      color={Math.abs(overview?.certVariance ?? 0) > 0 ? 'red' : 'gray'} />
                  </div>
                </div>

                {/* المشتريات */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-purple-600 px-4 py-3">
                    <h3 className="text-white font-bold text-sm">{ar ? 'المشتريات' : 'Procurement'}</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <Stat label={ar ? 'طلبات احتياج' : 'Requisitions'} value={overview?.requisitionCount} />
                    <Stat label={ar ? 'طلبات شراء' : 'Purchase Orders'} value={overview?.purchaseCount} />
                    <Stat label={ar ? 'قيمة الشراء' : 'Purchase Value'} value={fmt(overview?.purchaseTotalValue)} />
                    <Stat label={ar ? 'وثائق استلام (GRN)' : 'GRN Count'} value={overview?.grnCount} />
                    <Stat label={ar ? 'قيمة المستلَم' : 'GRN Value'} value={fmt(overview?.grnTotalValue)} color="green" />
                    <Stat label={ar ? 'الفرق (لم يُستلم)' : 'Not Received'}
                      value={fmt((overview?.purchaseTotalValue ?? 0) - (overview?.grnTotalValue ?? 0))}
                      color={(overview?.purchaseTotalValue ?? 0) > (overview?.grnTotalValue ?? 0) ? 'red' : 'green'} />
                  </div>
                </div>

                {/* المستودعات */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-teal-600 px-4 py-3">
                    <h3 className="text-white font-bold text-sm">{ar ? 'المستودعات' : 'Warehouse'}</h3>
                  </div>
                  <div className="p-4 space-y-3">
                    <Stat label={ar ? 'الأصناف' : 'Items'} value={overview?.warehouseItemCount} />
                    <Stat label={ar ? 'قيمة المخزون' : 'Stock Value'} value={fmt(overview?.totalStockValue)} color="green" />
                    <Stat label={ar ? 'إجمالي المصروف' : 'Total Disbursed'} value={fmt(overview?.totalDisbursed)} color="orange" />
                    <Stat label={ar ? 'رصيد منخفض' : 'Low Stock'} value={overview?.lowStockCount}
                      color={overview?.lowStockCount > 0 ? 'yellow' : 'gray'} />
                    <Stat label={ar ? 'نفد الرصيد' : 'Out of Stock'} value={overview?.emptyStockCount}
                      color={overview?.emptyStockCount > 0 ? 'red' : 'gray'} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Anomalies Tab ────────────────────────────────────────────────────── */}
      {tab === 'anomalies' && (
        <div className="space-y-3">
          {loadAn ? <div className="flex justify-center py-16"><Spinner /></div> : (
            <>
              {/* Summary */}
              {anomalies && (
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center border">
                    <p className="text-xs text-gray-500">{ar ? 'الإجمالي' : 'Total'}</p>
                    <p className="text-2xl font-bold text-gray-800">{anomalies.totalAnomalies}</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                    <p className="text-xs text-red-500">{ar ? 'حرج' : 'Critical'}</p>
                    <p className="text-2xl font-bold text-red-700">{anomalies.highCount}</p>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
                    <p className="text-xs text-yellow-600">{ar ? 'تحذير' : 'Warning'}</p>
                    <p className="text-2xl font-bold text-yellow-700">{anomalies.mediumCount}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
                    <p className="text-xs text-blue-500">{ar ? 'ملاحظة' : 'Notice'}</p>
                    <p className="text-2xl font-bold text-blue-700">{anomalies.lowCount}</p>
                  </div>
                </div>
              )}

              {anomalies?.totalAnomalies === 0 ? (
                <div className="text-center py-16 bg-green-50 rounded-2xl border border-green-100">
                  <CheckCircle2 size={48} className="mx-auto mb-3 text-green-500" />
                  <p className="font-bold text-green-700">{ar ? 'ممتاز! لا توجد شذوذات مكتشفة' : 'Excellent! No anomalies detected'}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleAnomalies?.map((a, i) => {
                    const s = SEVERITY_STYLES[a.severity] ?? SEVERITY_STYLES.LOW;
                    return (
                      <div key={i} className={`flex items-start gap-3 p-4 rounded-xl border ${s.bg}`}>
                        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${s.badge}`}>
                          {s.icon}
                          {ar ? SEVERITY_AR[a.severity] : a.severity}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-bold text-sm ${s.text}`}>{a.title}</p>
                            <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border">{a.category}</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5">{a.description}</p>
                        </div>
                        {a.value !== null && a.value !== undefined && (
                          <p className={`text-sm font-bold flex-shrink-0 ${s.text}`}>{Number(a.value).toLocaleString()}</p>
                        )}
                      </div>
                    );
                  })}
                  {anomalies?.anomalies?.length > 6 && (
                    <button onClick={() => setShowAllAnomalies(v => !v)}
                      className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1">
                      {showAllAnomalies
                        ? <><ChevronUp size={14} /> {ar ? 'عرض أقل' : 'Show less'}</>
                        : <><ChevronDown size={14} /> {ar ? `عرض ${anomalies.anomalies.length - 6} شذوذ إضافي` : `Show ${anomalies.anomalies.length - 6} more`}</>}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Item Flow Tab ────────────────────────────────────────────────────── */}
      {tab === 'flow' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loadFlow ? <div className="flex justify-center py-16"><Spinner /></div> : (
            flow?.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Package size={40} className="mx-auto mb-3 opacity-30" />
                <p>{ar ? 'لا توجد بيانات حركة أصناف' : 'No item flow data'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500 border-b">
                    <tr>
                      <th className="px-4 py-3 text-right">{ar ? 'كود الصنف' : 'Item Code'}</th>
                      <th className="px-4 py-3 text-right">{ar ? 'الوصف' : 'Description'}</th>
                      <th className="px-4 py-3 text-right">{ar ? 'الوحدة' : 'Unit'}</th>
                      <th className="px-4 py-3 text-right">{ar ? 'إجمالي الوارد' : 'Total In'}</th>
                      <th className="px-4 py-3 text-right">{ar ? 'إجمالي الصادر' : 'Total Out'}</th>
                      <th className="px-4 py-3 text-right">{ar ? 'الرصيد الفعلي' : 'Actual Stock'}</th>
                      <th className="px-4 py-3 text-right">{ar ? 'الرصيد المتوقع' : 'Expected'}</th>
                      <th className="px-4 py-3 text-right">{ar ? 'الفرق' : 'Variance'}</th>
                      <th className="px-4 py-3 text-center">{ar ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flow?.map((item, i) => (
                      <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${item.status !== 'OK' ? 'bg-red-50/30' : ''}`}>
                        <td className="px-4 py-3 font-mono text-xs text-blue-600 font-bold">{item.itemCode}</td>
                        <td className="px-4 py-3 text-gray-700">{item.description}</td>
                        <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                        <td className="px-4 py-3 text-green-700 font-medium">
                          <span className="flex items-center gap-1"><TrendingUp size={12} /> {item.totalReceived.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 text-red-600 font-medium">
                          <span className="flex items-center gap-1"><TrendingDown size={12} /> {item.totalDisbursed.toLocaleString()}</span>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-800">{item.currentStock.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-500">{item.expectedStock.toLocaleString()}</td>
                        <td className={`px-4 py-3 font-medium ${Math.abs(item.variance) > 0.001 ? 'text-red-600' : 'text-gray-400'}`}>
                          {item.variance > 0 ? '+' : ''}{item.variance.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${FLOW_STATUS_STYLES[item.status] ?? ''}`}>
                            {ar ? FLOW_STATUS_AR[item.status] : item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      )}

      {/* ── ISO Report Tab ───────────────────────────────────────────────────── */}
      {tab === 'iso' && (
        <div className="space-y-4">
          {/* Generate Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-end gap-4">
            <div className="flex-1">
              <label className="form-label">{ar ? 'اسم المشروع (اختياري)' : 'Project Name (optional)'}</label>
              <input id="projectNameInput" className="form-input" placeholder={ar ? 'مثال: مشروع المستشفى الجديد' : 'e.g. New Hospital Project'} />
            </div>
            <div>
              <label className="form-label">{ar ? 'لغة التقرير' : 'Report Language'}</label>
              <select value={isoLang} onChange={e => setIsoLang(e.target.value)} className="form-input">
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <button
              onClick={() => isoMut.mutate({
                projectName: document.getElementById('projectNameInput').value,
                language: isoLang,
              })}
              disabled={isoMut.isPending}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              {isoMut.isPending ? <Spinner size="sm" /> : <Sparkles size={16} />}
              {isoMut.isPending ? (ar ? 'جاري التوليد...' : 'Generating...') : (ar ? 'توليد تقرير ISO' : 'Generate ISO Report')}
            </button>
          </div>

          {/* Report Output */}
          {reportText && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-primary-600" />
                  <span className="font-bold text-gray-800">{ar ? 'تقرير ISO المُولَّد بالذكاء الاصطناعي' : 'AI-Generated ISO Report'}</span>
                </div>
                <button
                  onClick={() => {
                    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = `iso-report-${new Date().toISOString().split('T')[0]}.txt`;
                    a.click(); URL.revokeObjectURL(url);
                  }}
                  className="btn-secondary flex items-center gap-1 text-xs py-1.5"
                >
                  <Download size={13} /> {ar ? 'تحميل' : 'Download'}
                </button>
              </div>
              <div className="p-6">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-sans" dir={isoLang === 'ar' ? 'rtl' : 'ltr'}>
                  {reportText}
                </pre>
              </div>
            </div>
          )}

          {!reportText && !isoMut.isPending && (
            <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
              <Sparkles size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">{ar ? 'اضغط "توليد تقرير ISO" لإنشاء التقرير بالذكاء الاصطناعي' : 'Click "Generate ISO Report" to create an AI-powered report'}</p>
              <p className="text-xs mt-1">{ar ? 'سيشمل التقرير تحليل شامل لكل وحدات النظام' : 'The report will include a full analysis of all system modules'}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Fraud Detection Tab ──────────────────────────────────────────────── */}
      {tab === 'fraud' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-800 flex items-center gap-2">
                  <Sparkles size={18} className="text-purple-600" />
                  {ar ? 'تحليل التلاعب في المستخلصات' : 'Certificate Fraud Analysis'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {ar ? 'يكشف: الفوترة الزائدة، تضخيم الأسعار، التكرار' : 'Detects: over-billing, price inflation, duplicate entries'}
                </p>
              </div>
              <button onClick={() => fraudMut.mutate()} disabled={fraudMut.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-60">
                {fraudMut.isPending
                  ? <><RefreshCw size={14} className="animate-spin" /> {ar ? 'جاري التحليل...' : 'Analyzing...'}</>
                  : <><Sparkles size={14} /> {ar ? 'تشغيل التحليل' : 'Run Analysis'}</>}
              </button>
            </div>

            {!fraudData && !fraudMut.isPending && (
              <div className="text-center py-12 text-gray-400">
                <Sparkles size={40} className="mx-auto mb-3 opacity-30" />
                <p>{ar ? 'اضغط "تشغيل التحليل" لبدء فحص المستخلصات بالذكاء الاصطناعي' : 'Click "Run Analysis" to start AI fraud detection'}</p>
              </div>
            )}

            {fraudData && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-gray-800">{fraudData.totalFlags}</div>
                    <div className="text-xs text-gray-500 mt-1">{ar ? 'إجمالي الاستثناءات' : 'Total Flags'}</div>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-red-700">{fraudData.highCount}</div>
                    <div className="text-xs text-red-500 mt-1">{ar ? 'حرجة' : 'Critical'}</div>
                  </div>
                  <div className="bg-yellow-50 rounded-xl p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-700">{fraudData.mediumCount}</div>
                    <div className="text-xs text-yellow-500 mt-1">{ar ? 'تحذيرية' : 'Warnings'}</div>
                  </div>
                </div>

                {/* AI Narrative */}
                {fraudData.aiNarrative && (
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2 text-purple-700 font-medium text-sm">
                      <Sparkles size={14} /> {ar ? 'تحليل الذكاء الاصطناعي' : 'AI Analysis'}
                    </div>
                    <p className="text-sm text-purple-800 leading-relaxed whitespace-pre-line">{fraudData.aiNarrative}</p>
                  </div>
                )}

                {/* Flags Table */}
                {fraudData.flags?.length > 0 ? (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500 border-b">
                        <tr>
                          <th className="px-4 py-3 text-right">{ar ? 'النوع' : 'Type'}</th>
                          <th className="px-4 py-3 text-right">{ar ? 'الصنف' : 'Item'}</th>
                          <th className="px-4 py-3 text-right">{ar ? 'المستخلص' : 'Certificate'}</th>
                          <th className="px-4 py-3 text-right">{ar ? 'المتوقع' : 'Expected'}</th>
                          <th className="px-4 py-3 text-right">{ar ? 'الفعلي' : 'Actual'}</th>
                          <th className="px-4 py-3 text-right">{ar ? 'الفرق' : 'Diff%'}</th>
                          <th className="px-4 py-3 text-center">{ar ? 'الخطورة' : 'Severity'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fraudData.flags.map((f, i) => {
                          const flagAr = { OVER_BILLING: 'فوترة زائدة', PRICE_INFLATION: 'تضخيم سعر', DUPLICATE_ENTRY: 'إدخال مكرر' };
                          const sevStyle = f.severity === 'HIGH'
                            ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';
                          return (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                                  {ar ? (flagAr[f.flagType] ?? f.flagType) : f.flagType}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs font-mono text-blue-600">{f.itemCode}</div>
                                <div className="text-gray-700 max-w-[200px] truncate">{f.description}</div>
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-gray-600">{f.certNumber}</td>
                              <td className="px-4 py-3 text-gray-600">{fmt(f.expectedValue)}</td>
                              <td className="px-4 py-3 font-medium text-gray-800">{fmt(f.actualValue)}</td>
                              <td className="px-4 py-3 text-red-600 font-bold">+{f.percentChange}%</td>
                              <td className="px-4 py-3 text-center">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sevStyle}`}>
                                  {ar ? (f.severity === 'HIGH' ? 'حرج' : 'تحذير') : f.severity}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-green-600">
                    <CheckCircle2 size={32} className="mx-auto mb-2" />
                    <p className="font-medium">{ar ? 'لم يتم اكتشاف أي استثناءات' : 'No fraud flags detected'}</p>
                  </div>
                )}

                <p className="text-xs text-gray-400 text-center">
                  {ar ? `تاريخ التحليل: ${fraudData.analysisDate}` : `Analysis date: ${fraudData.analysisDate}`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Helper stat component
function Stat({ label, value, unit = '', color = 'gray' }) {
  const colorMap = {
    gray: 'text-gray-800', green: 'text-green-700', red: 'text-red-600',
    blue: 'text-blue-700', purple: 'text-purple-700', orange: 'text-orange-600',
    yellow: 'text-yellow-700', teal: 'text-teal-700',
  };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-bold ${colorMap[color] ?? colorMap.gray}`}>{value} {unit}</span>
    </div>
  );
}
