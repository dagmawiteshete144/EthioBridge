import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Megaphone } from 'lucide-react';
import AppIcon from '../../utils/iconMap.jsx';
import { newsAPI, alertAPI, locationAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import Pagination from '../../components/common/Pagination';
import {
  ALERT_SEVERITY_STYLES,
  getAlertCategory,
  alertLocationLabel,
  alertIssuerLabel,
  getWoredaLabel,
} from '../../utils/alertConstants';

const CATEGORIES = ['Public Alerts','Platform Updates'];

export default function NewsPage() {
  const { t } = useTranslation();
  const catLabels = { 'Public Alerts':t('news.catAlert'), 'Platform Updates':t('news.catPlatform') };
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Public Alerts location filter (Subcity -> Woreda cascade).
  const [subcities, setSubcities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [selSubcityId, setSelSubcityId] = useState('');
  const [selWoredaId, setSelWoredaId] = useState('');
  const [alertItems, setAlertItems] = useState([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [woredasLoading, setWoredasLoading] = useState(false);

  useEffect(() => {
    if (category === 'Public Alerts') return;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await newsAPI.getPublic({ search, category, page, limit: 9 });
        setNews(res.data.news);
        setPages(res.data.pages);
        setTotal(res.data.total);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [search, category, page]);

  // The Public Alerts content is shown when the "Public Alerts" category is selected.
  useEffect(() => {
    if (category !== 'Public Alerts') return;
    locationAPI.getSubcities()
      .then(res => setSubcities(res.data?.subcities || []))
      .catch(e => console.error('Failed to load subcities:', e));
  }, [category]);

  // Reset the woreda selection and repopulate its options when the subcity changes.
  useEffect(() => {
    setSelWoredaId('');
    if (category !== 'Public Alerts' || !selSubcityId) { setWoredas([]); return; }
    setWoredasLoading(true);
    locationAPI.getWoredasBySubcity(selSubcityId)
      .then(res => setWoredas(res.data?.woredas || []))
      .catch(e => { console.error('Failed to load woredas:', e); setWoredas([]); })
      .finally(() => setWoredasLoading(false));
  }, [category, selSubcityId]);

  // Load alerts matching the selected location (strict subcity AND woreda match).
  useEffect(() => {
    if (category !== 'Public Alerts') return;
    let cancelled = false;
    const fetchAlerts = async () => {
      setAlertsLoading(true);
      try {
        const subcity = subcities.find(s => s._id === selSubcityId);
        const woreda = woredas.find(w => w._id === selWoredaId);
        const params = { limit: 5, strict: true };
        if (subcity) params.subcity = subcity.name;
        if (woreda) {
          params.woreda = getWoredaLabel(woreda);
          params.woredaId = woreda._id;
        }
        const res = await alertAPI.getActive(params);
        if (!cancelled) setAlertItems(res.data?.data?.alerts || []);
      } catch (e) {
        console.error('Failed to load public alerts:', e);
      } finally {
        if (!cancelled) setAlertsLoading(false);
      }
    };
    fetchAlerts();
    return () => { cancelled = true; };
  }, [category, selSubcityId, selWoredaId, subcities, woredas]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">🔍</span>
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder={t('search.news')} className="input-field pl-9" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setCategory(''); setPage(1); }} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!category ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>{t('news.all')}</button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => { setCategory(c); setPage(1); }} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${category === c ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'}`}>{catLabels[c] || c}</button>
          ))}
        </div>
      </div>

      {category === 'Public Alerts' ? (
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0f2138] to-[#1e3652] border border-[#2b4566] p-6 sm:p-8 mb-10">
          <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-rose-500 to-red-600" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <Link
              to="/alerts"
              className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-gradient-to-br from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 px-5 py-2.5 rounded-lg shadow-md shadow-black/20 transition-colors"
            >
              <Megaphone size={18} strokeWidth={2} />
              Public Alerts
            </Link>
            <p className="text-sm text-blue-100/70">Browse alerts by location — pick a subcity, then a woreda within it.</p>
          </div>

          {/* Location filters */}
          <div className="grid sm:grid-cols-2 gap-3 mb-6">
            <div>
              <label className="block text-xs font-medium text-blue-100/70 mb-1.5">Subcity</label>
              <select
                value={selSubcityId}
                onChange={e => setSelSubcityId(e.target.value)}
                className="w-full bg-[#16283f] border border-[#2b4566] rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:border-primary-400"
              >
                <option value="">All Subcities</option>
                {subcities.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-blue-100/70 mb-1.5">Woreda</label>
              <select
                value={selWoredaId}
                onChange={e => setSelWoredaId(e.target.value)}
                disabled={!selSubcityId}
                className="w-full bg-[#16283f] border border-[#2b4566] rounded-lg text-sm text-white px-3 py-2.5 focus:outline-none focus:border-primary-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{selSubcityId ? (woredasLoading ? 'Loading…' : 'All Woredas') : 'Select a subcity first'}</option>
                {woredas.map(w => (
                  <option key={w._id} value={w._id}>{getWoredaLabel(w)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Alert list */}
          {alertsLoading ? (
            <div className="space-y-2">
              <div className="h-16 bg-[#2b4566]/40 rounded-lg animate-pulse" />
              <div className="h-16 bg-[#2b4566]/40 rounded-lg animate-pulse" />
            </div>
          ) : alertItems.length === 0 ? (
            <p className="text-sm text-blue-100/60 py-4">No active alerts for this location right now.</p>
          ) : (
            <div className="space-y-3">
              {alertItems.map(a => {
                const cat = getAlertCategory(a.category);
                return (
                  <Link key={a._id} to={`/alerts/${a._id}`} className="block group rounded-xl bg-[#16283f] border border-[#2b4566] p-4 hover:border-red-400/60 hover:bg-[#1a2e4a] transition-colors">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span className="text-[10px] font-medium bg-[#1e3652] text-blue-100/80 px-2 py-0.5 rounded-full">
                        {cat.icon && <AppIcon icon={cat.icon} size={14} className="inline-block align-[-2px] mr-1" />}
                        {cat.label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ALERT_SEVERITY_STYLES[a.severity] || ''}`}>
                        {a.severity}
                      </span>
                    </div>
                    <h3 className="font-semibold text-white leading-snug group-hover:text-red-400 transition-colors">{a.title}</h3>
                    {a.description && <p className="text-sm text-blue-100/70 mt-1 leading-relaxed line-clamp-2">{a.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-100/50">
                      <span className="truncate"><AppIcon icon="publicService" size={14} className="inline-block align-[-2px] mr-1" />{alertIssuerLabel(a)}</span>
                      <span className="truncate"><AppIcon icon="mapPin" size={14} className="inline-block align-[-2px] mr-1" />{alertLocationLabel(a) || 'Addis Ababa'}</span>
                      <span><AppIcon icon="calendar" size={14} className="inline-block align-[-2px] mr-1" />{new Date(a.publishedAt || a.createdAt).toLocaleDateString()}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('news.articlesFound', { count: total })}</p>

          {loading ? <LoadingSpinner /> : news.length === 0
            ? <EmptyState icon="📰" title={t('news.noNews')} description={t('news.checkBack')} />
            : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map(n => (
                  <Link key={n._id} to={n.isAlert ? '/alerts' : `/news/${n._id}`} className="card hover:shadow-md transition-shadow group flex flex-col">
                    {n.featuredImage && <img src={n.featuredImage} alt="" className="w-full h-44 object-cover rounded-lg mb-4" />}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {n.isAlert && n.severity ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          n.severity === 'Critical'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : n.severity === 'Warning'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                        }`}>{n.severity}</span>
                      ) : (
                        <span className="text-xs font-medium text-primary-600 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">{n.category}</span>
                      )}
                      {n.organizationName && <span className="text-xs text-gray-400 dark:text-gray-500">{n.organizationName}</span>}
                    </div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary-600 transition-colors line-clamp-2 flex-1">{n.title}</h3>
                    {n.summary && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{n.summary}</p>}
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(n.publishedAt || n.createdAt).toLocaleDateString()}</p>
                      <span className="text-xs text-primary-600 font-medium group-hover:underline">{t('news.readMore')}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}

          <Pagination page={page} pages={pages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
