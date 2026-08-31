import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Check, Construction, Handshake, Info, LoaderCircle, Save, Upload, X } from 'lucide-react';
import { campaignAPI, locationAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { toast } from 'react-toastify';
import LoadingSpinner from '../../../components/common/LoadingSpinner';

const formatSubcityName = (value) => String(value || '')
  .toLowerCase()
  .replace(/_/g, ' ')
  .split(' ')
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const SUB_TYPES = {
  infrastructure: ['Road', 'Water Supply', 'Electricity', 'Bridge', 'Drainage', 'Public Facility', 'Other'],
  community: ['Food Support', 'Elderly Support', 'Low Income Families', 'Disability Support', 'Community Welfare', 'Medical Assistance', 'Other'],
  education: ['School Supplies', 'Books', 'School Furniture', 'Digital Learning', 'School Building', 'Student Scholarship', 'Other'],
  general: ['Other'],
};

const DEPARTMENTS = ['Roads', 'Water', 'Electricity', 'Health', 'Other'];

const TYPE_OPTIONS = [
  { value: 'infrastructure', label: 'Infrastructure', icon: Construction, desc: 'Roads, water, electricity, bridges, drainage and public facilities' },
  { value: 'community', label: 'Community & Social Support', icon: Handshake, desc: 'Food, elderly care, low-income families, disability support and welfare' },
  { value: 'education', label: 'Educational Support', icon: BookOpen, desc: 'School supplies, books, furniture, digital learning and buildings' },
];

const STEPS = [
  { key: 'type', label: 'Campaign Type' },
  { key: 'info', label: 'Campaign Information' },
  { key: 'location', label: 'Location' },
  { key: 'images', label: 'Campaign Images' },
];

export default function CreateCampaign({ basePath, editCampaignId, onDone }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = editCampaignId || searchParams.get('edit');

  const [form, setForm] = useState({
    title: '',
    description: '',
    campaignType: 'infrastructure',
    subType: '',
    department: '',
    goalAmount: '',
    endDate: '',
    estimatedBeneficiaries: '',
    location: { region: '', city: '', subcity: '', woreda: '', specificLocation: '' },
    image: '',
    images: [],
  });
  const [step, setStep] = useState(0);
  const [subcities, setSubcities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [loading, setLoading] = useState(!!editId);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    locationAPI.getSubcities().then((r) => setSubcities(r.data.data || [])).catch(() => {});
    locationAPI.getAllWoredas().then((r) => setWoredas(r.data.data || [])).catch(() => {});
  }, []);

  // Pre-fill the location for administrative officers so the campaign is
  // automatically scoped to their subcity/woreda and appears in subcity-level
  // oversight (SubcityCampaigns, analytics).
  useEffect(() => {
    if (editId) return;
    const isSubcityRole = ['subcity_bole', 'subcity_yeka', 'subcity_lemmi_kura'].includes(user?.role);
    const isWoreda = user?.role === 'woreda';
    if (!isSubcityRole && !isWoreda) return;
    const subcityName = formatSubcityName(user?.subcity);
    if (subcityName) setLoc('subcity', subcityName);
    if (isWoreda && user?.woredaName) setLoc('woreda', user.woredaName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, user?.subcity, user?.woredaName]);

  useEffect(() => {
    if (!editId) return;
    (async () => {
      try {
        const res = await campaignAPI.getOne(editId);
        const c = res.data.data;
        setForm({
          title: c.title || '',
          description: c.description || '',
          campaignType: c.campaignType || 'infrastructure',
          subType: c.subType || '',
          department: c.department || '',
          goalAmount: c.goalAmount || '',
          endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
          estimatedBeneficiaries: c.estimatedBeneficiaries || '',
          location: { ...{ region: '', city: '', subcity: '', woreda: '', specificLocation: '' }, ...(c.location || {}) },
          image: c.image || '',
          images: c.images || [],
        });
      } catch (err) {
        toast.error('Failed to load campaign');
        if (onDone) onDone();
        else navigate(basePath || '/woreda/dashboard/fundraising');
      } finally {
        setLoading(false);
      }
    })();
  }, [editId, navigate, basePath]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
  const setLoc = (key, value) => setForm((f) => ({ ...f, location: { ...f.location, [key]: value } }));

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (files.length + form.images.length > 5) {
      toast.error('Maximum of 5 images per campaign');
      return;
    }
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    setUploading(true);
    try {
      const res = await campaignAPI.uploadImages(fd);
      const urls = res.data.data || [];
      const images = [...form.images, ...urls];
      set('images', images);
      set('image', form.image || images[0]);
      toast.success(`${urls.length} image(s) uploaded`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (url) => {
    const images = form.images.filter((u) => u !== url);
    set('images', images);
    if (form.image === url) set('image', images[0] || '');
  };

  const validateStep = (s) => {
    if (s === 0 && !form.subType) {
      return form.campaignType === 'infrastructure'
        ? 'Please select an infrastructure type to continue'
        : 'Please select a support type to continue';
    }
    if (s === 1) {
      if (!form.title) return 'Please enter a campaign title to continue';
      if (!form.description) return 'Please enter a campaign description to continue';
      if (!form.goalAmount) return 'Please enter a goal amount to continue';
      if (!form.endDate) return 'Please choose a fundraising end date to continue';
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep(step);
    if (error) {
      toast.error(error);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateStep(step);
    if (error) {
      toast.error(error);
      return;
    }
    if (!form.image && form.images.length > 0) set('image', form.images[0]);
    const payload = {
      title: form.title,
      description: form.description,
      campaignType: form.campaignType,
      subType: form.subType,
      department: form.campaignType === 'infrastructure' ? form.department : '',
      goalAmount: Number(form.goalAmount),
      endDate: form.endDate,
      startDate: new Date().toISOString(),
      estimatedBeneficiaries: form.estimatedBeneficiaries ? Number(form.estimatedBeneficiaries) : undefined,
      location: form.location,
      image: form.image,
      images: form.images,
    };

    setSaving(true);
    try {
      if (editId) {
        await campaignAPI.update(editId, payload);
        toast.success('Campaign updated successfully');
        if (onDone) return onDone();
        navigate(basePath || '/woreda/dashboard/fundraising');
      } else {
        const res = await campaignAPI.create(payload);
        const created = res.data?.data;
        if (onDone) {
          toast.success(created?.status === 'active'
            ? 'Campaign created successfully! It is now live on the fundraising page.'
            : 'Campaign created. Publish it from the management page to make it live.');
          return onDone();
        }
        if (created?.status === 'active') {
          toast.success('Campaign created successfully! It is now live on the fundraising page.');
          navigate('/fundraising');
        } else {
          toast.success('Campaign created. Publish it from the management page to make it live.');
          navigate(basePath || '/woreda/dashboard/fundraising');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const subTypes = SUB_TYPES[form.campaignType] || [];
  const backPath = basePath || '/woreda/dashboard/fundraising';
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="h-full w-full max-w-6xl mx-auto flex flex-col overflow-hidden">
      {/* Top bar: back + title */}
      <div className="flex items-center justify-between gap-3 pb-1 shrink-0">
        <button onClick={() => (onDone ? onDone() : navigate(backPath))} className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Campaigns
        </button>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow shrink-0">
            <Save className="w-4 h-4" />
          </div>
          <div className="min-w-0 text-right">
            <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">{editId ? 'Edit Campaign' : 'Create Campaign'}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">Fill in the details below. Publish the campaign after it is saved.</p>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="shrink-0 pb-1.5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Step {step + 1} of {STEPS.length}</p>
          <p className="text-xs font-medium text-primary-600">{STEPS[step].label}</p>
        </div>
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.key} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-600'}`} />
          ))}
        </div>
        <div className="hidden sm:flex items-center flex-wrap gap-x-2 gap-y-1 mt-1">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                i < step ? 'bg-primary-500 text-white'
                : i === step ? 'bg-primary-500 text-white ring-2 ring-primary-200 dark:ring-primary-800'
                : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300'
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </span>
              <span className={`text-[11px] mx-1 ${i === step ? 'text-gray-900 dark:text-gray-100 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>{s.label}</span>
              {i < STEPS.length - 1 && <span className="w-4 h-px bg-gray-300 dark:bg-gray-600" />}
            </div>
          ))}
        </div>
      </div>

      {/* Step content + navigation */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto pb-1">
          {step === 0 && (
            <div className="card p-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Campaign Type</h2>
              <div className="grid sm:grid-cols-3 gap-2.5">
                {TYPE_OPTIONS.map((t) => (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => { set('campaignType', t.value); set('subType', ''); }}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.campaignType === t.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <div className="mb-1"><t.icon className="w-5 h-5" /></div>
                    <p className="font-semibold text-xs text-gray-800 dark:text-gray-200">{t.label}</p>
                    <p className="text-[11px] leading-snug text-gray-500 dark:text-gray-400 mt-0.5">{t.desc}</p>
                  </button>
                ))}
              </div>

              <div className="mt-2.5">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {form.campaignType === 'infrastructure' ? 'Infrastructure Type' :
                   form.campaignType === 'community' ? 'Support Type' :
                   form.campaignType === 'education' ? 'Support Type' : 'Campaign Sub-type'} *
                </label>
                <select
                  value={form.subType}
                  onChange={(e) => set('subType', e.target.value)}
                  className="input-field text-sm py-2"
                  required
                >
                  <option value="">Select {form.campaignType === 'infrastructure' ? 'infrastructure type' : 'support type'}...</option>
                  {subTypes.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {form.campaignType === 'infrastructure' && (
                <div className="mt-2.5">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Responsible Department</label>
                  <select value={form.department} onChange={(e) => set('department', e.target.value)} className="input-field text-sm py-2">
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="card p-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Campaign Information</h2>
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Title *</label>
                  <input type="text" value={form.title} onChange={(e) => set('title', e.target.value)} className="input-field text-sm py-2" placeholder="e.g. Rehabilitate the Asko Road in Woreda 6" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                  <textarea value={form.description} onChange={(e) => set('description', e.target.value)} className="input-field text-sm py-2 resize-none" rows={3} placeholder="Describe the campaign, its purpose and the impact it will create for the community..." required />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Goal Amount (ETB) *</label>
                    <input type="number" min="1" value={form.goalAmount} onChange={(e) => set('goalAmount', e.target.value)} className="input-field text-sm py-2" placeholder="e.g. 500000" required />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Estimated Beneficiaries</label>
                    <input type="number" min="0" value={form.estimatedBeneficiaries} onChange={(e) => set('estimatedBeneficiaries', e.target.value)} className="input-field text-sm py-2" placeholder="e.g. 2000" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fundraising End Date *</label>
                  <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className="input-field text-sm py-2" required />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="card p-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Location</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Subcity</label>
                  <input type="text" list="subcity-list" value={form.location.subcity} onChange={(e) => setLoc('subcity', e.target.value)} className="input-field text-sm py-2" placeholder="e.g. Bole" />
                  <datalist id="subcity-list">
                    {subcities.map((s) => <option key={s._id || s.name} value={s.name || s} />)}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Woreda</label>
                  <input type="text" list="woreda-list" value={form.location.woreda} onChange={(e) => setLoc('woreda', e.target.value)} className="input-field text-sm py-2" placeholder="e.g. Woreda 6" />
                  <datalist id="woreda-list">
                    {woredas.map((w) => <option key={w._id || w.name} value={w.name || w} />)}
                  </datalist>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Specific Location</label>
                  <input type="text" value={form.location.specificLocation} onChange={(e) => setLoc('specificLocation', e.target.value)} className="input-field text-sm py-2" placeholder="e.g. Around Bole Bulbula, near the mosque" />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="card p-4">
              <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2">Campaign Images</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Main Image URL</label>
                  <input type="url" value={form.image} onChange={(e) => set('image', e.target.value)} className="input-field text-sm py-2" placeholder="https://... (or upload below)" />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn-secondary w-full py-2 text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploading ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} {uploading ? 'Uploading...' : 'Upload Photos'}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFiles} />
                </div>
              </div>

              {form.images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mt-3">
                  {form.images.map((url) => (
                    <div key={url} className="relative group">
                      <img src={url} alt="" className={`w-full h-16 object-cover rounded-xl border-2 ${form.image === url ? 'border-primary-500' : 'border-transparent'}`} />
                      <button type="button" onClick={() => removeImage(url)} className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs hover:bg-primary-600">
                        <X className="w-3 h-3" />
                      </button>
                      <button type="button" onClick={() => set('image', url)} className={`absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded ${form.image === url ? 'bg-primary-500 text-white' : 'bg-black/60 text-white'}`}>
                        Cover
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Up to 5 images. The first image is used as the campaign cover.
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="shrink-0 flex flex-col sm:flex-row sm:items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
          {!isFirst && (
            <button type="button" onClick={handlePrev} className="btn-secondary w-full sm:w-auto px-5 py-2 flex items-center justify-center gap-2 shrink-0 text-sm">
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>
          )}
          <div className="flex-1 hidden sm:block" />
          {!isLast ? (
            <button type="button" onClick={handleNext} className="btn-primary w-full sm:w-auto px-7 py-2 flex items-center justify-center gap-2 font-bold shrink-0 text-sm">
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button type="submit" disabled={saving} className="btn-primary flex-1 sm:flex-none px-7 py-2 flex items-center justify-center gap-2 font-bold disabled:opacity-50 text-sm">
                {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} {editId ? 'Save Changes' : 'Create Campaign'}
              </button>
              {onDone ? (
                <button type="button" onClick={onDone} className="btn-secondary py-2 px-5 text-center shrink-0 text-sm">Cancel</button>
              ) : (
                <Link to={backPath} className="btn-secondary py-2 px-5 text-center shrink-0 text-sm">Cancel</Link>
              )}
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
