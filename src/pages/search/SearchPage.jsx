import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, FolderKanban, CheckSquare, Receipt,
  FileSignature, FileText, SlidersHorizontal,
} from 'lucide-react';
import { searchApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import { Spinner, EmptyState, StatusBadge } from '../../components/common/index';

const GROUP_CONFIG = {
  projects: {
    label: 'Projects',
    icon: FolderKanban,
    color: 'text-primary-600',
    bg: 'bg-primary-50',
    getPath: (item) => `/projects/${item.id}`,
    getTitle: (item) => item.name ?? item.title,
    getDate: (item) => item.startDate ?? item.createdAt,
    getStatus: (item) => item.status,
    getSubtitle: (item) => item.description,
  },
  tasks: {
    label: 'Tasks',
    icon: CheckSquare,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    getPath: (item) => `/tasks/${item.id}`,
    getTitle: (item) => item.title ?? item.name,
    getDate: (item) => item.dueDate ?? item.createdAt,
    getStatus: (item) => item.status,
    getSubtitle: (item) => item.projectName ?? item.project?.name,
  },
  invoices: {
    label: 'Invoices',
    icon: Receipt,
    color: 'text-green-600',
    bg: 'bg-green-50',
    getPath: (item) => `/invoices/${item.id}`,
    getTitle: (item) => item.invoiceNumber ?? item.number ?? `Invoice #${item.id}`,
    getDate: (item) => item.dueDate ?? item.issueDate ?? item.createdAt,
    getStatus: (item) => item.status,
    getSubtitle: (item) =>
      item.amount != null ? `${item.amount} ${item.currency ?? ''}` : item.clientName,
  },
  contracts: {
    label: 'Contracts',
    icon: FileSignature,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    getPath: (item) => `/contracts/${item.id}`,
    getTitle: (item) => item.title ?? item.name ?? `Contract #${item.id}`,
    getDate: (item) => item.startDate ?? item.createdAt,
    getStatus: (item) => item.status,
    getSubtitle: (item) => item.clientName ?? item.client?.name,
  },
  documents: {
    label: 'Documents',
    icon: FileText,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    getPath: (item) => `/documents/${item.id}`,
    getTitle: (item) => item.name ?? item.title ?? item.fileName,
    getDate: (item) => item.uploadedAt ?? item.createdAt,
    getStatus: (item) => item.status,
    getSubtitle: (item) => item.type ?? item.mimeType,
  },
};

function ResultGroup({ groupKey, items }) {
  const cfg = GROUP_CONFIG[groupKey];
  if (!cfg || !items?.length) return null;
  const Icon = cfg.icon;

  return (
    <div className="card p-0 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
          <Icon size={16} className={cfg.color} />
        </div>
        <h3 className="text-sm font-semibold text-gray-800">{cfg.label}</h3>
        <span className="ml-auto text-xs font-semibold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>

      <ul className="divide-y divide-gray-50">
        {items.map((item) => {
          const title = cfg.getTitle(item) ?? '—';
          const subtitle = cfg.getSubtitle(item);
          const status = cfg.getStatus(item);
          const date = cfg.getDate(item);
          const path = cfg.getPath(item);

          return (
            <li key={item.id}>
              <Link
                to={path}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cfg.bg} opacity-70 group-hover:opacity-100 transition-opacity`}>
                  <Icon size={15} className={cfg.color} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                    {title}
                  </p>
                  {subtitle && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {status && <StatusBadge status={status} />}
                  {date && (
                    <span className="text-xs text-gray-400">
                      {new Date(date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function SearchPage() {
  const { t, isRTL } = useLang();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryFromUrl = searchParams.get('q') ?? '';

  const [inputValue, setInputValue] = useState(queryFromUrl);

  useEffect(() => {
    setInputValue(queryFromUrl);
  }, [queryFromUrl]);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['search', queryFromUrl],
    queryFn: () => searchApi.search({ q: queryFromUrl }).then((r) => r.data),
    enabled: queryFromUrl.trim().length >= 1,
    keepPreviousData: true,
  });

  const results = data?.data ?? data ?? {};
  const groups = ['projects', 'tasks', 'invoices', 'contracts', 'documents'];

  const totalResults = groups.reduce((sum, key) => sum + (results[key]?.length ?? 0), 0);
  const hasResults = totalResults > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = inputValue.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Search Bar */}
      <div className="card">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={18}
              className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`}
            />
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Search projects, tasks, invoices, contracts, documents..."
              className={`input ${isRTL ? 'pr-10' : 'pl-10'} text-base`}
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary px-6 py-2 text-sm flex items-center gap-2">
            <Search size={15} />
            Search
          </button>
        </form>
      </div>

      {/* Header info */}
      {queryFromUrl && !isLoading && !isFetching && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {hasResults ? (
              <>
                Found <span className="font-semibold text-gray-900">{totalResults}</span> results for{' '}
                <span className="font-semibold text-gray-900">"{queryFromUrl}"</span>
              </>
            ) : (
              <>
                No results for{' '}
                <span className="font-semibold text-gray-900">"{queryFromUrl}"</span>
              </>
            )}
          </p>
          {hasResults && (
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <SlidersHorizontal size={13} />
              {groups.filter((k) => results[k]?.length > 0).length} categories
            </div>
          )}
        </div>
      )}

      {/* Loading */}
      {(isLoading || isFetching) && queryFromUrl && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-3">
            <Spinner size="lg" />
            <p className="text-sm text-gray-500">Searching...</p>
          </div>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="card text-center py-10">
          <p className="text-red-600 text-sm">Search failed. Please try again.</p>
        </div>
      )}

      {/* No query state */}
      {!queryFromUrl && (
        <EmptyState
          icon={Search}
          title="Start searching"
          description="Type a keyword to search across projects, tasks, invoices, contracts, and documents."
        />
      )}

      {/* No results */}
      {queryFromUrl && !isLoading && !isFetching && !isError && !hasResults && (
        <EmptyState
          icon={Search}
          title="No results found"
          description={`We couldn't find anything matching "${queryFromUrl}". Try different keywords or check your spelling.`}
        />
      )}

      {/* Results Groups */}
      {!isLoading && !isFetching && hasResults && (
        <div className="space-y-4">
          {groups.map((key) =>
            results[key]?.length > 0 ? (
              <ResultGroup key={key} groupKey={key} items={results[key]} />
            ) : null
          )}
        </div>
      )}
    </div>
  );
}
