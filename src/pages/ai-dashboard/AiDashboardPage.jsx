import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { analysisApi } from '../../api/index';
import {
  BrainCircuit, TrendingUp, TrendingDown, Shield, Zap,
  CheckCircle2, AlertTriangle, Lightbulb, Target, FileUp,
  BarChart2, ArrowUpRight, ArrowDownRight, Minus,
  ChevronRight, ChevronLeft, Upload, BarChart3, RefreshCw,
} from 'lucide-react';
import { dashboardApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import { PageLoader, ErrorMsg } from '../../components/common/index';

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n, digits = 1) {
  if (n == null) return '—';
  return Number(n).toFixed(digits);
}

function scoreColor(score) {
  if (score == null) return { ring: 'ring-gray-200', text: 'text-gray-500', bg: 'bg-gray-50', bar: 'bg-gray-300', label: '—' };
  if (score >= 85) return { ring: 'ring-green-400',  text: 'text-green-700',  bg: 'bg-green-50',  bar: 'bg-green-500',  label: 'ممتاز' };
  if (score >= 70) return { ring: 'ring-blue-400',   text: 'text-blue-700',   bg: 'bg-blue-50',   bar: 'bg-blue-500',   label: 'جيد' };
  if (score >= 55) return { ring: 'ring-yellow-400', text: 'text-yellow-700', bg: 'bg-yellow-50', bar: 'bg-yellow-500', label: 'مقبول' };
  if (score >= 40) return { ring: 'ring-orange-400', text: 'text-orange-700', bg: 'bg-orange-50', bar: 'bg-orange-500', label: 'ضعيف' };
  return           { ring: 'ring-red-400',    text: 'text-red-700',    bg: 'bg-red-50',    bar: 'bg-red-500',    label: 'حرج' };
}

function ChangePill({ value }) {
  if (value == null) return null;
  const n = Number(value);
  if (n > 0)  return <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-medium"><ArrowUpRight size={12}/>{fmt(n)}</span>;
  if (n < 0)  return <span className="inline-flex items-center gap-0.5 text-xs text-red-500 font-medium"><ArrowDownRight size={12}/>{fmt(Math.abs(n))}</span>;
  return <span className="inline-flex items-center gap-0.5 text-xs text-gray-400"><Minus size={12}/></span>;
}

// ── ScoreRing ─────────────────────────────────────────────────────────────────
function ScoreRing({ score, label, size = 120 }) {
  const { ring, text, label: lvl } = scoreColor(score);
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score ?? 0, 0), 100);
  const dash = (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={ring.replace('ring-','').includes('green') ? '#22c55e'
                : ring.includes('blue') ? '#3b82f6'
                : ring.includes('yellow') ? '#eab308'
                : ring.includes('orange') ? '#f97316'
                : ring.includes('red') ? '#ef4444' : '#d1d5db'}
          strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-all duration-700"
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
          className={`text-lg font-bold fill-current rotate-90 origin-center ${text}`}
          style={{ transform: `rotate(90deg) translateX(-${size/2}px) translateY(-${size/2}px)` }}
        >
        </text>
      </svg>
      <div className="text-center -mt-2">
        <div className={`text-2xl font-bold ${text}`}>{fmt(score)}</div>
        <div className="text-xs text-gray-500 mt-0.5">{lvl}</div>
        {label && <div className="text-xs font-medium text-gray-700 mt-0.5">{label}</div>}
      </div>
    </div>
  );
}

// ── ScoreBar ──────────────────────────────────────────────────────────────────
function ScoreBar({ label, score, change }) {
  const { bar, text, bg } = scoreColor(score);
  const pct = Math.min(Math.max(score ?? 0, 0), 100);
  return (
    <div className={`rounded-xl p-3 ${bg}`}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-gray-600">{label}</span>
        <div className="flex items-center gap-1.5">
          <ChangePill value={change} />
          <span className={`text-sm font-bold ${text}`}>{fmt(score)}</span>
        </div>
      </div>
      <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
        <div className={`h-full ${bar} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── PriorityBadge ─────────────────────────────────────────────────────────────
function PriorityBadge({ priority }) {
  const map = {
    High:   'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low:    'bg-green-100 text-green-700',
  };
  const arMap = { High: 'عالية', Medium: 'متوسطة', Low: 'منخفضة' };
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${map[priority] || 'bg-gray-100 text-gray-600'}`}>
      {arMap[priority] || priority}
    </span>
  );
}

