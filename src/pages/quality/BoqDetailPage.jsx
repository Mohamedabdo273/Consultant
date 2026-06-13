import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, AlertTriangle, CheckCircle, AlertCircle, Sparkles, X } from 'lucide-react';
import { boqApi, boqAiApi } from '../../api/index';
import { Spinner } from '../../components/common/index';
import { useLang } from '../../context/LangContext';
import toast from 'react-hot-toast';

const ALERT_STYLES = {
  OK:       'bg-green-50 text-green-700 border-green-200',
  WARNING:  'bg-yellow-50 text-yellow-700 border-yellow-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
};
const ALERT_ICONS = {
  OK:       <CheckCircle size={14} />,
  WARNING:  <AlertTriangle size={14} />,
  CRITICAL: <AlertCircle size={14} />,
};

export default function BoqDetailPage() {
  const { id } = useParams();
  const { t, lang } = useLang();
  const ar = lang === 'ar';
  const [priceModal, setPriceModal] = useState(false);
  const [priceDesc, setPriceDesc] = useState('');
  const [priceUnit, setPriceUnit] = useState('');
  const [priceSuggestion, setPriceSuggestion] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const handleSuggestPrice = async () => {
    if (!priceDesc.trim()) { toast.error(ar ? 'أدخل وصف الصنف' : 'Enter item description'); return; }
    setPriceLoading(true);
    try {
      const res = await boqAiApi.suggestPrice(priceDesc, priceUnit);
      setPriceSuggestion(res.data?.data ?? null);
    } catch {
      toast.error(ar ? 'فشل الاقتراح' : 'Suggestion failed');
    } finally {
      setPriceLoading(false);
    }
  };

  const { data: boq, isLoading: loadingBoq } = useQuery({
    queryKey: ['boq-detail', id],
    queryFn: () => boqApi.getById(id).then(r => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const { data: comparison, isLoading: loadingComp } = useQuery({
    queryKey: ['boq-comparison', id],
    queryFn: () => boqApi.getComparison(id).then(r => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  if (loadingBoq || loadingComp) return <div className="flex justify-center py-24"><Spinner /></div>;
  if (!boq) return <div className="text-center py-24 text-gray-400">{lang === 'ar' ? 'الحصر غير موجود' : 'BOQ not found'}</div>;

  const fmt = (n) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/quality/boq" className="text-gray-400 hover:text-gray-600"><ArrowRight size={20} /></Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{boq.boqNumber}</span>
              <h1 className="text-xl font-bold text-gray-800">{boq.title}</h1>
            </div>
            {boq.projectName && <p className="text-sm text-gray-500">{boq.projectName}</p>}
          </div>
        </div>
        <button onClick={() => { setPriceModal(true); setPriceSuggestion(null); }}
          className="flex items-center gap-2 bg-purple-50 text-purple-700 hover:bg-purple-100 px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          <Sparkles size={15} /> {ar ? 'اقتراح سعر بالـ AI' : 'AI Price Suggestion'}
        </button>
      </div>

      {/* بنود الحصر */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-bold text-gray-800">{t('boqItems')}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500">
              <tr>
                <th className="px-4 py-3 text-right">{t('itemCode')}</th>
                <th className="px-4 py-3 text-right">{t('itemDesc')}</th>
                <th className="px-4 py-3 text-right">{t('itemUnit')}</th>
                <th className="px-4 py-3 text-right">{t('itemQty')}</th>
                <th className="px-4 py-3 text-right">{t('itemUnitPrice')}</th>
                <th className="px-4 py-3 text-right">{t('itemTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {boq.items?.map(item => (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2 font-mono text-xs text-blue-600">{item.itemCode}</td>
                  <td className="px-4 py-2 text-gray-700">{item.description}</td>
                  <td className="px-4 py-2 text-gray-500">{item.unit}</td>
                  <td className="px-4 py-2 text-gray-700">{item.quantity.toLocaleString()}</td>
                  <td className="px-4 py-2 text-gray-700">{item.unitPrice.toLocaleString()}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{fmt(item.totalPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-blue-50 font-bold">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-gray-700">{t('boqGrandTotal')}</td>
                <td className="px-4 py-3 text-blue-700">{fmt(boq.totalAmount)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* المقارنة */}
      {comparison ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-bold text-gray-800">{t('comparisonTitle')}</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-600">{t('compBoqTotal')}</p>
              <p className="font-bold text-blue-800">{fmt(comparison.boqTotal)}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-3 text-center">
              <p className="text-xs text-green-600">{t('compOwnerTotal')}</p>
              <p className="font-bold text-green-800">{fmt(comparison.ownerTotal)}</p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3 text-center">
              <p className="text-xs text-purple-600">{t('compContractorTotal')}</p>
              <p className="font-bold text-purple-800">{fmt(comparison.contractorTotal)}</p>
            </div>
            <div className={`rounded-xl p-3 text-center ${comparison.variance > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${comparison.variance > 0 ? 'text-red-600' : 'text-gray-600'}`}>{t('compVariance')}</p>
              <p className={`font-bold ${comparison.variance > 0 ? 'text-red-700' : 'text-gray-700'}`}>{fmt(comparison.variance)}</p>
            </div>
          </div>

          <div className="overflow-x-auto px-4 pb-4">
            <table className="w-full text-sm border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-right">{t('itemCode')}</th>
                  <th className="px-3 py-2 text-right">{t('itemDesc')}</th>
                  <th className="px-3 py-2 text-right">{t('compBoqTotal')}</th>
                  <th className="px-3 py-2 text-right">{t('compOwnerTotal')}</th>
                  <th className="px-3 py-2 text-right">{t('compContractorTotal')}</th>
                  <th className="px-3 py-2 text-right">{t('compVariance')}</th>
                  <th className="px-3 py-2 text-center">{lang === 'ar' ? 'التقييم' : 'Alert'}</th>
                </tr>
              </thead>
              <tbody>
                {comparison.items?.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 font-mono text-xs text-blue-600">{item.itemCode}</td>
                    <td className="px-3 py-2 text-gray-700 max-w-[180px] truncate">{item.description}</td>
                    <td className="px-3 py-2 text-gray-600">{fmt(item.boqAmount)}</td>
                    <td className="px-3 py-2 text-green-700">{fmt(item.ownerAmount)}</td>
                    <td className="px-3 py-2 text-purple-700">{fmt(item.contractorAmount)}</td>
                    <td className={`px-3 py-2 font-medium ${item.varianceAmount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                      {fmt(item.varianceAmount)}
                      {item.variancePct !== 0 && <span className="text-xs ms-1">({item.variancePct}%)</span>}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${ALERT_STYLES[item.alert] ?? ''}`}>
                        {ALERT_ICONS[item.alert]}
                        {t('alert' + item.alert.charAt(0) + item.alert.slice(1).toLowerCase()) || item.alert}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center text-yellow-700 text-sm">
          {lang === 'ar'
            ? 'لا توجد مستخلصات بعد — أضف مستخلص مالك ومستخلص مقاول لرؤية المقارنة'
            : 'No certificates yet — add Owner & Contractor certificates to see the comparison'}
        </div>
      )}

      {/* Price Suggestion Modal */}
      {priceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-800 flex items-center gap-2">
                <Sparkles size={18} className="text-purple-600" />
                {ar ? 'اقتراح سعر بالذكاء الاصطناعي' : 'AI Price Suggestion'}
              </h2>
              <button onClick={() => setPriceModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="form-label">{ar ? 'وصف الصنف' : 'Item Description'} *</label>
                <input value={priceDesc} onChange={e => setPriceDesc(e.target.value)}
                  className="form-input" placeholder={ar ? 'مثال: خرسانة مسلحة للأساسات' : 'e.g. Reinforced concrete for foundations'} />
              </div>
              <div>
                <label className="form-label">{ar ? 'وحدة القياس' : 'Unit'}</label>
                <input value={priceUnit} onChange={e => setPriceUnit(e.target.value)}
                  className="form-input" placeholder={ar ? 'مثال: م3، م2، طن، عدد' : 'e.g. m3, m2, ton'} />
              </div>
              <button onClick={handleSuggestPrice} disabled={priceLoading}
                className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60">
                {priceLoading
                  ? <><Sparkles size={14} className="animate-pulse" /> {ar ? 'جاري الاقتراح...' : 'Analyzing...'}</>
                  : <><Sparkles size={14} /> {ar ? 'اقترح السعر' : 'Suggest Price'}</>}
              </button>

              {priceSuggestion && (
                <div className="space-y-3">
                  {priceSuggestion.sampleCount > 0 && (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-green-50 rounded-xl p-3">
                        <div className="text-lg font-bold text-green-700">{Number(priceSuggestion.minPrice).toLocaleString()}</div>
                        <div className="text-xs text-green-500">{ar ? 'أدنى سعر' : 'Min Price'}</div>
                      </div>
                      <div className="bg-blue-50 rounded-xl p-3 ring-2 ring-blue-300">
                        <div className="text-lg font-bold text-blue-700">{Number(priceSuggestion.avgPrice).toLocaleString()}</div>
                        <div className="text-xs text-blue-500">{ar ? 'متوسط السعر' : 'Avg Price'}</div>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3">
                        <div className="text-lg font-bold text-orange-700">{Number(priceSuggestion.maxPrice).toLocaleString()}</div>
                        <div className="text-xs text-orange-500">{ar ? 'أعلى سعر' : 'Max Price'}</div>
                      </div>
                    </div>
                  )}
                  {priceSuggestion.reasoning && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2 text-purple-700 font-medium text-xs">
                        <Sparkles size={12} /> {ar ? 'تحليل AI' : 'AI Analysis'}
                      </div>
                      <p className="text-sm text-purple-800 leading-relaxed">{priceSuggestion.reasoning}</p>
                    </div>
                  )}
                  {priceSuggestion.sampleCount > 0 && (
                    <p className="text-xs text-gray-400 text-center">
                      {ar ? `بناءً على ${priceSuggestion.sampleCount} بند مشابه في النظام` : `Based on ${priceSuggestion.sampleCount} similar items in the system`}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
