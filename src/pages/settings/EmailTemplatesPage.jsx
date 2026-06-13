import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Mail, Edit2, Trash2, Star, Eye, X, Code, Send, Users, User } from 'lucide-react';
import { emailTemplatesApi, usersApi } from '../../api/index';
import { Spinner } from '../../components/common/index';
import { useAuth } from '../../context/AuthContext';

const TYPES = [
  { value: 0, label: 'ترحيب' },
  { value: 1, label: 'فاتورة' },
  { value: 2, label: 'عقد' },
  { value: 3, label: 'تقرير' },
  { value: 4, label: 'عام' },
];

const TYPE_LABELS = { Welcome: 'ترحيب', Invoice: 'فاتورة', Contract: 'عقد', Report: 'تقرير', Generic: 'عام' };
const TYPE_COLORS = { Welcome: 'bg-green-100 text-green-700', Invoice: 'bg-purple-100 text-purple-700', Contract: 'bg-blue-100 text-blue-700', Report: 'bg-orange-100 text-orange-700', Generic: 'bg-gray-100 text-gray-600' };

// ── Send Modal ────────────────────────────────────────────────────────────────
function SendModal({ template, onClose }) {
  const [sendToAll, setSendToAll] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const { user: authUser } = useAuth();
  const isSuperAdmin = authUser?.role === 'SuperAdmin';

  const { data: usersData } = useQuery({
    queryKey: ['users-for-send', isSuperAdmin ? 'all' : template.companyId],
    queryFn: async () => {
      // SuperAdmin يجيب كل المستخدمين بدون فلتر
      // Admin يجيب مستخدمي شركته تلقائياً من الـ token
      const r = await usersApi.getAll({ pageSize: 500 });
      const raw = r.data?.data ?? r.data;
      if (Array.isArray(raw)) return raw;
      if (Array.isArray(raw?.items)) return raw.items;
      if (Array.isArray(raw?.data)) return raw.data;
      return [];
    },
    staleTime: 60_000,
  });
  const users = Array.isArray(usersData) ? usersData : [];

  const sendM = useMutation({
    mutationFn: () => emailTemplatesApi.send(template.id, {
      sendToAll,
      userId: sendToAll ? null : (selectedUserId || null),
    }),
    onSuccess: (res) => {
      const d = res.data?.data;
      toast.success(d?.message ?? 'تم الإرسال');
      onClose();
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? 'فشل الإرسال'),
  });

  const canSend = sendToAll || !!selectedUserId;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h3 className="font-bold text-gray-800">إرسال القالب</h3>
            <p className="text-sm text-gray-500 mt-0.5">{template.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* معاينة الموضوع */}
          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <span className="text-gray-500">الموضوع: </span>
            <span className="font-medium text-gray-800">{template.subject}</span>
          </div>

          {/* اختيار المستقبلين */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">إرسال إلى:</p>

            {/* إرسال للكل */}
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${sendToAll ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                checked={sendToAll}
                onChange={() => { setSendToAll(true); setSelectedUserId(''); }}
                className="text-blue-600"
              />
              <Users size={18} className="text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-800">كل المستخدمين</p>
                <p className="text-xs text-gray-500">إرسال لجميع مستخدمي الشركة ({users.length})</p>
              </div>
            </label>

            {/* إرسال لمستخدم محدد */}
            <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${!sendToAll ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
              <input
                type="radio"
                checked={!sendToAll}
                onChange={() => setSendToAll(false)}
                className="text-blue-600"
              />
              <User size={18} className="text-green-500" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">مستخدم محدد</p>
                {!sendToAll && (
                  <select
                    className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    onClick={e => e.stopPropagation()}
                  >
                    <option value="">اختر مستخدم...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName ?? u.name} — {u.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </label>
          </div>

          {/* المتغيرات المتاحة */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
            <p className="text-xs font-medium text-yellow-800 mb-1">المتغيرات التي سيتم استبدالها تلقائياً:</p>
            <div className="flex flex-wrap gap-1">
              {['{{name}}', '{{email}}', '{{date}}'].map(v => (
                <span key={v} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-mono">{v}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
            إلغاء
          </button>
          <button
            onClick={() => sendM.mutate()}
            disabled={!canSend || sendM.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50"
          >
            {sendM.isPending ? <Spinner size="sm" /> : <Send size={15} />}
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EmailTemplatesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null);
  const [preview, setPreview]   = useState(null);
  const [sending, setSending]   = useState(null);
  const [htmlMode, setHtmlMode] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: { type: 4, isDefault: false }
  });

  const bodyHtml = watch('bodyHtml', '');

  const { data, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: () => emailTemplatesApi.getAll().then(r => r.data?.data ?? r.data),
    staleTime: 60_000,
  });
  const templates = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];

  const createM = useMutation({
    mutationFn: (d) => emailTemplatesApi.create({ ...d, type: Number(d.type) }),
    onSuccess: () => { toast.success('تم إنشاء القالب'); qc.invalidateQueries(['email-templates']); cancelForm(); },
    onError:   (e) => toast.error(e?.response?.data?.message ?? 'حدث خطأ'),
  });
  const updateM = useMutation({
    mutationFn: ({ id, data }) => emailTemplatesApi.update(id, { ...data, type: Number(data.type) }),
    onSuccess: () => { toast.success('تم التحديث'); qc.invalidateQueries(['email-templates']); cancelForm(); },
    onError:   (e) => toast.error(e?.response?.data?.message ?? 'حدث خطأ'),
  });
  const deleteM = useMutation({
    mutationFn: (id) => emailTemplatesApi.delete(id),
    onSuccess: () => { toast.success('تم الحذف'); qc.invalidateQueries(['email-templates']); },
    onError:   (e) => toast.error(e?.response?.data?.message ?? 'حدث خطأ'),
  });

  const onSubmit = (data) => {
    if (editing) updateM.mutate({ id: editing.id, data });
    else createM.mutate(data);
  };

  const startEdit = (t) => {
    setEditing(t);
    setValue('name', t.name);
    setValue('subject', t.subject);
    setValue('bodyHtml', t.bodyHtml);
    setValue('type', TYPES.find(x => x.label === TYPE_LABELS[t.type])?.value ?? 4);
    setValue('isDefault', t.isDefault);
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditing(null); reset({ type: 4, isDefault: false }); };

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">قوالب الإيميل</h1>
          <p className="text-gray-500 text-sm">قوالب مخصصة لرسائل البريد الإلكتروني</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setEditing(null); reset({ type: 4, isDefault: false }); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
        >
          <Plus size={16} /> قالب جديد
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">{editing ? 'تعديل القالب' : 'قالب جديد'}</h2>
            <button onClick={cancelForm} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="label">اسم القالب *</label>
                <input
                  className={`input ${errors.name ? 'border-red-400' : ''}`}
                  placeholder="مثال: قالب الترحيب الرئيسي"
                  {...register('name', { required: 'مطلوب' })}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">النوع *</label>
                <select className="input" {...register('type', { required: true })}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded" {...register('isDefault')} />
                  <span className="text-sm text-gray-700">قالب افتراضي لهذا النوع</span>
                </label>
              </div>
            </div>
            <div>
              <label className="label">الموضوع *</label>
              <input
                className={`input ${errors.subject ? 'border-red-400' : ''}`}
                placeholder="موضوع الإيميل..."
                {...register('subject', { required: 'مطلوب' })}
              />
              {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">محتوى الإيميل (HTML)</label>
                <button
                  type="button"
                  onClick={() => setHtmlMode(m => !m)}
                  className="text-xs flex items-center gap-1 text-gray-500 hover:text-blue-600"
                >
                  <Code size={14} />
                  {htmlMode ? 'معاينة' : 'كود HTML'}
                </button>
              </div>
              {htmlMode ? (
                <textarea
                  className="input font-mono text-xs"
                  rows={10}
                  placeholder="<h1>مرحباً {{name}}</h1><p>...</p>"
                  {...register('bodyHtml')}
                />
              ) : (
                <div
                  className="border border-gray-200 rounded-xl p-4 min-h-[200px] bg-gray-50 text-sm"
                  dangerouslySetInnerHTML={{ __html: bodyHtml || '<p class="text-gray-400">اكتب HTML في وضع الكود للمعاينة هنا...</p>' }}
                />
              )}
              <p className="text-xs text-gray-400 mt-1">
                المتغيرات المتاحة: <span className="font-mono">{'{{name}}'}</span> <span className="font-mono">{'{{email}}'}</span> <span className="font-mono">{'{{date}}'}</span>
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createM.isPending || updateM.isPending}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {(createM.isPending || updateM.isPending) ? <Spinner size="sm" /> : (editing ? 'حفظ التعديلات' : 'إنشاء القالب')}
              </button>
              <button type="button" onClick={cancelForm} className="btn-secondary">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Mail size={48} className="mx-auto mb-3 opacity-30" />
          <p>لا توجد قوالب بعد</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {templates.map(t => (
            <div key={t.id} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                    <Mail size={18} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-gray-800 text-sm">{t.name}</h3>
                      {t.isDefault && <Star size={13} className="text-yellow-500 fill-yellow-400" />}
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[t.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[t.type] ?? t.type}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setPreview(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="معاينة">
                    <Eye size={15} />
                  </button>
                  <button onClick={() => startEdit(t)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="تعديل">
                    <Edit2 size={15} />
                  </button>
                  <button onClick={() => setSending(t)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600" title="إرسال">
                    <Send size={15} />
                  </button>
                  <button onClick={() => { if (confirm('حذف القالب؟')) deleteM.mutate(t.id); }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="حذف">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-1"><span className="text-gray-400">الموضوع:</span> {t.subject}</p>
              <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString('ar-EG')}</p>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-bold">{preview.name}</h3>
                <p className="text-sm text-gray-500">الموضوع: {preview.subject}</p>
              </div>
              <button onClick={() => setPreview(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6" dangerouslySetInnerHTML={{ __html: preview.bodyHtml }} />
          </div>
        </div>
      )}

      {/* Send Modal */}
      {sending && <SendModal template={sending} onClose={() => setSending(null)} />}
    </div>
  );
}
