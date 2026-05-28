import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Bot, Sparkles, ChevronDown } from 'lucide-react';
import { useLocale } from '../../context/LocaleContext';
import { cn } from '../../lib/utils';
import { Link } from 'wouter';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

// Parse markdown-style links [text](/path) → JSX
function renderMessageContent(text: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(
        <span key={lastIndex} style={{ whiteSpace: 'pre-wrap' }}>
          {text.slice(lastIndex, match.index)}
        </span>
      );
    }
    const [, label, href] = match;
    const isInternal = href.startsWith('/');
    if (isInternal) {
      parts.push(
        <Link
          key={match.index}
          href={href}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 underline underline-offset-2 transition-colors"
        >
          {label} ↗
        </Link>
      );
    } else {
      parts.push(
        <a
          key={match.index}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-white/20 hover:bg-white/30 underline underline-offset-2 transition-colors"
        >
          {label} ↗
        </a>
      );
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(
      <span key={lastIndex} style={{ whiteSpace: 'pre-wrap' }}>
        {text.slice(lastIndex)}
      </span>
    );
  }

  return parts.length > 0 ? parts : [<span key={0} style={{ whiteSpace: 'pre-wrap' }}>{text}</span>];
}

const QUICK_PROMPTS = [
  'لابتوب للألعاب بأفضل سعر',
  'لابتوب للدراسة خفيف',
  'لابتوب للتصميم والمونتاج',
  'لابتوب للبرمجة',
];

export default function AIChatWidget() {
  const { locale } = useLocale();
  const isRTL = locale === 'ar';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Show greeting on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'مرحبًا! أنا مساعدك الذكي لاختيار اللابتوب المثالي 🤖\n\nأخبرني عن احتياجاتك (الميزانية، الاستخدام، التفضيلات) وسأرشحك أفضل الخيارات المتوفرة في متجرنا.',
      }]);
    }
  }, [open, messages.length]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || streaming) return;

    setInput('');
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
    };

    const assistantId = `ai-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setStreaming(true);

    const history = messages
      .filter(m => !m.streaming && m.id !== 'welcome')
      .map(m => ({ role: m.role, content: m.content }));

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, history }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'خطأ في الاتصال' }));
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: err.error || 'حدث خطأ، حاول مجدداً.', streaming: false }
            : m
        ));
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              accumulated = parsed.error;
              break;
            }
            if (parsed.content) {
              accumulated += parsed.content;
              setMessages(prev => prev.map(m =>
                m.id === assistantId ? { ...m, content: accumulated, streaming: true } : m
              ));
            }
          } catch {}
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: accumulated || 'عذرًا، لم أتمكن من توليد رد.', streaming: false } : m
      ));

      if (!open) setHasUnread(true);
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: 'حدث خطأ في الاتصال، حاول مجدداً.', streaming: false }
          : m
      ));
    } finally {
      setStreaming(false);
      abortRef.current = null;
      inputRef.current?.focus();
    }
  }, [messages, streaming, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClose = () => {
    abortRef.current?.abort();
    setOpen(false);
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setStreaming(false);
  };

  return (
    <>
      {/* Floating Button */}
      <div className={cn(
        'fixed bottom-6 z-[9998]',
        isRTL ? 'left-5' : 'right-5'
      )}>
        <AnimatePresence>
          {!open && (
            <motion.button
              key="fab"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => setOpen(true)}
              className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="فتح المساعد الذكي"
            >
              <Bot className="w-7 h-7" />
              {hasUnread && (
                <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white" />
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={cn(
              'fixed bottom-4 z-[9999] flex flex-col',
              'w-[calc(100vw-2rem)] max-w-[400px]',
              'sm:w-[390px]',
              isRTL ? 'left-4' : 'right-4',
              'rounded-2xl overflow-hidden shadow-2xl',
              'border border-border bg-card',
            )}
            style={{ maxHeight: 'calc(100dvh - 6rem)', height: '580px' }}
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-l from-blue-600 to-violet-600 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">مساعد اللابتوب الذكي</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-white/70 text-xs">متصل · Groq AI</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {messages.length > 1 && (
                  <button
                    onClick={clearChat}
                    className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors text-xs"
                    title="مسح المحادثة"
                  >
                    مسح
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="إغلاق"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('flex', msg.role === 'user' ? 'justify-start' : 'justify-end')}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-violet-500 flex items-center justify-center flex-shrink-0 mt-1 ml-2">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={cn(
                      'max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-secondary text-foreground rounded-tl-sm',
                    )}
                  >
                    <div className="text-sm leading-relaxed">
                      {renderMessageContent(msg.content)}
                      {msg.streaming && (
                        <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse rounded-sm align-middle" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Quick prompts - shown when only welcome message */}
              {messages.length === 1 && messages[0].id === 'welcome' && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex flex-wrap gap-2 justify-end pt-1"
                >
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={streaming}
                      className="text-xs px-3 py-1.5 rounded-xl border border-border bg-background hover:bg-accent transition-colors text-foreground disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 border-t border-border bg-background px-3 py-3">
              <form onSubmit={handleSubmit} className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="اسألني عن أي لابتوب..."
                  disabled={streaming}
                  className="flex-1 bg-secondary rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || streaming}
                  className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
                  aria-label="إرسال"
                >
                  {streaming
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Send className="w-4 h-4 scale-x-[-1]" />
                  }
                </button>
              </form>
              <p className="text-center text-muted-foreground text-[10px] mt-2">
                مدعوم بـ Groq · llama-3.3-70b · يعمل على منتجات المتجر فقط
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
