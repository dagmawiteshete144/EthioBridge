import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ArrowLeft, CircleCheck } from 'lucide-react';

function SectionHeading({ eyebrow, title, desc }) {
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
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100">{title}</h2>
      {desc && <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">{desc}</p>}
    </motion.div>
  );
}

export function InfoHero({ badge, title, desc }) {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-600 to-violet-600 text-white">
      <div className="absolute -top-28 -left-24 w-96 h-96 bg-ethiopia-green/25 rounded-full blur-3xl" />
      <div className="absolute -bottom-36 -right-20 w-[28rem] h-[28rem] bg-ethiopia-yellow/25 rounded-full blur-3xl" />
      <div className="absolute top-8 right-1/3 w-44 h-44 bg-ethiopia-red/25 rounded-full blur-2xl" />
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex justify-center mb-8"
        >
          <Link
            to="/about"
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 text-sm font-semibold px-4 py-2 rounded-full transition-colors duration-200"
          >
            <ArrowLeft className="text-xs" strokeWidth={2} />
            {t('about.backToAbout', 'Back to About')}
          </Link>
        </motion.div>
        <motion.span
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-1.5 text-sm font-medium"
        >
          <span className="w-2 h-2 rounded-full bg-ethiopia-yellow animate-pulse" />
          {badge}
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight"
        >
          {title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2 }}
          className="mt-5 text-lg text-blue-100 max-w-2xl mx-auto leading-relaxed"
        >
          {desc}
        </motion.p>
      </div>
    </section>
  );
}

export function InfoSection({ eyebrow, title, desc, children, bg = 'bg-white dark:bg-gray-900' }) {
  return (
    <section className={`py-16 sm:py-20 ${bg}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading eyebrow={eyebrow} title={title} desc={desc} />
        {children}
      </div>
    </section>
  );
}

export function InfoCard({ icon, title, desc, accent, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -6, scale: 1.02 }}
      className="group card transition-shadow duration-300 hover:shadow-xl"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} text-white flex items-center justify-center text-xl shadow-md shadow-black/10 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
        {icon}
      </div>
      <h3 className="mt-4 font-bold text-gray-800 dark:text-gray-200">{title}</h3>
      {desc && <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{desc}</p>}
      {children}
    </motion.div>
  );
}

export function InfoSteps({ steps }) {
  return (
    <div className="relative max-w-3xl mx-auto">
      <div className="absolute left-[19px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary-500 via-violet-500 to-emerald-500 opacity-60" />
      <div className="space-y-6">
        {steps.map((s, i) => (
          <motion.div
            key={i}
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
              <p className="font-bold text-gray-800 dark:text-gray-200">{s.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{s.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function InfoCheckList({ items, color = 'text-emerald-500' }) {
  return (
    <motion.ul
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5 }}
      className="grid sm:grid-cols-2 gap-3 max-w-4xl mx-auto"
    >
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 card py-3 px-4">
          <CircleCheck className={`shrink-0 mt-0.5 ${color}`} strokeWidth={2} />
          <span className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{item}</span>
        </li>
      ))}
    </motion.ul>
  );
}

export function InfoCTA({ title, desc, actionLabel, actionTo }) {
  return (
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
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{title}</h2>
            {desc && <p className="mt-4 text-blue-100 max-w-xl mx-auto leading-relaxed">{desc}</p>}
            <Link
              to={actionTo}
              className="mt-8 inline-block bg-white text-primary-700 hover:bg-primary-50 hover:scale-105 font-semibold py-3 px-10 rounded-xl shadow-lg shadow-black/10 transition-all duration-200"
            >
              {actionLabel}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
