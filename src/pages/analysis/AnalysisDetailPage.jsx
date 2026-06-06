import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  RadialBarChart, RadialBar, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';
import {
  BrainCircuit, ArrowLeft, TrendingUp, BarChart2,
  CheckCircle2, AlertTriangle, Lightbulb, Calendar,
  FileText, Percent, Activity, BookOpen,
} from 'lucide-react';
import { analysisApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import { Spinner } from '../../components/common/index';

// ── helpers ────────────────────────────────────────────────────────────────────
function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function getScoreStyle(score) {
  if (score == null) return { text: 'text-gray-500', bg: 'bg-gray-100', label: '—', color: '#9ca3af', trackColor: '#f3f4f6' };
  if (score >= 85) return { text: 'text-green-700',  bg: 'bg-green-50',  label: 'ممتاز',   color: '#16a34a', trackColor: '#dcfce7' };
  if (score >= 70) return { text: 'text-blue-700',   bg: 'bg-blue-50',   label: 'جيد',     color: '#2563eb', trackColor: '#dbeafe' };
  if (score >= 55) return { text: 'text-yellow-700', bg: 'bg-yellow-50', label: 'متوسط',   color: '#ca8a04', trackColor: '#fef9c3' };
  if (score >= 40) return { text: 'text-orange-700', bg: 'bg-orange-50', label: 'ضعيف',    color: '#ea580c', trackColor: '#ffedd5' };
  return            { text: 'text-red-700',   bg: 'bg-red-50',    label: 'حرج',     color: '#dc2626', trackColor: '#fee2e2' };
}

const KPI_CONFIG = {
  financialScore:         { ar: 'الأداء المالي',        en: 'Financial',    color: '#f59e0b' },
  operationalScore:       { ar: 'الأداء التشغيلي',      en: 'Operational',  color: '#f97316' },
  riskScore:              { ar: 'مستوى المخاطر',        en: 'Risk',         color: '#6366f1' },
  growthOpportunityScore: { ar: 'فرص النمو',            en: 'Growth',       color: '#3b82f6' },
};

const PRIORITY_COLORS = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };

// ── Circular gauge ─────────────────────────────────────────────────────────────
function OverallGauge({ score }) {
  const { color, label, trackColor } = getScoreStyle(score);
  const val = score != null ? Math.min(Number(score), 100) : 0;
  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width={160} height={160}>
        <RadialBarChart
          innerRadius="70%" outerRadius="100%"
          data={[{ value: val, fill: color }]}
          startAngle={210} endAngle={-30}
        >
          <RadialBar dataKey="value" cornerRadius={6} background={{ fill: trackColor }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center mt-3">
        <span className="text-3xl font-bold text-gray-900">{score != null ? Number(score).toFixed(1) : '—'}</span>
        <span className="text-xs font-semibold mt-0.5" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}

// ── Horizontal KPI bar row ─────────────────────────────────────────────────────
function KpiRow({ label, value, prevValue, color }) {
  const num     = typeof value === 'number' ? value : parseFloat(value) || 0;
  const prevNum = prevValue != null ? (typeof prevValue === 'number' ? prevValue : parseFloat(prevValue)) : null;
  const diff    = prevNum != null ? (num - prevNum).toFixed(1) : null;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {diff != null && (
            <span className={diff >= 0 ? 'text-green-600' : 'text-red-500'}>
              {diff >= 0 ? '↑' : '↓'} {Math.abs(diff)}
            </span>
          )}
          <span className="font-bold text-gray-800">{num.toFixed(1)}</span>
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${Math.min(num, 100)}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, iconBg }) {
  return (
    <div className="card flex items-center gap-3 py-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon size={18} className="text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
    </div>
  );
}

