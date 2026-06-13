import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Plus, Trash2, CheckCircle, XCircle, ShoppingCart,
  ChevronRight, Package, Sparkles, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { procurementApi, procurementAiApi } from '../../api/index';
import { Spinner } from '../../components/common/index';
import { useLang } from '../../context/LangContext';

const STATUS_STYLES = {
  Draft:     'bg-gray-100 text-gray-600',
  Approved:  'bg-green-100 text-green-700',
  Ordered:   'bg-blue-100 text-blue-700',
  Received:  'bg-teal-100 text-teal-700',
  Cancelled: 'bg-red-100 text-red-700',
};
const STATUS_AR = {
  Draft: 'مسودة', Approved: 'معتمد', Ordered: 'مُطلَب',
  Received: 'مستلَم', Cancelled: 'ملغي',
};

export default function PurchasesPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const ar = lang === 'ar';

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => procurementApi.getPurchases({ page: 1, pageSize: 50 }).then(r => r.data?.data ?? []),
  });

  // for linking to requisition
  const { data: requisitions = [] } = useQuery({
    queryKey: ['requisitions-approved'],
    queryFn: () => procurementApi.getRequisitions({ page: 1, pageSize: 100 }).then(r =>
      (r.data?.data ?? []).filter(r => r.status === 'Approved')),
  });

  const createMut = useMutation({
    mutationFn: (d) => procurementApi.createPurchase(d),
    onSuccess: () => { qc.invalidateQueries(['purchases']); setOpen(false); toast.success(ar ? 'تم إنشاء طلب الشراء' : 'Purchase created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => procurementApi.updatePoStatus(id, { status }),
    onSuccess: () => { qc.invalidateQueries(['purchases']); toast.success(ar ? 'تم تحديث الحالة' : 'Status updated'); },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => procurementApi.deletePurchase(id),
    onSuccess: () => { qc.invalidateQueries(['purchases']); toast.success(ar ? 'تم الحذف' : 'Deleted'); },
  });

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart size={24} className="text-primary-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{ar ? 'طلبات الشراء' : 'Purchase Requests'}</h1>
            <p className="text-sm text-gray-500">{ar ? 'إدارة أوامر الشراء' : 'Manage purchase orders'}</p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {ar ? 'طلب شراء جديد' : 'New Purchase'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ShoppingCart size={40} className="mx-auto mb-3 opacity-30" />
            <p>{ar ? 'لا توجد طلبات شراء بعد' : 'No purchase requests yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right">{ar ? 'رقم الطلب' : 'PO Number'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'المورد' : 'Supplier'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'طلب الاحتياج' : 'Requisition'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'البنود' : 'Items'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الإجمالي' : 'Total'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-center">{ar ? 'أكشن' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {list.map(p => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(p)} className="font-mono text-xs text-blue-600 hover:underline">{p.purchaseNumber}</button>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{p.supplier}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(p.purchaseDate).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-3 text-xs text-purple-600 font-mono">{p.requisitionNumber ?? '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{p.itemsCount}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{fmt(p.totalAmount)} <span className="text-xs text-gray-400">{p.currency}</span></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[p.status] ?? ''}`}>
                        {ar ? (STATUS_AR[p.status] ?? p.status) : p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {p.status === 'Draft' && (
                          <button onClick={() => statusMut.mutate({ id: p.id, status: 'Approved' })} className="action-btn-success"><CheckCircle size={13} />{ar ? 'اعتماد' : 'Approve'}</button>
                        )}
                        {p.status === 'Approved' && (
                          <button onClick={() => statusMut.mutate({ id: p.id, status: 'Ordered' })} className="action-btn-blue"><ChevronRight size={13} />{ar ? 'إصدار أمر' : 'Order'}</button>
                        )}
                        {p.status === 'Draft' && (
                          <button onClick={() => { if (confirm(ar ? 'حذف؟' : 'Delete?')) deleteMut.mutate(p.id); }} className="action-btn-icon text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
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

      {open && <PurchaseModal onClose={() => setOpen(false)} onSubmit={createMut.mutate} loading={createMut.isPending} lang={lang} requisitions={requisitions} />}
      {detail && <PurchaseDetail po={detail} onClose={() => setDetail(null)} lang={lang} />}
    </div>
  );
}

function PurchaseModal({ onClose, onSubmit, loading, lang, requisitions }) {
  const ar = lang === 'ar';
  const fileRef = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      supplier: '', supplierPhone: '', currency: 'EGP',
      purchaseDate: new Date().toISOString().split('T')[0],
      expectedDate: '', notes: '', requisitionId: '',
      items: [{ itemCode: '', description: '', unit: '', quantity: 1, unitPrice: 0 }],
    },
  });
  const { fields, append, remove, replace } = useFieldArray({ control, name: 'items' });

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfLoading(true);
    try {
      const res = await procurementAiApi.analyzeQuotePdf(file);
      const items = res.data?.data ?? [];
      if (items.length === 0) {
        toast.error(ar ? 'لم يتم استخراج أي بنود من الملف' : 'No items extracted from PDF');
        return;
      }
      replace(items.map(item => ({
        itemCode: item.itemCode ?? '',
        description: item.description ?? '',
        unit: item.unit ?? '',
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
      })));
      toast.success(ar ? `تم استيراد ${items.length} بند من الـ PDF` : `Imported ${items.length} items from PDF`);
    } catch {
      toast.error(ar ? 'فشل في قراءة الـ PDF' : 'Failed to read PDF');
    } finally {
      setPdfLoading(false);
      e.target.value = '';
    }
  };
  const watchItems = watch('items');

  const grandTotal = watchItems?.reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0) ?? 0;

  const onSave = (data) => {
    if (data.items.length === 0) { toast.error(ar ? 'أضف بند واحد على الأقل' : 'Add at least one item'); return; }
    onSubmit({
      ...data,
      requisitionId: data.requisitionId || null,
      purchaseDate: new Date(data.purchaseDate).toISOString(),
      expectedDate: data.expectedDate ? new Date(data.expectedDate).toISOString() : null,
      items: data.items.map(i => ({ ...i, quantity: Number(i.quantity), unitPrice: Number(i.unitPrice) })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="modal-header">
          <h2 className="font-bold text-gray-800">{ar ? 'طلب شراء جديد' : 'New Purchase Request'}</h2>
          <button onClick={onClose} className="modal-close-btn"><XCircle size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{ar ? 'المورد' : 'Supplier'} *</label>
              <input {...register('supplier', { required: true })} className="form-input" />
            </div>
            <div>
              <label className="form-label">{ar ? 'هاتف المورد' : 'Supplier Phone'}</label>
              <input {...register('supplierPhone')} className="form-input" />
            </div>
            <div>
              <label className="form-label">{ar ? 'تاريخ الطلب' : 'Purchase Date'} *</label>
              <input type="date" {...register('purchaseDate', { required: true })} className="form-input" />
            </div>
            <div>
              <label className="form-label">{ar ? 'التاريخ المتوقع للاستلام' : 'Expected Date'}</label>
              <input type="date" {...register('expectedDate')} className="form-input" />
            </div>
            <div>
              <label className="form-label">{ar ? 'العملة' : 'Currency'}</label>
              <select {...register('currency')} className="form-input">
                <option value="EGP">EGP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="SAR">SAR</option>
              </select>
            </div>
            <div>
              <label className="form-label">{ar ? 'مرتبط بطلب احتياج' : 'Linked to Requisition'}</label>
              <select {...register('requisitionId')} className="form-input">
                <option value="">{ar ? '— بدون ربط —' : '— None —'}</option>
                {requisitions.map(r => (
                  <option key={r.id} value={r.id}>{r.requisitionNumber} — {r.department}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">{ar ? 'ملاحظات' : 'Notes'}</label>
            <textarea {...register('notes')} className="form-input" rows={2} />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">{ar ? 'بنود الشراء' : 'Purchase Items'}</label>
              <div className="flex items-center gap-2">
                <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={pdfLoading}
                  className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-60">
                  {pdfLoading
                    ? <><Sparkles size={13} className="animate-pulse" /> {ar ? 'جاري التحليل...' : 'Analyzing...'}</>
                    : <><Upload size={13} /> {ar ? 'استيراد من PDF' : 'Import from PDF'}</>}
                </button>
                <button type="button" onClick={() => append({ itemCode: '', description: '', unit: '', quantity: 1, unitPrice: 0 })}
                  className="add-item-btn">
                  <Plus size={13} /> {ar ? 'إضافة بند' : 'Add Item'}
                </button>
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الكود' : 'Code'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الوصف' : 'Description'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الوحدة' : 'Unit'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الكمية' : 'Qty'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الإجمالي' : 'Total'}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f, i) => {
                    const rowTotal = (Number(watchItems?.[i]?.quantity) || 0) * (Number(watchItems?.[i]?.unitPrice) || 0);
                    return (
                      <tr key={f.id} className="border-t border-gray-100">
                        <td className="px-2 py-1.5"><input {...register(`items.${i}.itemCode`, { required: true })} className="table-input" /></td>
                        <td className="px-2 py-1.5"><input {...register(`items.${i}.description`, { required: true })} className="table-input" /></td>
                        <td className="px-2 py-1.5"><input {...register(`items.${i}.unit`, { required: true })} className="table-input" /></td>
                        <td className="px-2 py-1.5"><input type="number" step="any" {...register(`items.${i}.quantity`, { required: true, min: 0.001 })} className="table-input" /></td>
                        <td className="px-2 py-1.5"><input type="number" step="any" {...register(`items.${i}.unitPrice`, { required: true, min: 0 })} className="table-input" /></td>
                        <td className="px-2 py-1.5 text-gray-600 font-mono">{rowTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        <td className="px-2 py-1.5 text-center">
                          {fields.length > 1 && <button type="button" onClick={() => remove(i)} className="action-btn-icon text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-blue-50">
                  <tr>
                    <td colSpan={5} className="px-3 py-2 text-gray-700 font-bold text-xs">{ar ? 'الإجمالي الكلي' : 'Grand Total'}</td>
                    <td className="px-3 py-2 text-blue-700 font-bold text-xs">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Spinner size="sm" /> : (ar ? 'إنشاء طلب الشراء' : 'Create Purchase')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PurchaseDetail({ po, onClose, lang }) {
  const ar = lang === 'ar';
  const { data: detail, isLoading } = useQuery({
    queryKey: ['purchase', po.id],
    queryFn: () => procurementApi.getPurchase(po.id).then(r => r.data?.data ?? r.data),
  });
  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="modal-header">
          <h2 className="font-bold text-gray-800">{ar ? 'تفاصيل طلب الشراء' : 'Purchase Details'} — {po.purchaseNumber}</h2>
          <button onClick={onClose} className="modal-close-btn"><XCircle size={20} /></button>
        </div>
        {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">{ar ? 'المورد:' : 'Supplier:'}</span> <span className="font-medium">{detail?.supplier}</span></div>
              <div><span className="text-gray-500">{ar ? 'التاريخ:' : 'Date:'}</span> <span className="font-medium">{detail?.purchaseDate ? new Date(detail.purchaseDate).toLocaleDateString('ar-EG') : '-'}</span></div>
              {detail?.requisitionNumber && <div><span className="text-gray-500">{ar ? 'طلب الاحتياج:' : 'Requisition:'}</span> <span className="font-mono text-xs text-purple-600">{detail.requisitionNumber}</span></div>}
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
                  <th className="px-3 py-2 text-right">{ar ? 'الكمية' : 'Qty'}</th>
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
                    <td className="px-3 py-2">{item.quantity.toLocaleString()}</td>
                    <td className="px-3 py-2">{fmt(item.unitPrice)}</td>
                    <td className="px-3 py-2 font-medium">{fmt(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-blue-50 font-bold">
                <tr>
                  <td colSpan={5} className="px-3 py-2 text-gray-700">{ar ? 'الإجمالي' : 'Total'}</td>
                  <td className="px-3 py-2 text-blue-700">{fmt(detail?.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
