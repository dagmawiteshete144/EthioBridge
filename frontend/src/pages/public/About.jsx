import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Megaphone, Bell, HandHeart, Building2, TrendingUp,
  Target, Eye, Search, Scale, Handshake, Gem,
  Sprout, ArrowRight, UserRound, Landmark, Settings,
} from 'lucide-react';

const FEATURES = [
  {
    key: 'complaint',
    icon: Megaphone,
    titleKey: 'about.featureComplaint',
    descKey: 'about.featureComplaintDesc',
    to: '/about/public-complaint',
    accent: 'from-orange-500 to-amber-500',
    soft: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-600 dark:text-orange-400',
    glow: 'hover:shadow-orange-500/30',
    bar: 'bg-gradient-to-r from-orange-500 to-amber-500',
  },
  {
    key: 'alert',
    icon: Bell,
    titleKey: 'about.featureAlert',
    descKey: 'about.featureAlertDesc',
    accent: 'from-rose-500 to-red-500',
    soft: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-600 dark:text-rose-400',
    glow: 'hover:shadow-rose-500/30',
    bar: 'bg-gradient-to-r from-rose-500 to-red-500',
  },
  {
    key: 'fundraising',
    icon: HandHeart,
    titleKey: 'about.featureFundraising',
    descKey: 'about.featureFundraisingDesc',
    accent: 'from-emerald-500 to-teal-500',
    soft: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    glow: 'hover:shadow-emerald-500/30',
    bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
  },
  {
    key: 'infra',
    icon: Building2,
    titleKey: 'about.featureInfra',
    descKey: 'about.featureInfraDesc',
    to: '/about/infrastructure-reporting',
    accent: 'from-sky-500 to-blue-600',
    soft: 'bg-sky-50 dark:bg-sky-900/20',
    text: 'text-sky-600 dark:text-sky-400',
    glow: 'hover:shadow-sky-500/30',
    bar: 'bg-gradient-to-r from-sky-500 to-blue-600',
  },
  {
    key: 'analytics',
    icon: TrendingUp,
    titleKey: 'about.featureAnalytics',
    descKey: 'about.featureAnalyticsDesc',
    accent: 'from-violet-500 to-purple-600',
    soft: 'bg-violet-50 dark:bg-violet-900/20',
    text: 'text-violet-600 dark:text-violet-400',
    glow: 'hover:shadow-violet-500/30',
    bar: 'bg-gradient-to-r from-violet-500 to-purple-600',
  },
];

const MISSION_VISION = [
  {
    key: 'mission',
    icon: Target,
    titleKey: 'about.missionTitle',
    descKey: 'about.missionDesc',
    accent: 'from-primary-600 to-violet-600',
    glow: 'hover:shadow-primary-500/30',
  },
  {
    key: 'vision',
    icon: Eye,
    titleKey: 'about.visionTitle',
    descKey: 'about.visionDesc',
    accent: 'from-emerald-500 to-teal-600',
    glow: 'hover:shadow-emerald-500/30',
  },
];

const HOW_STEPS = [
  { step: 1, titleKey: 'about.step1Title', descKey: 'about.step1Desc' },
  { step: 2, titleKey: 'about.step2Title', descKey: 'about.step2Desc' },
  { step: 3, titleKey: 'about.step3Title', descKey: 'about.step3Desc' },
  { step: 4, titleKey: 'about.step4Title', descKey: 'about.step4Desc' },
  { step: 5, titleKey: 'about.step5Title', descKey: 'about.step5Desc' },
  { step: 6, titleKey: 'about.step6Title', descKey: 'about.step6Desc' },
  { step: 7, titleKey: 'about.step7Title', descKey: 'about.step7Desc' },
  { step: 8, titleKey: 'about.step8Title', descKey: 'about.step8Desc' },
];

