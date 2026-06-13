import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  TrendingUp, Target, BarChart3, Building2, Lightbulb,
  ChevronRight, Loader2, CheckCircle2, Printer,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { biApi } from '../../api/index';
import { useLang } from '../../context/LangContext';

// ── Result Card ───────────────────────────────────────────────────────────────
function ResultSection({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <h3 className="font-semibold text-gray-800 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ScenarioCard({ label, color, data }) {
  if (!data) return null;
  return (
    <div className={`border rounded-xl p-4 ${color}`}>
      <p className="font-semibold mb-2">{label}</p>
      {data.description && <p className="text-sm text-gray-700 mb-2">{data.description}</p>}
      {data.roi && <p className="text-sm"><span className="font-medium">ROI:</span> {data.roi}</p>}
      {data.timeline && <p className="text-sm"><span className="font-medium">Timeline:</span> {data.timeline}</p>}
      {data.steps?.length > 0 && (
        <ul className="mt-2 space-y-1">
          {data.steps.map((s, i) => (
            <li key={i} className="text-sm flex gap-2">
              <span className="text-gray-400">{i + 1}.</span> {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Priority color helpers ─────────────────────────────────────────────────────
const priorityColor = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e' };
const effortColor   = { Low: '#22c55e', Medium: '#3b82f6', High: '#f59e0b' };
const PIE_COLORS = ['#1e3a5f', '#2d9d6e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

// ── Professional BI Report (Giza Power style) ──────────────────────────────────
function BdAnalysisReport({ data, formData }) {
  const today = new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // build pie data from priorities
  const priorityCount = { High: 0, Medium: 0, Low: 0 };
  data.opportunities?.forEach(o => { if (priorityCount[o.priority] !== undefined) priorityCount[o.priority]++; });
  const pieData = Object.entries(priorityCount)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name: name === 'High' ? 'أولوية عالية' : name === 'Medium' ? 'أولوية متوسطة' : 'أولوية منخفضة', value }));

  // build bar data from effort
  const effortCount = { Low: 0, Medium: 0, High: 0 };
  data.opportunities?.forEach(o => { if (effortCount[o.effort] !== undefined) effortCount[o.effort]++; });
  const barData = [
    { name: 'جهد منخفض', value: effortCount.Low,    fill: effortColor.Low },
    { name: 'جهد متوسط', value: effortCount.Medium,  fill: effortColor.Medium },
    { name: 'جهد عالي',  value: effortCount.High,    fill: effortColor.High },
  ].filter(d => d.value > 0);

  const total = data.opportunities?.length ?? 0;

  return (
    <div className="space-y-0 print:space-y-0" id="bd-report">
      {/* ── HEADER ── */}
      <div className="bg-[#1e3a5f] text-white rounded-t-2xl px-6 py-4 flex items-start justify-between">
        <div>
          <p className="text-xs text-blue-300 font-medium tracking-wide uppercase">Shabana Consulting Group</p>
          <h2 className="text-xl font-bold mt-1">تقرير تحليل فرص الأعمال</h2>
          <p className="text-sm text-blue-200 mt-0.5">Business Opportunities Analysis Report</p>
        </div>
        <div className="text-left text-xs text-blue-200 space-y-0.5">
          <p className="font-semibold text-white">نوع النشاط: {formData?.businessContext ?? '—'}</p>
          <p>السوق المستهدف: {formData?.targetMarket ?? '—'}</p>
          <p>هدف النمو: {formData?.growthGoal ?? '—'}</p>
          <p>الإطار الزمني: {formData?.timeframe ?? '—'}</p>
        </div>
      </div>

      {/* ── EXEC SUMMARY BAND ── */}
      {data.executiveSummary && (
        <div className="bg-[#2d9d6e] text-white px-6 py-3">
          <p className="text-sm leading-relaxed">{data.executiveSummary}</p>
        </div>
      )}

      {/* ── OPPORTUNITIES TABLE ── */}
      <div className="bg-white border-x border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle2 size={16} className="text-[#2d9d6e]" />
          <h3 className="font-bold text-[#1e3a5f] text-sm uppercase tracking-wide">الفرص المُحددة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#1e3a5f] text-white">
                <th className="text-right px-3 py-2 font-semibold rounded-tl-lg">الفرصة</th>
                <th className="text-right px-3 py-2 font-semibold">الوصف</th>
                <th className="text-center px-3 py-2 font-semibold">القيمة المتوقعة</th>
                <th className="text-center px-3 py-2 font-semibold">الجهد</th>
                <th className="text-center px-3 py-2 font-semibold">المدة</th>
                <th className="text-center px-3 py-2 font-semibold rounded-tr-lg">الأولوية</th>
              </tr>
            </thead>
            <tbody>
              {data.opportunities?.map((o, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-3 py-2 font-medium text-[#1e3a5f]">{o.title}</td>
                  <td className="px-3 py-2 text-gray-600 max-w-xs">{o.description}</td>
                  <td className="px-3 py-2 text-center text-[#2d9d6e] font-semibold">{o.potentialValue}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: effortColor[o.effort] + '22', color: effortColor[o.effort] }}>
                      {o.effort === 'Low' ? 'منخفض' : o.effort === 'Medium' ? 'متوسط' : 'عالي'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center text-gray-600">{o.timeline}</td>
                  <td className="px-3 py-2 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: priorityColor[o.priority] + '22', color: priorityColor[o.priority] }}>
                      {o.priority === 'High' ? 'عالية' : o.priority === 'Medium' ? 'متوسطة' : 'منخفضة'}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className="bg-[#1e3a5f] text-white font-bold">
                <td className="px-3 py-2 rounded-bl-lg">إجمالي الفرص</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2 text-center">{total} فرصة</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
                <td className="px-3 py-2 rounded-br-lg text-center">100%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CHARTS + CARDS ROW ── */}
      <div className="bg-white border-x border-gray-200 px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Bar chart - effort */}
          <div className="lg:col-span-1">
            <p className="text-xs font-bold text-[#1e3a5f] uppercase mb-2 text-center">توزيع الجهد المطلوب</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" name="عدد الفرص" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart - priority */}
          <div className="lg:col-span-1">
            <p className="text-xs font-bold text-[#1e3a5f] uppercase mb-2 text-center">توزيع الأولويات</p>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Key cards */}
          <div className="lg:col-span-1 space-y-3">
            {/* Market position */}
            {data.marketPosition && (
              <div className="border border-[#2d9d6e] rounded-xl p-3">
                <p className="text-xs font-bold text-[#2d9d6e] mb-1 flex items-center gap-1">
                  <TrendingUp size={12} /> الموقع التنافسي
                </p>
                <p className="text-xs text-gray-700 leading-relaxed">{data.marketPosition}</p>
              </div>
            )}
            {/* Summary stats */}
            <div className="bg-[#1e3a5f] rounded-xl p-3 text-white">
              <p className="text-xs font-bold mb-2 text-blue-200">ملخص الفرص</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-200">إجمالي الفرص</span>
                  <span className="font-bold">{total}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-200">أولوية عالية</span>
                  <span className="font-bold text-red-300">{priorityCount.High}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-200">أولوية متوسطة</span>
                  <span className="font-bold text-yellow-300">{priorityCount.Medium}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-blue-200">أولوية منخفضة</span>
                  <span className="font-bold text-green-300">{priorityCount.Low}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── QUICK WINS + LONG TERM ROW ── */}
      <div className="bg-white border-x border-gray-200 px-6 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {data.quickWins?.length > 0 && (
            <div className="border border-[#2d9d6e] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 size={15} className="text-[#2d9d6e]" />
                <h4 className="font-bold text-[#1e3a5f] text-sm">الانتصارات السريعة (30-90 يوم)</h4>
              </div>
              <ul className="space-y-2">
                {data.quickWins.map((w, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-[#2d9d6e] text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-gray-700">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.longTermPlays?.length > 0 && (
            <div className="border border-[#1e3a5f] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target size={15} className="text-[#1e3a5f]" />
                <h4 className="font-bold text-[#1e3a5f] text-sm">الاستراتيجيات طويلة المدى (1-3 سنوات)</h4>
              </div>
              <ul className="space-y-2">
                {data.longTermPlays.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <ChevronRight size={14} className="text-[#1e3a5f] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* ── GROWTH ROADMAP ── */}
      {data.growthRoadmap && (
        <div className="bg-white border-x border-gray-200 px-6 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-xs font-bold text-[#1e3a5f] mb-1 uppercase tracking-wide">خارطة طريق النمو</p>
            <p className="text-sm text-gray-700 leading-relaxed">{data.growthRoadmap}</p>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <div className="bg-[#1e3a5f] text-white rounded-b-2xl px-6 py-4 grid grid-cols-3 gap-4 items-center">
        <div className="bg-[#2d9d6e] rounded-xl p-3 text-center col-span-1">
          <p className="text-xs text-green-100 mb-1">إجمالي الفرص المُحللة</p>
          <p className="text-2xl font-black">{total}</p>
          <p className="text-xs text-green-200">فرصة أعمال قابلة للتنفيذ</p>
        </div>
        <div className="text-center col-span-1">
          <p className="text-xs text-blue-300 mb-1">اعتمد التقرير</p>
          <p className="font-bold">Shabana Consulting Group</p>
          <p className="text-xs text-blue-300 mt-0.5 italic">SCG — Business Intelligence</p>
        </div>
        <div className="text-center col-span-1">
          <p className="text-xs text-blue-300 mb-1">تاريخ التقرير</p>
          <p className="text-sm font-semibold">{today}</p>
          <button
            onClick={() => window.print()}
            className="mt-2 flex items-center gap-1 text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-lg mx-auto transition"
          >
            <Printer size={12} /> طباعة التقرير
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tool configs ──────────────────────────────────────────────────────────────
function useTools(lang) {
  const lbl = (ar, en) => lang === 'ar' ? ar : en;
  return [
    {
      key: 'opportunities',
      icon: Lightbulb,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      title: lbl('تحليل فرص الأعمال', 'Business Opportunities'),
      desc: lbl('اكتشف فرص النمو والاستثمار القابلة للتنفيذ', 'Discover actionable growth opportunities'),
      fields: [
        { name: 'businessContext', label: lbl('نوع النشاط', 'Business Type'), required: true, placeholder: lbl('مثال: مقاولات إنشائية', 'e.g. Construction') },
        { name: 'targetMarket',   label: lbl('السوق المستهدف', 'Target Market'), placeholder: lbl('السوق المحلي', 'Local market') },
        { name: 'currentRevenue', label: lbl('الإيرادات الحالية', 'Current Revenue'), placeholder: lbl('مثال: 5 مليون جنيه سنوياً', 'e.g. 5M/year') },
        { name: 'growthGoal',     label: lbl('هدف النمو', 'Growth Goal'),    placeholder: lbl('مثال: 30% نمو خلال سنة', 'e.g. 30% growth') },
        { name: 'timeframe',      label: lbl('الإطار الزمني', 'Timeframe'),   placeholder: '12 months' },
      ],
      mutationFn: (data) => biApi.analyzeOpportunities(data),
      renderResult: (d, lbl) => d && (
        <>
          {d.executiveSummary && (
            <ResultSection title={lbl('الملخص التنفيذي','Executive Summary')}>
              <p className="text-sm text-gray-700 leading-relaxed">{d.executiveSummary}</p>
            </ResultSection>
          )}
          {d.opportunities?.length > 0 && (
            <ResultSection title={lbl('الفرص','Opportunities')}>
              <div className="space-y-3">
                {d.opportunities.map((o, i) => (
                  <div key={i} className="border rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium">{o.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        o.priority === 'High' ? 'bg-red-100 text-red-700' :
                        o.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>{o.priority}</span>
                    </div>
                    <p className="text-sm text-gray-600">{o.description}</p>
                    {o.potentialValue && <p className="text-xs text-blue-600 mt-1">💰 {o.potentialValue}</p>}
                  </div>
                ))}
              </div>
            </ResultSection>
          )}
          {d.quickWins?.length > 0 && (
            <ResultSection title={lbl('انتصارات سريعة (30-90 يوم)','Quick Wins (30-90 days)')}>
              <ul className="space-y-2">
                {d.quickWins.map((w, i) => (
                  <li key={i} className="flex gap-2 text-sm"><CheckCircle2 size={15} className="text-green-500 flex-shrink-0 mt-0.5" /> {w}</li>
                ))}
              </ul>
            </ResultSection>
          )}
        </>
      ),
    },
    {
      key: 'strategic',
      icon: Target,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      title: lbl('الخطة الاستراتيجية', 'Strategic Plan'),
      desc: lbl('خطة بـ 3 سيناريوهات (متفائل / واقعي / حذر)', '3-scenario plan (optimistic/realistic/cautious)'),
      fields: [
        { name: 'currentSituation', label: lbl('الوضع الحالي','Current Situation'), required: true, textarea: true, placeholder: lbl('صف وضع شركتك الحالي بالتفصيل','Describe current situation') },
        { name: 'desiredOutcome',   label: lbl('النتيجة المطلوبة','Desired Outcome'), required: true, placeholder: lbl('ما الهدف الذي تريد تحقيقه؟','What do you want to achieve?') },
        { name: 'constraints',      label: lbl('القيود والتحديات','Constraints'),  placeholder: lbl('ميزانية، موارد، وقت...','Budget, resources, time...') },
        { name: 'timeframe',        label: lbl('الإطار الزمني','Timeframe'),       placeholder: '12-24 months' },
        { name: 'budget',           label: lbl('الميزانية المتاحة','Budget'),       placeholder: lbl('مثال: 500,000 جنيه','e.g. $500K') },
      ],
      mutationFn: (data) => biApi.generateStrategicPlan(data),
      renderResult: (d, lbl) => d && (
        <>
          {d.executiveSummary && (
            <ResultSection title={lbl('الملخص التنفيذي','Executive Summary')}>
              <p className="text-sm text-gray-700 leading-relaxed">{d.executiveSummary}</p>
            </ResultSection>
          )}
          <ResultSection title={lbl('السيناريوهات الثلاثة','Three Scenarios')}>
            <div className="space-y-3">
              <ScenarioCard label={`🟢 ${lbl('المتفائل','Optimistic')}`} color="bg-green-50 border-green-200" data={d.optimistic} />
              <ScenarioCard label={`🟡 ${lbl('الواقعي','Realistic')}`}  color="bg-yellow-50 border-yellow-200" data={d.realistic} />
              <ScenarioCard label={`🔴 ${lbl('الحذر','Cautious')}`}     color="bg-red-50 border-red-200"     data={d.cautious} />
            </div>
          </ResultSection>
          {d.recommendation && (
            <ResultSection title={`📌 ${lbl('التوصية المهنية','Recommendation')}`}>
              <p className="text-sm text-gray-700 leading-relaxed">{d.recommendation}</p>
            </ResultSection>
          )}
          {d.kpiBenchmarks?.length > 0 && (
            <ResultSection title={lbl('مؤشرات الأداء للقياس','KPI Benchmarks')}>
              <ul className="space-y-1">
                {d.kpiBenchmarks.map((k, i) => <li key={i} className="text-sm flex gap-2"><ChevronRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />{k}</li>)}
              </ul>
            </ResultSection>
          )}
        </>
      ),
    },
    {
      key: 'investment',
      icon: Building2,
      color: 'text-green-600',
      bg: 'bg-green-50',
      title: lbl('تحليل الاستثمار', 'Investment Analysis'),
      desc: lbl('عقارات أو أعمال — Buy / Hold / Avoid', 'Real estate or business — Buy / Hold / Avoid'),
      fields: [
        { name: 'assetType',      label: lbl('نوع الأصل','Asset Type'),         required: true, placeholder: lbl('عقار تجاري / مشروع تجاري','Commercial property / Business') },
        { name: 'location',       label: lbl('الموقع','Location'),              required: true, placeholder: lbl('القاهرة، الرياض...','Cairo, Riyadh...') },
        { name: 'purchasePrice',  label: lbl('سعر الشراء','Purchase Price'),    required: true, placeholder: lbl('مثال: 2,500,000 جنيه','e.g. 2.5M EGP') },
        { name: 'expectedReturn', label: lbl('العائد المتوقع','Expected Return'), placeholder: lbl('مثال: 12% سنوياً','e.g. 12% annual') },
        { name: 'holdingPeriod',  label: lbl('فترة الاحتفاظ','Holding Period'),  placeholder: lbl('مثال: 5 سنوات','e.g. 5 years') },
        { name: 'additionalInfo', label: lbl('معلومات إضافية','Additional Info'), textarea: true, placeholder: lbl('أي معلومات مفيدة عن الفرصة','Any relevant information') },
      ],
      mutationFn: (data) => biApi.analyzeInvestment(data),
      renderResult: (d, lbl) => d && (
        <>
          <ResultSection title={lbl('التوصية','Recommendation')}>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-lg ${
              d.recommendation?.includes('Buy') ? 'bg-green-100 text-green-700' :
              d.recommendation?.includes('Avoid') ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {d.recommendation}
            </div>
            {d.estimatedRoi && <p className="mt-2 text-sm text-gray-600">ROI: <strong>{d.estimatedRoi}</strong></p>}
            {d.riskLevel && <p className="text-sm text-gray-600">{lbl('مستوى المخاطر','Risk Level')}: <strong>{d.riskLevel}</strong></p>}
          </ResultSection>
          <ResultSection title={lbl('السيناريوهات','Scenarios')}>
            <div className="space-y-2">
              {d.bestCase && <div className="bg-green-50 rounded-xl p-3"><p className="text-xs font-medium text-green-700 mb-1">{lbl('أفضل حالة','Best Case')}</p><p className="text-sm">{d.bestCase}</p></div>}
              {d.realisticCase && <div className="bg-blue-50 rounded-xl p-3"><p className="text-xs font-medium text-blue-700 mb-1">{lbl('الحالة الواقعية','Realistic')}</p><p className="text-sm">{d.realisticCase}</p></div>}
              {d.worstCase && <div className="bg-red-50 rounded-xl p-3"><p className="text-xs font-medium text-red-700 mb-1">{lbl('أسوأ حالة','Worst Case')}</p><p className="text-sm">{d.worstCase}</p></div>}
            </div>
          </ResultSection>
          {d.hiddenCosts?.length > 0 && (
            <ResultSection title={lbl('التكاليف الخفية','Hidden Costs')}>
              <ul className="space-y-1">{d.hiddenCosts.map((c, i) => <li key={i} className="text-sm text-red-600 flex gap-2">⚠️ {c}</li>)}</ul>
            </ResultSection>
          )}
        </>
      ),
    },
    {
      key: 'market',
      icon: BarChart3,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      title: lbl('تحليل السوق', 'Market Analysis'),
      desc: lbl('المشهد التنافسي والفرص والتهديدات', 'Competitive landscape, opportunities & threats'),
      fields: [
        { name: 'businessType',     label: lbl('نوع النشاط','Business Type'),       required: true, placeholder: lbl('مثال: مقاولات إنشائية','e.g. Construction') },
        { name: 'targetMarket',     label: lbl('السوق المستهدف','Target Market'),    placeholder: lbl('السوق المحلي / التصدير','Local / Export') },
        { name: 'geographicFocus',  label: lbl('النطاق الجغرافي','Geographic Focus'), placeholder: lbl('مصر، السعودية، الخليج...','Egypt, KSA, Gulf...') },
        { name: 'competitorNames',  label: lbl('المنافسون الرئيسيون','Competitors'), placeholder: lbl('أسماء المنافسين','Competitor names') },
        { name: 'additionalContext',label: lbl('سياق إضافي','Additional Context'),  textarea: true },
      ],
      mutationFn: (data) => biApi.analyzeMarket(data),
      renderResult: (d, lbl) => d && (
        <>
          {d.executiveSummary && (
            <ResultSection title={lbl('الملخص','Summary')}><p className="text-sm text-gray-700 leading-relaxed">{d.executiveSummary}</p></ResultSection>
          )}
          {d.marketSize && (
            <ResultSection title={lbl('حجم السوق','Market Size')}>
              <p className="text-sm">{d.marketSize}</p>
              {d.growthTrend && <p className="text-sm mt-1 text-blue-600">{d.growthTrend}</p>}
            </ResultSection>
          )}
          {d.competitiveLandscape && (
            <ResultSection title={lbl('المشهد التنافسي','Competitive Landscape')}>
              <p className="text-sm text-gray-700">{d.competitiveLandscape}</p>
            </ResultSection>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {d.opportunities?.length > 0 && (
              <ResultSection title={lbl('الفرص','Opportunities')}>
                <ul className="space-y-1">{d.opportunities.map((o, i) => <li key={i} className="text-sm flex gap-2"><CheckCircle2 size={14} className="text-green-500 mt-0.5" />{o}</li>)}</ul>
              </ResultSection>
            )}
            {d.threats?.length > 0 && (
              <ResultSection title={lbl('التهديدات','Threats')}>
                <ul className="space-y-1">{d.threats.map((t, i) => <li key={i} className="text-sm flex gap-2 text-red-600">⚠️ {t}</li>)}</ul>
              </ResultSection>
            )}
          </div>
          {d.recommendation && (
            <ResultSection title={`📌 ${lbl('التوصية','Recommendation')}`}>
              <p className="text-sm text-gray-700 leading-relaxed">{d.recommendation}</p>
            </ResultSection>
          )}
        </>
      ),
    },
  ];
}

// ── Tool Panel ────────────────────────────────────────────────────────────────
function ToolPanel({ tool, lang }) {
  const lbl = (ar, en) => lang === 'ar' ? ar : en;
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [result, setResult] = useState(null);
  const [lastFormData, setLastFormData] = useState(null);

  const { mutate, isPending } = useMutation({
    mutationFn: tool.mutationFn,
    onSuccess: (res) => {
      setResult(res.data?.data);
      toast.success(lbl('تم التحليل بنجاح','Analysis complete'));
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? lbl('حدث خطأ','Error occurred')),
  });

  const onSubmit = (data) => {
    setLastFormData(data);
    mutate(data);
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-3 pb-2 border-b">
          <div className={`w-9 h-9 rounded-xl ${tool.bg} flex items-center justify-center`}>
            <tool.icon size={18} className={tool.color} />
          </div>
          <div>
            <h3 className="font-semibold">{tool.title}</h3>
            <p className="text-xs text-gray-500">{tool.desc}</p>
          </div>
        </div>

        {tool.fields.map((f) => (
          <div key={f.name}>
            <label className="label">
              {f.label} {f.required && <span className="text-red-500">*</span>}
            </label>
            {f.textarea ? (
              <textarea
                {...register(f.name, { required: f.required })}
                rows={3}
                placeholder={f.placeholder}
                className="input"
              />
            ) : (
              <input
                {...register(f.name, { required: f.required })}
                placeholder={f.placeholder}
                className="input"
              />
            )}
            {errors[f.name] && <p className="text-red-500 text-xs mt-1">{lbl('هذا الحقل مطلوب','This field is required')}</p>}
          </div>
        ))}

        <button type="submit" disabled={isPending}
          className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2.5 font-medium transition flex items-center justify-center gap-2 disabled:opacity-50">
          {isPending ? <><Loader2 size={16} className="animate-spin" /> {lbl('جاري التحليل...','Analyzing...')}</> : lbl('تحليل الآن','Analyze Now')}
        </button>
      </form>

      {result && (
        tool.key === 'opportunities'
          ? <BdAnalysisReport data={result} formData={lastFormData} />
          : tool.renderResult(result, lbl)
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BusinessIntelligencePage() {
  const { lang } = useLang();
  const lbl = (ar, en) => lang === 'ar' ? ar : en;
  const tools = useTools(lang);
  const [activeTool, setActiveTool] = useState('opportunities');

  const current = tools.find(t => t.key === activeTool);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <TrendingUp size={20} className="text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{lbl('ذكاء الأعمال','Business Intelligence')}</h1>
          <p className="text-sm text-gray-500">{lbl('تحليل فرص، خطط استراتيجية، استثمار، وسوق — مدعوم بـ SCG','Opportunities, strategic plans, investment & market analysis')}</p>
        </div>
      </div>

      {/* Tool Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {tools.map(t => (
          <button key={t.key} onClick={() => setActiveTool(t.key)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition ${
              activeTool === t.key
                ? 'border-primary-300 bg-primary-50 shadow-sm'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
            }`}>
            <div className={`w-10 h-10 rounded-xl ${t.bg} flex items-center justify-center`}>
              <t.icon size={18} className={t.color} />
            </div>
            <span className="text-sm font-medium text-center leading-tight">{t.title}</span>
          </button>
        ))}
      </div>

      {/* Active Tool */}
      {current && <ToolPanel tool={current} lang={lang} />}
    </div>
  );
}
