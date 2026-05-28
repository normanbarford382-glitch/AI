import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Send, Loader2, MessageSquare, User, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useLocale } from '../../context/LocaleContext';
import { cn } from '../../lib/utils';
import api from '../../lib/api';

interface Message { id: string; content?: string | null; isFromAdmin: boolean; createdAt: string; }
interface Conversation { id: string; lastMessage?: string; user: { name?: string; email: string }; messages: Message[]; }

export default function AdminMessages() {
  const { locale, isRTL } = useLocale();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-chat'],
    queryFn: () => api.get<{ conversations: Conversation[] }>('/admin/chat'),
    refetchInterval: 10000,
  });

  const conversations = data?.conversations || [];

  useEffect(() => {
    if (selected && conversations.length) {
      const updated = conversations.find(c => c.id === selected.id);
      if (updated) setSelected(updated);
    }
  }, [conversations]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [selected?.messages?.length]);

  const sendMutation = useMutation({
    mutationFn: () => api.post('/chat', { conversationId: selected!.id, content: input.trim() }),
    onMutate: () => {
      const text = input.trim();
      setInput('');
      const temp: Message = { id: `temp-${Date.now()}`, content: text, isFromAdmin: true, createdAt: new Date().toISOString() };
      if (selected) setSelected(s => s ? { ...s, messages: [...s.messages, temp] } : s);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-chat'] }),
    onError: (err: Error) => toast.error(err.message),
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selected || sendMutation.isPending) return;
    sendMutation.mutate();
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black text-foreground">{locale === 'ar' ? 'رسائل الدعم' : 'Support Messages'}</h1>
          <button onClick={() => refetch()} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-accent transition-all text-muted-foreground">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-0 bg-card border border-border rounded-2xl overflow-hidden" style={{ height: 'calc(100vh - 12rem)' }}>
          {/* Sidebar */}
          <div className="w-72 flex-shrink-0 border-e border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <p className="text-xs text-muted-foreground">{conversations.length} {locale === 'ar' ? 'محادثة' : 'conversations'}</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center"><Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" /></div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
                  <MessageSquare className="w-10 h-10 mb-2 opacity-30" />
                  <p className="text-sm">{locale === 'ar' ? 'لا توجد محادثات' : 'No conversations'}</p>
                </div>
              ) : conversations.map(conv => (
                <button key={conv.id} onClick={() => setSelected(conv)}
                  className={cn('w-full text-start p-4 border-b border-border hover:bg-accent/50 transition-colors',
                    selected?.id === conv.id && 'bg-primary/10 border-s-2 border-s-primary')}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {(conv.user.name?.[0] || conv.user.email[0]).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm line-clamp-1">{conv.user.name || conv.user.email}</p>
                      {conv.lastMessage && <p className="text-xs text-muted-foreground line-clamp-1">{conv.lastMessage}</p>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          {selected ? (
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-4 border-b border-border flex items-center gap-3">
                <User className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">{selected.user.name || selected.user.email}</p>
                  <p className="text-xs text-muted-foreground">{selected.user.email}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {selected.messages.map(msg => (
                  <div key={msg.id} className={cn('flex', msg.isFromAdmin ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start'))}>
                    <div className={cn('max-w-[75%] px-4 py-2.5 rounded-2xl text-sm',
                      msg.isFromAdmin ? 'bg-primary text-primary-foreground rounded-se-sm' : 'bg-accent text-foreground rounded-ss-sm')}>
                      {msg.isFromAdmin && <p className="text-xs opacity-70 mb-1">{locale === 'ar' ? 'الأدمن' : 'Admin'}</p>}
                      <p>{msg.content}</p>
                      <p className="text-xs mt-1 opacity-60">{new Date(msg.createdAt).toLocaleTimeString(locale === 'ar' ? 'ar' : 'en', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <div className="border-t border-border p-3">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input value={input} onChange={e => setInput(e.target.value)}
                    placeholder={locale === 'ar' ? 'اكتب ردك...' : 'Type your reply...'}
                    className="flex-1 px-4 py-2.5 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    disabled={sendMutation.isPending} />
                  <button type="submit" disabled={!input.trim() || sendMutation.isPending}
                    className="w-10 h-10 flex items-center justify-center bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50">
                    {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <MessageSquare className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-sm">{locale === 'ar' ? 'اختر محادثة لعرضها' : 'Select a conversation to view'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