// ── Priority bar chart ──────────────────────────────────────────────────────────
function PriorityChart({ recommendations }) {
  const counts = recommendations.reduce((acc, r) => {
    const p = (typeof r === 'object' ? r.priority : null) ?? 'Other';
    acc[p] = (acc[p] ?? 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(counts).map(([name, count]) => ({ name, count }));
  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={data} margin={{ top: 0, right: 5, left: -25, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} allowDecimals={false} />
        <Tooltip />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={PRIORITY_COLORS[entry.name] ?? '#818cf8'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AnalysisDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { lang } = useLang();
  const ar = lang === 'ar';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analysis-detail', id],
    queryFn:  () => analysisApi.getById(id).then((r) => r.data?.data ?? r.data),
    enabled:  !!id,
  });

  const detail = data?.data ?? data;
  const score  = detail?.overallScore ?? detail?.kpi?.overallScore;
  const kpi    = detail?.kpi ?? {};
  const recs   = Array.isArray(detail?.recommendations) ? detail.recommendations : [];
  const hasKpi = Object.keys(kpi).length > 0;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>
  );
  if (isError || !detail) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-gray-500">{ar ? 'لا توجد بيانات' : 'No data found'}</p>
      <button onClick={() => navigate('/analysis')} className="btn-secondary text-sm px-4 py-2">
        {ar ? 'العودة' : 'Go Back'}
      </button>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">

      {/* ── Page title bar ── */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/analysis')} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <BrainCircuit size={20} className="text-primary-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">
              {ar ? 'لوحة التحليل الذكي' : 'AI Analysis Dashboard'}
            </h1>
            <p className="text-xs text-gray-400">
              {ar ? 'نتائج تحليل مستنداتك بالذكاء الاصطناعي' : 'AI-powered document analysis results'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar size={12} />
          {formatDate(detail.createdAt)}
          {detail.type && <span className="badge bg-purple-100 text-purple-700 ml-1">{detail.type}</span>}
        </div>
      </div>

      {/* ── KPI panel + Gauge ── */}
      {hasKpi && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <TrendingUp size={15} className="text-primary-500" />
              {ar ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'}
            </h2>
          </div>
          <div className="flex gap-6 items-center">
            {/* KPI bars */}
            <div className="flex-1 space-y-4">
              {Object.entries(KPI_CONFIG).map(([key, cfg]) => {
                if (kpi[key] == null) return null;
                return (
                  <KpiRow
                    key={key}
                    label={ar ? cfg.ar : cfg.en}
                    value={kpi[key]}
                    color={cfg.color}
                  />
                );
              })}
            </div>
            {/* Gauge */}
            <div className="flex flex-col items-center flex-shrink-0">
              <p className="text-xs text-gray-500 mb-1 font-medium">{ar ? 'الدرجة الإجمالية' : 'Overall Score'}</p>
              <OverallGauge score={score} />
              {detail.previousScore != null && (
                <p className="text-xs text-gray-400 mt-1">
                  {ar ? 'مقارنة بالتحليل السابق' : 'vs prev'}{' '}
                  <span className="font-medium text-gray-600">{Number(detail.previousScore).toFixed(1)}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={BookOpen}  label={ar ? 'المستندات المرفوعة' : 'Documents'}       value={detail.documentsCount ?? 1}          iconBg="bg-blue-500" />
        <StatCard icon={Activity}  label={ar ? 'التحليلات المنفذة' : 'Analyses Done'}    value={detail.analysesCount ?? 4}           iconBg="bg-indigo-500" />
        <StatCard icon={Percent}   label={ar ? 'معدل النجاح' : 'Success Rate'}           value={`${detail.successRate ?? '100'}%`}   iconBg="bg-green-500" />
        <StatCard icon={Lightbulb} label={ar ? 'عدد التوصيات' : 'Recommendations'}      value={recs.length || detail.recommendationsCount} iconBg="bg-yellow-500" />
      </div>

      {/* ── Executive Summary ── */}
      {detail.executiveSummary && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <BarChart2 size={14} className="text-primary-500" />
            {ar ? 'الملخص التنفيذي' : 'Executive Summary'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">{detail.executiveSummary}</p>
        </div>
      )}

      {/* ── Strengths + Weaknesses ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.isArray(detail.strengths) && detail.strengths.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-green-500" />
              {ar ? 'نقاط القوة' : 'Strengths'}
            </h2>
            <ul className="space-y-2">
              {detail.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-green-500 mt-0.5 flex-shrink-0 font-bold">✓</span>{s}
                </li>
              ))}
            </ul>
          </div>
        )}
        {Array.isArray(detail.weaknesses) && detail.weaknesses.length > 0 && (
          <div className="card">
            <h2 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" />
              {ar ? 'مجالات التحسين' : 'Areas to Improve'}
            </h2>
            <ul className="space-y-2">
              {detail.weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-400 mt-0.5 flex-shrink-0">!</span>{w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* ── Recommendations ── */}
      {recs.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Lightbulb size={14} className="text-yellow-500" />
              {ar ? 'أهم التوصيات' : 'Recommendations'}
            </h2>
            <div className="w-40">
              <PriorityChart recommendations={recs} />
            </div>
          </div>
          <div className="space-y-3">
            {recs.map((rec, i) => (
              <div key={i} className="bg-yellow-50 rounded-2xl p-4 border border-yellow-100">
                {typeof rec === 'object' ? (
                  <>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      {rec.title && <p className="text-sm font-semibold text-gray-800">{rec.title}</p>}
                      {rec.priority && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                          rec.priority === 'High'   ? 'bg-red-100 text-red-700' :
                          rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                                                      'bg-green-100 text-green-700'
                        }`}>{rec.priority}</span>
                      )}
                    </div>
                    {rec.description && <p className="text-sm text-gray-600 leading-relaxed">{rec.description}</p>}
                    {rec.estimatedImpact && (
                      <p className="text-xs text-gray-400 mt-1.5">📈 {rec.estimatedImpact}</p>
                    )}
                  </>
                ) : <p className="text-sm text-gray-700">{rec}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notes ── */}
      {detail.notes && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-700 mb-2">
            {ar ? 'ملاحظات تفصيلية' : 'Detailed Notes'}
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{detail.notes}</p>
        </div>
      )}

    </div>
  );
}
