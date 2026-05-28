import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, Clock, ChevronRight,
  Upload, CheckCircle2, Loader2, ImageIcon,
} from 'lucide-react';
import { Link } from 'wouter';
import toast from 'react-hot-toast';
import { useLocale } from '../context/LocaleContext';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import StorePageShell from '../components/shared/StorePageShell';
import { formatPrice, formatDate, cn } from '../lib/utils';
import { WALLET_QUERY_KEY } from '../lib/siteSettings';
import api from '../lib/api';

type PaymentMethod = {
  id: string;
  nameAr: string;
  nameEn: string;
  description?: string | null;
  accountInfo?: string | null;
  logo?: string | null;
};

export default function WalletPage() {
  const { locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const { walletEnabled: walletEnabledFromSettings, isLoading: settingsLoading } = useSiteSettings();
  const qc = useQueryClient();
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: WALLET_QUERY_KEY,
    queryFn: () => api.get<any>('/wallet'),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const walletEnabled = walletEnabledFromSettings;

  const { data: methodsData } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: () => api.get<{ paymentMethods: PaymentMethod[] }>('/payment-methods'),
    enabled: isAuthenticated && walletEnabled,
  });

  const topupMutation = useMutation({
    mutationFn: () => api.post('/wallet/topup', {
      paymentMethodId: selectedMethodId,
      amount: Number(amount),
      transactionRef: transactionRef.trim() || undefined,
      proofUrl: proofUrl || undefined,
      lang: locale,
    }),
    onSuccess: () => {
      toast.success(locale === 'ar' ? 'تم إرسال طلب الشحن بنجاح' : 'Recharge request submitted');
      setAmount('');
      setTransactionRef('');
      setProofUrl('');
      setShowConfirm(false);
      setSelectedMethodId(null);
      qc.invalidateQueries({ queryKey: WALLET_QUERY_KEY });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleProofUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(locale === 'ar' ? 'يرجى رفع صورة فقط' : 'Please upload an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(locale === 'ar' ? 'حجم الصورة كبير جداً (5MB كحد أقصى)' : 'Image too large (max 5MB)');
      return;
    }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const base64 = e.target?.result as string;
        const res = await api.post<{ url?: string }>('/upload', { base64, folder: 'laptopstore/wallet-proofs' });
        if (!res.url) throw new Error('Upload failed');
        setProofUrl(res.url);
        toast.success(locale === 'ar' ? 'تم رفع الصورة' : 'Screenshot uploaded');
      } catch (err: any) {
        toast.error(err.message || (locale === 'ar' ? 'فشل رفع الصورة' : 'Upload failed'));
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isAuthenticated) {
    return (
      <StorePageShell mainClassName="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Wallet className="w-16 h-16 text-muted-foreground/30" />
        <p className="text-muted-foreground">{locale === 'ar' ? 'سجّل الدخول لعرض محفظتك' : 'Sign in to view your wallet'}</p>
        <Link href="/auth/login" className="btn-primary-lg">
          {locale === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
        </Link>
      </StorePageShell>
    );
  }

  const balance = data?.wallet?.balance ?? 0;
  const transactions = data?.transactions ?? [];
  const topupRequests = data?.topupRequests ?? [];
  const methods = methodsData?.paymentMethods ?? [];
  const selectedMethod = methods.find(m => m.id === selectedMethodId);

  const statusLabels: Record<string, { ar: string; en: string; className: string }> = {
    PENDING: { ar: 'قيد المراجعة', en: 'Pending', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    APPROVED: { ar: 'مقبول', en: 'Approved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
    REJECTED: { ar: 'مرفوض', en: 'Rejected', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  };

  return (
    <StorePageShell mainClassName="pb-16">
        <h1 className="page-header mb-8 flex items-center gap-3">
          <Wallet className="w-7 h-7 text-primary" />
          {locale === 'ar' ? 'المحفظة' : 'Wallet'}
        </h1>

        {isError && (
          <div className="card-premium p-4 mb-6 border-destructive/30 bg-destructive/5 text-destructive text-sm">
            <p className="font-medium">{locale === 'ar' ? 'تعذّر تحميل بيانات المحفظة' : 'Could not load wallet data'}</p>
            <p className="text-xs mt-1 opacity-80">{(error as Error)?.message}</p>
            <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold underline">
              {locale === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        )}

        {!settingsLoading && !walletEnabled && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 mb-6 text-amber-700 dark:text-amber-400 text-sm font-medium">
            {locale === 'ar' ? 'المحفظة معطّلة حالياً من قبل الإدارة' : 'Wallet is currently disabled by admin'}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-gradient rounded-2xl p-6 text-white shadow-xl shadow-primary/25 space-y-2"
          >
            <p className="text-white/80 text-sm">{locale === 'ar' ? 'الرصيد الحالي' : 'Current Balance'}</p>
            <p className="text-4xl font-black tracking-tight">{formatPrice(balance)}</p>
            {walletEnabled && (
              <p className="text-white/70 text-xs">{locale === 'ar' ? 'متاح للشراء عند الدفع' : 'Available for checkout payments'}</p>
            )}
          </motion.div>

          {walletEnabled && (
            <div className="lg:col-span-2 card-premium p-6 space-y-4">
              <h2 className="font-bold text-lg">{locale === 'ar' ? 'شحن المحفظة' : 'Recharge Wallet'}</h2>

              {!selectedMethodId ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {methods.length === 0 ? (
                    <p className="text-sm text-muted-foreground col-span-2">
                      {locale === 'ar' ? 'لا توجد طرق شحن متاحة حالياً' : 'No recharge methods available'}
                    </p>
                  ) : methods.map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setSelectedMethodId(method.id)}
                      className="flex items-center gap-3 p-4 border border-border rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all text-start"
                    >
                      {method.logo ? (
                        <img src={method.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-muted" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Wallet className="w-5 h-5 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{locale === 'ar' ? method.nameAr : method.nameEn}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                    <button type="button" onClick={() => { setSelectedMethodId(null); setShowConfirm(false); }}
                      className="text-sm text-primary hover:underline">
                      {locale === 'ar' ? '← تغيير الطريقة' : '← Change method'}
                    </button>

                    <div className="bg-muted/50 rounded-xl p-4 space-y-2 text-sm">
                      <p className="font-semibold">{locale === 'ar' ? selectedMethod?.nameAr : selectedMethod?.nameEn}</p>
                      {selectedMethod?.description && (
                        <p className="text-muted-foreground whitespace-pre-wrap">{selectedMethod.description}</p>
                      )}
                      {selectedMethod?.accountInfo && (
                        <div className="mt-2 p-3 bg-card border border-border rounded-lg">
                          <p className="text-xs text-muted-foreground mb-1">{locale === 'ar' ? 'وجهة التحويل' : 'Transfer destination'}</p>
                          <p className="font-mono font-semibold text-foreground break-all">{selectedMethod.accountInfo}</p>
                        </div>
                      )}
                    </div>

                    {!showConfirm ? (
                      <p className="text-sm text-muted-foreground">
                        {locale === 'ar'
                          ? 'بعد إتمام التحويل الخارجي، اضغط تأكيد الشحن وأرفق إثبات الدفع.'
                          : 'After completing the external transfer, confirm recharge and attach proof.'}
                      </p>
                    ) : (
                      <div className="space-y-4 border-t border-border pt-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">{locale === 'ar' ? 'المبلغ (ل.س) *' : 'Amount (SYP) *'}</label>
                          <input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)}
                            className="input-premium" placeholder="50000" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">{locale === 'ar' ? 'رقم العملية' : 'Transaction reference'}</label>
                          <input value={transactionRef} onChange={e => setTransactionRef(e.target.value)}
                            className="input-premium" placeholder={locale === 'ar' ? 'اختياري إذا رفعت صورة' : 'Optional if screenshot uploaded'} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium">{locale === 'ar' ? 'صورة التحويل' : 'Transfer screenshot'}</label>
                          <div className="flex flex-wrap items-center gap-3">
                            <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm cursor-pointer hover:bg-accent transition-all">
                              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                              {locale === 'ar' ? 'رفع صورة' : 'Upload image'}
                              <input type="file" accept="image/*" className="hidden" disabled={uploading}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleProofUpload(f); }} />
                            </label>
                            {proofUrl && (
                              <a href={proofUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                                <ImageIcon className="w-3.5 h-3.5" />
                                {locale === 'ar' ? 'عرض الصورة' : 'View image'}
                              </a>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={topupMutation.isPending || !amount || (!transactionRef.trim() && !proofUrl)}
                          onClick={() => topupMutation.mutate()}
                          className="btn-primary-lg w-full"
                        >
                          {topupMutation.isPending ? (
                            <><Loader2 className="w-5 h-5 animate-spin" />{locale === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}</>
                          ) : (
                            <><CheckCircle2 className="w-5 h-5" />{locale === 'ar' ? 'تأكيد الشحن' : 'Confirm Recharge'}</>
                          )}
                        </button>
                      </div>
                    )}

                    {!showConfirm && (
                      <button type="button" onClick={() => setShowConfirm(true)} className="btn-primary-lg w-full">
                        {locale === 'ar' ? 'تأكيد الشحن' : 'Confirm Recharge'}
                      </button>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          )}
        </div>

        {topupRequests.length > 0 && (
          <div className="card-premium overflow-hidden mb-8">
            <div className="p-5 border-b border-border">
              <h2 className="font-bold">{locale === 'ar' ? 'طلبات الشحن' : 'Recharge Requests'}</h2>
            </div>
            <div className="divide-y divide-border">
              {topupRequests.map((row: any) => {
                const req = row.wallet_topup_requests;
                const st = statusLabels[req?.status] || statusLabels.PENDING;
                return (
                  <div key={req?.id} className="flex items-center justify-between p-4 gap-4 flex-wrap">
                    <div>
                      <p className="font-semibold text-sm">{locale === 'ar' ? row.payment_methods?.nameAr : row.payment_methods?.nameEn}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(req?.createdAt, locale)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-primary">{formatPrice(req?.amount)}</span>
                      <span className={cn('text-xs font-semibold px-2.5 py-1 rounded-full', st.className)}>
                        {locale === 'ar' ? st.ar : st.en}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="card-premium overflow-hidden">
          <div className="p-5 border-b border-border">
            <h2 className="font-bold">{locale === 'ar' ? 'سجل المعاملات' : 'Transaction History'}</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" /></div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              {locale === 'ar' ? 'لا توجد معاملات بعد' : 'No transactions yet'}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {transactions.map((tx: { id: string; amount: number; description?: string | null; createdAt: string }) => {
                const amt = tx.amount ?? 0;
                const isPositive = amt > 0;
                return (
                  <div key={tx.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', isPositive ? 'bg-green-100 dark:bg-green-900/20' : 'bg-red-100 dark:bg-red-900/20')}>
                        {isPositive ? <TrendingUp className="w-4 h-4 text-green-600" /> : <TrendingDown className="w-4 h-4 text-red-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{tx.description || (isPositive ? (locale === 'ar' ? 'شحن' : 'Top-up') : (locale === 'ar' ? 'شراء' : 'Purchase'))}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt, locale)}</p>
                      </div>
                    </div>
                    <span className={cn('font-bold', isPositive ? 'text-green-600' : 'text-red-600')}>
                      {isPositive ? '+' : ''}{formatPrice(amt)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </StorePageShell>
  );
}
