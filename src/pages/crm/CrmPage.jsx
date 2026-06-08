import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  HeartHandshake, Users, Brain, Plus, Trash2, Phone,
  Mail, MessageSquare, FileText, AlertCircle, CheckCircle2, X,
  TrendingUp, Clock, DollarSign,
} from 'lucide-react';
import { crmApi } from '../../api/index';
import { useLang } from '../../context/LangContext';

// ── helpers ───────────────────────────────────────────────────────────────────
const INTERACTION_TYPES = ['Meeting','Call','Email','Proposal','Complaint','Feedback','Note'];
const SENTIMENTS        = ['Positive','Neutral','Negative'];

function healthColor(h) {
  return {
    Good:           'bg-green-100 text-green-700',
    NeedsAttention: 'bg-yellow-100 text-yellow-700',
    AtRisk:         'bg-red-100 text-red-700',
    New:            'bg-blue-100 text-blue-700',
  }[h] ?? 'bg-gray-100 text-gray-600';
}
function sentimentIcon(s) {
  if (s === 'Positive') return '😊';
  if (s === 'Negative') return '😟';
  return '😐';
}
function typeIcon(t) {
  const m = { Meeting: '🤝', Call: '📞', Email: '📧', Proposal: '📋', Complaint: '⚠️', Feedback: '💬', Note: '📝' };
  return m[t] ?? '📝';
}
function fmtAmount(n) {
  if (!n) return '0';
  return new Intl.NumberFormat('en', { notation: 'compact' }).format(n);
}

