import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  CheckSquare,
  Calendar,
  Clock,
  User,
} from 'lucide-react';
import { tasksApi, projectsApi, usersApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  Spinner,
  PageLoader,
  StatusBadge,
  ConfirmDialog,
  Pagination,
  Table,
  EmptyState,
  Modal,
  FormField,
} from '../../components/common/index';

const PAGE_SIZE = 15;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Todo', label: 'Todo' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'InReview', label: 'In Review' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
];

const PRIORITY_OPTIONS_FILTER = [
  { value: '', label: 'All Priorities' },
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Urgent', label: 'Urgent' },
];

// Must match ProjectTaskPriority enum: Low=0, Medium=1, High=2, Urgent=3
const PRIORITY_VALUES = ['Low', 'Medium', 'High', 'Urgent'];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(dueDate) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

// ── Create Task Modal ─────────────────────────────────────────────────────────
function CreateTaskModal({ open, onClose }) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { priority: 'Medium' } });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-dropdown'],
    queryFn: () => projectsApi.getAll({ pageSize: 100 }).then((r) => r.data?.data ?? r.data),
    enabled: open,
    staleTime: 120_000,
  });
  const projects = projectsData?.items ?? projectsData?.projects ?? projectsData?.data ?? [];

  const { data: usersData } = useQuery({
    queryKey: ['users-dropdown'],
    queryFn: () => usersApi.getAll().then((r) => r.data?.data ?? r.data),
    enabled: open,
    staleTime: 120_000,
  });
  const companyUsers = Array.isArray(usersData) ? usersData : usersData?.items ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => tasksApi.create(data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم إنشاء المهمة بنجاح' : 'Task created successfully');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل إنشاء المهمة' : 'Failed to create task')
      );
    },
  });

  const onSubmit = (data) => {
    mutate({
      title:          data.title,
      description:    data.description || undefined,
      projectId:      data.projectId,
      priority:       data.priority,
      dueDate:        data.dueDate || undefined,
      estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : 0,
      assignedToId:   data.assignedToId || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title={lang === 'ar' ? 'إنشاء مهمة جديدة' : 'Create New Task'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField
              label={lang === 'ar' ? 'عنوان المهمة' : 'Task Title'}
              required
              error={errors.title?.message}
            >
              <input
                type="text"
                className={`input ${errors.title ? 'border-red-400' : ''}`}
                placeholder={lang === 'ar' ? 'أدخل عنوان المهمة' : 'Enter task title'}
                {...register('title', {
                  required: lang === 'ar' ? 'عنوان المهمة مطلوب' : 'Task title is required',
                })}
              />
            </FormField>
          </div>

          <FormField
            label={lang === 'ar' ? 'المشروع' : 'Project'}
            required
            error={errors.projectId?.message}
          >
            <select
              className={`input ${errors.projectId ? 'border-red-400' : ''}`}
              {...register('projectId', {
                required: lang === 'ar' ? 'المشروع مطلوب' : 'Project is required',
              })}
            >
              <option value="">{lang === 'ar' ? 'اختر مشروع' : 'Select project'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FormField>

          <FormField
            label={lang === 'ar' ? 'المُسند إليه' : 'Assignee'}
            error={errors.assignedToId?.message}
          >
            <select className="input" {...register('assignedToId')}>
              <option value="">{lang === 'ar' ? 'بدون تعيين' : 'Unassigned'}</option>
              {companyUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName ?? u.name} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label={lang === 'ar' ? 'الأولوية' : 'Priority'}
            error={errors.priority?.message}
          >
            <select className="input" {...register('priority')}>
              {PRIORITY_VALUES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </FormField>

          <FormField
            label={lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}
            error={errors.dueDate?.message}
          >
            <input type="date" className="input" {...register('dueDate')} />
          </FormField>

          <FormField
            label={lang === 'ar' ? 'الساعات المقدرة' : 'Estimated Hours'}
            error={errors.estimatedHours?.message}
          >
            <input
              type="number"
              min="0"
              step="0.5"
              className="input"
              placeholder="0"
              {...register('estimatedHours')}
            />
          </FormField>
        </div>

        <FormField
          label={lang === 'ar' ? 'الوصف' : 'Description'}
          error={errors.description?.message}
        >
          <textarea
            rows={3}
            className="input resize-none"
            placeholder={lang === 'ar' ? 'وصف المهمة...' : 'Task description...'}
            {...register('description')}
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
            {isPending ? <Spinner size="sm" /> : (lang === 'ar' ? 'إنشاء المهمة' : 'Create Task')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Edit Task Modal ───────────────────────────────────────────────────────────
function EditTaskModal({ task, open, onClose }) {
  const { lang } = useLang();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // جلب التفاصيل الكاملة (description + assignedToId غير موجودين في قائمة المهام)
  const { data: fullTask, isLoading: loadingDetail } = useQuery({
    queryKey: ['task-detail', task?.id],
    queryFn: () => tasksApi.getById(task.id).then((r) => r.data?.data ?? r.data),
    enabled: open && !!task?.id,
    staleTime: 0,
  });

  // إعادة تعبئة الفورم لما تيجي البيانات
  useEffect(() => {
    if (fullTask) {
      reset({
        title:          fullTask.title ?? '',
        description:    fullTask.description ?? '',
        status:         fullTask.status ?? 'Todo',
        priority:       fullTask.priority ?? 'Medium',
        dueDate:        fullTask.dueDate ? fullTask.dueDate.split('T')[0] : '',
        estimatedHours: fullTask.estimatedHours ?? '',
        assignedToId:   fullTask.assignedToId?.toLowerCase() ?? '',
      });
    }
  }, [fullTask, reset]);

  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  const { data: usersData } = useQuery({
    queryKey: ['users-dropdown'],
    queryFn: () => usersApi.getAll().then((r) => r.data?.data ?? r.data),
    enabled: open && !isSuperAdmin,
    staleTime: 0,
    retry: false,
  });
  const companyUsers = Array.isArray(usersData) ? usersData : usersData?.items ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => tasksApi.update(task.id, data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم تحديث المهمة' : 'Task updated');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-detail', task.id] });
      onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message;
      toast.error(msg || (lang === 'ar' ? 'فشل تحديث المهمة' : 'Failed to update task'));
    },
  });

  const onSubmit = (data) => {
    mutate({
      title:          data.title,
      description:    data.description || undefined,
      projectId:      fullTask?.projectId ?? task.projectId,
      priority:       data.priority,
      status:         data.status,
      dueDate:        data.dueDate || undefined,
      estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : 0,
      assignedToId:   data.assignedToId || undefined,
    });
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={lang === 'ar' ? 'تعديل المهمة' : 'Edit Task'} size="lg">
      {loadingDetail ? (
        <div className="flex items-center justify-center py-12"><Spinner size="lg" /></div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label={lang === 'ar' ? 'عنوان المهمة' : 'Task Title'} required error={errors.title?.message}>
                <input type="text" className={`input ${errors.title ? 'border-red-400' : ''}`}
                  {...register('title', { required: lang === 'ar' ? 'العنوان مطلوب' : 'Title is required' })} />
              </FormField>
            </div>

            <FormField label={lang === 'ar' ? 'الحالة' : 'Status'}>
              <select className="input" {...register('status')}>
                {STATUS_OPTIONS.filter((s) => s.value).map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </FormField>

            <FormField label={lang === 'ar' ? 'الأولوية' : 'Priority'}>
              <select className="input" {...register('priority')}>
                {PRIORITY_VALUES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </FormField>

            <FormField label={lang === 'ar' ? 'المُسند إليه' : 'Assignee'}>
              {isSuperAdmin ? (
                <input
                  type="text"
                  className="input bg-gray-50 cursor-not-allowed"
                  value={fullTask?.assigneeName ?? (lang === 'ar' ? 'غير مُسند' : 'Unassigned')}
                  readOnly
                />
              ) : (
                <select className="input" {...register('assignedToId')}>
                  <option value="">
                    {companyUsers.length === 0
                      ? (lang === 'ar' ? 'جارٍ التحميل...' : 'Loading...')
                      : (lang === 'ar' ? 'بدون تعيين' : 'Unassigned')}
                  </option>
                  {companyUsers.map((u) => (
                    <option key={u.id} value={u.id?.toLowerCase()}>
                      {u.fullName ?? u.name} {u.email ? `(${u.email})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            <FormField label={lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date'}>
              <input type="date" className="input" {...register('dueDate')} />
            </FormField>

            <FormField label={lang === 'ar' ? 'الساعات المقدرة' : 'Estimated Hours'}>
              <input type="number" min="0" step="0.5" className="input" {...register('estimatedHours')} />
            </FormField>
          </div>

          <FormField label={lang === 'ar' ? 'الوصف' : 'Description'}>
            <textarea rows={3} className="input resize-none" {...register('description')} />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { reset(); onClose(); }} className="btn-secondary text-sm px-4 py-2">
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" disabled={isPending} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
              {isPending ? <Spinner size="sm" /> : (lang === 'ar' ? 'حفظ' : 'Save')}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TasksPage() {
  const { t, lang, isRTL } = useLang();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', page, search, status, priority],
    queryFn: () =>
      tasksApi
        .getAll({
          page,
          pageSize: PAGE_SIZE,
          search: search || undefined,
          status: status || undefined,
          priority: priority || undefined,
        })
        .then((r) => r.data?.data ?? r.data),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const tasks = data?.items ?? data?.tasks ?? data?.data ?? [];
  const totalPages = data?.totalPages ?? Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE) ?? 1;

  const { mutate: deleteTask, isPending: isDeleting } = useMutation({
    mutationFn: (id) => tasksApi.delete(id),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم حذف المهمة' : 'Task deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل حذف المهمة' : 'Failed to delete task')
      );
    },
  });

  const headers = [
    lang === 'ar' ? 'المهمة' : 'Task',
    lang === 'ar' ? 'المشروع' : 'Project',
    lang === 'ar' ? 'المُسند إليه' : 'Assignee',
    t('status'),
    lang === 'ar' ? 'الأولوية' : 'Priority',
    lang === 'ar' ? 'الاستحقاق' : 'Due Date',
    lang === 'ar' ? 'الساعات' : 'Hours',
    t('actions'),
  ];

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('tasks')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar' ? 'إدارة ومتابعة جميع المهام' : 'Manage and track all tasks'}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
        >
          <Plus size={16} />
          {lang === 'ar' ? 'مهمة جديدة' : 'New Task'}
        </button>
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
            placeholder={lang === 'ar' ? 'بحث في المهام...' : 'Search tasks...'}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <select
          className="input text-sm w-full sm:w-44"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <select
          className="input text-sm w-full sm:w-44"
          value={priority}
          onChange={(e) => { setPriority(e.target.value); setPage(1); }}
        >
          {PRIORITY_OPTIONS_FILTER.map((opt) => (
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
            tasks.length === 0 && !isLoading ? (
              <EmptyState
                icon={CheckSquare}
                title={lang === 'ar' ? 'لا توجد مهام' : 'No tasks found'}
                description={
                  lang === 'ar'
                    ? 'ابدأ بإنشاء أول مهمة'
                    : 'Start by creating your first task'
                }
                action={
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    {lang === 'ar' ? 'إنشاء مهمة' : 'Create Task'}
                  </button>
                }
              />
            ) : null
          }
        >
          {tasks.map((task) => {
            const overdue = isOverdue(task.dueDate) && task.status !== 'Completed';
            return (
              <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {/* Title */}
                <td className="table-cell">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <CheckSquare size={13} className="text-primary-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                      {task.title}
                    </span>
                  </div>
                </td>
                {/* Project */}
                <td className="table-cell">
                  <span className="text-sm text-gray-600 truncate max-w-[120px] block">
                    {task.projectName ?? task.project?.name ?? '—'}
                  </span>
                </td>
                {/* Assignee */}
                <td className="table-cell">
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <User size={13} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate max-w-[100px]">
                      {task.assigneeName ?? task.assignee?.fullName ?? '—'}
                    </span>
                  </div>
                </td>
                {/* Status */}
                <td className="table-cell">
                  <StatusBadge status={task.status} />
                </td>
                {/* Priority */}
                <td className="table-cell">
                  <StatusBadge status={task.priority} />
                </td>
                {/* Due Date */}
                <td className="table-cell">
                  <div className={`flex items-center gap-1 text-sm ${overdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                    <Calendar size={13} className={overdue ? 'text-red-400' : 'text-gray-400'} />
                    {formatDate(task.dueDate)}
                    {overdue && (
                      <span className="text-xs bg-red-100 text-red-700 rounded px-1 py-0.5">
                        {lang === 'ar' ? 'متأخر' : 'Overdue'}
                      </span>
                    )}
                  </div>
                </td>
                {/* Hours */}
                <td className="table-cell">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock size={13} className="text-gray-400" />
                    {task.estimatedHours != null ? `${task.estimatedHours}h` : '—'}
                  </div>
                </td>
                {/* Actions */}
                <td className="table-cell">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditTarget(task)}
                      className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors"
                      title={t('edit')}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(task)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                      title={t('delete')}
                    >
                      <Trash2 size={15} />
                    </button>
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
      <CreateTaskModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {editTarget && (
        <EditTaskModal
          task={editTarget}
          open={!!editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTask(deleteTarget?.id)}
        loading={isDeleting}
        title={lang === 'ar' ? 'حذف المهمة' : 'Delete Task'}
        message={
          lang === 'ar'
            ? `هل أنت متأكد من حذف المهمة "${deleteTarget?.title}"؟`
            : `Are you sure you want to delete "${deleteTarget?.title}"?`
        }
      />
    </div>
  );
}
