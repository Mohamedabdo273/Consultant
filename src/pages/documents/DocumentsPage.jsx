import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import {
  Upload,
  Download,
  Trash2,
  FileText,
  Image,
  File,
  FileCog,
  LayoutGrid,
  List,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  BrainCircuit,
} from 'lucide-react';
import { documentsApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import {
  EmptyState,
  StatusBadge,
  ConfirmDialog,
  Pagination,
  StatCard,
  Spinner,
} from '../../components/common/index';

const PAGE_SIZE = 18;

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Uploaded', label: 'Uploaded' },
  { value: 'Processing', label: 'Processing' },
  { value: 'Done', label: 'Done' },
  { value: 'Failed', label: 'Failed' },
];

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatSize(bytes) {
  if (bytes == null) return '—';
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function getFileIconInfo(name, mimeType) {
  const ext = (name ?? '').split('.').pop()?.toLowerCase() ?? '';
  const mime = mimeType ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext) || mime.startsWith('image/')) {
    return { Icon: Image, color: 'text-pink-500', bg: 'bg-pink-50' };
  }
  if (['pdf'].includes(ext) || mime === 'application/pdf') {
    return { Icon: FileText, color: 'text-red-500', bg: 'bg-red-50' };
  }
  if (['doc', 'docx'].includes(ext)) {
    return { Icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50' };
  }
  if (['xls', 'xlsx', 'csv'].includes(ext)) {
    return { Icon: FileText, color: 'text-green-500', bg: 'bg-green-50' };
  }
  if (['ppt', 'pptx'].includes(ext)) {
    return { Icon: FileText, color: 'text-orange-500', bg: 'bg-orange-50' };
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
    return { Icon: FileCog, color: 'text-yellow-600', bg: 'bg-yellow-50' };
  }
  return { Icon: File, color: 'text-gray-500', bg: 'bg-gray-100' };
}

const STATUS_ICON_MAP = {
  Done: <CheckCircle2 size={13} className="text-green-500" />,
  Processing: <Loader2 size={13} className="text-blue-500 animate-spin" />,
  Failed: <AlertCircle size={13} className="text-red-500" />,
  Uploaded: <CheckCircle2 size={13} className="text-gray-400" />,
};

// ── Upload Progress Bar ───────────────────────────────────────────────────────
function UploadProgress({ progress, fileName }) {
  return (
    <div className="card p-4 flex items-center gap-4">
      <Loader2 size={18} className="text-primary-600 animate-spin flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{fileName}</p>
        <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-medium text-gray-600 flex-shrink-0">{progress}%</span>
    </div>
  );
}

