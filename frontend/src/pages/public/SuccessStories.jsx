import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ArrowRight, MapPin, UserRound, Image, X, Sparkles } from 'lucide-react';
import { campaignAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';

export default function SuccessStories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await campaignAPI.getSuccessStories();
        if (!cancelled) setStories(res.data.data || []);
      } catch (err) {
        console.error('Failed to load success stories', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Lock page scroll while the story detail modal is open.
  useEffect(() => {
    if (selectedStory) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [selectedStory]);

  // Close the modal with the Escape key.
  useEffect(() => {
    if (!selectedStory) return;
    const onKey = (e) => { if (e.key === 'Escape') setSelectedStory(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedStory]);

  // Deduplicate and show the newest stories first.
  const displayStories = (() => {
    const seen = new Set();
    const unique = [];
    for (const s of stories) {
      const key = s._id || `${s.title}-${s.campaignTitle}-${s.date}`;
      if (seen.has(key)) continue;
      seen.add(key);
      unique.push(s);
    }
    return unique.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  })();

  const locationParts = (s) => [
    s.location?.region,
    s.location?.city,
    s.location?.subcity,
    s.location?.woreda,
  ].filter(Boolean);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString() : '');

  if (loading) return <LoadingSpinner fullPage />;

  return (
    <div>
      {/* ========== HERO ========== */}
      <section className="relative min-h-[380px] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1600&q=80')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900/90 via-primary-800/80 to-primary-900/90" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"80\" height=\"80\" viewBox=\"0 0 80 80\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"white\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M40 10L44 28H62L48 40L54 58L40 48L26 58L32 40L18 28H36Z\" /%3E%3C/g%3E%3C/svg%3E')" }} />
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-primary-500/20 blur-3xl" />
        <div className="absolute -bottom-28 -right-28 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-4 py-2 rounded-full text-sm mb-6 border border-white/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-white/90 font-medium">EthioBridge Impact Stories</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-4 text-white drop-shadow-lg">
            Success Stories
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-white/80 mb-3 max-w-2xl mx-auto">
            Real impact your donations and reports have made possible across Addis Ababa
          </motion.p>
        </div>
      </section>

      {/* ========== STORIES GRID ========== */}
      <section className="py-16 bg-gray-50 dark:bg-gray-800 min-h-[300px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {displayStories.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="No success stories yet"
              description="Be the first to turn a campaign into a success story. Start or support a campaign today."
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayStories.map((story, i) => {
                const parts = locationParts(story);
                return (
                  <motion.article
                    key={story._id || i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: (i % 3) * 0.08 }}
                    className="card hover:shadow-lg transition-shadow group flex flex-col overflow-hidden"
                  >
                    {story.image || story.campaignImage ? (
                      <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl">
                        <img src={story.image || story.campaignImage} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        <span className="absolute bottom-3 left-3 text-xs font-medium text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full capitalize">
                          {story.campaignType || 'General'}
                        </span>
                      </div>
                    ) : (
                      <div className="relative h-44 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center">
                        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-2">
                          <Image className="w-12 h-12 text-white/40" strokeWidth={2} />
                          <span className="text-xs text-white/60">Impact Story</span>
                        </motion.div>
                        <span className="absolute bottom-3 left-3 text-xs font-medium text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full capitalize">
                          {story.campaignType || 'General'}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="w-4 h-4 text-yellow-500" strokeWidth={2} />
                      {story.date && (
                        <span className="text-xs text-gray-400">
                          Created {formatDate(story.date)}
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-1">{story.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-4">{story.description}</p>

                    {parts.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                        <p className="flex items-start gap-1.5 leading-relaxed">
                          <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-primary-500" />
                          <span>{parts.join(' · ')}</span>
                        </p>
                      </div>
                    )}
                    {story.author && (
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                        <UserRound className="w-3 h-3 shrink-0 text-primary-500" />
                        <span className="truncate">
                          Published by <span className="font-medium text-gray-700 dark:text-gray-200">{story.author}</span>
                          {story.authorRoleLabel ? ` · ${story.authorRoleLabel}` : ''}
                        </span>
                      </div>
                    )}

                    <div className="mt-auto pt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedStory(story)}
                        className="inline-flex items-center gap-1.5 text-primary-600 hover:text-primary-700 dark:text-primary-400 text-sm font-medium transition-colors active:scale-95"
                      >
                        View Details <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ========== STORY DETAIL MODAL ========== */}
      <AnimatePresence>
        {selectedStory && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedStory(null)}
            role="presentation"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={selectedStory.title}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedStory(null)}
                aria-label="Close"
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 text-white hover:bg-red-600 flex items-center justify-center transition-colors active:scale-90"
              >
                <X />
              </button>

              <div className="relative h-56 sm:h-64 shrink-0">
                {selectedStory.image || selectedStory.campaignImage ? (
                  <img src={selectedStory.image || selectedStory.campaignImage} alt={selectedStory.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 flex items-center justify-center">
                    <Image className="w-14 h-14 text-white/40" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <span className="absolute bottom-4 left-4 text-xs font-medium text-white bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full capitalize">
                  {selectedStory.campaignType || 'General'}
                </span>
              </div>

              <div className="p-6 sm:p-8 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3 text-xs text-gray-400">
                  <Star className="text-yellow-500" />
                  {selectedStory.date && <span>Created {formatDate(selectedStory.date)}</span>}
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 leading-tight mb-3">
                  {selectedStory.title}
                </h2>

                {selectedStory.author && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-4">
                    <UserRound className="w-3.5 h-3.5 shrink-0 text-primary-500" />
                    Published by <span className="font-medium text-gray-700 dark:text-gray-200">{selectedStory.author}</span>
                    {selectedStory.authorRoleLabel ? ` · ${selectedStory.authorRoleLabel}` : ''}
                  </p>
                )}

                {(locationParts(selectedStory).length > 0) && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-start gap-1.5 mb-4">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary-500" />
                    <span>{locationParts(selectedStory).join(' · ')}</span>
                  </p>
                )}

                <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                  {selectedStory.description}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
