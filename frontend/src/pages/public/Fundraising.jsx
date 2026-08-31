import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Heart, HandHeart,
  Globe,
  Handshake, Users, CircleCheck, ArrowRight, Construction, BookOpen,
} from 'lucide-react';
import { campaignAPI } from '../../services/api';
import CampaignCard from '../../components/common/CampaignCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CATEGORIES = [
  {
    id: 'infrastructure',
    icon: Construction,
    title: 'Infrastructure Campaigns',
    desc: 'Support infrastructure development projects such as:',
    items: ['Roads', 'Water Supply', 'Electricity', 'Bridges', 'Drainage', 'Public Facilities'],
    color: 'from-sky-500 via-blue-600 to-blue-800',
    glow: 'shadow-blue-500/40',
    ring: 'group-hover:ring-blue-200 dark:group-hover:ring-blue-800/60',
    chip: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
  },
  {
    id: 'community',
    icon: Handshake,
    title: 'Community & Social Support',
    desc: 'Support vulnerable people and community welfare programs, including:',
    items: ['Elderly Support', 'Low-income Families', 'Disability Support', 'Community Welfare Projects', 'Food Assistance', 'Community Health Support'],
    color: 'from-emerald-500 via-green-600 to-green-800',
    glow: 'shadow-green-500/40',
    ring: 'group-hover:ring-green-200 dark:group-hover:ring-green-800/60',
    chip: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
  },
  {
    id: 'education',
    icon: BookOpen,
    title: 'Educational Support',
    desc: 'Support education by funding:',
    items: ['School Supplies', 'Books', 'School Furniture', 'Digital Learning Equipment', 'School Infrastructure', 'Student Support Programs'],
    color: 'from-amber-400 via-orange-500 to-orange-600',
    glow: 'shadow-amber-500/40',
    ring: 'group-hover:ring-amber-200 dark:group-hover:ring-amber-800/60',
    chip: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300',
  },
];

