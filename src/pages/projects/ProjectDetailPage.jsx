import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  ArrowRight,
  Users,
  CheckSquare,
  BarChart3,
  Info,
  UserPlus,
  Trash2,
  Calendar,
  DollarSign,
  Flag,
  User,
  Milestone,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { projectsApi, tasksApi, usersApi, budgetApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  PageLoader,
  ErrorMsg,
  StatusBadge,
  StatCard,
  ConfirmDialog,
  Table,
  EmptyState,
  FormField,
  Spinner,
  Modal,
} from '../../components/common/index';

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', SAR: 'SR', AED: 'AED', EGP: 'E£' };

function formatCurrency(v, currency = 'EGP') {
  if (v == null) return '—';
  const sym = CURRENCY_SYMBOLS[currency] ?? currency;
  if (v >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${sym}${(v / 1_000).toFixed(1)}K`;
  return `${sym}${v}`;
}

const TABS = ['overview', 'members', 'tasks', 'stats'];

const STATUS_OPTIONS = ['Planning', 'Active', 'OnHold', 'Completed', 'Cancelled'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High', 'Urgent'];

// ── Edit Project Modal ────────────────────────────────────────────────────────
function EditProjectModal({ project, open, onClose, onSuccess }) {
  const { lang } = useLang();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name:          project?.name          ?? '',
      description:   project?.description   ?? '',
      status:        project?.status        ?? 'Planning',
      priority:      project?.priority      ?? 'Medium',
      budget:        project?.budget        ?? '',
      currency:      project?.currency      ?? 'EGP',
      startDate:     project?.startDate ? project.startDate.split('T')[0] : '',
      endDate:       project?.endDate   ? project.endDate.split('T')[0]   : '',
      managerUserId: project?.managerUserId?.toLowerCase() ?? '',
      clientUserId:  project?.clientUserId?.toLowerCase()  ?? '',
    },
  });

  // جلب أعضاء الشركة
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
    mutationFn: (data) => projectsApi.update(project.id, data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم تحديث المشروع' : 'Project updated');
      onSuccess();
      onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message;
      toast.error(msg || (lang === 'ar' ? 'فشل تحديث المشروع' : 'Failed to update project'));
    },
  });

  const onSubmit = (data) => {
    mutate({
      name:          data.name,
      description:   data.description   || undefined,
      managerUserId: data.managerUserId || undefined,
      clientUserId:  data.clientUserId  || undefined,
      status:        data.status,
      priority:      data.priority,
      budget:        data.budget ? Number(data.budget) : undefined,
      currency:      data.currency || 'EGP',
      startDate:     data.startDate,
      endDate:       data.endDate || undefined,
    });
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title={lang === 'ar' ? 'تعديل المشروع' : 'Edit Project'} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <FormField label={lang === 'ar' ? 'اسم المشروع' : 'Project Name'} required error={errors.name?.message}>
              <input type="text" className={`input ${errors.name ? 'border-red-400' : ''}`}
                {...register('name', { required: lang === 'ar' ? 'اسم المشروع مطلوب' : 'Required' })} />
            </FormField>
          </div>

          {/* مدير المشروع */}
          <FormField label={lang === 'ar' ? 'مدير المشروع' : 'Project Manager'}>
            <select className="input" {...register('managerUserId')}>
              <option value="">{lang === 'ar' ? '— بدون مدير —' : '— No manager —'}</option>
              {managerUsers.map((u) => (
                <option key={u.id} value={u.id?.toLowerCase()}>
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
                <option key={u.id} value={u.id?.toLowerCase()}>
                  {u.fullName ?? u.name} {u.email ? `(${u.email})` : ''}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label={lang === 'ar' ? 'الحالة' : 'Status'}>
            <select className="input" {...register('status')}>
              {STATUS_OPTIONS.filter(s => s.value).map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </FormField>
          <FormField label={lang === 'ar' ? 'الأولوية' : 'Priority'}>
            <select className="input" {...register('priority')}>
              {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </FormField>
          <FormField label={lang === 'ar' ? 'تاريخ البداية' : 'Start Date'} required error={errors.startDate?.message}>
            <input type="date" className={`input ${errors.startDate ? 'border-red-400' : ''}`}
              {...register('startDate', { required: lang === 'ar' ? 'مطلوب' : 'Required' })} />
          </FormField>
          <FormField label={lang === 'ar' ? 'تاريخ النهاية' : 'End Date'}>
            <input type="date" className="input" {...register('endDate')} />
          </FormField>
          <FormField label={lang === 'ar' ? 'الميزانية' : 'Budget'}>
            <input type="number" min="0" step="0.01" className="input" placeholder="0" {...register('budget')} />
          </FormField>
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
        <FormField label={lang === 'ar' ? 'الوصف' : 'Description'}>
          <textarea rows={3} className="input resize-none" {...register('description')} />
        </FormField>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => { reset(); onClose(); }} className="btn-secondary text-sm px-4 py-2">
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button type="submit" disabled={isPending} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
            {isPending ? <Spinner size="sm" /> : (lang === 'ar' ? 'حفظ التغييرات' : 'Save Changes')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
        active
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

// ── Info Row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
        <Icon size={15} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-gray-900 break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

// ── Add Member Form ───────────────────────────────────────────────────────────
function AddMemberForm({ projectId, onSuccess }) {
  const { lang } = useLang();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ defaultValues: { userId: '', role: 'Consultant' } });

  const { data: usersData } = useQuery({
    queryKey: ['users-dropdown'],
    queryFn: () => usersApi.getAll().then((r) => r.data?.data ?? r.data),
    staleTime: 120_000,
  });
  const companyUsers = Array.isArray(usersData) ? usersData : usersData?.items ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => projectsApi.addMember(projectId, data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم إضافة العضو' : 'Member added');
      reset();
      onSuccess();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل إضافة العضو' : 'Failed to add member')
      );
    },
  });

  return (
    <form
      onSubmit={handleSubmit((d) => mutate(d))}
      className="flex flex-col sm:flex-row gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200"
      noValidate
    >
      <div className="flex-1">
        <select
          className={`input text-sm ${errors.userId ? 'border-red-400' : ''}`}
          {...register('userId', {
            required: lang === 'ar' ? 'اختر مستخدم' : 'Select a user',
          })}
        >
          <option value="">{lang === 'ar' ? 'اختر مستخدم' : 'Select user'}</option>
          {companyUsers.map((u) => (
            <option key={u.id} value={u.id}>
              {u.fullName ?? u.name} {u.email ? `— ${u.email}` : ''}
            </option>
          ))}
        </select>
        {errors.userId && (
          <p className="text-xs text-red-600 mt-1">{errors.userId.message}</p>
        )}
      </div>
      <select className="input text-sm w-full sm:w-36" {...register('role')}>
        <option value="Consultant">{lang === 'ar' ? 'مستشار' : 'Consultant'}</option>
        <option value="Manager">{lang === 'ar' ? 'مدير' : 'Manager'}</option>
        <option value="Viewer">{lang === 'ar' ? 'مشاهد' : 'Viewer'}</option>
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary text-sm px-4 py-2 flex items-center gap-2 whitespace-nowrap"
      >
        {isPending ? <Spinner size="sm" /> : <UserPlus size={15} />}
        {lang === 'ar' ? 'إضافة' : 'Add'}
      </button>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ProjectDetailPage() {
  const { id } = useParams();
  const { t, lang, isRTL } = useLang();
  const { isAdmin } = usePermissions();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState('overview');
  const [removeMemberTarget, setRemoveMemberTarget] = useState(null);
  const [taskPage, setTaskPage] = useState(1);
  const [editOpen, setEditOpen] = useState(false);

  // Project data
  const {
    data: project,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.getById(id).then((r) => r.data?.data ?? r.data),
    enabled: !!id,
  });

  // Members
  const { data: membersData, refetch: refetchMembers } = useQuery({
    queryKey: ['project-members', id],
    queryFn: () => projectsApi.getMembers(id).then((r) => r.data?.data ?? r.data),
    enabled: !!id && activeTab === 'members',
  });
  const members = Array.isArray(membersData) ? membersData : membersData?.members ?? membersData?.items ?? [];

  // Stats
  const { data: statsData } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => projectsApi.getStats(id).then((r) => r.data?.data ?? r.data),
    enabled: !!id && activeTab === 'stats',
  });

  // Tasks (project-scoped)
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', id, taskPage],
    queryFn: () =>
      tasksApi.getAll({ projectId: id, page: taskPage, pageSize: 10 }).then((r) => r.data?.data ?? r.data),
    enabled: !!id && activeTab === 'tasks',
  });
  const tasks = tasksData?.items ?? tasksData?.tasks ?? tasksData?.data ?? [];
  const taskTotalPages = tasksData?.totalPages ?? 1;

  // Remove member mutation
  const { mutate: removeMember, isPending: isRemoving } = useMutation({
    mutationFn: ({ userId }) => projectsApi.removeMember(id, userId),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم إزالة العضو' : 'Member removed');
      setRemoveMemberTarget(null);
      refetchMembers();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل إزالة العضو' : 'Failed to remove member')
      );
    },
  });

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const tabLabels = {
    overview: lang === 'ar' ? 'نظرة عامة' : 'Overview',
    members: lang === 'ar' ? 'الأعضاء' : 'Members',
    tasks: lang === 'ar' ? 'المهام' : 'Tasks',
    stats: lang === 'ar' ? 'الإحصائيات' : 'Statistics',
  };

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="p-6 space-y-4">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <BackIcon size={16} />
          {lang === 'ar' ? 'العودة للمشاريع' : 'Back to Projects'}
        </button>
        <ErrorMsg
          message={
            error?.response?.data?.message ||
            (lang === 'ar' ? 'فشل تحميل بيانات المشروع' : 'Failed to load project')
          }
        />
      </div>
    );
  }

  const milestones = project?.milestones ?? [];

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Back + Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3">
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors self-start"
        >
          <BackIcon size={15} />
          {lang === 'ar' ? 'المشاريع' : 'Projects'}
        </button>
      </div>

      {/* Project Header Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-gray-900 truncate">{project?.name}</h1>
              <StatusBadge status={project?.status} />
              <StatusBadge status={project?.priority} />
            </div>
            {project?.description && (
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
            )}
          </div>
          {isAdmin && (
            <button
              onClick={() => setEditOpen(true)}
              className="btn-secondary text-sm px-4 py-2 whitespace-nowrap self-start flex items-center gap-2"
            >
              <Pencil size={15} />
              {t('edit')}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="card p-0">
        <div className="border-b border-gray-100 overflow-x-auto">
          <div className="flex px-2">
            {TABS.map((tab) => (
              <TabBtn
                key={tab}
                active={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tabLabels[tab]}
              </TabBtn>
            ))}
          </div>
        </div>

        <div className="p-5">
          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Project Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  {lang === 'ar' ? 'تفاصيل المشروع' : 'Project Details'}
                </h3>
                <div className="space-y-0.5">
                  <InfoRow
                    icon={User}
                    label={lang === 'ar' ? 'مدير المشروع' : 'Project Manager'}
                    value={project?.managerName}
                  />
                  <InfoRow
                    icon={Users}
                    label={lang === 'ar' ? 'العميل' : 'Client'}
                    value={project?.clientName}
                  />
                  <InfoRow
                    icon={DollarSign}
                    label={lang === 'ar' ? 'الميزانية' : 'Budget'}
                    value={formatCurrency(project?.budget, project?.currency)}
                  />
                  <InfoRow
                    icon={Calendar}
                    label={lang === 'ar' ? 'تاريخ البداية' : 'Start Date'}
                    value={formatDate(project?.startDate)}
                  />
                  <InfoRow
                    icon={Calendar}
                    label={lang === 'ar' ? 'تاريخ النهاية' : 'End Date'}
                    value={formatDate(project?.endDate)}
                  />
                  <InfoRow
                    icon={Flag}
                    label={lang === 'ar' ? 'الأولوية' : 'Priority'}
                    value={project?.priority}
                  />
                </div>
              </div>

              {/* Milestones */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Milestone size={15} />
                  {lang === 'ar' ? 'المعالم' : 'Milestones'}
                </h3>
                {milestones.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">
                    {lang === 'ar' ? 'لا توجد معالم' : 'No milestones'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {milestones.map((m, idx) => (
                      <div
                        key={m.id ?? idx}
                        className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100"
                      >
                        {m.isCompleted ? (
                          <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Circle size={16} className="text-gray-300 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800">{m.title ?? m.name}</p>
                          {m.dueDate && (
                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.dueDate)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── MEMBERS ── */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              {isAdmin && <AddMemberForm projectId={id} onSuccess={refetchMembers} />}

              {members.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={lang === 'ar' ? 'لا يوجد أعضاء' : 'No members'}
                  description={
                    lang === 'ar'
                      ? 'أضف أعضاء إلى المشروع للتعاون'
                      : 'Add members to collaborate on this project'
                  }
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {members.map((member, idx) => (
                    <div
                      key={member.id ?? member.userId ?? idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary-700">
                            {(member.fullName ?? member.name ?? 'U')[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {member.fullName ?? member.name ?? member.email}
                          </p>
                          <p className="text-xs text-gray-400">{member.role ?? 'Member'}</p>
                        </div>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => setRemoveMemberTarget(member)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          title={lang === 'ar' ? 'إزالة العضو' : 'Remove member'}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TASKS ── */}
          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <Table
                headers={[
                  lang === 'ar' ? 'المهمة' : 'Task',
                  t('status'),
                  lang === 'ar' ? 'الأولوية' : 'Priority',
                  lang === 'ar' ? 'المسند إليه' : 'Assignee',
                  lang === 'ar' ? 'تاريخ الاستحقاق' : 'Due Date',
                ]}
                loading={tasksLoading}
                empty={
                  !tasksLoading && tasks.length === 0 ? (
                    <EmptyState
                      icon={CheckSquare}
                      title={lang === 'ar' ? 'لا توجد مهام' : 'No tasks'}
                      description={lang === 'ar' ? 'لم يتم إضافة مهام لهذا المشروع' : 'No tasks have been added to this project'}
                    />
                  ) : null
                }
              >
                {tasks.map((task) => (
                  <tr key={task.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="table-cell">
                      <p className="text-sm font-medium text-gray-900 max-w-[200px] truncate">
                        {task.title ?? task.name}
                      </p>
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={task.status} />
                    </td>
                    <td className="table-cell">
                      <StatusBadge status={task.priority} />
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-600">
                        {task.assigneeName ?? task.assignedTo ?? '—'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock size={12} className="text-gray-400" />
                        {formatDate(task.dueDate)}
                      </div>
                    </td>
                  </tr>
                ))}
              </Table>

              {taskTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {[...Array(taskTotalPages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setTaskPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${
                        taskPage === i + 1
                          ? 'bg-primary-600 text-white'
                          : 'hover:bg-gray-100 text-gray-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── STATS ── */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              {!statsData ? (
                <div className="flex items-center justify-center py-12">
                  <Spinner size="lg" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title={lang === 'ar' ? 'إجمالي المهام' : 'Total Tasks'}
                      value={statsData.totalTasks ?? statsData.TotalTasks}
                      icon={CheckSquare}
                      color="primary"
                    />
                    <StatCard
                      title={lang === 'ar' ? 'المهام المكتملة' : 'Completed Tasks'}
                      value={statsData.completedTasks ?? statsData.CompletedTasks}
                      icon={CheckCircle2}
                      color="green"
                    />
                    <StatCard
                      title={lang === 'ar' ? 'المهام المتأخرة' : 'Overdue Tasks'}
                      value={statsData.overdueTasks ?? statsData.OverdueTasks}
                      icon={AlertCircle}
                      color="red"
                    />
                    <StatCard
                      title={lang === 'ar' ? 'نسبة الإنجاز' : 'Completion Rate'}
                      value={
                        statsData.completionRate != null
                          ? `${Math.round(statsData.completionRate)}%`
                          : '—'
                      }
                      icon={BarChart3}
                      color="blue"
                    />
                    <StatCard
                      title={lang === 'ar' ? 'الميزانية' : 'Budget'}
                      value={formatCurrency(statsData.budget ?? statsData.Budget, project?.currency)}
                      icon={DollarSign}
                      color="purple"
                    />
                    <StatCard
                      title={lang === 'ar' ? 'المنفق' : 'Spent'}
                      value={formatCurrency(statsData.spent ?? statsData.Spent, project?.currency)}
                      icon={DollarSign}
                      color="yellow"
                    />
                    <StatCard
                      title={lang === 'ar' ? 'عدد الأعضاء' : 'Members'}
                      value={statsData.memberCount ?? statsData.MemberCount}
                      icon={Users}
                      color="primary"
                    />
                    <StatCard
                      title={lang === 'ar' ? 'ساعات العمل' : 'Hours Logged'}
                      value={statsData.hoursLogged ?? statsData.HoursLogged}
                      icon={Clock}
                      color="blue"
                    />
                  </div>

                  {/* Budget Tracking Widget */}
                  <BudgetWidget projectId={id} lang={lang} currency={project?.currency} />

                  {/* Progress Bar */}
                  {statsData.completionRate != null && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          {lang === 'ar' ? 'نسبة الإنجاز الكلية' : 'Overall Progress'}
                        </span>
                        <span className="text-sm font-bold text-primary-600">
                          {Math.round(statsData.completionRate)}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, statsData.completionRate)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Project Modal */}
      {project && (
        <EditProjectModal
          project={project}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ['project', id] })}
        />
      )}

      {/* Remove Member Confirm */}
      <ConfirmDialog
        open={!!removeMemberTarget}
        onClose={() => setRemoveMemberTarget(null)}
        onConfirm={() =>
          removeMember({ userId: removeMemberTarget?.userId ?? removeMemberTarget?.id })
        }
        loading={isRemoving}
        title={lang === 'ar' ? 'إزالة العضو' : 'Remove Member'}
        message={
          lang === 'ar'
            ? `هل تريد إزالة "${removeMemberTarget?.fullName ?? removeMemberTarget?.name ?? 'هذا العضو'}" من المشروع؟`
            : `Remove "${removeMemberTarget?.fullName ?? removeMemberTarget?.name ?? 'this member'}" from the project?`
        }
      />
    </div>
  );
}

// ── Budget Tracking Widget ─────────────────────────────────────────────────────
function BudgetWidget({ projectId, lang, currency = 'EGP' }) {
  const { data, isLoading } = useQuery({
    queryKey: ['budget', projectId],
    queryFn: () => budgetApi.getBudget(projectId),
    enabled: !!projectId,
    staleTime: 60_000,
  });

  const budget = data?.data?.data ?? data?.data ?? null;
  if (isLoading || !budget) return null;

  const planned  = budget.plannedBudget  ?? budget.budget  ?? 0;
  const actual   = budget.actualCost     ?? budget.spent   ?? 0;
  const pct      = planned > 0 ? Math.min(Math.round((actual / planned) * 100), 200) : 0;
  const overBudget = actual > planned;

  const fmt = (v) => new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0 }).format(v);

  return (
    <div className={`p-4 rounded-xl border ${overBudget ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
          <DollarSign size={14} />
          {lang === 'ar' ? 'تتبع الميزانية' : 'Budget Tracking'}
        </span>
        {overBudget && (
          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
            {lang === 'ar' ? '⚠ تجاوز الميزانية!' : '⚠ Over Budget!'}
          </span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3 mb-3 text-center">
        <div>
          <p className="text-xs text-gray-500">{lang === 'ar' ? 'المخطط' : 'Planned'}</p>
          <p className="text-sm font-bold text-gray-800">{fmt(planned)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{lang === 'ar' ? 'الفعلي' : 'Actual'}</p>
          <p className={`text-sm font-bold ${overBudget ? 'text-red-700' : 'text-green-700'}`}>{fmt(actual)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">{lang === 'ar' ? 'المتبقي' : 'Remaining'}</p>
          <p className={`text-sm font-bold ${overBudget ? 'text-red-700' : 'text-blue-700'}`}>{fmt(planned - actual)}</p>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${overBudget ? 'bg-red-500' : pct > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1 text-end">{pct}% {lang === 'ar' ? 'مستخدم' : 'used'}</p>
    </div>
  );
}
