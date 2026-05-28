import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, MessageCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDate } from '../../lib/utils';
import { cn } from '../../lib/utils';
import { useSiteSettings } from '../../context/SiteSettingsContext';

interface Message {
  id: string;
  content?: string | null;
  imageUrl?: string | null;
  isFromAdmin: boolean;
  createdAt: string;
}

interface Conversation {
  id: string;
  messages: Message[];
}

export default function ChatWindow({ locale }: { locale: string }) {
  const { siteName } = useSiteSettings();
  const isRTL = locale === 'ar';
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getAuthHeader = (): Record<string, string> => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  };

  const loadConversation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/chat', {
        headers: { ...getAuthHeader() },
      });
      if (!res.ok) {
        if (res.status === 401) {
          setError(isRTL ? 'يجب تسجيل الدخول أولاً' : 'Please log in first');
        } else {
          throw new Error('Server error');
        }
        return;
      }
      const data = await res.json();
      setConversation(data.conversation || null);
    } catch {
      setError(isRTL ? 'تعذر تحميل المحادثة، حاول مجدداً' : 'Failed to load conversation, please retry');
    } finally {
      setLoading(false);
    }
  }, [isRTL]);

  useEffect(() => { loadConversation(); }, [loadConversation]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation?.messages]);

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || !conversation || sending) return;
    setMessage('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      content: text,
      isFromAdmin: false,
      createdAt: new Date().toISOString(),
    };
    setConversation((prev) => prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ conversationId: conversation.id, content: text }),
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        throw new Error(errorText || 'Failed to send');
      }

      const data = await res.json();
      const saved = data.message ?? data.savedMessage ?? data.newMessage;

      if (!saved) {
        throw new Error('Server did not return the saved message');
      }

      setConversation((prev) => prev ? {
        ...prev,
        messages: prev.messages.map((m) => m.id === tempId ? saved : m),
      } : prev);
    } catch {
      setConversation((prev) => prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) } : prev);
      setMessage(text);
      toast_error(isRTL ? 'فشل إرسال الرسالة، حاول مجدداً' : 'Failed to send, please retry');
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl h-[500px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">{isRTL ? 'جاري تحميل المحادثة...' : 'Loading conversation...'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl h-[500px] flex items-center justify-center">
        <div className="text-center px-6">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-foreground font-semibold mb-2">{error}</p>
          <button onClick={loadConversation} className="flex items-center gap-2 mx-auto px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors">
            <RefreshCw className="w-4 h-4" />
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-3 p-5 border-b border-border bg-gradient-to-r from-primary to-blue-400">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm">
            {siteName
              ? (isRTL ? `دعم ${siteName}` : `${siteName} Support`)
              : (isRTL ? 'دعم العملاء' : 'Customer Support')}
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <p className="text-white/70 text-xs">{isRTL ? 'متصل' : 'Online'}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!conversation?.messages.length && (
          <div className="text-center text-muted-foreground text-sm py-12">
            <MessageCircle className="w-14 h-14 mx-auto mb-4 opacity-20" />
            <p className="font-medium">{isRTL ? 'مرحباً! كيف يمكننا مساعدتك؟' : 'Hello! How can we help you?'}</p>
            <p className="text-xs mt-1">{isRTL ? 'اكتب رسالتك وسيرد فريقنا في أقرب وقت' : 'Type your message and our team will reply soon'}</p>
          </div>
        )}
        {conversation?.messages.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.2) }}
            className={cn('flex', msg.isFromAdmin ? 'justify-start' : 'justify-end')}
          >
            <div className={cn(
              'max-w-[78%] rounded-2xl px-4 py-3 space-y-1',
              msg.isFromAdmin
                ? 'bg-secondary text-foreground rounded-ss-none'
                : 'bg-primary text-primary-foreground rounded-se-none',
              msg.id.startsWith('temp-') && 'opacity-60'
            )}>
              {msg.content && <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
              <p className={cn('text-xs', msg.isFromAdmin ? 'text-muted-foreground' : 'text-primary-foreground/60')}>
                {formatDate(msg.createdAt, locale)}
                {msg.id.startsWith('temp-') && ` · ${isRTL ? 'جاري الإرسال...' : 'Sending...'}`}
              </p>
            </div>
          </motion.div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-background">
        <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isRTL ? 'اكتب رسالتك...' : 'Type your message...'}
            className="flex-1 bg-secondary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!message.trim() || sending}
            className="w-11 h-11 bg-primary text-primary-foreground rounded-xl flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className={cn('w-4 h-4', isRTL && 'scale-x-[-1]')} />}
          </button>
        </form>
      </div>
    </div>
  );
}

function toast_error(msg: string) {
  if (typeof window !== 'undefined') {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#ef4444;color:white;padding:12px 20px;border-radius:12px;z-index:9999;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.2)';
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
  }
}
