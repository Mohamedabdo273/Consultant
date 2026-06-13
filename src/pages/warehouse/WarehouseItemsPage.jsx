import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, XCircle, Package, Edit3, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { warehouseApi } from '../../api/index';
import { Spinner } from '../../components/common/index';
import { useLang } from '../../context/LangContext';

const STOCK_STYLES = {
  OK:    'bg-green-100 text-green-700',
  LOW:   'bg-yellow-100 text-yellow-700',
  EMPTY: 'bg-red-100 text-red-700',
};
const STOCK_ICONS = {
  OK:    <CheckCircle size={12} />,
  LOW:   <AlertTriangle size={12} />,
  EMPTY: <AlertTriangle size={12} />,
};
const STOCK_AR = { OK: 'متوفر', LOW: 'منخفض', EMPTY: 'نفد' };

export default function WarehouseItemsPage() {
  const { lang } = useLang();
  const qc = useQueryClient();
  const ar = lang === 'ar';
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // null | 'create' | {item}
  const [cardItem, setCardItem] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['warehouse-items', search],
    queryFn: () => warehouseApi.getItems({ search }).then(r => r.data?.data ?? []),
  });

  const { data: summary } = useQuery({
    queryKey: ['warehouse-summary'],
    queryFn: () => warehouseApi.getSummary().then(r => r.data?.data ?? null),
  });

  const createMut = useMutation({
    mutationFn: (d) => warehouseApi.createItem(d),
    onSuccess: () => { qc.invalidateQueries(['warehouse-items']); qc.invalidateQueries(['warehouse-summary']); setModal(null); toast.success(ar ? 'تم إضافة الصنف' : 'Item added'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => warehouseApi.updateItem(id, data),
    onSuccess: () => { qc.invalidateQueries(['warehouse-items']); setModal(null); toast.success(ar ? 'تم التحديث' : 'Updated'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => warehouseApi.deleteItem(id),
    onSuccess: () => { qc.invalidateQueries(['warehouse-items']); qc.invalidateQueries(['warehouse-summary']); toast.success(ar ? 'تم الحذف' : 'Deleted'); },
    onError: (e) => toast.error(e.response?.data?.message || 'Error'),
  });

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package size={24} className="text-primary-600" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">{ar ? 'المستودع — كرت الصنف' : 'Warehouse — Item Cards'}</h1>
            <p className="text-sm text-gray-500">{ar ? 'إدارة أصناف المستودع والرصيد الجاري' : 'Manage warehouse items and running stock'}</p>
          </div>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> {ar ? 'صنف جديد' : 'New Item'}
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
            <p className="text-xs text-gray-500">{ar ? 'إجمالي الأصناف' : 'Total Items'}</p>
            <p className="text-2xl font-bold text-gray-800">{summary.totalItems}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-100 p-4 shadow-sm">
            <p className="text-xs text-yellow-600">{ar ? 'رصيد منخفض' : 'Low Stock'}</p>
            <p className="text-2xl font-bold text-yellow-700">{summary.lowStockItems}</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-100 p-4 shadow-sm">
            <p className="text-xs text-red-600">{ar ? 'نفد الرصيد' : 'Out of Stock'}</p>
            <p className="text-2xl font-bold text-red-700">{summary.emptyStockItems}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 shadow-sm">
            <p className="text-xs text-blue-600">{ar ? 'إجمالي قيمة المستودع' : 'Total Stock Value'}</p>
            <p className="text-lg font-bold text-blue-700">{fmt(summary.totalStockValue)}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={ar ? 'ابحث بالكود أو الوصف أو الفئة...' : 'Search by code, description or category...'}
          className="form-input flex-1"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Package size={40} className="mx-auto mb-3 opacity-30" />
            <p>{ar ? 'لا توجد أصناف في المستودع' : 'No warehouse items yet'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-right">{ar ? 'كود الصنف' : 'Item Code'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الوصف' : 'Description'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الفئة' : 'Category'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الوحدة' : 'Unit'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الرصيد الجاري' : 'Current Stock'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'حد الإنذار' : 'Min Stock'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الحالة' : 'Status'}</th>
                  <th className="px-4 py-3 text-right">{ar ? 'الحركات' : 'Transactions'}</th>
                  <th className="px-4 py-3 text-center">{ar ? 'أكشن' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(item => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <button onClick={() => setCardItem(item)} className="font-mono text-xs text-blue-600 hover:underline font-bold">{item.itemCode}</button>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.description}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{item.category ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{item.unit}</td>
                    <td className="px-4 py-3 font-bold text-gray-800">{item.currentStock.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-400">{item.minStock > 0 ? item.minStock.toLocaleString() : '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STOCK_STYLES[item.stockStatus] ?? ''}`}>
                        {STOCK_ICONS[item.stockStatus]}
                        {ar ? STOCK_AR[item.stockStatus] : item.stockStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">{item.transactionsCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setModal(item)} className="action-btn-gray"><Edit3 size={13} />{ar ? 'تعديل' : 'Edit'}</button>
                        {item.currentStock === 0 && (
                          <button onClick={() => { if (confirm(ar ? 'حذف؟' : 'Delete?')) deleteMut.mutate(item.id); }} className="action-btn-icon text-gray-300 hover:text-red-500 hover:bg-red-50"><Trash2 size={14} /></button>
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

      {/* Modals */}
      {modal && (
        <ItemModal
          item={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSubmit={(data) => modal === 'create' ? createMut.mutate(data) : updateMut.mutate({ id: modal.id, data })}
          loading={createMut.isPending || updateMut.isPending}
          lang={lang}
        />
      )}
      {cardItem && <ItemCardModal itemId={cardItem.id} onClose={() => setCardItem(null)} lang={lang} />}
    </div>
  );
}

function ItemModal({ item, onClose, onSubmit, loading, lang }) {
  const ar = lang === 'ar';
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: item ?? { itemCode: '', description: '', unit: '', category: '', minStock: 0 },
  });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="modal-header">
          <h2 className="font-bold text-gray-800">{item ? (ar ? 'تعديل الصنف' : 'Edit Item') : (ar ? 'صنف جديد' : 'New Item')}</h2>
          <button onClick={onClose} className="modal-close-btn"><XCircle size={20} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">{ar ? 'كود الصنف' : 'Item Code'} *</label>
              <input {...register('itemCode', { required: true })} className="form-input" disabled={!!item} />
              {errors.itemCode && <p className="text-red-500 text-xs mt-1">{ar ? 'مطلوب' : 'Required'}</p>}
            </div>
            <div>
              <label className="form-label">{ar ? 'الوحدة' : 'Unit'} *</label>
              <input {...register('unit', { required: true })} className="form-input" placeholder="م²، طن، قطعة..." />
            </div>
          </div>
          <div>
            <label className="form-label">{ar ? 'الوصف' : 'Description'} *</label>
            <input {...register('description', { required: true })} className="form-input" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">{ar ? 'الفئة' : 'Category'}</label>
              <input {...register('category')} className="form-input" placeholder={ar ? 'مثال: مواد بناء' : 'e.g. Building Materials'} />
            </div>
            <div>
              <label className="form-label">{ar ? 'حد الإنذار' : 'Min Stock Alert'}</label>
              <input type="number" step="any" {...register('minStock', { min: 0 })} className="form-input" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">{ar ? 'إلغاء' : 'Cancel'}</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Spinner size="sm" /> : (ar ? 'حفظ' : 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemCardModal({ itemId, onClose, lang }) {
  const ar = lang === 'ar';
  const { data: item, isLoading } = useQuery({
    queryKey: ['warehouse-item-card', itemId],
    queryFn: () => warehouseApi.getItem(itemId).then(r => r.data?.data ?? r.data),
  });
  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto shadow-2xl">
        <div className="modal-header">
          <div>
            <h2 className="font-bold text-gray-800">{ar ? 'كرت الصنف' : 'Item Card'}</h2>
            {item && <p className="text-xs text-blue-600 font-mono">{item.itemCode} — {item.description}</p>}
          </div>
          <button onClick={onClose} className="modal-close-btn"><XCircle size={20} /></button>
        </div>
        {isLoading ? <div className="flex justify-center py-10"><Spinner /></div> : (
          <div className="p-5 space-y-4">
            {/* Stock Info */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500">{ar ? 'الرصيد الجاري' : 'Current Stock'}</p>
                <p className="text-2xl font-bold text-gray-800">{item?.currentStock?.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{item?.unit}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-xs text-green-600">{ar ? 'إجمالي الوارد' : 'Total In'}</p>
                <p className="text-xl font-bold text-green-700">
                  {item?.transactions?.filter(t => t.type === 'In').reduce((s, t) => s + t.quantity, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-xs text-red-600">{ar ? 'إجمالي الصادر' : 'Total Out'}</p>
                <p className="text-xl font-bold text-red-700">
                  {item?.transactions?.filter(t => t.type === 'Out').reduce((s, t) => s + t.quantity, 0).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Transactions Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-3 py-2 text-right">{ar ? 'التاريخ' : 'Date'}</th>
                    <th className="px-3 py-2 text-right">{ar ? 'النوع' : 'Type'}</th>
                    <th className="px-3 py-2 text-right">{ar ? 'المرجع' : 'Reference'}</th>
                    <th className="px-3 py-2 text-right">{ar ? 'الكمية' : 'Qty'}</th>
                    <th className="px-3 py-2 text-right">{ar ? 'سعر الوحدة' : 'Unit Price'}</th>
                    <th className="px-3 py-2 text-right">{ar ? 'الإجمالي' : 'Total'}</th>
                    <th className="px-3 py-2 text-right">{ar ? 'الرصيد بعد' : 'Balance'}</th>
                  </tr>
                </thead>
                <tbody>
                  {item?.transactions?.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-6 text-gray-400">{ar ? 'لا توجد حركات' : 'No transactions'}</td></tr>
                  ) : (
                    item?.transactions?.map(t => (
                      <tr key={t.id} className="border-t border-gray-100">
                        <td className="px-3 py-2 text-xs text-gray-500">{new Date(t.transactionDate).toLocaleDateString('ar-EG')}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${t.type === 'In' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {t.type === 'In' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                            {t.type === 'In' ? (ar ? 'وارد' : 'In') : (ar ? 'صادر' : 'Out')}
                          </span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-blue-600">{t.referenceNumber}</td>
                        <td className="px-3 py-2 font-medium">{t.quantity.toLocaleString()}</td>
                        <td className="px-3 py-2 text-gray-500">{fmt(t.unitPrice)}</td>
                        <td className="px-3 py-2">{fmt(t.totalAmount)}</td>
                        <td className="px-3 py-2 font-bold text-gray-700">{t.balanceAfter.toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
