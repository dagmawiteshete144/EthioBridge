import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircleCheck, ShieldCheck, Lock, TriangleAlert, Heart,
} from 'lucide-react';
import { campaignAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import CampaignImage from '../../components/common/CampaignImage';
import { toast } from 'react-toastify';

const PRESET_AMOUNTS = [100, 250, 500, 1000, 5000];

const STEPS = ['amount', 'details'];

export default function Donate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState('amount');
  const [amount, setAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const startingRef = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await campaignAPI.getPublicCampaign(id);
        setCampaign(res.data.data);
      } catch (err) {
        toast.error('Campaign not found');
        navigate('/fundraising');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const finalAmount = useMemo(() => (customAmount ? parseFloat(customAmount) : amount), [customAmount, amount]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!campaign) return null;

  const stepIndex = STEPS.indexOf(step);

  const nextStep = () => {
    if (step === 'amount') {
      if (!finalAmount || finalAmount < 10) {
        toast.error('Minimum donation is 10 ETB');
        return;
      }
      if (campaign.status !== 'active') {
        toast.error('This campaign is not accepting donations');
        return;
      }
      setStep('details');
    } else if (step === 'details') {
      if (!donorEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())) {
        toast.error('A valid email is required to complete the Chapa payment.');
        return;
      }
      startPayment();
    }
  };

  // Start a real Chapa payment session, then redirect straight to the official checkout page.
  const startPayment = async () => {
    if (startingRef.current) return;
    startingRef.current = true;
    setError('');
    setProcessing(true);
    try {
      const res = await campaignAPI.initiatePayment({
        campaignId: campaign._id,
        amount: finalAmount,
        paymentMethod: 'chapa',
        donorName: donorName || undefined,
        donorEmail: donorEmail || undefined,
        phone: phone || undefined,
        isAnonymous,
        message,
      });

      // The payment was already recorded (e.g. a retry right after a successful
      // checkout) — show the result page instead of charging the donor again.
      if (res.data.data?.alreadyProcessed) {
        const txRef = res.data.data.payment?.txRef || res.data.data.txRef;
        navigate(`/fundraising/payment-result/${campaign._id}?tx_ref=${txRef}`, { replace: true });
        return;
      }

      const checkoutUrl = res.data.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('No checkout URL returned by the payment gateway');
      window.location.href = checkoutUrl;
    } catch (err) {
      startingRef.current = false;
      setProcessing(false);
      setError(err.response?.data?.message || 'Failed to start the payment. Please try again.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-primary-600">Home</Link>
        <span>/</span>
        <Link to="/fundraising" className="hover:text-primary-600">Fundraising</Link>
        <span>/</span>
        <Link to={`/fundraising/${campaign._id}`} className="hover:text-primary-600 truncate max-w-[180px]">{campaign.title}</Link>
        <span>/</span>
        <span className="text-gray-600 dark:text-gray-300">Donate</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* ===== FORM COLUMN ===== */}
        <div className="lg:col-span-2">
          {/* Stepper */}
          <div className="flex items-center gap-2 mb-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  stepIndex > i ? 'bg-green-500 text-white' : stepIndex === i ? 'bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/30' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}>
                  {stepIndex > i ? <CircleCheck size={16} strokeWidth={2} /> : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${stepIndex >= i ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                  {s === 'amount' ? 'Amount' : 'Your Details'}
                </span>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${stepIndex > i ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'}`} />}
              </div>
            ))}
          </div>

          <motion.div layout className="card">
            <AnimatePresence mode="wait">
              {/* ===== STEP 1: AMOUNT ===== */}
              {step === 'amount' && (
                <motion.div key="amount" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Select Amount</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Choose a preset or enter a custom amount in Ethiopian Birr (ETB)</p>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {PRESET_AMOUNTS.map((val) => (
                      <button
                        key={val}
                        onClick={() => { setAmount(val); setCustomAmount(''); }}
                        className={`py-3.5 rounded-xl text-sm font-bold border-2 transition-all ${
                          amount === val && !customAmount
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-md'
                            : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary-300 hover:bg-primary-50/50'
                        }`}
                      >
                        {val >= 1000 ? `${val / 1000}k` : val}
                        <span className="block text-[9px] font-normal opacity-70">ETB</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Custom Amount</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">ETB</span>
                      <input type="number" min="10" placeholder="Enter an amount" value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }} className="input-field text-sm pl-10" />
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300 flex gap-2 items-start">
                      <TriangleAlert className="shrink-0 mt-0.5" size={16} strokeWidth={2} />
                    <span>Minimum donation is <strong>10 ETB</strong>. 100% of your contribution goes directly to this campaign.</span>
                  </div>
                  <button onClick={nextStep} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base font-bold">
                    Continue <span aria-hidden>→</span>
                  </button>
                </motion.div>
              )}

              {/* ===== STEP 2: DETAILS + DONATE ===== */}
              {step === 'details' && (
                <motion.div key="details" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">Your Details</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Used for your receipt only. Leave blank to stay fully anonymous.</p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                      <input type="text" value={donorName} onChange={(e) => setDonorName(e.target.value)} className="input-field text-sm" placeholder="Your name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500">*</span></label>
                      <input type="email" required value={donorEmail} onChange={(e) => setDonorEmail(e.target.value)} className="input-field text-sm" placeholder="you@example.com" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field text-sm" placeholder="09xx xxx xxx" />
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer group p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200">
                      <ShieldCheck className="inline mr-1.5 text-gray-400" size={16} strokeWidth={2} />
                      Donate Anonymously — hide my name from the public donor list
                    </span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message of Support (optional)</label>
                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="input-field text-sm resize-none" rows={3} maxLength={500} placeholder="Leave a message for the community..." />
                  </div>

                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl p-3 flex items-start gap-2">
                    <TriangleAlert className="shrink-0 mt-0.5" size={16} strokeWidth={2} />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button onClick={() => setStep('amount')} className="btn-secondary px-6 py-3 text-sm">← Back</button>
                    <button
                      onClick={nextStep}
                      disabled={processing}
                      className="btn-primary flex-1 py-3 text-base font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {processing ? (
                        <>
                          <Spinner /> Preparing secure checkout...
                        </>
                      ) : (
                        <>
                          <Heart size={18} strokeWidth={2} /> Donate {finalAmount} ETB
                        </>
                      )}
                    </button>
                  </div>

                  <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                    <Lock className="text-green-500" size={16} strokeWidth={2} />
                    You'll be securely redirected to the official Chapa checkout page to complete your payment.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ===== SUMMARY SIDEBAR ===== */}
        <div className="space-y-6">
          <div className="card sticky top-24">
            <div className="relative h-40 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-xl">
              <CampaignImage src={campaign.image} alt={campaign.title} className="w-full h-full object-cover" iconSize="w-12 h-12" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <span className="absolute bottom-3 left-3 text-white text-sm font-semibold drop-shadow">You're donating to</span>
            </div>
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 line-clamp-2">{campaign.title}</h3>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
              <span>Raised</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{campaign.raisedAmount?.toLocaleString()} ETB</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3">
              <span>Goal</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{campaign.goalAmount?.toLocaleString()} ETB</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
              <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600" style={{ width: `${campaign.goalAmount > 0 ? Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100) : 0}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mb-4">
              <span>{campaign.goalAmount > 0 ? Math.round((campaign.raisedAmount / campaign.goalAmount) * 100) : 0}% funded</span>
              <span>{campaign.donors || 0} donors</span>
            </div>
            <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{finalAmount || '—'} ETB</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Your donation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />;
}
