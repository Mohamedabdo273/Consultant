import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, X, FileCheck } from 'lucide-react';
import { boqApi } from '../../api/index';
import { Spinner } from '../../components/common/index';
import { useLang } from '../../context/LangContext';

const TYPE_COLORS = {
  Owner:      'bg-blue-100 text-blue-700',
  Contractor: 'bg-purple-100 text-purple-700',
};
const STATUS_COLORS = {
  Draft:     'bg-gray-100 text-gray-600',
  Submitted: 'bg-yellow-100 text-yellow-700',
  Approved:  'bg-green-100 text-green-700',
  Rejected:  'bg-red-100 text-red-600',
};

function CertModal({ editing, onClose }) {
  const qc = useQueryClient();
  const { t, lang } = useLang();
  const [selectedBoqId, setSelectedBoqId] = useState(editing?.boqId ?? '');
  const [executedQtys, setExecutedQtys] = useState(() => {
    if (editing?.items) return Object.fromEntries(editing.items.map(i => [i.boqItemId, i.executedQty]));
    return {};
  });

  const { register, handleSubmit, setValue } = useForm({
    defaultValues: editing ? {
      certNumber: editing.certNumber, title: editing.title,
      boqId: editing.boqId, projectId: editing.projectId ?? '',
      type: editing.type ?? 'Contractor',
      certDate: editing.certDate?.slice(0, 10),
      periodNumber: editing.periodNumber ?? 1,
      currency: editing.currency ?? 'EGP',
      notes: editing.notes ?? '', status: editing.status ?? 'Draft',
    } : {
      certNumber: '', title: '', boqId: '', projectId: '',
      type: 'Contractor', certDate: new Date().toISOString().slice(0, 10),
      periodNumber: 1, currency: 'EGP', notes: '', status: 'Draft',
    }
  });

  const { data: boqsData } = useQuery({
    queryKey: ['boq'],
    queryFn: () => boqApi.getAll().then(r => { const raw = r.data?.data ?? r.data; return Array.isArray(raw) ? raw : raw?.items ?? []; }),
    staleTime: 60_000,
  });
  const boqs = Array.isArray(boqsData) ? boqsData : [];

  const { data: boqDetail, isLoading: loadingBoq } = useQuery({
    queryKey: ['boq-detail', selectedBoqId],
    queryFn: () => boqApi.getById(selectedBoqId).then(r => r.data?.data ?? r.data),
    enabled: !!selectedBoqId,
    staleTime: 60_000,
  });
  const boqItems = boqDetail?.items ?? [];

  const grandTotal = boqItems.reduce((sum, item) =>
    sum + (parseFloat(executedQtys[item.id] || 0) * item.unitPrice), 0);

  const createM = useMutation({
    mutationFn: (d) => boqApi.createCert(d),
    onSuccess: () => { toast.success(lang === 'ar' ? 'تم إنشاء المستخلص' : 'Certificate created'); qc.invalidateQueries(['certificates']); onClose(); },
    onError: (e) => toast.error(e?.response?.data?.errors?.[0] ?? e?.response?.data?.message ?? 'Error'),
  });
  const updateM = useMutation({
    mutationFn: (d) => boqApi.updateCert(editing.id, d),
    onSuccess: () => { toast.success(lang === 'ar' ? 'تم التحديث' : 'Updated'); qc.invalidateQueries(['certificates']); onClose(); },
    onError: (e) => toast.error(e?.response?.data?.errors?.[0] ?? e?.response?.data?.message ?? 'Error'),
  });

  const onSubmit = (data) => {
    const items = boqItems
      .filter(item => parseFloat(executedQtys[item.id] || 0) > 0)
      .map(item => ({ boqItemId: item.id, executedQty: parseFloat(executedQtys[item.id]) }));

    if (items.length === 0) {
      toast.error(lang === 'ar' ? 'أدخل كمية منفذة لبند واحد على الأقل' : 'Enter executed qty for at least one item');
      return;
    }
    const payload = { ...data, boqId: selectedBoqId, projectId: data.projectId || null, items };
    if (editing) updateM.mutate(payload);
    else createM.mutate(payload);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-4xl my-4 shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800 text-lg">
            {editing ? (lang === 'ar' ? 'تعديل المستخلص' : 'Edit Certificate') : t('certNew')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">{t('certNumber')} *</label>
                <input className="input" placeholder="CERT-2024-001" {...register('certNumber', { required: true })} />
              </div>
              <div className="col-span-2">
                <label className="label">{t('certTitle')} *</label>
                <input className="input" {...register('title', { required: true })} />
              </div>
              <div>
                <label className="label">{t('certDate')} *</label>
                <input type="date" className="input" {...register('certDate', { required: true })} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="label">{t('certBoq')} *</label>
                <select className="input" value={selectedBoqId}
                  onChange={e => { setSelectedBoqId(e.target.value); setValue('boqId', e.target.value); setExecutedQtys({}); }} required>
                  <option value="">— {lang === 'ar' ? 'اختر الحصر' : 'Select BOQ'} —</option>
                  {boqs.map(b => <option key={b.id} value={b.id}>{b.boqNumber} — {b.title}</option>)}
                </select>
              </div>
              <div>
                <label className="label">{t('certType')}</label>
                <select className="input" {...register('type')}>
                  <option value="Contractor">{t('certContractor')}</option>
                  <option value="Owner">{t('certOwner')}</option>
                </select>
              </div>
              <div>
                <label className="label">{t('certPeriod')}</label>
                <input type="number" min="1" className="input" {...register('periodNumber', { min: 1 })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">{t('currency')}</label>
                <select className="input" {...register('currency')}>
                  <option value="EGP">{lang === 'ar' ? 'جنيه مصري' : 'Egyptian Pound'}</option>
                  <option value="USD">{lang === 'ar' ? 'دولار أمريكي' : 'US Dollar'}</option>
                  <option value="SAR">{lang === 'ar' ? 'ريال سعودي' : 'Saudi Riyal'}</option>
                </select>
              </div>
              {editing && (
                <div>
                  <label className="label">{t('status')}</label>
                  <select className="input" {...register('status')}>
                    <option value="Draft">{lang === 'ar' ? 'مسودة' : 'Draft'}</option>
                    <option value="Submitted">{lang === 'ar' ? 'مقدم' : 'Submitted'}</option>
                    <option value="Approved">{lang === 'ar' ? 'معتمد' : 'Approved'}</option>
                    <option value="Rejected">{lang === 'ar' ? 'مرفوض' : 'Rejected'}</option>
                  </select>
                </div>
              )}
              <div className="col-span-full">
                <label className="label">{t('notes')}</label>
                <textarea className="input" rows={2} {...register('notes')} />
              </div>
            </div>

            {!selectedBoqId && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700 text-center">
                {lang === 'ar' ? 'اختر الحصر أولاً لتظهر البنود' : 'Select a BOQ first to see its items'}
              </div>
            )}

            {selectedBoqId && (
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">
                  {lang === 'ar' ? 'الكميات المنفذة' : 'Executed Quantities'}
                  <span className="text-xs text-gray-400 font-normal ms-2">
                    ({lang === 'ar' ? 'أدخل الكمية المنفذة لكل بند' : 'Enter executed qty per item'})
                  </span>
                </h3>
                {loadingBoq ? <div className="flex justify-center py-6"><Spinner /></div> : (
                  <div className="overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-xs text-gray-500">
                        <tr>
                          <th className="px-3 py-2 text-right">{t('itemCode')}</th>
                          <th className="px-3 py-2 text-right">{t('itemDesc')}</th>
                          <th className="px-3 py-2 text-right">{t('itemUnit')}</th>
                          <th className="px-3 py-2 text-right">{lang === 'ar' ? 'كمية الحصر' : 'BOQ Qty'}</th>
                          <th className="px-3 py-2 text-right">{t('itemUnitPrice')}</th>
                          <th className="px-3 py-2 text-right">{t('certExecutedQty')}</th>
                          <th className="px-3 py-2 text-right">{t('itemTotal')}</th>
                          <th className="px-3 py-2 text-right">{t('certCompletion')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {boqItems.map(item => {
                          const execQty  = parseFloat(executedQtys[item.id] || 0);
                          const rowTotal = execQty * item.unitPrice;
                          const pct      = item.quantity > 0 ? Math.round(execQty / item.quantity * 100) : 0;
                          return (
                            <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-3 py-2 font-mono text-xs text-blue-600">{item.itemCode}</td>
                              <td className="px-3 py-2 text-gray-700">{item.description}</td>
                              <td className="px-3 py-2 text-gray-500">{item.unit}</td>
                              <td className="px-3 py-2 text-gray-600">{item.quantity.toLocaleString()}</td>
                              <td className="px-3 py-2 text-gray-600">{item.unitPrice.toLocaleString()}</td>
                              <td className="px-3 py-2">
                                <input type="number" step="0.01" min="0"
                                  className="input text-xs py-1 w-24" placeholder="0"
                                  value={executedQtys[item.id] ?? ''}
                                  onChange={e => setExecutedQtys(prev => ({ ...prev, [item.id]: e.target.value }))}
                                />
                              </td>
                              <td className="px-3 py-2 font-medium text-gray-700">
                                {rowTotal > 0 ? rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '—'}
                              </td>
                              <td className="px-3 py-2">
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  pct >= 100 ? 'bg-green-100 text-green-700' :
                                  pct > 0    ? 'bg-blue-100 text-blue-700'  : 'bg-gray-100 text-gray-500'
                                }`}>{pct}%</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-purple-50">
                        <tr>
                          <td colSpan={6} className="px-3 py-2 font-bold text-gray-700">{t('boqGrandTotal')}</td>
                          <td className="px-3 py-2 font-bold text-purple-700">
                            {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 p-5 border-t">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('cancel')}</button>
            <button type="submit" disabled={createM.isPending || updateM.isPending || !selectedBoqId}
              className="bg-purple-600 text-white px-6 py-2 rounded-xl hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 flex-1 justify-center">
              {(createM.isPending || updateM.isPending) ? <Spinner size="sm" /> : (editing ? t('save') : t('create'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function CertificatesPage() {
  const qc = useQueryClient();
  const { t, lang } = useLang();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]    = useState(null);
  const [filterBoqId, setFilterBoqId] = useState('');

  const TYPE_LABELS   = { Owner: t('certOwner'), Contractor: t('certContractor') };
  const STATUS_LABELS = {
    Draft: lang === 'ar' ? 'مسودة' : 'Draft', Submitted: lang === 'ar' ? 'مقدم' : 'Submitted',
    Approved: lang === 'ar' ? 'معتمد' : 'Approved', Rejected: lang === 'ar' ? 'مرفوض' : 'Rejected',
  };

  const { data: boqsData } = useQuery({
    queryKey: ['boq'],
    queryFn: () => boqApi.getAll().then(r => { const raw = r.data?.data ?? r.data; return Array.isArray(raw) ? raw : raw?.items ?? []; }),
    staleTime: 60_000,
  });
  const boqs = Array.isArray(boqsData) ? boqsData : [];

  const { data, isLoading } = useQuery({
    queryKey: ['certificates', filterBoqId],
    queryFn: () => boqApi.getCerts(filterBoqId ? { boqId: filterBoqId } : {}).then(r => {
      const raw = r.data?.data ?? r.data;
      return Array.isArray(raw) ? raw : raw?.items ?? [];
    }),
    staleTime: 60_000,
  });
  const certs = Array.isArray(data) ? data : [];

  const deleteM = useMutation({
    mutationFn: (id) => boqApi.deleteCert(id),
    onSuccess: () => { toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted'); qc.invalidateQueries(['certificates']); },
    onError: () => toast.error(lang === 'ar' ? 'فشل الحذف' : 'Delete failed'),
  });

  const handleEdit = async (id) => {
    const r = await boqApi.getCertById(id);
    setEditing(r.data?.data ?? r.data);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('certificates')}</h1>
          <p className="text-gray-500 text-sm">{lang === 'ar' ? 'مستخلصات المالك والمقاول' : 'Owner & Contractor Certificates'}</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="input text-sm py-2" value={filterBoqId} onChange={e => setFilterBoqId(e.target.value)}>
            <option value="">{lang === 'ar' ? 'كل الحصور' : 'All BOQs'}</option>
            {boqs.map(b => <option key={b.id} value={b.id}>{b.boqNumber}</option>)}
          </select>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700">
            <Plus size={16} /> {t('certNew')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : certs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileCheck size={48} className="mx-auto mb-3 opacity-30" />
            <p>{t('certEmpty')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              <tr>
                <th className="px-5 py-3 text-right">{t('certNumber')}</th>
                <th className="px-5 py-3 text-right">{t('certTitle')}</th>
                <th className="px-5 py-3 text-right">{t('certBoq')}</th>
                <th className="px-5 py-3 text-center">{t('certType')}</th>
                <th className="px-5 py-3 text-center">{t('certPeriod')}</th>
                <th className="px-5 py-3 text-right">{t('certDate')}</th>
                <th className="px-5 py-3 text-right">{t('total')}</th>
                <th className="px-5 py-3 text-center">{t('status')}</th>
                <th className="px-5 py-3 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {certs.map(cert => (
                <tr key={cert.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">{cert.certNumber}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800">{cert.title}</td>
                  <td className="px-5 py-3 text-gray-500 text-xs">
                    {cert.boqNumber}
                    {cert.projectName && <span className="block text-gray-400">{cert.projectName}</span>}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[cert.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[cert.type] ?? cert.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center text-gray-600">#{cert.periodNumber}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(cert.certDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}
                  </td>
                  <td className="px-5 py-3 font-semibold text-purple-700">
                    {Number(cert.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[cert.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[cert.status] ?? cert.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(cert.id)} className="action-btn-icon hover:text-purple-600">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => { if (confirm(lang === 'ar' ? 'حذف المستخلص؟' : 'Delete?')) deleteM.mutate(cert.id); }}
                        className="action-btn-icon hover:text-red-500">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <CertModal editing={editing} onClose={() => { setShowModal(false); setEditing(null); }} />}
    </div>
  );
}
