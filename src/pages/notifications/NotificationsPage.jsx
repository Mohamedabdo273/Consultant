import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Bell,
  CheckCheck,
  Trash2,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  FileText,
  Calendar,
  DollarSign,
  Settings,
} from 'lucide-react';
import { notificationsApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import {
  PageLoader,
  EmptyState,
  Pagination,
  Spinner,
} from '../../components/common/index';

const PAGE_SIZE = 20;

function formatDate(d) {
  if (!d) return '';
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function getNotificationIcon(type) {
  const iconMap = {
    info: { icon: Info, color: 'text-blue-500 bg-blue-50' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500 bg-yellow-50' },
    success: { icon: CheckCircle, color: 'text-green-500 bg-green-50' },
    error: { icon: XCircle, color: 'text-red-500 bg-red-50' },
    message: { icon: MessageSquare, color: 'text-purple-500 bg-purple-50' },
    invoice: { icon: DollarSign, color: 'text-green-500 bg-green-50' },
    contract: { icon: FileText, color: 'text-indigo-500 bg-indigo-50' },
    task: { icon: Calendar, color: 'text-orange-500 bg-orange-50' },
    system: { icon: Settings, color: 'text-gray-500 bg-gray-100' },
  };
  const t = (type ?? '').toLowerCase();
  return iconMap[t] ?? { icon: Bell, color: 'text-primary-500 bg-primary-50' };
}

// ── Notification Item ─────────────────────────────────────────────────────────
function NotificationItem({ notification, onMarkRead, onDelete, isMarkingRead, isDeleting }) {
  const { lang } = useLang();
  const isRead = notification.isRead ?? notification.read ?? false;
  const { icon: Icon, color } = getNotificationIcon(notification.type);

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-xl border transition-colors cursor-pointer group ${
        !isRead
          ? 'bg-primary-50/40 border-primary-100 hover:bg-primary-50/60'
          : 'bg-white border-gray-100 hover:bg-gray-50'
      }`}
      onClick={() => !isRead && onMarkRead(notification.id)}
    >
      {/* Unread indicator */}
      {!isRead && (
        <span className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-e-full" />
      )}

      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={16} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm ${!isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'} leading-snug`}>
            {notification.title ?? notification.subject ?? (lang === 'ar' ? 'إشعار' : 'Notification')}
          </p>
          <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
            {formatDate(notification.createdAt ?? notification.date)}
          </span>
        </div>
        {(notification.message ?? notification.body) && (
          <p className="text-sm text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
            {notification.message ?? notification.body}
          </p>
        )}
        {!isRead && (
          <span className="inline-flex items-center mt-1.5 text-xs text-primary-600 font-medium">
            {lang === 'ar' ? 'انقر للتحديد كمقروء' : 'Click to mark as read'}
          </span>
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(notification.id); }}
        disabled={isDeleting}
        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
        title={lang === 'ar' ? 'حذف' : 'Delete'}
      >
        {isDeleting ? <Spinner size="sm" /> : <Trash2 size={14} />}
      </button>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
  const { t, lang, isRTL } = useLang();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [markingId, setMarkingId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', page],
    queryFn: () =>
      notificationsApi
        .getAll({ page, pageSize: PAGE_SIZE })
        .then((r) => r.data?.data ?? r.data),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const notifications = data?.items ?? data?.notifications ?? data?.data ?? [];
  const totalPages = data?.totalPages ?? Math.ceil((data?.totalCount ?? 0) / PAGE_SIZE) ?? 1;
  const unreadCount = notifications.filter((n) => !(n.isRead ?? n.read)).length;

  const { mutate: markRead } = useMutation({
    mutationFn: (id) => {
      setMarkingId(id);
      return notificationsApi.markRead(id);
    },
    onSuccess: () => {
      setMarkingId(null);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      setMarkingId(null);
      toast.error(lang === 'ar' ? 'فشل تحديث الإشعار' : 'Failed to mark as read');
    },
  });

  const { mutate: markAllRead, isPending: isMarkingAll } = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم تحديد الكل كمقروء' : 'All marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      toast.error(lang === 'ar' ? 'فشل تحديث الإشعارات' : 'Failed to mark all as read');
    },
  });

  const { mutate: deleteNotification } = useMutation({
    mutationFn: (id) => {
      setDeletingId(id);
      return notificationsApi.delete(id);
    },
    onSuccess: () => {
      setDeletingId(null);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: () => {
      setDeletingId(null);
      toast.error(lang === 'ar' ? 'فشل حذف الإشعار' : 'Failed to delete notification');
    },
  });

  return (
    <div className="space-y-5 max-w-3xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {t('notifications')}
            {unreadCount > 0 && (
              <span className="ms-2 text-sm font-medium bg-primary-100 text-primary-700 rounded-full px-2 py-0.5">
                {unreadCount} {lang === 'ar' ? 'غير مقروء' : 'unread'}
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {lang === 'ar' ? 'إدارة إشعاراتك' : 'Manage your notifications'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAll}
            className="btn-secondary flex items-center gap-2 text-sm px-4 py-2"
          >
            {isMarkingAll ? <Spinner size="sm" /> : <CheckCheck size={16} />}
            {lang === 'ar' ? 'تحديد الكل كمقروء' : 'Mark all as read'}
          </button>
        )}
      </div>

      {/* Content */}
      {isLoading ? (
        <PageLoader />
      ) : notifications.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Bell}
            title={lang === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
            description={
              lang === 'ar'
                ? 'ستظهر الإشعارات الجديدة هنا'
                : 'New notifications will appear here'
            }
          />
        </div>
      ) : (
        <div className="space-y-2">
          {/* Unread section */}
          {notifications.some((n) => !(n.isRead ?? n.read)) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                {lang === 'ar' ? 'غير مقروءة' : 'Unread'}
              </p>
              <div className="space-y-2">
                {notifications
                  .filter((n) => !(n.isRead ?? n.read))
                  .map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={markRead}
                      onDelete={deleteNotification}
                      isMarkingRead={markingId === n.id}
                      isDeleting={deletingId === n.id}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Read section */}
          {notifications.some((n) => n.isRead ?? n.read) && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1 mt-4">
                {lang === 'ar' ? 'مقروءة' : 'Read'}
              </p>
              <div className="space-y-2">
                {notifications
                  .filter((n) => n.isRead ?? n.read)
                  .map((n) => (
                    <NotificationItem
                      key={n.id}
                      notification={n}
                      onMarkRead={markRead}
                      onDelete={deleteNotification}
                      isMarkingRead={markingId === n.id}
                      isDeleting={deletingId === n.id}
                    />
                  ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-2">
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
