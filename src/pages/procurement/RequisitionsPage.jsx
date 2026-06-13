import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  Plus, Trash2, CheckCircle, XCircle, RefreshCw,
  ClipboardList, ChevronRight, Edit3, AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { procurementApi } from '../../api/index';
import { Spinner } from '../../components/common/index';
import { useLang } from '../../context/LangContext';

const STATUS_STYLES = {
  Draft:     'bg-gray-100 text-gray-600',
  Submitted: 'bg-blue-100 text-blue-700',
  Approved:  'bg-green-100 text-green-700',
  Rejected:  'bg-red-100 text-red-700',
  Converted: 'bg-purple-100 text-purple-700',
};
const STATUS_AR = {
  Draft: 'مسودة', Submitted: 'مُقدَّم', Approved: 'معتمد',
  Rejected: 'مرفوض', Converted: 'محوَّل',
};

export default function RequisitionsPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState(null);

  const { data: list = [], isLoading } = useQuery({
    queryKey: ['requisitions'],
    queryFn: () => procurementApi.getRequisitions({ page: 1, pageSize: 50 }).then(r => r.data?.data ?? []),
  });

  const createMut = useMutation({
    mutationFn: (d) => procurementApi.createRequisition(d),
    onSuccess: () => { qc.invalidateQueries(['requisitions']); setOpen(false); toast.success(lang === 'ar' ? 'تم إنشاء طلب الاحتياج' : 'Requisition created'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }) => procurementApi.updateReqStatus(id, { status }),
    onSuccess: () => { qc.invalidateQueries(['requisitions']); toast.success(lang === 'ar' ? 'تم تحديث الحالة' : 'Status updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => procurementApi.deleteRequisition(id),
    onSuccess: () => { qc.invalidateQueries(['requisitions']); toast.success(lang === 'ar' ? 'تم الحذف' : 'Deleted'); },
  });

  const ar = lang === 'ar';

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList size={24} className="text-primary-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{ar ? 'طلبات الاحتياج' : 'Need Requisitions'}</h1>
            <p className="text-sm text-gray-500">{ar ? 'إدارة طلبات الاحتياج' : 'Manage requisition requests'}</p>
          </div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {ar ? 'طلب احتياج جديد' : 'New Requisition'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p>{ar ? 'لا توجد طلبات احتياج بعد' : 'No requisitions yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right">{ar ? 'رقم الطلب' : 'Number'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'القسم' : 'Department'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'التاريخ' : 'Date'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'طالب الاحتياج' : 'Requested By'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'البنود' : 'Items'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-center">{ar ? 'أكشن' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {list.map(r => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetail(r)} className="font-mono text-xs text-blue-600 hover:underline">{r.requisitionNumber}</button>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{r.department}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(r.requisitionDate).toLocaleDateString('ar-EG')}</td>
                    <td className="px-4 py-3 text-gray-600">{r.requestedBy}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs">{r.itemsCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] ?? ''}`}>
                        {ar ? (STATUS_AR[r.status] ?? r.status) : r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {r.status === 'Draft' && (
                          <button onClick={() => statusMut.mutate({ id: r.id, status: 'Submitted' })}
                            className="action-btn-blue">
                            <ChevronRight size={13} />{ar ? 'تقديم' : 'Submit'}
                          </button>
                        )}
                        {r.status === 'Submitted' && (
                          <>
                            <button onClick={() => statusMut.mutate({ id: r.id, status: 'Approved' })}
                              className="action-btn-success">
                              <CheckCircle size={13} />{ar ? 'اعتماد' : 'Approve'}
                            </button>
                            <button onClick={() => statusMut.mutate({ id: r.id, status: 'Rejected' })}
                              className="action-btn-danger">
                              <XCircle size={13} />{ar ? 'رفض' : 'Reject'}
                            </button>
                          </>
                        )}
                        {r.status === 'Draft' && (
                          <button onClick={() => { if (confirm(ar ? 'حذف؟' : 'Delete?')) deleteMut.mutate(r.id); }}
                            className="action-btn-icon text-gray-300 hover:text-red-500 hover:bg-red-50">
                            <Trash2 size={14} />
                          </button>
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

      {/* Create Modal */}
      {open && <RequisitionModal onClose={() => setOpen(false)} onSubmit={createMut.mutate} loading={createMut.isPending} lang={lang} />}

      {/* Detail Modal */}
      {detail && <RequisitionDetail req={detail} onClose={() => setDetail(null)} lang={lang} />}
    </div>
  );
}

function RequisitionModal({ onClose, onSubmit, loading, lang }) {
  const ar = lang === 'ar';
  const { register, control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      department: '',
      requisitionDate: new Date().toISOString().split('T')[0],
      notes: '',
      items: [{ itemCode: '', description: '', unit: '', quantity: 1, notes: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const onSave = (data) => {
    if (data.items.length === 0) { toast.error(ar ? 'أضف بند واحد على الأقل' : 'Add at least one item'); return; }
    onSubmit({ ...data, requisitionDate: new Date(data.requisitionDate).toISOString() });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="modal-header">
          <h2 className="font-bold text-gray-800">{ar ? 'طلب احتياج جديد' : 'New Need Requisition'}</h2>
          <button onClick={onClose} className="modal-close-btn"><XCircle size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">{ar ? 'القسم' : 'Department'} *</label>
              <input {...register('department', { required: true })} className="form-input" placeholder={ar ? 'مثال: الإنشاءات' : 'e.g. Construction'} />
              {errors.department && <p className="text-red-500 text-xs mt-1">{ar ? 'مطلوب' : 'Required'}</p>}
            </div>
            <div>
              <label className="form-label">{ar ? 'تاريخ الطلب' : 'Date'} *</label>
              <input type="date" {...register('requisitionDate', { required: true })} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">{ar ? 'ملاحظات' : 'Notes'}</label>
            <textarea {...register('notes')} className="form-input" rows={2} />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="form-label mb-0">{ar ? 'البنود المطلوبة' : 'Required Items'}</label>
              <button type="button" onClick={() => append({ itemCode: '', description: '', unit: '', quantity: 1, notes: '' })}
                className="add-item-btn">
                <Plus size={13} /> {ar ? 'إضافة بند' : 'Add Item'}
              </button>
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الكود' : 'Code'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الوصف' : 'Description'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الوحدة' : 'Unit'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'الكمية' : 'Qty'}</th>
                    <th className="px-3 py-2 text-right text-gray-500">{ar ? 'ملاحظة' : 'Note'}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((f, i) => (
                    <tr key={f.id} className="border-t border-gray-100">
                      <td className="px-2 py-1.5"><input {...register(`items.${i}.itemCode`, { required: true })} className="table-input" /></td>
                      <td className="px-2 py-1.5"><input {...register(`items.${i}.description`, { required: true })} className="table-input" /></td>
                      <td className="px-2 py-1.5"><input {...register(`items.${i}.unit`, { required: true })} className="table-input" placeholder="م²" /></td>
                      <td className="px-2 py-1.5"><input type="number" step="any" {...register(`items.${i}.quantity`, { required: true, min: 0.001 })} className="table-input" /></td>
                      <td className="px-2 py-1.5"><input {...register(`items.${i}.notes`)} className="table-input" /></td>
                      <td className="px-2 py-1.5 text-center">
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(i)} className="action-btn-icon text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={13} /></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Spinner size="sm" /> : (ar ? 'إنشاء الطلب' : 'Create Requisition')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RequisitionDetail({ req, onClose, lang }) {
  const ar = lang === 'ar';
  const { data: detail, isLoading } = useQuery({
    queryKey: ['requisition', req.id],
    queryFn: () => procurementApi.getRequisition(req.id).then(r => r.data?.data ?? r.data),
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="modal-header">
          <h2 className="font-bold text-gray-800">{ar ? 'تفاصيل طلب الاحتياج' : 'Requisition Details'} — {req.requisitionNumber}</h2>
          <button onClick={onClose} className="modal-close-btn"><XCircle size={20} /></button>
        </div>
        {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">{ar ? 'القسم:' : 'Department:'}</span> <span className="font-medium">{detail?.department}</span></div>
              <div><span className="text-gray-500">{ar ? 'التاريخ:' : 'Date:'}</span> <span className="font-medium">{detail?.requisitionDate ? new Date(detail.requisitionDate).toLocaleDateString('ar-EG') : '-'}</span></div>
              <div><span className="text-gray-500">{ar ? 'طالب الاحتياج:' : 'Requested By:'}</span> <span className="font-medium">{detail?.requestedBy}</span></div>
              <div><span className="text-gray-500">{ar ? 'الحالة:' : 'Status:'}</span>
                <span className={`ms-1 px-2 py-0.5 rounded-full text-xs ${STATUS_STYLES[detail?.status] ?? ''}`}>{ar ? STATUS_AR[detail?.status] : detail?.status}</span>
              </div>
            </div>
            {detail?.notes && <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">{detail.notes}</p>}
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-right">{ar ? 'الكود' : 'Code'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'الوصف' : 'Description'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'الوحدة' : 'Unit'}</th>
                  <th className="px-3 py-2 text-right">{ar ? 'الكمية' : 'Qty'}</th>
                </tr>
              </thead>
              <tbody>
                {detail?.items?.map(item => (
                  <tr key={item.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-mono text-xs text-blue-600">{item.itemCode}</td>
                    <td className="px-3 py-2">{item.description}</td>
                    <td className="px-3 py-2 text-gray-500">{item.unit}</td>
                    <td className="px-3 py-2 font-medium">{item.quantity.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