// ── Document Card (grid view) ─────────────────────────────────────────────────
function DocumentCard({ doc, onDelete, onDownload, onAnalyze, isDownloading, isAnalyzing, lang }) {
  const name = doc.name ?? doc.fileName ?? doc.originalFileName ?? 'Untitled';
  const { Icon, color, bg } = getFileIconInfo(name, doc.mimeType ?? doc.contentType);
  const canAnalyze = doc.status === 'Done' || doc.status === 'Uploaded';

  return (
    <div className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
          <Icon size={20} className={color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate" title={name}>
            {name}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {formatSize(doc.size ?? doc.fileSize)}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {STATUS_ICON_MAP[doc.status] ?? STATUS_ICON_MAP['Uploaded']}
          <StatusBadge status={doc.status ?? 'Uploaded'} />
        </div>
        <p className="text-xs text-gray-400">
          {formatDate(doc.uploadedAt ?? doc.createdAt ?? doc.created)}
        </p>
      </div>

      {doc.status === 'Failed' && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-lg px-2 py-1.5">
          <AlertCircle size={12} />
          {lang === 'ar' ? 'فشلت المعالجة' : 'Processing failed'}
        </div>
      )}

      {/* Analyze button — prominent */}
      {canAnalyze && (
        <button
          onClick={() => onAnalyze(doc)}
          disabled={isAnalyzing}
          className="w-full btn-primary text-xs py-1.5 flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {isAnalyzing ? <Loader2 size={13} className="animate-spin" /> : <BrainCircuit size={13} />}
          {isAnalyzing
            ? (lang === 'ar' ? 'جارٍ التحليل...' : 'Analyzing...')
            : (lang === 'ar' ? 'تحليل بالذكاء الاصطناعي' : 'Analyze with AI')}
        </button>
      )}

      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onDownload(doc)}
          disabled={isDownloading}
          className="flex-1 btn-secondary text-xs py-1.5 flex items-center justify-center gap-1 disabled:opacity-50"
        >
          {isDownloading ? <Spinner size="sm" /> : <Download size={13} />}
          {lang === 'ar' ? 'تنزيل' : 'Download'}
        </button>
        <button
          onClick={() => onDelete(doc)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
          title={lang === 'ar' ? 'حذف' : 'Delete'}
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DocumentsPage() {
  const { t, lang, isRTL } = useLang();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [analyzingId, setAnalyzingId] = useState(null);

  const filters = {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
    status: filterStatus || undefined,
  };

  const { data, isLoading } = useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentsApi.getAll(filters).then((r) => r.data?.data ?? r.data),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
    refetchInterval: 15_000,
  });

  const { data: allData } = useQuery({
    queryKey: ['documents-summary'],
    queryFn: () => documentsApi.getAll({ pageSize: 500 }).then((r) => r.data?.data ?? r.data),
    staleTime: 30_000,
    refetchInterval: 15_000,
  });

  const docs =
    data?.items ?? data?.documents ?? data?.data ?? (Array.isArray(data) ? data : []);
  const totalPages =
    data?.totalPages ?? Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE) ?? 1;
  const allDocs =
    allData?.items ?? allData?.documents ?? allData?.data ?? (Array.isArray(allData) ? allData : []);

  const totalCount = allData?.totalCount ?? allDocs.length;
  const doneCount = allDocs.filter((d) => d.status === 'Done').length;
  const processingCount = allDocs.filter(
    (d) => d.status === 'Processing' || d.status === 'Uploaded'
  ).length;

  const { mutate: deleteDoc, isPending: isDeleting } = useMutation({
    mutationFn: (id) => documentsApi.delete(id),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم حذف الملف' : 'Document deleted');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['documents-summary'] });
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.message || (lang === 'ar' ? 'فشل الحذف' : 'Delete failed')
      );
    },
  });

  const handleAnalyze = async (doc) => {
    setAnalyzingId(doc.id);
    try {
      await documentsApi.analyze(doc.id);
      toast.success(
        lang === 'ar'
          ? `بدأ تحليل "${doc.name ?? doc.fileName ?? 'الملف'}" — ستظهر النتائج في صفحة التحليل الذكي`
          : `Analysis started for "${doc.name ?? doc.fileName ?? 'file'}" — results will appear in AI Dashboard`
      );
    } catch (err) {
      toast.error(
        err?.response?.data?.message || (lang === 'ar' ? 'فشل بدء التحليل' : 'Failed to start analysis')
      );
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadFileName(file.name);
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('file', file);

      try {
        await api.post('/documents/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (ev) => {
            const pct = Math.round((ev.loaded * 100) / (ev.total ?? 1));
            setUploadProgress(pct);
          },
        });

        toast.success(lang === 'ar' ? 'تم رفع الملف بنجاح' : 'File uploaded successfully');
        queryClient.invalidateQueries({ queryKey: ['documents'] });
        queryClient.invalidateQueries({ queryKey: ['documents-summary'] });
      } catch (err) {
        toast.error(
          err?.response?.data?.message ||
            (lang === 'ar' ? 'فشل رفع الملف' : 'Upload failed')
        );
      } finally {
        setUploadProgress(null);
        setUploadFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [lang, queryClient]
  );

  const handleDownload = async (doc) => {
    setDownloadingId(doc.id);
    try {
      const res = await documentsApi.download(doc.id);
      const url =
        res?.data?.downloadUrl ??
        res?.data?.url ??
        res?.data?.fileUrl ??
        (typeof res?.data === 'string' ? res.data : null);
      if (url) {
        window.open(url, '_blank');
      } else {
        toast.error(lang === 'ar' ? 'رابط التنزيل غير متوفر' : 'Download URL not available');
      }
    } catch {
      toast.error(lang === 'ar' ? 'فشل التنزيل' : 'Download failed');
    } finally {
      setDownloadingId(null);
    }
  };

  const tableHeaders = [
    lang === 'ar' ? 'الملف' : 'File',
    lang === 'ar' ? 'الحجم' : 'Size',
    lang === 'ar' ? 'تاريخ الرفع' : 'Uploaded',
    lang === 'ar' ? 'الحالة' : 'Status',
    t('actions'),
  ];

  return (
    <div className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {lang === 'ar' ? 'المستندات' : 'Documents'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar'
              ? 'رفع وإدارة الملفات والمستندات'
              : 'Upload and manage files and documents'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadProgress !== null}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            {uploadProgress !== null ? <Spinner size="sm" /> : <Upload size={16} />}
            {lang === 'ar' ? 'رفع ملف' : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress !== null && (
        <UploadProgress progress={uploadProgress} fileName={uploadFileName} />
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={lang === 'ar' ? 'إجمالي الملفات' : 'Total Documents'}
          value={totalCount || 0}
          icon={File}
          color="primary"
          loading={isLoading && allDocs.length === 0}
        />
        <StatCard
          title={lang === 'ar' ? 'مكتملة' : 'Processed'}
          value={doneCount}
          icon={CheckCircle2}
          color="green"
          loading={isLoading && allDocs.length === 0}
        />
        <StatCard
          title={lang === 'ar' ? 'قيد المعالجة' : 'Processing'}
          value={processingCount}
          icon={Loader2}
          color="blue"
          loading={isLoading && allDocs.length === 0}
        />
      </div>

      {/* Filters + View Toggle */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            className="input ps-9 text-sm"
            placeholder={lang === 'ar' ? 'بحث في الملفات...' : 'Search documents...'}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          className="input text-sm w-full sm:w-44"
          value={filterStatus}
          onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1 flex-shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title={lang === 'ar' ? 'عرض شبكي' : 'Grid view'}
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list'
                ? 'bg-primary-50 text-primary-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
            title={lang === 'ar' ? 'عرض قائمة' : 'List view'}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && docs.length === 0 && (
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-2'
          }
        >
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
                </div>
              </div>
              <div className="h-3 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && docs.length === 0 && (
        <div className="card">
          <EmptyState
            icon={Upload}
            title={lang === 'ar' ? 'لا توجد مستندات' : 'No documents yet'}
            description={
              lang === 'ar'
                ? 'ارفع أول ملف لبدء إدارة مستنداتك'
                : 'Upload your first file to start managing documents'
            }
            action={
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-primary text-sm px-4 py-2 flex items-center gap-2"
              >
                <Upload size={15} />
                {lang === 'ar' ? 'رفع ملف' : 'Upload File'}
              </button>
            }
          />
        </div>
      )}

      {/* Grid View */}
      {!isLoading && docs.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {docs.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              onDelete={setDeleteTarget}
              onDownload={handleDownload}
              onAnalyze={handleAnalyze}
              isDownloading={downloadingId === doc.id}
              isAnalyzing={analyzingId === doc.id}
              lang={lang}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {!isLoading && docs.length > 0 && viewMode === 'list' && (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="table-header">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map((doc) => {
                  const name =
                    doc.name ?? doc.fileName ?? doc.originalFileName ?? 'Untitled';
                  const { Icon, color, bg } = getFileIconInfo(
                    name,
                    doc.mimeType ?? doc.contentType
                  );
                  return (
                    <tr
                      key={doc.id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="table-cell">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}
                          >
                            <Icon size={15} className={color} />
                          </div>
                          <span
                            className="text-sm font-medium text-gray-900 truncate max-w-[200px]"
                            title={name}
                          >
                            {name}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-500">
                          {formatSize(doc.size ?? doc.fileSize)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-sm text-gray-500">
                          {formatDate(doc.uploadedAt ?? doc.createdAt ?? doc.created)}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1.5">
                          {STATUS_ICON_MAP[doc.status] ?? STATUS_ICON_MAP['Uploaded']}
                          <StatusBadge status={doc.status ?? 'Uploaded'} />
                        </div>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          {(doc.status === 'Done' || doc.status === 'Uploaded') && (
                            <button
                              onClick={() => handleAnalyze(doc)}
                              disabled={analyzingId === doc.id}
                              className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                              title={lang === 'ar' ? 'تحليل بالذكاء الاصطناعي' : 'Analyze with AI'}
                            >
                              {analyzingId === doc.id ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : (
                                <BrainCircuit size={15} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => handleDownload(doc)}
                            disabled={downloadingId === doc.id}
                            className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                            title={lang === 'ar' ? 'تنزيل' : 'Download'}
                          >
                            {downloadingId === doc.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <Download size={15} />
                            )}
                          </button>
                          <button
                            onClick={() => setDeleteTarget(doc)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                            title={lang === 'ar' ? 'حذف' : 'Delete'}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteDoc(deleteTarget?.id)}
        loading={isDeleting}
        title={lang === 'ar' ? 'حذف المستند' : 'Delete Document'}
        message={
          lang === 'ar'
            ? `هل أنت متأكد من حذف "${deleteTarget?.name ?? deleteTarget?.fileName ?? deleteTarget?.originalFileName}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : `Are you sure you want to delete "${deleteTarget?.name ?? deleteTarget?.fileName ?? deleteTarget?.originalFileName}"? This action cannot be undone.`
        }
      />
    </div>
  );
}
