import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  UserRound, MapPin, Building2,
  Tag, TriangleAlert, Paperclip, FileImage,
  FileVideo, CircleCheck, LoaderCircle, Info, X,
  Shield, Image, Video, ArrowLeft,
  ChevronLeft, ChevronRight, Copy, Check,
} from 'lucide-react';
import { complaintReportAPI, locationAPI, publicAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import AddisAbabaGpsPicker from '../../components/map/AddisAbabaGpsPicker';
import { isWithinAddisAbaba } from '../../components/map/EthioMap';

// Specified dropdown options — only these appear on the Public Complaint
// Management form. Subcities and woredas are loaded live from MongoDB so a
// complaint is always routed to a real record (never an auto-created orphan).
const DEPARTMENTS = ['Ethics and Anti-Corruption', 'Peace and Security'];

const RISK_LEVELS = [
  { value: 'Low',    dot: 'bg-green-500',  ring: 'ring-green-400',   badge: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300' },
  { value: 'Medium', dot: 'bg-yellow-400', ring: 'ring-yellow-400',  badge: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300' },
  { value: 'High',   dot: 'bg-red-500',    ring: 'ring-red-400',     badge: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300' },
];

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MIN_DESCRIPTION_LENGTH = 20;

const PHONE_REGEX = /^(\+251|0)9\d{8}$/;

const getFileExt = (name = '') => name.split('.').pop()?.toLowerCase() || '';

// ── Multi-step layout ──
const STEPS = [
  { n: 1, title: 'Department' },
  { n: 2, title: 'Location' },
  { n: 3, title: 'Complaint Details' },
  { n: 4, title: 'Evidence' },
  { n: 5, title: 'Review & Submit' },
];

// ── Draft persistence (survives an accidental page refresh) ──
// Text fields, the GPS position and small attachments are saved to localStorage
// on every change and restored on mount. The draft is cleared once the complaint
// is submitted or cancelled. Files larger than the caps below are kept in memory
// for the current session but cannot be recovered after a hard refresh.
const DRAFT_KEY = 'ethiobridge_public_complaint_draft_v1';
const MAX_PERSIST_FILE_SIZE = 3 * 1024 * 1024;
const MAX_PERSIST_TOTAL_SIZE = 4 * 1024 * 1024;

// Cache converted files (File object → { name, type, size, dataUrl }) so the
// draft is not re-encoded on every keystroke. WeakMap releases entries when the
// File object is garbage collected.
const fileDataCache = new WeakMap();

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result });
  reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
  reader.readAsDataURL(file);
});

const fileFromDataUrl = (stored) => {
  if (!stored || typeof stored.dataUrl !== 'string' || !stored.name) return null;
  try {
    const [meta, base64] = stored.dataUrl.split(',');
    const mime = stored.type || (meta && /data:([^;]+)/.exec(meta)?.[1]) || 'application/octet-stream';
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
    const file = new File([bytes], stored.name, { type: mime });
    fileDataCache.set(file, stored);
    return file;
  } catch {
    return null;
  }
};

