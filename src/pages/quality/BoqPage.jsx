import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Trash2, Edit2, Eye, X, FileSpreadsheet, FolderOpen } from 'lucide-react';
import { boqApi, projectsApi } from '../../api/index';
import { Spinner } from '../../components/common/index';
import { useLang } from '../../context/LangContext';
import { Link } from 'react-router-dom';

const STATUS_COLORS = {
  Draft:    'bg-gray-100 text-gray-600',
  Approved: 'bg-green-100 text-green-700',
  Closed:   'bg-red-100 text-red-600',
};

// ── Item Row ──────────────────────────────────────────────────────────────────
function ItemRow({ index, register, remove, watch, t }) {
  const qty   = parseFloat(watch(`items.${index}.quantity`)  || 0);
  const price = parseFloat(watch(`items.${index}.unitPrice`) || 0);
  const total = (qty * price).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-2 py-1.5 text-center text-xs text-gray-400">{index + 1}</td>
      <td className="px-2 py-1.5">
        <input className="input text-xs py-1" placeholder="C-001" {...register(`items.${index}.itemCode`, { required: true })} />
      </td>
      <td className="px-2 py-1.5">
        <input className="input text-xs py-1" placeholder={t('itemDesc')} {...register(`items.${index}.description`, { required: true })} />
      </td>
      <td className="px-2 py-1.5">
        <input className="input text-xs py-1 w-16" placeholder="م³" {...register(`items.${index}.unit`, { required: true })} />
      </td>
      <td className="px-2 py-1.5">
        <input type="number" step="0.01" className="input text-xs py-1 w-20" placeholder="0" {...register(`items.${index}.quantity`, { required: true, min: 0.0001 })} />
      </td>
      <td className="px-2 py-1.5">
        <input type="number" step="0.01" className="input text-xs py-1 w-24" placeholder="0.00" {...register(`items.${index}.unitPrice`, { required: true, min: 0 })} />
      </td>
      <td className="px-2 py-1.5 text-sm font-medium text-gray-700">{total}</td>
      <td className="px-2 py-1.5 text-center">
        <button type="button" onClick={() => remove(index)} className="text-red-400 hover:text-red-600">
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

// ── BOQ Modal ─────────────────────────────────────────────────────────────────
function BoqModal({ editing, onClose }) {
  const qc = useQueryClient();
  const { t, lang } = useLang();
  const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
    defaultValues: editing ? {
      boqNumber:   editing.boqNumber,
      title:       editing.title,
      description: editing.description ?? '',
      projectId:   editing.projectId ?? '',
      boqDate:     editing.boqDate?.slice(0, 10),
      currency:    editing.currency ?? 'EGP',
      status:      editing.status ?? 'Draft',
      items:       editing.items?.map(i => ({
        itemCode: i.itemCode, description: i.description, unit: i.unit,
        quantity: i.quantity, unitPrice: i.unitPrice, sortOrder: i.sortOrder,
      })) ?? [],
    } : {
      boqNumber: '', title: '', description: '', projectId: '',
      boqDate: new Date().toISOString().slice(0, 10),
      currency: 'EGP', status: 'Draft',
      items: [{ itemCode: '', description: '', unit: '', quantity: '', unitPrice: '', sortOrder: 0 }],
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');
  const grandTotal = (watchItems || []).reduce((sum, item) =>
    sum + (parseFloat(item.quantity || 0) * parseFloat(item.unitPrice || 0)), 0);

  const { data: projectsData } = useQuery({
    queryKey: ['projects-dropdown'],
    queryFn: () => projectsApi.getAll({ pageSize: 200 }).then(r => {
      const raw = r.data?.data ?? r.data;
      return Array.isArray(raw) ? raw : raw?.items ?? raw?.data ?? [];
    }),
    staleTime: 120_000,
  });
  const projects = Array.isArray(projectsData) ? projectsData : [];

  const createM = useMutation({
    mutationFn: (d) => boqApi.create(d),
    onSuccess: () => { toast.success(lang === 'ar' ? 'تم إنشاء الحصر' : 'BOQ created'); qc.invalidateQueries(['boq']); onClose(); },
    onError: (e) => toast.error(e?.response?.data?.message ?? 'Error'),
  });
  const updateM = useMutation({
    mutationFn: (d) => boqApi.update(editing.id, d),
    onSuccess: () => { toast.success(lang === 'ar' ? 'تم التحديث' : 'Updated'); qc.invalidateQueries(['boq']); onClose(); },
    onError: (e) => toast.error(e?.response?.data?.message ?? 'Error'),
  });

  const onSubmit = (data) => {
    const payload = {
      ...data,
      projectId: data.projectId || null,
      items: data.items.map((item, idx) => ({ ...item, sortOrder: idx })),
    };
    if (editing) updateM.mutate(payload);
    else createM.mutate(payload);
  };

  const isPending = createM.isPending || updateM.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-5xl my-4 shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800 text-lg">
            {editing ? t('boqEditTitle') : t('boqCreateTitle')}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">{t('boqNumber')} *</label>
                <input className="input" placeholder="BOQ-2024-001" {...register('boqNumber', { required: true })} />
              </div>
              <div className="col-span-2">
                <label className="label">{t('boqTitle')} *</label>
                <input className="input" {...register('title', { required: true })} />
              </div>
              <div>
                <label className="label">{t('boqDate')} *</label>
                <input type="date" className="input" {...register('boqDate', { required: true })} />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="label">{t('project')}</label>
                <select className="input" {...register('projectId')}>
                  <option value="">— {t('noProject')} —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
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
                    <option value="Draft">{t('boqStatusDraft')}</option>
                    <option value="Approved">{t('boqStatusApproved')}</option>
                    <option value="Closed">{t('boqStatusClosed')}</option>
                  </select>
                </div>
              )}
              <div className="col-span-full">
                <label className="label">{t('notes')}</label>
                <textarea className="input" rows={2} {...register('description')} />
              </div>
            </div>

            {/* جدول البنود */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">{t('boqItems')}</h3>
                <button
                  type="button"
                  onClick={() => append({ itemCode: '', description: '', unit: '', quantity: '', unitPrice: '', sortOrder: 0 })}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                >
                  <Plus size={14} /> {t('boqAddItem')}
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="px-2 py-2 w-8">#</th>
                      <th className="px-2 py-2 text-right">{t('itemCode')}</th>
                      <th className="px-2 py-2 text-right">{t('itemDesc')}</th>
                      <th className="px-2 py-2 text-right">{t('itemUnit')}</th>
                      <th className="px-2 py-2 text-right">{t('itemQty')}</th>
                      <th className="px-2 py-2 text-right">{t('itemUnitPrice')}</th>
                      <th className="px-2 py-2 text-right">{t('itemTotal')}</th>
                      <th className="px-2 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <ItemRow key={field.id} index={index} register={register} remove={remove} watch={watch} t={t} />
                    ))}
                  </tbody>
                  <tfoot className="bg-blue-50">
                    <tr>
                      <td colSpan={6} className="px-3 py-2 text-sm font-bold text-gray-700">{t('boqGrandTotal')}</td>
                      <td className="px-2 py-2 font-bold text-blue-700">
                        {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {fields.length === 0 && (
                <p className="text-center text-sm text-gray-400 py-4">
                  {lang === 'ar' ? 'لا توجد بنود — اضغط "إضافة بند"' : 'No items — click "Add Item"'}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3 p-5 border-t">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{t('cancel')}</button>
            <button type="submit" disabled={isPending || fields.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 flex-1 justify-center">
              {isPending ? <Spinner size="sm" /> : (editing ? t('save') : t('create'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BoqPage() {
  const qc = useQueryClient();
  const { t, lang } = useLang();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]    = useState(null);

  const STATUS_LABELS = {
    Draft:    t('boqStatusDraft'),
    Approved: t('boqStatusApproved'),
    Closed:   t('boqStatusClosed'),
  };

  const { data, isLoading } = useQuery({
    queryKey: ['boq'],
    queryFn: () => boqApi.getAll().then(r => {
      const raw = r.data?.data ?? r.data;
      return Array.isArray(raw) ? raw : raw?.items ?? [];
    }),
    staleTime: 60_000,
  });
  const boqs = Array.isArray(data) ? data : [];

  const deleteM = useMutation({
    mutationFn: (id) => boqApi.delete(id),
    onSuccess: () => { toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted'); qc.invalidateQueries(['boq']); },
    onError: () => toast.error(lang === 'ar' ? 'فشل الحذف' : 'Delete failed'),
  });

  const handleEdit = async (id) => {
    const r = await boqApi.getById(id);
    setEditing(r.data?.data ?? r.data);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('boqPage')}</h1>
          <p className="text-gray-500 text-sm">{t('boqSubtitle')}</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
        >
          <Plus size={16} /> {t('boqNew')}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : boqs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileSpreadsheet size={48} className="mx-auto mb-3 opacity-30" />
            <p>{t('boqEmpty')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500">
              <tr>
                <th className="px-5 py-3 text-right">{t('boqNumber')}</th>
                <th className="px-5 py-3 text-right">{t('boqTitle')}</th>
                <th className="px-5 py-3 text-right">{t('project')}</th>
                <th className="px-5 py-3 text-right">{t('boqDate')}</th>
                <th className="px-5 py-3 text-center">{t('boqItemsCount')}</th>
                <th className="px-5 py-3 text-right">{t('total')}</th>
                <th className="px-5 py-3 text-center">{t('status')}</th>
                <th className="px-5 py-3 text-center">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {boqs.map(boq => (
                <tr key={boq.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">{boq.boqNumber}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800">{boq.title}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {boq.projectName
                      ? <span className="flex items-center gap-1"><FolderOpen size={13} />{boq.projectName}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(boq.boqDate).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">{boq.itemsCount}</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-blue-700">
                    {Number(boq.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[boq.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABELS[boq.status] ?? boq.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <Link to={`/quality/boq/${boq.id}`} className="action-btn-icon hover:text-blue-600" title={t('view')}>
                        <Eye size={15} />
                      </Link>
                      <button onClick={() => handleEdit(boq.id)} className="action-btn-icon hover:text-blue-600" title={t('edit')}>
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => { if (confirm(lang === 'ar' ? 'حذف الحصر؟' : 'Delete BOQ?')) deleteM.mutate(boq.id); }}
                        className="action-btn-icon hover:text-red-500" title={t('delete')}>
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

      {showModal && <BoqModal editing={editing} onClose={() => { setShowModal(false); setEditing(null); }} />}
    </div>
  );
}
