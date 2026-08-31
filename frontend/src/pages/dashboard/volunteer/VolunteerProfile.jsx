import { useState, useRef, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../context/AuthContext';
import { authAPI, locationAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';

const SUBCITY_VALUE_MAP = {
  YEKA: 'Yeka',
  BOLE: 'Bole',
  LEMMI_KURA: 'Lemmi Kura',
};

export default function VolunteerProfile() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();

  const [form, setForm] = useState({
    fullName:             user?.fullName || '',
    gender:               user?.gender || '',
    age:                  user?.age || '',
    phone:                user?.phone || '',
    profession:           user?.profession || '',
    skills:               (user?.skills || []).join(', '),
    subcity:              user?.subcity || '',
    woredaName:           user?.woredaName || '',
  });

  const [subcities, setSubcities] = useState([]);
  const [woredas, setWoredas] = useState([]);

  const [preview, setPreview]       = useState(user?.profileImage || null);
  const [uploading, setUploading]   = useState(false);
  const fileInputRef                = useRef(null);

  const [saving, setSaving]         = useState(false);

  const [pwForm, setPwForm]         = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw]         = useState({ current: false, new: false, confirm: false });
  const [savingPw, setSavingPw]     = useState(false);

  useEffect(() => {
    locationAPI.getSubcities()
      .then(r => setSubcities(r.data.subcities || []))
      .catch(() => setSubcities([]));
  }, []);

  useEffect(() => {
    if (!form.subcity) { setWoredas([]); return; }
    const subcity = subcities.find(s => (s.name || '').toLowerCase() === (SUBCITY_VALUE_MAP[form.subcity] || '').toLowerCase());
    if (!subcity) { setWoredas([]); return; }
    locationAPI.getWoredasBySubcity(subcity._id)
      .then(r => setWoredas(r.data.woredas || []))
      .catch(() => setWoredas([]));
  }, [form.subcity, subcities]);

  const handlePhotoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error(t('dashboard.selectImageError')); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error(t('dashboard.imageTooLarge')); return; }

    const localURL = URL.createObjectURL(file);
    setPreview(localURL);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('profileImage', file);
      fd.append('fullName', form.fullName);
      const res = await authAPI.updateProfile(fd);
      updateUser(res.data.user);
      setPreview(res.data.user.profileImage || localURL);
      toast.success(t('dashboard.photoUpdated'));
    } catch (err) {
      setPreview(user?.profileImage || null);
      toast.error(err.response?.data?.message || t('dashboard.photoUploadFailed'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.set('skills', form.skills.split(',').map(s => s.trim()).filter(Boolean).join(','));
      const res = await authAPI.updateProfile(fd);
      updateUser(res.data.user);
      toast.success(t('dashboard.profileUpdated'));
      if (!form.subcity) toast.warning(t('toast.volunteerSubcityMissing'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error(t('dashboard.passwordsDoNotMatch')); return; }
    if (pwForm.newPassword.length < 6) { toast.error(t('dashboard.passwordTooShort')); return; }
    setSavingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success(t('dashboard.passwordChanged'));
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || t('dashboard.passwordChangeFailed'));
    } finally {
      setSavingPw(false);
    }
  };

  const update = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title={t('dashboard.myProfile')} />

      {/* Avatar Card */}
      <div className="card flex items-center gap-5">
        <div className="relative shrink-0">
          <div className="w-24 h-24 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-300 text-4xl font-bold overflow-hidden ring-4 ring-primary-50">
            {preview
              ? <img src={preview} alt="Profile" className="w-full h-full object-cover" />
              : <span>{user?.fullName?.[0]?.toUpperCase()}</span>}
          </div>
          {uploading && (
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
              <span className="w-7 h-7 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <label
            className="absolute bottom-0 right-0 w-8 h-8 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-colors"
            title={t('dashboard.changePhoto')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handlePhotoSelect} disabled={uploading} />
          </label>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-800 dark:text-gray-200 text-lg truncate">{user?.fullName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Personal Information Form */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">{t('dashboard.personalInfo')}</h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{t('dashboard.volunteerProfileInfo')}</p>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('dashboard.fullName')}</label>
              <input value={form.fullName} onChange={update('fullName')} className="input-field" required />
            </div>
            <div>
              <label className={labelCls}>{t('dashboard.phoneNumber')}</label>
              <input value={form.phone} onChange={update('phone')} className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('register.gender')}</label>
              <select value={form.gender} onChange={update('gender')} className="input-field">
                <option value="">{t('register.selectGender')}</option>
                <option value="Male">{t('register.male')}</option>
                <option value="Female">{t('register.female')}</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>{t('register.age')}</label>
              <input type="number" min="0" max="150" value={form.age} onChange={update('age')} className="input-field" />
            </div>
          </div>

          <div>
            <label className={labelCls}>{t('register.profession')}</label>
            <input value={form.profession} onChange={update('profession')} className="input-field" />
          </div>

          <div>
            <label className={labelCls}>{t('register.skills')}</label>
            <input value={form.skills} onChange={update('skills')} className="input-field" placeholder={t('register.skillsPlaceholder')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Subcity</label>
              <select value={form.subcity} onChange={(e) => setForm(p => ({ ...p, subcity: e.target.value, woredaName: '' }))} className="input-field">
                <option value="">Select Subcity</option>
                <option value="YEKA">Yeka</option>
                <option value="BOLE">Bole</option>
                <option value="LEMMI_KURA">Lemmi Kefleketema</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Woreda</label>
              <select value={form.woredaName} onChange={update('woredaName')} className="input-field" disabled={!form.subcity}>
                <option value="">{form.subcity ? 'Select Woreda' : 'Select Subcity first'}</option>
                {woredas.map(w => <option key={w._id} value={w.woredaName || w.name}>{w.woredaName || w.name}</option>)}
              </select>
            </div>
          </div>

          <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">{t('dashboard.subcityProfileHint')}</p>

          <div>
            <label className={labelCls}>{t('dashboard.emailReadOnly')}</label>
            <input value={user?.email} readOnly className="input-field bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed" />
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary py-2.5 px-6">
              {saving
                ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('dashboard.saving')}</span>
                : t('dashboard.saveChanges')}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">{t('dashboard.changePassword')}</h3>
        <form onSubmit={handlePwChange} className="space-y-4">
          <div>
            <label className={labelCls}>{t('dashboard.currentPassword')}</label>
            <div className="relative">
              <input type={showPw.current ? 'text' : 'password'} value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))} required className="input-field pr-10" placeholder="••••••••" />
              <button type="button" onClick={() => setShowPw(p => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{showPw.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{t('dashboard.newPassword')}</label>
              <div className="relative">
                <input type={showPw.new ? 'text' : 'password'} value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))} required className="input-field pr-10" placeholder={t('dashboard.passwordPlaceholder')} />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, new: !p.new }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{showPw.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
            <div>
              <label className={labelCls}>{t('dashboard.confirmNewPassword')}</label>
              <div className="relative">
                <input type={showPw.confirm ? 'text' : 'password'} value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))} required className="input-field pr-10" placeholder={t('dashboard.confirmPlaceholder')} />
                <button type="button" onClick={() => setShowPw(p => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">{showPw.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
            </div>
          </div>
          <button type="submit" disabled={savingPw} className="btn-primary py-2.5 px-6">
            {savingPw
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t('dashboard.updating')}</span>
              : t('dashboard.updatePassword')}
          </button>
        </form>
      </div>
    </div>
  );
}
