import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Building2, Search, Trash2, MoreVertical, CheckCircle,
  XCircle, Clock, Users, TrendingUp, AlertCircle,
} from 'lucide-react';
import { adminApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import {
  PageLoader, EmptyState, StatusBadge, ConfirmDialog,
  Pagination, StatCard, Table,
} from '../../components/common/index';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Suspended', label: 'Suspended' },
  { value: 'Pending', label: 'Pending' },
];

const PLAN_OPTIONS = [
  { value: '', label: 'All Plans' },
  { value: 'Free', label: 'Free' },
  { value: 'Starter', label: 'Starter' },
  { value: 'Professional', label: 'Professional' },
  { value: 'Enterprise', label: 'Enterprise' },
];

function StatusDropdown({ companyId, currentStatus, onUpdate, loading }) {
  const [open, setOpen] = useState(false);
  const statuses = ['Active', 'Suspended', 'Pending'];

  const icons = {
    Active: <CheckCircle size={14} className="text-green-600" />,
    Suspended: <XCircle size={14} className="text-red-600" />,
    Pending: <Clock size={14} className="text-orange-500" />,
  };

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
          <div className="absolute end-0 z-20 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 overflow-hidden">
            {statuses
              .filter((s) => s !== currentStatus)
              .map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    onUpdate(companyId, status);
                    setOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {icons[status]}
                  Set {status}
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function CompaniesPage() {
  const { t, isRTL } = useLang();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filters = { search, status: statusFilter, plan: planFilter, page, pageSize: 15 };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-companies', filters],
    queryFn: () => adminApi.getCompanies(filters).then((r) => r.data),
    keepPreviousData: true,
  });

  const companies = data?.data ?? data?.items ?? [];
  const totalPages = data?.totalPages ?? data?.pagination?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? data?.pagination?.totalCount ?? 0;

  const activeCount = companies.filter((c) => c.status === 'Active').length;
  const suspendedCount = companies.filter((c) => c.status === 'Suspended').length;

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminApi.updateCompanyStatus(id, { status }),
    onSuccess: () => {
      toast.success('Company status updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: () => toast.error('Failed to update company status'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteCompany(id),
    onSuccess: () => {
      toast.success('Company deleted successfully');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['admin-companies'] });
    },
    onError: () => toast.error('Failed to delete company'),
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const tableHeaders = ['Company', 'Email', 'Phone', 'Status', 'Plan', 'Created', 'Actions'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Companies Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage all registered companies on the platform</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Companies"
          value={totalCount}
          icon={Building2}
          color="primary"
          loading={isLoading}
        />
        <StatCard
          title="Active Companies"
          value={activeCount}
          icon={TrendingUp}
          color="green"
          loading={isLoading}
        />
        <StatCard
          title="Suspended"
          value={suspendedCount}
          icon={AlertCircle}
          color="red"
          loading={isLoading}
        />
      </div>

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Search</label>
            <div className="relative">
              <Search
                size={16}
                className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className={`input ${isRTL ? 'pr-9' : 'pl-9'}`}
              />
            </div>
          </div>

          <div className="w-44">
            <label className="label">Status</label>
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

          <div className="w-44">
            <label className="label">Plan</label>
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

          <button type="submit" className="btn-primary px-5 py-2 text-sm">
            Search
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isError ? (
          <div className="p-8 text-center">
            <p className="text-red-600 text-sm">Failed to load companies. Please try again.</p>
          </div>
        ) : (
          <>
            <Table
              headers={tableHeaders}
              loading={isLoading}
              empty={
                !isLoading && companies.length === 0 ? (
                  <EmptyState
                    icon={Building2}
                    title="No companies found"
                    description="No companies match your current filters."
                  />
                ) : null
              }
            >
              {companies.map((company) => (
                <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                        {company.logoUrl ? (
                          <img src={company.logoUrl} alt={company.name} className="w-9 h-9 rounded-xl object-cover" />
                        ) : (
                          <Building2 size={18} className="text-primary-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{company.name}</p>
                        {company.industry && (
                          <p className="text-xs text-gray-500">{company.industry}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="table-cell text-sm text-gray-600">{company.email ?? '—'}</td>
                  <td className="table-cell text-sm text-gray-600">{company.phone ?? '—'}</td>
                  <td className="table-cell">
                    <StatusBadge status={company.status} />
                  </td>
                  <td className="table-cell">
                    <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-lg">
                      {company.plan ?? 'Free'}
                    </span>
                  </td>
                  <td className="table-cell text-sm text-gray-500">
                    {company.createdAt
                      ? new Date(company.createdAt).toLocaleDateString()
                      : '—'}
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <StatusDropdown
                        companyId={company.id}
                        currentStatus={company.status}
                        onUpdate={(id, status) => updateStatusMutation.mutate({ id, status })}
                        loading={updateStatusMutation.isPending}
                      />
                      <button
                        onClick={() => setDeleteTarget(company)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete company"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>

            {!isLoading && companies.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100">
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Company"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone and will remove all associated data.`}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
