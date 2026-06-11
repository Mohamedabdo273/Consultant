import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Building2, Search, Trash2, MoreVertical, CheckCircle,
  XCircle, Clock, Users, TrendingUp, AlertCircle, FileText,
} from 'lucide-react';
import { adminApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import {
  EmptyState, StatusBadge, ConfirmDialog,
  Pagination, StatCard, Table,
} from '../../components/common/index';

const AR = {
  title: 'إدارة الشركات',
  subtitle: 'إدارة جميع الشركات المسجلة في المنصة',
  totalCompanies: 'إجمالي الشركات',
  activeCompanies: 'الشركات النشطة',
  suspended: 'موقوفة',
  search: 'بحث',
  searchPlaceholder: 'بحث بالاسم...',
  status: 'الحالة',
  plan: 'الخطة',
  allStatuses: 'جميع الحالات',
  allPlans: 'جميع الخطط',
  Active: 'نشط',
  Suspended: 'موقوف',
  Pending: 'قيد الانتظار',
  Free: 'مجاني',
  Starter: 'مبتدئ',
  Professional: 'احترافي',
  Enterprise: 'مؤسسي',
  company: 'الشركة',
  users: 'المستخدمون',
  docs: 'المستندات',
  score: 'الدرجة',
  actions: 'الإجراءات',
  noCompanies: 'لا توجد شركات',
  noMatch: 'لا توجد شركات تطابق الفلتر الحالي.',
  deleteTitle: 'حذف الشركة',
  deleteMsg: (name) => `هل أنت متأكد من حذف "${name}"؟ لا يمكن التراجع وسيتم حذف كل البيانات.`,
  setActive: 'تفعيل',
  setSuspended: 'إيقاف',
  setPending: 'قيد الانتظار',
  statusUpdated: 'تم تحديث الحالة بنجاح',
  statusFailed: 'فشل تحديث الحالة',
  deleted: 'تم حذف الشركة',
  deleteFailed: 'فشل الحذف',
};

const EN = {
  title: 'Companies Management',
  subtitle: 'Manage all registered companies on the platform',
  totalCompanies: 'Total Companies',
  activeCompanies: 'Active Companies',
  suspended: 'Suspended',
  search: 'Search',
  searchPlaceholder: 'Search by name...',
  status: 'Status',
  plan: 'Plan',
  allStatuses: 'All Statuses',
  allPlans: 'All Plans',
  Active: 'Active',
  Suspended: 'Suspended',
  Pending: 'Pending',
  Free: 'Free',
  Starter: 'Starter',
  Professional: 'Professional',
  Enterprise: 'Enterprise',
  company: 'Company',
  users: 'Users',
  docs: 'Docs',
  score: 'Score',
  actions: 'Actions',
  noCompanies: 'No companies found',
  noMatch: 'No companies match your current filters.',
  deleteTitle: 'Delete Company',
  deleteMsg: (name) => `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  setActive: 'Set Active',
  setSuspended: 'Set Suspended',
  setPending: 'Set Pending',
  statusUpdated: 'Status updated successfully',
  statusFailed: 'Failed to update status',
  deleted: 'Company deleted',
  deleteFailed: 'Failed to delete company',
};

function StatusDropdown({ companyId, currentStatus, onUpdate, loading, i18n }) {
  const [open, setOpen] = useState(false);

  const options = [
    { value: 'Active',    label: i18n.setActive,    icon: <CheckCircle size={14} className="text-green-600" /> },
    { value: 'Suspended', label: i18n.setSuspended,  icon: <XCircle    size={14} className="text-red-600"   /> },
    { value: 'Pending',   label: i18n.setPending,    icon: <Clock      size={14} className="text-orange-500"/> },
  ].filter((o) => o.value !== currentStatus);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className="flex items-center gap-1 p-1 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute end-0 z-20 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
            {options.map((o) => (
              <button
                key={o.value}
                onClick={() => { onUpdate(companyId, o.value); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {o.icon}
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CompaniesPage() {
  const { isRTL } = useLang();
  const i18n = isRTL ? AR : EN;
  const queryClient = useQueryClient();

  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter]   = useState('');
  const [page, setPage]               = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const PAGE_SIZE = 15;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-companies'],
    queryFn: () => adminApi.getCompanies({ pageSize: 200 }).then((r) => r.data),
  });

  const allCompanies = useMemo(() => {
    const raw = data?.data ?? data?.items ?? [];
    return raw.map((c) => ({
      ...c,
      id:             c.id        ?? c.companyId,
      name:           c.name      ?? c.companyName,
      industry:       c.industry  ?? c.sector ?? null,
      email:          c.email     ?? null,
      phone:          c.phone     ?? null,
      plan:           c.plan      ?? 'Free',
      logoUrl:        c.logoUrl   ?? null,
      createdAt:      c.createdAt ?? null,
    }));
  }, [data]);

  // client-side filtering
  const filtered = useMemo(() => {
    return allCompanies.filter((c) => {
      const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || c.status === statusFilter;
      const matchPlan   = !planFilter   || c.plan   === planFilter;
      return matchSearch && matchStatus && matchPlan;
    });
  }, [allCompanies, search, statusFilter, planFilter]);

  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated    = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount  = allCompanies.filter((c) => c.status === 'Active').length;
  const suspendedCount = allCompanies.filter((c) => c.status === 'Suspended').length;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateCompanyStatus(id, { status }),
    onSuccess: () => {
      toast.success(i18n.statusUpdated);
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: () => toast.error(i18n.statusFailed),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteCompany(id),
    onSuccess: () => {
      toast.success(i18n.deleted);
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: () => toast.error(i18n.deleteFailed),
  });

  const STATUS_OPTIONS = [
    { value: '', label: i18n.allStatuses },
    { value: 'Active',    label: i18n.Active },
    { value: 'Suspended', label: i18n.Suspended },
    { value: 'Pending',   label: i18n.Pending },
  ];

  const PLAN_OPTIONS = [
    { value: '',             label: i18n.allPlans },
    { value: 'Free',         label: i18n.Free },
    { value: 'Starter',      label: i18n.Starter },
    { value: 'Professional', label: i18n.Professional },
    { value: 'Enterprise',   label: i18n.Enterprise },
  ];

  const tableHeaders = [i18n.company, i18n.users, i18n.docs, i18n.score, i18n.status, i18n.plan, i18n.actions];

  const scoreValue = (s) =>
    s == null ? null : typeof s === 'object' ? s.parsedValue : Number(s);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{i18n.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{i18n.subtitle}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title={i18n.totalCompanies}  value={allCompanies.length} icon={Building2}   color="primary" loading={isLoading} />
        <StatCard title={i18n.activeCompanies} value={activeCount}          icon={TrendingUp}  color="green"   loading={isLoading} />
        <StatCard title={i18n.suspended}       value={suspendedCount}       icon={AlertCircle} color="red"     loading={isLoading} />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="label">{i18n.search}</label>
            <div className="relative">
              <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder={i18n.searchPlaceholder}
                className={`input ${isRTL ? 'pr-9' : 'pl-9'}`}
              />
            </div>
          </div>

          {/* Status */}
          <div className="w-44">
            <label className="label">{i18n.status}</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Plan */}
          <div className="w-44">
            <label className="label">{i18n.plan}</label>
            <select
              value={planFilter}
              onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
              className="input"
            >
              {PLAN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isError ? (
          <div className="p-8 text-center">
            <p className="text-red-600 text-sm">{i18n.noMatch}</p>
          </div>
        ) : (
          <>
            <Table
              headers={tableHeaders}
              loading={isLoading}
              empty={
                !isLoading && paginated.length === 0 ? (
                  <EmptyState icon={Building2} title={i18n.noCompanies} description={i18n.noMatch} />
                ) : null
              }
            >
              {paginated.map((company) => {
                const score = scoreValue(company.latestOverallScore);
                return (
                  <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    {/* Company */}
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                          {company.logoUrl
                            ? <img src={company.logoUrl} alt={company.name} className="w-9 h-9 rounded-xl object-cover" />
                            : <Building2 size={18} className="text-primary-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                          {company.industry && <p className="text-xs text-gray-500">{company.industry}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Users */}
                    <td className="table-cell text-sm text-gray-600 text-center">
                      <span className="inline-flex items-center gap-1 justify-center">
                        <Users size={13} className="text-gray-400" />
                        {company.usersCount ?? 0}
                      </span>
                    </td>

                    {/* Docs */}
                    <td className="table-cell text-sm text-gray-600 text-center">
                      <span className="inline-flex items-center gap-1 justify-center">
                        <FileText size={13} className="text-gray-400" />
                        {company.documentsCount ?? 0}
                      </span>
                    </td>

                    {/* Score */}
                    <td className="table-cell text-sm text-center">
                      {score != null ? (
                        <span className={`font-semibold ${score >= 70 ? 'text-green-600' : score >= 50 ? 'text-orange-500' : 'text-red-500'}`}>
                          {score.toFixed(1)}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Status */}
                    <td className="table-cell">
                      <StatusBadge status={company.status} />
                    </td>

                    {/* Plan */}
                    <td className="table-cell">
                      <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                        {i18n[company.plan] ?? company.plan ?? 'Free'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="table-cell">
                      <div className="flex items-center gap-1">
                        <StatusDropdown
                          companyId={company.id}
                          currentStatus={company.status}
                          onUpdate={(id, status) => updateStatusMutation.mutate({ id, status })}
                          loading={updateStatusMutation.isPending}
                          i18n={i18n}
                        />
                        <button
                          onClick={() => setDeleteTarget(company)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>

            {!isLoading && filtered.length > PAGE_SIZE && (
              <div className="px-6 py-4 border-t border-gray-100">
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title={i18n.deleteTitle}
        message={i18n.deleteMsg(deleteTarget?.name ?? deleteTarget?.companyName ?? '')}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
