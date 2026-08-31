import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { infraAPI, locationAPI, publicAPI } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { isWithinAddisAbaba } from '../../../components/map/EthioMap';
import AddisAbabaGpsPicker from '../../../components/map/AddisAbabaGpsPicker';
import PublicComplaintPage from '../../public/PublicComplaintPage';
import { toast } from 'react-toastify';
import { ArrowLeft, Camera, Check, ChevronRight, CircleCheck, Construction, Copy, Droplets, MapPin, Megaphone, TriangleAlert, Video, X, Zap } from 'lucide-react';

const CATEGORIES = [
  { v: 'road_issue',         label: 'Road Issue',         icon: Construction, color: 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800', ring: 'ring-orange-400' },
  { v: 'electricity_issue',  label: 'Electricity Issue',  icon: Zap, color: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800', ring: 'ring-yellow-400' },
  { v: 'water_supply_issue', label: 'Water Supply Issue', icon: Droplets, color: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800', ring: 'ring-blue-400' },
];

// Map the report category to the routing department used by Subcity / Woreda dashboards
const CATEGORY_DEPARTMENT_MAP = {
  'road_issue':         'Transport',
  'electricity_issue':  'Electricity',
  'water_supply_issue': 'Water',
};
const DEPARTMENT_CATEGORY_MAP = {
  'Transport':   'road_issue',
  'Electricity': 'electricity_issue',
  'Water':       'water_supply_issue',
};

const DEPARTMENTS = ['Transport', 'Water', 'Electricity'];

const SEVERITY = [
  { v: 'Low',      color: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300', ring: 'ring-green-400' },
  { v: 'Medium',   color: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300', ring: 'ring-yellow-400' },
  { v: 'High',     color: 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300', ring: 'ring-orange-400' },
];

const SECTION_META = [
  { key: 'issue',   icon: '1', labelEn: 'Issue Details' },
  { key: 'location', icon: '2', labelEn: 'Location' },
  { key: 'media',   icon: '3', labelEn: 'Evidence' },
];

export default function CreateReport({ initialStep = 'type', publicMode = false, successPath = '/dashboard/citizen/my-reports' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(initialStep);
  const [formStep, setFormStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState(null);
  const [gpsCapturedAt, setGpsCapturedAt] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    title: '', description: '', region: '', woreda: '',
    city: '', subcity: '', specificLocation: '', reportDate: '',
    category: '', severityLevel: 'Medium',
    subcityId: '', woredaId: '', department: '', phone: '',
  });
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [guestSuccess, setGuestSuccess] = useState(null);
  const [copiedField, setCopiedField] = useState('');
  const photoRef = useRef(null);
  const videoRef = useRef(null);

  const [subcities, setSubcities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [loadingSubcities, setLoadingSubcities] = useState(true);
  const [loadingWoredas, setLoadingWoredas] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const subRes = await locationAPI.getSubcities();
        if (!mounted) return;
        setSubcities(subRes.data?.subcities || []);
      } catch {
        if (mounted) toast.error('Failed to load subcity data');
      } finally {
        if (mounted) setLoadingSubcities(false);
      }
    };
    load();
    if (user?.phone) setForm(p => ({ ...p, phone: user.phone }));
    return () => { mounted = false; };
  }, []);

  const handleSubcityChange = async (subcityId) => {
    set('subcityId', subcityId);
    set('woredaId', '');
    setWoredas([]);
    if (!subcityId) return;
    setLoadingWoredas(true);
    try {
      const res = await locationAPI.getWoredasBySubcity(subcityId);
      setWoredas(res.data?.woredas || []);
    } catch {
      toast.error('Failed to load woredas for the selected subcity');
    } finally {
      setLoadingWoredas(false);
    }
  };

  const handleDepartmentChange = (value) => {
    set('department', value);
    if (DEPARTMENT_CATEGORY_MAP[value]) set('category', DEPARTMENT_CATEGORY_MAP[value]);
  };

  const handleLocationSelect = ({ lat, lng, capturedAt }) => {
    setPosition({ lat, lng });
    if (capturedAt) setGpsCapturedAt(capturedAt);
    setErrors(p => { const n = { ...p }; delete n.gps; return n; });
  };

  const handleClearGps = () => {
    setPosition(null);
    setGpsCapturedAt(null);
  };

  const copyToClipboard = async (text, field) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const handleChange = (e) => set(e.target.name, e.target.value);

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    const oversized = files.find(f => f.size > 10 * 1024 * 1024);
    if (oversized) { toast.error(`${oversized.name} exceeds 10MB limit`); return; }
    setPhotos(files);
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 2);
    const oversized = files.find(f => f.size > 50 * 1024 * 1024);
    if (oversized) { toast.error(`${oversized.name} exceeds 50MB limit`); return; }
    setVideos(files);
  };

  const validate = () => {
    const err = {};
    if (!form.title.trim()) err.title = t('report.validation.titleRequired') || 'Title is required';
    else if (form.title.length > 200) err.title = 'Title must be under 200 characters';
    if (!form.category) err.category = t('report.validation.categoryRequired') || 'Category is required';
    if (!form.description.trim()) err.description = t('report.validation.descRequired') || 'Description is required';
    else if (form.description.length > 5000) err.description = 'Description must be under 5000 characters';
    if (step === 'infrastructure') {
      if (!form.subcityId) err.subcityId = 'Subcity is required';
      if (!form.department) err.department = 'Department is required';
      if (!form.woredaId) err.woredaId = 'Woreda is required';
      if (!position) err.gps = 'GPS location is required — tap the map, search for a place, or use your current location';
      else if (!isWithinAddisAbaba(position.lat, position.lng)) err.gps = 'GPS location is outside Addis Ababa';
    }
    if (form.reportDate) {
      const d = new Date(form.reportDate);
      if (isNaN(d.getTime())) err.reportDate = 'Invalid date';
      else if (d > new Date()) err.reportDate = 'Report date cannot be in the future';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // Validate only the fields on the current wizard step so the user is guided
  // through the form one section at a time instead of one long scroll.
  const validateSection = (section) => {
    const err = {};
    if (section === 'issue') {
      if (!form.title.trim()) err.title = t('report.validation.titleRequired') || 'Title is required';
      else if (form.title.length > 200) err.title = 'Title must be under 200 characters';
      if (!form.category) err.category = t('report.validation.categoryRequired') || 'Category is required';
      if (!form.description.trim()) err.description = t('report.validation.descRequired') || 'Description is required';
      else if (form.description.length > 5000) err.description = 'Description must be under 5000 characters';
      if (form.reportDate) {
        const d = new Date(form.reportDate);
        if (isNaN(d.getTime())) err.reportDate = 'Invalid date';
        else if (d > new Date()) err.reportDate = 'Report date cannot be in the future';
      }
    } else if (section === 'location') {
      if (!form.subcityId) err.subcityId = 'Subcity is required';
      if (!form.department) err.department = 'Department is required';
      if (!form.woredaId) err.woredaId = 'Woreda is required';
      if (!position) err.gps = 'GPS location is required — tap the map, search for a place, or use your current location';
      else if (!isWithinAddisAbaba(position.lat, position.lng)) err.gps = 'GPS location is outside Addis Ababa';
    }
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    const section = formStep === 1 ? 'issue' : 'location';
    if (!validateSection(section)) {
      toast.error(t('report.validation.fixErrors') || 'Please fix the errors below');
      return;
    }
    setFormStep(f => f + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error(t('report.validation.fixErrors') || 'Please fix the errors below');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      fd.append('severityLevel', form.severityLevel);
      if (step === 'infrastructure') {
        fd.append('subcityId', form.subcityId);
        fd.append('woredaId', form.woredaId);
        fd.append('department', form.department);
      }
      if (form.region) fd.append('region', form.region.trim());
      if (form.woreda) fd.append('woreda', form.woreda.trim());
      if (form.city) fd.append('city', form.city.trim());
      if (form.subcity) fd.append('subcity', form.subcity);
      if (form.specificLocation) fd.append('specificLocation', form.specificLocation.trim());
      if (form.reportDate) fd.append('reportDate', form.reportDate);
      if (position) {
        fd.append('latitude', position.lat);
        fd.append('longitude', position.lng);
        if (gpsCapturedAt) fd.append('gpsCapturedAt', gpsCapturedAt);
      }
      photos.forEach(f => fd.append('media', f));
      videos.forEach(f => fd.append('media', f));

      if (publicMode) {
        const res = await infraAPI.createGuest(fd);
        if (res.data?.report?.trackingNumber) {
          setGuestSuccess({
            trackingNumber: res.data.report.trackingNumber,
            trackingPin: res.data.report.trackingPin,
            title: form.title.trim(),
          });
        } else {
          toast.success(t('report.submitted') || 'Report submitted successfully');
          navigate(successPath);
        }
      } else {
        await infraAPI.create(fd);
        toast.success(t('report.submitted') || 'Report submitted successfully');
        navigate(successPath);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || t('report.submitFailed') || 'Submission failed');
    } finally { setSubmitting(false); }
  };

  if (guestSuccess) {
    const receiptUrl = publicAPI.getReceiptUrl(guestSuccess.trackingNumber, guestSuccess.trackingPin);
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card border-2 border-green-200 dark:border-green-800 overflow-hidden">
          <div className="p-6 sm:p-10 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CircleCheck size={40} strokeWidth={2} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t('report.guestSuccessTitle') || 'Report Submitted Successfully'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{guestSuccess.title}</p>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-6 py-4 mb-3 mx-auto max-w-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('report.trackingNumber') || 'Tracking Number'}</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 font-mono tracking-wide">{guestSuccess.trackingNumber}</p>
                <button type="button" onClick={() => copyToClipboard(guestSuccess.trackingNumber, 'number')}
                  className="text-gray-400 hover:text-amber-600 transition-colors" title="Copy tracking number">
                  {copiedField === 'number' ? <Check className="text-green-500" strokeWidth={2} /> : <Copy strokeWidth={2} />}
                </button>
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-6 py-4 mb-8 mx-auto max-w-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('report.trackingPin') || 'Tracking PIN'}</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono tracking-wide">{guestSuccess.trackingPin}</p>
                <button type="button" onClick={() => copyToClipboard(guestSuccess.trackingPin, 'pin')}
                  className="text-gray-400 hover:text-blue-600 transition-colors" title="Copy tracking PIN">
                  {copiedField === 'pin' ? <Check className="text-green-500" strokeWidth={2} /> : <Copy strokeWidth={2} />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-8">
              {t('report.guestSuccessNote') || 'Keep these credentials safe. Use them to track your report status at any time.'}
            </p>

            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to={`/track-complaint?number=${encodeURIComponent(guestSuccess.trackingNumber)}&pin=${encodeURIComponent(guestSuccess.trackingPin)}`}
                className="btn-primary py-2.5 px-6 text-sm inline-flex items-center gap-2">
                {t('report.trackNow') || 'Track Report'}
              </Link>
              <a href={receiptUrl} target="_blank" rel="noreferrer" className="btn-secondary py-2.5 px-6 text-sm">
                {t('report.downloadReceipt') || 'Download Receipt (PDF)'}
              </a>
              <Link to="/" className="btn-secondary py-2.5 px-6 text-sm">
                {t('common.home') || 'Back to Home'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'type') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h2 className="page-title">{t('report.createTitle') || 'Report an Issue'}</h2>
          <p className="page-subtitle">{t('report.selectType') || 'Choose the type of issue you want to report'}</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => setStep('infrastructure')}
            className="group border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10 hover:border-blue-400 hover:shadow-lg rounded-2xl p-6 text-left transition-all duration-200"
          >
            <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform"><Construction size={28} strokeWidth={2} /></div>
            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">{t('home.infraTitle') || 'Infrastructure'}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t('home.infraDesc') || 'Report damaged roads, bridges, water supply, electricity, schools, and more'}</p>
          </button>
          {!publicMode && (
            <button
              onClick={() => setStep('complaint')}
              className="group border-2 border-teal-200 dark:border-teal-800 bg-teal-50/50 dark:bg-teal-900/10 hover:border-teal-400 hover:shadow-lg rounded-2xl p-6 text-left transition-all duration-200"
            >
              <div className="w-14 h-14 rounded-xl bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform"><Megaphone size={28} strokeWidth={2} /></div>
              <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg mb-1">Public Complaint</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Submit a complaint about water, electricity, or road services in your area</p>
            </button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'complaint') {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => { setStep('type'); setPhotos([]); setVideos([]); setErrors({}); }}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={2} /> Back to report type
        </button>
        <PublicComplaintPage />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => { if (publicMode) { navigate('/'); } else { setStep('type'); setPhotos([]); setVideos([]); setErrors({}); } }}
          className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"><ArrowLeft size={18} strokeWidth={2} /></button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 flex items-center gap-2">
            <Construction size={20} strokeWidth={2} /> {t('home.infraTitle') || 'Infrastructure Report'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{t('report.fillRequired') || 'Fields marked with * are required'}</p>
        </div>
      </div>

      {/* Progress stepper */}
      <div className="flex items-center gap-2 mb-6">
        {SECTION_META.map((s, i) => {
          const idx = i + 1;
          const isActive = formStep === idx;
          const isDone = formStep > idx;
          return (
            <div key={s.key} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => { if (idx < formStep) setFormStep(idx); }}
                className={`flex items-center gap-2 w-full rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${isActive ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : isDone ? 'border-green-300 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500'}`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isActive ? 'bg-primary-500 text-white' : isDone ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400'}`}>
                  {isDone ? <Check size={12} strokeWidth={3} /> : s.icon}
                </span>
                <span className="truncate">{s.labelEn}</span>
              </button>
              {i < SECTION_META.length - 1 && <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-6">

            {formStep === 1 && (
            <Section icon="1" title={t('report.sectionDetails') || 'Issue Details'} subtitle={t('report.sectionDetailsSub') || 'Describe the problem you are reporting'}>

              {/* Title */}
              <FieldWrap label={t('report.titleLabel') || 'Title'} error={errors.title} required>
                <input name="title" value={form.title} onChange={handleChange} maxLength={200}
                  placeholder={t('dashboard.reportTitlePlaceholder') || 'e.g. Pothole on Bole Road'}
                  className={`input-field ${errors.title ? 'border-red-400 focus:ring-red-300' : ''}`} />
                <CharCount current={form.title.length} max={200} />
              </FieldWrap>

              {/* Category */}
              <FieldWrap label={t('report.categoryLabel') || 'Category'} error={errors.category} required>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map(c => (
                    <button key={c.v} type="button" onClick={() => { set('category', c.v); set('department', CATEGORY_DEPARTMENT_MAP[c.v]); }}
                      className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-center transition-all duration-150
                        ${form.category === c.v
                          ? `${c.color} ring-2 ring-offset-1 ${c.ring}`
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                        }`}>
                      <c.icon className="w-6 h-6" />
                      <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">{c.label}</span>
                    </button>
                  ))}
                </div>
              </FieldWrap>

              {/* Severity */}
              <FieldWrap label={t('report.severityLabel') || 'Severity'} error={errors.severityLevel}>
                <div className="flex gap-2">
                  {SEVERITY.map(s => (
                    <button key={s.v} type="button" onClick={() => set('severityLevel', s.v)}
                      className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150
                        ${form.severityLevel === s.v
                          ? `${s.color} ring-2 ring-offset-1 ${s.ring}`
                          : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                        }`}>
                      {s.v}
                    </button>
                  ))}
                </div>
              </FieldWrap>

              {/* Description */}
              <FieldWrap label={t('report.descLabel') || 'Description'} error={errors.description} required>
                <textarea name="description" value={form.description} onChange={handleChange} rows={4} maxLength={5000}
                  placeholder={t('report.descPlaceholder') || 'Provide details about the issue: what, where, when, how severe, who is affected...'}
                  className={`input-field resize-none ${errors.description ? 'border-red-400 focus:ring-red-300' : ''}`} />
                <CharCount current={form.description.length} max={5000} />
              </FieldWrap>

              {/* Report Date */}
              <FieldWrap label={t('report.reportDate') || 'Report Date'} error={errors.reportDate}>
                <input type="date" name="reportDate" value={form.reportDate} onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`input-field ${errors.reportDate ? 'border-red-400 focus:ring-red-300' : ''}`} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{t('report.reportDateHint') || 'When did you first notice this issue?'}</p>
              </FieldWrap>
            </Section>
            )}

            {formStep === 2 && (
              <Section icon="2" title={t('report.sectionLocation') || 'Report Happened Location'} subtitle={t('report.sectionLocationSub') || 'Where did the issue happen?'}>

              <FieldWrap label="Subcity" error={errors.subcityId} required>
                <select name="subcityId" value={form.subcityId} onChange={(e) => handleSubcityChange(e.target.value)}
                  className={`input-field ${errors.subcityId ? 'border-red-400 focus:ring-red-300' : ''}`}>
                  <option value="">{loadingSubcities ? 'Loading subcities...' : 'Select Subcity'}</option>
                  {subcities.map(s => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Select the subcity where the issue is located</p>
              </FieldWrap>

              <FieldWrap label="Woreda" error={errors.woredaId} required>
                <select name="woredaId" value={form.woredaId} onChange={handleChange}
                  disabled={!form.subcityId}
                  className={`input-field ${errors.woredaId ? 'border-red-400 focus:ring-red-300' : ''} ${!form.subcityId ? 'opacity-60 cursor-not-allowed' : ''}`}>
                  <option value="">
                    {loadingWoredas
                      ? 'Loading woredas...'
                      : form.subcityId
                        ? (woredas.length ? 'Select Woreda' : 'No woredas found')
                        : 'Select Subcity first'}
                  </option>
                  {woredas.map(w => (
                    <option key={w._id} value={w._id}>{w.woredaName || w.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Your report is routed to the selected woreda</p>
              </FieldWrap>

              <FieldWrap label="Department" error={errors.department} required>
                <select name="department" value={form.department} onChange={(e) => handleDepartmentChange(e.target.value)}
                  className={`input-field ${errors.department ? 'border-red-400 focus:ring-red-300' : ''}`}>
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Infrastructure reports are routed to the selected woreda department</p>
              </FieldWrap>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="City / Town" name="city" value={form.city} onChange={handleChange}
                  placeholder={t('dashboard.cityOrTown') || 'City or town'} />
              </div>

              {/* GPS Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin size={16} strokeWidth={2} className="inline-block mr-1 align-[-2px]" /> GPS Location
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <AddisAbabaGpsPicker
                  position={position}
                  onLocationSelect={handleLocationSelect}
                  onClear={handleClearGps}
                  error={errors.gps}
                />
                {gpsCapturedAt && (
                  <p className="text-[10px] text-green-600/70 dark:text-green-400/70 mt-1">
                    Captured at {new Date(gpsCapturedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </Section>
            )}

            {formStep === 3 && (
              <Section icon="3" title={t('report.sectionMedia') || 'Photo & Video Evidence'} subtitle={t('report.sectionMediaSub') || 'Upload evidence to support your report (optional)'}>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Camera size={16} strokeWidth={2} className="inline-block mr-1 align-[-2px]" /> {t('report.photosLabel') || 'Photos'}
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(max 5, 10MB each)</span>
                  </label>
                  <div
                    onClick={() => photoRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
                  >
                    <input ref={photoRef} type="file" accept="image/*" multiple onChange={handlePhotoChange} className="hidden" />
                    <Camera size={32} strokeWidth={2} className="mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to upload photos</p>
                  </div>
                  {photos.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {photos.map((f, i) => (
                        <div key={i} className="relative group">
                          <img src={URL.createObjectURL(f)} alt="" className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-600" />
                          <button type="button" onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center shadow"><X size={12} strokeWidth={2} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Videos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    <Video size={16} strokeWidth={2} className="inline-block mr-1 align-[-2px]" /> {t('report.videoLabel') || 'Videos'}
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(max 2, 50MB each)</span>
                  </label>
                  <div
                    onClick={() => videoRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
                  >
                    <input ref={videoRef} type="file" accept="video/mp4,video/mov,video/webm" multiple onChange={handleVideoChange} className="hidden" />
                    <Video size={32} strokeWidth={2} className="mx-auto mb-1" />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Click to upload videos</p>
                  </div>
                  {videos.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {videos.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 text-xs group">
                          <Video size={16} strokeWidth={2} className="text-gray-400 shrink-0" />
                          <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{f.name}</span>
                          <span className="text-gray-400">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                          <button type="button" onClick={() => setVideos(p => p.filter((_, j) => j !== i))}
                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16} strokeWidth={2} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Section>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 pb-8">
              {formStep > 1 ? (
                <button type="button" onClick={() => { setFormStep(f => f - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="btn-secondary flex-1 py-3 text-sm">Back</button>
              ) : (
                <button type="button" onClick={() => { if (publicMode) { navigate('/'); } else { setStep('type'); } }} className="btn-secondary flex-1 py-3 text-sm">{t('common.cancel') || 'Cancel'}</button>
              )}
              {formStep < 3 ? (
                <button type="button" onClick={handleNext} className="btn-primary flex-1 py-3 text-sm inline-flex items-center justify-center gap-1.5">
                  Next <ChevronRight size={16} strokeWidth={2} />
                </button>
              ) : (
                <button type="submit" disabled={submitting} className="btn-primary flex-1 py-3 text-sm">
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {t('common.submitting') || 'Submitting...'}
                    </span>
                  ) : t('common.submit') || 'Submit Report'}
                </button>
              )}
            </div>
          </div>
      </form>
    </div>
  );
}

function Section({ icon, title, subtitle, children }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
          <span className="text-sm font-bold text-primary-700 dark:text-primary-300">{icon}</span>
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function FieldWrap({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 dark:text-red-400 mt-1 flex items-center gap-1"><TriangleAlert size={14} strokeWidth={2} className="shrink-0" /> {error}</p>}
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <input type={type} name={name} value={value} onChange={onChange} placeholder={placeholder} className="input-field" />
    </div>
  );
}

function CharCount({ current, max }) {
  const pct = (current / max) * 100;
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex-1 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${pct > 90 ? 'bg-red-400' : pct > 70 ? 'bg-yellow-400' : 'bg-primary-400'}`}
          style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-[10px] font-medium ${pct > 90 ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
        {current}/{max}
      </span>
    </div>
  );
}
