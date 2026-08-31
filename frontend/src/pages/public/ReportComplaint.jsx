import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  UserRound, Phone, MapPin, Landmark, Building2, Tag,
  TriangleAlert, Paperclip, FileImage,
  FileVideo, CircleCheck, LoaderCircle, Info, X,
  ArrowLeft, ArrowRight, Shield, Image, Video, Plus,
} from 'lucide-react';
import { locationAPI, complaintReportAPI } from '../../services/api';
import AddisAbabaGpsPicker from '../../components/map/AddisAbabaGpsPicker';
import { isWithinAddisAbaba } from '../../components/map/EthioMap';

const IMAGE_TYPES = ['image/jpeg', 'image/png'];
const IMAGE_EXTS = ['jpg', 'jpeg', 'png'];
const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
const VIDEO_EXTS = ['mp4', 'mov', 'webm'];

const MAX_IMAGES = 5;
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
const MIN_DESCRIPTION_LENGTH = 20;

const PHONE_REGEX = /^(\+251|0)9\d{8}$/;

const RISK_LEVELS = [
  { value: 'Low',    dot: 'bg-green-500',  ring: 'ring-green-400',   badge: 'border-green-300 bg-green-50 text-green-700 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300' },
  { value: 'Medium', dot: 'bg-yellow-400', ring: 'ring-yellow-400',  badge: 'border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:border-yellow-700 dark:text-yellow-300' },
  { value: 'High',   dot: 'bg-red-500',    ring: 'ring-red-400',     badge: 'border-red-300 bg-red-50 text-red-700 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300' },
];

// The department dropdown is loaded from the backend (GET /api/departments/form)
// and stores the exact department name chosen — no label remapping is needed.

const getFileExt = (name = '') => name.split('.').pop()?.toLowerCase() || '';

