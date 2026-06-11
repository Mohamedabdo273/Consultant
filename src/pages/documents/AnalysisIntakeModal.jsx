import { useState } from 'react';
import { X, BrainCircuit, Loader2, FileText, ChevronDown } from 'lucide-react';

// ── Options ───────────────────────────────────────────────────────────────────
const BUSINESS_ACTIVITIES = {
  ar: [
    { value: '', label: 'اختر نوع النشاط...' },
    { value: 'مقاولات وإنشاءات', label: '🏗️ مقاولات وإنشاءات' },
    { value: 'عقارات وتطوير', label: '🏠 عقارات وتطوير عقاري' },
    { value: 'تجارة وتوزيع', label: '🛒 تجارة وتوزيع' },
    { value: 'صناعة وتصنيع', label: '🏭 صناعة وتصنيع' },
    { value: 'خدمات مهنية', label: '💼 خدمات مهنية واستشارات' },
    { value: 'تقنية ومعلومات', label: '💻 تقنية ومعلومات' },
    { value: 'رعاية صحية', label: '🏥 رعاية صحية وطب' },
    { value: 'تعليم وتدريب', label: '🎓 تعليم وتدريب' },
    { value: 'مالية وبنوك', label: '🏦 خدمات مالية وبنوك' },
    { value: 'نفط وطاقة', label: '⛽ نفط وطاقة' },
    { value: 'لوجستيات ونقل', label: '🚚 لوجستيات ونقل' },
    { value: 'سياحة وضيافة', label: '✈️ سياحة وضيافة وفنادق' },
    { value: 'زراعة وغذاء', label: '🌾 زراعة وصناعة غذائية' },
    { value: 'أخرى', label: '📋 أخرى' },
  ],
  en: [
    { value: '', label: 'Select activity type...' },
    { value: 'Construction', label: '🏗️ Construction & Engineering' },
    { value: 'Real Estate', label: '🏠 Real Estate & Development' },
    { value: 'Trading', label: '🛒 Trading & Distribution' },
    { value: 'Manufacturing', label: '🏭 Manufacturing & Industry' },
    { value: 'Professional Services', label: '💼 Professional Services & Consulting' },
    { value: 'Technology', label: '💻 Technology & IT' },
    { value: 'Healthcare', label: '🏥 Healthcare & Medical' },
    { value: 'Education', label: '🎓 Education & Training' },
    { value: 'Finance', label: '🏦 Finance & Banking' },
    { value: 'Oil & Energy', label: '⛽ Oil & Energy' },
    { value: 'Logistics', label: '🚚 Logistics & Transportation' },
    { value: 'Tourism', label: '✈️ Tourism & Hospitality' },
    { value: 'Agriculture', label: '🌾 Agriculture & Food Industry' },
    { value: 'Other', label: '📋 Other' },
  ],
};

const ANALYSIS_GOALS = {
  ar: [
    { value: '', label: 'ما هدفك من التحليل؟' },
    { value: 'تحسين الربحية وتقليل التكاليف', label: '💰 تحسين الربحية وتقليل التكاليف' },
    { value: 'التوسع ودخول أسواق جديدة', label: '🚀 التوسع ودخول أسواق جديدة' },
    { value: 'تقليل المخاطر وزيادة الاستدامة', label: '🛡️ تقليل المخاطر وزيادة الاستدامة' },
    { value: 'تحسين الكفاءة التشغيلية', label: '⚙️ تحسين الكفاءة التشغيلية' },
    { value: 'تقييم الوضع المالي الحالي', label: '📊 تقييم الوضع المالي الحالي' },
    { value: 'دراسة فرص استثمارية', label: '💡 دراسة فرص استثمارية' },
    { value: 'إعداد خطة استراتيجية', label: '🎯 إعداد خطة استراتيجية' },
    { value: 'تطوير المنتج أو الخدمة', label: '🔧 تطوير المنتج أو الخدمة' },
    { value: 'تحسين تجربة العميل', label: '🤝 تحسين تجربة العميل' },
    { value: 'إدارة التغيير والتحول الرقمي', label: '🤖 إدارة التغيير والتحول الرقمي' },
  ],
  en: [
    { value: '', label: 'What is your analysis goal?' },
    { value: 'Improve profitability and reduce costs', label: '💰 Improve profitability and reduce costs' },
    { value: 'Expansion into new markets', label: '🚀 Expansion into new markets' },
    { value: 'Risk reduction and sustainability', label: '🛡️ Risk reduction and sustainability' },
    { value: 'Operational efficiency improvement', label: '⚙️ Operational efficiency improvement' },
    { value: 'Current financial assessment', label: '📊 Current financial assessment' },
    { value: 'Investment opportunity study', label: '💡 Investment opportunity study' },
    { value: 'Strategic plan preparation', label: '🎯 Strategic plan preparation' },
    { value: 'Product/service development', label: '🔧 Product/service development' },
    { value: 'Customer experience improvement', label: '🤝 Customer experience improvement' },
    { value: 'Digital transformation', label: '🤖 Digital transformation' },
  ],
};