const VALUES = [
  { key: 'transparency', icon: Search,       accent: 'from-sky-500 to-blue-600',     titleKey: 'about.valueTransparency',   descKey: 'about.valueTransparencyDesc' },
  { key: 'accountability', icon: Scale, accent: 'from-amber-500 to-orange-600', titleKey: 'about.valueAccountability', descKey: 'about.valueAccountabilityDesc' },
  { key: 'collaboration', icon: Handshake,   accent: 'from-emerald-500 to-teal-600', titleKey: 'about.valueCollaboration',  descKey: 'about.valueCollaborationDesc' },
  { key: 'integrity', icon: Gem,             accent: 'from-violet-500 to-purple-600', titleKey: 'about.valueIntegrity',      descKey: 'about.valueIntegrityDesc' },
  { key: 'empowerment', icon: Sprout,      accent: 'from-green-500 to-emerald-600', titleKey: 'about.valueEmpowerment',    descKey: 'about.valueEmpowermentDesc' },
];

const ROLES = [
  { id: 'citizen',   icon: UserRound, accent: 'from-sky-500 to-blue-600',        typeKey: 'about.roleCitizen',   descKey: 'about.roleCitizenDesc' },
  { id: 'woreda',    icon: Building2, accent: 'from-primary-600 to-indigo-600',  typeKey: 'about.roleWoreda',    descKey: 'about.roleWoredaDesc' },
  { id: 'subcity',   icon: Landmark, accent: 'from-emerald-500 to-teal-600',   typeKey: 'about.roleSubcity',   descKey: 'about.roleSubcityDesc' },
  { id: 'admin',     icon: Settings, accent: 'from-violet-500 to-purple-600',  typeKey: 'about.roleAdmin',     descKey: 'about.roleAdminDesc' },
];

