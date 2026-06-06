import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  Plus,
  FileText,
  DollarSign,
  Send,
  CreditCard,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { invoicesApi, projectsApi, usersApi } from '../../api/index';
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
  StatCard,
} from '../../components/common/index';

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Sent', label: 'Sent' },
  { value: 'Paid', label: 'Paid' },
  { value: 'PartiallyPaid', label: 'Partially Paid' },
  { value: 'Overdue', label: 'Overdue' },
];

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

// ── View Invoice Modal ────────────────────────────────────────────────────────
function ViewInvoiceModal({ invoice, open, onClose }) {
  const { lang } = useLang();
  if (!invoice) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${lang === 'ar' ? 'فاتورة' : 'Invoice'} #${invoice.invoiceNumber ?? invoice.id}`}
      size="md"
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500 text-xs">{lang === 'ar' ? 'العميل' : 'Client'}</p>
            <p className="font-medium text-gray-900">{invoice.clientName ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{lang === 'ar' ? 'المشروع' : 'Project'}</p>
            <p className="font-medium text-gray-900">{invoice.projectName ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{lang === 'ar' ? 'المبلغ' : 'Amount'}</p>
            <p className="font-semibold text-gray-900">{formatCurrency(invoice.amount, invoice.currency)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{lang === 'ar' ? 'الحالة' : 'Status'}</p>
            <StatusBadge status={invoice.status} />
          </div>
          <div>
            <p className="text-gray-500 text-xs">{lang === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}</p>
            <p className="font-medium text-gray-900">{formatDate(invoice.issueDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs">{lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}</p>
            <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
          </div>
        </div>
        {invoice.notes && (
          <div>
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'ملاحظات' : 'Notes'}</p>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{invoice.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ── Create Invoice Modal ──────────────────────────────────────────────────────
function CreateInvoiceModal({ open, onClose }) {
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
    mutationFn: (data) => invoicesApi.create(data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم إنشاء الفاتورة' : 'Invoice created');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل إنشاء الفاتورة' : 'Failed to create invoice')
      );
    },
  });

  const onSubmit = (data) => {
    mutate({
      projectId:    data.projectId    || undefined,
      clientUserId: data.clientUserId || undefined,
      currency:     data.currency     || 'EGP',
      taxRate:      data.taxRate      ? Number(data.taxRate)  : 0,
      dueDate:      data.dueDate      || undefined,
      notes:        data.notes        || undefined,
      items: [{
        description: data.itemDescription || 'خدمة استشارية',
        quantity:    1,
        unitPrice:   data.amount ? Number(data.amount) : 0,
      }],
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={lang === 'ar' ? 'إنشاء فاتورة جديدة' : 'Create New Invoice'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          <FormField
            label={lang === 'ar' ? 'المبلغ' : 'Amount'}
            required
            error={errors.amount?.message}
          >
            <input
              type="number"
              min="0"
              step="0.01"
              className={`input ${errors.amount ? 'border-red-400' : ''}`}
              placeholder="0.00"
              {...register('amount', {
                required: lang === 'ar' ? 'المبلغ مطلوب' : 'Amount is required',
                min: { value: 0, message: 'Amount must be positive' },
              })}
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

          <FormField label={lang === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}>
            <input type="date" className="input" {...register('issueDate')} />
          </FormField>

          <FormField label={lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}>
            <input type="date" className="input" {...register('dueDate')} />
          </FormField>

          <FormField label={lang === 'ar' ? 'نسبة الضريبة (%)' : 'Tax Rate (%)'}>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              className="input"
              placeholder="0"
              {...register('taxRate')}
            />
          </FormField>
        </div>

        <FormField label={lang === 'ar' ? 'ملاحظات' : 'Notes'}>
          <textarea
            rows={3}
            className="input resize-none"
            {...register('notes')}
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
            {isPending ? <Spinner size="sm" /> : (lang === 'ar' ? 'إنشاء الفاتورة' : 'Create Invoice')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Pay Modal ─────────────────────────────────────────────────────────────────
function PayModal({ invoice, open, onClose }) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => invoicesApi.recordPayment(invoice.id, data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم تسجيل الدفعة' : 'Payment recorded');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل تسجيل الدفعة' : 'Failed to record payment')
      );
    },
  });

  if (!invoice) return null;

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={lang === 'ar' ? 'تسجيل دفعة' : 'Record Payment'}
      size="sm"
    >
      <form onSubmit={handleSubmit((d) => mutate({ amount: Number(d.amount) }))} className="space-y-4" noValidate>
        <p className="text-sm text-gray-500">
          {lang === 'ar' ? 'المبلغ الإجمالي:' : 'Total amount:'}{' '}
          <span className="font-semibold text-gray-900">
            {formatCurrency(invoice.amount, invoice.currency)}
          </span>
        </p>

        <FormField
          label={lang === 'ar' ? 'مبلغ الدفعة' : 'Payment Amount'}
          required
          error={errors.amount?.message}
        >
          <input
            type="number"
            min="0.01"
            step="0.01"
            className={`input ${errors.amount ? 'border-red-400' : ''}`}
            placeholder="0.00"
            defaultValue={invoice.amount}
            {...register('amount', {
              required: lang === 'ar' ? 'المبلغ مطلوب' : 'Amount is required',
              min: { value: 0.01, message: 'Must be positive' },
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
            {isPending ? <Spinner size="sm" /> : (lang === 'ar' ? 'تأكيد الدفع' : 'Confirm Payment')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const { t, lang, isRTL } = useLang();
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [viewTarget, setViewTarget] = useState(null);
  const [payTarget, setPayTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', page, status],
    queryFn: () =>
      invoicesApi
        .getAll({ page, pageSize: PAGE_SIZE, status: status || undefined })
        .then((r) => r.data?.data ?? r.data),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const invoices = data?.items ?? data?.invoices ?? data?.data ?? [];
  const totalPages = data?.totalPages ?? Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE) ?? 1;

  const summary = data?.summary ?? {};
  const totalInvoiced = summary.totalInvoiced ?? invoices.reduce((acc, inv) => acc + (inv.amount ?? 0), 0);
  const totalPaid = summary.totalPaid ?? invoices.filter((i) => i.status === 'Paid').reduce((acc, i) => acc + (i.amount ?? 0), 0);
  const totalPending = summary.totalPending ?? invoices.filter((i) => ['Draft', 'Sent'].includes(i.status)).reduce((acc, i) => acc + (i.amount ?? 0), 0);
  const totalOverdue = summary.totalOverdue ?? invoices.filter((i) => i.status === 'Overdue').reduce((acc, i) => acc + (i.amount ?? 0), 0);

  const { mutate: sendInvoice, isPending: isSending } = useMutation({
    mutationFn: (id) => invoicesApi.send(id),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم إرسال الفاتورة' : 'Invoice sent');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل إرسال الفاتورة' : 'Failed to send invoice')
      );
    },
  });

  const { mutate: deleteInvoice, isPending: isDeleting } = useMutation({
    mutationFn: (id) => invoicesApi.delete(id),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم حذف الفاتورة' : 'Invoice deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل حذف الفاتورة' : 'Failed to delete invoice')
      );
    },
  });

  const headers = [
    lang === 'ar' ? 'رقم الفاتورة' : 'Invoice #',
    lang === 'ar' ? 'العميل' : 'Client',
    lang === 'ar' ? 'المشروع' : 'Project',
    lang === 'ar' ? 'المبلغ' : 'Amount',
    t('status'),
    lang === 'ar' ? 'الاستحقاق' : 'Due Date',
    t('actions'),
  ];

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('invoices')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar' ? 'إدارة فواتيرك والمدفوعات' : 'Manage your invoices and payments'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            <Plus size={16} />
            {lang === 'ar' ? 'فاتورة جديدة' : 'New Invoice'}
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={lang === 'ar' ? 'إجمالي الفواتير' : 'Total Invoiced'}
          value={formatCurrency(totalInvoiced)}
          icon={TrendingUp}
          color="primary"
          loading={isLoading}
        />
        <StatCard
          title={lang === 'ar' ? 'المدفوع' : 'Total Paid'}
          value={formatCurrency(totalPaid)}
          icon={CheckCircle}
          color="green"
          loading={isLoading}
        />
        <StatCard
          title={lang === 'ar' ? 'قيد الانتظار' : 'Pending'}
          value={formatCurrency(totalPending)}
          icon={Clock}
          color="yellow"
          loading={isLoading}
        />
        <StatCard
          title={lang === 'ar' ? 'متأخر السداد' : 'Overdue'}
          value={formatCurrency(totalOverdue)}
          icon={AlertCircle}
          color="red"
          loading={isLoading}
        />
      </div>

      {/* Filter */}
      <div className="card p-4">
        <select
          className="input text-sm w-full sm:w-48"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <Table
          headers={headers}
          loading={isLoading}
          empty={
            invoices.length === 0 && !isLoading ? (
              <EmptyState
                icon={FileText}
                title={lang === 'ar' ? 'لا توجد فواتير' : 'No invoices found'}
                description={
                  lang === 'ar'
                    ? 'ابدأ بإنشاء أول فاتورة'
                    : 'Start by creating your first invoice'
                }
                action={isAdmin ? (
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="btn-primary text-sm px-4 py-2 mt-3"
                  >
                    {lang === 'ar' ? 'إنشاء فاتورة' : 'Create Invoice'}
                  </button>
                ) : null}
              />
            ) : null
          }
        >
          {invoices.map((invoice) => {
            const overdue = invoice.status === 'Overdue' ||
              (invoice.dueDate && new Date(invoice.dueDate) < new Date() && !['Paid'].includes(invoice.status));
            return (
              <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {/* Invoice # */}
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <FileText size={13} className="text-blue-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      #{invoice.invoiceNumber ?? invoice.id?.slice(0, 8)}
                    </span>
                  </div>
                </td>
                {/* Client */}
                <td className="table-cell">
                  <span className="text-sm text-gray-700">{invoice.clientName ?? '—'}</span>
                </td>
                {/* Project */}
                <td className="table-cell">
                  <span className="text-sm text-gray-600 truncate max-w-[120px] block">
                    {invoice.projectName ?? '—'}
                  </span>
                </td>
                {/* Amount */}
                <td className="table-cell">
                  <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <DollarSign size={13} className="text-gray-400" />
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </div>
                </td>
                {/* Status */}
                <td className="table-cell">
                  <StatusBadge status={invoice.status} />
                </td>
                {/* Due Date */}
                <td className="table-cell">
                  <span className={`text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    {formatDate(invoice.dueDate)}
                  </span>
                </td>
                {/* Actions */}
                <td className="table-cell">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewTarget(invoice)}
                      className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                      title={t('view')}
                    >
                      <Eye size={15} />
                    </button>
                    {isAdmin && invoice.status === 'Draft' && (
                      <button
                        onClick={() => sendInvoice(invoice.id)}
                        disabled={isSending}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                        title={lang === 'ar' ? 'إرسال' : 'Send'}
                      >
                        <Send size={15} />
                      </button>
                    )}
                    {isAdmin && ['Sent', 'Overdue', 'PartiallyPaid'].includes(invoice.status) && (
                      <button
                        onClick={() => setPayTarget(invoice)}
                        className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors"
                        title={lang === 'ar' ? 'تسجيل دفعة' : 'Record Payment'}
                      >
                        <CreditCard size={15} />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => setDeleteTarget(invoice)}
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
      <CreateInvoiceModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ViewInvoiceModal invoice={viewTarget} open={!!viewTarget} onClose={() => setViewTarget(null)} />
      <PayModal invoice={payTarget} open={!!payTarget} onClose={() => setPayTarget(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteInvoice(deleteTarget?.id)}
        loading={isDeleting}
        title={lang === 'ar' ? 'حذف الفاتورة' : 'Delete Invoice'}
        message={
          lang === 'ar'
            ? `هل أنت متأكد من حذف الفاتورة #${deleteTarget?.invoiceNumber ?? deleteTarget?.id?.slice(0, 8)}؟`
            : `Are you sure you want to delete invoice #${deleteTarget?.invoiceNumber ?? deleteTarget?.id?.slice(0, 8)}?`
        }
      />
    </div>
  );
}
