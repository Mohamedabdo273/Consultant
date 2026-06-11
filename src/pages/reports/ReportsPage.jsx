import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  FileText,
  Download,
  Eye,
  Plus,
  Search,
  Calendar,
  BarChart2,
  Clock,
  Filter,
} from 'lucide-react';
import { reportsApi, projectsApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import {
  PageLoader,
  EmptyState,
  StatusBadge,
  Modal,
  ConfirmDialog,
  Pagination,
  StatCard,
  Table,
  FormField,
  Spinner,
} from '../../components/common/index';
import { useForm } from 'react-hook-form';

const PAGE_SIZE = 10;

// must match backend ReportType enum exactly (string or int both work with JsonStringEnumConverter)
const REPORT_TYPES = [
  { value: 0, label: 'تقدم المشروع',  labelEn: 'Progress'   },
  { value: 1, label: 'أسبوعي',        labelEn: 'Weekly'     },
  { value: 2, label: 'شهري',          labelEn: 'Monthly'    },
  { value: 3, label: 'مرحلة رئيسية', labelEn: 'Milestone'  },
  { value: 4, label: 'نهائي',         labelEn: 'Final'      },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getThisMonthCount(reports) {
  if (!Array.isArray(reports)) return 0;
  const now = new Date();
  return reports.filter((r) => {
    const d = new Date(r.createdAt ?? r.created ?? '');
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;
}

function countByType(reports) {
  if (!Array.isArray(reports)) return {};
  return reports.reduce((acc, r) => {
    const t = r.type ?? 'Unknown';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});
}

// ── Generate Report Modal ─────────────────────────────────────────────────────
function GenerateReportModal({ open, onClose }) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  const { data: projectsData } = useQuery({
    queryKey: ['projects-all'],
    queryFn: () => projectsApi.getAll({ pageSize: 200 }).then((r) => r.data?.data ?? r.data),
    staleTime: 120_000,
  });
  const projects = projectsData?.items ?? projectsData?.projects ?? projectsData?.data ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => reportsApi.create(data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم إنشاء التقرير بنجاح' : 'Report generated successfully');
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      reset();
      onClose();
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل إنشاء التقرير' : 'Failed to generate report')
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
      title={lang === 'ar' ? 'إنشاء تقرير جديد' : 'Generate New Report'}
      size="md"
    >
      <form
        onSubmit={handleSubmit((data) => mutate({
          title:     data.name,
          content:   data.notes || `تقرير بتاريخ ${new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          projectId: data.projectId,
          type:      Number(data.type ?? 0),
        }))}
        className="space-y-4"
        noValidate
      >
        <FormField
          label={lang === 'ar' ? 'اسم التقرير' : 'Report Name'}
          required
          error={errors.name?.message}
        >
          <input
            type="text"
            className={`input ${errors.name ? 'border-red-400' : ''}`}
            {...register('name', {
              required: lang === 'ar' ? 'اسم التقرير مطلوب' : 'Report name is required',
            })}
          />
        </FormField>

        <FormField label={lang === 'ar' ? 'نوع التقرير' : 'Report Type'} error={errors.type?.message}>
          <select className="input" defaultValue={0} {...register('type')}>
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {lang === 'ar' ? t.label : t.labelEn}
              </option>
            ))}
          </select>
        </FormField>

        {true && (
          <FormField label={lang === 'ar' ? 'المشروع' : 'Project'} required error={errors.projectId?.message}>
            <select className={`input ${errors.projectId ? 'border-red-400' : ''}`}
              {...register('projectId', { required: lang === 'ar' ? 'المشروع مطلوب' : 'Project is required' })}>
              <option value="">{lang === 'ar' ? '-- اختر مشروعاً --' : '-- Select a project --'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </FormField>
        )}

        <div className="grid grid-cols-2 gap-3 hidden">
          <FormField
            label={lang === 'ar' ? 'من تاريخ' : 'From Date'}
            error={errors.startDate?.message}
          >
            <input type="date" className="input" {...register('startDate')} />
          </FormField>
          <FormField
            label={lang === 'ar' ? 'إلى تاريخ' : 'To Date'}
            error={errors.endDate?.message}
          >
            <input type="date" className="input" {...register('endDate')} />
          </FormField>
        </div>

        <FormField label={lang === 'ar' ? 'ملاحظات' : 'Notes'}>
          <textarea rows={3} className="input resize-none" {...register('notes')} />
        </FormField>

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
            {isPending ? <Spinner size="sm" /> : <Plus size={15} />}
            {lang === 'ar' ? 'إنشاء التقرير' : 'Generate Report'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── View Report Modal ─────────────────────────────────────────────────────────
function ViewReportModal({ reportId, open, onClose }) {
  const { lang } = useLang();

  const { data, isLoading } = useQuery({
    queryKey: ['report-detail', reportId],
    queryFn: () => reportsApi.getById(reportId).then((r) => r.data?.data ?? r.data),
    enabled: open && !!reportId,
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={lang === 'ar' ? 'تفاصيل التقرير' : 'Report Details'}
      size="lg"
    >
      {isLoading ? (
        <PageLoader />
      ) : !data ? (
        <p className="text-sm text-gray-500 text-center py-8">
          {lang === 'ar' ? 'لا توجد بيانات' : 'No data available'}
        </p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                {lang === 'ar' ? 'عنوان التقرير' : 'Title'}
              </p>
              <p className="text-sm font-semibold text-gray-900">{data.title ?? data.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                {lang === 'ar' ? 'النوع' : 'Type'}
              </p>
              <p className="text-sm font-medium text-gray-900">
                {(() => {
                  const found = REPORT_TYPES.find(
                    (t) => t.value === data.type || t.labelEn?.toLowerCase() === String(data.type ?? '').toLowerCase()
                  );
                  return found ? (lang === 'ar' ? found.label : found.labelEn) : (data.type ?? '—');
                })()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                {lang === 'ar' ? 'المشروع' : 'Project'}
              </p>
              <p className="text-sm text-gray-700">{data.projectName ?? data.project ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                {lang === 'ar' ? 'الحالة' : 'Status'}
              </p>
              <StatusBadge status={data.status ?? 'Draft'} />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                {lang === 'ar' ? 'بواسطة' : 'Created By'}
              </p>
              <p className="text-sm text-gray-700">{data.createdBy ?? data.createdByName ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                {lang === 'ar' ? 'تاريخ الإنشاء' : 'Created'}
              </p>
              <p className="text-sm text-gray-700">{formatDate(data.createdAt ?? data.created)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                {lang === 'ar' ? 'تاريخ التقديم' : 'Submitted'}
              </p>
              <p className="text-sm text-gray-700">{data.submittedAt ? formatDate(data.submittedAt) : '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                {lang === 'ar' ? 'تاريخ الاعتماد' : 'Approved'}
              </p>
              <p className="text-sm text-gray-700">{data.approvedAt ? formatDate(data.approvedAt) : '—'}</p>
            </div>
          </div>

          {data.notes && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                {lang === 'ar' ? 'ملاحظات' : 'Notes'}
              </p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">
                {data.notes}
              </p>
            </div>
          )}

          {data.content && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1">
                {lang === 'ar' ? 'المحتوى' : 'Content'}
              </p>
              <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto whitespace-pre-wrap">
                {data.content}
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { t, lang, isRTL } = useLang();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterType, setFilterType] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [generateOpen, setGenerateOpen] = useState(false);
  const [viewId, setViewId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const filters = { page, pageSize: PAGE_SIZE, search: search || undefined, projectId: filterProject || undefined, type: filterType || undefined, startDate: dateFrom || undefined, endDate: dateTo || undefined };

  const { data, isLoading } = useQuery({
    queryKey: ['reports', filters],
    queryFn: () => reportsApi.getAll(filters).then((r) => r.data?.data ?? r.data),
    placeholderData: (prev) => prev,
    staleTime: 60_000,
  });

  const { data: allData } = useQuery({
    queryKey: ['reports-all-summary'],
    queryFn: () => reportsApi.getAll({ pageSize: 500 }).then((r) => r.data?.data ?? r.data),
    staleTime: 120_000,
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects-all'],
    queryFn: () => projectsApi.getAll({ pageSize: 200 }).then((r) => r.data?.data ?? r.data),
    staleTime: 120_000,
  });

  const reports = data?.items ?? data?.reports ?? data?.data ?? (Array.isArray(data) ? data : []);
  const totalPages = data?.totalPages ?? Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE) ?? 1;
  const allReports = allData?.items ?? allData?.reports ?? allData?.data ?? (Array.isArray(allData) ? allData : []);
  const projects = projectsData?.items ?? projectsData?.projects ?? projectsData?.data ?? [];

  const byType = countByType(allReports);
  const topTypeRaw = Object.entries(byType).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const topTypeFound = topTypeRaw ? REPORT_TYPES.find(
    (t) => t.value === Number(topTypeRaw) || t.labelEn?.toLowerCase() === topTypeRaw.toLowerCase()
  ) : null;
  const topType = topTypeFound
    ? (lang === 'ar' ? topTypeFound.label : topTypeFound.labelEn)
    : (topTypeRaw ?? '—');

  const { mutate: deleteReport, isPending: isDeleting } = useMutation({
    mutationFn: (id) => reportsApi.delete(id),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم حذف التقرير' : 'Report deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['reports-all-summary'] });
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || (lang === 'ar' ? 'فشل الحذف' : 'Delete failed'));
    },
  });

  const handleDownload = async (report, format = 'pdf') => {
    setDownloadingId(report.id);
    try {
      const res = format === 'word'
        ? await reportsApi.exportWord(report.id)
        : await reportsApi.exportPdf(report.id);
      const blob = new Blob([res.data], {
        type: format === 'word'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${report.id}.${format === 'word' ? 'docx' : 'pdf'}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(lang === 'ar' ? 'فشل التنزيل' : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const headers = [
    lang === 'ar' ? 'التقرير' : 'Report',
    lang === 'ar' ? 'النوع' : 'Type',
    lang === 'ar' ? 'المشروع' : 'Project',
    lang === 'ar' ? 'تاريخ الإنشاء' : 'Created',
    lang === 'ar' ? 'الحالة' : 'Status',
    t('actions'),
  ];

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {lang === 'ar' ? 'التقارير' : t('reports') || 'Reports'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar' ? 'عرض وإدارة جميع التقارير' : 'View and manage all reports'}
          </p>
        </div>
        <button
          onClick={() => setGenerateOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
        >
          <Plus size={16} />
          {lang === 'ar' ? 'إنشاء تقرير' : 'Generate Report'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={lang === 'ar' ? 'إجمالي التقارير' : 'Total Reports'}
          value={allReports.length || data?.totalCount || '—'}
          icon={FileText}
          color="primary"
          loading={isLoading && allReports.length === 0}
        />
        <StatCard
          title={lang === 'ar' ? 'هذا الشهر' : 'This Month'}
          value={getThisMonthCount(allReports)}
          icon={Clock}
          color="blue"
          loading={isLoading && allReports.length === 0}
        />
        <StatCard
          title={lang === 'ar' ? 'النوع الأكثر شيوعاً' : 'Top Report Type'}
          value={topType}
          icon={BarChart2}
          color="green"
          loading={isLoading && allReports.length === 0}
        />
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input ps-9 text-sm"
              placeholder={lang === 'ar' ? 'بحث في التقارير...' : 'Search reports...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <select
            className="input text-sm"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{lang === 'ar' ? 'كل الأنواع' : 'All Types'}</option>
            {REPORT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {lang === 'ar' ? t.label : t.labelEn}
              </option>
            ))}
          </select>

          {projects.length > 0 && (
            <select
              className="input text-sm"
              value={filterProject}
              onChange={(e) => {
                setFilterProject(e.target.value);
                setPage(1);
              }}
            >
              <option value="">{lang === 'ar' ? 'كل المشاريع' : 'All Projects'}</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}

          <div className="flex gap-2">
            <input
              type="date"
              className="input text-sm flex-1"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              title={lang === 'ar' ? 'من' : 'From'}
            />
            <input
              type="date"
              className="input text-sm flex-1"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              title={lang === 'ar' ? 'إلى' : 'To'}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <Table
          headers={headers}
          loading={isLoading}
          empty={
            reports.length === 0 && !isLoading ? (
              <EmptyState
                icon={FileText}
                title={lang === 'ar' ? 'لا توجد تقارير' : 'No reports found'}
                description={
                  lang === 'ar'
                    ? 'ابدأ بإنشاء أول تقرير لك'
                    : 'Start by generating your first report'
                }
                action={
                  <button
                    onClick={() => setGenerateOpen(true)}
                    className="btn-primary text-sm px-4 py-2"
                  >
                    {lang === 'ar' ? 'إنشاء تقرير' : 'Generate Report'}
                  </button>
                }
              />
            ) : null
          }
        >
          {reports.map((report) => (
            <tr
              key={report.id}
              className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
            >
              <td className="table-cell">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                    {report.name ?? report.title ?? '—'}
                  </span>
                </div>
              </td>
              <td className="table-cell">
                <span className="badge bg-purple-100 text-purple-700">
                  {(() => {
                    const found = REPORT_TYPES.find(
                      (t) => t.value === report.type || t.labelEn?.toLowerCase() === String(report.type).toLowerCase()
                    );
                    return found ? (lang === 'ar' ? found.label : found.labelEn) : (report.type ?? '—');
                  })()}
                </span>
              </td>
              <td className="table-cell">
                <span className="text-sm text-gray-600">
                  {report.projectName ?? report.project ?? '—'}
                </span>
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar size={13} className="text-gray-400" />
                  {formatDate(report.createdAt ?? report.created)}
                </div>
              </td>
              <td className="table-cell">
                <StatusBadge status={report.status ?? 'Draft'} />
              </td>
              <td className="table-cell">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewId(report.id)}
                    className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors"
                    title={lang === 'ar' ? 'عرض' : 'View'}
                  >
                    <Eye size={15} />
                  </button>
                  <button
                    onClick={() => handleDownload(report)}
                    disabled={downloadingId === report.id}
                    className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                    title={lang === 'ar' ? 'تنزيل' : 'Download'}
                  >
                    {downloadingId === report.id ? (
                      <Spinner size="sm" />
                    ) : (
                      <Download size={15} />
                    )}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(report)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                    title={lang === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <Filter size={15} className="rotate-45" />
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

      <GenerateReportModal open={generateOpen} onClose={() => setGenerateOpen(false)} />

      <ViewReportModal
        reportId={viewId}
        open={!!viewId}
        onClose={() => setViewId(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteReport(deleteTarget?.id)}
        loading={isDeleting}
        title={lang === 'ar' ? 'حذف التقرير' : 'Delete Report'}
        message={
          lang === 'ar'
            ? `هل أنت متأكد من حذف "${deleteTarget?.name ?? deleteTarget?.title}"؟`
            : `Are you sure you want to delete "${deleteTarget?.name ?? deleteTarget?.title}"? This cannot be undone.`
        }
      />
    </div>
  );
}
