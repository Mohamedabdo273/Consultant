import { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  Send,
  Plus,
  Trash2,
  MessageSquare,
  Bot,
  User,
  ChevronLeft,
  Menu,
  X,
} from 'lucide-react';
import { chatApi } from '../../api/index';
import { useLang } from '../../context/LangContext';
import { Spinner, PageLoader } from '../../components/common/index';

// ── Loading dots animation ────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-gray-600" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ────────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user' || message.isUser === true;

  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-primary-600' : 'bg-gray-200'
        }`}
      >
        {isUser
          ? <User size={13} className="text-white" />
          : <Bot size={13} className="text-gray-600" />
        }
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] sm:max-w-[65%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-primary-600 text-white rounded-2xl rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-2xl rounded-bl-sm'
        }`}
      >
        {message.content ?? message.message ?? message.text ?? ''}
      </div>
    </div>
  );
}

// ── Session Item ──────────────────────────────────────────────────────────────
function SessionItem({ session, isActive, onClick }) {
  const { lang } = useLang();
  const label = session.title ?? session.sessionId ?? (lang === 'ar' ? 'محادثة' : 'Session');
  const date = session.lastMessageAt ?? session.createdAt;

  return (
    <button
      onClick={onClick}
      className={`w-full text-start px-3 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-2 group ${
        isActive
          ? 'bg-primary-50 text-primary-700'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      <MessageSquare size={14} className={isActive ? 'text-primary-500' : 'text-gray-400'} />
      <div className="flex-1 min-w-0">
        <p className="truncate font-medium">{label}</p>
        {date && (
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </p>
        )}
      </div>
    </button>
  );
}

// ── Sessions Sidebar ──────────────────────────────────────────────────────────
function SessionsSidebar({ sessions, activeSessionId, onSelect, onNewSession, isLoading, mobile, onClose }) {
  const { lang } = useLang();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-800">
          {lang === 'ar' ? 'المحادثات' : 'Conversations'}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={onNewSession}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-primary-600 transition-colors"
            title={lang === 'ar' ? 'محادثة جديدة' : 'New conversation'}
          >
            <Plus size={16} />
          </button>
          {mobile && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {isLoading ? (
          <div className="py-8">
            <Spinner size="sm" className="mx-auto" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">
            {lang === 'ar' ? 'لا توجد محادثات' : 'No conversations yet'}
          </div>
        ) : (
          sessions.map((s) => (
            <SessionItem
              key={s.sessionId ?? s.id}
              session={s}
              isActive={activeSessionId === (s.sessionId ?? s.id)}
              onClick={() => onSelect(s.sessionId ?? s.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Chat Area ─────────────────────────────────────────────────────────────────
const PERSONAS = [
  { value: '',                    label: { ar: 'مستشار عام',         en: 'General Advisor'   }, emoji: '🧑‍💼' },
  { value: 'StrategicAdvisor',    label: { ar: 'مستشار استراتيجي',  en: 'Strategic Advisor' }, emoji: '🎯' },
  { value: 'RiskManager',         label: { ar: 'مدير المخاطر',       en: 'Risk Manager'      }, emoji: '🛡️' },
  { value: 'DataAnalyst',         label: { ar: 'محلل البيانات',      en: 'Data Analyst'      }, emoji: '📊' },
  { value: 'BidEngineer',         label: { ar: 'مهندس العطاءات',    en: 'Bid Engineer'      }, emoji: '📐' },
  { value: 'ProcurementSpecialist',label: { ar: 'متخصص المشتريات', en: 'Procurement'       }, emoji: '🛒' },
  { value: 'CRMSpecialist',       label: { ar: 'متخصص العملاء',     en: 'CRM Specialist'    }, emoji: '🤝' },
];

function ChatArea({ sessionId, onClearSession, onOpenSessions }) {
  const { lang } = useLang();
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [persona, setPersona] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['chat-history', sessionId],
    queryFn: () =>
      chatApi.getHistory({ sessionId }).then((r) => r.data?.data ?? r.data),
    enabled: !!sessionId,
    staleTime: 30_000,
  });

  const messages = historyData?.messages ?? historyData?.history ?? historyData?.data ?? historyData ?? [];

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: (data) => chatApi.ask(data),
    onMutate: () => {
      setIsTyping(true);
      scrollToBottom();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-history', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      setIsTyping(false);
      scrollToBottom();
      inputRef.current?.focus();
    },
    onError: (err) => {
      setIsTyping(false);
      toast.error(
        err?.response?.data?.message ||
          (lang === 'ar' ? 'فشل إرسال الرسالة' : 'Failed to send message')
      );
    },
  });

  const { mutate: clearSession, isPending: isClearing } = useMutation({
    mutationFn: () => chatApi.clearHistory(sessionId),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم مسح المحادثة' : 'Conversation cleared');
      queryClient.invalidateQueries({ queryKey: ['chat-history', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
      onClearSession?.();
    },
    onError: () => {
      toast.error(lang === 'ar' ? 'فشل مسح المحادثة' : 'Failed to clear conversation');
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');
    sendMessage({ question: text, sessionId: sessionId || undefined, persona: persona || undefined });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!sessionId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
          <Bot size={28} className="text-primary-600" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          {lang === 'ar' ? 'مرحباً بك في المساعد الذكي' : 'Welcome to AI Assistant'}
        </h3>
        <p className="text-sm text-gray-500 max-w-sm">
          {lang === 'ar'
            ? 'اختر محادثة من القائمة أو ابدأ محادثة جديدة'
            : 'Select a conversation or start a new one'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSessions}
            className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center">
            <Bot size={14} className="text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {lang === 'ar' ? 'المساعد الذكي' : 'AI Assistant'}
            </p>
            <p className="text-xs text-green-500">
              {lang === 'ar' ? 'متصل' : 'Online'}
            </p>
          </div>
        </div>
        {sessionId && (
          <button
            onClick={() => clearSession()}
            disabled={isClearing}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
          >
            {isClearing ? <Spinner size="sm" /> : <Trash2 size={13} />}
            {lang === 'ar' ? 'مسح' : 'Clear'}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        {historyLoading ? (
          <PageLoader />
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-12">
            <MessageSquare size={40} className="text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">
              {lang === 'ar' ? 'ابدأ المحادثة بإرسال رسالة' : 'Start the conversation by sending a message'}
            </p>
          </div>
        ) : (
          <>
            {Array.isArray(messages)
              ? messages.map((msg, i) => <MessageBubble key={msg.id ?? i} message={msg} />)
              : null
            }
            {isTyping && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Persona Selector */}
      <div className="px-4 pt-2 border-t border-gray-100 flex-shrink-0">
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
          {PERSONAS.map(p => (
            <button key={p.value} onClick={() => setPersona(p.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition ${
                persona === p.value
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
              }`}>
              <span>{p.emoji}</span>
              <span>{lang === 'ar' ? p.label.ar : p.label.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-4 pb-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={lang === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
            rows={1}
            className="flex-1 input resize-none text-sm leading-relaxed max-h-32 overflow-y-auto"
            style={{ minHeight: '42px' }}
            disabled={isSending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isSending}
            className="btn-primary px-3 py-2.5 flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? <Spinner size="sm" /> : <Send size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          {lang === 'ar' ? 'Enter للإرسال • Shift+Enter لسطر جديد' : 'Enter to send • Shift+Enter for new line'}
        </p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { lang, isRTL } = useLang();
  const queryClient = useQueryClient();

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => chatApi.getSessions().then((r) => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const sessions = sessionsData?.sessions ?? sessionsData?.data ?? sessionsData ?? [];

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setShowSidebar(false);
  };

  const handleNewSession = () => {
    setActiveSessionId(null);
    setShowSidebar(false);
  };

  const handleClearSession = () => {
    setActiveSessionId(null);
    queryClient.invalidateQueries({ queryKey: ['chat-sessions'] });
  };

  return (
    <div
      className="flex h-[calc(100vh-8rem)] rounded-2xl border border-gray-200 overflow-hidden bg-white shadow-sm"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Sidebar — desktop: always visible, mobile: overlay */}
      <div
        className={`
          flex-shrink-0 w-64 border-e border-gray-100 bg-gray-50
          hidden md:block
        `}
      >
        <SessionsSidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelect={handleSelectSession}
          onNewSession={handleNewSession}
          isLoading={sessionsLoading}
          mobile={false}
        />
      </div>

      {/* Mobile sidebar overlay */}
      {showSidebar && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowSidebar(false)}
          />
          <div className="relative w-72 bg-gray-50 border-e border-gray-200 h-full z-50">
            <SessionsSidebar
              sessions={sessions}
              activeSessionId={activeSessionId}
              onSelect={handleSelectSession}
              onNewSession={handleNewSession}
              isLoading={sessionsLoading}
              mobile={true}
              onClose={() => setShowSidebar(false)}
            />
          </div>
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea
          sessionId={activeSessionId}
          onClearSession={handleClearSession}
          onOpenSessions={() => setShowSidebar(true)}
        />
      </div>
    </div>
  );
}
