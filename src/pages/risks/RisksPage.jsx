import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  ShieldAlert, Plus, Trash2, Eye, Brain, AlertTriangle,
  CheckCircle2, TrendingUp, BarChart2, Zap, X,
} from 'lucide-react';
import { risksApi } from '../../api/index';
import { useLang } from '../../context/LangContext';

// ── helpers ───────────────────────────────────────────────────────────────────
const CATEGORIES = ['Financial','Operational','Legal','Technical','Market','HR','Strategic','Environmental'];
const STATUSES   = ['Identified','Assessed','Mitigating','Resolved','Accepted','Escalated'];
const PROBS      = ['VeryLow','Low','Medium','High','VeryHigh'];
const IMPACTS    = ['VeryLow','Low','Medium','High','Critical'];

function scoreColor(s) {
  if (s >= 75) return 'bg-red-100 text-red-700';
  if (s >= 50) return 'bg-orange-100 text-orange-700';
  if (s >= 25) return 'bg-yellow-100 text-yellow-700';
  return 'bg-green-100 text-green-700';
}
function statusColor(s) {
  const m = { Identified:'bg-blue-100 text-blue-700', Assessed:'bg-purple-100 text-purple-700',
    Mitigating:'bg-yellow-100 text-yellow-700', Resolved:'bg-green-100 text-green-700',
    Accepted:'bg-gray-100 text-gray-700', Escalated:'bg-red-100 text-red-700' };
  return m[s] ?? 'bg-gray-100 text-gray-600';
}

