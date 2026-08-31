import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Megaphone, ClipboardList,
  Flame, CircleCheck, Users, MapPin,
  CalendarDays, ChevronDown, X, PencilLine,
} from 'lucide-react';
import { EmojiIcon } from '../../utils/iconMap.jsx';
import { publicAPI, newsAPI, campaignAPI } from '../../services/api';
import IncidentMap from '../../components/map/IncidentMap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PublicAlertCard from '../../components/common/PublicAlertCard';
import { useSocket } from '../../context/SocketContext';

const REGIONS = ['Addis Ababa','Oromia','Amhara','Tigray','Somali','Afar','Sidama','Central Ethiopia','South Ethiopia','Southwest Ethiopia','Gambella','Benishangul-Gumuz','Harari','Dire Dawa'];

const riskColor = { Low:'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300', Moderate:'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300', High:'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300', Critical:'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300' };
const riskDot  = { Low: <EmojiIcon emoji="🟢" size={16} />, Moderate: <EmojiIcon emoji="🟡" size={16} />, High: <EmojiIcon emoji="🟠" size={16} />, Critical: <EmojiIcon emoji="🔴" size={16} /> };

export default function Home() {
  const { t } = useTranslation();
  const { on } = useSocket() || {};
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [stats, setStats]       = useState(null);
  const [campaignStats, setCampaignStats] = useState(null);
  const [locationGroups, setLocationGroups] = useState([]);
  const [mapMarkers, setMapMarkers] = useState([]);
  const [mapStats, setMapStats] = useState({});
  const [regionStats, setRegionStats] = useState([]);
  const [latestNews, setLatestNews]       = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!complaintModalOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setComplaintModalOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [complaintModalOpen]);

  const loadHomeData = useCallback(async () => {
    try {
      const [s, m, rs, n, cs, cat] = await Promise.all([
        publicAPI.getStats(),
        publicAPI.getMapAnalytics(),
        publicAPI.getRegionStats(),
        newsAPI.getPublic({ limit: 4 }),
        campaignAPI.getPublic({ limit: 1 }),
        campaignAPI.getCategoryStats(),
      ]);
      setStats(s.data.stats);
      setCampaignStats(cs.data.stats);
      setCategoryStats(cat.data.data || {});
      setLocationGroups(m.data.locations || []);
      setMapMarkers(m.data.markers || []);
      setMapStats(m.data.stats || {});
      setRegionStats(rs.data.regionStats || []);
      setLatestNews(n.data.news || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeData();
    const interval = setInterval(loadHomeData, 60000);
    return () => clearInterval(interval);
  }, [loadHomeData]);

  // Refresh the Live Incident Map statistics in real time whenever a report is
  // created, edited, or removed (broadcast by the backend over socket.io).
  useEffect(() => {
    if (!on) return;
    const unsubscribe = on('reports:changed', () => loadHomeData());
    return unsubscribe;
  }, [on, loadHomeData]);

  const statItems = stats ? [
    { icon: ClipboardList, label: t('home.totalReports', 'Total Reports'),              value: stats.totalReports,              accent: 'from-sky-500 to-blue-600' },
    { icon: Building2,      label: t('home.infrastructureReports', 'Infrastructure Reports'), value: stats.infrastructureReports ?? 0, accent: 'from-blue-600 to-indigo-600' },
    { icon: Megaphone,      label: t('home.publicComplaints', 'Public Complaints'),      value: stats.publicComplaints ?? 0,     accent: 'from-amber-500 to-orange-600' },
    { icon: Flame,          label: t('home.activeReports', 'Active Reports'),            value: stats.activeReports,             accent: 'from-orange-500 to-red-500' },
    { icon: CircleCheck,   label: t('home.resolvedReports', 'Resolved Reports'),        value: stats.resolvedReports,           accent: 'from-emerald-500 to-green-600' },
    { icon: Users,         label: t('home.registeredCitizens', 'Registered Citizens'),  value: stats.registeredCitizens,        accent: 'from-violet-500 to-purple-600' },
  ] : [];

  const mapQuickStats = [
    { icon: CalendarDays,  label: t('home.todayReports', "Today's Reports"),          value: mapStats.todayReports ?? 0 },
    { icon: CalendarDays, label: t('home.weekReports', "This Week's Reports"),       value: mapStats.weekReports ?? 0 },
    { icon: MapPin, label: t('home.mostReportedSubcity', 'Most Reported Sub-city'), value: mapStats.mostReportedSubcity ?? '—' },
  ];

  const campaignStatsData = campaignStats || {};
  const avgContribution = campaignStatsData.totalDonors
    ? Math.round((campaignStatsData.totalRaised || 0) / campaignStatsData.totalDonors)
    : 0;
  const campaignStatItems = [
    { label: 'Active Campaigns', value: campaignStatsData.totalCampaigns?.toLocaleString() ?? '0', color: 'text-white' },
    { label: 'Total Raised', value: `${(campaignStatsData.totalRaised ?? 0).toLocaleString()} ETB`, color: 'text-white' },
    { label: 'Total Donors', value: campaignStatsData.totalDonors?.toLocaleString() ?? '0', color: 'text-white' },
    { label: 'Avg. Contribution', value: `${avgContribution.toLocaleString()} ETB`, color: 'text-white' },
  ];

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/images/ethio.png')" }}
        />
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-8 tracking-wide border border-white/20">
            <span>🇪🇹</span>
            <span>{t('hero.badge')}</span>
          </div>
          <h1 className="text-[2.125rem] sm:text-[2.75rem] lg:text-[3.5rem] font-bold leading-tight mb-6 text-white [text-shadow:0_2px_8px_rgba(0,0,0,0.55)]">
            {t('hero.heading')} <span className="text-yellow-300">{t('hero.headingHighlight')}</span> {t('hero.headingEnd')}
          </h1>
          <p className="text-lg sm:text-xl text-white/95 mb-10 leading-relaxed max-w-2xl mx-auto [text-shadow:0_1px_4px_rgba(0,0,0,0.6)]">
            {t('hero.description')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button onClick={() => setComplaintModalOpen(true)} className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors shadow-lg">
              Complaint Issues
            </button>
            <Link to="/about" className="bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white font-semibold py-3 px-8 rounded-xl transition-colors">
              {t('hero.learnMore')}
            </Link>

          </div>
        </div>
      </section>

      {/* Quick Report Cards */}
      <section className="py-16 bg-[#14263e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">{t('home.reportTitle')}</h2>
            <p className="text-blue-100/70 max-w-xl mx-auto">{t('home.reportDesc')}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Building2,        title: t('home.infraTitle'),    desc: t('home.infraDesc'),    btnText: t('home.infraBtn'),    to: '/report/infrastructure', accent: 'from-blue-500 to-primary-700', bar: 'bg-gradient-to-r from-blue-500 to-primary-700' },
              { icon: Megaphone,        title: 'Other Complaint Issues', desc: t('home.publicComplaintDesc', 'Report public issues, corruption, and security concerns easily. Your complaint will be sent to the responsible office for action.'), btnText: 'Submit', to: '/report/public-complaint', accent: 'from-amber-500 to-orange-600', bar: 'bg-gradient-to-r from-amber-500 to-orange-600' },
            ].map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group card h-full relative overflow-hidden flex flex-col transition-shadow duration-300 hover:shadow-2xl bg-[#1e3652] border-[#2b4566]"
              >
                <div className={`absolute inset-x-0 top-0 h-1.5 ${c.bar}`} />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.accent} text-white flex items-center justify-center text-2xl shadow-md shadow-black/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                  <c.icon />
                </div>
                <h3 className="mt-5 text-lg font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-sm text-blue-100/70 leading-relaxed mb-4 flex-1 line-clamp-3 text-left">{c.desc}</p>
                <Link to={c.to} className="btn-primary text-sm py-2.5 px-5 w-full text-center mt-auto rounded-lg shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center justify-center gap-2">
                  {c.btnText}
                </Link>
              </motion.div>
            ))}
            <PublicAlertCard />
          </div>
        </div>
      </section>

      {/* Fundraising Card - Glassmorphism Hero Card */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="grid lg:grid-cols-2 gap-0">
              {/* Left Content */}
              <div className="p-8 sm:p-10 lg:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-white/90 border border-white/20 mb-5 w-fit">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  Active Fundraising Campaigns
                </div>

                <h3 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-3">
                  Infrastructure, Community & Education Fundraising
                </h3>
                <p className="text-base sm:text-lg text-white/80 mb-2 font-medium">
                  Fundraising for infrastructure development, community welfare, and education.
                </p>
                <p className="text-sm text-white/70 mb-6 max-w-lg">
                  Support infrastructure development, community welfare, and education across Ethiopia. Your donation builds roads, schools, and a stronger future for vulnerable families.
                </p>

                {/* Fundraising Stats */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-6">
                  {campaignStatItems.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                    >
                      <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-white/60">{s.label}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    to="/fundraising"
                    className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-primary-50 font-semibold py-3 px-7 rounded-xl transition-all shadow-lg"
                  >
                    View Campaigns
                  </Link>
                </div>
              </div>

              {/* Right Image */}
              <div className="relative min-h-[300px] lg:min-h-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?w=800&q=80"
                  alt="Fundraising"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-primary-900/30 to-transparent lg:bg-gradient-to-l" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Statistics */}
      {loading ? <LoadingSpinner /> : stats && (
        <section className="py-16 bg-[#1a3050]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-white mb-3">{t('home.statsTitle')}</h2>
              <p className="text-blue-100/70">{t('home.statsDesc')}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {statItems.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="card text-center bg-[#22406a] border-[#33588a]"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${s.accent} text-white flex items-center justify-center text-xl shadow-md shadow-black/20 mx-auto mb-3`}>
                    <s.icon />
                  </div>
                  <p className="text-2xl font-bold text-white">{s.value?.toLocaleString() ?? 0}</p>
                  <p className="text-xs text-blue-100/70 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Live Incident Map + Quick Stats */}
      <section className="py-16 bg-[#0f2036]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-3">{t('home.mapTitle')}</h2>
            <p className="text-blue-100/70 mb-4">{t('home.mapDesc')}</p>
          </div>

          {/* Quick live stats: today / this week / hot spot */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            {mapQuickStats.map((s, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="inline-flex items-center gap-2 rounded-full bg-[#16283f] border border-[#2b4566] px-4 py-2 text-xs font-semibold text-blue-100/80 shadow-sm"
              >
                <s.icon className="text-primary-400" size={14} strokeWidth={2} />
                <span>{s.label}:</span>
                <span className="text-white">{s.value}</span>
              </motion.span>
            ))}
          </div>

          <IncidentMap markers={mapMarkers} groups={locationGroups} height="480px" loading={loading} />
        </div>
      </section>

      {/* FAQ snippet */}
      <section className="py-16 bg-[#172e4a]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-white mb-3">{t('home.faqTitle')}</h2>
          </div>
          {[
            { q:t('home.faq1q'), a:t('home.faq1a') },
            { q:t('home.faq2q'), a:t('home.faq2a') },
            { q:t('home.faq3q'), a:t('home.faq3a') },
            { q:t('home.faq4q'), a:t('home.faq4a') },
          ].map((f, i) => (
            <details key={i} className="bg-[#1d344f] border border-[#2b4566] rounded-xl mb-3 group">
              <summary className="px-5 py-4 cursor-pointer font-medium text-white hover:text-primary-300 transition-colors list-none flex items-center justify-between">
                {f.q}
                <span className="text-blue-100/60 group-open:rotate-180 transition-transform"><ChevronDown className="w-4 h-4" strokeWidth={2} /></span>
              </summary>
              <p className="px-5 pb-4 text-sm text-blue-100/70 leading-relaxed">{f.a}</p>
            </details>
          ))}
          <div className="text-center mt-6">
            <Link to="/faq" className="btn-primary py-2.5 px-6">{t('home.viewAllFaq')}</Link>
          </div>
        </div>
      </section>



      {/* CTA */}
      <section className="py-16 bg-primary-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">{t('home.ctaTitle')}</h2>
          <p className="text-primary-100 mb-8">{t('home.ctaDesc')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/register" className="bg-white text-primary-700 hover:bg-primary-50 font-semibold py-3 px-8 rounded-xl transition-colors">{t('home.registerNow')}</Link>
            <Link to="/about" className="border border-white/40 hover:bg-white/10 text-white font-semibold py-3 px-8 rounded-xl transition-colors">{t('hero.learnMore')}</Link>
          </div>
        </div>
      </section>

      {/* Complaint Type Modal */}
      <AnimatePresence>
        {complaintModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setComplaintModalOpen(false)}
            role="presentation"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Choose Complaint Type"
              className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8"
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 24, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Complaint Issues
                </h2>
                <button
                  onClick={() => setComplaintModalOpen(false)}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-90"
                >
                  <X className="w-5 h-5" strokeWidth={2} />
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Select the type of issue you would like to report. Each option guides you through a simple step-by-step form.
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <Link
                  to="/report/public-complaint"
                  onClick={() => setComplaintModalOpen(false)}
                  className="group relative overflow-hidden rounded-2xl border-2 border-amber-200 dark:border-amber-900/40 p-6 text-left min-h-[260px] flex flex-col justify-end hover:border-amber-400 hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-200"
                >
                  <div className="absolute inset-0 flex">
                    <div className="w-1/2 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: "url('/images/download.jpg')" }} />
                    <div className="w-1/2 bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: "url('/images/chatgpt-complaint.png')" }} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/10" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                      <PencilLine size={24} strokeWidth={2} />
                    </div>
                    <h3 className="font-bold text-white mb-1.5">Other Complaint Issues</h3>
                    <p className="text-sm text-white/85 leading-relaxed">
                      Report public services, administration, corruption, and other community issues.
                    </p>
                  </div>
                </Link>
                <Link
                  to="/report/infrastructure"
                  onClick={() => setComplaintModalOpen(false)}
                  className="group relative overflow-hidden rounded-2xl border-2 border-blue-200 dark:border-blue-900/40 p-6 text-left min-h-[260px] flex flex-col justify-end hover:border-blue-400 hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all duration-200"
                >
                  <div className="absolute inset-0 flex">
                    <div className="w-full bg-cover bg-center bg-no-repeat"
                      style={{ backgroundImage: "url('/images/infra.png')" }} />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/45 to-black/10" />
                  <div className="relative z-10">
                    <div className="w-14 h-14 rounded-xl bg-blue-100/90 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">
                      <Building2 size={24} strokeWidth={2} />
                    </div>
                    <h3 className="font-bold text-white mb-1.5">Infrastructure Report</h3>
                    <p className="text-sm text-white/85 leading-relaxed">
                      Report damaged roads, bridges, water leaks, electricity problems, streetlights, and other infrastructure issues.
                    </p>
                  </div>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
