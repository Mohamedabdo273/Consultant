import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { Plus, Trash2, XCircle, ArrowUpFromLine, CheckCircle, PlayCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { warehouseApi } from '../../api/index';
import { Spinner } from '../../components/common/index';
import { useLang } from '../../context/LangContext';

const STATUS_STYLES = {
  Draft:     'bg-gray-100 text-gray-600',
  Approved:  'bg-blue-100 text-blue-700',
  Executed:  'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};
const STATUS_AR = { Draft: 'مسودة', Approved: 'معتمد', Executed: 'منفَّذ', Cancelled: 'ملغي' };

export default function DisbursementsPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const ar = lang === 'ar';
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['disbursements'],
    queryFn: () => warehouseApi.getDisbursements({ page: 1, pageSize: 50 }).then(r => r.data?.data ?? []),
  });

  const createMut = useMutation({
    mutationFn: (d) => warehouseApi.createDisbursement(d),
    onSuccess: () => { qc.invalidateQueries(['disbursements']); setOpen(false); toast.success(ar ? 'تم إنشاء إذن الصرف' : 'Disbursement created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const approveMut = useMutation({
    mutationFn: (id) => warehouseApi.approveDisbursement(id),
    onSuccess: () => { qc.invalidateQueries(['disbursements']); toast.success(ar ? 'تم الاعتماد' : 'Approved'); },
  });

  const executeMut = useMutation({
    mutationFn: (id) => warehouseApi.executeDisbursement(id),
    onSuccess: () => {
      qc.invalidateQueries(['disbursements']);
      qc.invalidateQueries(['warehouse-items']);
      qc.invalidateQueries(['warehouse-summary']);
      toast.success(ar ? 'تم تنفيذ الصرف وخصم الكميات من المستودع' : 'Disbursement executed & stock deducted');
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => warehouseApi.deleteDisbursement(id),
    onSuccess: () => { qc.invalidateQueries(['disbursements']); toast.success(ar ? 'تم الحذف' : 'Deleted'); },
  });

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ArrowUpFromLine size={24} className="text-primary-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{ar ? 'أذونات الصرف' : 'Disbursement Permits'}</h1>
            <p className="text-sm text-gray-500">{ar ? 'صرف مواد من المستودع' : 'Issue materials from warehouse'}</p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {ar ? 'إذن صرف جديد' : 'New Disbursement'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ArrowUpFromLine size={40} className="mx-auto mb-3 opacity-30" />
            <p>{ar ? 'لا توجد أذونات صرف بعد' : 'No disbursements yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right">{ar ? 'رقم الإذن' : 'Permit No.'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الغرض' : 'Purpose'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'المشروع' : 'Project'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'طالب الصرف' : 'Requested By'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'البنود' : 'Items'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'القيمة' : 'Value'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-center">{ar ? 'أكشن' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {list.map(d => (
                  <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(d)} className="font-mono text-xs text-blue-600 hover:underline">{d.permitNumber}</button>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(d.permitDate).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[140px] truncate">{d.purpose ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.projectName ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{d.requestedBy}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{d.itemsCount}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{fmt(d.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[d.status] ?? ''}`}>
                        {ar ? (STATUS_AR[d.status] ?? d.status) : d.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {d.status === 'Draft' && (
                          <button onClick={() => approveMut.mutate(d.id)} className="action-btn-blue"><CheckCircle size={13} />{ar ? 'اعتماد' : 'Approve'}</button>
                        )}
                        {d.status === 'Approved' && (
                          <button onClick={() => { if (confirm(ar ? 'تنفيذ الصرف وخصم الكميات؟' : 'Execute and deduct stock?')) executeMut.mutate(d.id); }} className="action-btn-success"><PlayCircle size={13} />{ar ? 'تنفيذ الصرف' : 'Execute'}</button>
                        )}
                        {d.status === 'Draft' && (
                          <button onClick={() => { if (confirm(ar ? 'حذف؟' : 'Delete?')) deleteMut.mutate(d.id); }} className="action-btn-icon text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && <DisbursementModal onClose={() => setOpen(false)} onSubmit={createMut.mutate} loading={createMut.isPending} lang={lang} />}
      {detail && <DisbursementDetail d={detail} onClose={() => setDetail(null)} lang={lang} />}
    </div>
  );
}

function DisbursementModal({ onClose, onSubmit, loading, lang }) {
  const ar = lang === 'ar';
  const { register, control, handleSubmit, watch } = useForm({
    defaultValues: {
      permitDate: new Date().toISOString().split('T')[0],
      purpose: '', notes: '',
      items: [{ warehouseItemId: '', requestedQty: 1, unitPrice: 0, notes: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchItems = watch('items');

  const { data: warehouseItems = [] } = useQuery({
    queryKey: ['warehouse-items-select'],
    queryFn: () => warehouseApi.getItems({}).then(r => (r.data?.data ?? []).filter(i => i.currentStock > 0)),
  });

  const grandTotal = watchItems?.reduce((s, i) => s + (Number(i.requestedQty) || 0) * (Number(i.unitPrice) || 0), 0) ?? 0;

  const onSave = (data) => {
    if (data.items.length === 0) { toast.error(ar ? 'أضف بند واحد على الأقل' : 'Add at least one item'); return; }
    onSubmit({
      ...data,
      permitDate: new Date(data.permitDate).toISOString(),
      items: data.items.map(i => ({ ...i, requestedQty: Number(i.requestedQty), unitPrice: Number(i.unitPrice) })),
    });
  };

  const getAvailableStock = (itemId) => warehouseItems.find(i => i.id === itemId)?.currentStock ?? 0;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="modal-header">
          <h2 className="font-bold text-gray-800">{ar ? 'إذن صرف جديد' : 'New Disbursement Permit'}</h2>
          <button onClick={onClose} className="modal-close-btn"><XCircle size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{ar ? 'تاريخ الصرف' : 'Disbursement Date'} *</label>
              <input type="date" {...register('permitDate', { required: true })} className="form-input" />
            </div>
            <div>
              <label className="form-label">{ar ? 'الغرض من الصرف' : 'Purpose'}</label>
              <input {...register('purpose')} className="form-input" placeholder={ar ? 'مثال: أعمال الطابق الثاني' : 'e.g. 2nd floor works'} />
            </div>
          </div>
          <div>
            <label className="form-label">{ar ? 'ملاحظات' : 'Notes'}</label>
            <textarea {...register('notes')} className="form-input" rows={2} />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">{ar ? 'الأصناف المطلوبة' : 'Items to Issue'}</label>
              <button type="button" onClick={() => append({ warehouseItemId: '', requestedQty: 1, unitPrice: 0, notes: '' })}
                className="add-item-btn">
                <Plus size={13} /> {ar ? 'إضافة صنف' : 'Add Item'}
              </button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الصنف' : 'Item'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'المتاح' : 'Available'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الكمية المطلوبة' : 'Qty'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الإجمالي' : 'Total'}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f, i) => {
                    const selectedId = watchItems?.[i]?.warehouseItemId;
                    const available = getAvailableStock(selectedId);
                    const rowTotal = (Number(watchItems?.[i]?.requestedQty) || 0) * (Number(watchItems?.[i]?.unitPrice) || 0);
                    return (
                      <tr key={f.id} className="border-t border-gray-100">
                        <td className="px-2 py-1.5">
                          <select {...register(`items.${i}.warehouseItemId`, { required: true })} className="table-input">
                            <option value="">{ar ? '— اختر —' : '— Select —'}</option>
                            {warehouseItems.map(wi => (
                              <option key={wi.id} value={wi.id}>{wi.itemCode} — {wi.description} ({wi.currentStock} {wi.unit})</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-1.5 font-bold text-green-700">{available.toLocaleString()}</td>
                        <td className="px-2 py-1.5">
                          <input type="number" step="any" max={available}
                            {...register(`items.${i}.requestedQty`, { required: true, min: 0.001, max: available || 99999 })}
                            className="table-input" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" step="any" {...register(`items.${i}.unitPrice`, { min: 0 })} className="table-input" />
                        </td>
                        <td className="px-3 py-1.5 font-mono">{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-2 py-1.5 text-center">
                          {fields.length > 1 && <button type="button" onClick={() => remove(i)} className="action-btn-icon text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-orange-50">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-gray-700 font-bold text-xs">{ar ? 'الإجمالي الكلي' : 'Grand Total'}</td>
                    <td className="px-3 py-2 text-orange-700 font-bold text-xs">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Spinner size="sm" /> : (ar ? 'إنشاء إذن الصرف' : 'Create Disbursement')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DisbursementDetail({ d, onClose, lang }) {
  const ar = lang === 'ar';
  const { data: detail, isLoading } = useQuery({
    queryKey: ['disbursement', d.id],
    queryFn: () => warehouseApi.getDisbursement(d.id).then(r => r.data?.data ?? r.data),
  });
  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="modal-header">
          <h2 className="font-bold text-gray-800">{ar ? 'تفاصيل إذن الصرف' : 'Disbursement Details'} — {d.permitNumber}</h2>
          <button onClick={onClose} className="modal-close-btn"><XCircle size={20} /></button>
        </div>
        {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">{ar ? 'التاريخ:' : 'Date:'}</span> <span className="font-medium">{detail?.permitDate ? new Date(detail.permitDate).toLocaleDateString('ar-EG') : '-'}</span></div>
              <div><span className="text-gray-500">{ar ? 'الحالة:' : 'Status:'}</span>
                <span className={`ms-1 px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[detail?.status] ?? ''}`}>{ar ? STATUS_AR[detail?.status] : detail?.status}</span>
              </div>
              {detail?.purpose && <div className="col-span-2"><span className="text-gray-500">{ar ? 'الغرض:' : 'Purpose:'}</span> <span className="font-medium">{detail.purpose}</span></div>}
              {detail?.projectName && <div><span className="text-gray-500">{ar ? 'المشروع:' : 'Project:'}</span> <span className="font-medium">{detail.projectName}</span></div>}
            </div>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-right">{ar ? 'الكود' : 'Code'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'الوصف' : 'Description'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'الوحدة' : 'Unit'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'الكمية المطلوبة' : 'Requested'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'المصروف' : 'Issued'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'سعر الوحدة' : 'Price'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'الإجمالي' : 'Total'}</th>
                </tr>
              </thead>
              <tbody>
                {detail?.items?.map(item => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-xs text-blue-600">{item.itemCode}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-gray-500">{item.unit}</td>
                    <td className="px-3 py-2">{item.requestedQty?.toLocaleString()}</td>
                    <td className="px-3 py-2 font-medium text-orange-700">{item.issuedQty?.toLocaleString()}</td>
                    <td className="px-3 py-2">{fmt(item.unitPrice)}</td>
                    <td className="px-3 py-2 font-medium">{fmt(item.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-orange-50 font-bold">
                <tr>
                  <td colSpan={6} className="px-3 py-2 text-gray-700">{ar ? 'الإجمالي' : 'Total'}</td>
                  <td className="px-3 py-2 text-orange-700">{fmt(detail?.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
