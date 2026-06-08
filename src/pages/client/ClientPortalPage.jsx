import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FolderOpen, FileText, FileCheck, TrendingUp,
  CheckCircle, Clock, AlertCircle, Download
} from 'lucide-react';
import { projectsApi, invoicesApi, contractsApi, reportsApi } from '../../api/index';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../../components/common/index';

const STATUS_COLORS = {
  Active: 'bg-blue-100 text-blue-700',
  Completed: 'bg-green-100 text-green-700',
  OnHold: 'bg-yellow-100 text-yellow-700',
  Draft: 'bg-gray-100 text-gray-600',
  Sent: 'bg-blue-100 text-blue-700',
  Paid: 'bg-green-100 text-green-700',
  PartiallyPaid: 'bg-yellow-100 text-yellow-700',
  Overdue: 'bg-red-100 text-red-700',
  SignedByBoth: 'bg-green-100 text-green-700',
  SentToClient: 'bg-blue-100 text-blue-700',
  SignedByClient: 'bg-purple-100 text-purple-700',
};

function Badge({ status }) {
  const cls = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export default function ClientPortalPage() {
  const { user } = useAuth();

  const { data: projRes, isLoading: loadProj } = useQuery({
    queryKey: ['client-projects'],
    queryFn: () => projectsApi.getAll({ pageSize: 50 }),
  });

  const { data: invRes, isLoading: loadInv } = useQuery({
    queryKey: ['client-invoices'],
    queryFn: () => invoicesApi.getAll({ pageSize: 50 }),
  });

  const { data: conRes, isLoading: loadCon } = useQuery({
    queryKey: ['client-contracts'],
    queryFn: () => contractsApi.getAll({ pageSize: 50 }),
  });

  const { data: repRes, isLoading: loadRep } = useQuery({
    queryKey: ['client-reports'],
    queryFn: () => reportsApi.getAll({ pageSize: 50 }),
  });

  const projects  = projRes?.data?.data?.items  ?? projRes?.data?.data  ?? [];
  const invoices  = invRes?.data?.data?.items   ?? invRes?.data?.data   ?? [];
  const contracts = conRes?.data?.data?.items   ?? conRes?.data?.data   ?? [];
  const reports   = repRes?.data?.data?.items   ?? repRes?.data?.data   ?? [];

  const isLoading = loadProj || loadInv || loadCon || loadRep;

  const totalOwed = invoices
    .filter(i => i.status !== 'Paid')
    .reduce((s, i) => s + (i.remainingAmount ?? 0), 0);

  if (isLoading) return (
    <div className="flex items-center justify-center h-64"><Spinner /></div>
  );

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">مرحباً، {user?.fullName} 👋</h1>
        <p className="text-gray-500 text-sm mt-1">بوابة العميل — نظرة عامة على مشاريعك وملفاتك</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FolderOpen}  label="المشاريع"   value={projects.length}  color="bg-blue-500" />
        <StatCard icon={FileText}    label="الفواتير"   value={invoices.length}  color="bg-purple-500" />
        <StatCard icon={FileCheck}   label="العقود"     value={contracts.length} color="bg-green-500" />
        <StatCard icon={TrendingUp}  label="مستحق الدفع" value={`${totalOwed.toLocaleString()} EGP`} color="bg-orange-500" />
      </div>

      {/* Projects */}
      <Section title="مشاريعي" icon={FolderOpen}>
        {projects.length === 0 ? (
          <Empty msg="لا توجد مشاريع حالياً" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {projects.map(p => (
              <div key={p.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{p.name}</h3>
                  <Badge status={p.status} />
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Clock size={12} /> {new Date(p.startDate).toLocaleDateString('ar-EG')}</span>
                  <div className="w-24">
                    <div className="flex justify-between mb-1 text-xs">
                      <span>{p.completionPercentage ?? 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full"
                        style={{ width: `${p.completionPercentage ?? 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Invoices */}
      <Section title="فواتيري" icon={FileText}>
        {invoices.length === 0 ? (
          <Empty msg="لا توجد فواتير" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-right py-2 font-medium">رقم الفاتورة</th>
                  <th className="text-right py-2 font-medium">المبلغ</th>
                  <th className="text-right py-2 font-medium">الحالة</th>
                  <th className="text-right py-2 font-medium">تاريخ الاستحقاق</th>
                  <th className="text-right py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-mono text-xs">{inv.invoiceNumber}</td>
                    <td className="py-2 font-semibold">{inv.totalAmount?.toLocaleString()} {inv.currency}</td>
                    <td className="py-2"><Badge status={inv.status} /></td>
                    <td className="py-2 text-gray-500">{new Date(inv.dueDate).toLocaleDateString('ar-EG')}</td>
                    <td className="py-2">
                      <button
                        onClick={() => invoicesApi.exportPdf(inv.id).then(r => {
                          const url = URL.createObjectURL(r.data);
                          const a = document.createElement('a');
                          a.href = url; a.download = `invoice-${inv.invoiceNumber}.pdf`; a.click();
                        })}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Download size={14} /> PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* Contracts */}
      <Section title="عقودي" icon={FileCheck}>
        {contracts.length === 0 ? (
          <Empty msg="لا توجد عقود" />
        ) : (
          <div className="space-y-3">
            {contracts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-white">
                <div>
                  <p className="font-semibold text-gray-800">{c.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {c.startDate ? new Date(c.startDate).toLocaleDateString('ar-EG') : '—'}
                    {' → '}
                    {c.endDate ? new Date(c.endDate).toLocaleDateString('ar-EG') : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-gray-700">{c.value?.toLocaleString()} {c.currency}</span>
                  <Badge status={c.status} />
                  {c.status === 'SentToClient' && (
                    <Link
                      to={`/contracts`}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700"
                    >
                      توقيع
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Reports */}
      <Section title="تقاريري" icon={TrendingUp}>
        {reports.length === 0 ? (
          <Empty msg="لا توجد تقارير" />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reports.map(r => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-800">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{r.type} • {new Date(r.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                  <Badge status={r.status} />
                </div>
                {r.summary && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{r.summary}</p>}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={20} className="text-blue-600" />
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Empty({ msg }) {
  return (
    <div className="text-center py-8 text-gray-400">
      <CheckCircle size={32} className="mx-auto mb-2 opacity-30" />
      <p className="text-sm">{msg}</p>
    </div>
  );
}