function AnimatedCounter({ value, suffix = '', duration = 2 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const increment = Math.ceil(value / (duration * 60));
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

export default function Fundraising() {
  const [searchParams] = useSearchParams();
  const showCompleted = searchParams.get('tab') === 'completed';

  const [campaigns, setCampaigns] = useState([]);
  const [completedCampaigns, setCompletedCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, compRes, ...catRes] = await Promise.all([
          campaignAPI.getPublic({ limit: 50, status: showCompleted ? 'completed' : undefined }),
          campaignAPI.getPublic({ status: 'completed', limit: 6 }),
          ...CATEGORIES.map(cat => campaignAPI.getPublic({ campaignType: cat.id, limit: 1 })),
        ]);
        setCampaigns(cRes.data.data || []);
        setStats(cRes.data.stats);
        setCompletedCampaigns(compRes.data.data || []);
        setCompletedCount(compRes.data.total || 0);
        const counts = {};
        CATEGORIES.forEach((cat, i) => {
          counts[cat.id] = catRes[i].data.total || 0;
        });
        setCategoryCounts(counts);
      } catch (err) {
        console.error('Failed to load fundraising data', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [showCompleted]);

  const featured = campaigns.filter(c => c.isFeatured || c.status === 'active');
  const communityCat = CATEGORIES.find(c => c.id === 'community');
  const CommunityIcon = communityCat.icon;
  const communityCampaigns = campaigns.filter(c => c.campaignType === 'community' && c.status === 'active').slice(0, 6);

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      {/* ========== HERO ========== */}
      <section className="relative min-h-[520px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-primary-900/90" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"80\" height=\"80\" viewBox=\"0 0 80 80\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"white\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M40 10L44 28H62L48 40L54 58L40 48L26 58L32 40L18 28H36Z\" /%3E%3C/g%3E%3C/svg%3E')" }} />
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-full text-sm mb-6 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/90 font-medium">EthioBridge Fundraising Platform</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white drop-shadow-lg">
            Infrastructure, Community & <br className="hidden sm:block" />Education Fundraising
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg sm:text-xl text-white/90 mb-3 max-w-2xl mx-auto">
            Infrastructure, Community & Education Fundraising
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-white/70 max-w-xl mx-auto mb-8 text-sm">
            Support infrastructure development, community welfare, and education across Ethiopia through transparent community fundraising. Every contribution builds a stronger Ethiopia.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-wrap justify-center gap-4">
            <a href="#categories" onClick={(e) => { e.preventDefault(); document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' }); }}
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-all"
            >
              View Campaigns
            </a>
          </motion.div>
        </div>
      </section>

      {/* ========== ANIMATED STATISTICS ========== */}
      {stats && (
        <section className="relative z-20 -mt-12 pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { icon: Handshake, label: 'Active Campaigns', value: stats.totalCampaigns || 0, suffix: '', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
                { icon: CircleCheck, label: 'Completed Campaigns', value: completedCount || 0, suffix: '', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/20' },
                { icon: Heart, label: 'Total Donations', value: stats.totalDonors || 0, suffix: '', color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/20' },
                { icon: Handshake, label: 'Total Raised', value: stats.totalRaised || 0, suffix: ' ETB', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
                { icon: Users, label: 'Total Donors', value: stats.totalDonors || 0, suffix: '', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
                { icon: Globe, label: 'Avg. Contribution', value: stats.totalDonors ? Math.round((stats.totalRaised || 0) / stats.totalDonors) : 0, suffix: ' ETB', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
              ].map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.08 }} className="card text-center backdrop-blur-sm bg-white/90 dark:bg-gray-800/90"
                  >
                    <div className={`w-11 h-11 rounded-xl ${s.bg} ${s.color} flex items-center justify-center text-xl mx-auto mb-2`}>
                      <Icon />
                    </div>
                    <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      <AnimatedCounter value={s.value} suffix={s.suffix} />
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>
      )}

      {/* ========== CATEGORIES ========== */}
      <section id="categories" className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Campaign Categories</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">Find campaigns that match your passion</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat, i) => {
              const CatIcon = cat.icon;
              return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <Link
                  to={`/fundraising/category/${cat.id}`}
                  className={`group card h-full relative overflow-hidden rounded-2xl p-7 flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/40 hover:-translate-y-1.5 ring-1 ring-transparent hover:ring-gray-200 dark:hover:ring-gray-600 ${cat.ring}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${cat.color}`} />
                  <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full bg-gradient-to-br ${cat.color} opacity-10 blur-2xl transition-opacity duration-500 group-hover:opacity-25`} />
                  <div className={`absolute -bottom-14 -left-14 w-40 h-40 rounded-full bg-gradient-to-tr ${cat.color} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-15`} />
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${cat.color} text-white flex items-center justify-center text-2xl shadow-lg ${cat.glow} group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <CatIcon size={24} strokeWidth={2} />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-gray-100">{cat.title}</h3>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{cat.desc}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {cat.items.map((it) => (
                      <span key={it} className={`text-[11px] font-medium ${cat.chip} px-2.5 py-1 rounded-full transition-colors`}>
                        {it}
                      </span>
                    ))}
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {categoryCounts[cat.id] ?? 0} Active {categoryCounts[cat.id] === 1 ? 'Campaign' : 'Campaigns'}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      View Campaigns
                      <ArrowRight className="text-xs" strokeWidth={2} />
                    </span>
                  </div>
                </Link>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========== ALL ACTIVE CAMPAIGNS ========== */}
      {!showCompleted && featured.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">All Active Campaigns</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Campaigns currently seeking your support</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((c) => (
                <CampaignCard key={c._id} campaign={{ ...c, isFeatured: true }} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== COMMUNITY SHOWCASE ========== */}
      {communityCampaigns.length > 0 && (
        <section className="py-16 bg-white dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-8">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${communityCat.color} flex items-center justify-center text-white`}><HandHeart size={20} strokeWidth={2} /></div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100"><CommunityIcon size={30} strokeWidth={2} className="inline-block" /> {communityCat.title}</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Welfare programs for vulnerable people and communities</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityCampaigns.map((c) => <CampaignCard key={c._id} campaign={c} />)}
            </div>
            {categoryCounts.community > 6 && (
              <div className="text-center mt-8">
                <Link to="/fundraising/category/community" className="btn-secondary text-sm py-2.5 px-6">View All {communityCat.title}</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========== COMPLETED CAMPAIGNS ========== */}
      {completedCampaigns.length > 0 && (
        <section className="py-16 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100"><CircleCheck className="inline-block mr-2 text-green-600" size={30} strokeWidth={2} /> Recently Completed</h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Campaigns that reached their goals</p>
              </div>
              <Link to="/fundraising?tab=completed" className="text-primary-600 hover:underline text-sm font-medium">View All ({completedCount})</Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedCampaigns.map((c) => (
                <motion.div key={c._id} className="card border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-600 mb-2">
                    <CircleCheck size={18} strokeWidth={2} />
                    <span className="text-sm font-semibold">Campaign Complete</span>
                  </div>
                  <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{c.title}</h3>
                  <p className="text-xs text-gray-400 mb-3">
                    Raised <span className="font-semibold text-green-600">{c.raisedAmount?.toLocaleString()} ETB</span> of {c.goalAmount?.toLocaleString()} ETB goal
                  </p>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: '100%' }} />
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
                    <span>{c.donors || 0} donors</span>
                    <Link to={`/fundraising/${c._id}`} className="text-primary-600 hover:underline font-medium">View Details →</Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========== CTA ========== */}
      <section className="py-20 bg-gradient-to-br from-primary-800 via-primary-700 to-primary-600 text-white text-center relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-primary-400/20 blur-3xl" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cpath d=\"M30 5L35 20H50L38 30L42 45L30 36L18 45L22 30L10 20H25Z\" fill=\"white\" /%3E%3C/svg%3E')" }} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative z-10 max-w-2xl mx-auto px-4"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-2xl">
            <HandHeart size={40} strokeWidth={2} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Together We Can Rebuild Ethiopia</h2>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-lg mx-auto leading-relaxed">
            Your donation, no matter the size, helps build roads, schools, hospitals, and provides vital support to those who need it most.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-primary-50 font-bold py-3.5 px-10 rounded-xl transition-all shadow-xl hover:shadow-2xl active:scale-95"
          >
            Join the Movement
            <ArrowRight className="text-sm" strokeWidth={2} />
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