// ── EmptyAnalysis ─────────────────────────────────────────────────────────────
function EmptyAnalysis({ lang, isRTL }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center">
        <BrainCircuit size={40} className="text-primary-400" />
      </div>
      <div className="text-center">
        <h2 className="text-lg font-bold text-gray-800">
          {lang === 'ar' ? 'لا توجد نتائج تحليل بعد' : 'No analysis results yet'}
        </h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          {lang === 'ar'
            ? 'ارفع مستنداتك وشغّل التحليل الذكي لتظهر لوحة بيانات الأداء الكاملة هنا'
            : 'Upload your documents and run AI analysis to see the full performance dashboard'}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/documents" className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Upload size={15} />
          {lang === 'ar' ? 'رفع مستندات' : 'Upload Documents'}
        </Link>
        <Link to="/analysis" className="btn-secondary flex items-center gap-2 text-sm px-4 py-2">
          <BrainCircuit size={15} />
          {lang === 'ar' ? 'بدء تحليل' : 'Start Analysis'}
        </Link>
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionTitle({ icon: Icon, title, color = 'text-primary-600' }) {
  return (
    <h2 className={`text-sm font-semibold text-gray-800 flex items-center gap-2`}>
      <Icon size={15} className={color} />
      {title}
    </h2>
  );
}

// ── Intake Modal ───────────────────────────────────────────────────────────────
function IntakeModal({ onConfirm, onClose, isAnalyzing, ar }) {
  const [form, setForm] = useState({
    businessActivity: '', mainChallenge: '', analysisGoal: '',
    annualRevenueRange: '', companyAge: '',
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const fields = [
    { key: 'businessActivity',   label: ar ? 'نوع نشاط شركتك *' : 'Business Type *',          placeholder: ar ? 'مثال: مقاولات إنشائية / استشارات هندسية / تجارة' : 'e.g. Construction / Consulting', required: true },
    { key: 'mainChallenge',      label: ar ? 'أكبر تحدٍ تواجهه الآن' : 'Main Challenge',       placeholder: ar ? 'مثال: ضعف التدفق النقدي / منافسة سعرية' : 'e.g. Cash flow / Competition' },
    { key: 'analysisGoal',       label: ar ? 'ماذا تريد من التحليل؟' : 'Analysis Goal',        placeholder: ar ? 'مثال: تحديد فرص النمو / تقليل المخاطر' : 'e.g. Growth opportunities' },
    { key: 'annualRevenueRange', label: ar ? 'نطاق الإيرادات السنوية' : 'Annual Revenue Range', placeholder: ar ? 'مثال: 1-5 مليون جنيه' : 'e.g. $1M-5M' },
    { key: 'companyAge',         label: ar ? 'عمر الشركة' : 'Company Age',                     placeholder: ar ? 'مثال: 5 سنوات' : 'e.g. 5 years' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="bg-[#1e3a5f] text-white rounded-t-2xl px-5 py-4">
          <h3 className="font-bold text-base">{ar ? 'أخبر AI عن شركتك' : 'Tell AI About Your Business'}</h3>
          <p className="text-xs text-blue-300 mt-0.5">{ar ? 'هذه البيانات تضمن تحليلاً دقيقاً يخص نشاطك الفعلي' : 'This ensures analysis matches your actual business'}</p>
        </div>
        <div className="p-5 space-y-3">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-700 mb-1">{f.label}</label>
              <input
                value={form[f.key]}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ))}
        </div>
        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} className="flex-1 btn-secondary text-sm py-2">{ar ? 'إلغاء' : 'Cancel'}</button>
          <button
            onClick={() => onConfirm(form)}
            disabled={!form.businessActivity.trim() || isAnalyzing}
            className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isAnalyzing ? 'animate-spin' : ''} />
            {isAnalyzing ? (ar ? 'جارٍ التحليل...' : 'Analyzing...') : (ar ? 'ابدأ التحليل' : 'Run Analysis')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AiDashboardPage() {
  const { lang, isRTL } = useLang();
  const ar = lang === 'ar';
  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;
  const qc = useQueryClient();
  const [showIntake, setShowIntake] = useState(false);

  const { data: raw, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['ai-dashboard'],
    queryFn: () => dashboardApi.get().then(r => r.data?.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });

  const { mutate: runAnalysis, isPending: isAnalyzing } = useMutation({
    mutationFn: (intake) => analysisApi.analyzeAll(intake),
    onSuccess: () => {
      toast.success(ar ? 'تم تحديث التحليل بنجاح' : 'Analysis updated successfully');
      setShowIntake(false);
      qc.invalidateQueries({ queryKey: ['ai-dashboard'] });
      refetch();
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? (ar ? 'فشل التحديث' : 'Update failed')),
  });

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="p-6">
        <ErrorMsg message={error?.response?.data?.message || (ar ? 'فشل تحميل بيانات التحليل' : 'Failed to load analysis data')} />
        <button onClick={refetch} className="btn-primary mt-4 text-sm px-4 py-2">
          {ar ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  // flatten response — API might wrap in .data
  const dash   = raw?.data ?? raw ?? {};
  const kpi    = dash.kpiData ?? dash.kPIData ?? {};
  const ana    = dash.analytics ?? {};
  const exec   = dash.executiveSummary ?? {};
  const stats  = dash.statistics ?? {};
  const cmp    = kpi.comparison ?? {};

  const overall  = kpi.currentOverallScore;
  const hasData  = (dash.hasCompletedAnalysis === true) ||
                   (dash.hasCompletedAnalysis == null && overall != null && overall > 0 &&
                    (ana.totalRecommendations > 0 || (ana.topStrengths ?? []).length > 0));
  const lastDate = dash.lastAnalysisDate
    ? new Date(dash.lastAnalysisDate).toLocaleDateString(ar ? 'ar-EG' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  // ── Empty state ───────────────────────────────────────────────────────────
  if (!hasData) return (
    <>
      {showIntake && <IntakeModal ar={ar} isAnalyzing={isAnalyzing} onClose={() => setShowIntake(false)} onConfirm={(intake) => runAnalysis(intake)} />}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BrainCircuit size={22} className="text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">{ar ? 'لوحة التحليل الذكي' : 'AI Analysis Dashboard'}</h1>
          </div>
          <button
            onClick={() => setShowIntake(true)}
            disabled={isAnalyzing}
            className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5 disabled:opacity-60"
          >
            <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
            {isAnalyzing ? (ar ? 'جارٍ التحليل...' : 'Analyzing...') : (ar ? 'ابدأ التحليل الآن' : 'Run Analysis')}
          </button>
        </div>
        <div className="card">
          <EmptyAnalysis lang={lang} isRTL={isRTL} />
        </div>
      </div>
    </>
  );

  // ── Dashboard ─────────────────────────────────────────────────────────────
  const strengths       = ana.topStrengths ?? exec.keyStrengths ?? [];
  const weaknesses      = ana.topWeaknesses ?? exec.areasForImprovement ?? [];
  const recommendations = ana.topRecommendations ?? [];
  const opportunities   = ana.opportunities ?? exec.keyOpportunities ?? [];

  return (
    <>
    {showIntake && (
      <IntakeModal
        ar={ar}
        isAnalyzing={isAnalyzing}
        onClose={() => setShowIntake(false)}
        onConfirm={(intake) => runAnalysis(intake)}
      />
    )}
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* ── Page header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BrainCircuit size={22} className="text-primary-600" />
            {ar ? 'لوحة التحليل الذكي' : 'AI Analysis Dashboard'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {ar ? 'نتائج تحليل مستنداتك بالذكاء الاصطناعي' : 'AI-powered insights from your documents'}
          </p>
          {lastDate && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1.5 inline-block">
              {ar ? `📅 آخر تحليل: ${lastDate}` : `📅 Last analysis: ${lastDate}`}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link to="/documents" className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
            <Upload size={13} />
            {ar ? 'رفع مستندات' : 'Upload'}
          </Link>
          <Link to="/analysis" className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
            <BarChart3 size={13} />
            {ar ? 'سجل التحليلات' : 'History'}
            <ArrowIcon size={13} />
          </Link>
        </div>
      </div>

      {/* ── Row 1: Overall score + KPI bars ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Overall score card */}
        <div className="card flex flex-col items-center justify-center gap-2 py-6">
          <SectionTitle icon={BarChart2} title={ar ? 'الدرجة الإجمالية' : 'Overall Score'} />
          <ScoreRing score={overall} size={130} />
          {cmp.percentageChange != null && (
            <div className="text-xs text-gray-400 flex items-center gap-1">
              {ar ? 'مقارنة بالتحليل السابق:' : 'vs previous:'}
              <ChangePill value={cmp.percentageChange} />
            </div>
          )}
          {kpi.overallRating && (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${scoreColor(overall).bg} ${scoreColor(overall).text}`}>
              {kpi.overallRating}
            </span>
          )}
        </div>

        {/* KPI bars */}
        <div className="md:col-span-2 card space-y-3">
          <SectionTitle icon={TrendingUp} title={ar ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'} />
          <ScoreBar
            label={ar ? 'الأداء المالي' : 'Financial'}
            score={kpi.financialScore}
            change={cmp.financialScoreChange}
          />
          <ScoreBar
            label={ar ? 'الأداء التشغيلي' : 'Operational'}
            score={kpi.operationalScore}
            change={cmp.operationalScoreChange}
          />
          <ScoreBar
            label={ar ? 'مستوى المخاطر' : 'Risk Level'}
            score={kpi.riskScore}
            change={cmp.riskScoreChange}
          />
          <ScoreBar
            label={ar ? 'فرص النمو' : 'Growth Opportunities'}
            score={kpi.growthOpportunityScore}
            change={cmp.growthOpportunityScoreChange}
          />
        </div>
      </div>

      {/* ── Row 2: Statistics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: FileUp,       label: ar ? 'المستندات المرفوعة' : 'Documents Uploaded', value: stats.totalDocumentsUploaded },
          { icon: BrainCircuit, label: ar ? 'التحليلات المنفذة'  : 'Analyses Performed',  value: stats.totalAnalysisPerformed },
          { icon: CheckCircle2, label: ar ? 'معدل النجاح'        : 'Success Rate',         value: stats.successRate != null ? `${fmt(stats.successRate)}%` : '—' },
          { icon: Target,       label: ar ? 'عدد التوصيات'       : 'Recommendations',      value: ana.totalRecommendations },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card flex items-center gap-3 py-3 px-4">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
              <Icon size={17} className="text-primary-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{label}</p>
              <p className="text-lg font-bold text-gray-900">{value ?? '—'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 3: Executive summary ── */}
      {exec.summary && (
        <div className="card">
          <SectionTitle icon={BarChart2} title={ar ? 'الملخص التنفيذي' : 'Executive Summary'} />
          <p className="mt-3 text-sm text-gray-600 leading-relaxed">{exec.summary}</p>
        </div>
      )}

      {/* ── Row 4: Strengths + Weaknesses ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Strengths */}
        <div className="card">
          <SectionTitle icon={CheckCircle2} title={ar ? 'نقاط القوة' : 'Strengths'} color="text-green-600" />
          {strengths.length === 0 ? (
            <p className="text-xs text-gray-400 mt-3">{ar ? 'لا توجد بيانات' : 'No data'}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle2 size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Weaknesses */}
        <div className="card">
          <SectionTitle icon={AlertTriangle} title={ar ? 'مجالات التحسين' : 'Areas for Improvement'} color="text-red-500" />
          {weaknesses.length === 0 ? (
            <p className="text-xs text-gray-400 mt-3">{ar ? 'لا توجد بيانات' : 'No data'}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Row 5: Recommendations ── */}
      {recommendations.length > 0 && (
        <div className="card">
          <SectionTitle icon={Lightbulb} title={ar ? 'أهم التوصيات' : 'Top Recommendations'} color="text-yellow-600" />
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recommendations.map((rec, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-800">{rec.title}</p>
                  <PriorityBadge priority={rec.priority} />
                </div>
                {rec.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{rec.description}</p>
                )}
                {rec.impact && (
                  <p className="text-xs text-primary-600 mt-1.5 font-medium">
                    {ar ? 'الأثر: ' : 'Impact: '}{rec.impact}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 6: Opportunities ── */}
      {opportunities.length > 0 && (
        <div className="card">
          <SectionTitle icon={Zap} title={ar ? 'الفرص المكتشفة' : 'Opportunities Identified'} color="text-blue-600" />
          <div className="mt-3 flex flex-wrap gap-2">
            {opportunities.map((opp, i) => (
              <span key={i} className="bg-blue-50 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full border border-blue-100">
                {opp}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Row 7: Immediate actions from exec summary ── */}
      {(exec.immediateActions ?? []).length > 0 && (
        <div className="card">
          <SectionTitle icon={Target} title={ar ? 'الإجراءات الفورية' : 'Immediate Actions'} color="text-orange-500" />
          <ul className="mt-3 space-y-2">
            {exec.immediateActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {action}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
    </>
  );
}
