import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  FolderOpen,
  Users,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { projectsApi, usersApi } from '../../api/index';
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
import { useForm } from 'react-hook-form';

const PAGE_SIZE = 10;

// Must match ProjectStatus enum: Planning=0, Active=1, OnHold=2, Completed=3, Cancelled=4
const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Planning',  label: 'Planning' },
  { value: 'Active',    label: 'Active' },
  { value: 'OnHold',    label: 'On Hold' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

// Must match ProjectPriority enum: Low=0, Medium=1, High=2, Urgent=3
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', SAR: 'SR', AED: 'AED', EGP: 'E£' };

function formatCurrency(v, currency = 'EGP') {
  if (v == null) return '—';
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${sym}${(v / 1_000).toFixed(1)}K`;
  return `${sym}${v}`;
}

// ── Create Project Modal ──────────────────────────────────────────────────────
function CreateProjectModal({ open, onClose }) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // جلب أعضاء الشركة لاختيار المدير والعميل
  const { data: usersRaw } = useQuery({
    queryKey: ['company-users'],
    queryFn: () => usersApi.getAll().then((r) => r.data?.data ?? r.data),
    enabled: open,
    staleTime: 60_000,
  });
  const companyUsers = Array.isArray(usersRaw) ? usersRaw : usersRaw?.items ?? [];
  const clientUsers  = companyUsers.filter(u => u.role === 'Client');
  const managerUsers = companyUsers.filter(u => ['Admin','Manager','Consultant','CompanyUser'].includes(u.role));

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => projectsApi.create(data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم إنشاء المشروع بنجاح' : 'Project created successfully');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      reset();
      onClose();
    },
    onError: (err) => {
      const serverMsg = err?.response?.data?.message;
      const fieldErrors = err?.response?.data?.errors;
      const msg = fieldErrors?.length
        ? fieldErrors[0]
        : serverMsg || (lang === 'ar' ? 'فشل إنشاء المشروع' : 'Failed to create project');
      toast.error(msg);
    },
  });

  const onSubmit = (data) => {
    mutate({
      name:          data.name,
      description:   data.description || undefined,
      clientUserId:  data.clientUserId  || undefined,
      managerUserId: data.managerUserId || undefined,
      priority:      data.priority,
      budget:        data.budget ? Number(data.budget) : undefined,
      currency:      data.currency || 'EGP',
      startDate:     data.startDate,
      endDate:       data.endDate || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={lang === 'ar' ? 'إنشاء مشروع جديد' : 'Create New Project'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* اسم المشروع — مطلوب */}
          <FormField
            label={lang === 'ar' ? 'اسم المشروع' : 'Project Name'}
            required
            error={errors.name?.message}
          >
            <input
              type="text"
              className={`input ${errors.name ? 'border-red-400' : ''}`}
              {...register('name', {
                required: lang === 'ar' ? 'اسم المشروع مطلوب' : 'Project name is required',
              })}
            />
          </FormField>

          {/* الأولوية */}
          <FormField label={lang === 'ar' ? 'الأولوية' : 'Priority'}>
            <select className="input" {...register('priority')}>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>

          {/* مدير المشروع */}
          <FormField label={lang === 'ar' ? 'مدير المشروع' : 'Project Manager'}>
            <select className="input" {...register('managerUserId')}>
              <option value="">{lang === 'ar' ? '— بدون مدير —' : '— No manager —'}</option>
              {managerUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName ?? u.name} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          {/* العميل */}
          <FormField label={lang === 'ar' ? 'العميل' : 'Client'}>
            <select className="input" {...register('clientUserId')}>
              <option value="">{lang === 'ar' ? '— بدون عميل —' : '— No client —'}</option>
              {(clientUsers.length > 0 ? clientUsers : companyUsers).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName ?? u.name} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          {/* تاريخ البداية — مطلوب */}
          <FormField
            label={lang === 'ar' ? 'تاريخ البداية' : 'Start Date'}
            required
            error={errors.startDate?.message}
          >
            <input
              type="date"
              className={`input ${errors.startDate ? 'border-red-400' : ''}`}
              {...register('startDate', {
                required: lang === 'ar' ? 'تاريخ البداية مطلوب' : 'Start date is required',
              })}
            />
          </FormField>

          {/* تاريخ النهاية */}
          <FormField label={lang === 'ar' ? 'تاريخ النهاية' : 'End Date'} error={errors.endDate?.message}>
            <input type="date" className="input" {...register('endDate')} />
          </FormField>

          {/* الميزانية */}
          <FormField label={lang === 'ar' ? 'الميزانية' : 'Budget'} error={errors.budget?.message}>
            <input type="number" min="0" step="0.01" className="input" placeholder="0" {...register('budget')} />
          </FormField>

          {/* العملة */}
          <FormField label={lang === 'ar' ? 'العملة' : 'Currency'}>
            <select className="input" {...register('currency')}>
              <option value="EGP">EGP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="SAR">SAR</option>
              <option value="AED">AED</option>
            </select>
          </FormField>
        </div>

        <FormField
          label={lang === 'ar' ? 'الوصف' : 'Description'}
          error={errors.description?.message}
        >
          <textarea
            rows={3}
            className="input resize-none"
            placeholder={lang === 'ar' ? 'وصف المشروع (اختياري)' : 'Project description (optional)'}
            {...register('description')}
          />
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => { reset(); onClose(); }} className="btn-secondary text-sm px-4 py-2">
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button type="submit" disabled={isPending} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            {isPending ? <Spinner size="sm" /> : (lang === 'ar' ? 'إنشاء المشروع' : 'Create Project')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { t, lang, isRTL } = useLang();
  const { isAdmin, canCreate } = usePermissions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', page, search, status],
    queryFn: () =>
      projectsApi
        .getAll({ page, pageSize: PAGE_SIZE, search: search || undefined, status: status || undefined })
        .then((r) => r.data?.data ?? r.data),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const projects = data?.items ?? data?.projects ?? data?.data ?? [];
  const totalPages = data?.totalPages ?? Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE) ?? 1;

  const { mutate: deleteProject, isPending: isDeleting } = useMutation({
    mutationFn: (id) => projectsApi.delete(id),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم حذف المشروع' : 'Project deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل حذف المشروع' : 'Failed to delete project')
      );
    },
  });

  const headers = [
    lang === 'ar' ? 'المشروع' : 'Project',
    t('status'),
    lang === 'ar' ? 'الأولوية' : 'Priority',
    lang === 'ar' ? 'العميل' : 'Client',
    lang === 'ar' ? 'المهام' : 'Tasks',
    lang === 'ar' ? 'الأعضاء' : 'Members',
    lang === 'ar' ? 'الميزانية' : 'Budget',
    lang === 'ar' ? 'البداية' : 'Start',
    lang === 'ar' ? 'النهاية' : 'End',
    t('actions'),
  ];

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('projects')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar' ? 'إدارة جميع مشاريعك' : 'Manage all your projects'}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setCreateOpen(true)}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            <Plus size={16} />
            {lang === 'ar' ? 'مشروع جديد' : 'New Project'}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            className="input ps-9 text-sm"
            placeholder={lang === 'ar' ? 'بحث في المشاريع...' : 'Search projects...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input text-sm w-full sm:w-48"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <Table
          headers={headers}
          loading={isLoading}
          empty={
            projects.length === 0 && !isLoading ? (
              <EmptyState
                icon={FolderOpen}
                title={lang === 'ar' ? 'لا توجد مشاريع' : 'No projects found'}
                description={
                  lang === 'ar'
                    ? 'ابدأ بإنشاء أول مشروع لك'
                    : 'Start by creating your first project'
                }
                action={canCreate ? (
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="btn-primary text-sm px-4 py-2 mt-3"
                  >
                    {lang === 'ar' ? 'إنشاء مشروع' : 'Create Project'}
                  </button>
                ) : null}
              />
            ) : null
          }
        >
          {projects.map((project) => (
            <tr key={project.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              {/* Name */}
              <td className="table-cell">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <FolderOpen size={14} className="text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <Link
                      to={`/projects/${project.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-primary-600 truncate block max-w-[160px]"
                    >
                      {project.name}
                    </Link>
                    {project.managerName && (
                      <p className="text-xs text-gray-400 truncate">{project.managerName}</p>
                    )}
                  </div>
                </div>
              </td>
              {/* Status */}
              <td className="table-cell">
                <StatusBadge status={project.status} />
              </td>
              {/* Priority */}
              <td className="table-cell">
                <StatusBadge status={project.priority} />
              </td>
              {/* Client */}
              <td className="table-cell">
                <span className="text-sm text-gray-700">{project.clientName || '—'}</span>
              </td>
              {/* Tasks */}
              <td className="table-cell">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <CheckSquare size={13} className="text-gray-400" />
                  {project.totalTasks ?? project.tasksCount ?? '—'}
                </div>
              </td>
              {/* Members */}
              <td className="table-cell">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users size={13} className="text-gray-400" />
                  {project.memberCount ?? project.membersCount ?? '—'}
                </div>
              </td>
              {/* Budget */}
              <td className="table-cell">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <DollarSign size={13} className="text-gray-400" />
                  {formatCurrency(project.budget, project.currency)}
                </div>
              </td>
              {/* Start Date */}
              <td className="table-cell">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar size={13} className="text-gray-400" />
                  {formatDate(project.startDate)}
                </div>
              </td>
              {/* End Date */}
              <td className="table-cell">
                <span className="text-sm text-gray-500">{formatDate(project.endDate)}</span>
              </td>
              {/* Actions */}
              <td className="table-cell">
                <div className="flex items-center gap-1">
                  <Link
                    to={`/projects/${project.id}`}
                    className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                    title={t('view')}
                  >
                    <Eye size={15} />
                  </Link>
                  {isAdmin && (
                    <Link
                      to={`/projects/${project.id}`}
                      className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors"
                      title={t('edit')}
                    >
                      <Pencil size={15} />
                    </Link>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setDeleteTarget(project)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100">
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteProject(deleteTarget?.id)}
        loading={isDeleting}
        title={lang === 'ar' ? 'حذف المشروع' : 'Delete Project'}
        message={
          lang === 'ar'
            ? `هل أنت متأكد من حذف المشروع "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`
        }
      />
    </div>
  );
}

// Local icon reuse helper (avoid repeated import)
function CheckSquare({ size, className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}
