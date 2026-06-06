import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Users, Search, UserCheck, UserX, KeyRound, Shield,
  ShieldAlert, Briefcase, UserCog, User, UserPlus,
  Check, X, Clock, Eye, EyeOff, ChevronDown,
} from 'lucide-react';
import { adminApi, usersApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import { useAuth } from '../../context/AuthContext';
import {
  PageLoader, EmptyState, ConfirmDialog,
  Pagination, StatCard, Table, Modal, Spinner, FormField,
} from '../../components/common/index';

// ── Role config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  SuperAdmin: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800', icon: ShieldAlert },
  Admin:      { label: 'Admin',       color: 'bg-red-100 text-red-800',       icon: Shield      },
  Manager:    { label: 'Manager',     color: 'bg-blue-100 text-blue-800',     icon: Briefcase   },
  Consultant: { label: 'Consultant',  color: 'bg-green-100 text-green-800',   icon: UserCog     },
  CompanyUser:{ label: 'Company User',color: 'bg-gray-100 text-gray-700',     icon: User        },
  Viewer:     { label: 'Viewer',      color: 'bg-yellow-100 text-yellow-700', icon: Eye         },
  Client:     { label: 'Client',      color: 'bg-orange-100 text-orange-700', icon: User        },
};

const INVITE_ROLES = ['CompanyUser', 'Manager', 'Consultant', 'Viewer', 'Client'];

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, color: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
      {role}
    </span>
  );
}

