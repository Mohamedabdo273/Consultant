import { useLocation, useNavigate } from 'react-router-dom';
import { useLang } from '../../context/LangContext';
import {
  ArrowRight, Printer, FileText, CheckCircle2, AlertTriangle,
  Lightbulb, Target, TrendingUp, ShieldAlert, Users,
  Zap, BarChart3, Activity,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
function ScoreBadge({ score, label }) {
  const s = Number(score ?? 0);
  const color = s >= 70 ? 'text-green-700 bg-green-100' : s >= 50 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100';
  const bar   = s >= 70 ? 'bg-green-500' : s >= 50 ? 'bg-amber-400' : 'bg-red-400';
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-bold ${color.split(' ')[0]}`}>{s.toFixed(0)}</span>
        <span className="text-xs text-gray-400 mb-1">/100</span>
      </div>
      <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${bar}`} style={{ width: `${Math.min(s, 100)}%` }} />
      </div>
    </div>
  );
}

function ListSection({ icon: Icon, title, items, bg, border, iconColor, emptyMsg }) {
  if (!items?.length) return null;
  return (
    <div className={`border ${border} ${bg} rounded-xl p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={15} className={iconColor} />
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className={`font-bold mt-0.5 flex-shrink-0 ${iconColor}`}>•</span>
            <span>{typeof item === 'string' ? item : item?.title ?? JSON.stringify(item)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationsSection({ recommendations }) {
  if (!recommendations?.length) return null;
  const priorityColor = { High: 'bg-red-100 text-red-700', Medium: 'bg-amber-100 text-amber-700', Low: 'bg-green-100 text-green-700' };
  const scenarioColor = { optimistic: 'bg-green-50 border-green-200', realistic: 'bg-blue-50 border-blue-200', cautious: 'bg-amber-50 border-amber-200' };
  return (
    <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target size={15} className="text-yellow-600" />
        <h3 className="text-sm font-bold text-gray-800">التوصيات التنفيذية</h3>
        <span className="ms-auto text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">{recommendations.length} توصية</span>
      </div>
      <div className="space-y-3">
        {recommendations.map((rec, i) => {
          const sc = scenarioColor[rec.scenario] ?? 'bg-gray-50 border-gray-200';
          const pc = priorityColor[rec.priority] ?? 'bg-gray-100 text-gray-700';
          return (
            <div key={i} className={`border rounded-xl p-3 ${sc}`}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${pc}`}>{rec.priority}</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed mb-2">{rec.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {rec.estimatedImpact && (
                  <span className="bg-white/70 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                    📈 {rec.estimatedImpact}
                  </span>
                )}
                {rec.timelineEstimate && (
                  <span className="bg-white/70 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                    ⏱️ {rec.timelineEstimate}
                  </span>
                )}
                {rec.roi && (
                  <span className="bg-white/70 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                    💰 {rec.roi}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentAnalysisResultPage() {
  const { lang } = useLang();
  const navigate  = useNavigate();
  const { state } = useLocation();
  const result = state?.result;
  const isAr = lang === 'ar';

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-500">{isAr ? 'لا توجد نتيجة تحليل. يرجى العودة وإعادة التحليل.' : 'No analysis result found. Please go back and retry.'}</p>
        <button onClick={() => navigate('/documents')} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
          <ArrowRight size={15} /> {isAr ? 'العودة للمستندات' : 'Back to Documents'}
        </button>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const kpi = result.kPIData ?? result.kpiData ?? result.KPIData ?? {};

  return (
    <div className="max-w-3xl mx-auto space-y-0 print:max-w-full" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-4 print:hidden">
        <button
          onClick={() => navigate('/documents')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowRight size={15} /> {isAr ? 'العودة للمستندات' : 'Back to Documents'}
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 text-sm text-primary-600 hover:text-primary-800 transition"
        >
          <Printer size={15} /> {isAr ? 'طباعة التقرير' : 'Print Report'}
        </button>
      </div>

      {/* ── HEADER ── */}
      <div className="bg-[#1e3a5f] text-white rounded-t-2xl px-6 py-5 flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <p className="text-xs text-blue-300 font-medium tracking-widest uppercase">
            Shabana Consulting Group — SCG AI Analyzer
          </p>
          <h1 className="text-xl font-bold mt-1">{isAr ? 'تقرير التحليل الذكي للمستند' : 'AI Document Analysis Report'}</h1>
          <p className="text-xs text-blue-300 mt-0.5">
            {isAr ? 'مبني على معايير PMI · FIDIC · MBA Strategic Methodology' : 'Based on PMI · FIDIC · MBA Strategic Methodology'}
          </p>
        </div>
        <div className="text-xs text-blue-200 space-y-1 sm:text-start">
          <div className="flex items-center gap-1.5">
            <FileText size={11} />
            <span className="font-semibold text-white truncate max-w-[200px]">{result.fileName}</span>
          </div>
          <p>{isAr ? 'تاريخ التحليل:' : 'Analyzed:'} <strong className="text-white">{result.createdAt ? new Date(result.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-GB') : today}</strong></p>
        </div>
      </div>

      {/* ── EXECUTIVE SUMMARY ── */}
      {result.executiveSummary && (
        <div className="bg-[#2d9d6e] text-white px-6 py-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={15} />
            <p className="text-xs font-bold uppercase tracking-widest">{isAr ? 'الملخص التنفيذي' : 'Executive Summary'}</p>
          </div>
          <p className="text-sm leading-relaxed">{result.executiveSummary}</p>
        </div>
      )}

      {/* ── KPI SCORES ── */}
      {(kpi.financialScore || kpi.FinancialScore) && (
        <div className="bg-white border-x border-gray-200 px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={15} className="text-primary-600" />
            <h3 className="text-sm font-bold text-gray-800">{isAr ? 'مؤشرات الأداء الرئيسية' : 'Key Performance Indicators'}</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <ScoreBadge score={kpi.financialScore ?? kpi.FinancialScore} label={isAr ? 'الأداء المالي' : 'Financial'} />
            <ScoreBadge score={kpi.operationalScore ?? kpi.OperationalScore} label={isAr ? 'الكفاءة التشغيلية' : 'Operational'} />
            <ScoreBadge score={kpi.riskScore ?? kpi.RiskScore} label={isAr ? 'درجة المخاطر' : 'Risk Score'} />
            <ScoreBadge score={kpi.growthOpportunityScore ?? kpi.GrowthOpportunityScore} label={isAr ? 'فرص النمو' : 'Growth'} />
          </div>
        </div>
      )}

      {/* ── CONTENT SECTIONS ── */}
      <div className="bg-white border-x border-gray-200 px-6 py-5 space-y-4">
        <ListSection
          icon={CheckCircle2}
          title={isAr ? 'نقاط القوة' : 'Strengths'}
          items={result.strengths ?? result.Strengths}
          bg="bg-green-50" border="border-green-200" iconColor="text-green-600"
        />
        <ListSection
          icon={AlertTriangle}
          title={isAr ? 'نقاط الضعف والتحديات' : 'Weaknesses & Challenges'}
          items={result.weaknesses ?? result.Weaknesses}
          bg="bg-red-50" border="border-red-200" iconColor="text-red-600"
        />
        <ListSection
          icon={Users}
          title={isAr ? 'القطاعات المستهدفة' : 'Target Segments'}
          items={result.targetSegments ?? result.TargetSegments}
          bg="bg-blue-50" border="border-blue-200" iconColor="text-blue-600"
        />
        <ListSection
          icon={Zap}
          title={isAr ? 'إجراءات فورية (خلال 30 يوم)' : 'Immediate Actions (30 days)'}
          items={result.immediateActions ?? result.ImmediateActions}
          bg="bg-purple-50" border="border-purple-200" iconColor="text-purple-600"
        />
        <RecommendationsSection recommendations={result.recommendations ?? result.Recommendations} />
      </div>

      {/* ── FOOTER ── */}
      <div className="bg-[#1e3a5f] text-white rounded-b-2xl px-6 py-4 grid grid-cols-3 gap-4 items-center">
        <div className="col-span-1">
          <p className="text-xs text-blue-300">{isAr ? 'تم التحليل بواسطة' : 'Analyzed by'}</p>
          <p className="text-sm font-bold mt-0.5">SCG AI Analyzer</p>
          <p className="text-xs text-blue-400 mt-0.5">PMI · FIDIC · MBA</p>
        </div>
        <div className="col-span-1 text-center">
          <p className="text-xs text-blue-300 mb-1">{today}</p>
          <p className="text-xs text-blue-400">{isAr ? 'جميع النتائج مبنية على محتوى الملف المرفوع' : 'All results based on uploaded file content'}</p>
        </div>
        <div className="col-span-1 flex flex-col items-end gap-2">
          <button
            onClick={() => window.print()}
            className="print:hidden flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
          >
            <Printer size={12} /> {isAr ? 'طباعة' : 'Print'}
          </button>
          <button
            onClick={() => navigate('/documents')}
            className="print:hidden flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
          >
            <ArrowRight size={12} /> {isAr ? 'العودة' : 'Back'}
          </button>
        </div>
      </div>
    </div>
  );
}
