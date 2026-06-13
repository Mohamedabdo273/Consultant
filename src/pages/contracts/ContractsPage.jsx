import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import {
  Plus,
  FileText,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  ImagePlus,
  X,
  Download,
  Loader2,
} from 'lucide-react';
import { contractsApi, projectsApi, usersApi, attachmentsApi, adminApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
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
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(v, currency = 'USD') {
  if (v == null) return '—';
  return new Intl.NumberFormat(undefined, { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(v);
}

// ── Contract Images Section ───────────────────────────────────────────────────
function ContractImages({ contractId, readOnly = false }) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const fileRef = useRef();
  const [uploading, setUploading] = useState(false);

  const { data: attachments = [], isLoading } = useQuery({
    queryKey: ['contract-attachments', contractId],
    queryFn: () => attachmentsApi.getByEntity('contract', contractId).then(r => r.data?.data ?? r.data ?? []),
    enabled: !!contractId,
    staleTime: 30_000,
  });

  const images = Array.isArray(attachments)
    ? attachments.filter(a => a.contentType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(a.fileName ?? a.originalFileName ?? ''))
    : [];

  const { mutate: deleteAtt } = useMutation({
    mutationFn: (id) => attachmentsApi.delete(id),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم حذف الصورة' : 'Image deleted');
      queryClient.invalidateQueries({ queryKey: ['contract-attachments', contractId] });
    },
    onError: () => toast.error(lang === 'ar' ? 'فشل الحذف' : 'Delete failed'),
  });

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        await attachmentsApi.upload('contract', contractId, file);
      }
      toast.success(lang === 'ar' ? 'تم رفع الصور' : 'Images uploaded');
      queryClient.invalidateQueries({ queryKey: ['contract-attachments', contractId] });
    } catch {
      toast.error(lang === 'ar' ? 'فشل رفع الصور' : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDownload = (att) => {
    const url = (att.downloadUrl ?? '').replace('/view', '/download');
    const a = document.createElement('a');
    a.href = url;
    a.download = att.fileName ?? 'image';
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700">
          {lang === 'ar' ? 'صور العقد' : 'Contract Images'}
          {images.length > 0 && <span className="ms-1 text-xs text-gray-400">({images.length})</span>}
        </p>
        {!readOnly && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />}
              {lang === 'ar' ? 'رفع صور' : 'Upload Images'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
            />
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Spinner size="sm" /></div>
      ) : images.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
          <ImagePlus size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-xs text-gray-400">
            {lang === 'ar' ? 'لا توجد صور مرفقة' : 'No images attached'}
          </p>
          {!readOnly && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-2 text-xs text-primary-600 hover:underline"
            >
              {lang === 'ar' ? 'اضغط لرفع صور' : 'Click to upload'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {images.map((att) => (
            <div key={att.id} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-gray-50">
              <img
                src={att.downloadUrl ?? att.filePath ?? att.url}
                alt={att.fileName ?? att.originalFileName}
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(att)}
                  className="p-1 rounded-full bg-white/80 hover:bg-white text-gray-700"
                  title={lang === 'ar' ? 'تنزيل' : 'Download'}
                >
                  <Download size={12} />
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => deleteAtt(att.id)}
                    className="p-1 rounded-full bg-white/80 hover:bg-white text-red-600"
                    title={lang === 'ar' ? 'حذف' : 'Delete'}
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
              <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 truncate">
                {att.fileName ?? att.originalFileName}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── View Contract Modal ───────────────────────────────────────────────────────
function ViewContractModal({ contract, open, onClose }) {
  const { lang } = useLang();
  if (!contract) return null;
  return (
    <Modal open={open} onClose={onClose} title={contract.title ?? (lang === 'ar' ? 'تفاصيل العقد' : 'Contract Details')} size="lg">
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
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'المشروع' : 'Project'}</p>
            <p className="font-medium text-gray-900">{contract.projectName ?? '—'}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'تاريخ البداية' : 'Start Date'}</p>
            <p className="font-medium text-gray-900">{formatDate(contract.startDate)}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</p>
            <p className="font-medium text-gray-900">{formatDate(contract.endDate)}</p>
          </div>
        </div>
        {contract.content && (
          <div>
            <p className="text-gray-500 text-xs mb-1">{lang === 'ar' ? 'محتوى العقد' : 'Contract Content'}</p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
              {contract.content}
            </div>
          </div>
        )}
        <div className="border-t border-gray-100 pt-4">
          <ContractImages contractId={contract.id} readOnly={false} />
        </div>
      </div>
    </Modal>
  );
}

// ── Create Contract Modal ─────────────────────────────────────────────────────
function CreateContractModal({ open, onClose }) {
  const { lang } = useLang();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const queryClient = useQueryClient();
  const [createdId, setCreatedId] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileRef = useRef();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ defaultValues: { currency: 'EGP' } });

  // SuperAdmin: جلب كل الشركات
  const { data: companiesData } = useQuery({
    queryKey: ['companies-dropdown'],
    queryFn: async () => {
      const r = await adminApi.getCompanies({ pageSize: 200 });
      const raw = r.data?.data ?? r.data;
      return Array.isArray(raw) ? raw : raw?.items ?? raw?.companies ?? raw?.data ?? [];
    },
    enabled: open && isSuperAdmin,
    staleTime: 120_000,
  });
  const companies = Array.isArray(companiesData) ? companiesData : [];

  const { data: projectsData } = useQuery({
    queryKey: ['projects-dropdown', selectedCompanyId],
    queryFn: async () => {
      const r = await projectsApi.getAll({
        pageSize: 100,
        ...(isSuperAdmin && selectedCompanyId ? { companyId: selectedCompanyId } : {}),
      });
      const raw = r.data?.data ?? r.data;
      const arr = Array.isArray(raw) ? raw : raw?.items ?? raw?.projects ?? raw?.data ?? [];
      return arr;
    },
    enabled: open && (!isSuperAdmin || !!selectedCompanyId),
    staleTime: 120_000,
  });
  const projects = Array.isArray(projectsData) ? projectsData : projectsData?.items ?? [];

  const { data: clientsData } = useQuery({
    queryKey: ['clients-dropdown', selectedCompanyId],
    queryFn: async () => {
      const r = await usersApi.getAll({
        pageSize: 200,
        ...(isSuperAdmin && selectedCompanyId ? { companyId: selectedCompanyId } : {}),
      });
      const raw = r.data?.data ?? r.data;
      return Array.isArray(raw) ? raw : raw?.items ?? raw?.users ?? raw?.data ?? [];
    },
    enabled: open && (!isSuperAdmin || !!selectedCompanyId),
    staleTime: 120_000,
  });
  const allUsers = Array.isArray(clientsData) ? clientsData : [];
  const clients = allUsers.filter(u => !['Admin', 'SuperAdmin'].includes(u.role));

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => contractsApi.create(data),
    onSuccess: async (res) => {
      const body = res.data;
      const id = body?.data?.id ?? body?.id ?? body?.data?.Id ?? body?.Id;
      queryClient.invalidateQueries({ queryKey: ['contracts'] });

      if (id && pendingFiles.length > 0) {
        setUploadingImages(true);
        try {
          for (const file of pendingFiles) {
            await attachmentsApi.upload('contract', id, file);
          }
          toast.success(lang === 'ar' ? 'تم إنشاء العقد ورفع الصور' : 'Contract created with images');
        } catch {
          toast.success(lang === 'ar' ? 'تم إنشاء العقد' : 'Contract created');
          toast.error(lang === 'ar' ? 'فشل رفع بعض الصور' : 'Some images failed to upload');
        } finally {
          setUploadingImages(false);
        }
        handleClose();
      } else {
        toast.success(lang === 'ar' ? 'تم إنشاء العقد' : 'Contract created');
        if (id) setCreatedId(id);
        else handleClose();
      }
    },
    onError: (err) => toast.error(err?.response?.data?.message || (lang === 'ar' ? 'فشل إنشاء العقد' : 'Failed to create contract')),
  });

  const handleClose = () => { reset(); setCreatedId(null); setSelectedCompanyId(''); setPendingFiles([]); onClose(); };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removePendingFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data) => {
    mutate({
      ...(isSuperAdmin && selectedCompanyId ? { targetCompanyId: selectedCompanyId } : {}),
      title:        data.title,
      content:      data.content,
      projectId:    data.projectId    || undefined,
      clientUserId: data.clientUserId || undefined,
      value:        data.value        ? Number(data.value) : undefined,
      currency:     data.currency     || 'EGP',
      startDate:    data.startDate    || undefined,
      endDate:      data.endDate      || undefined,
    });
  };

  return (
    <Modal open={open} onClose={handleClose} title={lang === 'ar' ? 'إنشاء عقد جديد' : 'Create New Contract'} size="lg">
      {!createdId ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <FormField label={lang === 'ar' ? 'عنوان العقد' : 'Contract Title'} required error={errors.title?.message}>
                <input
                  type="text"
                  className={`input ${errors.title ? 'border-red-400' : ''}`}
                  placeholder={lang === 'ar' ? 'أدخل عنوان العقد' : 'Enter contract title'}
                  {...register('title', { required: lang === 'ar' ? 'العنوان مطلوب' : 'Title is required' })}
                />
              </FormField>
            </div>

            {/* SuperAdmin: اختر الشركة أولاً */}
            {isSuperAdmin && (
              <div className="sm:col-span-2">
                <FormField label={lang === 'ar' ? 'الشركة' : 'Company'} required>
                  <select
                    className="input"
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                  >
                    <option value="">{lang === 'ar' ? 'اختر الشركة' : 'Select company'}</option>
                    {companies.map((c) => <option key={c.companyId ?? c.id} value={c.companyId ?? c.id}>{c.companyName ?? c.name}</option>)}
                  </select>
                </FormField>
              </div>
            )}

            <FormField label={lang === 'ar' ? 'العميل' : 'Client'} error={errors.clientUserId?.message}>
              <select
                className="input"
                disabled={isSuperAdmin && !selectedCompanyId}
                {...register('clientUserId', { required: lang === 'ar' ? 'العميل مطلوب' : 'Client required' })}
              >
                <option value="">{lang === 'ar' ? 'اختر عميل' : 'Select client'}</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.fullName ?? c.name ?? c.email}</option>)}
              </select>
            </FormField>

            <FormField label={lang === 'ar' ? 'المشروع' : 'Project'}>
              <select
                className="input"
                disabled={isSuperAdmin && !selectedCompanyId}
                {...register('projectId')}
              >
                <option value="">{lang === 'ar' ? 'اختر مشروع' : 'Select project'}</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </FormField>

            <FormField label={lang === 'ar' ? 'القيمة' : 'Value'}>
              <input type="number" min="0" step="0.01" className="input" placeholder="0.00" {...register('value')} />
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

            <FormField label={lang === 'ar' ? 'تاريخ البداية' : 'Start Date'}>
              <input type="date" className="input" {...register('startDate')} />
            </FormField>

            <FormField label={lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}>
              <input type="date" className="input" {...register('endDate')} />
            </FormField>
          </div>

          <FormField label={lang === 'ar' ? 'محتوى العقد' : 'Contract Content'}>
            <textarea rows={4} className="input resize-none"
              placeholder={lang === 'ar' ? 'أدخل بنود العقد...' : 'Enter contract terms...'}
              {...register('content')} />
          </FormField>

          {/* قسم رفع صور العقد */}
          <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {lang === 'ar' ? 'صور العقد' : 'Contract Images'}
                {pendingFiles.length > 0 && (
                  <span className="ms-2 text-xs bg-primary-100 text-primary-700 rounded-full px-2 py-0.5">
                    {pendingFiles.length}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                <ImagePlus size={13} />
                {lang === 'ar' ? 'إضافة صور' : 'Add Images'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileSelect} />
            </div>

            {pendingFiles.length === 0 ? (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full py-4 text-center text-xs text-gray-400 hover:text-primary-500 transition-colors">
                <ImagePlus size={20} className="mx-auto mb-1 opacity-40" />
                {lang === 'ar' ? 'اضغط لإضافة صور العقد' : 'Click to add contract images'}
              </button>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square bg-white">
                    <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePendingFile(i)}
                      className="absolute top-1 right-1 p-0.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} />
                    </button>
                    <p className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] px-1 py-0.5 truncate">
                      {f.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={handleClose} className="btn-secondary text-sm px-4 py-2">
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" disabled={isPending || uploadingImages} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
              {(isPending || uploadingImages) ? <Spinner size="sm" /> : (lang === 'ar' ? 'إنشاء العقد' : 'Create Contract')}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
            <span>✓</span>
            <span>{lang === 'ar' ? 'تم إنشاء العقد بنجاح. يمكنك الآن رفع صور العقد.' : 'Contract created. You can now upload contract images.'}</span>
          </div>
          <ContractImages contractId={createdId} readOnly={false} />
          <div className="flex justify-end pt-2">
            <button onClick={handleClose} className="btn-primary text-sm px-4 py-2">
              {lang === 'ar' ? 'تم' : 'Done'}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Edit Contract Modal ───────────────────────────────────────────────────────
function EditContractModal({ contract, open, onClose }) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    if (contract && open) {
      reset({
        title:     contract.title    ?? '',
        content:   contract.content  ?? '',
        value:     contract.value    ?? '',
        currency:  contract.currency ?? 'EGP',
        startDate: contract.startDate ? contract.startDate.slice(0, 10) : '',
        endDate:   contract.endDate   ? contract.endDate.slice(0, 10)   : '',
      });
    }
  }, [contract, open]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => contractsApi.update(contract.id, data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم تحديث العقد' : 'Contract updated');
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
    onError: (err) => toast.error(err?.response?.data?.message || (lang === 'ar' ? 'فشل التحديث' : 'Update failed')),
  });

  const onSubmit = (data) => {
    mutate({
      title:        data.title,
      content:      data.content,
      projectId:    contract.projectId,
      clientUserId: contract.clientUserId,
      value:        Number(data.value) || 0,
      currency:     data.currency,
      startDate:    data.startDate || undefined,
      endDate:      data.endDate   || undefined,
    });
  };

  if (!contract) return null;

  return (
    <Modal open={open} onClose={onClose} title={lang === 'ar' ? 'تعديل العقد' : 'Edit Contract'} size="lg">
      <div className="space-y-5">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <FormField label={lang === 'ar' ? 'عنوان العقد' : 'Title'} required error={errors.title?.message}>
            <input type="text" className={`input ${errors.title ? 'border-red-400' : ''}`}
              {...register('title', { required: lang === 'ar' ? 'العنوان مطلوب' : 'Title required' })} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label={lang === 'ar' ? 'القيمة' : 'Value'}>
              <input type="number" min="0" step="0.01" className="input" {...register('value')} />
            </FormField>
            <FormField label={lang === 'ar' ? 'العملة' : 'Currency'}>
              <select className="input" {...register('currency')}>
                <option value="EGP">EGP — جنيه مصري</option>
                <option value="USD">USD — دولار أمريكي</option>
                <option value="EUR">EUR — يورو</option>
                <option value="SAR">SAR — ريال سعودي</option>
                <option value="AED">AED — درهم إماراتي</option>
              </select>
            </FormField>
            <FormField label={lang === 'ar' ? 'تاريخ البداية' : 'Start Date'}>
              <input type="date" className="input" {...register('startDate')} />
            </FormField>
            <FormField label={lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}>
              <input type="date" className="input" {...register('endDate')} />
            </FormField>
          </div>

          <FormField label={lang === 'ar' ? 'محتوى العقد' : 'Content'} required error={errors.content?.message}>
            <textarea rows={4} className="input resize-none"
              {...register('content', { required: lang === 'ar' ? 'محتوى العقد مطلوب' : 'Content required' })} />
          </FormField>

          <div className="flex justify-end gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary text-sm px-4 py-2">
              {lang === 'ar' ? 'إلغاء' : 'Cancel'}
            </button>
            <button type="submit" disabled={isPending} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
              {isPending ? <Spinner size="sm" /> : (lang === 'ar' ? 'حفظ التعديلات' : 'Save Changes')}
            </button>
          </div>
        </form>

        <div className="border-t border-gray-100 pt-4">
          <ContractImages contractId={contract.id} readOnly={false} />
        </div>
      </div>
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
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', page],
    queryFn: () => contractsApi.getAll({ page, pageSize: PAGE_SIZE }).then((r) => r.data?.data ?? r.data),
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
    onError: (err) => toast.error(err?.response?.data?.message || (lang === 'ar' ? 'فشل حذف العقد' : 'Failed to delete contract')),
  });

  const headers = [
    lang === 'ar' ? 'العنوان' : 'Title',
    lang === 'ar' ? 'العميل' : 'Client',
    t('status'),
    lang === 'ar' ? 'تاريخ البداية' : 'Start Date',
    lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date',
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t('contracts')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{lang === 'ar' ? 'إدارة العقود والاتفاقيات' : 'Manage contracts and agreements'}</p>
        </div>
        {isAdmin && (
          <button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
            <Plus size={16} />
            {lang === 'ar' ? 'عقد جديد' : 'New Contract'}
          </button>
        )}
      </div>

      <div className="card overflow-hidden p-0">
        <Table
          headers={headers}
          loading={isLoading}
          empty={
            contracts.length === 0 && !isLoading ? (
              <EmptyState
                icon={FileText}
                title={lang === 'ar' ? 'لا توجد عقود' : 'No contracts found'}
                description={lang === 'ar' ? 'ابدأ بإنشاء أول عقد' : 'Start by creating your first contract'}
                action={isAdmin ? (
                  <button onClick={() => setCreateOpen(true)} className="btn-primary text-sm px-4 py-2 mt-3">
                    {lang === 'ar' ? 'إنشاء عقد' : 'Create Contract'}
                  </button>
                ) : null}
              />
            ) : null
          }
        >
          {contracts.map((contract) => {
            const endDate = contract.endDate ?? contract.expiryDate;
            const expiringSoon = isExpiringSoon(endDate);
            const expired = endDate && new Date(endDate) < new Date();

            return (
              <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <FileText size={13} className="text-purple-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{contract.title}</span>
                  </div>
                </td>
                <td className="table-cell">
                  <span className="text-sm text-gray-700">{contract.clientName ?? '—'}</span>
                </td>
                <td className="table-cell">
                  <StatusBadge status={contract.status} />
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Calendar size={13} className="text-gray-400" />
                    {formatDate(contract.startDate)}
                  </div>
                </td>
                <td className="table-cell">
                  <div className={`flex items-center gap-1 text-sm ${expired ? 'text-red-600' : expiringSoon ? 'text-yellow-600' : 'text-gray-500'}`}>
                    <Calendar size={13} className={expired ? 'text-red-400' : expiringSoon ? 'text-yellow-400' : 'text-gray-400'} />
                    {formatDate(endDate)}
                    {expiringSoon && !expired && <span className="text-xs bg-yellow-100 text-yellow-700 rounded px-1 py-0.5">{lang === 'ar' ? 'قريباً' : 'Soon'}</span>}
                    {expired && <span className="text-xs bg-red-100 text-red-700 rounded px-1 py-0.5">{lang === 'ar' ? 'منتهي' : 'Expired'}</span>}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                    <DollarSign size={13} className="text-gray-400" />
                    {formatCurrency(contract.value, contract.currency)}
                  </div>
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1">
                    <button onClick={() => setViewTarget(contract)} className="p-1.5 rounded-lg hover:bg-primary-50 text-gray-400 hover:text-primary-600 transition-colors" title={t('view')}>
                      <Eye size={15} />
                    </button>
                    {isAdmin && (
                      <button onClick={() => setEditTarget(contract)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title={lang === 'ar' ? 'تعديل' : 'Edit'}>
                        <Pencil size={15} />
                      </button>
                    )}
                    {isAdmin && contract.approvalStatus === 'Pending' && (
                      <>
                        <button onClick={() => approveContract(contract.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title={lang === 'ar' ? 'موافقة' : 'Approve'}>
                          <ThumbsUp size={15} />
                        </button>
                        <button onClick={() => { if (confirm(lang === 'ar' ? 'رفض العقد؟' : 'Reject contract?')) rejectContract(contract.id); }} className="p-1.5 rounded-lg hover:bg-orange-50 text-gray-400 hover:text-orange-600 transition-colors" title={lang === 'ar' ? 'رفض' : 'Reject'}>
                          <ThumbsDown size={15} />
                        </button>
                      </>
                    )}
                    {isAdmin && (
                      <button onClick={() => setDeleteTarget(contract)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors" title={t('delete')}>
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

      <CreateContractModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <ViewContractModal contract={viewTarget} open={!!viewTarget} onClose={() => setViewTarget(null)} />
      <EditContractModal contract={editTarget} open={!!editTarget} onClose={() => setEditTarget(null)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteContract(deleteTarget?.id)}
        loading={isDeleting}
        title={lang === 'ar' ? 'حذف العقد' : 'Delete Contract'}
        message={lang === 'ar' ? `هل أنت متأكد من حذف العقد "${deleteTarget?.title}"؟` : `Are you sure you want to delete "${deleteTarget?.title}"?`}
      />
    </div>
  );
}
