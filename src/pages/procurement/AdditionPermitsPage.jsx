import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect } from 'react';
import { Plus, Trash2, XCircle, PackageCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { procurementApi } from '../../api/index';
import { Spinner } from '../../components/common/index';
import { useLang } from '../../context/LangContext';

const STATUS_STYLES = {
  Draft:     'bg-gray-100 text-gray-600',
  Confirmed: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-700',
};
const STATUS_AR = { Draft: 'مسودة', Confirmed: 'مؤكَّد', Cancelled: 'ملغي' };

export default function AdditionPermitsPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const ar = lang === 'ar';

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['permits'],
    queryFn: () => procurementApi.getPermits({ page: 1, pageSize: 50 }).then(r => r.data?.data ?? []),
  });

  const createMut = useMutation({
    mutationFn: (d) => procurementApi.createPermit(d),
    onSuccess: () => { qc.invalidateQueries(['permits']); setOpen(false); toast.success(ar ? 'تم إنشاء إذن الإضافة' : 'Addition permit created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const confirmMut = useMutation({
    mutationFn: (id) => procurementApi.confirmPermit(id),
    onSuccess: () => { qc.invalidateQueries(['permits']); toast.success(ar ? 'تم التأكيد' : 'Confirmed'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => procurementApi.deletePermit(id),
    onSuccess: () => { qc.invalidateQueries(['permits']); toast.success(ar ? 'تم الحذف' : 'Deleted'); },
  });

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <PackageCheck size={24} className="text-primary-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{ar ? 'أذونات الإضافة (GRN)' : 'Addition Permits (GRN)'}</h1>
            <p className="text-sm text-gray-500">{ar ? 'تسجيل البضاعة المستلمة' : 'Record received goods'}</p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {ar ? 'إذن إضافة جديد' : 'New Addition Permit'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <PackageCheck size={40} className="mx-auto mb-3 opacity-30" />
            <p>{ar ? 'لا توجد أذونات إضافة بعد' : 'No addition permits yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right">{ar ? 'رقم الإذن' : 'Permit No.'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'طلب الشراء' : 'Purchase Order'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'تاريخ الاستلام' : 'Receipt Date'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'المستلِم' : 'Received By'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'البنود' : 'Items'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'القيمة' : 'Total Value'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-center">{ar ? 'أكشن' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {list.map(a => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(a)} className="font-mono text-xs text-blue-600 hover:underline">{a.permitNumber}</button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-purple-600">{a.purchaseNumber}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(a.permitDate).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-3 text-gray-600">{a.receivedBy}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{a.itemsCount}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{fmt(a.totalAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[a.status] ?? ''}`}>
                        {ar ? (STATUS_AR[a.status] ?? a.status) : a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {a.status === 'Draft' && (
                          <button onClick={() => confirmMut.mutate(a.id)} className="action-btn-success"><CheckCircle2 size={13} />{ar ? 'تأكيد الاستلام' : 'Confirm'}</button>
                        )}
                        {a.status === 'Draft' && (
                          <button onClick={() => { if (confirm(ar ? 'حذف؟' : 'Delete?')) deleteMut.mutate(a.id); }} className="action-btn-icon text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
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

      {open && <PermitModal onClose={() => setOpen(false)} onSubmit={createMut.mutate} loading={createMut.isPending} lang={lang} />}
      {detail && <PermitDetail permit={detail} onClose={() => setDetail(null)} lang={lang} />}
    </div>
  );
}

function PermitModal({ onClose, onSubmit, loading, lang }) {
  const ar = lang === 'ar';
  const [selectedPoId, setSelectedPoId] = useState('');
  const { register, control, handleSubmit, setValue } = useForm({
    defaultValues: {
      purchaseRequestId: '',
      permitDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [],
    },
  });
  const { fields, replace } = useFieldArray({ control, name: 'items' });

  const { data: purchases = [] } = useQuery({
    queryKey: ['purchases-ordered'],
    queryFn: () => procurementApi.getPurchases({ page: 1, pageSize: 100 }).then(r =>
      (r.data?.data ?? []).filter(p => p.status === 'Ordered' || p.status === 'Approved')),
  });

  const { data: poDetail } = useQuery({
    queryKey: ['purchase-for-grn', selectedPoId],
    queryFn: () => procurementApi.getPurchase(selectedPoId).then(r => r.data?.data ?? r.data),
    enabled: !!selectedPoId,
    staleTime: 0,
  });

  useEffect(() => {
    if (!poDetail?.items) return;
    replace(poDetail.items.map(item => ({
      purchaseItemId: item.id,
      itemCode:    item.itemCode,
      description: item.description,
      unit:        item.unit,
      orderedQty:  item.quantity,
      receivedQty: item.quantity,
      unitPrice:   item.unitPrice,
    })));
  }, [poDetail?.id]);

  const handlePoChange = (e) => {
    const id = e.target.value;
    setSelectedPoId(id);
    setValue('purchaseRequestId', id);
    if (!id) replace([]);
  };

  const watchItems = fields;
  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  const onSave = (data) => {
    if (!data.purchaseRequestId) { toast.error(ar ? 'اختر طلب الشراء' : 'Select purchase order'); return; }
    if (data.items.length === 0) { toast.error(ar ? 'لا توجد بنود' : 'No items'); return; }
    onSubmit({
      purchaseRequestId: data.purchaseRequestId,
      permitDate: new Date(data.permitDate).toISOString(),
      notes: data.notes,
      items: data.items.map(i => ({
        purchaseItemId: i.purchaseItemId,
        receivedQty: Number(i.receivedQty),
        unitPrice: Number(i.unitPrice),
      })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="modal-header">
          <h2 className="font-bold text-gray-800">{ar ? 'إذن إضافة جديد (GRN)' : 'New Addition Permit (GRN)'}</h2>
          <button onClick={onClose} className="modal-close-btn"><XCircle size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{ar ? 'طلب الشراء' : 'Purchase Order'} *</label>
              <select className="form-input" value={selectedPoId} onChange={handlePoChange}>
                <option value="">{ar ? '— اختر طلب الشراء —' : '— Select PO —'}</option>
                {purchases.map(p => (
                  <option key={p.id} value={p.id}>{p.purchaseNumber} — {p.supplier}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">{ar ? 'تاريخ الاستلام' : 'Receipt Date'} *</label>
              <input type="date" {...register('permitDate', { required: true })} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">{ar ? 'ملاحظات' : 'Notes'}</label>
            <textarea {...register('notes')} className="form-input" rows={2} />
          </div>

          {fields.length > 0 && (
            <div>
              <label className="form-label mb-2">{ar ? 'الكميات المستلَمة' : 'Received Quantities'}</label>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الكود' : 'Code'}</th>
                      <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الوصف' : 'Description'}</th>
                      <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الوحدة' : 'Unit'}</th>
                      <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الكمية المطلوبة' : 'Ordered Qty'}</th>
                      <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الكمية المستلَمة' : 'Received Qty'}</th>
                      <th className="px-3 py-2 text-right text-gray-500">{ar ? 'سعر الوحدة' : 'Unit Price'}</th>
                      <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الإجمالي' : 'Total'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((f, i) => {
                      const rowTotal = (Number(f.receivedQty) || 0) * (Number(f.unitPrice) || 0);
                      return (
                        <tr key={f.id} className="border-t border-gray-100">
                          <td className="px-3 py-2 font-mono text-blue-600">{f.itemCode}</td>
                          <td className="px-3 py-2">{f.description}</td>
                          <td className="px-3 py-2 text-gray-500">{f.unit}</td>
                          <td className="px-3 py-2 text-gray-500">{f.orderedQty}</td>
                          <td className="px-2 py-1.5">
                            <input type="number" step="any" {...register(`items.${i}.receivedQty`, { required: true, min: 0 })}
                              className="table-input" defaultValue={f.receivedQty} />
                          </td>
                          <td className="px-2 py-1.5">
                            <input type="number" step="any" {...register(`items.${i}.unitPrice`, { required: true, min: 0 })}
                              className="table-input" defaultValue={f.unitPrice} />
                          </td>
                          <td className="px-3 py-2 font-mono">{fmt(rowTotal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!selectedPoId && (
            <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-xl">
              {ar ? 'اختر طلب الشراء أولاً لعرض البنود' : 'Select a purchase order to load items'}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" disabled={loading || !selectedPoId} className="btn-primary">
              {loading ? <Spinner size="sm" /> : (ar ? 'إنشاء إذن الإضافة' : 'Create Permit')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PermitDetail({ permit, onClose, lang }) {
  const ar = lang === 'ar';
  const { data: detail, isLoading } = useQuery({
    queryKey: ['permit', permit.id],
    queryFn: () => procurementApi.getPermit(permit.id).then(r => r.data?.data ?? r.data),
  });
  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="modal-header">
          <h2 className="font-bold text-gray-800">{ar ? 'تفاصيل إذن الإضافة' : 'Addition Permit Details'} — {permit.permitNumber}</h2>
          <button onClick={onClose} className="modal-close-btn"><XCircle size={20} /></button>
        </div>
        {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">{ar ? 'طلب الشراء:' : 'PO:'}</span> <span className="font-mono text-purple-600 text-xs">{detail?.purchaseNumber}</span></div>
              <div><span className="text-gray-500">{ar ? 'تاريخ الاستلام:' : 'Date:'}</span> <span className="font-medium">{detail?.permitDate ? new Date(detail.permitDate).toLocaleDateString('ar-EG') : '-'}</span></div>
              <div><span className="text-gray-500">{ar ? 'المستلِم:' : 'Received By:'}</span> <span className="font-medium">{detail?.receivedBy}</span></div>
              <div><span className="text-gray-500">{ar ? 'الحالة:' : 'Status:'}</span>
                <span className={`ms-1 px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[detail?.status] ?? ''}`}>{ar ? STATUS_AR[detail?.status] : detail?.status}</span>
              </div>
            </div>
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-right">{ar ? 'الكود' : 'Code'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'الوصف' : 'Description'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'الوحدة' : 'Unit'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'المطلوب' : 'Ordered'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'المستلَم' : 'Received'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'سعر الوحدة' : 'Unit Price'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'الإجمالي' : 'Total'}</th>
                </tr>
              </thead>
              <tbody>
                {detail?.items?.map(item => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-xs text-blue-600">{item.itemCode}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-gray-500">{item.unit}</td>
                    <td className="px-3 py-2 text-gray-500">{item.orderedQty?.toLocaleString()}</td>
                    <td className="px-3 py-2 font-medium text-green-700">{item.receivedQty?.toLocaleString()}</td>
                    <td className="px-3 py-2">{fmt(item.unitPrice)}</td>
                    <td className="px-3 py-2 font-medium">{fmt(item.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-teal-50 font-bold">
                <tr>
                  <td colSpan={6} className="px-3 py-2 text-gray-700">{ar ? 'الإجمالي' : 'Total'}</td>
                  <td className="px-3 py-2 text-teal-700">{fmt(detail?.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