function Avatar({ name, email }) {
  const initials = name
    ? name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (email?.[0] ?? '?').toUpperCase();
  const colors = [
    'bg-primary-100 text-primary-700', 'bg-green-100 text-green-700',
    'bg-purple-100 text-purple-700',   'bg-yellow-100 text-yellow-700',
    'bg-pink-100 text-pink-700',
  ];
  return (
    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${colors[(name?.charCodeAt(0) ?? 0) % colors.length]}`}>
      {initials}
    </div>
  );
}

// ── Invite Modal (Admin only) ─────────────────────────────────────────────────
function InviteModal({ open, onClose }) {
  const { lang } = useLang();
  const queryClient = useQueryClient();
  const [showPass, setShowPass] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { fullName: '', email: '', password: '', role: 'CompanyUser' },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => usersApi.invite(data),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم إضافة المستخدم بنجاح' : 'User invited successfully');
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
      reset();
      onClose();
    },
    onError: (err) => {
      const msg = err?.response?.data?.errors?.[0] || err?.response?.data?.message;
      toast.error(msg || (lang === 'ar' ? 'فشل إضافة المستخدم' : 'Failed to invite user'));
    },
  });

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }}
      title={lang === 'ar' ? 'إضافة مستخدم جديد' : 'Invite New User'} size="md">
      <form onSubmit={handleSubmit(mutate)} className="space-y-4" noValidate>

        <FormField label={lang === 'ar' ? 'الاسم الكامل' : 'Full Name'} required error={errors.fullName?.message}>
          <input type="text" className={`input ${errors.fullName ? 'border-red-400' : ''}`}
            placeholder={lang === 'ar' ? 'اسم المستخدم' : 'User full name'}
            {...register('fullName', { required: lang === 'ar' ? 'الاسم مطلوب' : 'Name is required' })} />
        </FormField>

        <FormField label={lang === 'ar' ? 'البريد الإلكتروني' : 'Email'} required error={errors.email?.message}>
          <input type="email" className={`input ${errors.email ? 'border-red-400' : ''}`}
            placeholder={lang === 'ar' ? 'example@company.com' : 'example@company.com'}
            {...register('email', {
              required: lang === 'ar' ? 'البريد مطلوب' : 'Email is required',
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: lang === 'ar' ? 'بريد غير صالح' : 'Invalid email' },
            })} />
        </FormField>

        <FormField label={lang === 'ar' ? 'كلمة المرور' : 'Password'} required error={errors.password?.message}>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'}
              className={`input pe-10 ${errors.password ? 'border-red-400' : ''}`}
              placeholder={lang === 'ar' ? '8 أحرف على الأقل' : 'Min 8 characters'}
              {...register('password', {
                required: lang === 'ar' ? 'كلمة المرور مطلوبة' : 'Password required',
                minLength: { value: 8, message: lang === 'ar' ? 'لا تقل عن 8 أحرف' : 'Min 8 characters' },
              })} />
            <button type="button" onClick={() => setShowPass(p => !p)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </FormField>

        <FormField label={lang === 'ar' ? 'الدور الوظيفي' : 'Role'}>
          <select className="input" {...register('role')}>
            {INVITE_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_CONFIG[r]?.label ?? r}</option>
            ))}
          </select>
        </FormField>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => { reset(); onClose(); }} className="btn-secondary text-sm px-4 py-2">
            {lang === 'ar' ? 'إلغاء' : 'Cancel'}
          </button>
          <button type="submit" disabled={isPending}
            className="btn-primary text-sm px-5 py-2 flex items-center gap-2">
            {isPending ? <Spinner size="sm" /> : <><UserPlus size={15} />{lang === 'ar' ? 'إضافة' : 'Invite'}</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Company Users View (Admin) ────────────────────────────────────────────────
function CompanyUsersView() {
  const { lang, isRTL } = useLang();
  const queryClient = useQueryClient();
  const [tab, setTab]               = useState('active'); // 'active' | 'pending'
  const [inviteOpen, setInviteOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [search, setSearch]         = useState('');

  // Company users list
  const { data: usersRaw, isLoading } = useQuery({
    queryKey: ['company-users'],
    queryFn: () => usersApi.getAll().then((r) => r.data?.data ?? r.data),
    staleTime: 30_000,
  });
  const allUsers = Array.isArray(usersRaw) ? usersRaw : usersRaw?.items ?? [];
  const filtered = allUsers.filter((u) =>
    !search || u.fullName?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  // Pending users
  const { data: pendingRaw, isLoading: loadingPending } = useQuery({
    queryKey: ['pending-users'],
    queryFn: () => usersApi.getPending().then((r) => r.data?.data ?? r.data),
    staleTime: 30_000,
  });
  const pending = Array.isArray(pendingRaw) ? pendingRaw : pendingRaw?.items ?? [];

  // Toggle activate/deactivate
  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => isActive ? usersApi.delete(id) : usersApi.activate(id),
    onSuccess: (_, v) => {
      toast.success(v.isActive
        ? (lang === 'ar' ? 'تم إلغاء تفعيل المستخدم' : 'User deactivated')
        : (lang === 'ar' ? 'تم تفعيل المستخدم' : 'User activated'));
      setToggleTarget(null);
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
    },
    onError: () => toast.error(lang === 'ar' ? 'فشلت العملية' : 'Operation failed'),
  });

  // Update role
  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => usersApi.updateRole(id, { role }),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم تغيير الدور' : 'Role updated');
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
    },
    onError: () => toast.error(lang === 'ar' ? 'فشل تغيير الدور' : 'Failed to update role'),
  });

  // Approve pending
  const approveMutation = useMutation({
    mutationFn: (id) => usersApi.approve(id),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تمت الموافقة' : 'User approved');
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
      queryClient.invalidateQueries({ queryKey: ['company-users'] });
    },
    onError: () => toast.error(lang === 'ar' ? 'فشلت الموافقة' : 'Approval failed'),
  });

  // Reject pending
  const rejectMutation = useMutation({
    mutationFn: (id) => usersApi.reject(id, {}),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم الرفض' : 'User rejected');
      queryClient.invalidateQueries({ queryKey: ['pending-users'] });
    },
    onError: () => toast.error(lang === 'ar' ? 'فشل الرفض' : 'Rejection failed'),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {lang === 'ar' ? 'إدارة أعضاء الفريق' : 'Team Members'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar' ? 'أضف وأدر مستخدمي شركتك' : 'Add and manage your company users'}
          </p>
        </div>
        <button onClick={() => setInviteOpen(true)}
          className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <UserPlus size={16} />
          {lang === 'ar' ? 'إضافة مستخدم' : 'Add User'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatCard title={lang === 'ar' ? 'إجمالي المستخدمين' : 'Total Users'}
          value={allUsers.length} icon={Users} color="primary" loading={isLoading} />
        <StatCard title={lang === 'ar' ? 'المستخدمون النشطون' : 'Active'}
          value={allUsers.filter(u => u.isActive).length} icon={UserCheck} color="green" loading={isLoading} />
        <StatCard title={lang === 'ar' ? 'في الانتظار' : 'Pending'}
          value={pending.length} icon={Clock} color="yellow" loading={loadingPending} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {[
          { id: 'active',  label: lang === 'ar' ? 'المستخدمون' : 'Members' },
          { id: 'pending', label: lang === 'ar' ? `الانتظار (${pending.length})` : `Pending (${pending.length})` },
        ].map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-primary-600 text-primary-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Active Users Tab ── */}
      {tab === 'active' && (
        <div className="card p-0 overflow-hidden">
          {/* Search */}
          <div className="p-4 border-b border-gray-100">
            <div className="relative max-w-xs">
              <Search size={15} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={lang === 'ar' ? 'بحث بالاسم أو البريد' : 'Search by name or email'}
                className={`input text-sm ${isRTL ? 'pr-9' : 'pl-9'}`} />
            </div>
          </div>

          <Table
            headers={[
              lang === 'ar' ? 'المستخدم' : 'User',
              lang === 'ar' ? 'البريد' : 'Email',
              lang === 'ar' ? 'الدور' : 'Role',
              lang === 'ar' ? 'الحالة' : 'Status',
              lang === 'ar' ? 'إجراءات' : 'Actions',
            ]}
            loading={isLoading}
            empty={!isLoading && filtered.length === 0 ? (
              <EmptyState icon={Users}
                title={lang === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}
                description={lang === 'ar' ? 'أضف مستخدمين جدد لشركتك' : 'Invite new team members'}
                action={<button onClick={() => setInviteOpen(true)} className="btn-primary text-sm px-4 py-2 mt-3 flex items-center gap-2 mx-auto"><UserPlus size={15}/>{lang === 'ar' ? 'إضافة مستخدم' : 'Add User'}</button>}
              />
            ) : null}
          >
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.fullName} email={u.email} />
                    <span className="text-sm font-semibold text-gray-900">{u.fullName ?? '—'}</span>
                  </div>
                </td>
                <td className="table-cell text-sm text-gray-600">{u.email}</td>
                <td className="table-cell">
                  <select
                    value={u.role}
                    onChange={(e) => roleMutation.mutate({ id: u.id, role: e.target.value })}
                    className="input text-xs py-1 px-2 h-auto w-auto"
                    disabled={u.role === 'Admin' || u.role === 'SuperAdmin'}
                  >
                    {INVITE_ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_CONFIG[r]?.label ?? r}</option>
                    ))}
                    {(u.role === 'Admin' || u.role === 'SuperAdmin') && (
                      <option value={u.role}>{ROLE_CONFIG[u.role]?.label ?? u.role}</option>
                    )}
                  </select>
                </td>
                <td className="table-cell">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                    {u.isActive ? (lang === 'ar' ? 'نشط' : 'Active') : (lang === 'ar' ? 'غير نشط' : 'Inactive')}
                  </span>
                </td>
                <td className="table-cell">
                  {u.role !== 'Admin' && u.role !== 'SuperAdmin' && (
                    <button onClick={() => setToggleTarget(u)}
                      title={u.isActive ? (lang === 'ar' ? 'إلغاء التفعيل' : 'Deactivate') : (lang === 'ar' ? 'تفعيل' : 'Activate')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        u.isActive
                          ? 'hover:bg-red-50 text-gray-400 hover:text-red-600'
                          : 'hover:bg-green-50 text-gray-400 hover:text-green-600'
                      }`}>
                      {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      {/* ── Pending Users Tab ── */}
      {tab === 'pending' && (
        <div className="card p-0 overflow-hidden">
          <Table
            headers={[
              lang === 'ar' ? 'المستخدم' : 'User',
              lang === 'ar' ? 'البريد' : 'Email',
              lang === 'ar' ? 'تاريخ الطلب' : 'Requested',
              lang === 'ar' ? 'إجراءات' : 'Actions',
            ]}
            loading={loadingPending}
            empty={!loadingPending && pending.length === 0 ? (
              <EmptyState icon={Clock}
                title={lang === 'ar' ? 'لا يوجد طلبات معلقة' : 'No pending requests'}
                description={lang === 'ar' ? 'كل الطلبات تمت معالجتها' : 'All requests have been handled'} />
            ) : null}
          >
            {pending.map((u) => (
              <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="table-cell">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.fullName} email={u.email} />
                    <span className="text-sm font-semibold text-gray-900">{u.fullName ?? '—'}</span>
                  </div>
                </td>
                <td className="table-cell text-sm text-gray-600">{u.email}</td>
                <td className="table-cell text-sm text-gray-500">
                  {u.requestedAt ? new Date(u.requestedAt).toLocaleDateString() : '—'}
                </td>
                <td className="table-cell">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => approveMutation.mutate(u.id)}
                      disabled={approveMutation.isPending}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <Check size={13} />
                      {lang === 'ar' ? 'قبول' : 'Approve'}
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(u.id)}
                      disabled={rejectMutation.isPending}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <X size={13} />
                      {lang === 'ar' ? 'رفض' : 'Reject'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        </div>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} />

      <ConfirmDialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        onConfirm={() => toggleTarget && toggleMutation.mutate({ id: toggleTarget.id, isActive: toggleTarget.isActive })}
        title={toggleTarget?.isActive
          ? (lang === 'ar' ? 'إلغاء تفعيل المستخدم' : 'Deactivate User')
          : (lang === 'ar' ? 'تفعيل المستخدم' : 'Activate User')}
        message={toggleTarget?.isActive
          ? (lang === 'ar' ? `هل تريد إلغاء تفعيل "${toggleTarget?.fullName}"؟` : `Deactivate "${toggleTarget?.fullName}"?`)
          : (lang === 'ar' ? `هل تريد تفعيل "${toggleTarget?.fullName}"؟` : `Activate "${toggleTarget?.fullName}"?`)}
        loading={toggleMutation.isPending}
      />
    </div>
  );
}

// ── SuperAdmin Users View (unchanged) ────────────────────────────────────────
function SuperAdminUsersView() {
  const { isRTL } = useLang();
  const queryClient = useQueryClient();

  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]               = useState(1);
  const [toggleTarget, setToggleTarget] = useState(null);
  const [resetTarget, setResetTarget]   = useState(null);

  const filters = { search, role: roleFilter, isActive: statusFilter, page, pageSize: 15 };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-users', filters],
    queryFn: () => adminApi.getAllUsers(filters).then((r) => r.data),
    keepPreviousData: true,
  });

  const users      = data?.data ?? data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const totalCount = data?.totalCount ?? 0;
  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] ?? 0) + 1; return acc; }, {});

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => isActive ? adminApi.deactivateUser(id) : adminApi.activateUser(id),
    onSuccess: (_, v) => { toast.success(v.isActive ? 'User deactivated' : 'User activated'); setToggleTarget(null); queryClient.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: () => toast.error('Failed to update user status'),
  });

  const resetMutation = useMutation({
    mutationFn: (id) => adminApi.resetPassword(id, {}),
    onSuccess: () => { toast.success('Password reset email sent'); setResetTarget(null); },
    onError: () => toast.error('Failed to reset password'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage all platform users across companies</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Total Users"  value={totalCount}               icon={Users}    color="primary" loading={isLoading} />
        <StatCard title="Active"       value={users.filter(u=>u.isActive).length} icon={UserCheck} color="green" loading={isLoading} />
        <StatCard title="Admins"       value={roleCounts['Admin'] ?? 0} icon={Shield}   color="red"     loading={isLoading} />
        <StatCard title="Consultants"  value={roleCounts['Consultant'] ?? 0} icon={UserCog} color="blue" loading={isLoading} />
      </div>

      <div className="card">
        <form onSubmit={(e) => { e.preventDefault(); setPage(1); }} className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">Search</label>
            <div className="relative">
              <Search size={16} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className={`input ${isRTL ? 'pr-9' : 'pl-9'}`} />
            </div>
          </div>
          <div className="w-36">
            <label className="label">Role</label>
            <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="input">
              {['', 'SuperAdmin', 'Admin', 'Manager', 'Consultant', 'CompanyUser', 'Viewer', 'Client'].map((r) => (
                <option key={r} value={r}>{r || 'All Roles'}</option>
              ))}
            </select>
          </div>
          <div className="w-36">
            <label className="label">Status</label>
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input">
              <option value="">All</option><option value="true">Active</option><option value="false">Inactive</option>
            </select>
          </div>
          <button type="submit" className="btn-primary px-5 py-2 text-sm">Search</button>
        </form>
      </div>

      <div className="card p-0 overflow-hidden">
        {isError ? (
          <p className="p-8 text-center text-red-600 text-sm">Failed to load users.</p>
        ) : (
          <>
            <Table headers={['User', 'Email', 'Role', 'Company', 'Status', 'Actions']}
              loading={isLoading}
              empty={!isLoading && users.length === 0 ? <EmptyState icon={Users} title="No users found" description="No users match your filters." /> : null}>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="table-cell"><div className="flex items-center gap-3"><Avatar name={u.fullName} email={u.email} /><span className="text-sm font-semibold text-gray-900">{u.fullName ?? '—'}</span></div></td>
                  <td className="table-cell text-sm text-gray-600">{u.email}</td>
                  <td className="table-cell"><RoleBadge role={u.role} /></td>
                  <td className="table-cell text-sm text-gray-500">{u.companyName ?? u.company?.name ?? '—'}</td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1">
                      <button onClick={() => setToggleTarget(u)} className={`p-1.5 rounded-lg transition-colors ${u.isActive ? 'hover:bg-red-50 text-gray-400 hover:text-red-600' : 'hover:bg-green-50 text-gray-400 hover:text-green-600'}`}>
                        {u.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                      </button>
                      <button onClick={() => setResetTarget(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <KeyRound size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </Table>
            {!isLoading && users.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100">
                <Pagination page={page} totalPages={totalPages} onChange={setPage} />
              </div>
            )}
          </>
        )}
      </div>

      <ConfirmDialog open={!!toggleTarget} onClose={() => setToggleTarget(null)}
        onConfirm={() => toggleTarget && toggleMutation.mutate({ id: toggleTarget.id, isActive: toggleTarget.isActive })}
        title={toggleTarget?.isActive ? 'Deactivate User' : 'Activate User'}
        message={toggleTarget?.isActive ? `Deactivate "${toggleTarget?.fullName}"?` : `Activate "${toggleTarget?.fullName}"?`}
        loading={toggleMutation.isPending} />
      <ConfirmDialog open={!!resetTarget} onClose={() => setResetTarget(null)}
        onConfirm={() => resetTarget && resetMutation.mutate(resetTarget.id)}
        title="Reset Password"
        message={`Send password reset to "${resetTarget?.fullName}"?`}
        loading={resetMutation.isPending} />
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { user } = useAuth();
  return user?.role === 'SuperAdmin' ? <SuperAdminUsersView /> : <CompanyUsersView />;
}
