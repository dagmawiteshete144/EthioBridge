import { useState, useEffect, useCallback } from 'react';
import PageHeader from '../../../components/common/PageHeader';
import { adminAPI } from '../../../services/api';
import LoadingSpinner from '../../../components/common/LoadingSpinner';
import EmptyState from '../../../components/common/EmptyState';
import Pagination from '../../../components/common/Pagination';
import ConfirmModal from '../../../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import { CircleAlert, BookOpen, Send, Check, TriangleAlert, Inbox } from 'lucide-react';

const STATUS_META = {
  unread: { label: 'Unread', icon: CircleAlert, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  read: { label: 'Read', icon: BookOpen, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  replied: { label: 'Replied', icon: Send, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
};

const EMAIL_META = {
  sent: { label: 'Email sent', icon: Check, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  failed: { label: 'Email failed', icon: TriangleAlert, color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
};

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [delConfirm, setDelConfirm] = useState(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (status) params.status = status;
      if (search) params.search = search;
      const r = await adminAPI.getContactMessages(params);
      setMessages(r.data.messages);
      setPages(r.data.pages);
      setTotal(r.data.total);
      setUnread(r.data.unread);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, status, search]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const openMessage = async (msg) => {
    setSelected(msg);
    if (msg.status === 'unread') {
      try {
        const r = await adminAPI.markContactMessageRead(msg._id);
        setSelected(r.data.message);
        setMessages(prev => prev.map(m => m._id === msg._id ? { ...m, status: 'read' } : m));
        setUnread(u => Math.max(0, u - 1));
      } catch (e) { console.error(e); }
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const r = await adminAPI.replyContactMessage(selected._id, { reply: reply.trim() });
      const data = r.data;
      const updated = data.contactMessage || data.message;
      if (data.emailSent) {
        toast.success('Reply sent successfully');
      } else {
        toast.warn('Reply saved but email failed.');
        if (data.emailError) console.error('Reply email error:', data.emailError);
      }
      setSelected(updated);
      setReply('');
      setMessages(prev => prev.map(m => m._id === updated._id ? updated : m));
      fetchMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally { setSending(false); }
  };

  const handleDelete = async (id) => {
    try {
      await adminAPI.deleteContactMessage(id);
      toast.success('Message deleted');
      setDelConfirm(null);
      if (selected?._id === id) setSelected(null);
      fetchMessages();
    } catch (err) {
      toast.error('Failed to delete message');
      setDelConfirm(null);
    }
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={<>Contact Messages <span className="text-sm font-normal text-gray-400 dark:text-gray-500 ml-1">({total})</span></>}
        subtitle={unread > 0 ? `${unread} unread` : 'All caught up'}
      />

      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search name, email, subject…"
          className="input-field flex-1 min-w-[220px]"
        />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="input-field w-auto">
          <option value="">All statuses</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
      </div>

      {loading ? <LoadingSpinner /> : messages.length === 0 ? <EmptyState icon={<Inbox size={48} strokeWidth={2} />} title="No messages" description="Messages submitted through the public Contact page will appear here." /> : (
        <div className="space-y-3">
          {messages.map(msg => {
            const meta = STATUS_META[msg.status] || STATUS_META.unread;
            const emailMeta = msg.status === 'replied' ? (msg.emailSent ? EMAIL_META.sent : EMAIL_META.failed) : null;
            return (
              <div key={msg._id} className="card p-4 flex items-start justify-between gap-4">
                <button onClick={() => openMessage(msg)} className="flex gap-3 flex-1 min-w-0 text-left">
                  <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center font-bold text-primary-700 dark:text-primary-300 shrink-0">
                    {msg.fullName?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{msg.fullName}</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{msg.email}</span>
                      {msg.phone && <span className="text-xs text-gray-400 dark:text-gray-500">{msg.phone}</span>}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${meta.color}`}><meta.icon size={14} strokeWidth={2} className="inline-block mr-1" />{meta.label}</span>
                      {msg.status === 'replied' && emailMeta && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${emailMeta.color}`}>
                          <emailMeta.icon size={14} strokeWidth={2} className="inline-block mr-1" /> {emailMeta.label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400 mt-1">{msg.subject}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{msg.message}</p>
                    {msg.reply && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1 line-clamp-1">
                        <span className="font-medium">Reply:</span> {msg.reply}
                      </p>
                    )}
                  </div>
                </button>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                    {new Date(msg.createdAt).toLocaleDateString()} {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => openMessage(msg)} className="text-xs bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-300 dark:hover:bg-primary-900/40 px-3 py-1.5 rounded-lg">
                      {msg.status === 'replied' ? 'View' : 'Reply'}
                    </button>
                    <button onClick={() => setDelConfirm({ id: msg._id, name: msg.subject })} className="text-xs bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 px-3 py-1.5 rounded-lg">Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <Pagination page={page} pages={pages} onPageChange={setPage} />

      {/* Reply modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Reply to {selected.fullName}</h3>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{selected.fullName}</span>
                <span className="text-xs text-gray-400">{selected.email}</span>
                {selected.phone && <span className="text-xs text-gray-400">{selected.phone}</span>}
              </div>
              <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{selected.subject}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{selected.message}</p>
              <p className="text-xs text-gray-400">{new Date(selected.createdAt).toLocaleString()}</p>
            </div>

            {selected.status === 'replied' && selected.reply && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-300 uppercase tracking-wider">Sent reply</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${selected.emailSent ? EMAIL_META.sent.color : EMAIL_META.failed.color}`}>
                    {selected.emailSent ? <><Check size={14} strokeWidth={2} className="inline mr-1" />Email delivered</> : <><TriangleAlert size={14} strokeWidth={2} className="inline mr-1" />Email failed</>}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{selected.reply}</p>
                <p className="text-xs text-gray-400 mt-2">
                  Replied by {selected.repliedBy?.fullName || 'admin'} on {selected.repliedAt ? new Date(selected.repliedAt).toLocaleString() : ''}
                  {selected.emailSentAt && (
                    <> · emailed on {new Date(selected.emailSentAt).toLocaleString()}</>
                  )}
                </p>
              </div>
            )}

            <form onSubmit={handleReply} className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reply message</label>
              <textarea
                value={reply}
                onChange={e => setReply(e.target.value)}
                rows={5}
                required
                placeholder="Write the reply that will be emailed to the citizen…"
                className="input-field"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setSelected(null)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={sending} className="btn-primary flex-1">
                  {sending ? 'Sending…' : 'Send reply by email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!delConfirm}
        title="Delete message"
        message={`Delete the message "${delConfirm?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => handleDelete(delConfirm.id)}
        onCancel={() => setDelConfirm(null)}
      />
    </div>
  );
}
