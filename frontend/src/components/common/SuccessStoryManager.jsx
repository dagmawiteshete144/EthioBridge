import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Star, Image, LoaderCircle, X, Eye, BookOpen } from 'lucide-react';
import { successStoryAPI } from '../../services/api';
import { toast } from 'react-toastify';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import ConfirmModal from './ConfirmModal';

export default function SuccessStoryManager({ title = 'Success Stories' }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '' });
  const [errors, setErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef(null);
  const modalBodyRef = useRef(null);

  const loadStories = async () => {
    try {
      const res = await successStoryAPI.getMy();
      setStories(res.data.data || []);
    } catch (err) {
      console.error('Failed to load success stories', err);
      toast.error('Failed to load success stories');
    }
  };

  useEffect(() => {
    (async () => {
      await loadStories();
      setLoading(false);
    })();
  }, []);

  // Lock page scroll while the create-form modal is open.
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = 'hidden';
      modalBodyRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  // Close the modal with the Escape key.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') closeModal(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalOpen, saving, uploading]);

  const openModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving || uploading) return;
    setModalOpen(false);
  };

  const resetForm = () => {
    setForm({ title: '', description: '' });
    setErrors({});
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.description.trim()) next.description = 'Description is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      let image = '';
      if (imageFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('images', imageFile);
        const up = await successStoryAPI.uploadImage(fd);
        image = up.data.data || '';
        setUploading(false);
      }
      const res = await successStoryAPI.create({
        title: form.title.trim(),
        description: form.description.trim(),
        image,
      });
      toast.success('Success story published!');
      setStories((prev) => [res.data.data, ...prev]);
      setModalOpen(false);
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish success story');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!storyToDelete) return;
    setDeleting(true);
    try {
      await successStoryAPI.delete(storyToDelete._id);
      toast.success('Success story removed');
      setStories((prev) => prev.filter((s) => s._id !== storyToDelete._id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove success story');
    } finally {
      setDeleting(false);
      setStoryToDelete(null);
    }
  };

  if (loading) return <LoadingSpinner fullPage />;

  const totalViews = stories.reduce((sum, s) => sum + (s.views || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header + Create button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">{title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Share your community impact. Published stories appear instantly on the public Success Stories page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-2 rounded-lg inline-flex items-center gap-1.5">
            <Eye className="w-4 h-4" strokeWidth={2} />
            {totalViews.toLocaleString()} {totalViews === 1 ? 'view' : 'views'}
          </span>
          <Link
            to="/success-stories"
            className="btn-secondary text-sm py-2 px-4 inline-flex items-center gap-2"
          >
            <Eye className="w-4 h-4" strokeWidth={2} /> View Public Page
          </Link>
          <button
            type="button"
            onClick={openModal}
            className="btn-primary text-sm py-2 px-4 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" strokeWidth={2} /> Create Success Story
          </button>
        </div>
      </div>

      {/* Published stories */}
      <div>
        {stories.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No Success Stories Yet"
            description="Share your community impact by creating a story above."
          >
            <button type="button" onClick={openModal} className="btn-primary text-sm py-2.5 px-5 inline-flex items-center gap-2">
              <Plus className="w-4 h-4" strokeWidth={2} /> Create Success Story
            </button>
          </EmptyState>
        ) : (
          <div className="space-y-3">
            {stories.map((s) => (
              <div key={s._id} className="card p-4 flex items-start justify-between gap-4">
                <div className="flex gap-3 flex-1 min-w-0">
                  {s.image ? (
                    <img src={s.image} alt="" className="w-20 h-20 object-cover rounded-lg shrink-0" />
                  ) : (
                    <div className="w-20 h-20 rounded-lg shrink-0 bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
                      <Image className="w-6 h-6 text-white/40" strokeWidth={2} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Star className="text-yellow-500 shrink-0" fill="currentColor" strokeWidth={2} />
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{s.title}</p>
                    </div>
                    {s.createdAt && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{new Date(s.createdAt).toLocaleDateString()}</p>}
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{s.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setStoryToDelete(s)}
                  className="text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" strokeWidth={2} /> Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Success Story modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
            role="presentation"
          >
            <motion.div
              ref={modalBodyRef}
              role="dialog"
              aria-modal="true"
              aria-label="Create Success Story"
              tabIndex={-1}
              className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Create Success Story</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Publish your community's impact story.</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving || uploading}
                  aria-label="Close"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-90"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>

              <form onSubmit={handlePublish} className="space-y-4">
                <div>
                  <label htmlFor="ss-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Success Story Title</label>
                  <input
                    id="ss-title"
                    value={form.title}
                    onChange={(e) => { setForm((p) => ({ ...p, title: e.target.value })); if (errors.title) setErrors((p) => ({ ...p, title: '' })); }}
                    placeholder="e.g. Fresh water reached 2,000 households"
                    className={`input-field ${errors.title ? 'border-red-400 focus:border-red-500' : ''}`}
                  />
                  {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label htmlFor="ss-desc" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea
                    id="ss-desc"
                    value={form.description}
                    onChange={(e) => { setForm((p) => ({ ...p, description: e.target.value })); if (errors.description) setErrors((p) => ({ ...p, description: '' })); }}
                    rows={4}
                    placeholder="Describe the completed project, achievement, or community impact..."
                    className={`input-field ${errors.description ? 'border-red-400 focus:border-red-500' : ''}`}
                  />
                  {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                </div>

                <div>
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload Featured Image <span className="text-xs text-gray-400 font-normal">(optional)</span></span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="ss-image-input"
                  />
                  {previewUrl ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <motion.img
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        src={previewUrl}
                        alt="Success story preview"
                        className="w-full h-44 object-cover"
                      />
                      <button
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                        aria-label="Remove image"
                      >
                        <X className="w-3.5 h-3.5" strokeWidth={2} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-gray-500 dark:text-gray-400 hover:border-primary-500 hover:text-primary-600 dark:hover:border-primary-400 dark:hover:text-primary-400 transition-colors active:scale-[0.99]"
                    >
                      <motion.span whileTap={{ scale: 0.9 }}>
                        <Image className="w-8 h-8" strokeWidth={2} />
                      </motion.span>
                      <span className="text-sm font-medium">Click to upload a featured image</span>
                      <span className="text-xs text-gray-400">PNG, JPG up to 5MB</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal} disabled={saving || uploading} className="btn-secondary flex-1 py-2.5 text-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving || uploading} className="btn-primary flex-1 py-2.5 text-sm inline-flex items-center justify-center gap-2">
                    {(saving || uploading) ? <LoaderCircle className="w-4 h-4 animate-spin" strokeWidth={2} /> : <Plus className="w-4 h-4" strokeWidth={2} />}
                    {saving || uploading ? 'Publishing...' : 'Publish'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={storyToDelete !== null}
        title="Remove success story"
        message="This success story will be removed from the public Success Stories page."
        confirmLabel="Remove"
        danger
        onConfirm={handleDelete}
        onCancel={() => setStoryToDelete(null)}
      />
    </div>
  );
}