// ── Risk Matrix visual ────────────────────────────────────────────────────────
function RiskMatrix({ matrix }) {
  if (!matrix?.cells) return null;
  const levels = ['VeryLow','Low','Medium','High','VeryHigh'];
  const cellBg = (score) => {
    if (score >= 75) return 'bg-red-400';
    if (score >= 50) return 'bg-orange-300';
    if (score >= 25) return 'bg-yellow-200';
    return 'bg-green-200';
  };

  return (
    <div className="overflow-auto">
      <p className="text-xs text-gray-500 mb-2">Impact →  /  Probability ↑</p>
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `auto repeat(5,1fr)` }}>
        {/* header row */}
        <div />
        {levels.map(l => (
          <div key={l} className="text-center text-xs font-medium text-gray-500 pb-1">{l}</div>
        ))}
        {/* rows probability high → low */}
        {[5,4,3,2,1].map(prob => (
          <>
            <div key={`lbl-${prob}`} className="text-xs text-gray-500 flex items-center pr-2">{levels[prob-1]}</div>
            {[1,2,3,4,5].map(impact => {
              const cell = matrix.cells.find(c => c.probability === prob && c.impact === impact);
              const score = (prob * impact / 25) * 100;
              return (
                <div key={`${prob}-${impact}`}
                  className={`w-16 h-12 rounded flex flex-col items-center justify-center text-xs ${cellBg(score)}`}>
                  {cell?.riskTitles?.length > 0 && (
                    <span className="font-bold text-gray-800">{cell.riskTitles.length}</span>
                  )}
                </div>
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

// ── Decision Support Modal ────────────────────────────────────────────────────
function DecisionModal({ riskId, onClose }) {
  const { lang } = useLang();
  const { data, isLoading } = useQuery({
    queryKey: ['risk-decision', riskId],
    queryFn: () => risksApi.getDecisionSupport(riskId).then(r => r.data?.data),
    enabled: !!riskId,
  });
  const d = data;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">{lang === 'ar' ? 'دعم القرار — 3 سيناريوهات' : 'Decision Support — 3 Scenarios'}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="text-center py-10 text-gray-400">{lang === 'ar' ? 'جاري التحليل...' : 'Analyzing...'}</div>
          ) : d ? (
            <>
              {[
                { key: 'optimistic', label: lang === 'ar' ? '🟢 المتفائل' : '🟢 Optimistic', color: 'bg-green-50 border-green-200' },
                { key: 'realistic',  label: lang === 'ar' ? '🟡 الواقعي'  : '🟡 Realistic',  color: 'bg-yellow-50 border-yellow-200' },
                { key: 'cautious',   label: lang === 'ar' ? '🔴 الحذر'    : '🔴 Cautious',   color: 'bg-red-50 border-red-200' },
              ].map(({ key, label, color }) => (
                <div key={key} className={`border rounded-xl p-4 ${color}`}>
                  <p className="font-semibold mb-1">{label}</p>
                  <p className="text-sm text-gray-700">{d[key]}</p>
                </div>
              ))}
              {d.recommendation && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="font-semibold mb-1">📌 {lang === 'ar' ? 'التوصية' : 'Recommendation'}</p>
                  <p className="text-sm text-gray-700">{d.recommendation}</p>
                </div>
              )}
              {d.roiAnalysis && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="font-semibold mb-1">💰 ROI</p>
                  <p className="text-sm text-gray-700">{d.roiAnalysis}</p>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-400">{lang === 'ar' ? 'لا توجد بيانات' : 'No data'}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────
function RiskModal({ risk, onClose }) {
  const { lang } = useLang();
  const qc = useQueryClient();
  const isEdit = !!risk?.id;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: risk ?? {
      title: '', description: '', probability: 'Medium', impact: 'Medium',
      category: 'Operational', status: 'Identified', mitigationPlan: '', owner: '',
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => isEdit
      ? risksApi.update(risk.id, data)
      : risksApi.create(data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? (isEdit ? 'تم التحديث' : 'تم الإنشاء') : (isEdit ? 'Updated' : 'Created'));
      qc.invalidateQueries({ queryKey: ['risks'] });
      qc.invalidateQueries({ queryKey: ['risks-dashboard'] });
      onClose();
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? 'Error'),
  });

  const lbl = (ar, en) => lang === 'ar' ? ar : en;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">
            {isEdit ? lbl('تعديل المخاطرة','Edit Risk') : lbl('مخاطرة جديدة','New Risk')}
          </h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(mutate)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{lbl('العنوان','Title')} *</label>
            <input {...register('title', { required: true })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{lbl('مطلوب','Required')}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{lbl('الوصف','Description')}</label>
            <textarea {...register('description')} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{lbl('الاحتمالية','Probability')}</label>
              <select {...register('probability')} className="w-full border rounded-lg px-3 py-2 text-sm">
                {PROBS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{lbl('التأثير','Impact')}</label>
              <select {...register('impact')} className="w-full border rounded-lg px-3 py-2 text-sm">
                {IMPACTS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{lbl('التصنيف','Category')}</label>
              <select {...register('category')} className="w-full border rounded-lg px-3 py-2 text-sm">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{lbl('الحالة','Status')}</label>
              <select {...register('status')} className="w-full border rounded-lg px-3 py-2 text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{lbl('خطة التخفيف','Mitigation Plan')}</label>
            <textarea {...register('mitigationPlan')} rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{lbl('المسؤول','Owner')}</label>
            <input {...register('owner')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isPending}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-2.5 text-sm font-medium transition disabled:opacity-50">
              {isPending ? '...' : lbl('حفظ','Save')}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 border rounded-lg py-2.5 text-sm font-medium hover:bg-gray-50 transition">
              {lbl('إلغاء','Cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function RisksPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const lbl = (ar, en) => lang === 'ar' ? ar : en;

  const [tab, setTab]         = useState('list');   // list | matrix | warnings
  const [showCreate, setShowCreate] = useState(false);
  const [editRisk, setEditRisk]     = useState(null);
  const [decisionId, setDecisionId] = useState(null);
  const [assessingId, setAssessingId] = useState(null);

  const { data: dashboard } = useQuery({
    queryKey: ['risks-dashboard'],
    queryFn: () => risksApi.getDashboard().then(r => r.data?.data),
  });
  const { data: risks = [], isLoading } = useQuery({
    queryKey: ['risks'],
    queryFn: () => risksApi.getAll().then(r => r.data?.data ?? []),
  });
  const { data: matrix } = useQuery({
    queryKey: ['risks-matrix'],
    queryFn: () => risksApi.getMatrix().then(r => r.data?.data),
    enabled: tab === 'matrix',
  });
  const { data: warnings = [] } = useQuery({
    queryKey: ['risks-warnings'],
    queryFn: () => risksApi.getEarlyWarnings().then(r => r.data?.data ?? []),
    enabled: tab === 'warnings',
  });

  const deleteMut = useMutation({
    mutationFn: (id) => risksApi.delete(id),
    onSuccess: () => {
      toast.success(lbl('تم الحذف','Deleted'));
      qc.invalidateQueries({ queryKey: ['risks'] });
      qc.invalidateQueries({ queryKey: ['risks-dashboard'] });
    },
  });

  const assessMut = useMutation({
    mutationFn: (id) => risksApi.assess(id),
    onSuccess: () => {
      toast.success(lbl('تم التقييم بنجاح','AI assessment complete'));
      qc.invalidateQueries({ queryKey: ['risks'] });
      setAssessingId(null);
    },
    onError: () => setAssessingId(null),
  });

  const stats = [
    { label: lbl('إجمالي المخاطر','Total Risks'),   value: dashboard?.totalRisks ?? risks.length, color: 'text-blue-600' },
    { label: lbl('مخاطر حرجة','Critical'),          value: dashboard?.criticalRisks ?? 0,       color: 'text-red-600' },
    { label: lbl('إنذارات مبكرة','Early Warnings'),  value: dashboard?.earlyWarnings ?? 0,       color: 'text-orange-600' },
    { label: lbl('تم الحل','Resolved'),              value: dashboard?.resolvedRisks ?? 0,       color: 'text-green-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <ShieldAlert size={20} className="text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{lbl('إدارة المخاطر','Risk Management')}</h1>
            <p className="text-sm text-gray-500">{lbl('PMI/RMP — مصفوفة الاحتمالية × التأثير','PMI/RMP — Probability × Impact Matrix')}</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
          <Plus size={16} /> {lbl('مخاطرة جديدة','New Risk')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: 'list',     label: lbl('القائمة','List'),        icon: BarChart2 },
          { key: 'matrix',   label: lbl('المصفوفة','Matrix'),     icon: TrendingUp },
          { key: 'warnings', label: lbl('الإنذارات','Warnings'),  icon: AlertTriangle },
        ].map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-800'
            }`}>
            <Icon size={15} /> {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === 'matrix' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <h2 className="font-semibold mb-4">{lbl('مصفوفة المخاطر 5×5','Risk Matrix 5×5')}</h2>
          <RiskMatrix matrix={matrix} />
          <div className="flex gap-4 mt-4 text-xs">
            {[
              { color: 'bg-green-200', label: lbl('منخفض','Low') },
              { color: 'bg-yellow-200', label: lbl('متوسط','Medium') },
              { color: 'bg-orange-300', label: lbl('مرتفع','High') },
              { color: 'bg-red-400', label: lbl('حرج','Critical') },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded ${color}`} />
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'warnings' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-red-50 flex items-center gap-2">
            <AlertTriangle size={16} className="text-red-600" />
            <span className="font-semibold text-red-700">{lbl('الإنذارات المبكرة — درجة ≥ 75','Early Warnings — Score ≥ 75')}</span>
          </div>
          {warnings.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400" />
              {lbl('لا توجد مخاطر تستدعي إنذاراً مبكراً','No early warning risks')}
            </div>
          ) : (
            <div className="divide-y">
              {warnings.map(r => (
                <div key={r.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-gray-900">{r.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.category} • {r.owner ?? '—'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${scoreColor(r.riskScore)}`}>
                    {r.riskScore?.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-gray-400">{lbl('جاري التحميل...','Loading...')}</div>
          ) : risks.length === 0 ? (
            <div className="p-10 text-center text-gray-400">
              <ShieldAlert size={32} className="mx-auto mb-2 text-gray-300" />
              {lbl('لا توجد مخاطر مسجلة','No risks registered')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase">
                    <th className="px-4 py-3 text-start">{lbl('العنوان','Title')}</th>
                    <th className="px-4 py-3 text-start">{lbl('التصنيف','Category')}</th>
                    <th className="px-4 py-3 text-start">{lbl('الدرجة','Score')}</th>
                    <th className="px-4 py-3 text-start">{lbl('الحالة','Status')}</th>
                    <th className="px-4 py-3 text-start">{lbl('المسؤول','Owner')}</th>
                    <th className="px-4 py-3 text-start">{lbl('الإجراءات','Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {risks.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{r.title}</div>
                        {r.isEarlyWarning && (
                          <span className="text-xs text-red-500 flex items-center gap-1 mt-0.5">
                            <Zap size={10} /> {lbl('إنذار مبكر','Early Warning')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.category}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${scoreColor(r.riskScore)}`}>
                          {r.riskScore?.toFixed(0)} / 100
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{r.owner ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setEditRisk(r)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-500">
                            <Eye size={14} />
                          </button>
                          <button
                            disabled={assessingId === r.id}
                            onClick={() => { setAssessingId(r.id); assessMut.mutate(r.id); }}
                            className="p-1.5 hover:bg-purple-50 rounded-lg transition text-purple-500 disabled:opacity-40">
                            <Brain size={14} />
                          </button>
                          <button onClick={() => setDecisionId(r.id)}
                            className="p-1.5 hover:bg-blue-50 rounded-lg transition text-blue-500">
                            <TrendingUp size={14} />
                          </button>
                          <button onClick={() => {
                            if (confirm(lbl('حذف المخاطرة؟','Delete this risk?')))
                              deleteMut.mutate(r.id);
                          }} className="p-1.5 hover:bg-red-50 rounded-lg transition text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {(showCreate || editRisk) && (
        <RiskModal
          risk={editRisk}
          onClose={() => { setShowCreate(false); setEditRisk(null); }}
        />
      )}
      {decisionId && (
        <DecisionModal riskId={decisionId} onClose={() => setDecisionId(null)} />
      )}
    </div>
  );
}