const readDraft = () => {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const clearDraftStorage = () => {
  try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
};

const DEFAULT_FORM = {
  department: '',
  subcityId: '',
  woredaId: '',
  subcity: '',
  woreda: '',
  title: '',
  description: '',
  riskLevel: 'Medium',
  fullName: '',
  phone: '',
  email: '',
};

// Location lookups are loaded live from MongoDB (GET /api/subcities and
// GET /api/woredas/:subcityId) so the complaint is always routed to a real
// Subcity and Woreda record — never a hardcoded name.

export default function PublicComplaintPage() {
  const { user } = useAuth();

  // Restore any saved draft synchronously during the first render so an
  // accidental page refresh keeps every field the citizen already entered.
  const [draft] = useState(readDraft);

  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingPin, setTrackingPin] = useState('');
  const [copiedField, setCopiedField] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [subcities, setSubcities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [loadingSubcities, setLoadingSubcities] = useState(true);
  const [loadingWoredas, setLoadingWoredas] = useState(false);
  const [subcitiesError, setSubcitiesError] = useState('');
  const [woredasError, setWoredasError] = useState('');

  const [form, setForm] = useState(() => draft?.form || DEFAULT_FORM);
  const [images, setImages] = useState(() =>
    Array.isArray(draft?.images) ? draft.images.map(fileFromDataUrl).filter(Boolean) : []
  );
  const [video, setVideo] = useState(() => (draft?.video ? fileFromDataUrl(draft.video) : null));
  const [position, setPosition] = useState(() => draft?.position || null);
  const [gpsCapturedAt, setGpsCapturedAt] = useState(() => draft?.gpsCapturedAt || null);

  const imageRef = useRef(null);
  const videoRef = useRef(null);
  const saveSeqRef = useRef(0);

  // Anonymous is derived from the evidence: as soon as a photo or video is
  // uploaded, the complaint is submitted anonymously and personal information
  // is neither shown nor required. Otherwise personal information is required.
  const hasEvidence = images.length > 0 || video !== null;
  const isAnonymous = hasEvidence;

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  const handleLocationSelect = ({ lat, lng, capturedAt }) => {
    setPosition({ lat, lng });
    if (capturedAt) setGpsCapturedAt(capturedAt);
    if (errors.gps) setErrors(p => { const n = { ...p }; delete n.gps; return n; });
  };

  const handleClearGps = () => {
    setPosition(null);
    setGpsCapturedAt(null);
  };

  // ── Draft persistence ──
  const saveDraft = useCallback(async (snapshot) => {
    const seq = ++saveSeqRef.current;

    const draftPayload = {
      form: snapshot.form,
      position: snapshot.position,
      gpsCapturedAt: snapshot.gpsCapturedAt,
      images: [],
      video: null,
    };

    let totalBytes = 0;
    for (const file of snapshot.images || []) {
      if (file.size > MAX_PERSIST_FILE_SIZE || totalBytes + file.size > MAX_PERSIST_TOTAL_SIZE) continue;
      try {
        const cached = fileDataCache.get(file);
        const data = cached || await fileToDataUrl(file);
        if (!cached) fileDataCache.set(file, data);
        draftPayload.images.push(data);
        totalBytes += data.size || file.size;
      } catch {
        // A single unreadable file must never block the rest of the draft.
      }
    }

    if (snapshot.video && snapshot.video.size <= MAX_PERSIST_FILE_SIZE && totalBytes + snapshot.video.size <= MAX_PERSIST_TOTAL_SIZE) {
      try {
        const cached = fileDataCache.get(snapshot.video);
        const data = cached || await fileToDataUrl(snapshot.video);
        if (!cached) fileDataCache.set(snapshot.video, data);
        draftPayload.video = data;
      } catch {
        // ignore video persistence errors
      }
    }

    if (seq !== saveSeqRef.current) return; // a newer save superseded this one

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftPayload));
    } catch {
      // Storage quota exceeded — persist text fields + GPS only.
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          form: draftPayload.form,
          position: draftPayload.position,
          gpsCapturedAt: draftPayload.gpsCapturedAt,
          images: [],
          video: null,
        }));
      } catch {
        // give up silently
      }
    }
  }, []);

  useEffect(() => {
    saveDraft({ form, images, video, position, gpsCapturedAt });
  }, [form, images, video, position, gpsCapturedAt, saveDraft]);

  // Load subcities from MongoDB once on mount. Woredas are loaded on demand
  // for the selected subcity so routing always targets a real record.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingSubcities(true);
      try {
        const res = await locationAPI.getSubcities();
        if (cancelled) return;
        const list = res.data.subcities || [];
        setSubcities(list);
        if (list.length === 0) setSubcitiesError('No subcities are available yet.');
      } catch (err) {
        if (!cancelled) setSubcitiesError('Failed to load subcities. Please refresh the page.');
      } finally {
        if (!cancelled) setLoadingSubcities(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // When a subcity is selected, load its woredas from MongoDB.
  const handleSubcityChange = async (subcityId) => {
    const subcity = subcities.find(s => s._id === subcityId);
    setForm(p => ({ ...p, subcityId, subcity: subcity ? subcity.name : '', woredaId: '', woreda: '' }));
    setWoredas([]);
    setWoredasError('');
    setErrors(p => { const n = { ...p }; delete n.subcityId; delete n.woredaId; return n; });

    if (!subcityId) {
      setLoadingWoredas(false);
      return;
    }

    setLoadingWoredas(true);
    try {
      const res = await locationAPI.getWoredasBySubcity(subcityId);
      const list = res.data.woredas || [];
      setWoredas(list);
      if (list.length === 0) setWoredasError('No woredas are available for the selected subcity yet.');
    } catch (err) {
      setWoredasError('Failed to load woredas. Please refresh the page.');
    } finally {
      setLoadingWoredas(false);
    }
  };

  const handleWoredaChange = (woredaId) => {
    const woreda = woredas.find(w => w._id === woredaId);
    setForm(p => ({ ...p, woredaId, woreda: woreda ? (woreda.woredaName || woreda.name) : '' }));
    setErrors(p => { const n = { ...p }; delete n.woredaId; return n; });
  };

  const cancelDraft = useCallback(() => {
    saveSeqRef.current += 1; // invalidate any in-flight save
    clearDraftStorage();
  }, []);

  // ── Evidence handlers ──
  const handleImageChange = (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (selected.length === 0) return;

    let err = null;
    const valid = [];
    for (const file of selected) {
      const isAllowed = IMAGE_TYPES.includes(file.type) || ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(getFileExt(file.name));
      if (!isAllowed) { err = 'Only image files are allowed'; break; }
      if (file.size > MAX_IMAGE_SIZE) { err = `${file.name} exceeds the 10MB limit`; break; }
      valid.push(file);
    }
    if (err) {
      setErrors(p => ({ ...p, images: err }));
      return;
    }

    const combined = [...images, ...valid];
    if (combined.length > MAX_IMAGES) {
      setErrors(p => ({ ...p, images: `You can upload a maximum of ${MAX_IMAGES} images.` }));
      return;
    }

    setImages(combined);
    if (errors.images) setErrors(p => { const n = { ...p }; delete n.images; return n; });
  };

  const removeImage = (idx) => {
    setImages(p => p.filter((_, i) => i !== idx));
    if (errors.images) setErrors(p => { const n = { ...p }; delete n.images; return n; });
  };

  const handleVideoChange = (e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = '';
    if (!file) return;

    const isAllowed = VIDEO_TYPES.includes(file.type) || ['mp4', 'mov', 'webm'].includes(getFileExt(file.name));
    if (!isAllowed) {
      setErrors(p => ({ ...p, video: 'Only MP4, MOV or WEBM videos are allowed' }));
      return;
    }
    if (file.size > MAX_VIDEO_SIZE) {
      setErrors(p => ({ ...p, video: `${file.name} exceeds the 50MB limit` }));
      return;
    }

    setVideo(file);
    if (errors.video) setErrors(p => { const n = { ...p }; delete n.video; return n; });
  };

  const removeVideo = () => {
    setVideo(null);
    if (errors.video) setErrors(p => { const n = { ...p }; delete n.video; return n; });
  };

  // ── Validation ──
  const validateStep = (s, err = {}) => {
    if (s === 1) {
      if (!form.department) err.department = 'Please select a department';
    }

    if (s === 2) {
      if (!form.subcityId) err.subcityId = 'Please select a subcity';
      if (!form.woredaId) err.woredaId = 'Please select a woreda';
      if (!position) {
        err.gps = 'GPS location is required — use "Use My Current Location" or tap the map to pin your location.';
      } else if (!isWithinAddisAbaba(position.lat, position.lng)) {
        err.gps = 'GPS location is outside Addis Ababa. Please select a location inside Addis Ababa.';
      }
    }

    if (s === 3) {
      if (!form.title.trim()) err.title = 'Complaint title is required';
      else if (form.title.trim().length > 200) err.title = 'Title must be under 200 characters';
      if (!form.description.trim()) err.description = 'Description is required';
      else if (form.description.trim().length < MIN_DESCRIPTION_LENGTH) {
        err.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
      } else if (form.description.trim().length > 5000) err.description = 'Description must be under 5000 characters';
      if (!form.riskLevel) err.riskLevel = 'Please choose a risk level';
    }

    if (s === 5 && !isAnonymous) {
      if (!form.fullName.trim()) err.fullName = 'Full name is required';
      if (!form.phone.trim()) err.phone = 'Phone number is required';
      else if (!PHONE_REGEX.test(form.phone.replace(/[\s-]/g, ''))) {
        err.phone = 'Enter a valid Ethiopian phone number (e.g. 0911123456 or +251911123456)';
      }
      if (!form.email.trim()) err.email = 'Email is required';
      else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) err.email = 'Please provide a valid email address';
    }

    return err;
  };

  const STEP_FIELDS = {
    1: ['department'],
    2: ['subcityId', 'woredaId', 'gps'],
    3: ['title', 'description', 'riskLevel'],
    5: ['fullName', 'phone', 'email'],
  };

  const validateAllSteps = () => {
    const err = {};
    let firstInvalidStep = null;
    for (const s of [1, 2, 3, 5]) {
      validateStep(s, err);
      if (firstInvalidStep === null && STEP_FIELDS[s].some(k => err[k])) firstInvalidStep = s;
    }
    return { errors: err, firstInvalidStep };
  };

  const handleNext = () => {
    const err = {};
    validateStep(step, err);
    setErrors(err);
    if (Object.keys(err).length === 0) {
      setStep(s => Math.min(s + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
      fd.append('department', form.department);
      fd.append('subcityId', form.subcityId);
      fd.append('woredaId', form.woredaId);
      fd.append('subcity', form.subcity);
      fd.append('woreda', form.woreda);
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('riskLevel', form.riskLevel);
      fd.append('anonymous', String(isAnonymous));
      fd.append('latitude', position.lat);
      fd.append('longitude', position.lng);
      if (gpsCapturedAt) fd.append('gpsCapturedAt', gpsCapturedAt);
      if (!isAnonymous) {
        fd.append('fullName', form.fullName.trim());
        fd.append('phone', form.phone.trim());
        fd.append('email', form.email.trim());
      }
      images.forEach(img => fd.append('images', img));
      if (video) fd.append('video', video);

      // Logged-in citizens submit through the protected route so the complaint
      // is linked to their account and appears under "My Reports". Public users
      // submit anonymously without an account.
      const res = user
        ? await complaintReportAPI.createMy(fd)
        : await complaintReportAPI.create(fd);

      cancelDraft();
      setTrackingNumber(res.data.complaint?.trackingNumber || res.data.complaint?.reportId || res.data.complaint?._id || '');
      setTrackingPin(res.data.complaint?.trackingPin || '');
      setSubmitted(true);
      toast.success('Complaint submitted successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Submission failed. Please try again.';
      if (err.response?.data?.errors?.length) {
        setErrors({ submit: err.response.data.errors.join('. ') });
      } else {
        setErrors({ submit: msg });
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const receiptUrl = trackingPin ? publicAPI.getReceiptUrl(trackingNumber, trackingPin) : '';

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
            <CircleCheck className="w-10 h-10 text-green-600 dark:text-green-400" strokeWidth={2} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Complaint Submitted Successfully</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Your complaint has been successfully submitted. Copy your Tracking Number and Tracking PIN below:
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-6 py-4 mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Tracking Number</p>
            <div className="flex items-center justify-center gap-3">
              <p className="text-2xl font-bold text-amber-700 dark:text-amber-300 font-mono">{trackingNumber}</p>
              <button
                type="button"
                onClick={() => copyToClipboard(trackingNumber, 'number')}
                title="Copy Tracking Number"
                className="p-2 rounded-lg border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                {copiedField === 'number' ? <Check className="w-4 h-4" strokeWidth={2} /> : <Copy className="w-4 h-4" strokeWidth={2} />}
              </button>
            </div>
          </div>
          {trackingPin && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-6 py-4 mb-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Tracking PIN</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 font-mono tracking-widest">{trackingPin}</p>
                <button
                  type="button"
                  onClick={() => copyToClipboard(trackingPin, 'pin')}
                  title="Copy Tracking PIN"
                  className="p-2 rounded-lg border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  {copiedField === 'pin' ? <Check className="w-4 h-4" strokeWidth={2} /> : <Copy className="w-4 h-4" strokeWidth={2} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                Keep this PIN secret — you need it (with the Tracking Number) to view or track this complaint.
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
            Save these details to check the status of your complaint. It is routed to the selected Woreda first
            and escalated to the Subcity if needed. You will also receive updates if you provided contact information.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {!user && trackingPin && (
              <>
                <a
                  href={`/track-complaint?number=${encodeURIComponent(trackingNumber)}&pin=${encodeURIComponent(trackingPin)}`}
                  className="btn-primary py-2.5 px-6 inline-flex items-center gap-2"
                >
                  <CircleCheck className="w-4 h-4" strokeWidth={2} />
                  Track Complaint
                </a>
                {receiptUrl && (
                  <a href={receiptUrl} target="_blank" rel="noreferrer" className="btn-secondary py-2.5 px-6">
                    Download Receipt (PDF)
                  </a>
                )}
              </>
            )}
            {user && (
              <Link to="/dashboard/citizen/my-reports" className="btn-primary py-2.5 px-6 inline-flex items-center gap-2">
                <CircleCheck className="w-4 h-4" strokeWidth={2} />
                View My Reports
              </Link>
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
            <h1 className="text-base sm:text-lg font-bold">Public Complaint</h1>
            <p className="text-primary-100 text-xs sm:text-sm max-w-xl mt-0.5">
              Submit complaints related to corruption, peace, and public security.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs shrink-0">
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-2.5 py-1">
              <Building2 className="w-3.5 h-3.5" strokeWidth={2} /> 2 Departments
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-2.5 py-1">
              <MapPin className="w-3.5 h-3.5" strokeWidth={2} /> 3 Subcities
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur rounded-full px-2.5 py-1">
              <Shield className="w-3.5 h-3.5" strokeWidth={2} /> Anonymous Option
            </span>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {errors.submit && (
        <div className="mb-4 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-sm text-red-700 dark:text-red-300 animate-fade-in">
          <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="font-semibold">Submission failed</p>
            <p className="mt-0.5">{errors.submit}</p>
          </div>
          <button type="button" onClick={() => setErrors(p => { const n = { ...p }; delete n.submit; return n; })} className="ml-auto text-red-400 hover:text-red-600" aria-label="Dismiss error">
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="card p-4 sm:p-5">

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
                  {step > s.n ? <Check className="w-3 h-3" strokeWidth={2} /> : s.n}
                </span>
                <span className="hidden sm:inline">{s.title}</span>
              </button>
            ))}
          </div>

          {/* ── Step 1: Department ── */}
          {step === 1 && (
            <section className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2.5">
                <Building2 className="text-primary-600 dark:text-primary-400 w-5 h-5" strokeWidth={2} />
                Department
              </h2>
              <FormField label="Select Department" error={errors.department} required>
                <select
                  name="department"
                  value={form.department}
                  onChange={e => set('department', e.target.value)}
                  className={`input-field ${errors.department ? 'border-red-400 focus:ring-red-300' : ''}`}
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">The complaint is routed to the department you select.</p>
              </FormField>
            </section>
          )}

          {/* ── Step 2: Location + GPS map ── */}
          {step === 2 && (
            <section className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2.5">
                <MapPin className="text-primary-600 dark:text-primary-400 w-5 h-5" strokeWidth={2} />
                Location
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Subcity" error={errors.subcityId} required>
                  {loadingSubcities ? (
                    <div className="input-field flex items-center gap-2 text-gray-400">
                      <LoaderCircle className="w-4 h-4 animate-spin" strokeWidth={2} /> Loading subcities...
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
                  {subcitiesError && (
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" strokeWidth={2} /> {subcitiesError}
                    </p>
                  )}
                </FormField>

                <FormField label="Woreda" error={errors.woredaId} required>
                  {loadingWoredas ? (
                    <div className="input-field flex items-center gap-2 text-gray-400">
                      <LoaderCircle className="w-4 h-4 animate-spin" strokeWidth={2} /> Loading woredas...
                    </div>
                  ) : (
                    <select
                      name="woredaId"
                      value={form.woredaId}
                      onChange={e => handleWoredaChange(e.target.value)}
                      disabled={!form.subcityId}
                      className={`input-field ${errors.woredaId ? 'border-red-400 focus:ring-red-300' : ''} ${!form.subcityId ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      <option value="">{form.subcityId ? 'Select Woreda' : 'Select a subcity first'}</option>
                      {woredas.map(w => <option key={w._id} value={w._id}>{w.woredaName || w.name}</option>)}
                    </select>
                  )}
                  {woredasError && (
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1">
                      <Info className="w-3 h-3" strokeWidth={2} /> {woredasError}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Your complaint is routed to this Woreda first.</p>
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

          {/* ── Step 3: Complaint Details ── */}
          {step === 3 && (
            <section className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2.5">
                <Tag className="text-primary-600 dark:text-primary-400 w-5 h-5" strokeWidth={2} />
                Complaint Details
              </h2>

              <div className="space-y-4">
                <FormField label="Complaint Title" error={errors.title} required>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    maxLength={200}
                    placeholder="e.g. Broken street lights on Main Street for 3 weeks"
                    className={`input-field ${errors.title ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                </FormField>

                <FormField label="Description" error={errors.description} required>
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={4}
                    maxLength={5000}
                    placeholder="Describe the complaint in detail: what happened, when you noticed it, who is affected, and any steps already taken..."
                    className={`input-field resize-none ${errors.description ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  <p className={`text-[11px] mt-1 flex justify-between ${form.description.trim().length >= MIN_DESCRIPTION_LENGTH ? 'text-gray-400 dark:text-gray-500' : 'text-primary-600 dark:text-primary-400'}`}>
                    <span>{form.description.trim().length < MIN_DESCRIPTION_LENGTH ? `At least ${MIN_DESCRIPTION_LENGTH} characters` : 'Good detail'}</span>
                    <span>{form.description.length}/5000</span>
                  </p>
                </FormField>

                <FormField label="Risk Level" error={errors.riskLevel} required>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {RISK_LEVELS.map(r => (
                      <label key={r.value} className={`cursor-pointer py-3 px-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 text-center flex items-center justify-center gap-2
                        ${form.riskLevel === r.value
                          ? `${r.badge} ring-2 ring-offset-1 ${r.ring}`
                          : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                        }`}>
                        <input
                          type="radio"
                          name="riskLevel"
                          value={r.value}
                          checked={form.riskLevel === r.value}
                          onChange={e => set('riskLevel', e.target.value)}
                          className="sr-only"
                        />
                        <span className={`w-2.5 h-2.5 rounded-full ${r.dot}`} />
                        <span>{r.value}</span>
                      </label>
                    ))}
                  </div>
                </FormField>
              </div>
            </section>
          )}

          {/* ── Step 4: Evidence ── */}
          {step === 4 && (
            <section className="animate-fade-in">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2">
                <Paperclip className="text-primary-600 dark:text-primary-400 w-5 h-5" strokeWidth={2} />
                Upload Evidence
                <span className="text-gray-400 dark:text-gray-500 font-normal text-sm">(optional, max 5 files)</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Upload photos or a video supporting your complaint. When evidence is attached, your complaint is submitted anonymously.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Upload Photos
                    <span className="text-gray-400 dark:text-gray-500 font-normal text-xs ml-1">(up to {MAX_IMAGES}, 10MB each)</span>
                  </label>
                  <div
                    onClick={() => imageRef.current?.click()}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') imageRef.current?.click(); }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload photos"
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
                  >
                    <input
                      ref={imageRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <Image className="w-7 h-7 mx-auto text-gray-400 dark:text-gray-500 mb-2" strokeWidth={2} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload photos</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Max {MAX_IMAGES} photos, up to 10MB each</p>
                  </div>
                  {errors.images && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                      <TriangleAlert className="w-3 h-3 shrink-0" strokeWidth={2} /> {errors.images}
                    </p>
                  )}
                  {images.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {images.map((f, i) => (
                        <div key={`${f.name}-${i}`} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2.5 text-xs group">
                          <FileImage className="w-6 h-6 text-blue-500 shrink-0" strokeWidth={2} />
                          <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{f.name}</span>
                          <span className="text-gray-400">{(f.size / 1024 / 1024).toFixed(1)}MB</span>
                          <button type="button" onClick={() => removeImage(i)}
                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
                            <X className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Video */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Upload Video
                    <span className="text-gray-400 dark:text-gray-500 font-normal text-xs ml-1">(single, 50MB max)</span>
                  </label>
                  <div
                    onClick={() => videoRef.current?.click()}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') videoRef.current?.click(); }}
                    role="button"
                    tabIndex={0}
                    aria-label="Upload video"
                    className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
                  >
                    <input
                      ref={videoRef}
                      type="file"
                      accept="video/mp4,video/mov,video/webm,.mp4,.mov,.webm"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                    <Video className="w-7 h-7 mx-auto text-gray-400 dark:text-gray-500 mb-2" strokeWidth={2} />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload a video</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Single video, up to 50MB</p>
                  </div>
                  {errors.video && (
                    <p className="text-xs text-red-500 dark:text-red-400 mt-2 flex items-center gap-1">
                      <TriangleAlert className="w-3 h-3 shrink-0" strokeWidth={2} /> {errors.video}
                    </p>
                  )}
                  {video && (
                    <div className="space-y-2 mt-3">
                      <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2.5 text-xs group">
                        <FileVideo className="w-6 h-6 text-purple-500 shrink-0" strokeWidth={2} />
                        <span className="flex-1 truncate text-gray-700 dark:text-gray-300">{video.name}</span>
                        <span className="text-gray-400">{(video.size / 1024 / 1024).toFixed(1)}MB</span>
                        <button type="button" onClick={removeVideo}
                          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove video">
                          <X className="w-4 h-4" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── Step 5: Review & Submit ── */}
          {step === 5 && (
            <section className="animate-fade-in space-y-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <CircleCheck className="text-primary-600 dark:text-primary-400 w-5 h-5" strokeWidth={2} />
                Review & Submit
              </h2>

              {/* Summary */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <SummaryItem label="Department" value={form.department || '—'} />
                <SummaryItem label="Subcity" value={form.subcity || '—'} />
                <SummaryItem label="Woreda" value={form.woreda || '—'} />
                <SummaryItem label="GPS Location" value={position ? `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : '—'} />
                <SummaryItem label="Risk Level" value={form.riskLevel || '—'} />
                <SummaryItem label="Evidence" value={`${images.length} photo${images.length === 1 ? '' : 's'}${video ? ' + 1 video' : ''}`} />
                <div className="sm:col-span-2">
                  <SummaryItem label="Title" value={form.title.trim() || '—'} />
                </div>
                <div className="sm:col-span-2">
                  <SummaryItem label="Description" value={form.description.trim() ? `${form.description.trim().slice(0, 220)}${form.description.trim().length > 220 ? '…' : ''}` : '—'} />
                </div>
              </div>

              {/* Anonymous / Personal Information */}
              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                {isAnonymous ? (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300 flex items-start gap-3">
                    <Shield className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
                    <div>
                      <p className="font-semibold">Submitting anonymously</p>
                      <p className="mt-0.5 text-xs">
                        Because you attached photo or video evidence, this complaint will be submitted anonymously.
                        No personal information is required or recorded.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-2.5">
                      <UserRound className="text-primary-600 dark:text-primary-400 w-5 h-5" strokeWidth={2} />
                      Personal Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Full Name" error={errors.fullName} required>
                        <input
                          type="text"
                          value={form.fullName}
                          onChange={e => set('fullName', e.target.value)}
                          placeholder="Your full name"
                          className={`input-field ${errors.fullName ? 'border-red-400 focus:ring-red-300' : ''}`}
                        />
                      </FormField>

                      <FormField label="Phone Number" error={errors.phone} required>
                        <input
                          type="tel"
                          value={form.phone}
                          onChange={e => set('phone', e.target.value)}
                          placeholder="09xxxxxxxx or +2519xxxxxxxx"
                          className={`input-field ${errors.phone ? 'border-red-400 focus:ring-red-300' : ''}`}
                        />
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">e.g. 0911123456 or +251911123456</p>
                      </FormField>

                      <FormField label="Email" error={errors.email} required>
                        <input
                          type="email"
                          value={form.email}
                          onChange={e => set('email', e.target.value)}
                          placeholder="your@email.com"
                          className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                        />
                      </FormField>
                    </div>
                  </div>
                )}
              </div>

              {/* Routing info */}
              <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 text-sm text-primary-700 dark:text-primary-300 flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
                <span>
                  Your complaint is routed to the selected <strong>Woreda</strong> first. If it cannot be resolved there, it is
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
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Back
              </Link>

              <div className="flex gap-3">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="btn-secondary py-2 px-5 text-sm inline-flex items-center gap-2"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" strokeWidth={2} /> Previous
                  </button>
                )}
                {step < STEPS.length ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="btn-primary py-2 px-6 text-sm inline-flex items-center gap-2"
                  >
                    Next <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary py-2 px-6 text-sm shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <LoaderCircle className="w-4 h-4 animate-spin" strokeWidth={2} />
                        {isAnonymous ? 'Uploading and submitting anonymously...' : 'Submitting...'}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Paperclip className="w-4 h-4" strokeWidth={2} />
                        Submit Complaint
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3 flex items-center justify-center gap-1.5">
              <Info className="w-3 h-3" strokeWidth={2} /> Your progress is saved automatically in this browser until you submit or cancel.
            </p>
          </div>
        </div>
      </form>

      <div className="mt-3 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-3 text-xs text-primary-700 dark:text-primary-300">
        <strong>Note:</strong> Complaints are reviewed by the responsible woreda and escalated to the subcity when needed. You will
        receive updates on the status of your complaint through your provided contact information or by tracking your complaint.
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
          <TriangleAlert className="w-3 h-3 shrink-0" strokeWidth={2} />
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
