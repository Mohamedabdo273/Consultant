import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  CheckSquare,
  AlertCircle,
  DollarSign,
  FileText,
  TrendingUp,
  Clock,
  Activity,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { dashboardApi } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LangContext';
import { StatCard, PageLoader, ErrorMsg } from '../../components/common/index';

function formatCurrency(value) {
  if (value == null) return '—';
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getGreeting(lang) {
  const hour = new Date().getHours();
  if (lang === 'ar') {
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء النور';
  }
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, lang, isRTL } = useLang();

  const {
    data: dashData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard', 'consulting'],
    queryFn: () => dashboardApi.getConsulting().then((r) => r.data?.data ?? r.data),
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) return <PageLoader />;

  if (isError) {
    return (
      <div className="p-6">
        <ErrorMsg
          message={
            error?.response?.data?.message ||
            (lang === 'ar' ? 'فشل تحميل بيانات لوحة التحكم' : 'Failed to load dashboard data')
          }
        />
        <button onClick={refetch} className="btn-primary mt-4 text-sm px-4 py-2">
          {lang === 'ar' ? 'إعادة المحاولة' : 'Retry'}
        </button>
      </div>
    );
  }

  const stats = dashData?.stats || dashData || {};
  const recentActivity = dashData?.recentActivity || [];
  const overdueProjects = dashData?.overdueProjects || [];

  const ArrowIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <div className="space-y-6">
      {/* Header / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting(lang)},{' '}
            <span className="text-primary-600">{user?.fullName?.split(' ')[0] || user?.name || t('name')}</span>{' '}
            👋
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar'
              ? 'إليك نظرة عامة على مشاريعك'
              : "Here's an overview of your projects"}
          </p>
        </div>
        <span className="text-xs text-gray-400">{formatDate(new Date().toISOString())}</span>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={lang === 'ar' ? 'إجمالي المشاريع' : 'Total Projects'}
          value={stats.totalProjects ?? stats.TotalProjects}
          icon={FolderOpen}
          color="primary"
        />
        <StatCard
          title={lang === 'ar' ? 'المشاريع النشطة' : 'Active Projects'}
          value={stats.activeProjects ?? stats.ActiveProjects}
          icon={Activity}
          color="blue"
        />
        <StatCard
          title={lang === 'ar' ? 'إجمالي المهام' : 'Total Tasks'}
          value={stats.totalTasks ?? stats.TotalTasks}
          icon={CheckSquare}
          color="green"
        />
        <StatCard
          title={lang === 'ar' ? 'المهام المتأخرة' : 'Overdue Tasks'}
          value={stats.overdueTasks ?? stats.OverdueTasks}
          icon={AlertCircle}
          color="red"
        />
        <StatCard
          title={lang === 'ar' ? 'إجمالي الفواتير' : 'Total Invoiced'}
          value={formatCurrency(stats.totalInvoiced ?? stats.TotalInvoiced)}
          icon={DollarSign}
          color="purple"
        />
        <StatCard
          title={lang === 'ar' ? 'المبالغ المحصلة' : 'Total Paid'}
          value={formatCurrency(stats.totalPaid ?? stats.TotalPaid)}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title={lang === 'ar' ? 'إجمالي العقود' : 'Total Contracts'}
          value={stats.totalContracts ?? stats.TotalContracts}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title={lang === 'ar' ? 'العقود الموقعة' : 'Signed Contracts'}
          value={stats.signedContracts ?? stats.SignedContracts}
          icon={CheckSquare}
          color="primary"
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <Activity size={18} className="text-primary-600" />
              {lang === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
            </h2>
          </div>

          {recentActivity.length === 0 ? (
            <div className="text-center py-10">
              <Clock size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {lang === 'ar' ? 'لا يوجد نشاط حديث' : 'No recent activity'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((item, idx) => (
                <div
                  key={item.id ?? idx}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 leading-snug">
                      {item.description || item.message || item.title || '—'}
                    </p>
                    {item.createdAt && (
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.createdAt)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Overdue Projects */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              {lang === 'ar' ? 'المشاريع المتأخرة' : 'Overdue Projects'}
            </h2>
            <Link
              to="/projects?status=Overdue"
              className="text-xs text-primary-600 hover:underline flex items-center gap-0.5"
            >
              {lang === 'ar' ? 'عرض الكل' : 'View all'}
              <ArrowIcon size={14} />
            </Link>
          </div>

          {overdueProjects.length === 0 ? (
            <div className="text-center py-10">
              <CheckSquare size={36} className="text-green-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">
                {lang === 'ar' ? 'لا توجد مشاريع متأخرة 🎉' : 'No overdue projects 🎉'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueProjects.slice(0, 6).map((project, idx) => (
                <Link
                  key={project.id ?? idx}
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-red-50 transition-colors group border border-transparent hover:border-red-100"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {project.name || project.title || '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {project.endDate && (
                        <span className="text-xs text-red-500">
                          {lang === 'ar' ? 'انتهت:' : 'Due:'} {formatDate(project.endDate)}
                        </span>
                      )}
                      {project.clientName && (
                        <span className="text-xs text-gray-400 truncate">
                          · {project.clientName}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowIcon
                    size={16}
                    className="text-gray-300 group-hover:text-red-400 flex-shrink-0 ms-2"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
