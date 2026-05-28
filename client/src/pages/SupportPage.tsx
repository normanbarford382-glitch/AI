import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, MessageCircle, HeadphonesIcon, RefreshCw } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { Link, useLocation } from 'wouter';
import api from '../lib/api';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  content?: string | null;
  isFromAdmin: boolean;
  createdAt: string;
}

interface ConversationData {
  conversation: { id: string; messages: Message[] };
}

export default function SupportPage() {
  const { locale, isRTL } = useLocale();
  const { isAuthenticated } = useAuth();
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error, refetch } = useQuery<ConversationData>({
    queryKey: ['chat'],
    queryFn: () => api.get<ConversationData>('/chat'),
    enabled: isAuthenticated,
    refetchInterval: 8000,
  });

  const messages = data?.conversation?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post('/chat', { content }),
    onMutate: async (content) => {
      const temp: Message = { id: `temp-${Date.now()}`, content, isFromAdmin: false, createdAt: new Date().toISOString() };
      qc.setQueryData<ConversationData>(['chat'], old => old
        ? { conversation: { ...old.conversation, messages: [...old.conversation.messages, temp] } }
        : old
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat'] }),
    onError: () => qc.invalidateQueries({ queryKey: ['chat'] }),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sendMutation.isPending) return;
    setInput('');
    sendMutation.mutate(text);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <HeadphonesIcon className="w-16 h-16 text-primary/40" />
          <h2 className="text-xl font-bold">{locale === 'ar' ? 'يجب تسجيل الدخول أولاً' : 'Please sign in first'}</h2>
          <Link href="/auth/login" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-all">
            {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-black text-foreground flex items-center gap-3">
                <HeadphonesIcon className="w-7 h-7 text-primary" />
                {locale === 'ar' ? 'الدعم الفني' : 'Technical Support'}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {locale === 'ar' ? 'نحن هنا لمساعدتك على مدار الساعة' : 'We are here to help you 24/7'}
              </p>
            </div>
            <button onClick={() => refetch()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-all text-muted-foreground">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col" style={{ height: '60vh' }}>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3 text-center">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">
                    {locale === 'ar' ? 'ابدأ محادثتك مع فريق الدعم' : 'Start your conversation with our support team'}
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {messages.map(msg => (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className={cn('flex', msg.isFromAdmin ? (isRTL ? 'justify-end' : 'justify-start') : (isRTL ? 'justify-start' : 'justify-end'))}>
                      <div className={cn(
                        'max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                        msg.isFromAdmin
                          ? 'bg-accent text-foreground rounded-ss-sm'
                          : 'bg-primary text-primary-foreground rounded-se-sm'
                      )}>
                        {msg.isFromAdmin && (
                          <p className="text-xs font-semibold mb-1 opacity-70">{locale === 'ar' ? 'فريق الدعم' : 'Support Team'}</p>
                        )}
                        <p className="leading-relaxed">{msg.content}</p>
                        <p className="text-xs mt-1 opacity-60">
                          {new Date(msg.createdAt).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={locale === 'ar' ? 'اكتب رسالتك...' : 'Type your message...'}
                  className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={sendMutation.isPending}
                />
                <button type="submit" disabled={!input.trim() || sendMutation.isPending}
                  className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 flex-shrink-0">
                  {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