export default function ReportComplaint() {
  const [step, setStep] = useState(1);
  const [subcities, setSubcities] = useState([]);
  const [woredas, setWoredas] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [loadingSubcities, setLoadingSubcities] = useState(true);
  const [loadingWoredas, setLoadingWoredas] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(true);

  const [subcitiesError, setSubcitiesError] = useState('');
  const [woredasError, setWoredasError] = useState('');
  const [departmentsError, setDepartmentsError] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    subcityId: '',
    woredaId: '',
    department: '',
    title: '',
    description: '',
    riskLevel: '',
  });

  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [position, setPosition] = useState(null);
  const [gpsCapturedAt, setGpsCapturedAt] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  const set = (key, val) => {
    setForm(p => ({ ...p, [key]: val }));
    if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
  };

  // Fetch subcities & departments on mount. Woredas load per selected subcity.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoadingSubcities(true);
      setLoadingDepartments(true);
      try {
        const [subcityRes, deptRes] = await Promise.all([
          locationAPI.getSubcities(),
          locationAPI.getPublicComplaintDepartments(),
        ]);
        if (cancelled) return;
        setSubcities(subcityRes.data.subcities || []);
        setDepartments(deptRes.data.departments || []);
        if (!subcityRes.data.subcities?.length) {
          setSubcitiesError('No subcities are available yet.');
        }
      } catch (err) {
        if (cancelled) return;
        setSubcitiesError('Failed to load subcities. Please refresh the page.');
        setDepartmentsError('Failed to load departments. Please refresh the page.');
      } finally {
        if (!cancelled) {
          setLoadingSubcities(false);
          setLoadingDepartments(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  // When a subcity is selected, load its woredas from MongoDB.
  const handleSubcityChange = async (subcityId) => {
    set('subcityId', subcityId);
    setForm(p => ({ ...p, woredaId: '' }));
    setWoredas([]);
    setWoredasError('');

    if (!subcityId) {
      setLoadingWoredas(false);
      return;
    }

    setLoadingWoredas(true);
    try {
      const res = await locationAPI.getWoredasBySubcity(subcityId);
      const list = res.data.woredas || [];
      setWoredas(list);
      if (list.length === 0) {
        setWoredasError('No woredas are available for the selected subcity yet.');
      }
    } catch (err) {
      setWoredasError('Failed to load woredas. Please refresh the page.');
    } finally {
      setLoadingWoredas(false);
    }
  };

  // ── Evidence: multiple images ──
  const handleImageChange = (e) => {
    const selected = Array.from(e.target.files || []);
    e.target.value = '';
    if (selected.length === 0) return;

    let err = null;
    const valid = [];
    for (const file of selected) {
      const ext = getFileExt(file.name);
      const isAllowed = IMAGE_TYPES.includes(file.type) || IMAGE_EXTS.includes(ext);
      if (!isAllowed) {
        err = 'Only JPG, JPEG or PNG images are allowed';
        break;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        err = `${file.name} exceeds the 10MB limit`;
        break;
      }
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

  // ── Evidence: single video ──
  const handleVideoChange = (e) => {
    const file = e.target.files?.[0] || null;
    e.target.value = '';
    if (!file) return;

    const ext = getFileExt(file.name);
    const isAllowed = VIDEO_TYPES.includes(file.type) || VIDEO_EXTS.includes(ext);
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

  // ── GPS location (mandatory, locked to Addis Ababa) ──
  const handleLocationSelect = ({ lat, lng, capturedAt }) => {
    setPosition({ lat, lng });
    if (capturedAt) setGpsCapturedAt(capturedAt);
    if (errors.gps) setErrors(p => { const n = { ...p }; delete n.gps; return n; });
  };

  const handleClearGps = () => {
    setPosition(null);
    setGpsCapturedAt(null);
  };

  // Validation rules are unchanged from the single-screen form — they are only
  // applied per step so the wizard can move forward once the visible fields pass.
  const applyPersonalAndLocationRules = (err) => {
    if (!form.fullName.trim()) err.fullName = 'Full name is required';
    if (!form.phone.trim()) err.phone = 'Phone number is required';
    else if (!PHONE_REGEX.test(form.phone.replace(/[\s-]/g, ''))) {
      err.phone = 'Enter a valid Ethiopian phone number (e.g. 0911123456 or +251911123456)';
    }
    if (!form.email.trim()) err.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) err.email = 'Please provide a valid email address';
    if (!form.subcityId) err.subcityId = 'Please select a subcity';
    if (!form.woredaId) err.woredaId = 'Please select a woreda';
    if (!position) {
      err.gps = 'GPS location is required — use "Use My Current Location" or tap the map to pin your location.';
    } else if (!isWithinAddisAbaba(position.lat, position.lng)) {
      err.gps = 'GPS location is outside Addis Ababa. Please select a location inside Addis Ababa.';
    }
    if (!form.department) err.department = 'Please select a department';
    else if (!departments.some(d => d.departmentName === form.department)) {
      err.department = 'Please select a valid department';
    }
  };

  const applyComplaintDetailsRules = (err) => {
    if (!form.title.trim()) err.title = 'Complaint title is required';
    else if (form.title.trim().length > 200) err.title = 'Title must be under 200 characters';
    if (!form.description.trim()) err.description = 'Description is required';
    else if (form.description.trim().length < MIN_DESCRIPTION_LENGTH) {
      err.description = `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`;
    } else if (form.description.trim().length > 5000) err.description = 'Description must be under 5000 characters';
    if (!form.riskLevel) err.riskLevel = 'Please choose a risk level';
  };

  const validateStep1 = () => {
    const err = {};
    applyPersonalAndLocationRules(err);
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validateStep2 = () => {
    const err = {};
    applyComplaintDetailsRules(err);
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const validate = () => {
    const err = {};
    applyPersonalAndLocationRules(err);
    applyComplaintDetailsRules(err);
    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleNext = () => {
    if (!validateStep1()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setStep(1);
    setForm({ fullName: '', phone: '', email: '', subcityId: '', woredaId: '', department: '', title: '', description: '', riskLevel: '' });
    setWoredas([]);
    setWoredasError('');
    setImages([]);
    setVideo(null);
    setPosition(null);
    setGpsCapturedAt(null);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('fullName', form.fullName.trim());
      fd.append('phone', form.phone.trim());
      fd.append('email', form.email.trim());
      fd.append('subcityId', form.subcityId);
      fd.append('woredaId', form.woredaId);
      fd.append('department', form.department);
      fd.append('title', form.title.trim());
      fd.append('description', form.description.trim());
      fd.append('riskLevel', form.riskLevel);
      fd.append('latitude', position.lat);
      fd.append('longitude', position.lng);
      if (gpsCapturedAt) fd.append('gpsCapturedAt', gpsCapturedAt);
      images.forEach(img => fd.append('images', img));
      if (video) fd.append('video', video);

      await complaintReportAPI.create(fd);

      resetForm();
      setSuccessMessage('Complaint submitted successfully.');
      setShowSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  const closeSuccess = () => {
    setShowSuccess(false);
    setSuccessMessage('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary-700 dark:text-gray-400 dark:hover:text-primary-400 mb-3 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2} /> Back to Home
      </Link>

      {/* Compact header + step indicator */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">Report Complaint</h1>
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {[1, 2].map(s => (
            <span
              key={s}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 transition-colors ${
                step === s
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${step === s ? 'bg-white' : 'bg-gray-400'}`} />
              {s}. {s === 1 ? 'Personal & Location' : 'Complaint Details'}
            </span>
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Report infrastructure or public service issues in your area.
      </p>

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

        {/* ── Step 1: Personal Information + Location Information ── */}
        {step === 1 && (
          <div className="card p-5 sm:p-6">
            <SectionHeader icon={UserRound} title="Personal Information" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Full Name" error={errors.fullName} required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><UserRound className="w-4 h-4" strokeWidth={2} /></span>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={e => set('fullName', e.target.value)}
                    placeholder="Your full name"
                    className={`input-field pl-10 ${errors.fullName ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                </div>
              </FormField>

              <FormField label="Phone Number" error={errors.phone} required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Phone className="w-4 h-4" strokeWidth={2} /></span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="09xxxxxxxx or +2519xxxxxxxx"
                    className={`input-field pl-10 ${errors.phone ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">e.g. 0911123456 or +251911123456</p>
              </FormField>

              <FormField label="Email" error={errors.email} required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><UserRound className="w-4 h-4" strokeWidth={2} /></span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="your@email.com"
                    className={`input-field pl-10 ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                </div>
              </FormField>
            </div>

            <SectionHeader icon={MapPin} title="Location Information" extraClass="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField label="Subcity" error={errors.subcityId} required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Landmark className="w-4 h-4" strokeWidth={2} /></span>
                  {loadingSubcities ? (
                    <div className="input-field pl-10 flex items-center gap-2 text-gray-400">
                      <LoaderCircle className="w-4 h-4 animate-spin" strokeWidth={2} /> Loading subcities...
                    </div>
                  ) : (
                    <select
                      value={form.subcityId}
                      onChange={e => handleSubcityChange(e.target.value)}
                      className={`input-field pl-10 ${errors.subcityId ? 'border-red-400 focus:ring-red-300' : ''}`}
                    >
                      <option value="">Select a subcity...</option>
                      {subcities.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
                {subcitiesError && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" strokeWidth={2} /> {subcitiesError}
                  </p>
                )}
              </FormField>

              <FormField label="Woreda" error={errors.woredaId} required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Building2 className="w-4 h-4" strokeWidth={2} /></span>
                  {loadingWoredas ? (
                    <div className="input-field pl-10 flex items-center gap-2 text-gray-400">
                      <LoaderCircle className="w-4 h-4 animate-spin" strokeWidth={2} /> Loading woredas...
                    </div>
                  ) : (
                    <select
                      value={form.woredaId}
                      onChange={e => set('woredaId', e.target.value)}
                      disabled={!form.subcityId}
                      className={`input-field pl-10 ${errors.woredaId ? 'border-red-400 focus:ring-red-300' : ''}`}
                    >
                      <option value="">{form.subcityId ? 'Select a woreda...' : 'Select a subcity first'}</option>
                      {woredas.map(w => (
                        <option key={w._id} value={w._id}>
                          {w.woredaName || w.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                {woredasError && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" strokeWidth={2} /> {woredasError}
                  </p>
                )}
              </FormField>

              <FormField label="Department" error={errors.department} required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><Building2 className="w-4 h-4" strokeWidth={2} /></span>
                  {loadingDepartments ? (
                    <div className="input-field pl-10 flex items-center gap-2 text-gray-400">
                      <LoaderCircle className="w-4 h-4 animate-spin" strokeWidth={2} /> Loading departments...
                    </div>
                  ) : (
                    <select
                      value={form.department}
                      onChange={e => set('department', e.target.value)}
                      className={`input-field pl-10 ${errors.department ? 'border-red-400 focus:ring-red-300' : ''}`}
                    >
                      <option value="">Select a department...</option>
                      {departments.map(d => (
                        <option key={d._id} value={d.departmentName}>{d.departmentName}</option>
                      ))}
                    </select>
                  )}
                </div>
                {!loadingDepartments && departments.length === 0 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <Info className="w-3 h-3" strokeWidth={2} /> {departmentsError || 'No departments available yet.'}
                  </p>
                )}
              </FormField>
            </div>

            <FormField label="GPS Location" error={errors.gps} required extraClass="mt-4">
              <AddisAbabaGpsPicker
                position={position}
                onLocationSelect={handleLocationSelect}
                onClear={handleClearGps}
                height="220px"
              />
            </FormField>
            {gpsCapturedAt && (
              <p className="text-[10px] text-green-600/70 dark:text-green-400/70 mt-0.5">
                Captured at {new Date(gpsCapturedAt).toLocaleTimeString()}
              </p>
            )}

            <div className="flex justify-end pt-4 mt-5 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={handleNext}
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5"
              >
                Next <ArrowRight className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Complaint Details + Evidence Upload ── */}
        {step === 2 && (
          <div className="card p-5 sm:p-6">
            <SectionHeader icon={Tag} title="Complaint Details" />
            <div className="space-y-4">
              <FormField label="Complaint Title" error={errors.title} required>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  maxLength={200}
                  placeholder='e.g. "Pothole on Main Road"'
                  className={`input-field ${errors.title ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
              </FormField>

              <FormField label="Description" error={errors.description} required>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  rows={4}
                  maxLength={5000}
                  placeholder="Describe the issue in detail..."
                  className={`input-field resize-none ${errors.description ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
                <p className={`text-[11px] mt-1 flex justify-between ${form.description.trim().length >= MIN_DESCRIPTION_LENGTH ? 'text-gray-400 dark:text-gray-500' : 'text-amber-600 dark:text-amber-400'}`}>
                  <span>{form.description.trim().length < MIN_DESCRIPTION_LENGTH ? `At least ${MIN_DESCRIPTION_LENGTH} characters` : 'Good detail'}</span>
                  <span>{form.description.length}/5000</span>
                </p>
              </FormField>

              <FormField label="Risk Level" error={errors.riskLevel} required>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {RISK_LEVELS.map(r => (
                    <label key={r.value} className={`cursor-pointer py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all duration-150 text-center flex items-center justify-center gap-2
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

            <SectionHeader icon={Paperclip} title="Evidence Upload" extra="(optional)" extraClass="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Upload Images
                  <span className="text-gray-400 dark:text-gray-500 font-normal text-xs ml-1">(up to {MAX_IMAGES}, JPG/JPEG/PNG)</span>
                </label>
                <div
                  onClick={() => imageRef.current?.click()}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') imageRef.current?.click(); }}
                  role="button"
                  tabIndex={0}
                  aria-label="Upload images"
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50/30 dark:hover:bg-primary-900/10 transition-colors"
                >
                  <input
                    ref={imageRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Image className="w-6 h-6 mx-auto text-gray-400 dark:text-gray-500 mb-1.5" strokeWidth={2} />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload images</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Max {MAX_IMAGES} images, up to 10MB each</p>
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
                  <span className="text-gray-400 dark:text-gray-500 font-normal text-xs ml-1">(single, MP4/MOV/WEBM)</span>
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
                    accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                  <Video className="w-6 h-6 mx-auto text-gray-400 dark:text-gray-500 mb-1.5" strokeWidth={2} />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload a video</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Single video, up to 50MB</p>
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

            <div className="flex items-center justify-between gap-3 pt-4 mt-5 border-t border-gray-100 dark:border-gray-700">
              <button
                type="button"
                onClick={handleBack}
                className="btn-secondary inline-flex items-center gap-2 px-6 py-2.5"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2} /> Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <LoaderCircle className="w-4 h-4 animate-spin" strokeWidth={2} />
                    {images.length || video ? 'Uploading and submitting...' : 'Submitting...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Paperclip className="w-4 h-4" strokeWidth={2} />
                    Submit Complaint
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="mt-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-3 text-xs text-primary-700 dark:text-primary-300 flex items-start gap-2">
        <Shield className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={2} />
        <span>Your information is kept confidential and is only used to follow up on your complaint. Reports are reviewed by administrators and routed to the responsible department.</span>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="success-title">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
              <CircleCheck className="w-10 h-10 text-green-600 dark:text-green-400" strokeWidth={2} />
            </div>
            <h2 id="success-title" className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Complaint Submitted Successfully</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-7">{successMessage} The responsible department will review it shortly.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={closeSuccess}
                className="btn-primary py-2.5 px-6 inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" strokeWidth={2} /> Submit Another Complaint
              </button>
              <Link to="/" className="btn-secondary py-2.5 px-6">Back to Home</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── Shared Components ─────────────────── */

function FormField({ label, error, required, children, extraClass = '' }) {
  return (
    <div className={extraClass}>
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

function SectionHeader({ icon: Icon, title, extra, extraClass = '' }) {
  return (
    <div className={`flex items-center gap-2 mb-3 ${extraClass}`}>
      <Icon className="w-4 h-4 text-primary-600 dark:text-primary-400" />
      <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h2>
      {extra && <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">{extra}</span>}
    </div>
  );
}
