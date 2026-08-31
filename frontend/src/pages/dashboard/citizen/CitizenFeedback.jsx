import { useState, useEffect } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { feedbackAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../../context/AuthContext';
import { MessageSquareText, Send, Building2, MapPin, Inbox, RefreshCw, CornerDownRight, ShieldAlert } from 'lucide-react';
import { formatSubcityName } from '../../../utils/alertConstants';

const DEPARTMENTS = ['Water', 'Transport', 'Electricity', 'Ethics and Anti-Corruption', 'Peace and Security'];

const RECIPIENT_OPTIONS = [
  { value: 'subcity', label: 'Subcity Administration' },
  { value: 'woreda', label: 'Woreda Administration' },
];

const RECIPIENT_SHORT = {
  subcity: 'Subcity',
  woreda: 'Woreda',
};

// Label of the office that wrote a received message / reply.
const fromLabel = (f) => {
  if (f.authorRole === 'subcity' || f.recipient === 'subcity') return 'Subcity Administration';
  if (f.authorRole === 'woreda' || f.recipient === 'woreda') return 'Woreda Administration';
  return 'Administration';
};

export default function CitizenFeedback() {
  const { user } = useAuth();
  const [recipient, setRecipient] = useState('subcity');
  const [department, setDepartment] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // The citizen's registered location — feedback is always routed to these.
  const mySubcity = user?.subcity || '';
  const myWoreda = user?.woredaName || '';

  const fetchMine = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await feedbackAPI.getMine();
      setItems(res.data.feedback || []);
    } catch (err) {
      toast.error('Failed to load your feedback');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { fetchMine(); }, []);

  const handleSend = async () => {
    if (!text.trim()) { toast.error('Please write feedback first'); return; }
    if (!mySubcity) {
      toast.error('Your profile is missing a subcity. Please update your profile first.');
      return;
    }
    if (recipient === 'woreda' && !myWoreda) {
      toast.error('Your profile has no woreda. Please update your profile first.');
      return;
    }
    setSending(true);
    try {
      await feedbackAPI.create({ recipient, department: department || undefined, text: text.trim() });
      toast.success('Feedback sent');
      setText('');
      fetchMine(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send feedback');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Feedback" subtitle="Send feedback to your registered Woreda or Subcity and view replies" />

      {/* Registered location (auto-synced with the recipient) */}
      <div className="card p-4 flex items-start gap-3">
        <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Your registered location</p>
          {mySubcity || myWoreda ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Subcity: <span className="font-medium text-gray-700 dark:text-gray-300">{formatSubcityName(mySubcity) || '—'}</span>
              {myWoreda && (
                <>
                  <span className="mx-2 text-gray-300 dark:text-gray-600">·</span>
                  Woreda: <span className="font-medium text-gray-700 dark:text-gray-300">{myWoreda}</span>
                </>
              )}
            </p>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
              Your profile has no subcity/woreda yet. Update your profile so feedback can be routed to your administration.
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Your feedback is automatically sent to the administration of this Subcity/Woreda — no manual location selection needed.
          </p>
        </div>
      </div>

      {/* Compose */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquareText size={18} className="text-primary-600 dark:text-primary-400" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Write Feedback</h3>
        </div>

        <div className="mb-3">
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Send feedback to</label>
          <div className="flex items-center gap-2 flex-wrap">
            <select value={recipient} onChange={e => setRecipient(e.target.value)} className="input-field max-w-[280px]">
              {RECIPIENT_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            {recipient === 'subcity'
              ? <Building2 size={16} className="text-gray-400" />
              : <MapPin size={16} className="text-gray-400" />}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {recipient === 'subcity'
              ? `This goes to the ${formatSubcityName(mySubcity) || 'your'} Subcity administration — your registered Subcity.`
              : `This goes to the ${myWoreda || 'your'} Woreda administration — your registered Woreda in ${formatSubcityName(mySubcity) || 'your'} Subcity.`}
          </p>
        </div>

        <div className="mb-3">
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
            Department <span className="text-gray-400">(optional)</span>
          </label>
          <select value={department} onChange={e => setDepartment(e.target.value)} className="input-field max-w-[280px]">
            <option value="">General</option>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div className="mb-3">
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Your feedback</label>
          <textarea
            rows={4}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your feedback or comment for the selected administration..."
            className="input-field w-full"
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={sending}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
        >
          <Send size={16} />
          {sending ? 'Sending...' : 'Send Feedback'}
        </button>
      </div>

      {/* My feedback & replies */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">My Feedback & Replies</h3>
          <button
            type="button"
            onClick={() => fetchMine()}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-400">You have not sent or received any feedback yet.</p>
        ) : (
          <div className="space-y-3">
            {items.map(f => {
              const isReceived = f.direction === 'received';
              const isReply = isReceived && f.replyTo;
              return (
                <div key={f._id} className={`border rounded-lg p-3 ${isReceived ? 'border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-900/10' : 'border-gray-100 dark:border-gray-800'}`}>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 flex-wrap">
                    {isReply ? (
                      <CornerDownRight size={14} className="text-primary-600 dark:text-primary-400" />
                    ) : isReceived ? (
                      <Inbox size={14} className="text-primary-600 dark:text-primary-400" />
                    ) : (f.recipient === 'woreda' ? <MapPin size={14} /> : <Building2 size={14} />)}
                    <span className="font-medium">
                      {isReply
                        ? `Reply from ${fromLabel(f)}`
                        : isReceived
                          ? `Message from ${fromLabel(f)}`
                          : `Sent to ${RECIPIENT_SHORT[f.recipient] || f.recipient} Administration`}
                    </span>
                    {f.department && <span className="px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{f.department}</span>}
                    <span className="text-gray-400">{new Date(f.createdAt).toLocaleString()}</span>
                  </div>

                  {isReply && f.replyToText && (
                    <div className="flex items-start gap-1.5 text-xs text-gray-400 dark:text-gray-500 mt-1 border-l-2 border-primary-300 dark:border-primary-700 pl-2">
                      <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                      <span>
                        <span className="font-medium">In reply to your feedback:</span> "{f.replyToText}"
                      </span>
                    </div>
                  )}

                  {!isReceived && (f.subcity || f.woreda) && (
                    <p className="text-xs text-gray-400 mt-1">
                      Location: {formatSubcityName(f.subcity)}{f.woreda ? ` — ${f.woreda}` : ''}
                    </p>
                  )}

                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5">{f.text}</p>
                  {isReceived && f.authorName && (
                    <p className="text-xs text-gray-400 mt-1">From: {f.authorName}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
