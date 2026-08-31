import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { feedbackAPI, subcityAPI } from '../../../services/api';
import { toast } from 'react-toastify';
import { Inbox, Send, Building2, Reply, X } from 'lucide-react';

const DEPARTMENTS = ['Water', 'Transport', 'Electricity', 'Ethics and Anti-Corruption', 'Peace and Security'];

const RECIPIENTS = [
  { value: 'citizen', label: 'Citizen' },
  { value: 'woreda', label: 'Woreda Administration' },
  { value: 'city', label: 'City Administration' },
];

const ROLE_LABELS = {
  citizen: 'Citizen',
  woreda: 'Woreda',
  subcity: 'Subcity',
};

function FeedbackCard({ title, icon: Icon, items, emptyText, onReply, replyingTo, replyText, onReplyTextChange, onSendReply, sendingReply }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon size={18} className="text-primary-600 dark:text-primary-400" />
        <h3 className="font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-gray-400">{emptyText}</p>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-y-auto">
          {items.map(f => (
            <div key={f._id} className="border border-gray-100 dark:border-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1 flex-wrap">
                <span className="font-medium">{f.authorName || 'Anonymous'}</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">{ROLE_LABELS[f.authorRole] || f.authorRole}</span>
                {f.department && <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">{f.department}</span>}
                <span className="text-gray-400">{new Date(f.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{f.text}</p>

              {onReply && f.authorRole === 'citizen' && (
                replyingTo === f._id ? (
                  <div className="mt-2 border-t border-gray-100 dark:border-gray-800 pt-2">
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={e => onReplyTextChange(e.target.value)}
                      placeholder="Write your reply to this citizen..."
                      className="input-field w-full"
                    />
                    <div className="flex gap-2 mt-1.5">
                      <button
                        type="button"
                        onClick={() => onSendReply(f._id)}
                        disabled={sendingReply === f._id}
                        className="btn-primary inline-flex items-center gap-1.5 text-xs disabled:opacity-50"
                      >
                        <Reply size={14} />
                        {sendingReply === f._id ? 'Sending...' : 'Send Reply'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onReply(null)}
                        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        <X size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onReply(f._id)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    <Reply size={14} /> Reply
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SubcityFeedback() {
  const [incoming, setIncoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recipient, setRecipient] = useState('citizen');
  const [department, setDepartment] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(null);

  const fetchIncoming = useCallback(async () => {
    setLoading(true);
    try {
      const res = await feedbackAPI.getIncoming();
      setIncoming(res.data.feedback || []);
    } catch (err) {
      toast.error('Failed to load feedback');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchIncoming(); }, [fetchIncoming]);

  const fromCitizens = incoming.filter(f => f.authorRole === 'citizen');
  const fromWoreda = incoming.filter(f => f.authorRole === 'woreda');

  const handleReply = (id) => {
    setReplyingTo(id);
    setReplyText('');
  };

  const sendReply = async (id) => {
    const t = replyText.trim();
    if (!t) { toast.error('Please write a reply first'); return; }
    setSendingReply(id);
    try {
      await subcityAPI.addDepartmentFeedback({
        department: 'General',
        text: t,
        recipient: 'citizen',
        replyTo: id,
      });
      toast.success('Reply sent');
      setReplyingTo(null);
      setReplyText('');
      fetchIncoming();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSendingReply(null);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) { toast.error('Please write a message first'); return; }
    setSending(true);
    try {
      await subcityAPI.addDepartmentFeedback({
        department: department || 'General',
        text: text.trim(),
        recipient,
      });
      toast.success('Message sent');
      setText('');
      setDepartment('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <PageHeader title="Feedback" subtitle="Messages received from citizens and woredas, and write a message" />

      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Send size={18} className="text-primary-600 dark:text-primary-400" />
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Write Message</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Send message to</label>
            <select value={recipient} onChange={e => setRecipient(e.target.value)} className="input-field">
              {RECIPIENTS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">
              Department <span className="text-gray-400">(optional)</span>
            </label>
            <select value={department} onChange={e => setDepartment(e.target.value)} className="input-field">
              <option value="">General</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Message</label>
          <textarea
            rows={3}
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your message..."
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
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <FeedbackCard
            title="Received from Citizens"
            icon={Inbox}
            items={fromCitizens}
            emptyText="No feedback received from citizens yet."
            onReply={handleReply}
            replyingTo={replyingTo}
            replyText={replyText}
            onReplyTextChange={setReplyText}
            onSendReply={sendReply}
            sendingReply={sendingReply}
          />
          <FeedbackCard
            title="Received from Woreda"
            icon={Building2}
            items={fromWoreda}
            emptyText="No feedback received from woredas yet."
          />
        </div>
      )}
    </div>
  );
}