const REVENUE_RANGES = {
  ar: [
    { value: '', label: 'الإيرادات السنوية (اختياري)' },
    { value: 'أقل من مليون جنيه', label: 'أقل من 1 مليون جنيه' },
    { value: '1-5 مليون جنيه', label: '1 - 5 مليون جنيه' },
    { value: '5-20 مليون جنيه', label: '5 - 20 مليون جنيه' },
    { value: '20-100 مليون جنيه', label: '20 - 100 مليون جنيه' },
    { value: 'أكثر من 100 مليون جنيه', label: 'أكثر من 100 مليون جنيه' },
    { value: 'أكثر من 500 مليون جنيه', label: 'أكثر من 500 مليون جنيه' },
  ],
  en: [
    { value: '', label: 'Annual revenue (optional)' },
    { value: 'Less than 1M EGP', label: 'Less than 1M EGP' },
    { value: '1-5M EGP', label: '1 - 5M EGP' },
    { value: '5-20M EGP', label: '5 - 20M EGP' },
    { value: '20-100M EGP', label: '20 - 100M EGP' },
    { value: 'Over 100M EGP', label: 'Over 100M EGP' },
    { value: 'Over 500M EGP', label: 'Over 500M EGP' },
  ],
};

const ANALYSIS_FOCUS = {
  ar: [
    { value: 'تحليل شامل (مالي + تشغيلي + استراتيجي)', label: '🔍 تحليل شامل (مالي + تشغيلي + استراتيجي)', default: true },
    { value: 'تركيز على الجانب المالي والتدفق النقدي', label: '💵 تحليل مالي وتدفق نقدي' },
    { value: 'تركيز على الكفاءة التشغيلية والعمليات', label: '⚙️ كفاءة تشغيلية وعمليات' },
    { value: 'تركيز على المخاطر والحوكمة', label: '🛡️ مخاطر وحوكمة' },
    { value: 'تركيز على فرص النمو والتوسع', label: '📈 فرص النمو والتوسع' },
    { value: 'تحليل تنافسي ووضع السوق', label: '🏆 تحليل تنافسي ووضع السوق' },
  ],
  en: [
    { value: 'Comprehensive analysis (financial + operational + strategic)', label: '🔍 Comprehensive (financial + operational + strategic)', default: true },
    { value: 'Focus on financial analysis and cash flow', label: '💵 Financial analysis & cash flow' },
    { value: 'Focus on operational efficiency', label: '⚙️ Operational efficiency' },
    { value: 'Focus on risk and governance', label: '🛡️ Risk & governance' },
    { value: 'Focus on growth and expansion opportunities', label: '📈 Growth & expansion' },
    { value: 'Competitive analysis and market position', label: '🏆 Competitive & market analysis' },
  ],
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function AnalysisIntakeModal({ open, onClose, onSubmit, doc, isAnalyzing, lang = 'ar' }) {
  const isAr = lang === 'ar';

  const [form, setForm] = useState({
    businessActivity: '',
    analysisGoal: '',
    mainChallenge: '',
    annualRevenueRange: '',
    companyAge: '',
    analysisFocus: ANALYSIS_FOCUS[isAr ? 'ar' : 'en'].find(f => f.default)?.value ?? '',
  });

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.businessActivity) {
      return;
    }
    onSubmit({
      businessActivity:  form.businessActivity || undefined,
      analysisGoal:      form.analysisGoal     || undefined,
      mainChallenge:     form.mainChallenge     || undefined,
      annualRevenueRange: form.annualRevenueRange || undefined,
      companyAge:        form.companyAge        || undefined,
      customPromptFocus: form.analysisFocus     || undefined,
    });
  };

  if (!open) return null;

  const fileName = doc?.name ?? doc?.fileName ?? doc?.originalFileName ?? '—';
  const activities = BUSINESS_ACTIVITIES[isAr ? 'ar' : 'en'];
  const goals = ANALYSIS_GOALS[isAr ? 'ar' : 'en'];
  const revenues = REVENUE_RANGES[isAr ? 'ar' : 'en'];
  const focuses = ANALYSIS_FOCUS[isAr ? 'ar' : 'en'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-t-2xl p-5 text-white">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <BrainCircuit size={18} />
              </div>
              <div>
                <h2 className="font-bold text-base">
                  {isAr ? 'ضبط التحليل الذكي' : 'Configure AI Analysis'}
                </h2>
                <p className="text-primary-200 text-xs mt-0.5">
                  {isAr ? 'SCG AI Analyzer — Powered by Gemini' : 'SCG AI Analyzer — Powered by Gemini'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition">
              <X size={18} />
            </button>
          </div>
          {/* File badge */}
          <div className="flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2">
            <FileText size={13} className="flex-shrink-0 text-primary-200" />
            <span className="text-xs font-medium truncate text-white">{fileName}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* نوع النشاط — required */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {isAr ? '🏢 نوع النشاط التجاري' : '🏢 Business Activity'}
              <span className="text-red-500 ms-1">*</span>
            </label>
            <div className="relative">
              <select
                className="input w-full appearance-none pe-8"
                value={form.businessActivity}
                onChange={e => set('businessActivity', e.target.value)}
                required
              >
                {activities.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* هدف التحليل */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {isAr ? '🎯 ما هدفك من التحليل؟' : '🎯 Analysis Goal'}
              <span className="text-red-500 ms-1">*</span>
            </label>
            <div className="relative">
              <select
                className="input w-full appearance-none pe-8"
                value={form.analysisGoal}
                onChange={e => set('analysisGoal', e.target.value)}
                required
              >
                {goals.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* التحدي الرئيسي */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              {isAr ? '⚠️ ما أكبر تحدٍ تواجهه الشركة حالياً؟' : '⚠️ Biggest current challenge?'}
            </label>
            <textarea
              className="input w-full resize-none text-sm"
              rows={2}
              placeholder={isAr
                ? 'مثال: انخفاض هامش الربح، تأخر في التحصيل، منافسة شديدة...'
                : 'E.g. low profit margins, collection delays, strong competition...'}
              value={form.mainChallenge}
              onChange={e => set('mainChallenge', e.target.value)}
            />
          </div>

          {/* تركيز التحليل */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {isAr ? '🔍 تركيز التحليل' : '🔍 Analysis Focus'}
            </label>
            <div className="grid grid-cols-1 gap-2">
              {focuses.map(f => (
                <label
                  key={f.value}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all ${
                    form.analysisFocus === f.value
                      ? 'border-primary-400 bg-primary-50 text-primary-800'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="analysisFocus"
                    value={f.value}
                    checked={form.analysisFocus === f.value}
                    onChange={() => set('analysisFocus', f.value)}
                    className="accent-primary-600"
                  />
                  <span className="text-sm">{f.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* الإيرادات + عمر الشركة */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {isAr ? '💰 الإيرادات السنوية' : '💰 Annual Revenue'}
              </label>
              <div className="relative">
                <select
                  className="input w-full text-sm appearance-none pe-6"
                  value={form.annualRevenueRange}
                  onChange={e => set('annualRevenueRange', e.target.value)}
                >
                  {revenues.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown size={12} className="absolute end-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                {isAr ? '📅 عمر الشركة' : '📅 Company Age'}
              </label>
              <input
                type="text"
                className="input w-full text-sm"
                placeholder={isAr ? 'مثال: 5 سنوات' : 'e.g. 5 years'}
                value={form.companyAge}
                onChange={e => set('companyAge', e.target.value)}
              />
            </div>
          </div>

          {/* Note */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            <p className="font-semibold mb-1">
              {isAr ? '💡 ملاحظة مهمة' : '💡 Important Note'}
            </p>
            <p>
              {isAr
                ? 'التحليل يعتمد على محتوى الملف المرفوع فعلياً. كلما كانت إجاباتك أدق، كان التحليل أكثر دقة وفائدة.'
                : 'Analysis is based on the actual uploaded file content. The more precise your answers, the more accurate and useful the analysis will be.'
              }
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary py-2.5 text-sm"
              disabled={isAnalyzing}
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isAnalyzing || !form.businessActivity || !form.analysisGoal}
              className="flex-1 btn-primary py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {isAr ? 'جارٍ التحليل...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <BrainCircuit size={15} />
                  {isAr ? 'ابدأ التحليل' : 'Start Analysis'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
