import { Loader2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '../../context/LangContext';

// ── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizes[size]} text-primary-600 animate-spin`} />
    </div>
  );
}

// ── Page Loader ──────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
    </div>
  );
}

// ── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {Icon && <Icon size={48} className="text-gray-300 mb-4" />}
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 mb-6 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

// ── Error Message ────────────────────────────────────────────────────────────
export function ErrorMsg({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
      <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────────────────
const badgeColors = {
  // Project Status (Planning=0, Active=1, OnHold=2, Completed=3, Cancelled=4)
  Planning:        'bg-purple-100 text-purple-800',
  Active:          'bg-green-100 text-green-800',
  OnHold:          'bg-gray-100 text-gray-700',
  Completed:       'bg-blue-100 text-blue-800',
  Cancelled:       'bg-red-100 text-red-800',
  // Project Priority (Low=0, Medium=1, High=2, Urgent=3)
  Low:             'bg-green-100 text-green-700',
  Medium:          'bg-yellow-100 text-yellow-700',
  High:            'bg-red-100 text-red-700',
  Urgent:          'bg-red-200 text-red-900',
  // Invoice
  Draft:           'bg-gray-100 text-gray-600',
  Sent:            'bg-blue-100 text-blue-700',
  Paid:            'bg-green-100 text-green-700',
  PartiallyPaid:   'bg-yellow-100 text-yellow-700',
  Overdue:         'bg-red-100 text-red-700',
  // Contract / Task
  Pending:         'bg-orange-100 text-orange-700',
  PendingApproval: 'bg-yellow-100 text-yellow-700',
  Signed:          'bg-green-100 text-green-700',
  Todo:            'bg-gray-100 text-gray-600',
  InProgress:      'bg-yellow-100 text-yellow-800',
  InReview:        'bg-blue-100 text-blue-700',
};

export function StatusBadge({ status }) {
  const color = badgeColors[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`badge ${color}`}>{status}</span>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} animate-slide-up max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 bg-gray-50 rounded-t-2xl">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 text-lg transition-colors">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  const { t } = useLang();
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">
          {t('cancel')}
        </button>
        <button onClick={onConfirm} disabled={loading} className="btn-danger text-sm px-4 py-2">
          {loading ? <Spinner size="sm" /> : t('confirm')}
        </button>
      </div>
    </Modal>
  );
}

// ── Pagination ───────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onChange }) {
  const { isRTL } = useLang();
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 text-gray-600"
      >
        {isRTL ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
      </button>

      {[...Array(totalPages)].map((_, i) => {
        const p = i + 1;
        if (totalPages > 7 && Math.abs(p - page) > 2 && p !== 1 && p !== totalPages) {
          if (p === 2 || p === totalPages - 1) return <span key={p} className="text-gray-400 px-1">…</span>;
          return null;
        }
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
              p === page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100 text-gray-600'
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        disabled={page >= totalPages}
        onClick={() => onChange(page + 1)}
        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 text-gray-600"
      >
        {isRTL ? <ChevronLeft size={16}/> : <ChevronRight size={16}/>}
      </button>
    </div>
  );
}

// ── Stats Card ───────────────────────────────────────────────────────────────
export function StatCard({ title, value, icon: Icon, color = 'primary', change, loading }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    green:   'bg-green-50 text-green-600',
    yellow:  'bg-yellow-50 text-yellow-600',
    red:     'bg-red-50 text-red-600',
    blue:    'bg-blue-50 text-blue-600',
    purple:  'bg-purple-50 text-purple-600',
  };
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 font-medium">{title}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors[color]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div>
        {loading
          ? <div className="h-8 w-20 bg-gray-100 rounded animate-pulse" />
          : <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        }
        {change !== undefined && (
          <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {change >= 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  );
}

// ── Table ────────────────────────────────────────────────────────────────────
export function Table({ headers, children, loading, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {headers.map((h, i) => (
              <th key={i} className="table-header">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-gray-100">
                  {headers.map((_, j) => (
                    <td key={j} className="table-cell">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))
            : children
          }
        </tbody>
      </table>
      {!loading && empty}
    </div>
  );
}

// ── Form Field ───────────────────────────────────────────────────────────────
export function FormField({ label, error, required, hint, children }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="label">
          {label}{required && <span className="text-red-500 ms-1">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
}

// ── Select ───────────────────────────────────────────────────────────────────
export function Select({ options, value, onChange, placeholder, className = '' }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input appearance-none cursor-pointer ${className}`}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(({ value: v, label }) => (
        <option key={v} value={v}>{label}</option>
      ))}
    </select>
  );
}
