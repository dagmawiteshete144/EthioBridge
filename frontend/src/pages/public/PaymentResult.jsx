import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircleCheck, X, Download, RefreshCw, TriangleAlert, Heart,
  Bug, ChevronDown,
} from 'lucide-react';
import { campaignAPI } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Show a simple user-friendly message while keeping the raw backend message in Developer Details.
const friendlyError = (raw) => {
  if (!raw) return 'Something went wrong. No money was taken from your account.';
  const lower = raw.toLowerCase();
  if (lower.includes('still being processed') || lower.includes('please wait') || lower.includes('still being confirmed')) {
    return 'Chapa has not confirmed the payment yet. This can happen right after checkout — if you completed the payment it will be confirmed shortly, otherwise you can try again.';
  }
  if (lower.includes('expired')) {
    return 'Your payment session expired before the payment was completed. No money was taken — you can safely try again below.';
  }
  if (lower.includes('payment failed') || lower.includes('no money') || lower.includes('already been received')) {
    return 'The payment was not completed. No money was taken from your account.';
  }
  if (lower.includes('campaign')) {
    return 'We hit a problem while processing this donation. Your payment was not recorded and no money was taken.';
  }
  return 'We could not confirm your payment. No money was taken from your account.';
};

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 2500;

export default function PaymentResult() {
  const { campaignId } = useParams();
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref') || '';

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const mounted = useRef(true);

  // Chapa can take a few seconds to settle a just-completed payment, so keep
  // retrying while the backend reports "still being processed" before giving up.
  const verify = async (reference, attempt = 0) => {
    if (!mounted.current) return;
    setVerifying(true);
    setError('');
    try {
      const res = await campaignAPI.verifyPayment({ txRef: reference });
      if (!mounted.current) return;
      setResult(res.data.data);
      setVerifying(false);
      setLoading(false);
    } catch (err) {
      if (!mounted.current) return;
      const msg = err.response?.data?.message || 'We could not confirm your payment. Please try again.';

      // The transaction may have been finalized by Chapa's webhook even though
      // this local record was not found — fall back to the stored-status lookup.
      if (err.response?.status === 404 && reference) {
        try {
          const statusRes = await campaignAPI.getPaymentStatus(reference);
          if (!mounted.current) return;
          if (statusRes.data.data?.payment?.status === 'completed') {
            setResult(statusRes.data.data);
            setVerifying(false);
            setLoading(false);
            return;
          }
        } catch { /* fall through to normal error handling */ }
      }

      const stillProcessing = msg.toLowerCase().includes('still being processed')
        || msg.toLowerCase().includes('still being confirmed')
        || msg.toLowerCase().includes('please wait');
      if (stillProcessing && attempt < MAX_RETRIES) {
        setTimeout(() => verify(reference, attempt + 1), RETRY_DELAY_MS);
        return;
      }
      setError(msg);
      setVerifying(false);
      setLoading(false);
    }
  };

  const checkAgain = () => {
    if (!txRef || verifying) return;
    setLoading(true);
    verify(txRef);
  };

  useEffect(() => {
    mounted.current = true;
    if (txRef) verify(txRef);
    else {
      setError('No payment reference was found in the redirect. If you completed a payment, check your email receipt.');
      setLoading(false);
    }
    return () => { mounted.current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txRef]);

  const downloadReceipt = () => {
    const receipt = result?.receipt || result?.donation;
    if (!receipt) return;
    const content = `
╔══════════════════════════════════════╗
║     ETHIOBRIDGE DONATION RECEIPT     ║
╠══════════════════════════════════════╣
║  Receipt #: ${(receipt.receiptNumber || receipt.transactionId || '').padEnd(20)}║
║  Date: ${new Date(receipt.createdAt || Date.now()).toLocaleString().padEnd(26)}║
║  Campaign: ${(result.campaign?.title || '').substring(0, 28).padEnd(28)}║
║  Amount: ${(receipt.amount + ' ' + (receipt.currency || 'ETB')).padEnd(29)}║
║  Payment: ${(receipt.paymentMethod || 'Chapa').replace('_', ' ').padEnd(26)}║
║  Donor: ${(receipt.isAnonymous ? 'Anonymous' : receipt.donorName || 'Anonymous').padEnd(27)}║
║  Reference: ${(receipt.transactionId || '').padEnd(25)}║
╠══════════════════════════════════════╣
║   Thank you for your support!        ║
╚══════════════════════════════════════╝
    `.trim();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EthioBridge-Receipt-${receipt.receiptNumber || receipt.transactionId || 'Donation'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingSpinner fullPage />;

  const campaign = result?.campaign || null;
  const donation = result?.donation || null;
  const success = Boolean(result && result.donation);

  return (
    <div className="min-h-[70vh] max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card w-full p-8 sm:p-10"
      >
        {verifying ? (
          <div className="text-center space-y-4 py-8">
            <LoadingSpinner />
            <p className="text-sm text-gray-500 dark:text-gray-400">Confirming your payment with Chapa securely...</p>
          </div>
        ) : success ? (
          <div className="text-center space-y-6 py-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto"
            >
              <CircleCheck className="w-12 h-12 text-green-500" strokeWidth={2} />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Donation Successful!</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Thank you for your support. Your donation of{' '}
                <strong className="text-green-600 dark:text-green-400">{donation?.amount || '—'} ETB</strong> has been received.
              </p>
            </div>

            {donation && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 rounded-xl p-5 text-left space-y-2 border border-green-200 dark:border-green-800 max-w-sm mx-auto">
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider">Receipt Summary</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
                  <span>Receipt #</span>
                  <span className="font-mono font-medium text-gray-800 dark:text-gray-200">{donation.receiptNumber || '—'}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
                  <span>Reference</span>
                  <span className="font-mono text-xs font-medium text-gray-800 dark:text-gray-200">{donation.transactionId || '—'}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
                  <span>Amount</span>
                  <span className="font-bold text-green-600">{donation.amount} ETB</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
                  <span>Payment</span>
                  <span className="font-medium text-gray-800 dark:text-gray-200 capitalize">Chapa</span>
                </p>
                {campaign && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
                    <span>Campaign</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200 text-right max-w-[200px] truncate">{campaign.title}</span>
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300 flex justify-between">
                  <span>Date</span>
                  <span>{new Date(donation.createdAt || Date.now()).toLocaleString()}</span>
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button onClick={downloadReceipt} className="btn-primary py-3 px-6 flex items-center justify-center gap-2 shadow-lg">
                <Download className="w-4 h-4" strokeWidth={2} /> Download Receipt
              </button>
              <Link to="/dashboard/citizen/my-donations" className="btn-secondary py-3 px-6 flex items-center justify-center gap-2">
                <Heart className="w-4 h-4" strokeWidth={2} /> My Donations
              </Link>
              {campaign && (
                <Link to={`/fundraising/${campaign._id}`} className="btn-secondary py-3 px-6 flex items-center justify-center">
                  View Campaign
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center space-y-6 py-4">
            <div className="w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
              <X className="w-12 h-12 text-red-500" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-1">Payment Not Completed</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {friendlyError(error) || 'Something went wrong. No money was taken from your account.'}
              </p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-xs text-amber-700 dark:text-amber-300 flex gap-2 items-start max-w-md mx-auto text-left">
              <TriangleAlert className="w-3 h-3 shrink-0 mt-0.5" strokeWidth={2} />
              <span>Your donation was not recorded and the campaign was not updated. You can safely try again below.</span>
            </div>

            {error && (
              <div className="max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setShowDetails((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="flex items-center gap-1.5 font-mono">
                    <Bug className="w-3 h-3" strokeWidth={2} /> Developer Details
                  </span>
                  <motion.span animate={{ rotate: showDetails ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-3 h-3" strokeWidth={2} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {showDetails && (
                    <motion.pre
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden text-left text-[11px] font-mono text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-3 whitespace-pre-wrap break-words"
                    >
                      {error}
                    </motion.pre>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <button onClick={checkAgain} disabled={verifying} className="btn-primary py-3 px-6 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                <RefreshCw className={`w-4 h-4 ${verifying ? 'animate-spin' : ''}`} strokeWidth={2} /> Check Again
              </button>
              {campaignId && (
                <Link to={`/fundraising/${campaignId}/donate`} className="btn-secondary py-3 px-6 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" strokeWidth={2} /> Start New Donation
                </Link>
              )}
              <Link to="/fundraising" className="btn-secondary py-3 px-6 flex items-center justify-center">
                Back to Fundraising
              </Link>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
