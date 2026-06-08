import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  BrainCircuit,
  Plus,
  Trash2,
  Eye,
  TrendingUp,
  Calendar,
  BarChart2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import { analysisApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import {
  EmptyState,
  Modal,
  ConfirmDialog,
  StatCard,
  FormField,
  Spinner,
} from '../../components/common/index';
import { useForm } from 'react-hook-form';

const ANALYSIS_TYPES = ['Financial', 'Operational', 'Strategic', 'HR', 'Custom'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getScoreStyle(score) {
  if (score == null) return { text: 'text-gray-500', bg: 'bg-gray-100', label: '—' };
  if (score >= 85) return { text: 'text-green-700', bg: 'bg-green-100', label: 'Excellent' };
  if (score >= 70) return { text: 'text-blue-700', bg: 'bg-blue-100', label: 'Good' };
  if (score >= 55) return { text: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Fair' };
  if (score >= 40) return { text: 'text-orange-700', bg: 'bg-orange-100', label: 'Poor' };
  return { text: 'text-red-700', bg: 'bg-red-100', label: 'Critical' };
}

// ── Score Badge ───────────────────────────────────────────────────────────────
function ScoreBadge({ score }) {
  if (score == null) return <span className="text-sm text-gray-400">—</span>;
  const { text, bg } = getScoreStyle(score);
  return (
    <span className={`px-2.5 py-1 rounded-full text-sm font-bold ${text} ${bg}`}>
      {Number(score).toFixed(1)}
    </span>
  );
}

// ── Create Analysis Modal ─────────────────────────────────────────────────────
function CreateAnalysisModal({ open, onClose }) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => {
      const intake = {
        businessActivity:  data.businessActivity  || undefined,
        mainChallenge:     data.mainChallenge      || undefined,
        analysisGoal:      data.analysisGoal       || undefined,
        annualRevenueRange:data.annualRevenueRange  || undefined,
        companyAge:        data.companyAge          || undefined,
      };
      return analysisApi.analyzeAll(intake);
    },
    onSuccess: () => {
      toast.success(
        lang === 'ar' ? 'تم بدء التحليل بنجاح' : 'Analysis started successfully'
      );
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل بدء التحليل' : 'Failed to start analysis')
      );
    },
  });

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={lang === 'ar' ? 'تحليل جديد' : 'New Analysis'}
      size="md"
    >
      <form
        onSubmit={handleSubmit((data) => mutate(data))}
        className="space-y-4"
        noValidate
      >
        <FormField
          label={lang === 'ar' ? 'العنوان' : 'Title'}
          required
          error={errors.title?.message}
        >
          <input
            type="text"
            className={`input ${errors.title ? 'border-red-400' : ''}`}
            {...register('title', {
              required: lang === 'ar' ? 'العنوان مطلوب' : 'Title is required',
            })}
          />
        </FormField>

        {/* ── SCG Intake Form ── */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            {lang === 'ar' ? 'بيانات تمهيدية (اختياري — تحسّن جودة التحليل)' : 'Intake Data (optional — improves analysis quality)'}
          </p>
          <FormField label={lang === 'ar' ? 'نوع النشاط' : 'Business Activity'}>
            <input type="text" className="input" placeholder={lang === 'ar' ? 'مثال: مقاولات إنشائية، تجارة...' : 'e.g. Construction, Retail...'} {...register('businessActivity')} />
          </FormField>
          <FormField label={lang === 'ar' ? 'التحدي الرئيسي' : 'Main Challenge'}>
            <input type="text" className="input" placeholder={lang === 'ar' ? 'مثال: انخفاض الأرباح، ضعف التدفق النقدي...' : 'e.g. Low margins, cash flow...'} {...register('mainChallenge')} />
          </FormField>
          <FormField label={lang === 'ar' ? 'هدف التحليل' : 'Analysis Goal'}>
            <input type="text" className="input" placeholder={lang === 'ar' ? 'مثال: تحسين الكفاءة، التوسع...' : 'e.g. Improve efficiency, expand...'} {...register('analysisGoal')} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={lang === 'ar' ? 'نطاق الإيرادات' : 'Revenue Range'}>
              <select className="input" {...register('annualRevenueRange')}>
                <option value="">—</option>
                {['أقل من مليون','1-5 مليون','5-20 مليون','20-100 مليون','أكثر من 100 مليون'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </FormField>
            <FormField label={lang === 'ar' ? 'عمر الشركة' : 'Company Age'}>
              <select className="input" {...register('companyAge')}>
                <option value="">—</option>
                {['أقل من سنة','1-3 سنوات','3-10 سنوات','10-20 سنة','أكثر من 20 سنة'].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </FormField>
          </div>
        </div>

        <FormField label={lang === 'ar' ? 'الوصف' : 'Description'}>
          <textarea rows={3} className="input resize-none" {...register('description')} />
        </FormField>

        <div className="bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
          {lang === 'ar'
            ? 'سيقوم الذكاء الاصطناعي بتحليل بيانات شركتك وإنشاء تقرير شامل. قد تستغرق هذه العملية بضع دقائق.'
            : 'AI will analyze your company data and generate a comprehensive report. This process may take a few minutes.'}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="btn-secondary text-sm px-4 py-2"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
          >
            {isPending ? <Spinner size="sm" /> : <BrainCircuit size={15} />}
            {isPending
              ? lang === 'ar'
                ? 'جارٍ التحليل...'
                : 'Analyzing...'
              : lang === 'ar'
              ? 'بدء التحليل'
              : 'Start Analysis'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function AnalysisDetailModal({ analysisId, open, onClose }) {
  const { lang } = useLang();

  const { data, isLoading } = useQuery({
    queryKey: ['analysis-detail', analysisId],
    queryFn: () => analysisApi.getById(analysisId).then((r) => r.data?.data ?? r.data),
    enabled: open && !!analysisId,
  });

  const detail = data?.data ?? data;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lang === 'ar' ? 'تفاصيل التحليل' : 'Analysis Details'}
      size="xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : !detail ? (
        <p className="text-sm text-gray-500 text-center py-8">
          {lang === 'ar' ? 'لا توجد بيانات' : 'No data available'}
        </p>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-gray-900 text-base">
                {detail.title ?? lang === 'ar' ? 'تحليل الشركة' : 'Company Analysis'}
              </h3>
              <p className="text-sm text-gray-400 mt-0.5">
                {formatDate(detail.createdAt)} ·{' '}
                <span className="text-gray-500">{detail.type ?? '—'}</span>
              </p>
            </div>
            <ScoreBadge score={detail.overallScore ?? detail.kpi?.overallScore} />
          </div>

          {/* Executive Summary */}
          {detail.executiveSummary && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <BarChart2 size={14} className="text-primary-500" />
                {lang === 'ar' ? 'الملخص التنفيذي' : 'Executive Summary'}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3">
                {detail.executiveSummary}
              </p>
            </div>
          )}

          {/* KPI Scores */}
          {detail.kpi && Object.keys(detail.kpi).length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                <TrendingUp size={14} className="text-green-500" />
                {lang === 'ar' ? 'مؤشرات الأداء' : 'KPI Scores'}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(detail.kpi).map(([key, val]) => {
                  const numVal = typeof val === 'number' ? val : parseFloat(val);
                  const { text, bg } = getScoreStyle(
                    !isNaN(numVal) ? numVal : null
                  );
                  return (
                    <div key={key} className={`rounded-xl p-3 ${bg}`}>
                      <p className="text-xs text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </p>
                      <p className={`text-base font-bold mt-0.5 ${text}`}>
                        {typeof val === 'number' ? val.toFixed(1) : val || '—'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {Array.isArray(detail.recommendations) && detail.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Lightbulb size={14} className="text-yellow-500" />
                {lang === 'ar' ? 'التوصيات' : 'Recommendations'}
              </h4>
              <ul className="space-y-2">
                {detail.recommendations.map((rec, i) => (
                  <li key={i} className="bg-yellow-50 rounded-xl p-3 text-sm text-gray-700">
                    {typeof rec === 'object' ? (
                      <div>
                        {rec.title && <p className="font-semibold mb-0.5">{rec.title}</p>}
                        {rec.description && <p className="text-gray-600">{rec.description}</p>}
                        {rec.priority && (
                          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                            rec.priority === 'High' ? 'bg-red-100 text-red-700' :
                            rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-green-100 text-green-700'
                          }`}>{rec.priority}</span>
                        )}
                      </div>
                    ) : rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strengths */}
          {Array.isArray(detail.strengths) && detail.strengths.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-green-500" />
                {lang === 'ar' ? 'نقاط القوة' : 'Strengths'}
              </h4>
              <ul className="space-y-1.5">
                {detail.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Weaknesses */}
          {Array.isArray(detail.weaknesses) && detail.weaknesses.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-1.5 flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-red-500" />
                {lang === 'ar' ? 'مجالات التحسين' : 'Areas to Improve'}
              </h4>
              <ul className="space-y-1.5">
                {detail.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">!</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Detailed Notes */}
          {detail.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1.5">
                {lang === 'ar' ? 'ملاحظات تفصيلية' : 'Detailed Notes'}
              </h4>
              <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-3 whitespace-pre-wrap">
                {detail.notes}
              </p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Analysis Card ─────────────────────────────────────────────────────────────
function AnalysisCard({ analysis, onView, onDelete, lang }) {
  const score = analysis.overallScore ?? analysis.kpi?.overallScore;
  const { text, bg, label } = getScoreStyle(score);
  const summary = analysis.executiveSummary ?? analysis.description ?? analysis.summary ?? '';

  return (
    <div className="card hover:shadow-md transition-shadow flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
            <BrainCircuit size={17} className="text-primary-600" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {analysis.title ?? (lang === 'ar' ? 'تحليل الشركة' : 'Company Analysis')}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatDate(analysis.createdAt)}
            </p>
          </div>
        </div>
        {score != null && (
          <div className={`flex flex-col items-center px-2.5 py-1.5 rounded-xl ${bg} flex-shrink-0`}>
            <span className={`text-base font-bold ${text}`}>{Number(score).toFixed(1)}</span>
            <span className={`text-xs font-medium ${text}`}>{label}</span>
          </div>
        )}
      </div>

      {analysis.type && (
        <span className="badge bg-purple-100 text-purple-700 self-start">{analysis.type}</span>
      )}

      {summary && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{summary}</p>
      )}

      {analysis.rating && (
        <div className="text-xs text-gray-600">
          <span className="font-medium">{lang === 'ar' ? 'التقييم: ' : 'Rating: '}</span>
          <span className="text-primary-600 font-semibold">{analysis.rating}</span>
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 mt-auto">
        <button
          onClick={() => onView(analysis.id)}
          className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
        >
          <Eye size={13} />
          {lang === 'ar' ? 'عرض التفاصيل' : 'View Details'}
        </button>
        <button
          onClick={() => onDelete(analysis)}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 font-medium transition-colors ms-auto"
        >
          <Trash2 size={13} />
          {lang === 'ar' ? 'حذف' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function AnalysisSkeleton() {
  return (
    <div className="card space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-9 h-9 rounded-xl bg-gray-100 animate-pulse flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
          </div>
        </div>
        <div className="w-14 h-12 rounded-xl bg-gray-100 animate-pulse" />
      </div>
      <div className="h-3 bg-gray-100 rounded animate-pulse" />
      <div className="h-3 bg-gray-100 rounded animate-pulse w-4/5" />
      <div className="h-8 bg-gray-100 rounded-lg animate-pulse mt-1" />
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const { t, lang, isRTL } = useLang();
  const queryClient = useQueryClient();

  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: historyData, isLoading } = useQuery({
    queryKey: ['analysis-history'],
    queryFn: () => analysisApi.getHistory().then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const analyses =
    historyData?.items ??
    historyData?.analyses ??
    historyData?.data ??
    (Array.isArray(historyData) ? historyData : []);

  const avgScore =
    analyses.length > 0
      ? analyses.reduce((acc, a) => acc + (a.overallScore ?? a.kpi?.overallScore ?? 0), 0) /
        analyses.length
      : null;

  const latestDate = analyses[0]?.createdAt;

  const { mutate: deleteAnalysis, isPending: isDeleting } = useMutation({
    mutationFn: (id) => analysisApi.delete(id),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم حذف التحليل' : 'Analysis deleted');
      if (deleteTarget?.id) navigate('/analysis');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['analysis-history'] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || (lang === 'ar' ? 'فشل الحذف' : 'Delete failed')
      );
    },
  });

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {lang === 'ar' ? 'التحليل الذكي' : 'AI Analysis'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar'
              ? 'تحليلات مدعومة بالذكاء الاصطناعي لأعمالك'
              : 'AI-powered analysis for your business'}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
        >
          <Plus size={16} />
          {lang === 'ar' ? 'تحليل جديد' : 'New Analysis'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={lang === 'ar' ? 'إجمالي التحليلات' : 'Total Analyses'}
          value={analyses.length}
          icon={BrainCircuit}
          color="primary"
          loading={isLoading}
        />
        <StatCard
          title={lang === 'ar' ? 'متوسط الدرجة' : 'Avg Score'}
          value={avgScore != null ? Number(avgScore).toFixed(1) : '—'}
          icon={TrendingUp}
          color="green"
          loading={isLoading}
        />
        <StatCard
          title={lang === 'ar' ? 'آخر تحليل' : 'Last Analysis'}
          value={formatDate(latestDate)}
          icon={Calendar}
          color="blue"
          loading={isLoading}
        />
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <AnalysisSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && analyses.length === 0 && (
        <div className="card">
          <EmptyState
            icon={BrainCircuit}
            title={lang === 'ar' ? 'لا توجد تحليلات بعد' : 'No analyses yet'}
            description={
              lang === 'ar'
                ? 'شغّل أول تحليل ذكاء اصطناعي للحصول على رؤى حول أعمالك'
                : 'Run your first AI analysis to get insights about your business'
            }
            action={
              <button
                onClick={() => setCreateOpen(true)}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
              >
                <Plus size={15} />
                {lang === 'ar' ? 'بدء تحليل جديد' : 'Start New Analysis'}
              </button>
            }
          />
        </div>
      )}

      {/* Analysis Cards Grid */}
      {!isLoading && analyses.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {analyses.map((analysis) => (
            <AnalysisCard
              key={analysis.id}
              analysis={analysis}
              onView={(id) => navigate(`/analysis/${id}`)}
              onDelete={setDeleteTarget}
              lang={lang}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <CreateAnalysisModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteAnalysis(deleteTarget?.id)}
        loading={isDeleting}
        title={lang === 'ar' ? 'حذف التحليل' : 'Delete Analysis'}
        message={
          lang === 'ar'
            ? `هل أنت متأكد من حذف "${deleteTarget?.title ?? lang === 'ar' ? 'هذا التحليل' : 'this analysis'}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete "${deleteTarget?.title ?? 'this analysis'}"? This action cannot be undone.`
        }
      />
    </div>
  );
}
