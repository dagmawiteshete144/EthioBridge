import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Building, MapPin, Paperclip, Tag, CircleCheck, Loader, Info, X,
  ArrowLeft, ChevronLeft, ChevronRight, TriangleAlert, Image, Video,
  Copy, Check, FilePlay, Route, Construction, Zap, Droplets,
} from 'lucide-react';
import { infraAPI, locationAPI, publicAPI } from '../../services/api';
import AddisAbabaGpsPicker from '../../components/map/AddisAbabaGpsPicker';
import { isWithinAddisAbaba } from '../../components/map/EthioMap';
import { toast } from 'react-toastify';

// ── Complaint category and issue options ──
const CATEGORIES = [
  { v: 'road_issue',         label: 'Road Issue',         icon: Construction, color: 'border-orange-200 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800', ring: 'ring-orange-400' },
  { v: 'electricity_issue',  label: 'Electricity Issue',  icon: Zap, color: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800', ring: 'ring-yellow-400' },
  { v: 'water_supply_issue', label: 'Water Supply Issue', icon: Droplets, color: 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800', ring: 'ring-blue-400' },
];

// Selecting a category pre-fills the routing department used by Woreda dashboards
const CATEGORY_DEPARTMENT_MAP = {
  'road_issue':         'Transport',
  'electricity_issue':  'Electricity',
  'water_supply_issue': 'Water',
};

// The department dropdown is limited to these three city departments.
const DEPARTMENTS = ['Water', 'Transport', 'Electricity'];

const SEVERITY = [
  { v: 'Low',    color: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300', ring: 'ring-green-400', desc: 'Minor issue, not urgent' },
  { v: 'Medium', color: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300', ring: 'ring-yellow-400', desc: 'Moderate impact on daily life' },
  { v: 'High',   color: 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:border-orange-700 dark:text-orange-300', ring: 'ring-orange-400', desc: 'Significant disruption' },
];

const STEPS = [
  { n: 1, title: 'Category & Issue' },
  { n: 2, title: 'Location' },
  { n: 3, title: 'Evidence' },
  { n: 4, title: 'Description' },
  { n: 5, title: 'Review & Submit' },
];

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEOS = 2;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MIN_DESCRIPTION_LENGTH = 20;

// ── Draft persistence (survives an accidental page refresh) ──
const DRAFT_KEY = 'ethiobridge_infra_report_draft_v1';

const DEFAULT_FORM = {
  category: '',
  severityLevel: 'Medium',
  subcityId: '',
  woredaId: '',
  department: '',
  title: '',
  description: '',
  reportDate: '',
};

const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const clearDraftStorage = () => {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
};

export default function InfrastructureReportWizard() {
  const [draft] = useState(readDraft);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [position, setPosition] = useState(() => draft?.position || null);
  const [gpsCapturedAt, setGpsCapturedAt] = useState(() => draft?.gpsCapturedAt || null);
  const [form, setForm] = useState(() => draft?.form || DEFAULT_FORM);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [guestSuccess, setGuestSuccess] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  const photoRef = useRef(null);
  const videoRef = useRef(null);
  const saveSeqRef = useRef(0);

  const [subcities, setSubcities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingSubcities, setLoadingSubcities] = useState(true);
  const [loadingWoredas, setLoadingWoredas] = useState(false);

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  // Load subcities, woredas and departments live from MongoDB so the report is
  // always routed to a real record.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSubcities(true);
      try {
        const [subRes, deptRes] = await Promise.all([
          locationAPI.getSubcities(),
          locationAPI.getDepartments(),
        ]);
        if (cancelled) return;
        setSubcities(subRes.data?.subcities || []);
        setDepartments(deptRes.data?.departments || []);
      } catch (err) {
        if (!cancelled) toast.error('Failed to load subcity, woreda, or department data');
      } finally {
        if (!cancelled) setLoadingSubcities(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSubcityChange = async (subcityId) => {
    set('subcityId', subcityId);
    set('woredaId', '');
    setWoredas([]);
    if (!subcityId) {
      setLoadingWoredas(false);
      return;
    }
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

  // ── Draft persistence ──
  const saveDraft = useCallback((snapshot) => {
    const seq = ++saveSeqRef.current;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        form: snapshot.form,
        position: snapshot.position,
        gpsCapturedAt: snapshot.gpsCapturedAt,
      }));
    } catch {
      // Storage quota exceeded — give up silently.
    }
    if (seq !== saveSeqRef.current) return; // a newer save superseded this one
  }, []);

  useEffect(() => {
    saveDraft({ form, position, gpsCapturedAt });
  }, [form, position, gpsCapturedAt, saveDraft]);

  const cancelDraft = useCallback(() => {
    saveSeqRef.current += 1; // invalidate any in-flight save
    clearDraftStorage();
  }, []);

  const handleLocationSelect = ({ lat, lng, capturedAt }) => {
    setPosition({ lat, lng });
    if (capturedAt) setGpsCapturedAt(capturedAt);
    if (errors.gps) setErrors(p => { const n = { ...p }; delete n.gps; return n; });
  };

  const handleClearGps = () => {
    setPosition(null);
    setGpsCapturedAt(null);
  };

  // ── Evidence handlers ──
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const oversized = files.find(f => f.size > MAX_IMAGE_SIZE);
    if (oversized) { setErrors(p => ({ ...p, photos: `${oversized.name} exceeds the 10MB limit` })); return; }
    const combined = [...photos, ...files];
    if (combined.length > MAX_IMAGES) {
      setErrors(p => ({ ...p, photos: `You can upload a maximum of ${MAX_IMAGES} photos.` }));
      return;
    }
    setPhotos(combined);
    if (errors.photos) setErrors(p => { const n = { ...p }; delete n.photos; return n; });
  };

  const handleVideoChange = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    const oversized = files.find(f => f.size > MAX_VIDEO_SIZE);
    if (oversized) { setErrors(p => ({ ...p, videos: `${oversized.name} exceeds the 50MB limit` })); return; }
    const combined = [...videos, ...files];
    if (combined.length > MAX_VIDEOS) {
      setErrors(p => ({ ...p, videos: `You can upload a maximum of ${MAX_VIDEOS} videos.` }));
      return;
    }
    setVideos(combined);
    if (errors.videos) setErrors(p => { const n = { ...p }; delete n.videos; return n; });
  };

  // ── Validation ──
  const validateStep = (s, err = {}) => {
    if (s === 1) {
      if (!form.category) err.category = 'Please select a complaint category';
    }

    if (s === 2) {
      if (!form.subcityId) err.subcityId = 'Please select a subcity';
      if (!form.woredaId) err.woredaId = 'Please select a woreda';
      if (!form.department) err.department = 'Please select a department';
      if (!position) {
        err.gps = 'GPS location is required — search for a place, tap the map, or use your current location.';
      } else if (!isWithinAddisAbaba(position.lat, position.lng)) {
        err.gps = 'GPS location is outside Addis Ababa. Please select a location inside Addis Ababa.';
      }
    }

    if (s === 4) {
      if (!form.title.trim()) err.title = 'Report title is required';
      else if (form.title.trim().length > 200) err.title = 'Title must be under 200 characters';
      if (!form.description.trim()) err.description = 'Description is required';
      else if (form.description.trim().length < MIN_DESCRIPTION_LENGTH) {
        err.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
      } else if (form.description.trim().length > 5000) err.description = 'Description must be under 5000 characters';
      if (form.reportDate) {
        const d = new Date(form.reportDate);
        if (isNaN(d.getTime())) err.reportDate = 'Invalid date';
        else if (d > new Date()) err.reportDate = 'Report date cannot be in the future';
      }
    }

    return err;
  };

  const STEP_FIELDS = {
    1: ['category'],
    2: ['subcityId', 'woredaId', 'department', 'gps'],
    4: ['title', 'description', 'reportDate'],
  };

  const validateAllSteps = () => {
    const err = {};
    let firstInvalidStep = null;
    for (const s of [1, 2, 4]) {
      validateStep(s, err);
      if (firstInvalidStep === null && STEP_FIELDS[s].some(k => err[k])) firstInvalidStep = s;
    }
    return { errors: err, firstInvalidStep };
  };

  const handleNext = () => {
    const err = {};
    validateStep(step, err);
    setErrors(err);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (Object.keys(err).length === 0) setStep(s => Math.min(s + 1, STEPS.length));
  };

  const handlePrevious = () => {
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { errors: allErrors, firstInvalidStep } = validateAllSteps();
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) {
      toast.error('Please fix the errors below');
      if (firstInvalidStep) setStep(firstInvalidStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      fd.append('severityLevel', form.severityLevel);
      fd.append('subcityId', form.subcityId);
      fd.append('woredaId', form.woredaId);
      fd.append('department', form.department);
      if (form.reportDate) fd.append('reportDate', form.reportDate);
      if (position) {
        fd.append('latitude', position.lat);
        fd.append('longitude', position.lng);
        if (gpsCapturedAt) fd.append('gpsCapturedAt', gpsCapturedAt);
      }
      photos.forEach(f => fd.append('media', f));
      videos.forEach(f => fd.append('media', f));

      const res = await infraAPI.createGuest(fd);
      if (res.data?.report?.trackingNumber) {
        cancelDraft();
        setGuestSuccess({
          trackingNumber: res.data.report.trackingNumber,
          trackingPin: res.data.report.trackingPin,
          reportId: res.data.report.reportId,
          title: form.title.trim(),
        });
      } else {
        cancelDraft();
        toast.success('Report submitted successfully');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.';
      setErrors({ submit: msg });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen (guest tracking number + PIN) ──
  if (guestSuccess) {
    const receiptUrl = publicAPI.getReceiptUrl(guestSuccess.trackingNumber, guestSuccess.trackingPin);
    const copyToClipboard = async (text, field) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success(field === 'number' ? 'Tracking Number copied' : 'Tracking PIN copied');
        setTimeout(() => setCopiedField(''), 2000);
      } catch {
        toast.error('Could not copy to clipboard');
      }
    };

    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="card text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CircleCheck className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Report Submitted Successfully</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{guestSuccess.title}</p>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-6 py-4 mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Tracking Number</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 font-mono">{guestSuccess.trackingNumber}</p>
              <button
                type="button"
                onClick={() => copyToClipboard(guestSuccess.trackingNumber, 'number')}
                title="Copy Tracking Number"
                className="p-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                {copiedField === 'number' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {guestSuccess.trackingPin && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-6 py-4 mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Tracking PIN</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono tracking-widest">{guestSuccess.trackingPin}</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(guestSuccess.trackingPin, 'pin')}
                  title="Copy Tracking PIN"
                  className="p-2 rounded-lg border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  {copiedField === 'pin' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Keep this PIN secret — you need it (with the Tracking Number) to track this report.
              </p>
            </div>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Save these details to check the status of your report. It is routed to the selected Woreda first
            and escalated to the Subcity if needed.
          </p>

          <div className="flex flex-wrap justify-center gap-3">
            <a
              href={`/track-report?number=${encodeURIComponent(guestSuccess.trackingNumber)}&pin=${encodeURIComponent(guestSuccess.trackingPin)}`}
              className="btn-primary py-2.5 px-6 inline-flex items-center gap-2"
            >
              <CircleCheck className="w-4 h-4" />
              Track Report
            </a>
            {receiptUrl && (
              <a href={receiptUrl} target="_blank" rel="noreferrer" className="btn-secondary py-2.5 px-6">
                Download Receipt (PDF)
              </a>
            )}
            <Link to="/" className="btn-secondary py-2.5 px-6">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5 pb-14 sm:pb-16">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 text-white px-4 py-3 sm:px-5 sm:py-3.5 mb-3">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-16 -right-16 w-40 h-40 bg-white rounded-full" />
          <div className="absolute -bottom-20 -left-10 w-32 h-32 bg-white rounded-full" />
        </div>
        <div className="relative z-10 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold">Infrastructure Report</h1>
            <p className="text-primary-100 text-xs sm:text-sm max-w-xl mt-0.5">
              Report damaged roads, electricity, water supply, and other infrastructure issues in your area.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs shrink-0">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-2.5 py-1">
              <Route className="w-3.5 h-3.5" /> 3 Categories
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-2.5 py-1">
              <MapPin className="w-3.5 h-3.5" /> GPS Location
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-2.5 py-1">
              <Paperclip className="w-3.5 h-3.5" /> Photo & Video
            </span>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {errors.submit && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300 animate-fade-in">
          <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Submission failed</p>
            <p className="mt-0.5">{errors.submit}</p>
            <p className="mt-1 text-xs text-red-500 dark:text-red-400">Please try again.</p>
          </div>
          <button type="button" onClick={() => setErrors(p => { const n = { ...p }; delete n.submit; return n; })} className="ml-auto text-red-400 hover:text-red-600" aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card p-4 sm:p-5">

          {/* ── Progress indicator ── */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
                Step {step} of {STEPS.length}
              </p>
              <p className="text-xs font-bold text-primary-600 dark:text-primary-400">{STEPS[step - 1].title}</p>
            </div>
            <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-600 rounded-full transition-all duration-300"
                style={{ width: `${(step / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* ── Step indicator ── */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3">
            {STEPS.map(s => (
              <button
                key={s.n}
                type="button"
                onClick={step > s.n ? () => { setStep(s.n); window.scrollTo({ top: 0, behavior: 'smooth' }); } : undefined}
                aria-current={step === s.n ? 'step' : undefined}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200
                  ${step === s.n
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 shadow-sm'
                    : step > s.n
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 cursor-pointer'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                  ${step === s.n ? 'bg-primary-600 text-white' : step > s.n ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500'}`}>
                  {step > s.n ? '✓' : s.n}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>

          {/* ── Step 1: Category & Issue ── */}
          {step === 1 && (
            <section className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2.5">
                <Building className="text-primary-600 dark:text-primary-400" />
                Category & Issue
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Select the category that best describes the infrastructure problem you want to report.
              </p>

              <FormField label="Complaint Category" error={errors.category} required>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(c => (
                    <button
                      key={c.v}
                      type="button"
                      onClick={() => { set('category', c.v); set('department', CATEGORY_DEPARTMENT_MAP[c.v]); }}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 text-center transition-all duration-150
                        ${form.category === c.v
                          ? `${c.color} ring-2 ring-offset-1 ${c.ring}`
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                        }`}
                    >
                      <c.icon className="w-6 h-6" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{c.label}</span>
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Severity" error={errors.severityLevel}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SEVERITY.map(s => (
                    <button
                      key={s.v}
                      type="button"
                      onClick={() => set('severityLevel', s.v)}
                      className={`cursor-pointer py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 text-center
                        ${form.severityLevel === s.v
                          ? `${s.color} ring-2 ring-offset-1 ${s.ring}`
                          : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                        }`}
                    >
                      {s.v}
                      <span className="block text-[10px] font-normal opacity-70 mt-0.5">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </FormField>
            </section>
          )}

          {/* ── Step 2: Location ── */}
          {step === 2 && (
            <section className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2.5">
                <MapPin className="text-primary-600 dark:text-primary-400" />
                Location & Infrastructure Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Subcity" error={errors.subcityId} required>
                  {loadingSubcities ? (
                    <div className="input-field flex items-center gap-2 text-gray-400">
                      <Loader className="w-4 h-4 animate-spin" /> Loading subcities...
                    </div>
                  ) : (
                    <select
                      name="subcityId"
                      value={form.subcityId}
                      onChange={e => handleSubcityChange(e.target.value)}
                      className={`input-field ${errors.subcityId ? 'border-red-400 focus:ring-red-300' : ''}`}
                    >
                      <option value="">Select Subcity</option>
                      {subcities.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                    </select>
                  )}
                </FormField>

                <FormField label="Woreda" error={errors.woredaId} required>
                  {loadingWoredas ? (
                    <div className="input-field flex items-center gap-2 text-gray-400">
                      <Loader className="w-4 h-4 animate-spin" /> Loading woredas...
                    </div>
                  ) : (
                    <select
                      name="woredaId"
                      value={form.woredaId}
                      onChange={e => set('woredaId', e.target.value)}
                      disabled={!form.subcityId}
                      className={`input-field ${errors.woredaId ? 'border-red-400 focus:ring-red-300' : ''} ${!form.subcityId ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <option value="">{form.subcityId ? 'Select Woreda' : 'Select a subcity first'}</option>
                      {woredas.map(w => <option key={w._id} value={w._id}>{w.woredaName || w.name}</option>)}
                    </select>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your report is routed to this Woreda first.</p>
                </FormField>

                <FormField label="Department" error={errors.department} required>
                  <select
                    name="department"
                    value={form.department}
                    onChange={e => set('department', e.target.value)}
                    className={`input-field ${errors.department ? 'border-red-400 focus:ring-red-300' : ''}`}
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Pre-filled from your category — you can change it.</p>
                </FormField>
              </div>

              {/* GPS Map — locked to Addis Ababa */}
              <div className="mt-4">
                <FormField label="GPS Location" error={errors.gps} required>
                  <AddisAbabaGpsPicker
                    position={position}
                    onLocationSelect={handleLocationSelect}
                    onClear={handleClearGps}
                  />
                </FormField>
                {gpsCapturedAt && (
                  <p className="text-[10px] text-green-600/70 dark:text-green-400/70 mt-0.5">
                    Captured at {new Date(gpsCapturedAt).toLocaleTimeString()}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ── Step 3: Evidence ── */}
          {step === 3 && (
            <section className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2.5">
                <Paperclip className="text-primary-600 dark:text-primary-400" />
                Upload Evidence
                <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">(optional)</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Upload photos or videos supporting your report. They help the responsible office assess the issue faster.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Photos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Upload Photos
                    <span className="text-gray-400 dark:text-gray-500 font-normal text-xs ml-1">(up to {MAX_IMAGES}, 10MB each)</span>
                  </label>
                  <div
                    onClick={() => photoRef.current?.click()}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') photoRef.current?.click(); }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload photos"
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
                  >
                    <input
                      ref={photoRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <Image className="w-7 h-7 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload photos</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Max {MAX_IMAGES} photos, up to 10MB each</p>
                  </div>
                  {errors.photos && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                      <TriangleAlert className="w-3 h-3 shrink-0" /> {errors.photos}
                    </p>
                  )}
                  {photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {photos.map((f, i) => (
                        <div key={`${f.name}-${i}`} className="relative group">
                          <img src={URL.createObjectURL(f)} alt="" className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-600" />
                          <button
                            type="button"
                            onClick={() => setPhotos(p => p.filter((_, j) => j !== i))}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs hidden group-hover:flex items-center justify-center shadow"
                            aria-label="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Videos */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Upload Videos
                    <span className="text-gray-400 dark:text-gray-500 font-normal text-xs ml-1">(up to {MAX_VIDEOS}, 50MB each)</span>
                  </label>
                  <div
                    onClick={() => videoRef.current?.click()}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') videoRef.current?.click(); }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload videos"
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
                  >
                    <input
                      ref={videoRef}
                      type="file"
                      accept="video/mp4,video/mov,video/webm"
                      multiple
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                    <Video className="w-7 h-7 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload videos</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Max {MAX_VIDEOS} videos, up to 50MB each</p>
                  </div>
                  {errors.videos && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                      <TriangleAlert className="w-3 h-3 shrink-0" /> {errors.videos}
                    </p>
                  )}
                  {videos.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {videos.map((f, i) => (
                        <div key={`${f.name}-${i}`} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2.5 text-xs group">
                          <FilePlay className="w-6 h-6 text-purple-500 shrink-0" />
                          <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{f.name}</span>
                          <span className="text-gray-400">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                          <button
                            type="button"
                            onClick={() => setVideos(p => p.filter((_, j) => j !== i))}
                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Remove video"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── Step 4: Description ── */}
          {step === 4 && (
            <section className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2.5">
                <Tag className="text-primary-600 dark:text-primary-400" />
                Description & Additional Information
              </h2>

              <div className="space-y-4">
                <FormField label="Report Title" error={errors.title} required>
                  <input
                    type="text"
                    name="title"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    maxLength={200}
                    placeholder="e.g. Pothole on Bole Road"
                    className={`input-field ${errors.title ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                </FormField>

                <FormField label="Description" error={errors.description} required>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={5}
                    maxLength={5000}
                    placeholder="Describe the issue in detail: what happened, when you noticed it, who is affected, and any steps already taken..."
                    className={`input-field resize-none ${errors.description ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  <p className={`text-[11px] mt-1 flex justify-between ${form.description.trim().length >= MIN_DESCRIPTION_LENGTH ? 'text-gray-400 dark:text-gray-500' : 'text-primary-600 dark:text-primary-400'}`}>
                    <span>{form.description.trim().length < MIN_DESCRIPTION_LENGTH ? `At least ${MIN_DESCRIPTION_LENGTH} characters` : 'Good detail'}</span>
                    <span>{form.description.length}/5000</span>
                  </p>
                </FormField>

                <FormField label="Report Date" error={errors.reportDate}>
                  <input
                    type="date"
                    name="reportDate"
                    value={form.reportDate}
                    onChange={e => set('reportDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={`input-field ${errors.reportDate ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">When did you first notice this issue?</p>
                </FormField>
              </div>
            </section>
          )}

          {/* ── Step 5: Review & Submit ── */}
          {step === 5 && (
            <section className="animate-fade-in space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CircleCheck className="text-primary-600 dark:text-primary-400" />
                Review & Submit
              </h2>

              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <SummaryItem label="Category" value={CATEGORIES.find(c => c.v === form.category)?.label || form.category || '—'} />
                <SummaryItem label="Severity" value={form.severityLevel || '—'} />
                <SummaryItem label="Subcity" value={subcities.find(s => s._id === form.subcityId)?.name || '—'} />
                <SummaryItem label="Woreda" value={woredas.find(w => w._id === form.woredaId)?.woredaName || woredas.find(w => w._id === form.woredaId)?.name || '—'} />
                <SummaryItem label="Department" value={form.department || '—'} />
                <SummaryItem label="GPS Location" value={position ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : '—'} />
                <SummaryItem label="Evidence" value={`${photos.length} photo${photos.length === 1 ? '' : 's'}${videos.length ? ` + ${videos.length} video${videos.length === 1 ? '' : 's'}` : ''}`} />
                <SummaryItem label="Report Date" value={form.reportDate || '—'} />
                <div className="sm:col-span-2">
                  <SummaryItem label="Title" value={form.title.trim() || '—'} />
                </div>
                <div className="sm:col-span-2">
                  <SummaryItem label="Description" value={form.description.trim() ? `${form.description.trim().slice(0, 220)}${form.description.trim().length > 220 ? '…' : ''}` : '—'} />
                </div>
              </div>

              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 text-sm text-primary-700 dark:text-primary-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Your report is routed to the selected <strong>Woreda</strong> first. If it cannot be resolved there, it is
                  automatically escalated to the correct <strong>Subcity</strong> for further action.
                </span>
              </div>
            </section>
          )}

          {/* ── Footer navigation ── */}
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                to="/"
                className="btn-secondary py-2 px-5 text-sm inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </Link>

              <div className="flex gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="btn-secondary py-2 px-5 text-sm inline-flex items-center gap-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Previous
                  </button>
                )}
                {step < STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-primary py-2 px-6 text-sm inline-flex items-center gap-2"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary py-2 px-6 text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-4 h-4 animate-spin" />
                        Submitting...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Paperclip className="w-4 h-4" />
                        Submit Report
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center justify-center gap-1.5">
              <Info className="w-3 h-3" /> Your progress is saved automatically in this browser until you submit or leave.
            </p>
          </div>
        </div>
      </form>

      <div className="mt-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-3 text-xs text-primary-700 dark:text-primary-300">
        <strong>Note:</strong> Reports are reviewed by the responsible woreda and escalated to the subcity when needed. You will
        receive updates on the status of your report through your tracking number.
      </div>
    </div>
  );
}

/* ─────────────────── Shared Components ─────────────────── */

function FormField({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-xs text-red-500 dark:text-red-400 mt-1.5 flex items-center gap-1">
          <TriangleAlert className="w-3 h-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
      <p className="text-gray-800 dark:text-gray-100 font-medium break-words">{value}</p>
    </div>
  );
}
