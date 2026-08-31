import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bot, UserRound, Send, X, Trash2, MessageSquare } from 'lucide-react';
import { aiAPI } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

const STORAGE_KEY = 'ethiobridge_ai_chat_v1';
const MAX_HISTORY = 8;
const MAX_MESSAGES = 40;

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const loadSession = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_MESSAGES);
  } catch {
    return [];
  }
};

const persistSession = (messages) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch {
    // storage full or unavailable — keep the session in memory only
  }
};

const buildHistory = (messages) =>
  messages
    .filter((m) => typeof m.content === 'string')
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content }));

// Quick actions that are always reachable in the chat (labels are localized by
// the assistant itself, never hardcoded here).
const CORE_ACTION_KEYS = ['report_infra', 'report_complaint', 'alerts', 'fundraising', 'donate', 'track'];

export default function AIChatAssistant() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(loadSession);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [quickActions, setQuickActions] = useState([]);

  const messagesRef = useRef(messages);
  const languageRef = useRef(language);
  const busyRef = useRef(false);
  const greetedRef = useRef(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { languageRef.current = language; }, [language]);

  // Restore the quick-action bar from the last greeting in a restored session.
  useEffect(() => {
    if (quickActions.length > 0) return;
    const greeting = [...messages].reverse().find((m) => m.role === 'assistant' && m.intent === 'greeting');
    if (greeting && Array.isArray(greeting.actions) && greeting.actions.length > 0) {
      setQuickActions(greeting.actions);
    }
  }, [messages, quickActions.length]);

  // Auto-greet the user the first time the panel is opened.
  useEffect(() => {
    if (!open || greetedRef.current || messagesRef.current.length > 0) return;
    greetedRef.current = true;
    sendMessage('hello', { silent: true });
  }, [open]);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, typing, open]);

  const sendMessage = useCallback(async (text, opts = {}) => {
    const trimmed = String(text || '').trim();
    if (!trimmed || busyRef.current) return;
    busyRef.current = true;
    setTyping(true);
    setError('');

    const current = messagesRef.current;
    let next = current;
    if (!opts.silent) {
      const userMsg = { id: uid(), role: 'user', content: trimmed, time: Date.now() };
      next = [...current, userMsg];
      setMessages(next);
      persistSession(next);
    }

    try {
      const res = await aiAPI.chat({
        message: trimmed,
        language: languageRef.current?.code === 'am' ? 'am' : 'en',
        history: buildHistory(next),
      });
      const { reply, intent, actions, suggestions } = res.data || {};
      const botMsg = {
        id: uid(),
        role: 'assistant',
        content: reply || '',
        intent: intent || 'fallback',
        actions: Array.isArray(actions) ? actions : [],
        suggestions: Array.isArray(suggestions) ? suggestions : [],
        time: Date.now(),
      };
      const final = [...next, botMsg];
      setMessages(final);
      persistSession(final);
      if (intent === 'greeting' && botMsg.actions.length > 0) setQuickActions(botMsg.actions);
    } catch (err) {
      console.error('[AIChat] Failed to reach assistant:', err);
      setError(t('chat.errorMessage'));
      const botMsg = { id: uid(), role: 'assistant', content: t('chat.errorMessage'), error: true, time: Date.now() };
      const final = [...next, botMsg];
      setMessages(final);
      persistSession(final);
    } finally {
      setTyping(false);
      busyRef.current = false;
    }
  }, [t]);

  const handleSend = (e) => {
    e?.preventDefault?.();
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleClear = () => {
    setMessages([]);
    setQuickActions([]);
    greetedRef.current = true;
    persistSession([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  };

  const handleAction = (action) => {
    if (action?.route) navigate(action.route);
  };

  const coreQuickActions = quickActions.filter((a) => CORE_ACTION_KEYS.includes(a.key));

  return (
    <>
      {/* Floating launcher button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t('chat.close') : t('chat.open')}
        className="fixed bottom-5 right-5 z-[60] w-14 h-14 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
      >
        {open ? <X className="w-5 h-5" strokeWidth={2} /> : <MessageSquare className="w-6 h-6" strokeWidth={2} />}
        {!open && messages.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed z-[60] flex flex-col bottom-0 sm:bottom-5 sm:right-5 inset-x-0 sm:inset-x-auto sm:w-[380px] h-[82vh] sm:h-[560px] sm:max-h-[calc(100vh-6rem)] bg-white dark:bg-gray-800 border-t sm:border border-gray-200 dark:border-gray-700 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-3 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-5 h-5" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm leading-tight truncate">{t('chat.title')}</p>
              <p className="text-[11px] text-primary-100 truncate">{t('chat.subtitle')}</p>
            </div>
            <button type="button" onClick={handleClear} title={t('chat.clearChat')} aria-label={t('chat.clearChat')}
              className="p-2 rounded-lg hover:bg-white/15 transition-colors">
              <Trash2 className="w-4 h-4" strokeWidth={2} />
            </button>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('chat.close')}
              className="p-2 rounded-lg hover:bg-white/15 transition-colors">
              <X className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>

          {/* Quick action bar */}
          {coreQuickActions.length > 0 && (
            <div className="px-3 pt-3 shrink-0 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-wrap gap-1.5 pb-3">
                {coreQuickActions.map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() => handleAction(a)}
                    className="text-xs font-medium px-3 py-1.5 rounded-full bg-primary-50 hover:bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 dark:text-primary-300 border border-primary-100 dark:border-primary-800 transition-colors"
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.length === 0 && !typing && (
              <div className="text-center py-10 px-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                  <Bot className="w-8 h-8 text-primary-600 dark:text-primary-400" strokeWidth={2} />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{t('chat.welcomeHint')}</p>
              </div>
            )}

            {messages.map((m) => (
              <MessageBubble
                key={m.id || m.time}
                msg={m}
                onAction={handleAction}
                onSuggestion={(s) => sendMessage(s)}
              />
            ))}

            {typing && (
              <div className="flex items-end gap-2">
                <Avatar />
                <div className="bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce [animation-delay:120ms]" />
                    <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-300 animate-bounce [animation-delay:240ms]" />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-center text-xs text-red-500 dark:text-red-400">{error}</p>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
                placeholder={t('chat.placeholder')}
                className="input-field resize-none min-h-[42px] max-h-28 flex-1 text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || typing}
                className="w-[42px] h-[42px] shrink-0 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
                aria-label={t('chat.send')}
              >
                <Send className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 text-center">
              {t('chat.helperText')}
            </p>
          </form>
        </div>
      )}
    </>
  );
}

function Avatar() {
  return (
    <div className="w-8 h-8 shrink-0 rounded-full bg-primary-600 flex items-center justify-center text-white">
      <Bot className="w-4 h-4" strokeWidth={2} />
    </div>
  );
}

function MessageBubble({ msg, onAction, onSuggestion }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && <Avatar />}
      <div className={`max-w-[82%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`whitespace-pre-line text-sm leading-relaxed px-4 py-2.5 rounded-2xl ${
            isUser
              ? 'bg-primary-600 text-white rounded-br-md'
              : msg.error
                ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-100 dark:border-red-800 rounded-bl-md'
                : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-bl-md'
          }`}
        >
          {msg.content}
        </div>

        {!isUser && Array.isArray(msg.actions) && msg.actions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.actions.map((a) => (
              <button
                key={a.key || a.route}
                type="button"
                onClick={() => onAction(a)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white transition-colors"
              >
                {a.label}
              </button>
            ))}
          </div>
        )}

        {!isUser && Array.isArray(msg.suggestions) && msg.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {msg.suggestions.slice(0, 3).map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSuggestion(s)}
                className="text-xs px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-primary-50 hover:text-primary-700 dark:hover:bg-primary-900/30 dark:hover:text-primary-300 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
      {isUser && (
        <div className="w-8 h-8 shrink-0 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-white">
          <UserRound className="w-4 h-4" strokeWidth={2} />
        </div>
      )}
    </div>
  );
}
