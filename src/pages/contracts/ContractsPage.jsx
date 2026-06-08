import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  Plus,
  FileSignature,
  Eye,
  PenLine,
  Trash2,
  Calendar,
  DollarSign,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { contractsApi, projectsApi, usersApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  Spinner,
  StatusBadge,
  ConfirmDialog,
  Pagination,
  Table,
  EmptyState,
  Modal,
  FormField,
} from '../../components/common/index';

const PAGE_SIZE = 10;

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatCurrency(v, currency = 'USD') {
  if (v == null) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(v);
}

// ── View Contract Modal ───────────────────────────────────────────────────────
function ViewContractModal({ contract, open, onClose }) {
  const { lang } = useLang();
  if (!contract) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={contract.title ?? (lang === 'ar' ? 'تفاصيل العقد' : 'Contract Details')}
      size="lg"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'العميل' : 'Client'}</p>
            <p className="font-medium text-gray-900">{contract.clientName ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'الحالة' : 'Status'}</p>
            <StatusBadge status={contract.status} />
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'القيمة' : 'Value'}</p>
            <p className="font-semibold text-gray-900">{formatCurrency(contract.value, contract.currency)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}</p>
            <p className="font-medium text-gray-900">{formatDate(contract.expiryDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'تاريخ التوقيع' : 'Signed Date'}</p>
            <p className="font-medium text-gray-900">{formatDate(contract.signedDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'المشروع' : 'Project'}</p>
            <p className="font-medium text-gray-900">{contract.projectName ?? '—'}</p>
          </div>
        </div>
        {contract.content && (
          <div>
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'محتوى العقد' : 'Contract Content'}</p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {contract.content}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Sign Contract Modal ───────────────────────────────────────────────────────
function SignContractModal({ contract, open, onClose }) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => contractsApi.sign(contract.id, data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم توقيع العقد بنجاح' : 'Contract signed successfully');
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل توقيع العقد' : 'Failed to sign contract')
      );
    },
  });

  if (!contract) return null;

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={lang === 'ar' ? 'توقيع العقد' : 'Sign Contract'}
      size="sm"
    >
      <form onSubmit={handleSubmit((d) => mutate({ signatureText: d.signatureText }))} className="space-y-4" noValidate>
        <p className="text-sm text-gray-600">
          {lang === 'ar'
            ? `أنت على وشك توقيع عقد "${contract.title}". أدخل نص توقيعك للمتابعة.`
            : `You are about to sign "${contract.title}". Enter your signature text to proceed.`}
        </p>

        <FormField
          label={lang === 'ar' ? 'نص التوقيع' : 'Signature Text'}
          required
          error={errors.signatureText?.message}
        >
          <input
            type="text"
            className={`input ${errors.signatureText ? 'border-red-400' : ''}`}
            placeholder={lang === 'ar' ? 'اكتب اسمك كتوقيع' : 'Type your name as signature'}
            {...register('signatureText', {
              required: lang === 'ar' ? 'التوقيع مطلوب' : 'Signature is required',
              minLength: { value: 2, message: 'Signature too short' },
            })}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="btn-secondary text-sm px-4 py-2"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
          >
            {isPending ? <Spinner size="sm" /> : (lang === 'ar' ? 'توقيع' : 'Sign')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Create Contract Modal ─────────────────────────────────────────────────────
function CreateContractModal({ open, onClose }) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { currency: 'USD' } });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-dropdown'],
    queryFn: () => projectsApi.getAll({ pageSize: 100 }).then((r) => r.data?.data ?? r.data),
    enabled: open,
    staleTime: 120_000,
  });
  const projects = projectsData?.items ?? projectsData?.projects ?? projectsData?.data ?? [];

  const { data: clientsData } = useQuery({
    queryKey: ['clients-dropdown'],
    queryFn: () => usersApi.getAll({ role: 'Client', pageSize: 100 }).then((r) => r.data?.data ?? r.data),
    enabled: open,
    staleTime: 120_000,
  });
  const clients = clientsData?.items ?? clientsData?.users ?? clientsData?.data ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => contractsApi.create(data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم إنشاء العقد' : 'Contract created');
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل إنشاء العقد' : 'Failed to create contract')
      );
    },
  });

  const onSubmit = (data) => {
    mutate({
      title:        data.title,
      content:      data.content,
      projectId:    data.projectId    || undefined,
      clientUserId: data.clientUserId || undefined,
      value:        data.value        ? Number(data.value) : undefined,
      currency:     data.currency     || 'EGP',
      endDate:      data.expiryDate   || undefined,  // backend field is endDate
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={lang === 'ar' ? 'إنشاء عقد جديد' : 'Create New Contract'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField
              label={lang === 'ar' ? 'عنوان العقد' : 'Contract Title'}
              required
              error={errors.title?.message}
            >
              <input
                type="text"
                className={`input ${errors.title ? 'border-red-400' : ''}`}
                placeholder={lang === 'ar' ? 'أدخل عنوان العقد' : 'Enter contract title'}
                {...register('title', {
                  required: lang === 'ar' ? 'العنوان مطلوب' : 'Title is required',
                })}
              />
            </FormField>
          </div>

          <FormField label={lang === 'ar' ? 'العميل' : 'Client'} error={errors.clientUserId?.message}>
            <select className="input" {...register('clientUserId', { required: lang === 'ar' ? 'العميل مطلوب' : 'Client required' })}>
              <option value="">{lang === 'ar' ? 'اختر عميل' : 'Select client'}</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.fullName ?? c.name ?? c.email}</option>
              ))}
            </select>
          </FormField>

          <FormField label={lang === 'ar' ? 'المشروع' : 'Project'}>
            <select className="input" {...register('projectId')}>
              <option value="">{lang === 'ar' ? 'اختر مشروع' : 'Select project'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label={lang === 'ar' ? 'القيمة' : 'Value'}>
            <input
              type="number"
              min="0"
              step="0.01"
              className="input"
              placeholder="0.00"
              {...register('value')}
            />
          </FormField>

          <FormField label={lang === 'ar' ? 'العملة' : 'Currency'}>
            <select className="input" {...register('currency')}>
              <option value="EGP">EGP — جنيه مصري</option>
              <option value="USD">USD — دولار أمريكي</option>
              <option value="EUR">EUR — يورو</option>
              <option value="GBP">GBP — جنيه إسترليني</option>
              <option value="SAR">SAR — ريال سعودي</option>
              <option value="AED">AED — درهم إماراتي</option>
              <option value="KWD">KWD — دينار كويتي</option>
              <option value="QAR">QAR — ريال قطري</option>
            </select>
          </FormField>

          <FormField
            label={lang === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
            error={errors.expiryDate?.message}
          >
            <input type="date" className="input" {...register('expiryDate')} />
          </FormField>
        </div>

        <FormField
          label={lang === 'ar' ? 'محتوى العقد' : 'Contract Content'}
          error={errors.content?.message}
        >
          <textarea
            rows={5}
            className="input resize-none"
            placeholder={lang === 'ar' ? 'أدخل بنود العقد...' : 'Enter contract terms and conditions...'}
            {...register('content')}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="btn-secondary text-sm px-4 py-2"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
          >
            {isPending ? <Spinner size="sm" /> : (lang === 'ar' ? 'إنشاء العقد' : 'Create Contract')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ContractsPage() {
  const { t, lang, isRTL } = useLang();
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [signTarget, setSignTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', page],
    queryFn: () =>
      contractsApi
        .getAll({ page, pageSize: PAGE_SIZE })
        .then((r) => r.data?.data ?? r.data),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const contracts = data?.items ?? data?.contracts ?? data?.data ?? [];
  const totalPages = data?.totalPages ?? Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE) ?? 1;

  const { mutate: approveContract } = useMutation({
    mutationFn: (id) => contractsApi.approve(id),
    onSuccess: () => { toast.success(lang === 'ar' ? 'تمت الموافقة على العقد' : 'Contract approved'); queryClient.invalidateQueries({ queryKey: ['contracts'] }); },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'خطأ'),
  });

  const { mutate: rejectContract } = useMutation({
    mutationFn: (id) => contractsApi.reject(id, { note: 'مرفوض' }),
    onSuccess: () => { toast.success(lang === 'ar' ? 'تم رفض العقد' : 'Contract rejected'); queryClient.invalidateQueries({ queryKey: ['contracts'] }); },
    onError: (err) => toast.error(err?.response?.data?.message ?? 'خطأ'),
  });

  const { mutate: deleteContract, isPending: isDeleting } = useMutation({
    mutationFn: (id) => contractsApi.delete(id),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم حذف العقد' : 'Contract deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل حذف العقد' : 'Failed to delete contract')
      );
    },
  });

  const headers = [
    lang === 'ar' ? 'العنوان' : 'Title',
    lang === 'ar' ? 'العميل' : 'Client',
    t('status'),
    lang === 'ar' ? 'تاريخ التوقيع' : 'Signed Date',
    lang === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date',
    lang === 'ar' ? 'القيمة' : 'Value',
    t('actions'),
  ];

  const isExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const diff = new Date(expiryDate) - new Date();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('contracts')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar' ? 'إدارة العقود والاتفاقيات' : 'Manage contracts and agreements'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            <Plus size={16} />
            {lang === 'ar' ? 'عقد جديد' : 'New Contract'}
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <Table
          headers={headers}
          loading={isLoading}
          empty={
            contracts.length === 0 && !isLoading ? (
              <EmptyState
                icon={FileSignature}
                title={lang === 'ar' ? 'لا توجد عقود' : 'No contracts found'}
                description={
                  lang === 'ar'
                    ? 'ابدأ بإنشاء أول عقد'
                    : 'Start by creating your first contract'
                }
                action={isAdmin ? (
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="btn-primary text-sm px-4 py-2 mt-3"
                  >
                    {lang === 'ar' ? 'إنشاء عقد' : 'Create Contract'}
                  </button>
                ) : null}
              />
            ) : null
          }
        >
          {contracts.map((contract) => {
            const expiringSoon = isExpiringSoon(contract.expiryDate);
            const expired = contract.expiryDate && new Date(contract.expiryDate) < new Date();

            return (
              <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {/* Title */}
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <FileSignature size={13} className="text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                      {contract.title}
                    </span>
                  </div>
                </td>
                {/* Client */}
                <td className="table-cell">
                  <span className="text-sm text-gray-700">{contract.clientName ?? '—'}</span>
                </td>
                {/* Status */}
                <td className="table-cell">
                  <StatusBadge status={contract.status} />
                </td>
                {/* Signed Date */}
                <td className="table-cell">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar size={13} className="text-gray-400" />
                    {formatDate(contract.signedDate)}
                  </div>
                </td>
                {/* Expiry Date */}
                <td className="table-cell">
                  <div className={`flex items-center gap-1 text-sm ${expired ? 'text-red-600' : expiringSoon ? 'text-yellow-600' : 'text-gray-500'}`}>
                    <Calendar size={13} className={expired ? 'text-red-400' : expiringSoon ? 'text-yellow-400' : 'text-gray-400'} />
                    {formatDate(contract.expiryDate)}
                    {expiringSoon && !expired && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 rounded px-1 py-0.5">
                        {lang === 'ar' ? 'قريباً' : 'Soon'}
                      </span>
                    )}
                    {expired && (
                      <span className="text-xs bg-red-100 text-red-700 rounded px-1 py-0.5">
                        {lang === 'ar' ? 'منتهي' : 'Expired'}
                      </span>
                    )}
                  </div>
                </td>
                {/* Value */}
                <td className="table-cell">
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                    <DollarSign size={13} className="text-gray-400" />
                    {formatCurrency(contract.value, contract.currency)}
                  </div>
                </td>
                {/* Actions */}
                <td className="table-cell">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewTarget(contract)}
                      className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                      title={t('view')}
                    >
                      <Eye size={15} />
                    </button>
                    {contract.status !== 'Signed' && (
                      <button
                        onClick={() => setSignTarget(contract)}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                        title={lang === 'ar' ? 'توقيع' : 'Sign'}
                      >
                        <PenLine size={15} />
                      </button>
                    )}
                    {/* Approval */}
                    {isAdmin && contract.approvalStatus === 'Pending' && (
                      <>
                        <button
                          onClick={() => approveContract(contract.id)}
                          className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                          title={lang === 'ar' ? 'موافقة' : 'Approve'}
                        >
                          <ThumbsUp size={15} />
                        </button>
                        <button
                          onClick={() => { if (confirm(lang === 'ar' ? 'رفض العقد؟' : 'Reject contract?')) rejectContract(contract.id); }}
                          className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors"
                          title={lang === 'ar' ? 'رفض' : 'Reject'}
                        >
                          <ThumbsDown size={15} />
                        </button>
                      </>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteTarget(contract)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title={t('delete')}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateContractModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ViewContractModal contract={viewTarget} open={!!viewTarget} onClose={() => setViewTarget(null)} />
      <SignContractModal contract={signTarget} open={!!signTarget} onClose={() => setSignTarget(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteContract(deleteTarget?.id)}
        loading={isDeleting}
        title={lang === 'ar' ? 'حذف العقد' : 'Delete Contract'}
        message={
          lang === 'ar'
            ? `هل أنت متأكد من حذف العقد "${deleteTarget?.title}"؟`
            : `Are you sure you want to delete "${deleteTarget?.title}"?`
        }
      />
    </div>
  );
}