function SectionHeading({ eyebrow, title, desc }) {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      className="text-center max-w-3xl mx-auto mb-12"
    >
      <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-900/30 border border-primary-100 dark:border-primary-800/50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">
        <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
        {t(eyebrow)}
      </span>
      <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{t(title)}</h2>
      {desc && <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">{t(desc)}</p>}
    </motion.div>
  );
}

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden">
      {/* ===== Hero Header ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-600 to-violet-600 text-white">
        <div className="absolute -top-28 -left-24 w-96 h-96 bg-ethiopia-green/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-36 -right-20 w-[28rem] h-[28rem] bg-ethiopia-yellow/25 rounded-full blur-3xl" />
        <div className="absolute top-8 right-1/3 w-44 h-44 bg-ethiopia-red/25 rounded-full blur-2xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-20 sm:py-28 text-center">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-sm font-medium"
          >
            <span className="w-2 h-2 rounded-full bg-ethiopia-yellow animate-pulse" />
            {t('about.headerBadge')}
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight"
          >
            {t('about.headerTitle')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-5 text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed"
          >
            {t('about.headerDesc')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3 }}
            className="mt-9 flex flex-wrap justify-center gap-3"
          >
            <Link
              to="/register"
              className="bg-white text-primary-700 hover:bg-primary-50 hover:scale-105 font-semibold py-3 px-8 rounded-xl shadow-lg shadow-black/10 transition-all duration-200 inline-block"
            >
              {t('hero.getStarted')}
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ===== What is EthioBridge + Features ===== */}
      <section className="relative py-20 sm:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="about.whatIs" title="about.whatIs" />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.55 }}
            className="max-w-3xl mx-auto text-center mb-16"
          >
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{t('about.para1')}</p>
            <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">{t('about.para2')}</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              const cardClasses = `group h-full relative overflow-hidden rounded-2xl ${f.soft} border border-gray-100 dark:border-gray-700 p-7 flex flex-col transition-shadow duration-300 hover:shadow-2xl ${f.glow} ${f.to ? 'cursor-pointer' : ''}`;
              const inner = (
                <>
                  <div className={`absolute inset-x-0 top-0 h-1.5 ${f.bar}`} />
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.accent} text-white flex items-center justify-center text-2xl shadow-lg shadow-black/10 group-hover:rotate-6 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon />
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-gray-900 dark:text-gray-100">{t(f.titleKey)}</h3>
                  <p className="mt-2 flex-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t(f.descKey)}</p>
                  {f.to && (
                    <div className={`mt-5 flex items-center gap-1.5 text-sm font-semibold ${f.text} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`}>
                      {t('about.learnMore')}
                      <ArrowRight className="text-xs" strokeWidth={2} />
                    </div>
                  )}
                </>
              );
              return (
                <motion.div
                  key={f.key}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
                  whileHover={{ y: -10, scale: 1.03 }}
                >
                  {f.to ? (
                    <Link to={f.to} className={cardClasses}>{inner}</Link>
                  ) : (
                    <div className={cardClasses}>{inner}</div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== Mission & Vision ===== */}
      <section className="py-20 sm:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8">
            {MISSION_VISION.map((m, i) => {
              const Icon = m.icon;
              return (
                <motion.div
                  key={m.key}
                  initial={{ opacity: 0, y: 28 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.55, delay: i * 0.12 }}
                  whileHover={{ y: -8 }}
                  className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-8 border border-gray-100 dark:border-gray-700 transition-shadow duration-300 hover:shadow-2xl ${m.glow}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${m.accent}`} />
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${m.accent} text-white flex items-center justify-center text-2xl shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon />
                  </div>
                  <h3 className="mt-5 text-2xl font-extrabold text-gray-900 dark:text-gray-100">{t(m.titleKey)}</h3>
                  <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">{t(m.descKey)}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== How it Works ===== */}
      <section className="py-20 sm:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="about.howItWorks" title="about.howItWorks" />
          <div className="relative max-w-3xl mx-auto">
            <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary-500 via-violet-500 to-emerald-500 opacity-60" />
            <div className="space-y-6">
              {HOW_STEPS.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, x: -26 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45, delay: i * 0.04 }}
                  className="relative pl-16"
                >
                  <div className="absolute left-0 top-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-violet-600 text-white flex items-center justify-center font-bold text-sm shadow-lg shadow-primary-600/30 ring-4 ring-white dark:ring-gray-900">
                    {s.step}
                  </div>
                  <div className="card py-4 px-5 hover:shadow-lg hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-300">
                    <p className="font-bold text-gray-800 dark:text-gray-200">{t(s.titleKey)}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{t(s.descKey)}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Values ===== */}
      <section className="py-20 sm:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="about.valuesTitle" title="about.valuesTitle" />
          <div className="flex flex-wrap justify-center gap-6">
            {VALUES.map((v, i) => {
              const Icon = v.icon;
              return (
                <motion.div
                  key={v.key}
                  initial={{ opacity: 0, y: 26 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="group card transition-shadow duration-300 hover:shadow-xl w-full sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]"
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${v.accent} text-white flex items-center justify-center text-xl shadow-md shadow-black/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
                    <Icon />
                  </div>
                  <h3 className="mt-4 font-bold text-gray-800 dark:text-gray-200">{t(v.titleKey)}</h3>
                  <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(v.descKey)}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== User Roles ===== */}
      <section className="py-20 sm:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="about.usersTitle" title="about.usersTitle" desc="about.usersDesc" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROLES.map((r, i) => {
              const Icon = r.icon;
              return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.06 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="group card text-center transition-shadow duration-300 hover:shadow-xl"
              >
                <div className={`mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br ${r.accent} flex items-center justify-center text-2xl shadow-md shadow-black/10 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={24} strokeWidth={2} />
                </div>
                <h3 className="mt-4 font-bold text-gray-800 dark:text-gray-200">{t(r.typeKey)}</h3>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t(r.descKey)}</p>
              </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 sm:py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.55 }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-600 p-10 sm:p-16 text-center text-white shadow-2xl shadow-primary-700/30"
          >
            <div className="absolute -top-16 -right-10 w-56 h-56 bg-ethiopia-yellow/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-ethiopia-red/20 rounded-full blur-3xl" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{t('about.ctaTitle')}</h2>
              <p className="mt-4 text-blue-100 max-w-xl mx-auto leading-relaxed">{t('about.ctaDesc')}</p>
              <Link
                to="/register"
                className="mt-8 inline-block bg-white text-primary-700 hover:bg-primary-50 hover:scale-105 font-semibold py-3 px-10 rounded-xl shadow-lg shadow-black/10 transition-all duration-200"
              >
                {t('hero.getStarted')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
