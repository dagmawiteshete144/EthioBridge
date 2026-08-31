import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowLeft, Building2, HandHeart, GraduationCap, CircleHelp, Inbox, Construction, Handshake, BookOpen } from 'lucide-react';
import { campaignAPI } from '../../services/api';
import CampaignCard from '../../components/common/CampaignCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CATEGORIES = {
  infrastructure: {
    id: 'infrastructure',
    icon: Construction,
    headerIcon: Building2,
    title: 'Infrastructure Campaigns',
    subtitle: 'Roads, water, electricity and public facilities',
    desc: 'Support infrastructure development projects across Ethiopia — roads, water supply, electricity, bridges, drainage and public facilities.',
    color: 'from-blue-600 to-blue-700',
    tagColor: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  },
  community: {
    id: 'community',
    icon: Handshake,
    headerIcon: HandHeart,
    title: 'Community & Social Support',
    subtitle: 'Welfare programs for vulnerable people and communities',
    desc: 'Support vulnerable people and community welfare programs — elderly support, low-income families, disability support, food assistance and more.',
    color: 'from-emerald-600 to-teal-700',
    tagColor: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  },
  education: {
    id: 'education',
    icon: BookOpen,
    headerIcon: GraduationCap,
    title: 'Educational Support',
    subtitle: 'Schools, learning materials and student programs',
    desc: 'Support education by funding school supplies, books, furniture, digital learning equipment and student support programs.',
    color: 'from-purple-600 to-indigo-700',
    tagColor: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  },
};

const STATUS_TABS = [
  { id: 'active', label: 'Active Campaigns' },
  { id: 'completed', label: 'Completed' },
];

export default function CategoryDetail() {
  const { type } = useParams();
  const cat = CATEGORIES[type];

  const [campaigns, setCampaigns] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('active');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [sort, setSort] = useState('newest');
  const limit = 12;

  useEffect(() => {
    setPage(1);
    setCampaigns([]);
  }, [type, status]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { campaignType: type, status, limit, page };
        if (search) params.search = search;
        if (sort === 'highest') params.sort = 'raisedAmount';
        const res = await campaignAPI.getPublic(params);
        setCampaigns(res.data.data || []);
        setTotal(res.data.total || 0);
        setPages(res.data.pages || 1);
      } catch (err) {
        console.error(err);
        setCampaigns([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, status, page, sort, search]);

  if (!cat) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4"><CircleHelp size={60} strokeWidth={2} className="mx-auto" /></div>
        <p className="text-gray-500 text-lg mb-6">Category not found</p>
        <Link to="/fundraising" className="btn-primary inline-block">Back to Fundraising</Link>
      </div>
    );
  }

  const Icon = cat.headerIcon;
  const CatIcon = cat.icon;

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${cat.color}`} />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-white">
          <Link to="/fundraising" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-5 transition-colors">
            <ArrowLeft size={16} strokeWidth={2} /> All Fundraising
          </Link>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-4xl">
              <CatIcon size={40} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold">{cat.title}</h1>
              <p className="text-white/85 mt-1">{cat.subtitle}</p>
            </div>
          </div>
          <p className="text-white/80 max-w-2xl text-sm leading-relaxed">{cat.desc}</p>
        </div>
      </section>

      {/* ===== CONTROLS ===== */}
      <section className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex flex-wrap gap-1.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatus(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  status === tab.id
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" strokeWidth={2} />
              <input
                type="text"
                placeholder="Search in this category..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') setSearch(searchInput.trim()); }}
                className="input-field pl-9 pr-3 py-2 text-sm"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="input-field text-sm py-2 sm:w-44"
            >
              <option value="newest">Newest first</option>
              <option value="highest">Highest raised</option>
            </select>
          </div>
        </div>
      </section>

      {/* ===== CAMPAIGNS ===== */}
      <section className="py-10 bg-gray-50 dark:bg-gray-800 min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {total} {status === 'completed' ? 'completed' : 'active'} campaign{total !== 1 ? 's' : ''} in this category
            </p>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${cat.tagColor}`}><CatIcon size={16} strokeWidth={2} className="inline-block" /> {cat.title}</span>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : campaigns.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-7xl mb-5"><Inbox size={72} strokeWidth={2} className="mx-auto" /></div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                {status === 'completed' ? 'No completed campaigns yet' : 'No active campaigns in this category yet'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {status === 'completed' ? 'Campaigns will appear here once fully funded.' : 'Check back soon — new campaigns are added regularly.'}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {campaigns.map((campaign) => (
                  <motion.div key={campaign._id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <CampaignCard campaign={campaign} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400 px-3">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
