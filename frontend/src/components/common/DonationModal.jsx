import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, ShieldCheck, Lock, TriangleAlert } from 'lucide-react';
import { campaignAPI } from '../../services/api';
import CampaignImage from './CampaignImage';
import { toast } from 'react-toastify';

const PRESET_AMOUNTS = [100, 250, 500, 1000, 5000];

const CHAPA_LOGO = 'https://ethiopianlogos.com/logos/chapa/chapa.png';

export default function DonationModal({ campaign, onClose }) {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(250);
  const [customAmount, setCustomAmount] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const startingRef = useRef(false);

  const handleAmountSelect = (val) => {
    setAmount(val);
    setCustomAmount('');
  };

  // Start a real Chapa payment session, then redirect to the official checkout page.
  const handleDonate = async () => {
    if (startingRef.current) return;
    startingRef.current = true;

    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    if (!finalAmount || finalAmount < 10) {
      startingRef.current = false;
      toast.error('Minimum donation is 10 ETB');
      return;
    }
    if (!donorEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donorEmail.trim())) {
      startingRef.current = false;
      toast.error('A valid email is required to complete the Chapa payment.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await campaignAPI.initiatePayment({
        campaignId: campaign._id,
        amount: finalAmount,
        paymentMethod: 'chapa',
        donorName: donorName || undefined,
        donorEmail: donorEmail || undefined,
        isAnonymous,
        message,
      });

      // The payment was already recorded (e.g. a retry right after a successful
      // checkout) — show the result page instead of charging the donor again.
      if (res.data.data?.alreadyProcessed) {
        const txRef = res.data.data.payment?.txRef || res.data.data.txRef;
        onClose();
        navigate(`/fundraising/payment-result/${campaign._id}?tx_ref=${txRef}`, { replace: true });
        return;
      }

      const checkoutUrl = res.data.data?.checkoutUrl;
      if (!checkoutUrl) throw new Error('No checkout URL returned by the payment gateway');
      window.location.href = checkoutUrl;
    } catch (err) {
      startingRef.current = false;
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to start the payment. Please try again.');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center text-primary-500">
                <Heart size={20} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Make a Donation</h2>
                <p className="text-xs text-gray-400">Support this campaign</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
              <X size={20} strokeWidth={2} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Campaign Info */}
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600">
              <CampaignImage
                src={campaign.image}
                alt=""
                className="w-12 h-12 rounded-lg object-cover"
                iconSize="w-5 h-5"
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-800 dark:text-gray-200 line-clamp-1">{campaign.title}</p>
                <p className="text-xs text-gray-400">
                  <span className="font-medium text-green-600 dark:text-green-400">{campaign.raisedAmount?.toLocaleString()} ETB</span> raised of {campaign.goalAmount?.toLocaleString()} ETB
                </p>
              </div>
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Select Amount</label>
              <div className="grid grid-cols-5 gap-2">
                {PRESET_AMOUNTS.map((val) => (
                  <button
                    key={val}
                    onClick={() => handleAmountSelect(val)}
                    className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
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
              <div className="mt-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-semibold">ETB</span>
                  <input
                    type="number"
                    placeholder="Custom Amount"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setAmount(0); }}
                    className="input-field text-sm pl-10"
                    min="10"
                  />
                </div>
              </div>
            </div>

            {/* Donor Info */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Your Name (optional)"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="input-field text-sm"
              />
              <input
                type="email"
                required
                placeholder="Your Email (required for Chapa checkout)"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="input-field text-sm"
              />
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-500 focus:ring-primary-400"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                  <ShieldCheck className="inline mr-1.5 text-gray-400" size={16} strokeWidth={2} />
                  Donate Anonymously
                </span>
              </label>
              <textarea
                placeholder="Leave a message of support (optional)"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="input-field text-sm resize-none"
                rows={2}
                maxLength={500}
              />
            </div>

            {/* Chapa payment */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Payment Method</label>
              <div className="flex justify-center">
                <div className="w-full max-w-sm">
                  <div className="flex flex-col items-center gap-2 py-5 rounded-xl border-2 border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-md transition-all">
                    <img
                      src={CHAPA_LOGO}
                      alt="Chapa"
                      className="h-10 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextSibling.style.display = 'flex'; }}
                    />
                    <span
                      className="hidden items-center gap-1 text-xl font-extrabold tracking-tight"
                      style={{ color: '#0EAB7D' }}
                    >
                      Chapa
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 text-center px-4">
                      Pay securely with Telebirr, CBE Birr, cards or bank apps via Chapa.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-xl p-3 flex items-start gap-2">
                <TriangleAlert className="shrink-0 mt-0.5" size={18} strokeWidth={2} />
                <span>{error}</span>
              </div>
            )}

            {/* Donate Button */}
            <button
              onClick={handleDonate}
              disabled={loading || (!amount && !customAmount)}
              className="w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Heart size={20} strokeWidth={2} /> Donate {customAmount || amount} ETB via Chapa
                </>
              )}
            </button>
            <p className="text-[11px] text-gray-400 text-center flex items-center justify-center gap-1">
              <Lock className="text-green-500" size={14} strokeWidth={2} /> You'll be redirected to the secure Chapa checkout page.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