// ── Add Interaction Modal ─────────────────────────────────────────────────────
function AddInteractionModal({ clients, onClose }) {
  const { lang } = useLang();
  const qc = useQueryClient();
  const lbl = (ar, en) => lang === 'ar' ? ar : en;

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { type: 'Note', sentiment: 'Neutral', interactionDate: new Date().toISOString().slice(0,10) },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => crmApi.addInteraction(data),
    onSuccess: () => {
      toast.success(lbl('تم تسجيل التفاعل','Interaction recorded'));
      qc.invalidateQueries({ queryKey: ['crm-dashboard'] });
      qc.invalidateQueries({ queryKey: ['crm-interactions'] });
      onClose();
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? 'Error'),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">{lbl('تسجيل تفاعل','Log Interaction')}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(mutate)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{lbl('العميل','Client')} *</label>
            <select {...register('clientUserId', { required: true })} className="w-full border rounded-lg px-3 py-2 text-sm">
              <option value="">{lbl('اختر عميل','Select client')}</option>
              {clients.map(c => <option key={c.userId} value={c.userId}>{c.fullName}</option>)}
            </select>
            {errors.clientUserId && <p className="text-red-500 text-xs mt-1">{lbl('مطلوب','Required')}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{lbl('النوع','Type')}</label>
              <select {...register('type')} className="w-full border rounded-lg px-3 py-2 text-sm">
                {INTERACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{lbl('المشاعر','Sentiment')}</label>
              <select {...register('sentiment')} className="w-full border rounded-lg px-3 py-2 text-sm">
                {SENTIMENTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{lbl('الموضوع','Subject')} *</label>
            <input {...register('subject', { required: true })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{lbl('الملاحظات','Notes')}</label>
            <textarea {...register('notes')} rows={3}
              className="w-full border rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{lbl('التاريخ','Date')}</label>
              <input type="date" {...register('interactionDate')} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{lbl('تاريخ المتابعة','Follow-up')}</label>
              <input type="date" {...register('followUpDate')} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
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

// ── Client Profile Modal ──────────────────────────────────────────────────────
function ClientProfileModal({ clientId, onClose }) {
  const { lang } = useLang();
  const qc = useQueryClient();
  const lbl = (ar, en) => lang === 'ar' ? ar : en;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['crm-profile', clientId],
    queryFn: () => crmApi.getClientProfile(clientId).then(r => r.data?.data),
  });
  const { data: insight } = useQuery({
    queryKey: ['crm-insight', clientId],
    queryFn: () => crmApi.getClientInsight(clientId).then(r => r.data?.data),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => crmApi.deleteInteraction(id),
    onSuccess: () => {
      toast.success(lbl('تم الحذف','Deleted'));
      qc.invalidateQueries({ queryKey: ['crm-profile', clientId] });
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-lg">{lbl('ملف العميل','Client Profile')}</h2>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">{lbl('جاري التحميل...','Loading...')}</div>
        ) : profile ? (
          <div className="p-5 space-y-5">
            {/* Basic info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700">
                {profile.fullName?.[0]}
              </div>
              <div>
                <p className="font-bold text-lg">{profile.fullName}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${healthColor(profile.healthStatus)}`}>
                  {profile.healthStatus}
                </span>
              </div>
            </div>

            {/* Financial summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: lbl('الإجمالي','Total'), value: fmtAmount(profile.totalRevenue), color: 'text-blue-600' },
                { label: lbl('المدفوع','Paid'),   value: fmtAmount(profile.paidAmount),   color: 'text-green-600' },
                { label: lbl('المعلق','Pending'),  value: fmtAmount(profile.pendingAmount),color: 'text-orange-600' },
              ].map(s => (
                <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500">{s.label}</p>
                  <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* AI Insight */}
            {insight && (
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Brain size={16} className="text-purple-600" />
                  <p className="font-semibold text-purple-800">{lbl('رؤية SCG','SCG Insight')}</p>
                </div>
                <div className="space-y-2 text-sm text-gray-700">
                  {insight.relationshipHealth && <p><strong>{lbl('صحة العلاقة','Health')}:</strong> {insight.relationshipHealth}</p>}
                  {insight.nextBestAction && <p><strong>{lbl('أفضل خطوة','Next Action')}:</strong> {insight.nextBestAction}</p>}
                  {insight.growthPotential && <p><strong>{lbl('إمكانية النمو','Growth')}:</strong> {insight.growthPotential}</p>}
                </div>
              </div>
            )}

            {/* Interactions */}
            {profile.interactions?.length > 0 && (
              <div>
                <p className="font-semibold mb-2">{lbl('التفاعلات الأخيرة','Recent Interactions')}</p>
                <div className="space-y-2">
                  {profile.interactions.map(i => (
                    <div key={i.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span>{typeIcon(i.type)}</span>
                        <div>
                          <p className="text-sm font-medium">{i.subject}</p>
                          <p className="text-xs text-gray-500">{new Date(i.interactionDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{sentimentIcon(i.sentiment)}</span>
                        <button onClick={() => {
                          if (confirm(lbl('حذف التفاعل؟','Delete?'))) deleteMut.mutate(i.id);
                        }} className="p-1 hover:bg-red-50 rounded text-red-400">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-10 text-center text-gray-400">{lbl('لا توجد بيانات','No data')}</div>
        )}
      </div>
    </div>
  );
}

// ── AI Portfolio Insights ─────────────────────────────────────────────────────
function AiInsightsPanel({ onClose }) {
  const { lang } = useLang();
  const lbl = (ar, en) => lang === 'ar' ? ar : en;

  const { data, isLoading } = useQuery({
    queryKey: ['crm-ai-insights'],
    queryFn: () => crmApi.getAiInsights().then(r => r.data?.data),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-purple-600" />
            <h2 className="font-bold text-lg">{lbl('رؤى SCG — المحفظة الكاملة','SCG Portfolio Insights')}</h2>
          </div>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {isLoading ? (
            <div className="py-10 text-center text-gray-400">{lbl('جاري التحليل...','Analyzing...')}</div>
          ) : data ? (
            <>
              {data.executiveSummary && (
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="font-semibold mb-2 text-purple-800">{lbl('الملخص التنفيذي','Executive Summary')}</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{data.executiveSummary}</p>
                </div>
              )}
              {data.portfolioHealth && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="font-semibold mb-1">{lbl('صحة المحفظة','Portfolio Health')}</p>
                  <p className="text-sm">{data.portfolioHealth}</p>
                </div>
              )}
              {data.revenueOutlook && (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="font-semibold mb-1">{lbl('توقعات الإيرادات','Revenue Outlook')}</p>
                  <p className="text-sm">{data.revenueOutlook}</p>
                </div>
              )}
              {data.atRiskClients?.length > 0 && (
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="font-semibold mb-2 text-red-700">{lbl('عملاء في خطر','At-Risk Clients')}</p>
                  <ul className="space-y-1">{data.atRiskClients.map((c, i) => <li key={i} className="text-sm flex gap-2"><AlertCircle size={13} className="text-red-500 mt-0.5" />{c}</li>)}</ul>
                </div>
              )}
              {data.growthClients?.length > 0 && (
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="font-semibold mb-2 text-green-700">{lbl('فرص النمو','Growth Opportunities')}</p>
                  <ul className="space-y-1">{data.growthClients.map((c, i) => <li key={i} className="text-sm flex gap-2"><TrendingUp size={13} className="text-green-500 mt-0.5" />{c}</li>)}</ul>
                </div>
              )}
              {data.recommendations?.length > 0 && (
                <div className="bg-yellow-50 rounded-xl p-4">
                  <p className="font-semibold mb-2">{lbl('التوصيات','Recommendations')}</p>
                  <ul className="space-y-1.5">{data.recommendations.map((r, i) => <li key={i} className="text-sm flex gap-2"><CheckCircle2 size={13} className="text-yellow-600 mt-0.5" />{r}</li>)}</ul>
                </div>
              )}
            </>
          ) : (
            <p className="text-center text-gray-400">{lbl('لا توجد بيانات','No data')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CrmPage() {
  const { lang } = useLang();
  const lbl = (ar, en) => lang === 'ar' ? ar : en;

  const [showAdd, setShowAdd]         = useState(false);
  const [profileId, setProfileId]     = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  const { data: dashboard } = useQuery({
    queryKey: ['crm-dashboard'],
    queryFn: () => crmApi.getDashboard().then(r => r.data?.data),
  });
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['crm-clients'],
    queryFn: () => crmApi.getClients().then(r => r.data?.data ?? []),
  });

  const stats = [
    { label: lbl('إجمالي العملاء','Total Clients'), value: dashboard?.totalClients ?? clients.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: lbl('عملاء نشطون','Active'),            value: dashboard?.activeClients ?? 0,            icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: lbl('في خطر','At Risk'),                 value: dashboard?.atRiskClients ?? 0,            icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { label: lbl('متابعات اليوم','Follow-ups Today'), value: dashboard?.followUpsToday ?? 0,            icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
            <HeartHandshake size={20} className="text-pink-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{lbl('إدارة علاقات العملاء','Customer Relationship Management')}</h1>
            <p className="text-sm text-gray-500">{lbl('تتبع التفاعلات، صحة العلاقة، ورؤى SCG','Track interactions, relationship health & SCG insights')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowInsights(true)}
            className="flex items-center gap-2 border border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl text-sm font-medium transition">
            <Brain size={15} /> {lbl('رؤى AI','AI Insights')}
          </button>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition">
            <Plus size={15} /> {lbl('تسجيل تفاعل','Log Interaction')}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon size={18} className={s.color} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue */}
      {dashboard && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <DollarSign size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{lbl('إجمالي الإيرادات','Total Revenue')}</p>
              <p className="text-xl font-bold text-blue-600">{fmtAmount(dashboard.totalRevenue)}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
              <Clock size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">{lbl('المستحقات المعلقة','Pending Revenue')}</p>
              <p className="text-xl font-bold text-orange-600">{fmtAmount(dashboard.pendingRevenue)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">{lbl('قائمة العملاء','Client List')}</h2>
          <span className="text-sm text-gray-400">{clients.length} {lbl('عميل','clients')}</span>
        </div>
        {isLoading ? (
          <div className="p-10 text-center text-gray-400">{lbl('جاري التحميل...','Loading...')}</div>
        ) : clients.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            {lbl('لا يوجد عملاء بعد','No clients yet')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-500 text-xs uppercase">
                  <th className="px-4 py-3 text-start">{lbl('العميل','Client')}</th>
                  <th className="px-4 py-3 text-start">{lbl('المشاريع','Projects')}</th>
                  <th className="px-4 py-3 text-start">{lbl('الإيرادات','Revenue')}</th>
                  <th className="px-4 py-3 text-start">{lbl('المعلق','Pending')}</th>
                  <th className="px-4 py-3 text-start">{lbl('آخر تفاعل','Last Interaction')}</th>
                  <th className="px-4 py-3 text-start">{lbl('الحالة','Health')}</th>
                  <th className="px-4 py-3 text-start"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients.map(c => (
                  <tr key={c.userId} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-700">
                          {c.fullName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{c.fullName}</p>
                          <p className="text-xs text-gray-500">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.projectsCount}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{fmtAmount(c.totalRevenue)}</td>
                    <td className="px-4 py-3">
                      {c.pendingAmount > 0
                        ? <span className="text-orange-600 font-medium">{fmtAmount(c.pendingAmount)}</span>
                        : <span className="text-green-500">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {c.lastInteraction ? new Date(c.lastInteraction).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${healthColor(c.healthStatus)}`}>
                        {c.healthStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => setProfileId(c.userId)}
                        className="text-xs text-primary-600 hover:text-primary-800 font-medium">
                        {lbl('عرض','View')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddInteractionModal clients={clients} onClose={() => setShowAdd(false)} />
      )}
      {profileId && (
        <ClientProfileModal clientId={profileId} onClose={() => setProfileId(null)} />
      )}
      {showInsights && (
        <AiInsightsPanel onClose={() => setShowInsights(false)} />
      )}
    </div>
  );
}
