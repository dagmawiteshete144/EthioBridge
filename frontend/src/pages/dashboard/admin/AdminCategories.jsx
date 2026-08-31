import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import { adminAPI } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import { FolderOpen } from 'lucide-react';

const CATEGORY_TYPES = [
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'public_complaint', label: 'Public Complaint' },
  { value: 'public_service', label: 'Public Service' },
  { value: 'community_issue', label: 'Community Issue' },
  { value: 'environment', label: 'Environment' },
  { value: 'other', label: 'Other' },
];

const getTypeLabel = (value) => CATEGORY_TYPES.find(t => t.value === value)?.label || value;

export default function AdminCategories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name:'', type:'', description:'' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);

  const fetchCats = () => {
    setLoading(true);
    adminAPI.getCategories()
      .then(r => { setCategories(r.data.categories); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchCats(); }, []);

  const validate = () => {
    const next = {};
    if (!form.name || !form.name.trim()) next.name = t('dashboard.categoryNameRequired', 'Category name is required.');
    if (!form.type) next.type = t('dashboard.categoryTypeRequired', 'Category type is required.');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await adminAPI.createCategory(form);
      toast.success(t('dashboard.categoryCreated'));
      setForm({ name:'', type:'', description:'' });
      setErrors({});
      fetchCats();
    } catch (err) { toast.error(err.response?.data?.message || t('dashboard.createFailed')); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteCategory(id);
      toast.success(t('dashboard.categoryDeleted'));
      fetchCats();
    } catch (err) { toast.error(t('dashboard.deleteFailed')); }
    setDelConfirm(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('dashboard.categoryManagement')} />

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">{t('dashboard.addNewCategory')}</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.categoryName')}</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className={`input-field ${errors.name ? 'border-red-400' : ''}`} placeholder={t('dashboard.categoryPlaceholder')} />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.categoryType', 'Category Type *')}</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={`input-field ${errors.type ? 'border-red-400' : ''}`}>
                <option value="">{t('dashboard.selectCategoryType', 'Select category type…')}</option>
                {CATEGORY_TYPES.map(tp => (
                  <option key={tp.value} value={tp.value}>{tp.label}</option>
                ))}
              </select>
              {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('dashboard.descriptionLabel2')}</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} className="input-field" placeholder={t('dashboard.optionalDesc')} />
            </div>
            <button type="submit" disabled={saving} className="btn-primary text-sm py-2 px-5">{saving ? t('dashboard.creating') : t('dashboard.addCategory')}</button>
          </form>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">{t('dashboard.existingCategories')}</h3>
          </div>
          {loading ? <LoadingSpinner /> : categories.length === 0 ? <EmptyState icon={<FolderOpen size={48} strokeWidth={2} />} title={t('dashboard.noCategories')} /> : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {categories.map(c => (
                <div key={c._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-800">{c.name}</p>
                      {c.type && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 capitalize">
                          {getTypeLabel(c.type)}
                        </span>
                      )}
                    </div>
                    {c.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{c.description}</p>}
                  </div>
                  <button onClick={() => setDelConfirm({ id: c._id, name: c.name })} className="text-xs text-red-500 hover:text-red-700 px-2 py-1">{t('dashboard.delete')}</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={!!delConfirm}
        title={t('dashboard.deleteCategory')}
        message={t('dashboard.deleteCategoryConfirm', { name: delConfirm?.name })}
        confirmLabel={t('dashboard.delete')}
        danger
        onConfirm={() => handleDelete(delConfirm.id)}
        onCancel={() => setDelConfirm(null)}
      />
    </div>
  );
}
