import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Clock,
  Play,
  Square,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  Timer,
} from 'lucide-react';
import { timeApi, projectsApi, tasksApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import {
  EmptyState,
  ConfirmDialog,
  Pagination,
  StatCard,
  Table,
  FormField,
  Modal,
  Spinner,
} from '../../components/common/index';
import { useForm } from 'react-hook-form';

const PAGE_SIZE = 15;

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function formatDuration(minutes) {
  if (minutes == null || isNaN(minutes)) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDurationFromSecs(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function calcWeeklyMinutes(entries) {
  if (!Array.isArray(entries)) return 0;
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return entries
    .filter((e) => new Date(e.startTime ?? e.date ?? '') >= startOfWeek)
    .reduce((acc, e) => acc + (e.duration ?? e.durationMinutes ?? 0), 0);
}

// ── Live Timer Widget ─────────────────────────────────────────────────────────
function TimerWidget({ activeEntry, onStart, onStop, isStarting, isStopping, lang }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeEntry) {
      setElapsed(0);
      return;
    }
    const startTs = new Date(activeEntry.startTime ?? activeEntry.start ?? '').getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - startTs) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [activeEntry]);

  return (
    <div className="card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              activeEntry ? 'bg-green-100 animate-pulse' : 'bg-gray-100'
            }`}
          >
            <Timer size={22} className={activeEntry ? 'text-green-600' : 'text-gray-400'} />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
              {activeEntry
                ? lang === 'ar'
                  ? 'المؤقت يعمل'
                  : 'Timer Running'
                : lang === 'ar'
                ? 'لا يوجد مؤقت نشط'
                : 'No Active Timer'}
            </p>
            <p className="text-2xl font-mono font-bold text-gray-900">
              {activeEntry ? formatDurationFromSecs(elapsed) : '00:00:00'}
            </p>
            {activeEntry && (
              <p className="text-xs text-gray-500 mt-0.5">
                {lang === 'ar' ? 'بدأ في' : 'Started at'}{' '}
                {formatTime(activeEntry.startTime ?? activeEntry.start)}
              </p>
            )}
          </div>
        </div>
        <div className="sm:ms-auto flex items-center gap-2">
          {activeEntry ? (
            <button
              onClick={() => onStop(activeEntry.id)}
              disabled={isStopping}
              className="btn-danger flex items-center gap-2 text-sm px-4 py-2"
            >
              {isStopping ? <Spinner size="sm" /> : <Square size={15} />}
              {lang === 'ar' ? 'إيقاف' : 'Stop'}
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={isStarting}
              className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
            >
              {isStarting ? <Spinner size="sm" /> : <Play size={15} />}
              {lang === 'ar' ? 'بدء التسجيل' : 'Start Timer'}
            </button>
          )}
        </div>
      </div>
      {activeEntry?.taskName && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600 flex items-center gap-2">
          <Clock size={14} className="text-green-500" />
          <span className="font-medium">{activeEntry.taskName}</span>
          {activeEntry.projectName && (
            <span className="text-gray-400">· {activeEntry.projectName}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────
function TimeEntryModal({ open, onClose, entry }) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const isEdit = !!entry;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: { billable: true },
  });

  useEffect(() => {
    if (open) {
      reset(
        entry
          ? {
              projectId: entry.projectId ?? '',
              taskId: entry.taskId ?? '',
              description: entry.description ?? '',
              startTime: entry.startTime ? entry.startTime.slice(0, 16) : '',
              endTime: entry.endTime ? entry.endTime.slice(0, 16) : '',
              billable: entry.billable ?? false,
            }
          : { billable: true }
      );
    }
  }, [open, entry, reset]);

  const selectedProject = watch('projectId');

  const { data: projectsData } = useQuery({
    queryKey: ['projects-all'],
    queryFn: () => projectsApi.getAll({ pageSize: 200 }).then((r) => r.data?.data ?? r.data),
    staleTime: 120_000,
  });

  const { data: tasksData } = useQuery({
    queryKey: ['tasks-by-project', selectedProject],
    queryFn: () =>
      tasksApi
        .getAll({ projectId: selectedProject, pageSize: 200 })
        .then((r) => r.data?.data ?? r.data),
    enabled: !!selectedProject,
    staleTime: 60_000,
  });

  const projects = projectsData?.items ?? projectsData?.projects ?? projectsData?.data ?? [];
  const tasks = tasksData?.items ?? tasksData?.tasks ?? tasksData?.data ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data) =>
      isEdit ? timeApi.update(entry.id, data) : timeApi.create(data),
    onSuccess: () => {
      toast.success(
        isEdit
          ? lang === 'ar'
            ? 'تم تعديل التسجيل'
            : 'Time entry updated'
          : lang === 'ar'
          ? 'تم إنشاء التسجيل'
          : 'Time entry created'
      );
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-all-summary'] });
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'حدث خطأ' : 'An error occurred')
      );
    },
  });

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title={
        isEdit
          ? lang === 'ar'
            ? 'تعديل تسجيل الوقت'
            : 'Edit Time Entry'
          : lang === 'ar'
          ? 'إضافة تسجيل وقت'
          : 'Add Time Entry'
      }
      size="md"
    >
      <form
        onSubmit={handleSubmit((data) => {
          mutate({
            projectId:   data.projectId   || undefined,
            taskId:      data.taskId      || undefined,
            description: data.description || undefined,
            hours:       Number(data.hours),
            date:        data.date || new Date().toISOString().slice(0, 10),
            isBillable:  !!data.billable,
          });
        })}
        className="space-y-4"
        noValidate
      >
        <FormField
          label={lang === 'ar' ? 'المشروع' : 'Project'}
          error={errors.projectId?.message}
        >
          <select
            className="input"
            {...register('projectId')}
            onChange={(e) => {
              setValue('projectId', e.target.value);
              setValue('taskId', '');
            }}
          >
            <option value="">{lang === 'ar' ? 'اختر مشروعاً' : 'Select project'}</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </FormField>

        {selectedProject && tasks.length > 0 && (
          <FormField
            label={lang === 'ar' ? 'المهمة' : 'Task'}
            error={errors.taskId?.message}
          >
            <select className="input" {...register('taskId')}>
              <option value="">{lang === 'ar' ? 'اختر مهمة' : 'Select task'}</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title ?? t.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <FormField
          label={lang === 'ar' ? 'الوصف' : 'Description'}
          error={errors.description?.message}
        >
          <input type="text" className="input" {...register('description')} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            label={lang === 'ar' ? 'التاريخ' : 'Date'}
            required
            error={errors.date?.message}
          >
            <input
              type="date"
              className={`input ${errors.date ? 'border-red-400' : ''}`}
              defaultValue={new Date().toISOString().slice(0, 10)}
              {...register('date', {
                required: lang === 'ar' ? 'التاريخ مطلوب' : 'Date is required',
              })}
            />
          </FormField>
          <FormField
            label={lang === 'ar' ? 'عدد الساعات' : 'Hours'}
            required
            error={errors.hours?.message}
          >
            <input
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              className={`input ${errors.hours ? 'border-red-400' : ''}`}
              placeholder="1.0"
              {...register('hours', {
                required: lang === 'ar' ? 'عدد الساعات مطلوب' : 'Hours required',
                min: { value: 0.25, message: lang === 'ar' ? 'الحد الأدنى 0.25' : 'Min 0.25' },
                max: { value: 24,   message: lang === 'ar' ? 'الحد الأقصى 24'  : 'Max 24'   },
              })}
            />
          </FormField>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <input
            type="checkbox"
            id="billable-chk"
            className="w-4 h-4 rounded text-primary-600"
            {...register('billable')}
          />
          <label
            htmlFor="billable-chk"
            className="text-sm font-medium text-gray-700 cursor-pointer"
          >
            {lang === 'ar' ? 'قابل للفوترة' : 'Billable'}
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
            }}
            className="btn-secondary text-sm px-4 py-2"
          >
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
          >
            {isPending && <Spinner size="sm" />}
            {isEdit
              ? lang === 'ar'
                ? 'حفظ التغييرات'
                : 'Save Changes'
              : lang === 'ar'
              ? 'إضافة'
              : 'Add Entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TimeEntriesPage() {
  const { t, lang, isRTL } = useLang();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [filterProject, setFilterProject] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filters = {
    page,
    pageSize: PAGE_SIZE,
    projectId: filterProject || undefined,
    startDate: dateFrom || undefined,
    endDate: dateTo || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['time-entries', filters],
    queryFn: () => timeApi.getAll(filters).then((r) => r.data?.data ?? r.data),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const { data: allData } = useQuery({
    queryKey: ['time-all-summary'],
    queryFn: () => timeApi.getAll({ pageSize: 500 }).then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-all'],
    queryFn: () => projectsApi.getAll({ pageSize: 200 }).then((r) => r.data?.data ?? r.data),
    staleTime: 120_000,
  });

  const entries =
    data?.items ?? data?.entries ?? data?.data ?? (Array.isArray(data) ? data : []);
  const totalPages =
    data?.totalPages ?? Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE) ?? 1;
  const allEntries =
    allData?.items ??
    allData?.entries ??
    allData?.data ??
    (Array.isArray(allData) ? allData : []);
  const projects =
    projectsData?.items ?? projectsData?.projects ?? projectsData?.data ?? [];

  const activeEntry = allEntries.find(
    (e) => e.isRunning || e.status === 'Running' || (!e.endTime && !e.stoppedAt)
  );

  const weeklyMinutes = calcWeeklyMinutes(allEntries);
  const billableCount = allEntries.filter((e) => e.billable).length;
  const totalMinutes = allEntries.reduce(
    (acc, e) => acc + (e.duration ?? e.durationMinutes ?? 0),
    0
  );

  const { mutate: startTimer, isPending: isStarting } = useMutation({
    mutationFn: () => {
      if (timeApi.start) {
        return timeApi.start({ startTime: new Date().toISOString() });
      }
      return timeApi.create({ startTime: new Date().toISOString(), billable: true });
    },
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'بدأ المؤقت' : 'Timer started');
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-all-summary'] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل بدء المؤقت' : 'Failed to start timer')
      );
    },
  });

  const { mutate: stopTimer, isPending: isStopping } = useMutation({
    mutationFn: (id) => {
      if (timeApi.stop) return timeApi.stop(id);
      return timeApi.update(id, { endTime: new Date().toISOString() });
    },
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم إيقاف المؤقت' : 'Timer stopped');
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-all-summary'] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل إيقاف المؤقت' : 'Failed to stop timer')
      );
    },
  });

  const { mutate: deleteEntry, isPending: isDeleting } = useMutation({
    mutationFn: (id) => timeApi.delete(id),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم حذف التسجيل' : 'Entry deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['time-all-summary'] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل الحذف' : 'Delete failed')
      );
    },
  });

  const headers = [
    lang === 'ar' ? 'التاريخ' : 'Date',
    lang === 'ar' ? 'المشروع' : 'Project',
    lang === 'ar' ? 'المهمة' : 'Task',
    lang === 'ar' ? 'الوصف' : 'Description',
    lang === 'ar' ? 'البداية' : 'Start',
    lang === 'ar' ? 'النهاية' : 'End',
    lang === 'ar' ? 'المدة' : 'Duration',
    lang === 'ar' ? 'فوترة' : 'Billable',
    t('actions'),
  ];

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {lang === 'ar' ? 'تسجيل الوقت' : 'Time Entries'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar' ? 'تتبع ساعات العمل والمهام' : 'Track work hours and tasks'}
          </p>
        </div>
        <button
          onClick={() => {
            setEditEntry(null);
            setModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
        >
          <Plus size={16} />
          {lang === 'ar' ? 'إضافة تسجيل' : 'Add Entry'}
        </button>
      </div>

      {/* Timer Widget */}
      <TimerWidget
        activeEntry={activeEntry}
        onStart={startTimer}
        onStop={stopTimer}
        isStarting={isStarting}
        isStopping={isStopping}
        lang={lang}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={lang === 'ar' ? 'ساعات هذا الأسبوع' : 'Hours This Week'}
          value={formatDuration(weeklyMinutes)}
          icon={Clock}
          color="primary"
          loading={isLoading && allEntries.length === 0}
        />
        <StatCard
          title={lang === 'ar' ? 'إجمالي الساعات' : 'Total Hours'}
          value={formatDuration(totalMinutes)}
          icon={Timer}
          color="blue"
          loading={isLoading && allEntries.length === 0}
        />
        <StatCard
          title={lang === 'ar' ? 'تسجيلات قابلة للفوترة' : 'Billable Entries'}
          value={billableCount}
          icon={DollarSign}
          color="green"
          loading={isLoading && allEntries.length === 0}
        />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {projects.length > 0 && (
            <select
              className="input text-sm"
              value={filterProject}
              onChange={(e) => {
                setFilterProject(e.target.value);
                setPage(1);
              }}
            >
              <option value="">
                {lang === 'ar' ? 'كل المشاريع' : 'All Projects'}
              </option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
          <input
            type="date"
            className="input text-sm"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPage(1);
            }}
            title={lang === 'ar' ? 'من تاريخ' : 'From date'}
          />
          <input
            type="date"
            className="input text-sm"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPage(1);
            }}
            title={lang === 'ar' ? 'إلى تاريخ' : 'To date'}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <Table
          headers={headers}
          loading={isLoading}
          empty={
            entries.length === 0 && !isLoading ? (
              <EmptyState
                icon={Clock}
                title={lang === 'ar' ? 'لا توجد تسجيلات' : 'No time entries found'}
                description={
                  lang === 'ar'
                    ? 'ابدأ بتسجيل وقت عملك'
                    : 'Start tracking your work time'
                }
                action={
                  <button
                    onClick={() => {
                      setEditEntry(null);
                      setModalOpen(true);
                    }}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    {lang === 'ar' ? 'إضافة تسجيل' : 'Add Entry'}
                  </button>
                }
              />
            ) : null
          }
        >
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                entry.isRunning || entry.status === 'Running' ? 'bg-green-50/50' : ''
              }`}
            >
              <td className="table-cell">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Calendar size={13} className="text-gray-400" />
                  {formatDate(entry.date ?? entry.startTime)}
                </div>
              </td>
              <td className="table-cell">
                <span className="text-sm font-medium text-gray-700">
                  {entry.projectName ?? entry.project ?? '—'}
                </span>
              </td>
              <td className="table-cell">
                <span className="text-sm text-gray-600">
                  {entry.taskName ?? entry.task ?? '—'}
                </span>
              </td>
              <td className="table-cell">
                <span className="text-sm text-gray-500 truncate max-w-[150px] block">
                  {entry.description ?? '—'}
                </span>
              </td>
              <td className="table-cell">
                <span className="text-sm text-gray-600">{formatTime(entry.startTime)}</span>
              </td>
              <td className="table-cell">
                {entry.isRunning || entry.status === 'Running' ? (
                  <span className="badge bg-green-100 text-green-700 animate-pulse">
                    {lang === 'ar' ? 'يعمل' : 'Running'}
                  </span>
                ) : (
                  <span className="text-sm text-gray-600">{formatTime(entry.endTime)}</span>
                )}
              </td>
              <td className="table-cell">
                <span className="text-sm font-medium text-gray-900">
                  {formatDuration(entry.duration ?? entry.durationMinutes)}
                </span>
              </td>
              <td className="table-cell">
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    entry.billable ? 'bg-green-100' : 'bg-gray-100'
                  }`}
                >
                  {entry.billable ? (
                    <DollarSign size={11} className="text-green-600" />
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditEntry(entry);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-600 transition-colors"
                    title={lang === 'ar' ? 'تعديل' : 'Edit'}
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(entry)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    title={lang === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Trash2 size={15} />
                  </button>
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

      <TimeEntryModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditEntry(null);
        }}
        entry={editEntry}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteEntry(deleteTarget?.id)}
        loading={isDeleting}
        title={lang === 'ar' ? 'حذف التسجيل' : 'Delete Entry'}
        message={
          lang === 'ar'
            ? 'هل أنت متأكد من حذف هذا التسجيل؟ لا يمكن التراجع عن هذا الإجراء.'
            : 'Are you sure you want to delete this time entry? This action cannot be undone.'
        }
      />
    </div>
  );
}
